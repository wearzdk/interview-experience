---
title: "上海银行应用开发一面（线下）：Nacos、微服务通信与线程池参数"
company: 上海银行
position: 应用开发
round: 一面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/939226518264221696
tags: ["Java","微服务","Nacos","Spring","线程池","Linux"]
summary: "上海银行应用开发 10.12 线下面经：先问语言与技术栈（Java、Spring/Spring Cloud 的 Nacos、Sentinel、Seata），再问 Nacos 相比其他注册中心的优点、微服务之间如何通信及地址获取方式（Nacos 推送还是服务请求）、Spring 事务原理与 MySQL 事务特性、线程池核心参数与核心线程数如何确定、四种拒绝策略，最后是运维老师追问的 Linux 命令（查看 CPU 使用率、在 300-500 行里查某个单词）。"
---

### 《面试题目》

1. 自我介绍
2. 你使用什么语言？用过 Spring 和 Spring Cloud 吗？
3. Nacos 相比于其他注册中心有什么优点？
4. 微服务之间怎么传递消息？追问：地址是怎么获取的，是 Nacos 主动推送还是别的微服务请求？
5. Spring 事务的原理是什么？MySQL 事务的特性（ACID）是什么？
6. 线程池的核心参数有哪些？追问：核心线程数怎么确定？
7. 线程池的丢弃策略有哪几种？
8. Linux 相关命令：如何查看 CPU 使用率？如何查询文件第 300-500 行里的某个单词？

### 《参考解析》

**Nacos 的优势要落到「注册中心 + 配置中心二合一 + 生态适配」上。** 相比 Eureka：Nacos 同时提供服务发现与配置管理（Eureka 只有注册发现，配置要另配 Spring Cloud Config）；支持 AP 与 CP 两种一致性模式可切换（Eureka 纯 AP，ZooKeeper/Consul 偏 CP），临时实例用自研的 Distro 协议做 AP 保证可用性，持久化实例走 Raft 保证一致性；健康检查更细（心跳、TCP/HTTP/MySQL 探测，还有保护阈值防止大规模摘除导致雪崩）；支持权重、元数据、命名空间与分组做多环境隔离，控制台体验也更完整。相比 Consul/ZooKeeper，Nacos 与 Spring Cloud Alibaba 的集成更顺、中文文档与社区更活跃，并且 ZK 的 ZAB 在 leader 选举期间会不可用，对注册中心这种高频读场景不友好。

**微服务怎么找到彼此，标准链路是「服务注册 → 拉取/订阅实例列表 → 本地负载均衡发起调用」。** 服务启动时把 `ip:port` 与元数据注册到 Nacos，消费者通过 OpenFeign（底层 Ribbon/LoadBalancer）调用服务名；地址信息的获取有两种模式：**客户端定时拉取（pull）为主 + 服务端推送（push）为辅**——Nacos 客户端会定时（默认几秒）拉取变更的服务列表并缓存在本地，同时注册 UDP 推送通道，服务端在实例变更时通知客户端，客户端收到通知后再主动拉取一次最新列表（UDP 消息可能丢失，所以要有拉取兜底）。所以追问的答案是「不是纯粹的 Nacos 主动推送，而是推送通知 + 客户端拉取结合」。调用时还要注意：本地缓存让服务端短暂不可用也不影响已有调用（可用性优先），但要接受一定的更新延迟；健康检查摘除有保护阈值，避免瞬时摘掉过多实例。

**Spring 事务的原理是「AOP 代理 + 事务管理器 + ThreadLocal 绑定连接」。** `@Transactional` 通过代理在方法前后做 `begin/commit/rollback`，事务信息由 `PlatformTransactionManager`（JDBC 场景是 `DataSourceTransactionManager`）管理，当前事务的连接通过 `TransactionSynchronizationManager` 绑定到 ThreadLocal，所以**同一个线程内**多次数据库操作能复用同一连接与事务；传播行为（REQUIRED、REQUIRES_NEW、NESTED 等）决定遇到已有事务时是加入还是新建。失效场景要能列举：自调用绕过代理、非 public 方法、异常被 catch、抛受检异常未配 `rollbackFor`、多线程内不传播、以及数据库引擎不支持事务（MyISAM）。MySQL 的 ACID：原子性靠 undo log 回滚，一致性由业务约束与应用逻辑保证，隔离性靠锁 + MVCC，持久性靠 redo log（WAL，先写日志再刷数据页）。

**线程池核心参数与线程数定量是两个层次的问题。** 参数七个：corePoolSize、maximumPoolSize、keepAliveTime、unit、workQueue、threadFactory、handler，执行顺序是「核心线程 → 队列 → 扩到最大 → 拒绝」。**核心线程数怎么定**，要先区分任务类型：CPU 密集型让线程数接近核数（多了只会增加切换开销，常见是 `核数 + 1` 兜住偶发缺页）；IO 密集型用 `核数 × (1 + 平均等待时间 / 平均计算时间)` 估算（等待占比越高、线程越多），也可以用压测逐步逼近——从核数开始加压，观察 QPS 与 P99 的拐点，超过拐点再加线程只会让延迟恶化。真正要强调的判据是「**队列和下游容量决定上限**」：线程再多，数据库连接池、下游接口 QPS 或内存都是硬约束，必须做容量对齐（线程数 ≤ 下游可承受并发）。**四种拒绝策略**：AbortPolicy（默认，抛 RejectedExecutionException）、CallerRunsPolicy（由提交线程执行，能形成背压但会阻塞提交方）、DiscardPolicy（静默丢弃）、DiscardOldestPolicy（丢掉队列最老的任务再提交）；生产上通常自定义策略——记录日志与指标、返回友好降级结果，而不是抛异常或静默丢。追问「CallerRunsPolicy 有什么问题」时要答：如果提交方是 Web 容器或 Netty 的 IO 线程，会被任务拖住，导致响应变慢甚至事件循环卡死。

**Linux 命令两问。** 查看 CPU 使用率：`top`（按 `1` 看每核、`P` 按 CPU 排序）、`htop`、`mpstat -P ALL 1`（每核使用率）、`vmstat 1`（看运行队列 r 与上下文切换 cs）；定位到进程后用 `top -H -p <pid>` 找热点线程，再 `jstack`/`gdb` 看栈。查文件的第 300-500 行并搜索单词：最直接的是 `sed -n '300,500p' file | grep 'keyword'`，也可以用 `awk 'NR>=300 && NR<=500 && /keyword/' file`（一次扫描、更适合大文件），要看行号加 `grep -n`，大文件别用 `head -500 | tail -200` 这种虽然也行但语义不清的写法。同类问题还可以顺手准备：`sed -n '300,500p'` 是取行范围的标准答案，`awk` 更适合带条件与统计的场景。

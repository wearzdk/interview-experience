---
title: "Java 一面：线程池、MySQL 日志与网络链路"
company: "某公司"
position: "Java 后端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/4ed673e17db94f17b41622b29fe35701
tags: ["Java","线程池","ConcurrentHashMap","MySQL","联合索引","Coding Agent","网络链路"]
summary: "一份 Java 后端一面题目清单：语言基础（final、ArrayList 与 LinkedList、线程安全集合、线程池与拒绝策略）、MySQL（联合索引、三类日志）、Coding Agent 的项目难点与工程化、实习项目结构，最后一题要求讲清从前端点击到服务端返回的完整链路。"
---

### 《面试题目》

1. final 和 finally 的区别？final 可以修饰什么？
2. ArrayList 和 LinkedList 的区别？什么时候用哪个？连续插入 1000 条数据时选哪个？
3. 你用过哪些线程安全的集合类？ConcurrentHashMap 的具体使用场景是什么？
4. 线程池的核心参数有哪些？你使用线程池时选择哪种拒绝策略，为什么？
5. MySQL 的联合索引是怎么回事？
6. MySQL 常见的三种典型日志文件是什么？
7. 你的 Coding Agent 项目难点是什么？
8. 在 Coding Agent 里做了哪些工程化？
9. 实习的项目结构是什么样的？
10. 从前端点击按钮到服务器处理并返回，完整的网络链路涉及哪些设备与中间件？

### 《参考解析》

**final 与 finally 是两个维度上的东西。** `final` 是修饰符，`finally` 是异常处理的代码块关键字：`finally` 配合 `try` 使用，无论是否抛异常、是否有 `return` 都会执行（除非 JVM 退出或 `System.exit`），常用于释放资源，注意在 `finally` 里 `return` 会吞掉异常和返回值，是明确的坏味道。`final` 可以修饰类（不可被继承，如 `String`）、方法（不可被重写，早期还能借它做内联优化）、变量（基本类型值不可变，引用类型引用不可变但对象内容可变，这是最常被追问的一点）、以及方法参数与局部变量。要能补一句 `finally` 与 `try-with-resources` 的关系：后者更安全，会自动调用 `close` 并按逆序释放，能正确处理 `close` 自身抛异常的情况。

**ArrayList 与 LinkedList：连续插入 1000 条要分情况答。** 结构上前者是动态数组（随机访问 O(1)，中间插入删除要搬移元素 O(n)），后者是双向链表（随机访问 O(n)，已知节点位置的插入删除 O(1)，但每个节点多两个指针、内存局部性差、缓存不友好）。「连续插入 1000 条」这个问法有坑：如果是在**尾部追加**，ArrayList 均摊 O(1) 且扩容有 1.5 倍增长，实测远快于 LinkedList（后者每次都要 `new Node`，GC 压力大）；如果是在**头部或中间插入**，LinkedList 的移动成本更低，但要先付出定位代价，只有在用 `ListIterator` 顺序遍历插入时才真正占优。所以更稳的答法是：默认用 ArrayList，只有明确「频繁在已知位置增删、且很少随机访问」时才考虑 LinkedList，而实际工程里前者几乎总是赢——这也是 JDK 官方文档里写明的建议。

**ConcurrentHashMap 的使用场景要落到「共享可变状态」。** 它解决的是多线程同时对同一个 Map 做读写：典型场景是本地缓存（配置缓存、字典表、去重集合）、计数与分组统计（配合 `merge`、`computeIfAbsent` 做原子更新）、以及状态机里的按 key 加锁。回答时要点出它的语义：单次操作原子，但**复合操作不原子**——先 `get` 再 `put` 的「check-then-act」必须用 `computeIfAbsent`、`putIfAbsent` 或 `merge`；同样，用 `size()` 做业务判断是不可靠的。线程安全的集合还有 `CopyOnWriteArrayList`（读多写极少，写时全量复制）、`ConcurrentLinkedQueue`（无锁队列）、`BlockingQueue` 家族（生产者消费者，`ArrayBlockingQueue` 有界、`LinkedBlockingQueue` 默认近似无界要小心 OOM）、`ConcurrentSkipListMap`（有序并发 Map）。选择依据一句话：读多写少用写时复制，读写都多用分段或 CAS 结构，需要阻塞语义用 BlockingQueue。

**线程池七参数与拒绝策略。** 七个参数是 corePoolSize、maximumPoolSize、keepAliveTime、unit、workQueue、threadFactory、handler，执行顺序是「核心线程 → 队列 → 非核心线程 → 拒绝」。拒绝策略四种：`AbortPolicy`（默认，抛 `RejectedExecutionException`）、`CallerRunsPolicy`（提交线程自己执行，形成天然背压）、`DiscardPolicy`（静默丢弃）、`DiscardOldestPolicy`（丢最老的再提交）。选哪种取决于「丢了会怎样」：核心链路的下单、支付这类不能丢的任务，配合有界队列用 `CallerRunsPolicy`，让上游变慢而不是直接失败；日志、埋点这类允许丢的用 Discard；需要可观测的用 Abort 并接告警与重试；`DiscardOldestPolicy` 几乎只在特定场景用，因为它会丢历史任务。追问点几乎必考：为什么不用 `Executors` 的快捷方法（`newFixedThreadPool`/`newCachedThreadPool` 用无界或近似无界队列，会把 OOM 风险藏起来，规范建议手动 `new ThreadPoolExecutor`），以及队列容量与最大线程数的关系——用了无界队列，`maximumPoolSize` 就永远不会生效。

**MySQL 联合索引的关键是「最左前缀 + 覆盖 + 顺序」。** 联合索引 `(a,b,c)` 在 B+ 树里按 a、b、c 依次排序，所以能命中它的条件是查询里包含最左前缀的等值条件；`a` 用了范围（`>`、`between`、`like 'x%'`）之后，后面的列只能在索引里做过滤而不能用于定位（ICP 可以在索引层过滤回表前就排除，但仍不是精确定位）。设计顺序的经验：等值条件在前、区分度高的在前、范围条件放最后、把排序与分组能顺带用上的列排进索引（这样能避免 `Using filesort`）。写查询时要注意失效场景：列上做函数或运算、隐式类型转换（字符串列传数字、字符集或排序规则不一致的 join）、前导 `%` 的模糊匹配。代价也要说：每个二级索引都要在写入时维护，索引越多写越慢、占空间越大。最理想的情况是查询需要的列全在索引里（覆盖索引）而不必回表。

**MySQL 的三类日志指的是错误日志、二进制日志与慢查询日志**（也有人把 undo/redo 单独算一层，回答时先说明自己按哪个维度分）。错误日志记录启动、崩溃与错误信息，是排查实例级故障的第一现场；binlog 是 Server 层逻辑日志，记录所有变更语句或行变更，用于主从复制与基于时间点的恢复，`ROW` 格式最安全，配套 `expire_logs_days` 和 `sync_binlog` 做保留与刷盘策略；慢查询日志记录超过 `long_query_time` 的语句，配合 `pt-query-digest` 做排行，是 SQL 调优的入口。如果面试官问的是 InnoDB 层，就答 redo log（物理日志、环形写、保证崩溃恢复与持久性）、undo log（逻辑日志、支持回滚与 MVCC 快照读）与 binlog 的两阶段提交（保证两份日志一致，避免主从数据错乱）。把「哪一层、解决什么问题」讲清楚，比枚举名字重要。

**Coding Agent 的难点与工程化要讲自己的取舍。** 难点通常集中在四处：上下文预算（仓库太大必须做检索与摘要，而不是把文件全塞进窗口）、工具调用的可靠性与幂等（改文件、跑命令这类有副作用的动作失败后怎么重试与回滚）、多轮计划与状态管理（长任务要能断点续做、失败可定位）、以及评测（怎么证明改动是对的——编译、类型检查、单测、真实运行多道关卡）。工程化就对应这四处的落地：统一模型与工具的调用层、结构化输出加校验重试、沙箱执行与超时限制、每一步留结构化日志与 trace、把失败案例回填成回归集。回答时最好带一个具体数据，比如「某类任务一次通过率从多少提到多少」——没有数据也要说清怎么度量。

**「点击按钮到返回」的全链路可以按层从外往内讲。** 浏览器侧：DNS 解析（浏览器缓存 → 系统 hosts → 本地 DNS → 递归解析）拿到 IP，建立 TCP 连接（HTTPS 再加 TLS 握手，含证书校验与 ALPN 协商），HTTP 请求经本机网卡与路由发出。网络侧：经过家用路由器与运营商网络，到达服务商的接入层——CDN 或 WAF（过滤攻击流量）、四层负载均衡（LVS，按连接转发）、七层网关（Nginx 或 API 网关，做路由、鉴权、限流）。服务侧：请求进入应用进程，可能经过服务注册发现与 RPC 调用下游，读写缓存（Redis）与数据库（MySQL 连接池），中间件如消息队列用于异步解耦；处理完按原路返回。可观测性在这条链路上打点：traceId 贯穿全链路，日志与指标在每段落地。追问点一般是「哪一段最可能变慢」「连接复用发生在哪些层」「如何定位一次慢请求」——答的时候主动提浏览器的连接池与 keep-alive、Nginx 到应用的 upstream 复用、以及数据库连接池，说明链路短一环就少一次握手。

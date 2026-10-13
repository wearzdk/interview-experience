---
title: "得物一面"
company: "得物"
position: "Java 后端"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/0dc0d609082c48e6b2de9073925d208e
tags: ["得物","Java","线程池","Spring 事务","MySQL","Agent"]
summary: "得物 Java 后端一面面经：线程池的创建方式、空闲线程状态与源码，CPU 飙高与死锁的排查手段，@Transactional 传播机制加「A 调 B、B 报错被 catch」「B 加 @Async」两个场景题，Spring 事件监听与容器启动完成的感知方式，以及 MySQL 隔离级别下的并发更新场景，最后聊了 Agent 调用工具的流程。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 线程池怎么创建？
3. 线程池当前没有任务时，线程的状态是什么？有任务来了怎么判断？
4. 讲讲线程池的源码。
5. 系统 CPU 飙高怎么查？死锁怎么查？jstack 怎么用？
6. @Transactional 的事务传播机制是什么？默认的 REQUIRED 如果当前存在事务，就加入这个事务吗？
7. 场景题：事务 A 内有子事务 B，事务 B 报错，事务 A 有 try-catch 会打印异常，A 会回滚吗？
8. 如果 B 加上了 @Async 注解，会回滚吗？
9. Spring 的事件、监听机制是什么？Spring 项目初始化或容器搭建完成了，怎么发现？
10. MySQL 的事务隔离机制是什么？
11. 两个事务执行是否互相影响？
12. 场景题：两个事务 A、B 在 MySQL 默认隔离级别下，A 先查询一行 id=1 的数据查不到，B 这时插入 id=1，A 再更新 id=1 能更新成功吗？
13. SSD 了解吗？
14. Agent 调用工具的流程是怎样的？
15. 你有什么想问我的？

### 《参考解析》

**线程池这组题要能把「创建方式、状态流转、源码主线」串起来**：创建方式有两条路：`Executors` 的快捷工厂（`newFixedThreadPool`、`newCachedThreadPool`、`newScheduledThreadPool`、`newSingleThreadExecutor`）写起来短，但固定与单线程池用的是无界队列 `LinkedBlockingQueue`，任务堆积会 OOM，缓存池的最大线程数是 `Integer.MAX_VALUE`，可能创建海量线程，所以生产上更推荐直接 `new ThreadPoolExecutor` 显式指定七个参数：核心线程数、最大线程数、空闲存活时间、时间单位、工作队列、线程工厂、拒绝策略。任务提交后的判断顺序是：核心线程未满就新建核心线程执行；核心满了就尝试入队；队列满了且未到最大线程数就新建非核心线程；再满就执行拒绝策略（`AbortPolicy` 抛异常、`CallerRunsPolicy` 由提交线程执行形成背压、`DiscardPolicy`、`DiscardOldestPolicy`）。空闲线程的状态要看它在哪：核心线程默认会阻塞在 `getTask()` 的 `workQueue.take()` 上（`WAITING`），非核心线程超过 `keepAliveTime` 后走 `poll()` 超时返回 null 并退出（`TIMED_WAITING`）；设置 `allowCoreThreadTimeOut(true)` 后核心线程也会回收。源码主线记住 `ctl` 这个 `AtomicInteger`：高 3 位存运行状态（RUNNING、SHUTDOWN、STOP、TIDYING、TERMINATED），低 29 位存线程数；`execute` 里三步判断、`addWorker` 创建线程并 `start`、`runWorker` 循环「取任务—加锁执行—清空本地任务」，以及 `shutdown` 与 `shutdownNow` 的区别（是否中断正在执行的线程、是否返回未执行的任务）。

**CPU 飙高与死锁排查，考的是工具链和判断顺序**：CPU 高的处理流程：先用 `top` 找进程，再 `top -Hp <pid>` 找线程，把线程 id 转成十六进制（`printf '%x\n' <tid>`），然后 `jstack <pid> | grep -A 30 <hex>` 定位那个线程在干什么（判断是业务死循环、频繁 GC、锁竞争还是正则回溯）。补充手段：`jstat -gcutil <pid> 1000` 看 GC 频率与耗时，如果 GC 线程占用高就是内存问题，配合 `jmap -histo:live` 或堆 dump 分析大对象；采样型工具用 `async-profiler` 生成火焰图，比反复 jstack 更直观；容器里注意 `top` 看到的是宿主机视角，要用 cgroup 限额配合。死锁的排查最简单：`jstack <pid>` 会直接输出 `Found one Java-level deadlock` 段落，明确指出哪两个线程互相持有什么锁、在等什么锁；也可以用 `jcmd <pid> Thread.print`、`jconsole` 的「检测死锁」按钮，或 Arthas 的 `thread -b`。定位到代码后用统一的加锁顺序、`tryLock` 带超时、或者把嵌套锁改成单锁来修。

**Spring 事务传播与那两个场景题，是这场最容易被追问穿的地方**：传播行为有七种，重点记四个：`REQUIRED`（默认，有事务就加入、没有就新建）、`REQUIRES_NEW`（挂起当前事务、自己开新事务，两者独立提交回滚）、`NESTED`（基于 savepoint 的嵌套子事务，子事务回滚不影响外层）、`SUPPORTS`/`NOT_SUPPORTED`/`MANDATORY`/`NEVER` 按语义理解即可。第一个场景：A 方法开了事务，调用 B（`REQUIRED`，同一事务），B 抛异常被 A 的 try-catch 吞掉且没有继续往外抛——因为 A、B 物理上是同一个事务，B 报错时会把事务标记为 `rollback-only`，A 捕获后继续执行，提交时会抛 `UnexpectedRollbackException`，事务**不会**正常提交（要么全部回滚，要么报错）；如果 B 是 `REQUIRES_NEW`，B 独立回滚，A 捕获异常后 A 能正常提交。还要提醒一个高频陷阱：同类内部方法自调用不走代理，`@Transactional` 直接失效；以及默认只对 `RuntimeException` 和 `Error` 回滚，受检异常要写 `rollbackFor = Exception.class`。第二个场景：B 加了 `@Async` 后运行在另一个线程，事务上下文（`TransactionSynchronizationManager` 绑定的是 ThreadLocal）不会传播过去，B 相当于独立执行甚至没有事务，B 失败不会导致 A 回滚，A 捕获异常后能正常提交——如果业务要求两者一致，`@Async` 就不能和「同一事务」的假设混用，应该改成 `REQUIRES_NEW` 加显式的补偿或对账机制。

**Spring 事件机制与「容器启动完成」的感知方式，分别对应观察者模式与生命周期回调**：事件三件套是 `ApplicationEvent`（事件对象，Spring 4.2 起普通 POJO 也能作为事件）、`ApplicationEventPublisher`（发布者，通常注入 `ApplicationContext` 或 `ApplicationEventPublisher`）、`ApplicationListener` / `@EventListener`（监听者）。默认是同步调用，发布线程即执行线程，所以监听器抛异常会影响主流程；要异步就配 `@Async` 加线程池，要控制顺序用 `@Order` 或实现 `Ordered`。要感知「容器初始化完成」，按时机从早到晚有几种选择：`@PostConstruct` 在单个 Bean 依赖注入完成后执行（此时其他 Bean 未必就绪），`InitializingBean.afterPropertiesSet` 类似，`ApplicationRunner`/`CommandLineRunner` 在容器刷新完成后、`SpringApplication.run` 返回前执行（适合跑启动任务），而 `ApplicationReadyEvent` 是真正的「一切就绪、可以对外服务」信号（适合预热缓存、注册到注册中心、开启流量），更底层的还有 `ContextRefreshedEvent`（可能触发多次，父子容器场景要小心）和 `SmartLifecycle`（能控制启停顺序）。

**MySQL 隔离级别与那道并发更新题，答案取决于 A 用的是快照读还是当前读**：四种隔离级别及实现见上一段原理：MVCC 的 ReadView 决定快照读看到哪个版本，锁决定当前读能读到什么。题目场景是 InnoDB 默认的 RR：事务 A 先 `select ... where id = 1` 查不到（普通 select 是快照读，不加锁），事务 B 插入 id=1 并提交，A 再 `update ... where id = 1`——`update` 是当前读，会读最新已提交的数据，因此能命中 B 插入的这行，更新成功（`affected rows = 1`），A 自己的事务里随后也能查询到该行。也就是说这里**不会**出现「更新不到」的情况；反过来，如果 A 一开始用的是 `select ... for update`（当前读并加间隙锁），A 会在 id=1 的间隙上加锁，B 的插入会被阻塞直到 A 提交，之后 B 再插入就会因主键冲突失败——这才是很多人期待的那个答案。补充两点：RC 级别下不加间隙锁，幻读更容易出现，所以依赖 binlog 的 row 格式保证主从一致；「两个事务是否互相影响」要分维度答——写写之间靠行锁互斥、读写之间靠 MVCC 互不阻塞、而更新同一行时后到的事务会等锁，等待超过 `innodb_lock_wait_timeout`（默认 50 秒）就报锁等待超时。

**SSD 与 Agent 工具调用这两题属于「看广度」，简短准确即可**：SSD 的要点：基于 NAND Flash，按页读写、按块擦除，靠 FTL 做逻辑地址到物理地址的映射，需要垃圾回收与磨损均衡（另外还有写放大、TRIM、掉电保护、DWPD/TBW 寿命指标）；性能特征是随机 IO 远好于机械盘、没有寻道时间，所以数据库的随机读、redo log 落盘都受益；对数据库实践的影响是 `innodb_flush_log_at_trx_commit`、`innodb_io_capacity` 这类参数可以调得更激进，但也必须正视 fsync 与写入放大，NVMe 相比 SATA 在队列深度与延迟上又提升一档。Agent 调用工具的流程要答成一个闭环：模型根据用户输入和工具描述（名称、用途、参数 JSON Schema）决定调用 → 输出结构化的 `tool_calls`（可能并行多个）→ 应用侧校验参数与权限 → 执行工具（本地函数、HTTP API、数据库查询、代码执行等）→ 把结果按约定格式（成功/失败、结构化数据、错误信息）写回消息列表 → 再次调用模型继续推理，直到产生最终回答。工程上要补的细节是：工具结果可能很长要先裁剪或落盘给引用 ID、写操作必须幂等并带超时与重试上限、执行要有权限边界与审计日志、失败要能区分「参数错」和「服务不可用」并让模型知道是否该换策略。这套流程讲清楚，后半场关于 Agent 的追问基本都能接住。

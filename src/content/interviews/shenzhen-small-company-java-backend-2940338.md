---
title: "深圳某小公司 Java 后端面试：Kafka 可靠性、Spring 事务与线程池"
company: "深圳某小公司"
position: "Java 后端"
date: '2026-11'
base: "深圳"
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/247e1f2935274da2bf2616d4536f7fe5
tags: ["深圳某小公司", "Java 后端", "Kafka", "Spring 事务", "ThreadLocal", "线程池"]
summary: "深圳一家小型公司的 Java 后端面试，问题集中在 Kafka 高可用与消息丢失、Spring 事务失效、volatile 与 ThreadLocal、线程池参数和线上排查，简历项目未被追问；岗位按初级定级，薪资区间 10–15k，并要求 Java 工程师兼做算法。"
---

### 《面试题目》

1. 自我介绍。
2. Kafka 如何保证高可用？acks 的三种取值分别代表什么？
3. Kafka 在哪些环节会丢消息？异步刷盘时节点宕机怎么处理？
4. Spring 事务在哪些场景下会失效？同一个类里 A 方法调用非事务的 B 方法会怎样？
5. 反过来，非事务的 A 方法调用事务方法 B，事务会不会失效？
6. volatile 关键字的作用和实现原理是什么？JMM 的内存屏障如何保证可见性与有序性？
7. ThreadLocal 的原理是什么？线程池复用线程时，上下文为什么会串？
8. 线程池有哪些核心参数？执行原理是什么？拒绝策略怎么选？
9. HTTP 和 HTTPS 有什么区别？
10. 线上问题排查的步骤是怎样的？
11. 日常工作中如何使用 AI 工具？
12. 反问：这个岗位的薪资区间、定级和职责边界是怎样的？

### 《参考解析》

**Kafka 的高可用依赖副本与选举，acks 只是其中一环。** 每个分区有一 leader 多 follower，leader 处理读写，follower 主动 fetch 追赶；与 leader 保持同步的副本集合即 ISR。leader 所在 broker 故障时，由 controller 从 ISR 中选新 leader，客户端通过 metadata 刷新重新路由。`acks=0` 表示 producer 发出即认为成功，不等 broker 确认；`acks=1` 只等 leader 写入本地日志；`acks=all`（或 `-1`）等 ISR 中所有副本写入。只配 `acks=all` 并不足够，还要配 `min.insync.replicas=2` 且副本数至少为 3：当 ISR 只剩 leader 时，写入会直接报 `NotEnoughReplicas`，用可用性换一致性；同时 `unclean.leader.election.enable=false`，避免落后副本被选为 leader 造成已提交消息丢失。消费端还有一组坐标：HW（high watermark）之前的消息才对消费者可见，LEO 是每个副本的日志末端；leader 切换后依靠 leader epoch 防止 follower 截断到错误位置。

**丢消息要按生产、存储、消费三段拆。** 生产端常见原因是 `acks=0/1`、重试次数耗尽、缓冲区满后丢弃、网络超时后未重试；开启 `enable.idempotence=true` 可让重试不产生重复，配合 `acks=all` 与足够的 `delivery.timeout.ms` 才能兼顾不丢与不重。存储端的核心不是刷盘，而是副本：Kafka 写入的是页缓存，`log.flush.*` 只防操作系统崩溃，防不了 broker 进程或整机掉电；异步刷盘时节点挂掉，只要消息已同步到足够副本，新 leader 仍有数据；若 `acks=1` 且 leader 在 follower 同步前宕机，或者发生 unclean 选举，消息就真的丢了。消费端则是先提交 offset 后处理、自动提交、rebalance 期间重复或遗漏，正确做法是处理完成后手动提交，并保证业务幂等。

**Spring 事务失效的本质是 AOP 代理没有生效。** `@Transactional` 靠代理拦截方法调用，因此同类内部 `this.b()` 这种自调用绕过代理，B 上的事务注解不会起作用；方法非 public、类未被 Spring 管理、方法为 final 或 static、使用 CGLIB 时也无法织入。异常默认只在 `RuntimeException` 与 `Error` 时回滚，抛出受检异常需要在 `rollbackFor` 中声明；在方法内 `catch` 掉异常不再抛出，事务同样不会回滚。传播行为配成 `NOT_SUPPORTED`、`NEVER`，或者在事务方法里另起线程、切换数据源，也会脱离当前事务。A 调 B 是否失效取决于调用是否经过代理：A、B 在同一个类里由 A 直接调用 B，失效；A 注入 B 的代理对象再调用，B 的事务正常生效；若 A 本身有事务且传播行为为 `REQUIRED`，B 加入 A 的事务，A 捕获 B 的异常后仍提交，可能得到 `UnexpectedRollbackException`。这也是面试官反复追问的价值所在——判断标准是「调用有没有穿过代理、异常有没有传出边界」，而不是背失效场景清单。

**volatile 保证可见性与有序性，不保证原子性。** JMM 规定每个线程有工作内存，volatile 写会把值刷回主存并使其他线程的缓存行失效，读则强制从主存重新加载。HotSpot 在 x86 上用带 `lock` 前缀的指令实现，效果接近 StoreLoad 屏障；JVM 在字节码层面插入 LoadLoad、StoreStore、LoadStore、StoreLoad 四类屏障，禁止指令重排。典型用途是状态标志位与双重检查锁定的单例，`i++` 这类读改写仍要用原子类或加锁。ThreadLocal 的每个 `Thread` 持有一个 `ThreadLocalMap`，key 是 ThreadLocal 的弱引用，value 是强引用；线程池复用线程时 map 不会自动清空，上一次请求写入的上下文会被下一次请求读到，造成用户信息串号或内存泄漏。必须在 `finally` 中 `remove()`；跨线程池传递上下文要用 `InheritableThreadLocal` 之外的方案（如 TransmittableThreadLocal），因为线程池的线程不是任务提交时新建的。

**线程池先看队列，再看拒绝策略。** 核心参数是 `corePoolSize`、`maximumPoolSize`、`keepAliveTime`、`workQueue`、`threadFactory`、`handler`。执行顺序为：核心线程未满则新建线程；核心线程已满则入队；队列满再扩到最大线程数；仍满则触发拒绝策略。这个顺序决定了 `LinkedBlockingQueue` 无界队列会让 `maximumPoolSize` 永远用不上，任务堆积到 OOM；`SynchronousQueue` 则直接把压力交给最大线程数与拒绝策略。拒绝策略中 `AbortPolicy` 抛异常，适合不能丢的任务；`CallerRunsPolicy` 让提交线程自己执行，形成天然背压，但会阻塞上游；`DiscardPolicy` 与 `DiscardOldestPolicy` 静默丢弃，只适合可丢的埋点、日志类任务。线程数按任务类型估算：CPU 密集接近核数，IO 密集按等待时间与计算时间之比放大，最终以压测的 RT、队列长度、活跃线程数为准，而不是套公式。

**线上排查的顺序是先止损、再定位。** 第一步看监控大盘：错误率、P99 延迟、QPS、CPU、内存、GC、线程数、连接池与下游依赖，判断故障是全局还是单实例、是突增还是缓慢劣化。第二步用链路追踪和日志定位到具体接口与下游，结合 `top -Hp`、`jstack` 找忙线程与锁竞争，`jmap`/`jcmd` 看堆与 GC，arthas 做方法耗时与入参观测，数据库看慢查询与锁等待。第三步确认变更：发布时间、配置推送、流量活动、依赖升级，优先回滚或降级。第四步才是根因分析与修复，最后补监控、告警与预案。排查中最容易犯的错误是先扎进代码，而没有先确认「影响面多大、是否还在扩大」。

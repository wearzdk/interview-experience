---
title: "商盟支付 Java实习 一面：ThreadLocal、AQS、RocketMQ"
company: "商盟支付"
position: "Java开发实习"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2f4d1758eec043698c164af3d40ccaa5
tags: ["商盟支付", "Java开发实习", "ThreadLocal", "HashMap", "线程池", "AQS", "RocketMQ"]
summary: "商盟支付 Java 开发实习一面，先深挖实习里的重复交易拦截与 TraceId 上下文透传，再连问集合、HashMap、线程池、AQS/ReentrantLock、Spring 扩展点、索引与慢 SQL、RocketMQ，最后聊 AI 与 Agent 的使用。"
---

### 《面试题目》

1. 自我介绍。
2. 介绍一下最后一段实习的项目大概是做什么的，你在里面的角色是什么，做了哪些内容？
3. 重复交易拦截是怎么做的？
4. 你写的配合上下文传递及超时控制，是用阿里云本来就有的 TraceId 上下文透传吗？是你们框架自带的功能吗？
5. ThreadLocal 为什么有可能导致内存泄漏？

**八股**

6. 介绍下集合的 3 个类型？
7. 介绍下 HashMap 的数据结构？
8. HashMap 从 1.7 到 1.8 做了哪些升级，解决了什么问题？
9. 除了你简历写的设计模式，你还知道哪些设计模式？
10. 说一下线程池的核心参数？
11. 线程池的执行流程？
12. 介绍下 AQS 是做什么的，里面有哪些内容，是怎么工作的？
13. 讲一下 ReentrantLock 的 `lock()` 是怎么工作的，lock 是公平锁还是非公平锁？
14. ReentrantLock 的加锁过程是怎么样的，用到了哪些 AQS 的方法？
15. Spring 初始化的时候从数据库里加载数据到缓存里，这里面有一些扩展点，你简单讲讲。
16. 说几个索引失效的场景？
17. 如果你收到一条报警让你处理一个慢 SQL，你会怎么思考、怎么排查、怎么解决？
18. 你在最后一段实习里会遇到分布式的问题吗？会遇到分布式事务吗？
19. 你们是用的 RocketMQ 吗？那你介绍一下 RocketMQ 有哪些消息类型？
20. RocketMQ 的顺序消息是怎么实现的？实际使用中会导致性能降低吗？
21. 讲一下 RocketMQ 的延迟消息是怎么实现的？

**AI 与 Agent**

22. 你在公司一般用什么模型、什么 Agent？
23. 你对 Agent 的理解是什么？
24. 你在工作中怎么用 AI 去分析需求、写代码、做测试？
25. 反问。

### 《参考解析》

**ThreadLocal 泄漏的根因是“key 弱引用、value 强引用”，再叠加线程池的长生命周期。** 每个 `Thread` 内部有一个 `ThreadLocalMap`，Entry 的 key 是 `WeakReference<ThreadLocal>`，value 是强引用。当业务代码把 ThreadLocal 对象置空后，GC 只能回收 key，Entry 变成 key 为 null 的 stale entry，但 value 仍然被 Map 强引用；`ThreadLocalMap` 只在 `get`、`set`、`remove` 时顺带清理一部分槽位，如果线程再也不访问这个 Map，value 就永远留着。普通线程执行完会结束，问题不大；线程池里的核心线程长期存活，就会把 value（可能是用户信息、大对象、连接上下文）一直攒在堆里。正确写法是 `try/finally` 里 `remove()`，尤其是 Web 容器和线程池场景。TraceId 透传也是同一套机制：框架通常在 HTTP 入口或 RPC filter 里把 trace id 放进 ThreadLocal/MDC，出口再取出来写回 header；跨线程池时要装饰 `Runnable`/`Callable` 做上下文复制，否则子线程拿不到，`InheritableThreadLocal` 只在创建线程时复制一次，线程池复用后会串号，生产上更稳的是 TransmittableThreadLocal 这类方案。超时控制则是另一条线：RPC 调用的 timeout、`Future.get(timeout)`、熔断器的超时都要设，且要保证超时后能取消或至少不再占用线程。

**集合体系先分 List、Set、Map 三类，HashMap 再讲清 1.7 到 1.8 的结构变化。** List 有序可重复，常见 `ArrayList`（数组、随机访问 O(1)、扩容 1.5 倍）和 `LinkedList`（双向链表、头尾操作快、随机访问 O(n)）；Set 不重复，`HashSet` 底层是 HashMap 的 key，`TreeSet` 基于红黑树有序；Map 是键值映射，`HashMap` 无序、`LinkedHashMap` 保留插入或访问顺序、`TreeMap` 按 key 排序。JDK 1.7 的 HashMap 是“数组 + 链表”，新节点头插；1.8 改成“数组 + 链表 + 红黑树”，链表长度到 8 且数组长度至少 64 时树化，退化阈值是 6，避免在 7/8 之间反复转换。1.8 的 hash 扰动从多次移位异或简化为 `h ^ (h >>> 16)`，扩容时利用容量是 2 的幂这一点，把节点拆成“原位置”和“原位置 + oldCap”两条链，不用重新计算 hash。头插改尾插的直接收益是并发扩容时不再形成环形链表，但 HashMap 仍然不是线程安全的，1.8 只是把“死循环”换成了“丢数据、size 不准”，并发场景要用 `ConcurrentHashMap`。设计模式可以按创建型（单例、工厂、建造者）、结构型（适配器、代理、装饰器）、行为型（策略、观察者、模板方法）各举一两个，并说清 JDK/Spring 里的落点：`BeanFactory` 是工厂，AOP 是代理，`Comparator` 是策略，模板方法在 `AbstractList` 这类骨架里很常见。

**线程池的执行流程要背成一条判断链，并说清为什么会先排队再扩容。** 核心参数是 `corePoolSize`、`maximumPoolSize`、`keepAliveTime`、`unit`、`workQueue`、`threadFactory`、`handler`。`execute` 的顺序是：当前线程数小于核心数就新建核心线程；否则尝试入队；入队成功就等空闲线程取；队列满且线程数小于最大数才新建非核心线程；再满就执行拒绝策略。常见拒绝策略有 AbortPolicy（抛异常）、CallerRunsPolicy（调用方自己跑，形成反压）、DiscardPolicy（静默丢弃）、DiscardOldestPolicy（丢最老的）。先入队再扩容是为了避免流量一抖就创建大量线程，但这也意味着如果用了 `LinkedBlockingQueue` 这种无界队列，`maximumPoolSize` 永远不会生效，任务会一直堆到 OOM，所以生产上要用有界队列加合适的拒绝策略。线程数不能拍脑袋：CPU 密集型接近核数 + 1，IO 密集型按 `N × (1 + 等待时间/计算时间)` 估，再用压测和监控校正；同时要盯活跃线程数、队列长度、拒绝次数、任务耗时，`Executors` 的 `newFixedThreadPool`/`newSingleThreadExecutor` 因为无界队列要慎用。

**AQS 是一个用 `state` 加 CLH 变体队列实现的同步框架，ReentrantLock 只是它的一种用法。** AQS 内部维护一个 `volatile int state` 和一个双向 FIFO 等待队列，节点用 `Node` 表示，带有 `waitStatus`（SIGNAL、CANCELLED、CONDITION 等）；获取失败时把当前线程包装成节点入队，然后 `LockSupport.park` 挂起，前驱释放时 `unparkSuccessor` 唤醒。子类通过 `tryAcquire`、`tryRelease`、`tryAcquireShared`、`tryReleaseShared` 决定 state 的含义。ReentrantLock 的 `lock()` 默认走非公平锁：先 CAS 把 state 从 0 改成 1，成功就把 `exclusiveOwnerThread` 设为当前线程；失败进入 `acquire`，先 `tryAcquire`，如果当前线程就是持有者则 state 加 1（可重入），否则入队挂起。非公平体现在 `tryAcquire` 里直接 CAS 抢一次，不管队列里有没有等待者；公平锁会先 `hasQueuedPredecessors()` 检查前面有没有人排队。非公平吞吐更高，但可能让排队的线程饥饿；公平锁也不保证绝对先来后到，只是不插队。`unlock()` 调 `tryRelease` 把 state 减到 0 才真正释放，然后唤醒后继；`Condition.await()` 会完全释放锁并进入条件队列，`signal()` 再把节点转回同步队列。回答时能把 `acquire → addWaiter → acquireQueued → shouldParkAfterFailedAcquire → parkAndCheckInterrupt` 这条链讲顺，基本就够用了。

**Spring 启动预热缓存的扩展点要按“执行时机”和“事务是否就绪”来选。** 最早可以在 `@PostConstruct` 或 `InitializingBean.afterPropertiesSet()` 里做，但此时 Bean 还在初始化，依赖的代理、事务、其他 Bean 可能没准备好，只适合加载本 Bean 自己的小数据。更稳的是 `ApplicationListener<ContextRefreshedEvent>`、`SmartInitializingSingleton.afterSingletonsInstantiated()`，或者 `ApplicationRunner`/`CommandLineRunner`（容器刷新完成后执行）；`ApplicationReadyEvent` 则表示应用已可对外服务。预热逻辑要幂等、可重试、失败可降级：数据库暂时连不上不能让整个应用起不来，可以异步重试并打点；数据量大时不要一次性 `select *` 全量塞 JVM，分页加载或放 Redis/Caffeine，并设容量和过期策略。还要考虑多实例同时预热对数据库的冲击，可以加分布式锁或随机延迟。若面试官追问“扩展点”，可以顺带提 `BeanPostProcessor`、`BeanFactoryPostProcessor` 的区别：前者处理 Bean 实例初始化前后，后者处理 BeanDefinition，改的是配置元数据。

**索引失效要先看“列有没有被加工”，再看优化器为什么不用。** 典型场景：在索引列上做函数或运算（`where date(create_time) = ...`、`where id + 1 = 10`）、隐式类型转换（字符串列传数字、字符集不一致）、`like '%xx'` 前导通配、复合索引不满足最左前缀、`or` 连接了无索引列、`!=`/`not in` 导致优化器判断全表更快、索引选择性太低（如性别）、统计信息过期、以及 `order by`/`group by` 与索引顺序不匹配。慢 SQL 的排查顺序是：先从慢查询日志拿到 SQL 和 `rows_examined`、`rows_sent`，用 `EXPLAIN` 看访问类型、命中索引、扫描行数、是否回表、是否 filesort/临时表；再看 `performance_schema`、`show processlist` 和锁等待，判断是慢在扫描、排序、回表还是被锁住。解决手段包括补复合索引或覆盖索引、改写 SQL 去掉列上的函数、把深分页改成基于游标、分区或归档历史数据、读写分离和缓存。加索引不是越多越好：每个索引都会增加写放大、占空间、拖慢优化器，且可能带来更多锁；一般让联合索引覆盖高频查询，定期清理无用索引。

**RocketMQ 的消息类型按“普通、顺序、延迟、事务”四类讲，顺序和延迟都要落到实现。** 普通消息不保证顺序；顺序消息要求生产端用 `MessageQueueSelector` 按业务键（如订单号）把同一组消息发到同一个队列，Broker 的队列天然 FIFO，消费端用 `MessageListenerOrderly` 对队列加锁、串行消费，失败会本地重试并可能阻塞后续消息。代价是并行度受队列数限制，热点订单会倾斜，所以顺序消息只用在真正需要局部有序的场景，其他场景用普通消息加业务状态机。延迟消息在 4.x 里只支持 18 个固定级别（1s、5s、10s、30s、1m 一直到 2h），实现是把消息先写到内部主题 `SCHEDULE_TOPIC_XXXX`，队列号对应延迟级别，`ScheduleMessageService` 按级别定时扫描到期消息，再投递回原主题；5.x 支持任意时间，用时间轮/定时日志来调度。事务消息是半消息 + 回查：先发半消息，执行本地事务，再提交或回滚，Broker 长时间没收到确认就回查生产者的本地事务状态，适合最终一致场景。分布式事务还可以提本地消息表、TCC、Saga，但重点是说清“不要用消息中间件硬做强一致”。

**Agent 可以理解为“LLM 负责决策，工具负责执行，状态机负责兜底”的循环。** 一个可用的 Agent 至少包含：目标与约束解析、计划/任务分解、工具选择与参数填充、执行与观察、失败重规划、记忆与上下文管理、终止条件。它和普通 Chatbot 的区别不是会不会聊天，而是能不能在多步执行中根据工具返回修正计划。工作中用 AI 分析需求，可以让它先做需求拆解、边界条件和测试点清单，人再删改；写代码时让它生成骨架、单测和迁移脚本，但必须过编译、静态检查和 code review；做测试时用它生成边界用例、构造 mock 数据和读日志，最后仍要靠真实环境验证。风险要说清：模型会编 API、会忽略上下文约束、可能把敏感数据带出去，所以工具调用要有权限和白名单，生成结果要可审计，关键写操作要人工确认。这样回答比单纯说“提效”更像真的在工程里用过。

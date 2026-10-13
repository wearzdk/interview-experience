---
title: "欣旺达 Java 开发一面：Spring AOP 原理与 Java 锁体系"
company: "欣旺达"
position: "Java 开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/939486691545436160
tags: ["欣旺达","Java","Spring AOP","RocketMQ","synchronized","ReentrantLock","CAS"]
summary: "欣旺达 Java 开发一面面经（约 35 分钟、无手撕）：项目深度拷打之后依次问 Spring AOP 是什么、有哪几种实现方式与原理，RocketMQ 延迟消息的实现，Java 中的锁有哪些、synchronized 加锁流程与锁消除，ReentrantLock 公平锁的实现，以及 CAS 的缺点和规避方式。"
---

### 《面试题目》

1. 简单做个自我介绍。
2. 项目拷打。
3. 什么是 AOP？
4. Spring 中实现 AOP 有哪几种方式？
5. Spring AOP 的原理是什么？
6. RocketMQ 延迟消息是怎么实现的？
7. Java 中的锁有哪些？
8. synchronized 加锁的流程是什么？
9. 什么是锁消除？
10. ReentrantLock 公平锁是怎么实现的？
11. CAS 的缺点是什么，如何避免？

### 《参考解析》

**AOP 与 Spring 里的几种实现方式。** AOP 是把横切关注点（日志、事务、鉴权、限流、埋点）从业务代码里抽出来，用「切点匹配 + 通知执行」的方式统一织入，好处是业务方法不用被这些逻辑污染，也不用在每个调用点手动写一遍。Spring 语境下要分清三条路：一是运行期动态代理，Spring AOP 默认走这条，有接口用 JDK 动态代理、没有接口（或显式 `proxyTargetClass=true`，Spring Boot 2.x 起默认如此）用 CGLIB 生成子类；二是编译期织入，AspectJ 的编译器在编译时把通知代码写进字节码，性能最好、能织入字段访问和构造器；三是类加载期织入（LTW），靠 `-javaagent` 在类加载时改字节码。答「有哪几种」时把这三条摆出来，再把 Spring AOP 限定在第一条，层次就清楚了。

**Spring AOP 的原理要落到调用链上。** 核心参与者是 `BeanPostProcessor`（具体是 `AbstractAutoProxyCreator`）：容器初始化 Bean 时它会拿所有 `Advisor` 去匹配，命中切点就用 `ProxyFactory` 生成代理对象替换原 Bean，所以注入到别处的其实是代理。运行时的调用路径是：调用代理方法 → `JdkDynamicAopProxy` 或 `CglibAopProxy` 拿到该方法对应的拦截器链 → 递归执行 `MethodInterceptor`（`MethodInvocation.proceed()` 一层层往里走）→ 最终反射调用目标方法。事务能生效就是因为 `TransactionInterceptor` 挂在这条链上。由此可以顺势答出几个经典失效场景：同一个类里的方法自调用不经过代理、`private` 和 `final` 方法无法被 CGLIB 覆盖、`static` 方法不在实例代理范围、切点表达式写错或 Bean 不是由容器管理的对象都不生效——面试官问「原理」时几乎必追这些。

**RocketMQ 延迟消息的实现分版本，答清差异是加分项。** 4.x 的做法是「固定延迟级别 + 内部 topic 转存」：生产者发的延迟消息不能直接投到目标 topic，而是先写入 `SCHEDULE_TOPIC_XXXX`，按延迟级别（默认 18 级，从 1s 到 2h）分到不同的内部队列，同时把原本的目标 topic 与队列信息存进消息属性里；Broker 的定时任务按级别扫描到期消息，到期后把消息重新投递到真实的目标 topic，消费者这时才看得到。要注意代价：延迟级别是写死的，不支持任意时长（要加级别得改配置甚至改代码），到期扫描有精度误差，量大的时候定时任务本身是压力点。5.x 之后改成了基于时间轮的定时消息，支持任意秒级延迟，思路是把延迟时间当属性、由 `TimerWheel` 按刻度推进到期投递。对比其他方案也值得一句：RabbitMQ 靠死信队列加 TTL 做延迟、Kafka 原生不支持要靠外部调度或时间轮自研，选型时精度、吞吐和实现复杂度得一起看。

**Java 的锁按不同维度分类。** 按是否阻塞分乐观锁（CAS、版本号）和悲观锁（`synchronized`、`ReentrantLock`）；按公平性分公平锁与非公平锁；按可否重入分可重入与不可重入；按共享方式分独占锁与共享锁（`ReentrantReadWriteLock` 的读锁、`StampedLock`）；按实现层面分 JVM 内置的监视器锁（`synchronized`、`wait/notify`）和 JUC 里基于 AQS 的显式锁（`ReentrantLock`、`Semaphore`、`CountDownLatch`）。把维度先摆出来再举例，比零散列举更有结构。

**synchronized 的加锁流程讲「锁升级」这条主线。** 对象头里的 Mark Word 记录锁状态，流程是：无锁 → 偏向锁（第一个线程进入时把线程 ID 记进 Mark Word，之后同一线程进入无需 CAS；JDK 15 起偏向锁默认关闭并已废弃，这点要提，否则会显得知识过期）→ 轻量级锁（有竞争时在栈帧里建 Lock Record，用 CAS 把 Mark Word 指向它，失败就自旋）→ 重量级锁（自旋失败或竞争激烈，膨胀成 `ObjectMonitor`，线程进 EntryList 阻塞、由操作系统调度唤醒）。升级是单向的、不会降级。字节码层面看，同步方法是方法访问标志 `ACC_SYNCHRONIZED`，同步块是 `monitorenter`/`monitorexit` 成对出现（编译器还会补一个异常路径上的 `monitorexit` 防死锁）。

**锁消除是 JIT 的优化，不是语法层面的东西。** 逃逸分析判定锁对象不会被其他线程访问（典型是方法内 `new` 出来的 `StringBuffer` 或局部集合，只在本方法里用），那么这段同步就是多余的，JIT 会把加锁指令直接去掉；配套的还有锁粗化（把循环里反复加解锁合并成一次）。回答时要顺带说明它是运行时优化、依赖逃逸分析的准确度，并且可以通过 `-XX:-EliminateLocks` 关掉——面试官问这个通常是想看你知不知道「代码里写了锁不代表运行时真的加锁」。

**ReentrantLock 公平锁靠 AQS 队列的先后顺序。** 内部是 `Sync` 继承 `AbstractQueuedSynchronizer`，公平版本是 `FairSync`，它的 `tryAcquire` 在 CAS 抢 state 之前会先调 `hasQueuedPredecessors()`：如果等待队列里已经有前驱节点在排队，就直接放弃本次抢占、把自己包装成节点挂到队尾并 `park`，从而保证「先到先得」。非公平版（`NonfairSync`）不做这个检查，新来的线程可以直接抢当前刚释放的锁，所以可能出现插队——吞吐更高但会有线程饥饿。公平锁的实现代价是每次抢锁都要读队列状态并频繁地 park/unpark，线程上下文切换多，实测吞吐通常低于非公平锁，所以无参构造默认是非公平的。可重入性由 AQS 的 `state` 计数实现，同一线程每次重入加一、退出减一。答到「为什么默认非公平」和「公平锁的代价」这两点就够扎实了。

**CAS 的四个缺点与对应规避手段。** 一是 ABA 问题：值从 A 改成 B 又改回 A，CAS 看不出变化，用带版本号的 `AtomicStampedReference` 或 `AtomicMarkableReference` 解决。二是自旋开销：竞争激烈时长时间空转烧 CPU，规避是限制自旋次数、改用自适应自旋、或干脆换成分段思想（`LongAdder` 用 Cell 数组把热点分散，代价是求和时不是强一致的瞬时值）。三是只能保证单个变量的原子性，多变量组合操作要么用 `AtomicReference` 把多个字段包成一个对象，要么退回锁。四是伪共享与内存语义问题：多个原子变量落在同一个缓存行会互相失效，用 `@Contended` 或字段填充做缓存行对齐可以缓解。工程上的总原则是「能不加锁就不加锁」——无共享设计（线程封闭、不可变对象、消息传递）优先于任何锁优化。

**整体复盘。** 这场一面 35 分钟、没有手撕、项目占用时间较长，八股集中在一个非常明确的区间：Spring 的代理机制、RocketMQ 的实现细节、以及 Java 并发里的锁与 CAS。这类组合说明面试官想问的是「你有没有真的读过一个框架的源码、有没有在高并发代码里踩过坑」。准备时的性价比排序是：先把 `synchronized` 锁升级与 AQS 的 `state + 双向队列` 讲成一条完整故事线，再补 Spring AOP 的代理与失效场景，最后把中间件的实现细节（RocketMQ 延迟级别、时间轮）当成「能说清代价」的知识点准备，而不是背结论。

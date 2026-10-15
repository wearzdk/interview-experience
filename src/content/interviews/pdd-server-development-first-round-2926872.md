---
title: "拼多多服务端一面：并发可见性与 Spring 原理追问"
company: "拼多多"
position: "服务端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/5a2de77709cc4c80a9aeaeed13d3f85e
tags: ["拼多多","服务端开发","Java并发","Spring","volatile","内存屏障","HashMap"]
summary: "拼多多服务端开发一面（10 月 14 日，正式批）：题目不多但一个词就会触发追问，强度较大；前半段深挖实习中最大的技术挑战、项目的数据一致性、监控与 AOP 日志追踪，后半段连问 HashMap 线程不安全、Spring IOC 与 AOP、原子性与可见性、volatile 的语义与内存屏障存在的理由。"
---

### 《面试题目》

1. 自我介绍。
2. 实习过程中遇到的最大的技术挑战是什么？讲讲背景和解决方案。
3. HashMap 为什么是线程不安全的？
4. 介绍一下 Spring 的 IOC、AOP。
5. 项目的数据一致性怎么保证？还有没有别的方案？
6. 项目的监控是怎么做的？
7. 日志怎么用 AOP 来追踪？讲清楚原理。
8. 什么是原子性？什么是可见性？怎么实现可见性？
9. 讲一下 volatile 是什么？在单线程、多线程的时候怎么保证可见性？
10. 内存屏障怎么实现的？为什么要有内存屏障？

### 《参考解析》

**HashMap 线程不安全要分 JDK 版本讲，1.7 和 1.8 的事故形态不一样。** JDK 1.7 的 `transfer` 在扩容时用头插法迁移链表，并发扩容会让链表指针互相指回形成环，此后 `get` 命中该桶就会死循环、CPU 打满——这是最经典的事故。JDK 1.8 改成尾插加红黑树，成环问题没了，但仍然不安全：并发 `put` 可能互相覆盖（两个线程同时判断桶为空后各自写入，后写的丢掉先写的），`size` 用普通字段累加会少算，扩容期间读写会看到迁移中间态（`ForwardingNode` 只是让读操作转发，写操作仍可能写丢）。要顺带说明「并发场景该用什么」：`ConcurrentHashMap`（1.8 用 CAS 写空桶加 `synchronized` 锁桶头，锁粒度细、读不加锁）、`Collections.synchronizedMap`（全表一把锁，简单但吞吐差）、以及「读多写少且能容忍短暂不一致就用 `volatile` 引用整体替换」的 copy-on-write 思路。追问常落在「为什么 ConcurrentHashMap 的 size 是近似的」（`baseCount` 加 `CounterCell` 分散热点，类似 LongAdder）、「为什么 key 不允许 null」（无法区分「不存在」与「值为 null」）。

**IOC 与 AOP 各答「控制权交给谁」和「横切逻辑怎么织入」。** IOC 是把对象的创建与依赖装配从代码里搬给容器：容器读 Bean 定义、按类型或名称做依赖查找与注入（构造器、setter、字段），并通过三级缓存解决循环依赖（一级放成品 Bean、二级放半成品、三级放工厂以便提前暴露 AOP 代理），`@Lazy`、`ObjectProvider` 与「改构造器注入」是常见破环手段。AOP 是把日志、事务、权限这类横切关注点抽成切面，运行期靠代理织入：目标类实现接口时默认用 JDK 动态代理，否则用 CGLIB 生成子类（Spring Boot 2.x 起默认强制 CGLIB），拦截链由 `Advisor` 与 `MethodInterceptor` 组成，`@Order` 决定顺序。易错的点是「自调用不走代理」「final 类与 private 方法代理不了」「代理对象注入导致类型不一致要用接口或 `AopContext.currentProxy()`」，把这些点说清楚基本就过关了。

**数据一致性与监控都是「先定口径再选方案」的问题。** 一致性要按范围分层答：单库靠本地事务与约束（唯一索引、乐观锁版本号）；跨服务靠 TCC（Try-Confirm-Cancel，业务改造大但一致性最强）、可靠消息最终一致（本地消息表或事务消息加消费端幂等，是互联网最常见的选择）、Saga（长事务拆成可补偿步骤，适合流程长的业务）、以及「先写主、后写从、读己之写」这类读写路径上的折中。要主动讲「没有免费的一致性」：TCC 要处理空回滚与悬挂，消息方案要处理重复消费与顺序，最终一致必须配一套对账与补偿任务兜底，否则不一致会静默堆积。监控同样分层：指标（QPS、延迟分位、错误率、资源水位，采集用 Micrometer 加 Prometheus）、日志（结构化、带 traceId）、链路追踪（OpenTelemetry/SkyWalking，跨服务透传上下文）、以及告警（按 SLO 设阈值，避免噪声）。追问会问「怎么发现慢」，答案是先看分位而不是均值，再用链路追踪定位到具体 span 与下游依赖。

**用 AOP 做日志追踪的核心是「一次请求一个 traceId，并且跨线程与跨服务都带着它」。** 入口处（Filter 或 Interceptor）生成 traceId 并放进 MDC（SLF4J 的 `MDC` 底层是 ThreadLocal），日志模板里输出它；切面负责记录方法入参、出参、耗时与异常，注意大对象要截断、敏感字段要脱敏，参数序列化失败不能影响主流程。坑集中在三点：一是异步线程池会丢 MDC，需要在任务提交时快照上下文并在执行线程里 set/clear（用 `TaskDecorator` 或 `TransmittableThreadLocal`）；二是跨服务要把它放进 HTTP header（或消息 header）由下游再次写入 MDC；三是切面本身要有异常兜底与采样，否则日志量会把磁盘和 IO 打满。再往前一步可以说「把 traceId 贯穿到 DB 慢查询与 MQ 消费日志，才能做端到端排查」。

**原子性、可见性、有序性是 JMM 的三条约定，答的时候要拿具体例子说话。** 原子性指一个操作不可被中断，Java 里只有基本类型的读写（long/double 非 volatile 除外）和引用赋值是原子的，`i++` 是三步骤所以要靠 `synchronized`、`AtomicInteger` 或锁来保证。可见性指一个线程的修改对其他线程可见：直接原因是每个线程有自己的工作内存（CPU 缓存加寄存器），写只落本地副本；实现手段是 `volatile`、`synchronized`/`Lock`（解锁前刷回、加锁时失效本地副本）、`final`（正确构造后对其他线程可见）以及 `java.util.concurrent` 里的原子类。有序性指编译器与 CPU 的重排序，靠 happens-before 规则约束。追问「volatile 在单线程里有用吗」，答案是：单线程下程序顺序语义本身就能保证看到自己的写，volatile 的可见性约束是无意义的，它真正起作用的是多线程场景（外加禁止重排序）；它的两个语义是「写后立即刷回主存、读前从主存加载」以及「禁止特定重排序」，但**不保证复合操作的原子性**，这正是 `volatile int i; i++` 依然线程不安全的原因。所以它适合状态标志位（`while(!stop)`）和安全的发布（双重检查锁定里的实例字段），不适合计数器。

**内存屏障是「让 volatile 的语义在硬件上真的成立」的手段，不是 Java 自己发明的语法糖。** CPU 有自己的 store buffer 与失效队列，编译器和处理器也会为了性能重排序，所以要靠屏障指令来限制：JMM 定义了四种屏障——LoadLoad、StoreStore、LoadStore、StoreLoad，`volatile` 写在前面插 StoreStore 加 StoreLoad、读操作后面插 LoadLoad 加 LoadStore（不同硬件映射到具体指令，x86 只有 StoreLoad 对应的 `mfence`/`lock` 前缀需要真指令，其余多数场景靠硬件本身较强的内存模型免掉），从而形成「volatile 写之前的普通写不能排到它后面、volatile 读之后的普通读不能排到它前面」的效果，也就是 JMM 给的 happens-before 边界。反过来看 `synchronized` 与 `final` 的可见性，同样是通过在监视器进出、构造器尾部插入屏障实现的。没有屏障会怎样：指令重排会让「先赋值再初始化」的顺序颠倒，导致其他线程拿到半初始化对象（双重检查锁定里不加 volatile 的经典 bug），或者让标志位在数据写入前就被看到。追问预备：`AtomicInteger` 的 CAS 底层在 x86 上是 `lock cmpxchg`，这条带 lock 前缀的指令本身也起全屏障作用；JDK 9 之后 `VarHandle` 提供了更细粒度的 acquire/release 语义，可以按需选择强度而不是一味全屏障。

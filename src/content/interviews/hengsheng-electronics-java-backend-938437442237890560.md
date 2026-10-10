---
title: "恒生电子 Java 开发一面面经（17 分钟）"
company: 恒生电子
position: Java开发
round: 一面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/938437442237890560
tags: ["Java","JUC","Spring","事务","MySQL"]
summary: "恒生电子 Java 开发一面面经，全程 17 分钟：自我介绍后依次问接口与抽象类的区别、JUC 并发包里的类与工具、final 作用于变量/方法/类的效果与引用类型的注意点、项目用过哪些中间件、@Transactional 的传播属性、Spring IOC 与 DI 注入方式、MySQL 事务隔离级别、InnoDB 与 MyISAM 的区别，最后问如何看待手写代码与 AI 辅助编程。"
---

### 《面试题目》

1. 简单做个自我介绍。
2. 接口和抽象类的区别？
3. 说说 JUC 并发包下你了解的类和工具。
4. final 关键字作用在变量、方法、类上分别是什么效果，引用类型要注意什么？
5. 项目中用过哪些中间件？
6. @Transactional 事务的传播属性有哪些？
7. 讲讲对 Spring IOC 的理解，DI 有哪些注入方式？
8. MySQL 有哪几种事务隔离级别？
9. InnoDB 和 MyISAM 存储引擎区别？
10. 怎么看待手写代码和 AI 辅助编程？

### 《参考解析》

**接口与抽象类的区别**。回答要落到「设计意图」而不是语法。抽象类是单继承的类，可以有构造器、成员变量、受保护的方法与已实现的逻辑，表达的是「is-a 的骨架复用」——把子类共有的状态和流程放在父类，模板方法把可变步骤留给子类。接口是行为契约，一个类可以实现多个，字段默认是 `public static final` 常量，方法默认是抽象的（Java 8 之后可以有 `default` 方法与静态方法，Java 9 之后可以有 `private` 方法），表达的是「can-do 的能力约定」。选择的判据：如果子类之间要共享状态与实现，用抽象类；如果只是约定一组能力、且希望不同类型都能具备，用接口。现代 Java 的实践偏向「接口定义契约 + 少量默认方法做兼容演进，抽象类只用于真正的骨架复用」，因为接口不占用唯一的继承位，也便于 mock 与解耦。

**JUC 并发包该怎么说全**。按类别报比零散罗列好得多：① 锁与同步器——`ReentrantLock`（可重入、可中断、可定时、支持公平）、`ReentrantReadWriteLock`、`StampedLock`、`Semaphore`、`CountDownLatch`、`CyclicBarrier`、`Phaser`，底层是 AQS 的 state 加等待队列；② 原子类——`AtomicInteger`/`AtomicReference`/`LongAdder`（分段累加缓解热点）、`AtomicStampedReference`（解决 ABA）；③ 并发容器——`ConcurrentHashMap`（JDK 8 起是 CAS 加桶级 synchronized，锁粒度到桶）、`CopyOnWriteArrayList`（读多写极少）、`BlockingQueue` 家族（`ArrayBlockingQueue` 有界、`LinkedBlockingQueue` 选容量、`SynchronousQueue` 直接交接、`DelayQueue`、`PriorityBlockingQueue`）；④ 线程池与任务——`ThreadPoolExecutor`、`ForkJoinPool`、`CompletableFuture`（编排异步流水线）；⑤ 工具类——`ThreadLocalRandom`、`Collections.synchronizedXxx` 包装器、`LockSupport`。选型讲一句就够：高并发计数用 `LongAdder`，读多写少用 COW，需要阻塞交接用队列，异步编排用 `CompletableFuture` 并显式指定线程池，别用默认的 `ForkJoinPool.commonPool()`。

**final 的三种用法与引用类型的陷阱**。修饰变量表示只能赋值一次（成员变量要显式或在构造器里初始化，`final` 加 `static` 是常量，基本类型值不可变，引用类型只是指向不可变）；修饰方法表示不可被重写（早期还有内联优化的意义，现在更多是语义约束）；修饰类表示不可被继承（`String`、`Integer`、`BigDecimal` 都是）。引用类型的注意点有两个层次：一是「`final` 修饰的是引用本身，不是对象内容」——`final List` 不能再指向别的 List，但 `list.add()` 完全合法，想真正不可变要用 `List.of`/`Collections.unmodifiableList`（后者只是视图，原集合变了它也跟着变）；二是并发语义——`final` 字段有特殊的可见性保证（JMM 规定构造完成后 final 字段对其他线程可见，不需要额外同步），这是安全发布不可变对象的基础，也是 `String` 等类能放心共享的原因。

**@Transactional 的传播属性与常见失效场景**。七种传播行为的标准答法：`REQUIRED`（默认，有事务就加入、没有就新建）、`REQUIRES_NEW`（总是新建，挂起外层，适合记录日志这类不能随主事务回滚的操作）、`SUPPORTS`（有就加入、没有就非事务执行）、`NOT_SUPPORTED`（挂起外层，非事务执行）、`MANDATORY`（必须已有事务，否则抛异常）、`NEVER`（有事务就抛异常）、`NESTED`（基于保存点的嵌套事务，外层回滚会带上内层，内层回滚不影响外层——注意它依赖 JDBC 保存点，数据库支持情况要确认）。比背传播属性更有价值的是失效场景，面试官追问往往从这里出：同类内部方法自调用不走代理（要注入自身代理或拆类）、方法不是 `public`、类没有被 Spring 管理、异常被 catch 掉或抛的是受检异常（默认只对 `RuntimeException` 与 `Error` 回滚，可用 `rollbackFor` 扩展）、数据库引擎不支持事务（MyISAM 就是典型）、多数据源或未配置事务管理器、以及异步线程里调用（事务上下文不跨线程传递）。这些点说出来，说明你被线上问题咬过。

**Spring IOC 与 DI 注入方式**。IOC 的核心是控制反转：对象的创建、装配与生命周期由容器负责，业务代码只声明依赖，从而解耦与便于测试。容器启动时读取配置（注解或 XML）得到 BeanDefinition，通过 `BeanFactory` 的反射实例化、属性填充（`populateBean`）、初始化（`InitializingBean`/`@PostConstruct`/`BeanPostProcessor` 的 AOP 代理在这里织入），最后放进单例池；循环依赖靠三级缓存解决（但构造器注入的循环依赖解决不了，这也是推荐构造器注入的原因之一）。DI 的注入方式有三种：字段注入（`@Autowired` 直接标在字段上，写法最短但依赖隐藏、无法用 final、脱离容器就不可用，不推荐）；setter 注入（适合可选依赖）；构造器注入（依赖显式、可加 `final`、启动即暴露循环依赖，Spring 官方推荐）。另外要区分 `@Resource`（按名称优先，JDK 规范）与 `@Autowired`（按类型优先，配合 `@Qualifier` 指定名称）。

**MySQL 隔离级别与两种存储引擎**。四种隔离级别从松到严是读未提交、读已提交、可重复读、串行化，对应解决的问题是脏读、不可重复读、幻读；MySQL 的 InnoDB 默认是可重复读，通过 MVCC（事务开始时生成快照，读走 ReadView 的版本链）实现快照读不加锁，当前读用 `for update`/`lock in share mode`，并用间隙锁（Next-Key Lock）在一定程度避免幻读。要注意「RR 完全避免幻读」的说法不准确：快照读靠 MVCC，当前读靠间隙锁，两者机制不同，混合使用时仍可能出现语义上的不一致。InnoDB 与 MyISAM 的差别：InnoDB 支持事务、行级锁、外键、MVCC 与崩溃恢复（redo/undo），聚簇索引组织数据，适合绝大多数 OLTP 场景；MyISAM 只有表级锁、不支持事务与外键，索引与数据分离，崩溃后可能损坏需要修复，只适合只读或数据量小、并发低的场景，如今已基本被淘汰。答题时补一句「表级锁在写多时会互相阻塞」比只列条目更有说服力。

**手写代码与 AI 辅助编程怎么看**。这是开放题，稳妥的答法是分层给出判断：AI 已经在承担大量「查文档、写样板、生成测试与注释、做代码翻译」的工作，这部分确实会被压缩；但真正稀缺的是定义问题、设计边界、判断取舍和处理线上故障的能力——这些都需要理解系统全貌与业务后果，AI 目前给不出可问责的结论。落到自己身上要给具体做法：用 AI 加速局部实现与探索，但对生成的代码一律自己 review、跑测试、看边界与错误处理，绝不把不理解的东西提交上线；把省下的时间投到设计、性能、可观测性与领域知识上。这样答既承认趋势，也说明了自己的边界意识，比单纯说「AI 取代不了程序员」或「程序员要失业了」都好。

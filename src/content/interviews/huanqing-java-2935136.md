---
title: "寰擎信息 Java 开发面经：从 ArrayList 扩容问到 Spring 事务失效"
company: "寰擎信息"
position: "Java开发"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/8ca87f72070e49de8dcf8ce05ef5e3e1"
tags: ["寰擎信息","Java","线程池","MySQL","Spring","JVM","设计模式"]
summary: "寰擎信息 10 月 29 日的 Java 开发面经，20 道题几乎全是八股：ArrayList 扩容与预分配、HashMap 查找、Java 异常体系、堆栈、GC 算法、线程池参数与执行流程、FixedThreadPool 的坑、ForkJoin、单核下 IO 与 CPU 密集的取舍、MySQL 调优与隔离级别、redo/undo/binlog、Spring 事务失效场景、装饰器模式，末尾还有 Agent 与工作流的区别及 HR 类问题。"
---

### 《面试题目》

1. ArrayList 的扩容是怎么实现的？
2. 如果我有一万个数据，怎么让它不一直扩容？
3. 在一万个元素里找一个数据，用什么数据结构？
4. hashCode 为什么快？
5. 说一下 Java 的异常体系，以及你项目中常遇到的三个异常。
6. 说一下 Java 里的堆和栈。
7. 说一下你知道的垃圾回收算法。
8. 项目中有用到多线程吗？多个线程是怎么创建的？不用线程池的话怎么创建？
9. 你们用的是哪个线程池？参数是怎么配的？讲一下一个任务过来的处理流程。
10. FixedThreadPool 主要用来做什么，特点是什么？
11. ForkJoin 了解吗？
12. 场景题：单核 CPU 下，IO 密集和 CPU 密集哪个执行效率高？
13. 讲一下你做到过的 MySQL 调优。
14. 说一下 MySQL 的数据隔离级别。
15. MySQL 的日志有哪几种？undo log 是干什么的？
16. Spring 里是怎么控制事务的？声明式事务什么时候会失效？
17. 了解过哪些常用的设计模式？讲一下装饰器模式。
18. Agent 和工作流的区别是什么？
19. 现在在哪里？简历主要投哪里？
20. 期望薪资是多少？

### 《参考解析》

**ArrayList 的扩容：默认容量 10，满了按 1.5 倍增长。** `add` 时若 `size + 1 > elementData.length` 就触发 `grow`，新容量取 `oldCapacity + (oldCapacity >> 1)`，然后 `Arrays.copyOf` 复制到新数组。代价是 O(n) 的搬移和一次内存分配，所以第二问的答案是**预估容量后一次性 `new ArrayList<>(10000)` 或在合适时机 `ensureCapacity`**，把扩容次数压到零。还要补一点：`ArrayList` 不是线程安全的，多线程写要么外部加锁要么换 `CopyOnWriteArrayList`；删除中间元素同样是搬移，频繁增删要考虑 `LinkedList` 或其它结构。

**一万个元素里查找：看是「按什么查」。** 按索引查用数组本身 O(1)；按 key 查用 `HashMap`（哈希 O(1)，冲突多时单个桶退化为红黑树 O(log n)）；需要有序范围查用 `TreeMap` 或跳表 O(log n)；只有无序数组又频繁查找才考虑排序 + 二分。第三问常见的加分答法是先反问「是否允许重复、是否需要有序、是否多线程」，把结构选择挂到需求上。

**「hashCode 为什么快」讲的是哈希定位的过程。** `HashMap` 用 `hash(key)` 做一次扰动（高 16 位异或低 16 位）后与 `(n-1)` 做按位与，直接算出桶下标，理想情况下一次内存访问就命中，平均 O(1)；桶内先比 hash 再比 `equals`（或引用相等），冲突多时链表长度超过 8 且容量 ≥64 会树化成红黑树，最坏从 O(n) 降到 O(log n)。要强调两条纪律：`equals` 重写必须同时重写 `hashCode`（否则相等的对象散到不同桶，查找直接失效），以及 `hashCode` 本身要算得快且分布均匀，否则哈希再快也退化成链表。

**Java 异常体系的骨架是 Throwable 分两支。** `Error`（`OutOfMemoryError`、`StackOverflowError`）表示 JVM 层面不可恢复的问题，不该 catch；`Exception` 分受检异常（`IOException`、`SQLException`，必须处理或声明抛出）与运行时异常（`NullPointerException`、`IllegalArgumentException`、`ClassCastException`、`IndexOutOfBoundsException`）。项目里最常遇到的三个可以答 NPE、`SQLException` 或连接超时、以及业务自定义异常；顺势讲清实践：不要 `catch (Exception e) {}` 吞掉，包装时要保留 cause，业务异常与系统异常分开处理，`finally` 里不要 return。

**堆和栈的分工。** 栈是线程私有的，存栈帧——局部变量表、操作数栈、返回地址、动态链接，随方法调用进出，容量小、分配快、溢出报 `StackOverflowError`；堆是线程共享的，存对象实例与数组，由 GC 管理，溢出报 `OutOfMemoryError`。补充两点常被追问：对象不一定都在堆上（逃逸分析后的栈上分配、标量替换是 JIT 优化），字符串常量与类元信息在 JDK 8 之后分别在堆的字符串常量池和元空间（本地内存）。

**GC 算法四类，回答时按「怎么判断垃圾 + 怎么回收」组织。** 判断用可达性分析（GC Roots：栈上引用、静态变量、常量、JNI 引用），不用引用计数（解决不了循环引用）。回收算法：标记-清除（简单但碎片化）、复制（新生代用，Eden 与两个 Survivor，浪费一半空间但无碎片）、标记-整理（老年代，移动对象消碎片但慢）、分代收集（按对象存活时间分区，新生代 Minor GC、老年代 Major/Full GC）。收集器层面按需提 Serial、Parallel、CMS、G1（分 Region、可预测停顿）、ZGC（染色指针、亚毫秒停顿）。

**不用线程池创建线程有四条路。** 继承 `Thread` 重写 `run`、实现 `Runnable`、实现 `Callable` 配合 `FutureTask`（能拿返回值、能抛受检异常）、或者用 `CompletableFuture`/`ExecutorService` 的 `submit`。生产中不该裸 `new Thread`：线程创建销毁成本高、数量不可控、没有统一监控与拒绝策略。

**线程池的参数与执行流程是高频必答。** 七个参数：corePoolSize、maximumPoolSize、keepAliveTime、unit、workQueue、threadFactory、handler。执行顺序：核心线程未满就新建核心线程 → 核心满了进队列 → 队列满了且未到 maximum 就建非核心线程 → 都满则执行拒绝策略（AbortPolicy 抛异常、CallerRunsPolicy 回退给提交线程、DiscardPolicy 静默丢、DiscardOldestPolicy 丢最老的）。参数怎么配要挂场景：CPU 密集型约 `N+1`，IO 密集型按「等待时间/计算时间」的比例放大（常见 `2N` 起），但真正靠谱的做法是压测后按 P99 与队列积压调整；队列必须有界，否则就是隐性 OOM。

**FixedThreadPool 的坑正是「无界队列」。** 它固定核心线程数且 `maximumPoolSize == corePoolSize`、队列是 `LinkedBlockingQueue`（默认容量 `Integer.MAX_VALUE`），所以线程数永远不增长、任务全堆在队列里，流量上来时表现为延迟飙升直至 OOM。它适合「任务量平稳、允许排队」的场景，不适合突发流量。同类还有 `SingleThreadExecutor`（同样的无界队列）与 `CachedThreadPool`（`SynchronousQueue` + 最大线程数 Integer.MAX_VALUE，可能创建过多线程）——这也是《阿里巴巴 Java 开发手册》要求不用 `Executors` 快捷方法、改用 `ThreadPoolExecutor` 显式构造的原因。

**ForkJoin 是「分治 + 工作窃取」。** 把大任务递归拆成小任务（`RecursiveTask`/`RecursiveAction`），空闲线程从别的线程双端队列尾部窃取任务，减少线程饥饿；适合可递归拆分、计算密集的场景（归并排序、大规模数组统计），不适合 IO 阻塞（会占住工作线程）。

**单核下的 IO 密集 vs CPU 密集。** 单核没有真正并行，区别在于「CPU 有没有被浪费在等待上」。CPU 密集任务在单核上多线程只会增加上下文切换开销，效率反而下降；IO 密集任务的大部分时间在等磁盘或网络，多线程（或异步）能把等待时间重叠起来，让 CPU 在等 A 的时候去跑 B，因此相对效率更高。准确的说法是：单核时判断依据是「任务是否会让出 CPU」，而不是「线程多不多」。

**MySQL 调优要给「发现—定位—验证」的链路。** 发现靠慢查询日志与监控（`long_query_time`、`pt-query-digest` 汇总 TOP SQL）；定位靠 `EXPLAIN`（看 type 是否 ALL、key 用了哪个索引、rows 预估、Extra 里有没有 Using filesort/Using temporary），必要时 `EXPLAIN ANALYZE` 看真实耗时与循环次数；改法按顺序想——加或改索引（最左前缀、覆盖索引、避免索引失效的函数与隐式转换）、改写 SQL（去掉 `select *`、避免大偏移量分页、拆分大事务）、表结构与业务层（分区、冷热分离、读写分离、缓存）。每一步都要有前后对照数字，否则不算调优。

**隔离级别与并发异常要成对回答。** 读未提交（脏读）、读已提交（解决脏读，仍有不可重复读）、可重复读（InnoDB 默认，靠 MVCC + 间隙锁基本解决幻读）、串行化（全加锁，性能最差）。要能说出「MySQL 的可重复读为什么能防幻读」：快照读靠 MVCC，当前读靠 Next-Key Lock。

**MySQL 的日志按用途记：** redo log（InnoDB 物理日志，保证崩溃恢复与 WAL）、undo log（InnoDB 逻辑日志，保存数据旧版本，用于回滚与 MVCC 快照读）、binlog（Server 层逻辑日志，用于复制与归档恢复）、error log、slow query log、relay log（从库中继）。被追问「undo log 是干什么的」时答两点：事务回滚时把数据改回去，以及为 MVCC 提供历史版本（配合 Read View 实现一致性读）。

**Spring 事务的两种控制方式与失效场景。** 编程式用 `TransactionTemplate` 显式提交回滚；声明式靠 `@Transactional`，本质是 AOP 代理在方法前后开启/提交事务。失效的典型场景：① 同类内部方法自调用（绕过代理）；② 方法不是 `public`（Spring 5 之前代理不生效）；③ 异常被 catch 吞掉，或抛的是受检异常而 `rollbackFor` 没配；④ 类没有被 Spring 管理（没加注解）或代理模式选错；⑤ 数据库引擎不支持事务（MyISAM）；⑥ 传播行为配置不当（如 `REQUIRES_NEW` 与自调用组合）；⑦ 多线程里执行（事务绑定在 ThreadLocal，子线程不在同一事务）。修法对应着来：注入自身代理或拆类、`rollbackFor = Exception.class`、不要吞异常、确认引擎是 InnoDB。

**装饰器模式是「不改原类，靠包装叠加能力」。** 抽象组件 + 具体组件 + 装饰器（持有同类型引用，在调用前后加逻辑）。Java IO 是教科书例子：`new BufferedReader(new InputStreamReader(new FileInputStream(f)))` 一层层加缓冲与字符解码；Spring 的 `BeanWrapper`、`HttpServletRequestWrapper` 也是。它和代理的区别在于意图：装饰器是客户端显式层层包装、增强功能；代理是透明地控制访问（AOP、延迟加载、权限）。和继承相比的好处是组合而不是爆炸式的子类。

**Agent 与工作流的区别，一句话是「谁决定下一步」。** 工作流是预先编排好的确定性流程，分支与顺序由代码或配置写死，可预测、可测试、成本可控；Agent 把「下一步做什么」交给模型在运行时决策，能处理开放输入与工具组合，但不确定、需要护栏（最大步数、工具白名单、超时、人工确认）与评测。工程上常用混合形态：主干用工作流保证稳定与可观测，局部（意图路由、工具选择、异常恢复）交给 Agent。这类题在传统 Java 岗出现，往往说明团队在往 AI 方向探，答完可以顺势问一句岗位的实际方向。

**收尾的三道是稳定性问题。** 「现在在哪里、主要投哪里」是在确认你的求职地域与稳定性，「期望薪资」是摸底。答法给区间不给精确数字，并且说清依据（城市、岗位、自己的实习与项目匹配度）；如果很想进这家，可以补一句「更看重岗位与成长，薪资参考贵司同岗位标准」，把话题拉回匹配度。

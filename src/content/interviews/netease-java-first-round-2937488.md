---
title: "网易 Java 后端一面：项目开场后的一轮集合与并发八股"
company: "网易"
position: "Java 后端开发"
round: "一面"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/d4c1df8fbdc54581999d4ad857404288
tags: ["网易", "Java", "HashMap", "ThreadLocal", "volatile", "线程池", "手撕"]
summary: "网易秋招正式批 Java 后端一面：问完项目后转入八股，覆盖 HashMap 原理与线程安全、ArrayList 与 LinkedList、锁、ThreadLocal、wait、volatile、线程池与拒绝策略、重写重载与多态，最后手撕二叉树层序遍历。"
---

### 《面试题目》

1. HashMap 底层原理是什么？它是不是线程安全？
2. ArrayList 和 LinkedList 有什么区别？
3. 锁是什么？
4. ThreadLocal 是什么，原理是什么？
5. wait 是干什么的，怎么用？
6. volatile 是做什么的，原理是什么？
7. 线程池参数、拒绝策略。
8. 重写、重载的区别与条件。
9. 继承、多态是什么？
10. 手撕：二叉树层序遍历。

### 《参考解析》

**HashMap 的底层与线程安全。** JDK 8 的结构是数组 + 链表 + 红黑树：`put` 时先算 key 的 hash（高 16 位与低 16 位异或，减少碰撞），再按 `(n-1) & hash` 定位桶；空桶用 CAS 写入，非空则遍历链表，命中就覆盖，未命中尾插，链表长度 ≥ 8 且数组长度 ≥ 64 时转红黑树，查询从 O(n) 降到 O(log n)。扩容在元素数超过 `容量 × 0.75` 时发生，容量翻倍，JDK 8 通过「hash 高位是否为 0」把节点拆成低位链与高位链，避免重新计算 hash。它不是线程安全的：并发 put 可能丢数据、扩容时可能形成环（JDK 7 头插法导致，JDK 8 改成尾插后不再成环但仍会丢更新），并发读写还可能读到中间状态。并发场景用 `ConcurrentHashMap`（JDK 8 用 CAS + synchronized 锁单个桶）。另外 key 必须正确实现 `hashCode` 与 `equals`，可变对象做 key 会导致取不回来。

**ArrayList 与 LinkedList。** ArrayList 基于动态数组，随机访问 O(1)，尾部追加均摊 O(1)，中间插入删除要搬移元素 O(n)，扩容按 1.5 倍增长并复制；内存连续、缓存友好。LinkedList 基于双向链表，头尾插入删除 O(1)，随机访问 O(n)，每个节点额外存两个指针、内存开销大、缓存不友好。实践上绝大多数场景用 ArrayList，即使频繁头部插入，`ArrayDeque` 也通常比 LinkedList 快。

**锁与 wait。** 锁的本质是「同一时刻只允许一个执行流进入临界区」，用来保护共享可变状态，避免竞态。Java 里每个对象都有一把内置锁（monitor），`synchronized` 通过 monitorenter/monitorexit 或 ACC_SYNCHRONIZED 标记实现，JVM 会做偏向锁、轻量级锁、重量级锁的升级；`ReentrantLock` 基于 AQS，支持公平锁、可中断、超时、多条件队列。`wait` 是 Object 的方法，必须在持有该对象锁的同步块里调用，作用是释放锁并让当前线程进入等待集，直到被 `notify/notifyAll` 唤醒或超时；被唤醒后要重新竞争锁。使用时要放在 `while` 循环里检查条件（防虚假唤醒），并且 `wait` 与 `notify` 必须配对使用同一个对象锁。

**ThreadLocal 的原理与风险。** 每个 Thread 内部有一个 `ThreadLocalMap`，key 是 ThreadLocal 对象（弱引用），value 是线程私有的值；`get/set` 实际上是操作当前线程自己的 map，所以线程之间天然隔离。弱引用的设计是为了让 ThreadLocal 对象本身可以被回收，但 value 是强引用，如果线程长期存活（线程池）且没有调用 `remove`，value 会一直挂在 map 里造成泄漏——所以在线程池里用完必须 `remove`。典型用途是传递上下文（用户身份、traceId、事务连接），但要注意异步切换线程时上下文不会自动传递（需要显式装饰或使用支持上下文传递的执行器）。

**volatile 的两层语义。** 一是可见性：写 volatile 变量会立即刷回主内存并使其他 CPU 的缓存行失效，读会直接从主内存（或最新缓存）读，保证一个线程的修改对另一个线程可见。二是禁止重排序：volatile 读写会在前后插入内存屏障，禁止编译器与 CPU 把 volatile 操作与其他内存操作重排。它不保证原子性，`i++` 这种读改写依然有竞态，需要 `AtomicInteger` 或加锁。典型正确用法是状态标志位（`volatile boolean running`）与双重检查锁定的单例（`volatile` 防止「分配内存、初始化、赋值引用」被重排导致别的线程拿到半初始化对象）。

**线程池与拒绝策略。** 核心参数是 corePoolSize、maximumPoolSize、keepAliveTime、workQueue、threadFactory、handler。执行顺序是：核心线程未满则建核心线程；核心满了进队列；队列满了扩到最大线程；最大也满了走拒绝策略。四种内置策略：AbortPolicy（抛异常，默认）、CallerRunsPolicy（调用线程执行，形成反压）、DiscardPolicy（静默丢弃）、DiscardOldestPolicy（丢最老的再提交）。生产上要用有界队列 + 自定义拒绝策略（记录日志、降级、报警），并按业务隔离线程池，避免一个慢下游拖垮全部。

**重写、重载与多态。** 重载是同一个类中方法名相同、参数列表不同（类型、个数、顺序），与返回值无关，编译期静态分派。重写是子类重新实现父类的方法，要求方法名、参数列表、返回类型相同或协变，访问权限不能更严，不能抛出更宽的受检异常，运行时动态分派（虚方法表）。多态指父类引用指向子类对象、调用时执行子类的实现，前提是继承、重写、向上转型；它让调用方依赖抽象而不是具体实现，代价是虚调用无法内联、需要运行时查表。

**层序遍历。** 用队列迭代：根入队；循环里先取当前队列长度 `size`，表示这一层的节点数，逐个出队、收集值、把左右子节点入队；每轮结束把当前层结果加入答案。时间复杂度 O(n)，空间 O(最大宽度)。常见追问是之字形遍历（按层反转）、按层取最大值、以及用 DFS 记录深度模拟 BFS。

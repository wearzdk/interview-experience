---
title: "恒生Java后端一面：HashMap、锁升级与DCL"
company: "恒生"
position: "Java后端"
round: "一面"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/fc217e0c90d140d29e0183ff8748c36b"
tags: ["Java","HashMap","并发编程","synchronized","volatile","锁升级","单例模式"]
summary: "恒生 Java 后端一面面经，20 分钟流水线面试。考点是 HashMap 在 JDK 7 与 8 的差异、volatile 的作用、synchronized 的语义与锁升级、它与 ReentrantLock 的区别以及 DCL 写法。"
---

### 《面试题目》

1. 请介绍一下你实习做的东西，主要说你负责的部分。
2. HashMap 在 JDK 7 和 JDK 8 里有什么区别？
3. volatile 关键字的作用是什么？
4. synchronized 的语义是什么？
5. synchronized 作用在哪些地方？锁升级过程是怎样的？
6. synchronized 和 ReentrantLock 有什么区别？
7. 讲一下 DCL。

---

### 《参考解析》

**HashMap 从 JDK 7 到 JDK 8 的改动**

JDK 7 的 HashMap 是「数组 + 链表」，插入用头插法；JDK 8 改成「数组 + 链表 + 红黑树」，链表长度超过 8 且数组容量不小于 64 时转为红黑树，把最坏情况的查找从 O(n) 降到 O(log n)，插入也改成了尾插。另一个常被追问的点是并发扩容：JDK 7 头插在 rehash 时会反转链表顺序，多线程同时扩容可能让两个节点互指形成环，之后 get 直接死循环；JDK 8 改成尾插，环的问题基本消失，但 HashMap 本身仍然不是线程安全的，并发写照样可能丢数据，该用 ConcurrentHashMap。此外 JDK 8 把 hash 扰动简化为一次高位异或，扩容时元素要么留在原下标、要么移动到「原下标 + 旧容量」，省掉了重新计算 hash 的开销。

**volatile 与 synchronized 各自保证什么**

volatile 保证可见性与有序性，不保证原子性：写操作会立刻刷回主内存，读操作会失效本地缓存重新从主内存读，同时禁止编译器与 CPU 把它前后的指令重排。它适合做状态标志位、以及 DCL 里那个单例引用，但不适合 `i++` 这种读改写操作。synchronized 的语义是「互斥 + 内存可见性」：进入 monitorenter 相当于加锁并让本线程的工作内存失效，退出 monitorexit 相当于解锁并把修改刷回主内存，被它保护的临界区同时具备原子性、可见性和有序性。

**synchronized 的锁升级与 ReentrantLock 的取舍**

synchronized 可以加在实例方法（锁 this）、静态方法（锁 Class 对象）和代码块（锁指定对象）上，锁信息记在对象头的 Mark Word 里。升级路径是：无锁 → 偏向锁（同一线程反复进入，把线程 ID 记在 Mark Word 里，连 CAS 都省掉）→ 轻量级锁（出现竞争就用 CAS 自旋抢锁）→ 重量级锁（自旋失败，交给操作系统的管程挂起线程）。要注意偏向锁在较新的 JDK（15 起）已经默认关闭，回答时最好点一句，免得显得只背了老资料。和 ReentrantLock 比：后者基于 AQS 用 Java 代码实现，支持公平锁、可中断获取、超时 tryLock 和多个 Condition 条件队列，代价是必须自己写在 finally 里 unlock，漏了就再也解不开；synchronized 是 JVM 内置的，写法简单且不会忘记释放。所以能用 synchronized 就先用它，只有确实需要可中断、超时或条件变量时才换 ReentrantLock。

**DCL 为什么离不开 volatile**

DCL（双重检查锁定）是懒加载单例的经典写法：先判空避免每次进锁，再加类锁，锁内再判一次空防止重复创建。它必须给单例字段加 volatile，原因是 `instance = new Singleton()` 不是原子操作，字节码层面分成「分配内存、初始化对象、把引用指向该内存」三步，没有 volatile 时编译器或 CPU 可能把第三步排到第二步前面，此时第二个线程在锁外判空就会看到一个非 null、但字段还没赋值的半成品对象。更省事的替代是静态内部类（靠类加载机制保证线程安全且天然懒加载）或者枚举单例，实际项目里后者还能顺带防住反射与反序列化破坏。

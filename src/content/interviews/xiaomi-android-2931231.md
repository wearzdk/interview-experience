---
title: "10.22 小米安卓一面：Java 对象语义、synchronized 锁对象连环追问与 Android 基础"
company: "小米"
position: "安卓开发"
round: "一面"
date: '2026-10'
result: "进二面"
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/27424c8609eb43c9aee0b0cbb57584eb
tags: ["小米","安卓开发","校招","Java并发","synchronized","HashMap","Handler","线程池"]
summary: "小米安卓一面，70 分钟纯 Java 深挖：从 == 与 equals、深浅拷贝、方法传参，到 HashMap 的 put/get 与线程安全，再用一组连环追问把 synchronized 的实例锁与类锁拆开；后半段问单例、锁类型、Binder、Handler 跨线程、View 绘制与线程池，最后补了几道 Android 八股。"
---

### 《面试题目》

1. 自我介绍。
2. 前端和后端你最熟悉哪个？
3. 面向对象的三大特性是什么？
4. `==` 和 `equals` 有什么区别？
5. 重写 `equals` 需要重写 `hashCode` 吗？
6. 重写和重载有什么区别？
7. 子类重写父类方法后，返回值类型可以改吗？
8. 抽象类和接口有什么区别？抽象类里除了抽象方法还能定义普通方法吗？
9. 浅拷贝和深拷贝有什么区别？B 浅拷贝 A 之后修改 B，A 会变吗？深拷贝呢？
10. 一个方法有三个入参（int、String、一个对象），方法内部修改这三个入参，外部的变量和实例会受影响吗？
11. HashMap 的数据结构是什么？put 的流程是怎样的？
12. `hashCode` 相等，`equals` 一定相等吗？两者的关系是什么？举个例子说明。
13. 什么是线程安全？HashMap 的 put 方法是线程安全的吗？怎么保证线程安全？Java 里有线程安全的 Map 实现吗？
14. HashMap 的 get 方法具体是哪几步？
15. `synchronized` 修饰静态方法和修饰普通方法，哪个锁的范围更大？修饰静态方法锁的对象是什么？
16. 类 T 里两个普通方法 A、B 都用 `synchronized` 修饰，10 个线程并发调用同一个实例 t 的 `t.A()` 和 `t.B()`，锁会生效吗？
17. 同一个实例 t，多线程分别调用 `t.A()` 和被 `synchronized` 修饰的静态方法 `T.C()`，锁会生效吗？
18. 两个静态方法 `T.C()` 和 `T.D()` 都被 `synchronized` 修饰，多线程同时调用会互斥吗？
19. 创建两个实例 t1、t2，分别调用 `t1.A()` 和 `t2.B()`，能锁住吗？会发生死锁吗？
20. `volatile` 保证了什么性质？两个方法同时对 `volatile` 修饰的 i 做 i++ 会有脏读问题吗？怎么解决？
21. CAS 能解决 ABA 问题吗？还有别的方法吗？
22. 要保证线程安全还需要满足哪些特性？Atomic 原子类用过吗？
23. 了解单例吗？自己写过吗？饿汉式和懒汉式有什么区别？Double Check 了解吗？
24. ReentrantLock 了解吗？它的中断机制是什么？
25. try-catch 的异常体系了解吗？
26. 公平锁和非公平锁了解吗？`synchronized` 是公平锁吗？哪些锁是公平锁？
27. 乐观锁和悲观锁了解吗？
28. 线程和进程的区别是什么？进程间通信有哪些方式？Binder 的具体实现是怎样的？
29. Kotlin 协程用过吗？满分 10 分你给自己的 Kotlin 打几分？
30. `let`、`also`、`apply`、`run` 这四个作用域函数了解吗？
31. Jetpack Compose 用过吗？安卓上写过哪些代码？View 的绘制流程了解吗？有自定义过 View 吗？
32. Android 四大组件有哪些？Activity 的生命周期有哪些？
33. 在一个 Activity 里启动另一个 Activity，两个 Activity 的生命周期分别是怎样的？
34. 更新 UI 的操作是在主线程还是子线程执行？
35. Handler 的运作流程是怎样的？如果子线程创建 Looper 和 Handler 给另一个子线程发消息，这个消息最终在哪个线程执行？
36. 线程池用过吗？核心参数有哪些？线程池执行一个 Runnable 任务的流程是怎样的？核心线程会被回收吗？核心线程和非核心线程有什么区别？
37. 内存泄漏了解吗？GC 通过什么算法判断对象是否需要回收？
38. 反问。

### 《参考解析》

**对象语义与传参**：`==` 比引用，`equals` 默认也比引用，重写后才按字段比；重写 `equals` 必须重写 `hashCode`，否则对象放得进 HashMap 却取不出。重写要求参数列表相同、返回类型可协变、权限不能收窄。浅拷贝只复制引用，改 B 的字段 A 也变；深拷贝递归复制。Java 只有值传递：int 和 String 在方法内重新赋值不影响外部，对象入参复制的是引用，方法内调 setter 会改到外部实例，把形参重新指向新对象则不会。

**HashMap 与线程安全**：1.8 是数组加链表加红黑树，put 先算 hash 定位桶，空桶 CAS 放入，否则锁住头结点尾插，链表到 8 且容量到 64 转树，最后判断扩容；get 是算 hash、定位桶、比头结点、在链表或树里按 `equals` 找。`hashCode` 相等不代表 `equals` 相等，反过来必须成立。HashMap 的 put 不加锁，并发扩容会丢数据，线程安全要用 `ConcurrentHashMap`。线程安全要同时满足原子性、可见性、有序性。

**synchronized 锁的是谁**：判据只有一条——实例方法锁 `this`，静态方法锁 `Class` 对象，代码块锁括号里的对象。所以同一实例的两个实例方法互斥；实例方法与静态方法不互斥；两个静态方法互斥；t1 和 t2 各调实例方法也不互斥。这里不会死锁，拿的是两把不相干的锁。`volatile` 只保证可见性与禁止重排，i++ 仍会丢更新，要用 `AtomicInteger`；CAS 本身解决不了 ABA，得加版本号。

**单例与锁类型**：饿汉式类加载时就建实例，天生线程安全但不延迟加载；懒汉式的 Double Check 必须给实例字段加 `volatile`，否则可能拿到构造未完成的半成品。`synchronized` 是非公平锁，`ReentrantLock` 可传 `true` 变公平，`lockInterruptibly()` 能响应中断是它相对前者最实际的优势。

**Android 侧**：A 启动 B 的顺序是 A.onPause → B.onCreate/onStart/onResume → A.onStop（B 用透明主题时 A 不走 onStop）。UI 只能主线程更新。Handler 的链路是 Handler → MessageQueue → Looper，消息执行在创建 Handler 时绑定的那个 Looper 所属线程。线程池先填核心线程、再进队列、队列满开非核心、到上限就拒绝，核心线程默认空闲也不回收。内存泄漏的本质是长生命周期对象持有 Activity，GC 用可达性分析判活。

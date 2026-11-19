---
title: "小红书 AI 全栈一面：synchronized 锁对象、双亲委派与 ThreadLocal 泄漏"
company: 小红书
position: AI全栈开发
date: '2026-11'
collectedAt: '2026-11-19'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/952643256024670208
tags: ["小红书","Java","并发","JVM","类加载","ThreadLocal","volatile"]
summary: "小红书 AI 全栈岗一面，从自我介绍与上段实习离职原因切入，随后连续追问 Java 并发与 JVM：synchronized 锁实例对象与 Class 对象的区别、双亲委派的工作方式与设计目的、volatile 与 synchronized 的取舍、synchronized 的字节码实现，最后是 ThreadLocal 在线程池中的内存泄漏问题。"
---

### 《面试题目》

1. 先简单做个自我介绍，上段实习为什么辞职？
2. 之前实习做的平台，具体业务流程是怎样的？
3. synchronized 锁住普通对象和 Class 对象，有什么区别？
4. JVM 的双亲委派机制是怎么工作的？为什么要这样设计？
5. volatile 和 synchronized 都能保证可见性，实际开发中应该怎么选择？
6. synchronized 关键字到底有什么作用？它的底层实现是什么？
7. ThreadLocal 为什么可能造成内存泄漏？在线程池中怎么处理？

### 《参考解析》

**synchronized 锁实例与锁 Class**：实例方法上的 synchronized 锁的是当前实例 `this`，静态方法上锁的是对应的 Class 对象。同一个类的两个实例分别调用同步实例方法，只要不是同一把锁就能并发执行；静态同步方法由同一 Class 对象承载，不同实例调用时竞争的是同一把锁。容易踩的坑是把库存扣减写成实例同步方法，而业务里创建了多个服务对象，互斥根本没生效——锁的范围要结合对象实例和部署方式一起分析。

**双亲委派**：类加载器收到请求后先交给父加载器，父加载器无法完成时才自己查找。加载 `java.lang.String` 时会沿委派链向上，最终由 Bootstrap ClassLoader 加载，应用自定义的同名类无法覆盖核心类。这里的「父」是委派关系而非继承关系。设计目的是避免核心类被替换、减少重复加载。它并非不可打破，SPI 与部分插件框架会用线程上下文类加载器绕过。

**volatile 与 synchronized 的取舍**：volatile 保证变量读写的可见性并限制特定重排序，不保证复合操作的原子性；synchronized 通过互斥同时提供可见性与原子性。停止标志位这类单变量状态用 volatile 足够；`count++` 这类读改写必须用锁或原子类。选择依据是有没有复合操作、是否涉及多个共享变量的一致性，而不是先比性能。

**synchronized 的底层**：同步代码块编译为 `monitorenter` / `monitorexit`，线程进入时获取对象监视器、退出时释放；同步方法用方法访问标志 `ACC_SYNCHRONIZED` 表示，由 JVM 在调用时完成同步。JVM 会做锁消除、锁粗化、偏向锁与轻量级锁等优化，但存在真实竞争时阻塞与唤醒仍有开销，所以同步块里不要放耗时的网络调用。

**ThreadLocal 与内存泄漏**：每个线程持有自己的 `ThreadLocalMap`，Entry 的 key 是 ThreadLocal 的弱引用，value 是强引用。ThreadLocal 对象被回收后 key 变成 null，但 value 仍被 Entry 强引用；线程池里的线程长期存活，这些 value 就一直无法回收。规范做法是在 `finally` 里调用 `remove()`，把 key 与 value 一起清掉；用 `static final` 持有 ThreadLocal 只能延缓 key 被回收，不能替代 remove。

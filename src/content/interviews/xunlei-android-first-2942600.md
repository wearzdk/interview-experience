---
title: "迅雷安卓客户端一面：类加载、static 生命周期与 Handler 机制"
company: 迅雷
position: 安卓开发
round: 一面
result: 挂
date: '2026-11'
collectedAt: '2026-11-19'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/10bd8b04eb32439397f30d81598eb560
tags: ["迅雷","安卓","Java","JVM","并发","Handler","MVVM","ANR"]
summary: "迅雷安卓客户端开发一面（凉经），先问项目与实习里最吃力的一段、客户端与后端的差异，然后是一长串 Java 八股：JDK/JRE/JVM、Java 代码如何跑在手机上、类加载全流程、static 变量与类的生命周期、工作内存与主内存、并发问题与线程安全手段、synchronized 与 Lock、ThreadLocal、线程池参数与核心线程数；安卓部分问 Handler/Looper/MessageQueue、事件分发返回值、横竖屏切换与 ViewModel 恢复、MVVM、UI 刷新与合成、invalidate 的执行时机、ANR、跨进程序列化。"
---

### 《面试题目》

1. 自我介绍。
2. 简历上的项目介绍。
3. 实习经历里哪一块做起来最吃力、收获也最大？挑一个展开讲遇到的问题与解决过程。
4. 做客户端开发与做后端开发相比，最大的差异是什么？各自需要解决的核心问题是什么？
5. Java 里的 JDK、JRE、JVM 三者分别是什么，有什么区别？
6. 我们编写的 Java 代码，最终是如何运行在操作系统或手机上的？
7. JVM 加载一个类的具体全流程是怎样的？每一步做了什么？
8. 页面类里定义了一个 static 静态变量，进入页面创建对象、退出后对象被回收，此时这个类还在不在？对象还在不在？静态变量还在不在？静态变量的生命周期是怎样的？
9. Java 中常说的工作内存和主内存分别是什么？
10. 工作内存与主内存这种机制会不会引发并发问题？
11. 如果要保证线程安全、解决这些内存并发问题，有哪些实现手段？
12. 并发编程中 synchronized 和 Lock（如 ReentrantLock）有什么区别？
13. 有了解过 ThreadLocal 吗？它的原理和作用是什么？项目里用过吗？有没有遇到内存泄漏及排查修复？
14. 项目里是怎么使用和自定义线程池的？
15. 线程池有哪些核心参数？任务提交后的整体执行原理是怎样的？
16. 核心线程数（corePoolSize）的数量设置一般有什么参考依据？
17. Android 的消息机制（Handler / Looper / MessageQueue）有了解吗？讲讲工作原理。
18. Android 事件分发机制里，相关分发/处理方返回一个 boolean 值，这个返回值的作用是什么？
19. 如果事件被当前 View 消费了，返回的是 true 还是 false？
20. Activity 横竖屏切换时默认会怎么处理？想保留界面数据应该怎么做？
21. 为什么横竖屏切换导致 Activity 销毁重建时，ViewModel 里存的数据不会丢失？底层怎么暂存恢复？
22. ViewModel 本身的设计定位是用来做什么的？
23. 有了解过 MVVM 架构吗？M、V、VM 分别指什么？数据流和交互怎么流转？
24. 无论是 Android 还是鸿蒙，客户端 UI 刷新的整体原理是怎样的？
25. 应用层把绘制做完之后，后续会交给什么组件最终合成上屏？
26. 调用 invalidate() 时，系统是立刻执行绘制，还是会先做别的事情？
27. Android 开发中常说的 ANR 是什么？什么情况下会触发？
28. 在 Java 或 Android 进行跨进程通信传递数据时，为什么需要对数据做序列化？
29. 最后一道开放问答题。
30. 反问。

### 《参考解析》

**JDK/JRE/JVM**：JVM 是执行字节码的虚拟机，屏蔽平台差异；JRE 是 JVM + 核心类库 + 运行所需组件，只够运行；JDK 是 JRE + 编译器（javac）、调试与打包工具，够开发。Android 上代码经 dx/d8 转成 dex，由 ART 运行时执行（早期 Dalvik），并非标准的 HotSpot。

**类加载流程**：加载（读取字节流、生成 Class 对象）→ 验证（文件格式、元数据、字节码、符号引用）→ 准备（静态变量分配内存并设零值）→ 解析（符号引用转直接引用）→ 初始化（执行 `<clinit>`，静态变量赋初值与静态块）。之后类对象在方法区/元空间，直到对应的 ClassLoader 被回收才卸载。

**static 与类的生命周期**：Activity 对象被回收后，它的类通常仍被 ClassLoader 引用，不会卸载——类卸载要求该类的所有实例被回收、ClassLoader 可回收、无引用。静态变量属于类，生命周期与类相同，所以退出页面后静态变量仍然存在，值保留。这也是静态变量持有 Activity 会导致泄漏的原因。

**工作内存与主内存**：Java 内存模型规定每个线程有自己的工作内存（对应 CPU 缓存与寄存器），共享变量存在主内存，线程读写要先拷贝到工作内存。这带来可见性问题（一个线程的修改另一个线程看不到）、原子性问题（读改写被打断）与有序性问题（指令重排）。解决手段：synchronized、volatile、原子类、final、以及 `java.util.concurrent` 里的并发容器与工具。

**synchronized 与 Lock**：synchronized 是 JVM 关键字，自动加锁释放，非公平、不可中断、不支持超时与多条件；ReentrantLock 是 API 层实现，可公平/非公平、可 `tryLock` 超时、可中断、支持多个 Condition，但必须在 finally 中手动 unlock。简单互斥用 synchronized，需要高级能力时用 Lock。

**ThreadLocal**：每个线程持有 ThreadLocalMap，key 是 ThreadLocal 的弱引用、value 强引用。线程池里线程长期存活，key 被回收后 value 无法访问却无法释放，造成泄漏；规范是在 finally 中 `remove()`。

**线程池**：核心参数是 corePoolSize、maximumPoolSize、keepAliveTime、workQueue、threadFactory、handler。提交流程：核心线程未满则新建线程；满了入队；队列满且未达最大线程数则新建非核心线程；再满则执行拒绝策略。核心线程数按任务类型定：CPU 密集型约等于核数（或核数+1），IO 密集型按「核数 × (1 + 等待时间/计算时间)」估算，最终以压测为准。

**Handler 机制**：Handler 发送消息到 MessageQueue，Looper 死循环从队列取消息分发给 Handler 处理；主线程的 Looper 在 `Looper.prepareMainLooper()` 中创建并由 ActivityThread 启动。Message 用链表按 `when` 排序，支持延时与屏障消息（同步屏障优先处理异步消息，用于 VSYNC）。子线程更新 UI 通过 Handler 切回主线程。

**事件分发**：`dispatchTouchEvent` 负责分发，`onInterceptTouchEvent` 决定是否拦截，`onTouchEvent` 消费。返回 true 表示该层消费了事件，后续同一序列的 MOVE/UP 继续给它；返回 false 表示不消费，向上交给父容器。DOWN 事件没人消费时，后续事件不再下发。

**横竖屏与 ViewModel**：默认配置变更会销毁并重建 Activity，`onSaveInstanceState` 保存轻量状态。想避免重建可在 manifest 配 `configChanges` 自行处理；更推荐用 ViewModel 持有数据——它存在 `ViewModelStore` 中，由 `NonConfigurationInstances` 跨配置变更保留，Activity 重建时从 store 取回同一个实例，`onCleared` 才释放。ViewModel 的定位是承载与界面生命周期解耦、需要在配置变更后存活的数据与业务逻辑。

**MVVM**：Model 负责数据与业务，View 负责展示与用户输入，ViewModel 暴露可观察状态并处理交互逻辑，通过数据绑定或观察者把状态变化推给 View。数据流通常是单向的：View 触发事件 → ViewModel 更新状态 → View 观察状态刷新；双向绑定用于表单类场景。

**UI 刷新与合成**：应用层测量、布局、绘制生成 DisplayList，交给 SurfaceFlinger 通过 HWC 合成上屏；渲染线程（RenderThread）负责把绘制命令提交给 GPU。`invalidate()` 只是标记该 View 需要重绘并请求下一帧的 VSYNC，真正的绘制在下一个 VSYNC 到来时由 Choreographer 驱动，不是立刻执行。`postInvalidate()` 用于子线程。

**ANR**：应用主线程在规定时间内没有响应输入或广播/服务导致。常见触发：输入事件 5 秒、前台服务 20 秒、广播 10 秒（前台）/60 秒（后台）未处理完；主线程做耗时 IO、死锁、频繁 GC 也会导致。

**序列化**：跨进程传递的是字节流，对象必须转成可传输的格式；同时序列化用于持久化与网络传输。Android 常用 Parcelable（性能好、无反射）或 Serializable（简单、开销大），跨应用还应考虑版本兼容与安全校验。

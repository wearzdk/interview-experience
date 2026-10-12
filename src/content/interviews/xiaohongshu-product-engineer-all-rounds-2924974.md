---
title: "小红书 Product Engineer 两志愿面试全记录：C++/Android 深挖与 IM 卡片架构"
company: 小红书
position: Product Engineer（AI 与全栈方向）
round: 一二面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/d1a04cfc7c7c4715809b21659403399f
tags: ["全栈开发","C++","Android","Kotlin协程","IM架构","AI Coding","场景设计"]
summary: "小红书 Product Engineer 两志愿面试完整记录：一志愿 PE 基建（88 分钟）从 C++ 内存管理与智能指针问到 STL 容器选型、C++ 与 Java 并发容器差异、面向对象与多态、Dalvik/ART 与 GC 演进、Kotlin 协程实现、IPC 与 Binder、自研消息队列与 ProtoBuf、群聊卡片动态下发、AI Coding 工作流、Harness/Agent 框架本质与 RAG 检索选型，末尾手撕删除链表倒数第 N 个节点；二志愿 PE 国际化（58 分钟）围绕群聊破冰消息的二次请求设计、A/B 实验规模、卡片本地持久化、RecyclerView 资料错绑、IM 卡片架构改进、数字人 MV 链路与异常恢复、编辑一致性、Handler/MessageQueue/Looper 机制、Activity 生命周期与跳转顺序等问题展开。"
---

### 《面试题目》

一志愿 PE 基建（9.22，88min）：
1. 请做自我介绍，并说明快手实习是否仍在进行
2. C++ 的内存管理机制是什么？`new`/`delete` 与 `malloc`/`free` 有什么不同？
3. 智能指针有哪些？循环引用如何解决？还有其他办法吗？
4. vector/list/deque/map/unordered_map 分别适合什么场景？底层结构和复杂度怎样？
5. Java 的 HashMap/ConcurrentHashMap 和 C++ 的 unordered_map 有何不同？
6. C++ 中如何保证共享容器的线程安全？除了锁、原子和串行化还有什么思路？
7. 面向对象三大特征是什么？动态多态和静态多态如何实现？
8. Dalvik/ART 的执行机制、内存管理和 GC 如何演进？为什么这样演进？
9. Kotlin 协程的设计目的、状态机、挂起与恢复如何实现？
10. 进程间通信有哪些方式？Android 中有哪些常见 IPC？Binder 底层靠什么实现？
11. 个人消息队列解决什么问题？为什么使用 ProtoBuf？它的劣势和性能来源是什么？
12. 群聊卡片如何支持不发版动态新增？客户端、SDK 和数据层边界在哪里？
13. 是否接触过双端/跨端开发？
14. 快手实习中最重要的贡献和成果是什么？
15. AI Coding 的完整工作流怎样？复杂交互如何自动验证？
16. Harness/Agent 框架的本质是什么？
17. RAG 项目的使用场景是什么？RAG 有哪些问题？代码场景为什么常用符号/工具检索而非只用向量库？
18. 编程题：删除链表倒数第 N 个节点，并解释内存释放

二志愿 PE 国际化（10.12，58min）：
19. 群聊新人破冰消息为什么不由 IM 直接携带完整资料，而要二次请求？
20. 如果不考虑协议、隐私和包大小，两种方案哪种更合适，为什么？
21. 用户换设备登录后，历史破冰卡片如何恢复和渲染？
22. 该需求如何做 A/B 实验，实验规模和指标是什么？几百个样本是否足够？
23. 卡片消息在客户端本地如何持久化？UID、卡片资料和 IM 数据库是什么关系？
24. IM 消息字段不足以完整渲染时，怎样处理性能、缓存和批量请求？
25. RecyclerView 中资料错绑为什么发生？现有 ViewHolder/业务类型设计是什么样？
26. 现有 IM 卡片架构的问题在哪里？理想设计怎样避免异步回调错绑？是否需要修改 IM 协议？
27. 该需求有哪些稳定性和兼容性问题？历史消息删除和刷新如何处理？
28. 数字人 MV 的输入、服务端算法、客户端资源处理和回填链路是什么？
29. 网络中断、App 被杀、用户取消、参数错误等异常场景如何恢复和清理？
30. 录音尚未进入网络上传前发生异常，分段音频和工程状态怎样保存？
31. 「编辑一致性」具体指什么？什么情况下会不一致？解决方案是什么？
32. 数字人功能的核心指标是什么？最终是否已经上线？
33. 在实习和项目中如何使用 AI 编码、自测、需求拆分和问题定位？
34. 了解和使用过哪些 AI 厂商或模型，如何描述其当前能力？
35. Android Handler、MessageQueue、Looper 和 Message 如何协作？
36. MessageQueue 是否有优先级？消息如何排序和调度？
37. MessageQueue 为空时 Looper 是否空转？线程如何阻塞和唤醒？
38. Activity 的完整生命周期是什么？
39. 从 Activity A 跳转到 B 时，A 的 onPause、B 的创建/恢复和 A 的 onStop 顺序如何？

### 《参考解析》

**C++ 内存与智能指针这一组，要答出「为什么需要」而不只是「是什么」。** `new` 分配内存并调用构造函数，失败抛 `bad_alloc`；`malloc` 只分配原始内存、失败返回 NULL，且必须配 `free`（不能混用，否则未定义行为）。智能指针：`unique_ptr` 独占所有权、不可拷贝只可移动、零开销（与裸指针等价），是默认选择；`shared_ptr` 引用计数共享所有权，但计数是原子操作有开销，且**循环引用会导致内存永不释放**——解法是把环上一条边换成 `weak_ptr`（打破循环，同时用于缓存与观察者避免延长生命周期），或者从设计上避免双向强引用（父持有子用 `unique_ptr`，子回指父用裸引用/`weak_ptr`）。`shared_ptr` 还要注意 `enable_shared_from_this`（在类内需要返回自身时）与控制块的两段分配开销，以及多线程下对同一 `shared_ptr` 对象本身并发读写仍需同步（引用计数原子，但指针与计数不是一起原子的）。

**STL 容器选型要按访问模式与内存布局回答。** vector 连续内存、随机访问 O(1)、尾部摊还 O(1)、中间插入 O(n)，缓存友好是它最大的优势（这也是大多数场景默认用 vector 的原因）；list 是双向链表，任意位置插入删除 O(1)、但访问 O(n)、每节点有指针开销且缓存不友好，实践中用得很少；deque 分段连续、两端插入删除都是 O(1)，适合做队列；map/set 是红黑树、有序、O(log n)、迭代稳定；unordered_map/set 是哈希表、平均 O(1)、无序、最坏 O(n)。相比 Java 的 HashMap：C++ 的 unordered_map 迭代器在 rehash 时失效（Java 也失效但语义不同）、没有内置的并发版本（Java 有 ConcurrentHashMap 分段/CAS 实现）、Java 8 起链表长度超阈值转红黑树（最坏从 O(n) 降到 O(log n)），C++ 标准库实现没有这个优化，所以高冲突时要自己换哈希函数或开放寻址表。**共享容器的线程安全**除了锁/原子/串行化（把操作集中到单线程队列），思路还有：不可变数据结构 + 原子指针替换（RCU 思想，读无锁写复制）、分片（按 key 哈希到不同子容器各自加锁，降低锁粒度）、以及只读共享 + 写时复制（COW）。

**Dalvik/ART、协程与 Binder 是 Android 基础里最容易被追深的三个点。** Dalvik 用 JIT（解释执行 + 运行时编译热点方法），启动快但运行慢、耗电；ART 在 5.0 起默认 AOT（安装时全量编译成本地码），运行快但安装慢、占用空间大；7.0 起引入混合模式（安装时部分 AOT + 运行时 JIT + 热点方法落 profile 供下次后台 dex2oat 编译），兼顾安装速度与运行性能。GC 从 Dalvik 的串行/并发标记清除演进到 ART 的分代 + 并发复制（CC）、再到 Region 化的并发收集（CMS/CMC），目标始终是**缩短 Stop-The-World、减少碎片、降低前台卡顿**，这也是「为什么这样演进」的答案：移动端内存小、用户对卡顿敏感、还要省电。**Kotlin 协程**本质是「编译器把 suspend 函数改写成状态机 + Continuation 回调」，挂起点把后续代码包装成续体交给调度器（Dispatchers.IO/Default/Main），恢复时由调度器在目标线程执行续体；结构化并发保证父子协程的生命周期绑定与取消传播。**Binder** 是 Linux 内核里的字符设备驱动，一次拷贝（发送方把数据写进内核缓冲区，接收方 mmap 映射同一块内存读取，比管道/socket 的两次拷贝少一次），用 `ioctl` 通信，靠 `Parcel` 序列化，天然支持跨进程对象引用与死亡通知（`linkToDeath`）；上层 AIDL 生成 Stub/Proxy，调用时线程在 Binder 线程池（默认最多 16 个）中执行。

**「IM 卡片为什么不直接携带完整资料」是典型的架构权衡题。** 直接携带：一次请求拿到全部内容、渲染不依赖二次请求，但消息体变大（群聊大群会显著放大存储与下发流量）、资料会过时（用户改名换头像后历史消息仍是旧资料）、隐私与撤回更难处理。二次请求（只带 ID，客户端按 ID 拉资料）：消息轻、资料实时、可撤回与权限控制，但引入**依赖与性能问题**（资料服务不可用会导致消息渲染不完整、N 条消息 N 次请求、离线打开历史会话时请求风暴）。工程答案是分层混合：消息只带稳定标识与必要快照，客户端做**批量拉取 + 本地缓存（按 UID 缓存资料，带 TTL 与版本号）+ 预取**，并对失败做占位与降级（先渲染 ID/默认头像，资料到达后局部刷新）。这与面试官追问的「字段不足时如何处理性能、缓存和批量请求」是同一件事。**RecyclerView 的「资料错绑」根源是异步回调与 ViewHolder 复用竞态**：列表滚动复用了 ViewHolder，先前发出的资料请求在 ViewHolder 已被绑定到另一个 item 后才返回，回调里直接 `holder.name.text = ...` 就把 A 的资料写到了 B 上。正确做法是在 ViewHolder 里记录当前绑定的 item key（或用 `getItemId`/adapter position + tag），回调回来时校验「我请求的 key 是否还是这个 ViewHolder 当前展示的 key」，不匹配就丢弃；更彻底的设计是让数据层（Repository + 响应式流）保证「UI 只订阅某个 key 的数据」，UI 不直接接收异步回调。是否需要改 IM 协议，取决于能否在消息里带足够的稳定标识与版本号——如果连稳定标识都没有，就需要协议侧补充。

**Handler/MessageQueue/Looper、Activity 生命周期与跳转顺序。** Looper 是线程的消息循环（`Looper.prepare()` 创建与线程绑定的 MessageQueue，`loop()` 无限取消息），Handler 负责发送（`sendMessage`/`post`）与处理（`handleMessage`/`Runnable`），Message 从 Message 池中复用（`obtain()`）；**MessageQueue 按 `when` 时间戳排序（单向链表插入），不是优先级队列**，但可以通过 `Message.setAsynchronous` 与同步屏障（`postSyncBarrier`，仅系统可用）让异步消息插队——这正是「优先响应 UI 输入」的机制。队列为空时 `nativePollOnce` 会 park 住线程（不空转），有消息入队或到时间时通过 native 层唤醒（epoll + eventfd）。**Activity 生命周期**：onCreate → onStart → onResume → onPause → onStop → onDestroy（配置变更销毁重建会走 onSaveInstanceState/onRestoreInstanceState），A 跳 B 的顺序为：A.onPause → B.onCreate → B.onStart → B.onResume → A.onStop；返回时 B.onPause → A.onRestart → A.onStart → A.onResume → B.onStop → B.onDestroy。面试官问这个的真正意图是「你知道 onPause 之后不能再做重操作」，以及为什么新 Activity 要等 A.onPause 完成才启动（旧机制的串行保证，Android 9 起已可并行）。

**RAG 在代码场景为什么常用符号检索，答案是「代码是强符号化的领域」。** 用户搜函数名、类名、错误码、变量名时，需要的是**精确匹配**而不是语义相似；代码的语义泛化能力反而不重要（`getUserById` 和 `fetchUser` 语义近，但你要找的就是那一个符号）。所以主流做法是：符号级索引（用 LSP/语法树建立符号表）+ BM25/正则检索 + 少量向量检索补充自然语言注释与文档，再按调用关系做图扩展（找定义、找引用、找调用链）。这也解释了为什么纯向量库在代码场景效果差：它会把「语义相近但根本不是同一个符号」的结果排在前面，而工具的可信度取决于精确性。面试里可以补一句判据：**什么时候用向量——自然语言问答、模糊回忆；什么时候用符号——代码、型号、错误码、专有名词**，生产上永远是混合检索 + 重排。

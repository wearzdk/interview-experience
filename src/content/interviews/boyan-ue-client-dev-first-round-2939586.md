---
title: "博彦科技（腾讯萨罗斯项目）UE 客户端一面：GAS、UMG 与网络底层连环追问"
company: "博彦科技"
position: "UE 客户端开发"
round: "一面"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/e240f13c2d0c43fe9184df5c5a28fe63
tags: ["博彦科技","UE客户端","虚幻引擎","GAS","UMG","网络同步","外包","面经"]
summary: "11 月 11 日博彦科技外包腾讯萨罗斯项目 UE 客户端一面，约一小时，28 问全部压在底层实现：GAS 技能从输入到结束的流程与预测机制、预测 Key 的数据、UMG 与 Slate 的渲染链路、GPU 处理、客户端连接 Dedicated Server 的握手过程、UE 反射与 FProperty、网络模块与 RPC 底层、GC 可达性分析、红黑树、移动语义。"
---

### 《面试题目》

1. 自我介绍、项目介绍，以及围绕项目的提问。
2. GAS 中一个技能从输入到结束的完整流程是什么？
3. 技能结束时做了哪些操作？
4. GAS 框架包含哪些内容？
5. GAS 的预测（Prediction）机制是怎么实现的？
6. 预测过程中客户端在做什么？
7. 主要有哪些机制用来保证客户端与服务器执行一致且有效？
8. 预测 Key 包含哪些数据？
9. UMG 的 UI 是怎么实现的，包含哪些内容？
10. UMG 的底层实现是什么？
11. UI 渲染到屏幕上的过程是怎么执行的？
12. GPU 在这个过程中做了什么处理？
13. Gameplay 框架包含哪些内容？
14. 客户端连接 Dedicated Server 的过程是怎样的，具体怎么处理？
15. UE 的反射是怎么实现的？
16. CDO 是什么？
17. 虚幻属性系统中的 FProperty 是怎么实现的？
18. 虚幻的网络模块怎么实现、怎么使用？
19. RPC 的底层是怎么实现的？
20. UE 的 GC 怎么实现，具体怎么做可达性分析？
21. 普通函数调用的过程是什么？
22. 介绍一下多态。
23. 还有哪些多态？
24. 有哪些 Map？
25. 红黑树是怎么实现的？
26. 做过什么性能优化？
27. 移动语义和右值引用是做什么用的？
28. 用 AI 做过什么，具体怎么实现，了不了解 AI 架构？

### 《参考解析》

**GAS 的技能流程**：输入经 Enhanced Input 或绑定的 InputAction 调到 `AbilitySystemComponent::TryActivateAbility`，先做四类检查——`ActivationBlockedTags` 是否被阻塞、`ActivationRequiredTags` 是否满足、`CheckCost` 与 `CheckCooldown` 是否通过；随后进入 `ActivateAbility`，在里面 `CommitAbility` 正式扣除消耗与冷却（预测模式下先本地记一笔，等服务器确认），再施加 GameplayEffect、播放 Montage、生成投射物。结束时走 `EndAbility`：清理 `ActivationOwnedTags`、停 Montage、销毁临时 Actor、关闭预测窗口并回滚未被服务器确认的部分，最后广播 `OnAbilityEnded`。

**预测机制的本质是「先本地执行、再对账」**：客户端在本地立刻激活技能、施加 GE、播动画，同时由 ASC 分配一个 `FPredictionKey`，连同激活请求通过 `ServerTryActivateAbility` / `ServerSetReplicatedTargetData` 发给服务器。服务器权威执行后回 `ClientActivateAbilitySucceed` 或 `ClientActivateAbilityFailed`，客户端据此确认或撤销本地预测。属性侧用 `FGameplayAttributeData` 的 base 与 current 两套值，预测修改先挂在 pending 队列上，确认后转正、失败则丢弃。预测 Key 里存的是 ASC 分配的递增 ID 与预测窗口归属，作用是把本地这一次预测产生的一系列副作用和服务器回包配对；`ScopedPredictionWindow` 一结束，这个 Key 就失效，后续操作不能再挂在它名下。

**客户端与服务器的一致性靠「权威 + 预测 + 回滚 + 复制」四件事**：状态以服务器为准，客户端只做临时预测；GameplayCue 在本地先播、服务器再广播；Montage 与 Root Motion 走复制并带预测窗口；位移交给 Character Movement 的 Network Prediction，其余属性走 property replication 与 RPC。任何一环缺少回滚路径，玩家就会看到「先加血又掉回去」这类抖动。

**UMG 到屏幕的链路**：UMG 是 Slate 的 UObject 包装，`UWidget` 树在 Tick 与 Prepass 阶段算出布局（Slate 的 `FGeometry` 与 `ArrangeChildren`），Paint 阶段生成 `FSlateDrawElement`，再按材质与纹理合批成 `FSlateRenderBatch`；Slate RHI Renderer 把批次写成顶点 / 索引缓冲，提交到 RHI 命令列表。GPU 侧做的是正交投影下的顶点变换、字体图集与笔刷纹理采样、Alpha 混合、Scissor 裁剪，最后输出到 backbuffer 并 Present。UI 的性能瓶颈通常在合批被打断（不同材质、不同纹理交替）与过度绘制，而不是顶点数。

**客户端连接 Dedicated Server**：`ClientTravel` 发起 Browse，解析出 IP 与端口后创建 `IpNetDriver` 与 UDP socket，进入 `StatelessConnectHandshake`——客户端发 `NMT_Hello`（带网络版本、加密标志），服务器回 Challenge（含 cookie），客户端带 HMAC 回 `NMT_Login`，校验通过后服务器 `PostLogin` 创建 PlayerController，随后同步世界（NetGUID 映射）、发 `NMT_Join`，客户端进图并开始 Actor Channel 复制。握手用无状态 cookie 是为了防 IP 伪造与放大攻击。

**反射与 FProperty**：UHT 扫描 `UCLASS` / `UPROPERTY` / `UFUNCTION` 宏，生成 `.generated.h` 与注册代码；运行时每个类对应一个 `UClass`，属性链是一串 `FProperty`，每个 `FProperty` 记录偏移、类型、尺寸、标志位，并通过 `ContainerPtrToValuePtr` 在对象内存上定位字段。序列化、网络复制、GC 引用收集、蓝图与编辑器面板全部复用这份元数据，所以它是整个引擎的地基。CDO（Class Default Object）是每个 `UClass` 初始化时生成的默认实例，存放属性默认值，`GetDefault<T>()` 取到的就是它，子类与蓝图以它为模板继承。

**GC 的可达性分析**：UE 用增量式 mark-sweep。根集包括全局对象、`FGCObject` 持有的引用、以及栈上被 `AddReferencedObjects` 报告的 UObject；标记阶段从根集出发，沿 `FProperty` 里的对象引用做广度遍历，把可达对象打上标记；为了不卡帧，标记被切成多个时间片，UE5 还支持多线程标记。未被标记的对象进入待回收队列，Purge 时统一析构。因此「UObject 被谁引用」必须显式可被反射看到，裸指针存在容器里而没加 `UPROPERTY`，对象就会被提前回收。

**普通函数调用与多态**：x64 下前六个整型参数走 rdi、rsi、rdx、rcx、r8、r9，浮点走 xmm0 到 xmm7，多余的压栈；`call` 压入返回地址并跳转，被调方 prologue 保存 rbp、分配栈帧，执行完 epilogue 恢复并 `ret`。虚函数通过对象头部的 vtable 指针间接寻址，非虚函数直接 call 或被内联。多态分动态与静态：动态多态是虚函数加继承，运行期按实际类型分派；静态多态是函数重载、模板与 CRTP，编译期确定。

**红黑树与 Map**：红黑树是自平衡二叉搜索树，满足根黑、叶黑、红节点的子节点必黑、任一节点到叶子的路径黑节点数相同这几条性质，插入与删除靠旋转加变色把树高压在 `2log(n+1)` 以内，查找、插入、删除都是 `O(log n)`。C++ 里 `std::map` 是红黑树、`std::unordered_map` 是哈希表；UE 的 `TMap` 是开放寻址哈希表，`TMultiMap` 允许重复键，需要有序遍历时才用 `TSortedMap`。

**移动语义**：右值引用 `T&&` 能绑定临时对象，`std::move` 只是把左值转成右值引用，真正的搬家发生在移动构造与移动赋值里——窃取对方的堆指针、把对方置空，避免深拷贝。容器扩容、函数返回大对象、`std::unique_ptr` 传递都靠它；配合 `std::forward` 还能做完美转发，把参数的值类别原样传下去。

**性能优化**：先定位再动手——用 Unreal Insights 与 stat 命令看是 CPU 的 GameThread、RenderThread 还是 GPU 受限。常见手段包括合批降低 Draw Call、按距离做 LOD 与 Nanite、对象池复用 Actor 与 UObject、把 Tick 改成定时器或事件驱动、避免在 Tick 里做 `FindObject` 与字符串拼接、异步加载资源、控制 GC 压力（减少常驻 UObject 数量）。

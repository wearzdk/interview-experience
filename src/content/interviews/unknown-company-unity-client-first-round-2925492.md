---
title: "Unity 客户端开发实习面经（一面即拿 offer）"
company: "未知公司"
position: "Unity客户端开发"
round: "一面"
date: '2026-10'
result: "已拿 offer"
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/956af1ffc2b745ad84ed76c7ff2b6dbc
tags: ["Unity","C#","渲染管线","动画系统","AssetBundle","性能优化","客户端"]
summary: "Unity 客户端开发实习面经（作者自述春招只面了一面就拿到 offer，两位面试官氛围很好）：问题覆盖委托与事件、渲染管线、Profiler 与调试、动画组件与 Animator 状态机、AB 包与 Lua/AA 加载、值类型与引用类型、抽象类与接口、Unity 生命周期与三种 Update。"
---

### 《面试题目》

1. 自我介绍
2. 委托和事件的区别？
3. 渲染管线的流程是怎样的？
4. Unity 调试工具有哪些？Unity Profiler 怎么用？
5. Unity 动画相关的组件有哪些，怎么使用？
6. Transform 控制移动和制作的动画同时执行，结果会怎么样？
7. Animator 状态机控制连线，所有连线都是 true，最后会是什么效果？
8. 了解粒子系统吗？
9. AB 包相关的问题，以及 Lua、AA（Addressables）加载是怎么做的？
10. 值类型和引用类型的区别？
11. 抽象类和接口的区别？
12. Unity 生命周期是怎样的？
13. 三种 Update 的区别？
14. 现在在玩哪些游戏？
15. 我们比较缺做动画相关的人，你感不感兴趣？

### 《参考解析》

**委托与事件**：委托是类型安全的函数引用（本质上是一个继承自 `MulticastDelegate` 的类，带调用列表与 `Invoke` 方法），可以把方法当参数传递、支持多播；事件是对委托字段的封装，外部只能通过 `+=` / `-=` 订阅，不能直接赋值（外部无法清空订阅列表）也不能在声明类之外触发调用，从而保护发布者的控制权。使用上的要点：多播委托的返回值只取最后一个订阅者的结果，所以需要返回值时应该用带聚合逻辑的调用方式；事件触发前必须判空（或用 `?.Invoke`，注意 `?.` 与 `-=` 的竞态）；订阅了就要在 `OnDestroy` / `OnDisable` 里取消订阅，否则静态事件会让对象无法被 GC，这是 Unity 里最常见的内存泄漏来源之一。顺带准备 `Action`/`Func` 泛型委托、闭包捕获变量造成的额外分配，以及 C# 事件与 UnityEvent 的差异（后者可在 Inspector 里配置、支持序列化）。

**渲染管线流程**：按应用阶段 → 几何阶段 → 光栅化阶段 → 逐片元操作来说。应用阶段在 CPU 侧完成：剔除（视锥剔除、遮挡剔除）、排序（按渲染队列、材质、距离排以减少状态切换）、设置渲染状态、把可见物体的顶点数据与变换矩阵提交给 GPU（合批、Instancing、SRP Batcher 都是为了减少这一步的开销）。几何阶段：顶点着色器做顶点变换（模型空间 → 世界 → 观察 → 裁剪空间）、裁剪、透视除法与屏幕映射。光栅化阶段把三角形离散成片元并做插值。逐片元操作包括片元着色器计算颜色、模板测试、深度测试、混合，最后写入帧缓冲。Unity 侧还能展开讲：内置管线与 SRP（URP/HDRP）的区别、URP 的 Renderer Feature 与 Render Pass 组织方式、透明物体为何要排序、Overdraw 与 Early-Z 的取舍、以及 Draw Call 与 SetPass Call 的优化手段（图集、共享材质、减少实时阴影与后处理）。

**动画系统与「动画和代码同时改 Transform」**：Unity 常用组件有 `Animator`（推荐，基于状态机与 Avatar，支持动画重定向、Layer 与 Avatar Mask、根运动、IK）、`Animation`（旧版，直接播放 AnimationClip）、`PlayableDirector`/Timeline（做演出与过场）、以及 `AnimationEvent`（在动画时间轴上回调代码）。Animator Controller 里状态之间由 transition 连线控制，每条连线有条件（参数比较、Has Exit Time、过渡时长）；如果所有连线的条件恒为 true 且没有 Exit Time，状态机会在同一帧内反复满足条件，表现为动画在多个状态之间快速抖动或停在优先级最高的那一条——所以状态机设计要保证条件互斥，或者用 Exit Time 与过渡中断来控制。Transform 同时被代码与动画驱动时结果取决于更新顺序：动画系统默认在 Update 之后、LateUpdate 之前采样并写入 Transform，因此代码在 `Update` 里改位置通常会被动画覆盖，而在 `LateUpdate` 里改则会生效但可能造成抖动；正确做法是不要让两者抢同一个属性——位移用代码、姿势用动画，或用 Animator 的根运动、OnAnimatorMove 回调统一接管。

**AssetBundle、Addressables 与 Lua 热更**：AB 包的常见问题围绕分组、依赖与生命周期：分组要按「同时加载、同时卸载」的原则，公共依赖下沉到共享包避免重复打包（用工具看包体与依赖图），否则同一资源打多份会撑大包体；加载要处理依赖链（先加载依赖包再加载资源）、引用计数与卸载（`AssetBundle.Unload(false)` 只卸包体、实例还在，`Unload(true)` 会连实例一起销毁，用错就是常见的资源丢失或内存涨）、以及异步加载的句柄管理。Lua 方案（xLua / ToLua / SLua）通常把逻辑写在 Lua 里做热更，C# 提供接口与框架层，要注意跨语言调用开销、GC 与生命周期绑定。Addressables 是在 AB 之上的管理层，提供可寻址的 key、依赖自动收集、引用计数、Catalog 与远程内容更新、以及通过 `AsyncOperationHandle` 统一管理加载释放；面试常追问「热更流程怎么走」（打差异包、上传 CDN、拉 Catalog、校验版本与哈希、灰度与回滚）。

**C# 语言基础与 Unity 生命周期**：值类型存在栈或内联在对象里，赋值是拷贝，引用类型变量存的是堆上对象的地址，赋值是共享引用；由此引出装箱拆箱（值类型转 `object` 会在堆上分配，UI 与每帧逻辑里要避免）、`struct` 作为字典 key 的相等性、以及 `string` 的不可变性与拼接产生垃圾。抽象类用于「是什么」——可以带字段、构造函数与实现，单继承；接口用于「能做什么」——只声明契约、可多实现，适合能力扩展与解耦，C# 8 之后接口也能有默认实现但工程上仍以契约为准。Unity 生命周期顺序：`Awake`（对象实例化时，做自身字段与引用初始化）→ `OnEnable` → `Start`（第一帧 Update 前）→ `FixedUpdate`（固定时间步，物理计算与刚体移动放这里）→ `Update`（每帧一次，输入与逻辑）→ `LateUpdate`（每帧在 Update 之后，相机跟随与依赖其他对象更新结果的操作）→ `OnDisable` → `OnDestroy`；另外 `OnGUI`、协程（`yield` 在 Update 之后、LateUpdate 之后继续）、`OnApplicationPause`/`OnApplicationQuit` 也要能说出时机。常见坑：把物理放在 Update、在 Awake 里访问还没就绪的其他对象、以及大量对象各自 Update 造成的调用开销（可以用管理器统一驱动）。

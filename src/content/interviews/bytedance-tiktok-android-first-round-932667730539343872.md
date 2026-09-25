---
title: 字节TikTok社交Android一面 从性能埋点到RecyclerView缓存
company: 字节跳动
position: Android客户端开发
round: 一面
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/932667730539343872
tags: ["Android","RecyclerView","View.post","性能优化","埋点","HTTP"]
summary: "字节 TikTok 社交一面：前半程围绕实习项目的渲染方案与性能埋点，追问扫码到渲染的耗时归因；后半程是 View.post 与 Handler.post 的差异、RecyclerView 缓存机制与缓存池场景题，以及 HTTP 状态码。"
---

### 《面试题目》

1. 讲讲你实习期的项目。
2. 你了解过实习业务线用的页面框架吗？
3. 这些页面是 Lynx 渲染还是 Native 渲染的？
4. 你项目里这个需求，是在你们自己的团购垂搜里，还是用新页面去承接？
5. 聊聊埋点，性能埋点里你们怎么定义性能指标？
6. 用户从扫二维码到渲染结束中间有非常多环节，你该怎么定位是哪个环节的性能出了问题？
7. 这些阶段的实际耗时该怎么算出来？
8. 性能埋点一定会有一条链路通用一套埋点的做法，不同场景可以用同一种方式去跟进吗？
9. 你用过 View.post 吗？
10. View.post()、View.postDelayed()、Handler.post()、Handler.postDelayed() 这四个有什么区别？
11. View.post() 为什么能保证在 View 测量布局完成后执行？
12. 在 onResume() 里调 View.post() 去拿 View 的宽高，能拿到吗？
13. 推后台再切回前台，用 Handler.post() 能拿到吗？
14. 介绍一下 RecyclerView 的缓存机制。
15. HTTP 常见错误码有哪些？
16. 506 是什么含义？
17. 451 是什么含义？
18. 场景题：一个页面里有 3 张卡片可见，上下没露出的还有 5 张卡片，这时候 RecyclerView 的列表缓存池设置多少合适，为什么？
19. 场景题：总共 5 张卡片、上下各 1 张，我往上划一下可能两张消失，这时候生命周期回调是怎么样的，缓存池怎么表现？
20. 刚才上划消失的卡片，现在又划回来，它又是怎么处理的？

### 《参考解析》

**四个 post 方法的区别**：它们最终都进主线程的消息队列，但入队方式不同。View.post 走 View 自己的机制：View 已经 attach 到窗口时，任务交给 AttachInfo 里的 handler（也就是 ViewRootImpl 的 handler）；还没 attach 时，任务先存进 View 的待执行队列，等 dispatchAttachedToWindow 时再交给同一个 handler。View.postDelayed 与它同一套机制，只是带延迟。Handler.post 则是直接往某个 Looper 的消息队列尾部塞一条消息，与 View 的 attach 状态无关。这个差别决定执行时机：View.post 的任务能排在当前这一帧的 traversal 之后，而裸的 Handler.post 只保证「主线程轮到它的时候执行」。

**为什么 View.post 能拿到宽高**：ViewRootImpl 的 traversal 本身就是一条消息，测量、布局、绘制都在这一条消息里完成。View.post 无论 attach 前还是 attach 后调用，最终都是把任务 post 到 ViewRootImpl 的 handler 上，于是在消息队列里排在这帧 traversal 之后，任务执行时宽高已经测量完成。在 onResume 里调用同样可以——Activity 的 onResume 早于 window 被 addView，此时 View 还没 attach，任务会进待执行队列，等第一次 traversal 触发 attach 时再交给 handler 执行，依然在测量之后。反过来说，在 onResume 里直接 Handler.post，消息很可能排在 traversal 之前，拿到的宽高就是 0。至于推后台再切回来，View 已经 attach，Handler.post 拿到的可能是上一次测量留下的旧值（尺寸尚未按新的窗口状态更新），View.post 则仍然排在本次 traversal 之后——面试官想区分的正是这一点：一个是「有值但可能过期」，一个是「保证是最近一次布局的结果」。

**RecyclerView 的缓存机制**：可以按四级缓存加预取来讲。第一级是 mAttachedScrap 与 mChangedScrap，存放还在屏幕上、只是重新布局时要复用的 ViewHolder，不需要重新绑定。第二级 mCachedViews 默认容量 2，缓存刚划出屏幕的 ViewHolder，按位置匹配，回来时不用重新 bind，本质是「离屏一屏内的快速复用」。第三级 ViewCacheExtension 是留给业务自定义的扩展点，框架不自带实现。第四级 RecycledViewPool 按 viewType 分池，每个类型默认 5 个，进池的 ViewHolder 数据会被清空，复用时必须重新 onBindViewHolder。再叠加 LayoutManager 配合 GapWorker 做的预取（在滑动间隙提前创建或绑定下一屏的 item）。理解这条链的关键是分清两件事：复用要不要重新 bind，以及缓存是按位置匹配还是按类型匹配。

**两个场景题的答法**：缓存池大小的估算依据是「同一个 viewType 在一屏内可能出现的最大数量，加上预取量」。3 张可见、上下各还有几张，意味着同类 ViewHolder 一屏内最多可能同时存在 8 个左右，默认的 5 不够，滑动时会不断触发 onCreateViewHolder，也就是反复 inflate 布局，可以把池调到能覆盖这个数量；但池子开太大只占内存——池里的 ViewHolder 数据被重置，复用时照样要 bind，多出来的只是省掉 inflate 的收益。所以回答要先给依据（一屏同类 item 数乘以 viewType 数量），不要只报一个数字。第二个场景考的是「划出屏幕」的判定：item 完全离开可见区域后，LayoutManager 在布局的回收阶段把它 detach，先尝试放进 mCachedViews，满了才进 RecycledViewPool，对应 viewType 的池也满了就直接丢弃、等下次重新创建，onViewRecycled 会在这时回调。划回来时顺序相反：先按位置查 mCachedViews（命中就直接 attach、不 bind），没命中再从池里取（要 bind）或新建。所以短距离划出再划回通常不会重新绑定，滑得越远越容易触发重建——这也是复杂 item 必须把 bind 成本压下去的原因。

**性能埋点与全链路耗时归因**：埋点首先要定义清楚指标口径：是首帧、可交互，还是关键内容可见？口径不统一，跨团队看同一张报表就会吵架。实现上要用单调时钟（避免系统时间被改动）、在每个阶段的起止各打一个点、用同一个 traceId 串起整条链路，端上还要区分冷启动与热启动、以及缓存命中情况。定位「扫码到渲染结束是谁的锅」这类问题时，思路是把链路拆成可归因的段：扫码识别、路由与页面创建、网络请求、数据解析、渲染与首屏可见，每段用自己的埋点上报，再用端到端的整体耗时做校验，两边对不上的差值就是还没被覆盖的环节。至于不同场景能不能共用一套埋点：框架级的通用阶段（页面创建、网络、渲染）应该共用一套 SDK 保证可比性，但业务特有的阶段必须允许扩展自定义段，否则要么口径失真，要么每个场景各写一套、无法横向对比。

**HTTP 状态码**：1xx 信息、2xx 成功、3xx 重定向、4xx 客户端错误、5xx 服务端错误。容易混的几组：401 未认证与 403 已认证但无权限；502 网关从上游拿到非法响应、503 服务不可用（过载或维护，常带 Retry-After）、504 网关等待上游超时。题目里的两个冷门码，506 表示内容协商出现循环——服务器把请求指向了一个本身又要协商的变体，属于配置错误；451 表示因法律要求不可用，常见于按地域封锁内容。这两个属于见过就答得出、没见过就老实承认的题，答不出来不致命，但要把 4xx 与 5xx 的边界讲清楚。

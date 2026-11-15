---
title: "猫眼前端一面：从 Flex 与 Grid、HTTP 缓存问到 SSE 同源连接上限与虚拟列表"
company: 猫眼
position: 前端开发
round: 一面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/8450f7fdbcd3427c9426e39b1c31e0ef
tags: ["猫眼","前端","一面","CSS布局","HTTP缓存","事件循环","React","SSE","手撕"]
summary: "猫眼前端一面按模块推进：布局模式、Flex 与 Grid 的差异、2C 适配与兼容，强缓存与协商缓存、事件循环与一道计时器顺序题；React 问虚拟 DOM、Diff 与虚拟列表；SSE 连问原理、与 WebSocket 的区别、Tab 内连接生命周期与同源连接上限；末尾问前端竞争力并手写深拷贝。"
---

### 《面试题目》

**自我介绍与项目经历**

1. 请简单自我介绍一下，并介绍你的技术方向和主要实习经历。

**CSS 与布局适配**

2. 我们常用的布局模式有哪些？
3. Flex 和 Grid 有什么区别，差异点在哪里？
4. 有没有做过 2C 的开发？
5. 你了解哪些页面适配或兼容性上经常遇到的问题？

**HTTP 缓存**

6. 强缓存和协商缓存的原理分别是什么？

**事件循环**

7. 什么是浏览器的事件循环？
8. 看左侧这段计时器代码，以注释形式写出打印顺序，并说明为什么是这个顺序。

**React**

9. React 的虚拟 DOM 和 Diff 算法原理是什么？Diff 的优化策略是什么？
10. React Window 的虚拟列表核心原理是什么？可视区渲染是怎么计算需要渲染的？

**SSE 与 WebSocket**

11. 讲一下 SSE 的原理。
12. SSE 和 WebSocket 有什么区别？
13. SSE 在浏览器 Tab 里的连接生命周期是什么样的？
14. 每个 Tab 是独立的连接实例吗？
15. 同源情况下浏览器最多可以建立几个连接？

**前端能力与 AI**

16. 你觉得目前前端工程师的核心竞争力会往哪些方向转移？
17. 你觉得需要建立哪些能力（比如表达能力），才不容易被替代？
18. 你怎么保证 AI 生成代码的准确性？

**手撕**

19. 手写深拷贝。
20. 另有一道手写题，题面较难复述，帖主判断是按简历交给 AI 生成的。

**反问**

21. 反问环节：业务方向与转正情况。

### 《参考解析》

**布局模式与 Flex、Grid 的取舍**：常用布局包括普通文档流、浮动、定位、Flex、Grid 与多列布局。Flex 是一维布局，沿主轴分配空间，靠 `flex-grow` / `flex-shrink` / `flex-basis` 控制伸缩，`justify-content` 与 `align-items` 分别管主轴与交叉轴，适合导航栏、居中对齐、等高列、间距均分的工具条。Grid 是二维布局，同时定义行与列，`fr` 单位按比例分配剩余空间，`grid-template-areas` 可以直接描述页面骨架，`minmax()` 配合 `auto-fit` 能写出不依赖媒体查询的自适应卡片墙。区别的实质是「一维分配」与「二维定位」：只需要一个方向的伸缩用 Flex，需要行列同时对齐、或要让子项跨行跨列用 Grid；两者可以嵌套，页面骨架用 Grid、内部组件用 Flex 是常见组合。

**2C 页面的适配与兼容**：移动端要先设 viewport，尺寸单位在 rem、vw、百分比之间选一套并统一；安全区用 `env(safe-area-inset-*)` 处理刘海与底部横条；iOS 上 `100vh` 包含地址栏高度导致内容被截，改用 `100dvh` 或 JS 计算；`position: fixed` 在软键盘弹出时会错位；1px 边框在高 DPR 屏上要用 `transform: scale` 或 `box-shadow` 模拟；低端安卓与微信内置浏览器的内核版本偏旧，`gap` 在旧版 Flex、`:has()`、容器查询等特性需要查兼容表或做降级。2C 还要考虑弱网下的图片体积、首屏骨架与字体加载，以及不同系统字体渲染造成的行高差异。

**强缓存与协商缓存**：强缓存命中时浏览器直接使用本地副本，不发请求，由 `Cache-Control: max-age`（`s-maxage` 针对共享缓存）或更早的 `Expires` 控制，`no-store` 完全禁止缓存、`no-cache` 表示可以缓存但每次必须校验、`immutable` 表示在有效期内不校验。协商缓存每次带校验字段询问服务端：`If-Modified-Since` 对应 `Last-Modified`（秒级精度，文件内容未变但修改时间变化会误判失效），`If-None-Match` 对应 `ETag`（内容指纹，更准确，弱 ETag 允许语义等价）。未变更时返回 304 且不带响应体。优先级上 `Cache-Control` 高于 `Expires`、`ETag` 高于 `Last-Modified`。工程做法是静态资源用内容哈希命名，配 `max-age` 一年加 `immutable`；HTML 入口用 `no-cache`，保证发版后能立刻拿到新的资源引用。

**事件循环与打印顺序**：调用栈同步执行，遇到异步任务按类型入队：宏任务包括整段 script、`setTimeout`、`setInterval`、I/O 与 UI 事件回调，微任务包括 `Promise.then`、`queueMicrotask`、`MutationObserver`。每轮取出一个宏任务执行，执行完立即清空微任务队列（清空过程中新产生的微任务也一并执行），然后进行渲染，再进入下一轮。因此 `Promise.then` 总是先于同层的 `setTimeout`，`async` 函数中 `await` 之后的代码等价于 `then` 的回调，进入微任务。计时器题还要注意 `setTimeout(fn, 0)` 的延时是最小值而非精确值，嵌套层级超过五层时浏览器会把最小间隔钳到 4 毫秒，所以两个同延时定时器的先后只由注册顺序决定。

**React 虚拟 DOM 与 Diff**：虚拟 DOM 是用普通对象描述 UI 结构，状态变化时生成新树并与旧树比较，把差异合并成一次提交，减少直接操作真实 DOM 的次数。Diff 采用启发式规则把复杂度压到 O(n)：只做同层比较，不跨层级移动节点（跨层视为删除后重建）；元素类型不同则整棵子树替换；同层子节点靠 `key` 匹配，没有 `key` 时按位置对比。优化策略包括保持 `key` 稳定（不要用数组下标，否则插入会导致后续节点全部重渲染）、用 `React.memo`、`PureComponent`、`shouldComponentUpdate` 阻断无效更新、把大列表拆成子组件、以及 Fiber 架构把渲染拆成可中断的小单元以优先响应交互。需要说明的是虚拟 DOM 并不比精心手写的 DOM 操作更快，它的价值在于声明式写法、可维护性与跨端渲染。

**虚拟列表的可视区计算**：核心是只渲染可视区加上下若干条缓冲（overscan），其余用占位高度撑开滚动条。定高场景下，`startIndex = floor(scrollTop / itemHeight)`，可视条数为 `ceil(viewportHeight / itemHeight)`，结束下标再加上缓冲条数；列表总高为 `itemCount * itemHeight`，渲染出的列表用 `transform: translateY(startIndex * itemHeight)` 或等高的 padding 顶到正确位置。不定高场景先按预估高度铺满，实际渲染后测量并缓存真实高度，维护一份位置前缀和数组，滚动时用二分查找定位起始下标，测量结果变化时修正总高度。React Window 的 `FixedSizeList` 与 `VariableSizeList` 就是这两种实现，难点集中在滚动时的抖动控制与动态高度回填。

**SSE、WebSocket 与同源连接上限**：SSE 基于普通 HTTP，响应头为 `Content-Type: text/event-stream`，服务端以 `data:`、`event:`、`id:`、`retry:` 等字段持续写入文本，浏览器用 `EventSource` 接收，断线后自动重连并带上 `Last-Event-ID` 以便续传。它是单向的（服务端到客户端），客户端要发消息需另开接口；协议简单、能走 HTTP/2、天然支持重连与文本流，适合通知、进度、行情这类推送。WebSocket 通过 `Upgrade` 握手升级为全双工连接，支持二进制帧，延迟更低，但心跳、重连、鉴权都要自行实现。连接生命周期上，`new EventSource(url)` 时建立，页面卸载或 Tab 关闭时连接随之关闭，网络中断后按 `retry:` 指定的间隔自动重连；每个 Tab 各自持有一个 `EventSource` 实例，即独立的连接。同源并发连接数在 HTTP/1.1 下每个域名通常为 6 个（Chrome、Firefox 均如此），多个 Tab 同时开 SSE 很容易把配额占满，导致同域的其他请求排队；HTTP/2 下多路复用，上限由 `SETTINGS_MAX_CONCURRENT_STREAMS` 决定，常见为 100 以上，因此生产环境应把 SSE 部署在 HTTP/2 上，或让多 Tab 通过 `SharedWorker` / `BroadcastChannel` 共享一条连接。

**深拷贝**：基本类型直接返回；对象用递归加 `WeakMap` 记录已拷贝的引用，解决循环引用与重复引用；`Date`、`RegExp`、`Map`、`Set`、`ArrayBuffer` 等内建类型需要单独分支处理；数组与普通对象递归拷贝自身可枚举属性，函数通常直接引用而不复制。要保留原型与属性描述符时，用 `Object.create(Object.getPrototypeOf(obj))` 配合 `Object.getOwnPropertyDescriptors` 定义属性，这样 getter / setter 与不可枚举属性不会丢失。`structuredClone` 是原生方案，支持循环引用与多数内建类型，但不支持函数、Symbol 与 DOM 节点。`JSON.parse(JSON.stringify())` 会丢掉 `undefined`、函数与 Symbol，把 `Date` 变成字符串，遇到循环引用直接抛错，不能作为通用实现。

**前端竞争力与 AI 生成代码的准确性**：能力重心从「写得出」转向「定义得准、判断得对」：能否把模糊需求拆成可验证的边界、能否在性能、可访问性、兼容性之间做取舍、能否读懂并改造已有系统。保证 AI 生成代码的准确性，靠流程而非信任：给足上下文与接口契约，一次只生成一个可验证的小块；用类型检查、lint 与单元测试把低级错误挡在提交前；对关键路径用真实数据跑一遍，而不是只看代码是否通顺；遇到不熟悉的 API 查官方文档核对签名与边界；把反复出现的写法沉淀为项目内的模板与规范，让生成结果落在既有约定里。

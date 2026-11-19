---
title: "字节 Seed 安全前端一面：WebSocket 建联、长列表渲染与请求队列手撕"
company: 字节跳动
position: 前端开发
round: 一面
result: 挂
date: '2026-11'
collectedAt: '2026-11-19'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/59611f33d9dd49f6af9ad1ac90e9fb1f
tags: ["字节跳动","前端","JavaScript","WebSocket","React","TypeScript","WebWorker","手撕代码"]
summary: "字节 Seed 安全前端一面（11.09，1 小时，飞书），八股全部嵌在场景里追问：Cesium 的 DOM 事件原理、事件捕获冒泡、事件循环与宏微任务、async/defer、闭包；WebSocket 与 HTTP 的区别、SSE、指数退避重连、建联鉴权链路；React 生命周期、虚拟 DOM、性能指标、懒加载与万张图片的长列表；TypeScript 泛型与 any/unknown；zustand、TanStack Query、localStorage、Web Worker；最后手撕一个限并发 3 的请求队列。"
---

### 《面试题目》

1. 自我介绍。
2. 描述两段实习中自认为较难的一个事情。
3. 航线编辑器用到的技术栈是什么？
4. Cesium 透出了很多 DOM 事件，其背后原理是什么？用到了哪些技术？
5. DOM 事件的捕获、目标、冒泡阶段分别是什么？
6. 如何定义事件循环？
7. 哪些是宏任务？哪些是微任务？
8. setTimeout 和 setInterval 属于什么任务？
9. Promise.all、allSettled、race 的区别及使用场景？
10. async 和 defer 的技术概念及业务使用场景？
11. 描述闭包，以及闭包的实际使用场景。
12. WebSocket 与 HTTP 的区别？
13. HTTP 是否无法主动向客户端发送请求？
14. 是否了解 SSE？
15. 解释简历中描述的指数退避重连及实际代码逻辑。
16. HTTP 可以加 authorization 请求头，WebSocket 是否也可以加？
17. WebSocket 建联是否需要身份？完整建联链路是什么？
18. React 的基础生命周期。
19. 如何定义虚拟 DOM？
20. 页面卡顿需要优化时，可以看哪些指标？
21. 懒加载如何实现？
22. 长页面滚动场景下，1 万张图片如何在首页打开时快速渲染而非同时加载？
23. 计算视口时一般用到哪个参数？
24. 是否熟悉 TypeScript？解释泛型。
25. 泛型是否会导致项目里都是 T？
26. any 与 unknown 的区别及使用时机？
27. 简历中 zustand、TanStack Query 是怎么用的？介绍项目中的数据管理及跨组件共享数据的场景。
28. localStorage 与 sessionStorage 的区别、容量大小及超出后的处理？
29. 简历中提到使用了 Worker，介绍其用法。
30. Worker 与主线程如何交换数据？
31. 第二个 CSS 编译器场景展开说明。
32. 浏览器输入链接后背后发生了什么？简述核心节点及前端视角下的页面构建过程。
33. 输入链接后是否直接到达 HTML？中间还有哪些步骤？
34. 一个域名就能接到服务器吗？
35. 使用 skills 编排 AI 写作的场景与出发点？
36. 手撕：实现请求队列 `createRequestQueue`，最多同时执行 3 个请求，超出排队。
37. 反问：业务、代码规范与流水线严格程度、AI 产出大量代码如何保证线上不出问题、AI 报销政策、学习建议。

### 《参考解析》

**事件流与 Cesium 的 DOM 事件**：DOM 事件分捕获（从 window 向下到目标父节点）、目标、冒泡（向上回传）三阶段，`addEventListener` 的第三个参数 `capture` 决定在哪一阶段触发。Cesium 渲染在 canvas 上，内部通过监听 canvas 的鼠标、滚轮、触摸事件，再结合相机矩阵做射线拾取，把屏幕坐标换算成三维场景中的对象；它对外暴露的「DOM 事件」实际是这层封装后再分发的自定义事件。

**宏任务与微任务**：宏任务是 script 整体、setTimeout、setInterval、I/O、UI 渲染；微任务是 Promise 回调、queueMicrotask、MutationObserver。每轮先执行一个宏任务，再清空微任务队列，然后才可能渲染。setTimeout 与 setInterval 属于宏任务。

**async 与 defer**：两者都异步下载脚本，不阻塞解析。async 下载完立即执行，执行顺序不确定，适合独立无依赖的脚本（统计、埋点）；defer 在文档解析完成后、DOMContentLoaded 之前按顺序执行，适合有依赖关系的业务脚本。module 脚本默认是 defer 行为。

**闭包**：函数与其词法环境的组合，内层函数引用了外层变量，外层执行完后这些变量仍被保留。实际用途：私有状态与模块封装、防抖节流保存 timer、柯里化、事件回调里保存上下文。代价是变量常驻内存，滥用会造成泄漏。

**WebSocket 与 HTTP**：HTTP 是请求—响应、无状态、每次可短连接；WebSocket 通过 HTTP 升级握手后建立全双工长连接，双方可随时主动发消息。HTTP 也能服务端推送（SSE、长轮询），但 SSE 是单向的。SSE 基于 HTTP 流式响应，文本协议、自动重连，适合通知与流式输出；WebSocket 适合双向实时通信。

**WebSocket 建联与鉴权**：浏览器 WebSocket API 不能自定义 header，所以 authorization 不能像 HTTP 那样直接加。常见做法是握手 URL 带一次性 ticket（服务端校验后立即作废），或依赖同站 cookie（注意跨域与 SameSite），或在建连后的第一条消息里发 token 由服务端校验。完整链路：客户端发起带 `Upgrade: websocket` 的握手 → 服务端校验身份与权限、返回 101 → 双方按帧通信 → 心跳保活、断线按指数退避重连并重新订阅。

**长列表与万张图片**：不要一次挂载全部 DOM。用虚拟列表（只渲染视口附近若干项）+ `IntersectionObserver` 做图片懒加载，配 `loading="lazy"` 与固定占位尺寸避免布局抖动；图片用缩略图与 CDN 参数降分辨率，列表项用 `content-visibility: auto` 跳过屏外渲染。视口计算用 `getBoundingClientRect()`、`IntersectionObserver` 的 `intersectionRatio` 或 `window.innerHeight`。

**TypeScript 泛型**：泛型是类型参数，让函数、组件、容器在保持类型关联的前提下复用，例如 `function identity<T>(x: T): T`。不会导致「到处是 T」——泛型应由调用方推断或显式传入，内部能具体化就具体化，只有真正需要表达「输入输出同型」时才引入。`any` 关闭类型检查；`unknown` 是安全的顶层类型，使用前必须收窄（typeof、instanceof、类型守卫），外部输入、`catch` 的 error 都应优先用 unknown。

**存储**：localStorage 持久、同源共享、约 5MB；sessionStorage 随标签页会话结束清空，同样约 5MB。超限会抛 `QuotaExceededError`，要捕获后降级（清理旧键、改用 IndexedDB）。两者都是同步 API，大量读写会阻塞主线程，大数据应放 IndexedDB。

**Web Worker**：把计算密集任务放到独立线程，避免阻塞 UI。与主线程通过 `postMessage` 传递消息，数据默认结构化克隆（大对象可用 Transferable 转移 ArrayBuffer 所有权，零拷贝）。Worker 不能直接操作 DOM，适合解析、编译、加解密、大数组计算。

**从输入 URL 到页面**：URL 解析 → DNS 解析（浏览器缓存、系统缓存、递归查询）→ 建立 TCP（HTTPS 还要 TLS 握手）→ 发送 HTTP 请求 → 服务端处理返回 HTML → 浏览器解析 HTML 构建 DOM、遇 CSS 构建 CSSOM、遇 script 按 async/defer 处理 → 合成渲染树 → 布局 → 绘制 → 合成上屏。一个域名不等于一台服务器：DNS 可返回多个 A 记录，前面还有 CDN、负载均衡与反向代理。

**手撕请求队列**：维护 `running` 计数与等待队列，`add(task)` 返回 Promise；未满 3 个直接执行，满了入队；每个任务 `finally` 里递减并把下一个出队执行。实现时注意任务抛错不能让队列卡死（在 finally 里调度下一个）、保持结果与调用顺序对应，以及在空闲时清理引用。

---
title: "网易有道前端实习一面：SBridge、流式渲染与虚拟滚动 17 问"
company: 网易有道
position: 前端开发（实习）
round: 一面
date: '2026-11'
collectedAt: '2026-11-20'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/815393cf1be24bfea371145b31ac28a0
tags: ["网易有道","前端","SBridge","流式渲染","AbortController","虚拟滚动","性能优化","Vite","Webpack"]
summary: "网易有道前端实习一面：先聊实习里最难的问题与 AI 在其中的参与程度，接着问 SBridge 原理、Web 端与 App 内嵌 H5 的能力复用边界、依赖原生接口的功能如何多平台协同上线；八股覆盖流式渲染、请求取消（含 AbortController 之外的方案）、组件封装的考虑维度、Vue Virtual Scroller 的实现原理、拆包与体积优化、重排重绘、Vite 与 Webpack 的区别、一道 Agent 工具调用思考题、输入 URL 到页面渲染的完整流程，最后问如何看待 AI Coding 与职业焦虑。"
---

### 《面试题目》

**项目与实习**

1. 简单介绍一下你在实习期间遇到的问题与难点，以及对应的解决方案。
2. 在解决上述难点的过程中，AI 的参与程度如何？是独立完成开发，还是借助 AI 辅助排查、落地实现？
3. 讲一下 SBridge 的原理。
4. 项目同时包含 Web 端与 App 内嵌 H5，哪些功能可以复用，哪些无法复用？
5. 如果先完成 Web 端功能，后续需要在 App 内嵌 H5 中接入该能力，部分能力依赖 App 原生接口，你们是否遇到过这类场景？如何实现多平台高效迭代、协同上线？

**八股**

6. 讲一下流式渲染。
7. 发起请求后，如何实现请求取消？
8. 除了 `AbortController`，还有哪些取消请求的方案？
9. 封装组件时会从哪些维度考虑，整体思路是什么？
10. 基于 Vue Virtual Scroller，简述虚拟滚动的实现原理。
11. 简历中提到了拆包优化，请介绍前端性能优化以及包体积优化的常见方案。
12. 介绍重排与重绘，开发中有哪些写法可以减少性能损耗？
13. 你同时使用过 Vite 和 Webpack，讲一下二者的区别。
14. Agent 工具调用思考题（答完有追问）。
15. 输入 URL 到页面渲染完成，浏览器完整经历了哪些流程？
16. 你如何看待 AI Coding？对自身职业发展是机遇还是挑战，是否存在被 AI 替代的焦虑？

**反问**

### 《参考解析》

**SBridge 的原理**：WebView 里的 H5 与原生之间没有直接调用通道，SBridge 就是在这两者之间架一层消息协议。以 JSBridge 为例，H5 调用原生时把「方法名 + 参数 + 回调 id」序列化后，通过 `location.href = 'scheme://...'`、隐藏 iframe 或 `window.prompt` 触发原生拦截；原生侧在 WebView 的 URL 拦截钩子（iOS 的 `decidePolicyForNavigationAction`、Android 的 `shouldOverrideUrlLoading`）里解析出方法与参数，执行后把结果写回，通过 `evaluateJavascript` 调用 H5 预先注册的全局回调。App 也可主动 `evaluateJavascript` 调用 H5 注册的方法。现代方案会用 `WKScriptMessageHandler`（iOS）与 `addJavascriptInterface`（Android）替代 URL scheme，避免长度限制与性能损耗。工程上还要处理回调超时、多次调用去重、方法注册表与鉴权。

**Web 与 H5 的能力复用边界**：纯前端逻辑（状态管理、表单校验、展示组件、请求封装）可以直接复用；依赖运行环境的必须分叉——DOM / BOM 在 App 里同样存在但权限不同（相机、相册、定位、剪贴板、文件系统、支付、分享、推送都要走原生），路由与页面栈由原生容器管理，登录态在 Web 用 Cookie、在 App 常用原生注入的 token。分层做法是抽一个平台适配层（adapter），业务层只调用统一接口，Web 实现用浏览器 API、H5 实现走 SBridge，构建时按环境注入不同实现，避免业务代码里到处写 `if (isApp)`。

**流式渲染**：服务端边生成边推送（SSE、fetch 的 `ReadableStream`、WebSocket），前端收到分片就增量解析并更新 DOM，而不是等完整响应。关键是按块处理、保持已渲染内容不重建（用稳定的 key 或追加节点）、处理好 Markdown 跨块的半截语法（代码块、表格被切断时缓存到下一块再渲染），以及自动滚动的跟随与用户上滑后停止跟随。相比整段返回，首屏可见时间大幅提前，但要注意解析开销与渲染频率——按帧或按时间片批量刷新，避免每个字符都触发一次渲染。

**请求取消**：`AbortController` 是现代标准，`fetch` 传 `signal`、axios 传 `signal` 或 `CancelToken`。其他方案：`XMLHttpRequest.abort()`；给请求加自增序号，回调时比对序号丢弃过期响应（结果虽已返回但业务上作废）；RxJS 的 `switchMap` / `takeUntil` 自动退订上一个流；路由切换时统一清理挂起的请求；Web Worker 或 `setTimeout` 竞态标记。注意取消只终止客户端等待，服务端可能仍在执行，涉及写操作时要靠幂等键兜底。

**组件封装的考虑维度**：接口设计（props 的语义、必填与默认值、受控与非受控）、状态归属（内部状态与外部受控的边界）、可组合性（插槽、render props、compound components）、样式隔离与主题（CSS 变量、`scoped`、暗色模式）、可访问性（键盘操作、ARIA、焦点管理）、边界情况（空数据、加载中、错误、超长文本）、性能（避免不必要的重渲染、按需加载）、类型与文档、以及国际化与埋点钩子。原则是把变化点做成配置，把稳定逻辑收进内部，对外只暴露业务语义。

**虚拟滚动原理**：只渲染可视区域内的若干项，用一个高度固定的容器撑出总高度，滚动时根据 `scrollTop` 计算当前应该渲染的起止索引，用 `transform: translateY` 把渲染出的列表偏移到正确位置。难点在不定高：需要测量已渲染项的真实高度并缓存，用估算高度占位，滚动过程中动态修正偏移，否则会出现跳动。Vue Virtual Scroller 在这之上做了 buffer（上下各多渲染几项防止快速滚动露白）、滚动节流与 `requestAnimationFrame` 更新、以及 keep-alive 缓存复用。

**Vite 与 Webpack 的区别**：开发阶段 Vite 利用浏览器原生 ESM，按需编译请求到的模块，冷启动几乎即时；Webpack 要先打包出 bundle 再起 dev server，项目越大启动越慢。热更新上 Vite 基于 ESM 的模块边界精确替换，Webpack 需要重新构建受影响的 chunk。生产构建 Vite 默认用 Rollup（新版可选 Rolldown），Webpack 自身承担打包，生态与插件更成熟，对老旧浏览器、特殊 loader 场景支持更好。取舍是：新项目、现代浏览器优先选 Vite；需要复杂定制、历史包袱重的项目留在 Webpack。

**重排与重绘**：重排（reflow）是几何属性变化导致布局重新计算，重绘（repaint）是外观变化但布局不变。减少损耗的写法：批量修改样式（用 class 切换或 `cssText`）、用 `DocumentFragment` 或离线 DOM 批量插入、读写分离避免布局抖动（先集中读 `offsetHeight` 再集中写）、动画用 `transform` 与 `opacity` 走合成层、需要频繁动画的元素提升为独立图层、用 `requestAnimationFrame` 对齐帧、避免表格布局与大范围 `position: fixed` 变化。

**输入 URL 到渲染完成**：URL 解析 → 查缓存（浏览器缓存、Service Worker、DNS 缓存）→ DNS 解析 → TCP 握手（HTTPS 再加 TLS 握手）→ 发送 HTTP 请求 → 服务端处理并返回 HTML → 浏览器解析 HTML 构建 DOM，遇到 CSS 构建 CSSOM、遇到脚本按 `defer` / `async` 决定是否阻塞 → DOM 与 CSSOM 合成渲染树 → 布局（layout）→ 绘制（paint）→ 合成（composite）上屏。期间还有预加载扫描器提前发现资源、字体加载触发的重排、以及首屏后的懒加载。

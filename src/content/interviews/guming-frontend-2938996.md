---
title: "古茗前端一面：JS Bridge、事件循环与 AI Coding 工作流连问 28 题"
company: 古茗
position: 前端开发
round: 一面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2f38d09d05df4f61aa39463f69614f29
tags: ["古茗","前端","JS Bridge","事件循环","重绘重排","跨域","AI Coding"]
summary: "古茗前端一面 28 题，前半段围绕一个带流式对话的内嵌 H5 项目深挖：移动端适配、流式渲染插件、Markdown 与媒体资源解析、埋点体系、JS Bridge 原理与调试；后半段是事件循环、微任务、重绘重排、跨域与 Vite proxy，最后问了 AI Coding 的代码占比与质量保障手段。"
---

### 《面试题目》

1. 你前端主要的技术栈是哪些？
2. 有没有移动端开发经验，比如小程序、APP、APP 内嵌 H5？
3. 挑一个你熟悉的前端项目，介绍业务背景、你做的工作、项目难点和亮点。
4. 这个项目的整体框架、技术栈是怎样的？
5. 流式渲染用的是哪个插件？是自己实现的还是第三方插件？
6. 对话功能后端输出的数据格式是什么样的？
7. 返回内容里会带有 Markdown 格式或者媒体资源文件吗？
8. 针对 Markdown、媒体资源这类特殊格式，前端是怎么解析处理的？
9. 你提到的埋点转移，是把老埋点转成新埋点吗？具体是做什么？
10. 你们埋点是怎么收集的？只有前端业务打点吗？有没有异常监控类埋点？
11. 介绍一下 JS Bridge 的原理。
12. 调用 Bridge 的时候遇到过哪些兼容问题？调用过哪些 Bridge？
13. 内嵌 H5 项目里，你们是怎么调试的？
14. Bridge 是在 APP 内部的，浏览器环境没有，这块怎么调试？
15. 在项目里，AI 相关的工作流、AI Code 生成的工作流大概是什么样的？
16. AI Coding 生成相关代码占比大概多少？
17. 除了自测，还有哪些手段保障这部分代码的质量和稳定性？
18. 项目里有没有用到单元测试，或者用 Playwright 做自动化测试？
19. Figma 和 MCP 相关，UI 还原准确度怎么样？
20. 会不会和设计同学约定设计稿规范，方便 MCP 解析、提升还原准确度？
21. 讲一下 JS 里面的事件循环。
22. 哪些 API 属于微任务？
23. Promise.catch 的相关问题，怎么才能触发 catch 回调？
24. 介绍浏览器渲染里的重绘和重排。
25. 修改元素 font-size 会触发重绘还是重排？
26. 项目里有没有遇到跨域问题？
27. Vite 里的 proxy 是不是用来转发、解决本地跨域的？
28. 你还有什么想问我的？

### 《参考解析》

**JS Bridge 的原理**：H5 运行在 WebView 里，与原生之间没有直接的函数调用通道，所以要做一层桥。主流有三种实现。第一种是拦截 URL Scheme：H5 通过修改 `location.href` 或创建隐藏 iframe 发起 `bridge://method?params=...`，原生在导航回调 `shouldOverrideUrlLoading`（Android）或 `decidePolicyForNavigationAction`（iOS）里拦下并解析，执行后通过回调页面上的全局函数把结果送回来。第二种是原生注入对象：Android 通过 `addJavascriptInterface` 注入一个对象，iOS 通过 `WKScriptMessageHandler` 接收 `postMessage`。第三种是 JSBridge 常用的「消息队列 + 回调 id」封装：把调用转成一条带自增 id 的消息，原生返回时按 id 找到对应回调并 resolve，这样把异步的桥调用包装成 Promise。兼容问题集中在几处：iOS 的 WKWebView 不支持 `prompt` 拦截方案、Android 低版本 `addJavascriptInterface` 有安全漏洞、iframe 方式在部分机型上会被页面卸载打断、回调函数名冲突、以及原生返回的数据结构在不同版本 APP 上不一致。解决办法一般是在 JS 侧做能力探测与降级（优先注入对象，失败退回 scheme），版本号随 UA 传过去，原生按版本分流。

**内嵌 H5 的调试**：浏览器里没有原生对象，所以要分两段调。业务逻辑层面把 Bridge 抽象成一个适配层，浏览器环境下走 mock 实现（用 localStorage 模拟存储、用 setTimeout 模拟原生回调），保证页面能独立跑起来、能进 DevTools 打断点。真机层面用 Android 的 `chrome://inspect` 与 iOS Safari 的 Web Inspector 远程调试 WebView；不方便连真机时，让原生把 WebView 的 console 日志与错误转发到原生日志或上报平台。第三段是代理与抓包：用 Charles、Whistle 把线上 H5 代理到本地 dev server，直接在真机上验证，这是排查「只在 APP 里出现」的问题最有效的手段。

**事件循环与微任务**：JS 单线程执行，运行时维护一个调用栈、一个宏任务队列和一个微任务队列。每轮循环取出一个宏任务执行，执行完后清空整个微任务队列（清空过程中新产生的微任务也在本轮继续执行），然后视情况渲染，再进入下一轮。宏任务包括 `setTimeout`、`setInterval`、`setImmediate`（Node）、I/O、UI 事件、`MessageChannel`；微任务包括 `Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`、`process.nextTick`（Node，优先级高于 Promise）。`async` 函数里 `await` 之后的代码等同于 `.then` 里的回调，属于微任务。常见考题是给一段混用 `setTimeout` 与 `Promise` 的代码让写出输出顺序，判断依据就是「同步 → 微任务清空 → 宏任务」。

**Promise.catch 的触发条件**：`catch` 是 `then(undefined, onRejected)` 的语法糖，只有 Promise 变成 rejected 状态时才会走到。触发途径有四类：`reject()` 显式拒绝、`throw` 抛出异常、上游 `then` 的回调里抛错、以及 `Promise.all` 中任意一个子 Promise 失败。容易答错的两点：一是在 `then(onFulfilled)` 里抛出的错误不会回到同一个 `then` 的第二个参数，而是进入下一个 `catch`；二是 `catch` 之后返回的是新 Promise，如果 `catch` 里没有再抛错，后续链条会恢复为 fulfilled。

**重绘与重排**：重排（reflow/layout）是几何属性变化导致浏览器重新计算元素的位置与尺寸，代价高，因为它可能波及整棵渲染树；重绘（repaint）是外观变化但不影响布局，只需重新绘制。触发重排的典型属性是宽高、内外边距、定位、字体大小、显示方式、以及读取 `offsetTop`、`scrollHeight`、`getComputedStyle` 这类强制同步布局的操作；只触发重绘的是颜色、背景、透明度、阴影、`visibility`。修改 `font-size` 会改变文字占据的空间，属于重排。优化手段是批量修改样式（用 class 切换代替逐条改 style）、用 `transform` 与 `opacity` 做动画（可走合成层，不触发重排重绘）、需要读取布局信息时先读后写避免布局抖动、以及用 `DocumentFragment` 或 `display: none` 期间批量操作。

**跨域与 Vite proxy**：跨域是浏览器的同源策略限制，协议、域名、端口任一不同即为跨源，限制的是「脚本读取响应」而不是「请求发出」。开发阶段用 Vite 的 `server.proxy` 把 `/api` 前缀转发到后端，请求从浏览器看是同源的，绕过了限制；但 proxy 只在 dev server 生效，生产环境要靠 Nginx 反向代理或后端配置 CORS。CORS 的核心是响应头：简单请求带 `Access-Control-Allow-Origin`，非简单请求（自定义头、`PUT`、`application/json` 等）会先发 `OPTIONS` 预检；带 Cookie 的请求需要 `Access-Control-Allow-Credentials: true` 且 `Allow-Origin` 不能是通配符。回答时要把「开发期代理」与「生产期 CORS / 同域部署」区分开，混为一谈是常见失分点。

**流式对话与富文本渲染**：后端一般用 SSE 或 WebSocket 逐段推送增量文本，前端按 chunk 拼接并渲染。难点在「增量」与「结构化」的冲突：Markdown 在流式过程中可能停在半个语法块里（未闭合的代码围栏、半个链接），所以不能每来一个 chunk 就整体重新 parse，主流做法是累积到完整块边界再解析，或对未闭合部分做容错渲染。安全上必须走 sanitize（如 DOMPurify），不能直接 `innerHTML`；代码块要做语法高亮与懒加载，媒体资源按需请求。性能上要用 `requestAnimationFrame` 或时间片合并高频更新，避免每个 token 都触发一次 React 重渲染。

**AI Coding 的质量保障**：面试官连问三轮（占比、质量手段、自动化测试），说明他在判断「你是否把 AI 产出当正式代码管理」。可答的体系是：约束输入（rules / 约定文件写清目录结构、命名、禁用的 API）、小步提交（一次只让它改一个可验证的点）、类型与静态检查作为第一道门（TypeScript strict、ESLint）、单测覆盖纯逻辑、Playwright 覆盖关键链路、Code Review 由人兜底并明确「AI 生成的代码同样要过评审」、以及上线后的异常监控与埋点回流。Figma 与 MCP 那段考的是「设计稿到代码」的链路：约定图层命名、间距与颜色变量、组件映射关系，能显著提升还原度；但 MCP 解析出的结构仍需人工校对布局语义，不能当作像素级保证。

---
title: "BIGO 秋招前端一面（语音方向，约 30 分钟）"
company: "BIGO"
position: "前端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/938729580989251584
tags: ["前端","React","Vue","HTTP","跨域","性能监控","秋招"]
summary: "BIGO 秋招前端一面面经（语音方向，约 30 分钟）：从笔试题回顾的跨域预检切入，问到 React 闭包与生命周期、Fiber、React Hook 以及在 Vue 中实现同类能力的思路、HTTP 版本与常见响应码，再围绕前端性能监控方案、上报方式与如何避免上报侵占用户资源展开，后半程聊项目并询问 AI 的日常使用，最后反问。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 回顾一下笔试题：跨域预检请求是怎么回事？
3. React 里的闭包是什么？
4. HTTP 各版本有什么区别？
5. React Hook 是什么？
6. 在 Vue 里面怎么做 React Hook 那样的能力？
7. React 的生命周期是怎样的？
8. React Fiber 是什么？
9. HTTP 常见的响应码有哪些？
10. 性能监控方案怎么做？怎么上报？有了解吗？
11. 如何避免上报侵占用户资源？
12. 请求页面的性能指标有哪些？
13. 项目过程中有做过性能优化吗？
14. 聊聊项目（后续围绕项目展开提问）。
15. 你平时怎么用 AI？
16. 你有什么想问的（反问）？

### 《参考解析》

**跨域与预检请求**

跨域的本质是**浏览器的同源策略**在限制脚本读取跨源响应，而不是限制请求本身。同源要求协议、域名、端口三者完全一致。

请求是否触发预检，取决于它是不是「简单请求」。简单请求要同时满足：方法是 `GET`/`HEAD`/`POST`；请求头只包含 `Accept`、`Accept-Language`、`Content-Language`、`Content-Type`（且值仅限 `text/plain`、`multipart/form-data`、`application/x-www-form-urlencoded`）以及 `Range` 等少数安全头。**只要不满足其中一条就会先发 `OPTIONS` 预检**——最常见的触发场景是 `Content-Type: application/json`、自定义头（如 `Authorization`、`X-Token`）、以及 `PUT`/`DELETE` 等方法。

预检请求里浏览器会带上 `Access-Control-Request-Method` 和 `Access-Control-Request-Headers`，服务端要用 `Access-Control-Allow-Methods`、`Access-Control-Allow-Headers`、`Access-Control-Allow-Origin` 回应；要携带 Cookie 时还有两条硬要求——`Access-Control-Allow-Origin` 不能是 `*`、必须回具体源，同时 `Access-Control-Allow-Credentials: true`。预检结果可以用 `Access-Control-Max-Age` 缓存，避免每次请求都多一个往返。实际工程里常见的坑是：Nginx 没有把 `OPTIONS` 透传给后端、或者 CDN 缓存了预检响应导致改配置不生效；另外代理配置漏了某个自定义头，浏览器报的错会指向「请求被 CORS 策略阻止」，但真正原因是服务端没允许这个头。

**在 Vue 里做出 React Hook 那样的能力**

React Hook 的本质不是「函数」，而是**在函数组件每次渲染时按固定顺序访问一份与组件实例绑定的状态**——状态藏在 Fiber 节点的链表上，靠调用顺序对齐，这也是「不能在条件语句里调用 Hook」这条规则的由来。`useEffect` 则是在渲染提交之后、按依赖数组比对的时机执行副作用，并返回清理函数。

Vue 3 的 Composition API 在**能力上是对齐的**，只是机制不同：`ref`/`reactive` 提供响应式状态，`computed` 对应 `useMemo`，`watchEffect`/`watch` 对应 `useEffect`，`onMounted`/`onUnmounted` 对应生命周期副作用，自定义 `useXxx` 函数就是 React 自定义 Hook 的等价物。差别在实现层面：Vue 用响应式代理在**依赖被读取时自动收集**，不需要写依赖数组，因此不会有「依赖漏写」这类经典 bug；React 靠显式依赖数组和闭包快照，每次渲染都是一份新的闭包，这也是「闭包陷阱」（定时器里读到旧 state）的根源。要在 Vue 里手写一个类似 Hook 的机制，思路是用 `effectScope` 把一组响应式副作用聚合起来、由组合函数统一创建与销毁，再用 `provide/inject` 或模块级单例共享状态——本质上就是把「状态 + 副作用生命周期」打包成可复用的函数。

**前端性能监控怎么上报、怎么不侵占用户资源**

监控方案通常分三层采集：**性能指标**用 `PerformanceObserver` 订阅 `navigation`、`paint`、`largest-contentful-paint`、`layout-shift`、`event`、`longtask` 等 entry（比 `performance.timing` 更完整，也能拿到 Core Web Vitals）；**错误**监听 `window.onerror`、`unhandledrejection`、`ErrorBoundary`、以及资源加载失败（捕获阶段的 `error` 事件）；**行为与请求**用统一的请求封装记录耗时、状态码、失败原因（注意别记录敏感参数）。

上报方式上，`navigator.sendBeacon` 是首选——它在页面卸载时也能可靠发出、不阻塞导航；`fetch` 配 `keepalive: true` 是备选；老式 `new Image()` 打点会有 URL 长度限制且丢失响应。数据量大时要批量聚合、合并上报，并做采样。

「不侵占用户资源」是这道题真正的考点，可以从几个角度答：**上报不要占用主线程和首屏带宽**——延迟到 `requestIdleCallback` 或 `load` 之后再发，首屏关键路径上完全不报；**采样**——错误类按比例采样、性能类可按 PV 采样，高频事件（如长列表滚动、接口埋点）做节流与去重；**体积控制**——上报数据压缩、用短字段名、必要时上 `CompressionStream`；**失败不重试风暴**——上报失败要静默丢弃或指数退避，而且上报接口本身不能触发监控，否则会自激；**尊重用户设置**——`navigator.connection.saveData`、网络类型为 2G/3G 时降级或关闭上报，`doNotTrack` 与隐私合规要求也要考虑。

**请求页面的性能指标**

按时间轴串起来讲最清楚：`DNS` 查询、`TCP` 握手、`TLS` 协商、`TTFB`（首字节时间，反映服务端与网络）、`FP`（首次绘制）、`FCP`（首次内容绘制）、`LCP`（最大内容绘制，衡量加载体验）、`TTI`（可交互时间）、`TBT`（总阻塞时间）、`CLS`（累积布局偏移，衡量视觉稳定性）、`INP`（交互到下一次绘制，取代了 FID 衡量响应性）。这几项里 LCP、CLS、INP 就是 Core Web Vitals，也是搜索引擎和真实用户体验最关注的三个。分析时要注意区分**实验室数据**（Lighthouse、Performance 面板，可复现、适合定位）和**真实用户数据**（RUM，反映真实设备与网络分布），两者常常结论不一致，排查时要说明用的是哪一套。

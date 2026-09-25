---
title: "尚睿科技 Web 前端实习面试：从 React 与 Vue 差异问到 HTTP 版本"
company: "尚睿科技"
position: "Web 前端开发（实习）"
date: '2026-09'
source: 牛客网
tags: ["前端","React","Vue","Vite","Webpack","浏览器渲染"]
summary: "尚睿科技 Web 前端方向实习面试，9 月 21 日：先从实习经历与离职原因切入，再连问 Vue 与 React 的差异、React 18、国际化开发方案、Vite 与 Webpack、虚拟列表、性能测量，最后落在输入 URL 到渲染、DNS 解析与 HTTP 版本差异。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 介绍一下你的实习经历。
3. 为什么从上一家离职？
4. 你是哪里人？base 地有什么意向选择吗？
5. 介绍一下 Vue 和 React 的区别。
6. 介绍一下 React 18。
7. 对国际化开发了解多少？
8. 上一家的国际化前端开发方案是怎么做的？
9. Vite 和 Webpack 有什么区别？
10. 虚拟滚动和虚拟列表的区别是什么？
11. Web 性能怎么测量？
12. 从输入 URL 到界面渲染，中间经历了哪些流程？
13. DNS 解析的过程是怎样的？
14. HTTP 各个版本之间有什么差异？
15. 常见的请求头有哪些？

### 《参考解析》

**React 与 Vue 的核心差异**

两者的差别集中在「数据变化之后怎么找到要更新的 DOM」。Vue 走细粒度响应式：编译期就把模板与数据建立依赖关系（Vue 3 用 Proxy 收集依赖，编译时还做静态提升与补丁标记），数据一变能定位到具体节点，运行时负担小、上手成本低。React 走「组件重渲染 + 虚拟 DOM 比较」：状态一变就以组件为边界重新执行函数组件，产出新元素树，再和上一棵树 diff 出最小更新；心智模型简单（UI 是状态的函数）、生态与类型支持更强，代价是要靠 key、状态下移、memo/useMemo 控制重渲染范围。面试里只答「一个模板一个 JSX」会很单薄，落到响应式粒度、更新粒度、生态与团队成本，再给一句选型理由才算答完。

**React 18 的关键变化**

核心是并发特性落地。`createRoot` 替代 `ReactDOM.render` 打开并发渲染；自动批处理把 setTimeout、Promise 回调里的多次 setState 也合并成一次渲染；`useTransition` / `useDeferredValue` 让紧急更新（输入框）与非紧急更新（大列表）分开调度；Suspense 支持流式 SSR 与选择性注水。要主动澄清一点：「并发」不是多线程，渲染仍跑在主线程，只是把工作切成可中断的单元，让紧急更新能插队先落地。另外 StrictMode 在 18 下会故意双调用 effect，用来暴露副作用缺少清理函数的问题，开发期看到接口调两次不是 bug。

**国际化前端方案要解决的四件事**

一是文案的提取与翻译管理：i18n key 集中到语言包，缺失 key 要有构建期校验，对接翻译平台；二是运行时切换与持久化：locale 放在 URL 前缀还是 cookie，切换是否刷新、SSR 与客户端怎么保持一致；三是格式化：日期、数字、货币、复数一律用 `Intl` 系列，别手写规则；四是布局适配：德语长文案撑爆按钮、阿拉伯语要 `dir` 与逻辑属性。工程上的高频坑是文案硬编码进组件、key 直接用中文原文（改文案即丢翻译）、以及服务端与客户端 locale 不一致导致水合报错。语言包还要按语言拆包懒加载，否则首屏体积会失控。

**Vite 与 Webpack 的区别**

开发态是分水岭。Vite 不在启动时做整体打包，而是让浏览器用原生 ESM 按需请求模块，只对 `node_modules` 依赖做一次 esbuild 预构建（顺带把 CommonJS 转成 ESM），所以冷启动与 HMR 速度基本与项目规模无关；Webpack 必须先把整张依赖图构建出来，大项目启动和热更新会明显变慢。生产构建两者都要完整打包，Vite 底层是 Rollup。生态上 Webpack 的 loader/plugin 更全，老项目、特殊构建需求更容易找到现成方案；Vite 插件接口基于 Rollup，配置更轻量，但个别 Webpack 专有 loader 迁移时有成本。回答时最好补一句自己项目里遇到过什么（比如某个库的 CJS 产物需要 `optimizeDeps.include`）。

**虚拟列表、虚拟滚动与性能测量**

虚拟列表是实现手段：只渲染视口内（含缓冲）的条目，滚动时按高度估算可视区间与偏移量，用绝对定位或 padding 撑起滚动条；数据量不大时收益有限，快速滚动还可能白屏，因此要处理缓冲区、不定高测量与滚动锚点。虚拟滚动是更宽的概念——任何「只处理可视区域内容」的优化都算，虚拟列表、虚拟表格、虚拟树乃至 canvas 绘制都是它的实现，面试官想确认你知道这层包含关系。性能测量则要说得出工具与指标：Lighthouse 看实验室数据，Performance 面板看火焰图与长任务，web-vitals 采集 LCP/INP/CLS 这类真实用户指标并用 PerformanceObserver 上报做线上监控。

**从输入 URL 到渲染、DNS 解析**

按浏览器进程分工讲最清楚：URL 解析与缓存查找（强缓存命中直接返回，否则发协商缓存请求）→ DNS 解析 → TCP 握手（HTTPS 再加 TLS 握手）→ 发送请求、接收响应 → 解析 HTML 构建 DOM，遇到 CSS/JS 等阻塞资源按优先级调度 → 合成渲染树、布局、绘制、合成上屏。DNS 的顺序是浏览器与系统缓存 → hosts → 本地 DNS 服务器，缓存未命中再逐级向根域、顶级域、权威服务器查询，拿到 A/AAAA 记录并逐级按 TTL 缓存。优化手段有 `dns-prefetch`、HTTPDNS 规避 LocalDNS 劫持、CDN 就近解析，答到「缓存 + 递归 + TTL」这三层就够了。

**HTTP 版本差异与常见请求头**

HTTP/1.1 是文本协议、默认长连接，但同域并发连接数有限且存在队头阻塞，于是有了域名分片、雪碧图这类优化；HTTP/2 改为二进制分帧、多路复用、HPACK 头部压缩，解决了 HTTP 层的队头阻塞但 TCP 层仍有；HTTP/3 换到基于 UDP 的 QUIC，把可靠传输与 TLS 1.3 握手融进传输层，弱网与连接迁移场景收益明显。请求头要做到「说出用途」：`Host`、`User-Agent`、`Accept` / `Accept-Encoding` / `Accept-Language`、`Content-Type` 与 `Content-Length`、`Cookie`、`Referer`、`Origin`、`Authorization`、`Cache-Control` / `If-None-Match` / `If-Modified-Since`、`Range`，以及代理链路里的 `X-Forwarded-For`。

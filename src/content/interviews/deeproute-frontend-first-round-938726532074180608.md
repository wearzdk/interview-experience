---
title: "元戎启行前端一面：八股 + vibe coding"
company: "元戎启行"
position: "前端开发"
round: "一面"
date: '2026-07'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/938726532074180608
tags: ["前端","React","HTTP缓存","DNS","useEffect","AI编码","秋招"]
summary: "元戎启行前端一面面经（2026.07.29，约 1 小时）：面试官是后端开发，走飞书会议且未开摄像头。前半程是常规八股——浏览器输入 URL 到页面呈现的完整过程、请求过程中的错误、TCP 与 UDP、DNS 解析、HTTP 缓存与 HTML 的缓存策略、React useEffect 与 useLayoutEffect 及 SSR 下的选择；后半程围绕项目提问，并出了一道 AI coding 题，过程中追问实习期间 AI coding 的实践，最后反问。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 浏览器输入 URL 之后会发生什么？
3. 请求过程中会发生哪些错误？
4. TCP 和 UDP 的区别是什么？
5. DNS 解析过程是怎样的？
6. HTTP 缓存有哪些？HTML 通常走强制缓存还是协商缓存？
7. React 的 useEffect 和 useLayoutEffect 有什么区别？
8. SSR 场景下应该用 useEffect 还是 useLayoutEffect？
9. 介绍一下项目背景（并结合项目提了一些问题）。
10. 一道 AI coding 题目（vibe coding）。
11. 实习期间 AI coding 方面的实践是怎么做的？
12. 你有什么想问的（反问）？

### 《参考解析》

**浏览器输入 URL 之后发生了什么**

按顺序说成一条链：**URL 解析与缓存检查**（先看浏览器自身的 DNS 缓存、`hosts`、系统缓存，再看强缓存是否命中，命中就直接用本地副本）→ **DNS 解析**（浏览器缓存 → 系统缓存 → 路由器/运营商 DNS → 根域名 → 顶级域 → 权威域名，拿到 IP；有 CDN 时这一步实际返回的是最近的边缘节点）→ **建立连接**（TCP 三次握手，HTTPS 再叠加 TLS 握手，涉及证书校验、密钥协商、以及 TLS 1.3 的 1-RTT/0-RTT）→ **发送 HTTP 请求**（请求行、请求头，可能带上 `Cookie`）→ **服务端处理并返回响应**（可能经过网关、负载均衡、CDN 回源、服务端渲染）→ **浏览器解析渲染**：HTML 边下边解析构建 DOM，遇到 CSS 构建 CSSOM（阻塞渲染），遇到同步脚本会阻塞解析（`defer`/`async` 可以改变行为），DOM 与 CSSOM 合成渲染树，接着布局、绘制、合成（`transform`/`opacity` 走合成层不触发回流）→ **加载子资源并执行脚本**，最终触发 `load`，页面进入可交互状态。补充一句「同一域名下浏览器通常限制 6 个并发连接（HTTP/1.1），HTTP/2 之后多路复用打破了这一限制」，能体现你理解到协议层面。

**请求过程中会出现哪些错误**

最好按阶段分类答，这样显得有条理：**DNS 阶段**——域名解析失败（`ERR_NAME_NOT_RESOLVED`）、DNS 污染或超时；**连接阶段**——连接被拒绝（`ERR_CONNECTION_REFUSED`）、连接超时、`ERR_CONNECTION_RESET`、TLS 证书错误（过期、域名不匹配、自签名 `ERR_CERT_*`）；**请求与响应阶段**——DNS/连接正常但服务端返回 4xx/5xx（`ERR_ABORTED` 常常是用户或前端主动取消）、CORS 被拦截、混合内容被阻止（HTTPS 页面请求 HTTP 资源）、`ERR_BLOCKED_BY_CLIENT`（被广告拦截插件拦掉）；**传输阶段**——响应体下载中断、超时（`ERR_TIMED_OUT`）；**网络环境**——离线（`ERR_INTERNET_DISCONNECTED`）、代理配置错误（`ERR_PROXY_CONNECTION_FAILED`）。工程上要补一句容错设计：区分「可重试」（超时、5xx、网络抖动，做指数退避重试）与「不可重试」（4xx 参数错误、CORS 配置问题，重试只是白费），并对幂等性做保证。

**HTML 的缓存策略：为什么走协商缓存**

HTTP 缓存分两类。**强制缓存**由 `Cache-Control: max-age` / `Expires` 控制，命中后浏览器直接用本地副本、**完全不发请求**；**协商缓存**由 `ETag`/`If-None-Match` 或 `Last-Modified`/`If-Modified-Since` 控制，每次都要发请求，服务端比对后回 `304 Not Modified`（不带响应体）。

**HTML 通常走协商缓存**（`Cache-Control: no-cache`，注意它表示「可以缓存但每次都要校验」，不是「不缓存」；`no-store` 才是完全不存）。原因很直接：HTML 是整站的**入口文档**，里面引用的 JS/CSS 文件名带着内容哈希，一旦发版就会变。如果 HTML 被强缓存住，用户在当前 `max-age` 内根本不会去请求新 HTML，也就永远拿不到新哈希的资源引用，结果是「发了版但用户看不到更新」。相比之下，带内容哈希的静态资源（`app.3f2a1b.js`）内容变了文件名就变，可以放心用长 `max-age` 甚至 `immutable`。

实践中的常见组合是：HTML 用 `Cache-Control: no-cache` + `ETag`（配合 CDN 边缘节点做少量缓存、回源校验），静态资源用 `Cache-Control: public, max-age=31536000, immutable`，接口数据按业务容忍度单独设。另外要提醒一个坑：CDN 上如果给 HTML 配了「忽略源站缓存头、按默认时间缓存」，会出现用户拿到旧 HTML 引用了已被清理的旧资源、报 404 的情况，排查时要同时看源站响应头和 CDN 缓存配置。

**useEffect 与 useLayoutEffect，以及 SSR 下怎么选**

两者的区别在**执行时机**：`useLayoutEffect` 在 DOM 变更之后、浏览器绘制之前**同步**执行，会阻塞绘制；`useEffect` 在绘制完成后**异步**执行（通常在下一帧之前，但已经不影响首屏渲染）。因此凡是「读了布局又要在用户看到之前改掉」的场景必须用 `useLayoutEffect`——典型是测量元素尺寸/位置后立即调整（tooltip 定位、避免闪烁的动画起点）；其余副作用（请求数据、订阅事件、写日志）一律用 `useEffect`，避免阻塞绘制拖慢首屏。

**SSR 场景下应该用 `useEffect`**。原因是服务端渲染时根本没有 DOM 和布局系统，`useLayoutEffect` 依赖的 `document` 不存在，React 在服务端渲染阶段会给出警告（"useLayoutEffect does nothing on the server"），而且它在客户端 hydration 之前也无法按预期时机执行。所以 SSR 里如果确实需要「测量后调整」，标准做法是：用 `useEffect` 做测量与更新，配合一个首帧占位的默认样式避免闪烁；或者写一个自定义 Hook，在客户端挂载后再切到 `useLayoutEffect`（用 `typeof window !== 'undefined'` 判断并保持 Hook 调用顺序稳定），避免服务端警告。另外要记住 Hook 的通用规则——**不能放在条件语句或循环里**，组件每次渲染的调用顺序必须一致，否则状态会串位。

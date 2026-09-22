---
title: "虚拟盒子前端实习面经：八股合格但网络链路翻车"
company: "虚拟盒子"
position: "前端开发实习生"
round: "一面+二面"
date: '2026-09'
result: "未通过"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/930884171591876608"
tags: ["前端", "实习", "Vue", "浏览器缓存", "SSE", "HTTPS", "Promise"]
summary: "虚拟盒子前端实习生面经，两位面试官接力 48 分钟：第一轮八股答得不错，Vue 响应式、浏览器缓存、SSE 和 token 无感刷新是亮点；第二轮转到网络链路，any 与 unknown、RESTful、HTTPS 连续翻车。"
---

### 《面试题目》

1. 自我介绍
2. 用过哪些框架？
3. Vue 组件通信有哪些方式？
4. 闭包是什么？
5. 闭包的使用场景有哪些？
6. computed 和 watch 的区别？
7. 讲一下实习项目：业务、你的职责、难点分别是什么？
8. TypeScript 里 any 和 unknown 有什么区别？
9. Promise 讲一下
10. 两个互不依赖的接口怎么同时请求？
11. Vue3 了解吗？和 Vue2 有什么区别？
12. Vue3 的响应式原理是什么？
13. Vite 和 Webpack 有什么区别？
14. 用过哪些 AI 工具？
15. AI 多次解决不了的时候，你怎么分析？
16. 深拷贝和浅拷贝
17. 深拷贝还有哪些实现方法？
18. Token 自动刷新是怎么做的？
19. 浏览器缓存
20. SSE 是怎么做的？
21. 网络中断时页面会怎样？
22. （第二位面试官）再自我介绍一遍
23. 心跳保活用什么通信方式？
24. 站内聊天是网页、桌面还是 APP？
25. WebSocket 的用户 ID 从哪里获取？
26. html2canvas + jsPDF 的导出链路和样式是怎么处理的？
27. React、Next.js、桌面端做过吗？
28. 什么是 RESTful？
29. HTTPS 链路是怎么跟服务器连接的？
30. TCP 的响应机制是什么？
31. AI 的长记忆、短记忆怎么抽离和存储？

### 《参考解析》

**1. any 与 unknown**。`any` 等于关掉类型检查：赋值给任何类型、任意属性访问、任意调用都放行，代码退回 JS；`unknown` 是类型安全的「未知」——任何值都能赋给 `unknown`，但用之前必须收窄（`typeof`、`instanceof`、自定义类型守卫或 `as` 断言），不能直接属性访问、直接调用，也不能直接赋给具体类型。实践上，接第三方数据、`JSON.parse` 的返回值、`catch (e)` 里的 e 都应该用 `unknown`，再用类型守卫收窄；`any` 只应出现在迁移期的临时位置，并配 `noImplicitAny` 和 lint 规则约束。追问常延伸到 `never`：`never` 表示「不可能有值」，用于穷尽性检查，比如 `switch` 的 `default` 分支里写 `const _exhaustive: never = value`。

**2. computed 与 watch**。`computed` 是派生状态：基于响应式依赖算出新值，有缓存（依赖不变就不重算）、必须同步返回值，适合在模板里直接渲染；`watch` 是副作用：依赖变化时执行一段逻辑，不返回值、可以异步，适合发请求、操作 DOM、写 localStorage。选型口诀是「能用 computed 表达的别用 watch」，因为 watch 里再赋值给另一个 ref 会引出多源同步和循环更新。`watchEffect` 自动收集用到的依赖并立即执行一次，适合依赖不固定的场景；`watch` 默认惰性，能拿到新旧值（对象类型要注意新旧值可能是同一个引用），比较对象内部要 `deep: true`。Vue3 的 `computed` 是懒求值加 `effect` 的 dirty 标记，配合 `Proxy` 收集到的细粒度依赖，比 Vue2 基于 `defineProperty` 的实现更容易做到按需更新。

**3. Token 无感刷新**。核心是「双 token（access + refresh）+ 单飞（single flight）」。access 过期（接口返回 401 且错误码表示已过期）时，不能让每个并发请求各自去刷新，否则会刷新出多份新 token、还可能互相作废。做法是维护一个全局 `refreshPromise`：第一个失败的请求发起刷新并把它存下来，其余请求 `await` 同一个 promise；刷新成功后把这些请求重放一遍（先把请求配置里的旧 header 换掉，并限制重放次数避免死循环）；刷新失败则清空登录态并跳登录。这就是「并发锁 + 失败队列」的含义。另外要注意 refresh token 自身也有过期时间、也要防并发；服务端最好支持「刷新即作废旧 token」并处理旧 token 重放；测试时要专门构造「同一时刻 5 个接口同时 401」的场景，这是最容易漏的用例。

**4. 浏览器缓存**。强缓存由 `Cache-Control: max-age=31536000, immutable` 或 `Expires` 控制，命中就不发请求。`Expires` 是绝对时间且依赖客户端时钟，和服务端对不齐就会出偏差，所以现代实现以 `Cache-Control` 优先、`Expires` 只作老客户端兜底。协商缓存是 `Last-Modified`/`If-Modified-Since` 或 `ETag`/`If-None-Match`，命中返回 304 且不带 body；`ETag` 比 `Last-Modified` 精确（后者是秒级粒度，内容没变但时间变了会误判），但分布式部署要注意 ETag 生成算法一致。实践口径：带内容 hash 的静态资源用一年 `max-age` 加 `immutable`；HTML 入口用 `no-cache`（要协商）保证发版立即生效——`no-cache` 不是不缓存，`no-store` 才是完全不存；还要知道地址栏回车、F5、Ctrl+F5 三种操作分别会带上什么缓存头。

**5. SSE 与断网处理**。原生 `EventSource` 的限制很多：只能发 GET、不能自定义请求头（所以带不了 `Authorization`）、不能带请求体、重连由浏览器托管、只能传文本。要「带鉴权 + 自定义 header + 可中断」，就用 `fetch` 加 `response.body.getReader()` 手写解析：按 `\n\n` 切事件块，逐行解析 `data:`/`event:`/`id:`，用 `TextDecoder({stream: true})` 处理跨 chunk 的半截 UTF-8 字符——这个坑最容易踩，中文被切断会变乱码；取消用 `AbortController`。断网时的表现是 `reader.read()` 挂起或抛错，要按状态码给不同的 UI 反馈（401 跳登录、5xx 提示重试、网络错误走自动重连），重连时带 `Last-Event-ID` 或业务游标做断点续传，并且保留已收到的内容而不是清空重来；服务端要定期发注释行心跳（`: ping`），否则 Nginx 的 `proxy_read_timeout` 和 CDN 会把空闲连接掐掉。

**6. RESTful 与 HTTPS 链路**。RESTful 是一套架构风格：用 URI 标识资源、用 HTTP 方法表达动作、用状态码表达结果——`GET /users/1` 取资源、`POST /users` 创建、`PUT`/`PATCH` 全量或部分更新、`DELETE` 删除；资源名用名词复数、从属关系用层级表达（`/users/1/orders`）、过滤分页排序走 query。它不是「URL 里带占位符」，核心是语义由方法和状态码承担，而不是靠 `/getUserById` 这类动词路径；还要能说清 `PUT` 幂等而 `POST` 不幂等、`GET` 不应有副作用。HTTPS 链路：TCP 三次握手之后先做 TLS 握手——`ClientHello`（版本、密码套件、随机数）→ `ServerHello` + 证书链 → 客户端验证证书（签发者是否受信、是否过期、域名是否匹配、是否被吊销）→ 用密钥交换（TLS 1.3 是 ECDHE，1.2 常见 RSA/ECDHE）协商出会话密钥 → `Finished` 校验握手完整性，之后才发 HTTP 请求。要点是：证书只负责证明「这个公钥属于这个域名」，防窃听和防篡改靠的是对称加密加 AEAD；TLS 1.3 把握手压到 1-RTT、复用时可 0-RTT，并统一用 (EC)DHE 获得前向安全；有代理或 CDN 时是「浏览器到 CDN」和「CDN 到源站」两段独立 TLS，排障要先分清是哪一段的证书。至于「TCP 的响应机制」，如果问的不是握手挥手，想听的是确认应答、超时重传与快速重传、滑动窗口、拥塞控制这一整套——也就是「TCP 怎么知道对方收到了、丢了怎么补」。

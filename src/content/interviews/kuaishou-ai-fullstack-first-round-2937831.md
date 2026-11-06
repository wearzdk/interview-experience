---
title: "快手 AI 全栈一面：跨域与路由原理、AI Coding 实践"
company: "快手"
position: "AI 全栈工程师"
round: "一面"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/3f34ddb74b254e36a65515dbc4ebde08
tags: ["快手","AI全栈","前端开发","跨域","CORS","React Router","AI Coding","算法"]
summary: "快手 AI 全栈开发工程师秋招一面约 85 分钟：自我介绍与项目深挖之后，前端基础集中追问跨域、Vite 开发代理、CORS 关键响应头与携带 Cookie 的配置，路由部分要求讲清 Hash 与 History 的差异、依赖的浏览器 API 及 React Router 原理；AI 相关部分围绕 AI Coding 的提效点、如何约束生成代码符合项目规范、Vibe Coding 与 Spec Coding 的取舍展开，最后手撕无重复字符的最长子串。"
---

### 《面试题目》

**项目与自我介绍**

1. 请做一下自我介绍。
2. 介绍实习项目，并说明其中的技术难点与你负责的部分。

**跨域与工程化**

3. 平时有没有遇到跨域问题？有哪些解决方案？
4. Vite 的开发代理是怎么工作的？请求经过了哪些环节？
5. 线上部署后，前后端域名不一致时如何处理？
6. CORS 有哪些关键响应头？它们分别有什么作用？
7. 跨域请求如何携带 Cookie？前端需要怎么配置？

**前端路由**

8. Hash 路由和 History 路由的区别是什么？
9. 是否了解 React Router 的原理？
10. Hash 和 History 路由分别依赖哪些浏览器 API 和事件？
11. 两种模式各有什么优缺点？

**AI Coding**

12. 平时主要用什么 AI Coding 工具？如何选择模型？
13. 介绍一下项目里 Skill 的触发场景以及具体实现细节。
14. 你认为 AI Coding 最主要的提效点是什么？
15. 如何避免 AI 生成不符合项目规范的代码？
16. 平时更偏向 Vibe Coding 还是 Spec Coding？有没有 SDD（Spec-Driven Development）相关实践？

**算法**

17. 手撕：无重复字符的最长子串（LeetCode 3）。
18. 反问。

### 《参考解析》

**跨域的成因与解法**：跨域是浏览器的同源策略在起作用，协议、域名、端口三者任一不同即为跨源。浏览器会放行请求的发送，但会拦截响应的读取（简单请求），或者先发预检再决定是否放行（非简单请求）。工程上的解法按推荐程度排列：第一是同源部署，用 Nginx 或网关把 `/api` 反向代理到后端，浏览器看到的是同源请求，没有跨域问题，生产环境应优先采用；第二是服务端配置 CORS，精确返回允许的源、方法与头部，需要携带凭据时不能用通配符；第三是 BFF 层，由同源的 Node 服务聚合后端接口；第四是开发环境用 dev server 代理。JSONP 只支持 GET、依赖全局回调、难以处理错误，现在不应作为方案；`document.domain` 已废弃；WebSocket 不受同源策略限制，但握手阶段仍可校验 Origin。回答时要把「开发环境代理」与「生产环境方案」分开，很多候选人只答代理，面试官会继续追问线上怎么办。

**Vite 开发代理的工作过程**：浏览器向 dev server 发起同源请求（例如 `http://localhost:5173/api/user`），Vite 内置的 connect 中间件按 `server.proxy` 配置匹配路径前缀，命中后交给 `http-proxy` 把请求转发到 `target`，并按配置改写 `Origin`、`Host`（`changeOrigin`）与路径（`rewrite`），再把后端响应原样回传给浏览器。因为浏览器只与 dev server 通信，所以不存在跨域；代理是开发期能力，构建产物里不会包含。WebSocket 代理需要额外配置 `ws: true`。排查代理问题时按顺序看：路径是否命中、`rewrite` 是否把前缀去掉、目标服务是否可达、是否被后端自己的 CORS 或鉴权拦截。

**线上前后端域名不一致**：首选同域反代，把前端与接口收敛到同一主域下，既避开跨域，也便于统一 Cookie、缓存与安全策略。确实需要跨域时，服务端按环境白名单返回 `Access-Control-Allow-Origin`，并处理预检请求；如果请求要带 Cookie，前端设置 `credentials: 'include'`，服务端返回具体源而非 `*`，同时开启 `Access-Control-Allow-Credentials: true`；Cookie 本身要设置 `SameSite=None; Secure` 才能在跨站请求中发送。若涉及多级域名，可以通过统一主域加 `Domain` 属性让 Cookie 共享。还要注意 CDN 与网关的缓存必须带 `Vary: Origin`，否则会把一个源的 CORS 响应缓存给另一个源。

**CORS 的关键响应头**：`Access-Control-Allow-Origin` 指定允许的源，可以是具体源或 `*`，带凭据时必须是具体源；`Access-Control-Allow-Credentials` 为 `true` 时允许浏览器携带 Cookie 与认证信息；`Access-Control-Allow-Methods` 列出预检允许的方法；`Access-Control-Allow-Headers` 列出允许的自定义请求头；`Access-Control-Expose-Headers` 指定前端 JS 可以读取的响应头，默认只能读 `Cache-Control`、`Content-Language`、`Content-Type` 等少数几个；`Access-Control-Max-Age` 控制预检结果的缓存时长。预检请求是浏览器自动发出的 `OPTIONS`，服务端需要在路由层放行，不能要求鉴权，否则预检失败会导致真实请求根本发不出去。调试时要区分「请求没发出去」与「响应被拦截」：前者通常是预检失败或混合内容，后者是响应头不满足要求，控制台会给出明确原因。

**跨域携带 Cookie**：前端侧，`fetch` 需要 `credentials: 'include'`，`XMLHttpRequest` 与 axios 需要 `withCredentials: true`，两者默认都不携带跨站 Cookie。服务端侧，`Access-Control-Allow-Origin` 必须是具体源，并返回 `Access-Control-Allow-Credentials: true`；Cookie 需要 `SameSite=None; Secure`，否则现代浏览器不会在跨站请求中发送。如果是同站不同子域，可以设置 `Domain=.example.com` 并保持 `SameSite=Lax`。还要确认 `Path` 覆盖接口路径、Cookie 没有被 `HttpOnly` 之外的原因拦截、以及前端请求的域名与 Cookie 的域匹配。常见坑是开发环境用 `localhost` 调测试环境接口，Cookie 域对不上，表现为登录态一直丢失。

**Hash 与 History 路由**：Hash 模式的路由信息放在 URL 的 `#` 之后，改变它不会向服务器发请求，监听 `hashchange` 事件即可感知变化，读取与写入通过 `location.hash`；兼容性最好，部署不需要服务端配合，但 URL 带 `#`、不利于 SEO，也无法使用 `history.state`。History 模式使用 `history.pushState` 与 `history.replaceState` 修改地址栏而不刷新页面，通过 `popstate` 事件感知前进后退；URL 干净、利于 SEO，但刷新或直接访问深层路径时，请求会真的发到服务器，必须配置 fallback 把未匹配的路径重写到 `index.html`，否则返回 404。`pushState` 受同源限制，`state` 会被结构化克隆且有大小限制。React Router 的原理是维护一个 history 对象，内部监听 `popstate`（History 模式）或 `hashchange`（Hash 模式），把当前 `location` 通过 Context 下发给组件树；`Link` 调用 `navigate` 时先 `pushState` 再通知订阅者；`Routes` 用路径匹配算法（v6 按静态段、动态段、通配的优先级排序）选出唯一匹配的路由并渲染。v6.4 之后的数据路由还叠加了 loader、action 与导航状态管理。

**AI Coding 的提效点与规范约束**：提效最明显的环节是四类：读陌生代码与梳理调用链、写样板与重复性代码、补测试与文档、做机械式重构与批量修改。真正的瓶颈不在生成速度，而在验证成本，所以提效的前提是项目具备快速反馈的手段：类型检查、lint、单元测试、可一键启动的本地环境。约束 AI 产出符合规范的做法要落在机制上而不是靠提醒：在仓库里维护规则文件（`CLAUDE.md`、`.cursor/rules`）写明目录职责、命名、状态管理、错误处理与禁止事项；给 AI 提供同类实现的样例文件让它照着写；把任务拆小，一次只改一个关注点，改完立即跑 `lint` 与类型检查；用 CI 作为最终门禁，生成结果必须通过测试与评审才能合入；对关键路径要求补测试，用测试固定行为。提示词里写「请遵守规范」几乎无效，把规范变成可执行的检查才有效。

**Vibe Coding 与 Spec Coding**：Vibe Coding 是边聊边改、快速试错，适合原型、探索性需求与个人项目，优点是起步快，缺点是需求边界模糊、返工多、难以评审。Spec Coding 或 SDD 是先写规格再实现：明确输入输出、接口契约、数据模型、边界条件与验收标准，再让 AI 按规格生成，人负责评审规格与结果。生产项目与多人协作更适合后者，因为规格本身就是可评审、可测试、可追溯的载体；实践中可以把两者结合，探索阶段用 Vibe 快速验证可行性，方案确定后补一份简版规格再进入实现。回答时最好结合自己做过的项目说明取舍，例如「接口先用 OpenAPI 写清楚，前端与 mock 并行，AI 只负责按契约填充实现」，比空谈概念更有说服力。

**无重复字符的最长子串**：维护一个滑动窗口 `[left, right]` 与一张记录字符最近下标的哈希表。右指针逐个扩张，遇到已出现过的字符时，把 `left` 跳到 `max(left, lastIndex[ch] + 1)`，保证窗口内无重复；每步用 `right - left + 1` 更新答案。时间复杂度 O(n)，空间复杂度 O(字符集大小)。手写时注意三个细节：`left` 只能右移不能回退；哈希表里存的是下标而不是布尔值；空串与单字符要能正确处理。面试官可能追问「返回最长子串本身而不是长度」，这时在更新答案时同步记录起始下标即可。

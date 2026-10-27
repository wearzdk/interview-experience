---
title: "字节跳动 前端一面：AI 流式对话、虚拟列表与 401 并发刷新 Token"
company: "字节跳动"
position: "前端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/8c4af551338340bb89fda0fff4005994
tags: ["前端","React","虚拟列表","性能优化","Token刷新","SSR","HTTPS","MCP"]
summary: "字节跳动前端一面完整记录，从两个项目切入：AI 流式对话项目问 SSE 方案、输出中途追加指令、MCP 协议原理与 Vibe coding；电商项目问性能优化前后对比、核心 Web 指标、图片压缩、固定高与不定高虚拟列表的 range 计算、多 SKU 库存判断、跨标签页购物车同步、Whistle 代理原理；基础部分问浏览器输入 URL 到渲染、CDN、HTTPS 握手、请求拦截器原理、20 个请求同时 401 如何只刷新一次 Token，最后是一道 React useEffect 闭包输出题。"
---

### 《面试题目》

无手撕，全程问答。

**一、AI 流式对话项目**

1. 简单介绍 AI 流式对话项目，实现的方案是什么？是课程实践还是实习项目？
2. 项目中觉得亮点 / 有挑战性的部分是什么，展开讲实现？
3. 对话输出过程中，是否支持不暂停直接输入新指令追加输出？
4. 是否了解 Agent 落地应用？
5. MCP 协议原理是否了解？
6. 平时如何使用 Codex / Claude 等 AI 辅助开发？是 Vibe coding 模式吗？

**二、电商项目（性能、虚拟列表）**

7. 电商项目做了哪些性能优化，遇到什么核心问题，如何解决？
8. 性能优化前后对比，优化占比提升多少？
9. 前端性能核心指标有哪些，项目观测哪个指标？
10. 图片压缩使用自研算法还是第三方工具？
11. 虚拟列表是固定高度还是不定高？根据 scrollTop 如何计算渲染区间 start / end？
12. 虚拟列表 overscan 缓冲区设置太大、太小分别会产生什么现象？
13. 分析固定高度虚拟列表 range 函数代码存在哪些问题，如何优化？
14. 多 SKU 多规格组合，如何快速判断规格组合是否有库存？
15. A 标签页修改购物车，其他标签页如何立刻感知数据变化？
16. Whistle 代理解决跨域底层原理是什么？
17. NPM 一键启动脚本相关了解吗？
18. CSR 客户端渲染、SSR 服务端渲染分别适合什么业务场景？
19. 如果所有组件全部做懒加载拆分，会带来什么负向效果？

**三、网络 & 浏览器基础**

20. 在浏览器输入 URL 回车，完整发生哪些流程？
21. CDN 底层、网络交互过程了解吗？
22. HTTPS 加密握手完整过程？

**四、请求拦截、Token 处理**

23. 封装的请求拦截器底层原理是什么？
24. 20 个请求同时返回 401，如何做到只刷新一次 Token，批量重放其余请求？
25. 分析 demo 简易请求拦截器代码存在哪些问题？
26. 代码分包有哪些优雅实现方式？

**五、React 闭包代码题**

27. 给定 React `useEffect` + 定时器计数代码，输出 count 结果是什么？
28. 如果想要实现 1 秒 count + 1，代码如何修改？

### 《参考解析》

**流式对话中途追加指令**：要在不中断当前流的前提下插话，得让请求和渲染都支持「同一会话内多段并发流」。服务端侧的做法是把一条消息拆成可追加的结构——一次流还在生成时，新指令作为 next turn 入队，服务端在同一 SSE 连接上按序下发多段 delta，每段带自己的 turn id；或者客户端开第二条请求，服务端按消息 id 做串行化，保证同一消息的生成顺序。前端侧要解决的是渲染合并：不同 turn 的 delta 追加到同一气泡里，需要按 turn id 排序、按 seq 去重，避免乱序到达导致文字错位。工程上还要处理「新指令让模型改变主意」时的上下文——把上一段的已生成部分作为 assistant 消息、新指令作为 user 消息追加，而不是从头重来。

**虚拟列表的 range 计算**：固定高度是最简单的情形。设 `itemHeight = h`，可见区高度 `H`，滚动偏移 `scrollTop`：

```
start = Math.floor(scrollTop / h)
visibleCount = Math.ceil(H / h)
end = start + visibleCount
```

再往外扩 overscan：`renderStart = max(0, start - overscan)`，`renderEnd = min(total, end + overscan)`。渲染时用一个高度为 `total * h` 的占位容器撑开滚动条，真实列表绝对定位并整体 `translateY(renderStart * h)`。

不定高就不能直接除了。两条路：一是**预估 + 实测修正**，先按平均高度估出位置表（前缀和数组），渲染后测量真实高度写回并重算后面所有项的偏移（这就是 react-virtualized 的 `CellMeasurer` 思路）；二是**二分查找**，维护一个累积偏移数组 `offsets[i]`，用 `binarySearch(scrollTop)` 找到第一个 `offsets[i] > scrollTop` 的 i 作为 start。不定高场景下必须缓存已测高度，否则滚动回来会跳动。

**overscan 太大或太小**：太小（比如 0 或 1）——滚动时新进入视口的项还没渲染，用户会看到空白闪烁；图片或字体加载完成引起高度变化时更容易露出破绽。太大——一次渲染的 DOM 节点数暴增，首屏渲染时间与内存占用线性上升，虚拟列表本来要解决的性能问题又回来了；同时每次滚动触发的 diff 范围变大，滚动反而更卡。经验值是 3~10 个屏幕外项，滚动快的列表取大、渲染成本高的项取小；能配合 `content-visibility` 或 `IntersectionObserver` 做二级懒渲染更好。

**20 个请求同时 401，只刷新一次 Token**：核心是「单飞（single-flight）+ 队列」。拦截器里判断：如果不是刷新接口本身且返回 401，就看当前有没有正在进行的刷新——没有就发起刷新并把 `isRefreshing` 置 true；有就把这个请求包成一个 Promise 塞进等待队列。刷新成功后，把新 token 写回存储、遍历队列逐个重放（重放时要带新 token），清空队列；刷新失败就全部 reject 并跳登录页。伪代码骨架：

```js
let refreshing = null;
let queue = [];

async function on401(config) {
  if (!refreshing) {
    refreshing = refreshToken().finally(() => { refreshing = null; });
    refreshing.then(t => queue.forEach(cb => cb(t))).catch(e => queue.forEach(cb => cb(e, true)));
    queue = [];
  }
  return new Promise((resolve, reject) => {
    queue.push((token, failed) => {
      if (failed) return reject(token);
      config.headers.Authorization = `Bearer ${token}`;
      resolve(axios(config));
    });
  });
}
```

坑点：刷新接口自身的 401 要排除，否则死循环；并发重放要限流，20 个一起打回去可能又撞限流；多标签页场景下刷新要跨页共享（用 localStorage 加锁或 BroadcastChannel），否则每个标签页各刷一次，旧 refresh token 会被后刷的作废。

**SSR 与 CSR 的适用场景**：SSR 适合「首屏内容对 SEO 或首屏体验敏感」的页面——营销页、内容详情、搜索结果，服务端直出完整 HTML，用户和爬虫都能立刻拿到内容，代价是服务端要承担渲染成本、要用同构代码（浏览器 API 得判环境）、缓存与扩容更复杂。CSR 适合「强交互、登录后、对首屏内容不敏感」的应用——后台管理、工具型产品，首屏给个骨架，路由切换全在前端完成，开发简单、部署就是静态文件。中间态是 SSG（构建时生成，内容变化少）和 ISR（增量再生，兼顾新鲜度与成本）。真实项目通常是混合：营销与内容页 SSR/SSG，应用页 CSR。

**全部组件懒加载的负向效果**：请求数爆炸，每个 chunk 一个 HTTP 请求（HTTP/2 下虽可多路复用，但仍有连接与解析开销）；大量细碎 chunk 让小文件的总下载量比一个大包更大（每个文件都有头部与压缩字典重置的开销）；首屏要等关键 chunk 下载 + 解析后才渲染，懒加载层级太深时出现瀑布式串行加载（A 加载完才知道要 B）；切换页面时出现 loading 闪烁，体验反而变差。正确做法是按路由和用户路径分片，把首屏必需的和高频共用的打进主包，低频的（弹窗、重型图表库、编辑器）才拆；配合 prefetch（空闲时预取可能用到的 chunk）消除等待。

**Whistle 代理解决跨域的原理**：跨域是浏览器的同源策略在拦——限制的是页面脚本读取跨源响应，不是请求发不出去。代理把「浏览器 → 目标服务」变成「浏览器 → 本地代理 → 目标服务」：浏览器请求的是 `localhost:8899`（同源），代理转发到真实后端并把响应原样带回。因为同源，浏览器不做 CORS 校验。代理还能顺手改写响应头（注入 `Access-Control-Allow-Origin`）、把线上域名映射到本地（`/etc/hosts` 级别的规则）、替换静态资源文件做 mock。本质上开发期的跨域绕行方案，生产环境还是要在服务端配 CORS 或用同域网关。

**HTTPS 握手**：TLS 1.2 是 2-RTT（完整握手）：ClientHello（支持的版本、密码套件、随机数、SNI）→ ServerHello（选定套件、随机数）+ Certificate（证书链）→ 客户端验证证书链（是否可信 CA 签发、域名是否匹配、是否过期、是否被吊销）→ 用服务端公钥加密 pre-master secret 发过去（RSA 密钥交换）或走 ECDHE 交换参数 → 双方用三个随机数导出会话密钥 → ChangeCipherSpec + Finished 验证握手完整性。之后所有应用数据用对称加密（AES-GCM / ChaCha20）传输。TLS 1.3 砍到 1-RTT（重连 0-RTT）：只保留 ECDHE 类前向安全的密钥交换，握手消息合并，证书也加密。要点是「非对称只用来协商密钥和验证身份，真正的数据传输用对称加密」——因为非对称太慢。

**在浏览器输入 URL 到渲染**：URL 解析 → 查缓存（浏览器缓存、Service Worker）→ DNS 解析（浏览器 DNS 缓存 → 系统 hosts → 本地 DNS → 递归查询）→ 建立 TCP 连接（三次握手，HTTPS 再加 TLS 握手）→ 发 HTTP 请求（带 cookie、UA、Accept 等头）→ 服务端处理并返回响应（可能经 CDN / 负载均衡 / 反向代理）→ 浏览器解析：HTML 构建 DOM、遇到 CSS 构建 CSSOM、两者合成 Render Tree → 布局（Layout，算几何位置）→ 绘制（Paint）→ 合成（Composite，分层后由 GPU 合成上屏）。过程中遇到 `<script>` 会阻塞解析（除非 async / defer）；遇到图片、字体这类资源不阻塞 DOM 构建但会影响渲染。首屏之后还有 JS 执行、事件绑定、懒加载资源的后续请求。

**代码分包的优雅实现**：路由级分包（每个路由一个 chunk，配合 prefetch 预取下一步可能去的路由）是基线；再往下按「使用时机」拆——首屏不用、交互后才出现的（弹窗、富文本编辑器、图表库、地图）用动态 `import()` 在事件里加载；第三方大依赖单独成 chunk 便于长缓存（vendor split，用 `splitChunks.cacheGroups` 按包名或命中率分组）；公共代码抽 shared chunk 避免重复打包。进阶手段是模块联邦（微前端场景跨应用共享依赖，避免各子应用各打一份 React）、以及基于实际访问数据的 chunk 合并（把总是一起加载的多个小 chunk 合并，减少请求数）。

**React useEffect 闭包陷阱**：典型代码是

```jsx
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, []);
```

count 会一直停在 1。原因是 effect 只在挂载时执行一次，闭包捕获的是首次渲染时的 `count = 0`，每次定时器都算出 `0 + 1 = 1`，而 `setCount(1)` 在值相等时还会被跳过后续更新。修复有两条路：用函数式更新 `setCount(c => c + 1)`——不依赖闭包里的旧值；或者把 `count` 加进依赖数组（但那样每次 count 变化都会重建定时器，等于每秒重启一次，副作用行为不对）。正确写法是前者。这道题考的是「闭包捕获的是渲染快照」这个心智模型，以及依赖数组不完整带来的 stale closure。

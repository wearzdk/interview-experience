---
title: "天翼云Web前端一面：缓存设计与虚拟列表"
company: 天翼云
position: Web前端开发
round: 一面
date: 2026-09
source: 牛客网
tags: ["前端","浏览器缓存","虚拟列表","Web安全","Promise","WebSocket"]
summary: "天翼云Web前端一面面经，面试时间9月22日、时长约半小时。题目覆盖Go slice与PE文件头、HTML与DOM的关系、Promise、WebSocket与HTTP、前端常见攻击与防御、虚拟列表、浏览器缓存，以及图片URL变化但内容不变时如何复用缓存的设计题。"
---

### 《面试题目》

1. Go 语言的 slice 是什么？
2. PE 文件头有哪些字段？（因简历中有 Go 写的 PE 文件解析器）
3. HTML 和 DOM 的关系是什么？
4. Promise 是什么？
5. WebSocket 协议是什么？它和 HTTP 的关系是什么？
6. Web 前端有哪些常见的攻击方式，怎么防御？
7. 你是网安专业的，为什么不去干网安，来做前端？
8. 现在 AI 发展这么快，有没有考虑过前端会被取代？
9. 虚拟列表是什么？
10. 浏览器缓存是怎么做的？
11. 如果图片资源的 URL 总会改变，但图片资源本身没变，怎么设计一个方案，让浏览器继续用以前的图片而不是重新请求资源？

### 《参考解析》

**图片 URL 变化但内容不变，如何复用缓存**：这是「内容寻址」的经典题，先要问清 URL 为什么会变（发版重新上传、CDN 加时间戳、URL 里带了随机查询串），因为不同原因方案不同。核心思路是让缓存键与内容绑定，而不是与路径绑定：

- 内容哈希：上传时对图片内容算哈希（MD5/SHA-256），URL 用 `/img/<hash>.webp`。内容不变则 URL 不变，天然命中强缓存；内容变了 URL 才变，也不会读到旧图。这是最优解，前端构建产物（webpack/vite 的 `[contenthash]`）就是这个套路。
- 如果 URL 由后端/第三方生成且无法改成内容哈希，就用「URL → hash」的映射层：前端先拿逻辑 ID 去查一份清单（`imageId -> contentHash`），再把真实请求指到 `CDN/<hash>`；清单本身用短 TTL 或 ETag 校验，代价只有一次小请求。
- 协商缓存兜底：给图片响应配置 `ETag`（用内容的哈希）与 `Cache-Control: no-cache`，浏览器每次带 `If-None-Match` 问一次，服务端比对 ETag 后返回 304 空响应体，虽然省了图片体积但要一次 RTT，不是最优。
- 前端本地兜底：靠 `Cache API`（Service Worker）或 IndexedDB 按内容哈希存一份，拦截请求时先按哈希命中本地副本，等价于自己实现一层内容寻址缓存。
- 还可以让 CDN 做重定向：请求旧 URL 时由边缘节点根据内容指纹 301/302 到已缓存的规范 URL，用一次 301 换取后续全命中，但要注意 301 会被浏览器长期缓存，改错很难回滚。

需要提的坑：只改缓存头（比如把 `Cache-Control` 设成永久）而 URL 没变，会导致图片更新后用户一直看旧图；而在 query 里塞随机数/时间戳等于每次都是新 URL，缓存命中率归零——所以一定要把「缓存键」和「内容」对齐。

**浏览器缓存机制**：分强缓存与协商缓存。强缓存由 `Cache-Control`（`max-age`、`s-maxage`、`public/private`、`no-store`、`no-cache`、`immutable`）与历史遗留的 `Expires` 控制，命中时浏览器直接读本地副本，不发请求（DevTools 显示 `from memory cache` 或 `from disk cache`），`no-cache` 不是不缓存而是必须校验，`no-store` 才是完全不存。协商缓存由 `ETag`/`If-None-Match` 与 `Last-Modified`/`If-Modified-Since` 控制，命中返回 `304`，只省响应体不省往返；ETag 精度更高（能感知秒级内修改、内容相同但时间不同），Last-Modified 精度只到秒且无法区分「内容没变只是重新保存」。优先级上 `Cache-Control` 高于 `Expires`，`ETag` 优先于 `Last-Modified`。工程实践是「HTML 走协商缓存（`no-cache`，保证入口能更新），带 hash 的静态资源走强缓存 + 一年 `max-age` + `immutable`」，再配合 CDN 的 `s-maxage` 与刷新策略、Service Worker 做离线兜底。另外还有 `Vary`（按 `Accept-Encoding` 等区分缓存副本）、`stale-while-revalidate`（先给旧副本再后台更新）这些容易加分的细节。

**虚拟列表**：只渲染可视区域内的若干项，用一个撑高的占位容器维持滚动条长度。要素有四：一是高度来源，定高列表直接算 `startIndex = floor(scrollTop / itemHeight)`、`offsetY = startIndex * itemHeight`；不定高需要测量并缓存每项高度（初始估算 + 渲染后回填 + 修正总高，滚动锚点要防止跳动）。二是缓冲，上下各多渲染几项，避免快速滚动出现白屏。三是渲染结构，外层 `overflow: auto`，内部用一个 `height = totalHeight` 的占位层加 `transform: translateY(offsetY)` 的列表层。四是事件与性能，滚动回调要用 rAF 节流，避免滚动中反复同步布局。坑点：动态高度列表的滚动位置漂移、`key` 不稳定导致组件复用错乱（曝光埋点尤其容易误报）、图片懒加载与虚拟化的配合、无障碍与 Ctrl+F 搜索不到未渲染内容。可选方案是 `IntersectionObserver` + 占位符（浏览器原生 `content-visibility: auto` 也能省渲染），实际项目里一般直接用成熟库（react-virtuoso、virtua、vue-virtual-scroller）。

**HTML 和 DOM 的关系**：HTML 是「文本形式的标记语言」，是字节流经过解码、词法分析、语法分析后得到的标记；DOM 是浏览器把这个标记解析后在内存里构建出的对象树（`Document Object Model`），是页面结构的编程接口。关系上：HTML 是源，DOM 是运行时表示，解析过程中遇到 `<script>` 会阻塞解析（除非 `async`/`defer`），遇到 CSS 会阻塞渲染但不阻塞解析；`document.write`、JS 直接改 DOM 都会让 DOM 与原始 HTML 不一致；`innerHTML` 是「把字符串重新解析成 DOM」，性能差且有 XSS 风险，`textContent` 才是纯文本赋值。相关概念还有 CSSOM（样式树）、Render Tree（DOM + CSSOM 合并）、以及 Shadow DOM 提供的封装子树。

**前端常见攻击与防御**：XSS 分存储型、反射型、DOM 型，防御靠输出编码（按上下文 HTML/属性/JS/URL 分别转义）、`textContent` 代替 `innerHTML`、富文本用 DOMPurify 白名单净化、CSP（`script-src` 限制源、禁 `unsafe-inline`，配合 nonce/hash）、Cookie 加 `HttpOnly` 让脚本读不到。CSRF 靠 `SameSite=Lax/Strict`、CSRF Token 双提交校验、关键操作二次验证、校验 `Origin`/`Referer`。点击劫持（iframe 覆盖）用 `X-Frame-Options: DENY` 或 CSP `frame-ancestors`，配合前端 frame busting。还有 SQL 注入（参数化查询，虽然是后端但前端要理解）、开放重定向（跳转白名单）、依赖供应链攻击（锁版本、审计 `npm audit`）、敏感信息泄露（不要把 token/密钥打进前端包，`sourcemap` 不要公开）、以及 `postMessage` 必须校验 `origin`。要能说出「防御在哪里生效」：编码在输出点、CSP 在浏览器策略层、SameSite 在 Cookie 传输层。

**WebSocket 与 HTTP 的关系**：WebSocket 是独立的 `ws://`/`wss://` 协议（默认端口 80/443），但握手阶段借用 HTTP/1.1 的 Upgrade 机制（`101 Switching Protocols`），握手完成后就是全双工帧协议，不再有请求-响应语义，服务端可以主动推送。与 HTTP 的差异：HTTP 是「客户端请求—服务端响应、无状态、每次带完整头部」，WebSocket 是「一次握手长期连接、双向、有状态、帧开销仅几字节」。适用场景上，服务端单向推送且不需要客户端频繁上行时，SSE（`text/event-stream`）更简单、能自动重连、走 HTTP 基础设施；需要双向低延迟交互（协作编辑、游戏、交易）才上 WebSocket。部署注意代理与网关要支持 Upgrade 并放宽空闲超时，还要自己做心跳与重连。

**Promise 是什么**：Promise 是对「未来才会有的结果」的抽象，三种状态 `pending/fulfilled/rejected` 且不可逆，用 `then/catch/finally` 注册回调，回调进入微任务队列，因此总在同步代码之后、`setTimeout` 之前执行。它解决的问题是回调地狱与错误传递：`.then` 返回新 Promise，返回值会被自动包装、返回 Promise 会被拍平，异常沿链传递到最近的 `catch`；`Promise.all`（一个失败全失败，适合并行且都要成功）、`allSettled`（等全部结束，不在乎成败）、`race`（第一个落定）、`any`（第一个成功）是四个组合器，要能说清区别。`async/await` 是 Promise 的语法糖，`await` 之后的代码等价于 `then` 回调。常见考点：`Promise` 构造函数里的执行器是同步执行的；`then` 里 `throw` 会变成 rejected；未捕获的 rejected 会触发 `unhandledrejection`；`Promise.all` 的并发是「同时发起」而不是「并行执行」（受限于 JS 单线程与 I/O）。

**Go 的 slice**：slice 是对底层数组的视图，结构上是三个字段——指向数组的指针、长度 `len`、容量 `cap`。`make([]int, 0, 10)` 会分配容量 10 的底层数组；`append` 在 `len < cap` 时原地写入并返回新 slice（共享底层数组），超出容量时按策略扩容（小 slice 约翻倍，大的增长比例降到 1.25 左右）并复制数据，此后与原 slice 脱钩。这带来两个经典坑：一是 `a := b[1:3]` 这种切片与原 slice 共享内存，改一个影响另一个，且因为引用着大数组会导致内存无法回收（长时间持有小切片要用 `copy` 拷出来）；二是 `append` 后忘记接收返回值。函数传参传的是 slice header 的副本，所以函数内 `append` 越界扩容不会影响调用方看到的内容，但修改已有元素会互相可见。

**PE 文件头字段**：PE（Portable Executable）是 Windows 的可执行/动态库格式，结构顺序是 DOS 头（`IMAGE_DOS_HEADER`，前两字节魔数 `MZ`，偏移 `0x3C` 处的 `e_lfanew` 指向 PE 头）→ PE 签名 `PE\0\0` → COFF 文件头（`IMAGE_FILE_HEADER`：`Machine` 机器类型、`NumberOfSections` 节数量、`TimeDateStamp` 时间戳、`SizeOfOptionalHeader`、`Characteristics` 属性）→ 可选头（`IMAGE_OPTIONAL_HEADER`：`Magic` 区分 PE32/PE32+、`AddressOfEntryPoint` 入口点 RVA、`ImageBase` 建议加载基址、`SectionAlignment`/`FileAlignment` 对齐、`Subsystem` 子系统、`SizeOfImage`、`NumberOfRvaAndSizes`，其后是数据目录数组 `DataDirectory`，包含导出表、导入表、资源、重定位、TLS、调试等 16 项）→ 节表（`IMAGE_SECTION_HEADER` 数组：`.text`/`.data`/`.rdata`/`.rsrc` 各自的虚拟地址、虚拟大小、文件偏移与属性）。解析器要处理的正是 RVA 到文件偏移的换算（按节表找所属节）与导入表/导出表的遍历，这也是杀软做静态特征扫描的基础。

---
title: "字节抖音前端二面：事件循环、渲染管线与手写 querySelector"
company: "字节跳动"
position: "前端开发"
round: "二面"
date: '2026-10'
result: "二面通过"
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/4c5ef075bb7d4b348b3c0ad22a0b94bf
tags: ["字节跳动","抖音","前端","事件循环","浏览器渲染","Vue3","Vite","RAG","手写代码"]
summary: "字节抖音前端二面：浏览器事件循环与渲染全流程、defer/async、Symbol、CSS 优先级、Vue3 响应式、Webpack 与 Vite、性能优化、大文件上传、RAG 注入防护与 Agent 成本控制，手写精简 querySelector。"
---

### 《面试题目》

1. 自我介绍，梳理实习与个人 Agent 项目。
2. 浏览器事件循环机制，宏任务微任务区别、队列清空规则，requestAnimationFrame 执行时机。
3. 浏览器完整页面渲染流程，DOM 树、CSSOM、渲染树、重排重绘、图层合成；哪些操作会触发重排。
4. script 标签 defer 与 async 的差异。
5. Symbol 相关 API 以及内置 well-known 符号的用法。
6. CSS 选择器优先级、属性选择器语法、CSS 继承规则。
7. Vue3 Proxy 响应式原理，ref 和 reactive 的区别。
8. Webpack 与 Vite 核心差异。
9. 前端性能优化从网络、CSS、JS、框架、工程化分别说方案。
10. Monorepo 仓库的构建优化手段。
11. 大文件分片上传如何做提速、断点续传、并发控制。
12. RAG 场景下提示词注入有哪些防护手段。
13. 自研 Agent 如何做评测、可观测性、控制 token 成本。
14. 手写代码：实现精简版 querySelector，仅支持类选择器、后代选择器。
15. 反问：团队业务分工、Agent 工作流防跑偏方案、外部模型报销、新人培养机制。

### 《参考解析》

**事件循环与 rAF**：调用栈清空后先清空微任务队列，再取一个宏任务执行，如此循环。宏任务包括 script 整体、`setTimeout`/`setInterval`、I/O、UI 事件；微任务包括 `Promise.then`、`queueMicrotask`、`MutationObserver`。关键规则是「每个宏任务结束后把微任务队列彻底清空」，微任务里再产生的微任务也会在同一轮清掉，所以递归 `Promise.then` 可以饿死渲染。渲染不是宏任务，浏览器在两次任务之间按刷新率决定是否走「样式 → 布局 → 绘制 → 合成」，`requestAnimationFrame` 的回调就在这次渲染更新开始时执行，排在微任务之后、布局之前；因此 rAF 里改样式能赶上这一帧，而 `setTimeout(0)` 要等下一轮任务，时机更晚且可能掉帧。页面隐藏时 rAF 暂停，`setTimeout` 仍会触发（被节流），这是两者在后台行为上的差别。

**渲染管线**：HTML 解析成 DOM，CSS 解析成 CSSOM，两者合成渲染树（只含可见节点），然后布局计算几何位置（重排），绘制生成绘制指令，最后按图层合成上屏。改几何属性（宽高、位置、间距、字体、增删 DOM）会触发重排；只改颜色、背景、可见性会触发重绘；`transform`、`opacity`、`filter` 可以只走合成，不重排不重绘。读 `offsetHeight`、`getBoundingClientRect`、`getComputedStyle` 会强制同步布局，如果在循环里「读-写-读」就会造成布局抖动，解决方法是先批量读、再批量写，或者用 `requestAnimationFrame` 把写操作集中到帧开始。`will-change`、`contain` 能提前分层或隔离布局，但滥用会增加显存和合成开销。

**defer 与 async**：两者都不阻塞 HTML 解析的下载。`defer` 保证按文档顺序在解析完成后、`DOMContentLoaded` 之前执行，适合有依赖关系的脚本；`async` 是下载完立刻执行，顺序不保证，可能打断解析，适合独立的统计、广告脚本。`type="module"` 默认带 defer 行为，并且作用域隔离、支持静态导入。动态插入的 script 默认是 async，需要保序时要显式设 `script.async = false`。

**Symbol**：`Symbol()` 每次返回唯一值，`Symbol.for(key)` 走全局注册表、`Symbol.keyFor` 反查；Symbol 作为属性键不会出现在 `for...in`、`Object.keys`、`JSON.stringify` 里，适合做「不想被意外遍历/序列化」的元数据。well-known symbols 用来定制语言行为：`Symbol.iterator` 让对象可被 `for...of`/展开，`Symbol.asyncIterator` 对应异步迭代，`Symbol.hasInstance` 定制 `instanceof`，`Symbol.toPrimitive` 定制类型转换，`Symbol.toStringTag` 改 `Object.prototype.toString` 的结果，`Symbol.species` 控制派生对象构造器。回答时补一句「Symbol 不是私有属性，`Object.getOwnPropertySymbols` 仍能拿到」，避免把它说成真正的访问控制。

**CSS 优先级与继承**：优先级从高到低是行内样式、ID、类/属性/伪类、元素/伪元素，同权重看后来居上；`!important` 高于普通声明，但用户样式与浏览器默认样式之间还有一层优先级规则。` :where()` 权重为 0，`:is()`/`:not()` 取参数里最高的权重，`!important` 尽量少用。属性选择器有 `[attr]`、`[attr=value]`、`[attr~=value]`（空格分隔的词）、`[attr|=value]`（等于或前缀 `value-`）、`[attr^=]`、`[attr$=]`、`[attr*=]`，后三个分别匹配开头、结尾、包含，区分大小写可用 `i` 标志。继承只发生在可继承属性上（color、font、line-height、letter-spacing、visibility 等），盒模型、定位、背景不继承；`inherit`/`initial`/`unset`/`revert` 可以显式控制。

**Vue3 响应式**：`reactive` 用 `Proxy` 包住对象，`get` 时通过 `track` 收集当前副作用（渲染函数、computed、watch），`set`/`deleteProperty` 时 `trigger` 通知依赖；支持新增/删除属性、数组索引与 `length`，这是 Proxy 相对 `Object.defineProperty` 的优势。`ref` 用一个带 `get value`/`set value` 的对象包住任意值，基本类型也能响应，模板里自动解包；`reactive` 只接受对象，且解构会丢响应性（要用 `toRefs`）。两者不是互斥的：`ref` 内部对对象值也会用 `reactive` 处理。注意 `Proxy` 只能代理对象本身，整体替换 `reactive` 变量会丢引用，`shallowRef`/`shallowReactive` 用于大对象或第三方实例的性能优化。

**Webpack 与 Vite**：Webpack 是「先打包再服务」，开发时也要构建依赖图，冷启动和 HMR 随项目规模变慢，生态和配置成熟，适合复杂构建需求；Vite 开发时用浏览器原生 ESM 按需加载，依赖用 esbuild 预构建，冷启动快、HMR 只更新受影响模块，生产构建交给 Rollup。Vite 的代价是开发与生产行为存在差异（ESM 与打包、插件兼容），老浏览器和特殊 loader 场景要额外处理；Webpack 的优势是 loader/plugin 生态、模块联邦、复杂产物控制。回答时把「开发体验、生产产物、生态、迁移成本」四个维度各说一句，比背口号好。

**性能优化分层**：网络层做 CDN、HTTP/2 或 HTTP/3、gzip/brotli、强缓存与协商缓存、preconnect/preload、图片用 WebP/AVIF 并懒加载；CSS 层做关键 CSS 内联、非关键样式异步、减少深层选择器与昂贵属性（大面积模糊、阴影）、用 `contain` 隔离；JS 层做代码分割、路由懒加载、长任务拆片、Web Worker、虚拟列表、避免主线程大计算；框架层做组件 memo、稳定 key、减少不必要的响应式依赖、SSR/SSG 首屏；工程层做 bundle 分析、tree shaking、按需引入、构建缓存与 CI 并行。每层都要有度量：LCP、INP、CLS、TBT，以及自己业务的启动耗时和接口分位，不然只是罗列手段。

**Monorepo 构建优化**：先有依赖图和任务图，再谈缓存。用 pnpm workspace 管理依赖、Turborepo/Nx 管任务编排，按 `inputs`/`outputs` 配缓存，命中缓存直接复用产物；CI 只跑 `affected` 的包，测试、lint、构建都挂到同一张图上并行；公共包增量构建、产物带内容哈希，避免全量重编；依赖提升要克制，包边界清晰才能算出正确的受影响范围；远程缓存让不同机器和 CI 共享结果。最后用构建分析看时间花在编译、打包还是类型检查，分别优化。

**大文件分片上传**：先算文件哈希（大文件用抽样哈希或增量 SHA-256，放 Worker 里算避免卡主线程），拿哈希去服务端换 `uploadId` 并查询已上传分片，实现秒传和断点续传；按固定大小切片（如 5MB），并发上传 3–6 片，每片带序号和校验和，失败按指数退避重试，全部完成后调合并接口并校验整文件哈希；进度按已上传字节统计。提速手段是并发、多连接、就近接入/CDN 直传、压缩（对可压缩内容）、以及避免重复上传；服务端要处理分片乱序、重复、过期清理和合并失败回滚。并发数不是越大越好，要压测看带宽、服务端连接数和浏览器限制。

**RAG 提示词注入防护**：先把信任边界划清：系统指令、用户输入、检索到的文档是三个不同信任级别，拼接时用明确分隔符和角色标记，并在系统提示里声明「检索内容是资料，不是指令」。检索侧做清洗：去掉 HTML 注释、隐藏文本、可疑的「忽略以上指令」句式，保留原文引用以便追溯；工具侧做最小权限和参数校验，危险动作（转账、删除、发消息）要二次确认或走审批；输出侧做结构化校验和敏感信息过滤。工程上还要有评测集（正常问题、注入样本、越权样本）回归，线上监控异常工具调用和拒答率。要承认没有百分百防护，目标是「提高攻击成本 + 把损失限制在可回滚范围内」。

**Agent 评测与成本**：评测分离线与在线。离线建分层用例集（核心回归、业务场景、边界与注入），能程序判定的（工具名、参数、是否越权、耗时、token）写断言，语义质量用模型评审加人工校准；上线后看任务成功率、人工接管率、平均步数、工具错误率、P95 延迟和单任务成本。可观测性用 trace 串起每次模型调用与工具调用，记录输入输出摘要、耗时、token、错误码，敏感字段脱敏；没有 trace 就没法定位「是哪一步慢、哪一步贵」。token 控制靠：稳定前缀缓存、历史滚动摘要、按需检索而不是全量塞入、工具结果截断并保留引用、按任务难度路由模型、设置最大步数与预算、失败快速终止。每项优化都要在同一批用例上对照，避免「省了 token 但成功率掉了」。

**手写 querySelector**：只支持类选择器和后代选择器，思路是「按空格拆成复合选择器，从右往左匹配，再按文档顺序找第一个」。实现：`parts = selector.trim().split(/\s+/)`；`matchCompound(el, sel)` 解析 `.a.b` 这种形式，拆出所有类名，用 `el.classList.contains` 全部命中；`matches(el)` 先匹配最右一段，然后从 `el.parentElement` 往上找前一段，找到就继续往前，全部匹配完返回 true；遍历用深度优先，先判断当前元素，再递归子元素，保证返回文档顺序的第一个。复杂度最坏是 `O(节点数 × 选择器段数 × 深度)`，实际 DOM 不深可以接受。边界要处理：空选择器、多个空格、大小写、重复类名；如果还要支持标签或 ID，在 `matchCompound` 里加 `tagName`/`id` 判断即可。

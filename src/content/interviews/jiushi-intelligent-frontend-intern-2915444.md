---
title: 九识智能前端实习面经：缓存与事件循环
company: 九识智能
position: 前端开发（实习）
date: '2026-09'
source: 牛客网
tags: ["前端","Promise","HTTP缓存","事件循环","虚拟DOM","闭包","数组去重","实习"]
summary: "九识智能前端实习一面回忆版，顺序不代表提问顺序，考察Promise.all/race/allSettled、Vue与React对比、HTTP强缓存与协商缓存、事件循环、虚拟DOM、闭包与本地缓存，手撕数组去重。"
---

### 《面试题目》

1. Promise 的 all / race / allSettled
2. 你觉得 Vue 和 React 哪个好用，有什么区别
3. HTTP 强缓存、协商缓存
4. 事件循环
5. 你知不知道 React 的虚拟 DOM
6. 闭包
7. 本地缓存有哪些
8. 手撕：数组去重

### 《参考解析》

**Promise.all / race / allSettled**：三者都是把多个 Promise 组合成一个。`Promise.all` 等全部成功才成功，结果是按输入顺序排列的结果数组；**只要有一个 reject，整体立刻 reject**（其余 Promise 仍在执行，只是结果被忽略）。`Promise.race` 取最先 settle 的那个（无论成功失败），常用于超时控制。`Promise.allSettled` 等全部 settle，永远 resolve，返回 `[{status:'fulfilled', value}, {status:'rejected', reason}]`，适合「不关心单个失败、要汇总全部结果」的场景。还应该主动补上 `Promise.any`（第一个成功就 resolve，全部失败才 reject 并抛 `AggregateError`），以及三个工程要点：一是传入的如果不是 Promise 会被 `Promise.resolve` 包装（所以可以传普通值）；二是空数组时 `all`/`allSettled` 立即 resolve，`any` 立即 reject；三是 `all` 的快速失败容易造成「请求已发出但结果被丢弃」，如果要控制并发应该自己写池化（比如限制 5 个并发分批跑），而不是靠 `all`。

**Vue 与 React 的区别**：从数据更新机制切入最清楚。Vue 是响应式 + 细粒度依赖追踪：`ref`/`reactive` 用 Proxy 拦截读写，组件渲染时收集依赖，数据变了精确通知到依赖它的组件/副作用重新执行；模板经编译期优化（静态提升、PatchFlag）后 diff 范围小。React 是「状态变了就重新执行整个函数组件」，靠 `setState` 触发，协调（Reconciliation）时对比新旧 VNode 树，用 key 做同层 diff，配合 `memo`/`useMemo`/`useCallback` 手动控制重渲染。因此：Vue 的心智负担更低、模板上手快、响应式自动精确；React 更「就是 JS」，逻辑复用靠 Hooks/自定义 Hook，生态和跨端（React Native）更广，但对重渲染和闭包陷阱要自己留心（`useEffect` 依赖数组、闭包捕获旧值）。其他差异：Vue 官方全家桶（路由、状态管理、构建）一体化，React 更依赖社区选型；Vue 的 `v-model`/指令写起来更简洁，React 用 JSX 表达力更强更灵活。回答「哪个好用」时要给场景结论：小团队快速交付、后台系统偏 Vue；复杂交互、需要跨端、团队 JS 功底强偏 React。

**HTTP 强缓存与协商缓存**：强缓存不发请求，直接读本地：响应头 `Cache-Control: max-age=31536000, immutable`（HTTP/1.1，优先）或 `Expires`（绝对时间，受客户端时钟影响，已过时）；命中时浏览器直接用本地副本，`from disk cache` / `from memory cache`。协商缓存要发一次请求带校验字段，服务端比对后返回 304 让浏览器用本地副本：`Last-Modified` + 请求头 `If-Modified-Since`（秒级精度、内容没变但修改时间变了会误判），`ETag` + `If-None-Match`（内容哈希，精度高但有计算开销；强 ETag 字节级、弱 ETag 语义级）。优先级上 `Cache-Control` 覆盖 `Expires`，`ETag` 优先于 `Last-Modified`。工程实践要补：带 hash 的静态资源用一年强缓存 + immutable；HTML 入口文件用 `no-cache`（可缓存但每次都校验）或短 max-age，避免用户拿到旧版本引用不到新资源；`no-store` 是完全不缓存，用于敏感数据；刷新行为差异——地址栏回车走强缓存，F5 会带 `Cache-Control: max-age=0` 强制走协商缓存，Ctrl+F5 全部跳过；跨域/CDN 场景还要注意 `Vary` 头（比如按 `Accept-Encoding` 区分）和 CDN 的缓存键与回源策略。

**事件循环**：浏览器里 JS 单线程靠事件循环驱动，一轮的顺序是「执行同步代码 → 清空微任务队列（新产生的微任务也在本轮做完）→ 执行一个宏任务 → 再清微任务 → 需要时渲染」。宏任务包括 `setTimeout`/`setInterval`、事件回调、I/O、`MessageChannel`、`setImmediate`（Node）；微任务包括 `Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`。要能徒手推导顺序，比如：

```js
console.log('1');
setTimeout(() => console.log('2'));
Promise.resolve().then(() => console.log('3'));
console.log('4');
// 输出：1 4 3 2
```

`async/await` 的要点是 `await` 之后的代码等价于 `then` 回调，属于微任务；Node 侧还有 `process.nextTick`（比 Promise 微任务更早）和 `setImmediate`（check 阶段）、`setTimeout` 0ms 与 `setImmediate` 的顺序不确定（受 1ms 计时影响）。延伸：为什么长微任务链会卡住渲染与输入响应（微任务清空前不渲染）、以及 `requestAnimationFrame` 在渲染前执行、适合做动画。

**React 虚拟 DOM**：虚拟 DOM 是用 JS 对象描述 UI 结构的轻量树（`React.createElement`/JSX 编译后产出 `{type, props, children}`），它解决的核心问题是「让开发者用声明式写法描述 UI，同时把真实 DOM 操作交给框架批量、最小化地执行」。更新流程是：状态变更 → 重新执行组件函数得到新的 VNode 树 → 与旧树 diff（React 的启发式规则：只做同层比较、不同类型直接替换整棵子树、同层列表靠 `key` 匹配复用）→ 把差异（增删改）收集成 effect list 一次性提交到真实 DOM（commit 阶段）。它的价值在于：屏蔽浏览器差异与手动 DOM 操作、提供声明式编程模型、让跨端渲染（React Native/SSR）只需替换 renderer、以及批处理更新减少重排重绘。要注意常见误解：虚拟 DOM 「一定比手写 DOM 快」是错的，它的优势是可维护性和在复杂应用中避免大范围重排，极端性能场景（高频动画、长列表）反而要 `useMemo`、虚拟滚动或直接操作 DOM。React 18 之后还有 Fiber 架构（可中断的渲染工作单元、优先级调度）和并发特性，这是与 Vue 的编译期优化不同的一条路线。

**闭包**：闭包是函数与其定义时所处词法环境的组合——内部函数引用了外部函数的变量，导致外部函数执行完后这些变量仍不被回收。常见用途：私有变量与模块封装（IIFE）、函数柯里化与偏函数、防抖节流的状态保持、以及循环里异步回调捕获变量（`for (var i...)` 经典坑，用 `let` 的块级作用域或 IIFE 解决）。代价是内存占用：被闭包引用的变量常驻，若持有大对象或 DOM 引用会泄漏，需要显式置 null 或在卸载时清理。Vue/React 里两个高频考点：`useEffect` 的清理函数必须返回以清掉定时器和监听；以及闭包会捕获渲染时的旧 state（stale closure），解法是用 `useRef` 或把依赖写全。

**本地缓存有哪些**：按层次列全：`Cookie`（4KB、随请求发送、可 HttpOnly，用于会话凭证）、`localStorage`（5～10MB、永久、同步 API、不随请求发送，适合主题/草稿）、`sessionStorage`（同源同标签页、关闭即清，适合多步表单）、`IndexedDB`（容量大、异步、支持索引与事务，适合离线数据和大量结构化缓存）、`CacheStorage`（配合 Service Worker 缓存请求响应，PWA 离线）、以及内存缓存（模块级变量、`Map`，刷新即失）。再补浏览器 HTTP 缓存（强缓存/协商缓存）和 `history.state`/URL 参数这类轻量状态承载。选型依据是「大小、生命周期、是否随请求发送、同步还是异步、是否需要结构化查询」。

**数组去重**：先给最简单写法，再补细节和边界。

```js
// 1) Set：最简洁，NaN 也能正确去重（SameValueZero），但无法区分 1 和 '1'
const unique = (arr) => [...new Set(arr)];

// 2) filter + indexOf：保留首次出现，注意 NaN 会被当成找不到而全部保留
const unique2 = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);

// 3) 对象引用类型（比如 {id} 列表）按 key 去重，用 Map 保留首次出现
const uniqueBy = (arr, key = 'id') =>
  [...new Map(arr.map((it) => [it[key], it])).values()];
```

回答时要主动说三点：`Set` 用的是 SameValueZero，所以 `NaN` 只保留一个、`+0` 和 `-0` 视为相同；对象字面量即使内容一样也是不同引用，去不掉，必须按业务 key；如果数组很大要注意 `indexOf` 是 O(n²)，用 `Set` 或 `Map` 是 O(n)。如果面试官追问「保持原顺序」，上面三者都保持首次出现的顺序。

**面试体验备注**：原帖记录面试官未开摄像头、八股无追问、全程约 20 分钟，判断是 KPI 面。遇到这种流程，建议把每个问题都答到「结论 + 原因 + 一个例子」的完整结构，并主动抛出一两个可深挖的点争取追问；同时不必因为对方节奏快就怀疑自己的表现，把复盘重点放在知识盲区上。

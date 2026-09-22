---
title: 快手前端（电商）二面无项目拷打版
company: 快手
position: 前端开发
round: 二面
date: '2026-09'
source: 牛客网
tags: ["React","单向数据流","useMemo","useLayoutEffect","SSE","手写题"]
summary: "快手电商前端二面面经，题目集中在 React 原理：单向数据流的优缺点、useMemo 与 memo 的区别、useEffect 与 useLayoutEffect 执行顺序、SSE 原理与低版本兼容，手撕同步 localStorage 的 Hook。"
---

### 《面试题目》

1. 你对 React 的理解是什么？
2. 为什么是单向数据流？
3. 单向数据流的优缺点？
4. `useMemo` 和 `React.memo` 的区别？
5. `useEffect` 和 `useLayoutEffect` 的区别，它们俩谁先执行？
6. SSE 原理（经典题）。
7. 浏览器版本过低，SSE 怎么兼容？
8. 手撕：手写一个 localStorage Hook，传入 key 和初始值，返回一个状态函数，同步 localStorage，页面刷新不影响。

### 《参考解析》

**对 React 的理解**：可以从三层说。① 视图层定位——React 是「用状态描述 UI」的库：UI 是状态的函数 `UI = f(state)`，开发者只声明「在什么状态下渲染成什么样」，由 React 负责把真实 DOM 更新到目标状态。② 核心机制——JSX 编译成 `createElement`/`jsx` 调用的元素对象树（虚拟 DOM），更新时重新执行组件函数得到新树，用 diff（同层比较 + `key` 匹配 + 类型不同直接替换）算出最小变更集，再批量提交到 DOM；配合 Fiber 架构把渲染拆成可中断的小单元，用时间切片保证不长时间占用主线程，并区分优先级（并发特性、`startTransition`）。③ 生态与心智——组件化、单向数据流、Hooks 把状态逻辑从类里抽出来复用，把「副作用」集中到 `useEffect` 管理。答题时把「声明式 UI + 组件化 + 单向数据流 + 虚拟 DOM/Fiber 调度」四个词讲清楚即可，不要只背虚拟 DOM 快（虚拟 DOM 本身不保证更快，真正的收益是可预测的更新和跨平台）。

**为什么是单向数据流、优缺点**：单向数据流指数据从父到子通过 props 传递，子组件不能直接修改父组件的数据，要变更必须通过回调或状态管理把动作上报，由数据源统一更新后重新向下渲染。为什么这样设计：① **可预测性**——任一时刻 UI 只由一份状态决定，出了问题可以顺着数据流向回溯；② 避免多向绑定导致的循环更新与「谁改了我」的调试噩梦；③ 便于实现 diff 与性能优化（父组件状态变化即可确定子树是否需要更新）。缺点：① 深层嵌套时 props 逐层透传（prop drilling），需要 Context 或状态管理库缓解；② 跨组件通信、尤其兄弟/远亲组件之间交互，样板代码多；③ 表单这类双向交互密集的场景写起来比双向绑定啰嗦（受控组件的 value + onChange 样板）；④ 层级深、更新频繁时，状态提升会导致大范围重渲染，需要 `memo`/状态库精细拆分。

**`useMemo` 与 `React.memo`**：两者作用对象不同。`useMemo` 是 Hook，缓存**一次计算的结果值**，依赖不变就复用（`useCallback` 是它的特例，缓存函数引用）；`React.memo` 是组件包装器（HOC），缓存**组件渲染结果**，props 浅比较相等时跳过重渲染。配合方式：父组件把对象/函数作为 props 传给被 `memo` 包裹的子组件时，父组件每次渲染都会创建新引用导致浅比较失败，所以要用 `useMemo`/`useCallback` 稳定引用，两者常常一起用。注意点：`memo` 只做浅比较，props 里有嵌套对象要自定义 `areEqual`；`memo` 有比较成本，叶子节点/渲染便宜的组件包了反而更慢；`useMemo` 不是语义保证（React 可能在极端情况下丢弃缓存），不要用它承载「必须只执行一次」的逻辑（那是 `useRef` 或 `useEffect` 的职责），也不要在依赖数组里漏项。

**`useEffect` 与 `useLayoutEffect`**：执行时机不同。`useLayoutEffect` 在 DOM 变更之后、**浏览器绘制之前**同步执行，会阻塞绘制；`useEffect` 在绘制之后异步执行（在下一帧的空闲时机）。所以顺序是：render → DOM 变更 → `useLayoutEffect` 清理/执行 → 浏览器绘制 → `useEffect` 清理/执行。选择原则：需要「读布局并同步改样式以避免闪烁」的场景用 `useLayoutEffect`（例如根据元素高度做定位、防止 tooltip 跳位置、滚动位置恢复）；其余（数据请求、订阅、日志）一律用 `useEffect`，因为它不阻塞绘制。注意两点：`useLayoutEffect` 在 SSR 环境会告警（服务端没有 DOM，应改用 `useEffect` 或做环境判断）；清理函数在两个 Hook 里都在「下一次执行前」和「组件卸载时」运行。

**SSE 原理与低版本浏览器兼容**：SSE 基于 HTTP 长连接，服务端响应头是 `Content-Type: text/event-stream`、`Cache-Control: no-cache`、`Connection: keep-alive`，然后持续往连接里写纯文本事件，格式是若干 `字段: 值` 行加一个空行结束；字段有 `data`（数据，可多行拼接）、`event`（自定义事件名，用于 `addEventListener` 监听）、`id`（配合 `Last-Event-ID` 请求头实现断点续传）、`retry`（重连间隔毫秒）。浏览器端 `new EventSource(url)` 自动重连（网络断开后按 `retry` 间隔重试，默认约 3 秒），事件有 `open`/`message`/`error`/自定义事件。它的限制：只能单向（服务端 → 客户端）、`EventSource` 只能发 GET 且不能自定义请求头、HTTP/1.1 下同域并发连接数有限（浏览器通常 6 个）、代理层容易缓冲导致「不流式」。兼容与规避：① 低版本浏览器（IE 及部分老版本）不支持 `EventSource` 时，用 `fetch` + `ReadableStream`（或 `XMLHttpRequest` 的 `onprogress`）手动解析 `text/event-stream`，并自己实现重连与 `Last-Event-ID`；② 环境完全不支持流式（老 IE 的 XHR 不支持增量读取）时，降级为轮询（长轮询或定时拉取结果）或 WebSocket；③ 用 Polyfill（如 `event-source-polyfill`）并注意它是否支持自定义 header；④ 工程上统一封装成「优先 EventSource → 不支持则 fetch stream → 再不行则轮询」的适配层，业务代码只订阅统一事件。

**手撕：同步 localStorage 的状态 Hook**：实现约定：入参 `key` 与 `initialValue`，返回 `[state, setState]`（或原帖说的「返回一个状态函数」按面试官要求）；初始化时读 `localStorage.getItem(key)`，读到就 `JSON.parse`，读不到用初始值并写入一次；`setState` 要同时更新内存状态和 `localStorage`，并支持函数式更新 `setState(prev => next)`；用 `useState` 的惰性初始化 `useState(() => read())` 避免每次渲染都读存储；用 `useCallback` 包 `setState` 保持引用稳定。要点与边界：① `localStorage` 只在浏览器存在，SSR 下要判 `typeof window !== 'undefined'`，否则会报错；② 读写要 `try/catch`（隐私模式/配额超限会抛异常，JSON 解析损坏数据也会抛，容错时回落到初始值）；③ 值要序列化（对象必须 `JSON.stringify`），并明确约定存的是 JSON 而不是裸字符串；④ 跨标签页同步：监听 `window.addEventListener('storage', ...)`，当 `e.key === key` 时更新本地 state，这通常是面试官追问的加分点；⑤ 注意多组件用同一个 key 时的同步问题——简单的方案是各自监听 storage 事件，或者退一步抽成全局 store（Context/Zustand）再持久化；⑥ 不要在渲染中直接写 `localStorage`（副作用应在事件处理或 effect 中）。

**面试复盘**：这场二面完全没问项目，全考 React 原理与一道手写题，属于「八股型二面」。应对方式是把 React 的高频对照组（`useMemo` vs `useCallback` vs `memo`、`useEffect` vs `useLayoutEffect`、受控 vs 非受控、`key` 的作用）整理成表，每个都能说出「什么时候用谁、代价是什么」；手写题按「接口约定 → 主流程 → 边界（SSR/异常/跨页同步）」三段写，写完主动补一句边界处理，比默写完就停更容易拿分。

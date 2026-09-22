---
title: 爱奇艺前端日常实习面试（React 与浏览器基础）
company: 爱奇艺
position: 前端开发（日常实习）
date: '2026-09'
source: 牛客网
tags: ["React","setState","事件委托","Promise","HTTP缓存","Git","TCP"]
summary: "爱奇艺前端日常实习面经，全程约 30 分钟。题目以 React 与浏览器基础为主：setState 在 React 18 前后的同步异步差异与不同调用场景、组件通信方式、React 事件委托机制、useMemo 与 useCallback 的区别、单向数据流、Promise 状态、HTTP 状态码与 304、本地存储差异、git pull 与 fetch、TCP 三次握手四次挥手，最后手写一个自动计时的 React 函数组件。"
---

### 《面试题目》

1. `setState` 是同步还是异步？React 18 之前和之后有什么区别？在不同场景下（React 事件、定时器、原生事件）有什么区别？
2. React 中组件之间有哪些通信方式？
3. React 的事件委托了解吗？React 事件是怎么处理的？为什么可以通过统一监听器处理子组件事件？
4. `useMemo` 和 `useCallback` 的区别是什么？
5. React 中单向数据流是什么意思？
6. Promise 有哪几种状态？状态能不能改变？
7. HTTP 状态码了解吗？
8. 304 和 200 有什么区别？
9. `localStorage` 和 `sessionStorage` 的区别是什么？
10. `git pull` 和 `git fetch` 的区别是什么？
11. TCP/IP 三次握手了解吗？
12. TCP 四次挥手呢？
13. 为什么握手是三次、挥手是四次？
14. 除了 flex 布局之外，还有哪些实现垂直居中的方式？
15. 手写题：写一个 React 函数组件，页面中显示一个数字，数字上面有文字，数字每隔 1 秒自动 +1，下面有「+」和「-」两个按钮，点击后立即 +1 / -1。

### 《参考解析》

**setState 是同步还是异步**：准确的说法是「**是否批量合并更新**」。在 React 18 之前，只有 React 管理的事件处理函数（合成事件）和生命周期里会做批处理，表现为「异步」（同一次处理里多次 `setState` 只触发一次渲染）；而在 `setTimeout`、`setInterval`、原生事件监听、Promise 回调里，`setState` 会同步触发重新渲染。React 18 引入 `createRoot` 和 **Automatic Batching**，所有场景默认都批处理，包括定时器、原生事件和 Promise 回调，所以原帖的笔记「18 后就是完全异步」在现象上是对的。需要注意：`setState` 本身并不会立刻改 `this.state`/state 变量，它只是入队；多次调用会合并，需要基于上一次值时用函数式更新 `setState(prev => prev + 1)`，否则连续自增会只生效一次。如果确实要拿到更新后的 DOM，可以用 `flushSync`（会放弃批处理、强制同步刷新，慎用，会损伤性能）或放到 `useEffect` 里读。

**组件通信方式**：① 父传子 props；② 子传父通过回调函数（父把函数作为 props 传下去）；③ 兄弟组件用状态提升到共同父级，或用状态管理库（Redux/Zustand/Jotai）共享；④ 跨层级用 `Context`（配 `useContext`，注意 Provider 值变化会让消费者重渲染，需要 `useMemo` 稳定）；⑤ 全局状态用 Redux/Zustand/MobX/Recoil；⑥ 非 React 场景或跨框架用事件总线/发布订阅（`EventTarget`、mitt）；⑦ 表单场景还有非受控组件 + `ref` 的方式（`useRef` + `forwardRef` + `useImperativeHandle` 暴露命令式方法）。实际工程里推荐「就近原则」：能用 props 就不用 Context，能用 Context 就不引状态库，避免为简单通信引入全局状态。

**React 事件委托与合成事件**：React 17 之前把事件统一委托到 `document`，React 17 起改为委托到**根容器**（`createRoot` 挂载的那个 DOM 节点），这样多个 React 版本或微前端共存时不会互相干扰。流程是：React 在根容器上为每种事件类型注册一个监听器（`dispatchEvent`），事件触发后由 React 收集从目标元素到根容器的**合成事件路径**，构造 `SyntheticEvent`（跨浏览器统一 API、自己维护事件池），然后按「捕获阶段 → 冒泡阶段」顺序依次调用你在 JSX 上写的事件处理函数。之所以能用统一监听器处理所有子组件事件，是因为浏览器原生事件本身会冒泡到根容器，React 只需要在派发时根据事件目标沿 fiber 树找到对应组件的 props 回调。顺带常考的点：`e.stopPropagation()` 只阻止 React 合成事件传播（React 17 起也会影响原生监听器，因为委托点在根容器）；要用原生事件可加 `onClickCapture` 或 `ref` + `addEventListener`；`e.persist()` 在旧版本用于解决事件池回收问题（React 17 后事件池已移除）。

**`useMemo` 与 `useCallback`**：`useMemo(fn, deps)` 缓存**计算结果**，返回 `fn()` 的返回值；`useCallback(fn, deps)` 缓存**函数引用**，返回 `fn` 本身，等价于 `useMemo(() => fn, deps)`。用途差异：`useMemo` 用于昂贵计算（大列表过滤/排序、复杂派生数据），`useCallback` 用于保持函数引用稳定，通常是为了配合 `React.memo` 的子组件或作为 `useEffect` 的依赖。共同注意点：依赖数组必须完整（漏项会读到旧值），不要为了「看起来优化」而滥用——每次渲染创建函数本身很便宜，缓存也有内存与比较成本；缓存不是语义保证，不能用来承载「只执行一次」的逻辑。

**Promise 状态、Http 状态码、存储与 Git**：Promise 有三个状态：`pending`（进行中）、`fulfilled`（已兑现，通过 `resolve`）、`rejected`（已拒绝，通过 `reject` 或抛异常），状态一旦落定就**不可再变**（后续 `resolve`/`reject` 被忽略），且 `then/catch` 可以多次注册、回调在微任务里执行。HTTP 状态码按段记：1xx 信息（`101` 切换协议）、2xx 成功（`200` 正常、`201` 已创建、`204` 无内容）、3xx 重定向与缓存（`301` 永久、`302`/`307` 临时、`304` 未修改）、4xx 客户端错误（`400` 参数错、`401` 未认证、`403` 无权限、`404` 不存在、`429` 限流）、5xx 服务端错误（`500`、`502` 网关错误、`503` 不可用、`504` 超时）。`304` 与 `200` 的区别：`304` 是**协商缓存命中**，不返回响应体，只回头部告诉浏览器用本地副本（判断依据是请求里的 `If-None-Match`/`If-Modified-Since` 与 `ETag`/`Last-Modified` 的比对），相比 `200` 省掉了响应体传输；`200` 则带回完整内容。`localStorage` 与 `sessionStorage` 都是同源、约 5MB、只存字符串（对象要序列化）的本地存储，区别在**生命周期与作用域**：`localStorage` 永久保存（除非显式删除），`sessionStorage` 随标签页会话结束清除、且不跨标签页共享（新开标签即新会话，即使同源也读不到）。两者都是同步 API（会阻塞主线程），都不适合存敏感信息，容量更大的异步方案是 IndexedDB。`git fetch` 只把远端对象与引用拉到本地 `origin/*`，不改动工作区和当前分支；`git pull` 等于 `git fetch` + `git merge`（或 `--rebase` 时是 rebase），会直接改动当前分支，所以想先看差异再决定合并方式时应先 `fetch` 再 `git log HEAD..origin/main`。

**三次握手、四次挥手与「为什么次数不同」**：三次握手：`SYN`(seq=x) → `SYN+ACK`(seq=y, ack=x+1) → `ACK`(ack=y+1)，双方各自确认对方的收发能力并同步初始序列号；两次无法确认客户端的接收能力、也无法防止历史重复 `SYN` 建立无效连接。四次挥手：主动方发 `FIN`（我没数据要发了）→ 对端回 `ACK`（此时它可能还有数据没发完）→ 对端发自己的 `FIN` → 主动方回 `ACK` 并进入 `TIME_WAIT`（等 2MSL 保证最后的 `ACK` 送达并让残余报文消亡）。之所以挥手比握手多一次，是因为**握手时服务端可以把 `ACK` 和 `SYN` 合并成一个包**（它此时也要发起自己方向的连接），而挥手时对端的 `ACK` 与 `FIN` 之间可能要等应用把剩余数据发完，无法合并。补充考点：`CLOSE_WAIT` 堆积说明应用没及时 `close()`；`TIME_WAIT` 过多可以调 `tcp_tw_reuse`，但不能简单地说「TIME_WAIT 有害」；半连接队列与 `SYN Flood` 对应 `syncookies`。

**手写：每秒自增 + 手动增减的计时组件**：要点是「定时器与用户操作写同一个状态，且不能互相覆盖」。用 `useState` 存数字，`useEffect(() => { const id = setInterval(() => setNum(n => n + 1), 1000); return () => clearInterval(id); }, [])` —— 依赖数组给空是安全的，因为用的是**函数式更新**（若写成 `setNum(num + 1)` 就会永远读到初始值 0，这是最常见的失分点）；清理函数里必须 `clearInterval`，否则组件卸载后定时器仍在跑（React 18 开发模式下 StrictMode 会双执行 effect，不清理就会看到数字跳 2）。加减按钮用 `setNum(n => n + 1)` / `setNum(n => n - 1)`。加分项：把计数逻辑抽成自定义 Hook `useCounter`（返回 `count`、`increment`、`decrement`）；加上「暂停/继续」按钮（用 `useRef` 存定时器 id 或用一个 `running` 状态控制 effect 依赖）；用 `useRef` 缓存最新值避免闭包陷阱；以及说明为什么不用 `useEffect` 依赖 count（那会每秒重建定时器、累积漂移）。

**面试复盘**：这场 30 分钟的实习面试是标准的「React 基础 + 浏览器/网络基础 + 一道手写题」组合，题目不难但覆盖广（前端、Git、TCP 都有）。原帖作者处于攒人品阶段。准备这类面试的性价比最高的方式是维护一份「高频对照题清单」：`setState` 同步异步、`useMemo` vs `useCallback` vs `memo`、`localStorage` vs `sessionStorage` vs Cookie、`git fetch` vs `pull`、304 vs 200、三次握手 vs 四次挥手——每道都能说出「现象 + 原理 + 边界」。

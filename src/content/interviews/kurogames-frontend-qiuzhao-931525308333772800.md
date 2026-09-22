---
title: "库洛游戏前端开发秋招面经：卡顿排查与 Vue 原理"
company: "库洛游戏"
position: "前端开发"
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/931525308333772800
tags: ["前端","性能优化","Web Worker","Vue","浏览器渲染","秋招"]
summary: "库洛游戏前端开发秋招面经，题目集中在浏览器性能：点击卡顿如何用 Performance 定位、长任务怎么切分让出主线程、rAF 与 requestIdleCallback 的差别、Web Worker 限制，以及 Vue 响应式原理。"
---

### 《面试题目》

1. 页面点击一个按钮后卡顿 2 秒，你会如何排查？
2. 如果大量计算导致页面卡顿，如何拆分成微任务处理？
3. requestIdleCallback 和 requestAnimationFrame 有什么区别？分别适合什么场景？
4. Web Worker 有哪些限制？什么场景下不适合使用？
5. Vue 组件从创建到销毁经历了哪些阶段？
6. Vue 的响应式系统如何追踪和触发依赖？
7. 请先做一下自我介绍

### 《参考解析》

**点击后卡顿 2 秒怎么排查**：先分类定位，不要上来就猜代码。用 Chrome Performance 录下点击到恢复的完整过程，看主线程有没有超过 50ms 的 Long Task，以及时间花在 Scripting、Recalculate Style、Layout 还是 Paint；同时开 Network 看 TTFB 和响应体大小，排除"其实是接口慢被误判成页面卡"；再开 Memory 看是否在频繁 GC。前端侧最常见的元凶是强制同步布局——在循环里先读 `offsetWidth / getBoundingClientRect()` 再改样式，浏览器被迫反复重排；其次是超大列表一次性渲染、深拷贝 / JSON 序列化大对象、正则回溯。定位到具体函数后再谈拆分或异步化。

**长任务怎么切分**：核心是"分片 + 主动让出主线程"。每处理 300~500 条就 `await new Promise(r => setTimeout(r, 0))` 一次，让浏览器有机会渲染和处理输入。这里有个容易答错的点：用 `Promise.then` / `queueMicrotask` 排的微任务**不会**让出给渲染——浏览器要把微任务队列清空才渲染，连续大量微任务反而会把一帧拖得更长，所以切分要用宏任务或 `scheduler.postTask()`。真正纯 CPU 的计算（图片处理、大数组排序、加解密）应该丢给 Web Worker，主线程只收结果。

**rAF 与 rIC 的区别**：`requestAnimationFrame` 跟着浏览器渲染节奏走，重绘前执行，通常每帧一次（60Hz 约 16.7ms），适合动画、滚动位置更新这类必须与画面同步的逻辑，页面切到后台会自动暂停。`requestIdleCallback` 在主线程空闲时才执行，回调里能用 `deadline.timeRemaining()` 判断剩余时间，还能传 `timeout` 兜底（长时间没空闲就强制执行），适合日志上报、缓存计算、数据预取这类低优先级任务。两者都不能保证及时性，所以提交表单、关键渲染这类有明确时效要求的逻辑不要放进去；`requestIdleCallback` 在 Safari 上支持较晚，工程里一般写成 `window.requestIdleCallback || setTimeout` 的降级。

**Web Worker 的限制**：Worker 跑在独立线程，拿不到 DOM、`window`、`document`，也无法访问 `localStorage`；主线程与 Worker 通过 `postMessage` 通信，默认是结构化克隆，传大对象时拷贝本身就是成本，二进制数据可以用 Transferable 转移所有权：

```js
const buf = new ArrayBuffer(1024 * 1024)
worker.postMessage(buf, [buf]) // 转移后主线程不能再使用 buf
```

另外 `SharedArrayBuffer` 需要 COOP / COEP 响应头做跨源隔离才能用。不适合 Worker 的场景：任务很小而通信开销更大、需要频繁读写 DOM、需要频繁读主线程实时状态、以及本身不是 CPU 密集型的活。适合的是抽帧解码、压缩解压、复杂排序、加密和大规模数据转换。

**Vue 3 响应式原理**：用 `Proxy` 拦截对象的 `get` 和 `set`。`get` 时把当前正在执行的副作用函数（`activeEffect`）通过 `track` 收集进 `WeakMap<target, Map<key, Set<effect>>>`；`set` 时通过 `trigger` 取出依赖集合并重新执行，这就是"追踪—触发"两个动作。`ref` 则用 `RefImpl` 的 getter / setter 实现，取值时收集、赋值时触发。`computed` 是带 dirty 标记的懒执行 effect，依赖没变就不重算。两个常见追问：`reactive` 解构会丢响应式（要用 `toRefs`）；数组和 Map / Set 通过重写原型方法做拦截。

**组件生命周期**：Vue 3 组合式 API 对应 `setup`（创建实例、初始化响应式）→ `onBeforeMount` → `onMounted`（DOM 已插入，可做 DOM 操作和请求）→ `onBeforeUpdate` → `onUpdated`（数据变化后重新渲染并 diff 打补丁）→ `onBeforeUnmount` → `onUnmounted`。要强调的是清理：定时器、事件监听、WebSocket、全局订阅都应在 `onBeforeUnmount` 里释放，否则组件反复创建会造成内存泄漏；SSR 场景下 `onMounted` 不会在服务端执行。

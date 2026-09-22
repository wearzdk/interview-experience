---
title: 字节全栈一面：并发调度器与 Vue 响应式原理
company: 字节跳动
position: 全栈开发工程师
round: 一面
date: '2026-09'
source: 牛客网
tags: ["全栈开发","前端","JavaScript","Vue","SSE"]
summary: "字节跳动中国交易与广告全栈一面。先问 Vue 3 Composition API 的原理与优势，再手撕带并发限制的异步调度器并追问 while 改 if 的原因，最后深挖 SSE 断线重连、流式半 JSON 解析与首屏优化。"
---

### 《面试题目》

1. 聊一下你最近在学什么东西？
2. 简历里提到用过 Vue 3 的 Composition API，能简单解释一下它是怎么工作的吗？
3. 没有它的时候是怎么写的？有了它带来什么优势？
4. 算法：JS 实现一个带并发限制的异步调度器 Scheduler，保证同时运行的任务最多有两个，完善代码中的 Scheduler 类，使给定程序能正确输出。
5. 新增 add 功能：`Scheduler.add` 返回一个 Promise，当添加的任务被执行时，它返回的 Promise 被 resolve；自己再补一组对返回值的测试。
6. 我看到有两个地方，第一个是为什么把 `while` 改成了 `if`？出于什么考虑？会带来哪些变化？
7. 现在是 A、B、C、D 打印，打到 D 的时候一共走了多少毫秒？（答：600ms）
8. 那这样 A 和 D 都是 600ms，它们两个同时结束谁先打印？（答：A 先打印，A 的 setTimeout 在 0ms 就创建好了，D 的 setTimeout 在 500ms 才创建。）
9. 你项目里有自己解决问题的经验吗？印象比较深刻的那种。（讲了 SSE 断线重连）
10. 你刚刚讲的 TaskID 和 MessageID 是谁分配的？
11. 前端本地会把那个 ID 缓存下来，缓存在哪里？（状态管理、localStorage）
12. 除了这个还有吗？（讲了前端对接大模型 ToolCall、处理流式半 JSON 解析、项目打包首屏加载优化等）
13. ToolCall 返回的问题具体是怎么解决的？这是个比较常见的问题，大家都很容易遇到。有调研哪些社区的方案？最后怎么决策、怎么解决的？讲一下细节。
14. 自我介绍。
15. 反问：中国交易与广告到底是做什么的。

### 《参考解析》

**Composition API 的工作原理**：`setup()` 在组件实例创建后、`beforeCreate` 之前执行，返回的响应式对象被暴露到渲染上下文。核心是两条链：一是响应式数据用 `reactive`/`ref` 创建，内部靠 `Proxy` 的 get/set 拦截，get 时把当前正在执行的副作用（`effect`）收集进依赖表 `targetMap`（结构是 target → key → dep 集合），set 时触发对应 dep 里的 effect 重跑；二是 `computed` 和 `watch`/`watchEffect` 都是基于这套 `effect` 机制实现的，`computed` 额外做了缓存与脏标记，依赖不变就不重算。渲染函数本身也是一个 effect，所以数据变化能触发组件重新渲染，再由调度器把同一 tick 内的多次变更合并成一次更新（这就是批量更新的来源）。

**相比旧写法的优势**：Options API 把同一个功能的代码拆散在 data、methods、computed、生命周期里，逻辑一复杂就要在文件里上下跳；Composition API 允许按「功能」组织代码，一个组合函数自带状态、计算和副作用清理，并可以像普通函数一样被复用和测试——这解决了 mixin 的命名冲突与「数据来源不明」问题。此外它对 TS 友好（类型推导能从 setup 返回值推到模板），逻辑复用不再依赖 `this`，也让 tree-shaking 和小包体积成为可能。代价是心智负担更高（`ref` 要 `.value`、响应式丢失、过度抽象），这是面试时值得主动提的权衡。

**并发限制调度器**：核心是「队列 + 计数」。任务唯一被执行的路径是 `startNext()`，它在「当前运行数 < 并发上限」且队列非空时取队首任务执行，执行完 `finally` 里递减计数并再次调用 `startNext`，形成自驱动的泵。收尾必须在 `finally` 里，否则任一任务 reject 就永久卡住并发槽。为什么用 `if` 而不是 `while` 很关键：`startNext()` 每次调用时最多只应放行一个任务（放行后计数已变），用 `while` 会在同步循环里连开多个任务，破坏并发上限；而且判断条件的时机也很微妙——异步任务在执行前会把计数加一，若用 while 且计数更新在异步回调里，条件判断会读到过期值。示例结构如下：

```js
class Scheduler {
  constructor(limit = 2) {
    this.limit = limit;
    this.running = 0;
    this.queue = [];
  }
  add(promiseFactory) {
    return new Promise((resolve, reject) => {
      this.queue.push(() => promiseFactory().then(resolve, reject));
      this.startNext();
    });
  }
  startNext() {
    if (this.running >= this.limit || this.queue.length === 0) return;
    this.running++;
    const task = this.queue.shift();
    task().finally(() => {
      this.running--;
      this.startNext();
    });
  }
}
```

**时间与打印顺序的追问**：设 A、B 两个任务各耗时 500ms，C、D 各 100ms，从 0ms 开始：0ms 同时启动 A、B；500ms 时 A、B 结束，C、D 在 500ms 被启动；600ms 时 C、D 结束，D 的打印发生在 600ms——这就是「打到 D 一共 600ms」的由来。为什么 A 和 D 都标 600ms 而 A 先打印？因为打印时机取决于「同一个时间点上的入队顺序」：A 的定时器在 0ms 就创建了，D 的定时器在 500ms 才创建。两个 500ms 定时器到期时间相同，但浏览器/Node 的定时器队列按「到期时间 + 插入顺序」排序，先被创建的先执行；所以 A 的回调排在 D 前面。这也解释了为什么「时间相同但顺序不同」——不是看结束时间，而是看谁先被排进队列。

**SSE 断线重连与 TaskID/MessageID**：SSE 是长连接，`EventSource` 自带重连但对 POST + 自定义头的场景不适用（项目里通常用 fetch + ReadableStream 手写解析），所以重连逻辑要自己实现：记录已收到的最后事件序号，重连时带上（HTTP 头 `Last-Event-ID` 或者 query/body 参数），服务端从该序号之后重放，避免重复生成。幂等靠三组 ID：`TaskID` 标识一次完整任务（服务端生成，贯穿整个生成过程），`MessageID` 标识一条消息（通常客户端生成，用它做去重和落库主键），`seq/eventId` 标识同一条消息内的流式片段序号。客户端本地缓存这三者的位置要在回答里说清：TaskID/MessageID 属于需要跨刷新恢复的元数据，放 localStorage 并随会话状态一起持久化；而流式增量片段放内存即可，落库由服务端负责。

**流式半 JSON 解析 ToolCall**：这是流式工具调用最典型的坑——模型按 token 吐出的是增量片段 `{"name":"get_weather","argum` ，每个 chunk 单独 `JSON.parse` 必然抛错。工程上的解法有几种：① 缓冲 + 定界，把 chunk 拼进 buffer，按括号配对（或 JSON 流的定界符）判断当前是否构成完整 JSON，完整就解析并把对象推给上层，剩余部分留在 buffer；② 用容错的流式解析器（如部分 JSON 解析库）只取已经完整的字段，实现「边收边渲染」，参数值逐步补全；③ 用 SSE/JSONL 的结构化协议（每个 chunk 是一行合法 JSON 的片段数组），从协议层避免半结构问题；④ 对必须完整的场景（如执行工具）则等到 `finish_reason: tool_calls` 后再统一解析，中间只做展示。选型上要权衡「首字延迟体验」与实现复杂度，最好能把字符串转义、多字节 UTF-8 被切断（要按字节缓冲再解码）、以及一个流里包含多个 tool_calls 的情况一并处理掉——这几点原帖作者说调研了社区方案后落地，面试时把它们讲全，能直接体现工程深度。

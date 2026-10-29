---
title: "TME 腾讯音乐前端一面：虚拟列表、useEffect 闭包与 flex 三道硬题"
company: "腾讯音乐（TME）"
position: "前端开发"
round: "一面"
date: '2026-10'
source: 牛客网
tags: ["虚拟列表","React","useEffect","flex","TypeScript","算法"]
summary: "TME 前端一面约 80 分钟：AI 需求理解与知识库建设、虚拟列表原理与手写、useEffect 里 100ms 设值 500ms 打印为什么是旧值、flex 收缩计算与 ellipsis 失效、TS 派生类型，最后一道矩形布局分列算法。"
---

### 《面试题目》

1. 怎么保证 AI 对需求的理解是对的？怎么解决这种问题？
2. 给 AI 提供知识库，知识库一般怎么建设？有没有评估过效果？
3. 有没有多 Agent 协作提效的经验？
4. 长列表的性能优化了解过吗？虚拟列表具体的逻辑是什么？现场写核心逻辑。
5. 一个 React 组件，在 `useEffect` 里 100 毫秒时把 value 设置为 1，那在 500 毫秒时打印 value，输出值是多少？如果想让它输出 1，需要做什么改动？
6. 定时器要取消调用哪个方法？在哪里调用？
7. 下面这段异步代码有什么问题：`await items.forEach(async item => { await saveItem(item) }); showSuccess();`
8. `flex-grow`、`flex-shrink`、`flex-basis` 分别是干嘛的？
9. 一个宽度 500px 的 flex 容器，内部两个子元素宽度均为 300px，它们的实际宽度是多少？为什么？想保持 300px 不收缩该怎么做？
10. 一个宽度 300px 的 flex 容器，左侧图标固定 40px，右侧 content 设 `flex: 1`，内部标题已设 `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`，但长文本仍然撑开容器，为什么？怎么解决？
11. TS 中 `type Person` 有 name、age、job 三个属性，想定义只含 age 的 `type Child`，基于 Person 来写，有哪些方法？
12. 算法：给定若干矩形（x、y、width、height），组合成一个布局，判断整个布局能分成多少列。

### 《参考解析》

**虚拟列表**：只渲染可视区 + 上下缓冲区，用一个固定高度的滚动容器撑起总高度（`total * itemHeight`），内层用 `translateY` 把可见区偏移到正确位置。核心状态是 `scrollTop`、`clientHeight`、`itemHeight`，算出 `start = floor(scrollTop/itemHeight) - buffer`、`end = ceil((scrollTop+clientHeight)/itemHeight) + buffer`，渲染 `data.slice(start, end)`，外层容器高度设为 `(end-start)*itemHeight` 并偏移。不定高要用测量 + 位置缓存（或 `IntersectionObserver` 动态测高），复杂度陡增，面试先说清这个取舍。

**useEffect 里打印的是旧值**：`const [value, setValue] = useState(0)`，effect 里 `setTimeout(() => setValue(1), 100)`，500ms 时另一个 `console.log(value)` 打出来还是 0——因为该函数闭包捕获的是那次渲染的 `value`，state 更新会触发重渲染并生成新的闭包，但已排队的回调仍指向旧闭包。想拿到 1 有四种改法：把打印放进 effect 且依赖 `[value]`；用 `useRef` 存值并读 `ref.current`；用 `setValue(v => { console.log(v); return v })` 在更新函数里读；或者用 `useEffect` 的清理函数重新注册定时器。

**forEach + async**：`forEach` 不会等待异步回调，`await` 在 `forEach` 上是无效的，`showSuccess()` 会在所有 `saveItem` 完成前执行，且任一 `saveItem` 抛错会变成未捕获的 rejection。改成 `for (const item of items) await saveItem(item)` 或 `await Promise.all(items.map(i => saveItem(i)))`（后者并发，注意限流）。

**flex 三道题**：`flex-grow` 是剩余空间怎么放大，`flex-shrink` 是空间不足时怎么缩小（按 `shrink * basis` 加权），`flex-basis` 是主轴初始尺寸。500px 容器两个 300px 子元素，总溢出 100px，两个 shrink 都是 1 且 basis 相同，各缩 50px，实际各 250px；要保持 300px 就设 `flex-shrink: 0`（或 `flex: 0 0 300px`）。第三题 ellipsis 失效的根因是 flex item 的 `min-width: auto` 默认为内容最小宽度，文本撑开了它，导致 `overflow: hidden` 没有生效空间；解法是给右侧项加 `min-width: 0`（或 `overflow: hidden`），让它可以被压缩。

**TS 派生类型**：`Pick<Person, 'age'>`、`Omit<Person, 'name' | 'job'>`、`{ [K in 'age']: Person[K] }` 映射类型、`Person & { name?: never; job?: never }`（交叉出可选 never 排除），或者显式 `{ age: Person['age'] }`（索引访问类型，改 Person 时同步）。

**矩形分列算法**：把所有矩形的左边界 `x` 与右边界 `x + width` 收集去重排序，相邻边界之间的区间若被某些矩形覆盖，就是一个「列」；合并相邻且覆盖集合相同的区间即为列数。等价于扫描线求区间并的段数。写完说明复杂度 O(n log n)（排序）与退化情况（矩形重叠、部分覆盖）。

---
title: "比特鹰秋招一面：React 原理 + 职业规划"
company: "比特鹰"
position: "前端开发"
round: "一面"
date: "2026-09"
source: "牛客网"
tags: ["比特鹰","前端开发","React","Fiber","Vue","秋招","一面"]
summary: "比特鹰秋招前端一面面经：面试官自称 HR 面却问了技术，先聊实习、项目、为什么选前端与如何学习，再深入 React Fiber 架构、更新流程、React 19 新特性、Vue 与 React 的区别，最后问公司业务了解程度、能否接受单休、职业规划与薪资预期。"
---

### 《面试题目》

1. 自我介绍。
2. 介绍实习。
3. 介绍项目。
4. 为什么选择前端？
5. 你是怎么学习前端的？
6. 推荐一下你关注的技术博主？
7. 人生最有成就感的事情是什么？
8. 介绍一下 React 里的 Fiber 架构？
9. 介绍一下 React 的更新流程？
10. 介绍 React 19 新特性？
11. 介绍一下 Vue 和 React 两个框架的区别？
12. 了解过我们公司的业务吗？公司单休能接受吗？
13. 未来的职业规划？
14. 薪资预期多少？
15. 反问。

> 原帖补充：面试官说是 HR 面，但实际问了技术；公司看起来做 Web3 和教培相关业务。

### 《参考解析》

**React Fiber 架构**

Fiber 是 React 16 重写的**协调引擎**，目的只有一个：把原来「递归往下走、一旦开始就不能停」的渲染过程，改成**可中断、可恢复、可排优先级**的工作循环。

- **数据结构**：每个组件/元素对应一个 Fiber 节点，节点之间用 `child`（第一个子节点）、`sibling`（下一个兄弟）、`return`（父节点）三个指针连成链表树。递归变成了「从根开始，有 child 往下、没 child 找 sibling、都没有就 return」的遍历——每一步都是一个可暂停的工作单元。
- **双缓存树**：内存里同时存在 `current` 树（当前屏幕上的）和 `workInProgress` 树（正在构建的）。构建完成后一次性切换指针，保证用户永远看到完整界面，不会看到「渲染了一半」的状态。
- **时间切片与调度**：Scheduler 按优先级（`Immediate`、`UserBlocking`、`Normal`、`Low`、`Idle`，React 18 起用 lanes 模型）分配时间片，每个工作单元执行前检查是否该让出主线程（默认 5ms），让出去后等浏览器空闲再继续，从而不阻塞用户输入和动画。
- **两阶段划分**：render 阶段（构建 workInProgress）可以被打断、可重复执行，所以**必须是无副作用的纯计算**；commit 阶段（真正改 DOM）同步执行、不可中断。

**React 的更新流程**

从 `setState` 到屏幕更新，可以拆成四步：

1. **触发更新**：`setState` / `dispatchSetState` 把 update 挂到对应 Fiber 的更新队列上，并计算 lane 优先级，从当前 Fiber 一路标记到根（`scheduleUpdateOnFiber`），然后交给 Scheduler。
2. **render 阶段（可中断）**：从根开始构建 workInProgress 树，执行 `beginWork`（调用函数组件、计算新的 props/state、做 diff 决定复用还是新建子 Fiber）和 `completeWork`（创建/更新 DOM 实例、收集副作用）。diff 用同层比较 + `key` 来判定节点复用，这也是「列表里 key 不能用 index」的根因。
3. **commit 阶段（同步不可中断）**：分三个子阶段——`before mutation`（读取 DOM 快照，`getSnapshotBeforeUpdate`）、`mutation`（真正插入/更新/删除 DOM，执行 `componentWillUnmount`、ref 解绑、`useLayoutEffect` 的清理）、`layout`（执行 `componentDidMount/Update`、`useLayoutEffect` 回调、ref 绑定）。
4. **异步副作用**：`useEffect` 的清理与执行被放到 commit 之后由 Scheduler 以普通优先级异步调度，`useLayoutEffect` 则在 layout 阶段同步跑完，这就是「要读布局、要避免闪烁就用 useLayoutEffect」的原因。

**React 19 新特性**

挑几个有工程影响的讲：

- **Actions 与表单相关 hooks**：`useActionState`、`useFormStatus`、`useOptimistic`，配合 Server Actions 把「提交表单 → pending → 错误 → 乐观更新」这套模板代码收进框架，`<form action={fn}>` 原生支持异步函数。
- **`use()` API**：可以在渲染中读取 Promise 或 Context，配合 Suspense 使用（注意它与 hooks 规则不同，可以条件调用）。
- **ref 作为普通 prop**：函数组件不再需要 `forwardRef`，`ref` 直接写在 props 里；同时支持 ref 清理函数。
- **文档元数据原生支持**：`<title>`、`<meta>`、`<link>` 直接写在组件里，React 自动提升到 `<head>`，不再依赖 react-helmet 这类库。
- **Server Components / Server Actions 走向稳定**，以及新的 `useDeferredValue` 初始值、更好的 hydration 错误提示、以及对自定义元素（Web Components）的属性支持。

**Vue 和 React 的区别**

从三个层面答，比只讲「一个是模板一个是 JSX」有说服力：

- **更新机制**：Vue 3 用 `Proxy` 做细粒度依赖追踪，组件内哪块数据变了就精确触发那块的更新，配合编译期的静态提升、`patchFlag`、`Block Tree` 跳过多余 diff；React 是「状态变了就自顶向下重新执行组件函数」，靠 `memo`、`useMemo`、`useCallback` 手动阻断，`key` 与不可变数据是正确性前提。结果是 Vue 的「默认性能」更好，React 把优化权交给开发者。
- **编程范式**：Vue 模板 + 指令（`v-if`、`v-for`）更接近 HTML，上手快，逻辑复用靠 Composables；React 全量 JSX + 函数式，逻辑即 JavaScript，灵活度和类型推导更强（TSX）。
- **生态与工程**：React 生态更大（Native、海量状态库），但选型分散；Vue 官方全家桶（Vue Router、Pinia、Vite）更统一，跨端有 uni-app。

选型时给一句结论：**团队熟悉度、招人难度、生态需求**比性能差异更能决定选谁。

**「能否接受单休」「薪资预期」这类问题怎么答**

面试官在这两题上做的是**期望管理与筛人**，不是想听漂亮话。

- **单休 / 加班**：先问清楚事实（固定单休还是项目期、调休还是补贴、平均下班时间），再表态。可以接受就明确说；不能接受就说明你的边界和你的效率承诺（比如「项目上线期可以，但常态化单休我坚持不了」），别嘴上答应心里打退堂鼓——入职后崩得很快。含糊地回答「都可以」既不真诚也不加分。
- **薪资预期**：不要报一个模糊区间就完事。做法是先做功课（同城同岗位校招水平、公司往年开价），给一个**有依据的区间**并说明构成（月薪 × 月数、是否有签字费/补贴），态度是「可谈但需要合理」。被问「最低多少」时不要自曝底价，可以说「更看重岗位和成长，具体希望参考公司同岗位标准」。
- **职业规划**：1 年内（把工程能力做扎实、能独立负责模块）、3 年内（在某个方向深入、能带小项目），落到**具体能力和岗位职责**上，避免「想成为技术专家」这种空话。

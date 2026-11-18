---
title: "即时设计前端实习一二面：MCP 与 Skill 的区别、FOUC 根因、Bundle 降 34% 怎么做的"
company: 即时设计
position: 前端开发（实习）
round: 一面 + 二面
date: '2026-11'
collectedAt: '2026-11-18'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/ebeca80c32ee492dba6cbb52cb55dd20
tags: ["即时设计","前端","实习","AI Agent","MCP","CSS","Git","Promise","事件循环","性能优化"]
summary: "即时设计前端实习两轮面：一面一半问 AI（对大模型的理解、token 是什么、MCP 与 Skill 的区别、用 AI 独立完成需求的流程与质量保障、Agent 与 LLM 的区别），一半问八股与手写（CSS 层叠性、reset 与 revert、merge 与 rebase、箭头函数与 this、宏微任务、三列布局不用 gap、手写 Promise.all）。二面全部拷打实习：主题切换为什么用 CSS variable、FOUC 的根因与修复、多端 UBC adapter 双写、native toast 的 bridge 通信、埋点双写的遗漏与补救、子 Agent 做了什么、Bundle 治理降 34%、延迟加载、其他性能指标与治理后的数据。"
---

### 《面试题目》

**一面（9.28）**

1. 你对 AI 这块的了解、平常使用的情况是怎么样的？
2. 你对大语言模型的理解怎么样？
3. token 是什么？
4. MCP 是什么？它跟 Skill 有什么区别？
5. 你有常用的 Skill 吗？有没有沉淀一些业务里用的 Skill？
6. 你用 AI 独立完成业务需求的流程是怎么样的？从文档到代码、测试、上线，怎么保证 AI 生成代码的稳定性和质量？AI 加的异常兜底可能导致业务上不需要的异常情况，你们怎么规避？
7. 什么是 AI Agent？它跟大语言模型有什么区别？
8. 你对 CSS 的基础怎么样？在使用 AI 的情况下，自己的前端基础 CSS 这块怎么样？
9. CSS 层叠性是什么？
10. 你对 Git 命令了解吗？`reset`、`revert` 的区别是什么？
11. `merge` 和 `rebase` 有什么区别？
12. 箭头函数和普通函数的区别？哪些场景下你会刻意不用箭头函数？
13. this 指向的代码输出题。
14. 对微任务、宏任务的机制了解吗？哪些是宏任务、哪些是微任务？
15. 事件循环代码输出题。
16. 手写：父盒子宽 320px，子盒子宽 100px，一行放 3 个子元素，子之间间距 10px，不能用 flex gap。
17. 手写 `Promise.all`。
18. 反问环节。

**二面（10.9）**

19. 最近一段实习，主题切换为什么选择 CSS variable，没有选择 Less 或 Sass？
20. FOUC 首屏闪屏问题：解决这个闪屏，当时的根因是什么？怎么修复的？
21. 多端的链路迭代，UBC adapter 双写机制，这个 adapter 抽象出来做了什么？
22. 里面的 native toast，bridge 和 native 是怎么通信的？用的 JSBridge 还是什么？
23. 埋点双写机制是什么？
24. 新的没上报的时候，旧的会不会单独上报？
25. 数据分析时统计用新的还是旧的？新老区分标志是什么？怎么发现遗漏、怎么补救？
26. 这套双写方案，你是模块 owner 独立负责，还是 mentor 主导、你参与？
27. 子 Agent 这块，你主要做了哪些工作？
28. Bundle 治理首屏 JS 体积下降 34%，展开讲讲。
29. TapTap、Cropper 的延迟加载是怎么做的？
30. 除了 Bundle 体积，你还关注过哪些性能指标？
31. 做完性能治理之后，有没有对应的指标提升数据？
32. 主要技术栈是什么？
33. `useState` 的实现原理是什么？
34. 可以在条件语句里调用 Hooks 吗？
35. 事件循环代码输出题。
36. 说一下你对 Promise 的理解，以及用过哪些 Promise 的 API？
37. 反问。

### 《参考解析》

**MCP 与 Skill 的区别**：MCP（Model Context Protocol）是模型与外部工具/数据源之间的通信协议，规定服务端如何暴露工具、资源与提示模板，客户端（宿主）如何发现与调用，重点在「标准化的连接」。Skill 是打包好的一段可复用能力（提示词 + 脚本 + 资源 + 触发条件），重点是「把某一类任务的做法固化成可加载的单元」。关系上，Skill 可以调用 MCP 工具，MCP 不关心任务怎么组织。回答时各给一个例子：MCP 像「给模型接上数据库和搜索引擎的插头」，Skill 像「一份写清楚步骤、脚本和验收标准的作业指导书」。

**用 AI 独立完成需求的流程**：需求转成明确的接口与验收标准（输入、输出、边界、错误码）→ 让 AI 出方案与拆任务 → 小步生成代码 → 类型检查、lint、单测、构建 → 人工 review 关键逻辑（权限、金额、并发、异常分支）→ 灰度与回滚预案。质量靠「客观判定」而不是靠信任：测试与类型是硬门槛，review 清单固定下来。AI 爱加多余兜底这个坑，处理办法是明确写「不要吞异常、不要加业务未定义的默认值、异常必须抛出或记录」，并在 review 时专门看 `catch` 块与默认值。

**AI Agent 与 LLM**：LLM 是「输入文本、输出文本」的模型，无状态、不会主动做事；Agent 是「LLM + 工具 + 记忆 + 规划循环」的系统，能根据目标自主决定调用什么工具、观察结果、再决策，直到完成或放弃。区别在于是否有闭环控制与环境交互能力。要提一句代价：Agent 的错误会累积，需要可观测性与人工兜底。

**CSS 层叠性**：同一元素上多条规则冲突时，按「重要性（`!important`）→ 来源与层（作者、用户、浏览器默认；`@layer`）→ 特异性（id > class/属性/伪类 > 元素/伪元素）→ 源码顺序」决定谁生效。继承来的样式优先级最低。理解层叠才能解释「为什么我写的样式不生效」。

**reset 与 revert**：`reset` 不是标准 CSS 关键字（常被误用），标准里是 `revert`（回滚到浏览器默认或上一层来源的样式）与 `revert-layer`（回滚到上一个 `@layer`）。`all: unset` 是清除所有属性到继承值或初始值。三者语义不同，回答时说清「unset 分继承属性与非继承属性」即可。

**merge 与 rebase**：`merge` 保留两条历史并生成一个合并提交，历史真实但有分叉；`rebase` 把当前分支的提交逐个重放到目标分支之上，历史线性、干净，但改写了提交哈希，已经推送的公共分支不要 rebase。团队规范常见是「个人分支 rebase、合入主干用 merge --no-ff」。

**箭头函数与 this**：箭头函数没有自己的 `this`、`arguments`、`super`，也不能用 `new`，`this` 取定义时外层作用域。刻意不用箭头函数的场景：需要动态 `this` 的对象方法、构造函数、需要 `arguments` 的函数、以及 Vue/React 里依赖调用方 `this` 的回调（老式写法）。事件处理里若用箭头函数，`this` 不会指向元素。

**事件循环**：同步代码执行完清空微任务队列，再取一个宏任务，如此循环。宏任务包括 `setTimeout`、`setInterval`、I/O、UI 渲染（渲染时机由浏览器决定）；微任务包括 `Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`、`process.nextTick`（Node 中优先级更高）。输出题按「先同步、再微任务、再下一个宏任务」逐段推，注意 `await` 之后的代码等价于 `.then` 里的回调。

**三列布局不用 gap 的手写**：父容器 `display: flex`，子项 `width: 100px`，用 `justify-content: space-between` 只能两端对齐，中间间距由剩余空间决定（320 − 300 = 20，三等分不是 10）。正确做法是父容器加负 margin 或用 `margin-right`：`display: flex; flex-wrap: wrap;` 子项 `margin-right: 10px`，最后一个 `margin-right: 0`（`:last-child` 或 `:nth-child(3n)`）；也可以用 `width: calc((100% - 20px) / 3)` 配 `gap` 的替代（`margin`）。手写时说明「320 = 3×100 + 2×10 正好整除」，算出剩余 20px 分给两个间隙。

**手写 Promise.all**：返回新 Promise，维护结果数组与计数；空数组直接 resolve；每个 promise 用 `Promise.resolve` 包一层以兼容非 Promise 值，`then` 里按下标写入结果并计数，全部完成 resolve；任一 reject 立即 reject（并忽略后续）。要点是「结果顺序按传入顺序而不是完成顺序」。

**CSS variable 做主题切换**：变量在 `:root` 定义、组件里 `var(--color-primary)` 引用，切换主题只需改根节点的变量值，不用重新编译、不用换 class 覆盖一大堆规则；相比 Less/Sass 变量（编译期替换，产物里已是常量）它的优势是运行时可变、可按作用域覆盖、可与 JS 交互（`setProperty`）。代价是浏览器兼容（现代浏览器都支持）、变量名没有类型检查、大量变量时首屏解析略慢。

**FOUC 的根因与修复**：FOUC（无样式内容闪烁）是 HTML 先渲染、样式表后到达或被 JS 延迟注入导致的短暂无样式状态。根因常见有三类：CSS 通过 JS 异步加载或 `@import` 串行加载；样式表放在 body 末尾或动态插入；主题变量在 JS 执行后才写入导致首帧用默认值。修复是把关键 CSS 内联或放在 `<head>` 的 `<link>` 里、预加载（`rel=preload`）、服务端渲染时直接输出主题变量、避免用 JS 注入首屏样式。主题场景还要在 HTML 上先写 `data-theme`，避免 JS 执行前闪一下默认色。

**UBC adapter 与 bridge**：adapter 把「不同端（Web、App、小程序、桌面）能力不一致」抽象成统一接口，业务只调 adapter，由各端实现具体能力（toast、存储、跳转、埋点）。native toast 走 JSBridge：Web 调 `window.bridge.call('toast', params, callbackId)`，原生注入的对象收到后执行，再通过回调通道按 `callbackId` 返回结果；iOS 用 `WKScriptMessageHandler`，Android 用 `addJavascriptInterface` 或 URL scheme 拦截。要点是超时、错误码与降级（bridge 不可用时用 Web 实现）。

**埋点双写与遗漏**：双写是新旧两套上报并行一段时间，用于迁移期对数。要回答三个问题：新链路失败时旧链路是否兜底（通常要，否则丢数据）；统计以哪套为准（迁移期以旧为准、新用于验证，切换后以新为准，靠 `schema_version` 或 `source` 字段区分）；怎么发现遗漏（按天对新旧总量与关键维度做差异告警、抽样比对同一事件的字段、用服务端日志反查）。补救是补发（离线队列重放）与口径修正，并把差异原因写进迁移文档。

**子 Agent 与 Bundle 治理**：子 Agent 部分按「目标—拆分—编排—验收」讲自己负责的模块；Bundle 降 34% 要给出手段与归因：路由级代码分割与动态 `import`、把大依赖换成轻量替代或按需引入（`lodash-es`、按需加载组件库）、移除重复依赖与 polyfill、分析产物（`webpack-bundle-analyzer` / `rollup-plugin-visualizer`）找最大块、图片与字体走 CDN 与 `font-display`、预加载关键 chunk。延迟加载（TapTap、Cropper）用 `IntersectionObserver` 或交互时 `import()`，配 Suspense/loading 占位。性能指标除体积还有 LCP、FCP、TTI、CLS、INP、长任务数，治理后要给出真实数据（监控平台前后对比），没有数据就如实说「只做了体积，未跟指标」。

**useState 与 Hooks 规则**：`useState` 在函数组件首次渲染时创建状态并存在 Fiber 的 hooks 链表上，后续渲染按调用顺序取对应 hook；`setState` 触发调度（React 18 自动批处理），函数式更新解决闭包旧值问题。Hooks 依赖调用顺序，所以不能在条件、循环、嵌套函数里调用，否则链表错位。原理层面能说出「dispatcher + 链表 + 调度」即可。

---
title: 长鑫科技前端实习一面：八股与 TS 类型运算
company: 长鑫科技
position: 前端开发实习生
round: 一面
date: '2026-09'
base: 合肥
source: 牛客网
tags: ["前端","JavaScript","TypeScript","Vue","事件循环"]
summary: "长鑫科技前端开发实习一面面经，9 月 21 日上午面试，作者总结为常规八股。问题覆盖事件循环、闭包、ES6 新特性、var/let/const 区别、TS 的 interface 与类型运算、interface 和 type 的区别、Vue 与 React 框架选择、Vue2 与 Vue3 区别，以及项目里的 subagent 实现方式和到岗时间、学校课程安排。"
---

### 《面试题目》

1. 自我介绍。
2. 现在人在哪里？你是哪里人？能来合肥吗？
3. 讲一下事件循环。
4. 讲一下闭包。
5. 讲解一下 ES6 新特性。
6. var、let、const 的区别？
7. 知道 TS 里 interface 这些的类型运算吗？
8. interface 和 type 的区别？
9. 会什么前端框架？Vue 还是 React？
10. 讲一下 Vue2 和 Vue3 的区别。
11. 介绍项目。
12. 项目里的 subagent 是怎么做的？用的框架还是自己手搓的？
13. 什么时候能到岗？
14. 学校现在有课吗？
15. 反问。

### 《参考解析》

**事件循环**：浏览器里 JS 是单线程的，靠事件循环把任务排队执行。同步代码在执行栈上跑完；异步任务分宏任务（script 整体、setTimeout/setInterval、I/O、UI 渲染相关的任务）和微任务（Promise.then、queueMicrotask、MutationObserver、await 之后的部分）。每执行完一个宏任务，就把微任务队列**全部清空**，然后才进入下一个宏任务；渲染时机在微任务清空之后、下一个宏任务之前。经典输出题要能一眼看穿：`Promise.resolve().then` 一定早于 `setTimeout(...,0)`；`await` 后面的代码等价于包在 `then` 里的微任务。Node 的事件循环则是分阶段的（timers → pending callbacks → poll → check → close），微任务在阶段间清空，另外 `process.nextTick` 的优先级高于 Promise 微任务，`setImmediate` 在 check 阶段而 `setTimeout(0)` 在 timers 阶段。

**闭包**：闭包是函数与它定义时所处词法环境的组合——内层函数引用了外层函数的变量，外层返回后这些变量仍被引用，于是不会被回收，存放在堆上。用途：数据私有化（模块模式、计数器）、函数工厂、防抖节流里保存定时器 id、以及 React 里 `useCallback`/`useEffect` 捕获旧值导致闭包陷阱。代价是内存常驻，循环里创建大量闭包或误引用大对象会造成泄漏；经典循环题 `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))` 打印 3 3 3，是因为 `var` 是函数作用域、三个回调共享同一个 i；换成 `let` 每次迭代创建新绑定就打印 0 1 2。被追问「闭包变量存在哪」时：存在堆上的环境记录里，由函数的 `[[Environment]]` 内部槽指向。

**var / let / const 与 ES6 新特性**：`var` 是函数作用域、有变量提升（声明提升但值为 undefined）、允许重复声明、挂在全局对象上；`let`/`const` 是块级作用域、存在暂时性死区（TDZ，声明前访问抛 ReferenceError）、不允许重复声明；`const` 只约束绑定不可重新赋值，对象内部属性仍可修改，真正的不可变需要 `Object.freeze`（且是浅冻结）。ES6 常考的特性可以按模块说：解构赋值与默认参数、模板字符串、箭头函数（无自己的 this/arguments，不能 new）、展开与剩余运算符、`Map`/`Set`/`WeakMap`、`Symbol`、`Proxy` 与 `Reflect`、`class` 语法、`Promise` 与迭代器/生成器的 `for...of`、以及 `import`/`export` 模块化。面试时挑三四个能说清细节的讲，比背清单好。

**TS 的类型运算、interface 与 type 的区别**：interface 与 type 的主要差异有四点：① 扩展方式不同，interface 用 `extends` 且可以多次声明同名接口自动合并（declaration merging），type 用交叉 `&` 且不能重复声明；② type 能表达联合、元组、条件类型、映射类型、模板字面量类型这些 interface 表达不了的形态，interface 更适合描述对象与类的契约；③ 性能上 interface 的合并检查更省，超大联合用 type 会更慢；④ 类实现时 interface 的报错信息更友好。TS 的类型运算指的是在类型层面做计算：`keyof`、索引访问 `T[K]`、`typeof`、条件类型 `T extends U ? X : Y` 配合 `infer`（实现 `ReturnType`、`Parameters`）、映射类型 `{ [K in keyof T]: ... }` 配合 `as` 重映射键、模板字面量类型做字符串拼接、以及 `Readonly`/`Partial`/`Pick`/`Omit` 这些内置工具类型。回答时给出一个自定义工具类型的例子最有说服力，比如手写 `type MyPick<T, K extends keyof T> = { [P in K]: T[P] }`。

**Vue2 与 Vue3 的区别**：① 响应式原理不同，Vue2 用 `Object.defineProperty` 递归劫持属性，无法监听新增/删除属性和数组下标，需要 `$set`；Vue3 用 `Proxy` 代理整个对象，天然支持新增属性、数组索引与 Map/Set，且是惰性递归；② 组合方式不同，Vue2 是 Options API（data/methods/computed 分片），Vue3 的 Composition API 用 `setup` 按逻辑组织，逻辑复用用组合函数替代 mixin（避免命名冲突与来源不清）；③ 生命周期与实例 API 有调整，`beforeDestroy`/`destroyed` 改为 `beforeUnmount`/`unmounted`，`$children` 移除，`v-model` 在组件上默认用 `modelValue` + `update:modelValue`；④ 新增 Fragment（多根节点）、Teleport、Suspense，`v-if` 与 `v-for` 优先级对调（Vue3 中 `v-if` 优先级更高）；⑤ 性能与工程侧，Vue3 有静态提升、Patch Flag、Tree-shaking 友好、更好的 TS 支持，底层用 Rollup/Vite 生态，还提供自定义渲染器。被问「项目里 subagent 是手搓还是用框架」时，要能说清选型理由：自研可控、便于定制工具与上下文策略，框架省事但受限于抽象边界；同时准备好讲清它怎么调度、怎么传上下文、失败怎么重试。

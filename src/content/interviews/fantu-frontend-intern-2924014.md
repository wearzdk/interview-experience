---
title: 凡拓前端实习面经（10.10）
company: 凡拓
position: 前端实习
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/4c4d16df5d6246b98c246f970ce5826a
tags: ["前端实习","Vue","Git","ES6","构建工具"]
summary: "凡拓前端实习面经：自我介绍与项目、实习经历和最有印象的难点之后，考 Git 原理与撤回提交、CSS 垂直水平居中、flex 布局与 flex: 1、ES6 新特性、Map 与 Set 的区别、Promise 静态方法、webpack 与 vite 的差异、Vue2 与 Vue3 的区别以及 Vue 生命周期，最后是反问业务。"
---

### 《面试题目》

1. 自我介绍。
2. 介绍实习所做的事情。
3. 介绍一下项目。
4. 讲解一下自己碰到最有印象的难点。
5. 怎么学习前端的？
6. 讲解一下 Git 原理，以及协作过程。
7. Git 怎么撤回提交？
8. CSS 怎么垂直水平居中？
9. 介绍一下 flex 布局，flex: 1 是什么情况？
10. ES6 有什么新特性？
11. Map 和 Set 有什么区别？各自什么应用场景？
12. 介绍一下 Promise 的静态方法。
13. webpack 和 vite 区别？
14. Vue2 和 Vue3 有什么区别？
15. Vue 生命周期？
16. 反问业务。

### 《参考解析》

**Git 原理与撤回提交**。Git 的核心是一套内容寻址的对象库：blob 存文件内容、tree 存目录结构、commit 指向一棵 tree 与父提交、branch 只是一个指向 commit 的引用（ref），HEAD 指向当前分支。工作区、暂存区（index）、本地仓库三层之间的搬运构成了日常命令：`add` 把工作区内容写进 index 并生成 blob，`commit` 由 index 生成 tree 与 commit，`push` 把本地对象与 ref 传到远端。撤回提交的做法取决于提交到哪一步：还没提交就 `git restore`（撤销工作区改动）或 `git restore --staged`（把文件从暂存区退回工作区）；已经提交但没推送，用 `git reset --soft HEAD~1`（保留改动在暂存区）、`--mixed`（默认，改动退回工作区）、`--hard`（连工作区一起丢弃，慎用）三种粒度；已经推送了就不要改写历史，用 `git revert <commit>` 生成一个反向提交，历史保持线性、对协作者安全。不小心 reset --hard 丢掉的提交还能用 `git reflog` 找回，它记录了 HEAD 的每一次移动。团队协作上要讲清分支模型（main 保护 + feature 分支 + PR 评审）、冲突解决（本地 rebase 或 merge 后手动解冲突再提交）、以及 pull --rebase 与 merge 的区别——面试官问「协作过程」时想听的是这些约定，而不是命令列表。

**CSS 垂直水平居中**。最常用的是 flex：父元素 `display: flex; justify-content: center; align-items: center`；grid 可以更短：`display: grid; place-items: center`。需要兼容旧浏览器或不想用 flex 时，绝对定位方案是 `position: absolute; inset: 0; margin: auto`（要求元素有确定宽高），或者 `left: 50%; top: 50%; transform: translate(-50%, -50%)`（不要求宽高，但 transform 会影响子元素定位参照）。行内元素可以用父容器 `text-align: center` 加 `line-height` 等于高度来垂直居中（仅限单行文本）；表格布局的 `display: table-cell; vertical-align: middle` 是老方案。面试时除了给方案，最好补一句各自的适用条件——固定宽高 vs 未知宽高、是否影响布局流、以及 `margin: auto` 在绝对定位下的居中原理（左右上下都为 0 且 auto 外边距平分剩余空间）。

**flex 布局与 flex: 1**。flex 容器的主轴方向上，`flex-grow` 决定剩余空间怎么分、`flex-shrink` 决定空间不足时怎么缩、`flex-basis` 是分配前的初始主轴尺寸。`flex: 1` 是简写，等价于 `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`——关键是 basis 为 0，所以元素先被压成 0 再按比例瓜分整个容器宽度，这才是「等分」的效果；而 `flex: auto` 是 `1 1 auto`，以内容宽度为起点再分剩余空间，两者经常被混为一谈。要记住的坑还有：`flex-shrink` 的收缩是按 basis 加权而非平均分配（大元素缩得多）；`min-width: auto` 会让 flex 项无法缩小到内容宽度以下，需要显式设 `min-width: 0` 才能实现省略号截断；`flex-wrap` 与 `justify-content`、`align-items` 分别控制主轴与交叉轴。

**ES6 及之后的语言特性**。按类别答更清楚：声明与作用域有 `let`、`const`（块级作用域、暂时性死区、不挂到全局对象）；函数有箭头函数（不绑定 this、不能做构造函数）、默认参数、剩余参数与展开运算符；数据结构有 `Map`、`Set`、`WeakMap`、`WeakSet`；语法糖有解构赋值、模板字符串、对象属性简写与计算属性、可选链与空值合并（属于后续标准但常一起答）；异步有 `Promise`、`async`、`await`；模块化有 `import`、`export`（静态分析、可摇树）；面向对象有 `class`、`extends`、`super`；元编程有 `Proxy`、`Reflect`、`Symbol`、迭代器与生成器（`function*`、`yield`）。答的时候挑三四个讲透（比如箭头函数的 this 与词法作用域、`const` 对对象的约束是引用不可变、可选链的短路行为），比列一长串名词更像真的用过。

**Map 与 Set 的区别与场景**。Map 是键值对集合，键可以是任意类型（对象、函数都行），按插入顺序迭代，`size` 直接可读；Set 是值的集合，自动去重，同样保持插入顺序。场景上，Map 适合「用对象当键做缓存或索引」（普通对象会把键转成字符串，导致 `[object Object]` 冲突）、需要频繁增删和统计大小；Set 适合数组去重（`[...new Set(arr)]`）、集合运算、以及做「已访问过」的成员标记。面试官常追加一问：`WeakMap`、`WeakSet` 的区别——键必须是对象且是弱引用，不阻止垃圾回收、不可遍历、没有 `size`，典型用途是给 DOM 节点挂私有数据。

**Promise 的静态方法**。`Promise.resolve` 与 `Promise.reject` 用来快速创建一个已敲定状态的 promise。`Promise.all` 并发执行、全部成功才成功，结果数组与输入顺序一致，任意一个失败就立刻整体失败（其他请求仍在跑，只是结果被忽略）。`Promise.allSettled` 等全部结束，返回每项的 `{status, value|reason}`，适合批量任务互不影响、最后汇总的场景。`Promise.race` 取第一个敲定的结果（成功或失败都算），常用于超时控制。`Promise.any` 取第一个成功的，全部失败时抛 `AggregateError`，适合多镜像源探测。要能顺口说出「谁短路、谁等全部、失败时返回什么」，这是这题的全部考点。

**webpack 与 vite 的区别**。webpack 是打包器：开发时也要先把整个依赖图构建成 bundle，代码改动后按模块热替换，项目越大冷启动越慢，但生态与产物优化能力极其成熟。vite 走的是「开发期不打包、生产期用 Rollup 打包」的路线：开发时把源码以原生 ESM 形式交给浏览器，依赖用 esbuild 预构建成 ESM（把 CJS 转成 ESM 并合并零散模块，避免请求风暴），只有被请求到的模块才即时编译，所以冷启动基本是常数级、HMR 更快；生产构建用 Rollup 做 tree-shaking 与代码分割。代价是 vite 依赖浏览器对 ESM 的支持，且开发与生产使用两套管线，偶有行为差异。按「开发机制、构建速度、生态成熟度、适用场景」四段对比即可。

**Vue2 与 Vue3 的区别以及生命周期**。最大的变化是响应式：Vue2 用 `Object.defineProperty` 递归劫持属性，无法监听新增删除属性（要靠 `Vue.set`）和数组下标修改；Vue3 用 `Proxy` 代理整个对象，天然支持新增属性、数组索引、Map/Set，并且是惰性的（访问到才递归代理）。其他区别包括：组合式 API（`setup`、`ref`、`reactive`、`computed`、`watch`）让逻辑按功能而不是按选项组织，配合自定义 hook 更好复用；生命周期把 `beforeCreate`、`created` 合并进 `setup`，`beforeDestroy`/`destroyed` 改名 `beforeUnmount`/`unmounted`；模板编译有静态提升、Patch Flag、Block Tree，diff 换成最长递增子序列优化；此外支持多根节点 Fragment、`Teleport`、`Suspense`，并用 TypeScript 重写。生命周期要能把 Vue3 顺序说全：`setup` → `onBeforeMount` → `onMounted` → `onBeforeUpdate` → `onUpdated` → `onBeforeUnmount` → `onUnmounted`，以及 `onActivated`、`onDeactivated`、`onErrorCaptured` 的用途。

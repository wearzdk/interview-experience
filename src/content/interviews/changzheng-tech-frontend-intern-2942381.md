---
title: "广东长正科技前端实习面经：权限路由、Promise 与组件通信八连问"
company: "广东长正科技"
position: "前端开发（实习）"
round: "一面"
date: '2026-11'
collectedAt: '2026-11-19'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/6206cfe895144d9b9932408f0351c3ff
tags: ["广东长正科技","前端","Vue","权限路由","Promise","组件通信","实习","面经"]
summary: "以中后台管理系统的动态路由权限控制为简历亮点的前端实习一面：不受权限控制的路由怎么处理、权限路由的设计过程，然后是 JS 基本类型、同步与异步、Promise 原理与原型上的方法、nextTick、多级路由下的组件通信、computed 与 watch 的区别，以及表单组件的设计思路。"
---

### 《面试题目》

1. 自我介绍。
2. 项目拷打：不受权限控制的路由怎么处理？说说权限路由的设计过程。
3. JS 有哪些基本类型？
4. 同步和异步的区别是什么？
5. Promise 的原理是什么？
6. Promise 原型链上有哪些方法？
7. 说说 `nextTick` 和类似的钩子。
8. 组件嵌套了很多层、又有多级路由时，组件之间怎么通信？
9. `computed` 和 `watch` 的区别是什么？
10. 有设计过表单组件吗？说说思路。

### 《参考解析》

**权限路由的设计**。核心是把「路由表」拆成静态与动态两部分：静态路由（登录页、404、首页骨架）所有人可见，动态路由按后端返回的权限标识在前端过滤后 `addRoute` 注入。设计过程要说清四步：登录后拿到用户角色与权限码；用权限码匹配路由的 `meta.permissions`，生成可访问路由表；动态注册并处理刷新丢失（把权限存 store 或重新拉取）；最后是兜底——未匹配到的路径重定向 404，无权限的路径重定向 403 而不是白屏。不受权限控制的路由要显式标记（`meta.public = true`），并且要在路由守卫里放行，不能靠「没配权限就等于公开」这种隐式规则。还要说明「前端过滤只是体验，真正的鉴权必须在后端接口上」。

**JS 基本类型**。七种原始类型：`undefined`、`null`、`boolean`、`number`、`string`、`symbol`、`bigint`，加上引用类型 `object`（含函数与数组）。要点是原始类型按值存储、比较值，引用类型按引用比较；`typeof null === 'object'` 是历史遗留；`NaN` 不等于自身，判断用 `Number.isNaN`。

**同步与异步**。同步代码按顺序执行、阻塞后续；异步把耗时操作交给运行时（定时器、网络、IO），通过回调、Promise 或 async/await 在完成后继续。JS 是单线程加事件循环：同步代码进调用栈，异步回调进任务队列，微任务（Promise.then、queueMicrotask、MutationObserver）在每个宏任务结束后清空，然后才取下一个宏任务。答这题最好给一个 `setTimeout` 与 `Promise.then` 混排的输出顺序例子。

**Promise 原理**。三个状态 pending / fulfilled / rejected，状态只能从 pending 单向转换一次；`then` 返回新的 Promise 以支持链式调用，回调进微任务队列；错误沿链向后传递直到被 `catch` 捕获；`then` 的值穿透与 Promise 决议过程（resolve 一个 thenable 会递归展开）是常被追问的点。手写实现的关键是维护回调数组、用 `queueMicrotask` 调度、并保证 then 的返回值被正确决议。

**Promise 原型上的方法**。实例方法：`then`、`catch`、`finally`。静态方法：`resolve`、`reject`、`all`、`allSettled`、`race`、`any`。区别要能说清：`all` 有一个失败就整体失败；`allSettled` 等全部结束并返回每项状态；`race` 取第一个结束的（无论成败）；`any` 取第一个成功的，全部失败才失败（抛 `AggregateError`）。`finally` 不改变值、也不吞错误。

**nextTick**。Vue 的 `nextTick` 把回调推迟到 DOM 更新之后执行，因为数据变更触发的是异步更新队列——同一轮里多次改数据只重新渲染一次。实现上优先用 `Promise.then`（微任务），降级到 `MutationObserver`、`setImmediate`、`setTimeout`。React 里对应的是 `useEffect` / `useLayoutEffect` 的时机差别：`useLayoutEffect` 在浏览器绘制前同步执行，适合读布局；`useEffect` 在绘制后异步执行。

**多层级组件通信**。按耦合度从低到高：props / emit（父子）、`provide` / `inject`（跨层级，但要避免滥用导致依赖隐式）、状态管理（Pinia / Vuex，适合全局共享）、事件总线（简单但难追踪，Vue 3 已移除 `$on`，可用 mitt）、`$attrs` / `$listeners` 透传、以及 `ref` 直接调用子组件方法（应急手段）。多级路由下还要区分「路由参数」与「组件状态」：路由参数通过 `useRoute` 读取，跨页面共享的数据放 store，不要靠 URL 传大对象。

**computed 与 watch**。`computed` 是派生状态：有缓存，依赖不变不重新计算，必须是纯函数、不能有副作用，适合模板里直接用；`watch` 是副作用：依赖变化时执行回调，可以异步、可以拿到新旧值，适合请求数据、操作 DOM、写缓存。`watch` 要说明 `deep`、`immediate`、`flush` 的取舍，以及为什么大对象深监听代价高。

**表单组件设计**。思路是「受控 + 校验 + 布局」三层：值由外部传入、变更通过事件抛出（受控组件），组件内部只维护 UI 状态（聚焦、错误提示）；校验规则用 schema 或 rules 数组声明，支持同步与异步校验，错误信息统一渲染；布局用 `label` 宽度、栅格与 `form-item` 组合，支持嵌套与动态增减项。还要考虑无障碍（label 关联、错误用 `aria-describedby`）、初始值与重置、以及提交时的整体校验时机（失焦校验还是提交校验）。

---
title: "哔哩哔哩前端一面：事件循环、useState 与 useRef 的输出顺序"
company: 哔哩哔哩
position: 前端开发
round: 一面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/259562c4a51e4b758ace69c69734c1d1
tags: ["哔哩哔哩","前端","JavaScript","事件循环","React","Git","WebSocket"]
summary: "28 届双非二本的前端一面，50 分钟、牛客视频面试：JavaScript 部分问 var/let/const、字符串与数组互转、事件循环与异步输出顺序、Promise.all/race/allSettled、深浅拷贝，React 部分问 useState 与 useRef 的输出顺序和 useEffect，工程部分问有未提交内容时怎么切分支（stash、worktree）；项目环节问实习中遇到的问题、WebSocket 的使用思路、写的 skill 是做什么的，最后聊是否 review AI 写的代码与实习时长。"
---

### 《面试题目》

1. `var`、`let`、`const` 的区别是什么？
2. JavaScript 字符串怎么转数组，数组怎么转字符串？
3. 事件循环是什么？宏任务与微任务怎么执行？
4. 下面这段异步代码的输出顺序是什么？
5. `Promise.all`、`Promise.race`、`Promise.allSettled` 有什么区别？
6. 深拷贝和浅拷贝有什么区别，怎么实现深拷贝？
7. React 里 `useState` 和 `useRef` 在连续更新时的输出顺序是怎样的？
8. `useEffect` 的执行时机与依赖数组怎么理解？
9. Git 在有未提交内容时如何切换分支？`stash` 和 `worktree` 分别怎么用？
10. 实习中遇到过什么问题，解决思路是什么？
11. WebSocket 的使用思路是怎样的？
12. 实习中写的 skill 具体是做什么的？
13. 你会 review AI 写的代码吗？
14. 每份实习时间为什么有点短？
15. 反问：业务是什么？
16. 反问：工作强度。
17. 反问：组内的代码规范和测试流程。
18. 反问：我需要加强的点。

### 《参考解析》

**var / let / const**：`var` 是函数作用域、存在变量提升（声明被提到作用域顶部并初始化为 `undefined`）、允许重复声明；`let` 与 `const` 是块级作用域，声明前访问会进入暂时性死区并抛错，不允许在同一作用域重复声明；`const` 约束的是绑定不可重新赋值，对象内容仍可修改。循环里用 `var` 注册回调是经典陷阱，因为所有回调共享同一个变量。

**字符串与数组互转**：字符串转数组用 `split('')`、扩展运算符 `[...str]` 或 `Array.from(str)`，后两者按码点切分，能正确处理 emoji 这类代理对；数组转字符串用 `join(separator)` 或 `toString()`（等价于 `join(',')`）。要区分「按字符切」与「按字节 / 码点切」，国际化场景下 `split('')` 会切坏代理对。

**事件循环**：同步代码执行完后，先清空微任务队列（Promise 回调、`queueMicrotask`、`MutationObserver`），再取一个宏任务（`setTimeout`、事件回调、I/O）执行，执行完再清微任务，如此循环。`requestAnimationFrame` 在渲染前执行，属于另一条队列。微任务里继续产生微任务会一直清空，可能导致饿死渲染。Node 的 `process.nextTick` 优先级高于 Promise 微任务，这是与浏览器的主要差异。

**异步输出顺序的判断方法**：先标出所有同步代码，把 `await` 之后的语句视为微任务，`setTimeout` 归宏任务，然后按「同步 → 微任务（含 `await` 续体）→ 宏任务」逐层展开。`async` 函数调用本身是同步执行的，直到遇到第一个 `await` 才让出；`Promise.then` 的回调总是排在其后。面试里这类题考的是能否稳定推演，而不是背答案。

**Promise 组合子**：`all` 等全部成功、任一失败立即 reject；`race` 取最先 settle 的那个（成功或失败）；`allSettled` 等全部结束并返回每个的状态与值，不会短路；`any` 取第一个成功的，全部失败才 reject（聚合错误）。选型看业务语义：批量请求要全部结果用 `allSettled`，要最快可用结果用 `race`。

**深浅拷贝**：浅拷贝只复制第一层，嵌套对象仍共享引用（展开运算符、`Object.assign`、`slice`）。深拷贝要递归复制所有层级，`structuredClone` 能处理循环引用、`Map`、`Set`、`Date`，但不支持函数与 DOM 节点；`JSON.parse(JSON.stringify(x))` 会丢 `undefined`、函数、`Symbol`，把 `Date` 变成字符串，遇到循环引用直接抛错。手写递归要用 `WeakMap` 记录已拷贝对象以处理循环引用，并分别处理数组、普通对象与特殊内建类型。

**useState 与 useRef 的输出顺序**：`useState` 的更新是异步批处理的，在同一个事件回调里连续 `setCount(count + 1)` 三次，读到的都是同一次渲染的快照，最终只加一；要基于上一次值更新必须用函数式写法 `setCount(c => c + 1)`。`useRef` 的 `.current` 是同步可变的，赋值后立刻能读到新值，且修改不触发重渲染。因此在「先 setState 再读值」的代码里，`state` 读到旧值、`ref.current` 读到新值，这就是题目问的输出顺序差异。React 18 之后自动批处理扩展到 `setTimeout` 与 Promise 回调，跨 await 的更新也会合并。

**useEffect**：在浏览器完成绘制后执行（`useLayoutEffect` 在绘制前同步执行）。依赖数组决定是否重新执行：空数组只跑一次，省略则每次渲染都跑；返回的函数是清理函数，在下次执行前与卸载时调用。闭包捕获的是当次渲染的变量，定时器里读不到最新 state 是常见 bug，解法是用 ref 或把依赖补全。开发模式下 StrictMode 会故意双执行以暴露副作用未清理的问题。

**Git 切分支**：有未提交内容时，`git stash` 把工作区与暂存区收起来，切完分支再 `git stash pop`，适合临时中断；`git worktree add ../hotfix hotfix-branch` 在另一个目录检出分支，原工作区不动，适合一边改紧急问题一边保留未完成的功能开发。也可以直接 `git switch -c` 带上未提交改动到新分支，只要没有冲突。选择依据是「是否需要同时保留两个工作现场」。

**WebSocket 的使用思路**：先明确用途是推送还是双向交互，再设计连接生命周期——建连、鉴权（通常在握手时带 token 或用首帧认证）、心跳保活、断线重连（指数退避加抖动）、消息序号与去重。协议层要定义消息类型与错误码，业务层要处理乱序与重复。浏览器原生 WebSocket 不支持自定义请求头，鉴权要靠 query 参数或首帧消息，这会影响安全设计。断线期间的增量要靠服务端补发或客户端拉取对齐。

**review AI 写的代码**：该看的是它是否理解了上下文——接口契约、错误处理、边界条件、并发与资源释放，这些恰恰是生成代码最容易漏的地方；其次是可维护性，命名与结构是否符合仓库既有约定。有效的做法是把 review 前置成约束（类型、测试、lint），让机器挡住低级问题，人只看设计与边界。

**实习时长偏短**：面试官问这句通常在评估稳定性与动机。回答要给出客观原因（学业安排、方向调整、项目周期），并说明每段经历留下了什么可复用的产出，避免评价前东家。

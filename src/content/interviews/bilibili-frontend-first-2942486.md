---
title: "哔哩哔哩前端一面：事件循环、Promise 输出顺序与 React Hooks"
company: 哔哩哔哩
position: 前端开发
round: 一面
date: '2026-11'
collectedAt: '2026-11-19'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/8f0f715d733943faa89ea44e59f54da2
tags: ["哔哩哔哩","前端","JavaScript","事件循环","Promise","React","Git"]
result: 挂
summary: "哔哩哔哩前端一面（10.22，50 分钟，牛客网会议），八股集中在 JavaScript 基础：var/let/const、字符串与数组互转、事件循环与宏微任务、异步输出顺序、Promise 的 all/race/allSettled、深浅拷贝、useState 与 useRef 的更新时机、useEffect；项目部分问实习难点、WebSocket 用法与写的 Skill，另有 Git stash/worktree 与是否 review AI 代码。"
---

### 《面试题目》

1. 自我介绍。
2. JS 的 var、let、const 有什么区别？
3. JS 字符串转数组、数组转字符串分别怎么做？
4. JS 事件循环中宏任务与微任务是什么？
5. 给一段异步代码，说出输出顺序。
6. Promise 的输出顺序，以及 all、race、allSettled 的区别。
7. JS 的深拷贝与浅拷贝。
8. React 中 useState、useRef 的输出顺序是怎样的？
9. React 的 useEffect 怎么用？
10. Git 在有未提交内容时如何切换分支？stash 与 worktree 分别怎么用？
11. 实习中遇到的问题以及解决问题的思路。
12. WebSocket 的使用思路。
13. 实习中写的 Skill 具体是做什么的？
14. 是否会 review AI 写的代码？
15. 每份实习时间为什么有点短？
16. 反问：业务是什么、工作强度、组内代码规范与测试流程、需要加强的点。

### 《参考解析》

**var / let / const**：var 是函数作用域、存在变量提升（声明提升但值为 undefined）、可重复声明、在全局声明时挂到 window；let 与 const 是块级作用域、存在暂时性死区（声明前访问抛 ReferenceError）、不可重复声明；const 约束的是绑定不可重新赋值，对象内部属性仍可改。循环里用 var 配 setTimeout 会全部打印最后一个值，用 let 每轮生成新绑定。

**事件循环与输出顺序**：同步代码先执行，然后清空微任务队列，再取一个宏任务，如此循环。宏任务包括 script 整体、setTimeout、setInterval、I/O、UI 渲染；微任务包括 Promise.then/catch/finally、queueMicrotask、MutationObserver。`await` 之后的代码等价于放进 then 的微任务。判断输出题的步骤是：先跑完同步，再按入队顺序清微任务，最后才轮到定时器。

**Promise 静态方法**：`all` 全部成功才成功，任一失败立即失败；`allSettled` 等所有结果，返回 `{status, value|reason}`，适合批量任务不怕个别失败；`race` 取最先落定者（成功或失败）；`any` 取第一个成功者，全部失败才失败。使用场景：并发请求全成功用 all，容错汇总用 allSettled，超时控制用 race。

**深浅拷贝**：浅拷贝只复制第一层（`Object.assign`、展开运算符），嵌套对象仍共享引用；深拷贝递归复制所有层级，常用 `structuredClone`，或 `JSON.parse(JSON.stringify())`（会丢 undefined、函数、Date 变字符串、循环引用报错）。手写时要处理数组、Date、RegExp、Map/Set 与循环引用（WeakMap 记录）。

**useState 与 useRef 的更新时机**：useState 的 setter 触发重渲染，同一事件里多次调用会批处理，函数式更新 `setX(x => x + 1)` 才能拿到最新值；useRef 修改 `.current` 不触发渲染，适合存定时器 ID、上一轮的值这类不需要上屏的数据。输出题的关键是分清「闭包里的旧值」与「渲染后的新值」。

**Git 切分支**：有未提交内容时 `git stash`（或 `git stash push -m`）暂存后切换，回来 `git stash pop`；`git worktree add ../hotfix branch` 可以为同一仓库另开一个工作目录，互不干扰，适合同时处理紧急修复。

**WebSocket 的使用思路**：一次 HTTP 升级握手后建立全双工长连接，适合消息推送与实时协作。工程上要处理心跳保活、断线重连（指数退避 + 抖动）、消息序号与去重、连接状态与 UI 同步；鉴权在握手阶段用 token 或 cookie 完成，重连后要重新订阅频道。

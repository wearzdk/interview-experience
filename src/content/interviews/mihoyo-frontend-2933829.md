---
title: "10.27 米哈游前端一面：浏览器渲染、事件循环与 ReAct"
company: "米哈游"
position: "前端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/25a3a2fc3f94419e9fd3b6d1f1780474
tags: ["米哈游","前端","浏览器","事件循环","Vue","ReAct","防抖节流"]
summary: "米哈游校招前端一面：URL 到页面、JS 阻塞渲染、TCP/UDP、CSS 定位与居中、多行省略、宏微任务、Vue ref/reactive、虚拟 DOM、ReAct Loop 与防抖节流手写。"
---

### 《面试题目》

1. 从浏览器地址栏输入网址到显示页面，经历了哪些步骤？
2. JS 的解析会不会阻塞渲染？
3. TCP 和 UDP 有什么区别？
4. CSS position 有哪些定位方式？
5. 搭配相对定位和绝对定位，如何实现元素水平居中？
6. 多行文本省略怎么实现？单行呢？
7. 常见的 JS 宏任务和微任务有哪些？
8. async/await 哪一部分属于微任务？
9. 宏任务和微任务整体的执行顺序是什么？
10. Vue 的 ref 和 reactive 有什么区别？
11. 平时分别在什么场景下使用 ref 和 reactive？
12. ref 和 reactive 底层是怎么实现的？
13. 虚拟 DOM 和直接操作 DOM，哪一个性能更好？
14. 直接操作 DOM，从 0 一直加到 10000，用户能看到中间的数字吗？
15. 了解过 ReAct 吗？它的停止条件是什么？
16. 简单手写一个 ReAct Loop。
17. 防抖和节流的区别？实际业务开发中如何使用？
18. 给点击事件加 3000ms 防抖，用户一直点击到第 4000ms 停止，回调触发几次？如果是节流呢？
19. 手写防抖函数。
20. 反问。

### 《参考解析》

**渲染与阻塞**：HTML 解析构建 DOM，CSS 解析构建 CSSOM，二者合成渲染树，布局后绘制。遇到 `<script>` 会暂停解析、下载并执行（除非 async/defer），因为 JS 可能修改 DOM；CSS 不直接阻塞解析，但会阻塞渲染和脚本执行。

**事件循环**：同步代码先执行，然后清空微任务队列（Promise.then、queueMicrotask、MutationObserver），再取一个宏任务（setTimeout、setInterval、I/O、UI 渲染），如此循环。async 函数里 await 之前的代码同步执行，await 之后的代码相当于 then 回调，进微任务队列。

**ref vs reactive**：`ref` 可以包基本类型和对象，访问要 `.value`，模板里自动解包；`reactive` 只能用于对象，直接访问属性。底层 `ref` 用 `RefImpl` 的 getter/setter 配合 `track/trigger`，对象会转成 `reactive`；`reactive` 用 Proxy 拦截 get/set/deleteProperty 等。选型：基本类型、需要整体替换的对象用 ref；表单、嵌套对象用 reactive。

**虚拟 DOM 与直接操作**：虚拟 DOM 不一定更快，它的价值是「声明式 + diff 批量更新 + 跨平台」，在频繁小更新时直接操作 DOM 可能更快；框架的开销在 diff 和创建 VNode。0 加到 10000 的例子：同步循环会阻塞主线程，浏览器没有机会渲染，用户只能看到最后结果；要看到中间过程得用 `requestAnimationFrame` 或 `setTimeout` 分片。

**ReAct Loop**：循环「思考（Thought）→ 行动（Action/工具调用）→ 观察（Observation）」，把观察追加进上下文再继续，直到模型输出 Final Answer、达到最大步数、或触发停止条件（无新信息、重复动作、超时、超预算）。手写时要有工具注册表、消息历史、最大轮数、异常处理和终止判断。

**防抖与节流**：防抖是「停止触发 N 毫秒后才执行」，节流是「每 N 毫秒最多执行一次」。3000ms 防抖、持续点到 4000ms 停：只在停止后 3000ms 执行一次，即 1 次；同样参数下节流（时间戳版）大约每 3 秒一次，4000ms 内约 2 次（0ms 和 3000ms），具体看实现是首次触发还是末次触发。

---
title: "百度 Agent 前端开发实习一面面经"
company: "百度"
position: "Agent前端开发实习生"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/06a3ff9a0cca4e6e8d0edeceeb598eb6
tags: ["前端", "JavaScript", "React", "CSS", "浏览器", "缓存"]
summary: "百度 Agent 前端开发实习一面，覆盖 Cookie/Storage、事件循环与宏微任务、useState/useMemo/React.memo、display:none 与 visibility:hidden、作用域与原型链、HTTP 缓存策略、从输入 URL 到页面渲染的完整流程及阻塞点。"
---

### 《面试题目》

1. 自我介绍。
2. 浏览器中的 Cookie、SessionStorage、LocalStorage 有什么区别？
3. JavaScript 的事件循环（Event Loop）机制是什么？
4. JavaScript 中哪些是宏任务，哪些是微任务？举例说明。
5. React 中的 useState Hook 用来做什么？
6. React 中的 useMemo Hook 用来做什么？
7. React 中的 React.memo 用来做什么？它与 useMemo 有什么区别？
8. CSS 中 display: none 和 visibility: hidden 有什么联系与区别？
9. 解释 JavaScript 中的作用域和作用域链。
10. 解释 JavaScript 中原型和原型链。
11. 浏览器的 HTTP 缓存有哪些策略？
12. 访问一个网站时，HTML 文件应该采用什么样的缓存策略？
13. 从用户输入 URL 并按下回车，到页面最终加载显示，整个过程发生了哪些步骤？
14. 浏览器加载和渲染页面的过程中存在哪些可能的阻塞点？

### 《参考解析》

**存储**：Cookie 会随请求发送、容量约 4KB、可设过期时间；localStorage 持久化、容量约 5-10MB、同源共享；sessionStorage 只在当前标签页会话内有效。鉴权 token 放 Cookie 要注意 HttpOnly/Secure/SameSite，放 localStorage 则要防 XSS。

**事件循环**：同步代码执行完清空微任务队列，再取一个宏任务，如此循环；宏任务包括 setTimeout、setInterval、I/O、UI 渲染，微任务包括 Promise.then、queueMicrotask、MutationObserver。大量微任务会阻塞渲染，因为微任务队列不空就不会进入下一轮宏任务。

**React**：useState 触发组件重渲染；useMemo 缓存计算结果，避免昂贵计算重复执行；React.memo 缓存组件渲染结果，props 浅比较不变则跳过渲染。两者一个缓存值、一个缓存组件，常配合使用。

**CSS 与 JS 基础**：display:none 不占位、不渲染、不可动画；visibility:hidden 占位但不显示，子元素可设 visible 恢复。作用域链是变量查找沿词法环境逐层向上的路径；原型链是对象属性查找沿 `__proto__` 向上的路径。

**HTTP 缓存**：强缓存用 Cache-Control/Expires，协商缓存用 ETag/If-None-Match、Last-Modified/If-Modified-Since。HTML 一般用 `no-cache` 或短 max-age 加协商缓存，保证发版后能及时更新；带 hash 的 JS/CSS 可以长缓存。

**URL 到渲染**：URL 解析 → DNS → TCP/TLS → 发送请求 → 服务端响应 → 解析 HTML → 构建 DOM/CSSOM → 布局 → 绘制 → 合成。阻塞点包括 JS 下载执行阻塞解析、CSS 阻塞渲染、同步 XHR、大图片、字体加载和主线程长任务。

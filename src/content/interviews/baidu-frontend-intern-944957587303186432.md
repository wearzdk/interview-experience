---
title: "百度前端日常实习一面二面：CSS、事件循环、HTTP 缓存与三层缓存优化"
company: "百度"
position: "前端开发"
round: "一二面"
date: '2026-10'
result: "已凉"
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/944957587303186432
tags: ["百度", "前端", "CSS", "事件循环", "HTTP缓存", "Vue3"]
summary: "百度前端日常实习一面 70 分钟按 CSS、JS 基础、HTTP 缓存、Vue3 与项目、事件循环、AI 开发场景题分块推进，几乎每个知识点都要求结合自己的班课项目回答；二面 40 分钟只聊实习经历、工作强度与离职原因，两天后 HR 答复已凉。"
---

### 《面试题目》

**CSS**

1. `justify-content` 和 `align-items` 有什么区别？还有哪些居中方式？
2. `align-items` 和 `align-content` 的区别是什么？如何实现水平垂直居中？
3. `flex: 1` 代表什么含义？
4. CSS 动画有哪些实现方式？
5. `transition` 和 `animation + @keyframes` 分别适合什么场景？
6. 小程序 `wx.createAnimation` 的作用和优势是什么？
7. CSS 单位 px / em / rem / vw / vh / rpx 各代表什么？区别和适用场景？

**JS 基础**

8. 数组查找判断相关的方法有哪些？
9. `some`、`every` 的作用是什么？`indexOf` / `lastIndexOf` 和 `findIndex` 有什么区别？
10. JS 中有哪些循环方式？`for` / `for...in` / `for...of` / `forEach` / `while` 的区别和适用场景？
11. 数组遍历与变换方法有哪些？`map` / `filter` / `reduce` / `forEach` 各自的作用和区别？
12. `reduce` 的用法是什么？能用它实现哪些场景（求和、扁平化、去重、分组）？
13. 说说你对 Promise 的理解？
14. Promise 一般用于哪些前端场景？`.then` / `.catch` 的作用是什么？怎么解决回调地狱？

**HTTP 缓存**

15. 说说 `no-cache` 的缓存策略行为？
16. `no-cache` 是禁用缓存吗？协商缓存的流程是什么？Etag 和 Last-Modified 起什么作用？
17. `no-store` 和 `no-cache` 有什么区别？`no-store` 适用什么业务场景？

**Vue3 与项目**

18. props、子传父 emit、插槽相关了解吗？列表中插槽是怎么使用的？
19. 有没有用 storage 做过状态缓存？自己手写全局缓存方案有什么问题？和浏览器原生 Cache-Control + Etag 方案相比呢？
20. 讲一下你项目里做的三层缓存优化？为什么要按版本、按库去拆分资源？
21. 项目中为什么优先使用 Vue 官方能力、尽量少引入第三方手写缓存方案？第三方会带来哪些弊端？
22. Vue 单向数据流你是怎么理解的？在你的班课项目里怎么体现？

**浏览器事件循环**

23. 浏览器事件循环的执行顺序是什么？
24. 哪些属于微任务，哪些属于宏任务？
25. 一段宏任务执行完之后要做什么？同步、宏任务、微任务、渲染的执行顺序是什么？
26. 结合你的项目，事件循环知识怎么应用到首屏优化？如何做到关键数据优先加载、非关键逻辑延后、避免首屏卡顿？

**业务场景题（AI 开发）**

27. AI 开发生成多套代码效果都不好，浪费时间，如何避免？
28. 同一个 AI 反复重写代码依旧达不到预期，该怎么处理？
29. AI 生成代码失败，可能会有哪些原因？如何规避？

**手撕代码**

30. 用 `reduce` 统计数组中每个元素出现的次数。

**二面（40 分钟）**

31. 聊聊实习经历。
32. 后续可以接受的工作强度？
33. 上一家的离职时间是什么时候？为什么离职？

### 《参考解析》

**Flex 的几个属性要分清作用轴**。`justify-content` 管主轴、`align-items` 管交叉轴（弹性容器里单行元素在交叉轴上的对齐）、`align-content` 管多行之间的分布（只在 flex-wrap 换行后且有多行时生效，单行无效）。水平垂直居中现在最常用的是 `display: flex; justify-content: center; align-items: center`，其次是 grid 的 `place-items: center`，再其次是绝对定位加 transform。`flex: 1` 是 `flex-grow: 1; flex-shrink: 1; flex-basis: 0%` 的简写——注意 basis 是 0 而不是 auto，这意味着元素的基础尺寸被忽略、完全按剩余空间分配，这是「为什么 flex: 1 能让几个子元素等宽」的关键。

**transition 与 animation 的取舍**：transition 是状态 A 到状态 B 的过渡，需要触发条件（hover、class 变化），只有起点和终点两帧；animation 配合 @keyframes 可以定义多帧、可以循环、可以自动播放、可以设置方向与填充模式。想让元素持续旋转或循环呼吸用 animation，做按钮 hover 变色用 transition。

**长度单位的关键在「相对于谁」**：px 是绝对像素；em 相对于当前元素的 font-size（用在 font-size 上时相对于父元素）；rem 相对于根元素 html 的 font-size；vw/vh 相对于视口宽度/高度的 1%；rpx 是小程序的单位，750rpx 等于屏幕宽度，用于按设计稿等比缩放。rem 和 rpx 的用途都是做移动端适配，区别是 rem 需要配合根字号动态计算，rpx 由小程序运行时自动换算。

**数组方法的分类按「返回值」记最清楚**：返回布尔的是 `some`、`every`、`includes`；返回索引的是 `indexOf`、`lastIndexOf`、`findIndex`；返回元素的是 `find`；返回新数组的是 `map`、`filter`、`slice`、`concat`、`flat`；返回单个值的是 `reduce`；原地修改的是 `forEach`（返回 undefined）、`sort`、`reverse`、`splice`、`push/pop`。`some` 是「有一个满足就 true 并短路」，`every` 是「全部满足才 true，遇到 false 短路」；`findIndex` 支持传函数判断，`indexOf` 只能传值且用的是严格相等（所以找不到 NaN）。

**for...in 与 for...of 的区别是常考点**：`for...in` 遍历的是可枚举属性名（包括原型链上的，所以数组用它拿到的是字符串下标的 "0"、"1"），`for...of` 遍历的是迭代器产出的值，适用于数组、字符串、Map、Set、以及任何实现了 Symbol.iterator 的对象。遍历数组应该用 `for...of` 或 `forEach`，`for...in` 留给对象且要配 `hasOwnProperty` 过滤。

**Promise 的本质是把回调的嵌套变成链式**。三种状态 pending / fulfilled / rejected，一旦落定不可再变；`.then` 返回一个新的 Promise，所以可以链式调用，返回普通值会被包成 resolved，返回 Promise 会被展开；`.catch` 捕获链上任意一环的异常。回调地狱的解法是链式 then，更进一步是 async/await（本质是 Promise 的语法糖，注意 try/catch 才能捕获 await 的异常）。

**HTTP 缓存这组题的核心是分清「强制缓存」与「协商缓存」**。`no-cache` 不是不缓存，而是「可以缓存，但每次使用前必须向服务器验证」——也就是走协商缓存：带上 If-None-Match（对应 Etag）或 If-Modified-Since（对应 Last-Modified），服务器返回 304 就复用本地副本。`no-store` 才是完全不缓存，任何情况下都不写入。Etag 是内容指纹，优先级高于 Last-Modified（后者只到秒级，且文件内容不变但修改时间变了会误判）。班课系统里，HTML 入口适合 no-cache（保证拿到最新的资源引用），带 hash 的静态资源适合长缓存（immutable）。

**三层缓存优化的叙述要落到「按版本、按库拆分」的理由上**：静态资源按内容 hash 命名，内容不变则 URL 不变、可以长期缓存；按库（vendor）拆分是为了让业务代码更新时不会让整个大包失效，用户只需要重新下载变化的那一小块。手写 storage 缓存的问题在于：容量受限（localStorage 一般 5MB）、同步阻塞主线程、没有过期与校验机制、无法利用浏览器和 CDN 的多级缓存，而且和 HTTP 缓存形成两套真相。用浏览器原生缓存的好处是它就在请求链路上，CDN、代理、浏览器各层都能生效。

**事件循环的顺序**：执行一个宏任务（script 整体、setTimeout、setInterval、I/O 回调、UI 事件）→ 把产生的微任务队列全部清空（Promise.then、queueMicrotask、MutationObserver）→ 浏览器渲染（requestAnimationFrame 在渲染前执行）→ 取下一个宏任务。所以「同步代码先跑完，再清空微任务，微任务里产生的微任务也在本轮清掉，然后才渲染」。

**首屏优化怎么用事件循环知识**：关键的首屏数据放在同步流程或最早的那批 Promise 里，非关键的埋点、预取、次要模块的初始化用 `requestIdleCallback` 或 setTimeout 推到后面；避免在首屏渲染前放大的计算任务（会阻塞渲染）；把长任务拆成多个小任务，让浏览器有机会在中间插入渲染。这才是「关键数据优先加载、非关键逻辑延后」的具体落地。

**AI 开发三题考的是工作方法**：生成多套效果都不好，说明问题八成在上下文而不是模型——需求描述是否含歧义、有没有给出既有代码的风格与约束、有没有提供可运行的验证方式。正确做法是先让它产出方案或伪代码供评审，确认方向后再写实现。「反复重写仍达不到预期」时应该停下来换思路：改成自己写核心部分、让 AI 写测试或样板；或者把任务拆小，一次只解决一个问题。AI 生成失败的原因常见于：上下文缺失（它看不到项目里的约定）、依赖版本与 API 过时、需求本身自相矛盾、以及缺少验证手段导致错误一路累积。

**手撕用 reduce 计数**：`arr.reduce((acc, cur) => (acc[cur] = (acc[cur] || 0) + 1, acc), {})`。要注意的是初始值必须给，否则空数组会抛错；键会被转成字符串，如果数组里有对象要自己序列化；另外原型链上的键名（如 `"constructor"`）会踩坑，用 `Object.create(null)` 做累加器可以避免。

**二面全是稳定性问题**。实习经历、能接受的工作强度、上一家的离职时间与原因——这三问是在评估你的预期是否现实、会不会很快又走。回答的核心是给出连贯的理由：为什么离开上一家、为什么选这里、能接受什么样的节奏，三者的逻辑要自洽。

---
title: "智能低碳研究院 前端开发 一面"
company: "智能低碳研究院"
position: "前端开发"
round: "一面"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/79bdc228d689429fbf747fb0f66fbe7c"
tags: ["前端", "Vue", "React", "JavaScript", "事件循环", "Node.js"]
summary: "智能低碳研究院前端开发一面面经：覆盖元素垂直水平居中、Grid 布局、Vue2 与 Vue3 差异、v-model 两版实现、React Hooks 为什么不能在循环/条件里调用、Redis 缓存与数据库一致性、CommonJS 与 ES Module、Node.js 单线程与多线程、事件循环、Express 与 Koa 对比，以及 Skill / MCP / Function Calling 的区别。"
---

### 《面试题目》

1. 自我介绍
2. 元素怎么垂直水平居中？
3. Grid 布局了解吗？
4. Vue2 和 Vue3 有什么区别？
5. v-model 是什么？在 Vue2 和 Vue3 有什么区别？
6. React 里的 hook 为什么不能在循环里使用？
7. Redis 缓存和数据库一致性怎么做？
8. CommonJS 和 ES 有什么区别？
9. Node.js 是单线程的吗？怎么来实现多线程？
10. JS 事件循环
11. Express 和 Koa 有什么区别？
12. 介绍实习做的 Skill
13. Skill、MCP、Function Calling 有什么区别？

### 《参考解析》

**居中与布局**：单行文字用 `line-height` 等于高度；块级元素定宽用 `margin: 0 auto` + 已知高度的定位加负 margin；通用做法是 Flex（`display:flex; justify-content:center; align-items:center`）或 Grid（`place-items:center`）；绝对定位配 `transform: translate(-50%,-50%)` 适合不定宽高。Grid 是二维布局，用 `grid-template-columns/rows`、`fr` 单位、`gap`、`grid-area` 做行列与区域划分，擅长整体页面骨架；Flex 是一维排列，擅长组件内部对齐。两者的选择判据是「要不要同时控制行和列」。

**Vue2 与 Vue3**：响应式从 `Object.defineProperty` 换成 Proxy（能监听新增 / 删除属性和数组下标，不用再 `$set`）；API 从 Options API 增加 Composition API（逻辑按功能聚合、复用靠自定义 hook）；新增 Fragment、Teleport、Suspense；生命周期调整（`beforeDestroy` → `beforeUnmount`，`setup` 取代 `beforeCreate`/`created` 的位置）；性能上做了静态提升、Patch Flag、Tree-shaking 友好（打包体积更小）；TypeScript 支持显著变好。v-model 在 Vue2 是 `value` + `input` 事件的语法糖（自定义组件默认如此，`.sync` 修饰符是另一种双向绑定）；Vue3 改成 `modelValue` + `update:modelValue`，并且支持多个 v-model（`v-model:foo`），`v-model` 作用在原生表单上还会自动按元素类型选 `value` 或 `checked`。

**React Hooks 的规则**：React 内部用链表按调用顺序保存每个 hook 的状态，渲染时靠「第几次调用」来对应状态。如果放在循环或条件里，不同渲染的调用次数和顺序可能变化，状态就会错位（比如 useState 拿到的其实是 useEffect 的槽位）。所以规则是「只能在函数组件顶层调用」，多实例用 key 强制重挂载，条件逻辑放到 hook 内部（比如 `useMemo` 里判断，或提前 return 前必须先调用完所有 hook）。配套的 ESLint 插件 `react-hooks/rules-of-hooks` 就是干这个检查的。

**缓存一致性与模块化**：Redis 与数据库一致性常用「先更新数据库、再删除缓存」（Cache Aside），配合 TTL 兜底和删除失败重试；更严格可以用延迟双删或订阅 binlog（Canal）异步删缓存。查询侧防穿透用空值缓存或布隆过滤器、防击穿用互斥锁 / 逻辑过期、防雪崩用随机过期时间。要诚实地说：除非用分布式事务或串行化，通常只能做到最终一致，关键在于把不一致的窗口控制到业务可接受。CommonJS 与 ES Module 的差别是：CJS 用 `require` / `module.exports`，运行时同步加载、值拷贝、可动态 require，Node 原生支持；ESM 用 `import` / `export`，编译期静态分析、值引用（live binding）、支持 Tree-shaking，浏览器原生但 Node 里需要 `.mjs` 或 `"type":"module"`。两者混用时 CJS 可以 `require` ESM 的兼容形态有限，ESM 里 import CJS 会拿到 default。Node.js 的 JS 执行是单线程的（一个 event loop），但底层 libuv 提供线程池处理文件 IO、DNS、加密等，网络 IO 用 epoll/kqueue 非阻塞；要用多核就上 `cluster` / `worker_threads`（共享内存用 SharedArrayBuffer + Atomics）或直接多进程部署。

**事件循环与框架对比**：浏览器的事件循环是「一个宏任务 → 清空所有微任务 → 渲染 → 下一个宏任务」，微任务（Promise.then、queueMicrotask、MutationObserver）优先于宏任务（setTimeout、事件回调、IO），所以 `setTimeout(0)` 会在同轮所有 Promise 之后执行。Node 的事件循环分阶段（timers、pending callbacks、poll、check(setImmediate)、close），`process.nextTick` 优先于 Promise 微任务。Express 是回调风格、内置路由与中间件线性执行（`next()` 手动传递）、功能全但老；Koa 基于 async/await、中间件是洋葱模型（await next() 前后都能处理）、内核极简靠中间件组合、错误处理用 try/catch 更自然。选型上 Express 生态成熟、Koa 更轻更现代。

**Skill / MCP / Function Calling**：Function Calling 是模型厂商提供的能力——你把函数签名（名字、描述、JSON Schema 参数）传进去，模型判断需要时返回一个结构化的调用请求，执行由你的代码完成。MCP（Model Context Protocol）是一套标准协议，把「工具 / 资源 / 提示」的提供方与使用方解耦，客户端接一个 MCP server 就能拿到它暴露的全部能力，解决的是「每个工具都要为每个模型客户端写一遍适配」的问题。Skill 更上层，是面向任务打包好的能力单元（包含提示词、脚本、参考资料），由主流程按需加载，解决的是「复杂任务怎么组织步骤与上下文」的问题。三者的关系可以概括为：Function Calling 是调用机制，MCP 是接入标准，Skill 是任务编排与知识封装。面试里这么分层回答，比分别背三句定义更能体现理解。

**这一轮的特点**：题目跨度很大——前端、Node、缓存、AI 概念都问，属于小团队「一个人当几个人用」的典型画像。作者反馈面试官环境嘈杂、匆匆结束，体验一般，但题目本身值得作为前端岗的复习清单：Vue/React 差异、事件循环、模块化这三块几乎必问。

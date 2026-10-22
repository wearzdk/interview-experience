---
title: "小红书前端实习一面：跨域、React 性能优化与 JS 异步机制"
company: "小红书"
position: "前端开发实习"
round: "一面"
date: '2026-08'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/9da47149ecee40b1bfe437a56843e0c6
tags: ["小红书", "前端实习", "跨域", "React", "Vue", "TypeScript", "SSR", "JavaScript"]
summary: "小红书前端实习一面，从个人情况聊到跨域与代理方案、Vue 和 React 的使用体感、React 渲染性能优化与 Hooks 原理、TS 类型系统、Cookie 与 SSR，最后是一道统计频次的算法题和 JS 异步演进。"
---

### 《面试题目》

1. 简单了解一下个人情况。
2. 前端怎么解决跨域？Nginx 做代理和 Node 做代理有什么区别？什么是跨域？
3. 说说 Vue 和 React 使用体感上有什么区别？
4. React 代码层面如何做性能优化？
5. `memo`、`useCallback`、`useMemo` 这些 API 为什么能实现性能优化，原理是什么？父组件内部定义函数，用 `useCallback` 包裹传给子组件，子组件没有加 `memo`，父组件更新时子组件会更新吗？
6. TS 中 `type` 和 `interface` 有什么区别？
7. JavaScript 基本数据类型有哪些？
8. 大写 `String` 和 `Object` 是什么关系？原型链相关。
9. Cookie 的 key 可以重复吗？Cookie 的数据是什么样的？
10. 了解 SSR 吗，讲一下你知道的内容。
11. 算法题：输入数组，统计数组每个值出现的次数。
12. JS 相对 C++ 最本质的区别是什么？JS 和 C/C++ 有什么关系？什么是编译型语言、解释型语言？
13. JS 常见的异步编程方式有哪些？Promise、Generator、async/await 之间是什么关系、有什么区别？

### 《参考解析》

**跨域与两种代理**：跨域是浏览器的同源策略限制——协议、域名、端口三者任一不同即为跨源，浏览器会拦截跨源请求的响应读取（请求本身可能已经发出）。解决方式分两类：服务端放开（CORS 响应头、`Access-Control-Allow-Origin` 与预检请求处理）、同源转发（开发环境用 devServer proxy，生产用 Nginx 反向代理）。Nginx 代理和 Node 代理的区别在于「代理发生在哪一层、由谁承担转发成本」：Nginx 是独立的反向代理服务器，基于 C 实现、事件驱动，静态资源与转发都在它这一层完成，性能高、不用额外起进程，适合生产环境；Node 代理（如 `http-proxy-middleware`）跑在应用进程里，好处是能复用前端工程的配置、方便在转发前后改写请求与 cookie、和本地开发调试结合紧密，代价是多一层 JS 运行时开销，生产环境一般不会让它承担大流量转发。

**Vue 与 React 的体感差异**：React 把 UI 当作状态的函数，状态变了就重新执行组件函数，靠虚拟 DOM diff 找出最小更新，控制权和优化手段都交给开发者（`memo`、`useMemo`、依赖数组）；Vue 用响应式系统追踪依赖，模板编译时就能做静态提升和补丁标记，更新粒度更细，开发者写起来更「自动」，但响应式代理也有自己的边界（解构丢失响应性、`ref` 与 `reactive` 的心智负担）。工程体感上，React 生态更大、跨端方案多、TS 支持更自然，适合大型团队和复杂状态；Vue 的上手成本低、模板与样式组织更集中，中小项目和快速迭代更顺手。

**React 性能优化**：先定位再优化，别上来就堆 `memo`。常用手段有：把状态下沉到真正使用它的子组件，避免父组件状态变化导致整棵树重渲染；用 `React.memo` 阻断 props 未变的子组件渲染；用 `useMemo` 缓存昂贵计算结果、用 `useCallback` 稳定函数引用（这两个本身不减少渲染，只是让 `memo` 的比较有意义）；长列表用虚拟滚动；拆分 Context，避免一个大 Context 变化让所有消费者重渲染；用 `startTransition` / `useDeferredValue` 把非紧急更新降级；最后用 React DevTools Profiler 看每次提交的渲染耗时和原因，确认优化真的有效。

**Hooks 的原理与那道追问**：`useMemo` 缓存的是计算结果，`useCallback` 缓存的是函数引用，`memo` 做的是浅比较 props 决定是否跳过渲染。三者配合才有意义：父组件每次渲染都会重新创建函数，如果子组件被 `memo` 包裹，函数引用变化会让浅比较失败，所以要用 `useCallback` 把引用稳定下来。追问的答案是：**子组件没有加 `memo` 时，父组件更新它一定会重新渲染**，`useCallback` 只能保证传给它的函数引用不变，并不能阻止渲染——渲染与否由父组件的更新传播决定，`memo` 才是那道拦截。

**TS 的 type 与 interface**：两者大部分场景可互换。`interface` 专用于描述对象形状，支持声明合并（同名接口自动合并，适合扩展第三方类型），`extends` 继承语义清晰；`type` 是类型别名，能表达联合类型、交叉类型、元组、条件类型、映射类型等 `interface` 做不到的东西，但不能被声明合并。实践上对象形状优先 `interface`，需要组合、联合或工具类型时用 `type`。

**JS 类型与原型链**：基本类型是 `string`、`number`、`boolean`、`null`、`undefined`、`symbol`、`bigint`（`object` 是引用类型）。`String` 是构造函数，`String.prototype` 是字符串包装对象的原型，`String.__proto__ === Function.prototype`；`Object` 位于原型链顶端，`String.prototype.__proto__ === Object.prototype`，再往上 `Object.prototype.__proto__ === null`。所以「大写 String 和 Object 的关系」是：`String` 作为函数继承自 `Function.prototype`，字符串实例的原型链则经过 `String.prototype` 最终到 `Object.prototype`。

**Cookie 的 key 与结构**：同一域名下 Cookie 的 name 可以重复设置，但浏览器按 `domain + path + name` 作为唯一键，后设置的会覆盖先设置的；不同 path 或不同子域下可以存在同名 Cookie，请求时按路径匹配一起发送，服务端读到的可能是多个同名值。Cookie 的结构是键值对加属性：`Name=Value; Domain; Path; Expires/Max-Age; Secure; HttpOnly; SameSite`，单个 Cookie 约 4KB，数量也有上限。

**SSR**：服务端渲染指在服务端执行组件、生成完整 HTML 返回，浏览器拿到就能显示内容，之后再「水合」绑定事件。好处是首屏更快、SEO 友好（爬虫能直接读到内容）；代价是服务端要承担渲染压力、需要处理 Node 环境兼容、水合不一致会报错，且开发时要注意哪些代码只能在浏览器跑。常见形态还有 SSG（构建时生成）和 ISR（增量再生成），选择取决于内容更新频率和个性化程度。

**统计频次**：一次遍历用 `Map` 计数即可，时间复杂度 O(n)、空间 O(k)。`const count = (arr) => { const m = new Map(); for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1); return m; }`。如果元素是对象，要按引用计数，需要业务提供唯一键；如果要按频次排序输出，再对 `m.entries()` 排一次序，注意数值键和字符串键的排序差异。

**JS 与 C++、编译型与解释型**：JS 是动态类型、弱类型、单线程事件循环、基于原型的语言，C++ 是静态类型、手动管理内存（现代 C++ 有 RAII 和智能指针）、编译成机器码、支持多范式；最本质的区别在于「类型检查与执行时机」——C++ 在编译期确定类型并生成机器码，JS 在运行时才确定类型，由引擎（V8）先解释执行、再把热点代码 JIT 编译成机器码。编译型语言在运行前整体翻译成目标代码，执行快但需要针对平台编译；解释型语言边翻译边执行，跨平台好但通常更慢。JS 与 C/C++ 没有语言上的继承关系，只是语法风格借鉴了 C 系，V8 的 JIT 让它在性能上接近编译型语言。

**异步编程的演进**：回调函数是最早的形态，问题是嵌套深、错误处理分散（回调地狱）；Promise 把异步结果变成可链式处理的对象，用 `then/catch/finally` 统一成功与失败路径，解决了控制反转和错误冒泡；Generator 是协程式的写法，`yield` 暂停、`next` 恢复，配合执行器可以写成同步风格，但需要手动驱动；async/await 是 Generator + Promise 的语法糖，用同步写法表达异步流程，`await` 等待 Promise 落定，错误用 `try/catch` 捕获。三者的关系是层层封装：Promise 是基础原语，Generator 提供暂停能力，async/await 把两者结合成最易读的形态。补充一点：async 函数本质上返回 Promise，`await` 之后的代码相当于挂在 `then` 里执行。

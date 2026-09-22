---
title: 字节跳动前端一面校招：大模型缓存与CSS优先级
company: 字节跳动
position: 前端开发
round: 一面
date: '2026-09'
result: 二面已挂
source: 牛客网
tags: ["前端","大模型缓存","Function Calling","MCP","CSS优先级","原型链","事件循环","发布订阅"]
summary: "字节跳动前端校招一面，先自我介绍与实习拷打，随后连续考察大模型上下文缓存、Function Calling与MCP原理，再深入Flex布局、CSS优先级计算、原型链继承、事件循环与Cookie，最后手撕发布订阅模式。"
---

### 《面试题目》

1. 自我介绍 + 实习拷打
2. 一些大模型有缓存机制，说说这些缓存的原理？
3. 比如 DeepSeek 的上下文缓存，什么情况下算是缓存？
4. Function Calling 的原理是什么？
5. 在 Function Calling 中，大模型本身会执行这个方法吗？
6. MCP 是什么？它和 Function Calling 有什么关系？
7. 说说你对 Flex 布局的理解，常用的 Flex 属性有哪些？
8. 如何实现一个 DIV 上下左右都居中？
9. 说说 CSS 优先级的计算规则。
10. 如果有多个 class 作用于同一个元素，哪一个样式会生效？比如它们都设置了 `color`，最终会使用哪个颜色？
11. 如果这些样式都在同一个 CSS 文件中，而且存在多个 class 组合、嵌套选择的情况，都作用于同一个 DIV，怎样判断哪个样式生效？
12. 假设外层元素的 class 是 `parent`，内层元素的 class 是 `children`，文本在内层元素中。前面写了 `.parent .children { color: red; }`，后面写了 `.children { color: blue; }`，最终哪个颜色生效？
13. 你了解 JavaScript 的原型和原型链吗？
14. JavaScript 的 class 如何实现继承？
15. 具体来说，怎样通过原型实现继承？
16. 说说 JavaScript 的事件循环。
17. 宏任务和微任务分别有哪些？
18. Cookie 和 localStorage 有什么区别？
19. Cookie 和 localStorage 分别适用于哪些场景？
20. 为什么 Cookie 适合存储用户身份信息？
21. 每次请求都会携带 Cookie，是吗？
22. 请求携带 Cookie 有哪些限制？访问所有网站都会发送吗？什么情况下不会携带？
23. 你平时使用 Vue 比较多，是吗？Vue 里面的 HTML 能直接渲染到页面上吗？
24. 能具体说说，Vue 中的 HTML 是怎样渲染到页面上的吗？
25. HTML 是怎样变成 DOM 树的？
26. 它是直接生成 DOM 树的吗？
27. Vue 的 `template` 不是页面可以直接使用的 HTML，需要经过什么转换？它先被转换成什么？
28. 第一次转换得到的并不是浏览器的 DOM，那它先转成什么？是不是先转成 JavaScript？
29. 浏览器收到的是 HTML，还是 JavaScript？
30. 你了解声明式编程吗？
31. 能结合具体代码举例，说明哪些属于声明式编程，哪些属于命令式编程吗？
32. 手撕：发布订阅模式

### 《参考解析》

**大模型上下文缓存的原理**：本质是复用 Transformer 推理时的 KV Cache。自回归生成时，每个 token 的注意力需要历史所有 token 的 K/V 向量，如果每次都重算，复杂度随上下文长度平方增长。缓存的做法是把已经算好的每层 K/V 张量按 token 位置存下来，下次遇到相同前缀时直接命中，只对新增 token 做前向计算。工程上有两个层次：单次会话内的 KV Cache（同一次请求里逐 token 生成时复用），以及跨请求的前缀缓存（把系统提示词、固定文档、历史多轮对话这类公共前缀的 KV 常驻显存，多个请求共享）。判定「算不算缓存」的关键是**前缀逐 token 完全一致**——从第一个 token 开始严格匹配，一旦中间有一个 token 不同，后面的缓存全部失效，所以只改末尾的提问能命中，改了系统提示词开头就全废。DeepSeek 的上下文缓存就是按前缀匹配计费的：命中缓存的输入 token 价格远低于未命中部分，因此实践中要把稳定内容（system prompt、few-shot 示例、知识库片段）放在前面，把变化的用户输入放在最后。缓存淘汰通常按最近最少使用（LRU）和显存压力决定，也有按前缀树组织以便部分命中的实现。另外要区分「语义缓存」（把 query 向量化后找相似问题直接返回旧答案，命中靠相似度阈值）和「前缀缓存」，两者不是一回事，回答时点出来是加分项。

**Function Calling 原理，模型会执行方法吗**：不会。模型只负责「决定调用哪个函数、参数是什么」，输出的是结构化的调用意图（`tool_calls`，包含函数名和 JSON 参数），实际的函数执行完全由宿主程序（后端服务或 Agent 框架）完成。完整链路是：请求里带上工具的 JSON Schema 描述（名称、用途、参数类型与必填项）→ 模型判断是否需要调用工具，需要就把 `finish_reason` 置为 `tool_calls` 并返回参数 → 宿主解析参数、做校验和鉴权、真正执行本地函数（查库、调 API）→ 把执行结果作为一条 `role: "tool"` 的消息追加进对话历史，再次请求模型 → 模型基于工具结果生成最终自然语言回答。理解这一点很重要，因为它决定了安全边界：权限、参数白名单、超时和幂等都必须由宿主保证，不能指望模型自我约束；同时工具描述的措辞质量直接决定模型调用准确率。

**MCP 与 Function Calling 的关系**：MCP（Model Context Protocol）是 Anthropic 提出的开放协议，用统一的方式把「模型能用的外部能力」暴露出来。它和 Function Calling 不是替代关系而是分层关系：Function Calling 是模型 API 层面的能力，规定模型怎么表达调用意图；MCP 是集成层面的标准，规定工具/资源/提示词怎么被描述、发现和调用。MCP 定义了 client（宿主，比如 IDE 或 Agent 运行时）和 server（能力提供方，比如数据库、文件系统、内部平台）之间的 JSON-RPC 通道，server 侧暴露三类东西：tools（可执行动作）、resources（可读取的数据）、prompts（预置提示模板）。宿主启动时通过 `tools/list` 拉取所有 server 的工具清单，把它们转换成自己模型的 Function Calling 定义，然后按统一流程调用并回填结果。它解决的问题是 N×M 的适配爆炸：以前每个宿主都要为每个外部系统写一遍工具封装，现在外部系统只要实现一次 MCP server，所有支持 MCP 的宿主都能直接用。

**Flex 布局与居中**：Flex 是一维布局模型，作用在容器上的核心属性有 `display: flex`、`flex-direction`（主轴方向）、`flex-wrap`、`justify-content`（主轴对齐）、`align-items`（交叉轴对齐）、`align-content`（多行时的行间对齐）、`gap`；作用在子项上的有 `flex-grow`/`flex-shrink`/`flex-basis`（简写 `flex`，常用 `flex: 1` 表示 `1 1 0%`）、`align-self`、`order`。要能顺带说清两个高频坑：`flex: 1` 与 `flex: auto` 的区别在基准值是 0 还是内容宽度；以及子项内容超长导致溢出时，需要在子项上设 `min-width: 0`（或 `overflow: hidden`）才能让 `flex-shrink` 生效——这是横向滚动条最常见的原因。居中实现至少给三种：`display: flex; justify-content: center; align-items: center`；绝对定位 + `inset: 0; margin: auto`；绝对定位 + `left: 50%; top: 50%; transform: translate(-50%, -50%)`（不需要知道宽高）。再加一句 `display: grid; place-items: center` 是最简写法。

**CSS 优先级计算**：把它拆成三元组 `(a, b, c)` 比较，不是简单的十进制相加。`a` 是 ID 选择器数量，`b` 是 class、属性选择器、伪类数量，`c` 是元素类型和伪元素数量；通配符 `*`、组合器对优先级没有贡献；行内样式单独一档（高于任何选择器，低于 `!important`）；`!important` 再高一档；继承来的样式优先级最低。比较时从左到右逐位比，前面大的直接胜出，所以 `.a.b.c.d.e.f.g.h.i.j.k` 也压不过一个 `#id`。经典追问 `.parent .children { color: red }` 与 `.children { color: blue }`：前者有两个 class，三元组是 `(0,2,0)`，后者是 `(0,1,0)`，所以红色生效——**和后写的顺序无关**，优先说了算。只有优先级完全相等时，才看源码顺序，后定义的胜出（还要考虑 `@layer` 层叠层和同为 `!important` 时的层序反转）。另外不同来源的顺序是：用户代理样式 < 用户样式 < 作者样式 < 作者 `!important` < 用户 `!important`；`all: unset` 和 Shadow DOM 里的样式隔离是另外两个常见追问方向。

**原型与原型链、class 继承**：每个函数都有 `prototype` 属性指向原型对象，每个对象都有内部 `[[Prototype]]`（可通过 `Object.getPrototypeOf` 或 `__proto__` 访问）。访问属性时先查自身，找不到就沿 `__proto__` 往上找，直到 `Object.prototype`（其 `__proto__` 为 `null`），这条链就是原型链。用原型实现继承的标准三步：`Child.prototype = Object.create(Parent.prototype)`、`Child.prototype.constructor = Child`、在子类构造函数里调用 `Parent.call(this, ...)` 继承实例属性。ES6 的 `class` 是这套机制的语法糖：`extends` 会自动设置原型链并修正 `constructor`，`super()` 等价于调用父类构造函数（必须先于 `this` 使用），`super.method()` 沿 `[[HomeObject]]` 找父类方法。两者有一个实质差异：`class` 声明不会被提升（存在暂时性死区）、内部代码默认严格模式、且必须用 `new` 调用。

**事件循环与宏微任务**：JS 是单线程的，靠事件循环协调。一次循环（tick）的顺序是：执行完当前同步代码 → 清空**微任务**队列（清空过程中新产生的微任务也在本轮一起做完）→ 取一个**宏任务**执行 → 再清空微任务 → 必要时进入渲染（样式计算、布局、绘制）。宏任务包括 `setTimeout`/`setInterval`、`setImmediate`（Node）、I/O 回调、UI 事件回调、`MessageChannel`；微任务包括 `Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`、Node 里的 `process.nextTick`（优先级比 Promise 还高）。常考的坑：`await` 之后的代码相当于包在 `Promise.then` 里，属于微任务；因此一串 `Promise.resolve().then` 会插在所有 `setTimeout` 之前执行完；微任务里无限递归（比如不断 `Promise.resolve().then`）会饿死渲染和宏任务。

**Cookie 与 localStorage、携带规则**：区别按维度列：容量（Cookie 约 4KB，localStorage 通常 5～10MB）、生命周期（Cookie 可设 `Expires`/`Max-Age`，localStorage 永久直到显式删除，sessionStorage 关标签页即清）、是否随请求自动发送（Cookie 会，localStorage 不会）、作用域（Cookie 有 domain/path，localStorage 按源同源隔离）、API（Cookie 要自己拼字符串，localStorage 是同步的键值 API）、以及安全属性（Cookie 支持 `HttpOnly`/`Secure`/`SameSite`，localStorage 完全可被 JS 读取，所以怕 XSS）。所以身份凭证用 Cookie：可以设 `HttpOnly` 防 XSS 窃取、`Secure` 只走 HTTPS、`SameSite=Lax/Strict` 防 CSRF，服务端无状态校验也天然适配。localStorage 适合存不敏感的前端状态：主题、草稿、列表缓存、埋点队列。

Cookie 的携带规则要答准：**不是每次请求都带，也不是访问所有网站都带**。浏览器按「域 + 路径 + 协议 + 端口」匹配，只有请求目标与 Cookie 的 domain/path 匹配且未过期才会带上；跨站请求默认受 `SameSite` 约束——`SameSite=Lax` 时只有顶级导航的 GET 才带，`Strict` 时跨站一律不带，`None` 必须同时设 `Secure`；跨域请求要带 Cookie 必须设置 `withCredentials`（fetch 的 `credentials: 'include'`），且服务端 `Access-Control-Allow-Origin` 不能是通配符、必须允许凭证；`Secure` 的 Cookie 在 HTTP 请求下不会发送；另外请求第三方域的图片、脚本等子资源时会带上**该第三方域**的 Cookie，这正是第三方 Cookie 被用于跨站追踪的原因，也是现在浏览器默认限制它的原因；`document.cookie` 也读不到 `HttpOnly` 的 Cookie。

**Vue 模板到页面的完整链路**：Vue 的 `template` 不是浏览器能直接渲染的 HTML，它要先经过编译。链路是：`template` 字符串 → **编译阶段**用编译器解析成 **AST**（抽象语法树，纯 JS 对象，描述节点类型、属性、指令、插值）→ 做静态提升、补丁标记（PatchFlag）等优化 → 生成 **render 函数**（也就是 JS 代码，产物是 `h()`/`createVNode()` 调用）→ 运行时执行 render 函数得到 **虚拟 DOM（VNode 树）** → 与上一次的 VNode 树做 diff（双端比较或 Vue 3 的编译期优化 + 动态子节点对比）→ 只把差异部分映射成真实 DOM 操作（`createElement`/`setAttribute`/`textContent`）并挂载到页面。所以对「浏览器收到的是 HTML 还是 JavaScript」的回答是：以 SPA 为例，浏览器拿到的是几乎空壳的 HTML 加 JS bundle，DOM 是 JS 执行后动态构建的；只有在 SSR/SSG 场景下浏览器收到的 HTML 里才带着渲染好的 DOM 结构，客户端再 hydration 接管。同时要能讲清浏览器自己那条路：HTML 字节流 → 词法/语法分析（tokenizer → tree construction）边下载边解析 → 生成 DOM 树，遇 `<script>` 阻塞解析、遇 `<link rel=stylesheet>` 阻塞渲染，CSS 解析出 CSSOM 后与 DOM 合成渲染树 → 布局 → 绘制 → 合成。Vue 的 VNode 与浏览器 DOM 是两套结构，中间靠 `patch` 桥接，这就是「它不是直接生成 DOM 树」的准确含义。

**声明式与命令式**：命令式是「怎么做」——逐步给出操作步骤，自己管理状态和 DOM；声明式是「要什么」——描述目标状态，由框架决定怎么达到。例子：命令式 `const el = document.createElement('div'); el.textContent = 'hi'; el.className = 'card'; document.body.appendChild(el);`，声明式 `<div class="card">hi</div>`（或 React 的 `createElement('div', {className:'card'}, 'hi')`）；命令式改文案要 `el.textContent = 'bye'`，声明式只改数据、由 diff 更新。自定义数组过滤也一样：命令式 for 循环 push 到新数组，声明式 `arr.filter(x => x > 0)`。要在结尾给出取舍：声明式可读性和可维护性更好、把复杂度交给运行时，命令式对性能和副作用的控制更直接，所以动画、Canvas、WebGL 这类场景反而更适合命令式；SQL、K8s YAML、Terraform 也都是声明式的典型代表。

**手撕发布订阅**：核心是维护事件名到回调数组的映射，提供 `on`/`once`/`off`/`emit`，`emit` 时要复制一份数组再遍历（防止回调内部调用 `off` 导致遍历错位），并对单个回调的异常做隔离。

```js
class EventBus {
  constructor() { this.events = new Map(); }
  on(type, fn) {
    if (!this.events.has(type)) this.events.set(type, []);
    this.events.get(type).push(fn);
    return () => this.off(type, fn);   // 返回取消订阅函数，便于清理
  }
  once(type, fn) {
    const wrapper = (...args) => { this.off(type, wrapper); fn(...args); };
    return this.on(type, wrapper);
  }
  off(type, fn) {
    const list = this.events.get(type);
    if (!list) return;
    if (!fn) return void this.events.delete(type);
    const i = list.indexOf(fn);
    if (i > -1) list.splice(i, 1);
  }
  emit(type, ...args) {
    const list = this.events.get(type);
    if (!list) return;
    [...list].forEach(fn => {
      try { fn(...args); } catch (e) { console.error(e); }
    });
  }
}
```

写的时候主动说出来：为什么 `emit` 要浅拷贝（`once` 会在回调里改数组）、为什么 `once` 用包装函数而不是给回调挂标记、要不要支持通配符和 `emit` 返回值；如果要求支持最大监听数或异步串行执行，再补 `Promise.all` 版本。这一题面试官主要看边界意识，不是看 API 数量。

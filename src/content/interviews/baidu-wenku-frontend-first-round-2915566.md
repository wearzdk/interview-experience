---
title: "百度文库秋招前端一面：SSR与工程化实践"
company: 百度
position: 前端开发
round: 一面
date: 2026-09
result: 已过
source: 牛客网
tags: ["前端","SSR","webpack","事件循环","性能优化","手写代码"]
summary: "百度文库秋招前端一面面经，9.14面试、已通过。涉及求职动机、番茄小说阅读器排版引擎、SSR原理与对比CSR的弊端、工程化与自动化测试流水线、断点续传、性能优化、webpack的loader与plugin区别，并手写防抖节流与简易Promise。"
---

### 《面试题目》

1. 为什么考虑来百度？为什么不想留在原公司？对比百度和原公司的工作节奏。
2. 番茄小说阅读器排版引擎是怎么实现的？
3. SSR 技术栈与 SSR 原理是什么？SSR 对比 CSR 的弊端有哪些？
4. 工程化建设相关：介绍自动化测试项目、流水线接入环节，测试是否为强卡点？
5. 个人项目的视频来源是什么？断点续传是怎么实现的？
6. 你做过哪些性能优化？
7. webpack 中 plugin 和 loader 的区别是什么？
8. 讲一下对 JS 事件循环的理解，浏览器常见微任务、宏任务有哪些？浏览器与 Node 事件循环有什么区别？
9. 手写代码：防抖、节流，以及手写简易 Promise。

### 《参考解析》

**SSR 原理与对比 CSR 的弊端**：SSR 是在服务端把组件渲染成 HTML 字符串返回，浏览器首屏能立刻拿到有内容的 HTML，随后再下载 JS 做 hydration（注水）把事件绑定与状态接上。典型技术栈是 React 的 `renderToString`/`renderToPipeableStream`（React 18 的 Streaming SSR + Server Components）、Next.js、Vue 的 `renderToString`/Nuxt。它解决的问题是首屏白屏、SEO 抓不到内容、弱网与低端机体验。弊端要说全：一是服务器压力与成本上升，每次请求都要渲染，QPS 高时 CPU 是瓶颈，需要缓存（CDN/页面级/组件级缓存）与降级到 CSR 的兜底；二是 hydration 成本，HTML 已经能看但不可交互，用户点了没反应（TTFB 好但 TTI 差），还有 hydration mismatch 的坑（服务端与客户端渲染结果不一致，常见于 `Date.now()`、随机数、`window` 判断、登录态）；三是架构复杂度，需要 Node 服务、处理 cookie/token 透传、接口在服务端与客户端的双份调用与去重（Next.js 的 `getServerSideProps` / RSC 缓存）、部署与灰度更麻烦；四是并非所有页面都值得 SSR，后台管理类页面做 SSR 收益极低。改善手段包括 Streaming SSR、选择性注水（Selective Hydration）、岛屿架构（Astro）、静态化 + ISR 把 SSR 成本摊到构建期。

**断点续传的实现**：核心是「分片 + 记录进度 + 校验完整性」。客户端把文件切片（如 5MB 一片）并计算每片哈希，上传前先向服务端询问「这个文件 ID 已经有哪几片」（`HEAD`/查询接口返回已上传分片列表，或用秒传接口比对整体哈希），然后只传缺失分片，每片成功后服务端记录状态（Redis/数据库中 `uploadId -> [分片位图]`），全部完成后调合并接口按序拼接并校验整体哈希，服务端返回最终地址。断点续传的关键在于「断点」存在服务端而不是浏览器本地（本地存 `localStorage` 只能应对刷新，换设备就失效），以及分片要能并发上传 + 失败重试（限制并发数，例如 3~4 路，避免打满带宽）。用 HTTP 原生能力也能做：服务端支持 `Accept-Ranges: bytes`，客户端发 `Range: bytes=start-` 并在 206 响应中续写，适合单文件下载/上传的简单场景。要提的坑：分片合并的原子性（合并完成前不能让文件可读）、上传会话过期与清理、秒传必须校验哈希防伪造、大文件在浏览器端计算哈希要用 `Web Worker` 或分片增量哈希（`crypto.subtle` 或 spark-md5）以免卡住主线程。

**性能优化怎么做**：按加载、渲染、运行时三层组织，配指标说话。加载层：资源压缩（gzip/brotli）、图片格式与尺寸优化（WebP/AVIF、`srcset`、懒加载）、代码分割与按需加载（路由级 `import()`）、首屏关键 CSS 内联、字体 `font-display: swap` 与子集化、CDN 与 HTTP 缓存策略（带 hash 强缓存）、HTTP/2 多路复用、预加载（`preload`/`prefetch`/`preconnect`）、SSR/SSG 提升首屏。渲染层：减少重排重绘（批量读写 DOM、用 `transform`/`opacity` 做动画、`will-change` 谨慎使用）、长列表虚拟滚动、避免过深的组件树与同步布局抖动、骨架屏与占位。运行时层：减少主线程长任务（`requestIdleCallback`、Web Worker、时间切片）、事件节流与 `passive` 监听、内存泄漏治理（监听器/定时器/闭包引用及时释放）、缓存计算结果与请求去重。度量上要能报出具体指标：LCP、INP（替代 FID）、CLS、TTFB、FCP，以及怎么测（Lighthouse、Performance 面板、RUM 真实用户监控），优化前后对比数据。面试时挑一个自己真做过的例子讲透，比罗列十条更有说服力。

**webpack 的 loader 与 plugin 区别**:职责与运行位置不同。loader 是「模块转换器」，作用于单个文件，在模块被引入时把源文件内容转成 webpack 能处理的模块，本质是一个 `source => source` 的函数（如 `babel-loader`、`ts-loader`、`css-loader`、`sass-loader`），配置在 `module.rules` 里，可以链式组合（从右到左、从下到上执行，前一个的输出是后一个的输入）。plugin 是「构建流程的扩展」，作用于整个编译生命周期，通过向 compiler 注册钩子（webpack 的 Tapable：`emit`、`afterEmit`、`done`、`optimization` 等）在特定阶段做副作用操作，能力更强（`HtmlWebpackPlugin` 生成 HTML、`MiniCssExtractPlugin` 抽离 CSS、`DefinePlugin` 注入常量、`CopyWebpackPlugin` 拷文件）。一句话记法：loader 管「文件怎么变成模块」，plugin 管「构建过程里还能做什么」。加分点：loader 可以异步（`this.async()`）、可以带 `options` 与 `cacheable`；plugin 要理解 Compiler（全局唯一）与 Compilation（每次构建一份）的区别；以及现代替代方案 Vite 用 ESM + esbuild/Rollup 在开发态免打包、生产态用 Rollup，`plugin` 概念仍在但钩子体系不同。

**事件循环（浏览器与 Node 的区别）**：浏览器一次循环是「执行一个宏任务 → 清空微任务队列 → 渲染（rAF → 样式布局绘制）→ 下一个宏任务」；微任务含 `Promise.then`、`queueMicrotask`、`MutationObserver`，宏任务含 `setTimeout`/`setInterval`、I/O、UI 事件、`MessageChannel`。Node 的循环分六个阶段：timers（`setTimeout`/`setInterval`）→ pending callbacks → idle/prepare → poll（等待 I/O，可能在此阻塞）→ check（`setImmediate`）→ close callbacks，每个阶段之间会清空 `process.nextTick` 队列与 Promise 微任务队列。关键差异有四点：一是 `process.nextTick` 优先级高于 Promise，且在每个阶段切换时都会清空，写递归容易饿死 I/O；二是 `setImmediate` vs `setTimeout(0)` 的顺序在主模块中不确定（受启动耗时影响），但在 I/O 回调里 `setImmediate` 总在前面；三是 Node 11 之后微任务也会在 `setTimeout` 回调之间被执行（以前是一个宏任务队列跑完才清微任务）；四是 Node 没有渲染阶段（没有 rAF），但多了 `setImmediate` 与阶段划分。回答时用一张顺序表说明比背概念更清楚。

**手写防抖、节流**：防抖（debounce）是「停止触发 n 毫秒后才执行」，适合搜索输入、窗口 resize；节流（throttle）是「每 n 毫秒最多执行一次」，适合滚动、拖拽、鼠标移动。带取消、首次立即执行与 `this`/参数透传的完整版本：

```js
function debounce(fn, wait = 300, immediate = false) {
  let timer = null;
  function debounced(...args) {
    if (timer) clearTimeout(timer);
    if (immediate && !timer) fn.apply(this, args);
    timer = setTimeout(() => {
      timer = null;
      if (!immediate) fn.apply(this, args);
    }, wait);
  }
  debounced.cancel = () => { clearTimeout(timer); timer = null; };
  return debounced;
}

function throttle(fn, wait = 300) {
  let last = 0, timer = null;
  return function (...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      // 保证最后一次触发也会执行（尾部调用）
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}
```

面试官常追问的点：防抖的 `immediate` 语义、节流要不要保留最后一次（trailing）、`cancel`/`flush` 方法、多个实例之间不共享定时器（所以定时器要放在闭包里）、以及组件卸载时必须 `cancel` 防内存泄漏。更现代的做法是 `AbortController` 配合取消请求、或用 `requestAnimationFrame` 做「每帧最多一次」的节流。

**手写简易 Promise**：核心是状态机 + 回调队列 + 异步落定。要点：`state`（`pending/fulfilled/rejected`）一旦落定不可变；`then` 返回新的 Promise 以支持链式；回调用 `setTimeout`（微任务模拟）异步执行；`resolve` 的如果是 thenable 要递归展开；`then` 回调返回值要按规则解析（普通值 → 下一个 resolve，抛错 → 下一个 reject）。骨架：

```js
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.handlers = [];
    const settle = (state, value) => {
      if (this.state !== 'pending') return;
      // 简化处理：value 为 thenable 时可递归展开
      this.state = state;
      this.value = value;
      this.handlers.forEach((h) => this._run(h)); 
      this.handlers = [];
    };
    const resolve = (v) => settle('fulfilled', v);
    const reject = (e) => settle('rejected', e);
    try { executor(resolve, reject); } catch (e) { reject(e); }
  }
  _run(handler) {
    const cb = this.state === 'fulfilled' ? handler.onFulfilled : handler.onRejected;
    setTimeout(() => {
      if (typeof cb !== 'function') {
        // 没有对应回调时把状态透传下去
        (this.state === 'fulfilled' ? handler.resolve : handler.reject)(this.value);
        return;
      }
      try { handler.resolve(cb(this.value)); }
      catch (e) { handler.reject(e); }
    }, 0);
  }
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handler = { onFulfilled, onRejected, resolve, reject };
      if (this.state === 'pending') this.handlers.push(handler);
      else this._run(handler);
    });
  }
  catch(onRejected) { return this.then(null, onRejected); }
  static resolve(v) { return v instanceof MyPromise ? v : new MyPromise((r) => r(v)); }
  static reject(e) { return new MyPromise((_, r) => r(e)); }
  static all(list) {
    return new MyPromise((resolve, reject) => {
      const res = []; let count = 0;
      if (!list.length) return resolve(res);
      list.forEach((p, i) => MyPromise.resolve(p).then((v) => {
        res[i] = v;
        if (++count === list.length) resolve(res);
      }, reject));
    });
  }
}
```

写的时候要主动说清简化点：真实规范里 then 的回调是微任务（用 `queueMicrotask` 更贴近）、需要处理 `then` 返回自身导致的循环引用 TypeError、`resolve` 传入 thenable 要按规范递归并只取第一次调用、`Promise.all` 要按索引保序而不是 push。把这些讲出来比写完更重要。

**求职动机与工作节奏对比怎么答**：这类问题没有标准答案，但有安全边界——不要贬低前东家，也不要只说「百度是大厂」。结构可以是：一是我想要的业务/技术方向（文库这类有海量内容与前端复杂度高的场景，能接触到排版、渲染、性能这些我想深做的方向）；二是成长环境（希望有更成熟的工程规范与技术评审、有更强的同事可以对照学习）；三是节奏对比用事实描述而不是评价（原公司偏业务快速交付、迭代短平快；了解到百度这边更强调质量与流程，比如有代码评审、自动化测试与灰度机制），并说明自己能适应（给出例子证明你在高压交付和质量之间都待过）。

---
title: "好大夫前端开发实习一面"
company: "好大夫"
position: "前端开发工程师"
round: "一面"
date: '2026-09'
source: 牛客网
tags: ["前端","JavaScript","Vue","HTTP","构建工具"]
summary: "好大夫前端开发实习一面：覆盖闭包、ES6 新特性、BFC、水平垂直居中、HTTP 版本差异、Vue 生命周期与 Vite/Webpack 区别，还问到 uniapp 与大模型辅助编码的占比。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 介绍一下你的实习和项目经历。
3. 介绍一下闭包。
4. 介绍一下 ES6 的新特性。
5. 讲解一下 BFC。
6. 如何实现水平垂直居中？
7. 讲解一下 HTTP 各个版本的差异。
8. Vue 的生命周期是怎样的？
9. Vite 和 Webpack 有什么区别？
10. 了解 uniapp 吗？
11. 平时怎么开发的？用大模型辅助编码多不多，比例如何？

### 《参考解析》

**闭包**

闭包是函数与其定义时所处词法环境的组合：内层函数引用了外层函数的变量，外层返回之后这些变量依然被引用着，因此不会被回收。它的正面用途是私有变量、函数工厂、防抖节流里保存定时器状态；副作用是变量常驻内存，用得不当会带来内存泄漏。追问一般落在循环里用 var 注册回调为什么都打印同一个值（共享同一个变量对象），以及块级作用域和闭包在 V8 里的实现差异。

**BFC 与水平垂直居中**

BFC（块级格式化上下文）是一个独立的渲染区域，内部的布局不影响外部，触发方式有 overflow 非 visible、float、绝对定位、display 为 flow-root/inline-block/flex 等。它的实际作用主要是三件：包住内部浮动元素（高度塌陷）、阻止与浮动元素重叠、阻止 margin 合并。居中则是另一道送分题，要能说出至少三种：flex 的 justify-content 加 align-items、grid 的 place-items、绝对定位加 transform 负位移（或 margin auto）；再往下追问就是定宽与不定宽、以及 transform 位移为什么不会触发重排。

**HTTP 各版本的差异**

HTTP/1.1 引入了长连接和管道化，但管道化有队头阻塞，实际靠并发多连接绕过；HTTP/2 用二进制分帧、多路复用、头部压缩（HPACK）和服务器推送解决了应用层的队头阻塞，但 TCP 层的丢包仍会拖住所有流；HTTP/3 换到基于 UDP 的 QUIC，把流控和重传下沉到用户态，头部压缩改用 QPACK，还支持连接迁移，因此丢包只影响单条流。回答时最好把「队头阻塞发生在哪一层」这条线索一直带着。

**Vue 生命周期**

以 Vue 3 为例：setup 先执行，随后 beforeMount / mounted，数据变化触发 beforeUpdate / updated，卸载走 beforeUnmount / unmounted，配合 keep-alive 还有 activated / deactivated。要点是讲清「哪些阶段能拿到真实 DOM」（mounted 之后）和「哪些阶段适合清理副作用」（unmounted 里清定时器、解绑事件），组件的父子挂载顺序（父 beforeMount → 子 mounted → 父 mounted）也是常被追问的细节。

**Vite 和 Webpack 的差别**

Webpack 是先把整个依赖图打包再交给浏览器，开发态靠 dev-server 做编译，项目一大冷启动就慢；Vite 开发态直接利用浏览器原生 ESM，按需编译请求到的模块，冷启动几乎与项目规模无关，依赖预构建用 esbuild 完成。生产构建上 Vite 早期用 Rollup（新版可选 Rolldown），Webpack 则靠 loader/plugin 生态和更细的分包控制取胜。追问一般会到 HMR 的实现差异、以及为什么 Vite 在生产环境仍然需要打包（避免大量小请求的瀑布）。


---
title: "10.28 易森动力全栈开发实习一面：Vue3、TS 与工程化"
company: "易森动力"
position: "全栈开发实习"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/9db8f67ebfc24120941cb490194102b1
tags: ["易森动力","全栈","Vue","TypeScript","Vite","微前端","monorepo"]
summary: "易森动力全栈开发实习一面：Vue2/Vue3 区别、ES6 新方法、TS 类型与 interface/type、JS 项目迁移 TS、跨域、Vite 与 Webpack、生命周期、微前端与 monorepo、事件循环。"
---

### 《面试题目》

1. 做一下自我介绍。
2. Vue2 和 Vue3 有什么区别？
3. ES6 有哪些新方法？
4. 数组里的 concat 和 push 有什么区别？
5. TypeScript 有哪些类型？
6. interface 和 type 有什么区别？这两个可以继承吗？
7. 一个 JS 项目怎么迁移成 TS 项目？
8. 介绍跨域。
9. Vite 和 Webpack 有什么区别？
10. Vue 生命周期。
11. 介绍实习。
12. 了解微前端吗？当时项目用的什么微前端？为什么要用？
13. monorepo 有什么好处？
14. 知道异步吗？怎么看代码是不是异步的？
15. 事件循环输出顺序。

### 《参考解析》

**Vue2/Vue3**：响应式从 `Object.defineProperty` 换成 `Proxy`，API 从 Options 换成 Composition，生命周期改名，Vue3 支持 Fragments、Teleport、Suspense，Tree-shaking 更好，性能上编译优化（静态提升、Patch Flag）。

**interface vs type**：interface 只能描述对象/函数形状，可声明合并、可 extends；type 能描述联合、交叉、元组、字面量、条件类型，不能重复声明。两者可以互相继承（interface extends type 需要 type 是对象类型；type 用交叉类型组合 interface）。

**JS 迁移 TS**：先加 `tsconfig` 允许 `allowJs`，从工具函数和 API 层开始加类型，用 `any` 兜底再逐步收紧；给接口定义 DTO，开启 `strict` 后按错误逐个修；用 ESLint 规则禁止新增 `any`；最后把构建切到 ts-loader/esbuild。

**跨域**：浏览器的同源策略限制协议、域名、端口；解法有 CORS（服务端返回 `Access-Control-Allow-Origin`，预检 OPTIONS）、代理（开发环境 devServer proxy、生产 Nginx 反代）、JSONP（只支持 GET，已过时）、postMessage（跨窗口）、WebSocket 不受同源限制。

**Vite vs Webpack**：Vite 开发时用原生 ESM 按需编译，启动快、HMR 快，生产用 Rollup 打包；Webpack 先打包再启动，生态成熟、配置灵活但冷启动慢。Vite 对 CommonJS 依赖需要预构建。

**微前端与 monorepo**：微前端解决「多团队独立开发部署、技术栈异构、渐进迁移」，方案有 qiankun、Module Federation、iframe；代价是样式隔离、通信、依赖重复。monorepo 的好处是代码共享、统一依赖和构建、原子提交；挑战是构建缓存和权限边界（用 pnpm workspace + Turborepo/Nx）。

**异步判断**：看是否返回 Promise、是否用 async/await、是否有回调；事件循环顺序：同步 → 微任务（Promise.then、queueMicrotask）→ 宏任务（setTimeout、I/O）→ 渲染。

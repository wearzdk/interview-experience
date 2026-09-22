---
title: "汇川技术前端实习面试：微前端隔离与工程化"
company: "汇川技术"
position: "前端开发"
date: "2026-09"
source: "牛客网"
tags: ["微前端", "前端工程化", "Vue", "Webpack", "Vite", "SQL优化"]
summary: "9 月 18 日汇川技术前端开发实习面试，题目集中在微前端解决的问题与 JS、样式、沙箱隔离，子包与基座通信，发布订阅和观察者模式的区别，以及 Vue 依赖收集用 WeakMap 的原因和 Webpack 与 Vite 的差异。"
---

### 《面试题目》

1. 平时 AI 工具用得比较多的是哪些？
2. 大学里学了哪些课程？
3. 微前端解决了哪些问题？
4. 微前端怎么做 JS 隔离、样式隔离和沙箱隔离？
5. 微前端里的子包和基座怎么通信？
6. 发布订阅和观察者模式有什么区别？
7. 怎么做 SQL 优化？
8. 为什么 Vue 收集依赖用的是 WeakMap？
9. Webpack 和 Vite 有什么区别？
10. subagent 之间怎么通信？
11. 介绍一下实习的开发流程？
12. 自我介绍，讲一下项目经历，介绍一下实习和项目。

### 《参考解析》

**微前端解决什么问题**

核心是让多个团队、多套技术栈的应用能拼成一个前台：老系统可以按路由逐个替换而不是整体重写；各子应用独立开发、独立部署、独立发版，构建产物互不干扰；同时保持单页应用的路由和用户体验。常见实现有 qiankun、single-spa、Module Federation、iframe。

**JS、样式、沙箱怎么隔离**

JS 隔离主流两条路线。单实例场景用快照沙箱：子应用启动时记下 window 上的属性快照，卸载时回滚新增和修改的键。多实例场景用 Proxy 沙箱：给子应用包一个 fakeWindow，所有 window 读写都落在代理对象上，再配合 `with` 把作用域链指过去；对 document、定时器、事件监听也要打补丁，卸载时统一清理。

样式隔离三种做法：Shadow DOM 是真隔离，但弹窗挂载点、第三方 UI 库、事件穿透容易出问题；加前缀是运行时给子应用样式选择器批量加命名空间，或构建期用 CSS Modules、scoped；再就是团队约定 BEM 前缀，关闭全局样式注入。沙箱还包括资源隔离（定时器、事件、CSS）和运行环境隔离（路由、状态、请求前缀），判断标准是「卸载后不留痕」。

**子包与基座通信**

props 透传最简单：基座把方法和状态通过 props 给子应用，子应用也能回调基座。多子应用共享状态用 qiankun 的 `initGlobalState` 加 `onGlobalStateChange`。此外还有自定义事件（CustomEvent、EventBus）、共享状态库（Pinia/Redux 实例注入）、以及 URL 参数。选型上低频单向下发用 props，跨多个子应用双向同步用全局状态，避免子应用之间直接 import 彼此模块。

**发布订阅与观察者模式**

观察者模式里 Subject 自己维护 Observer 列表并调用 `update`，双方互相知道，通常是同步紧耦合。发布订阅在中间加了一个 EventBus 或调度中心，发布者和订阅者只认事件名，彼此不认识，因此能多对多、能异步、能做事件过滤和优先级。前端里 `addEventListener`、Vue 的依赖 dep 属于观察者，EventEmitter、mitt、消息队列属于发布订阅。

**为什么 Vue 用 WeakMap 收集依赖**

Vue 3 的依赖结构是 `WeakMap<target, Map<key, Set<effect>>>`，Vue 2 则是把 Dep 实例挂在 `defineProperty` 的闭包里。外层用 WeakMap 是为了让 target 只被弱引用：响应式对象不再被使用时，整张依赖表可以跟着被 GC 回收；换成 Map 的话，只要依赖表还在，废弃的对象就永远回收不掉，长列表、频繁创建销毁对象、SSR 这类场景会明显泄漏。内层用 Map 是因为 key 是字符串或 Symbol；最内层用 Set 保证同一个 effect 不会被重复收集。

**Webpack 与 Vite 的区别**

开发阶段 Webpack 先打包成 bundle 再起 devServer，模块越多冷启动越慢，HMR 要沿依赖图重新构建。Vite 直接用浏览器原生 ESM 按需请求，配合 esbuild 预构建第三方依赖（CommonJS 转 ESM 并合并，减少请求数），冷启动基本与项目规模无关，HMR 只让失效模块沿 import 链向上冒泡。生产构建 Vite 走 Rollup，Webpack 生态更成熟（loader/plugin 丰富、Module Federation、对老浏览器和特殊资源支持更好）。代价是 Vite 开发态请求数多、首次预构建有开销。

**SQL 优化**

先用 `EXPLAIN` 看执行计划，确认是否走索引、type 是不是 ALL、有没有 Using filesort 和 Using temporary。索引侧注意最左前缀、区分度、覆盖索引，别在索引列上做函数或隐式类型转换，`like '%x'` 用不上索引。语句侧避免 `select *`、大事务、深分页（用延迟关联或游标），join 让小表驱动大表，`or` 尽量改 `union all`。表结构上控制字段长度、选择合适类型与字符集，热点表考虑冷热分离和归档。

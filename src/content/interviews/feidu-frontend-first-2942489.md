---
title: "北京飞渡科技前端一面：React Fiber、HOC 与从输入 URL 到页面"
company: 北京飞渡科技
position: 前端开发
round: 一面
date: '2026-11'
collectedAt: '2026-11-19'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/9e9c6555574348cdaa5277402f684cd9
tags: ["北京飞渡科技","前端","React","Vue","TypeScript","浏览器"]
summary: "北京飞渡科技前端一面（11.10，30 分钟，腾讯会议），以八股为主、几乎不问项目：自我介绍与两段实习离职原因、实习里的 Skill 内容，然后集中问 React（Fiber、Hooks、HOC、组件通信）、Vue（自定义指令、路由守卫）、浏览器从输入网址到出内容的过程、TypeScript 是什么，最后反问业务、AI 额度与学习建议。"
---

### 《面试题目》

1. 自我介绍。
2. 两段实习经历与离职原因。
3. 实习中的 Skill 实际内容是什么？
4. React Fiber 架构是什么？
5. React 常见 Hooks 有哪些？
6. React 高阶组件（HOC）是什么？
7. React 组件间的通信方式有哪些？
8. Vue 中的自定义指令怎么用？
9. Vue 的路由导航守卫是什么？
10. Vue 有哪些路由守卫？
11. 打开浏览器输入网址到有内容出来的过程是怎样的？
12. 讲解 TypeScript 是什么、有什么。
13. 反问：业务、AI 额度、学习建议。

### 《参考解析》

**React Fiber**：Fiber 是把渲染工作拆成可中断单元的重构。每个 Fiber 节点保存组件类型、props/state、对应的 DOM、父子与兄弟指针以及优先级；渲染分协调（reconcile，可被打断，计算要变更的节点）与提交（commit，不可打断，一次把变更写到 DOM）两阶段。可中断让高优先级更新（输入、动画）能插队，避免长任务阻塞主线程；这也是并发特性（Suspense、transition）的基础。

**常见 Hooks**：`useState` 管状态、`useEffect` 处理副作用（依赖数组控制执行时机、返回清理函数）、`useMemo` / `useCallback` 做缓存、`useRef` 存不触发渲染的可变值或 DOM 引用、`useContext` 跨层取上下文、`useReducer` 管理复杂状态、`useLayoutEffect` 在浏览器绘制前同步执行。

**高阶组件**：接收组件返回新组件的函数，用于复用逻辑（鉴权、埋点、权限、loading 包裹）。约定透传不相关的 props、设置 `displayName`、避免在 render 里创建 HOC（每次都是新组件类型会导致子树重挂载）。现代代码更多用 Hooks 或 render props 替代，但 HOC 在类组件与横切逻辑上仍常见。

**组件通信**：父传子用 props；子传父用回调；兄弟提升状态到共同父级；跨层用 Context；全局状态用 zustand/Redux；非父子关系还可通过事件总线或 ref 暴露方法。选择依据是数据的影响范围与更新频率。

**Vue 路由守卫**：全局的 `beforeEach`、`beforeResolve`、`afterEach`；路由独享的 `beforeEnter`；组件内的 `beforeRouteEnter`（此时拿不到 this，需在 next 回调里访问实例）、`beforeRouteUpdate`、`beforeRouteLeave`。导航守卫常用于登录校验、权限判断、离开前未保存提示。

**输入 URL 到页面**：URL 解析 → 查缓存 → DNS 解析 → TCP 连接（HTTPS 再加 TLS 握手）→ 发 HTTP 请求 → 服务端返回 HTML → 解析 HTML 构建 DOM、加载 CSS 构建 CSSOM、执行脚本 → 生成渲染树 → 布局 → 绘制 → 合成上屏。中间还有重定向、CDN 就近接入、HTTP 缓存协商等因素。

**TypeScript**：JavaScript 的超集，增加静态类型系统，编译期检查类型错误，运行时类型被擦除。能力包括接口与类型别名、泛型、联合与交叉类型、类型收窄、枚举、装饰器、模块化；工具链上提供补全、重构与跳转，配合 `strict` 能在编译期拦下大量空值与拼写错误。

---
title: "挖财前端一面：Vue2/3 与 React 差异、定时器与长列表"
company: "挖财"
position: "前端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/24f68248fad34cf7bf47f70a7976bb45
tags: ["挖财","前端","Vue","React","Hooks","定时器","长列表"]
summary: "挖财前端一面不问简历只挑技术栈：Vue2/Vue3/React 的区别、生命周期、Hook 封装、定时器与清除、100 条商品列表的渲染与中间插入数据，以及 Vibe Coding。"
---

### 《面试题目》

1. Vue2、Vue3、React 有什么区别？
2. Vue2 和 Vue3 的生命周期有什么不同？
3. React 你用 Hook 封装吗？用过或封装过什么 Hook？
4. 定时器有哪些？清除定时器怎么做？
5. 给你 100 个商品列表，你怎么做？中间又插入数据怎么办？
6. 平时 Vibe Coding 多吗？

### 《参考解析》

**Vue2 / Vue3 / React 的差异**：Vue2 用 Options API + `Object.defineProperty` 做响应式，Vue3 用 Composition API + Proxy，后者能监听新增/删除属性和数组索引，逻辑可以按功能组织；Vue 是模板 + 双向绑定，React 是 JSX + 单向数据流，靠 setState 触发重渲染。React 的函数组件每次渲染都会重新执行，所以要用 `useMemo`/`useCallback` 控制引用；Vue3 的 `setup` 只执行一次，依赖收集更细。

**生命周期**：Vue2 是 beforeCreate/created/beforeMount/mounted/beforeUpdate/updated/beforeDestroy/destroyed；Vue3 对应 setup、onBeforeMount、onMounted、onBeforeUpdate、onUpdated、onBeforeUnmount、onUnmounted，`beforeDestroy` 改名为 `beforeUnmount`。`keep-alive` 场景还有 activated/deactivated。

**定时器**：`setTimeout` 只执行一次，`setInterval` 周期执行，`requestAnimationFrame` 跟随屏幕刷新，适合动画；Node 里还有 `setImmediate`。清除要保存返回的 id：`clearTimeout(id)` / `clearInterval(id)`；组件卸载时必须在 `onUnmounted` / `useEffect` 的清理函数里清掉，否则会内存泄漏和重复执行。

**100 条商品列表与中间插入**：100 条直接渲染问题不大，关键是「插入数据后不要全量重渲染」。给每条数据稳定唯一的 key；如果插入频繁或列表会变长，用虚拟列表只渲染可视区；插入时按顺序维护数组，避免用 index 当 key 导致状态错位；如果数据来自分页接口，用「游标/时间戳」而不是 offset，防止插入后重复或漏项。

**Vibe Coding**：说清怎么给上下文（技术栈、目录结构、约束、示例）、怎么小步验证（先让它改一个文件、跑类型检查和测试）、怎么 Review（重点看边界和依赖版本）。

---
title: "索菲亚前端线下技术面：从浏览器缓存问到 Vue 与 Git"
company: "索菲亚"
position: "前端开发"
round: "技术面"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/6c746eda98234026a392ecef87337c43
tags: ["索菲亚","前端","Vue","浏览器缓存","CSS","闭包","TypeScript","Git"]
summary: "索菲亚线下前端技术面（约 30 分钟，两位面试官）：离职动机、H5 与原生模块、图片懒加载、浏览器缓存与 sessionStorage/localStorage 差异、CSS 盒模型与选择器权重、闭包、数组去重、Vue 解析富文本、TS 基础类型、SFC 结构与 scoped、生命周期与取数时机、表单到表格的数据流转、Git 常用命令与 fetch/pull 的区别。"
---

### 《面试题目》

1. 自我介绍。
2. 为什么不在字节？
3. 原生模块与 H5 的交互了解多少？
4. 用过图片懒加载吗？
5. 浏览器缓存了解吗？
6. 用 sessionStorage 的话，`window.open` 打开的新会话里会有缓存吗？
7. 那 localStorage 呢？两者有什么区别？
8. 了解 CSS 盒模型吗？
9. CSS 选择器的权重怎么算？
10. 用过闭包吗？
11. 数组去重怎么做？
12. Vue 是怎么解析富文本的？包括图片和文本。
13. TypeScript 的基本类型有哪些？
14. Vue 文件有哪些模块？`scoped` 是什么意思？`setup` 语法糖呢？
15. Vue 的生命周期？想请求数据应该放在哪个钩子？
16. 给你一个表单：点开详情页修改，最后在表格里更新数据，你怎么做？纯前端怎么做？
17. Git 的常见命令有哪些？`git fetch` 和 `git pull` 的区别？
18. 为什么从汇量离职？
19. 你的开源项目经历是什么情况？
20. 你喜欢什么类型的公司、什么类型的团队？
21. 在字节学习到的感受是什么？
22. 你有什么想问的？（作者反问业务与 AI 报销情况）

### 《参考解析》

这场是典型的「前端八股盛宴」，题目密度高但深度不算深，考的是基础是否成体系。缓存三连要一次讲透：浏览器缓存分强缓存（`Cache-Control`、`Expires`）和协商缓存（`ETag`/`Last-Modified`，命中回 304）；`sessionStorage` 的生命周期是标签页，`window.open` 打开的新标签页拿不到原页面的 sessionStorage（除非是通过 `noopener` 之外的同源 opener 关系显式复制，默认不共享）；`localStorage` 按源共享、长期有效，所以新窗口能读到。两者的差别是「生命周期 + 作用域」，不是容量。

CSS 部分：盒模型区分 `content-box` 与 `border-box`（宽度是否含 padding 与 border）。选择器权重按 (行内, ID, 类/属性/伪类, 元素/伪元素) 四元组比较，`!important` 单独一档，权重相同则后写的覆盖前面的，继承来的样式不参与竞争。

闭包要讲到「函数持有外层作用域引用导致变量不被回收」，用途是私有状态、柯里化、防抖节流里的定时器句柄；代价是内存占用和潜在泄漏，解法是及时解除引用。数组去重按场景答：基本类型用 `[...new Set(arr)]`；对象数组按某个 key 去重（Map 或 `reduce`）；需要考虑 `NaN`、`-0` 这些边界时说明 `Set` 用的是 SameValueZero 比较。

Vue 那几题：富文本如果用 `v-html` 渲染，内容是字符串交给浏览器解析，图片与文本按 HTML 处理，注意 XSS 风险（要过滤或走可信源）；TS 基础类型是 `string`/`number`/`boolean`/`null`/`undefined`/`symbol`/`bigint` 加 `any`/`unknown`/`never`/`void`/数组/元组/枚举/字面量；SFC 的三块是 `<template>`、`<script>`、`<style>`，`scoped` 通过给元素加唯一属性并把选择器改写为属性选择器实现样式隔离，`setup` 语法糖省去 `return` 并在编译期暴露顶层绑定。取数时机：`created` 能拿到 data 但没挂载、`mounted` 有 DOM 可用；Vue 3 的 `setup` 里直接用 `onMounted` 或顶层 await（配合 Suspense），SSR 场景则要放在 `onServerPrefetch`。

表单改完回表格的题是想听数据流：状态提升到一个父级（列表数据由父组件持有，详情页通过 props 拿 id、通过 emit 或路由回传提交结果），提交成功后本地更新那一行或用 key 触发刷新；纯前端就是没有后端，把数据存在内存或 localStorage，用同一份状态源驱动详情与表格，避免两处各自维护导致不一致。

`git fetch` 只把远端更新拉到本地远程跟踪分支，不改工作区；`git pull` 等于 fetch + merge（或 rebase），会直接改动当前分支。这个差别答清楚，说明你真的在用而不是背命令。

后面的动机题（为什么离开字节、为什么离开汇量、喜欢什么样的团队）其实是稳定性与匹配度考察。答法一致：说清你在上一段收获了什么、现在想要什么、为什么这家能给，避免评价前公司。作者最后挂了，复盘点是自己觉得「全是八股」，但这类公司往往就是靠八股筛人——把八股答得又准又有取舍，才是能过的那一档。

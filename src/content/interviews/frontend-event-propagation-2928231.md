---
title: "前端面试把 event.stopPropagation 答成页面增强：一次真实的临场翻车"
company: "某公司"
position: "前端开发"
round: "一面"
date: "2026-10"
result: "等待结果"
source: "牛客网"
tags: ["前端","DOM事件","事件冒泡","stopPropagation","面试复盘"]
summary: "一篇前端面试翻车记录：面试官问 event.stopPropagation() 的作用和参数，候选人把 propagation 误看成 page 相关词，临场编了一套性能优化回答。"
---

### 《面试题目》

1. 请介绍一下你的项目经历。
2. `event.stopPropagation()` 是做什么的？它有哪些参数？

### 《参考解析》

**`stopPropagation()` 只做一件事：阻止事件继续沿 DOM 树传播。** DOM 事件流分捕获、目标、冒泡三个阶段，调用它之后，当前节点上的监听器还会执行完，但事件不会再往父节点或子节点传播。它没有业务参数；老式 IE 的 `window.event.cancelBubble = true` 是同类能力的早期写法。很多人会把它和 `preventDefault()` 搞混：后者阻止的是浏览器默认行为，比如链接跳转、表单提交，和事件传播是两条独立的线。若想连当前节点上后续注册的监听器也一起拦掉，要用 `stopImmediatePropagation()`。

**React 里的合成事件容易让人误判。** React 17 之前把事件委托到 document，17 之后委托到根容器，`e.stopPropagation()` 在合成事件系统里仍然能阻止 React 事件冒泡，但它和原生监听器的交互要看绑定位置和时机：在根容器之外挂的原生监听器，可能在 React 处理之前就已经收到事件。回答时先讲原生 DOM 模型，再补 React 的差异，顺序会很清楚。

**这场面试真正值得复盘的不是知识点，而是“不会时怎么处理”。** 把 `propagation` 拆成 `pro + page + tion` 去猜词义，再沿着“页面增强、GPU 加速、CPU 降频”一路编，面试官很容易听出来。更稳妥的做法是先承认“这个 API 我记不清了”，再把自己确定的部分说出来：事件流、冒泡、阻止传播和阻止默认行为的区别；如果确实没印象，就明确说没用到过，别用想象补细节。面试官更愿意接受“不会但知道边界”，而不是一套听起来很流畅、实际上全错的答案。

---
title: "上海城建全栈一面：JS 数据类型、Vue 生命周期与 RAG、Agent 的设计"
company: 上海城建
position: 全栈开发
round: 一面
date: '2026-11'
collectedAt: '2026-11-18'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/ed3ceacf4e36436896b5f346ff9bbb5b
tags: ["上海城建","全栈","JavaScript","Vue","RAG","Agent","AI 编程"]
summary: "上海城建全栈岗一面，问题集中在基础与 AI 使用：JavaScript 的基本数据类型、Vue 的生命周期以及在哪个生命周期里写代码、平时怎么和 AI 协作写代码、用的哪个 AI 工具，接着问 RAG 与 Agent 各自怎么设计、学习能力如何、能否快速接手项目，最后是反问与对前端行情的看法。"
---

### 《面试题目》

1. 做一下自我介绍。
2. JavaScript 有哪些基本数据类型？
3. 讲一下 Vue 的生命周期。
4. 代码一般写在哪个生命周期里？
5. 平时怎么写代码，怎么和 AI 沟通？
6. 用的什么 AI 写代码？
7. RAG 和 Agent 分别是怎么设计的？
8. 学习能力如何？
9. 是否能快速接手项目？
10. 反问：前端行情怎么样？

### 《参考解析》

**JavaScript 的数据类型**：分原始类型与引用类型。原始类型有 `string`、`number`、`boolean`、`undefined`、`null`、`symbol`、`bigint` 七种，值本身不可变，赋值与传参都是复制值，比较用 `===` 按值判断。引用类型是 `object`，包括普通对象、数组、函数、`Date`、`Map`、`Set` 等，变量保存的是引用，赋值是复制引用。由此派生出两个常被追问的点：`typeof null` 返回 `"object"` 是历史遗留缺陷；`NaN` 属于 `number` 且不等于自身，判断要用 `Number.isNaN`。深浅拷贝的差异也源于这一区分，浅拷贝只复制第一层的值，嵌套对象仍共享引用。

**Vue 的生命周期**：以 Vue 3 的组合式 API 为例，`setup` 阶段执行组件逻辑，此时组件实例已创建但尚未挂载，`onBeforeMount` 在挂载前调用，`onMounted` 在 DOM 插入后调用，`onBeforeUpdate` 与 `onUpdated` 包住响应式数据引起的重渲染，`onBeforeUnmount` 与 `onUnmounted` 在卸载前后调用。选项式 API 里对应 `beforeCreate`、`created`、`beforeMount`、`mounted`、`beforeUpdate`、`updated`、`beforeUnmount`、`unmounted`，另外 `keep-alive` 场景多出 `activated` 与 `deactivated`。

**代码写在哪个生命周期**：依赖 DOM 的操作必须放在 `mounted` 之后，例如测量元素尺寸、初始化图表、绑定第三方库；数据请求在 `mounted` 里发起最常见，因为此时可以访问 DOM 并按需展示加载态，但在服务端渲染场景下 `mounted` 不会执行，首屏数据要在 `setup` 或框架提供的数据获取钩子里完成。需要在卸载时清理的资源（定时器、事件监听、WebSocket、图表实例）必须成对写在 `unmounted` 里，否则会造成内存泄漏。`updated` 里不要再改状态，容易形成循环更新。

**RAG 与 Agent 的设计差异**：RAG 的链路是确定的四段——文档切分与向量化入库、按用户问题检索、把检索结果拼进提示词、模型基于上下文作答。设计重点是切分粒度、召回与重排策略、上下文预算，以及答案必须带出处。Agent 的核心是让模型在循环里决定下一步动作：给定工具集与目标，模型输出工具调用，运行时执行并把结果回灌，直到满足终止条件。设计重点是工具描述是否准确、循环的终止与失败处理、状态如何跨轮保存、以及副作用的幂等与审批。两者可以组合：Agent 在需要事实时调用检索工具，把 RAG 当作其中一个能力。

**怎么和 AI 协作写代码**：回答时给具体流程比给态度更有用：先自己把需求和边界写清楚，让 AI 产出方案或骨架，再人工审查关键路径（数据流、错误处理、并发与权限），最后用小步提交与测试兜底。说明哪些环节交给 AI（样板代码、单测、重构、查文档），哪些必须自己做（架构决策、涉及资金与权限的逻辑、线上问题定位）。如果用过具体工具，说明在什么任务上效果好、什么地方它会给出看似正确但跑不通的代码。

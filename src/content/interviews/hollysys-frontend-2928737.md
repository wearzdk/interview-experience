---
title: "和利时前端校招一面：ES6、Promise 与 Map/Set 考点"
company: "和利时"
position: "前端开发"
round: "一面"
date: '2026-10'
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/b791939671494e449489e1bd2714c622"
tags: ["和利时", "前端开发", "校招", "ES6", "Promise", "箭头函数", "Map与Set"]
summary: "和利时 2026 年 10 月校招前端开发一面面经，面试约 30 分钟，围绕自我介绍、项目与开源经历，以及 ES6 新特性、Promise、箭头函数、Map 与 Set 等基础考点展开。"
---

### 《面试题目》

1. 自我介绍。
2. 介绍一下你的项目。
3. 聊聊你的开源经历。
4. ES6 中有哪些新特性、新语法？
5. 讲讲 Promise。
6. 箭头函数有什么特点？
7. Map 与 Set 有什么区别，分别在什么场景下使用？

### 《参考解析》

**ES6 新特性**：可从「声明、函数、数据、异步、模块」分类说。`let` / `const` 有块级作用域和暂时性死区；箭头函数固定词法 `this`；模板字符串支持插值；解构赋值、默认参数、剩余与展开运算符简化取值传参；`class` 提供面向对象写法；新增 `Map` / `Set`、`Symbol`、迭代器与 `for...of`；`Promise` 改善异步流程；`import` / `export` 是语言级模块。每类举一个小例子更稳。

**Promise**：封装异步结果，状态有 `pending`、`fulfilled`、`rejected`，改变后不可逆。`then` 注册成功回调，`catch` 捕获失败，`finally` 都会执行；链式调用每次返回新 Promise，前一步返回值传给下一个 `then`，错误沿链冒泡。`all` 要全部成功，`allSettled` 等全部结束，`race` 取最先落定，`any` 取最先成功；回调在微任务中执行。

**箭头函数**：没有自己的 `this`，定义时按词法作用域取外层，适合做回调；没有 `prototype`，不能 `new`；没有自己的 `arguments`，用剩余参数代替；也没有 `super`，不能作生成器；`call` / `apply` / `bind` 改不了它的 `this`。

**Map 与 Set**：`Map` 是键值集合，键可为任意类型，按插入顺序迭代，常用 `set` / `get` / `has` / `delete`，用 `size` 取数量；普通对象的键只能是字符串或 Symbol。`Set` 值唯一，常用于数组去重和存在性判断，交并差可配合展开运算符与 `filter`。`WeakMap` / `WeakSet` 是弱引用、键必须是对象且不可遍历，适合缓存。

**项目与开源经历**：按「背景—职责—难点—结果」讲，突出自己动手的部分和取舍理由，结果尽量量化。开源经历要说清贡献的仓库、解决的问题、PR 的讨论与修改；被追问细节时能落到具体代码。

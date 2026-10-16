---
title: "MetaAPP 前端开发 AI 面试：箭头函数、new 与内存回收"
company: "MetaAPP"
position: "前端开发"
round: "AI面试"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/4e92a9e1204d484096a0ceffcc0c82fa
tags: ["MetaAPP","前端开发","AI面试","箭头函数","事件委托","内存泄漏","垃圾回收","JavaScript"]
summary: "MetaAPP 前端开发 AI 面试复盘（10 月 16 日 13:00）：先来 11 道八股，原帖只记下其中几道——箭头函数与普通函数的区别、new 的过程与为什么箭头函数不能被 new、bind/apply/call、事件委托、事件冒泡、addEventListener 的参数、内存泄漏、循环引用会不会导致内存泄漏、垃圾回收算法；之后还有 4 道学习交际类问题，最后是一批性格测评题。"
---

### 《面试题目》

1. 自我介绍。
2. ES6 里的箭头函数和普通函数有什么区别？
3. new 的过程是什么？为什么箭头函数不能被 new？
4. bind、apply、call 有什么区别？
5. 事件委托是什么？
6. 事件冒泡是什么？
7. addEventListener 有几个参数？
8. 内存泄漏是什么？
9. 循环引用是什么？会不会导致内存泄漏？
10. 垃圾回收算法有哪些？

### 《参考解析》

**箭头函数与普通函数，从 this、arguments、构造、原型四点答。** 箭头函数没有自己的 `this`，它按定义位置的词法作用域捕获外层 `this`，`call`/`apply`/`bind` 都改不动；它也没有 `arguments`（要用 rest 参数）、没有 `prototype`、不能 `new`、不能做 generator、不能在需要动态 `this` 的地方当方法用（对象字面量里的方法、类的方法、需要事件里 `this` 指向元素的回调）。普通函数的 `this` 由调用方式决定，四种绑定优先级是 `new` > 显式（call/apply/bind）> 隐式（obj.fn()）> 默认（严格模式 `undefined`，非严格是全局对象），箭头函数则跳过这套规则。使用边界也可以点一句：回调、工具函数、需要保留外层 `this` 的场景用箭头函数；需要 `arguments`、需要被 `new`、需要动态 `this` 的场景用普通函数。

**new 的过程与「箭头函数不能被 new」的根因。** `new F()` 做四件事：创建一个新对象并把它的原型指向 `F.prototype`；把 `this` 绑定到这个新对象并执行函数体；函数返回对象则返回该对象，返回原始值则忽略、返回新对象；全程可用 `new.target` 判断是否被 `new` 调用。箭头函数没有构造能力（没有 `[[Construct]]` 内部方法和 `prototype` 属性），`new` 一个箭头函数会直接抛 `TypeError: ... is not a constructor`；同理 `class` 声明的方法也不能 `new`。常被顺带问到的相关点：`instanceof` 检查的是原型链上有没有 `F.prototype`，所以箭头函数不能做 `instanceof` 的右操作数；`Object.create(proto)` 常用来手写继承；`new` 与工厂函数在返回值和原型行为上的区别。

**bind / apply / call，和事件冒泡、事件委托、addEventListener 的参数。** `call` 与 `apply` 都是立即执行、只差参数形式（逐个 vs 数组或类数组），`bind` 返回一个新函数并永久绑定 `this`（还能预置参数实现偏函数），绑定后再 `call`/`apply` 也改不掉。手写 `bind` 的要点：返回函数、用 `apply` 调用原函数、注意返回函数被 `new` 时 `this` 应指向实例（做原型链 `Object.create(fn.prototype)`）。事件流是「捕获 → 目标 → 冒泡」三段：冒泡是事件从目标节点向上传播到 `document`/`window`；事件委托就是利用冒泡，把监听器挂在父元素上，用 `event.target`（配合 `closest`）判断来源，好处是监听器数量少、动态增删的子元素天然生效，坑是 `stopPropagation` 会打断委托、`target` 可能是子节点、`focus`/`blur` 这类不冒泡的事件不能用（改用 `focusin`/`focusout` 或在捕获阶段监听）。`addEventListener(type, listener, options)` 的第三个参数是对象（`capture`、`once`、`passive`、`signal`），老写法是布尔值 `capture`；`passive: true` 对滚动性能很重要（告诉浏览器不会 `preventDefault`），`once` 自动移除，`removeEventListener` 必须传同一个函数引用且 `capture` 值一致，否则摘不掉。

**内存泄漏、循环引用与垃圾回收。** 现代浏览器用「可达性」判定垃圾：从根（全局对象、当前调用栈、闭包环境等）出发能引用到就保留，因此**循环引用本身不会泄漏**——只要整组对象都不可达，标记清除照样回收它；真正会因循环引用泄漏的是「引用计数」这种算法（早期 IE 处理 DOM 与 JS 对象互引时的经典问题），现在基本只出现在面试史的语境里。JS 里真正常见的泄漏有：意外的全局变量、未清理的定时器与事件监听、闭包长期持有大对象、DOM 节点已被移除但仍被 JS 引用（detached DOM）、无上限的缓存或事件总线订阅没取消；排查用 Chrome DevTools 的 Memory 面板拍三次堆快照做 Comparison，看 Detached 节点与 Retainers 链，必要时用 `WeakMap`/`WeakRef` 让缓存不阻碍回收。垃圾回收算法：引用计数（有循环引用缺陷）、标记-清除（从根标记可达对象再清扫）、标记-整理（顺带压缩内存、减少碎片）、复制算法（新生代 Scavenge，把存活对象复制到另一半空间）；V8 按分代回收，新生代用 Scavenge，老年代用标记-清除/标记-整理并做增量与并发标记，还有弱引用与 `FinalizationRegistry` 这类辅助机制。答题时把「算法」与「引擎实现」分开讲，会显得分得清概念和实现。
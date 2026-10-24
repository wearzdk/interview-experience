---
title: "宇视科技前端笔试：Vue 生命周期、HTTP 缓存与二叉树最近公共祖先"
company: "宇视科技"
position: "前端开发"
round: "笔试"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/716c3a6cf3b346e3b357ed427f151880
tags: ["宇视科技", "前端", "笔试", "Vue", "HTTP缓存", "二叉树", "LCA"]
summary: "宇视科技前端笔试记录：选择题考 Vue 生命周期、HTTP 缓存相关协议头、代码输出（还有两道作者没记住），另有判断题，编程题只有一道——求二叉树中两个节点的最近公共祖先。"
---

### 《面试题目》

1. 选择题：Vue 的生命周期有哪些阶段，各自适合做什么？
2. 选择题：HTTP 缓存涉及哪些协议头，强缓存与协商缓存怎么配合？
3. 选择题：给一段代码，输出结果是什么？
4. 判断题：若干前端基础判断（作者未记录具体题目）。
5. 编程题：找出二叉树中两个节点的最近公共祖先。

### 《参考解析》

**Vue 生命周期（以 Vue 3 组合式 API 为例）。** 创建阶段：`setup` 先于所有钩子执行，`onBeforeMount` → `onMounted`（DOM 已挂载，可访问 `$el`、发起请求、初始化第三方库）。更新阶段：`onBeforeUpdate`（数据变了、DOM 还没更新）→ `onUpdated`（DOM 已更新，注意别在里面改状态否则死循环）。销毁阶段：`onBeforeUnmount`（清理定时器、事件监听、取消请求）→ `onUnmounted`。另有 `onActivated`/`onDeactivated`（配合 `<KeepAlive>`）、`onErrorCaptured`。Vue 2 对应的是 `beforeCreate/created/beforeMount/mounted/beforeUpdate/updated/beforeDestroy/destroyed`。常见考点是「在哪个钩子发请求」——`created`（Vue 2）或 `setup`/`onMounted`（Vue 3），以及「为什么 `mounted` 里能拿到 DOM 而 `created` 不能」。

**HTTP 缓存。** 强缓存：`Cache-Control`（`max-age`、`s-maxage`、`no-cache`、`no-store`、`private`、`public`、`immutable`）与旧的 `Expires`（绝对时间，受客户端时钟影响）；命中强缓存时浏览器直接用本地副本、不发请求。协商缓存：`ETag`/`If-None-Match`（内容指纹，精度高）与 `Last-Modified`/`If-Modified-Since`（时间，精度到秒）；未命中强缓存时带这两个头去问服务端，服务端回 `304` 就复用本地副本。优先级上 `Cache-Control` 高于 `Expires`，`ETag` 优先于 `Last-Modified`。实践要点：HTML 用 `no-cache`（每次都协商，保证发版立即生效），带 hash 的静态资源用 `max-age=31536000, immutable`；接口按业务选 `no-store` 或短 `max-age`。还有 `Vary`（按请求头区分缓存，比如 `Accept-Encoding`）、`Age`（经过代理的缓存时长）。

**代码输出题的常见套路。** 前端笔试的代码输出基本集中在四类：`this` 绑定（普通函数调用 vs 箭头函数 vs `call/apply/bind`）、事件循环（`setTimeout`/`Promise.then`/`async-await` 的执行顺序：同步 → 微任务 → 宏任务，`await` 之后的代码进微任务）、闭包与变量提升（`var` 在循环里共享、`let` 每轮独立）、以及隐式类型转换（`[] + {}`、`==` 的比较规则）。做这类题先在纸上标出「同步段 / 微任务队列 / 宏任务队列」，再按顺序吐结果，比凭感觉快且准。

**二叉树的最近公共祖先。** 递归解法最简洁：对当前节点 `root`，若为空或等于 p、q 之一就返回 `root`；递归左右子树得到 `left`、`right`；若两者都非空，说明 p、q 分居两侧，当前节点就是 LCA；若只有一侧非空，就返回那一侧的结果。时间 O(n)、空间 O(h)（递归栈）。迭代写法可以用「记录父指针 + 从 p 往上染色，再从 q 往上找第一个染色节点」，或用「后序遍历 + 哈希表存每个节点的父节点」。如果是二叉搜索树，可以更简单：从根开始，若 p、q 都小于当前值就往左走，都大于就往右走，否则当前节点即 LCA，O(h)。

**笔试准备的取舍。** 这家笔试的结构是「选择题 + 判断题 + 一道编程」，说明更看重基础广度而不是算法深度。复习优先级：框架原理（生命周期、响应式、diff）> 浏览器与网络（缓存、跨域、事件循环）> 手写代码（防抖节流、深拷贝、数组去重、LCA/反转链表这类简单算法）。判断题通常考「说法是否绝对」，遇到「一定」「所有」「必须」这类词先怀疑。

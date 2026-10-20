---
title: "字节跳动 AI Agent 全栈开发面经"
company: "字节跳动"
position: "AI Agent全栈开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/88e22e99028942bcbac1ed57395f2e60
tags: ["前端", "React", "Electron", "Go", "Agent", "算法"]
summary: "字节 AI Agent 全栈开发面经，覆盖 Vue/React 响应式与 Hooks 链表、ReAct、仅凭 Messages 实现 Tool Calling、Electron 与浏览器多进程、多标签页共享 WebSocket、Go 并发模型与 IPC，手撕链表环和带 TTL 的 LRU。"
---

### 《面试题目》

1. Vue 的响应式原理是什么？
2. React 的响应式原理是什么？
3. 为什么 React Hooks 使用链表？
4. 如果想解决 Hooks 无法在循环和条件分支中使用的问题，应该如何设计？
5. ReAct 是什么？
6. 不通过 API 的 Tools 列表，仅通过 Messages，如何实现 Tool Calling？
7. Electron 的多进程架构是什么样的？
8. 项目中多进程 IPC 监听与销毁具体怎么实现？为什么需要销毁？
9. 浏览器的多进程架构是什么样的？
10. GPU 进程是做什么的？
11. 如果想让多个浏览器标签页共用一个 WebSocket 连接，应该如何实现？
12. Go 的并发模型有哪些？
13. 除了 GMP，还有哪些并发机制？
14. 这些并发机制分别有哪些适用场景？
15. Goroutine 和 Channel 配合使用有哪些适用场景？
16. 进程间通信的方法有哪些？
17. 你在项目中使用 Redis 主要做什么？
18. 你提到系统中存在异步任务调度，整个后端的进程架构是什么样的？
19. 手撕：使用快慢指针判断链表是否有环。
20. 手撕：设计带有统一过期时长 TTL 的 LRU Cache。

### 《参考解析》

**响应式**：Vue 3 用 Proxy 拦截 get/set，get 时收集依赖、set 时触发更新，配合 effect 调度；React 走不可变数据 + 状态更新触发重渲染，Hooks 用链表按调用顺序保存状态，所以不能在条件/循环里改变调用顺序。想支持条件调用，需要给每个 Hook 显式 key 或改成基于依赖图的响应式系统，但这会破坏现有规则，工程上不现实。

**Tool Calling**：标准做法是把工具 schema 传给模型，模型输出结构化调用；如果只有 Messages，可以在系统提示里约定 JSON 格式，让模型输出 `{"tool": "...", "args": {...}}`，运行时解析并校验，再把结果作为一条消息回填。ReAct 就是“推理—行动—观察”循环，适合需要多步工具调用的任务。

**多进程**：Electron 主进程管窗口和系统能力，渲染进程跑页面，预加载脚本做安全桥接，IPC 用 `ipcMain/ipcRenderer` 或 MessagePort；监听器要及时移除，避免窗口销毁后回调泄漏。浏览器是多进程架构，主进程/浏览器进程、渲染进程、GPU 进程、网络进程、插件进程各司其职，GPU 进程负责合成与硬件加速。多标签页共享 WebSocket 可以用 SharedWorker、BroadcastChannel 或把连接放到 Service Worker，再由页面间转发消息。

**Go 并发**：GMP 调度、channel、`sync` 包、context、errgroup、原子操作；GMP 适合大量轻量 goroutine，channel 适合流水线和任务分发，`sync.Mutex` 适合共享状态保护，context 适合取消和超时传播。IPC 方式包括管道、消息队列、共享内存、socket、信号。TTL LRU 在普通 LRU 基础上给每个节点加过期时间，读取时惰性删除，写入时清理过期节点，并用最小堆或时间轮维护最早过期时间。

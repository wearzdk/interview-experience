---
title: "字节内部跨转二面：实习方案追问、浏览器缓存与 LangChain 辨析"
company: "字节跳动"
position: "后端开发工程师"
round: "二面"
date: "2026-10"
result: "挂"
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/0f9c6347a3f1421a876ee2ff2854de06
tags: ["字节跳动", "实习", "浏览器缓存", "LangChain", "LangGraph", "Agent"]
summary: "字节内部跨转二面 58 分钟：全程围绕实习追问和挑战方案，无手撕，八股只问浏览器缓存与 LangChain/LangGraph 的区别，最终未通过。"
---

### 《面试题目》

1. 实习期间具体做了什么？方案为什么这么设计？
2. 如果换一种方案，会有什么取舍？
3. 浏览器缓存机制是怎样的？强缓存和协商缓存怎么配合？
4. LangChain 和 LangGraph 有什么区别？各自适合什么场景？
5. 你做 Agent 时怎么控制流程和状态？
6. 反问环节。

### 《参考解析》

**实习深挖**：二面不再问“做了什么”，而是问“为什么这么做、有没有更好的做法”。准备时每个项目至少准备三层：业务目标与约束（为什么做）、方案与替代方案（为什么选 A 不选 B）、结果与反思（指标、故障、如果重来做啥）。被 challenge 时不要防御，先复述对方的假设，再给数据或边界条件；如果确实没考虑过，承认并当场推导一个方案，比硬编好。

**浏览器缓存**：强缓存由 `Cache-Control`（max-age、s-maxage、no-cache、no-store、immutable）和 `Expires` 控制，命中时直接用本地副本，不发请求；协商缓存由 `ETag/If-None-Match`、`Last-Modified/If-Modified-Since` 控制，命中时服务端回 304，省带宽但仍有往返。优先级上 `Cache-Control` 高于 `Expires`，`ETag` 通常优先于 `Last-Modified`。实践里 HTML 用 no-cache 或短缓存，带 hash 的静态资源用长缓存 + immutable；CDN 上还要区分浏览器缓存和边缘缓存。service worker、内存缓存、磁盘缓存是另一层，别混在一起答。

**LangChain 与 LangGraph**：LangChain 提供模型、提示词、工具、检索器、链式组合等抽象，适合线性或简单分支的 LLM 应用；LangGraph 把流程建模成状态图，节点是函数、边是转移条件，支持循环、分支、持久化状态、断点恢复和人工介入，适合多步 Agent、需要回滚/重试/审批的流程。两者不是替代关系，LangGraph 更底层、控制力更强，但抽象和调试成本也更高。如果业务节点固定、没有循环，直接写编排代码往往更简单。

**Agent 状态控制**：核心是“状态机 + 检查点”。每次运行有 thread_id，状态包含消息、工具结果、当前节点、待办和错误；每步落检查点，失败可从最后成功节点恢复；循环要有最大步数、超时和预算；工具调用要幂等，人工审批点要能暂停。可观测性上记录每步输入输出、token、耗时和决策原因，方便回放。

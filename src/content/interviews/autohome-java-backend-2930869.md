---
title: "汽车之家 Java 后端二面：延迟队列幂等、MVCC 与 Agent 工具调用"
company: "汽车之家"
position: "Java 后端"
round: "二面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/5701f5af812146c7812a5236e590bed8
tags: ["汽车之家", "Java", "延迟队列", "幂等", "MVCC", "SSE", "Agent", "AI Coding"]
summary: "汽车之家 27 届 Java 后端二面：项目深挖刹车预警与延迟队列，Java 基础问进程线程、Runnable/Callable，MySQL 问隔离级别、MVCC 与幻读，再聊 SSE 流式输出、Function Calling 与 AI Coding 实践。"
---

### 《面试题目》

1. 自我介绍。
2. 介绍一下目前实习的业务和你负责的模块。
3. 车辆频繁刹车预警的业务背景是什么，具体怎么实现？
4. 介绍一下你的微服务项目，主要有哪些业务？
5. 为什么要自己实现延迟队列？具体怎么实现？
6. 延迟任务重复执行，如何保证业务幂等？
7. 进程和线程有什么区别？
8. Runnable 和 Callable 有什么区别？
9. MySQL 有哪些事务隔离级别？默认是什么？
10. MySQL 的 MVCC 是怎么实现的？
11. 幻读如何处理？快照读和当前读有什么区别？
12. 你的 Agent 是如何实现流式输出的？
13. 为什么选择 SSE 而不是 WebSocket？
14. 平时如何使用 AI 辅助开发？
15. 你觉得 AI 给软件开发带来了哪些实际变化？
16. 如果希望进一步提高端到端研发效率，你会怎么做？
17. Agent 是如何调用工具的？Function Calling 的原理是什么？
18. 平时使用哪些 AI Coding 工具？有什么区别？
19. 你怎么看 Agent 接下来的发展？
20. 最近有没有关注或研究什么新的 AI 项目？
21. 未来的职业规划是什么？
22. 对汽车之家目前的 AI 应用方向有什么了解？

### 《参考解析》

**自研延迟队列的常见结构是 MySQL + Redis ZSet + Redis List**。MySQL 存任务本体和执行状态，保证宕机后可恢复；ZSet 用执行时间戳做 score，维护「即将到期」的任务；到点后投递到 List 由消费者取走执行。相比直接上 RocketMQ 延时消息，这套的好处是可控、可查、能按业务定制，代价是要自己处理重复消费和补偿。

**幂等要按业务环节分别设计**。状态流转类（比如文章从草稿到已发布）用条件更新：`update ... set status = 新 where id = ? and status = 旧`，影响行数为 0 就说明已被处理；插入类用唯一索引兜底，重复插入直接捕获冲突。不要只靠「先查后写」，并发下查和写之间有窗口。

**MVCC 靠隐藏字段 + Undo Log 版本链 + Read View**。InnoDB 行上有事务 ID 和回滚指针，更新时旧版本进 Undo Log 串成链；事务第一次快照读生成 Read View，记录活跃事务集合，读的时候沿版本链找对当前事务可见的版本。RR 下普通 SELECT 复用同一个 Read View，所以可重复读。

**但 RR 不等于不会幻读**。快照读看的是历史版本，当前读（`SELECT ... FOR UPDATE`、UPDATE、DELETE）读最新已提交数据；InnoDB 用 Next-Key Lock（记录锁 + 间隙锁）锁住扫描范围来阻止插入，效果依赖索引和查询计划。范围没锁住、或者先快照读再做当前读，仍可能看到新行。

**选 SSE 是因为大模型输出是单向流**。SSE 基于普通 HTTP，服务端持续 push，浏览器原生 EventSource 支持断线重连，穿透代理和网关也比 WebSocket 简单；WebSocket 是全双工，适合双方频繁交互的场景。SSE 的局限是只能服务端到客户端、HTTP/1.1 下同域连接数有限，所以大规模场景要配合 HTTP/2 或分片。

**Function Calling 的本质是「约束模型输出结构化调用请求」**。把工具的 name、description、参数 JSON Schema 一起给模型，模型生成符合 schema 的调用参数，Runtime 解析后执行工具、把结果作为新消息回灌，循环直到模型给出最终回答。工程上的关键是参数校验（schema + 业务校验）、超时与重试、工具权限和副作用控制。

---
title: "字节跳动 Agent 开发日常实习一面面经"
company: "字节跳动"
position: "Agent开发实习生"
round: "一面"
result: "通过"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/0ee160a2d38f4b5daaf1965cf975a8f0
tags: ["Agent", "LangGraph", "上下文管理", "DAG", "Benchmark", "RAG", "算法"]
summary: "字节 Agent 日常实习一面，深挖 Agent Runtime 的框架选型、Agent 间通信、LangGraph 中断恢复与 reducer、上下文压缩、Task DAG 故障恢复、CAS 锁，以及 benchmark 设计、Redis 向量检索和 Hit@k/Recall@k/MRR 指标。"
---

### 《面试题目》

1. 自我介绍，平时常用什么 coding 工具？
2. 讲一下 Agent Runtime 的整体流程。
3. 为什么不用现成框架，而是从底层 Runtime 自己做？
4. 三个 Agent 之间怎么通信？输入输出怎么流转？
5. 是不是基于 LangGraph？为什么选它？具体怎么搭的？
6. LangGraph 怎么做中断恢复（checkpoints）？
7. 底层状态流转怎么实现？知道 reducer 吗？
8. 上下文压缩策略是什么？什么时候压？阈值怎么定？
9. 如果旧信息已经被摘要掉了，后面还要用怎么办？
10. Task DAG：ABCDE 中 BCD 依赖 A 并行跑，E 依赖 BCD，如果 D 崩了有没有恢复机制？
11. CAS 锁在数据库里的实现原理？
12. 希望 Agent 尽量自发恢复而不是全丢给用户审批，有什么设计思路？
13. Benchmark 怎么评成功率？隐藏测试是不是固定 case？最终结果怎么测？
14. Single-agent 怎么构建？
15. Tool Call 减少但 Token 消耗增加，原因体现在哪？
16. 多步骤长任务里，用 harness 是不是比 single-agent 更省 token？
17. 文档拆分用的什么拆分器？为什么用 Redis 做向量检索？ES 也能做向量检索，知道吗？
18. 文档来源是哪？是不是网上找的？
19. 评测除了 Hit@1 还做过哪些指标？解释 Hit@k、Recall@k、MRR，哪个最有代表性？
20. 手撕：删除链表倒数第 N 个节点（ACM 模式）。

### 《参考解析》

**Runtime 与 LangGraph**：自研 Runtime 通常是为了控制调度、权限、可观测性和成本；LangGraph 用图节点和边编排，状态通过 reducer 合并，checkpoint 保存每一步状态以支持中断恢复。回答时要能说清“状态存在哪、谁负责恢复、失败如何重放”，而不是只说用了哪个框架。

**上下文压缩**：按 token 预算设阈值，保留最近对话和关键事实，把较早内容滚动摘要；被摘要掉的信息要通过检索或结构化记忆按需取回，不能假设模型记得。Task DAG 的恢复要有步骤状态和幂等，D 失败时只重跑 D 及其下游，已完成节点复用结果。

**Benchmark**：固定任务集 + 隐藏集，指标包括成功率、步骤数、时延、token 成本和人工评分；隐藏 case 不能固定，否则会过拟合。Hit@k 是前 k 个结果中命中至少一个的比例，Recall@k 是召回的相关项占全部相关项的比例，MRR 是第一个相关结果排名的倒数均值；排序质量常用 MRR，召回覆盖常用 Recall@k。

**算法**：删除倒数第 N 个节点用快慢指针，快指针先走 N 步，再同时走到快指针到末尾，慢指针指向待删节点的前驱；注意删除头节点时用哨兵。

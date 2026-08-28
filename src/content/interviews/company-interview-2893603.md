---
title: "面经-8"
company: "某公司"
position: "Java后端开发工程师"
date: '2026-08'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2893603
tags: ["Java","Redis","MySQL","JVM","Spring","并发"]
summary: "某公司Java后端开发工程师面试记录，覆盖Java、Redis、MySQL、JVM等考点，整理了面试流程与高频问题。"
---

### 《面试题目》

1. 自我介绍。
2. Agent
3. LangChain4j 和 LangGraph4j之间的关系是什么？
4. LangChain4j 和 LangGraph4j之间的区别是什么？
5. LangChain4j 能不能搭建工作流？
6. LangChain4j 如何实现短期记忆和长期记忆？
7. 谈谈对 Agent 的理解？
8. Agent 和传统大模型有什么区别？
9. Agent 的推理模式有哪些？区别是什么？
10. Function Calling的原理是什么？
11. SpringBoot
12. SpringBoot 如何实现自动注入？
13. SpringBoot 如何实现自动装配？
14. MySQL
15. 谈谈对 MySQL 的理解？
16. MySQL 出现慢查询怎么做？
17. 谈谈对索引的理解？
18. B 树和 B+ 树的区别是什么？

### 《参考解析》

1. Redis常用于缓存、分布式锁和计数。缓存与数据库更新通常采用“先写数据库、再删除缓存”，并通过重试、延时双删或消息补偿处理删除失败。
2. MySQL索引通常使用B+树，叶子节点按顺序连接，适合范围查询；设计索引时结合选择性、最左匹配原则和执行计划，避免无效索引与回表开销。
3. 并发问题应先明确共享状态和一致性边界，再选择锁、CAS或队列。线程池需要根据任务是CPU密集还是IO密集设置核心线程数、队列容量和拒绝策略，并监控活跃数与队列长度。

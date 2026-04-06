---
title: 字节跳动后台开发二面面经
company: 字节跳动
position: 后台开发
round: 二面
date: '2026-03'
source: 牛客网
tags: ["Go","Redis","分布式","微服务","RAG"]
summary: "字节跳动后台开发二面面经，重点考察Go语言GMP调度模型、Java线程池机制、Redis Cluster集群原理及数据分片迁移。涵盖分布式架构、RAG大模型应用、Function Call与MCP对比，以及数据库事务隔离级别分析与算法路径总和实战。"
---

### 《面试题目》
1. 进程、线程、协程的区别？
2. Go 语言的 GMP 调度模型？
3. Java 线程池的核心参数？
4. 并发/线程池的使用场景？
5. 实习项目的分布式/微服务架构大概是怎么样的？
6. Redis 集群有哪些？讲一下Redis Cluster原理？
7. Redis 哈希槽、数据分片、实例增减时的迁移？
8. SQL分析题：一张表和一条数据，两个事务启动开始读取和更新，分析每个步骤中select或者update/insert发生了什么
9. 算法题：路径总和III
10. Agent 项目介绍
11. RAG 原理
12. Function Call 与 MCP 的区别
13. 场景题：业务场景分析，涉及接口设计及处理链路分析

---

### 《参考解析》
- **GMP模型**：G是Goroutine，M是内核线程，P是逻辑处理器。P维护一个本地队列，M绑定P获取G执行，实现高效并发。
- **Redis Cluster**：采用哈希槽（16384个）分片。数据通过CRC16计算映射到槽，扩容时通过迁移槽位对应的Key实现，避免了全量数据重分布。
- **RAG原理**：检索增强生成。通过向量数据库检索用户问题相关的外部知识，将其注入提示词（Prompt）中，协助LLM生成更准确的回答。
- **Function Call与MCP**：Function Call是模型根据输入决定调用工具；MCP (Model Context Protocol) 是统一标准化模型与外部系统交互的协议，解耦了模型与数据源。
- **路径总和III**：利用前缀和（Prefix Sum）+ 哈希表优化，在遍历树的过程中记录路径和出现的频率，将时间复杂度从O(N²)降至O(N)。
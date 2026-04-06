---
title: 北京东华原医疗 Java 一面
company: 北京东华原医疗
position: Java开发工程师
round: 一面
date: '2026-03'
base: 北京
source: 牛客网
tags: ["Kafka","Redis","Java并发","大模型RAG","Docker"]
summary: "北京东华原医疗Java开发岗位一面面经。面试官深入考察Kafka原理、Redis持久化与去重、Java并发锁机制与AQS。重点询问了RAG技术在医疗领域的落地场景，包括模型选型、知识库构建、上下文优化及系统可扩展性设计。"
---

### 面试题目

**一、消息队列与缓存**
- 介绍 Kafka 概念（主题、分区、副本），分区与副本的区别。
- 副本同步过程中是否会出现同步过多或同步过少的情况？具体同步方式有哪些？
- 如何确保消息一直只发送到指定的某个分区？
- Kafka 的 ACK 确认机制详解。
- Redis 去重使用的数据结构，滑动窗口的 Redis 实现方式。
- Redis 6.5 与 7.0 版本差异及持久化机制。

**二、Java 核心与并发**
- Java 锁机制（偏向锁、轻量级锁、重量级锁、无锁）。
- AQS 原理，Semaphore 和 CountDownLatch 作用。
- HashMap 与 Hashtable 的区别（扩容、初始化、哈希冲突解决）。

**三、大模型与 RAG 落地（核心场景）**
- 项目中如何使用 MCP，模型部署方式（在线/离线/API）。
- 场景题：利用 AI 辅助药师检测孕妇/儿童用药禁忌，如何结合 RAG、私有化知识库实现？
- 知识库选型（向量库 vs 传统数据库），从文献数据提取关键信息的方法。
- 前端交互、多场景切换、上下文记忆实现及长对话性能优化。

**四、系统设计与运维**
- 架构的维护性、扩展性、可观测性实现。
- 大数据组件 Flink 的了解。
- Docker 相关命令（logs, cp 双向操作, build, Dockerfile）。
- 设计模式（模板方法、建造者模式及其作用）。

---

### 参考解析

- **Kafka分区指定**：通过自定义 `Partitioner` 实现，或者在生产消息时直接指定 `partitionId`。
- **Redis滑动窗口**：利用 `ZSET`，以时间戳为 score，窗口滑动时移除过期成员。
- **RAG方案**：向量数据库（如 Milvus/Pinecone）存储 Embedding 向量以实现语义检索，结合提示词工程（Prompt Engineering）构建用药逻辑规则。
- **长对话优化**：限制 Context 窗口长度（滑动窗口机制），或使用 LLM 对历史摘要（Summarization）进行压缩存储。
- **Docker cp**：支持宿主机与容器的双向传输，常用于调试配置文件。
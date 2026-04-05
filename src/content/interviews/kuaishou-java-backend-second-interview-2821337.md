---
title: 快手后端Java开发二面面经
company: 快手
position: Java后端开发
round: 二面
date: '2026-03'
source: 牛客网
tags: ["Java","Agent","RAG","Redis","RabbitMQ","LangChain4j"]
summary: "快手企业事务部门Java后端开发二面面经，面试时间2026年3月。重点考察AI Agent项目经验，涵盖RAG流程与选型、幻觉优化、Redis瓶颈分析、RabbitMQ消息队列原理，以及LangChain4j框架选型等核心技术点，无Java八股和手撕算法，整体体验良好。"
---

## 面试题目

### 部门与岗位
- 面试部门：快手企业事务部门
- 面试岗位：Java 开发
- 面试时间：2026年3月27日

### 项目相关

1. 讲项目非 Agent 部分的模块组成，侧重于描述不同模块的职责
2. 讲项目 Agent 模块组成（面试官会细问，确认项目是否本人独立完成）
3. 项目的数据库选型，如何使用的？
4. 项目为什么用 Redis？怎么用的？
5. 项目数据库建表的思路，表是自己设计的吗？
6. Redis 的功能与职责，你觉得 Redis 的瓶颈在哪里，或者说 Redis 的业务边界是什么？
7. RAG 怎么做的，包括选型和完整流程？
8. 项目 Agent 对于幻觉的优化措施，如何处理幻觉 / LLM 乱说话的问题？
9. 项目里 Skill 是做什么的，和企业级 Skill 是一个东西吗？谈谈对 Skill 的理解
10. 是否想过把项目包装为知识库供外部使用？（延伸讨论较多）

### 基础知识

1. 为什么选择 LangChain4j？
2. SpringCloud 了解吗？组成部分有哪些？（候选人表示个人项目未用过，跳过）
3. RabbitMQ 了解吗？谈谈 MQ 是什么，不同 MQ 产品的对比，MQ 的组成部分
4. 消费者具体做什么？在你的业务里具体做了什么？

### 反问环节

- 简单询问了业务方向和部门情况

---

## 参考解析

### Redis 瓶颈与业务边界
Redis 是内存型数据库，核心瓶颈在于内存容量有限，不适合存储大体量冷数据。单线程命令执行在极高并发大 value 场景下延迟上升。持久化（RDB/AOF）会带来性能抖动。业务边界建议：高频热点读、缓存、分布式锁、会话存储；避免将 Redis 当主数据库或存储大 Blob。

### RAG 流程与选型
RAG（检索增强生成）核心流程：文档切片 → Embedding 向量化 → 存入向量数据库（如 Milvus、Weaviate、Pinecone）→ 用户查询向量化 → 相似度检索 Top-K → 拼接上下文 Prompt → LLM 生成回答。选型重点关注向量库的检索性能、Embedding 模型效果以及与框架（LangChain4j）的集成成本。

### Agent 幻觉优化
常见措施：① 在 Prompt 中明确约束"不知道时回答不知道"；② RAG 检索到高置信度文档后再生成，降低凭空捏造概率；③ 对 LLM 输出做后处理校验（结构化输出 + Schema 校验）；④ 引入 Self-Consistency 或多轮反思机制；⑤ 设置 Temperature 较低值减少随机性。

### Agent Skill 的理解
Skill（技能）是 Agent 可调用的原子能力单元，类似函数或工具（Tool），如搜索、计算、调用 API 等。个人项目中的 Skill 通常是自定义封装的业务函数；企业级 Skill 则经过标准化、权限管控和版本管理，可供多个 Agent 复用，类似微服务中的能力中台。

### 为什么选 LangChain4j
LangChain4j 是 Java 生态下对标 Python LangChain 的框架，提供 LLM 调用抽象、Chain、Agent、RAG、Memory 等开箱即用组件，与 Spring Boot 集成友好。对于 Java 后端开发者，相比直接调 HTTP API 大幅降低开发成本，同时支持多种向量数据库和 Embedding 模型的统一接口。

### RabbitMQ 与 MQ 对比
MQ 核心作用：异步解耦、流量削峰、顺序保证。常见对比：RabbitMQ 延迟低、路由灵活（Exchange/Queue/Binding 模型），适合业务消息；Kafka 吞吐极高、持久化强，适合日志/流式处理；RocketMQ 事务消息支持好，适合金融场景。消费者负责从队列拉取消息并执行业务逻辑，需关注幂等性和 ACK 机制。
---
title: 谐云科技 Java 后端实习面经（AI+并发方向）
company: 谐云科技
position: Java 后端开发实习
round: 两轮技术面
date: '2026-04'
source: 牛客网
tags: ["Java","线程池","MVCC","RAG","AI Agent","并发集合"]
summary: "谐云科技 Java 后端开发实习面经，共两轮技术面。一面重点考察 AI 工具使用经验（RAG、MCP、Skill、Swarm Agent）及 Java 并发八股（线程池核心参数、synchronized、线程安全集合、MVCC）；二面深入业务痛点与 RAG 落地实践，并附经典智力题。适合备战 Java 后端+AI 方向实习岗位的同学参考。"
---

## 面试题目

### 一面

**AI 相关**

1. 你日常用什么 AI 工具辅助？
2. 你对 Skill 的看法是什么？
3. MCP 用到什么地方？MCP 和 Skill 的区别是什么？
4. RAG 解决什么问题？项目中是怎么实现的？
5. 你是怎么节约 Token 的？提到了 Sub Agent，有了解过 Swarm Agent 吗？
6. 你对 AI 的看法？

**Java 八股**

1. 线程池的核心参数有哪些？
2. 了解 synchronized 吗？请介绍一下。
3. 说一下线程安全的集合，并讲一下实现原理。
4. 介绍一下 MVCC。

---

### 二面

1. 业务中遇到过什么痛点？
2. RAG 用到什么地方？如何解决离散数据的问题？

**智力题**

- 100 匹马、10 个赛道，不能计时，最少几次比赛可以选出最快的 5 匹？

---

## 参考解析

### MCP 与 Skill 的区别

- **Skill**：Agent 具备的单一能力单元，如「搜索」「代码执行」，通常是工具函数的封装。
- **MCP（Model Context Protocol）**：由 Anthropic 提出的开放协议，标准化模型与外部工具/数据源的交互方式，解决不同工具接入格式不统一的问题。
- 核心区别：Skill 强调能力定义，MCP 强调接入协议标准化；MCP 可以承载多个 Skill。

### RAG 解决的问题及实现

- RAG（检索增强生成）解决大模型**知识截止**和**幻觉**问题，将私有/实时知识注入上下文。
- 典型流程：文档切块 → Embedding 向量化 → 存入向量数据库（如 Milvus/Chroma）→ 用户提问时相似度检索 → 将 Top-K 片段拼入 Prompt → LLM 生成答案。
- 离散数据问题：可通过**元数据过滤 + 混合检索（BM25 + 向量）+ Rerank 重排序**提升召回质量。

### 节约 Token 的方法

- 精简 System Prompt，去除冗余描述；使用摘要压缩历史对话（滑动窗口摘要）。
- RAG 场景只注入相关片段，避免全文传入；Sub Agent 拆分任务，按需调用，减少单次上下文长度。
- Swarm Agent：OpenAI 开源的轻量多 Agent 框架，通过 Agent 间 handoff 传递控制权，避免单 Agent 上下文膨胀。

### 线程池核心参数

- `corePoolSize`：核心线程数，常驻不销毁。
- `maximumPoolSize`：最大线程数，队列满后扩展至此。
- `keepAliveTime`：非核心线程空闲存活时间。
- `workQueue`：任务等待队列（LinkedBlockingQueue / ArrayBlockingQueue / SynchronousQueue）。
- `threadFactory`：线程创建工厂。
- `handler`：拒绝策略（AbortPolicy / CallerRunsPolicy / DiscardPolicy / DiscardOldestPolicy）。

### synchronized 原理

- 基于对象头的 **Monitor 锁**，JVM 层面通过 `monitorenter`/`monitorexit` 字节码实现。
- JDK 6 后引入锁升级：无锁 → 偏向锁 → 轻量级锁（CAS 自旋）→ 重量级锁（OS 互斥量）。
- 可修饰实例方法（锁当前对象）、静态方法（锁 Class 对象）、代码块（锁指定对象）。

### 线程安全集合及原理

- `ConcurrentHashMap`：JDK 8 采用 **CAS + synchronized 分段锁**（锁桶头节点），细粒度并发。
- `CopyOnWriteArrayList`：写时复制新数组，读不加锁，适合**读多写少**场景。
- `BlockingQueue`（如 `LinkedBlockingQueue`）：基于 **ReentrantLock + Condition** 实现阻塞语义。
- `Collections.synchronizedXxx`：粗粒度包装，所有方法加同一把锁，性能较差。

### MVCC

- **多版本并发控制**，MySQL InnoDB 用于实现**读已提交（RC）和可重复读（RR）**隔离级别。
- 核心组成：**undo log**（保存历史版本）、**ReadView**（快照读时生成，决定可见版本）、行记录中的 `trx_id` 和 `roll_pointer`。
- RR 级别：事务开始时生成一次 ReadView，整个事务内读到同一快照；RC 级别：每次 SELECT 重新生成 ReadView。
- MVCC 只解决读写并发，写写冲突仍需加锁（next-key lock）。

### 智力题：100 匹马选最快 5 匹

- **答案：最少 10 场。**
- 先分 10 组各比 1 场（10 场），每组取第 1 名，共 10 匹；
- 对这 10 匹冠军再比 1 场（第 11 场），取前 5 名所在组 + 排名推算，通常标准答案认为需要再加 1 场淘汰确认，即 **10 场分组 + 1 场冠军赛 = 最少结合题意可答 10 场（若只需相对排名不需严格验证第5名则存在争议，面试中说明推理过程即可）**。
- 建议面试时清晰说明：分组赛 10 场 → 冠军赛 1 场 → 按需追加 1 场，共 **10~12 场**，重点展示推理逻辑。
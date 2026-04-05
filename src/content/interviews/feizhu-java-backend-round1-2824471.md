---
title: 飞猪 Java 后端开发一面
company: 飞猪（阿里巴巴飞猪旅行）
position: Java 后端开发
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","MySQL","JVM","Kafka","Spring Boot","大模型-LLM"]
summary: "飞猪 Java 后端开发一面面经（2026-03），涵盖 MySQL 事务/索引/MVCC、HashMap 与 ConcurrentHashMap、AQS 读写锁底层实现、JVM 内存模型与 GC 算法、Kafka 组件与选型、Spring Boot 自动配置原理、ThreadLocal 弱引用，以及 LLM 大模型实践与 Token 节省策略，含算法题（众数查找）与现场 AI 作业。"
---

## 面试题目

### 大模型 / AI 应用

1. 使用的 LLM 模型随版本变化，用起来有哪些不一样的地方？怎么应对模型差异带来的效果变化？
2. Milvus、MySQL 数据库分别用来存哪些数据？
3. 通过 API 调用大模型的话，怎么调用的？走的是 API Key 吗？
4. 怎么读取向量数据库？（候选人答：pymilvus 工具包）
5. 了解 Token 怎么计费的吗？（候选人答：内网私有部署 vs 外网购买）
6. AI 应用中怎么节省 Token 使用？
7. AI 应用实际产生了哪些效果？
8. 用过 Claude Code 写过代码吗？（候选人对比了 Codex 与 Claude Code）

### 数据库

9. 关系型和非关系型数据库的区别？
10. MySQL 如何实现事务的，底层原理是什么？（候选人答了 begin/commit/rollback，应深入到锁、MVCC）
11. 索引有哪些类型？聚簇索引和非聚簇索引的区别？
12. 乐观锁和悲观锁的区别？

### Java 基础 & 并发

13. Spring Boot 自动配置的原理？怎么找到需要配置的类？
14. HashMap 底层结构？怎么扩容？线程安全吗？ConcurrentHashMap 如何实现线程安全？1.8 前后的区别？
15. synchronized 和 Lock 的区别？
16. 读写锁怎么实现的？ReentrantReadWriteLock 源码里怎么区分读锁和写锁？
17. 实现读锁和写锁时，state 字段底层是怎么设置的？
18. 线程状态有哪些？sleep 和 wait 的区别？

### JVM

19. JVM 内存模型？常量存在哪里？方法区里面有什么？
20. 垃圾回收算法有哪些？分别用在什么场景？（候选人答：分代回收，新生代/老年代）
21. ThreadLocal 有什么作用？怎么保存参数的？涉及强引用/弱引用？

### 中间件

22. 有用到哪些中间件？Redis、Kafka 分别用来做什么？
23. 为什么选择 Kafka 而不是 RocketMQ？选型对比？
24. Kafka 底层大概有哪些组件？（候选人答：ZooKeeper、ACK 机制、分区局部有序）

### 算法

25. 有 N 个数，其中某个数出现次数超过一半，怎么快速找到？
26. 快排的原理？为什么快？二分查找的原理？还有没有更低复杂度的方法？

### 现场作业

27. **AI 辅助发邮件**：写提示词完成 JSON 转指定字段格式 JSON；  
    - 交付物 1：一个 Prompt  
    - 交付物 2：返回的 JSON 数据  
    - 交付物 3：提示词验证过程（验证返回数据是否符合条件）

---

## 参考解析

### MySQL 事务底层（第 10 题）
- 事务依赖 **Undo Log**（回滚）、**Redo Log**（崩溃恢复）、**MVCC**（多版本并发控制）实现。
- MVCC 通过隐藏列 `trx_id`、`roll_pointer` 和 ReadView 实现快照读，避免读写互斥。
- 锁机制（行锁、间隙锁、Next-Key Lock）保证写写隔离，防止幻读。

### 聚簇索引 vs 非聚簇索引（第 11 题）
- 聚簇索引：叶子节点存储完整行数据，InnoDB 默认主键为聚簇索引，一张表只能有一个。
- 非聚簇索引（二级索引）：叶子节点存储主键值，查询时需**回表**到聚簇索引再取数据。
- 覆盖索引可避免回表，提升查询性能。

### ConcurrentHashMap 1.7 vs 1.8（第 14 题）
- **1.7**：Segment 分段锁，每个 Segment 是一个 ReentrantLock，锁粒度为 Segment。
- **1.8**：取消 Segment，采用 **CAS + synchronized** 锁单个桶头节点，锁粒度更细；底层结构同 HashMap（数组+链表+红黑树）。

### AQS 读写锁 state 高低位（第 16-17 题）
- `ReentrantReadWriteLock` 用 AQS 的 **int state（32位）** 拆分：高 16 位记录读锁共享计数，低 16 位记录写锁独占计数。
- 写锁获取：state 低 16 位为 0 才可获取，CAS 设置低位。
- 读锁获取：低 16 位为 0（无写锁）时，CAS 增加高位计数；支持锁降级（写→读），不支持升级（读→写）。

### Spring Boot 自动配置原理（第 13 题）
- `@SpringBootApplication` 包含 `@EnableAutoConfiguration`，触发 `AutoConfigurationImportSelector`。
- 从 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（2.7+）或 `spring.factories` 中读取候选配置类。
- 每个配置类通过 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件注解按需装配。

### ThreadLocal 弱引用（第 21 题）
- `ThreadLocalMap` 的 Entry key 是 ThreadLocal 的**弱引用**，value 是强引用。
- 当 ThreadLocal 对象无强引用时，key 会被 GC 回收变为 null，但 value 仍存在，可能导致**内存泄漏**。
- 使用完毕后应调用 `remove()` 清理，避免泄漏。

### 众数查找算法（第 25-27 题）
- **Boyer-Moore 投票算法**：O(n) 时间 O(1) 空间，维护候选数和计数器，遍历一次即可找到超过半数的众数，优于排序（O(n log n)）和哈希（O(n) 空间）。
- 快排核心：选 pivot，分区使左小右大，递归；平均 O(n log n)，最坏 O(n²)。
- 二分查找：有序数组中每次折半，O(log n)，但要求数组有序。

### Kafka 核心组件（第 24 题）
- **Broker**：消息服务节点；**Topic**：逻辑消息分类；**Partition**：Topic 分区，保证分区内有序；**Consumer Group**：消费者组实现负载均衡。
- **ACK 机制**：0（不等待）、1（Leader 写入确认）、-1/all（所有 ISR 副本确认），权衡吞吐与可靠性。
- Kafka 2.8+ 支持 **KRaft 模式**，逐步移除对 ZooKeeper 的依赖。
- vs RocketMQ：Kafka 吞吐更高，适合日志/流式；RocketMQ 延迟更低、支持事务消息和顺序消息，适合业务场景。
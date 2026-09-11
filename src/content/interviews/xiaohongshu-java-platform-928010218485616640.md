---
title: 小红书Java平台开发一面面经
company: 小红书
position: Java平台开发
round: 一面
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/928010218485616640
tags: ["Java", "线程池", "AQS", "Kafka", "MySQL"]
summary: "小红书Java平台开发一面面经，考察线程池执行流程、AQS与锁、StampedLock、ConcurrentHashMap扩容、Kafka消费语义和MySQL幻读。"
---

### 《面试题目》

1. ThreadPoolExecutor 提交任务后，任务从进入线程池到最终执行会经历哪些分支？
2. ReentrantLock 如何基于 AQS 实现公平锁、非公平锁与可重入？
3. synchronized 锁升级过程中，对象头和 Mark Word 会发生什么变化？
4. StampedLock 的乐观读为什么不能等价于无锁读？有哪些隐藏风险？
5. ConcurrentHashMap 在扩容过程中如何保证并发读写？为什么 `size()` 很难获得瞬时精确值？
6. Kafka 消费端开启手动提交 Offset 后，为什么仍可能重复消费或丢失数据？
7. Kafka 分区内要求并发消费，同时又不能破坏 Key 级顺序，应该怎么设计？
8. MySQL 的 MVCC 为什么无法彻底解决幻读？当前读又如何阻止幻读？
9. 一条 SQL 使用了索引却仍然很慢，如何从执行计划定位问题？
10. Redis Cluster 执行 Lua 脚本时，为什么不能实现跨 Slot 原子事务？

---

### 《参考解析》

1. **线程池流程**：先尝试创建核心线程，再入工作队列；队列满后创建非核心线程，达到上限才执行拒绝策略。配置还需考虑任务类型、队列容量、下游连接池和内存上限。
2. **AQS 与公平性**：AQS 用 `state` 表示同步状态，用队列管理竞争线程；可重入通过同一线程重复获取时递增状态实现。非公平锁允许新线程直接 CAS 抢占，公平锁会检查队列前驱，吞吐通常略低。
3. **StampedLock**：乐观读拿到的是版本凭证，读取完多个字段后必须 `validate()`；失败就退化为悲观读并重读。它不可重入、没有 Condition，写锁还可能饥饿，不是读写锁的无条件替代。
4. **Kafka 语义**：先处理业务后提交可能重复，先提交后处理可能丢失；Exactly-Once 需要事务或业务幂等约束。分区内并发时按 Key 固定分片，并只提交从上次位置开始连续完成的 Offset，避免跳过未完成消息。
5. **MVCC 与 Redis Cluster**：快照读依赖 Read View，当前读依赖记录锁和间隙锁；锁范围由索引路径决定。Redis Cluster 的 Lua 只在单节点串行执行，跨 Slot 的 Key 位于不同主节点，必须改用哈希标签或更高层协调。

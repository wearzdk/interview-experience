---
title: 阿里巴巴Java后端全程面经（技术一面到HR面完整复盘）
company: 阿里巴巴
position: Java后端开发工程师
round: 全程
date: '2026-06'
base: 浙江
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2868283
tags: ["Java","JVM","并发编程","MySQL","Redis","系统设计","秒杀","分布式"]
summary: "阿里巴巴Java后端四面全程复盘，一面深挖HashMap/JVM/并发+项目分库分表，二面考系统设计（秒杀/缓存穿透）+LRU手撕，交叉面聊DDD/微服务/K8s架构，HR面问离职/薪资/职业规划。"
---

### 《面试题目》

**技术一面（约60分钟）**

1. 自我介绍
2. HashMap 底层原理、扩容机制、为什么线程不安全？ConcurrentHashMap 如何保证线程安全？JDK7 与 JDK8 实现有何区别？
3. JVM 内存模型，堆和栈的区别，什么情况下发生 StackOverflowError 和 OOM？
4. 常见垃圾回收算法有哪些？CMS 和 G1 的区别？线上 Full GC 频繁如何排查？
5. synchronized 和 ReentrantLock 的区别？AQS 原理了解吗？
6. ThreadLocal 原理？为什么会有内存泄漏问题？如何解决？
7. 用过哪些并发工具类？CountDownLatch 和 CyclicBarrier 的区别？
8. 项目拷问——订单系统重构：为什么要重构？原系统有什么问题？
9. 分库分表如何做？分片键如何选取？数据迁移如何保证一致性？
10. 分布式事务如何处理？Seata 的 AT 模式和 TCC 模式有何区别？

**技术二面（约70分钟）**

11. 设计一个秒杀系统，从前端到后端全链路说明。限流怎么做？库存如何扣减？超卖如何防止？
12. 如果 QPS 从 1 万涨到 100 万，方案需要如何调整？
13. Redis 缓存击穿、穿透、雪崩各如何解决？
14. 线上某接口响应突然变慢，如何排查？从哪些维度入手？
15. 消息队列消息积压了怎么办？如何保证消息不丢失、不重复消费？
16. 手撕 LRU 缓存（LeetCode 146），用双向链表 + HashMap 实现，时间复杂度 O(1)，完成后要求处理边界 case。

**交叉面（约45分钟）**

17. 如何理解 DDD（领域驱动设计）？项目中有没有实践过？
18. 微服务拆分的原则是什么？拆得太细有什么问题？
19. 云原生理解，K8s 基本概念，容器化部署的优势
20. 开放题：你认为一个好的技术架构应该具备哪些特质？

**HR 面（约30分钟）**

21. 为什么从上一家离职（裸辞被深追）？
22. 你的职业规划是什么？为什么选择阿里？
23. 期望薪资多少？如果给不到怎么办？
24. 你手上有哪些 offer？

---

### 《参考解析》

**1. HashMap 线程不安全及 JDK8 改进**

JDK7 中 HashMap 扩容时使用头插法转移链表，多线程并发时可能形成环形链表导致死循环（CPU 100%）；JDK8 改为尾插法并引入红黑树（链表长度 ≥ 8 时转树），消除了环链死循环，但并发写仍可能丢数据，根本上非线程安全。ConcurrentHashMap JDK8 采用 `CAS + synchronized` 锁桶头节点，替代了 JDK7 的 Segment 分段锁，粒度更细，性能更好。

**2. Full GC 频繁排查步骤**

① `jstat -gcutil <pid> 1000` 观察各分代使用率变化；② `jmap -heap <pid>` 查看堆分布；③ `jmap -dump:format=b,file=heap.bin <pid>` 导出堆快照用 MAT 分析大对象/内存泄漏；④ 检查代码是否有大对象直接进老年代（> `-XX:PretenureSizeThreshold`）或 Survivor 区设置过小导致对象提前晋升；⑤ 关注 `[GC cause: Metadata GC Threshold]` 则是元空间不足，调整 `-XX:MaxMetaspaceSize`。

**3. 秒杀系统设计（从 1 万到 100 万 QPS）**

- **限流**：Nginx 层 limit_req 模块做接入限流；业务层令牌桶（Guava RateLimiter）或 Redis + Lua 滑动窗口限流；
- **库存预热**：活动开始前将库存写入 Redis，`DECR` 原子扣减，`DECR` 返回 < 0 时拒绝请求；
- **超卖防护**：Redis `DECR` 原子操作 + 数据库乐观锁（`UPDATE stock SET count=count-1 WHERE id=? AND count>0`）双重保证；
- **100 万 QPS 演进**：① 多级缓存（本地 Caffeine + Redis Cluster）；② 消息队列削峰（请求排队，异步落库）；③ 静态化商品页面（CDN 分发）；④ 读写分离 + 分库分表；⑤ 微服务独立部署，限流熔断。

**4. 消息不丢失 + 不重复消费**

- **不丢失**：生产者开启 Confirm/Ack 模式；Broker 持久化（RocketMQ 同步刷盘）；消费者手动 ACK，处理完业务再提交 offset；
- **不重复消费（幂等）**：消费前查 Redis 是否已处理该 message ID；或数据库唯一索引兜底（插入时 ON DUPLICATE KEY 忽略）。

**5. 分布式事务 Seata AT vs TCC**

- **AT 模式**：无侵入，框架自动生成 undo_log 回滚，适合已有 SQL 业务快速接入，但在高并发下全局锁粒度较大；
- **TCC 模式**：需业务方实现 Try/Confirm/Cancel 三个接口，侵入性强但性能更高、控制更灵活，适合高并发订单、支付等核心链路。

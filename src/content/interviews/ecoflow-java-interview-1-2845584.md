---
title: 正浩创新 Java 一面面经
company: 正浩创新
position: Java 开发工程师
round: 一面
date: '2026-04'
result: 凉经
source: 牛客网
tags: ["Redis","gRPC","MySQL","JVM","并发编程"]
summary: "正浩创新 Java 岗位一面面经，面试官重点考察消息队列选型（Redis Stream vs Kafka）、gRPC 与 RESTful API 设计、分布式系统幂等性与可靠性实现、以及 JVM 内存模型、MySQL 回表和 ConcurrentHashMap 原理等核心八股。"
---

### 《面试题目》

**1. 手撕代码**
- 合并两个有序数组。

**2. 消息队列选型**
- 使用 Redis 作为消息中间件的弊端是什么？
- Redis Stream、Kafka、RocketMQ 的各自优劣势及选型依据。

**3. 网络与通信**
- gRPC 是否只支持 Protobuf？还有其他支持吗？
- 什么是 REST？外部服务调用除了 REST 还有什么方式？

**4. 分布式系统设计**
- 如何保证接口幂等性？
- 如何防止消息丢失？如何实现监听超时、未收到 ACK 后的自动重试机制？

**5. 基础知识与并发**
- Java 的值传递与引用传递的区别。
- TCP 三次握手及其必要性。
- ConcurrentHashMap 的底层实现原理及扩容机制。

**6. JVM 与数据库**
- JVM 内存区域及运行时数据区。
- 什么是 MySQL 的回表查询？
- Redis 缓存三大问题：穿透、击穿、雪崩。

---

### 《参考解析》

- **消息队列选型**：Redis Stream 适合轻量级、低延迟场景，但消息持久化与投递语义不如 Kafka/RocketMQ 成熟；Kafka 吞吐量极高，适合日志与大数据流；RocketMQ 侧重事务消息与可靠性。
- **gRPC 与 REST**：gRPC 基于 Protobuf 序列化，支持其他编码格式但默认为 Proto；外部调用除了 REST 常用 HTTP/JSON，还有 GraphQL 或 WebSocket。
- **幂等与防丢**：幂等通常通过数据库唯一索引、全局请求 ID（Token 机制）实现；防丢需要配置 ACK 确认机制与持久化策略，重试通常结合延时队列或轮询机制。
- **ConcurrentHashMap**：JDK 1.8 采用 CAS + synchronized 控制并发，结构为数组+链表+红黑树；扩容通过分段迁移，支持多线程协同扩容。
- **MySQL 回表**：当查询字段未被索引覆盖时，需要通过二级索引找到主键值，再通过主键索引查找完整数据行，即为回表。
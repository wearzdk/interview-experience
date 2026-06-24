---
title: 福建电子口岸Java开发面试
company: 福建电子口岸
position: Java开发工程师
date: '2026-05'
base: 福建
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2867556
tags: ["Java","JVM","Spring","MySQL","RabbitMQ","ELK"]
summary: "福建电子口岸Java开发面试面经，考察范围广且偏实际应用。包含JVM调优（2核4G环境）、垃圾回收算法、Java集合框架、HashMap扩容机制、IoC与AOP、线程池参数与跨线程通信、数据库索引类型、RabbitMQ消息可靠性、ELK日志系统及接口幂等设计。"
---

### 《面试题目》

1. 项目介绍
2. 2 核 4G 的服务器 JVM 该怎么调，调多少？
3. 垃圾回收的英文是什么，GC 是什么？
4. Java 的集合都有哪几种？
5. LinkedList 的底层数据结构是什么？
6. 开发中什么场景下需要选择 List 这种数据结构？
7. HashMap 的扩容因子、扩容机制是怎样的？
8. 什么是 IoC 和 AOP？
9. 线程池都有哪些配置参数？
10. 跨线程要怎么通信？
11. 数据库索引都有哪几种？
12. 一张表里面一定要有哪几种索引？
13. RabbitMQ 是怎么保证消息可靠的？
14. ELK 是什么东西，有搭过吗？
15. 你是怎么做幂等的？
16. 有没有接触过 OLAP？模型是部署到云上还是自己的电脑？

---

### 《参考解析》

1. **2核4G JVM调优**：建议堆内存 `-Xms1g -Xmx2g`（留 2G 给 OS 和非堆），新生代约 512m（`-Xmn512m`）。垃圾回收器选 G1（JDK 9+默认）或 CMS（老项目）。线程数设为 2×CPU核数，设 `-XX:+HeapDumpOnOutOfMemoryError` 便于 OOM 排查。

2. **HashMap 扩容机制**：初始容量 16，负载因子 0.75，当 `size > capacity × 0.75` 时触发扩容，容量翻倍并 rehash（JDK 1.8 优化：高低位拆分，不需重新计算 hash）。扩容是 O(n) 操作，频繁扩容影响性能，初始化时应预估容量（`new HashMap<>(expectedSize / 0.75 + 1)`）。

3. **RabbitMQ 消息可靠性**：三个环节保障：①生产者确认（publisher confirm + return 机制，确保消息到达 Exchange 和 Queue）；②持久化（Exchange、Queue、Message 均设 durable/persistent）；③消费者确认（手动 ACK，消费成功后 `basicAck`，失败后 `basicNack` 重回队列或入死信队列）。

4. **幂等设计**：常见方案：①唯一索引（DB 层面 insert ignore）；②Redis `SET key NX EX` 分布式锁；③业务状态机（检查状态是否已处理）；④Token 机制（客户端先获取 token，提交时带 token，服务端原子验证并删除）。选择依据：操作频率低→DB 唯一索引；高并发→Redis；支付类→状态机 + 幂等表。

5. **ELK 架构**：Elasticsearch（存储与搜索）+ Logstash（日志采集与过滤）+ Kibana（可视化）。实践中常用 Filebeat 替换 Logstash 做采集（轻量），Logstash 做聚合过滤。应用日志通过 Filebeat → Kafka 缓冲 → Logstash → ES → Kibana 监控。

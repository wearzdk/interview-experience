---
title: 深圳益普科技Java实习一面面经
company: 深圳益普科技
position: Java开发实习生
round: 一面
date: '2026-06'
base: 深圳
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/895804913857331200
tags: ["Java","RabbitMQ","Disruptor","Redis","MySQL"]
summary: "深圳益普科技Java实习一面面经，考察物联网通信协议（Modbus/MQTT）了解程度、RabbitMQ与Disruptor的区别及项目中选用Disruptor替代线程池的原因、多级缓存架构设计，以及InnoDB与MyISAM存储引擎的区别。"
---

### 《面试题目》

1. 通信方面学过吗？Modbus 协议了解吗？MQTT 呢？
2. 什么是 RabbitMQ，和项目中云图库用的 Disruptor 有什么区别？
3. 追问：项目中为什么用 Disruptor，直接用线程池不好吗？
4. 项目中如何使用 Redis 的？
5. 多级缓存的架构和工作原理，怎么给项目带来性能提升？
6. 面向对象三大特征是什么？结合项目示例说明如何应用这三种思想
7. MySQL 数据库索引类型
8. InnoDB 和 MyISAM 存储引擎的区别

---

### 《参考解析》

1. **RabbitMQ vs Disruptor**：RabbitMQ 是跨进程/跨服务的消息中间件，基于网络通信，用于系统间解耦、异步处理、削峰填谷；Disruptor 是进程内的高性能无锁环形队列，基于内存共享，专为单进程内极低延迟的生产者-消费者场景设计（如高频交易、日志处理）。项目中若瓶颈在进程内多线程间的数据流转（而非跨服务通信），Disruptor 的无锁设计（基于 CAS 和内存屏障，避免了传统阻塞队列的锁竞争开销）能提供比线程池+阻塞队列更高的吞吐量和更低的延迟。
2. **InnoDB vs MyISAM**：InnoDB 支持事务（ACID）、外键约束、行级锁、崩溃恢复（redo/undo log），采用聚簇索引（数据和主键索引存储在一起）；MyISAM 不支持事务和外键，只支持表级锁，索引和数据分开存储（非聚簇），查询性能在某些只读场景下略有优势但并发写入能力和数据安全性远不如 InnoDB，目前 MySQL 默认存储引擎已是 InnoDB。
3. **多级缓存架构**：典型的多级缓存架构是"本地缓存（如 Caffeine）+ 分布式缓存（Redis）+ 数据库"三层结构，请求先查本地缓存（速度最快但容量有限、多节点数据可能不一致），未命中再查 Redis（容量更大、多节点共享），最后才查数据库兜底，通过降低对下层的访问频率来提升整体响应速度。

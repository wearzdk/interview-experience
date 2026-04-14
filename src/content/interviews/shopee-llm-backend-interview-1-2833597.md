---
title: 虾皮大模型后端开发一面-日常实习
company: Shopee
position: 大模型后端开发
round: 一面
date: '2026-04'
source: 牛客网
tags: ["MySQL","Redis","RocketMQ","Java","JWT","缓存一致性"]
summary: "Shopee大模型后端开发实习生一面面经。面试重点考察项目实战能力与八股文深度，涵盖MySQL事务机制、Redis+Lua秒杀方案、RocketMQ高并发架构及二级缓存一致性等核心后端技术栈。"
---

### 《面试题目》

1、实习拷打
2、手撕：荷兰国旗问题 (LC75)
3、项目拷打：
   - 图文社交平台：网关鉴权实现、JWT设计、Redis+Caffeine二级缓存设计与一致性保证、Cassandra选型及对比MySQL。
   - 电商秒杀平台：秒杀整体流程、防止超卖与一人一单策略、Redis+Lua实现细节、RocketMQ解耦作用。
4、八股文环节：
   - MySQL：InnoDB事务实现、三种日志（redo/undo/binlog）作用。
   - RocketMQ：消息发送流程、存储设计特点、高性能设计、延时队列原理。

---

### 《参考解析》

- **荷兰国旗问题**：利用三路快排思想，定义三个指针（left, curr, right），遍历数组并将0移至左侧，2移至右侧，1保持在中间。
- **Redis+Caffeine一致性**：可采用先更新数据库，再删除Redis与Caffeine缓存的策略；或引入消息队列异步失效缓存，保证最终一致性。
- **Redis+Lua秒杀**：将判断库存、扣减库存、记录购买记录封装在Lua脚本中，利用Redis单线程特性保证操作的原子性，避免超卖。
- **InnoDB事务**：依赖Redo Log保证持久性（事务提交即落盘），Undo Log保证原子性（用于回滚），并通过MVCC（多版本并发控制）实现隔离性。
- **RocketMQ存储设计**：采用顺序写盘（CommitLog），利用零拷贝（mmap）技术加速I/O，并通过ConsumeQueue实现消息的逻辑索引，极大地提升了读写吞吐量。
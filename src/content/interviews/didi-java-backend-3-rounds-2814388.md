---
title: 春招Java后端开发 滴滴平台技术三面面经
company: 滴滴
position: Java后端开发
round: 三轮
date: '2026-03'
source: 牛客网
tags: ["Redis","RocketMQ","MySQL","Java并发","MVCC"]
summary: "滴滴春招Java后端开发三轮面试总结。考察核心技术点包括Redisson分布式锁原理、Redis数据结构、RocketMQ顺序消息与架构设计、MySQL MVCC机制及隔离级别、线程安全集合、单例模式等，涵盖深度项目拷打与手撕算法题，助你备战大厂面试。"
---

### 《面试题目》

#### 一面
1. 实习拷打
2. Redisson底层原理实现
3. Redis有哪些底层数据结构
4. ZSet如何插入数据实现平衡性
5. RocketMQ的顺序性如何保证
6. 三个队列按ABC执行的方案
7. 单例模式实现线程安全的方法
8. 缓存击穿防止策略
9. Java线程安全的集合有哪些
10. 手撕：二叉树中序遍历（非递归）

#### 二面
1. 实习拷打
2. RocketMQ特性及底层组件
3. RocketMQ的CAP模型归属
4. RocketMQ与RabbitMQ的区别及场景
5. MySQL隔离级别
6. MVCC实现原理
7. Redo log和Undo log的区别
8. 手撕：原创算法题（查找最大字母）

#### 三面
1. 实习拷打
2. MySQL慢查询排查优化
3. 对AI的看法及应用实践

---

### 《参考解析》

* **Redisson分布式锁**：基于Redis的Lua脚本实现原子性，通过Hash结构存储锁信息，利用watchdog机制实现锁自动续期。
* **RocketMQ顺序性**：通过MessageQueueSelector将同一业务ID的消息发送到同一个队列，并保证消费端单线程顺序消费。
* **MySQL MVCC**：通过版本链（undo log）+ ReadView（读视图）实现。读提交级别每次读取生成ReadView，可重复读级别仅在首次读取生成。
* **Redo Log vs Undo Log**：Redo log记录物理修改保证事务持久性（WAL机制），Undo log记录逻辑日志用于事务回滚和MVCC可见性。
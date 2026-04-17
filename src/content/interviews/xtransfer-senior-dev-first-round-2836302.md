---
title: XTransfer高级开发工程师一面面试经验
company: XTransfer
position: 高级开发工程师
round: 一面
date: '2026-04'
result: 通过
source: 牛客网
tags: ["Java","分布式系统","Redis","MySQL","并发编程"]
summary: "XTransfer高级开发工程师面试，重点考察分布式任务调度框架设计、MySQL慢查询优化与分表策略、Redis底层数据结构及分布式锁原理。同时涉及线程池核心参数、AQS实现机制、Nacos服务发现及高并发场景下的架构治理经验。"
---

### 面试题目

1. 自我介绍
2. 重点项目介绍：定时任务调度框架（数据分片与冷热数据处理）
3. 架构对比：为何自研而非使用时间轮算法或xxl-job？
4. 业务流程：服务器硬件数据清洗与测试流程
5. 异步调度框架架构：调度层、执行层、治理层
6. 分布式锁实现：锁住任务类型及其分表策略
7. 数据库优化：慢SQL分析、索引覆盖、连接池参数调整
8. 压力测试：Wrk测试工具的应用与参数调优
9. 治理层功能：过期任务清理与大小分表/滚表策略
10. 致命挑战：在第三方服务器进行DDL操作的冲突处理
11. 数据来源：接口限流与数据一致性问题
12. 消息推送系统：高/低优先级定义、分区（Partition）处理及ACK机制
13. 八股考察：
    - Nacos注册中心与CP/AP模型
    - synchronized 与 ReentrantLock 区别
    - 线程池参数及拒绝策略
    - Redis数据结构（String/Set/Zset/Hash）及Zset底层实现（跳表）
    - Redis Cluster哈希槽分片（crc16）
    - 分布式锁（setnx + lua）
    - AQS底层原理（volatile state + FIFO队列）
14. 算法题：链表相关（断开拼接）
15. 反问环节：业务瓶颈探讨与技术方案交流

---

### 参考解析

1. **Nacos一致性模型**：Nacos既支持AP（默认注册中心模式）也支持CP（配置中心模式）。在AP模式下通过Gossip协议保证高可用，CP模式基于Raft协议保证强一致性。
2. **Redis Zset底层**：数据量少时使用ziplist（压缩列表）节省空间，数据量大时使用skiplist（跳表）配合hashtable，以实现O(logN)的查找效率。
3. **AQS核心逻辑**：AQS通过一个volatile int state变量表示同步状态，并维护一个双向链表组成的FIFO队列管理阻塞线程。ReentrantLock通过CAS修改state实现加锁，并通过LockSupport挂起线程。
4. **分布式锁设计**：SETNX指令加锁必须设置过期时间以防死锁；使用Lua脚本确保“判断锁是否存在”与“删除锁”两个操作的原子性，防止误删他人的锁。
5. **慢SQL与分表**：Filesort通常由排序字段未加索引导致；分表建议优先考虑ShardingSphere等中间件，若业务方抗拒DDL，可考虑通过冷热数据分离的逻辑表方案代替物理拆表。
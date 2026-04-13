---
title: 腾讯AI后台开发一面面经分享
company: 腾讯
position: AI后台开发
round: 一面
date: '2026-04'
source: 牛客网
tags: ["MySQL","Redis","数据结构","AI Agent","排序算法"]
summary: "腾讯AI后台开发一面面经分享。面试重点考察了高并发MySQL架构设计、Redis底层数据结构与一致性策略，并涉及AI Agent模型及计算机基础排序算法，适合后端求职者参考学习。"
---

### 面试题目
1. MySQL 的数据查询如何做到高并发？事务是怎么处理的？
2. 点赞业务表是怎么设计的？表结构如何设计索引？
3. 如果用 Redis 存点赞数据，用的是什么数据结构？数据是怎么存的？
4. 如何实现查看最近点赞的人这个功能？
5. Redis 的 zset 底层结构是什么？
6. Redis 的数据有没有落到 MySQL？是怎么保证数据一致性的？
7. 当前项目整体架构是什么？
8. Redis 提升了 MySQL 50% 的效率，这个结论是怎么得出的？
9. 之前实习用过 Python 开发工具，Python 和 Java 的区别是什么？
10. Python 开发的工具是如何提升效率的？
11. 你是怎么了解 AI 的？
12. AI Agent 大概有哪些模型或类型？
13. 介绍一下常见的排序算法。
14. 归并排序和快速排序的时间复杂度、空间复杂度分别是多少？

---

### 参考解析
1. **MySQL高并发**：可通过读写分离（主从复制）、分库分表、引入缓存（Redis）、优化SQL索引及使用连接池实现。事务处理依赖ACID特性，通过MVCC实现非阻塞读。
2. **点赞设计**：表结构包含user_id, target_id, status等。索引应覆盖常用查询字段，通常建立(target_id, user_id)联合索引。
3. **Redis数据结构**：常用Hash存储点赞数，Set存储点赞用户ID列表。高并发下建议异步批量写入数据库。
4. **查看最近点赞**：利用Redis的List（LPUSH/LRANGE）或ZSet（以时间戳为score）实现，取前N条数据。
5. **ZSet底层**：Redis 7.0前采用压缩列表（ziplist）+ 跳表（skiplist）；7.0后采用listpack + 跳表。
6. **数据一致性**：采用延时双删或订阅Binlog（如Canal）进行异步更新，确保最终一致性。
7. **Redis效率提升**：基于监控数据对比（QPS/RT）或使用压力测试工具（JMeter/Benchmark）对比引入Redis前后的读写性能。
8. **排序复杂度**：
   - 快速排序：平均O(n log n)，最坏O(n²)，空间O(log n)；
   - 归并排序：始终O(n log n)，空间O(n)。
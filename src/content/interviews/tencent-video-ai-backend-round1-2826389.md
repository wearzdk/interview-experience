---
title: 腾讯视频暑期实习 AI后台开发一面
company: 腾讯视频
position: AI后台开发
round: 一面
date: '2026-04'
result: 挂
source: 牛客网
tags: ["MySQL","Redis","Java","排序算法","AI Agent","高并发"]
summary: "腾讯视频暑期实习AI后台开发一面面经，涵盖MySQL高并发与事务、Redis数据结构（ZSet/跳表）、点赞业务表设计、Redis与MySQL数据一致性、AI Agent模型认知、归并/快速排序复杂度与稳定性等核心考点，已挂供参考备考。"
---

## 面试题目

### 项目相关

1. MySQL 的数据查询怎么做到高并发，还有事务相关问题？
2. 点赞业务表怎么设计的，表里面怎么创建索引？
3. Redis 存点赞数据的话，用的什么结构，数据具体怎么存的？
4. 如何实现查看最近的点赞人？
5. ZSet 底层结构是什么，跳表时间复杂度是多少，为什么跳表有两种结构？
6. Redis 的数据有没有放在 MySQL 中，是怎么保持数据一致性的？
7. 当前项目的架构是什么，怎么重做项目架构？
8. Redis 提升了 MySQL 50% 的效率，是怎么得到的？
9. 之前的实习用过 Python 开发工具，Python 和 Java 的区别是什么，什么时候使用 Python？
10. Python 开发的工具效率是怎么提升的，有没有用到并发？

### AI 相关

1. 怎么了解 AI 的？
2. AI Agent 大概有哪些模型？

### 排序算法

1. 介绍一下常见的排序算法？
2. 归并排序和快速排序的时间复杂度、空间复杂度、稳定性分别是什么，稳定性是只看大小吗？

---

## 参考解析

### MySQL 高并发查询与事务

- 读写分离（主库写、从库读）+ 连接池（如 HikariCP）是常见高并发方案。
- 索引优化（覆盖索引、避免全表扫描）、SQL 慢查询分析也是关键。
- 事务隔离级别：读未提交、读已提交、可重复读（MySQL 默认）、串行化；重点掌握幻读与不可重复读的区别及 MVCC 原理。

### 点赞业务表设计与索引

- 典型字段：`id`, `user_id`, `target_id`（被点赞对象）, `target_type`（内容类型）, `create_time`。
- 联合索引建议：`(target_id, target_type)` 用于查询某内容点赞数；`(user_id, target_id, target_type)` 用于判断用户是否已点赞（唯一索引防重复）。

### Redis 存点赞 & 查看最近点赞人

- 点赞数可用 `String`（INCR）或 `Hash`（`hset like:target_id user_id 1`）存储。
- 查看最近点赞人用 **ZSet**：key 为 `like:recent:{target_id}`，member 为 `user_id`，score 为时间戳；`ZREVRANGE` 取最近 N 个。

### ZSet 底层结构与跳表

- ZSet 底层有两种实现：元素数量少且值较短时用 **listpack（紧凑列表）**，否则用 **跳表（skiplist）+ 哈希表**。
- 跳表查询/插入/删除平均时间复杂度 O(log N)，空间复杂度 O(N)。
- 两种结构共存原因：哈希表支持 O(1) 按 member 查 score，跳表支持 O(log N) 按 score 范围查询，两者互补。

### Redis 与 MySQL 数据一致性

- 常见策略：**Cache Aside**（先更新 DB，再删除缓存）是最稳妥方案，避免并发写导致脏数据。
- 延迟双删：更新 DB 后删除缓存，延迟一段时间再删一次，应对主从同步延迟场景。
- 强一致场景可引入分布式锁或消息队列（如 Binlog + Canal 同步）。

### Python vs Java

- Python：动态类型、开发效率高、生态丰富（数据处理/AI/脚本），GIL 限制多线程 CPU 密集型任务，性能弱于 Java。
- Java：静态类型、JVM 优化、适合高并发后台服务；Python 适合脚本工具、数据分析、AI 模型调用等场景。
- Python 提升并发效率：IO 密集型用 `asyncio` 或多线程，CPU 密集型用多进程（`multiprocessing`）绕过 GIL。

### AI Agent 常见模型

- 主流框架/模型：LangChain Agent、AutoGPT、ReAct（Reasoning + Acting）框架、OpenAI Function Calling、MetaGPT 等。
- 核心组件：规划（Planning）、工具调用（Tool Use）、记忆（Memory）、行动（Action）。

### 归并排序 vs 快速排序

| 算法 | 平均时间 | 最坏时间 | 空间复杂度 | 稳定性 |
|------|----------|----------|------------|--------|
| 归并排序 | O(N log N) | O(N log N) | O(N) | 稳定 |
| 快速排序 | O(N log N) | O(N²) | O(log N) | 不稳定 |

- **稳定性**不只看大小，而是指相等元素在排序后相对顺序是否保持不变；快排 partition 交换时可能打乱相等元素的原始顺序，故不稳定。
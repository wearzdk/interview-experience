---
title: 亚信科技 Java 实习面试
company: 亚信科技
position: Java实习生
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","MySQL","Redis","集合框架","SQL优化","分布式锁"]
summary: "亚信科技27届Java实习面经，涵盖ArrayList与LinkedList区别、Redis分布式锁底层实现、金额用double的精度问题、MySQL金额字段类型选择、慢SQL优化流程、EXPLAIN字段解读及深分页优化等核心Java后端知识点。"
---

## 面试题目

### 开场

1. 自我介绍
2. 介绍一下你项目里有什么让你印象深刻的点和难点，你是怎么解决的？

### Java 基础

3. 介绍一下 ArrayList 和 LinkedList 的区别
4. 金额用 double 去算会有什么问题？怎么解决？

### Redis

5. 介绍一下 Redis 分布式锁的底层实现

### MySQL

6. MySQL 里存金额的数值该用什么数据类型来存？
7. 讲讲慢 SQL 的整个优化流程，从寻找到优化
8. EXPLAIN 具体看哪些字段来进行优化？
9. 深分页怎么优化？

### 反问

10. 反问

---

## 参考解析

### ArrayList 与 LinkedList 的区别

- **底层结构**：ArrayList 基于动态数组，LinkedList 基于双向链表。
- **随机访问**：ArrayList O(1)，LinkedList O(n)。
- **插入/删除**：链表头尾操作 O(1)，ArrayList 涉及移位 O(n)。
- **内存**：LinkedList 每个节点额外存前后指针，内存占用更高。
- 实际开发中频繁随机读优先 ArrayList，频繁头部插删可考虑 LinkedList。

### 金额用 double 的问题及解决

- double/float 使用 IEEE 754 浮点数，存在精度丢失（如 `0.1 + 0.2 ≠ 0.3`）。
- 解决方案：使用 `BigDecimal` 进行精确计算，构造时用 `new BigDecimal("0.1")` 而非 `new BigDecimal(0.1)`。
- 数据库层面使用 `DECIMAL` 类型存储，避免浮点精度问题。

### Redis 分布式锁底层实现

- 核心命令：`SET key value NX PX timeout`，原子性地设置键并指定过期时间，防止死锁。
- 释放锁时需校验 value（UUID），通过 Lua 脚本保证"判断+删除"原子性，避免误删他人的锁。
- 生产中推荐使用 **Redisson**，其看门狗机制可自动续期，并支持可重入锁。

### MySQL 金额字段类型

- 推荐使用 `DECIMAL(M, D)`，M 为总位数，D 为小数位数，精确存储十进制数。
- 不要用 FLOAT/DOUBLE，存在浮点误差；也可用整型（分为单位）再在业务层换算。

### 慢 SQL 优化流程

1. **发现**：开启慢查询日志（`slow_query_log`），设置阈值（如 1s），用 `mysqldumpslow` 或监控平台定位慢 SQL。
2. **分析**：`EXPLAIN` 查看执行计划，关注 `type`、`key`、`rows`、`Extra` 字段。
3. **优化**：加索引、改写 SQL（避免函数操作索引列、减少 SELECT *）、分页优化、拆分复杂查询等。
4. **验证**：对比优化前后执行时间与执行计划。

### EXPLAIN 重点字段

- **type**：访问类型，优劣顺序：`system > const > eq_ref > ref > range > index > ALL`，尽量达到 `range` 以上。
- **key**：实际使用的索引，NULL 说明没走索引。
- **rows**：估算扫描行数，越小越好。
- **Extra**：`Using filesort`（额外排序，需优化）、`Using temporary`（临时表，需优化）、`Using index`（覆盖索引，好）。

### 深分页优化

- 传统 `LIMIT offset, size` 在 offset 很大时需扫描并丢弃大量行，性能差。
- **方案1 — 游标分页**：记录上一页最大 id，下一页使用 `WHERE id > last_id LIMIT size`，适合顺序翻页。
- **方案2 — 子查询/延迟关联**：先用覆盖索引查出主键，再回表，如 `SELECT * FROM t JOIN (SELECT id FROM t ORDER BY id LIMIT 100000, 10) tmp USING(id)`。
- **方案3**：业务上限制最大翻页深度，或改为搜索引擎（Elasticsearch）处理。
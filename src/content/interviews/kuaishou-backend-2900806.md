---
title: 快手后端开发一面面经
company: 快手
position: 后端开发
round: 一面
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2900806
tags: ["Java", "MySQL", "Redis", "并发编程", "算法"]
summary: "快手后端一面面经，项目深挖占据主要时间，基础题覆盖Java集合与并发、MySQL事务索引、Redis数据结构和缓存问题，手撕合并区间。"
---

### 《面试题目》

1. 项目的关键设计取舍是什么，当前方案有哪些优缺点？
2. 能否完整讲述项目中的一条核心业务链路？
3. ArrayList 与 LinkedList 有什么区别？
4. HashMap 和 ConcurrentHashMap 的底层实现有什么差异？
5. synchronized 与 ReentrantLock 应如何选择？
6. MySQL 常见存储引擎、索引和事务隔离级别有哪些？
7. 遇到 MySQL 故障时如何分析和修复？
8. Redis 为什么快，常见数据结构和缓存问题有哪些？
9. 如何合并一组存在重叠的区间？

### 《参考解析》

1. **集合与并发**：ArrayList 适合随机访问，LinkedList 适合已定位节点后的插入删除；ConcurrentHashMap 通过更细粒度的并发控制支持安全访问，不能用普通 HashMap 代替共享并发容器。
2. **数据库排障**：先确认故障范围，再结合慢查询日志、执行计划、锁等待和资源指标定位。索引优化要基于实际查询与数据分布，不能只凭字段是否出现在条件中判断。
3. **缓存问题**：穿透可用空值缓存或布隆过滤器缓解，击穿可用请求合并或互斥重建，雪崩需错开过期时间并控制回源压力。
4. **合并区间**：按起点排序后线性扫描；若当前区间起点不大于结果末区间的终点就合并，否则追加新区间。时间复杂度 O(n log n)。


---
title: "得物 Golang 开发一面面经"
company: "得物"
position: "Golang开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/25e08e398218477b83b616a14f9e8d60
tags: ["Golang", "MySQL", "Redis", "消息队列", "缓存", "系统设计"]
summary: "得物 Golang 一面，几乎全是八股：JOIN 区别、MVCC、隔离级别、B+ 树、索引设计、Redis 数据类型与分布式锁、缓存三大问题、集群 slot、过期删除、MQ 幂等，以及混合订单列表和超大日志 TopN 的系统设计。"
---

### 《面试题目》

1. left join 和 inner join 的区别？
2. left join 右表不存在时字段如何展示？
3. MVCC 相关原理？
4. MVCC 如何判断数据是否可见？
5. MySQL 可重复读、读已提交怎么实现快照读？
6. group by、order by 的使用场景？
7. MySQL 三大日志是什么？
8. B+ 树索引结构？
9. B+ 树和 B 树的区别？
10. 创建索引需要考虑哪些因素？
11. Redis 常用数据类型？
12. Redis 常用命令，zset 适用场景？
13. Redis set 带超时怎么用（EX/NX）？
14. Redis 分布式锁为什么要用 Lua 脚本？
15. 本地缓存和 Redis 缓存如何选型？
16. 缓存穿透、缓存击穿、缓存雪崩的概念及解决方案？
17. 单机 Redis 内存不够、不能用集群，怎么存储一批缓存数据？
18. Redis 集群中 key 怎么定位到 slot？节点迁移时怎么处理？
19. Redis key 过期的删除释放机制？
20. MQ 的作用？
21. MQ 重复消费怎么处理？幂等是什么？
22. 两张表（机票、火车票订单）混合列表接口，按出发时间倒序、支持筛选和分页，怎么设计？
23. 超大日志文件、内存放不下，统计 1 分钟内请求超过 100 次的 IP，怎么设计？

### 《参考解析》

**MySQL**：inner join 只保留两表匹配行，left join 保留左表全部行，右表无匹配时字段为 NULL；LEFT JOIN 的右表过滤条件放 WHERE 会退化成内连接，放 ON 才能保留左表。MVCC 用事务 ID、undo log 和 ReadView 判断可见性，RR 复用第一次快照，RC 每次读新建 ReadView。三大日志是 redo log、undo log、binlog；B+ 树非叶子只存键、叶子存数据并用链表连接，比 B 树更适合范围和排序。索引要考虑选择性、区分度、最左前缀、覆盖索引和写入成本。

**Redis**：zset 适合排行榜和延时队列；`SET key value EX seconds NX` 可以原子地实现带过期的锁；Lua 保证释放时“比对 value + 删除”原子。缓存穿透用布隆过滤器/空值，击穿用互斥锁/逻辑过期，雪崩用过期打散、多级缓存和降级。单机内存不够可以按 key 哈希分片到多个实例，或改用磁盘型存储；集群用 CRC16 对 16384 取模定位 slot，迁移时用 `MIGRATE` 并处理 ASK/MOVED 重定向。过期删除是惰性删除加定期抽样删除。

**系统设计**：混合订单列表可以按出发时间做游标分页，两个来源分别查再归并，或写入统一的搜索索引（ES）支持筛选和排序；注意深分页、时区和状态过滤。超大日志统计用哈希分片加小根堆，或流式处理加 Count-Min Sketch 找候选再精确计数。

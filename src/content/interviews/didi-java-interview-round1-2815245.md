---
title: 滴滴Java社招一面面经
company: 滴滴出行
position: Java开发工程师
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","MySQL","HTTP","数据库优化","高并发"]
summary: "滴滴Java社招一面面经，重点考察LRU算法实现、HTTP协议结构与状态码分析、MySQL InnoDB索引原理及索引失效场景判断，探讨超大规模订单表数据库拆分与分页优化方案，适合准备Java面试的候选人参考。"
---

### 面试题目

1. coding， LRU。
2. http请求头和响应头的结构？
3. 常见http响应码？ 502和504的区别？
4. mysql innodb的索引结构？
5. 以下情况的索引使用情况：
   create table myTest (a string, b int, c int, KEY a(a,b,c));
   （1）.select * from myTest where c=3 and a="test" and b=5;
   （2）.select * from myTest where a="test" and b>5 and c=6;
   （3）.select * from myTest where a="test" order by b asc;
   （4）.select * from myTest order by a asc, b desc;
   （5）.select a,b,c from myTest where a like "te%" and b=5 and c=3;
6. 某高并发电商系统，订单表日增量超过500万条，当前单表数据量已达数十亿，导致慢查询频发，分页查询深度偏移时性能急剧下降。如何优化？
7. 聊项目。

---

### 参考解析

**1. LRU实现**：通常使用 `HashMap + 双向链表` 实现，HashMap用于O(1)查找，双向链表用于维护访问顺序。需注意多线程环境下的同步问题。

**2. HTTP协议**：请求头包含请求行、首部字段、空行、实体主体；响应头包含状态行、响应首部、空行、响应体。

**3. 502与504区别**：502 Bad Gateway是作为网关的服务器从上游收到无效响应；504 Gateway Timeout是作为网关的服务器在规定时间内未收到上游响应。

**4. InnoDB索引**：采用B+树结构，非叶子节点存储键值，叶子节点存储完整数据记录或主键（二级索引），支持高效的范围查询和稳定查询性能。

**5. 索引分析提示**：主要考察最左前缀匹配原则。注意范围查询（>、<）会导致后续索引列失效，但 `a=... order by b` 是典型的索引排序应用场景。

**6. 数据库优化方案**：
- 分库分表（如按订单ID或时间分片）。
- 深度分页优化：使用延迟关联（先ID定位再JOIN）或记录上次查询ID（书签分页）。
- 引入缓存（Redis）或搜索引擎（Elasticsearch）处理复杂搜索需求。
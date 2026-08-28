---
title: "某信科技面经"
company: "某公司"
position: "Java后端开发工程师"
date: '2026-08'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2892378
tags: ["Java","Redis","Spring","MyBatis","数据库","面试经验"]
summary: "某公司Java后端开发工程师面试记录，覆盖Java、Redis、Spring、MyBatis等考点，整理了面试流程与高频问题。"
---

### 《面试题目》

1. 讲一下数据库的隔离机制
2. 讲一下数据库的锁（不会
3. 写SQL语句，都比较常规，比较有意思的一个是between and根据时间查找
4. Java常见注解（SpringBoot的
5. MyBatisPlus的查询代码解释
6. 原生MyBatis xml文件拼接SQL解释
7. 讲一下List
8. 讲一下Map
9. Redis缓存，如何使用，遇到了什么问题
10. Redis的常见数据类型
11. 怎么使用AI的
12. 大概就是这些。

### 《参考解析》

1. Redis常用于缓存、分布式锁和计数。缓存与数据库更新通常采用“先写数据库、再删除缓存”，并通过重试、延时双删或消息补偿处理删除失败。
2. MySQL索引通常使用B+树，叶子节点按顺序连接，适合范围查询；设计索引时结合选择性、最左匹配原则和执行计划，避免无效索引与回表开销。

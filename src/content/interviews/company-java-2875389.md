---
title: "美亚柏科java实习面经"
company: "某公司"
position: "Java后端开发工程师"
date: '2026-08'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2875389
tags: ["Java","Redis","MySQL","Spring","MyBatis","分布式系统"]
summary: "某公司Java后端开发工程师面试记录，覆盖Java、Redis、MySQL、Spring等考点，整理了面试流程与高频问题。"
---

### 《面试题目》

1. 数据库表的设计
2. 数据库索引的优化思路
3. 分布式系统有哪些了解
4. mq具体在项目中用在了哪里
5. redis和mysql数据一致性是怎么实现的
6. 对spring框架下的身份校验有什么方案
7. 对mybatis的了解
8. mybatis中数据库表如何映射
9. 对前端有什么了解的技术栈

### 《参考解析》

1. Redis常用于缓存、分布式锁和计数。缓存与数据库更新通常采用“先写数据库、再删除缓存”，并通过重试、延时双删或消息补偿处理删除失败。
2. MySQL索引通常使用B+树，叶子节点按顺序连接，适合范围查询；设计索引时结合选择性、最左匹配原则和执行计划，避免无效索引与回表开销。

---
title: 深轻科技 Java后端一面
company: 深轻科技
position: Java后端
round: 一面
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/927618502473547776
tags: ["Java", "Redis", "MySQL", "RabbitMQ", "WebSocket"]
---

### 《面试题目》

1. ArrayList 和 LinkedList 有什么区别？
2. Redis 有哪些基本数据结构？
3. Spring Boot 启动流程是什么？
4. 为什么要分库分表？如何实现？
5. Disruptor 在项目中如何使用？
6. Java 线程池有哪些拒绝策略？
7. Java 的线程同步机制有哪些？
8. equals 和 hashCode 有什么区别？
9. MySQL 为什么使用 B+树而不是哈希表？
10. 乐观锁和悲观锁有什么区别？
11. MD5 加盐存储密码有哪些安全问题？
12. Java 堆内存溢出如何排查？

### 《参考解析》

ArrayList 随机访问快但中间插入成本高，LinkedList 插入需先定位节点且缓存局部性较差。B+树的叶子链表支持范围查询，哈希索引不适合排序和范围扫描。密码存储不应只用 MD5，应使用带随机盐的慢哈希算法。堆溢出排查要结合堆转储、对象占用、GC 日志和增长趋势定位泄漏或分配峰值。

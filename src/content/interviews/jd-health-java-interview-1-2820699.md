---
title: 京东健康Java开发一面面经
company: 京东健康
position: Java开发
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","Redis","MySQL","Elasticsearch","Spring","线程池"]
summary: "京东健康Java开发一面面经，重点考察Redis分布式锁、一致性哈希、MySQL与Redis区别、JVM老年代内存分配机制及线程池核心参数配置等高频Java后端面试题。"
---

### 面试题目
1. 为什么喜欢java开发
2. 项目是开源的吗
3. Redis适合的场景
4. Redis vs Mysql
5. Redis如何实现分布式锁
6. 一致性哈希算法
7. Elasticsearch
8. spring 注入对象 用什么注解注入
9. 什么样的对象会直接进入到老年代？
10. 定义线程池的核心参数，核心线程数是4，最大线程数是8，什么时候起第五个线程池？（配合无界队列）
11. 有没有遇到过包冲突的问题
12. 写代码有没有用过通义灵码

---

### 参考解析

**1. Redis如何实现分布式锁**：通常使用 `SET key value NX PX milliseconds` 命令，利用其原子性实现加锁，并设置过期时间防止死锁。释放锁时需校验 value，确保删除的是自己持有的锁。

**2. Redis vs MySQL**：Redis 是内存型 KV 数据库，支持高并发读写，适合缓存和高性能计算；MySQL 是关系型数据库，基于磁盘存储，支持 ACID 特性和复杂 SQL 查询，适合持久化核心业务数据。

**3. 什么样的对象会直接进入到老年代？**：大对象（如很长的字符串或数组）直接进入老年代以避免在新生代内存复制；长期存活的对象（经历多次 Minor GC 后年龄超过阈值）；或在 Survivor 区相同年龄对象大小之和大于 Survivor 区一半时，大于该年龄的对象直接进入。

**4. 线程池参数与执行逻辑**：核心参数包含 corePoolSize、maximumPoolSize、keepAliveTime、workQueue 等。若使用无界队列，当核心线程满时，任务会进入队列，因此最大线程数设置将失效，永远不会启动第五个线程。
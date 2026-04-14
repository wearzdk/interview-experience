---
title: 恒生电子 Java 开发一面面经
company: 恒生电子
position: Java开发
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Redis","Elasticsearch","多线程","并发控制"]
summary: "恒生电子Java开发一面面试经验分享。面试时长约20分钟，重点考察Redis缓存与分布式锁（看门狗机制）、Elasticsearch索引创建与同步策略，以及Java多线程并发控制等核心后端技术，适合后端开发求职者参考备考。"
---

### 面试题目

1. Redis相关：Redis缓存的应用场景、分布式锁实现、Redis分布式锁的看门狗（Watchdog）机制。
2. Elasticsearch：Elasticsearch索引的创建过程、定时同步策略。
3. 并发编程：Java线程池的参数与原理、多线程并发控制方案。

---

### 参考解析

1. **Redis分布式锁与看门狗**：分布式锁用于解决集群环境下的资源竞争。看门狗（Redisson实现）通过后台定时任务自动延长锁的过期时间，防止业务执行时间超过过期时间导致锁提前释放。

2. **Elasticsearch同步**：索引创建需考虑分片与副本配置。定时同步常用Logstash、Canal监听binlog或程序端定时任务扫描数据库，将增量数据写入ES。

3. **线程池与并发控制**：线程池核心参数包括核心线程数、最大线程数、队列及拒绝策略。并发控制可通过synchronized、ReentrantLock锁机制，或JUC包下的信号量、原子类进行高效管理。
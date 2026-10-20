---
title: "东方财富 Java 开发一面面经"
company: "东方财富"
position: "Java开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/f5f6e17c6b064779be9121a88e771d1e
tags: ["Java", "Redis", "MySQL", "Kafka", "线程池", "Linux"]
summary: "东方财富 Java 一面，30 分钟无手撕，问缓存击穿、Redis 分布式锁、MVCC、HTTP/HTTPS、服务上线卡顿、Kafka 可靠性、死锁排查、文件句柄泄漏、3k 并发瓶颈、性能测试、InnoDB、线程池、ThreadLocal 和 Linux 命令。"
---

### 《面试题目》

1. 怎么处理缓存击穿？数据量很大时呢？
2. Redis 分布式锁怎么实现？
3. MySQL 的 MVCC 由哪些部分组成？
4. HTTP 和 HTTPS 有什么区别？HTTP 是怎么交互的？
5. 服务上线后访问量很大、卡住了，怎么办？
6. Kafka 怎么保证可靠性？
7. 死锁怎么排查？
8. 读文件忘记关闭导致卡住，怎么办？
9. 服务上线后 3k 用户可以正常使用，多一个就不行，怎么办？
10. 项目里怎么做性能测试？
11. InnoDB 和其他存储引擎有什么区别？
12. 线程池的参数介绍、运行流程？
13. ThreadLocal 介绍，有什么注意事项？
14. Linux 指令：怎么统计日志中指定单词的行数？怎么查端口占用？

### 《参考解析》

**缓存击穿**是热点 key 过期瞬间大量请求打到数据库，解决用互斥锁重建、逻辑过期、预热或永不过期；数据量大时先做热点探测和本地缓存，再对重建做单飞（singleflight），避免同一 key 并发回源。分布式锁用 `SET NX PX` 加唯一 value，Lua 释放，续期用看门狗。

**服务卡住**按“入口流量—线程池—下游—资源”排查：看 QPS、RT、错误率、线程池队列和活跃线程、GC、CPU、连接池、慢 SQL、下游超时；3k 能跑 3k+1 不行，往往是某个池子或连接数刚好打满（线程池、数据库连接、文件句柄、端口），也可能是限流阈值。先限流止血，再扩容或优化瓶颈。

**Kafka 可靠性**：生产端 `acks=all`、重试、幂等 producer；Broker 多副本、`min.insync.replicas`；消费端手动提交 offset，业务成功后再提交，失败重试加死信队列。死锁排查用 `jstack` 看线程状态和锁持有，或 `jcmd Thread.print`；文件句柄泄漏用 `lsof -p`、`/proc/<pid>/fd` 查，代码里用 try-with-resources。

**线程池**核心参数是核心线程数、最大线程数、队列、拒绝策略、空闲存活时间和线程工厂；任务先核心线程、再队列、再扩容到最大、最后拒绝。ThreadLocal 要为每个线程保存独立副本，用完 `remove()`，否则线程池复用会串数据/内存泄漏。Linux 统计单词行数用 `grep -c`，查端口用 `ss -lntp` 或 `lsof -i:端口`。

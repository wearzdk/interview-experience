---
title: "多益网络软件工程师一面"
company: "多益网络"
position: "软件工程师"
round: "一面"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/941032796443639808"
tags: ["多益网络", "Java", "MySQL", "Redis", "Spring", "Kafka", "幂等"]
summary: "多益网络软件工程师一面围绕项目深挖，技术题覆盖 MVCC、线程池、缓存一致性、Spring AOP、Redis 热 Key、幂等、隔离级别和 Kafka 积压。"
---

### 《面试题目》

1. 简单介绍简历上的项目。
2. MySQL 中 MVCC 是怎么实现的？快照读为什么通常不会阻塞写操作？
3. 线程池大小如何确定？
4. 缓存一致性如何解决？
5. Spring AOP 的底层原理是什么？
6. Redis 热 Key 和大 Key 会带来什么问题？线上怎么排查和治理？
7. 幂等如何设计？
8. MySQL 的隔离性如何实现？
9. Kafka 为什么吞吐量高？消息积压时怎么排查？
10. Web 开发中需要注意哪些安全问题？
11. Java 中 synchronized 和 ReentrantLock 的底层实现有什么差异？

### 《参考解析》

MVCC 的核心是隐藏事务字段、undo log 版本链和 Read View。快照读读取的是符合可见性规则的历史版本，所以通常不需要给目标记录加共享锁；当前读如 select for update、update、delete 才需要读最新版本并加锁。回答时要区分 RC 每条语句生成 Read View、RR 复用第一次快照读的 Read View。

线程池大小不能只套公式。CPU 密集型任务接近核数，I/O 密集型可以按等待时间与计算时间之比放大，但最终受数据库连接池、下游承载和队列长度约束。线上要看 activeCount、queueSize、rejectCount、P99 和 CPU，而不是只看线程数。

缓存一致性推荐 Cache Aside：读未命中回填，写先更新数据库再删除缓存。删除失败要重试或用 binlog 补偿，延迟双删只能缩小窗口，不能承诺强一致。AOP 要讲 BeanPostProcessor 创建代理、JDK 动态代理与 CGLIB 的选择，以及 this 调用绕过代理的经典问题。

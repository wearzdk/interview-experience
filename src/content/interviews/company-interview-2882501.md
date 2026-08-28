---
title: "浩鲸科技日常一面"
company: "某公司"
position: "Java后端开发工程师"
date: '2026-08'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2882501
tags: ["Java","Redis","RabbitMQ","Spring","并发","分布式系统"]
summary: "某公司Java后端开发工程师面试记录，覆盖Java、Redis、RabbitMQ、Spring等考点，整理了面试流程与高频问题。"
---

### 《面试题目》

1. 介绍一下Java中的集合。
2. 讲一下Hashmap的get与put流程。
3. 介绍一下Hashmap的扩容机制，什么时候树化。
4. Hashmap的负载因子是多少，什么情况下需要去调整负载因子。
5. Concurrenthashmap的实现机制。
6. Arraylist与Linkedlist的区别。
7. 创建线程的几种方式。
8. 类的加载流程。
9. 介绍一下springmvc。
10. springboot开发一个web接口时的常用注解。
11. 介绍一下Redis的基本数据类型。
12. 讲一下缓存穿透，缓存雪崩，缓存击穿。
13. rabbitmq的优点在哪里（因为项目中写到用了rabbitmq）。
14. 怎么解决缓存与数据库的一致性。
15. 场景题：a服务的数据做了变更，怎么样保证b服务当中的数据也同步更新。
16. 介绍一下分布式锁。
17. 介绍一下Java操作Redis时使用的序列化器。
18. 没问项目，全是八股。面试官还是很好的，卡壳的时候他会主动引导你。

### 《参考解析》

1. Redis常用于缓存、分布式锁和计数。缓存与数据库更新通常采用“先写数据库、再删除缓存”，并通过重试、延时双删或消息补偿处理删除失败。
2. 并发问题应先明确共享状态和一致性边界，再选择锁、CAS或队列。线程池需要根据任务是CPU密集还是IO密集设置核心线程数、队列容量和拒绝策略，并监控活跃数与队列长度。

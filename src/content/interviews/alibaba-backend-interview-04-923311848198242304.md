---
title: 阿里后端开发面经04
company: 阿里巴巴
position: 后端开发工程师
date: '2025-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/923311848198242304
tags: ["Java", "异常处理", "HashMap", "ConcurrentHashMap", "Kafka", "分布式"]
summary: "阿里后端开发面试，集中考察 Java 异常体系、集合容器的线程安全、分布式框架，以及 Kafka 消息处理和重复消费治理。"
---

### 《面试题目》

1. Java 异常体系的继承结构是怎样的？
2. 日常开发中应如何处理异常？有哪些基本原则？
3. 设计服务接口时，应如何划分异常类型并制定处理方式？
4. Throwable 体系中的 Error 通常在什么情况下产生？
5. HashMap 和 TreeMap 有什么区别？
6. HashMap 的 key 为 null 时如何处理？哈希值是如何计算的？
7. ConcurrentHashMap 能存储 null 吗？为什么？
8. ConcurrentHashMap 和 Hashtable 有什么区别？
9. HashMap 的线程不安全体现在哪里？多线程操作时可能出现什么情况？
10. 你使用过哪些分布式框架？
11. 你使用过哪些消息队列？Kafka 的工作流程是怎样的？
12. 如何保证消息不被重复消费？
13. 哪些情况会导致消息重复消费？

### 《参考解析》

**1. Java 异常体系**：Throwable 分为 Error 和 Exception。Error 通常表示 JVM 或运行环境的严重问题；Exception 又分为需要显式处理的受检异常和 RuntimeException 体系的非受检异常。业务代码应在能够恢复、补偿或补充上下文的边界处理异常。

**2. 接口异常设计**：区分参数错误、认证授权、资源状态、业务冲突和系统故障，映射为稳定的错误码与 HTTP 状态。日志中保留完整异常和请求标识，对用户只返回必要信息；无法恢复的异常继续向上抛出，避免吞错。

**3. ConcurrentHashMap 禁止 null**：并发读取中，返回 null 需要明确表示 key 不存在；若允许 null value，就无法在一次无锁读取中区分“不存在”和“值为 null”。Hashtable 同样不允许 null，但主要依靠方法级 synchronized，ConcurrentHashMap 的并发粒度和扩展性更好。

**4. Kafka 重复消费**：消费者处理完成但提交位点前崩溃、重平衡或提交失败，都可能让消息再次投递。业务侧应使用唯一事件 ID、数据库唯一约束或幂等状态表保证重复执行无副作用，并合理协调业务提交与位点提交的顺序。

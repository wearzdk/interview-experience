---
title: 乐信科技 Java后端一面面经
company: 乐信科技
position: Java后端
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Java","RocketMQ","JVM","Spring","RAG"]
summary: "乐信科技Java后端一面面经，重点考察RocketMQ核心原理与重试机制、JVM性能调优与CPU高负载排查、Java锁升级机制、Spring多数据源切换实现，以及大模型应用开发与RAG检索技术，涵盖Java后端高频核心考点。"
---

### 《面试题目》

**一面：**

1. 实习经历深挖 + 八股文。
2. RocketMQ作为消息队列，它的核心组件和运行原理是怎样的？
3. Broker的作用是什么？对应的topic呢？
4. 消费失败后，后续的重试机制是怎样的？比如重试次数、间隔时间。
5. 假如JVM出现CPU占用率比较高的情况，你怎么排查？
6. 打印JVM堆快照用什么命令？
7. Java的锁升级过程是怎样的？
8. 锁信息是怎么存储的？存在哪个对象里？
9. 在Spring框架下，要连接两个数据库实例（比如主从库），怎么实现数据源切换？
10. 你现在编程时会用什么AI代理或大模型？
11. 自己做过RAG智能体的检索功能吗？用什么代码编写的？
12. 对接的是什么AI能力？用的哪个Agent？

---

### 《参考解析》

1. **RocketMQ核心组件**：主要包含NameServer（注册中心）、Broker（消息存储与转发）、Producer（生产者）和Consumer（消费者）。原理是通过NameServer管理Broker集群，实现负载均衡与路由寻址。
2. **消费重试机制**：RocketMQ默认有16个重试等级（10s, 30s, 1m...2h）。消费失败后消息进入重试队列（%RETRY%Group），达到最大次数后进入死信队列（DLQ）。
3. **CPU高负载排查**：使用`top`定位高CPU进程，`top -Hp pid`定位线程，`jstack`导出线程栈分析热点代码，或使用`arthas`的`thread`命令直接查看。
4. **JVM堆快照命令**：使用`jmap -dump:format=b,file=heap.hprof <pid>`命令生成快照文件，后续通过MAT或VisualVM进行内存分析。
5. **锁升级过程**：Java对象头包含Mark Word，锁升级遵循：无锁 -> 偏向锁 -> 轻量级锁 -> 重量级锁。升级是为了减少获取锁带来的性能开销。
6. **多数据源切换**：在Spring中通常利用`AbstractRoutingDataSource`，通过重写`determineCurrentLookupKey`方法，结合AOP注解标记当前线程应使用的数据源Key，实现动态切换。
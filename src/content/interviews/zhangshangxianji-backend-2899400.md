---
title: 掌上先机后端开发一面面经
company: 掌上先机
position: 后端开发工程师
round: 一面
date: '2026-07'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2899400
tags: ["Java", "JVM", "MySQL", "Spring Boot", "并发编程"]
summary: "掌上先机后端开发一面面经，考察 Java 集合与并发、线程池、JVM 垃圾回收、MySQL 索引、HTTP 与 Spring 循环依赖。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 介绍一下实习经历及承担的工作。
3. MongoDB 在项目中起到了什么作用？
4. Java 中常用的数据结构有哪些？
5. 单列集合和双列集合分别有什么特点？
6. 数组和链表各有什么优缺点？
7. ArrayList 是线程安全的吗？
8. ConcurrentHashMap 的底层原理是什么？
9. 线程池有哪些核心参数？
10. JVM 的内存结构是怎样的？
11. 常见的垃圾回收算法有哪些？
12. HTTP 和 HTTPS 有什么区别？
13. MySQL 索引有哪些类型？
14. 哪些场景会导致索引失效？
15. Spring Boot 如何解决循环依赖？
16. 你使用过哪些 JDK 21 新特性？
17. 你有什么想了解的问题？

### 《参考解析》

**1. ArrayList 的线程安全性**：ArrayList 本身不保证线程安全。多线程同时修改时可能出现数据覆盖、数组越界或读取到不一致状态。需要并发读写时，可根据场景使用外部锁、`Collections.synchronizedList` 或更适合读多写少场景的 `CopyOnWriteArrayList`。

**2. ConcurrentHashMap 原理**：JDK 8 中，ConcurrentHashMap 采用数组、链表和红黑树组织数据。读操作通常不加锁；写入空桶时使用 CAS，桶内发生冲突时使用 `synchronized` 锁住桶首节点，将锁粒度控制在单个桶级别。扩容时多个线程还可以协助迁移数据。

**3. 线程池核心参数**：`corePoolSize` 和 `maximumPoolSize` 控制线程数量，`keepAliveTime` 决定非核心线程的空闲存活时间，`workQueue` 保存待执行任务，`threadFactory` 创建线程，`handler` 定义队列和线程数均达到上限后的拒绝策略。

**4. MySQL 索引失效**：常见原因包括未满足联合索引最左前缀、在索引列上执行函数或隐式类型转换、使用前导通配符、对索引列进行运算，以及优化器判断全表扫描成本更低。是否真正使用索引应以 `EXPLAIN` 的执行计划为准。

**5. Spring 循环依赖**：Spring 对单例 Bean 的属性注入循环依赖可通过三级缓存提前暴露对象引用解决，其中三级缓存还能在需要时生成代理对象。构造器循环依赖无法靠该机制解决，原型 Bean 的循环依赖也不受支持；更根本的处理方式是拆分相互依赖的职责。

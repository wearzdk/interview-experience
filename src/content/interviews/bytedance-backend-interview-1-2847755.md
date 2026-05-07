---
title: 字节跳动 中国交易与广告后端一面面经
company: 字节跳动
position: 后端开发工程师
round: 一面
date: '2026-05'
source: 牛客网
tags: ["Java","JVM","MySQL","Redis","并发编程"]
summary: "字节跳动中国交易与广告后端一面面经。面试涵盖Java基础、集合框架源码、JVM垃圾回收、并发编程（CAS与锁）、MySQL索引与事务机制、Redis应用及计算机网络知识，并包含二叉树路径总和算法题。"
---

### 面试题目

**1. Java 基础与集合**
- JDK与JVM的关系；基本数据类型long字节数；Integer与int的对比；泛型与基本类型约束；抽象类与接口的区别及应用场景。
- 泛型及反射原理与应用场景。
- ArrayList与LinkedList底层数据结构及时间复杂度；HashMap底层实现（Java 17版本）。
- 集合的线程安全性；脏数据定义；ArrayList实现线程安全的方法（及CAS与乐观锁深挖）。

**2. JVM与底层原理**
- Java 17的GC算法；对象回收判定机制。

**3. 网络与交互**
- 前后端交互协议；前端访问后端服务的路径（DNS/TCP/HTTP等）；SSE与TCP流式传输的区别。

**4. 数据库与缓存**
- MySQL索引分类、B+树结构及索引用途；数据库事务特性（原子性、隔离级别、undo log回滚机制及宕机恢复）。
- Redis数据结构、key-value设计及操作复杂度；MQ使用场景。

**5. 手撕算法**
- LeetCode 437：二叉树路径总和。

---

### 参考解析

- **抽象类 vs 接口**：抽象类是对对象的抽象（is-a关系），接口是对行为的抽象（can-do关系）。接口不支持状态保存，且Java 8后支持默认方法，在多重继承需求下接口更灵活，但无法完全取代抽象类（如需维护状态属性）。
- **HashMap (Java 17)**：底层采用数组+链表+红黑树。插入与查找在负载因子合理下平均时间复杂度为O(1)，退化为链表为O(n)，转化为红黑树后为O(log n)。
- **CAS实现线程安全**：CAS（Compare-And-Swap）包含内存值V、预期原值A和新值B。若V==A，则将V改为B。对于ArrayList，CAS无法直接处理数组扩容，通常需要结合ReentrantLock或使用CopyOnWriteArrayList。
- **MySQL事务回滚**：原子性依赖undo log。undo log记录了数据修改前的镜像。若事务失败，MySQL根据undo log将数据回滚至初始状态；若宕机，恢复后通过redo log重做已提交事务，并通过undo log清除未提交的脏数据。
- **SSE vs TCP**：SSE（Server-Sent Events）基于HTTP协议，利用持久连接实现服务端向客户端推送，天然支持断线重连和浏览器兼容性；直接TCP需开发者自行处理粘包拆包、心跳检测和协议解析。
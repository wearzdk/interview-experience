---
title: 转转春招Java一面面经
company: 转转
position: Java开发工程师
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","并发编程","MySQL","Redis","Spring"]
summary: "转转春招Java一面面经，重点考察HashMap底层原理、线程池、ConcurrentHashMap锁机制、MySQL索引优化与事务隔离、Redis缓存一致性及Spring循环依赖。包含两道经典算法题，覆盖Java基础八股与数据库核心知识。"
---

### 《面试题目》

**Java基础**
1. Java 的 HashMap 数据结构能简单描述一下吗？
2. JDK1.8 的 HashMap 为什么要引入红黑树？
3. 为什么不直接用红黑树，还要保留链表？
4. HashMap 树化阈值为什么是 8 和 64 这两个数字？
5. HashMap 是线程不安全的，体现在哪里？为什么说它线程不安全？
6. 有哪些线程安全的 Map 实现？
7. ConcurrentHashMap 是怎么实现线程安全的？
8. JDK1.8 的 ConcurrentHashMap 中，synchronized 锁应用在什么地方？

**并发编程**
1. Java 线程池有哪些常用参数？有哪些应用场景？
2. 线程池在提交任务的过程中，创建线程、处理任务队列的完整流程是什么？
3. 并发编程里的 volatile 关键字是做什么用的？使用场景是什么？
4. volatile 是怎么实现可见性的？底层原理有了解吗？
5. synchronized 和 ReentrantLock 有什么区别？分别在什么场景下使用？
6. synchronized 和 ReentrantLock 都是可重入的吗？
7. Java 常见的垃圾回收器有哪些？分别有什么特点？

**数据库与中间件**
1. Mysql 的索引结构是什么？简单描述一下。
2. 线上碰见过 SQL 慢查询的情况吗？怎么处理？
3. 有哪些场景会导致索引失效？
4. Mysql 的事务隔离级别有几种？
5. Mysql 的事务隔离级别是通过什么手段实现的？
6. 可重复读隔离级别是怎么实现的？
7. 聊一下 Redis 缓存穿透、缓存雪崩、缓存击穿三个概念的区别，以及对应的预防方案。
8. 怎么保证 Redis 里的缓存数据和 Mysql 的数据一致性？
9. RabbitMQ 是怎么实现顺序消费的？
10. Spring 是怎么解决循环依赖的？

**手撕代码**
1. 实现无序数组排序，要求奇数在前，偶数在后。
2. 不使用 JDK 内置 API，实现字符串 "123" 转成数值 123。

---

### 《参考解析》

1. **HashMap树化原因**：为了防止哈希冲突导致的链表过长（O(n)），红黑树能将查询复杂度降至O(log n)。保留链表是因为红黑树节点较大，小规模数据下链表遍历性能更优。
2. **ConcurrentHashMap实现**：JDK1.8采用CAS+synchronized，锁粒度为Node数组的头节点，大大提高了并发性能。
3. **Volatile底层**：通过内存屏障（Memory Barrier）禁止指令重排，并强制要求线程从主存读写变量，确保可见性。
4. **MySQL可重复读实现**：依靠MVCC（多版本并发控制）和Read View（读视图），在事务开启时生成快照，确保读取历史版本数据。
5. **Spring循环依赖**：通过三级缓存机制（DefaultSingletonBeanRegistry），在Bean实例化后先放入三级缓存（ObjectFactory），完成属性注入后再移动到一级缓存，从而在引用时通过半成品Bean解决。
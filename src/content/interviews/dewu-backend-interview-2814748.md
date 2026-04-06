---
title: 得物2026春招后端开发面试经验
company: 得物
position: 后端开发
date: '2026-03'
source: 牛客网
tags: ["Java","并发编程","JVM","MySQL","Redis"]
summary: "得物2026春招后端开发面试经验分享，涵盖Java基础（HashMap、并发）、JVM内存模型与垃圾回收、MySQL索引与事务、Redis缓存穿透/击穿/雪崩处理、分布式锁及接口限流等核心面试考点，助力后端求职备考。"
---

### 面试题目

**一、Java基础**
1. HashMap底层原理
2. ConcurrentHashMap 1.7和1.8区别
3. ArrayList和LinkedList区别
4. String、StringBuilder、StringBuffer

**二、并发编程**
5. synchronized底层实现
6. ReentrantLock和synchronized区别
7. 线程生命周期
8. 死锁四个必要条件

**三、JVM**
9. JVM内存模型
10. 垃圾回收机制
11. 常见垃圾收集器

**四、计算机基础**
12. TCP三次握手、四次挥手
13. HTTP和HTTPS区别
14. MySQL索引
15. MySQL事务ACID

**五、项目与场景**
16. 接口限流方案
17. 分布式锁实现
18. Redis缓存问题

---

### 参考解析

1. **HashMap**: 1.8采用数组+链表+红黑树，链表长度>8且数组长度>=64转红黑树。扩容因子0.75，扩容为原大小2倍。
2. **ConcurrentHashMap**: 1.7用Segment分段锁，1.8优化为Node数组+CAS+synchronized，性能大幅提升。
3. **synchronized**: 锁升级过程为无锁->偏向锁->轻量级锁->重量级锁，以减少重量级锁带来的内核态切换开销。
4. **MySQL索引**: B+树结构，非叶子节点存索引，叶子节点存数据。最左匹配原则是联合索引查找的关键。
5. **Redis缓存问题**: 穿透用布隆过滤器拦截，击穿通过互斥锁保护数据库，雪崩通过过期时间随机化及集群容灾解决。
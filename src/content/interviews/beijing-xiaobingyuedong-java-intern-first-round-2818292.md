---
title: 北京小冰悦动科技Java实习一面面经
company: 北京小冰悦动科技有限公司
position: Java实习
round: 一面
date: '2026-03'
result: 通过
base: 北京
source: 牛客网
tags: ["Java","HashMap","MySQL","并发编程","事务"]
summary: "北京小冰悦动科技Java实习一面面经。面试考察重点包括HashMap底层原理与线程安全性、synchronized与ReentrantLock区别、JVM可见性、MySQL事务隔离级别、MVCC机制以及索引最左前缀匹配原则。时长20分钟，面试半小时后即获通过。"
---

### 面试题目
1、hashMap
2、存入1 3 16 4 hashmap底层是怎么操作的
3、为什么hashmap不是线程安全的
4、synchronized和retunlock的区别
5、可见变量的底层
6、事务隔离级别
7、可重复读是怎么实现的
8、什么是mvcc
9、最左前缀匹配原则是什么
10、为什么要最左前缀匹配

---

### 参考解析
1. **HashMap底层与线程安全**：HashMap基于数组+链表/红黑树实现。非线程安全是因为在多线程并发扩容时，链表可能形成环，导致死循环；同时多线程put操作会导致数据覆盖或丢失。
2. **synchronized vs ReentrantLock**：synchronized是JVM层面关键字，自动释放锁；ReentrantLock是API层面，支持公平锁、响应中断、尝试获取锁等高级功能，需手动解锁。
3. **可见性底层**：依靠JMM（Java内存模型）的volatile关键字。底层通过MESI缓存一致性协议，强制缓存失效并从主存重新加载数据。
4. **MySQL事务与MVCC**：可重复读通过MVCC（多版本并发控制）实现，利用隐藏字段（事务ID、回滚指针）和Undo Log版本链，配合ReadView实现快照读。
5. **最左前缀原则**：MySQL索引存储遵循最左匹配。如果查询从联合索引的最左边开始匹配，引擎会利用二分查找快速定位；跳过中间列会导致索引失效，本质是为了减少索引树的扫描范围。
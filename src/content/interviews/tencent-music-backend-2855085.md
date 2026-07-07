---
title: 腾讯音乐后台开发一面面经
company: 腾讯音乐
position: 后台开发工程师
round: 一面
date: '2026-05'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2855085
tags: ["JVM","MySQL索引","ConcurrentHashMap","B+树"]
summary: "腾讯音乐后台开发一面，围绕实习经历、G1回收算法、Netty、并发安全与HashMap底层原理，以及MySQL B+树索引前缀构建等基础知识展开。"
---

### 《面试题目》

1. 实习过程中解决了哪些问题？
2. G1 垃圾回收算法的原理是什么？
3. 了解 Netty 吗？
4. 异步 IO / IO 模型有哪些？
5. 线程安全问题有哪些？如何解决？
6. HashMap 和 ConcurrentHashMap 的区别？
7. 为什么 ConcurrentHashMap 更新时用 synchronized 而不是 CAS？
8. 线程共享的资源和不共享的资源分别有哪些？
9. JVM 内存模型是怎样的？
10. synchronized 的实现原理是什么？
11. MySQL 索引的数据结构是什么？怎么建立前缀索引？
12. B+树的结构是怎样的？叶子节点和非叶子节点分别存储什么？
13. B+树的时间复杂度是多少？B+树和红黑树的性能对比如何？
14. 建立联合索引时 B+树是什么样的结构？

---

### 《参考解析》

1. **G1 垃圾回收算法**：G1（Garbage-First）将堆划分为多个大小相等的 Region，不再严格区分连续的新生代/老年代物理空间，回收时优先选择垃圾对象最多、回收收益最大的 Region 进行（这也是"Garbage First"名字的由来）；G1 通过可预测的停顿模型，让用户指定期望的最大停顿时间目标，JVM 据此动态调整每次回收的 Region 数量，兼顾吞吐量和低延迟。
2. **ConcurrentHashMap 为什么用 synchronized 而不是纯 CAS 更新**：JDK 8 的 ConcurrentHashMap 在无冲突插入新桶时使用 CAS，但一旦发生哈希冲突需要在链表/红黑树上插入或修改节点时，会对链表头节点加 synchronized 锁——因为链表结构的修改涉及多个字段的联动变更，用 CAS 很难保证复合操作的原子性，而 synchronized 只锁定单个桶（而非整个 Map），锁粒度已经足够细，兼顾了正确性和并发性能。
3. **B+树相比红黑树更适合做数据库索引**：红黑树是二叉树，数据量大时树高会显著增加，磁盘 IO 次数（约等于树高）也随之增加；B+树是多路平衡树，每个节点可以存储更多的键，树的高度更矮胖，同样数据量下磁盘 IO 次数远少于红黑树；此外 B+树的所有数据都在叶子节点，且叶子节点间用链表相连，天然支持高效的范围查询，而红黑树不具备这个特性。

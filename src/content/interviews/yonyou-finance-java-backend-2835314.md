---
title: 北京用友金融-Java后端开发面经
company: 用友金融
position: Java后端开发
date: '2026-04'
result: 凉凉
base: 北京
source: 牛客网
tags: ["Java","SpringAI","MySQL","JVM","MongoDB"]
summary: "北京用友金融Java后端开发面试经验分享。面试主要考察Java基础八股、JVM内存模型、HashMap底层原理、MySQL隔离级别与B+树索引机制，同时结合AI应用开发项目（SpringAI、Pinecone向量数据库）进行深度拷打。适合准备后端岗位面试的求职者参考。"
---

### 面试题目

1. 自我介绍
2. 项目拷打：
   - 介绍项目及职责（股票智能体SpringAI）。
   - 长期记忆实现方案；高并发下的性能优化建议。
   - MongoDB存的是文本还是向量？（向量存储方案对比）。
3. 基础八股：
   - CAS机制：ABA问题及长时间自旋解决方案。
   - JVM内存模型、GC机制与垃圾回收器。
   - 对象创建流程。
   - Java容器：HashMap底层数据结构、红黑树原理；ArrayList与LinkedList的区别与选型；HashSet实现机制。
   - MySQL索引：B+树与B树的区别。
   - MySQL隔离级别：默认隔离级别、幻读解决方案（MVCC）。
4. AI应用相关：
   - Skills的使用场景与作用（流程封装、节约token）。
   - 如何确保Skill的稳定、安全与可靠？
5. 反问环节

---

### 参考解析

- **CAS与ABA问题**：CAS通过内存地址预期值比较进行原子更新。ABA问题可通过增加版本号（AtomicStampedReference）解决；长时间自旋可通过自适应自旋或放弃自旋进入阻塞队列。
- **HashMap红黑树**：当链表长度超过8且数组长度超过64时转红黑树，目的是将查找时间复杂度从O(n)降低到O(log n)，提升高冲突下的性能。
- **MySQL幻读解决**：在可重复读级别下，InnoDB通过MVCC（多版本并发控制）结合Gap Lock（间隙锁）和Next-Key Lock解决幻读问题。
- **ArrayList vs LinkedList**：ArrayList基于动态数组，随机访问快，尾部插入快；LinkedList基于双向链表，插入删除开销小。无限存数据通常用ArrayList，通过扩容机制保证顺序内存分布。
- **B+树 vs B树**：B+树非叶子节点不存数据只存索引，单节点能存更多索引，树更矮胖，磁盘IO次数少；且叶子节点通过双向链表连接，更适合范围查询。
---
title: 日常实习 后端AI开发面经
company: 用友
position: 后端AI开发
date: '2026-04'
source: 牛客网
tags: ["SpringAI","JVM","Java集合","MySQL","多线程"]
summary: "用友后端AI开发实习面试经验分享，考察重点包括SpringAI项目架构、长期记忆实现与优化、MongoDB向量存储、Java并发编程（CAS/JVM）、集合框架底层源码，以及MySQL B+树索引与隔离级别。涵盖从项目设计到计算机基础八股的全面考核。"
---

### 面试题目

1. 实习与项目拷打
   - 介绍项目，你的职责（股票智能体SpringAI）
   - 长期记忆如何实现？如果并发量上来了你怎么去优化？
   - MongoDB存的是文本还是向量？

2. 基础八股
   - CAS机制、会出现什么问题（ABA问题）、长时间自旋怎么解决？
   - JVM内存模型、垃圾回收机制、垃圾回收器。
   - 一个对象是如何创建的？
   - Java容器有哪些？
   - HashMap的数据结构？为什么使用红黑树？红黑树的原理？
   - ArrayList VS LinkedList（底层实现、操作复杂度、内存浪费）。如果要无限存数据，选哪个？为什么？
   - HashSet如何确保数据唯一？内部实现是什么？
   - MySQL底层数据结构 B+ 树 VS B树（稳定性、排序对比、B+树的大小）。
   - MySQL的默认隔离级别？如何解决幻读？

3. AI应用相关
   - Skills用过吗？有什么作用？
   - 写过SKILL吗？有什么注意事项？如何确保SKILL的稳定、安全和可靠？

---

### 参考解析

- **CAS与ABA问题**：CAS通过硬件原子指令实现，ABA可通过版本号（AtomicStampedReference）解决；长时间自旋消耗CPU，应配合短时间自旋后挂起线程或使用锁机制。
- **HashMap红黑树**：链表过长会导致O(n)查找，引入红黑树实现O(log n)查找。红黑树是自平衡二叉查找树，相比AVL旋转操作更少，适合读多写多的场景。
- **ArrayList vs LinkedList**：无限扩容建议用ArrayList，虽然扩容涉及数组复制，但内存紧凑且随机访问效率高；LinkedList指针节点占用额外内存，碎片化严重。
- **MySQL幻读解决**：默认隔离级别为Repeatable Read。通过MVCC（快照读）和Next-Key Lock（当前读，锁住索引记录及间隙）有效防止幻读。
- **AI Skill稳定/安全**：需进行提示词工程（Prompt Engineering）校验、参数校验、输出结果格式化检查（如JSON Schema），以及通过人机回环（Human-in-the-loop）确保关键操作的安全性。
---
title: 熙牛医疗Java后端实习一面面经
company: 熙牛医疗
position: Java后端实习
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Java","HashMap","ConcurrentHashMap","JVM","MySQL","线程池"]
summary: "熙牛医疗Java后端实习一面面经，面试官通过项目交流切入，重点考察Java核心技术（HashMap、线程池、AQS、锁升级）、MySQL事务隔离与慢SQL优化，以及JVM内存模型与垃圾回收算法。整体难度适中，偏重八股基础。"
---

### 面试题目

**一、项目相关问题**
面试官允许候选人从实习经历或项目中自选一个最具代表性的进行深度沟通。

**二、Java核心技术问题**
1. HashMap的数据结构是什么？
2. 与HashMap结构类似的线程安全类是什么？
3. ConcurrentHashMap和HashMap有什么不同？
4. 用过线程池吗？
5. 线程池的核心参数有哪些？
6. 线程池核心参数的作用是什么？
7. AQS框架是什么机制？
8. ReentrantLock是怎样的？
9. ReentrantLock怎么体现可重入性？
10. synchronized关键字的锁升级过程是怎样的？

**三、MySQL相关问题**
1. MySQL的事务隔离级别分哪些？
2. 不同隔离级别下会出现什么问题？
3. 出现慢SQL该怎么优化？
4. 表很大时该怎么处理？

**四、JVM相关问题**
1. 你对JVM了解多少？
2. JVM的内存模型是怎样的？
3. JVM中哪些区域是内存私有的？
4. JVM使用的垃圾回收器算法有哪些？
5. 对象的引用类型分哪些？
6. 不同引用类型的特点是什么？

---

### 参考解析

**Java核心：**
* **HashMap与ConcurrentHashMap**：HashMap是数组+链表+红黑树（JDK1.8），非线程安全；ConcurrentHashMap通过CAS+synchronized保证线程安全，在1.8中去掉了分段锁，锁粒度更细。
* **线程池核心参数**：corePoolSize（核心线程数）、maximumPoolSize（最大线程数）、keepAliveTime（空闲存活时间）、workQueue（任务队列）、handler（拒绝策略）。
* **锁升级**：synchronized从偏向锁 -> 轻量级锁（自旋） -> 重量级锁（OS互斥）逐级升级，目的是减少线程切换带来的系统开销。

**MySQL相关：**
* **事务隔离**：READ UNCOMMITTED（读未提交）、READ COMMITTED（读已提交）、REPEATABLE READ（可重复读，默认）、SERIALIZABLE（串行化）。对应解决脏读、不可重复读、幻读问题。
* **慢SQL优化**：检查索引是否失效、避免全表扫描、减少select *、利用explain分析执行计划、考虑分库分表或读写分离。

**JVM相关：**
* **内存私有区**：虚拟机栈、本地方法栈、程序计数器。这些区域随线程创建而创建，随线程销毁而销毁。
* **引用类型**：强（GC不回收）、软（内存不足回收）、弱（GC即回收）、虚（仅用于资源回收通知）。
* **垃圾回收算法**：标记-清除、标记-复制、标记-整理。现代GC器多采用分代收集理论。
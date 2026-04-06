---
title: 快手后端开发一面面经
company: 快手
position: 后端开发
round: 一面
date: '2026-03'
result: 通过（约二面）
source: 牛客网
tags: ["AI Agent","Redis","MySQL","Java并发","算法"]
summary: "快手后端开发一面面经，重点考察AI Agent项目实践、RAG技术链路及Java基础八股。涉及Redis高性能原理、MySQL联合索引与最左匹配、ThreadLocal内存泄漏、Synchronized与ReentrantLock区别，以及手撕算法：最长回文子串。"
---

### 面试题目

**项目经历**
1. Agent项目技术选型及其原因，是否了解Agent主流框架？
2. Agent的核心技术组成部分，详细描述执行链路。
3. 如何实现Skills逻辑，与企业级实现的差距分析。
4. 项目难点：以RAG（检索增强生成）为例阐述。
5. AI相关技术储备：如Openclaw、Transformer架构等。

**八股文**
1. Redis简介及为什么执行速度快？
2. MySQL索引机制：联合索引介绍，举例说明最左匹配原则。
3. Java中ThreadLocal的使用场景及原理。
4. ThreadLocal导致内存泄漏的原因及避免方式。
5. Synchronized关键字与ReentrantLock的区别。

**算法题**
1. 最长回文子串（LeetCode Hot100），采用中心扩散法，分析时间复杂度。

---

### 参考解析

1. **Redis为什么快**：基于内存操作；采用I/O多路复用模型；单线程避免了上下文切换和锁竞争；底层采用高效数据结构（如SDS、跳表）。
2. **MySQL最左匹配**：在联合索引(a, b, c)中，查询条件必须包含最左侧列才能触发索引。若查询条件为(b, c)则无法命中索引，因为索引树是按a进行排序存储的。
3. **ThreadLocal内存泄漏**：ThreadLocalMap的key是弱引用，当外部强引用置空后，key会被回收，但value仍被Entry强引用。解决方法是使用完后显式调用remove()方法。
4. **Synchronized vs ReentrantLock**：Synchronized是Java关键字，由JVM实现，自动释放锁；ReentrantLock是API层面的锁，支持中断响应、公平锁、读写分离和多条件Condition等待，需手动unlock。
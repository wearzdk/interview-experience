---
title: 携程暑期实习Java后端面经
company: 携程
position: Java后端开发
round: 一面、二面
date: '2026-04'
source: 牛客网
tags: ["Java","MySQL","Redis","JVM","线程池"]
summary: "分享2026年4月携程暑期实习Java后端面试经验。涵盖Java基础、JVM调优、MySQL索引优化、Redis缓存架构及线程池并发编程等核心技术点，并包含面试官对消息队列与大模型应用场景的深度提问，助你高效备战实习招聘。"
---

### 《面试题目》

**4.3 一面 (50min)**
1. 项目经历与深挖。
2. 数据库增删改查频繁时的处理方案。
3. JVM调优，OOM异常排查流程。
4. MySQL索引的作用，建立索引的准则及避坑指南。
5. 线程池的作用、核心参数、核心线程数设置、IO密集型 vs CPU密集型。
6. equals方法比较逻辑，重写equals为什么要重写hashCode。
7. 哈希表put元素的工作流程。
8. 如何利用AI辅助编程及Prompt Engineering技巧。
9. Redis单点热点访问处理方案。
10. Spring与SpringBoot的关系。
11. @Transactional注解失效场景及解决方案。
12. JDK新版本特性，虚拟线程（Virtual Threads）原理。
13. 手撕算法：动态规划爬楼梯。

---

**4.10 二面 (25min)**
1. 消息队列的使用场景、作用，为什么不能用线程池替代。
2. RocketMQ消息持久化原理。
3. Redis高性能原因。
4. Redis单节点QPS评估及依据。
5. Redis数据结构详解，重点考察ZSet底层实现及应用场景。
6. 线程池核心线程数设置，初始化加载与执行时创建的区别。
7. MySQL单表数据量瓶颈。
8. 垃圾收集器选择，G1 Region设置影响及GC调优。
9. Agent机制，短期/长期记忆实现，简历论文相关（CV与NLP关联）。

---

### 《参考解析》

1. **重写equals必重写hashCode**：为了保证HashMap等容器存储对象的正确性。若对象相等（equals为true），则其hashCode必须相等，否则相同的对象会被存放在不同的哈希桶中，导致查找失败。
2. **线程池核心线程数设置**：IO密集型建议设置为 2*CPU核数 或 核心数/(1-阻塞系数)；CPU密集型建议设置为 CPU核数+1，以减少上下文切换。
3. **@Transactional失效**：常见于方法内部调用（非代理调用）、非public方法、异常被try-catch吞掉、或者方法抛出的是检查异常（默认回滚运行时异常）。
4. **Redis ZSet底层**：主要由跳表（SkipList）和压缩列表（ZipList/Listpack）实现。元素较少时使用压缩列表节省空间，元素多时通过跳表实现O(logN)的查询效率。
5. **JVM G1调优**：G1通过划分Region进行管理。Region过小会导致频繁回收，过大会降低GC灵活性。调优核心在于平衡停顿时间（Pause Time）与吞吐量。
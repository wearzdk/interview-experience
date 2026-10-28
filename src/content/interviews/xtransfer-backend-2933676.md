---
title: "XTransfer 一面：Cap 理论、设计模式与 Redis、MySQL 基础"
company: "XTransfer"
position: "后端开发"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/b14f06bb8d6c490b8a5957da8b3211e5
tags: ["XTransfer", "后端开发", "CAP", "设计模式", "Redis", "MySQL"]
summary: "XTransfer 一面记录：面试官风格友好，实习经历要求用 STAR 法则讲清楚，技术题集中在 Cap 理论、设计模式、Redis 数据结构与 MySQL 事务隔离级别四个方向。"
---

### 《面试题目》

1. 用 STAR 法则讲一下你实习做的事情。
2. 讲一下 CAP 理论。
3. 说说你了解的设计模式。
4. Redis 有哪些数据结构？
5. MySQL 的事务隔离级别有哪些？

### 《参考解析》

**STAR 法则在这类面试里是硬要求，不是建议**。Situation（业务背景与要解决的问题）、Task（你的任务与目标）、Action（你做了什么，重点是你的判断而不是流程）、Result（结果，要有数字）。最容易失分的是 Action 讲成流水账、Result 只说「上线了」。有效的做法是给结果配一个对照——「原来 X，做完之后 Y」，哪怕是估算的量级也比没有强。

**CAP 理论要讲清「P 是必选项」这个前提**。Consistency（所有节点同一时刻看到同样的数据）、Availability（每个请求都能在有限时间内得到非错误响应）、Partition tolerance（网络分区时系统仍能继续运行）。三选二的真实含义是：网络分区不可避免，所以 P 必须保证，实际的选择是在分区发生时牺牲 C 还是 A。CP 系统（如 ZooKeeper、etcd）在分区时拒绝写入保证一致；AP 系统（如 Cassandra、Eureka）在分区时继续可用但可能读到旧数据。再往下可以补 BASE（基本可用、软状态、最终一致）作为 AP 的工程化延伸，以及「大部分业务系统实际选择最终一致 + 补偿」。

**设计模式要挑你真正用过的讲，并说清解决了什么问题**。面试官不爱听「23 种设计模式我背过」，爱听「这里用策略模式替换掉了 if-else 分支，新增一种策略不用改原有代码」。高频的几个：策略（替换条件分支）、工厂（对象创建与解耦）、单例（全局唯一资源，注意并发初始化）、观察者（事件通知）、模板方法（固定流程 + 可变步骤）、责任链（如拦截器链）、装饰器（在不改原类的前提下增强）。再加一句「过度使用设计模式会让代码更难懂」会显得成熟。

**Redis 的数据结构分两层**：对外暴露的类型有 String、List、Hash、Set、ZSet（有序集合）、BitMap、HyperLogLog、Geo、Stream；底层实现有 SDS（简单动态字符串）、双向链表、压缩列表/紧凑列表（listpack）、哈希表（dict）、跳表（skiplist）、整数集合（intset）、以及 quicklist（list 的底层是 quicklist，元素少时用 listpack）。面试常追问 ZSet 为什么用跳表而不是红黑树——跳表实现简单、范围查询方便、并发场景下更容易做无锁操作（Redis 本身是单线程处理命令，这一点在集群或新版本的多线程 I/O 上才有意义），以及按 member 查 score 是 O(1)（因为同时用了 dict 存 member→score 映射）。

**MySQL 的隔离级别有四个**：读未提交（Read Uncommitted，能读到别人未提交的数据，脏读）、读已提交（Read Committed，解决脏读，但有不可重复读）、可重复读（Repeatable Read，MySQL 默认，解决不可重复读，靠 MVCC 实现；理论上仍有幻读，InnoDB 用间隙锁在部分场景下解决）、串行化（Serializable，全部加锁，性能最差）。要能补一句实现机制：MVCC 靠 undo log 版本链 + ReadView 判断可见性，RC 与 RR 的区别在于 ReadView 的生成时机（每条语句 vs 事务开始时）。间隙锁只在 RR 下生效，这也是很多死锁的来源。

**这场的题量少、偏基础**，说明面试官在确认基本功而不是深挖。准备这类面试的性价比最高做法是把每个知识点准备到「能讲三层」：定义、实现机制、实际取舍。比如 Redis 数据结构不只是背九个类型，还要知道底层编码与转换条件（元素少且短时用紧凑结构，超过阈值转哈希表或跳表），这才是区分度。

---
title: 杭州小厂Java后端实习面经（2026.6.10）
company: 某杭州小厂
position: Java后端开发工程师（实习）
round: 一面
date: '2026-06'
base: 杭州
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2869010
tags: ["Java","集合框架","Redis","MySQL","RabbitMQ","线程池","设计模式"]
summary: "杭州小厂Java后端实习一面面经，涵盖Java集合（ArrayList/LinkedList/HashMap/ConcurrentHashMap）、线程池核心参数与执行流程、策略模式与简单工厂实战、Redis分布式锁与集群架构、MySQL索引失效与MVCC，以及对AI工具和RabbitMQ的经验考察。"
---

### 《面试题目》

1. 先介绍一下自己的情况、技能点和实习项目。
2. 上一段实习中负责了哪些内容，哪些地方做得比较好？
3. 短信模块优化是怎么做的，为什么要抽成独立服务？
4. 其他系统如何调用短信服务（RabbitMQ RPC / OpenFeign）？
5. Java 集合有哪些，分别适合什么场景？
6. ArrayList 和 LinkedList 的区别。
7. HashMap 的扩容机制、负载因子、链表转红黑树的条件是什么？为什么线程不安全？线程安全的集合有哪些？
8. ConcurrentHashMap 的使用场景。
9. 线程池有哪些核心参数？执行流程是什么？有哪些拒绝策略？
10. 实习中用过哪些设计模式？策略模式和简单工厂在数据文件解析中如何配合使用？
11. Redis 常见数据结构有哪些？分布式锁怎么实现？`SET NX` 的作用是什么？
12. Redis 主从、哨兵、Cluster 三种模式是否了解，有何区别？
13. MySQL 是否使用过？SQL 优化了解哪些？
14. EXPLAIN 有哪些关键字段，分别表示什么？`type` 字段中各个值的含义？
15. MySQL 索引会失效的情况有哪些？
16. MySQL 锁机制、MVCC 原理、默认隔离级别是什么？
17. 前端技术有所了解吗？HTML/CSS 掌握程度如何？
18. 是否使用过 AI 工具？做过哪些 AI 相关的小项目？
19. 上一段实习为什么结束？
20. 工作或协作中遇到过什么困难，如何定位线上 bug？
21. 有没有通过自己努力快速学习并达成目标的案例（如 RabbitMQ 的学习与应用）？
22. 反问：公司主要的业务方向是什么？
23. 反问：技术团队规模、系统方向和 AI 相关工作情况。

---

### 《参考解析》

**1. ArrayList 与 LinkedList 的核心区别**

ArrayList 基于动态数组，随机访问 O(1)，尾部追加均摊 O(1)，中间插入/删除 O(n)（需移位）；LinkedList 基于双向链表，头尾操作 O(1)，随机访问 O(n)。**经验法则**：大量随机读用 ArrayList；频繁在头部插入/删除、实现队列/双端队列时用 LinkedList（或用 `ArrayDeque` 替代）。

**2. HashMap 扩容与线程安全**

HashMap 初始容量 16，负载因子 0.75，链表长度 ≥ 8 且数组容量 ≥ 64 时转红黑树。扩容时容量翻倍，重新散列。线程不安全原因：并发 put 时 JDK8 尾插法不会成环，但两个线程同时写同一个桶可能互相覆盖导致数据丢失。线程安全选项：`ConcurrentHashMap`（推荐）、`Collections.synchronizedMap()`（性能差）、`Hashtable`（已淘汰）。

**3. 线程池核心参数与执行流程**

核心参数：`corePoolSize`（核心线程数）、`maximumPoolSize`（最大线程数）、`keepAliveTime`（非核心线程空闲存活时间）、`workQueue`（任务队列）、`threadFactory`（线程工厂）、`rejectedExecutionHandler`（拒绝策略）。

执行流程：任务来 → 核心线程未满则新建核心线程 → 核心线程满则入队 → 队满则新建非核心线程（直到 max） → max 也满则触发拒绝策略。四种拒绝策略：`AbortPolicy`（抛异常，默认）、`CallerRunsPolicy`（调用方线程执行）、`DiscardPolicy`（静默丢弃）、`DiscardOldestPolicy`（丢弃最旧的任务）。

**4. Redis 分布式锁实现**

基础方案：`SET lock_key value NX PX 30000`，即 NX（不存在才设置）+ PX（过期时间防死锁）原子命令。释放锁必须用 Lua 脚本保证「判断 owner + 删除」的原子性，防止误删他人锁。生产环境推荐 Redisson，内置 watchdog 自动续期，避免业务超时后锁提前释放。

**5. MySQL EXPLAIN 关键字段**

`type`（访问类型，性能从好到差）：`system > const > eq_ref > ref > range > index > ALL`；`key`（实际使用的索引）；`rows`（预估扫描行数，越小越好）；`Extra`（重要提示，`Using index` 表示覆盖索引，`Using filesort` / `Using temporary` 需重点优化）。

**6. MySQL MVCC 原理**

MVCC（多版本并发控制）通过 undo log 链 + ReadView 实现。每行数据有隐式的 `trx_id` 和 `roll_pointer`，修改时旧版本写入 undo log 形成版本链。读操作（快照读）根据事务的 ReadView 判断可见版本（RC 每次读生成新 ReadView，RR 只在事务开始时生成一次），避免加锁即可读取一致性数据。MySQL InnoDB 默认隔离级别是 **REPEATABLE READ（可重复读）**，通过 MVCC + 间隙锁解决了幻读。

---
title: "靖安科技全栈开发秋招：HashMap、Redis 与事务失效追问"
company: "靖安科技"
position: "全栈开发"
round: "笔试+一面"
result: "挂"
date: "2026-09"
source: "牛客网"
tags: ["Java", "HashMap", "MySQL", "Redis", "RocketMQ", "JVM", "Docker"]
summary: "靖安科技全栈开发秋招：9 月 16 日笔试、9 月 18 日一小时一面。八股覆盖 HashMap 与线程安全改造、MySQL 数据结构与慢查询定位、Redis 数据结构与分布式锁、RocketMQ 防重复消费、JVM 内存结构与 GC，随后是离职原因、项目推进等场景题，结尾还有 A 方法调用 B 方法时事务是否生效的经典陷阱；面试官额外追问了 C++ 与硬件接入经验，最终以技能与岗位有偏差被挂。"
---

### 《面试题目》

1. 自我介绍
2. 介绍一下 HashMap
3. 如果让你实现线程安全的 HashMap，你会怎么做？equals 方法比较的是什么？
4. MySQL 的数据结构是什么？
5. 让你定位慢查询 SQL，你会怎么做？
6. Redis 的基本数据结构和过期策略有哪些？
7. 如果让你用 Redis 实现分布式锁，你会怎么实现？
8. RocketMQ 怎么防止重复消费？
9. JVM 的内存结构是什么？
10. GC 算法有哪些？
11. 介绍一种你最熟悉的垃圾回收器
12. 什么情况会出现频繁的 Full GC？
13. 介绍一下 AOP 的作用
14. 你平时会怎么创建多线程？
15. 多线程的参数是怎么配置的，为什么这么配？
16. Linux 和 Docker 用过没有？
17. 将 Jar 包打成 Docker 镜像你会怎么做？
18. 为什么从上一家离职？
19. 介绍一下你实习期间主要做了什么
20. 实习期间遇到过最大的问题是什么，怎么解决的？
21. 前端出现了错误你会怎么排查？
22. 如果让你独立开发一个项目，整体流程你会怎么做？
23. 同一个 Service 类中，A 方法不加事务但 B 方法加事务，如果 A 方法调用 B 方法，那么事务会生效吗？
24. 反问：公司业务、实习生进去先接触什么？

### 《参考解析》

**1. 实现一个线程安全的 HashMap**。最稳的答案是直接用 `ConcurrentHashMap` 并说清它为什么快：JDK 8 之后它用 CAS + synchronized 锁单个桶头节点，锁粒度是桶而不是整表，读操作不加锁靠 volatile 保证可见性。如果非要自己造，最省事的是给整张表加一把 `ReentrantReadWriteLock`，读共享写独占——但扩容时读写必须互斥，并发度会掉得很厉害，所以要提一句可以只把锁加在桶上。`equals` 比较的是内容，`==` 比较的是引用；同时必须强调 `equals` 与 `hashCode` 的契约：两个对象 equals 相等则 hashCode 必须相等，否则哈希表会找不到键。

**2. 定位一条慢查询 SQL**。先确认它真的是慢，而不是被锁等住：看 `SHOW PROCESSLIST` 或者慢查询日志 `slow_query_log`，配合 `long_query_time` 和 `pt-query-digest` 排序出最耗时的语句。拿到语句后用 `EXPLAIN`（必要时 `EXPLAIN ANALYZE`）看 type、key、rows、Extra：出现 `ALL` 说明全表扫描，`Using filesort`、`Using temporary` 说明排序或临时表没走索引。常见修法是补联合索引并遵守最左前缀、避免在索引列上做函数或隐式类型转换、把 `SELECT *` 收敛到覆盖索引、大偏移分页改成基于游标的 `WHERE id > ?`。

**3. Redis 分布式锁的正确姿势**。加锁必须一条命令原子完成：`SET key value NX PX 30000`，value 放本次请求的唯一标识（比如 UUID），否则可能删掉别人的锁。解锁要用 Lua 脚本先比 value 再删，保证「判断 + 删除」原子。业务没跑完锁就过期是这方案的固有缺陷，续期要靠 Redisson 的看门狗定时续命，或者把过期时间估得足够保守。更严格的场景（比如要严格的互斥语义）应上 Redlock 或直接换 ZooKeeper、etcd，但也要点明 Redlock 在时钟漂移下的争议。

**4. 事务为什么会失效**。这题问的是 Spring AOP 代理：`@Transactional` 生效靠的是代理对象在方法入口开启/提交事务，而类内部方法直接调用走的是 `this`，根本没经过代理，B 上的注解自然不生效。正确做法是把 B 抽到另一个 Bean 里注入调用，或者注入自身代理（`AopContext.currentProxy()`）、用 `TransactionTemplate` 手动控制。顺带可以补其他失效场景：方法不是 public、异常被自己 catch 掉没抛出去、抛的是受检异常而默认只回滚 `RuntimeException` 和 `Error`、数据库引擎是 MyISAM。

**5. 频繁 Full GC 的排查路径**。先用 `jstat -gcutil <pid> 1000` 看老年代占用和 Full GC 频率，配合 GC 日志确认是老年代真的满了还是元空间 / 显式 `System.gc()` 触发。然后 `jmap -dump:format=b,file=heap.hprof <pid>` 导出堆，用 MAT 或 JProfiler 看支配树，找是谁在持有对象引用。典型原因：大对象直接进老年代、缓存无上限、ThreadLocal 里的 Entry 没清理、静态集合只增不减、内存泄漏导致对象无法回收。修法是先定位持有链而不是一味加大堆，堆越大一次 Full GC 停顿越久。

**6. 一面被挂的原因值得复盘**。原帖写到「基本都答出来」，但面试官后来追加问会不会 C++、有没有接触过硬件接入系统之类的项目，最后以「技能和岗位有偏差」结束。全栈岗常常隐含前后端甚至嵌入式之外的诉求，面试前把 JD 里的技术栈逐条对照自己的经历，对不上的地方准备一个能自圆其说的说法，比多背两道八股更有用。

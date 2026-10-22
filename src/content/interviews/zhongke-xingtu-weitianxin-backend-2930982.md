---
title: "中科星图维天信后端面经：SingleFlight 选举、脑裂防护与 JVM 基础"
company: "中科星图维天信"
position: "后端开发"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/3871d10e9786458faf95ad62c680f643
tags: ["中科星图维天信", "后端开发", "Redis", "Lua", "SingleFlight", "JVM", "MySQL", "并发编程"]
summary: "中科星图维天信后端面经：以 AI 在线面试平台的 SingleFlight 为主线，追问 Redis + Lua 选举、Redis 宕机后的本地降级、脑裂与令牌校验，再覆盖 ConcurrentHashMap、CAS 与 ABA、JVM 垃圾回收与内存区域、MySQL 执行计划与索引失效，最后是实习安排。"
---

### 《面试题目》

**项目与架构**

1. 请介绍一下你的 AI 在线面试平台项目，为什么需要设计 SingleFlight 机制？
2. 项目中是如何用 Redis + Lua 脚本实现 SingleFlight 的选举逻辑的？如何保证原子性？
3. 如果 Redis 宕机，你的 SingleFlight 机制会失效吗？你是怎么设计本地降级方案的？
4. 你的降级方案用到了 `CompletableFuture` 和 `ConcurrentHashMap`，为什么选它们？
5. 在 AI Agent 项目中，你是如何解决上下文治理、持久化存储和权限控制的？

**Redis 与分布式**

6. 什么是分布式脑裂问题？你的 SingleFlight 机制中是如何出现的？
7. 你提到的「分析 Token（令牌）」是怎么解决脑裂的？请详细描述校验流程。
8. 新接管者如何拿到合法操作权？原持有者写结果时如何被拦截？

**Java 并发编程**

9. `ConcurrentHashMap` 是如何保证线程安全的？
10. JDK 1.7 和 JDK 1.8 的 `ConcurrentHashMap` 实现有什么区别？
11. 什么是 CAS 乐观锁？它有什么缺陷？
12. 请解释 CAS 的 ABA 问题，以及如何解决？
13. CAS 自旋可能会带来什么风险？怎么缓解？

**JVM 与垃圾回收**

14. 你了解哪些 JVM 垃圾回收器？CMS、G1、ZGC 的演进核心目标是什么？
15. G1 回收器相比 CMS 有什么改进？是否完全消除了 Stop The World？
16. 请列举 JVM 中哪些区域会抛出 OOM？哪些不会？分别是什么场景？
17. 虚拟机栈会 OOM 吗？什么情况下会抛出 `StackOverflowError`？
18. 对象初始分配在哪儿？晋升到老年代的规则有哪些？
19. 动态年龄判定具体是怎么计算的？大对象如何直接进入老年代？

**MySQL 与索引优化**

20. 如何分析一条 SQL 的执行计划？怎么看是否命中索引？
21. 哪些情况会导致索引失效？请举例说明。
22. 为什么禁止 `SELECT *`？函数操作对索引有什么影响？
23. 当单表数据量过大时，你是怎么考虑的？分库分表在什么场景下使用？

**实习意向与综合**

24. 学校对跨省实习有什么政策？需要提交哪些材料？三方协议是必需的吗？
25. 你最快多久能到岗？实习时长大概多久？

### 《参考解析》

**为什么需要 SingleFlight**：AI 面试场景里，同一个会话的同一轮请求可能因为网络重试、前端重复提交、多个标签页同时打开而并发到达；如果每个请求都去调一次大模型，既浪费 token 又可能产生不一致的状态。SingleFlight 的目标是「同一 key 的并发请求只执行一次，其余等待并复用结果」，它解决的是重复执行，不是互斥访问——这是和分布式锁最容易被混淆的地方。

**Redis + Lua 的选举与原子性**：Lua 脚本在 Redis 里单线程原子执行，适合把「检查 + 抢占 + 写标记」合成一个操作。典型逻辑是：`if redis.call('exists', resultKey) then return redis.call('get', resultKey) end; if redis.call('set', lockKey, owner, 'NX', 'PX', ttl) then return 'owner' else return 'wait' end`。注意 SET NX PX 的原子性本身就够，Lua 的价值在于把「结果已存在就直接返回」和「抢锁」放在同一次执行里，避免检查与抢锁之间的竞态；返回值要能区分 owner、wait、已有结果三种状态。锁的 TTL 要覆盖执行时间并支持续约，否则执行到一半锁过期，第二个 owner 就会进来。

**Redis 宕机后的本地降级**：会失效，所以要有降级。单机用 `ConcurrentHashMap<String, CompletableFuture<Result>>` 做进程内合并：第一个请求 `putIfAbsent` 放入一个未完成的 Future 并执行，后来的请求拿到同一个 Future 等待；执行完 `complete`，再按需移除。选 `ConcurrentHashMap` 是因为它提供原子 `putIfAbsent`、读多写少性能好；选 `CompletableFuture` 是因为它能把「结果、异常、超时、回调」统一表达，等待方不需要自己维护条件变量。降级后只能保证单机去重，多实例之间仍会重复调用，要在入口加幂等键，并接受「降级期间成本上升、结果一致」的取舍。

**AI Agent 的上下文治理、持久化与权限**：上下文治理按「必须保留、可摘要、可检索、可丢弃」分层，按 token 预算压缩，保留决策与约束、丢弃原始工具输出；持久化把会话状态、消息、工具调用记录分开存，热状态放 Redis、冷快照放 MongoDB/对象存储，按 `sessionId` 建索引并设 TTL；权限控制做三层——用户能访问哪些会话（资源级）、Agent 能调用哪些工具（工具级）、工具能操作哪些数据（数据级），危险动作要人工确认并留审计日志。

**脑裂与令牌校验**：脑裂是网络分区或锁过期后，出现两个自认为合法的 owner 同时写同一份状态。SingleFlight 里常见于「owner 执行时间超过锁 TTL，新请求抢到锁成为新 owner，老 owner 醒来继续写结果」。解决思路是 fencing token：每次选举生成单调递增的 token（或用版本号），写结果时带上 token，存储端只接受不小于当前 token 的写入，旧 owner 的写会被拒绝。新 owner 拿 token 的流程是「抢锁成功 → 读取当前 token 并加一 → 把 token 写回 → 开始执行」；原 owner 写结果前先比较自己的 token 与存储里的当前 token，小于则放弃并记录被抢占。

**ConcurrentHashMap 1.7 与 1.8**：1.7 是 Segment 数组 + HashEntry 数组，每个 Segment 继承 `ReentrantLock`，锁粒度是段，并发度等于段数（默认 16），扩容在段内进行；1.8 取消 Segment，改成 Node 数组 + 链表 + 红黑树，空桶用 CAS 写入，桶内冲突用 `synchronized` 锁头节点，链表长度到 8 且数组长度到 64 时转红黑树，扩容支持多线程协同迁移（`ForwardingNode`）。size 统计 1.7 用多次尝试加锁兜底，1.8 用 `baseCount` + `CounterCell` 分散热点。

**CAS 的缺陷与 ABA**：CAS 是「比较内存值是否等于期望值，相等才写入」，由 CPU 指令保证原子性，失败通常自旋重试。缺陷有三个：ABA（值从 A 改回 A，CAS 认为没变过）、自旋开销（高竞争下大量空转）、只能保证单个变量的原子性。ABA 的解决办法是加版本号（`AtomicStampedReference`）或使用不可变对象；自旋风险用「限制次数 + 退避 + 升级为锁」缓解，高竞争场景直接用锁或 `LongAdder` 这类分散热点的结构。

**GC 的演进**：Serial（单线程、停顿长）、Parallel（多线程、吞吐优先）、CMS（并发标记清除、低停顿，但有碎片和并发模式失败）、G1（分 Region、可预测停顿模型、并发标记 + 混合回收）、ZGC（染色指针 + 读屏障，停顿与堆大小基本无关）。演进目标是从「吞吐优先」走向「低延迟 + 大堆」，CMS 已被废弃，G1 是默认选择，ZGC 适合超大堆和极低停顿要求。

**G1 与 STW**：G1 把堆分成大小相等的 Region，按回收价值排序（Garbage First），支持 `-XX:MaxGCPauseMillis` 的停顿目标；相比 CMS，它没有碎片问题（整体是复制/整理）、停顿可预测、支持大堆。它没有完全消除 STW：Young GC、Mixed GC 的初始标记和最终标记、以及对象复制阶段仍有停顿，只是把停顿拆小、可控。

**OOM 的区域**：会 OOM 的有堆（对象太多/泄漏）、元空间（类太多、动态代理、热部署）、直接内存（NIO、Netty 未释放）、本地方法栈（native 调用）、以及 GC 开销超限（`GC overhead limit exceeded`）。虚拟机栈不会抛 OOM 的常见说法不准确——栈帧过多会抛 `StackOverflowError`，而栈内存无法分配（如创建大量线程）会抛 `OutOfMemoryError: unable to create native thread`。程序计数器不会 OOM。

**对象分配与晋升**：对象优先在 Eden 分配（TLAB 内），经历一次 Minor GC 存活则进入 Survivor，年龄加一；默认年龄到 15 晋升老年代，或者 Survivor 中相同年龄对象总和超过一半时，大于等于该年龄的对象直接晋升（动态年龄判定）；大对象（超过 `-XX:PretenureSizeThreshold`）直接进老年代，避免在 Survivor 间反复复制。还有「分配担保」：Minor GC 前若老年代连续空间不足，可能直接触发 Full GC 或担保失败。

**执行计划与索引命中**：用 `EXPLAIN` 看 `type`（`const`/`eq_ref`/`ref`/`range`/`index`/`ALL`，越靠前越好）、`key`（实际用的索引）、`rows`（估算扫描行数）、`Extra`（`Using index` 覆盖索引、`Using filesort`、`Using temporary` 要警惕）。判断命中不是看 `key` 有值就够了，还要看 `rows` 是否明显小于总行数；必要时用 `EXPLAIN ANALYZE` 看真实执行时间。

**索引失效的常见场景**：对索引列做函数或表达式运算、隐式类型转换（字符串列传数字）、`LIKE '%xx'` 前导通配、联合索引不满足最左前缀、`OR` 两侧有一侧无索引、`!=`/`NOT IN` 导致优化器放弃索引、数据区分度太低（优化器认为全表扫描更便宜）、以及 `ORDER BY` 与索引顺序不一致。要注意「失效」有时是优化器的成本选择，不一定是语法问题。

**为什么禁止 `SELECT *`**：多读无用列会增加网络传输和内存；更关键的是破坏覆盖索引——原本可以只读索引就返回的查询，因为要取其他列而回表；另外表结构变更会让结果集不稳定。函数操作（如 `WHERE DATE(create_time) = ...`）会让索引列失去有序性，无法走索引，应该改成范围查询。

**大表与分库分表**：先做索引优化、SQL 优化、归档冷数据、读写分离、缓存，确认单表真的到瓶颈（通常千万级行、写入或扫描压力大）再考虑分表；分库分表会带来分布式事务、跨库 join、全局 ID、扩容迁移等复杂度，只有在单库容量或写入吞吐确实撑不住时才用。分片键要选查询必经且分布均匀的字段，避免热点。

**实习安排**：如实说明学校政策、能否跨省、需要哪些材料、三方是否必需；到岗时间和可实习时长给明确答案，如果有课程冲突，说明协调方案。

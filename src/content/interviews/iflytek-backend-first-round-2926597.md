---
title: "科大讯飞线下一面面经"
company: "科大讯飞"
position: "后端开发"
round: "一面"
date: '2026-10'
result: "已挂"
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/f5d9c82b29a24cac93b72f44b65836ea
tags: ["Java","Redis","缓存一致性","并发","AQS","CAS","HashMap"]
summary: "科大讯飞线下一面：问了很多实习相关的内容，技术问题集中在超时控制与失败重试的实现、Redis 数据结构与 hash/string 的区别、缓存一致性、线程安全、AQS 与 CAS，以及 HashMap 的线程安全性。作者结论是已挂。"
---

### 《面试题目》

1. 超时控制、失败重试是怎么做的？
2. Redis 你用了什么数据结构？
3. Redis 的 hash 和 string 有什么区别？
4. 缓存一致性怎么保证？
5. 线程安全怎么保证？
6. AQS 是什么？
7. CAS 是什么？
8. HashMap 线程安全吗？什么 Map 是安全的？
9. 方法内部多线程创建 HashMap 安全吗？

### 《参考解析》

**超时控制与失败重试**。超时控制要分层次设：客户端侧（连接超时、读超时）、网关与 RPC 框架侧（调用超时、熔断）、下游依赖侧（数据库慢查询超时、HTTP 客户端超时），层层收敛且上层的超时应该大于下层，否则会出现「我放弃了但下游还在执行」的浪费。实现手段：Java 里 `Future.get(timeout)`、`CompletableFuture.orTimeout`、Hystrix/Resilience4j 的 TimeLimiter、HTTP 客户端的 `connectTimeout`/`readTimeout`。失败重试的原则是「只对可重试的错误重试」：网络抖动、超时、5xx 可以重试；参数错误、鉴权失败、4xx 重试没意义。重试要限次数（常见 3 次）、用指数退避加随机抖动（避免重试风暴）、并且必须是幂等的（否则会重复下单、重复扣款），配合幂等键或去重表。再往上就是熔断（错误率超阈值直接快速失败）、降级（返回兜底数据）、以及隔离（线程池或信号量隔离，避免一个慢依赖拖垮整个应用）。

**Redis 里的数据结构与 hash/string 的选择**。常用结构及用途：string 做缓存值、计数器（`INCR`）、分布式锁；hash 存对象的多个字段（用户属性、配置项），可以只读写单个字段、节省 key 数量；list 做队列或最新列表；set 做去重与集合运算（共同关注、标签）；zset 做排行榜与延迟队列（score 用时间戳）；bitmap 与 HyperLogLog 做签到与 UV 估算。**hash 与 string 的核心差异**：string 存的是整块序列化后的值（比如一段 JSON），读一个字段要反序列化整个对象、改一个字段要整体覆盖写，适合小对象或整体读写；hash 把字段分开存，支持 `HGET`/`HSET` 单个字段的读写，改一个字段不必重写整个对象，也更省内存（小 hash 在元素少时用 ziplist/listpack 紧凑编码）。但要注意：大 hash（字段数极多）会变成 hashtable 编码、单个大 key 会阻塞 Redis，这就是「千万字段的大 hash 怎么处理」这类追问的来源——用 `HSCAN` 分批遍历、把大 key 拆分成多个小 key、或者把冷数据挪到其他地方。Redis 的底层编码会随元素数量与大小变化（`listpack` 与 `hashtable`/`skiplist`/`quicklist`），会看 `OBJECT ENCODING` 是加分项。

**缓存一致性**。先用「Cache Aside」说清常规做法：读时先读缓存、未命中读库并回填；写时先更新数据库、再删除缓存（而不是更新缓存）。为什么是删而不是更新：并发写时更新缓存会出现旧值覆盖新值；为什么先库后缓存：如果是先删缓存再更新库，中间有读请求会把旧值回填进缓存。仍有残留的不一致窗口，靠三样兜底：给缓存设过期时间（最终一致）、用消息队列或 binlog（Canal）订阅数据库变更去异步删缓存（重试到成功为止，避免删除失败造成长期脏数据）、对强一致要求的场景直接读写同一存储或加分布式锁。要能说出「延迟双删」的适用场景与它的局限（延迟时间难以确定）。

**线程安全与常用手段**。线程安全的前提是「多个线程同时访问同一份可变状态」。保证手段由粗到细：不改（不可变对象、只读数据）、不共享（ThreadLocal、每个线程一份副本、把共享数据收敛到单线程处理）、同步（`synchronized`、`ReentrantLock`、读写锁，注意锁的范围与顺序以避免死锁）、无锁（`Atomic*` 类、CAS 循环、`LongAdder`）、以及用并发容器（`ConcurrentHashMap`、`CopyOnWriteArrayList`、阻塞队列）替代自己加锁。答这类题最好配一个自己踩过的例子：比如多线程共享 SimpleDateFormat 会出现解析错乱，改用 `DateTimeFormatter` 或 ThreadLocal。

**AQS 与 CAS**。AQS（AbstractQueuedSynchronizer）是 JUC 里锁与同步器的基础框架，核心是「一个 volatile 的 state + 一个 CLH 双向队列 + 模板方法」：子类通过 `tryAcquire`/`tryRelease` 定义 state 的语义（比如独占锁的 state=1、共享锁或信号量的 state=许可数），获取失败的线程被包装成 Node 入队并 `LockSupport.park` 阻塞，释放时唤醒后继节点。理解 AQS 之后 `ReentrantLock`（独占、可重入，state 加计数）、`Semaphore`（共享、state 是许可数）、`CountDownLatch`、`ReentrantReadWriteLock` 就都能串起来。CAS（Compare And Swap）是一条 CPU 原子指令（x86 的 `cmpxchg`），语义是「如果内存中的值等于期望值就更新为新值并返回成功」，Java 通过 `Unsafe`/`VarHandle` 暴露。它做无锁并发的基础原语，`AtomicInteger`、`ConcurrentHashMap` 的空桶插入都用它。要能说出三个问题：ABA 问题（用 `AtomicStampedReference` 加版本号）、自旋开销（竞争激烈时 `LongAdder` 分段计数）、以及只能保证单个变量的原子性（多个变量要么封装成对象用 `AtomicReference`，要么还是加锁）。

**HashMap 的线程安全**。HashMap 本身不是线程安全的：并发 put 可能丢失更新、在 1.7 的扩容头插下甚至可能形成环形链表导致死循环（1.8 改成尾插缓解了这一点），`size` 计数也会不准。安全替代：`ConcurrentHashMap`（分段/CAS + synchronized 锁桶，读基本无锁，是首选）、`Collections.synchronizedMap`（全表一把锁，性能差，遍历要手动同步）、`Hashtable`（全表锁，已过时）。**「方法内部多线程创建 HashMap 安全吗」**这个追问要看是哪种情况：如果每个线程各自 `new` 一个局部 HashMap，那对象是线程私有的、不共享，安全；只有在多个线程**共享同一个** HashMap 实例时才不安全。如果局部 HashMap 被发布出去（放进静态字段、作为参数传给别的线程、被匿名内部类捕获后交给线程池），那就在事实上共享了，必须换成并发容器。这题考的就是「共享」这个前提有没有被想清楚。

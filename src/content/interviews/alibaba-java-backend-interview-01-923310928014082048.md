---
title: 阿里Java后端开发面经01
company: 阿里巴巴
position: Java后端开发工程师
date: '2026-06'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/923310928014082048
tags: ["Java", "JVM", "并发编程", "分库分表", "分布式事务", "秒杀系统"]
summary: "阿里Java后端面试，重点考察 HashMap 与并发容器、JVM 和 GC、AQS 与 ThreadLocal、分库分表、分布式事务，以及百万 QPS 秒杀系统设计。"
---

### 《面试题目》

1. HashMap 的底层原理和扩容机制是什么？为什么线程不安全？
2. ConcurrentHashMap 如何保证线程安全？JDK 7 与 JDK 8 的实现有什么区别？
3. JVM 内存区域如何划分？堆和栈有什么区别？
4. 什么情况下会发生 StackOverflowError 和 OOM？
5. 常见垃圾回收算法有哪些？CMS 和 G1 有什么区别？
6. 线上 Full GC 频繁时如何排查？
7. synchronized 和 ReentrantLock 有什么区别？
8. AQS 的原理是什么？
9. ThreadLocal 的原理是什么？为什么可能造成内存泄漏？如何解决？
10. CountDownLatch 和 CyclicBarrier 有什么区别？
11. 如何实施分库分表？分片键应该如何选择？
12. 数据迁移过程中如何保证一致性？
13. 如何处理分布式事务？Seata AT 模式和 TCC 模式有什么区别？
14. 如何设计秒杀系统的完整链路？
15. 秒杀系统如何限流、扣减库存并防止超卖？
16. 当 QPS 从 1 万增长到 100 万时，系统方案应如何调整？

### 《参考解析》

**1. ConcurrentHashMap 演进**：JDK 7 使用 Segment 分段锁；JDK 8 改为数组、链表或红黑树结构，结合 CAS 与桶首节点 synchronized 控制并发。读取通常无需加锁，复合更新应使用 `compute`、`putIfAbsent` 等原子方法。

**2. Full GC 排查**：先确认触发原因和停顿趋势，再结合 GC 日志、`jstat`、堆转储和对象分配监控判断是老年代增长、元空间不足、大对象、晋升失败还是显式 GC。找到主要持有链和分配热点后，再优化对象生命周期或调整收集器参数。

**3. ThreadLocal 泄漏**：ThreadLocalMap 的 key 是弱引用，但 value 是强引用。线程池线程长期存活时，key 被回收后 value 仍可能滞留；应在 `finally` 中调用 `remove()`，避免存放大对象，并控制线程和上下文的生命周期。

**4. 分库分表迁移**：分片键应覆盖主要查询路径并保持分布均匀。迁移可先复制存量数据，再通过变更日志同步增量，完成校验后切换路由；整个过程要保证幂等、可追踪，并对行数、校验和及核心业务结果进行对账。

**5. Seata AT 与 TCC**：AT 模式通过代理数据源和 undo log 自动回滚，接入成本低但依赖数据库事务与全局锁；TCC 需要业务实现 Try、Confirm、Cancel，改造成本更高，却能更精确地控制资源预留和补偿。

**6. 百万 QPS 秒杀**：需要把更多过滤前移到 CDN、网关和资格令牌层，按用户与商品分片，并用多级缓存和消息队列隔离突发流量。库存热点可分桶处理，核心链路保持最少同步依赖，同时建立降级、补偿和全链路容量压测机制。

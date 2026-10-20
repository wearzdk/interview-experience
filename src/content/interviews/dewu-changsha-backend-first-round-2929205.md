---
title: "得物长沙 后端 一面：Java 并发、Spring 与 MySQL 八股盛宴"
company: "得物"
position: "后端开发"
round: "一面"
date: '2026-10'
source: 牛客网
tags: ["Java", "并发", "Spring", "MySQL", "消息队列"]
summary: "得物长沙后端一面，2026-10-18，围绕线程池、ThreadLocal、ConcurrentHashMap、锁升级、Spring IOC/循环依赖、事务失效、MySQL 隔离级别、多级缓存和 MQ 可靠性展开。"
---

### 《面试题目》

1. 自我介绍。
2. 线程池有哪些核心参数？拒绝策略有哪些？
3. ThreadLocal 的实现原理是什么？子线程如何获取父线程上下文？在线程池中如何可靠地传递上下文？
4. HashMap 和 Hashtable 有什么区别？
5. ConcurrentHashMap 如何保证线程安全？JDK 1.8 之前是否已经存在？
6. Java 的锁升级机制是什么？
7. synchronized 和 ReentrantLock 有什么区别？公平锁、非公平锁是什么意思？
8. Spring IOC 如何实现？
9. Spring 如何解决循环依赖？构造器注入的循环依赖也能解决吗？
10. @Transactional 有哪些失效场景？
11. MySQL 有哪些事务隔离级别？默认是哪一级？RR 下如何处理幻读？
12. 联合索引的字段顺序如何设计？
13. 多级缓存是否同时使用 Caffeine 和 Redis？缓存分几层，和数据库之间的读取顺序是什么？
14. 场景题：一致性要求较高时，Redis 和数据库如何保持一致？
15. 如何保证 MQ 消息从发送到消费不丢失？
16. 平时如何使用 AI 编程？如何保证生成代码的质量？如何减少反复问答？

### 《参考解析》

**线程池与 ThreadLocal**：核心参数是核心线程数、最大线程数、空闲存活时间、时间单位、工作队列、线程工厂、拒绝策略。拒绝策略有 Abort、CallerRuns、Discard、DiscardOldest，以及自定义。线程数要按任务类型定：CPU 密集接近核数，I/O 密集可以按「核数 × (1 + 等待时间/计算时间)」估算，再压测修正。ThreadLocal 每个线程一个 ThreadLocalMap，key 是弱引用的 ThreadLocal，value 强引用；线程池复用线程必须 `remove()`。父子传递用 `InheritableThreadLocal`，线程池场景用 TTL 或显式传参。

**集合与锁**：HashMap 非线程安全、允许 null；Hashtable 方法加 synchronized、不允许 null，已过时。ConcurrentHashMap 1.8 用 CAS + synchronized 锁桶头，链表转红黑树，扩容多线程协助；1.7 是 Segment 分段锁。锁升级是从无锁到偏向锁、轻量级锁、重量级锁（新版本偏向锁已废弃），核心是减少无竞争场景的阻塞开销。synchronized 是 JVM 内置锁，自动释放；ReentrantLock 是 API 层，可中断、可超时、可公平、可多条件队列。

**Spring 与事务**：IOC 是 BeanDefinition 读取、实例化、属性填充、初始化、代理和放入单例池。循环依赖靠三级缓存解决，但构造器注入发生在实例化阶段，无法用提前暴露引用解决，所以会失败。`@Transactional` 失效常见于同类自调用、方法非 public、异常被吞、抛检查异常但没配 rollbackFor、事务传播配置错误、多数据源/多线程。MySQL 默认 RR，快照读靠 MVCC，当前读靠 next-key lock 处理幻读。

**缓存与 MQ**：多级缓存读取顺序是本地 Caffeine → Redis → DB，写路径先更库再删缓存，本地缓存靠广播失效。强一致场景不要靠缓存硬扛，可以用分布式锁、版本号、binlog 订阅或直接读主库。MQ 不丢要三段一起做：生产者确认与重试、Broker 持久化与多副本、消费者手动 ack + 幂等。AI 编程要限定上下文、给验收标准、先让模型出方案再改，生成后必须跑测试和 review。

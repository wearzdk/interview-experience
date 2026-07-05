---
title: 腾讯天美Java开发一面面经
company: 腾讯天美
position: Java开发工程师
round: 一面
date: '2026-07'
base: 江苏
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2870916
tags: ["Java","并发","HashMap","ConcurrentHashMap","Spring事务","算法"]
summary: "腾讯天美Java开发一面面经，涉及字符串转数值手撕题、HashMap与ConcurrentHashMap原理对比、并发计数场景设计，以及Spring事务注意事项与传播机制、AOP代理原理等考点。"
---

### 《面试题目》

1. 自我介绍
2. 手撕题目：字符串转数值，要考虑各种不合法问题、边界问题和特殊情况
3. 平时都是如何使用AI编程的，演示一下（面试官想看到使用 prompt、skill 这些）
4. HashMap 和 ConcurrentHashMap 的区别
5. ConcurrentHashMap 是如何平衡性能和安全的
6. Java 中锁的类型有哪些
7. 统计用户今日登陆次数，如何去实现？怎么控制并发问题？
8. springboot 中使用事务时候应该注意什么？应该怎么用？
9. springboot 中代理类的代理原理是什么？介绍一下两种代理模式
10. 事务传播机制介绍一下

---

### 《参考解析》

1. **HashMap 与 ConcurrentHashMap 的区别**：HashMap 非线程安全，多线程并发写可能导致死循环（JDK7）或数据丢失；ConcurrentHashMap 线程安全，JDK7 采用分段锁（Segment）降低锁粒度，JDK8 改为 CAS + synchronized 锁单个链表/红黑树头节点，进一步减少锁竞争。
2. **ConcurrentHashMap 如何平衡性能和安全**：JDK8 中 put 操作先尝试 CAS 无锁写入空桶位，只有发生哈希冲突时才对链表头节点加 synchronized 锁，锁的范围仅限于该桶而非整个表；size 统计用 CounterCell 分散计数减少热点竞争，这样在保证线程安全的同时把锁粒度降到最小，兼顾了高并发下的吞吐量。
3. **Java 锁的类型**：从实现层面可分为 synchronized（JVM 内置锁，可重入、非公平/依赖对象头）和 Lock 接口体系（ReentrantLock 可重入锁、ReentrantReadWriteLock 读写锁、StampedLock 乐观读锁）；从策略层面还可分为公平锁/非公平锁、悲观锁/乐观锁（CAS）、可重入锁/不可重入锁、共享锁/排他锁等。
4. **统计今日登陆次数的并发控制**：可用 Redis 的 `INCR` 对当天日期作为 key 做原子自增，天然避免并发计数丢失问题；若需要去重统计独立登陆用户，可用 `HyperLogLog` 或 `Bitmap`（按用户 ID 置位）实现近似或精确的去重计数，同时设置合理的 key 过期时间做每日重置。
5. **Spring 事务注意事项**：事务方法必须是 public 且通过代理对象调用（同类内部方法自调用会绕过代理导致事务失效）；异常需要是未被捕获的运行时异常（或显式配置 `rollbackFor`）才会触发回滚；避免在事务方法中调用外部长耗时操作，防止长事务占用数据库连接。
6. **Spring 代理原理**：Spring AOP 有两种代理方式——JDK 动态代理（基于接口，通过 `InvocationHandler` 生成代理类，要求目标类实现接口）和 CGLIB 代理（基于继承，动态生成目标类的子类并重写方法，不要求接口但目标类和方法不能是 final）。Spring 默认目标类有接口时用 JDK 代理，否则回退到 CGLIB。
7. **事务传播机制**：常见的有 `REQUIRED`（默认，有事务则加入，无则新建）、`REQUIRES_NEW`（挂起当前事务，始终新建独立事务）、`NESTED`（嵌套事务，基于保存点，外层回滚会带动内层回滚，内层可单独回滚而不影响外层）、`SUPPORTS`/`NOT_SUPPORTED`/`NEVER`/`MANDATORY` 等控制方法是否必须运行在事务中的场景。

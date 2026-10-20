---
title: "字节跳动 Java 后端 社招一面：ThreadLocal、锁与找重复数"
company: "字节跳动"
position: "Java 后端"
round: "一面"
date: '2026-10'
source: 牛客网
tags: ["Java", "ThreadLocal", "并发", "锁", "算法"]
summary: "字节跳动 Java 后端社招一面，围绕两份工作的离职原因、项目边界、ThreadLocal 实现与线程隔离、Java 本地锁、服务端锁和过期时间，以及一道找重复数的算法题展开。"
---

### 《面试题目》

1. 做一个简短的自我介绍。
2. 这两份工作换工作的主要原因是什么？
3. 挑几个你觉得做得不错的项目介绍一下，重点讲边界和实现。
4. Java 的 ThreadLocal 是怎么实现的？
5. ThreadLocal 底层怎么实现，怎么控制？
6. 它跟普通的 Map 或数组有什么区别？
7. 它怎么实现线程隔离？
8. 怎么定位 ThreadLocal 相关的问题？
9. Java 里实现本地锁有哪几种方法？
10. synchronized 的底层实现是什么？
11. 如果要实现服务端锁，要怎么做？
12. 锁的过期时间怎么决定，设多少合适？
13. 算法：找重复数。

### 《参考解析》

**ThreadLocal**：每个 `Thread` 内部有一个 `ThreadLocalMap`，key 是 `ThreadLocal` 的弱引用，value 是强引用。`get()` 以当前线程为入口取 map，再以 ThreadLocal 为 key 查值，所以天然线程隔离。它和普通 Map 的区别是「每个线程一份」，不是共享容器。常见问题是线程池里线程复用导致脏数据，必须在 `finally` 里 `remove()`；key 是弱引用，但 value 是强引用，不及时清理仍可能泄漏。跨线程传递可以用 `InheritableThreadLocal`，线程池场景更适合 `TransmittableThreadLocal` 或手动透传上下文。

**锁**：本地锁有 `synchronized`、`ReentrantLock`、`StampedLock`、`Atomic`/CAS、`CountDownLatch` 等。`synchronized` 底层是对象头 Mark Word 加 Monitor，JDK 6 之后有偏向锁、轻量级锁、重量级锁的升级（新版本偏向锁已废弃）。服务端锁常用 Redis `SET NX EX` 或 Redisson，ZooKeeper 也能做。过期时间要大于业务最大执行时间，并留余量；更稳的是看门狗续期 + 业务幂等，不能只靠一个固定 TTL。

**找重复数**：如果数组长度 n+1、数字范围 1..n、只有一个重复，可以用快慢指针找环入口，时间 O(n)、空间 O(1)；也可以用二分按抽屉原理统计。若允许修改数组，可以用下标取负标记。答题前先确认约束：是否只有一个重复、是否允许修改、数字范围、是否要求空间复杂度。面试官往往在考你澄清问题的能力，不要上来就写。

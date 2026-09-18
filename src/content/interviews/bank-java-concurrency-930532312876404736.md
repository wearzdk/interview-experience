---
title: "银行 Java 技术面题目整理：锁、volatile 与线程池"
company: "银行（未注明具体机构）"
position: "Java开发"
date: "2026-09"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/930532312876404736"
tags: ["Java", "并发", "线程池", "CAS", "银行科技岗"]
summary: "银行技术面 Java 并发题目汇总，覆盖锁、可见性、线程池和原子类；原帖并非某一家银行的单次面试记录。"
---

### 《面试题目》

1. 乐观锁与悲观锁分别是什么，如何选择？
2. synchronized 如何使用，怎样实现同步？
3. synchronized 与 Lock 有什么区别？
4. volatile 有什么作用，为什么不能让自增操作整体成为原子操作？
5. 线程池解决什么问题，任务如何在线程和队列之间分配？
6. Java 原子类有哪些，如何完成并发更新？

### 《参考解析》

**版本号要和更新放在同一条语句里**

乐观并发控制的关键是校验自己读到的版本仍然有效。例如读取 version=7 后，更新时使用 `WHERE id=? AND version=7`，并在成功更新时把 version 加一。受影响行数为零，就代表记录不存在或发生了并发修改，需要重新读取并决定是否重试。

不能只比较提交的新版本是否“比数据库版本大”，也不能先查版本、再无条件写入。悲观锁则先获得相应资源的锁，再完成受保护的操作。选型要看冲突程度、临界区耗时和失败后的重试成本。

**volatile 解决的不是整段代码互斥**

对 volatile 字段的写，与随后对同一字段的读之间有可见性和顺序保证，但 `count++` 仍包含读、加一、写回多个动作，两个线程可能从同一个旧值出发。计数可使用 AtomicInteger 的原子增量操作；多个字段之间存在业务约束时，要保护整个约束。参见 [Java 并发包的内存一致性说明](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/package-summary.html)。

**锁的释放路径不能漏**

synchronized 在退出同步块时释放监视器。ReentrantLock 则需要在成功加锁后，用 finally 调用 unlock；它还支持可中断获取、限时尝试和多个条件队列。两者都是可重入机制，但不能脱离竞争情况和运行环境，给出谁一定更快的结论。

**线程池容量要包含排队任务**

只限制工作线程数，不能限制所有待处理任务占用的内存。无界队列在持续过载时会越积越长；有界队列配合明确的拒绝处理，才能把过载反馈给提交方。拒绝也可能由线程池已关闭触发，不能把某种线程池描述成“永远不会拒绝”。具体调度规则可核对 [ThreadPoolExecutor 文档](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)。

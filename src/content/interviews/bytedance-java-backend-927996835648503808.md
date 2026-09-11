---
title: 字节Java后端高阶面试复盘
company: 字节跳动
position: Java后端
round: 多轮技术面
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/927996835648503808
tags: ["Java", "JVM", "分布式事务", "系统设计", "压测"]
summary: "字节Java后端高阶面试复盘，涉及锁机制、JVM排查、MySQL间隙锁、亿级流量系统、分布式事务与全链路压测。"
---

### 《面试题目》

1. `synchronized` 和 `ReentrantLock` 的核心区别是什么？
2. `synchronized` 的锁升级条件是什么？
3. `volatile` 为什么不能保证原子性？`i++` 在字节码层面发生了什么？
4. ThreadLocal 在线程池场景下如何发生内存泄漏？
5. JVM 线上 Full GC 频繁时如何排查？
6. MySQL 的 MVCC 和间隙锁如何配合防止幻读？
7. 如何设计支持亿级流量的电商大促系统？
8. TCC、SAGA 和消息最终一致性分别适用于什么场景？
9. 如何设计全链路压测平台？

---

### 《参考解析》

1. **锁选择**：`synchronized` 由 JVM 自动管理，语法简单；`ReentrantLock` 基于 AQS，支持超时、中断获取和多个 Condition。需要这些控制能力或显式锁生命周期时再选后者。
2. **ThreadLocal 泄漏**：ThreadLocalMap 的 key 是弱引用，value 仍是强引用；在线程池长期存活线程中，key 被回收后 value 可能残留。在线程任务的 `finally` 中调用 `remove()` 是基本防线。
3. **MVCC 与间隙锁**：普通快照读通过 Read View 和 Undo Log 保证可重复读；`FOR UPDATE`、UPDATE、DELETE 等当前读通过记录锁和间隙锁阻止范围内插入。锁范围受索引访问路径影响，不能笼统认为可重复读完全消除幻读。
4. **全链路压测**：用请求标记区分压测流量，沿调用链透传并路由到影子库、影子表和独立监控。系统还要隔离消息、缓存和外部副作用，确保压测不会污染真实业务。

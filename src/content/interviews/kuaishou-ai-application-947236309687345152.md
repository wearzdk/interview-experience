---
title: "快手 AI 应用开发二面：线程池、Redis 与 Agent 长任务排查"
company: "快手"
position: "AI 应用开发"
round: "二面"
date: "2026-11"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/947236309687345152"
tags: ["快手", "AI应用开发", "线程池", "Redis", "Agent", "Java"]
summary: "快手 AI 应用开发二面：前 20 分钟全是后端基本功——线程池定参与 OOM、submit 与 execute 的异常差异、Redis 过期删除与分布式锁；后半场转 Agent 长任务排查，手撕带退避与幂等的重试器。"
---

### 《面试题目》

1. 自我介绍，三分钟以内
2. 挑一个你最熟的项目，讲清楚为什么要做
3. 这个功能的难点在哪？
4. 你个人写的是哪部分，多少行？
5. 上线之后 QPS 多少，P99 多少？
6. 出过什么故障，怎么恢复的？
7. 线程池的核心参数怎么配？别从业务讲，从技术讲。
8. 核心线程数和最大线程数你按什么定？
9. 队列用哪种？为什么不用无界队列？
10. 什么情况下会 OOM？怎么提前发现？
11. 拒绝策略你选哪个？为什么？
12. 为什么不直接用 Executors 那几个工厂方法？
13. 线程池里的异常去哪了？submit 和 execute 有什么区别？
14. 讲一下 Java 的内存模型
15. volatile 能保证原子性吗？
16. Redis 的过期删除策略有哪些？为什么不全用惰性删除？
17. 缓存和数据库一致性，你先更新谁？
18. 缓存击穿、穿透、雪崩分别怎么防？
19. 分布式锁用 Redis 怎么实现？会有什么问题？
20. 消息队列重复消费怎么处理？
21. 顺序消息怎么保证？
22. Agent 的长任务跑了 15 分钟，平时 5 分钟，你怎么查？
23. 工具调用超时，重试几次合适？重试要不要换工具？
24. 多轮对话上下文怎么存，存 Redis 还是存库？
25. 上下文压缩你是在压缩什么？丢了什么？
26. 如果模型输出格式坏了，你怎么兜？
27. 反问
28. 手撕：实现一个带退避和幂等的重试器

### 《参考解析》

**线程池定参要报数。** 调模型是 IO 密集，核心线程按「QPS × 平均耗时」估并发：200 QPS、平均 300ms，理论并发 60，核心给 64，最大 128 留突发余量，队列有界给 200；再高就该限流，堆线程只会让 P99 更差。队列必须有界——`LinkedBlockingQueue` 默认容量是 `Integer.MAX_VALUE`，任务只进不出，堆涨到 Full GC 也救不回来，表现是接口越来越慢然后整体雪崩。监控盯活跃线程数、队列长度、拒绝次数；拒绝策略选 `AbortPolicy`，`DiscardPolicy` 静默丢弃等于瞒报。`Executors` 的工厂方法别用：`newFixedThreadPool` 队列无界，`newCachedThreadPool` 最大线程数是 `Integer.MAX_VALUE`。

**异常与 JMM。** `execute` 的异常进 `UncaughtExceptionHandler`；`submit` 把它封进 `Future`，不调 `get()` 就永远发现不了，这是任务静默失败的经典来源。JMM 的抓手是 happens-before 规则；`volatile` 只保证可见性和禁止重排，不保证原子性——`i++` 是读改写三步，多线程照样丢更新。

**Redis 与消息队列。** 过期删除是惰性加定期的组合：惰性省 CPU 但冷 key 占内存，定期每秒采样、过期比例超 25% 就继续扫，只答一种就是背的。缓存一致性走 Cache Aside：先更新库再删缓存，反过来的顺序在并发下会留旧值，删失败用延迟双删或订阅 binlog 兜底。击穿靠互斥重建，穿透靠布隆过滤器，雪崩靠过期时间打散加熔断。分布式锁用 `SET NX PX`，值放唯一 id，释放用 Lua 比对再删。重复消费靠唯一键去重；顺序消息要求同一 key 进同一分区、消费端按 key 固定线程，失败停住这个分区。

**Agent 长任务变慢。** 拆成推理、工具调用、编排三段打 trace：涨在推理看上下文是否变长；涨在工具查下游 RT；涨在编排看循环有没有收敛。工具超时先判能否安全重试——查询可退避重试，提交类属于结果未知，必须先查实际状态；参数错误与无权限重试不会成功。

**手撕重试器。** 先查 `done` 集合挡住已成功的重复，再进重试循环：

```java
for (int i = 0; i < 4; i++) {
    try { return task.call(); }
    catch (RetryableException e) {
        long sleep = 100L * (1L << i) + ThreadLocalRandom.current().nextLong(100);
        try { Thread.sleep(sleep); }
        catch (InterruptedException ie) { Thread.currentThread().interrupt(); return fallback; }
    } catch (Exception e) { return fallback; }
}
return fallback;
```

抖动不能省，否则上千个请求会在同一毫秒一起重试，把刚恢复的下游再打挂；`InterruptedException` 必须恢复中断位再退出；内存里的 `done` 挡不住并发两次进来，多实例部署等于没有，得挪到 Redis。fallback 也失败就往上抛，让上层决定降级还是排队。

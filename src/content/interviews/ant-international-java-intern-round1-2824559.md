---
title: 蚂蚁国际暑期实习 Java 一面
company: 蚂蚁国际
position: Java 后端实习生
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","ThreadLocal","线程池","HashMap","ConcurrentHashMap","Redis"]
summary: "蚂蚁国际暑期实习 Java 后端一面面经，考察 ThreadLocal 生命周期与线程池串用问题、线程池核心参数设计、HashMap 与 ConcurrentHashMap 线程安全实现、Redis 缓存高可用方案，以及 QPS 定位工具等场景题，适合 Java 后端实习生备考。"
---

## 面试题目

### 基础与并发

1. ThreadLocal 的生命周期是怎样的？
2. ThreadLocal 和线程池结合使用时会有什么问题？如何保证数据不会串？
3. 线程池的核心线程数和最大线程数如何设计？

### 集合与并发容器

4. HashMap 是怎么设计的？
5. ConcurrentHashMap 如何实现线程安全？

### 性能与可用性

6. 怎么定位系统的 QPS？用了什么工具？
7. Redis 做缓存挂了怎么办？

---

## 参考解析

### 1. ThreadLocal 的生命周期
- ThreadLocal 变量存储在每个线程的 `ThreadLocalMap` 中，key 为 ThreadLocal 的弱引用，value 为强引用。
- 线程销毁时，ThreadLocalMap 随之回收；但若线程长期存活（如线程池线程），key 被 GC 后 value 仍存在，造成**内存泄漏**。
- 最佳实践：使用完毕后主动调用 `remove()` 清除。

### 2. ThreadLocal 与线程池串用问题
- 线程池中线程复用，上一个任务设置的 ThreadLocal 值若未清除，会被下一个任务读到，导致数据串用。
- 解决方案：每次任务执行完在 `finally` 块中调用 `ThreadLocal.remove()`；或使用阿里开源的 `TransmittableThreadLocal`（TTL）解决父子线程传值问题。

### 3. 线程池核心参数设计
- **CPU 密集型**：核心线程数 ≈ CPU 核数 + 1，减少上下文切换。
- **IO 密集型**：核心线程数 ≈ CPU 核数 × 2（或根据等待比估算：`N × (1 + 等待时间/计算时间)`）。
- 最大线程数根据业务峰值压测结果调整，拒绝策略视场景选择（如 CallerRunsPolicy 做背压）。

### 4. HashMap 设计
- 底层数组 + 链表 + 红黑树（JDK 8+），默认初始容量 16，负载因子 0.75，扩容为 2 倍。
- 链表长度 ≥ 8 且数组长度 ≥ 64 时转红黑树，节点数 ≤ 6 时退化为链表。
- 非线程安全，并发扩容可能死循环（JDK 7）或数据丢失（JDK 8）。

### 5. ConcurrentHashMap 线程安全实现
- JDK 8：取消分段锁，采用 **CAS + synchronized**，锁粒度细化到单个桶（数组槽）。
- 插入时若槽为空用 CAS 写入，有冲突则 synchronized 锁住桶头节点。
- 扩容时多线程协同迁移（`transfer`），读操作基本无锁（volatile 保证可见性）。

### 6. QPS 定位工具
- 常用工具：**Arthas**（`monitor` 命令统计方法调用 QPS）、Prometheus + Grafana、SkyWalking、JMeter 压测。
- 线上快速定位可用 `Arthas monitor -c 5 com.xxx.Service method` 观察 5 秒内调用频次。

### 7. Redis 缓存挂了怎么办
- **缓存雪崩**（大量 key 同时失效或 Redis 宕机）：设置随机过期时间、使用 Redis Cluster/哨兵保证高可用、开启持久化快速恢复。
- 短期降级方案：请求直接打到数据库时加**限流 + 熔断**（Sentinel/Hystrix），防止 DB 被打垮。
- 可引入本地缓存（Caffeine）作为二级缓存兜底，减少对 Redis 的强依赖。
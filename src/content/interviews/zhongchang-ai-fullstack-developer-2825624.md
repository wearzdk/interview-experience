---
title: 某中厂AI全栈开发面经分享
company: 某中厂
position: AI全栈开发
date: '2026-04'
source: 牛客网
tags: ["Java","JVM","MySQL","Spring","Redis","AI编程"]
summary: "某中厂AI全栈开发岗面经，涵盖Java线程池参数、JVM内存结构、MySQL B+树索引、Spring AOP/IOC、CMS与G1垃圾收集器对比、内存泄露解决方案，以及Redis实现Session共享、秒杀超卖、点赞排行榜、全局唯一ID等项目实战问题，适合备战Java全栈/后端岗位。"
---

## 面试题目

### 基础知识

1. 介绍项目
2. Java 线程池的参数
3. local 锁和 ThreadLocal 的区别
4. JVM 内存包含哪些
5. MySQL 索引为什么用 B+ 树
6. AOP 和 IOC 是什么
7. 内存泄露的原因以及解决方案
8. 垃圾收集器 CMS 和 G1 的区别
9. Java 内存分配的方式，怎么保证线程安全
10. 使用过 AI 编程吗，主要模型用过什么？接触过 Agent 吗

### 项目相关

1. Redis 中怎么实现的 Session 共享
2. 秒杀超卖怎么解决
3. 点赞排行榜怎么实现的
4. 全局唯一 ID 的生成规则

---

## 参考解析

### Java 线程池的参数

线程池核心参数共 7 个：`corePoolSize`（核心线程数）、`maximumPoolSize`（最大线程数）、`keepAliveTime`（空闲线程存活时间）、`unit`（时间单位）、`workQueue`（任务队列）、`threadFactory`（线程工厂）、`handler`（拒绝策略）。
拒绝策略有四种：AbortPolicy（抛异常）、CallerRunsPolicy（调用者执行）、DiscardPolicy（静默丢弃）、DiscardOldestPolicy（丢弃最旧任务）。

### JVM 内存包含哪些

JVM 运行时数据区分为：堆（对象实例、GC 主战场）、方法区/元空间（类元信息、常量池）、虚拟机栈（栈帧、局部变量表）、本地方法栈（Native 方法）、程序计数器（线程私有，记录字节码行号）。
JDK 8 起方法区由永久代改为元空间，使用本地内存，避免 OOM。

### MySQL 索引为什么用 B+ 树

B+ 树相较于 B 树：非叶节点只存键不存数据，单页能存更多键，树高更低，IO 次数少；叶节点通过链表相连，范围查询效率高。
相较于哈希索引：不支持范围查询、排序；B+ 树全支持。
相较于二叉树/红黑树：数据量大时树高过高，磁盘 IO 代价大。

### AOP 和 IOC

**IOC**（控制反转）：对象的创建与依赖关系由 Spring 容器管理，解耦业务代码与对象生命周期。核心实现是依赖注入（DI）。
**AOP**（面向切面编程）：通过动态代理（JDK 动态代理或 CGLIB）在不修改业务代码的前提下，织入横切逻辑（日志、事务、权限等）。

### CMS 与 G1 的区别

| 对比项 | CMS | G1 |
|---|---|---|
| 目标 | 低停顿，并发标记清除 | 可预测停顿时间 |
| 内存布局 | 新生代+老年代 | Region 化，不固定分代 |
| 碎片问题 | 有内存碎片（标记-清除） | 复制算法，碎片少 |
| 适用场景 | 老年代低延迟 | 大堆、混合 GC 首选 |

JDK 9 起 G1 成为默认收集器，JDK 14 移除 CMS。

### Redis 实现 Session 共享

通过 `Spring Session` + Redis 实现：将原本存储在 Tomcat 内存中的 Session 序列化后写入 Redis，所有服务节点共享同一份 Session 数据。
Key 通常为 `spring:session:sessions:<sessionId>`，设置合理 TTL 防止内存泄漏。

### 秒杀超卖解决方案

1. **数据库乐观锁**：更新库存时加版本号或 `WHERE stock > 0` 条件。
2. **Redis 原子操作**：使用 `DECR` 或 Lua 脚本保证「查库存-扣库存」原子性。
3. **分布式锁**：Redisson 实现，对同一商品加锁串行处理（性能较低，适合低并发场景）。
推荐方案：Redis 预扣库存（Lua 脚本）+ 异步消息队列落库。

### 点赞排行榜实现

使用 Redis `ZSET`（有序集合）：以用户/内容 ID 为 member，点赞数为 score，`ZINCRBY` 增加点赞，`ZREVRANGE` 获取 Top N。
优点：读写 O(log N)，天然排序，无需额外排序逻辑。

### 全局唯一 ID 生成规则

常见方案为**雪花算法（Snowflake）**：64 位 long，结构为「1位符号位 + 41位时间戳毫秒 + 10位机器ID + 12位序列号」，每毫秒可生成 4096 个 ID，趋势递增，适合分布式场景。
也可结合 Redis `INCR` + 日期前缀实现业务自定义 ID（如：`202603310000001`）。
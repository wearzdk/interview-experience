---
title: 竞技世界 Java 后端一面
company: 竞技世界
position: Java后端
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","Netty","MySQL","Redis","SpringBoot","ConcurrentHashMap"]
summary: "竞技世界 Java 后端一面，约20分钟，涉及 Netty 原理、支付最终一致性、大文件断点续传、ConcurrentHashMap 底层、MySQL 深度分页优化、SpringBoot 自动化配置及 Redisson 底层实现等核心技术点，适合准备游戏/互联网后端面试的候选人参考。"
---

## 面试题目

### 基本情况

1. 自我介绍
2. 介绍项目流程，都做了哪些功能

### 项目深挖

3. 项目中用到了 Netty，简单介绍一下
4. 项目中的支付功能怎么确保最终一致性？
5. 项目中大文件断点续传功能怎么实现的？

### 基础技术

6. ConcurrentHashMap 底层原理
7. MySQL 深度分页遇到过吗？怎么优化的？
8. SpringBoot 自动化配置原理
9. Redisson 底层实现原理

### 反问

10. 反问

---

## 参考解析

### Netty 简介
Netty 是基于 NIO 的异步事件驱动网络框架，核心组件包括 EventLoopGroup、Channel、Pipeline、Handler。采用主从 Reactor 多线程模型：Boss 线程负责接受连接，Worker 线程处理读写事件，通过零拷贝、内存池等机制提升性能。

### 支付最终一致性
常见方案：本地消息表 + 定时补偿，或引入 MQ（如 RocketMQ 事务消息）。核心思路：先写本地事务 + 消息记录，再异步投递消息；消费方幂等处理；定时扫描未确认消息进行重试，保证最终所有服务状态一致。

### 大文件断点续传
前端将文件按固定大小分片（如 5MB），每片携带文件唯一标识 + 分片序号上传；后端用 Redis 记录已上传分片集合；全部分片到齐后服务端合并文件。续传时前端先查询已上传分片列表，跳过已完成部分直接上传剩余分片。

### ConcurrentHashMap 底层原理
JDK 8+ 采用 `数组 + 链表 + 红黑树` 结构，放弃 Segment 分段锁，改用 `synchronized + CAS` 对单个桶头节点加锁，粒度更细。链表长度 ≥8 且数组长度 ≥64 时转红黑树；扩容时多线程协同迁移，`sizeCtl` 控制并发状态。

### MySQL 深度分页优化
`LIMIT 100000, 10` 会扫描并丢弃大量行。优化方案：① 子查询/覆盖索引先取主键再回表；② 游标分页（记录上次最大 ID，`WHERE id > last_id LIMIT 10`）；③ 业务上限制最大翻页深度。推荐方案视业务场景选择，游标分页性能最佳。

### SpringBoot 自动化配置原理
`@SpringBootApplication` 包含 `@EnableAutoConfiguration`，通过 `AutoConfigurationImportSelector` 读取 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（旧版为 `spring.factories`）中注册的配置类，再结合 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件注解决定是否生效，实现按需自动装配。

### Redisson 底层实现原理
Redisson 分布式锁基于 Redis 的 `SET key value NX PX` 命令加锁，value 为 UUID + 线程ID 保证唯一性；通过 Lua 脚本保证加锁/释放的原子性；引入 **看门狗（Watchdog）** 机制（默认30s）定时续期，防止业务未执行完锁过期。解锁时 Lua 脚本比对 value，匹配才删除，并发布解锁消息通知等待线程。
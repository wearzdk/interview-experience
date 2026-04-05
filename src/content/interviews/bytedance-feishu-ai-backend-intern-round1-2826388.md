---
title: 字节飞书AI后端开发暑期实习一面面经
company: 字节跳动
position: 飞书AI后端开发实习生
round: 一面
date: '2026-04'
result: 挂
source: 牛客网
tags: ["Java","MySQL","Redis","计算机网络","操作系统","JVM"]
summary: "字节跳动飞书AI后端开发暑期实习一面面经，涵盖TCP四次挥手、HTTP状态码、进程线程区别、JDK21虚拟线程、MySQL索引优化、volatile与synchronized原理、Redis跳表与缓存一致性等核心考点，最终一面挂。"
---

## 面试题目

### 计算机网络

1. TCP 断开连接的过程（四次挥手）
2. MSL 是什么？为什么在 TIME_WAIT 状态要等待 2MSL？
3. HTTP 状态码及含义

### 操作系统

1. 进程和线程的区别
2. 早期没有线程只有进程是怎样的？
3. JDK 21 有什么更新？虚拟线程和普通线程有什么区别？

### MySQL

1. 给了一个学生表，写 SQL 实现查询总分最多的三个学生的学号和总分
2. 给了三条查询语句，在千万级别访问下，怎么建立索引最恰当？WHERE 条件分别是：学号 / 总分和学号 / 科目、总分和学号

### Java

1. volatile 有什么特性？怎么实现的？
2. volatile 可以实现原子性吗？为什么？
3. synchronized 与 ReentrantLock 的区别是什么？
4. ReentrantLock 公平性怎么实现？

### Redis

1. Redis 里面存放点赞数据用的什么结构？
2. 热帖怎么实现的？
3. 有序集合（ZSet）底层的结构
4. 跳表的时间复杂度
5. 多级缓存怎么实现？
6. 与数据库的缓存一致性怎么实现？
7. 集合的最大 key 怎么设置的？

### 非技术问题

1. 日常怎么使用 AI？
2. 了解 AI Agent 吗？
3. 软件开发有哪些方向？

---

## 参考解析

### TCP 四次挥手 & 2MSL
- 客户端发 FIN → 服务端 ACK → 服务端发 FIN → 客户端 ACK，共四次。
- MSL（Maximum Segment Lifetime）是报文最大存活时间，通常为 60s。
- TIME_WAIT 等待 2MSL 的目的：① 确保最后一个 ACK 能到达对端，若丢失可重传；② 让网络中残留的旧报文全部消亡，避免影响新连接。

### HTTP 状态码
- 2xx 成功：200 OK、204 No Content、206 Partial Content
- 3xx 重定向：301 永久重定向、302 临时重定向、304 Not Modified
- 4xx 客户端错误：400 Bad Request、401 Unauthorized、403 Forbidden、404 Not Found
- 5xx 服务端错误：500 Internal Server Error、502 Bad Gateway、503 Service Unavailable

### JDK 21 虚拟线程
- JDK 21 正式引入虚拟线程（Project Loom），是轻量级用户态线程，由 JVM 调度而非 OS。
- 普通线程与 OS 线程 1:1 绑定，创建/切换开销大；虚拟线程为 M:N 模型，可创建数百万个，阻塞时自动挂起让出载体线程，适合高并发 IO 密集场景。
- 编程模型与普通线程一致，无需改用异步回调。

### MySQL 索引建立
- 单条件学号：在 `student_id` 上建普通索引即可。
- WHERE 总分+学号：建联合索引 `(student_id, score)` 或 `(score, student_id)`，视选择性而定；学号选择性高则放左边。
- WHERE 科目+总分+学号：建联合索引 `(subject, student_id, score)`，遵循最左前缀原则，将等值查询列放最左。
- 千万级别还需考虑覆盖索引避免回表，以及定期 ANALYZE TABLE 更新统计信息。

### volatile 原理与原子性
- volatile 保证**可见性**（写后立即刷回主内存，读时从主内存获取）和**有序性**（禁止指令重排，通过内存屏障实现）。
- **不能保证原子性**：如 `i++` 包含读-改-写三步，多线程下仍会出现竞态条件；需用 `AtomicInteger` 或加锁。

### synchronized vs ReentrantLock
- synchronized 是 JVM 关键字，自动释放锁，不可中断等待，非公平。
- ReentrantLock 是 AQS 实现，需手动 unlock，支持可中断、超时获取、公平/非公平模式、多条件变量（Condition）。
- 公平锁实现：AQS 的 `tryAcquire` 中通过 `hasQueuedPredecessors()` 判断队列是否有等待者，有则当前线程入队排队，保证 FIFO。

### Redis 点赞 & 热帖 & ZSet 底层
- 点赞数据：用 **Hash**（`like:post:{id}` → `user_id: 1`）或 **Set**（存点赞用户集合），可去重且支持判断是否已点赞。
- 热帖排行：用 **ZSet**，score 为热度分（点赞数+阅读数加权），`ZREVRANGE` 取 Top N。
- ZSet 底层：元素少且值短时用 **listpack（紧凑列表）**；超过阈值（默认 128 个元素或单元素 >64 字节）转为 **skiplist（跳表）+ dict** 组合。
- 跳表查询平均时间复杂度 **O(log N)**，空间复杂度 O(N)。

### 缓存一致性
- 常用策略：**Cache Aside（旁路缓存）**：先更新 DB，再删除缓存（而非更新缓存），下次读时重新加载。
- 延迟双删：更新 DB 前后各删一次缓存，减少脏读窗口。
- 强一致场景可引入分布式锁或消息队列（如 Canal 监听 binlog 异步更新缓存）。
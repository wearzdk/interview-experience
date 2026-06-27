---
title: 快手26届Java后端春招三面面经（2026）
company: 快手
position: Java后端开发工程师
round: 三面+HR
date: '2026-06'
base: 广东
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2868656
tags: ["Java","HashMap","并发","JVM","MySQL","RocketMQ","推荐系统"]
summary: "快手26届Java后端春招三面+HR面经，技术考点覆盖并发工具（CountDownLatch/Semaphore/Future）、ConcurrentHashMap原理、JVM垃圾回收与FullGC排查、MySQL聚簇索引，三面侧重系统设计：实验平台分流、短链接生成、推荐系统多路召回设计。"
---

### 《面试题目》

**一面（3.30）**

1. 自我介绍
2. 实习经历拷打（约15分钟）
3. Java 异常体系中编译时异常与运行时异常的区别
4. HashMap 与 ConcurrentHashMap 的区别
5. 有三个方法 a、b、c，让其并行执行，全部执行完后程序再继续，有哪些实现方式？（CountDownLatch、Semaphore，线程池 Future.get 可以吗？）
6. Java 中如何保证信号量线程安全？volatile 够吗？（不够，还需 CAS）
7. Java 中的锁有哪些类型
8. 了解哪些垃圾回收算法
9. 线上 Java 服务频繁 FullGC 或 OOM，排查思路是什么，用哪些命令
10. MySQL 聚簇索引与非聚簇索引的区别，索引使用了什么数据结构，相比其他数据结构的优势
11. 接触过大数据领域相关技术吗
12. 熟悉 RocketMQ 吗？消息队列核心解决什么问题，有什么优势，如何持久化
13. 手撕：螺旋矩阵（讲思路即可）

**二面（4.3）**

1. 自我介绍
2. 实习经历拷打
3. Top-K 问题：快速选择 vs 堆排序的时间复杂度对比
4. 具体场景：遍历巨大数组动态得到 Top-K（需动态维持堆的加入和删除）
5. 手撕：堆排序实现上述场景
6. 如何并行化 Top-K
7. AI Agent 实战经验，vibe coding 了解吗

**三面（4.8，主管面）**

1. 自我介绍
2. 是否有其他 offer，选择 offer 看重哪些方面
3. 为什么想进拥抱新技术的平台，与个人特质有什么关系
4. 如何看待 AI 发展，平时怎么使用 AI
5. 最有成就感的一件事
6. 是否写过学习分享博客
7. 最喜欢什么课程，为什么
8. 实验平台业务：多实验同时进行、每个实验有多个分组，如何分配用户到各组并保证实验互不干扰，如何优化
9. 场景题：给每个用户独立活动页实现短链接，短链接字符串如何生成
10. 设计推荐系统：多路召回如何提升效率，如何兜底，给定 QPS 和召回数要求计算每次召回的内存占用

**HR 面（4.14）**：略，目前仍在录用评估

---

### 《参考解析》

**HashMap 与 ConcurrentHashMap 区别**
HashMap 非线程安全，并发修改会造成死循环（JDK 7）或数据丢失；ConcurrentHashMap 线程安全，JDK 8 后采用 CAS + synchronized 节点级别锁，putVal 时仅对 bucket 头节点加锁，读操作基于 volatile 无锁，并发度远高于 JDK 7 的分段锁。

**三方法并行后聚合方案**
- `CountDownLatch(3)`：三个子线程执行完各自 countDown，主线程 await 阻塞直到计数归零。
- `CompletableFuture.allOf(f1, f2, f3).join()`：最简洁，适合有返回值场景。
- `ExecutorService` 提交返回 `Future`，逐个调用 `get()` 同步等待。

**FullGC/OOM 排查**
先用 `jstat -gcutil <pid> 1000 10` 观察 GC 频率和各代占比；`jmap -histo:live <pid>` 查看对象分布；确认有问题后 `jmap -dump:format=b,file=heap.hprof <pid>` 导出堆快照，用 MAT 分析大对象引用链。常见原因：缓存对象未释放、大对象直接晋升老年代、元空间不足（频繁类加载）。

**短链接设计**
将自增 ID 转为 62 进制（`0-9a-zA-Z`）得到6位短码，存入 Redis（short→long URL），访问时 302 跳转。ID 生成用 Snowflake 保证全局唯一，避免哈希碰撞。

**RocketMQ 持久化机制**
消息顺序写入 CommitLog（高吞吐），同时建立 ConsumeQueue 索引供消费者按 offset 拉取。刷盘策略分同步刷盘（可靠性高）和异步刷盘（性能高）；配合主从同步双写实现高可用。
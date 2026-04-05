---
title: 量子泛娱 Java 实习一面面经
company: 量子泛娱
position: Java 实习生
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Java","Redis","JVM","MySQL索引","ThreadLocal","Spring"]
summary: "量子泛娱 Java 实习一面，30 分钟无手撕，围绕实习项目展开，涉及线程池调优、ThreadLocal 内存泄漏、Redisson 看门狗、联合索引失效、G1 vs CMS、CAS ABA 问题、SpringBoot 自动装配、缓存击穿、AI Agent 文档分块等核心知识点，适合准备 Java 实习面试的同学参考备考。"
---

## 面试题目

### 基本情况

- 投递时间：4 月 1 日；面试时间：4 月 2 日
- 形式：30 分钟，无手撕算法，以实习经历 + 项目为主，少量八股

### 个人背景

1. 自我介绍

### AI 工具与编码习惯

2. AI 生成代码速度快但质量不稳定，你会选择效率还是质量？为什么？
3. 平时写代码都用过什么 AI Coding 工具？
4. 用这些工具写代码，你感觉代码质量如何，可用性和可行性怎么样，写完之后自己会去学习吗？

### Java 并发与内存

5. 我看你简历用了实习公司内部的线程池，那 Java 原生线程池中的核心线程数和最大线程数如何根据业务场景来评估？
6. ThreadLocal 内存泄漏问题？
7. 引入 TTL（TransmittableThreadLocal）解决实习遇到的问题的核心原理？
8. CAS 的 ABA 问题是什么，如何避免？

### MySQL 索引

9. `WHERE a=1 AND c=3`，联合索引是 `(a, b, c)`，索引会生效吗？为什么？c 不生效的话 a 会生效吗？
18. 举一个实习中具体优化查询的案例？
19. 如果是让你做这个需求，在表设计时你会预先考虑索引的创建吗，还是发现问题后再去优化？

### Redis 与缓存

8. Redisson 看门狗机制？
11. 在商品详情页场景下，怎么解决缓存击穿热带 key 过期的问题，结合业务说解决方法？
17. 实习业务除了用 Redis 锁防止并发问题，在数据库层面你会怎么解决超卖和价格覆盖，怎么设计？

### JVM

12. G1 垃圾回收器相对于 CMS 的优势是什么？

### Spring / SpringBoot

10. 实习中这个业务用到了策略模式和工厂模式，那在 Spring 容器中你是怎么管理这些策略实现类的注入的，整个流程讲一下？
14. SpringBoot 的自动装配原理？

### 实习项目深挖

15. 实习的定时任务优化是怎么优化的，技术层面、数据库层面怎么优化的？
16. 实习中 SAP 和数据库的数据同步是怎么处理的，怎么保证唯一性和一致性并且不会出现脏数据？

### AI Agent 项目

20. 你那个 Agent 项目文档分块是怎么分的，为什么要这么分，有没有更好的分块方法？
21. 除了项目用到的向量数据库，还了解其他向量数据库吗？你为什么选择这个向量数据库？
22. 如果业务方向调整，AI 的回答风格从严谨变到幽默，这个系统如何实现不重启就可以生效？
23. Nacos 和 Apollo 了解吗？
24. Java 怎么调用 Python？

### 开放拓展题

25. 用过 OpenClaw 吗，用来干嘛？（回答拿来炒股，面试官笑了，问效果怎么样）
26. OpenClaw 除了炒股还能用到哪些场景？
27. AI 动漫、AI 短剧、AI 漫剧了解多少？
28. AI 除了内容创作之外还有其他作用吗？

### 反问

29. 有二面吗？
30. 具体业务是什么？

---

## 参考解析

### Q5 线程池核心线程数 / 最大线程数评估

- **CPU 密集型**：核心线程数 ≈ CPU 核心数（+1 防止偶发暂停），最大线程数与核心数相同或略大。
- **IO 密集型**：核心线程数 ≈ CPU 核心数 × 2，最大线程数可按 `CPU × (1 + 等待时间/计算时间)` 估算。
- 实际应结合压测数据、队列积压监控动态调整，避免直接上线写死。

### Q6 ThreadLocal 内存泄漏

- `ThreadLocalMap` 的 key 是弱引用，value 是强引用；当 `ThreadLocal` 对象 GC 后，key 变为 null，但 value 仍被 Entry 强引用，无法回收。
- 线程池场景下线程不销毁，泄漏尤为严重。
- 解决：使用完毕后必须调用 `remove()`，或使用 `try-finally` 块保证清理。

### Q7 TTL（TransmittableThreadLocal）核心原理

- 标准 `InheritableThreadLocal` 只在父线程**新建子线程**时传递值，无法覆盖线程池复用的场景。
- TTL 通过装饰 `Runnable`/`Callable`（`TtlRunnable`），在任务提交时**快照**父线程的 TTL 值，在任务执行前**注入**到当前线程，执行后**恢复**原值，从而实现线程池中的上下文透传。

### Q8 Redisson 看门狗机制

- 加锁时若未指定 `leaseTime`，默认锁过期时间为 30 秒，同时开启一个定时任务（看门狗），每隔 `lockWatchdogTimeout / 3`（默认 10 秒）自动续期为 30 秒。
- 业务结束后调用 `unlock()` 时关闭看门狗，避免锁永久持有。
- 注意：**显式指定 `leaseTime` 后看门狗不生效**，需自行评估超时时间。

### Q9 联合索引 (a,b,c) 中 WHERE a=1 AND c=3

- 遵循**最左前缀原则**：a 可以走索引，b 被跳过后 c 无法利用索引过滤（但在 MySQL 8.0 的索引跳跃扫描场景下有例外）。
- 实际执行：a 的等值匹配走索引，c 的过滤在索引回表后由 **ICP（Index Condition Pushdown）** 在存储引擎层过滤，减少回表次数，但 c 本身不算"索引命中范围扫描"。
- 结论：a 生效，c 由 ICP 优化，但若 b 是高选择性字段，建议调整索引或新增 `(a,c)` 复合索引。

### Q11 缓存击穿（热点 key 过期）

- **互斥锁**：key 过期后只允许一个线程重建缓存，其他线程自旋等待或返回旧值。
- **逻辑过期**：缓存永不真正过期，value 中存储逻辑过期时间；发现过期后异步重建，请求期间返回旧数据（适合允许短暂旧数据的场景）。
- 商品详情页推荐**逻辑过期 + 异步重建**，保证高并发下不雪崩，配合 Redisson 分布式锁确保只有一个线程重建。

### Q12 G1 vs CMS

- G1 将堆划分为等大小的 Region，**可预测停顿时间**（`-XX:MaxGCPauseMillis`），CMS 无法精确控制 STW 时间。
- G1 整合了 Young/Old GC，CMS 只负责老年代，需配合 ParNew。
- G1 使用**复制算法**整理 Region，避免 CMS 标记-清除带来的**内存碎片**问题，无需 Full GC 整理碎片。
- 大堆（>4G）场景 G1 优势明显；堆较小时 CMS 延迟可能更低。

### Q13 CAS ABA 问题

- ABA：变量从 A 改为 B 再改回 A，CAS 检测不到中间的变化，可能导致逻辑错误（如链表节点被复用）。
- 解决：使用**版本号（stamp）**，Java 提供 `AtomicStampedReference`，每次更新同时递增版本号，CAS 同时比较值和版本号。

### Q14 SpringBoot 自动装配原理

- `@SpringBootApplication` 包含 `@EnableAutoConfiguration`，触发 `AutoConfigurationImportSelector`。
- 该 Selector 读取 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（旧版为 `spring.factories`），获取所有自动配置类全限定名。
- 每个自动配置类通过 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件注解按需装配，避免冲突。

### Q20 Agent 文档分块策略

- 常见方法：**固定字符数分块**（简单但割裂语义）、**按句/段落分块**（保留语义完整性）、**滑动窗口分块**（加重叠防止边界信息丢失）、**语义相似度分块**（如 LangChain SemanticChunker）。
- 更优方案：结合文档结构（标题层级）+ 滑动窗口 + 适当 overlap（如 20%），并针对长段落递归切分。
- 分块大小需与 Embedding 模型的 token 上限及 Retrieval 精度之间做 trade-off，通常 256–512 token 效果较好。

### Q22 AI 回答风格热更新（不重启生效）

- 将 Prompt 模板存储在**配置中心**（Nacos / Apollo）或数据库，系统启动时加载，业务变更时推送更新。
- 配置中心监听变更事件，回调刷新本地缓存中的 Prompt 对象，无需重启。
- 也可设计为**策略模式**：不同风格对应不同 Prompt 策略类，通过配置切换当前生效策略。
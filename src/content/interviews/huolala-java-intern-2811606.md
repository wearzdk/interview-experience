---
title: 货拉拉Java实习面试题分享
company: 货拉拉
position: Java实习生
date: '2026-03'
source: 牛客网
tags: ["Java","MySQL","Redis","算法","AOP","Transformer"]
summary: "分享货拉拉Java实习面试经历，涵盖手撕AOP、36进制加法、MySQL索引优化与分表策略、Redis多级缓存与穿透处理、Transformer自注意力机制及Java锁机制深度解析，助你掌握后端高频考点。"
---

### 面试题目
1. 手撕 AOP
2. 手撕 36 进制加法（不能转为 10 进制运算）
3. MySQL 索引优化，大数据量下如何解决？（追问：如何分表）
4. Redis 多级缓存策略，缓存穿透解决方案，设置空值是否需要过期时间？
5. MCP 和 Function Call 的区别
6. Transformer 架构的自注意力机制
7. Java 的锁机制：乐观锁、悲观锁、偏向锁、轻量级锁、重量级锁

---

### 参考解析

**1. 手撕 AOP**：主要考察动态代理。通过 `Proxy.newProxyInstance` (JDK) 或 CGLIB 创建代理对象，在 `invoke` 方法中实现逻辑增强（如日志、事务）。

**2. 36 进制加法**：使用双指针从低位向高位遍历，映射表 `0-9, a-z` 将字符转为数值。按位累加并维护进位（carry），最后通过 `StringBuilder` 翻转字符串返回。

**3. MySQL 分表**：大数据量下优先使用水平分表。策略包括：按用户ID取模分表（平摊压力）、按时间段分表（利于历史数据归档）。通常配合 ShardingSphere 等中间件。

**4. Redis 缓存穿透**：通过布隆过滤器拦截不存在的 Key，或将空值设为默认值缓存到 Redis。空值必须设置过期时间，否则内存会持续被无效 Key 占用。

**5. MCP vs Function Call**：MCP (Model Context Protocol) 侧重于连接 LLM 与本地/外部数据源的标准协议；Function Call 是模型主动调用工具完成任务的能力，两者侧重点不同。

**6. 自注意力机制**：核心是将 Query, Key, Value 矩阵相乘，计算不同词之间的权重（Attention Score），通过 Softmax 归一化后加权求和，捕捉序列全局依赖。

**7. Java 锁升级**：从无锁 -> 偏向锁 -> 轻量级锁 -> 重量级锁，此过程只能升级不能降级。轻量级锁使用 CAS 自旋，重量级锁使用操作系统的 Mutex Lock。
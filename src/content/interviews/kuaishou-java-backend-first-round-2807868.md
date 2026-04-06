---
title: 快手Java后端一面面经
company: 快手
position: Java后端开发
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","Redis","RocketMQ","AOP","分布式锁","算法"]
summary: "快手Java后端一面面试经验，主要考察Java基础（反射、AOP、JMM）、Redis应用（分布式锁、限流、会话管理）、RocketMQ消息可靠性与延迟消息、以及AI领域相关技术（Function Calling与MCP）。含LC215算法题及面试官评价。"
---

### 面试题目

1. 自我介绍
2. 讲讲Java反射
3. 讲讲AOP与动态代理
4. 项目中如何通过AOP和注解实现滑动窗口限流
5. 为什么选择令牌桶算法？具体流程如何？
6. Redis基础数据类型及底层实现
7. Redission分布式锁实现原理
8. 指数退避算法实现及其应用场景
9. 如何保障接口幂等性
10. 指数退避与均匀重传的区别与选型
11. JMM（Java内存模型）详解
12. RocketMQ如何保证消息不丢失
13. RocketMQ延迟消息原理
14. 项目中Redis实现会话管理的细节
15. AI调用Function Calling出现幻觉如何解决
16. 了解MCP吗？与Function Calling的区别
17. AI生成代码的质量保障与Code Review流程
18. 算法题：LeetCode 215 数组中第K个最大元素
19. 未来规划（考研还是就业）
20. 反问环节

---

### 参考解析

- **AOP与动态代理**：JDK动态代理基于接口，使用`Proxy`类和`InvocationHandler`；CGLIB基于继承，通过生成子类拦截方法。Spring默认在单例Bean中使用，通过切面（Aspect）注入逻辑。
- **Redis限流**：滑动窗口通常使用Redis的`ZSET`存储请求时间戳，移除超出时间窗的数据并计数。令牌桶则使用Lua脚本配合`LIST`或`ZSET`实现速率控制。
- **RocketMQ可靠性**：生产端采用同步发送+重试机制；Broker端需配置同步刷盘（Sync Flush）和主从复制（Sync Replication）；消费端需手动ACK确认。
- **指数退避**：指重试等待时间呈指数级增加（如2s, 4s, 8s），有效防止高并发下下游服务雪崩；均匀重传适用于轻负载场景，避免因排队过久影响用户体验。
- **LeetCode 215**：推荐使用快速选择算法（Quick Select）或小顶堆实现。快速选择平均时间复杂度为O(N)，空间复杂度O(1)，是解决Top K问题的标准做法。
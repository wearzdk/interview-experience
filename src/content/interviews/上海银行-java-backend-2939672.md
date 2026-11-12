---
title: "上海银行一面 24 问：从 MyBatis 分页问到 DDD、Spring AI 与 CI/CD"
company: 上海银行
position: Java 后端开发
round: 一面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/a6d0231c07ee450484c90c7e816cada4
tags: ["上海银行","Java后端","并发","DDD","Spring","MySQL","CICD","大模型接入"]
summary: "上海银行一面，两位面试官一起问，24 个问题覆盖项目细节、Java 并发、DDD 建模、Spring 注解、大模型接入与限流、CI/CD 流水线、MySQL 基础与 SQL 手写：从项目分工、数据量与表结构，到 synchronized 与 ReentrantLock、AQS、ThreadLocal、实体与值对象、流式调用、RPM 控制、INNER/LEFT/RIGHT/NATURAL JOIN 的区别，最后让写分组求平均分的 SQL。"
---

### 《面试题目》

1. 介绍一个你比较熟悉的项目。
2. 项目团队有多少人？团队怎么分工？你个人负责哪些模块？
3. 项目主要用什么语言开发？实际用了哪些中间件或外部服务？
4. 项目的数据量有多大？
5. 数据是怎么存储的？表结构是怎么设计的？
6. 具体怎么查？用的是 MyBatis 还是 MyBatis-Plus？是按索引查询、分页查询，还是有更复杂的处理？
7. 你熟悉哪些 Java 并发组件？分别用在什么场景？
8. `synchronized` 和 `ReentrantLock` 有什么区别？
9. AQS 是什么？英文全称是什么？
10. 你了解 `ThreadLocal` 吗？
11. 你怎么理解 DDD？它和常规的开发方式有什么区别？能结合项目举个例子吗？
12. 实体和值对象有什么区别？
13. `@Autowired` 和 `@Resource` 有什么区别？
14. 你们用 Java 调用大模型时，使用的是流式还是非流式？业务侧实际调用的是哪个接口？
15. 你们的模型平台是怎么做限流的？批量调用时如何控制 RPM？
16. 你用过 Spring AI 吗？它是做什么的？你用它做过什么？
17. 用 Spring AI 开发 AI 应用，相比用 Python 有什么优势？
18. 你在工程效能平台里具体负责哪一块？
19. CI/CD 流水线一般有哪些阶段？你参与的性能回归流水线有哪些步骤？
20. MySQL 的 `CHAR` 和 `VARCHAR` 有什么区别？
21. `INNER JOIN`、`LEFT JOIN` 和 `RIGHT JOIN` 有什么区别？
22. `NATURAL JOIN` 和 `INNER JOIN` 有什么区别？
23. 一张表只有学生姓名、课程名称和分数三个字段，怎么写 SQL 查询每个学生的平均分？分组用什么关键字？
24. 你有什么想问我们的？

### 《参考解析》

**并发组件怎么讲**：不要背清单，按场景串起来——接口幂等与库存扣减用分布式锁（Redis + Lua 或 Redisson），单机临界区用 `ReentrantLock` 做可中断、可超时的尝试加锁，读多写少的配置缓存用 `ConcurrentHashMap` 加 `computeIfAbsent` 避免重复加载，异步编排用 `CompletableFuture` 配自定义线程池并给池设上限。面试官追问 `synchronized` 与 `ReentrantLock` 时，答到四点即可：前者是 JVM 关键字、自动释放、非公平（可开偏向/轻量级锁优化），后者是 API 层实现、需要 `finally` 解锁、支持公平锁、可中断、可超时、可配多个 `Condition`。

**AQS 与 ThreadLocal**：AQS 全称 AbstractQueuedSynchronizer，用一个 `volatile int state` 表示同步状态，加一个 CLH 双向队列存放未抢到锁的线程，子类通过 `tryAcquire/tryRelease` 定义语义，`ReentrantLock`、`Semaphore`、`CountDownLatch` 都基于它。`ThreadLocal` 是每个线程自己的 `ThreadLocalMap`，key 是弱引用的 ThreadLocal 对象、value 是强引用，线程池里不复用会泄漏，所以用完必须 `remove()`。

**DDD 与实体、值对象**：DDD 与「贫血模型 + 事务脚本」的区别在于把业务规则放回领域对象，用限界上下文划清边界，用聚合保证一致性。实体靠唯一标识区分、状态会变（订单、账户）；值对象没有标识、不可变、相等性看属性（金额、地址、时间区间）。结合项目举例时要说出聚合根是谁、哪些操作在一个事务里、跨聚合怎么用领域事件解耦。

**大模型接入与限流**：流式用 SSE 把 token 逐步推给前端，首字延迟低、体验好；非流式适合后台批处理与需要完整结果再落库的场景。限流按 RPM/TPM 两个维度做：单机用令牌桶或 Guava `RateLimiter` 控速率，集群用 Redis 计数器或网关统一限流；批量调用要控制并发度、加队列与重试退避，并对 429 做指数退避而不是立即重试，否则会把上游打得更死。

**Spring AI 与 Python 的取舍**：Spring AI 的价值在于复用 Java 侧已有的工程能力——依赖注入、事务、连接池、可观测性、与既有业务系统同一套部署与鉴权；Python 的优势在生态与实验速度（新模型、微调、向量库支持更快）。选型看团队与场景：业务系统内嵌 AI 能力选 Spring AI，算法实验与模型服务选 Python，两者通过 HTTP 或消息队列解耦。

**MySQL 与 SQL**：`CHAR` 定长、不足补空格、读取时去掉尾部空格，适合长度固定的编码；`VARCHAR` 变长、额外 1~2 字节记录长度，适合长度差异大的文本。`INNER JOIN` 只保留两表匹配的行；`LEFT JOIN` 保留左表全部、右表缺失补 NULL；`RIGHT JOIN` 反之；`NATURAL JOIN` 自动按同名列连接且结果会去掉重复列，可读性差、容易被隐式列变化坑到，生产里不推荐。分组求平均：`SELECT 学生姓名, AVG(分数) FROM 成绩表 GROUP BY 学生姓名;`，要过滤再写 `HAVING AVG(分数) >= 60`。

**CI/CD 与性能回归**：典型阶段是代码检查与单测 → 构建镜像 → 部署到测试环境 → 自动化回归（接口、UI）→ 性能回归 → 审批 → 灰度发布 → 线上验证。性能回归流水线通常是：拉起独立环境与固定数据 → 跑基线脚本采集 TP99/吞吐/错误率 → 与上一版基线比对 → 超过阈值（如 TP99 劣化 20%）则阻断发布，并把报告附在流水线记录里。

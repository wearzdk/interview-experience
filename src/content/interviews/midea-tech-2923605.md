---
title: 美的技术岗一面面经
company: 美的
position: 技术岗
round: 一面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/ae2e686858614c5d88e20b9b6a7f77b3
tags: ["Spring","事务","线程池","AI Agent","Skills","实习项目"]
summary: "美的技术岗一面面经：考察 Spring 事务注解原理、线程池核心参数与执行流程，以及业务 Skills 的编写与自进化，并追问实习项目难点和对 Agent 的理解。"
---

### 《面试题目》

1. Spring 中事务注解的原理是什么？
2. 线程池的核心参数和执行流程是什么？
3. 写业务 skills 的时候你是怎么写的？对 skills 有什么了解？
4. 边对话边进化的 skills 是如何做的？自进化 skills 是怎么回事？
5. 实习的项目难点在哪？
6. 你对 Agent 的了解有多少？熟悉哪个部分？

### 《参考解析》

**Spring 事务注解的原理**。`@Transactional` 靠的是 AOP：`@EnableTransactionManagement` 在容器里注册 `InfrastructureAdvisorAutoProxyCreator`，它会为带事务注解的 Bean 生成代理（JDK 动态代理或 CGLIB），代理里织入 `TransactionInterceptor`。方法调用进来后，拦截器先从 `TransactionAttributeSource` 解析事务属性（传播行为、隔离级别、只读、超时、回滚规则），再由 `PlatformTransactionManager` 开启事务——本质是取出连接、把 `autoCommit` 置为 false，并通过 `TransactionSynchronizationManager` 把连接绑定到当前线程；业务执行完提交或回滚，最后清理绑定。默认只有 `RuntimeException` 和 `Error` 触发回滚，受检异常必须显式写 `rollbackFor = Exception.class`。

要把失效场景讲清楚，这几乎是必问：① 同一个类里的方法内部自调用不走代理，事务直接失效；② 方法必须是 public，private/static 不行，CGLIB 也无法覆写 final 方法；③ 异常被自己 catch 住没抛出去，拦截器感知不到，事务不会回滚；④ 传播行为选错，把 `REQUIRES_NEW` 用在自调用上同样无效；⑤ 事务里包了 RPC、发消息、大循环，会长时间占用连接甚至拖垮连接池。工程上的做法是把事务边界收在 service 最内层、只包数据库操作，跨系统调用放到事务外，用「先落库、再发消息 + 补偿」而不是硬塞进一个事务。

**线程池的核心参数与执行流程**。`ThreadPoolExecutor` 七个参数：`corePoolSize`、`maximumPoolSize`、`keepAliveTime`、`unit`、`workQueue`、`threadFactory`、`handler`。提交任务时的顺序是：核心线程没满就新建核心线程；核心满了进队列；队列满了才扩容到最大线程数；再满就走拒绝策略。最容易被追问的是「为什么先排队、而不是先扩容」——因为线程池的设计目标是复用与削峰，队列是缓冲；但这带来一个反直觉后果：若用 `LinkedBlockingQueue` 这类无界队列，`maximumPoolSize` 永远不生效，任务会一直堆积直到 OOM。所以生产上要用有界队列并明确拒绝策略：`AbortPolicy` 适合不能丢的任务（抛异常让上游感知），`CallerRunsPolicy` 用调用方线程执行、天然形成反压，`DiscardPolicy` 与 `DiscardOldestPolicy` 只在明确能容忍丢失时用。

线程数怎么定：CPU 密集型约 `N+1`，IO 密集型按 `核数 × (1 + 等待时间 / 计算时间)` 估，最终以压测和监控（活跃线程数、队列长度、拒绝次数、任务耗时）为准。还有几条容易被忽略的：不同业务用独立线程池做隔离，避免一个慢接口占满公共池；`ThreadFactory` 里给线程起名字，排查问题时能一眼定位；上线要能优雅关闭（`shutdown` + `awaitTermination`）；用 Spring 的 `ThreadPoolTaskExecutor` 时把队列容量显式配上，别用默认值。父子任务共用一个池、父任务等子任务结果，是最典型的线程池死锁，答题时能主动提一句会加分。

**业务 skills 怎么写、怎么「自进化」**。给 Agent 用的 skill 本质是一份「触发条件 + 可执行步骤 + 边界与失败处理」的能力包。写好的关键有三条：一是触发描述要准，让模型能判断什么时候该用它，含糊的描述会导致该用的时候不用、不该用的时候乱用；二是步骤要可执行、可验证，确定性的事交给脚本，需要判断的留给模型，不要把注意事项堆成一篇散文；三是必须写清失败路径——报错怎么办、超出范围怎么办、结果怎么确认。至于「边对话边进化的 skills」，思路是让 Agent 在完成一轮任务后把新跑出来的流程沉淀成候选 skill，但一定要有人 review 和版本管理，否则能力集会不断膨胀、互相冲突，最后没人知道哪一份是准的。比较稳的做法是候选产物先进草稿区，人工确认后再合入，并配一个小的回归用例，确认新改动没把原有能力带坏。

**实习项目难点怎么讲**。用「背景与约束 → 问题怎么定位 → 方案怎么对比 → 我做了什么决策 → 结果数据 → 复盘」这条线。面试官想知道的不是你这段业务多复杂，而是你在信息不全时怎么定义问题、怎么做取舍、怎么验证结论。所以最好再准备一个「当时判断错了、后来怎么纠正」的例子，它比成功案例更能证明你有独立判断力。

**对 Agent 的理解**可以分三层答：能力构成（模型 + 工具调用 + 记忆与状态 + 规划）、工程形态（ReAct 循环、Plan-Execute、受控 workflow 与自由 agent 的取舍）、落地约束（上下文与成本、可靠性与终止条件、评测与可观测性）。再补一段自己实际用过的场景和踩过的坑——空转、工具返回不结构化导致模型误判、上下文无限增长——比背概念有说服力得多。

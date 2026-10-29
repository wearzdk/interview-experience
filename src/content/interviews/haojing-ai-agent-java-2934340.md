---
title: "浩鲸一面：Skill 和 MCP 有什么区别、Spring Bean 生命周期、两段式 AI 落地追问"
company: "浩鲸科技"
position: "Java 后端（AI 方向）"
round: "一面"
date: '2026-10'
source: 牛客网
tags: ["Agent","Skill","MCP","RAG","Spring","Kafka","AI协作"]
summary: "浩鲸一面 20 问，前半段全在追 AI 落地的实现细节：工具和 Skill 怎么被调用、Skill 里的流程、AI 怎么获得 Skill、Skill 与 MCP 的区别、向量库与 RAG 场景；后半段回到 Spring Bean 生命周期、AOP/IOC、Kafka 结构与 MQ 选型。"
---

### 《面试题目》

1. 你的项目里有哪些地方用到了 AI？
2. 你给 AI 配置的工具和 Skill 具体是怎么调用的？
3. 你这个 Skill 里面的流程是怎么样的？
4. AI 是怎么获得这个 Skill 的？
5. AI 是怎么使用工具的？
6. 说说 Skill 和 MCP 的区别。
7. 你有用到过 RAG 吗？用的向量库是什么？在什么场景用？
8. 任务编排用的是什么？还是自己开发的？
9. Spring Bean 的生命周期说一下。
10. AOP 和 IOC 都是什么？
11. 你用 AI 辅助代码开发，怎么保证代码质量？
12. 你认为怎么做一个好的边界测试？
13. 说下 Spring 里的设计模式。
14. 说下 Kafka 的特点和基本结构。
15. 说下另外两种 MQ 和 Kafka 的区别。
16. 你对加班有什么看法？

### 《参考解析》

**Skill 与 MCP 的区别**：MCP 是「连接与能力暴露」的协议——它规定 Agent 怎么发现一个外部服务提供了哪些工具、参数 schema 是什么、怎么调用、怎么返回，解决的是「AI 能碰到什么」。Skill 是「做法」——一段可复用的操作说明（步骤、判据、注意事项、示例），告诉模型在什么场景下按什么顺序组合这些工具，解决的是「AI 该怎么做」。一句话：MCP 给手，Skill 给流程。两者正交：同一个 Skill 可以调不同 MCP 服务，同一套 MCP 工具可以被多个 Skill 编排。

**AI 怎么获得 Skill、怎么调工具**：加载方式通常有三种——启动时把 Skill 的元信息（名字 + 一句话描述）放进系统提示词，模型判断需要时再读全文（渐进式披露，省 token）；按场景路由注入；或者由用户/工作流显式指定。调用工具走「模型输出结构化调用 → 运行时校验参数 → 执行 → 结果回填 → 模型继续」的循环，运行时负责超时、重试、鉴权与审计。

**RAG 与向量库**：向量库存的是 chunk 的 embedding + 元数据（来源、时间、权限），检索时按向量相似度（HNSW/IVF 索引）取 top-k，再用元数据过滤收窄；混合检索把 BM25 与向量分数加权融合，重排用 cross-encoder。选型上 Milvus / Qdrant / pgvector 各有取舍：量大看重召回用专用库，量小且想省运维直接用 pgvector。

**任务编排**：常见是「状态机 / DAG 引擎」（Temporal、Airflow、自研的步骤表），把多步 Agent 流程拆成可重试、可观测的节点；轻量场景就是代码里的顺序调用 + 每步落库。面试要能说清「为什么不用一个 while 循环」：需要断点续跑、超时控制、人工介入节点和可视化。

**Spring Bean 生命周期**：实例化（构造）→ 属性填充（依赖注入）→ `BeanNameAware`/`BeanFactoryAware` 等回调 → `BeanPostProcessor#postProcessBeforeInitialization` → `@PostConstruct` / `InitializingBean#afterPropertiesSet` / 自定义 init-method → `postProcessAfterInitialization`（AOP 代理在这里生成）→ 使用 → 容器关闭时 `@PreDestroy` / `DisposableBean#destroy`。

**IOC 与 AOP**：IOC 是把对象的创建与依赖装配交给容器，降低耦合、便于替换与测试；AOP 是把横切关注点（日志、事务、鉴权、限流）从业务代码里抽出来，Spring 用动态代理实现——有接口用 JDK Proxy，没有就用 CGLIB 生成子类，所以 `final` 方法和私有方法切不到。

**Spring 里的设计模式**：单例（Bean 默认作用域）、工厂（BeanFactory）、模板方法（JdbcTemplate、RestTemplate）、代理（AOP）、观察者（事件机制）、策略（`Resource` 的不同实现）、责任链（拦截器 / Filter）。

**Kafka 与另两种 MQ**：Kafka 是分布式日志，分区 + 顺序写 + 消费者组，吞吐极高、支持回溯消费，但延迟偏高、不支持复杂路由与延迟消息；RabbitMQ 是传统 broker，路由灵活（exchange 的四种类型）、延迟消息与优先级队列成熟，单机吞吐低一个量级；RocketMQ 介于两者之间，支持事务消息、延迟消息、顺序消息，国内电商场景常用。选型判断：日志/流处理选 Kafka，业务解耦与复杂路由选 RabbitMQ，需要事务消息选 RocketMQ。

**加班问题**：实话实说 + 给出边界（能接受项目期的阶段性投入，但不认可长期无意义的耗时间），比空喊「完全接受」可信。

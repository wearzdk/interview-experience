---
title: 某药业公司数据开发一面二面面经（已获书面offer）
company: 某药业公司
position: 数据开发
round: 一面+二面
date: '2026-09'
result: 已OC
source: 牛客网
tags: ["数据开发","数仓分层","Spark","Kafka","Flink","职业发展","面试复盘"]
summary: "某药业公司数据开发一面二面面经，作者已获书面 offer。一面考数仓组件选型理由、分层设计、为什么用 Spark Structured Streaming 而非 Flink；二面深挖 Kafka 底层与替代选型、数仓数据量级与 Spark 底层原理。"
---

### 《面试题目》

**一面（+1 与同事）**

1. 介绍一下实习。
2. 项目拷打：
   - 介绍一下数仓用过的组件分别有什么用，为什么要选择这些组件？
   - 讲一下这个数仓怎么分层？为什么要分层？
   - 为什么用 Spark Structured Streaming 而不用 Flink？
3. 平时用什么 AI 工具？
4. 反问：团队架构、对实习生的期望或要求、团队现有技术与业务。

**二面（部门领导、HR）**

1. 介绍一下项目。
2. 项目拷打：
   - 为什么要用 Kafka 而不是用其他？Kafka 的底层原理是什么？换一个架构与场景，你还用 Kafka 吗？
   - 数仓的数据量级是多少？（各项数据指标要了如指掌并能解释）
3. 八股：Spark 的底层原理是什么？
4. 学了哪些课程？学分最高的课程是？
5. 入职如何权衡工作和学业？
6. HR 追问：到岗情况。

### 《参考解析》

**数仓组件选型与分层怎么答**：选型回答的固定结构是「解决什么问题 → 为什么不用别的」。以常见的一套为例：数据采集用 Flume/DataX（离线批量）或 CDC（Debezium/Canal 抓 binlog 做实时增量），消息缓冲用 Kafka（削峰、解耦、可回放），计算用 Spark（批处理与 Structured Streaming 微批）、必要时 Flink（真正的流处理、低延迟、状态与事件时间语义好），存储用 HDFS/S3（低成本大容量）加 Hive/Spark SQL 做数仓表，OLAP 查询用 ClickHouse/Doris（高并发聚合查询），调度用 Airflow/DolphinScheduler（依赖编排、补数、告警），元数据与质量用 DataHub/自研 + Great Expectations 之类做校验。每个组件都要能说出「替代方案是什么、为什么不选它」。数仓分层一般是 ODS（贴源，保持原始结构与增量）→ DWD（明细，清洗、去重、维度退化、统一口径）→ DWS（主题宽表，按维度聚合的轻度汇总）→ ADS（应用层，直接服务报表与接口），再配 DIM 维表层。为什么要分层：① 解耦——底层变更不影响上层应用；② 复用——中间层结果被多个下游共享，避免重复开发与口径不一；③ 可维护与可追溯——出问题能按层定位（是源数据脏、还是清洗逻辑错、还是聚合口径错）；④ 性能与成本——把重计算前置，上层查询更快；⑤ 权限与治理——不同层面向不同使用者，敏感字段在 DWD/DWS 做脱敏。

**为什么用 Spark Structured Streaming 而不是 Flink**：这是个「没有标准答案、看场景」的问题，答对的关键是说清取舍。选 Spark Structured Streaming 的理由通常是：① **团队与存量技术栈统一**——离线批处理本来就用 Spark，流批同一套 API（DataFrame/Dataset）与同一套 SQL，人力与运维成本低，学习曲线平缓，流任务可以复用已有的 UDF 与调度体系；② **生态与批流一体**——同一份逻辑既能跑批也能跑流（`foreachBatch`、静态/流式 join），适合「准实时 + T+1 修正」的 Lambda 型需求；③ **微批模型（micro-batch）延迟在秒级到分钟级足够**——业务对延迟要求是分钟级，微批完全满足，且吞吐高、故障恢复简单（基于 checkpoint 的 exactly-once）。不选 Flink 不是因为它不好：Flink 是原生流处理，逐条/微秒级延迟、事件时间与 watermark、状态管理与 CEP、以及大规模状态下的稳定性都更强，适合真正的实时风控、实时大屏、复杂事件处理；代价是运维更重（JobManager/TaskManager、状态后端、savepoint 管理）、团队要额外学习。所以「换一个架构与场景还用不用 Kafka / Spark」的正确答法是给判据：延迟要求（秒级以下 → Flink/Kafka Streams）、数据规模与状态大小、是否需要精确一次、团队维护能力、以及成本；如果换成需要亚秒级响应且带大量状态计算的场景，就该上 Flink。

**Kafka 底层原理与替代选型**：Kafka 的核心结构是 topic 分为多个 **partition**，每个 partition 是一个**追加写的日志段文件**（`segment` + 稀疏索引 `.index`/`.timeindex`），消息写入是顺序 I/O（这是它高吞吐的根本原因），每条消息有 offset；partition 内有序、跨 partition 无序（要保序就把同一 key 发到同一 partition，靠 key 的哈希分区）。副本机制：每个 partition 有一个 leader 和若干 follower，写入只经过 leader，follower 拉取同步，靠 ISR（in-sync replicas）+ `acks`（0/1/all）与 `min.insync.replicas` 决定可靠性；`acks=all` + `min.insync.replicas≥2` 才能在允许一台 broker 挂掉时不丢数据。消费侧用消费者组：同一组内每个 partition 只被一个消费者消费（并行度上限就是 partition 数），offset 存在 `__consumer_offsets` 里，可通过提交策略控制「至少一次/至多一次」。此外还有零拷贝（`sendfile`）、批量压缩、页缓存命中、以及 rebalance 协议。选型对比：RabbitMQ 适合低延迟、复杂的路由与单个消息确认（但吞吐低、堆积能力弱）；RocketMQ 在国内电商常用，支持事务消息、延迟消息、消息回溯，堆积能力强；Pulsar 存算分离、支持多租户与 tiered storage；Kafka 的优势是吞吐与生态（连接器、流处理），弱项是缺少原生延迟消息/事务消息语义（要靠应用层或定时补偿实现）、partition 数过多会放大元数据与 rebalance 成本、以及运维需要看磁盘与 ISR。答题时给一句判据式总结：**日志型、吞吐优先、可回放的场景用 Kafka；要复杂路由、延迟消息、事务消息的场景用 RocketMQ/RabbitMQ；要亚秒级流计算再考虑 Flink/Pulsar。**

**Spark 底层原理**：从「作业怎么变成任务」讲。① 执行模型：Spark 应用由 Driver 里的 `SparkContext` 组织，用户写的是 **RDD/Dataset 的惰性转换**（`map`/`filter`/`join`），遇到 action（`count`/`collect`/`write`）才真正触发执行。② DAG 与 Stage 划分：DAG Scheduler 按是否发生 **shuffle**（宽依赖）把 DAG 切成多个 Stage；窄依赖（map/filter/union，一个父分区只对应一个子分区）可以流水线执行，宽依赖（groupByKey/reduceByKey/join 需要重分区）是 Stage 边界。③ 任务调度：一个 Stage 内按分区数切成多个 Task，由 Task Scheduler 分发到 Executor 上执行，Executor 内用线程池并发跑 Task；这就是「一个分区一个 Task」以及「Task 数决定并行度」的由来。④ 内存与 shuffle：Executor 内存分执行内存（shuffle、join、sort、cache）与存储内存（缓存 RDD/广播变量），统一内存管理下可互相借用；shuffle 会把 map 侧结果写本地磁盘（按 partition 分文件，可配 sort-based shuffle 与压缩），reduce 侧拉取（fetch），因此 shuffle 是性能与故障的主要来源——常见优化是减少 shuffle 次数、用 `reduceByKey` 代替 `groupByKey`（map 侧预聚合）、广播小表做 map-side join（避免 shuffle join）、合理设置分区数（避免单分区过大或小文件过多）、用 `repartition`/`coalesce` 调整并行度、以及开启 AQE（自适应查询执行：自动合并小分区、动态切换 join 策略、倾斜 join 优化）。⑤ 容错：RDD 血缘（lineage）保证分区丢失可重算，Checkpoint 用于截断过长血缘；Structured Streaming 用 checkpoint + WAL 做状态与 offset 的精确一次。⑥ 与 MapReduce 的对比（常被顺带问）：Spark 用内存与 DAG 流水线避免 MR 每个阶段落盘，迭代计算（机器学习、图计算）快得多，但 shuffle 依然落盘，所以「Spark 全靠内存」是误解。

**面试表达这件事（这篇面经最值钱的部分）**：原帖作者的自我复盘很实在——二面表现不好，多次被打断，被指出「太发散」「逃避问题」，并总结出「并不是自己以为的好回答就是面试官想听的，关键要结合问题重心；面试本质是问答，不是个人才艺展示会」。可以提炼成几条可操作的建议：① **先给结论再给理由**——被问「为什么用 Kafka」时第一句就答「因为需要削峰与可回放，且团队已有 Kafka 运维能力」，再展开；② **控制单次回答长度**——30~60 秒一个单元，说完停顿看面试官反应，等他追问而不是一口气讲完所有细节；③ **对齐问题重心**——面试官问「数据量级」时他要的是具体数字（日增多少条/多少 GB、峰值 QPS、表多少张、最大表多大），不是架构再讲一遍；④ **不回避**——不会的就说「这块我没在项目里用过，我的理解是……」，比绕开话题好得多；⑤ **对自己项目的数据指标必须了如指掌**——数据量级、增长趋势、延迟、成本、以及为什么是这个量级，这类问题答不上来很容易被判定为「项目不是自己做的」。

**面试复盘**：一面的关键词是「选型理由 + 分层设计 + 反问」，二面的关键词是「底层原理 + 数据量级 + 学业与到岗」，说明同一家公司的不同面试官关注点差异很大。作者最终拿到书面 offer，自评主要靠对实习生的要求不高，但这次经历值得引以为戒：把「一个问题的标准答案结构」练熟（结论 → 理由 → 取舍 → 数据），比多背几道八股更能提升面试表现。

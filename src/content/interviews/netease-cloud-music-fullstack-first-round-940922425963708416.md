---
title: "网易云音乐全栈开发一面：Java 生态、高并发与 AI 工具"
company: "网易云音乐"
position: "全栈开发"
round: "一面"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/940922425963708416"
tags: ["网易云音乐","全栈开发","Java","JVM","线程池","MySQL","Redis","限流","ELK","LangGraph"]
summary: "网易云音乐全栈开发一面，围绕项目、Java 技术栈、数据库、后端通用技术和 AI 应用五个维度展开。Java 侧问 ArrayList 与 LinkedList、线程安全、JVM/Full GC/G1、线程池参数与拒绝策略；数据库问慢查询优化、索引失效与最左前缀、千万级播放记录的存储设计；后端通用问限流算法与降级、从点击播放到出声的网络链路、播放加速、线程与协程、CPU 飙升排查、Prometheus/Grafana、ELK 日志与 NoSQL、Java 位图权限；AI 侧问 LangChain 与 LangGraph 的区别、AI 生码工具与准确率保障。"
---

### 《面试题目》

1. 请做自我介绍，并介绍你最具代表性的项目经历。
2. 你研究生阶段参与的两个项目，是否属于学校承接的导师项目？
3. 你的 Java 技术掌握程度如何，有没有相关的全栈项目实践？
4. ArrayList 和 LinkedList 的底层实现、适用场景分别是什么？二者是否线程安全？多线程环境下如何保证集合操作的线程安全？
5. 你对 JVM 有哪些了解？Full GC 如何排查？对 G1 等垃圾回收器有多少认知？
6. 线程池的核心作用是什么？线程池和队列满员后的拒绝策略有哪些？CPU 密集型任务的线程数如何设置？线程池有哪些核心监控指标？
7. 单从数据库层面，如何排查并优化 SQL 慢查询？
8. MySQL 索引失效的常见场景有哪些？什么是联合索引的最左前缀原则？
9. 面对每日千万级的播放记录，如何设计存储方案支撑高并发写入？
10. 服务器端限流的主流设计思路有哪些？滑动窗口、令牌桶算法有哪些实现框架？流量高峰下的服务降级是什么概念，有哪些处理措施？
11. 从用户点击播放到歌曲实际播放，底层网络调用的完整流程是怎样的？域名解析的具体查询逻辑是什么？
12. 面向全国用户，可通过哪些技术手段优化歌曲播放与下载速度？
13. 线程和协程的核心区别是什么？
14. 线上服务器 CPU 飙升，你会如何逐步排查？
15. Prometheus 的指标采集逻辑是什么？它和 Grafana 之间是如何交互的？
16. 日志实时采集如何与 ELK 集成？高并发场景下怎么设计日志防丢失策略？你对 NoSQL 非关系型存储有多少了解？
17. 用 Java 如何实现位图权限管理？
18. 近半年你在 AI 相关技术上有哪些学习积累？LangChain 和 LangGraph 的核心区别是什么？
19. 你日常使用哪些 AI 生码工具？如何保证生成代码的准确率？
20. 反问：办公地点、内部 AI 工具的额度、面试结果反馈时间与流程轮次。

### 《参考解析》

**集合与线程安全。** ArrayList 基于动态数组，随机访问 O(1)、尾部追加均摊 O(1)、中间插入删除 O(n)，适合读多写少、频繁按索引访问；LinkedList 基于双向链表，头尾插入删除 O(1)、随机访问 O(n)，适合频繁在两端增删（队列/栈）。两者都不是线程安全的：并发写可能出现数据覆盖、size 不一致、甚至结构性损坏。多线程方案：`Collections.synchronizedList`（全表锁，吞吐低）、`CopyOnWriteArrayList`（写时复制，适合读多写极少、数据量小）、`ConcurrentHashMap`（Map 场景）、或干脆用不可变集合/消息传递避免共享。注意 `CopyOnWriteArrayList` 的迭代器是快照、不支持 `remove`，写多时内存和 CPU 开销都大。

**JVM 与 Full GC 排查。** 先看现象：是频繁 Full GC、单次停顿长、还是内存持续上涨。工具链：`jstat -gcutil` 看各区使用率与 GC 次数/耗时；`jmap -histo`/`jmap -dump` 看对象分布；`jstack` 看线程栈（是否有大量线程阻塞）；GC 日志（`-Xlog:gc*`）看停顿原因；MAT/JProfiler 分析 dump 找支配树与大对象。常见根因：内存泄漏（静态集合、ThreadLocal、连接/流未关闭、缓存无上限）、大对象/大数组、元空间不足、堆外内存、以及 GC 参数不合理。G1 的核心是 Region 化堆、按回收价值优先回收（Garbage First）、可预测停顿模型（`-XX:MaxGCPauseMillis`）；要能说清 Young GC、Mixed GC、Full GC 的触发条件，以及 Humongous 对象（超过 Region 一半）对 G1 的影响。排查顺序是「先确认是不是 GC 问题，再定位是谁在分配/持有」。

**线程池参数与监控。** 核心参数七个：corePoolSize、maximumPoolSize、keepAliveTime、unit、workQueue、threadFactory、handler。提交流程：核心未满建核心线程；核心满入队；队列满建非核心；到最大还满则拒绝。拒绝策略：AbortPolicy（抛异常）、CallerRunsPolicy（调用线程执行，天然背压）、DiscardPolicy、DiscardOldestPolicy；生产上常自定义（记录日志、降级、报警）。CPU 密集型线程数约 N+1（N 为核数），IO 密集型约 N×(1+等待/计算)，但最终要压测；线程过多会增加上下文切换和内存。监控指标：活跃线程数、队列长度、任务提交/完成/拒绝数、任务等待时间、线程池饱和度；用 Micrometer 暴露到 Prometheus，配告警。还要注意「线程池隔离」：不同业务用不同池，避免一个慢依赖拖垮全部。

**慢查询与索引。** 排查：开慢查询日志（`long_query_time`）、用 `EXPLAIN`/`EXPLAIN ANALYZE` 看执行计划（type、key、rows、filtered、Extra）、看 `performance_schema` 的等待事件。常见原因：缺索引、索引失效、回表过多、深分页、N+1 查询、大表 join、锁等待、以及返回不必要的数据。索引失效场景：对索引列做函数/运算、隐式类型转换（字符串列传数字）、`LIKE '%x'` 前导通配、`OR` 两侧有一侧无索引、联合索引不满足最左前缀、以及优化器认为全表扫描更便宜。最左前缀：联合索引 `(a,b,c)` 能命中 `a`、`a,b`、`a,b,c`，但不能单独命中 `b` 或 `c`；范围查询会截断后续列（`a=? AND b>? AND c=?` 中 c 用不上索引，除非覆盖索引/索引跳跃扫描）。优化手段：建合适的联合索引、覆盖索引避免回表、改写 SQL、分页用游标、拆分大查询、以及冷热分离。

**千万级播放记录的存储。** 先明确访问模式：写入是 append-only、量大；查询按用户/歌曲/时间范围，还要做统计。方案：写入走 Kafka 削峰，落 HBase/Cassandra（宽表、按 user_id + 时间戳 或 song_id + 时间戳 做 rowkey，支持高并发写与范围查），或 ClickHouse（列存，适合聚合分析）；离线入 Hive/数据湖做报表；Redis 存最近播放与计数。关系型数据库只存元数据与聚合结果，不存全量流水。分区/分桶按时间（天/月）+ 哈希，冷数据下沉到对象存储。要点：rowkey 设计避免热点（加盐/反转）、写入幂等（去重键）、以及查询与统计分离（OLTP vs OLAP）。

**限流与降级。** 限流算法：计数器（简单但有临界问题）、滑动窗口（把时间切细，精度与内存折中）、漏桶（恒定速率，削峰）、令牌桶（允许突发，最常用）。实现：单机用 Guava RateLimiter/Sentinel，分布式用 Redis + Lua（令牌桶/滑动窗口）或网关层（Nginx `limit_req`、Spring Cloud Gateway RequestRateLimiter）。维度：接口、用户、IP、租户。降级：返回兜底数据、关闭非核心功能、读走缓存、异步化、排队；配合熔断（错误率/慢调用比例触发）、隔离（线程池/信号量）、以及预案开关。关键是「限流要限到有意义的维度，降级要提前设计好返回什么」，不要等故障时临时决定。

**播放链路与加速。** 点击播放 → 鉴权/版权校验 → 获取播放地址（歌曲 id → 音频文件 URL，可能带签名与过期时间）→ DNS 解析（浏览器/系统缓存 → 递归解析器 → 根/顶级/权威）→ 建连（TCP 三次握手，HTTPS 再加 TLS）→ HTTP 请求（Range 分段、缓存协商）→ CDN 边缘节点命中则直接返回，未命中回源 → 客户端解码播放。加速手段：CDN 多级缓存与就近接入、HTTP/2 多路复用、Range 请求与预加载、音频转码多码率自适应、P2P（部分场景）、以及客户端本地缓存。原帖提到「UDP/本地缓存」——UDP 需要上层协议（QUIC/HTTP3）保证可靠与拥塞控制，裸 UDP 不可行；本地缓存要注意版权与过期。弱网优化：降码率、断点续传、预取下一首。

**线程 vs 协程。** 线程是内核调度单位，有独立栈、切换要进内核、成本较高（微秒级）；协程是用户态调度，切换在用户态、成本低（纳秒级），适合 IO 密集与高并发。协程不是「更快的线程」：它依赖运行时/语言支持（Go 的 goroutine、Java 的虚拟线程、Kotlin 协程），阻塞调用会占住载体线程，需要配合非阻塞 IO；CPU 密集型任务用协程没有收益。Java 21 的虚拟线程由 JVM 调度到少量平台线程上，遇到阻塞 IO 会自动让出，适合「一请求一线程」的模型，但要注意 synchronized/pinned 问题（JDK 21 里 synchronized 块可能钉住载体线程，JDK 24 已改善）。

**CPU 飙升排查。** 先确认范围：单机还是集群、哪个进程、哪个线程。步骤：`top` 找进程 → `top -Hp <pid>` 找线程 → 线程 id 转十六进制 → `jstack <pid> | grep -A 20 <nid>` 看栈；多采几次看是否是同一段代码。常见原因：死循环/正则回溯、频繁 GC（`jstat` 确认）、锁竞争/自旋、大量线程上下文切换、序列化/加密大对象、以及流量突增。工具：async-profiler/arthas（`profiler start`、`thread -n`）比 jstack 更高效；系统层用 `perf top`、`pidstat`。注意线上慎用 `gdb`/`ptrace`，会暂停进程；先摘流量再诊断。

**Prometheus 与 Grafana。** Prometheus 是拉模式（pull）：按 `scrape_configs` 定时抓取目标的 `/metrics`，时序数据存在本地 TSDB，用 PromQL 查询；配套 Alertmanager 做告警。Exporter 把系统/中间件指标转成 Prometheus 格式（node_exporter、mysqld_exporter）。Grafana 只是可视化层，配置 Prometheus 为数据源后用 PromQL 画图、做 Dashboard 和告警。Pushgateway 用于短生命周期任务（batch job）推送。要点：指标类型（Counter/Gauge/Histogram/Summary）、标签基数控制（别把 user_id 做标签）、以及采样间隔与保留策略。

**ELK 与日志防丢。** 链路：应用写日志（结构化 JSON）→ Filebeat/Logstash 采集 → Kafka 缓冲 → Logstash 解析/清洗 → Elasticsearch 存储与索引 → Kibana 查询。防丢：采集端 ack + 本地磁盘缓冲、Kafka 多副本 + `acks=all`、消费端手动提交 offset、ES 写关注（`wait_for_active_shards`）、以及端到端监控（采集延迟、丢弃计数）。高并发下要采样/分级（ERROR 全量、INFO 采样）、控制单条大小、按天建索引 + ILM 滚动删除。NoSQL 部分：KV（Redis）、文档（MongoDB）、宽表（HBase/Cassandra）、列存（ClickHouse）、图（Neo4j），按访问模式选型，别拿一种打天下。

**Java 位图权限。** 用 `long`/`BitSet` 存权限位：每个权限对应一位（`1L << n`），授权用或、校验用与、回收用与非。超过 64 位用 `BitSet` 或 `long[]`，注意并发安全（`BitSet` 非线程安全，读多写少可加锁或用 `AtomicLongArray`）。数据库存 `BIGINT`/`VARBINARY`，缓存存位图；权限变更要更新版本并失效缓存。优点是省空间、判断 O(1)；缺点是位含义要固定、可读性差、不适合动态权限（用 RBAC 表更合适）。回答时补一句「权限模型」：用户-角色-权限、数据权限与功能权限分开。

**LangChain 与 LangGraph。** LangChain 是 LLM 应用的工具箱：模型封装、Prompt 模板、检索、工具、Agent、回调与追踪，适合线性链路（RAG、问答、简单 Agent）。LangGraph 把流程建模成图（节点 + 边 + 共享状态），支持环、条件分支、持久化 checkpoint、人工介入、时间旅行，适合有状态、多步骤、需要恢复与分支的 Agent 工作流。选择标准：流程是否能写成 DAG、是否需要中断恢复与人工审批、是否需要多 Agent 协作。AI 生码准确率：给足上下文（相关文件、类型、错误日志）、要求先给方案再写、小步修改、用编译/类型检查/测试/静态分析兜底、以及人工 review；把「生成」当草稿而不是最终产物。

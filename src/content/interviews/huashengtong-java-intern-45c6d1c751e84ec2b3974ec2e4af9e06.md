---
title: "华盛通 Java 实习生一面：GC、网络、Spring 事务与 RAG 八股全串"
company: "华盛通"
position: "Java 实习生"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/45c6d1c751e84ec2b3974ec2e4af9e06
tags: ["华盛通","Java实习","JVM","JWT","Spring AOP","MySQL索引","线程池","RAG"]
summary: "华盛通 Java 实习生面经，全程五十多分钟、无手撕无反问：按主题串联 JVM 与 G1 垃圾回收、HTTP 各版本与 HTTPS 和 WebSocket、JWT 与 Session 的存取、Spring AOP 与动态代理及 @Transactional 失效场景、MySQL 慢 SQL 与索引规则、Redis 集群 Lua 与序列化、线程池参数与批量结果汇总、消息队列模型，最后问 RAG 的演进、落地方式与为什么不用向量库。"
---

### 《面试题目》

**JVM**

1. 了解垃圾回收器的机制吗？用的哪种？
2. 你的高并发项目里关注过 JVM 表现吗？用的什么收集器？
3. G1 的内存分块情况？相对之前的新生代与老年代有什么改变？

**计算机网络**

1. HTTP 1.1、2.0、3.0 有什么区别？
2. HTTP 和 HTTPS 的区别？
3. TLS 的加解密过程？用什么算法加密、解密？
4. WebSocket 和普通 HTTP 有什么区别？
5. WebSocket 报文有限制吗？你怎么发报文？
6. 项目里有固定的报文模板吗？

**认证与会话**

1. JWT 是做什么的？
2. Session 存在哪？JWT 的 Token 存在哪？请求时谁发送？
3. 浏览器存储分哪几种？听过 Cookie 吗？
4. JWT 的 Token 包含多少段？

**Spring**

1. Spring 的 AOP 依赖什么实现？
2. 动态代理有哪几种？
3. JDK 动态代理和 CGLIB 有什么区别？
4. `@Transactional` 什么情况下会失效？

**MySQL**

1. 给你一个慢 SQL，怎么分析和解决？
2. explain 能得到什么信息？
3. 建索引有什么规则？
4. 除了 WHERE，还有哪些子句影响索引命中？

**Redis**

1. 集群模式下写 Lua 要注意什么？
2. Redis 有哪些危险命令不建议用？
3. 这些方案是你自己想的吗？还是 AI 出的？
4. 压测怎么实现？
5. Redis 会涉及什么序列化？
6. 除了 Jackson 还有哪些 JSON 库？

**并发**

1. 线程池核心参数有哪些？
2. 线程池的运行逻辑是什么？
3. 拒绝策略有哪几种？
4. 1000 条 list，多线程执行后汇总结果，怎么处理？

**消息队列**

1. MQ 在项目里给你什么体验？了解到什么程度？
2. 队列满了怎么办？
3. MQ 除了队列还有什么？
4. topic 和 queue 有什么区别？

**AI 与 RAG 项目**

1. 讲一下 AI 与 RAG 的历史演进过程，可以结合你的项目讲。
2. RAG 具体怎么做？
3. 知识库数据量有多大？
4. 用的哪个 embedding 模型？
5. 为什么不用向量库？

### 《参考解析》

**JVM 与 GC**：GC 的主线是「怎么判定垃圾 + 分代怎么收」。判定用可达性分析——从 GC Roots 出发，引用不可达的对象即可回收；回收算法是标记清除、复制、标记整理三种，HotSpot 按分代落地：新生代用复制算法（Eden 加两个 Survivor，对象优先在 Eden 分配，经历若干次 Minor GC 仍存活就晋升老年代），老年代用标记整理或并发标记清除；停顿时间与吞吐量互相拉扯，所以才有了一代代收集器。**G1** 的答法要落到它和经典分代方案的根本差别：G1 把堆切成大小相等的 Region（默认最多约 2048 个，`-XX:G1HeapRegionSize` 可调，1MB 到 32MB），逻辑上仍保留 Eden、Survivor、Old，但它们是 Region 的动态集合而不是连续地址空间；超过 Region 一半的大对象按 Humongous 单独占连续 Region。这样 G1 就能维护每个 Region 的回收价值（垃圾占比与回收耗时），按 `-XX:MaxGCPauseMillis` 挑选性价比最高的一批 Region 做 Mixed GC，把停顿做成可预测的——这是 CMS 做不到的；G1 还用 SATB 快照解决并发标记期间对象消失的问题，整体没有 CMS 那种碎片化和并发模式失败。被问「项目里关注过 JVM 表现吗」时，别只答「用默认的」，可以说监控哪些指标（GC 频率与耗时、老年代增长曲线、Full GC 后是否回落）、用什么工具（`jstat`、GC 日志、arthas），以及为什么在什么量级下选了哪个收集器。

**HTTP 各版本、HTTPS 与 WebSocket**：HTTP/1.1 的核心问题是队头阻塞加上一个连接同时只能处理一个请求，靠 keep-alive 复用连接、管道化基本没落地；HTTP/2 引入二进制分帧、多路复用（一个 TCP 连接上并发多个流）、头部压缩与服务端推送，解决了应用层的队头阻塞，但只要底层还是 TCP，一个丢包就会卡住所有流；HTTP/3 换到基于 UDP 的 QUIC，按流独立重传，没有 TCP 层的队头阻塞，还支持 0-RTT 建连与连接迁移。HTTPS 等于 HTTP 加 TLS，解决机密性、完整性和身份认证三件事。TLS 握手简述：ClientHello（版本、密码套件、随机数）→ ServerHello 加证书 → 客户端验证证书链并协商预主密钥（现在主流是 ECDHE，具备前向安全性）→ 双方用随机数与预主密钥导出会话密钥 → 之后用**对称加密**（AES-GCM、ChaCha20-Poly1305）传输数据。关键结论是「非对称加密只用于协商和认证，业务数据走对称加密」，因为非对称慢几个数量级；追问常落在 TLS 1.2 与 1.3 的差别（1.3 把两次往返压到一次、砍掉 RSA 密钥交换和一堆弱套件）以及证书校验流程上。WebSocket 与 HTTP 的区别是「从请求响应变成全双工长连接」：握手借用 HTTP 的 `Upgrade: websocket`，之后是同一条 TCP 上的帧协议，服务端可以主动推送，帧只有 2 到 14 字节头部，开销远小于 HTTP 头。「报文有限制吗」要答：协议层没有硬上限，但浏览器、网关和服务端都会设 `maxFrameSize`、`maxMessageSize` 之类的限制，超了就断连，所以大消息要么分片、要么二进制分帧加应用层序号；生产上还要考虑 ping/pong 心跳保活、断线重连与补发，以及「固定报文模板」这种设计——用统一信封（type、seq、payload、时间戳、错误码）能显著降低沟通成本，但要留版本字段以便灰度升级。

**认证与会话**：Session 是「服务端保存状态、客户端只拿一个 ID」：Session 数据存在服务端（单机内存或 Redis 集群），浏览器通过 Cookie 里的会话标识携带，请求时按域自动带上，所以天然有 CSRF 风险，需要 `SameSite` 或 CSRF Token 防护。JWT 是「把状态签进 Token 里」：三段式 `header.payload.signature`，Base64Url 编码后签名，服务端只要验签就能拿到用户信息，**无状态、易横向扩展**；代价是签发后无法单方面作废（只能靠短过期加刷新令牌、黑名单或版本号）、payload 只是编码不是加密（不能放敏感数据）、令牌更长。Token 存哪是个真问题：`localStorage` 简单但 XSS 一拿就走；`HttpOnly + Secure + SameSite` 的 Cookie 能挡 XSS 读取但需要处理 CSRF；移动端可以放安全存储。浏览器存储要能区分 Cookie（随请求自动发送、有域和路径与过期）、`localStorage` 与 `sessionStorage`（纯客户端、易被 XSS 读取）、`IndexedDB`（异步、容量大、适合结构化数据）、Cache Storage（Service Worker 缓存资源）。「请求时谁发送」的答法正好点出差异来源：Cookie 由浏览器按域自动带，JWT 放在 `Authorization: Bearer` 头里则由前端代码显式带，这也是两者在 CSRF 与 XSS 上风险不同的根因。

**Spring：AOP、动态代理与 `@Transactional`**：Spring AOP 依赖**动态代理**在运行时织入——容器给 bean 生成代理对象，调用先经过拦截器链，再决定是否以及如何调用目标方法。两种动态代理：JDK 自带的 `Proxy`（要求目标实现接口，基于反射，代理对象与目标实现同一接口）和 CGLIB（生成目标类的子类并覆写方法，通过 FastClass 直接调用，性能略好，但无法代理 `final` 类与方法，也不能代理 `private` 方法）。Spring Boot 2.x 起 AOP 默认统一用 CGLIB（`spring.aop.proxy-target-class=true`）。`@Transactional` 失效的场景要能成串说出来：① **自调用**——同类里 `this.method()` 不走代理，注解完全不生效，这是最关键的一条；② 方法不是 `public`（默认事务切面对非 public 不生效）；③ 对象没被 Spring 管理（自己 `new` 出来的）；④ 异常被吞掉，或抛出的是受检异常（默认只对 `RuntimeException` 和 `Error` 回滚，受检异常要配 `rollbackFor`）；⑤ 传播行为设成 `NOT_SUPPORTED`、`NEVER`，或者异常在另一事务里被 catch 了；⑥ 数据库引擎不支持事务（MyISAM）；⑦ 事务里做耗时 RPC 或缓存操作，形成长事务、连接被占；⑧ 多数据源下用错了事务管理器。追问通常接着问怎么解决：自调用改成注入自身代理，或把方法拆到另一个 bean，或用 `TransactionTemplate` 显式控制边界，根本上就是把事务边界画在 service 最外层。

**MySQL：慢 SQL 分析与索引**：排查顺序是「先定位、再解释、后改造」。先用慢查询日志（`slow_query_log` 配 `long_query_time`）或 `performance_schema` 找出最耗时的语句；再用 `EXPLAIN` 看执行计划，重点字段是 `type`（从 `ALL` 全表扫描到 `index`、`range`、`ref`、`eq_ref`、`const`）、`key` 与 `possible_keys`（实际用了哪个索引、为什么没用上）、`rows`（预估扫描行数）、以及 `Extra`（`Using filesort`、`Using temporary`、`Using index` 覆盖索引、`Using where`）；MySQL 8.0 的 `EXPLAIN ANALYZE` 还能给真实耗时。常见改造手段：补或改索引（最左前缀、覆盖索引省掉回表）、收窄 `SELECT *`、避免在索引列上做函数或运算、让 `ORDER BY` 与 `GROUP BY` 走索引以免 filesort 和临时表、深分页改游标（`WHERE id > ? LIMIT n`）、先缩小结果集再分页，数据量太大再谈分区、分表与归档。索引规则要点：区分度高的列优先、联合索引最左前缀、范围查询后面的列用不上索引（`a = ? AND b > ? AND c = ?` 里 c 用不到）、尽量走覆盖索引减少回表、控制索引数量（写放大、优化器还可能选错）、`NULL` 与隐式类型转换和字符集不一致都会让索引失效。问「除了 WHERE 还有哪些子句影响索引命中」，答案就是：`ORDER BY` 与 `GROUP BY`（能借索引免排序）、`JOIN` 的关联列（被驱动表的关联列必须有索引）、`HAVING`（通常先聚合再过滤，但它引用的列是否在索引里会影响计划）、`LIMIT`（配合排序时决定走索引还是 filesort），以及 `SELECT` 列表（决定能否覆盖索引）。

**Redis：集群 Lua、危险命令与序列化**：集群模式下写 Lua 的第一条约束是**所有 key 必须在同一个 slot**——Redis Cluster 把 16384 个槽分给各节点，一次脚本执行中访问的 key 必须落在同一节点，否则报 `CROSSSLOT Keys in request don't hash to the same slot`；做法是用 hash tag，把需要一起操作的 key 写成 `{user:1}:name` 这种形式，让大括号内的部分参与哈希、把它们绑到同一个槽。第二条是**脚本要短**：Lua 在 Redis 的单线程里执行，脚本阻塞会卡住整个实例，所以循环次数要有上限，绝不在脚本里做全量遍历。第三条是**不要有随机写入**：带写命令的脚本要求确定性，否则主从复制和重放会不一致（`redis.replicate_commands()` 之后才缓解），生产上还要用 `EVALSHA` 加脚本缓存，避免每次传整段脚本。危险命令：`KEYS *`（O(N) 阻塞，线上必须换 `SCAN`）、`FLUSHALL` 与 `FLUSHDB`（清库，生产要 rename-command 禁用或严格权限）、`CONFIG SET`（改配置可能触发重写）、`MONITOR`（拖慢实例且可能泄露数据）、`DEBUG` 系列、`SHUTDOWN`、无参数的 `SORT`，以及在大 key 上直接 `DEL`（该用 `UNLINK` 异步删）。它们的共同点是：在单线程实例上带来不可控的耗时或不可逆的破坏。序列化这块：Redis 存的是字节，`StringRedisTemplate` 用 String 序列化；`RedisTemplate` 默认 JDK 序列化，可读性差、跨语言不通、还有反序列化安全风险，生产更常用 JSON（Jackson）或 protobuf、kryo，key 一律用 String 序列化。JSON 库除了 Jackson 还有 Gson、Fastjson（历史漏洞多，新项目不建议）、Fastjson2、JSON-B 等，选型看解析性能、流式支持、安全记录与生态。「这些方案是你自己想的还是 AI 出的」这题的破法是给细节：讲你踩过的坑、做过的对比和量到的数字，真做过的人才说得出来。

**并发：线程池与批量结果汇总**：核心参数七个——`corePoolSize`、`maximumPoolSize`、`keepAliveTime` 与时间单位、`workQueue`、`threadFactory`、`handler`（拒绝策略）。运行逻辑要按顺序说清：提交任务时，① 线程数小于 core 就新建核心线程；② 否则入队，**注意只有队列满了才会扩容到 max**，所以用无界队列时 `maximumPoolSize` 形同虚设，这也是「线程池为什么只有一个线程在跑」的经典坑；③ 队列满且线程数小于 max 才新建非核心线程；④ 队列满且线程数等于 max 就触发拒绝策略；空闲的非核心线程超过 `keepAliveTime` 回收，核心线程默认不回收（可用 `allowCoreThreadTimeOut` 改）。拒绝策略四种：`AbortPolicy`（抛 `RejectedExecutionException`，默认）、`CallerRunsPolicy`（调用者线程执行，起到反压作用）、`DiscardPolicy`（静默丢弃）、`DiscardOldestPolicy`（丢最老的再试）；生产上更常见的是自定义策略——落库或落 MQ 削峰并打点告警，因为静默丢任务一定会丢数据。实践里还要提线程数怎么定（CPU 密集型约为核数加一，IO 密集型按「核数 ×（1 + 等待时间 / 计算时间）」估算，最终靠压测）、`ThreadPoolExecutor` 优于 `Executors` 工厂方法（后者容易造出无界队列或无界线程），以及给线程池命名并监控活跃线程数与队列长度。**1000 条 list 多线程执行后汇总**的答法：把任务拆批（比如 100 条一批共 10 个任务），用 `CompletableFuture.allOf` 或 `invokeAll` 加 `Future.get` 收集结果，也可以用 `CountDownLatch` 配线程安全容器（`ConcurrentLinkedQueue`、`ConcurrentHashMap`）。关键点在于：结果容器要线程安全；异常必须显式处理（`future.get()` 会抛 `ExecutionException`，不 catch 就等于吞掉）；顺序问题（按提交顺序取 Future 就能保持顺序）；线程池大小与批量大小要匹配（别把 1000 个任务丢进 4 个线程的池里指望它快）；任务本身要无共享状态。如果这 1000 条是 IO 调用，还要用信号量之类的限流，避免把下游打挂。

**消息队列：定位、容量与模型**：MQ 在项目里解决的问题就三类——**解耦**（生产者不关心谁消费）、**削峰**（把突发流量缓冲成平稳消费）、**异步**（把非关键路径从主链路摘出去，降低响应时间），代价是引入最终一致性与运维复杂度。「队列满了怎么办」要先分「谁满了」：如果是 Broker 端存储或配额满，通常是消费太慢，第一反应是扩消费者并提高单条处理效率（批量消费、异步化、去掉同步 RPC）；同时做反压——生产端降级（丢弃非关键消息、合并写、限流）或临时落本地磁盘与数据库，恢复后回灌；如果是线程池或内存队列满，就走拒绝策略加告警，绝不能静默丢。工程手段还有：给消息设 TTL 与死信队列，把处理不了的消息隔离出来而不是卡住整条队列；延迟消息做重试退避；扩分区提并行度；以及先把「消息积压」监控出来（消费延迟告警）。「MQ 除了队列还有什么」考的是模型理解，至少要提到主题、分区或队列（并行与顺序的单位）、offset 与消费位点、消费组（广播还是集群消费）、副本与 ISR（可靠性），以及事务、幂等、延时、死信这些能力。「topic 和 queue 的区别」：topic 是逻辑上的消息分类，生产者只认它；queue 是物理上承载消息、决定并行度与顺序的单元——Kafka 里 topic 由多个 partition 组成，只保证分区内有序，这个结论一定要说清；RabbitMQ 的模型是 exchange 路由到 queue、客户端直接消费 queue，那里的 topic 只是交换机的一种类型。先点明「这取决于哪套 MQ」会显得很稳。

**AI 与 RAG：演进、落地与不用向量库的理由**：演进可以按三段讲：早期是纯大模型生成（知识固化在参数里、有截止时间、容易幻觉）→ 检索增强生成（把外部知识在推理时作为上下文注入，解决时效与私域数据问题）→ 现在的 Agentic RAG（检索变成模型可调用的工具之一，配合多轮规划、工具链、重排与自检）。RAG 的最小链路是：文档解析与**切分**（按语义、标题或固定长度切并保留重叠与元数据）→ **embedding** 编码入库 → 用户提问同样编码 → **召回**（向量近邻加关键词 BM25 的混合检索，多路各取 topK）→ **重排**（用 cross-encoder 或大模型精排，把候选从几十条收敛到几条）→ 拼进提示词并**带引用**生成 → 反馈与评测（命中率、忠实度、有没有引用不存在的来源）。真正决定效果的是切分策略、混合召回和重排，而不是换了哪个向量库；embedding 模型选型看中文效果、维度、是否支持长文本与本地部署（如 `bge-m3`、`gte` 系列等）。「为什么不用向量库」的标准答法是按规模与成本算账：知识库只有几万条以内时，用已有的 MySQL 或 PostgreSQL（`pgvector`）、或者 Elasticsearch 的 `dense_vector`，就能同时拿到混合检索与事务和权限能力，**少维护一套中间件**是实打实的收益；数据到了百万千万级、需要多路召回、倒排与向量的原生融合、或者对召回延迟有硬指标，再换专用向量库（Milvus、Qdrant、Chroma 等）。另外按用户权限过滤文档，在业务库里做天然更简单。被追问时最好的答案是给出你实际做过的对比数字——试过几种切分长度、召回率差多少，这类细节才是「这方案是我自己想的」的证据。

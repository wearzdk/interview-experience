---
title: "拼多多 服务端开发秋招二面：Redis 集群扩容、分布式锁与缓存一致性"
company: "拼多多"
position: "服务端开发"
round: "二面"
date: '2026-09'
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/930769682645155840"
tags: ["Redis", "Redis集群", "分布式锁", "缓存一致性", "内存管理", "主从复制", "服务端开发"]
summary: "拼多多服务端开发秋招二面，全程围绕 Redis：槽迁移 ASK 与 MOVED、主从切换双持锁与 fencing、热点 Key 与本地缓存一致性、内存碎片与 activedefrag、部分重同步与 backlog 估算、缓存库双写一致性。"
---

### 《面试题目》

1. Redis 集群扩容时，正在迁移的槽收到请求会发生什么？客户端访问旧节点怎么办？
2. Redis 分布式锁在主节点故障切换后，为什么仍可能出现两个持锁者？
3. 热点 Key 已经把 Redis 打满，本地缓存又有一致性风险，怎么处理？
4. Redis 内存淘汰策略会造成内存碎片吗？碎片很高时怎么处理？
5. 主从复制中，什么时候能部分重同步？什么时候只能全量复制？
6. Redis 缓存穿透时，怎么确定空值缓存的过期时间？
7. 缓存和数据库双写，为什么“先更新数据库，再删除缓存”仍不能保证强一致？
8. appendfsync everysec 下，AOF 最多只会丢一秒数据吗？
9. 一个大 Key 删除后，为什么 Redis 内存没有立刻下降？
10. Redis 达到 maxmemory 后，过期键和淘汰策略分别起什么作用？
11. Redis Cluster 中，一段 Lua 脚本访问多个 Key，为什么在单机能运行，到了集群却失败？
12. Redis Stream 消费组里，消费者处理成功后宕机，但还没执行 XACK，会怎样？
13. Redis 出现慢客户端时，为什么其他请求的延迟也会上升？
14. 缓存击穿时，用互斥锁重建缓存会带来什么新问题？
15. 请做一下自我介绍？

### 《参考解析》

**ASK 是临时改道，MOVED 才是永久改址**：槽迁移不是瞬间切换归属的。`redis-cli --cluster reshard` 背后做的是三步：源节点 `CLUSTER SETSLOT <slot> MIGRATING <target-node-id>`，目标节点 `CLUSTER SETSLOT <slot> IMPORTING <source-node-id>`，然后循环 `CLUSTER GETKEYSINSLOT <slot> 100` 取键、`MIGRATE <target-ip> <target-port> "" 0 5000 KEYS k1 k2 ...` 搬键，全部搬完后才 `CLUSTER SETSLOT <slot> NODE <target-node-id>` 并把新归属广播给集群。中间态决定了两种重定向语义完全相反。

源节点处于 MIGRATING 时：命令涉及的键如果都还在本地，正常执行；只要有一个键已经迁走，就返回 `-ASK <slot> <target-ip>:<port>`——含义是“这个键恰好搬走了，你临时去目标节点问一次”，槽的归属并没有变。目标节点处于 IMPORTING 时默认拒绝对该槽的请求并回 `-MOVED`，客户端必须先发一条 `ASKING`（一次性标记，只对紧随其后的那一条命令生效），目标节点才肯处理。

所以客户端动作要分清楚：收到 ASK，就向目标节点发 `ASKING` 再**原样重发**同一条命令，拿到结果即结束，**不要改本地槽映射**；收到 MOVED，才更新本地槽映射，后续直接打新节点。把 ASK 当成 MOVED 的后果很实在：客户端把“临时借道”记成了“槽已归目标节点”，于是仍在源节点上的键被持续发往目标节点，目标节点回 MOVED，客户端又改回来，来回震荡——重定向比例飙升、每个请求多一跳、迁移期间尾延迟明显恶化。反过来把 MOVED 当 ASK，每次都要多一次 `ASKING` 往返。

工程上还有三点：一是客户端要开拓扑刷新，Lettuce 用 `ClusterTopologyRefreshOptions.enableAllAdaptiveRefreshTriggers()` 加 `enablePeriodicRefresh()`；二是 `MIGRATE` 是同步的，搬大 Key 会阻塞主线程，用 `--cluster-pipeline` 控制每批键数并避开高峰；三是迁移中途要放弃就用 `CLUSTER SETSLOT <slot> STABLE` 清掉 MIGRATING/IMPORTING 标记，别留半迁移状态。观测上，客户端侧的 ASK/MOVED 次数与重试次数是最直接的信号，服务端可用 `INFO commandstats` 看 `asking`、`migrate` 的调用量，`CLUSTER COUNTKEYSINSLOT <slot>` 看还剩多少键没搬，再配 `redis-cli --latency-history` 盯尾延迟。

**随机 token 防的是误删，防不了主从切换的双持锁**：标准实现是 `SET lock:order:1001 <token> NX PX 30000`，解锁用 Lua 比对 token 再删：`EVAL "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end" 1 lock:order:1001 <token>`。这段脚本解决的是“A 超时后误删 B 的锁”，解决不了双持：A 在主节点 SET 成功、这次写入还没复制到从节点主节点就宕机，Sentinel/Cluster 提升了一个没收到该写入的从节点，B 用同一个键 SET NX 也成功——A 和 B 都认为自己持锁。

`WAIT 1 100` 能缩小窗口（返回真正 ack 的副本数），但它不是共识：等到 ack 的副本仍可能在后续故障转移中丢数据，WAIT 本身有超时，会把写延迟顶高，Cluster 下也只等该分片的副本。`min-replicas-to-write 1` 加 `min-replicas-max-lag 10` 让主节点在从节点掉线时拒写，是拿可用性换数据安全，且只是缩小“未复制窗口”，不是消灭它。

正解是 fencing token：授予锁时同时发一个单调递增的编号（Redis 里可以 `INCR lock:fence`，etcd 用 revision，ZooKeeper 用 zxid），下游资源在写入时校验编号严格大于自己见过的最大值，否则拒绝。这样即使 A 已过期、B 已持锁，A 迟到的写也会被存储层挡掉，互斥从“Redis 里的一个键”下沉成“资源上的单调约束”。落到数据库就是 `UPDATE stock SET n = n - 1, fence = :token WHERE id = :id AND fence < :token`，影响行数为 0 即判定为过期写。选型上，资金、库存这类不能容忍双写的关键路径直接用 etcd/ZooKeeper（多数派 + lease + revision）或数据库唯一约束、行锁，别指望单实例 Redis 锁；用 Redis 锁时把看门狗续期、token CAS 解锁、fencing 校验三件事一起做，并明确锁只用于减少冲突，正确性由下游幂等与 fence 兜底。

**热点 Key：先定位瓶颈，再决定拆键、扩副本还是本地挡**：定位要拿数据，别凭感觉。看热 key 用 `redis-cli --hotkeys`（前提是 `maxmemory-policy` 为 LFU 系列，如 `allkeys-lfu`，必要时调大 `maxmemory-samples`），或对单个键 `OBJECT FREQ <key>`；看大 Key 用 `redis-cli --bigkeys`、`MEMORY USAGE <key> SAMPLES 0`；判断是不是单核打满看 `INFO cpu`、`INFO stats` 的 `instantaneous_ops_per_sec` 与 `instantaneous_input_kbps/output_kbps`；看延迟分布用 `redis-cli --latency-history`，只看平均值会被尾延迟骗过去。用 `MONITOR` 在线采热点本身会加重负担，生产更推荐客户端埋点或按命令维度看 `INFO commandstats`。

确认流量性质（正常高峰、突发事件还是恶意刷）后按瓶颈分层处理：网络带宽打满，就拆大 value、压缩、只取需要的字段（`HGET` 代替 `HGETALL`），并用 `client-output-buffer-limit` 限制单次返回规模；单分片单核打满，就拆键（`item:1001` 拆成 `item:1001:{0..9}`，读侧按请求 hash 选分片，或把大 HASH 按 field 分段）或把读流量导给副本（连接发 `READONLY`，用 `INFO replication` 的从节点 offset 和 lag 把关）；回源压力打到数据库，才轮到本地缓存加短 TTL 与主动失效。

本地缓存的一致性靠三件事兜住：一是变更时广播失效（`PUBLISH cache:invalidate "item:1001"`，各实例订阅后删本地条目），二是本地条目带数据版本，回填只在版本更新时写入，防止乱序通知把新值覆盖成旧值，三是 TTL 兜底并且加抖动，比如 `300 + random(0, 60)` 秒——所有实例同一时刻到期，本地缓存就退化成了另一次集中回源。业务允许短时间读到旧值时可以用逻辑过期：value 里存 `expireAt`，读到已过期时只有拿到 `SET lock:refresh:item:1001 <token> NX PX 3000` 的请求去异步重建，其余直接返回旧值；不允许读旧值的场景（价格、库存扣减）不能用这套掩盖一致性要求，只能限流保护数据源并降级，或让这类读直接穿透到数据库。

**内存碎片要看三个比值，activedefrag 只治分配器碎片**：`INFO memory` 里最常被误用的是 `mem_fragmentation_ratio = used_memory_rss / used_memory`。数据集很小时这个比值天然偏高（进程本身开销、复制 backlog、客户端输出缓冲区占比大），据此下结论容易误判。Redis 4 之后给出了更细的口径：`allocator_allocated`、`allocator_active`、`allocator_resident`，以及 `allocator_frag_ratio`（active/allocated，反映分配器内部碎片）、`allocator_rss_ratio`、`rss_overhead_ratio`、`mem_fragmentation_bytes`。诊断顺序是：`ratio < 1` 先怀疑发生了 swap（比碎片严重得多）；`allocator_frag_ratio` 高说明确实是分配器碎片；`allocator_rss_ratio` 或 `rss_overhead_ratio` 高说明 jemalloc 把 dirty page 攥在手里没还给操作系统。`MEMORY DOCTOR` 给结论，`MEMORY STATS` 给按用途拆分的明细，`MEMORY MALLOC-STATS` 输出 jemalloc 的 arena/bin 原始数据。还要排除伪影：BGSAVE/AOF rewrite 期间 fork 的 copy-on-write 会让 RSS 短时翻倍，`mem_replication_backlog`、`mem_clients_normal`、`mem_clients_slaves`、`mem_aof_buffer`、`mem_not_counted_for_evict` 这些也不属于你的数据模型。

成因在于分配器按 size class 分配：频繁创建和删除大小不一的对象（大 Key 反复改写、`APPEND`/`SETRANGE` 让 value 持续增长、大量短 TTL 键滚动过期）会让空闲块散落在不同 bin 里，页回不到操作系统，RSS 就明显高于真实数据量。淘汰确实会释放对象，但释放只是把块还给分配器，不等于还给 OS。

确认是分配器碎片且已经影响内存水位时，开主动整理：`activedefrag yes`，配合 `active-defrag-ignore-bytes 100mb`、`active-defrag-threshold-lower 10`（碎片率低于 10% 不动手）、`active-defrag-threshold-upper 100`、`active-defrag-cycle-min 1` 与 `cycle-max 25`（占 CPU 的上下限）、`active-defrag-max-scan-fields 1000`；效果看 `INFO memory` 的 `active_defrag_hits/misses`、`active_defrag_key_hits/misses`、`total_active_defrag_time`。它会吃 CPU，放低峰或只开在从节点。`MEMORY PURGE` 可以触发一次页回收，但效果有限；彻底解决靠重启，要用“先切到副本再重启旧主”的滚动方式，不能整体停服。治本还是控制数据模型：不让单个键无限增长，不让 value 尺寸分布过于离散。

**能不能部分重同步，取决于 replid 和 backlog 两个条件**：从节点断线重连后发 `PSYNC <replid> <offset>`。主节点同意部分重同步（回 `+CONTINUE`）要同时满足两条：其一，这个复制 ID 它还认——匹配 `master_replid`，或者（Redis 4 之后支持故障转移后的续传）匹配 `master_replid2` 且 offset 不超过 `second_repl_offset`；其二，请求的 offset 仍落在积压缓冲区内，即不低于 `repl_backlog_first_byte_offset`，对应命令还没被新写入覆盖。

任一条不满足就回 `+FULLRESYNC <replid> <offset>` 走全量：BGSAVE 生成（`repl-diskless-sync yes` 时直接走 socket 不落盘）、传输、从节点清库加载（`repl-diskless-load on-empty-db`），期间从节点按 `replica-serve-stale-data` 决定继续用旧数据还是直接报错。主节点重启后若没做 RDB 持久化，`master_replid` 会变，此时必然全量。

`repl-backlog-size` 默认只有 1MB，`repl-backlog-ttl` 默认 3600 秒（没有从节点挂多久后释放）。估算口径是：`repl-backlog-size >= 写入速率 R (byte/s) × 预期最长断线时长 T (s) × 安全系数 2`，其中 `R ≈ (master_repl_offset(t2) - master_repl_offset(t1)) / (t2 - t1)`，T 要算上故障发现（`sentinel down-after-milliseconds`）、故障转移、从节点重连重同步三段时间。例如 R = 2MB/s、T = 120s，则至少 480MB，取 512MB。注意 backlog 是常驻内存，如果算出来要好几 GB，通常说明该接受偶发全量同步，而不是把内存全留给它。

最该盯的指标是 `INFO stats` 里的 `sync_full`、`sync_partial_ok`、`sync_partial_err`：`sync_partial_err` 长期不为 0，说明大量重连都退化成全量了。先加 backlog，再查根因——是不是 `repl-timeout 60` 太小、网络抖动频繁断连，或者 `client-output-buffer-limit replica` 太小把慢副本直接踢下线（副本输出缓冲区溢出是导致全量同步的常见原因）。`repl-ping-replica-period` 的心跳与 `repl-timeout` 之间要留足余量。

**“先更新数据库再删缓存”为什么还会脏**：cache-aside 的两步不是原子的，破口有两个。一是删除这一步失败或进程在删除前崩溃：数据库已提交，缓存里还是旧值，如果又没设 TTL 就是长期脏数据。二是并发交错：读请求 A 在数据库读到旧值（写请求 W 提交之前），W 提交并删除缓存，之后 A 才把自己读到的旧值写回缓存，缓存里就此留下旧值，并在热点键上反复发生。顺带说一句，“删缓存”比“更新缓存”好：更新缓存要额外处理两个并发写的覆盖顺序，还可能把根本不会再被读到的键写进去，是写放大；删除则把成本推给下一次读的懒加载。

缓解是一套组合拳，不是单点绝招。第一，TTL 兜底，按业务容忍度设，明确缓存只做加速层。第二，删除失败要有可靠重试：本地消息表、事务消息，或直接订阅 binlog（Canal 投递到 MQ，消费者负责删缓存），后者天然把“删缓存”和数据库变更绑在一起，且可重放；MQ 要按 key 分区保证同 key 顺序，消费侧做幂等。第三，延迟双删：更新后再删一次，间隔取“一次读请求耗时 + 主从复制延迟”的量级（常见 300ms 到 1s）再删一次，它只能缩小窗口，不能消除。第四，回填带版本：数据库行里有 `version` 或 `updated_at`，缓存 value 里也带，回填写入用 Lua 比较版本，只允许更新的版本覆盖，避免慢读覆盖新值。第五，读路径加 singleflight，让同一个 key 只有一个回源请求，既防击穿也减少乱序回填。

如果业务真的要求强一致，就不要在缓存层找办法：同一 key 的读写走同一把分布式锁或数据库行锁（代价是吞吐），或者干脆让这类数据不进缓存，把强一致交给数据库约束去兜——唯一索引、乐观锁 version、带条件的 `UPDATE ... WHERE`。另外建议做抽样对账，定期比对缓存与数据库的值，统计不一致比例和驻留时长，比争论“会不会不一致”有用得多。

**其余题目的要点**：

- `appendfsync everysec` 的“最多丢 1 秒”只是正常刷盘节奏下的近似。主线程只把命令 `write` 进内核页缓存，后台线程每秒 fsync 一次，fsync 排队延迟、磁盘故障、崩溃发生的时刻都会让丢失窗口超过 1 秒。而且 AOF 和复制解决的不是同一件事：从节点收到写入不代表双方都已持久化，设计恢复目标时要分别确认客户端收到成功的条件、刷盘策略、复制状态和可接受的数据丢失窗口。
- 大 Key 删除后内存不降：`DEL` 同步释放、会阻塞主线程，`UNLINK` 只把键从键空间摘除，真正释放交给后台线程，所以命令返回不代表内存已回收。对象释放完了，分配器也未必立刻把页还给 OS，`used_memory` 与 RSS 的下降时点本就不同。还要确认不是业务又往同一个集合里写、或缓存回填立刻重建了大 Key。
- maxmemory 之后的过期与淘汰是两回事：过期是逻辑失效，靠访问时惰性删除加后台定期抽样清理，不保证 TTL 到点立刻释放全部内存；淘汰是内存达到 `maxmemory`、需要腾空间处理写入时按 `maxmemory-policy` 选键移除。`allkeys-lru` 在全键空间选，`volatile-lru` 只在设了 TTL 的键里选，可淘汰候选不足时写命令会直接报内存不足。既当不可丢的存储又当可任意淘汰的缓存，是需要先解决的设计冲突。
- 集群里的 Lua：集群按槽路由，脚本里的多个 Key 不在同一槽就报 `CROSSSLOT`，包进 `EVAL` 不会凭空获得跨节点事务能力。需要原子操作的一组键用 hash tag，例如 `order:{1001}:state` 和 `order:{1001}:lock`；但不能给所有键都加同一个 tag，那等于把数据全压到一个槽上。脚本用到的键要通过 `KEYS` 参数传入，便于客户端正确路由。
- Stream 的 PEL：消息处理成功但没 `XACK`，它仍留在待处理列表里，其他消费者可以在满足闲置时间条件后 `XAUTOCLAIM`/`XCLAIM` 认领重试，所以同一条消息可能被处理多次，业务必须以消息 ID 或业务唯一键做幂等。`XPENDING` 看闲置时长，认领阈值不能设太短，否则只是处理较慢的正常消费者就会被抢走消息。
- 慢客户端拖慢别人：命令执行快不等于响应发得出去，输出缓冲区堆积会占内存和网络，叠加大批量返回、复杂命令或大 Key 时，其他请求的尾延迟也会被带起来。排查要区分“命令执行慢”（`SLOWLOG GET`、`LATENCY DOCTOR`）与“网络发送慢”（`INFO clients` 的输出缓冲区、`client-output-buffer-limit`、连接数、网卡吞吐）。治理靠限制单次返回量、分页或游标读取、设置合理的输出缓冲上限。
- 缓存击穿用互斥锁的副作用：等待方排队、尾延迟陡增；持锁者崩溃或重建耗时超过锁 TTL 时，会有多个请求先后进入重建流程。所以要显式定义等待方行为——短暂等待重试、返回允许范围内的旧值，还是直接限流失败；重建写回时带上数据版本，避免较慢的旧重建结果覆盖后来产生的新数据。

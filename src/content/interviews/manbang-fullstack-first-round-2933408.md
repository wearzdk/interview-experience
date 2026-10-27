---
title: "满帮全栈一面：Kafka 异常与幂等、冷热归档跨查询、联合索引最左匹配"
company: "满帮集团"
position: "全栈开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/a594d16291ca45498dd7bf094c0d1838
tags: ["满帮", "全栈开发", "一面", "Kafka", "消息队列", "幂等", "冷热归档", "联合索引", "Java版本"]
summary: "满帮全栈一面 45 分钟：先确认 base 地、绩点与未来打算，再问笔试为什么简历写 Java 却用 C++ 作答、Java 与 C++ 的区别；实习部分深挖系统上下游与数据来源、Kafka 异常消息与 DLQ、如何保证消息投递、幂等实现、消息队列与 RPC 的取舍、Kafka/RocketMQ/RabbitMQ 对比、冷热数据为什么以 3 个月为界及跨冷热查询怎么处理；数据库问慢 SQL 定位、EXPLAIN 怎么看、索引失效与最左匹配；最后问 Java 8/17/21 的差异与升级。"
---

### 《面试题目》

1. 笔试你简历写的是 Java，为什么用 C++ 作答？Java 和 C++ 有什么区别？
2. 你们系统的上下游是什么，数据从哪里来？
3. Kafka 如何处理异常消息？DLQ（死信队列）怎么使用？
4. 如何保证消息投递？
5. 考不考虑幂等性，如何实现幂等性？
6. 消息队列和 RPC 的区别、各自的适用场景是什么？
7. 比较一下 Kafka、RocketMQ、RabbitMQ。
8. 冷热数据归档为什么以 3 个月为区分？如何处理跨冷热查询？
9. 如何定位慢 SQL？EXPLAIN 命令怎么看？
10. 索引失效的原因有哪些？联合索引的最左匹配原则和失效情况？
11. 你的简历横跨 Java 8、17、21，使用上有什么区别？如何升级？
12. 反问：具体业务会再分配吗？全栈侧重哪一端？

### 《参考解析》

**Kafka 的异常处理有三层**：消费端业务异常分「可重试」（网络抖动、下游超时——退避重试）与「不可重试」（反序列化失败、数据格式非法——直接进死信）；实现上 Spring Kafka 有 `DefaultErrorHandler` + `DeadLetterPublishingRecoverer`，把失败消息投到 `<topic>.DLT` 并记录原 topic/partition/offset；死信要有告警与人工重放通道，否则等于黑洞。重复投递的边界是「至少一次」语义，所以幂等必须由业务侧兜。

**保证投递**要拆成三段：生产者（`acks=all` + 重试 + 幂等 producer `enable.idempotence=true` 防重复写）、broker（副本 `min.insync.replicas>=2`，`unclean.leader.election=false`）、消费者（先处理后提交 offset，或处理后写结果再手动 ack；提交前崩溃会重复消费，所以幂等）。这条链讲清楚，比背「不丢不重」的口号强。

**幂等的实现**按成本排序：唯一索引 / 数据库约束（最硬）、Redis `SETNX` 幂等键（带 TTL，注意原子性与过期时间）、状态机（只允许 `PENDING→PAID` 这类单向流转，重复消息因状态不符被丢弃）、版本号 / CAS。幂等键的选取要说清（业务单号、消息 ID + 消费组）。

**MQ vs RPC**：RPC 是同步请求-响应、强时序、适合「我要立刻知道结果」的调用；MQ 是异步解耦、削峰填谷、广播、最终一致，代价是延迟与复杂度（重复、乱序、积压）。选型上 Kafka 吞吐最高、适合日志与流式、生态偏大数据；RocketMQ 事务消息与延迟消息成熟、适合电商交易；RabbitMQ 路由灵活（exchange 类型多）、延迟低、适合业务解耦与中小规模。

**冷热归档的「3 个月」是业务与成本的折中**：按查询分布看，绝大多数查询落在近三个月，把更早的数据移到冷存储（对象存储 / ClickHouse / 归档表）能显著降主库体积与索引维护成本；跨冷热查询要么在应用层合并两次结果再排序分页（注意分页总数与排序一致性），要么用统一查询层（如 TiDB / ClickHouse 做联邦查询），要么在归档时就按查询维度预聚合。

**EXPLAIN 看四列**：`type`（`const > eq_ref > ref > range > index > ALL`，出现 ALL 基本要加索引）、`key`（实际用的索引）、`rows`（预估扫描行数）、`Extra`（`Using index` 覆盖索引、`Using where`、`Using filesort`、`Using temporary` 要警惕）。加 `EXPLAIN ANALYZE` 能看真实耗时。最左匹配：联合索引 `(a,b,c)` 能命中 `a`、`a,b`、`a,b,c`，跳过 `a` 直接查 `b` 就用不上；范围查询后面的列失效（`a>1 and b=2` 中 b 无法用于定位）；`order by` / `group by` 也遵循同样的顺序要求。

**Java 8/17/21 的实质差异**：17 是 LTS，带来 sealed class、records、switch 模式匹配预览、强封装 JDK 内部 API（`--add-opens` 需求变多）；21 是 LTS，虚拟线程（`Thread.ofVirtual()`）、结构化并发预览、分代 ZGC、`switch` 模式匹配转正、`SequencedCollection`。升级的实际障碍是 `javax → jakarta`（Servlet/JPA 命名空间整体改名）、反射与字节码库（CGLIB/ASM）对强封装的适配、以及依赖链里不兼容的旧框架版本；策略是先升 17 稳住（主流框架都已支持），再评估 21 的虚拟线程是否真的适配你的阻塞式 IO 模型。

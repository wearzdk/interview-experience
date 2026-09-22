---
title: 招银网络二面：CAS、深分页与DDD模型
company: 招银网络
position: Java后端开发
round: 二面
date: '2026-09'
result: 已挂
source: 牛客网
tags: ["Java","并发编程","深分页","MySQL","DDD","RabbitMQ","贫血模型"]
summary: "招银网络9月21日线下二面，30多分钟，无手撕，考察CAS、synchronized与Lock、深分页SQL手写与跨表方案、DDD及贫血充血模型、RabbitMQ数据流向，面完即挂。"
---

### 《面试题目》

1. CAS
2. synchronized
3. Lock
4. 深分页 SQL，现场手写
5. 深分页跨表查询 SQL 和业务层怎么设计
6. 什么是 DDD
7. 贫血模型、充血模型
8. 画一下 RabbitMQ 的数据流向

### 《参考解析》

**CAS**：Compare And Swap，比较并交换，是一条原子指令语义：只有内存当前值等于期望值时才写入新值，否则失败。Java 侧通过 `Unsafe#compareAndSwapInt` 等 native 方法暴露，`AtomicInteger`、`AtomicReference`、`ConcurrentHashMap` 的桶头节点写入都建立在它之上；CPU 层面对应 x86 的 `cmpxchg` 配合 `lock` 前缀（或 ARM 的 `ldrex/strex`、LL/SC 对）来保证跨核原子性。要答出三个典型问题：一是 ABA，值从 A 改成 B 又改回 A，CAS 察觉不到，解法是加版本号（`AtomicStampedReference`）或改用不可变引用；二是自旋开销，高竞争下大量线程空转，通常配合退让或分段（`LongAdder`）缓解；三是只能保证单个变量的原子性，多变量要么合并成一个对象引用，要么加锁。

**synchronized**：JVM 内置的互斥锁，修饰实例方法锁 this、静态方法锁 Class 对象、代码块锁指定对象。实现上对象头 Mark Word 记录锁状态，经历无锁 → 偏向锁 → 轻量级锁（CAS 自旋）→ 重量级锁（monitor，涉及用户态到内核态切换）的升级路径，升级不可逆。它保证原子性、可见性（解锁前的写会刷回主存，加锁时清空工作内存重新读）和有序性；可重入靠 monitor 的计数。语义上不可中断、没有超时、也不支持公平策略，适合临界区短、竞争可控的场景。

**Lock**：`java.util.concurrent.locks.Lock` 是显式锁接口，实现类 `ReentrantLock` 基于 AQS（一个 volatile int 状态 + CLH 等待队列 + `LockSupport.park/unpark`）实现。相对 synchronized 的增量能力：可中断获取（`lockInterruptibly`）、可超时（`tryLock(timeout)`）、可设公平/非公平、可绑定多个 `Condition` 做精确唤醒、可查询锁状态。代价是必须手动 `unlock`，标准写法是 `lock()` 紧跟 `try { ... } finally { unlock(); }`，否则异常路径会永久持锁。读写分离场景用 `ReentrantReadWriteLock`，读多写少时吞吐明显优于互斥锁。

**深分页 SQL 手写**：`SELECT * FROM t_order ORDER BY id LIMIT 1000000, 20;` 慢在 MySQL 要先取出并丢弃前 100 万行，且 `SELECT *` 会逐行走二级索引回表。三种优化写法：

```sql
-- 1) 延迟关联：先用覆盖索引翻页拿主键，再回表
SELECT o.* FROM t_order o
JOIN (SELECT id FROM t_order ORDER BY id LIMIT 1000000, 20) t ON o.id = t.id;

-- 2) 游标（键集）分页：记住上一页最后一条的排序键
SELECT * FROM t_order WHERE id > 1000000 ORDER BY id LIMIT 20;

-- 3) 业务上强制带过滤条件：WHERE create_time BETWEEN ? AND ?
SELECT * FROM t_order WHERE create_time >= '2026-01-01' ORDER BY id LIMIT 1000000, 20;
```

回答时要补一句：只要 `ORDER BY` 的列上有索引、且排序方向与索引顺序一致，第 1 和第 3 种都能把扫描量压到可接受范围；第 2 种最优但只能顺序翻页、不能跳页。

**深分页跨表查询与业务层设计**：跨表时分两种情形。一是能在数据库层 JOIN 的，先把过滤条件打在主表上、用覆盖索引取主键集合，再按主键批量去关联表捞数据，避免「大表驱动大表」；同时把排序键收敛到主表的索引列上，别让 `ORDER BY` 落在被关联表的字段上，否则必然产生临时表 + filesort。二是跨库/跨服务的，数据库层面无法 JOIN，正确做法是把排序键和过滤字段冗余进一张宽表或搜索索引（ES / 异构索引表），由它承担排序分页，再由业务层按返回的 id 列表批量回源（batch get）拼装完整对象。业务层要做的三件事：统一封装分页参数与上限（禁止无界翻页）、对 id 列表做批量查询而不是 N+1 循环、以及明确分页一致性问题（翻页期间数据变动会重复或漏，需要配合快照或游标）。极端深页（比如超过 1 万页）建议直接收口成「导出」或「按时间范围过滤」，不建议继续翻。

**DDD 与贫血/充血模型**：DDD（领域驱动设计）核心是把业务复杂度收敛到领域层，四大构件是实体（有唯一标识、有生命周期）、值对象（不可变、靠属性相等判断，如金额+币种）、聚合（一致性边界，聚合根是唯一对外入口，一次事务只改一个聚合）、领域服务与领域事件；配套的战略设计是限界上下文与上下文映射，用来切分微服务边界。贫血模型指对象只有 getter/setter、没有行为，业务逻辑全在 Service 里，优点是简单、和 ORM/CRUD 天然契合，缺点是逻辑散落、领域规则容易被绕过、复杂业务下 Service 膨胀。充血模型把与自身状态强相关的行为放进实体（如 `order.pay()`、`order.cancel()`），Service 只做编排和事务，好处是规则内聚、可测试，代价是对象与 ORM 的映射更别扭、需要额外处理持久化。实际工程里通常是「核心域用充血 + 支撑域用贫血」的混合方案，回答时给出这个取舍会显得有实战判断。

**RabbitMQ 的数据流向**：链路是 Producer → Connection/Channel → Exchange → 按 Binding 和 Routing Key 匹配 → Queue → Consumer，消费后按需 ack。要展开的点：Exchange 四种类型（direct 精确匹配、topic 通配、fanout 广播、headers 按头匹配）；消息可靠性三段——生产者用 publisher confirm + return 回调保证到达 broker、broker 侧做队列和消息持久化（durable queue + persistent message）并配合镜像/quorum 队列防节点故障、消费侧用**手动 ack** 且业务成功后再确认，失败走 nack 重入队或投递到死信交换机（DLX）；幂等由消费端自己保证（唯一索引、去重表、状态机版本号）；顺序性只在单队列单消费者下成立，需要严格顺序时按业务键哈希到固定队列。

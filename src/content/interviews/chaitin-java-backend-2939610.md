---
title: "长亭科技 Java 后端社招面经：Kafka ACK、Redis 分布式锁与 MySQL 事务"
company: "长亭科技"
position: "Java 后端开发"
round: "社招"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/dca61a482e0c45159ca9790802197a7d
tags: ["长亭科技","Java","Kafka","Redis","分布式锁","MySQL","InnoDB","B+树","PostgreSQL"]
summary: "长亭科技 Java 后端社招面经，12 个问题集中在数据一致性与存储底层：Kafka 的 ACK 机制、Redis 分布式锁是强一致还是弱一致、怎么解决弱一致、MySQL 默认隔离级别与可重复读实现、InnoDB 的数据结构与 B+ 树选择理由、PostgreSQL 的了解、Java 集合与 ArrayList 尾插是否真的 O(1)。"
---

### 《面试题目》

1. Kafka 的 ACK 机制是怎样的？
2. Redis 分布式锁是强一致性还是弱一致性，为什么？
3. 怎么解决 Redis 弱一致性的问题，保证数据完全可靠？
4. MySQL 数据库默认的隔离机制是什么？
5. 可重复读是怎么实现的？
6. MySQL 的底层引擎有哪些？
7. InnoDB 用的是什么数据结构？
8. 为什么用 B+ 树？
9. PostgreSQL 有了解吗？
10. Java 的常见集合数据结构有哪些？
11. ArrayList 和 LinkedList 的区别是什么？
12. ArrayList 的尾部插入真的是 O(1) 吗？

### 《参考解析》

**Kafka 的 ACK 是生产者侧对「写入到哪一步算成功」的选择**：`acks=0` 发出即算成功，吞吐最高但会丢；`acks=1` 等 leader 落盘，leader 挂掉而副本未同步时会丢；`acks=all`（`-1`）要等 ISR 内所有副本确认，最安全但延迟最高。它需要配合 `min.insync.replicas` 才有意义——副本数 3、`min.insync.replicas=2` 时，最多容忍一台挂掉仍能写入；再叠加 `enable.idempotence=true` 与事务，才能做到「不丢不重」。

**Redis 分布式锁在严格意义上是弱一致**：主从异步复制，客户端在 master 上加锁成功后 master 宕机，哨兵把 slave 提上来，新 master 上没有这把锁，另一个客户端就能同时拿到锁。Redlock 试图用多数派加锁来缓解，但它依赖时钟假设，业界（包括 Martin Kleppmann 的质疑）普遍认为它不能提供强一致的互斥保证。

**要更可靠，思路是「不把正确性全押在锁上」**：一是给锁加租约与 fencing token——每次加锁返回一个单调递增的令牌，下游资源在写入时校验令牌，旧持有者的迟到请求会被拒绝；二是关键写操作落库时加唯一约束或版本号做最终防线；三是需要强一致时改用 ZooKeeper、etcd 这类基于共识的协调服务。工程上更常见的是承认锁是「性能优化」而非「正确性保证」，让业务本身幂等。

**MySQL 默认隔离级别是「可重复读」（REPEATABLE READ）**，Oracle 与 PostgreSQL 默认是「读已提交」（READ COMMITTED）。可重复读由 MVCC 实现：每行有隐藏的 `DB_TRX_ID` 与 `DB_ROLL_PTR`，undo log 串成版本链；事务第一次快照读时生成 ReadView（记录当时活跃的事务 ID 集合），之后每次读都按 ReadView 判断版本可见性——自己的修改可见、已提交且早于快照的可见、快照之后提交的不可见，于是同一事务内多次读到同一份数据。当前读（`SELECT ... FOR UPDATE`、`UPDATE`、`DELETE`）走的是锁而不是快照，配合间隙锁防幻读。

**InnoDB 用 B+ 树**：非叶子节点只存索引键与子页指针，一页 16KB 能放上千个键，三层即可覆盖千万级数据，磁盘 IO 次数少且稳定；叶子节点用双向链表相连，范围查询与排序只需顺着链表扫，不用回到根节点。相比 B 树，B+ 树把数据全部放在叶子层，单页能容纳更多索引项、树更矮，且查询路径长度一致。哈希索引虽然等值查询 O(1)，但不支持范围与排序，所以 InnoDB 的自适应哈希只作为辅助。MySQL 的存储引擎还有 MyISAM、Memory、Archive 等，InnoDB 是默认且唯一支持事务与外键的。

**PostgreSQL 的差异点**：默认隔离级别是读已提交、多版本并发控制（MVCC）同样靠版本链但把旧版本放在表空间而不是 undo log，需要 vacuum 清理死元组；索引类型更丰富（B-tree、Hash、GIN、GiST、BRIN），JSONB、数组、窗口函数与扩展生态更强。回答时给出「什么场景会选 PG」比背特性列表更有说服力，例如复杂查询、地理数据、JSON 半结构化数据。

**Java 集合**：`List` 有 ArrayList（动态数组）、LinkedList（双向链表）、CopyOnWriteArrayList（读多写少）；`Map` 有 HashMap（数组加链表加红黑树）、LinkedHashMap（额外维护插入或访问顺序）、TreeMap（红黑树，有序）、ConcurrentHashMap（CAS 加 synchronized 锁桶）；`Set` 多由对应 Map 实现。ArrayList 随机访问 O(1)、中间插入删除 O(n)；LinkedList 头尾插入 O(1)、随机访问 O(n)，但它的节点开销大、缓存不友好，实际工程里绝大多数场景 ArrayList 更快。

**ArrayList 尾部插入不是严格的 O(1)，而是摊还 O(1)**：容量足够时是一次数组赋值；容量不足时触发扩容，新建 1.5 倍大小的数组并整体复制，这一次是 O(n)。按 n 次插入摊开，平均仍是 O(1)，但单次最坏是 O(n)。能补一句「预设容量 `new ArrayList<>(n)` 可以消掉扩容」会更好。

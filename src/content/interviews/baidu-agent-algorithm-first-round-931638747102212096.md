---
title: "百度智能体算法一面：JVM、MySQL 与 Redis 基础"
company: "百度"
position: "智能体算法"
round: 一面
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/931638747102212096
tags: ["JVM","GC","MySQL","Redis","并发编程","智能体"]
summary: "百度智能体算法一面记录，偏后端基础：JVM Full GC 定位、无锁任务调度器设计、happens-before、CPU 与数据库 IO 混合瓶颈拆解、MySQL 索引与间隙锁、Redis 持久化与分布式锁安全释放。"
---

### 《面试题目》

1. 先做一下自我介绍，你最近主要关注哪类技术问题？
2. JVM 中对象从创建到回收大致经历了哪些阶段？
3. 线上出现频繁 Full GC 时，你会怎样定位？
4. Java 中如何设计一个不会产生大量锁竞争的任务调度器？
5. Java 内存模型中的 happens-before 规则解决了什么问题？
6. 如果一个接口同时受到 CPU 和数据库 IO 的限制，你会怎样拆解瓶颈？
7. MySQL 的 B+Tree 索引为什么适合范围查询？
8. 联合索引 (tenant_id, status, created_at) 在哪些情况下无法充分利用？
9. 在高并发写入场景下，MySQL 的间隙锁可能造成什么问题？
10. Redis 的持久化机制应该如何选择？
11. Redis 分布式锁怎样避免锁被误删？

### 《参考解析》

**频繁 Full GC 的定位路径**
顺序是「先确认现象，再缩小范围」。用 `-Xlog:gc*:file=gc.log:time,uptime`（JDK8 用 `-XX:+PrintGCDetails`）看 Full GC 的频率和每次耗时，同时用 `jstat -gcutil <pid> 1000` 观察 O 区使用率在 Full GC 后是否降得下来：降不下去基本是内存泄漏或堆太小；每次都降下去但很快又满，是分配速率太高或对象晋升过快。

然后分三条线查：① `jmap -histo:live <pid>`（或 `jcmd <pid> GC.class_histogram`）看哪类对象排第一，通常是集合、缓存、`byte[]`；② `jmap -dump:live,format=b,file=heap.hprof <pid>` 拿堆转储丢给 MAT，看支配树里谁在持有对象——大缓存没淘汰、`ThreadLocal` 没 remove、静态集合长期持有是三巨头；③ 检查是否有显式 `System.gc()`、元空间不足触发的 Full GC（`jstat -gc` 看 MU/MC），以及收集器是否选错了（大堆还用 CMS/Serial）。调参（换 G1/ZGC、调 `-Xmn`、`MaxTenuringThreshold`）必须放在找到根因之后，否则只是把问题往后推。

**无锁竞争的任务调度器怎么设计**
核心思路是「把竞争点从共享数据结构挪到无共享的队列上」。生产者只往分片队列 `offer`，消费者用 `drainTo` 批量取，锁的持有时长从「处理一个任务的时间」降到「入队出队的时间」。具体手段：① 每线程一条 `LinkedBlockingQueue` 或 `ConcurrentLinkedQueue`（work stealing 的分片队列），彻底去掉全局锁；② 需要优先级时按优先级维护多条队列，消费者按权重轮询，避免高优先级饿死低优先级；③ 极致场景用 Disruptor 式 ring buffer + CAS 序号做无锁传递；④ 真正需要串行的只有状态更新，用 `AtomicReference` + CAS 重试或 `LongAdder` 代替锁。任务侧必须幂等（任务 id + 状态表去重），因为异常退出后的重投递一定会发生。线程池参数按「CPU 密集 → 核数 + 1，IO 密集 → 核数 × (1 + 等待/计算)」估，队列必须有界并配拒绝策略，`CallerRunsPolicy` 天然形成背压。

**happens-before 解决了什么**
它回答的是「A 线程写的值，B 线程能不能看到、按什么顺序看到」。JMM 允许编译器和 CPU 做重排序与寄存器缓存，happens-before 是在这个自由之上划出的最小保证集合：程序顺序规则（单线程内前面的操作先于后面的）、监视器锁规则（解锁先于后续对同一把锁的加锁）、volatile 规则（对 volatile 的写先于后续读）、线程启动规则（`Thread.start()` 之前的操作对新线程可见）、线程终止规则（`join()` 返回后能看到线程内所有操作），以及这些关系的传递性。它保证的是**可见性与有序性**，不是「按源码顺序执行」——两条操作之间没有 happens-before 关系时，读到旧值是合法行为。落到代码上：`volatile` 能解决标志位可见性和双重检查锁定的重排序问题，但 `count++` 这种复合操作仍然要用 `AtomicInteger` 或加锁。

**B+Tree 为什么适合范围查询**
三个结构性原因：① 非叶子节点只存键和子指针、不含数据行，同样大小的页能放下更多键，扇出大、树高低——三层就能索引千万级数据，随机 IO 次数少；② 所有数据都在叶子节点，且叶子之间用双向链表相连，`BETWEEN x AND y` 定位到起点后沿链表顺序读，是顺序 IO；③ 键有序，天然支持排序、`ORDER BY` 免排序、最左前缀匹配和 `>`/`<` 范围条件。对比哈希索引只能等值查询，不支持范围、排序、最左匹配；对比 B 树非叶子节点也存数据，范围遍历要在树上来回跳。可以补一句「这也是为什么 `LIKE '%x'` 用不上索引，而 `LIKE 'x%'` 可以」。

**联合索引 (tenant_id, status, created_at) 的失效场景**
最左匹配原则下有四类退化：① 不从最左列开始——`WHERE status = 1 AND created_at >= '2026-01-01'` 完全用不上这个索引；② 中间列用了范围条件——`WHERE tenant_id = 10 AND status > 1 AND created_at = '2026-01-01'`，`status` 之后的列只能做过滤，不能继续用于索引定位（MySQL 8.0 的索引下推 ICP 能把 `created_at` 下推到引擎层过滤、减少回表，但仍不是精确定位）；③ 在索引列上做函数运算或隐式类型转换（`DATE(created_at) = '...'`、字符串列传数字），索引直接失效；④ 前导列区分度太低（`status` 只有 0/1）时优化器可能放弃索引走全表扫描，这时要做的是把高区分度列往前放或建覆盖索引。所有结论都要用 `EXPLAIN` 的 `type` / `key` / `key_len` / `Extra` 复核，`key_len` 能看出实际用到了几列。

**间隙锁在高并发写入下的代价**
RR 隔离级别下，`SELECT ... FOR UPDATE` 或带范围的 `UPDATE`/`DELETE` 不只锁住命中的行，还会锁住索引记录之间的间隙（Next-Key Lock = 记录锁 + 间隙锁），目的是防幻读。代价是：插入到该范围的记录被阻塞，锁等待变长；多个事务以不同顺序锁定不同范围时容易互相等待形成死锁（`ERROR 1213`，`SHOW ENGINE INNODB STATUS` 能看到 `LATEST DETECTED DEADLOCK`）。缓解手段：① 让加锁的 WHERE 走**唯一索引等值查询**，InnoDB 会把 Next-Key Lock 降级为记录锁，几乎不产生间隙锁；② 缩小事务范围、先锁小范围再扩展，事务里不做远程调用和用户交互；③ 无唯一索引可用时考虑降到 RC 隔离级别（间隙锁基本退化为记录锁）或用版本号乐观锁替代悲观锁；④ 业务层对同一批数据固定加锁顺序。

**Redis 持久化怎么选**
RDB 是某个时间点的全量快照（`BGSAVE` fork 子进程写盘），文件小、恢复快，适合冷备和主从全量同步，缺点是两次快照之间的写会丢。AOF 是追加写命令日志，`appendfsync always / everysec / no` 对应「几乎不丢 / 最多丢 1 秒 / 交给操作系统」，`everysec` 是绝大多数场景的默认选择，代价是文件更大、恢复更慢，需要 `BGREWRITEAOF` 定期重写压缩。生产上通常两者同开：RDB 做冷备与快速恢复，AOF 兜数据完整性。但要接受一个前提——持久化不等于事务可靠，主从切换、磁盘故障、fork 失败都可能丢数据，核心交易数据必须以数据库为准，Redis 只放缓存或可从数据库重建的派生数据。

**分布式锁为什么会被误删，怎么防**
根因是「锁过期了，但持有者不知道」：A 拿到锁后业务执行超过 TTL，锁自动过期，B 拿到同名锁，此时 A 执行完 `DEL` 把 B 的锁删了。两道防线：① 加锁时 value 放唯一标识（UUID 或线程 id），释放时用 Lua 脚本「比对相等才删」，保证 check 与 delete 的原子性：
```
-- KEYS[1]=lock key, ARGV[1]=token
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end
```
② 给锁加看门狗自动续期（Redisson 的 `RLock` 默认每 10 秒续一次，业务没结束就不断延长 TTL），或把 TTL 设为大于业务 P99 耗时并配合 `tryLock(waitTime, leaseTime)`。还要注意 ③ 单点 Redis 的锁在主从切换时会丢失（主节点写入尚未同步就宕机），对一致性要求高的场景要用 Redlock 或直接换 ZooKeeper/etcd 做协调。

---
title: "字节中国交易与广告日常实习凉经：MyBatis 源码、联合索引、AQS 与可重复读的锁"
company: 字节跳动
position: Java 后端（日常实习）
round: 一面
date: '2026-11'
collectedAt: '2026-11-18'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/a40bd33b82a643dd91d04b7cabca946f
tags: ["字节跳动","Java","日常实习","动态代理","MyBatis","联合索引","Redis","AQS","阻塞队列","synchronized","算法"]
summary: "字节中国交易与广告日常实习一面，深挖第一段实习到表名级别，随后是 Java 与数据库八股：动态代理两种实现的性能对比、MyBatis 的 Environment 类与如何适配 Spring Boot、MySQL 联合索引的底层存储、Redis 跳表与缓存一致性（canal + binlog）、AQS 与 ReentrantLock 的底层实现、阻塞队列的等待策略、String 三兄弟、synchronized 锁升级、可重复读下的锁，以及一道前缀和加动态规划的算法题。帖主自评多处只答出一半。"
---

### 《面试题目》

1. 实习经历：只问了第一段，问得很细，连表名都问了。
2. 动态代理的两种实现，谁的性能更好，为什么？
3. 你了解 MyBatis 吗？看过源码吗？`Environment` 类里有哪些方法？这个框架是怎么适配到 Spring Boot 的？
4. MySQL 联合索引在底层的存储结构和方式。
5. Redis 的跳表结构；数据库更新成功、Redis 没更新成功时怎么保证一致性（帖主答的是 canal + binlog）。
6. 讲一讲 AQS 框架的底层实现，以及 ReentrantLock 的底层实现。
7. 阻塞队列相关问题：线程进入阻塞队列之后会有哪些策略？
8. String、StringBuilder、StringBuffer 的区别。
9. synchronized 的锁升级过程。
10. 一道非 Hot100 的算法题：前缀和加动态规划。
11. Redis 为什么能扛住这么多并发？
12. 可重复读隔离级别下有哪些锁？

### 《参考解析》

**动态代理两种实现**：JDK 动态代理基于接口，运行时用 `Proxy` 与 `InvocationHandler` 生成实现该接口的代理类，方法调用统一进 `invoke`；CGLIB 基于继承，用 ASM 生成目标类的子类并覆写方法，所以不能代理 `final` 类与 `final` 方法。性能上，JDK 8 之后两者差距很小：JDK 代理走反射调用（新版有 `MethodHandle` 优化），CGLIB 走生成的字节码直接调用，创建代理对象的开销 CGLIB 更大（要生成类），调用开销在早期 CGLIB 略优；JDK 17+ 与 Spring 6 的默认策略已偏向 JDK 代理。真正选型看目标是否实现接口、是否需要代理非接口方法。

**MyBatis 与 Spring Boot 的适配**：`Environment` 持有 `id`、`TransactionFactory`、`DataSource`，方法主要是 `getId`、`getTransactionFactory`、`getDataSource` 这几个 getter，它是 `Configuration` 的一部分。Spring Boot 通过 `mybatis-spring-boot-starter` 自动配置：读 `spring.datasource` 建 `DataSource`，构造 `SqlSessionFactoryBean`，扫描 `@Mapper` 或用 `@MapperScan` 注册 `MapperFactoryBean`，把 Mapper 接口注册成 Bean（内部用 JDK 动态代理，`MapperProxy` 把方法映射到 `MappedStatement`），事务交给 Spring 的 `DataSourceTransactionManager`。回答「看过源码」就要能说出 `SqlSessionTemplate` 如何保证线程安全（每次操作取一个与事务绑定的 `SqlSession`）。

**联合索引的底层存储**：InnoDB 的索引是 B+ 树，联合索引 `(a, b, c)` 按 a、再 b、再 c 的顺序排序后存进叶子节点，叶子节点存的是索引列 + 主键（二级索引），回表时用主键去聚簇索引取整行。因此最左前缀原则来自排序结构：只给 b 或 c 无法在树上定位。覆盖索引可以避免回表；索引下推（ICP）把能在索引上判断的条件下推到存储引擎层过滤。页分裂、填充因子、以及 `ORDER BY` 能否用索引，都从这套结构推。

**Redis 与数据库的一致性**：常见方案是「先更新数据库，再删缓存」，并为删除失败加重试或走 binlog 订阅（canal 解析 binlog 投递到 MQ，消费端删缓存），保证最终一致；更强一致要用分布式锁或把读写串行化，代价大。延迟双删用于降低「删除后又被旧值回填」的窗口。要承认这是最终一致，不是强一致；对账与版本号（缓存里带数据版本，读到旧版本就丢弃）能兜底。

**AQS 与 ReentrantLock**：AQS 用一个 `volatile int state` 表示同步状态，加一个 CLH 变体的双向等待队列。`ReentrantLock` 的 `Sync` 继承 AQS，`tryAcquire` 用 CAS 把 state 从 0 改成 1（重入则 state + 1 并记下持有线程），失败后 `addWaiter` 入队、`acquireQueued` 在队列里自旋并 `LockSupport.park`；释放时 `tryRelease` 把 state 减到 0 并 `unparkSuccessor` 唤醒后继。公平锁在 `tryAcquire` 里先检查队列有没有前驱（`hasQueuedPredecessors`），非公平锁直接抢。回答时能说出「state + CAS + CLH 队列 + park/unpark」这条主线，再补条件队列（`ConditionObject`）即可。

**阻塞队列的策略**：核心是「队列满时生产者怎么办、队列空时消费者怎么办」。`BlockingQueue` 提供四组方法：抛异常（`add`/`remove`/`element`）、返回特殊值（`offer`/`poll`/`peek`）、阻塞（`put`/`take`）、超时（`offer(e, t, u)`/`poll(t, u)`）。实现上 `ArrayBlockingQueue` 用一把锁加两个条件（notFull/notEmpty），`LinkedBlockingQueue` 用两把锁（putLock/takeLock）提高吞吐，`SynchronousQueue` 不存储元素、直接配对，`PriorityBlockingQueue` 无界按优先级出队。线程池的拒绝策略是另一层：`AbortPolicy`、`CallerRunsPolicy`、`DiscardPolicy`、`DiscardOldestPolicy`。

**String 三兄弟**：`String` 不可变，每次拼接产生新对象，适合作为常量与 key；`StringBuilder` 可变、非线程安全、单线程拼接首选；`StringBuffer` 可变、方法加 `synchronized`、线程安全但性能低。编译期常量拼接会被优化，循环里 `+=` 会反复建对象，用 `StringBuilder` 并预设容量。

**synchronized 锁升级**：无锁 → 偏向锁（同一线程重入，Mark Word 记录线程 ID，CAS 一次）→ 轻量级锁（有竞争时撤销偏向，栈上 Lock Record + CAS 自旋）→ 重量级锁（自旋失败或竞争激烈，膨胀为 monitor，进 ObjectMonitor 的等待队列，涉及用户态到内核态切换）。JDK 15 之后偏向锁默认禁用并在后续版本移除，回答时提一句版本差异会加分。

**可重复读下的锁**：InnoDB 在 RR 下用 MVCC 提供一致性读（快照读不加锁），当前读（`SELECT ... FOR UPDATE`、`LOCK IN SHARE MODE`、`UPDATE`、`DELETE`）加锁。行锁分记录锁（Record Lock）、间隙锁（Gap Lock）、临键锁（Next-Key Lock，记录 + 前面的间隙），默认加临键锁以防幻读；插入意向锁用于并发插入同一间隙；还有表级意向锁（IS/IX）与元数据锁（MDL，由 DDL 触犯）。唯一索引等值命中时临键锁退化为记录锁。帖主被追问「还有哪些」时漏掉的通常是插入意向锁、意向锁与 MDL。

**Redis 高并发的原因**：单线程事件循环 + epoll 多路复用，避免锁与线程切换；所有数据在内存，操作是 O(1)/O(log N) 级别；高效的数据结构（SDS、跳表、listpack、intset）压缩内存与常数；IO 多路复用把网络等待交给内核；6.0 起的多线程只用于网络读写，命令执行仍是单线程，保证原子性。瓶颈通常在网络带宽与单核 CPU，所以有集群分片与 pipeline。

**前缀和加动态规划**：题面帖中未记录具体描述，但这类题的通用套路是「先做前缀和把区间和变成 O(1) 查询，再在区间上做 DP（如以 i 结尾的最大子段和、满足和不超过 K 的最长区间、划分型 DP）」。写的时候先明确状态定义与转移，再处理边界（空前缀、负数、答案取 max 还是 min），最后核对复杂度是否满足数据范围。帖主没写出来，说明这类「非模板题」要靠平时把前缀和、单调队列、DP 的组合练熟。

---
title: "百度后端一面（回忆版）：集合源码、MVCC 与幻读、回表、手写二分查找"
company: "百度"
position: "后端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/59e9ad65d55347d5b4d3e7ddc4c0d672
tags: ["百度", "后端开发", "一面", "ArrayList", "ConcurrentHashMap", "volatile", "MVCC", "二分查找"]
summary: "百度后端一面回忆版，八股密度高：ArrayList 与 LinkedList、HashMap 与 ConcurrentHashMap、volatile 与内存屏障、事务隔离级别与 MySQL 默认级别、幻读与 MVCC、InnoDB、回表、哈希冲突解决，以及实习难点；手写二分查找要求先在记事本写、再放进 IDE 运行。"
---

### 《面试题目》

1. ArrayList 和 LinkedList 有什么区别？常见操作的时间复杂度分别是多少？LinkedList 底层是什么数据结构？
2. HashMap 底层是什么数据结构？是线程安全的吗？ConcurrentHashMap 如何实现？
3. volatile 如何实现？内存屏障是什么？
4. 数据库事务有哪些隔离级别？MySQL 默认使用哪种？这个级别解决了哪些并发问题？
5. MySQL 如何解决幻读？
6. MVCC 如何实现？
7. 请介绍一下 MySQL 的 InnoDB 存储引擎。
8. 什么是回表？
9. 哈希冲突如何解决？
10. 实习中遇到了什么难点？采用了什么解决方案？
11. 手写二分查找，先在记事本中完成代码，再放到 IDE 中运行。

### 《参考解析》

**ArrayList 与 LinkedList**：前者基于动态数组，随机访问 O(1)、尾部追加均摊 O(1)、中间插入删除 O(n)（要搬元素），内存连续对 CPU cache 友好；后者基于双向链表，按下标访问 O(n)、已知节点时插入删除 O(1)，每个节点额外两个引用、内存碎片多。实际工程里 ArrayList 几乎总是更快，LinkedList 只在「已经持有节点引用且频繁头尾增删」时才有优势，队列场景更推荐 `ArrayDeque`。

**ConcurrentHashMap 分版本答**：JDK 7 是 Segment 分段锁（默认 16 段，锁粒度是段）；JDK 8 起取消分段，用「CAS 插入空桶 + synchronized 锁单个桶头节点」，扩容时多线程协助迁移（`ForwardingNode` 标记），size 用 `baseCount + CounterCell[]` 分散计数。它保证单次操作原子，但复合操作（先查再改）仍不原子，需要 `computeIfAbsent` / `merge` 这类原子方法。

**volatile 的两条语义**：可见性（写立即刷回主存、读强制从主存读，靠缓存一致性协议 MESI）与禁止重排序（编译器与 CPU 层的 StoreLoad 等内存屏障，JMM 里对 volatile 读写插入 LoadLoad / StoreStore / LoadStore / StoreLoad 屏障），但不保证复合操作原子性，`i++` 依然要加锁或换 `AtomicInteger`。

**隔离级别与幻读**：读未提交、读已提交、可重复读、串行化；MySQL InnoDB 默认可重复读，它靠 MVCC 解决不可重复读，靠 Next-Key Lock（记录锁 + 间隙锁）在当前读时解决幻读，快照读下幻读也基本消失。MVCC 的实现是每行隐藏的 `DB_TRX_ID` / `DB_ROLL_PTR` 加 undo log 版本链，配合 ReadView（活跃事务 ID 列表、上下界、创建者事务 ID）判断可见性：RC 每次查询都新建 ReadView，RR 在事务第一次快照读时建一次并复用。

**回表**：二级索引的叶子节点存的是索引列 + 主键，查其它列要拿主键再走一次聚簇索引；把需要的列都放进联合索引（覆盖索引）就能避免。InnoDB 的特点是聚簇索引（数据即主键 B+ 树）、支持事务与行锁、MVCC、外键、崩溃恢复靠 redo；MyISAM 是非聚簇、表锁、不支持事务。

**哈希冲突**的解法：链地址法（Java HashMap，链表长度 ≥8 且容量 ≥64 时转红黑树）、开放寻址（线性 / 二次探测、双重散列，ThreadLocalMap 与 Python dict 用）、再哈希、公共溢出区。手写二分要注意 `mid = lo + (hi-lo)/2` 防溢出、循环条件与边界收缩（`lo <= hi` 还是 `lo < hi`）、重复元素时返回最左还是最右，写完最好说一句用 `[1,2,3,4]` 手跑一遍验证。

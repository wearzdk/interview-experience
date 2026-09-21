---
title: 快手 Java 二面面经（9.17）
company: 快手
position: Java开发
round: 二面
date: '2026-09'
source: 牛客网
tags: ["Java","JVM","并发编程","MySQL","Redis","算法"]
summary: "快手 Java 二面记录，面试时长 90 分钟且几乎每题都追问到底。覆盖手撕 LRU、Bean 生命周期、AOP 实现、线程池拒绝策略、HashMap 并发问题与扩容死锁、volatile 原理、垃圾回收与引用计数、MySQL 索引结构选型、Redis AOF 持久化机制。"
---

### 《面试题目》

1. 手撕 LRU
2. bean 的生命周期
3. AOP 解释，怎么实现 AOP
4. 线程池拒绝策略
5. hashmap 为什么不安全，后面怎么保证安全
6. 不安全的 hashmap 扩容的时候为什么会死锁
7. volatile 原理，为什么不能保证原子性，怎么保证
8. 垃圾回收机制，标记计数法的原理
9. 线程和协程有什么区别，协程原理是什么
10. mysql 索引数据结构，为什么选这个，有没有不用 B+ 树的
11. redis 写硬盘机制，AOF 详细解释下

---

### 《参考解析》

1. **LRU 手撕**：标准写法是 `HashMap + 双向链表`。`HashMap` 存 key 到节点的映射，双向链表头部放最近使用、尾部放最久未用；`get` 命中后把节点摘下来插到头部，`put` 时若容量已满就删尾节点再插头部。要一次通过得注意三点：用带虚拟头尾的哨兵节点省掉边界判断、`put` 已存在的 key 时要更新值并刷新位置、`get` 未命中返回 -1。Java 里 `LinkedHashMap(capacity, 0.75f, true)` 加 `removeEldestEntry` 十几行就能实现，面试可以先说这个再手写完整版。
2. **Bean 的生命周期**：实例化 → 属性填充 → `Aware` 系列回调（`BeanNameAware` / `BeanFactoryAware` / `ApplicationContextAware`）→ `BeanPostProcessor.postProcessBeforeInitialization` → `@PostConstruct` / `InitializingBean.afterPropertiesSet` / 自定义 init-method → `BeanPostProcessor.postProcessAfterInitialization`（AOP 代理基本在这一步生成）→ 使用 → 容器关闭时 `@PreDestroy` / `DisposableBean.destroy`。
3. **为什么需要 AOP 代理**：AOP 靠动态代理把横切逻辑织入目标方法调用链。JDK 动态代理基于接口，CGLIB 通过继承生成子类；Spring Boot 2.x 起默认 `proxyTargetClass=true` 走 CGLIB。理解这一点能顺带解释一连串现象——为什么同类自调用事务失效、为什么 `final` 方法切不进去、为什么注入的是代理对象而不是原始类型。
4. **HashMap 扩容死锁**：JDK 1.7 的头插法在并发扩容时，两个线程同时把链表节点往新表搬，会让链表形成环，之后 `get` 落到这个桶上就死循环把 CPU 打满。JDK 1.8 改成尾插法消除了成环，但并发 `put` 仍可能丢数据、size 计数不准，所以它依然不是线程安全的。要并发就用 `ConcurrentHashMap`（1.8 是 CAS + 桶头 synchronized），或者给操作加锁。
5. **volatile 为什么不能保证原子性**：volatile 通过内存屏障保证可见性和禁止指令重排，但 `count++` 是「读 - 改 - 写」三步复合操作，两个线程可能都读到 1 再各自写回 2。要保证原子性可以用 `synchronized`、`ReentrantLock` 或 `AtomicInteger`（CAS + 自旋，失败重试）。volatile 只适合「一个线程写、多个线程读」的状态标记场景。
6. **引用计数法与可达性分析**：引用计数给每个对象维护被引用次数，为 0 就回收，问题是无法处理循环引用（A 引用 B、B 引用 A 时计数永远不为 0）。所以 JVM 实际用的是可达性分析——从 GC Roots（栈帧局部变量、静态变量、常量、JNI 引用等）出发做遍历，走不到的对象判为可回收。Python 用的是引用计数 + 分代标记清除来补环。
7. **MySQL 为什么选 B+ 树**：关键在磁盘 IO 次数和范围查询。B+ 树非叶子节点只存键，扇出大、树高低，定位一个叶子节点的 IO 次数少；叶子节点用双向链表串联，范围扫描和排序都不用回上层。B 树的数据分散在所有节点上，范围查询需要中序遍历，IO 更碎；哈希索引等值查询快但不支持范围；跳表 / LSM 树（如 RocksDB）在写密集场景更合适，MySQL 的 InnoDB 没有采用。
8. **Redis 的 AOF**：把每条写命令追加到日志文件，重启时重放恢复。流程是「命令写入 aof_buf → `write` 到内核缓冲区 → `fsync` 刷盘」，`appendfsync` 三档决定安全性与性能的取舍：`always` 每条都刷、最安全但最慢；`everysec`（默认）每秒刷一次，最多丢 1 秒数据；`no` 交给操作系统。AOF 文件会随重放不断膨胀，所以有重写机制（`BGREWRITEAOF`）生成最小命令集，重写期间新命令写进重写缓冲区，完成后追加进新文件并替换。Redis 4.0 之后推荐 AOF + RDB 混合持久化。

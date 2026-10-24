---
title: "北京景行锐创（西安 base）后端一面：纯八股，从 HashMap 问到深分页"
company: "景行锐创"
position: "后端开发"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/0b187fb07cdc4842ab88e66ab9a82912
tags: ["景行锐创", "后端开发", "Java", "MySQL", "Redis", "JVM", "Linux"]
summary: "景行锐创西安 base 后端一面：开场确认学业与空闲时间、问项目性质，之后是纯八股——HashMap 与 ConcurrentHashMap 的区别与取舍、CentOS 卡顿时查内存前五的进程、Git 冲突解决、MySQL 索引结构与 90 万页深分页优化、Redis 常用与高级数据结构、JVM 内存区域与调优参数。"
---

### 《面试题目》

**开场**

1. 确认当前的学业与空闲时间情况。
2. 询问项目的性质（课程/实习/自研）。

**Java 并发与集合**

3. HashMap 与 ConcurrentHashMap 的区别是什么？
4. 既然 ConcurrentHashMap 是线程安全的，为什么大部分代码仍优先使用非线程安全的 HashMap？

**Linux**

5. 针对 CentOS 机器卡顿的问题，如何查看占用内存排行前五的进程？

**Git**

6. 本地开发分支与主分支合并发生冲突时，如何解决？

**MySQL**

7. MySQL 底层索引采用的数据结构有什么特点？
8. 当用户翻至第 90 万页（深分页）时出现查询极慢，可能是什么原因？如何优化？

**Redis**

9. Redis 提供了哪些常用数据结构？分别适用于什么业务场景？
10. Redis 有哪些高级数据结构？请举例说明其应用场景和优势。

**JVM**

11. JVM 内存主要划分为哪些核心区域？
12. 日常 JVM 调优中涉及哪些参数配置？

### 《参考解析》

**HashMap vs ConcurrentHashMap。** HashMap 非线程安全、允许一个 null key 与多个 null value、用「数组 + 链表 + 红黑树」实现，扩容是整体 rehash；ConcurrentHashMap 线程安全、不允许 null 键值、JDK 8 起用 CAS + synchronized 锁单个桶、支持多线程协助扩容，size 用分段计数。为什么还常用 HashMap：① 绝大多数场景是方法内的局部变量，天然不共享，加并发开销没意义；② ConcurrentHashMap 的每次读写都有内存屏障与 CAS/synchronized 成本，单线程下慢；③ 它禁止 null，语义上更严格，迁移会改变现有行为。选型原则是「共享可变状态才需要并发容器」，而不是「线程安全的总比不安全的好」。

**Linux 查内存前五。** `ps aux --sort=-%mem | head -6`（含表头所以取 6 行），或 `ps -eo pid,ppid,%mem,rss,comm --sort=-rss | head -6` 按实际物理内存排序；也可以用 `top -b -n1 -o %MEM | head`。要能补一句「`%MEM` 是占物理内存百分比，`RSS` 是实际驻留集；如果怀疑是缓存导致的内存高，看 `free -h` 的 buff/cache，必要时 `echo 3 > /proc/sys/vm/drop_caches` 清缓存再观察（生产慎用）」。

**Git 冲突解决。** `git fetch` 拿到最新 → 在本地分支 `git rebase origin/main`（或 `git merge origin/main`）→ 冲突文件里按 `<<<<<<<`/`=======`/`>>>>>>>` 标记手工合并，保留正确语义而不是简单选一边 → `git add` 后 `git rebase --continue`（merge 则 `git commit`）→ 跑测试 → 推送。要点：冲突解决后必须重新构建与测试；rebase 会改写历史，已经推送并被他人使用的分支不要 rebase；拿不准时先 `git stash` 或建临时分支备份。

**深分页为什么慢。** `limit 900000, 20` 的语义是「扫描并丢弃前 90 万行」，B+ 树要沿着叶子链表走 90 万次，还要回表取整行，代价随偏移线性增长。三类优化：① 游标/延迟关联——记住上一页最后一条的排序键（`where id > last_id order by id limit 20`），或用 `select id from t order by id limit 900000,20` 先在覆盖索引里拿到 20 个 id，再 `join` 回表取字段（延迟关联，避免 90 万次回表）；② 业务层限制——限制最大页数、改成「加载更多」的游标分页；③ 索引与查询改造——确保 `order by` 的列有合适索引、避免 `order by` 非索引列导致 filesort。第 90 万页这种量级，正确答案通常是「产品上不该允许跳这么深」，技术上用游标。

**Redis 数据结构与场景。** 五种基础：String（缓存、计数器、分布式锁、bitmap 签到）、Hash（对象字段，如用户属性，可单独更新字段）、List（消息队列、时间线、栈/队列）、Set（去重、共同好友、抽奖）、Zset（排行榜、延迟队列、按分数范围查询）。高级结构：HyperLogLog（基数统计，UV 估算，误差约 0.81%，内存固定 12KB）、Bitmap（位图，布隆过滤器/签到/在线状态）、GEO（地理位置，附近的人）、Stream（持久化消息队列，支持消费组与 ACK）、以及 RedisJSON/RediSearch 这类模块。回答时把「结构 → 底层编码 → 适用场景」串起来，比如 Zset 小数据量用 ziplist、大了转 skiplist + dict。

**JVM 内存区域。** 线程私有：程序计数器、虚拟机栈（栈帧：局部变量表、操作数栈、动态链接、返回地址）、本地方法栈；线程共享：堆（新生代 Eden/Survivor、老年代）、方法区（JDK 8 起是元空间，用本地内存）。另有直接内存（NIO 的 DirectByteBuffer）。要能补一句「字符串常量池在 JDK 7 之后移到了堆里」「元空间不设上限时可能吃光物理内存，要设 `MaxMetaspaceSize`」。

**JVM 调优参数。** 堆：`-Xms`/`-Xmx`（设成相等避免动态扩缩）、`-Xmn` 或 `-XX:NewRatio`（新生代比例）、`-XX:SurvivorRatio`；元空间：`-XX:MetaspaceSize`/`-XX:MaxMetaspaceSize`；栈：`-Xss`；GC：`-XX:+UseG1GC`（或 ZGC `-XX:+UseZGC`）、`-XX:MaxGCPauseMillis`、`-XX:ParallelGCThreads`；诊断：`-XX:+HeapDumpOnOutOfMemoryError`、`-XX:HeapDumpPath`、`-Xlog:gc*`（JDK 9+ 统一日志）；容器里还要注意 `-XX:MaxRAMPercentage` 让 JVM 按容器限额算堆。调优的顺序永远是「先量（GC 日志、heap dump、火焰图）→ 定位（内存泄漏 / 分配过快 / GC 参数不当）→ 小步改一个参数 → 对比」，而不是背参数表。

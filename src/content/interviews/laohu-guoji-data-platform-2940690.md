---
title: "老虎国际数据平台开发一面：Iceberg 小文件、数据倾斜与 k 个一组反转链表"
company: 老虎国际
position: 数据平台开发
round: 一面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/b4fe121c700742b7a4e6af590446fd71
tags: ["老虎国际","数据平台","Iceberg","Spark","Flink","YARN","Kafka","数据倾斜","链表"]
summary: "老虎国际数据平台开发一面，前半段围绕 Iceberg（解决 Hive 什么问题、存储架构、小文件产生与合并后如何定位数据）、数据血缘、数据质量监控、大表比对与数据倾斜排查；中间问 YARN 的 ResourceManager 与 NodeManager、Kafka 能否只消费一次；最后是 Python 二维列表赋值坑、SQL 取第二高薪水与「k 个一组反转链表」的思路，并介绍了平台组的分工。"
---

### 《面试题目》

1. 自我介绍。
2. 学过计算机网络、数据结构吗？常用语言是什么？项目主要用什么语言？
3. Iceberg 解决 Hive 的什么问题？
4. Iceberg 的存储架构是怎样的？
5. Iceberg 的小文件是怎么产生的？
6. 合并小文件之后，怎么定位到数据？
7. 你们公司的组织架构是怎样的？
8. 数据血缘是如何产生的？
9. 任务用的是 Spark 还是 Flink？
10. 怎么配置数据质量监控？
11. 大数据场景下两张大表如何比对？
12. 如何排查数据倾斜？
13. 任务卡死、又看不到热点 Key，怎么排查？
14. 了解 YARN 吗？ResourceManager 和 NodeManager 分别负责什么？
15. Kafka 能否保证消息只消费一次？消息不丢和不重复哪个更容易？
16. Python 二维列表赋值有什么坑？
17. SQL：查询第二高薪水，没有则返回 null。
18. 算法：k 个一组反转链表，说说思路。
19. 你有什么想问的？

### 《参考解析》

**Iceberg 解决 Hive 的什么问题**：Hive 表本质是目录加分区，元数据只有分区路径，带来三个硬伤：一是没有事务与快照，做回溯只能存多份全量数据；二是分区粒度过粗，单分区文件数一多，查询规划要把几万个文件全列一遍；三是 Schema 演进靠改目录或加分区，改列名、删列、加列都要重写数据。Iceberg 用三层元数据（metadata file、manifest list、manifest file）记录「哪些数据文件属于哪个快照」，每次提交原子地换一次元数据指针，因此能做到快照隔离、时间旅行、增量读、隐藏分区与 Schema 演进，读时按 manifest 裁剪文件，不用扫目录。

**小文件的产生与合并后的定位**：小文件来自写入侧：批任务按分区提交、每个 task 写自己的文件，文件大小由并行度与数据量决定；流式写入按 checkpoint 间隔频繁提交；上游分批拉取落盘也会产生碎片。合并（rewrite data files / compaction）把同一分区的多个小文件重写成一个大文件，删除旧文件、生成新快照。合并后能定位数据靠元数据：manifest file 里记录每个 data file 的路径、分区值、列级统计（min/max、null 数），manifest list 记录 manifest 及其分区范围；查询时先按分区与统计裁剪 manifest，再定位到具体文件，所以文件重写不影响上层表的逻辑视图，旧快照仍可读。

**数据倾斜与「看不到热点 Key」**：倾斜的判据是同一 Stage 内各 task 处理的数据量或耗时差一个数量级以上，先看 Spark UI 的 Stage 详情（Shuffle Read Size 分布、Task 耗时分布）与 key 分布抽样。治理手段：热点 key 加盐（前后缀打散后两阶段聚合）、小表广播避免 Shuffle、把热点 key 单独抽出走单独逻辑、提高并行度、开启 AQE 的 skew join 处理。任务卡死又看不到热点 key 时，先确认卡在哪个 Stage 与哪几个 task（可能是单 task 数据过大、也可能是外部系统慢），抽样该分区的 key 分布验证，再试打散；打散无效就往资源与外部依赖方向查（GC、磁盘、下游限流），不要只在 SQL 层打转。

**YARN 与 Kafka 语义**：YARN 里 ResourceManager 负责全局资源调度与分配（维护队列、节点心跳、容器分配），NodeManager 负责单节点上的容器生命周期、资源监控与日志上报，ApplicationMaster 负责单个应用的 task 调度与容错。Kafka 的「只消费一次」需要消费端把 offset 提交与业务处理做成一个事务，Kafka 自身提供事务 API 与幂等生产者，跨系统时通常靠「业务侧幂等 + 手动提交 offset」实现端到端一次。不丢与不重复本质是两种失败方向：不丢要求先处理后提交 offset（至少一次），不重复要求先提交后处理或做去重（至多一次）；两者难度接近，工程上一般选至少一次加幂等，因为去重可以靠业务主键做。

**Python 二维列表的坑**：`[[0] * n] * m` 创建的是 m 个指向同一列表的引用，改 `a[0][0]` 会同时改所有行。正确写法是 `[[0] * n for _ in range(m)]`。同类坑还有可变默认参数（`def f(x=[])`）与浅拷贝嵌套结构。面试官问这个通常是想确认你踩过并记住了原因，答「只修改指定位置元素」并不够，要说清引用共享。

**SQL 取第二高薪水**：`SELECT MAX(salary) FROM employee WHERE salary < (SELECT MAX(salary) FROM employee);` 返回 null 是因为没有行满足条件，天然满足「无则 null」。用窗口函数则 `SELECT DISTINCT salary FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) rk FROM employee) t WHERE rk = 2;`，`DENSE_RANK` 处理并列，`ROW_NUMBER` 会把并列挤掉。两种写法都要能说出差别与索引影响。

**k 个一组反转链表**：先写一个反转长度为 k 的子链表（或整段）的函数，主循环用指针 `pre / cur`，每轮先让探针走 k 步确认剩余节点足够（不足 k 个直接返回、保持原序），记下 `next = 探针.next`，反转 `[cur, 探针]` 这一段，把 `pre.next` 指向新的头、原 `cur`（反转后变成尾）指向 `next`，再推进 `pre = 原 cur`。时间 O(n)、空间 O(1)；递归写法更短但栈深度 O(n/k)。

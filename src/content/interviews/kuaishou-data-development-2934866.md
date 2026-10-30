---
title: "快手数据开发面经：湖仓一体、Spark 数据倾斜与连续登录 SQL"
company: "快手"
position: "数据开发"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/c7fd4ac312b34975ba76c679a24e5b86
tags: ["快手","数据开发","湖仓一体","Iceberg","Spark","数据倾斜","SQL"]
summary: "快手数据开发面经：从湖仓一体项目切入，连续追问 Iceberg 与 Hive 的差异、Spark UI 定位倾斜 task、加盐打散与两阶段聚合、AQE 与分区调优，最后手写连续七天登录 SQL 与链表反转。"
---

### 《面试题目》

1. 请简单做个自我介绍。
2. 做数据爬虫会遇到什么问题？反爬机制严重吗？验证码这类怎么处理？
3. 数据清洗怎么做？
4. 项目做了湖仓一体，介绍一下，面向什么业务？
5. 数据来源是什么？
6. 数据采集完之后怎么给到你们？
7. 数据量大概是什么规模？
8. 你觉得 Iceberg 对比 Hive 的优势是什么？
9. Hive 也能存大量数据，性能差距在哪？
10. 项目落地过程中最大的挑战是什么，怎么解决？
11. 有没有改进思路？
12. 聊下大表 Join 的数据倾斜，热点 Key 加盐打散怎么做？
13. 怎么在 Spark UI 定位异常 task？
14. SQL 经过优化器优化，原始 SQL 和执行计划不一样，多处 Join 的时候怎么定位是哪一处 Join 出问题？
15. 定位到倾斜 Key 之后怎么修改 SQL？举个例子，A 表和 B 表 Join，A 表 id 倾斜。
16. A 表 id 加后缀之后，B 表 id 没有后缀，匹配不上，B 表怎么处理？
17. 另一种思路，A 表拆成十份，B 表也拆成十份，小份之间 Join，这个思路怎么实现？
18. ORC 和 Parquet 压缩、分桶了解吗？
19. ORC 和 Parquet 区别是什么？
20. 开启 AQE 主要作用是什么？
21. 你觉得自己设置分区比 AQE 自动设置性能更高，高的点在哪？
22. Flink、ClickHouse 这些了解程度怎么样？
23. 写 SQL：一张表有 user_id、登录日期，写出 SQL 找出连续七天登录的用户 id。
24. 算法题：再说说链表反转。

### 《参考解析》

**Iceberg 对比 Hive 的优势**：Hive 表本质是 HDFS 目录加分区目录，查询计划依赖 metastore 加文件 listing，文件级统计很少，提交靠 rename，做不到快照隔离和原子覆盖。Iceberg 用 metadata.json → manifest list → manifest 三层元数据记录每个数据文件的 min/max、null 数、行数，规划阶段就能裁剪文件、不用扫目录；写入通过新快照原子提交，支持 ACID、时间旅行、增量读、隐藏分区和分区演进，而且引擎无关（Spark、Flink、Trino 共用一套表）。所谓性能差距，主要来自规划阶段的文件裁剪与避免 listing，以及写入时不用大量小文件 rename。

**Spark 数据倾斜的定位**：进 Spark UI 的 Stage 详情看 task 分布，倾斜的典型特征是少数 task 的 Shuffle Read Size、Spill、Duration 远高于中位数，甚至把 executor 打挂。结合 SQL 的 explain 找到 Join/GroupBy 的 shuffle 边界，再抽样看 key 的分布确认热点值。定位到热点 key 之后有三类改法：热点 key 加随机后缀、小表按后缀膨胀后 Join，聚合完再去后缀；拆成大 key 单独处理，其余走正常链路；两阶段聚合，先局部聚合再全局聚合。AQE 的 skew join 也能在运行时把大分区拆开，但前提是统计信息准确、倾斜发生在 shuffle 之后。

**加盐后 B 表匹配不上怎么办**：A 表热点 id 加 0 到 N-1 的后缀，B 表（通常是小表或维表）要复制 N 份、每份打上对应后缀再 Join，这样每个后缀都能匹配到一份；Join 完把后缀去掉再做一次聚合。代价是 B 表膨胀 N 倍，所以只对真正热点的那几个 key 做，不要全表加盐。另一种拆十份的思路是 range/哈希重分区：A、B 都按 id 的哈希对 10 取模写成 10 个分片，同名分片之间 Join，把单点压力摊到 10 个 task；实现上可以先加一列 `pmod(id, 10)` 作为分区键，再按这个键分桶写临时表，或者用 `repartition(10, col)` 后分别处理。

**ORC 与 Parquet**：两者都是列式存储，按行组切分、列内做编码和压缩。ORC 的统计信息和索引更强，文件、 stripe、行组三级都有 min/max 与布隆过滤器，压缩通常用 ZLIB/ZSTD，Hive 生态原生支持；Parquet 的嵌套结构支持更完整（Dremel 编码），Spark、Presto、Arrow 生态更广，压缩可选 Snappy/GZIP/ZSTD。选择主要看查询引擎和团队栈，同等压缩算法下两者差距不大；分桶则是按分桶键哈希把数据切成固定数量的文件，用来避免 shuffle、做 bucket join，和文件格式是两件事。

**AQE 的作用与手动分区的取舍**：AQE 在 shuffle 之后用真实统计做三件事：合并过小的 shuffle 分区、把倾斜的大分区拆开、在 sort-merge join 与 broadcast join 之间动态切换。它解决的是静态预估不准的问题，适合数据分布不稳定、SQL 由多方拼接的场景。手动设置分区数在两种情况下更好：一是对数据量和分布非常了解，能一次把分区定到合适大小，省掉 AQE 的运行时代价；二是分区键本身有业务含义，按业务键分区还能顺带裁剪。代价是数据量涨了要人工调，估错就会小文件过多或单分区过大。

**连续七天登录 SQL**：先去重出用户每天的登录记录，再用「日期减行号」把连续区间分成同一组，最后按组计数。核心写法：

```sql
WITH t AS (
  SELECT DISTINCT user_id, login_date FROM user_login
),
g AS (
  SELECT user_id, login_date,
         date_sub(login_date, row_number() OVER (PARTITION BY user_id ORDER BY login_date)) AS grp
  FROM t
)
SELECT user_id
FROM g
GROUP BY user_id, grp
HAVING COUNT(*) >= 7;
```

注意 `login_date` 要先转成日期类型并去掉时分秒，同一天多次登录必须 DISTINCT，否则行号会把一天拆成多行、连续区间算错。

**链表反转**：迭代法用三个指针 prev、curr、next，逐个把 curr.next 指向 prev，然后整体后移，时间 O(n)、空间 O(1)；递归法是先反转后面的链表再把当前节点接到末尾，代码短但递归深度等于链表长度。面试里优先写迭代，顺手说明边界：空链表、只有一个节点、反转后要返回新的头节点。

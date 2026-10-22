---
title: "中邮消费金融数据开发一面：HDFS、数据湖与 Spark 慢任务"
company: "中邮消费金融"
position: "数据开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/e38a3c732f514e55af2225dad0a01831
tags: ["中邮消费金融", "数据开发", "HDFS", "数据湖", "Flink", "Spark", "Hive"]
summary: "中邮消费金融数据开发一面（15 分钟）：HDFS 数据格式、容量快满怎么办、流式计算场景、MySQL 到 Flink 的链路、Spark 慢任务排查、数据湖与对象存储、HDFS 迁移、HiveSQL 优化与职业规划。"
---

### 《面试题目》

1. 自我介绍。
2. HDFS 常用的数据格式有哪些？
3. HDFS 容量快满了，该怎么办？有了解过快照吗？
4. 哪些数据需要用得上流式计算？
5. 数据如何从 MySQL 写到 Flink 进行计算？
6. Spark 慢任务怎么排查？
7. 数据湖、对象存储与 HDFS 有什么区别？对象存储是如何存储数据的？
8. HDFS 如何迁移文件到对象存储？
9. 如何优化 HiveSQL？
10. 未来三年的职业规划是什么？
11. 反问：数据平台组件是否上 K8s、是否高度容器化？
12. 反问：ETL 任务与 AI 结合的情况？

### 《参考解析》

**HDFS 容量快满，先分清是「总量不够」还是「小文件太多」**。总量不够就扩容 DataNode 或加磁盘；小文件多则是 NameNode 元数据压力大，要靠合并（HAR、合并写入）、压缩、清理历史分区解决。HDFS 支持快照（snapshot），可以在目录级保留某个时间点的只读副本，用于误删恢复和备份，但它不减少存储占用太多，别当成扩容手段。

**流式计算适合「时效性要求高、持续到达」的数据**：用户行为埋点、风控交易流水、实时监控告警、实时大屏。离线批处理适合 T+1 报表和全量重算，两者按新鲜度要求分，不是越实时越好。

**MySQL 到 Flink 的典型链路是 CDC**：Debezium/Canal 读 binlog → Kafka → Flink 消费做清洗、聚合、维表关联 → 写入目标存储。这样不侵入业务库，也能保证顺序和断点续传。

**Spark 慢任务排查**看数据倾斜、shuffle 量、GC、磁盘 spill 和资源竞争。先看 stage 里哪个 task 明显慢于其他（倾斜），再看 shuffle read/write 大小，必要时加盐打散、调整分区数、提高并行度或换 join 策略。

**数据湖和 HDFS 的区别在「表格式与事务」**：HDFS 只是分布式文件系统；数据湖（Iceberg/Hudi/Delta）在文件之上加了 schema、分区演进、ACID 和快照，支持增量读和时间旅行。对象存储是扁平 key-value，按对象存、适合海量非结构化数据，但 rename 和元数据操作比 HDFS 贵。

**HiveSQL 优化**：分区裁剪、列裁剪、避免笛卡尔积、小表广播、控制 reduce 数量、处理数据倾斜、用 ORC/Parquet 列存加压缩、避免在 where 里对分区字段做函数运算。

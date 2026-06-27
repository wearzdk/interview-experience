---
title: 某小厂Java开发一面面经（含ClickHouse专项）
company: 某小厂
position: Java开发工程师
round: 一面
date: '2026-06'
result: 凉经
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2868542
tags: ["Java","MySQL","Redis","JVM","ClickHouse","Docker"]
summary: "某小厂Java开发一面面经，题目覆盖Java基础（多态、static、集合线程安全）、Redis vs MySQL对比、慢SQL排查与索引失效判断、JVM结构、ClickHouse vs MySQL区别、Docker部署原因。候选人自评凉经。"
---

### 《面试题目》

1. 自我介绍
2. 谈谈你对 Java 的了解
3. 多态的理解，举一个现实中的例子
4. static 与非 static 修饰变量的区别，以及各自在 JVM 中的内存区域（类调用 vs 对象调用）
5. 谈谈你对集合的了解，哪些集合是线程安全的，哪些是不安全的
6. Redis 与 MySQL 的区别（从磁盘和内存角度）
7. SQL 优化：如何定位慢 SQL，有哪些排查方法
8. 如何判断索引是否失效
9. 慢 SQL 中关联表很多，为什么会导致 SQL 变慢
10. JVM 的了解
11. 计算机网络的七层模型（OSI 模型）
12. 为什么用 Docker 部署而不用本地部署
13. ClickHouse 与 MySQL 的区别，为什么用 ClickHouse 不用 MySQL，大数据量时为何不选 MySQL
14. 在虚拟机中查看日志报错的命令

---

### 《参考解析》

**线程安全集合 vs 非线程安全集合**
线程安全：`Vector`、`Hashtable`、`CopyOnWriteArrayList`、`ConcurrentHashMap`、`ConcurrentLinkedQueue`；非线程安全：`ArrayList`、`LinkedList`、`HashMap`、`HashSet`。推荐优先用 `java.util.concurrent` 包下的并发集合，而非加了全锁的老版本类。

**Redis vs MySQL**
MySQL 数据存储在磁盘（HDD/SSD），靠 Buffer Pool 做热数据缓存，适合复杂查询和 ACID 事务；Redis 数据全量存于内存（可持久化到磁盘 RDB/AOF），读写延迟在微秒级，适合高频访问的热点数据、缓存、计数器、会话存储。

**索引失效场景**
① 对索引列使用函数或运算（如 `WHERE YEAR(create_time) = 2026`）；② 隐式类型转换（字符串列用数字条件）；③ LIKE 以通配符开头（`LIKE '%abc'`）；④ OR 连接的列未全部建索引；⑤ 联合索引不满足最左前缀原则；⑥ IS NULL / IS NOT NULL（部分场景）；⑦ 数据区分度极低，优化器选择全表扫描。

**ClickHouse vs MySQL**
ClickHouse 是列式存储 OLAP 数据库，同一列数据连续存储且高度压缩，聚合查询（GROUP BY、SUM、COUNT）扫描列时 IO 极低；MySQL 是行式存储 OLTP 数据库，适合事务操作和按行读写。大数据量聚合分析时 ClickHouse 查询速度可比 MySQL 快10-100倍，但不支持频繁的单行更新/删除。

**Docker 部署优势**
环境一致性（开发、测试、生产镜像相同，消除「在我机器上能跑」问题）、快速部署（秒级启停）、资源隔离（cgroup/namespace）、方便横向扩展和回滚。
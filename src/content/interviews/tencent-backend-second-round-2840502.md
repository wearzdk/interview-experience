---
title: 腾讯TME酷我车载业务部后台开发二面面经
company: 腾讯
position: 后台开发
round: 二面
date: '2026-04'
source: 牛客网
tags: ["Java","Redis","MySQL","JVM","计算机网络"]
summary: "腾讯TME酷我车载业务部后台开发二面面经，重点考察Java集合、JVM内存管理、Redis持久化与集群机制、MySQL锁机制与高并发扣减策略、以及TCP/HTTP协议基础。适合后台开发求职者针对高频八股与场景设计题备考。"
---

### 《面试题目》

**开场：**
1、熟悉的语言

**八股：**
2、Java 当中的常见集合介绍下
3、ConcurrentHashMap Segment 分段锁有什么弊端
4、StringBuilder 和 StringBuffer 的区别，StringBuffer 如何保证线程安全的
5、JVM 内存结构了解吗
6、JVM 常见问题排查常用命令知道吗
7、Java 基本数据类型和包装类型的区别
8、int a = 2; Integer b = 2; a == b; 以及 Integer a = 200; Integer b = 200; a == b; 结果分别是
9、B 树和 B+ 树的区别
10、Redis 了解吗
11、Redis 持久化方式介绍下
12、先后执行 set name 张三 和 set name 李四 在 AOF 持久化过程中都写入 AOF 文件吗
13、场景：类似 12306 买车票，如何保证多个请求不会发生超卖
14、Redis 高可用方案知道哪些
15、Redis Cluster 集群如何分配 key 在哪个 slot
16、一般什么情况下会用 Redis
17、String 类型，如果 value 大小几十兆会怎么样
18、Set 类型元素个数过多怎么办
19、SQL 语句性能问题如何排查优化
20、MySQL 什么情况下会锁表
21、场景：一个表，name 字段是非唯一索引，有多条 name = 张三，这个时候查询 where name = 张三，是什么锁
22、场景：一个表，用户余额进行扣减，只在MySQL层面，如何保证并发安全
23、MySQL 什么情况下加记录锁
24、TCP 和 UDP 区别，HTTP 用的哪个传输协议
25、HTTP 报文有哪些部分，响应体有哪些类型
26、TCP 三次握手和四次挥手过程，为什么不是五次六次

**其他：**
27、平时写代码有什么注意的点或者规范吗
28、一个大型项目，你会怎么对代码分层
29、平时写代码会用到 AI 吗，哪些场景会用
30、到岗时间、实习时间、实习地点相关

---

### 《参考解析》

1. **ConcurrentHashMap分段锁弊端**：JDK1.7的Segment分段锁限制了并发度且内存开销大，JDK1.8优化为CAS+Synchronized，锁粒度更细，直接锁桶头节点，性能更高。
2. **Integer比较问题**：int与Integer比较会触发自动拆箱；Integer在-128~127之间有缓存，200超出了缓存范围，会创建新对象，所以Integer a=200, b=200比较结果为false。
3. **Redis超卖场景**：通常使用Lua脚本配合Redis的原子性（如DECR）或使用Redisson分布式锁实现，确保扣减逻辑的串行化与原子性。
4. **Redis Cluster Slot**：通过 CRC16 算法计算 key 的 hash 值，再对 16384 取模，映射到对应的槽位，实现数据的水平切分。
5. **MySQL非唯一索引锁**：在RR隔离级别下，查询 name = '张三' 会加临键锁（Next-Key Lock），锁定索引记录及其前后的间隙（Gap），防止幻读。
6. **MySQL并发扣减**：利用SQL的行级锁特性，使用 `update table set balance = balance - 10 where user_id = 1 and balance >= 10`，通过数据库行锁保证并发安全。
---
title: "汇川技术 Java 一面：线程池隔离、双亲委派与慢查询排查"
company: "汇川技术"
position: "Java 后端"
round: "一面"
date: '2026-10'
source: 牛客网
tags: ["线程池","双亲委派","类加载","MySQL","慢查询","Binlog","死锁"]
summary: "汇川技术 Java 一面无手撕，八股多由实习延伸：线程池七个参数与执行链路、线程池分层隔离、双亲委派与类卸载、同名类被不同 ClassLoader 加载的后果、left/right join、慢查询排查、索引失效、Binlog 三种格式与大分页。"
---

### 《面试题目》

1. 为什么从上一段实习离职？
2. 线程池的 7 个参数及执行链路是什么？
3. 线程池分层隔离的应用场景是什么？不分层会有什么影响？
4. 双亲委派模型的流程和作用是什么？
5. 一个类被不同的 ClassLoader 加载后会怎样？两个 ClassLoader 加载同名类有什么影响？
6. 类可以被卸载的条件是什么？
7. `left join` 和 `right join` 的区别？
8. MySQL 慢查询用什么方法排查？索引失效的场景有哪些？
9. Binlog 的三种格式是什么？
10. 大分页 `limit 10万,20万` 为什么慢？
11. 什么情况下会有死锁？做性能优化时会看 P95、P99 吗？

### 《参考解析》

**线程池七参数**：核心线程数、最大线程数、空闲存活时间、时间单位、任务队列、线程工厂、拒绝策略。执行链路是：核心线程未满就新建核心线程执行 → 核心满了进队列 → 队列满了且未到最大线程数就新建非核心线程 → 都满了走拒绝策略。要补一句「队列类型决定行为」：用无界队列 `LinkedBlockingQueue` 时最大线程数形同虚设，任务会无限堆积直到 OOM——这是最常见的误用。

**线程池隔离**：按业务/依赖拆成多个池（订单、库存、调用第三方），目的是防止一个慢依赖耗尽线程把整个服务拖垮。不分层的后果是级联故障：某个接口下游超时，所有线程都卡在那里，其他正常接口也拿不到线程。隔离手段还包括信号量隔离、舱壁模式，配合超时与熔断。

**双亲委派**：加载类时先委派给父加载器（App → Extension/Platform → Bootstrap），父加载器加载不了才自己加载。作用是避免核心类被篡改（自己写个 `java.lang.String` 不会被加载）、保证同一个类在 JVM 内唯一。打破它的场景：SPI（`ServiceLoader` 用线程上下文类加载器）、Tomcat（每个 webapp 独立 ClassLoader 实现应用隔离）、OSGi 的热部署。

**同名类被不同 ClassLoader 加载**：会产生两个不同的 Class 对象，`instanceof` 为 false，强转会抛 `ClassCastException`，静态变量各自一份。这是 Tomcat 部署多个应用、热部署、以及自研插件系统时最典型的坑。判断两个类相同需要「全限定名 + 同一个 ClassLoader」。

**类卸载条件**：该类的所有实例都被回收、对应的 Class 对象没有引用、加载它的 ClassLoader 已被回收（三者同时满足）。所以自定义 ClassLoader 是热部署能卸载的前提；JDK 自带的 Bootstrap/App ClassLoader 加载的类基本不会被卸载。

**left/right join**：left join 保留左表全部行，右表不匹配补 NULL；right join 反过来。要注意「where 条件写在 on 还是 where」的区别——写在 where 里对右表的过滤会把外连接退化成内连接。

**慢查询排查**：开 `slow_query_log` 设 `long_query_time`，用 `mysqldumpslow` / `pt-query-digest` 聚合，`EXPLAIN` 看 type（避免 ALL）、key、rows、Extra（Using filesort / Using temporary 是危险信号）。索引失效常见原因：对索引列做函数或运算、隐式类型转换（字符串列传数字）、`like '%x'` 前置通配、`or` 连接非索引列、联合索引不满足最左前缀、区分度太低、以及优化器估算后选择全表扫。

**Binlog 格式**：STATEMENT（记 SQL，日志小但某些函数/时间依赖会导致主从不一致）、ROW（记行变更前后镜像，最安全、日志大，生产默认）、MIXED（默认 STATEMENT，遇到不确定的语句切 ROW）。

**大分页慢**：`limit 100000,20` 需要扫描并丢弃前 10 万行，代价随偏移线性增长。优化用「延迟关联」（先用覆盖索引取主键再回表）、「游标分页」（`where id > last_id order by id limit 20`）、或把范围条件尽量下推。

**死锁**：互斥、持有并等待、不可剥夺、循环等待四个条件同时成立就会死锁。数据库层面常见于两个事务以相反顺序更新同一批行、间隙锁与插入意向锁冲突、以及大事务持锁过久。排查看 `SHOW ENGINE INNODB STATUS` 的 LATEST DETECTED DEADLOCK，处置靠统一加锁顺序、缩短事务、必要时降隔离级别。

**P95/P99**：必须看。均值会被掩盖，尾延迟才是用户体感；做优化前后对比用同一分位数、同一时间窗。

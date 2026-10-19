---
title: "衡泰技术 Java 后端一面：线程池、Kafka 有序性与 G1 调优"
company: "衡泰技术"
position: "Java后端"
round: "一面"
date: '2026-10'
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/c85e37ab35a6400581001204bcf404da"
tags: ["衡泰技术","Java后端","一面","线程池","Kafka","Spring","ClickHouse","JVM"]
summary: "衡泰技术 Java 后端一面面经，约 25 分钟，基本围绕简历提问，考点包括线程池与拒绝策略、Kafka 消费有序性、Spring Bean 加载、ClickHouse 物化视图、G1 与 CMS、DDD 架构及线上 CPU 飙高排查。"
---

### 《面试题目》

1. 介绍线程池，项目中有哪些应用？淘汰策略为什么选这个？
2. Kafka 中的消息有序性怎么保证？消费者多线程的情况下怎么处理消息有序性？
3. Spring 中的 Bean 加载过程是怎样的？引入一个 jar 包，怎么知道要加载哪些东西？
4. ClickHouse 的选型考虑，以及物化视图怎么用？
5. G1 垃圾回收器和 CMS 有什么区别？
6. DDD 架构怎么理解？
7. 线上 CPU 飙高怎么排查？

### 《参考解析》

**线程池与拒绝策略**：先讲七个参数与提交流程：核心线程占满后入队，队列满才扩到最大线程，再满触发拒绝。CPU 密集型线程数接近核数，IO 密集型按等待/计算比放大；队列必须有界，否则堆积会拖爆内存。拒绝策略选自定义实现，记录日志并抛异常交上游重试，宁可快速失败也不静默丢任务，而不是 CallerRunsPolicy 把压力反弹回调用方。

**Kafka 消息有序性**：Kafka 只保证单分区内有序。生产者按业务 key（如订单号）分区，开启幂等 `enable.idempotence=true` 压掉重试乱序。消费侧一个分区同一时刻只由一个线程处理，要多线程消费就用「单线程拉取 + 按 key 哈希进内存队列 + 每队列固定线程」。扩并行度应增加分区与实例；跨分区全局有序只能牺牲吞吐，用单分区或消费后按序号重排。

**Spring Bean 加载与自动装配**：生命周期大致是实例化、属性填充、Aware 回调、BeanPostProcessor 前后处理、初始化、使用、销毁。引入 jar 后之所以知道加载什么，靠自动装配：Spring Boot 读取依赖的 `META-INF/spring/...AutoConfiguration.imports`（旧版 `spring.factories`）列出的配置类，再按 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件筛选，最后由 `@ComponentScan` 扫当前包。

**线上 CPU 飙高排查**：`top` 找进程，`top -Hp` 定位线程，线程号转十六进制后在 `jstack` 里对照 `nid` 找到栈顶，判断是死循环、频繁 GC 还是锁自旋。再看 `jstat -gcutil` 与 GC 日志，老年代居高不下就 `jmap -histo` 或堆 dump 找大对象；计算型热点用 async-profiler 或 arthas 的 `profiler` 拿火焰图。结合近期发布与流量确认根因，再决定回滚、限流或改代码。

---
title: "拼多多服务端工程师一面"
company: "拼多多"
position: "服务端开发"
round: "一面"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/1f4ad6a5fd9a44368a85eceba8746b61"
tags: ["拼多多", "服务端", "Java", "HashMap", "线程池", "MySQL", "Redis"]
summary: "拼多多服务端一面包含手撕 HashMap、2GB 内存下大字符串去重、Java 线程状态、线程池、泛型擦除、动态绑定、Redis/MySQL 并发量和 MVCC。"
---

### 《面试题目》

1. 手撕 HashMap，实现 put、get、remove。
2. 2GB 内存、100 个 100MB 字符串，如何完成去重？
3. Java 中线程有哪些状态？
4. Java 线程状态和操作系统线程状态如何映射？
5. 线程池的核心参数有哪些？
6. 泛型是什么？泛型擦除是什么？在哪个阶段完成？
7. Java 的动态绑定机制是什么？
8. Redis 和 MySQL 单实例的并发数量级分别是多少？
9. MySQL 常见存储引擎有哪些？各有什么特点？
10. MySQL 默认事务隔离级别是什么？
11. 可重复读是什么？底层如何实现？

### 《参考解析》

手撕 HashMap 要写清数组 + 链表/红黑树、哈希扰动、扩容和冲突处理。现场不必复刻 JDK 全部细节，但 put 的覆盖、get 的比较、remove 的链表断链要正确，边界包括 key 为 null、容量为 0 和负载因子。

2GB 内存处理 100 个 100MB 字符串，不能把全部内容同时读入。可以流式读取并按哈希分桶落盘，再对每个桶去重；或者用布隆过滤器做前置判断，但布隆过滤器有误判，最终还要精确校验。核心是外排序/分治，而不是在内存里塞一个巨大 Set。

线程状态要区分 Java 的 NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING、TERMINATED 与操作系统的就绪、运行、阻塞。泛型擦除发生在编译期，运行期类型参数被擦除，因此不能 new T()、不能对泛型数组直接创建。MVCC 通过隐藏字段、undo log 和 Read View 实现，RR 下快照读复用第一次读取的视图。

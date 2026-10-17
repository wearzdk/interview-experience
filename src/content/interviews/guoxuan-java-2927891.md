---
title: "国轩高科 Java 开发面试（10.14）"
company: "国轩高科"
position: "Java 开发"
round: "技术面"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/bd7d9af8f01a425b8f61005834a87cac"
tags: ["国轩高科", "Java", "集合", "线程池", "MySQL", "Coding Agent", "网络"]
summary: "国轩高科 Java 开发面试覆盖 final/finally、List、并发集合、线程池拒绝策略、联合索引、MySQL 日志、Coding Agent 工程化和完整网络链路。"
---

### 《面试题目》

1. final 和 finally 有什么区别？final 可以修饰什么？
2. ArrayList 和 LinkedList 有什么区别？连续插入 1000 条数据时选哪个？
3. 用过哪些线程安全集合？ConcurrentHashMap 的具体使用场景是什么？
4. 线程池核心参数有哪些？你选择哪种拒绝策略，为什么？
5. MySQL 联合索引怎么理解？
6. MySQL 常见的三种日志文件是什么？
7. Coding Agent 项目的难点是什么？
8. Coding Agent 做了哪些工程化？
9. 实习项目的结构是什么样的？
10. 从前端点击按钮到服务器处理返回，完整网络链路涉及哪些设备和中间件？

### 《参考解析》

final 修饰类、方法和变量，分别表示不可继承、不可重写和不可重新赋值；finally 是异常处理块，通常用于释放资源。ArrayList 连续插入尾部均摊 O(1)，LinkedList 每次都要新建节点，连续插入 1000 条通常 ArrayList 更合适，除非需要在中间频繁插入且已持有节点。

线程池拒绝策略要结合业务：AbortPolicy 适合不能丢的任务，CallerRunsPolicy 可以反压生产者，DiscardPolicy 适合可丢的日志类任务，DiscardOldestPolicy 适合只保留最新状态。联合索引要讲最左前缀、选择性、覆盖索引和范围查询后的列失效。

Coding Agent 的工程化可以讲工具调用、上下文检索、沙箱、测试、diff 审查、权限和回滚。完整网络链路从浏览器、DNS、CDN、负载均衡、网关、应用服务、缓存、数据库到返回，中间每一层都可能引入延迟和故障。

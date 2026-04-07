---
title: 腾讯AI后端开发实习一面面经
company: 腾讯
position: AI后端开发
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Agent架构","Java并发","MySQL索引","TCP协议","算法"]
summary: "腾讯AI后端开发实习一面面试题整理。涵盖React/CoT/Action等Agent架构、Java内存模型与并发编程、MySQL索引优化与查询定位、TCP四次挥手及异常处理，并附带LeetCode经典算法题解析，助你掌握后端核心面试考点。"
---

### 《面试题目》

**Agent 相关**
1. REACT、COT、Action 三种 Agent 架构的区别是什么？各自适用于什么场景？
2. REACT 模型适合解决什么问题？Action 模型的特点是什么？

**Java 基础与并发**
3. Java 运行时内存区域（线程私有与共享）是如何划分的？程序计数器的作用是什么？
4. Java 内存模型（JMM）中线程内存与主内存如何同步？
5. ConcurrentHashMap 与 HashMap 的区别是什么？
6. HashMap 的扩容机制是怎样的？
7. 线程和进程的区别是什么？

**系统与运维**
8. CPU 或内存使用异常时，如何进行线上排查？
9. 数据库查询变慢时如何定位问题？
10. MySQL 中有哪些索引类型？它们的区别是什么？

**网络协议**
11. TCP 中客户端 ESTABLISHED 而服务端 LISTEN 可能是什么问题？
12. TCP 四次挥手的过程是怎样的？
13. TCP 连接异常断开（如断电）会发生什么？如何判断连接是否存活？

**算法题**
- LeetCode 79: 单词搜索

---

### 《参考解析》

**Agent 架构**：CoT侧重链式思考增强逻辑；ReAct强调“推理+行动”循环，通过外部反馈修正；Action模型则是基于Agent自主调用工具完成任务，适合复杂流程自动化。

**Java 内存与并发**：JVM运行时分为堆、栈、方法区、程序计数器等。JMM通过volatile、synchronized、Lock等机制保证可见性和原子性。ConcurrentHashMap通过分段锁/CAS+synchronized实现高并发，HashMap则是线程不安全的单体结构。

**线上排查**：CPU异常可用`top`定位高负载线程，`jstack`查看堆栈；内存异常通过`jmap`导出堆转储文件，用MAT分析内存泄漏。数据库查询慢优先开启`慢查询日志`，查看`EXPLAIN`执行计划，检查索引是否失效。

**TCP 问题**：TCP连接异常若一方掉线，操作系统通过KeepAlive机制或应用层心跳检测连接存活。服务端处于LISTEN而客户端ESTABLISHED，通常是服务端没收到后续请求或处于半连接状态。

**算法 (LeetCode 79)**：使用回溯法（Backtracking）。遍历网格，找到首字母后递归搜索上下左右邻居，注意使用`visited`数组或原地修改字符记录路径以防重复。
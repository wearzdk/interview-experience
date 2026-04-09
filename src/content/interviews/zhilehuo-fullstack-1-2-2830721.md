---
title: 智乐活全栈工程师1、2面面经
company: 智乐活
position: 全栈工程师
round: 1面、2面
date: '2026-04'
source: 牛客网
tags: ["Java","MySQL","Vue","Redis","MQ","Spring"]
summary: "智乐活全栈工程师面试分享，涵盖1面技术笔试与2面后端核心面试。面试题涉及Java语法、MySQL SQL调优、Vue原理、Redis使用场景、MQ异步处理及并发编程等技术栈，助你高效备战全栈开发岗位。"
---

### 面试题目

**一面：技术笔试**
题目量大，考察思维题与语言基础，包含：
- 二进制的妙用
- Java 语法基础
- MySQL 语法与 Vue 语法原理
- 算法题：扫雷变体（递归逻辑）

**二面：技术面试**
1. 自我介绍
2. 前端到后端的请求全过程
3. 定时任务，Spring 的 ScheduledThreadPoolExecutor
4. MyBatis 的 @Param 参数绑定
5. MyBatis 的 XML 常用标签语法
6. SQL 中 IN 语句的限制大小
7. SQL 调优经验
8. 并发与并行的区别
9. 前端开发薄弱点沟通
10. Redis 使用场景
11. MQ（消息队列）如何使用及使用场景
12. Vue 项目开发经验交流
13. 公司考核：入职后有一周 demo 考核（不支持使用 AI）
14. 反问：面试官建议、AI 的弊端

---

### 参考解析

1. **请求全过程**：涉及 DNS 解析、TCP 三次握手、HTTP 请求报文构造、服务器端 Servlet 容器解析、Spring MVC 分发及 Controller 处理等环节。
2. **ScheduledThreadPoolExecutor**：基于 DelayedWorkQueue 的线程池，适用于定时任务，面试需理解其核心任务队列的堆排序机制。
3. **SQL 调优**：核心点包括索引优化（覆盖索引、联合索引最左匹配原则）、避免全表扫描、减少子查询、利用 EXPLAIN 分析执行计划等。
4. **并发与并行**：并发是逻辑上同时处理（交替执行），并行是物理上真正同时运行（多核 CPU）。
5. **MQ 使用场景**：主要用于系统解耦、异步处理任务、流量削峰填谷，需说明具体项目中如何利用其保证消息的可靠性及顺序性。
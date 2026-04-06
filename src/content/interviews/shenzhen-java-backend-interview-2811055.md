---
title: 深圳某小厂Java后端面试记录
company: 深圳某小厂
position: Java后端工程师
date: '2026-03'
base: 深圳
source: 牛客网
tags: ["Java","MySQL","Redis","Docker","多线程"]
summary: "记录了深圳某小厂Java后端工程师面试经历。涵盖Java基础、JVM内存模型、MySQL索引优化、Redis缓存一致性、多线程实现、Docker常用指令及前端Vue组件通信等核心考察点，适合Java初中级开发者备考参考。"
---

### 《面试题目》
1. 自我介绍及项目介绍
2. 基本数据模型有哪些
3. JVM内存模型介绍
4. 数据库使用及MySQL索引类型
5. SQL语句优化策略
6. Linux基础及项目部署
7. Docker容器操作（查看进程、进入容器）
8. MySQL常用关键字及连接查询区别（Left/Right Join、Union/Union All）
9. Redis数据结构及缓存一致性方案
10. 多线程实现方式、执行顺序控制
11. Java反射机制及应用场景
12. HTTP请求中GET与POST的区别
13. Git版本控制与分支合并操作
14. 前端Vue父组件调用子组件方法
15. AI工具使用及反问环节

---

### 《参考解析》
1. **MySQL索引与优化**：索引包含主键索引、唯一索引、普通索引、全文索引等。优化应遵循最左前缀原则，避免使用SELECT *，利用Explain分析执行计划，并对高频查询字段建立合适索引。
2. **Union vs Union All**：Union会对结果进行去重并排序，开销较大；Union All直接合并结果集，效率更高，适用于确定没有重复数据的情况。
3. **Docker操作**：查看进程使用 `docker ps` 或 `docker top <容器ID>`；进入容器通常使用 `docker exec -it <容器ID> /bin/bash`。
4. **多线程按序执行**：可以通过 `join()` 方法等待前置线程结束，或者使用 `CountDownLatch`、`Semaphore`、`CompletableFuture` 等并发工具类进行协调。
5. **Redis缓存一致性**：最简单的方案是先更新数据库，再删除缓存。若要求较高一致性，可采用延迟双删策略或使用消息队列保证最终一致性。
6. **Vue父子组件通信**：父组件调用子组件，通常通过 `ref` 标记子组件，然后在父组件中使用 `this.$refs.childName.method()` 调用子组件方法。
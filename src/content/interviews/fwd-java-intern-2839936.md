---
title: 富卫保险Java开发实习生面试经验
company: 富卫保险
position: Java开发实习生
date: '2026-04'
source: 牛客网
tags: ["Java基础","MySQL","Spring Boot","多线程","性能测试"]
summary: "富卫保险Java开发实习生面试题整理，涵盖HashMap、ConcurrentHashMap、事务隔离级别、MySQL慢查询与索引优化、Spring Boot/Cloud、AOP以及多线程并发处理等核心技术，助你高效备考。"
---

### 《面试题目》
- 集合：HashMap、ConcurrentHashMap、ArrayList、LinkedList的区别与底层实现。
- 数据库：事务隔离级别、MySQL慢查询优化、索引失效场景、B+树原理、级联查询。
- 多线程：创建线程的方式、线程等待（Join/CountDownLatch等）、synchronized与ReentrantLock区别。
- 框架：Spring Boot常用注解、Spring Cloud了解程度、AOP的应用场景。
- 工具与性能：JMeter压测关注指标（QPS等）、Docker容器化基础、Redis业务应用。

---

### 《参考解析》
- **HashMap与ConcurrentHashMap**：HashMap线程不安全，ConcurrentHashMap在JDK 1.7采用分段锁，1.8采用CAS+synchronized，并发性能更高。
- **MySQL事务隔离级别**：读未提交、读已提交、可重复读（MySQL默认）、串行化。主要通过MVCC机制和锁机制解决脏读、不可重复读和幻读。
- **索引失效**：包括使用select *、对索引列进行函数运算、隐式类型转换、违反最左匹配原则、使用like以%开头等。
- **AOP应用**：主要用于日志记录、事务管理、权限控制和性能监控，通过动态代理（JDK或CGLIB）实现非侵入式功能增强。
- **线程等待**：若需等待其他线程执行完毕，可使用Thread.join()方法，或者在多线程协作中利用CountDownLatch或CyclicBarrier进行同步控制。
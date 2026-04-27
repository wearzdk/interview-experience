---
title: 美团AI后端开发日常实习一面面经
company: 美团
position: AI后端开发
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Java后端","Redis","MySQL","设计模式","多线程"]
summary: "美团AI后端开发日常实习一面面经。面试涵盖React与PlanExcuter对比、知识库构建、Redis缓存一致性、MySQL事务、Java Bean作用域、ThreadLocal及设计模式等核心技术点，适合准备后端开发实习的同学参考。"
---

### 面试题目

**AI相关**
1. react和planexcutereplan的区别?分别应用于哪些场景
2. 你在构建知识库的时候遇到的问题是什么?
3. 你了解skills吗

**后端**
1. 你在自学java的过程当中有没有遇到什么困难?
2. 缓存和mysql的数据一致性怎么保证?
3. 除了Cache aside策略之外，还有什么写入策略?
4. redis实现原子性预扣减的时候你的数据结构怎么设计的?
5. 你还了解哪些相关的中间件?技术原理上对比一下优缺点和区别?
6. session和cookie的区别是什么?
7. bean的作用域，怎么决定它是单例的还是什么?
8. 你还有用到哪些设计模式?
9. 事务注解这块有什么需要注意的
10. 在定义bean的时候有哪些需要注意的?多线程下需要注意些什么?
11. threadlocal实现原理
12. 哈希表怎么实现?
13. 你的数据库表都设计了些什么?

---

### 参考解析

1. **缓存与MySQL一致性**：常用Cache Aside（查询时先读缓存再读库，更新时先删缓存再写库）。为保证强一致，需引入分布式锁或订阅MySQL Binlog（如Canal）进行异步更新。
2. **Redis原子预扣减**：建议使用Lua脚本将“查询库存”和“扣减库存”封装为原子操作，避免并发下的超卖问题；数据结构推荐使用Hash或String结合INCR/DECR。
3. **Bean作用域与多线程**：Spring Bean默认单例（Singleton）。多线程环境下，Bean中定义的成员变量若存在状态变更，需加锁或使用ThreadLocal保证线程安全，否则易引发脏读。
4. **ThreadLocal原理**：每个Thread对象内部维护了一个ThreadLocalMap，key为ThreadLocal实例，value为用户存储的数据。它通过线程隔离，实现了变量的线程级复用。
5. **事务注解注意事项**：`@Transactional`在同类方法调用时会失效（代理对象不经过内部调用）；需注意异常捕获（默认只回滚RuntimeException）；避免长事务导致数据库连接池耗尽。
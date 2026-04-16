---
title: 美团AI后端开发日常实习一面面经
company: 美团
position: AI后端开发
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Java","Redis","MySQL","后端开发","AI工程化"]
summary: "美团AI后端开发日常实习一面面经。考察内容覆盖AI工程化（知识库、Skills）、Java基础（Bean作用域、ThreadLocal）、数据库设计、Redis缓存一致性及中间件原理。适合准备大厂后端实习的同学查漏补缺。"
---

### 面试题目

**AI相关**
1. React和PlanExecuteReplan的区别？分别应用于哪些场景？
2. 你在构建知识库的时候遇到的问题是什么？
3. 你了解Skills吗？

**后端**
1. 你在自学Java的过程当中有没有遇到什么困难？
2. 缓存和MySQL的数据一致性怎么保证？
3. 除了Cache aside策略之外，还有什么写入策略？
4. Redis实现原子性预扣减的时候你的数据结构怎么设计的？
5. 你还了解哪些相关的中间件？技术原理上对比一下优缺点和区别？
6. Session和Cookie的区别是什么？
7. Bean的作用域，怎么决定它是单例的还是什么？
8. 你还用到哪些设计模式？
9. 事务注解这块有什么需要注意的？
10. 在定义Bean的时候有哪些需要注意的？多线程下需要注意些什么？
11. ThreadLocal实现原理？
12. 哈希表怎么实现？
13. 你的数据库表都设计了些什么？

---

### 参考解析

**缓存与数据库一致性**：常用的策略有先更新数据库后删除缓存，但存在并发竞争。建议采用“延迟双删”或通过订阅数据库Binlog（如Canal）进行异步更新。关键在于保证最终一致性。

**Redis预扣减设计**：建议使用Lua脚本保证原子性。数据结构可使用Redis Hash存储库存，结合 `HDECRBY` 指令，或者使用 `Redis+Lua` 判断库存余量并进行扣减，避免超卖。

**Bean作用域与多线程**：Spring默认单例模式。多线程下需注意非线程安全对象（如SimpleDateFormat、HashMap等）定义为Bean成员变量带来的并发风险，应尽量使用局部变量或ThreadLocal。

**ThreadLocal原理**：内部维护一个 `ThreadLocalMap`，Key为ThreadLocal对象，Value为线程局部变量值。每个线程通过自己的ThreadLocalMap访问，从而实现线程隔离，使用完需手动remove防止内存泄漏。

**事务注解注意事项**：`@Transactional` 失效常见原因包括：方法非public、自调用（非代理调用）、捕获了异常未抛出、异常类型不对（默认只回滚RuntimeException）。
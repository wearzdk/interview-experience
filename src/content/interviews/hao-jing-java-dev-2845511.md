---
title: 浩鲸科技Java后端面经
company: 浩鲸科技
position: Java开发工程师
date: '2026-04'
source: 牛客网
tags: ["Java","并发编程","MySQL","JVM","MyBatis"]
summary: "浩鲸科技Java开发岗位面试题分享，涵盖并发编程（Synchronized、线程池）、MySQL事务机制、JVM对象回收与类加载原理、MyBatis框架应用等核心面试考点，助你高效备战Java后端面试。"
---

### 《面试题目》
1. Synchronized锁升级
2. Synchronized与ReentrantLock的区别
3. 线程池的工作流程
4. 线程池的拒绝策略
5. MySQL的ACID
6. 原子性是什么、如何实现
7. 乐观锁的优缺点、CAS
8. MySQL的事务分级
9. 可重复读解决了哪些问题
10. JVM中对象何时被回收？
11. 不可达后会被立刻回收吗？
12. 类加载过程有哪几个阶段？
13. 双亲委派模型原理是什么？
14. MyBatis中绑定SQL入参有哪几种方式？
15. 如何避免MyBatis结果字段与实体属性不一致？

---

### 《参考解析》
1. **Synchronized锁升级**：从无锁到偏向锁、轻量级锁，最后到重量级锁。升级是为了减少锁带来的性能消耗，依据竞争激烈程度自动优化。
2. **MySQL事务隔离**：可重复读（RR）主要解决了脏读和不可重复读问题，通过MVCC（多版本并发控制）配合间隙锁，很大程度上解决了幻读。
3. **JVM对象回收**：主要采用可达性分析算法判断对象是否存活。不可达对象不会立刻回收，需要经历两次标记过程，并在Finalizer队列中确认是否重写了finalize方法。
4. **MyBatis字段映射**：可通过SQL语句中使用AS别名、在Mapper XML中配置`<resultMap>`手动映射字段，或者在application.yml开启驼峰命名自动转换。
---
title: 货拉拉后端开发实习一面
company: 货拉拉
position: 后端开发实习
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","RocketMQ","HashMap","JVM","线程池"]
summary: "货拉拉后端开发实习面试题汇总。考察重点涵盖RocketMQ事务消息、对账业务逻辑、Java基础（String、static、HashMap）、JVM调优及公平锁等。包含LeetCode经典题：无重复字符的最长字串。"
---

### 面试题目

**项目拷打**
- 这里的异步消息为什么选RocketMQ事务消息来做？
- 业务对账有没有出现误告警？
- 交易对账这种对金钱比较敏感的业务，为什么不是实时对账而是天级别的对账？
- 出现误告警怎么处理异常数据呢？

**Java基础**
- Java的基本数据类型有哪些？
- String为什么是不可变的？为什么要设计为不可变？
- Java的'=='和'equals'的区别？
- StringBuffer和StringBuilder的区别？
- StringBuffer和字符串拼接的'+'有什么区别？
- static关键字有什么作用？什么场景下会使用static去修饰类方法？
- static修饰的静态代码块的执行顺序是什么？
- Java反射中class.forName和对象.getClass的区别？

**集合与并发**
- HashMap的put方法会执行什么操作？
- HashMap的key是有序的吗？哪种Map的key是有序的？
- HashMap的key可以是null吗？
- Java线程池的参数有哪些？
- 平时经常用到的一些公平锁和非公平锁分别有哪些？

**JVM**
- 发现频繁的Full GC以后，你会怎么去做GC参数调优？

**算法题**
- 手撕：3.无重复字符的最长字串

---

### 参考解析

1. **RocketMQ事务消息**：用于保证本地事务与消息发送的最终一致性，通过二次确认机制（半消息）确保即使下游服务宕机，消息最终也能投递成功。
2. **String不可变性**：为了字符串常量池（节省内存）、线程安全以及HashMap中Key的哈希值缓存。修改时会产生新对象，效率取决于StringBuilder/StringBuffer的拼接优化。
3. **HashMap put流程**：计算Key的hash值，定位数组下标；若桶为空则插入，若冲突则以链表或红黑树形式存入；若key已存在则覆盖；最后检查是否需要扩容。
4. **Full GC调优**：先通过jstat/jmap分析堆内存占用，查看是否存在大对象或内存泄漏。调优通常涉及调整堆大小(-Xms/-Xmx)、选择合适的收集器(如G1)以及优化存活区比例。
5. **公平锁与非公平锁**：公平锁如ReentrantLock(true)，按等待队列顺序获取；非公平锁如synchronized、ReentrantLock(false)，允许插队以提升吞吐量。
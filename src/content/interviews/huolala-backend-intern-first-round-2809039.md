---
title: 货拉拉后端开发实习一面面经
company: 货拉拉
position: 后端开发实习
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java基础","RocketMQ","HashMap","JVM调优","并发编程"]
summary: "货拉拉后端开发实习生一面面试总结。涵盖RocketMQ事务消息原理、业务对账设计、Java基础知识（String不可变性、static、反射）、HashMap实现机制、Java线程池参数与JVM Full GC调优策略，并包含LeetCode算法题手撕。"
---

### 面试题目

**项目拷打**
- 这里的异步消息为什么选RocketMQ事务消息来做？
- 业务对账有没有出现误告警？
- 交易对账这种对金钱比较敏感的业务，为什么不是实时对账而是天级别的对账？
- 出现误告警怎么处理异常数据呢？

**Java基础**
- Java的基本数据类型。
- String为什么是不可变的？为什么要设计为不可变？
- java的等号和equals的区别。
- StringBuffer和StringBuilder的区别？StringBuffer和字符串拼接的加号有什么区别？
- static关键字有什么作用？什么场景下会使用static去修饰类方法？
- static修饰的静态代码块的执行顺序。
- java反射中class.forName和对象.getClass这两者的区别是什么？

**集合与并发**
- HashMap的put方法会执行什么操作？
- HashMap的key是有序的吗？哪种map的key是有序的？
- HashMap的key可以是null吗？
- Java线程池的参数。
- 发现频繁的 Full GC 以后，你会怎么去做 GC 参数调优？
- 平时经常用到的一些公平锁和非公平锁分别有哪些呢？

**算法题**
- 手撕：3.无重复字符的最长字串

---

### 参考解析

- **RocketMQ事务消息**：用于解决分布式事务中的本地事务与消息发送的一致性。通过发送半消息（Half Message）确认本地事务状态，确保本地业务执行成功后消息才对消费者可见。
- **String不可变性**：不可变是为了线程安全、缓存Hash值（如HashMap key）、以及字符串常量池的实现，节省内存空间。
- **HashMap put流程**：计算Key的Hash值，定位桶位置，若冲突则利用链表或红黑树存储；JDK 8中若链表长度超过8且数组容量大于64则转为红黑树。
- **Full GC调优**：先通过jstat/jmap分析堆内存分布；检查大对象分配、频繁创建临时对象或元空间溢出；调整新生代/老年代比例，优化G1/CMS的回收阈值。
- **公平/非公平锁**：公平锁如ReentrantLock(true)，按请求顺序排队获取；非公平锁如synchronized及ReentrantLock(false)，允许插队以减少线程切换带来的上下文切换开销。
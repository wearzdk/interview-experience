---
title: 愉游Java开发一面面经
company: 愉游
position: Java开发工程师
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","Redis","HashMap","并发编程","分布式系统"]
summary: "愉游Java开发岗位一面面经，面试涵盖Java集合框架（HashMap、ConcurrentHashMap）、Redis缓存设计（雪崩、排行榜、Bitmap签到）、分布式系统逻辑过期与幂等性保障、并发控制（synchronized）及排序算法，适合中高级开发者参考备考。"
---

### 面试题目
1. 自我介绍
2. 如何实现逻辑过期
3. synchronized修饰的代码块报错了会自动释放锁吗？
4. 讲一下缓存雪崩
5. 你的项目是单进程为什么还要用消息队列
6. 如果Redis中库存扣减完但是数据库订单没有生成怎么办
7. 私有TCP协议长什么样
8. HashMap底层结构
9. 并发的时候HashMap存在什么问题
10. 讲一下ConcurrentHashMap
11. 讲一下常见的排序算法，什么时候用快排什么时候用归并
12. Redis排行榜怎么实现，如果有两个参数进行排序ZSet应该怎么实现
13. Redis签到记录用Bitmap在Java中对应的数据结构是什么
14. HashMap的key能否是自定义的，比如Map<Student, Integer>
15. RPC重试的时候如何保证幂等性

---

### 参考解析

- **synchronized报错释放锁**：是的，当线程在执行synchronized代码块时发生异常，JVM会自动释放锁，防止发生死锁。
- **缓存雪崩**：指大量缓存同一时间过期，导致请求全部落入数据库。解决方法：设置随机过期时间、构建高可用Redis集群、使用多级缓存。
- **分布式库存一致性**：属于分布式事务问题。可使用TCC模式、消息队列实现最终一致性，或引入本地消息表记录状态，通过定时任务补偿补偿。
- **HashMap并发问题**：HashMap非线程安全，多线程下进行扩容可能导致链表形成环形结构（死循环），在JDK 1.7中尤为明显，JDK 1.8后主要表现为数据丢失或线程不安全。
- **HashMap自定义Key**：可以，但必须重写equals()和hashCode()方法。否则不同对象即使内容相同，因内存地址不同也会被视为不同Key，导致无法获取预期值。
- **RPC幂等性**：主要通过全局唯一请求ID（UUID或业务ID）加数据库唯一索引实现，或使用Redis缓存请求ID并设置过期时间进行防重校验。
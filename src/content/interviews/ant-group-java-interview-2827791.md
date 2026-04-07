---
title: 蚂蚁国际Java后端开发一面凉经
company: 蚂蚁国际
position: Java后端开发
round: 一面
date: '2026-04'
result: 挂
source: 牛客网
tags: ["Java并发","虚拟线程","JVM","Spring","分布式事务"]
summary: "蚂蚁国际Java后端开发一面面经。重点考察Java虚拟线程（Virtual Threads）原理与性能优势、并发编程（Synchronized/ReentrantLock/volatile）、JMM内存模型、Spring @Transactional事务机制、HTTPS安全协议及分布式系统数据一致性设计方案。"
---

### 面试题目

**开场与背景**
1. 面试官介绍业务
2. 英文自我介绍
3. 三段实习挑一段收获最大的讲讲

**Java并发与虚拟线程**
4. 虚拟线程和传统线程的区别
5. 详细讲讲用户级线程为什么不会有上下文开销
6. 为什么虚拟线程可以既降低上下文切换的开销，又能提升性能
7. 跟java原来的多线程相比，总结虚拟线程的优劣
8. 如何排查虚拟线程的问题
9. 为避免多线程争抢同一资源的并发问题，java中有哪些方式

**锁与内存机制**
10. 详细说说Synchronized和Reentrantlock的原理机制和使用场景
11. Synchronized锁升级的流程，轻量级/重量级具体指的是什么
12. 解释一下volatile关键字的原理和作用
13. 结合JMM模型，展开讲讲内存的可见性问题
14. 假如不用volatile关键字，也想实现内存的可见性，java中还有什么其它方式可以实现

**框架与网络**
15. Spring中的事务如何做
16. @Transactional的原理
17. 描述https的工作流程
18. 如果数据包在传输过程中被篡改，https是怎么保证数据的安全性的

**场景设计**
19. 场景题：用户支付获得积分，支付服务和积分服务是两套异构的系统，支付服务通过message告知积分服务。如何设计才能让支付和积分的行为保持一致

---

### 参考解析

1. **虚拟线程**：传统线程是内核级线程，上下文切换需进入内核态；虚拟线程是用户态轻量级线程，由JVM调度，减少了系统调用和内核切换开销，适合I/O密集型任务。
2. **Synchronized锁升级**：从无锁 -> 偏向锁 -> 轻量级锁 -> 重量级锁。轻量级使用CAS竞争，重量级通过OS互斥量挂起线程。建议优先使用Synchronized，因为JVM对其优化更完善。
3. **Volatile与可见性**：Volatile通过内存屏障禁止指令重排序并强制写入主存。实现可见性的替代方案包括：使用Synchronized/Lock加锁、Atomic类、final变量、或通过ConcurrentHashMap等并发容器。
4. **Spring事务原理**：基于AOP实现。@Transactional在方法执行前开启事务，方法执行后根据异常决定commit或rollback。底层通过TransactionManager管理连接。
5. **分布式一致性**：可采用消息队列实现最终一致性，通过可靠消息最终一致性方案（本地消息表+定时任务补偿）或使用Seata的TCC/AT模式，确保跨服务操作的原子性。
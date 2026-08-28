---
title: "拼多多 Java 服务端一面面经"
company: "拼多多"
position: "Java后端开发工程师"
date: '2026-15'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2874476
tags: ["Java","Redis","MySQL","JVM","并发","计算机网络"]
summary: "拼多多Java后端开发工程师面试记录，覆盖Java、Redis、MySQL、JVM等考点，整理了面试流程与高频问题。"
---

### 《面试题目》

1. 发面经攒人品
2. 背景：211本硕，一段大厂电商业务实习。投递的Java服务端开发。
3. 一面（技术面，约50分钟
4. 面试官不开摄像头，语速较快。上来没有自我介绍，直接确认身份后开始提问。
5. Java基础与集合
6. HashMap的扩容机制。
7. 扩容时，原链表上的元素在新数组中的位置是怎么计算的？（答了高位判断，不需要重新计算hash）。
8. ConcurrentHashMap在
9. 中放弃了分段锁，改用CAS+synchronized，具体是锁住哪个对象？size方法是怎么实现的？
10. 并发与JVM
11. 线程池的核心参数。如果核心线程数设为0，任务进来后的流转过程是怎样的？
12. ThreadLocal的内存泄漏机制。ThreadLocalMap的Entry继承WeakReference，为什么还是会泄漏？
13. 描述一下CMS垃圾收集器的工作流程。Concurrent Mode Failure是怎么产生的？触发Full GC时会退化成什么收集器？
14. MySQL的隔离级别。可重复读（RR）级别下是怎么解决幻读的？（答了MVCC和间隙锁）。
15. 给定一张表 (id, name, age, create_time)，执行 SELECT * FROM table WHERE name = 'zhangsan' AND age > 20 ORDER BY create_time，问怎么建索引比较合理？分析一下走索引的过程。
16. Redis
17. RDB和AOF的优缺点。AOF重写期间如果有新命令进来怎么处理？
18. 缓存击穿的解决方案。单机版互斥锁怎么实现？

### 《参考解析》

1. Redis常用于缓存、分布式锁和计数。缓存与数据库更新通常采用“先写数据库、再删除缓存”，并通过重试、延时双删或消息补偿处理删除失败。
2. MySQL索引通常使用B+树，叶子节点按顺序连接，适合范围查询；设计索引时结合选择性、最左匹配原则和执行计划，避免无效索引与回表开销。
3. 并发问题应先明确共享状态和一致性边界，再选择锁、CAS或队列。线程池需要根据任务是CPU密集还是IO密集设置核心线程数、队列容量和拒绝策略，并监控活跃数与队列长度。
4. TCP通过三次握手建立连接、四次挥手释放连接；HTTPS在TLS握手中协商会话密钥，并用证书校验服务端身份，数据传输阶段主要使用对称加密。

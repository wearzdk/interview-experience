---
title: 安恒信息 Java开发实习面经
company: 安恒信息
position: Java开发实习
date: '2026-03'
source: 牛客网
tags: ["Java","Redis","Elasticsearch","多线程","分布式事务","RAG"]
summary: "安恒信息Java开发实习面试题汇总。涉及Arthas指令、Redis内存淘汰与集群模式、Spring初始化、线程池队列、Elasticsearch更新策略、HashMap与TreeMap、CountDownLatch底层、分布式事务XA与TCC、RAG原理及AI辅助编程工具等核心技术点。"
---

### 面试题目
1. Arthas具体使用的指令还记得吗？他还能解决什么问题？
2. Redis如果内存满了，再查数据或者写数据会怎么办？
3. Spring项目在启动的时候如何进行一些初始化操作？
4. 线程池的队列有哪些？然后如果核心线程数满了，那该怎么办？
5. Redis的3种集群模式（重点是哨兵模式是如何监控的）。
6. Elasticsearch中，如果更新某个字段但字段太多，除了删除再添加，有其他方式吗？
7. HashMap的查询和插入效率；TreeMap有什么特性？
8. Elasticsearch的查询构造条件，Master节点和数据节点有什么区别？
9. 如何保证线程的有序执行？CountDownLatch底层原理是什么？
10. Synchronized包裹代码块，外面的线程争抢是随机的吗？
11. 分布式事务一致性：XA模式和TCC模式的区别？
12. 项目里消息扣减库存，如果数据库宕机了该怎么解决？
13. 如果项目做成全国性大型项目，哪些地方需要完善？
14. 说一下RAG的原理和流程吧。
15. 平时怎么用AI辅助编程？有在Trae或者Cursor去配置吗？
16. JDK各版本有什么新特性？
17. Controller和RestController注解有什么区别？

---

### 参考解析
1. **Redis内存淘汰**：内存满后触发淘汰策略（LRU/LFU等），若配置为禁止写入则会报错；读取不受影响，但可能查不到数据。
2. **线程池机制**：队列包括LinkedBlockingQueue、ArrayBlockingQueue等；核心线程满后，进入队列，队列满则创建临时线程，直至最大线程数，再满则执行拒绝策略。
3. **ES更新**：可使用`_update` API进行局部更新，无需删除整个文档；Master节点负责集群管理（元数据），数据节点负责存储和索引分片。
4. **分布式事务**：XA是强一致性的两阶段提交（2PC），资源锁定时间长；TCC是补偿型事务，通过Try、Confirm、Cancel三个接口实现业务层面的最终一致性。
5. **RAG原理**：检索增强生成，流程为：用户输入 -> 向量化 -> 检索知识库匹配相关片段 -> 将片段与Prompt组合发给大模型 -> 生成回答。
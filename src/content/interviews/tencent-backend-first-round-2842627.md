---
title: 4.24 腾讯云智后端一面面经
company: 腾讯云智
position: 后端开发
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Java","并发编程","Spring Boot","Kafka","JVM","Redis"]
summary: "腾讯云智后端一面面经，面试内容涵盖Java集合与并发编程（ConcurrentHashMap、ThreadLocal、CAS/AQS）、Spring Cloud微服务体系、Kafka高可用架构、JVM内存模型与OOM排查、Redis高级应用及容器化部署等核心技术，助你高效备考。"
---

### 面试题目
1. 自我介绍
2. Java常见集合
3. HashMap和ConcurrentHashMap，put元素的过程
4. 多线程和线程池的使用，怎么保证线程安全，有哪些方式
5. CAS及ABA问题
6. ThreadLocal为什么key为弱引用，value为强引用；ThreadLocal怎么解决异步任务
7. Kafka怎么保证高可用，消息不丢失
8. CAS与AQS原理
9. SpringBoot和Spring区别
10. SpringCloud框架，Nacos使用经验
11. JVM内存结构；遇到过OOM吗；怎么排查OOM；top指令能看哪些信息
12. Kafka异步处理流程；异常处理机制
13. 为什么选择Redis Bitmap；Minio上传接口调用，分片上传实现
14. 向量库存储方式，用户请求数据流向
15. Prompt编写，项目结构（前后端、模型端）
16. 召回率优化；容器化部署（Docker组件、Dockerfile编写）；K8s使用经验
17. 手写两数之和；编码习惯复盘

---

### 参考解析
- **ConcurrentHashMap put过程**：计算key的hash值，利用CAS+synchronized保证并发安全。JDK 1.8后采用数组+链表+红黑树结构，put时若桶为空则CAS写入，若存在则锁住桶头节点。
- **ThreadLocal与弱引用**：Key使用弱引用是为了防止内存泄漏（当外部引用置空时，GC能回收key）。Value强引用需注意在线程池场景下及时调用remove()，否则会导致Entry对象无法被回收。
- **Kafka高可用与不丢失**：设置副本机制（ISR）、acks=all、retries重试；消费者端开启手动提交offset，确保处理逻辑执行后再提交。
- **AQS原理**：抽象队列同步器，基于volatile变量state和双向链表CLH队列实现。通过CAS更新state获取锁，竞争失败进入队列挂起，支持独占/共享模式。
- **OOM排查**：使用jmap dump内存快照，通过MAT或VisualVM工具分析堆内存对象占用，检查是否存在大对象或线程池任务积压导致GC无法释放空间。
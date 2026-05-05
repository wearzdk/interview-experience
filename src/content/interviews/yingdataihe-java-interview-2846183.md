---
title: 英大泰和财产保险 Java开发外包岗面经
company: 英大泰和财产保险
position: Java开发外包岗
date: '2026-05'
result: 凉经
base: 北京
source: 牛客网
tags: ["Java","Redis","Spring","多线程","Docker"]
summary: "英大泰和财产保险Java开发外包岗位面试经历，主要涵盖SQL优化、Redis分布式锁、Spring循环依赖、多线程并发处理、Docker命令及微服务数据一致性等核心技术考察点，适合Java中高级开发工程师备考参考。"
---

### 《面试题目》
- SQL效率优化
- 服务器处理高并发
- String str1="a"与String str2= new String("a")分别会创建几个对象？
- shell脚本写法
- 存储过程怎么触发的
- MyBatis-Plus比MyBatis好在哪里？
- Redis分布式锁如何实现？
- Redis分布式锁有什么缺点？
- String为什么要设计成不可变的？
- 多线程的创建方式
- Java1.8新特性
- Stream流的用法
- Spring循环依赖如何解决的？
- 线程池的参数
- 创建线程池用到了哪些类？
- Docker
- Docker拉取镜像与创建容器的命令
- 索引为什么能加快检索速度？
- 多线程如何通信？
- 多个微服务之间如何保持数据一致性？

---

### 《参考解析》

1. **String对象创建**：`"a"`在字符串常量池中创建一个对象；`new String("a")`会在堆中创建一个新对象，若常量池中无"a"，则常量池也会创建一个，共2个。
2. **String不可变原因**：为了实现字符串常量池节省内存、保证线程安全（不可变对象天然线程安全）以及作为HashMap键时的安全性（Hash值缓存）。
3. **Spring循环依赖**：通过三级缓存（singletonObjects, earlySingletonObjects, singletonFactories）解决，利用提前暴露代理对象打破闭环。
4. **Redis分布式锁缺点**：主从架构下主节点挂掉可能导致锁丢失（建议用Redlock算法）；锁过期时间设置过短可能导致业务未完成锁即释放。
5. **微服务数据一致性**：分布式事务方案包括2PC/3PC（性能较差）、TCC（补偿型）、本地消息表+MQ、Seata框架（AT/Saga模式）或最终一致性（Seata/RocketMQ事务消息）。
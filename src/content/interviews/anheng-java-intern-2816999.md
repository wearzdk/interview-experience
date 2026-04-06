---
title: 安恒信息Java开发实习面试题
company: 安恒信息
position: Java开发实习
date: '2026-03'
source: 牛客网
tags: ["Java","MySQL","Redis","Spring Boot","JVM","并发编程"]
summary: "整理了安恒信息Java开发实习面经。涵盖Java基础（AQS、内存模型、锁机制）、数据库（MySQL索引、MVCC、批量处理）、Spring Boot自动装配、Redis使用以及Linux常用指令等核心考察点，适合准备实习生面试的候选人参考。"
---

### 面试题目

**项目与业务开发**
- 实习期间主要做的事
- 项目大文件上传遇到的问题
- 批量插入怎么处理
- 有一堆字符串，如何存储查找“aaa”字符串
- 如何使用Redis
- 如何在Controller里面定义save方法
- 查询的时候xml怎么写

**Java并发与底层**
- AQS原理
- synchronized锁的是什么
- 线程AB同时调用同一个对象方法 vs 各自创建对象调用方法（互斥分析）
- 线程执行完之后才执行剩下的逻辑用什么（CountdownLatch使用）
- JAVA内存模型
- JAVA堆对象经历的过程
- SpringBoot自动装配原理
- 如何创建线程池，七大参数及工作原理

**数据库与Linux**
- 实习遇到的MySQL问题
- 联合索引、MVCC、MySQL索引数据结构
- Linux通过文件查找字符串
- Linux部署JAVA项目
- Linux后台一直运行JAVA项目
- Linux编辑文件

---

### 参考解析

- **AQS原理**：AQS通过一个volatile的int变量state表示同步状态，并维护一个FIFO的CLH队列。通过CAS操作修改state，获取锁失败的线程会被封装成Node节点放入队列中自旋或阻塞等待。
- **synchronized锁对象**：锁住的是对象实例（非静态方法）或Class对象（静态方法）。若线程调用同一对象的synchronized方法则互斥；若各自创建新对象，则锁定的是不同对象，互不干扰。
- **CountDownLatch**：用于控制线程协作，调用`await()`的线程会阻塞，直到其他线程调用`countDown()`将计数器归零，适用于“等一组线程执行完再走下一步”的场景。
- **SpringBoot自动装配**：基于`@EnableAutoConfiguration`，通过`spring.factories`读取配置类，利用`@Conditional`按需加载Bean，极大简化了传统XML繁琐的配置过程。
- **线程池七大参数**：核心线程数、最大线程数、空闲生存时间、时间单位、阻塞队列、线程工厂、拒绝策略。工作原理为优先核心线程，满了放队列，队列满了扩容至最大，再满则触发拒绝策略。
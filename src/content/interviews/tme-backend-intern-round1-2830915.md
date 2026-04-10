---
title: 腾讯音乐 TME 后台开发暑期实习一面面经
company: 腾讯音乐
position: 后台开发
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Java","Spring Boot","JVM","MySQL","多线程"]
summary: "腾讯音乐TME后台开发暑期实习一面面经，面试时长60分钟。重点考察AI项目实现细节与架构设计，深入探讨Spring Boot Bean生命周期、JVM内存模型、垃圾回收机制、MySQL索引原理及主从复制。侧重考察多线程编程实践与问题定位能力。"
---

### 面试题目

**1. 项目与实习经历**
- 自我介绍
- 实习或项目中遇到的挑战、解决方法及成果
- 项目的实现细节
- AI相关：使用心得及省Token的做法
- 实习工作：重构工作的部署情况及线上经验

**2. 技术考察（穿插在项目中）**
- 项目启动初始化对象的方法
- 多线程应用场景与线程池使用方式
- 问题排查流程：如何从发现问题到定位代码及常用工具

**3. 八股文集中问答**
- Spring Boot Bean生命周期
- JVM内存模型
- 垃圾回收机制
- Java锁机制
- 线程池核心参数与实际使用经验
- MySQL主从复制原理
- MySQL索引原理：B+树结构及主键与非主键索引的区别
- 场景题：设计任务多线程执行及后续多线程衔接的逻辑

---

### 参考解析

- **Spring Boot Bean生命周期**：涉及实例化、属性赋值、初始化（Aware接口、PostConstruct、initMethod）、销毁四个阶段，掌握BeanFactoryPostProcessor与BeanPostProcessor的作用是加分项。
- **JVM内存模型**：需明确堆、栈、方法区、程序计数器、本地方法栈的分布。重点理解堆是线程共享的，栈是线程私有的，以及新生代与老年代的GC触发机制。
- **线程池核心参数**：corePoolSize, maxPoolSize, keepAliveTime, workQueue, threadFactory, handler。需结合具体任务类型（IO密集型 vs 计算密集型）说明如何设置参数。
- **MySQL索引**：B+树的节点存储逻辑需清楚。主键索引叶子节点存储完整行数据，非主键索引叶子节点存储主键值（需回表），理解覆盖索引能有效提升查询效率。
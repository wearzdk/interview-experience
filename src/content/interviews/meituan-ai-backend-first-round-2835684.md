---
title: 美团AI后端开发日常实习一面面经
company: 美团
position: AI后端开发实习生
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Java","Redis","线程池","设计模式","IO多路复用"]
summary: "美团AI后端开发日常实习一面面经。面试涵盖实习与项目深度拷打，重点考查Java并发编程（线程池、Future）、Redis底层数据结构（ZSet）、IO多路复用原理及设计模式。含手撕算法题：重排链表。"
---

### 面试题目

1. **实习与项目经历**
   - 实习经历深入拷打
   - 项目架构与业务逻辑细节拷打

2. **八股文**
   - 线程池的核心参数？怎么创建线程？拒绝策略有哪几种？
   - Future和CompletableFuture的区别是什么？
   - Java的设计模式了解哪些？
   - ZSet的底层数据结构类型是什么？
   - Redis为什么比MySQL快？为什么单线程这么快？
   - 如何理解IO多路复用？
   - 平时AI用的多吗？怎么用AI学习？使用AI的过程中有什么问题？

3. **手撕算法**
   - 重排链表

---

### 参考解析

1. **线程池**：核心参数含corePoolSize、maxPoolSize、keepAliveTime、workQueue、threadFactory、handler。拒绝策略有Abort（抛异常）、Discard（丢弃）、DiscardOldest（丢弃最旧）、CallerRuns（调用者执行）。
2. **Future vs CompletableFuture**：Future只能阻塞等待或轮询获取结果；CompletableFuture支持链式编程、回调函数（thenApply等）和组合式异步处理，功能更强大。
3. **ZSet底层**：由压缩列表（ziplist）或跳表（skiplist）实现。数据较少时使用ziplist，元素较多或较长时使用skiplist+dict，兼顾有序性和查询效率。
4. **Redis性能**：Redis快因基于内存操作、IO多路复用机制、高效数据结构。单线程模型避免了上下文切换和锁竞争开销，且非阻塞IO提升了响应速度。
5. **IO多路复用**：指单线程监听多个Socket连接状态（select/poll/epoll），当有数据就绪时通知用户态进程处理，极大提升了处理高并发连接的能力。
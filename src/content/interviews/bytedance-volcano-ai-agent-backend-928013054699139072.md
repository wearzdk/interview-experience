---
title: 字节火山引擎AI-Agent研发一面面经
company: 字节跳动
position: AI-Agent研发
round: 一面
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/928013054699139072
tags: ["Java", "并发", "Linux", "Netty", "虚拟线程"]
summary: "字节火山引擎AI-Agent研发一面面经，覆盖线程模型、volatile、ForkJoinPool、Linux I/O、多路复用、Netty消息边界和虚拟线程。"
---

### 《面试题目》

1. Java 线程创建后，用户态线程和内核态线程是什么关系？线程切换成本主要来自哪里？
2. Java 内存模型如何保证 volatile 写与后续 volatile 读之间的可见性？为什么不能保证复合操作的原子性？
3. ForkJoinPool 为什么适合递归分治任务？出现阻塞调用时可能产生什么问题？
4. Linux 的 select、poll 和 epoll 在数据结构与事件通知机制上有什么本质区别？
5. epoll 的水平触发和边缘触发有什么区别？为什么边缘触发必须把数据读到 EAGAIN？
6. Netty 如何解决半包、粘包以及业务线程阻塞 EventLoop 的问题？
7. Java 协程与线程的调度边界有什么区别？虚拟线程发生 Pinning 时会带来什么影响？

---

### 《参考解析》

1. **volatile**：对同一变量的 volatile 写 happens-before 后续读，编译器和处理器通过内存屏障保证可见性与有序性。`count++` 仍包含读、改、写三个步骤，需要原子类或锁保护。
2. **ForkJoinPool**：工作线程维护双端队列并通过工作窃取分担递归子任务，适合可拆分且以 CPU 计算为主的任务。阻塞 I/O 会占住工作线程，造成线程饥饿，应隔离到专用执行器或使用 ManagedBlocker。
3. **I/O 多路复用**：select 使用位图并线性扫描，poll 使用数组仍需线性扫描；epoll 将关注集合留在内核，就绪事件进入链表，等待时只返回活跃描述符。边缘触发只通知状态变化，必须循环非阻塞读取到 EAGAIN，避免遗漏剩余数据。
4. **Netty**：通过长度字段、固定长度或分隔符解码器恢复 TCP 消息边界，并限制最大帧长度。耗时业务应提交到独立线程池，EventLoop 只处理 I/O 与快速状态迁移；跨线程传递 ByteBuf 时还要正确管理引用计数。

---
title: 北京爱学习Java开发日常实习面经
company: 北京爱学习
position: Java开发
date: '2026-09'
source: 牛客网
tags: ["Java", "NIO", "并发", "Prompt工程"]
---

### 《面试题目》

1. Java NIO 模型和多路复用是什么？
2. 继承 Thread 与实现 Runnable 有什么区别？
3. synchronized 的底层实现涉及对象头哪些信息？
4. Prompt 工程和 Harness 如何理解？
5. 如何说服资深同事接受更好的技术方案？

### 《参考解析》

NIO 通过 Selector 让一个线程管理多个非阻塞通道，适合连接数多且单次 IO 较短的场景。Runnable 将任务与线程解耦，线程池通常优先使用它；synchronized 由 JVM 管理锁状态并保证可见性与互斥。技术方案争议应以目标、数据和可回滚的小实验对齐，而不是只比较个人资历。

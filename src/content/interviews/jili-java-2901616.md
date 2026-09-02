---
title: 9.2吉利秋招java一面
company: 吉利
position: Java开发工程师
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2901616
tags: ["Java", "线程池", "Redis", "JVM", "并发"]
summary: 吉利秋招 Java 一面，围绕限流、HashMap、线程池、Redis List、synchronized 和单例展开。
---

### 《面试题目》

1. 项目中的滑动窗口限流如何实现？
2. HashMap 的 put 流程是什么？哪些 Map 线程安全？
3. 线程池参数如何设计？无界队列下会创建非核心线程吗？
4. Redis List 的底层数据结构是什么？
5. synchronized 可以用在哪里，方法锁和代码块锁有什么区别？
6. JVM 内存如何划分，对象创建过程是什么？
7. 如何实现线程安全的懒加载单例？

### 《参考解析》

线程池先创建核心线程，队列有界且满时才扩展到最大线程数；无界队列通常不会创建非核心线程。HashMap 通过哈希定位桶并处理链表或树，线程安全场景可使用 ConcurrentHashMap。synchronized 方法锁定实例或 Class，代码块可缩小临界区。懒加载单例可用静态内部类或双重检查锁并配合 volatile。JVM 运行时数据区包括堆、栈、方法区等，对象先分配并初始化再执行构造方法。

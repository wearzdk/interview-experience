---
title: 字节TikTok AI后端开发一面面经
company: 字节跳动
position: AI后端开发
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Agent架构","RAG","Spring AI","Java并发","算法"]
summary: "字节跳动TikTok AI后端开发一面面经。面试深度考察Agent核心架构（Planner/Executor/Supervisor模式）、RAG检索增强生成流程及优化、MySQL与Redis特性对比，以及高并发场景下的生产消费者模型设计，手撕题目为LeetCode 224基本计算器。"
---

### 面试题目

1. 实习与项目经历深挖
2. Agent项目核心功能介绍
3. 智能运维助手的定义与系统组成
4. Spring AI Alibaba在项目中的应用
5. Planner/Executor/Supervisor模式的优点及拆分优势
6. RAG核心流程及优化方案（检索/重排/微调/后训练）
7. MySQL与Redis特性对比、关系型数据库本质、Redis作为存储的可行性
8. 高并发场景设计：1万生产者与5万消费者的Java并发控制实现
9. 手撕代码：LC 224. 基本计算器 (Hard)

---

### 参考解析

1. **Planner/Executor/Supervisor模式**：核心在于解耦与分治。Planner负责全局规划，Executor执行具体任务，Supervisor进行监控纠错。拆分后能显著提升复杂长链路任务的容错率与逻辑清晰度。
2. **RAG优化**：检索层面可优化切片策略、引入Embedding微调、增加混合检索；重排可引入Cross-Encoder。微调通常属于“后训练”（Post-training/SFT），旨在让模型学会遵循指令。
3. **高并发生产消费**：建议使用 `BlockingQueue` 或 `Disruptor` 高性能队列框架。针对大规模并发，需注意锁竞争，可使用无锁队列或 `ExecutorService` 线程池配合 `Semaphore` 进行流控，避免瞬时压力击穿内存。
4. **LC 224基本计算器**：经典栈应用题。核心思路是利用栈保存括号优先级，通过符号位（+/-）处理数字，遇到左括号递归处理或入栈，遇到右括号出栈计算结果。
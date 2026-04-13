---
title: 实在智能Java日常实习一面（35min）
company: 实在智能
position: Java日常实习
round: 一面
date: '2026-04'
result: 通过
source: 牛客网
tags: ["Java","RabbitMQ","WebSocket","数据结构"]
summary: "实在智能Java日常实习一面面经。面试涵盖项目经历、RabbitMQ选型分析、WebSocket与HTTP区别、数据结构基础及Java核心实现等内容，适合准备Java实习的同学参考。"
---

### 《面试题目》
1. 自我介绍
2. 挑一个熟悉的项目说一下
3. 这个项目中主导了哪些功能的开发
4. 性能提升怎么测得的
5. 为什么用RabbitMQ
6. 为什么采用消息队列的形式实现功能
7. 为什么使用WebSocket，与请求响应式有什么区别
8. 其他实习项目相关
9. 栈和队列的区别
10. 为什么选择学习Java
11. 常见的数据结构，Java中对应的实现
12. 反问

---

### 《参考解析》
- **为什么用RabbitMQ/消息队列**：主要用于系统解耦、削峰填谷和异步处理。解耦减少系统间直接依赖，削峰缓解高并发压力，异步提升主流程响应速度。
- **WebSocket与请求响应式的区别**：HTTP是单向请求响应（无状态），需轮询；WebSocket支持全双工通信，建立持久连接后可实时推送数据，适合IM、大屏数据同步。
- **栈和队列的区别**：栈（Stack）是后进先出（LIFO），常用于递归处理、函数调用栈；队列（Queue）是先进先出（FIFO），常用于任务调度、消息缓冲。
- **Java常见数据结构实现**：List对应ArrayList/LinkedList，Set对应HashSet/TreeSet，Map对应HashMap/TreeMap，Queue对应ArrayDeque/PriorityQueue等。
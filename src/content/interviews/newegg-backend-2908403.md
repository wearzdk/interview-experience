---
title: 新蛋Newegg二面面经
company: 新蛋
position: 后端开发
date: '2026-09'
source: 牛客网
tags: ["Java", "Spring", "RabbitMQ", "幂等"]
summary: 新蛋后端二面，主要深挖项目中的Function Calling、消息队列流程、幂等以及IoC和AOP。
---

### 《面试题目》

1. 项目中的 Function Calling 是如何实现的？
2. RabbitMQ 的基本流程是什么，如何保证消费幂等？
3. IoC 和 AOP 分别解决什么问题？
4. 为什么会安排多轮技术面？

### 《参考解析》

1. Function Calling 由模型输出结构化函数名和参数，应用层校验参数、执行白名单工具，再把结果回传模型生成最终答复。
2. 消息经交换机路由到队列，由消费者确认；业务侧用唯一业务键或幂等表确保重复投递不会重复产生副作用。
3. IoC 将对象创建和依赖装配交给容器，AOP 把日志、事务等横切逻辑织入目标调用，两者都降低业务耦合。

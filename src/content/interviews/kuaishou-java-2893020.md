---
title: "快手大模型应用Java实习一面面经，8.17日面"
company: "快手"
position: "Java后端开发工程师"
date: '2026-08'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2893020
tags: ["Java","Redis","Kafka","AI应用","分布式系统","面试经验"]
summary: "快手Java后端开发工程师面试记录，覆盖Java、Redis、Kafka、AI应用等考点，整理了面试流程与高频问题。"
---

### 《面试题目》

1. 以下基于项目
2. 讲一下agent的工作流程
3. agent开发范式有哪些
4. tool如何调用，要注意什么
5. 项目中使用的tool集成优化方法有什么优点， 改善了什么问题，指标如何得出
6. 项目中使用redis分布式锁如何配合kafka，为什么这么设计（结合业务
7. kafka保证消息消费可靠性，kafka保证消息消费幂等性
8. skillhub建设：skill的存储逻辑，是否有合规验证
9. 如何搭建的agent自动运营体系 ，效果如何（benchmark
10. 以上全问项目（30min左右
11. Vibecoding（30min左右写出结果
12. ai搓一个浏览器插件，实现标签页管理和访问记录存储 ，下一步动向推荐等，给了mock数据

### 《参考解析》

1. Redis常用于缓存、分布式锁和计数。缓存与数据库更新通常采用“先写数据库、再删除缓存”，并通过重试、延时双删或消息补偿处理删除失败。
2. Agent或RAG链路应记录工具调用、检索证据和失败原因；对非法参数、路由错误和超时设置校验、重试上限与可观测日志，避免把模型输出直接当作可信结果。

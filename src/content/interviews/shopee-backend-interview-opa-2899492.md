---
title: Shopee后端开发一面面经
company: Shopee
position: 后端开发工程师
round: 一面
date: '2026-07'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2899492
tags: ["Go", "Java", "Agent", "MCP", "数组算法", "网络安全"]
summary: "Shopee后端一面面经，考察网络空间安全、Agent与Skill、Java和Go差异，以及合并有序数组。"
---

### 《面试题目》

1. 请做自我介绍。
2. 请介绍网络空间安全专业或相关学习经历。
3. Agent的基本流程是怎样的？
4. Skill在Agent系统中起什么作用？
5. Harness在Agent系统中起什么作用？
6. Go和Java的主要差别是什么？
7. 如何合并两个有序数组？
8. 你有什么问题想反问？

### 《参考解析》

1. **Agent流程**：通常包括感知任务、规划步骤、调用工具或技能、观察结果、根据反馈继续执行，直到满足完成条件。
2. **Skill与Harness**：Skill封装可复用的领域能力或操作说明；Harness负责运行时编排、上下文管理、工具调用和安全控制，两者分别偏能力定义与执行承载。
3. **Go与Java**：Go编译为原生二进制、运行时轻量并以内置goroutine和channel简化并发；Java依赖JVM，生态成熟、库丰富，适合大型业务系统。选择应结合团队经验、性能和生态需求。
4. **合并有序数组**：从两个数组末尾开始使用双指针，将较大元素放入结果尾部，时间复杂度 `O(m+n)`，若原数组有空余空间可原地完成。

---
title: "10.28 康冠科技 Android 应用开发面经：Redis、规则引擎与端侧 AI"
company: "康冠科技"
position: "Android 应用开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/74991dd50bd14a0999470457b84a9cac
tags: ["康冠科技","Android","Redis","Drools","规则引擎","Agent","端侧AI"]
summary: "康冠科技 Android 应用开发一面：Redis 原子占用与多实例并发、保险理算的 Drools 规则解耦与冲突处理、Agent 模块与 AI 生成 SQL 的审核、Android 基础与端侧 AI 架构。"
---

### 《面试题目》

1. Redis 原子占用是怎么实现的？随机上呼接口在多实例并发调用时怎么保证账号一致？
2. 保险理算、批赔规则与规则引擎是怎么做的？Drools 如何实现不同保险产品的规则解耦？
3. 规则参数怎么设计？跨系统数据查询与依赖怎么处理？
4. 规则冲突、优先级怎么设置？有没有死循环或溢出风险？
5. 规则变更的风险控制怎么做？新旧逻辑对比、配置表切换、灰度发布和全量切换？
6. 介绍一下 Agent 模块的项目经历。
7. AI 生成 SQL 是怎么用的？人工审核流程是什么？
8. 个人智能网页创作平台的情况？提示词怎么管理？开发耗时多久？
9. 工具调用循环和 Agent 框架的思路是什么？
10. 有没有 Android 应用开发经历？用 AI 开发过哪些 Demo？
11. Activity、Fragment 通信与自定义 View 考了什么？
12. 端侧 AI 的应用场景、NPU 推理与 Service 接口架构是怎样的？
13. Agentic AI 与端侧 AI 的区别？端侧 AI 在数据安全上的优势？
14. 后台开发转端侧 AI 可行吗？需要补哪些模型转换工具？
15. 在校开发 AI 项目常用哪些工具？Pi Agent、Claude Code 的框架设计、Agent Loop、Token 消耗与插件扩展？
16. 考研、考公计划与赴深圳工作的意向？学业、英语、薪资期望与其他 offer？

### 《参考解析》

**Redis 原子占用**：用 `SET key value NX PX ttl` 做分布式锁，或用 Lua 脚本把「检查 + 占用」合成一个原子操作；多实例并发下要给每个实例分配独立的账号池或分片键，避免同时抢同一个账号；锁要带过期时间和续期（看门狗），释放时校验持有者（value 存唯一 ID，Lua 比较后删除）。

**Drools 规则解耦**：每个保险产品一组 DRL 文件，用 agenda-group 或 ruleflow-group 隔离，fact 对象统一；规则冲突用 salience 设优先级，避免同一 fact 被多条规则反复修改；死循环风险来自 update/modify 触发自身，要用 no-loop 或控制事实状态；规则变更走「配置表 + 版本号 + 灰度」，新旧逻辑并行跑对账，确认一致再切全量。

**AI 生成 SQL**：模型只生成候选 SQL，必须经过「语法校验 → 权限校验（只读、限定表）→ 人工审核 → 在只读库试跑」；用 schema 和示例约束输出，禁止拼接用户输入；记录每次生成的 prompt 和结果便于回溯。

**端侧 AI 架构**：模型转成端侧格式（ONNX/TFLite/NCNN 等），由 NPU/GPU 推理，通过 Service 向上层应用提供能力；优点是低延迟、离线可用、数据不出设备；难点是模型体积、量化精度、内存和功耗。与 Agentic AI 的区别是后者强调多步规划与工具调用，通常依赖云端大模型。

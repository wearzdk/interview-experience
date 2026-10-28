---
title: "10.26 思锐卓远后端一面：SQL 优化、RAG 与 Agent 工具"
company: "思锐卓远"
position: "后端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/0f5d23c10d6643eaa8b8600d0462d75d
tags: ["思锐卓远","后端","SQL优化","explain","RAG","MCP"]
summary: "思锐卓远后端一面：SQL 性能优化与 explain 的使用、智能体与 Skill/MCP 的实践、RAG 流程，以及学校课程情况。"
---

### 《面试题目》

1. 做一下简单的自我介绍。
2. SQL 的具体性能优化怎么做？
3. 具体说说怎么用 explain 去优化数据？
4. 有用过一些智能体吗？
5. 用过一些 Skill 或者 MCP 吗？
6. 请说一说 RAG 这个流程。
7. 学校课程的问题。
8. 反问。

### 《参考解析》

**SQL 优化**：先定位慢查询（慢日志、监控），再看执行计划；优化手段分四层：索引（联合索引最左前缀、覆盖索引、避免索引失效）、SQL 写法（避免 `SELECT *`、大偏移分页改游标、减少子查询、批量代替循环）、表结构（字段类型、冷热分离、分区）、架构（读写分离、缓存、分库分表）。回答时要给一个真实例子：从几秒降到几十毫秒，改了什么。

**explain 怎么看**：重点看 `type`（ALL < index < range < ref < eq_ref < const）、`key` 实际用了哪个索引、`rows` 预估扫描行数、`filtered` 过滤比例、`Extra`（Using filesort、Using temporary 要警惕，Using index 是覆盖索引）。如果 `type=ALL` 且 rows 很大，就考虑加索引或改写法；如果 `Extra` 有 filesort，考虑让排序字段走索引。

**RAG 流程**：文档接入（解析、清洗、分块）→ 向量化（embedding）→ 入库（向量库 + 元数据）→ 查询理解（改写、意图、过滤条件）→ 检索（向量 + 关键词混合）→ 重排（rerank）→ 组装上下文（截断、去重、加引用）→ 生成（带引用、约束）→ 后处理（校验、引用核对）。要能说出每步的失败模式和评估指标。

**MCP 与 Skill**：MCP 是模型和外部工具/数据源之间的协议，解决「能调用什么」；Skill 是任务的方法与流程封装，解决「该怎么做」。项目里可以用 MCP 接数据库、搜索、内部系统，用 Skill 固化某类任务的操作规范。

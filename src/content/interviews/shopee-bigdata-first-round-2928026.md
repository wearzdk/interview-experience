---
title: "Shopee 大数据开发一面：项目、Spark 与数仓场景"
company: "Shopee"
position: "大数据开发"
round: "一面"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/11db39379bc7440f8f69d5536fcca7fd"
tags: ["Shopee", "大数据", "Spark", "数仓", "HDFS", "SQL", "AI Agent"]
summary: "Shopee 大数据开发一面以项目场景为主，追问 Spark 慢任务、AQE、ETL 调度、HDFS 副本、数仓难点、AI Agent 与数仓结合，并现场写 SQL。"
---

### 《面试题目》

1. 项目都是在公司实习做的吗？
2. Spark 执行任务缓慢，如何优化？
3. 能排查到具体是哪张表、哪个字段导致的问题吗？
4. 了解 AQE 吗？
5. 用过 ETL 调度工具吗？
6. HDFS 的副本机制中，数据更新如何同步到各节点？
7. 做数仓你觉得困难的部分是什么？
8. AI Agent 如何结合数仓？
9. 有了解过 Agent 吗？
10. 有 orders、refunds 两张表，如何统计城市的总收款、总退款和总付款用户数？
11. 你的职业规划是什么？

### 《参考解析》

Spark 慢任务要先定位是数据倾斜、shuffle 过多、资源不足还是单任务长尾。数据倾斜可以看 stage 的 task 输入大小和耗时分布，处理上先过滤无效 key、对热点 key 加盐打散，再考虑 AQE 的 skew join 和分区合并。AQE 不是万能开关，它依赖运行时统计信息，对极端热点和已经写死的分区策略仍有局限。

HDFS 副本写入走 pipeline：客户端把块写到第一个 DataNode，再由它转发给下一个，确认沿相反方向回传。副本更新不是“每个节点各自改”，而是通过租约、版本号和 pipeline 恢复保证一致性。回答时要把“写入 pipeline”和“副本修复”分开。

数仓难点通常不在 SQL，而在业务口径、数据质量和资源成本。AI Agent 结合数仓可以从自然语言查询、指标解释、异常归因和 ETL 编排入手，但必须把权限、口径和可解释性放进设计。现场 SQL 用 orders 聚合收款、refunds 聚合退款，再按城市全连接并统计去重付款用户，注意不要把退款用户误算成付款用户。

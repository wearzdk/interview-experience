---
title: 虾皮（Shopee）Java后端实习二面
company: Shopee
position: Java后端开发实习生
round: 二面
date: '2026-06'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2867569
tags: ["Java","RAG","向量数据库","AI应用开发","系统设计"]
summary: "Shopee（虾皮）Java后端实习二面面经，无八股无手撕，全程拷打RAG项目细节。考察文档解析、分块策略、向量化入库选型（pgvector vs Milvus）、效果评估指标及Agent与RAG的差异。终局为AI Coding实战题。"
---

### 《面试题目》

**一、项目拷打**
1. 是个人项目还是学校实验室项目，怎么做的？
2. RAG 链路具体是如何构建的？
3. 文档输入是什么格式？文字还是其他格式？
4. 文档是如何做拆分（chunking）的？拆分策略具体是什么？
5. 向量化入库用的是什么方案？
6. pgvector 和 Milvus 之间是如何选型的？
7. 项目做到了什么程度，目前效果如何？
8. 用了什么评测指标？测试集是人工打标的吗？
9. 如果业务数据规模很大，如何规模化做 RAG 效果评估？
10. 项目中过程中遇到了什么问题？遇到问题后的优化方向是什么？
11. 这个系统对接大模型了吗？自己写了一个 Agent 吗？
12. 如何理解 RAG 和 Agent 的区别？

**二、算法**
无手撕，改为 AI Coding 实战题：实现一个能跑通链路、处理各种边界情况、有前端页面 Demo 的完整功能，要求输出方案设计、实现代码和测试报告。

---

### 《参考解析》

1. **RAG 链路拆分策略**：常见方法有固定大小分块（按 Token 数）、语义分块（基于句子相似度合并）、递归字符分割（Langchain RecursiveCharacterTextSplitter）。选型依据：语义分块保留上下文完整性最好，但计算成本高；递归字符分割速度快、效果均衡，是入门首选。

2. **pgvector vs Milvus**：pgvector 集成在 PostgreSQL 中，适合数据量中等（千万级以下）、已有 PG 体系、维护成本敏感的场景；Milvus 是专用向量数据库，支持更高并发和更大规模（十亿级），提供 HNSW、IVF 等多种索引，适合生产级向量检索。

3. **RAG vs Agent**：RAG 是"检索增强生成"，属于被动的知识补充机制，模型在生成前先检索相关文档；Agent 是具备主动推理和工具调用能力的自主系统，可以多步规划、执行工具、观察结果后再决策。两者可结合：Agent 把 RAG 作为一个工具来调用。

4. **效果评估指标**：常用 Recall@K（召回率）、Precision@K（精确率）、NDCG（归一化折损累积增益）衡量检索质量；用 RAGAS 框架评估生成质量（faithfulness 忠实度、answer relevancy 相关性、context precision 上下文精确率）。

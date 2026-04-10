---
title: 钉钉暑期实习 Java 研发一面面经
company: 钉钉
position: Java 研发工程师
round: 一面
date: '2026-04'
source: 牛客网
tags: ["OCR","RAG","Embedding","Elasticsearch","JVM"]
summary: "钉钉暑期实习Java研发一面面经。面试深度考察OCR技术细节、RAG架构（ES+Milvus）、Embedding模型原理、大模型Prompt与Context Engineering，以及JVM内存管理等核心Java后端与AI工程化知识。"
---

### 《面试题目》

1. 自我介绍
2. 深度参与项目产出
3. OCR为何做文件识别，部署方案
4. 是否使用过传统的PDF/DOCX读取SDK
5. 文本内容为何还需要OCR
6. PDF图片、图表（饼状图、折线图）的语义提取与理解
7. OCR底层原理，给定饼图如何输出内容
8. 如何识别占比等语义信息
9. OCR识别与语义保留的评估指标
10. 评估方法与打分标准
11. 图表识别的评估依据
12. 为何选择768维Embedding
13. Embedding模型原理及构建方式
14. Embedding底层、Token定义及100w Token限制原因
15. 大模型参数量与显存消耗机制
16. Transformer词表构建方式
17. ES构建流程，关键词提取，BM25原理
18. Milvus语义召回与ES关键词召回的融合策略
19. 精排维度与原理
20. Rerank精排效果更好的原因
21. 策略涉及的问题（权重、维度、双向量检索、切分策略）
22. 针对上述问题的优化解法
23. 最核心的指标及其归纳
24. 解释Function Calling, MCP, Skill的概念、场景及解决的问题
25. 解释Prompt Engineering, Context Engineering, Harness Engineering
26. 抽象类和接口的区别
27. JVM内存回收算法（标记清除、标记整理）
28. 存活时间的定义

---

### 《参考解析》

- **OCR与图表提取**：OCR通过CNN/Transformer提取视觉特征，再配合序列解码。图表理解通常先进行目标检测（识别图表区域），再针对特定图元（如柱、饼）进行坐标映射与占比计算，评估多用IoU、WER（识别准确率）及语义对齐度。
- **RAG架构（ES+Milvus）**：ES处理结构化关键词查询（BM25），Milvus处理向量语义召回。融合通常通过加权融合或Rerank（重排序模型，如BGE-Rerank）对召回结果进行二次排序，以提升Top-K相关性。
- **Embedding与Token**：768维是BERT-Base的产物，平衡了性能与计算开销。Token是模型处理的最小单位（子词），受上下文窗口限制主要是因为Attention机制的计算复杂度是O(n²)。
- **Prompt/Context/Harness Engineering**：Prompt Engineering是单轮指令优化；Context Engineering侧重RAG流水线，解决幻觉；Harness Engineering指复杂Agent的工作流编排与逻辑控制。
- **JVM**：标记清除适合存活对象少的场景，标记整理（Mark-Compact）用于避免内存碎片，适合存活对象多的老年代。存活时间通过对象头部的GC分代年龄（Age）字段记录。
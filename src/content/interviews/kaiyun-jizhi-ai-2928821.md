---
title: "开云集致 AI应用开发一面：RAG 文档溯源、版本管理与 Excel 解析"
company: "开云集致"
position: "AI应用开发"
round: "一面"
date: '2026-10'
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/cbbb3f0d77b2459cbe01bc67bb27d1c7"
tags: ["开云集致", "AI应用开发", "RAG", "向量数据库", "文档解析", "Excel处理", "Embedding"]
summary: "开云集致 AI 应用开发一面面经，10 道题集中在 RAG 落地：chunk 出处追溯、文档多版本管理与旧向量删除、向量库字段设计、召回率提升，以及 Excel 合并单元格处理和逐行向量化的取舍。"
---

### 《面试题目》

1. 用户想要更精准的文档，比如你检索出来的 chunk，有没有返回原始文档，即标明每个 chunk 出处，保证用户的可信度，具体怎么做的？
2. 文档怎么做多版本管理的？
3. 文档更新时你怎么删除旧的向量？
4. 比如向量库中有 mysql 相关的文档，用户就问一个 mysql，怎么办？
5. 你们的向量数据库中有哪些字段？
6. 如何提高 RAG 的召回率 context Recall？
7. 你们对 Excel 的处理方式是什么？
8. 为什么不把 Excel 每一行都向量化？
9. 处理 Excel 时遇到合并单元格怎么办？
10. 你们的 embedding 模型是什么，llm 是什么，检索模型是什么？

### 《参考解析》

**chunk 出处追溯**：关键是让每条 chunk 自带可回查的元数据，而不是只存一段文本。写入时给 chunk 记上 doc_id、文档标题、版本号、页码或 sheet 名与行号范围、chunk_index、原文存储地址；检索命中后把这些字段一起返回，前端渲染成可点击的引用卡片，跳到原文对应位置。生成侧则给每个 chunk 编号，在 prompt 里限定模型只能引用给定编号，答案中标注 [1][2]，用户点开即可核对。原文被更新时靠版本号回查历史快照，保证引用不会指向已被改写的正文。

**多版本管理与旧向量删除**：文档按 doc_id + version 组织，原始文件按版本存对象存储，chunk 用确定性 id（doc_id + version + chunk_index 或内容哈希），写入用 upsert 而非纯 insert，重复解析不会产生脏数据。删除优先用向量库的按元数据过滤删除（如 delete where doc_id = x and version != current），pgvector、Milvus、Qdrant 都支持；更稳的做法是给 chunk 加 status 字段，新版本写入完成后再把旧版本置为 inactive，检索只查 active，避免删除与写入之间的空窗期导致检索不到内容。

**向量库字段设计**：一般分三类——向量本身（dense embedding，必要时加稀疏向量做混合检索）、原文与定位信息（content、doc_id、doc_title、source_url、version、page、chunk_index）、以及用于过滤和治理的标量字段（租户或部门等权限字段、文档类型、status、created_at）。标量字段要建索引，权限过滤必须在检索阶段做而不是召回后再筛，否则会漏召回或泄露无权限内容。

**提高 Context Recall**：召回率是"该找到的有没有进候选"，所以先扩候选再谈精排。常见手段是多路召回：dense 向量加 BM25 关键词检索，用 RRF 融合；查询侧做改写、同义扩展或多查询生成；切分上按标题层级切、加父子 chunk（小块检索、大块喂给模型）、保留重叠窗口；再叠一层 rerank 提升精度。此外要有带标注的评测集，按 recall@k 逐项对比改动，否则调参全靠感觉。

**Excel 处理与逐行向量化取舍**：解析用 openpyxl 或 pandas，保留 sheet 名、表头和单元格坐标；合并单元格按 merged_cells 范围把值填充到整个区域，或还原成层级表头，否则大量行会丢列名。转成文本时每行带上表头（"列名: 值"）再切块，或整表转 Markdown 后按表块切分。不逐行向量化的原因是：单行脱离表头几乎没有语义，行数会让向量数量和成本爆炸，且行级问题更适合走结构化查询（text-to-SQL）而不是语义检索；实践上按表或表块做向量、行数据留作结构化过滤与明细回查。

**模型选型怎么答**：这题问的是"你们的"，要能说出型号和理由。embedding 常见 bge-m3、bge-large-zh、text-embedding-3-large 一类，选型看中文效果、维度、最大输入长度和成本；LLM 按业务在 Qwen、DeepSeek、GLM 等之间选，看上下文长度、工具调用能力和单价；检索模型通常指 rerank 模型（如 bge-reranker 系列），用来对召回候选重排。回答时把"候选集多大、用什么指标评估、为什么最终选它"讲清楚，比只报型号更有说服力。

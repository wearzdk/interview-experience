---
title: 合肥某小厂Java后端面经
company: 合肥某小厂
position: Java后端开发
date: '2026-07'
base: 安徽合肥
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2871059
tags: ["Java","AI Agent","RAG","项目经验","自学"]
summary: "合肥某小厂Java后端面经，面试官围绕自学背景和AI Agent CLI项目深挖ReAct/Plan实现原理、AI辅助编程占比，并考察RAG基本流程等前沿知识点。"
---

### 《面试题目》

1. 自我介绍
2. 为什么想做这个 Java Agent CLI 的项目？
3. ReAct 和 Plan 模式分别是怎么实现的？
4. 除了 Claude Code 这类应用，有没有了解过其他 Agent 底层框架，比如 LangChain、LangGraph？OpenClaw 底层用的是什么？
5. 项目里有没有体现核心能力，比如 Bash、Read、Grep 这些工具能力？
6. 项目里 AI 参与写代码的占比大概是多少？
7. Java 自学了多久？
8. 简历里 AI 相关项目占比比较高，更偏业务开发，还是更偏 AI 方向？
9. 短链项目的设计初衷？
10. 本身对 Linux 是否比较感兴趣？
11. 简历里的博弈大赛和蓝桥杯主要是什么比赛内容？
12. 最近还做过什么项目？
13. 自己的优势是什么？
14. 平时用什么 AI 编程工具？
15. 了解过 RAG 吗？讲一下 RAG 的基本流程？
16. 这个网站有没有套 Cloudflare？

---

### 《参考解析》

1. **ReAct 模式的实现**：ReAct（Reasoning+Acting）让模型在每一步交替输出「思考（Thought）」和「行动（Action）」，行动触发外部工具调用后把「观察结果（Observation）」拼回上下文，再让模型继续推理，循环直到得出最终答案。实现上通常是一个循环：拼接 prompt → 调用 LLM → 解析出工具调用指令 → 执行工具 → 把结果追加进对话历史 → 再次调用 LLM，直到模型输出终止标志。
2. **Plan 模式的实现**：Plan-and-Execute 先让模型一次性生成完整的任务分解（多步计划），再逐步执行每个子任务，执行中可根据中间结果对后续计划做局部调整（Re-plan），相比 ReAct 逐步试探，Plan 模式减少了每步都要重新推理全局的开销，更适合目标明确、步骤可预判的复杂任务。
3. **RAG 基本流程**：包括离线的知识库构建（文档切分 chunk → embedding 向量化 → 存入向量数据库）和在线的检索增强生成（用户问题 embedding 化 → 向量相似度检索出 Top-K 相关片段 → 拼接进 prompt 上下文 → 交给 LLM 生成回答），核心目的是让模型回答基于外部真实知识而非纯参数记忆，降低幻觉。
4. **Agent CLI 中的工具能力设计**：一般会抽象出 Bash（执行命令）、Read/Write（文件读写）、Grep/Glob（代码检索）等原子工具，配合统一的工具描述（tool schema）暴露给模型，模型根据任务自主选择调用哪个工具、传什么参数，工具执行结果再反馈给模型驱动下一步决策，这是 Agent 具备「自主操作环境」能力的核心机制。

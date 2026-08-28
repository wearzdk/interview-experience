---
title: "Java后端一面面经"
company: "某公司"
position: "Java后端开发工程师"
date: '2026-08'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2885001
tags: ["Java","Spring","AI应用","RAG","面试经验","后端开发"]
summary: "某公司Java后端开发工程师面试记录，覆盖Java、Spring、AI应用、RAG等考点，整理了面试流程与高频问题。"
---

### 《面试题目》

1. 公司：某小厂
2. 一面聊了挺久，主要围绕 AI 应用开发展开，感觉比较偏 Agent 实战方向，传统 Java 八股问得不算特别多
3. 什么是 AI Agent？和普通 ChatBot 有什么区别？
4. Java 如何实现 streaming response？
5. 什么是 RAG（Retrieval Augmented Generation）？
6. LangChain4j 如何实现 Tool 调用？
7. AI 系统如何做监控？
8. 什么是 hallucination（幻觉）？为什么会发生？
9. 多 Agent 协作系统应该如何设计？
10. embedding 和向量相似度搜索是什么？
11. 如何实现 SSE 推送？
12. Agent memory 有哪些类型？
13. RAG pipeline 的完整流程是什么？
14. Java 调用 OpenAI API 如何设计 SDK？
15. 什么是 Prompt Engineering？
16. RAG 如何做 rerank？
17. LLM 服务如何做缓存？
18. 什么是 Tool Calling？

### 《参考解析》

1. Agent或RAG链路应记录工具调用、检索证据和失败原因；对非法参数、路由错误和超时设置校验、重试上限与可观测日志，避免把模型输出直接当作可信结果。

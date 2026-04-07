---
title: 4.3 飞猪 Java后端二面面经
company: 飞猪
position: Java后端
round: 二面
date: '2026-04'
source: 牛客网
tags: ["Java","RAG","AQS","Spring","并发编程"]
summary: "飞猪Java后端二面，侧重考察AI应用开发经验与Java底层原理。重点交流RAG架构选型、Agent多智能体架构，以及并发包组件、AQS锁机制、Spring MVC请求映射原理等技术栈。"
---

### 面试题目

1. **项目经历**：技术栈介绍，包括两个AI项目、实验室项目及简历实习内容。
2. **RAG系统评估**：选型评估指标；正向与反向评估方案；黄金数据集与人工打标方法。
3. **错误处理**：发现error case的优化逻辑；生成侧与检索侧的差异处理；权重调整对召回的影响与控制。
4. **RAG进阶**：RAG常见问题及解决方案（Query改写、ES辅助）；RAG以外的实现方式（记忆压缩、知识图谱多跳推理）。
5. **开发框架**：除LangChain外，是否了解Google ADK、LangGraph、MCP、Skill使用场景。
6. **Java并发**：ConcurrentHashMap、AQS原理、线程池运行机制及拒绝策略。
7. **锁机制**：ReentrantLock（公平/非公平/可重入）实现原理；synchronized实现机制。
8. **Spring原理**：前端请求到Controller的过程；Spring对Controller的管理、映射与注解机制。
9. **其他**：多智能体架构重构（OpenClaw）、海外模型使用、AI Coding辅助工具（GitHub Copilot）。

---

### 参考解析

1. **RAG评估与优化**：核心在于指标（如Faithfulness, Answer Relevance）。权重调整需关注Embedding空间的变化，通过引入控制变量或微调检索器（Retriever）的阈值来规避干扰，使用ES等向量数据库结合传统关键词检索可以降低噪声。
2. **AQS原理**：AQS通过volatile int state变量表示状态，利用CAS操作和CLH双向队列管理线程等待。可重入性是通过持有锁的线程在再次获取时增加state计数，释放时递减实现的。
3. **线程池拒绝策略**：常用的有AbortPolicy（抛异常）、DiscardPolicy（丢弃）、DiscardOldestPolicy（丢弃最旧）、CallerRunsPolicy（调用者线程执行），需根据业务容错需求选择。
4. **Spring MVC映射**：请求由DispatcherServlet分发，HandlerMapping负责查找匹配的Controller方法，HandlerAdapter负责执行适配，关键在于Spring在容器启动时通过`@RequestMapping`解析器将URL与Bean Method进行缓存映射。
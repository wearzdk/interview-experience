---
title: 南京亚信安全Java岗位面试经历
company: 亚信安全
position: Java开发工程师
date: '2026-04'
result: 挂
base: 南京
source: 牛客网
tags: ["Java","SpringBoot","AI辅助编程","软件工程"]
summary: "南京亚信安全Java面试复盘：面试重点考察AI辅助编程工具在项目开发中的应用实践，同时涉及SpringBoot架构分层及HTTP请求处理流程。本文整理了面试原题及关键知识点解析，助你掌握面试官对AI工具链的考核标准。"
---

### 面试题目
1. 自我介绍
2. 你平时怎么使用AI辅助编程吗？
3. 如果你要实现一个完整的项目，你会怎么使用AI？
4. 你在agent.md里面怎么规范你的代码？
5. 假如有一个新需求，你怎么使用AI和以前的代码结合？
6. 平时使用的技术栈？
7. SpringBoot分几层？
8. Request的请求流程？

---

### 参考解析

**1. AI辅助编程相关问题**：核心在于展示工作流。建议从需求拆解（Prompt编写）、辅助编码（Copilot/Cursor生成）、代码审查（Review）、单元测试生成以及文档维护（README/设计文档）五个维度回答，强调AI作为副驾驶的作用，而非简单复制粘贴。

**2. agent.md代码规范**：通常指在项目工程化中，通过配置文件（如agent.md或.cursorrules）定义代码风格、命名规范、技术选型说明，以便AI理解项目上下文，减少幻觉并确保生成代码与现有架构一致。

**3. 新需求与旧代码结合**：强调“上下文管理”。先通过RAG（检索增强生成）让AI阅读旧代码核心模块，再利用代码插桩（Stub）或重构（Refactoring）进行需求迭代，重点在于维护代码的单一职责与可测试性。

**4. SpringBoot分层**：一般遵循经典MVC或三层架构：Controller层（控制层，处理HTTP请求）、Service层（业务逻辑层，处理核心业务）、DAO/Repository层（持久层，与数据库交互）。有时会加入DTO/VO层进行数据传输处理。

**5. Request请求流程**：请求到达服务器后，由Servlet容器（如Tomcat）接收，通过DispatcherServlet（核心控制器）分发，经过拦截器（Interceptor）预处理，寻找对应的HandlerMapping映射到Controller方法，执行业务后由视图解析器或JSON序列化组件返回响应。
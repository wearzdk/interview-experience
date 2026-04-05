---
title: 浙大网新中研 Java后端实习面经（28届双非）
company: 浙大网新中研
position: Java后端实习
round: 笔试+技术面
date: '2026-03'
source: 牛客网
tags: ["Java","MySQL","Redis","Spring Boot","Swagger","AI工具"]
summary: "浙大网新中研Java后端实习面经，28届双非学生投递。面试含笔试卷（Java基础、异常处理、集合、多线程）和技术问答，涉及MySQL字段操作、Redis数据结构、Knife4j/Swagger接口文档、全局异常处理器等，面试官重点关注AI工具使用经验（RAG、MCP、ClaudeCode），八股文考察较少，SQL能力需加强。"
---

## 面试题目

### 笔试环节

- Java 异常处理机制（简答题）
- 简述集合（简答题）
- 多线程实现方式（简答题）
- 写一个 HTML 表格（编程题）
- 签到算法题两道

### 项目相关

- 介绍项目，前端部分是怎么做的？
- 怎么和前端进行协作交流的？
- API 文档是怎么写的？
- 返回错误怎么处理和区分的？

### MySQL

- 如何向已有表中插入一个新字段？
- 删除表的 SQL 命令是什么？

### Redis

- 介绍一下 Redis（基础数据结构）

### AI 工具

- 平时用 AI 做什么？在项目中如何应用？

### 反问环节

- 公司项目技术栈是什么？
- 面试官对我的评价和建议？

---

## 参考解析

### Java 异常处理机制

Java 异常分为 `Checked Exception`（编译期异常，需显式处理）和 `Unchecked Exception`（运行时异常，继承 `RuntimeException`）。核心关键字：`try / catch / finally / throw / throws`。`finally` 块无论是否发生异常都会执行，常用于资源释放。推荐使用 try-with-resources 自动关闭资源。

### 集合简述

Java 集合框架分两大体系：`Collection`（单列集合）和 `Map`（键值对）。常用：`ArrayList`（动态数组，查询快）、`LinkedList`（链表，增删快）、`HashMap`（哈希表，JDK8 后链表长度>8 转红黑树）、`HashSet`（基于 HashMap）、`ConcurrentHashMap`（线程安全）。面试重点区分 ArrayList 与 LinkedList、HashMap 与 LinkedHashMap。

### 多线程实现方式

四种方式：① 继承 `Thread` 类；② 实现 `Runnable` 接口；③ 实现 `Callable` 接口（可获取返回值，配合 `FutureTask`）；④ 使用线程池（`Executors` 或 `ThreadPoolExecutor`，推荐后者，可控核心参数）。实际开发中推荐线程池方式，避免频繁创建销毁线程。

### 全局异常处理器

使用 `@RestControllerAdvice` + `@ExceptionHandler` 实现全局异常捕获，统一返回结构体（如 `Result<T>`）。建议按异常类型分层处理：自定义业务异常（`BusinessException`）返回业务错误码，`MethodArgumentNotValidException` 处理参数校验错误，兜底捕获 `Exception` 防止堆栈泄露。

### MySQL 向表中添加字段

```sql
ALTER TABLE 表名 ADD COLUMN 字段名 数据类型 [约束] [AFTER 某字段];
-- 示例：
ALTER TABLE user ADD COLUMN age INT DEFAULT 0 AFTER name;
```

### MySQL 删除表

```sql
DROP TABLE 表名;          -- 删除表结构和数据
DROP TABLE IF EXISTS 表名; -- 推荐，避免报错
TRUNCATE TABLE 表名;       -- 清空数据，保留结构
```
注意区分 `DROP`、`TRUNCATE`、`DELETE` 的区别，面试高频考点。

### Redis 基础数据结构

五种核心类型：`String`（缓存、计数）、`List`（消息队列、最新列表）、`Hash`（对象存储）、`Set`（去重、共同好友）、`ZSet`（排行榜，带分数排序）。扩展类型：`Bitmap`、`HyperLogLog`、`Stream`。答题时结合使用场景说明更佳。

### AI 工具在项目中的应用

可提及：使用 ClaudeCode / Copilot 生成重复性代码（CRUD、DTO转换）；RAG（检索增强生成）结合知识库实现智能问答；MCP（Model Context Protocol）实现模型与工具/服务的标准化对接；用 AI 辅助生成接口文档初稿、编写单元测试等。展示工程化落地能力是亮点。
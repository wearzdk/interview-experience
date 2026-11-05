---
title: 上海银行金融科技应用开发面：项目拷问与 bad case
company: 上海银行
position: 金融科技（应用开发）
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/05743863a75a41bb9f11bc35cfb82f55
tags: ["Java","数据库","Shell","项目经历","bad case"]
summary: "上海银行金融科技应用开发岗面试约三十分钟：自我介绍后拷问项目背景与 AI 辅助的边界，再问 Java 连接数据库的过程、Shell 命令，以及一个印象深刻的 bad case。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 项目拷问：是否用 AI 辅助？除了 AI 部分，你们还负责了什么？项目背景是什么？
3. Java 连接数据库的过程是怎样的？
4. 常用的 Shell 命令有哪些？
5. 介绍一个你印象深刻的 bad case。

### 《参考解析》

**项目中的 AI 边界**：面试官真正想确认的是你是否理解项目。回答时把工作拆成「AI 生成的部分」与「人负责的部分」：需求拆解、方案选型、数据模型设计、边界条件与验收标准由人确定；样板代码与重复逻辑可以交给 AI 生成，但要经过审查与测试。再说明你如何验证 AI 产出——读代码、补测试、在预发环境跑通关键路径。不要笼统说「AI 只是辅助」，要给具体分工。

**Java 连接数据库的过程**：加载并注册驱动（JDBC 4 之后由 SPI 自动完成），通过 DriverManager 或连接池获取 Connection，创建 PreparedStatement 并设置参数，执行 SQL 得到 ResultSet，遍历结果映射为对象，最后按 try-with-resources 关闭 ResultSet、Statement、Connection。生产环境不会每次新建连接，而是用 HikariCP 之类的连接池，并配置最大连接数、超时与泄漏检测；还要说明事务边界由 Connection 控制，autocommit 关闭后需显式提交或回滚。PreparedStatement 使用预编译能防 SQL 注入并提升重复执行效率。

**常用 Shell 命令**：按用途归类回答更清晰。文件与目录用 ls、cd、cp、mv、rm、find；内容查看用 cat、less、head、tail -f；文本处理用 grep、awk、sed、sort、uniq、wc；进程与端口用 ps、top、kill、lsof、ss；网络用 curl、ping、dig；权限用 chmod、chown；打包用 tar。再说一个实际组合，例如用 grep 过滤日志后 awk 统计接口耗时分布，证明不是只背命令名。

**印象深刻的 bad case**：讲清四件事——现象（什么指标或报错）、影响面、定位过程（从日志、监控到最小复现）、修复与预防。好的案例通常包含一个认知转折，例如原以为是数据库慢，最后发现是连接池耗尽导致排队；或者一次边界输入触发了空指针。结尾要落到机制改进：补充监控、加校验、补测试或调整超时与重试策略，避免同类问题再发生。

---
title: 浙江图讯科技Java开发实习生一面凉经
company: 浙江图讯科技
position: Java开发实习生
round: 一面
date: '2026-07'
result: 凉经
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/901986023297642496
tags: ["Java","SQL注入","Linux","AI工具"]
summary: "浙江图讯科技Java开发实习生一面面经，考察Java基础类型、==与equals区别、面向对象三大特征、集合框架、连表查询、SQL注入原理及AI编程工具使用情况，整体问题偏基础但候选人最终未通过。"
---

### 《面试题目》

1. 自我介绍，项目介绍
2. Java 基础类型，`==` 和 `equals` 的区别
3. 对象的三大特征（封装、继承、多态）
4. 集合框架有哪些
5. 连表查询有哪些方式
6. SQL 注入是什么
7. 简历上写了 Linux，问了解哪些命令
8. AI 工具用什么，为什么不用 Cursor 和 Codex

---

### 《参考解析》

1. **`==` 和 `equals` 的区别**：`==` 对基本类型比较值，对引用类型比较内存地址是否相同；`equals` 默认（Object 类）也是比较地址，但 String、包装类等重写后比较的是内容/值是否相等。
2. **连表查询方式**：内连接（INNER JOIN，只返回两表匹配的记录）、左外连接（LEFT JOIN，以左表为主，右表无匹配则为 NULL）、右外连接（RIGHT JOIN，反之）、全外连接（部分数据库支持，MySQL 需用 UNION 模拟）。
3. **SQL 注入原理与防护**：攻击者通过在输入参数中拼接恶意 SQL 片段篡改查询逻辑；防护核心是使用 PreparedStatement 预编译参数化查询，避免手动字符串拼接 SQL，此外还应对输入做校验、最小化数据库账号权限。

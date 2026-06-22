---
title: 携程暑期二面 3月底
company: 京东
position: 软件开发工程师
round: 二面
date: '2026-06'
base: 江苏
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2865894
tags: ["Java", "MySQL"]
summary: "京东软件开发工程师二面面经，考察Java、MySQL等核心知识点。包含真实面试题目与解析，适合准备软件开发工程师面试的求职者参考备考。"
---

### 《面试题目》


**问项目 问的很细**
1. 使用的 Java 版本，jdk 最新版本是？新特性有了解吗？
2. MySQL 最左匹配原则
3. （age, name) 联合索引，where age > 18 and name=xxx 走索引吗

**问场景题**
4. 订单票务系统如何设计

---

### 《参考解析》

1. **MySQL深度**：MySQL InnoDB使用B+树索引，支持ACID事务。关键知识点：聚簇索引（主键索引）叶节点存完整行数据；辅助索引叶节点存主键值（需回表）；MVCC通过undo log版本链+ReadView实现多版本并发控制，解决脏读/不可重复读；事务隔离级别从低到高：读未提交→读已提交→可重复读（默认）→串行化。

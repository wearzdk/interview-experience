---
title: "秋招小厂 Java 一面：集合、索引与库存超卖"
company: "某小厂"
position: "Java 后端"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/be233ce770b145fda26ace40283540dd
tags: ["Java","集合","MySQL","索引","Redis","Nacos"]
summary: "秋招小厂 Java 一面：Java 集合与 try/finally、equals 与 ==、MySQL 索引失效、Redis 用途、Nacos 端口与配置中心、库存防超卖，手撕两数之和。"
---

### 《面试题目》

1. 你用过哪些 Java 集合？
2. try/finally 有什么用？return 之后还会执行吗？
3. 讲一下重载和重写。
4. `a.equals(常量)` 和 `常量.equals(a)` 哪个更好，为什么？
5. `==` 和 `equals` 的区别？
6. 讲一下索引。
7. MySQL 默认的端口号是多少？
8. 索引失效有哪些情况？
9. update 和 delete 时要注意什么？
10. Redis 通常用来干什么？
11. 实习主要做了什么？做了哪些模块、流程是什么？
12. 需要哪些表？表是怎么设计的？
13. Nacos 的默认端口号是多少？
14. 怎么防止库存超卖？
15. 你的 Nacos 是用来做什么的？
16. 算法题：两数之和。

### 《参考解析》

**try/finally 与 return**：finally 一定会执行（除非 JVM 退出或线程被杀）。如果 try 里有 return，先把返回值算好暂存，再执行 finally，最后返回；如果 finally 里也 return，会覆盖 try 的返回值——这是要避免的写法。更常见的追问是「finally 里改基本类型返回值不生效、改对象内部状态生效」，原因是返回值已经按值保存。

**equals 与 ==**：`==` 比较基本类型的值或引用地址；`equals` 默认也是地址比较，String、Integer 等重写后比较内容。`常量.equals(a)` 更好，因为常量不为 null，a 为 null 时返回 false 而不是抛 NPE；这也是阿里规约里明确写的。

**索引失效**：联合索引不满足最左前缀；在索引列上做函数、运算或隐式类型转换（字符串列传数字）；以 `%` 开头的 LIKE；OR 连接的条件有一侧没索引；使用 `!=`、`NOT IN` 有时会全表扫；数据区分度太低（如性别）优化器会放弃索引；统计信息过期。回答时补一句「用 EXPLAIN 看 type、key、rows、Extra」。

**库存防超卖**：数据库层用「条件更新」：`UPDATE stock SET count = count - 1 WHERE id = ? AND count >= 1`，判断影响行数；或用乐观锁版本号；Redis 层用 Lua 脚本原子扣减，再异步落库，配合预扣和回补；消息队列串行化同一商品的扣减；超卖后的兜底是对账与补偿。要注意「先查再改」在并发下必然超卖。

**Nacos**：默认端口 8848（gRPC 端口 9848/9849），既是注册中心也是配置中心；项目里用它做服务注册发现、配置动态刷新、命名空间隔离环境。

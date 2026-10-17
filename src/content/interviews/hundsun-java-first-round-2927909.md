---
title: "恒生电子 Java 岗一面（10.10）"
company: "恒生电子"
position: "Java 开发"
round: "一面"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/46a7de10dcd14acea4532045deac4204"
tags: ["恒生电子", "Java", "MySQL", "HashMap", "String", "金融"]
summary: "恒生电子财富管理 Java 一面较短，问数据库、MySQL 隔离级别、HashMap、String 系列、金融数据 BigDecimal 和公司了解。"
---

### 《面试题目》

1. 自我介绍。
2. 介绍项目。
3. 使用什么数据库？
4. MySQL 默认隔离级别是什么？
5. HashMap 的底层数据结构是什么？
6. JDK 8 以后 HashMap 是线程安全的吗？
7. String、StringBuffer、StringBuilder 有什么区别？
8. 金融数据在 Java 中用什么对象表示？
9. 对恒生了解多少？
10. 通过什么途径知道恒生？

### 《参考解析》

MySQL 默认是 RR，InnoDB 通过 MVCC 提供一致性快照，并用 Next-Key Lock 处理当前读的幻读问题。HashMap 是数组 + 链表 + 红黑树，非线程安全；多线程并发写可能导致数据覆盖或结构异常，应该用 ConcurrentHashMap。

String 不可变，StringBuffer 方法加锁、线程安全，StringBuilder 不加锁、单线程更快。金融金额不能用 double，应该用 BigDecimal，并且明确精度、舍入模式和数据库 decimal 字段，避免二进制浮点误差。

公司了解要准备具体业务：恒生做金融软件，财富管理、证券、基金等系统对稳定性和合规要求高。可以结合自己的项目说明为什么匹配，而不是只背公司成立年份。

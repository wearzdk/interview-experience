---
title: 成都智算数联科技Java开发笔试+面试面经
company: 成都智算数联科技有限公司
position: Java开发工程师
date: '2026-06'
base: 四川
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2869271
tags: ["MyBatis","MySQL","Redis","微服务","JVM","Spring Boot"]
summary: "成都智算数联科技Java开发岗笔试+面试面经，笔试覆盖MyBatis批量插入与自增ID获取、MySQL/Oracle分页、Linux命令；面试拷打JVM、MySQL优化、HashMap底层原理及JDK17优化、Spring Boot 3选用JDK17的原因。"
---

### 《面试题目》

**笔试题**

1. MyBatis 怎么实现批量插入？
2. MyBatis 插入数据的时候怎么知道自增 ID？
3. MySQL 和 Oracle 的分页关键字是什么？
4. 删除一张表的全部数据的 SQL，两种方式？
5. String、StringBuffer、StringBuilder 区别，项目中什么时候使用？
6. Java 集合有什么，区别是什么？
7. JDK 1.8 新特性？
8. Linux 系统复制文件到其他目录的命令？
9. Linux 系统常用的命令？
10. 查看当前路径的命令？
11. 接口文档基本内容？
12. Redis 怎么设置键的生存时间和过期时间？
13. Redis 分布式锁实现？
14. 微服务五个核心组件？
15. 创建线程几种方式？
16. Spring Boot 怎么读配置文件？

**面试**

1. 自我介绍。
2. 介绍一下 JVM。
3. 介绍一下 MySQL 优化。
4. HashMap 底层原理，JDK 17 后做了哪些优化？
5. Spring Boot 3 为什么要用 JDK 17，而不是 JDK 8？
6. 谈谈你对数智化的理解。
7. 你常用的 AI 工具有哪些？在项目中如何用 AI 工具？
8. 薪资期望？

---

### 《参考解析》

**1. MyBatis 批量插入与自增 ID 获取**

批量插入用 `<foreach>` 标签拼接多组 values 一次性执行 INSERT，比循环单条插入性能高得多。获取自增 ID：在 `<insert>` 标签上配置 `useGeneratedKeys="true" keyProperty="id"`，MyBatis 执行后会把数据库生成的自增主键自动回填到对应实体的属性中，无需额外查询。

**2. MySQL 与 Oracle 分页**

MySQL 用 `LIMIT offset, size`；Oracle 传统写法用 `ROWNUM` 配合子查询（Oracle 12c 之后也支持 `OFFSET ... FETCH NEXT ... ROWS ONLY` 标准语法）。

**3. 清空表的两种方式**

`DELETE FROM table`：逐行删除，可加 WHERE 条件，记录日志可回滚，不重置自增 ID，触发触发器；`TRUNCATE TABLE table`：直接释放数据页，速度快，重置自增 ID，不可回滚（DDL 操作），不触发触发器。

**4. HashMap 底层原理与 JDK 17 优化**

JDK 8 起 HashMap 底层是数组+链表+红黑树：链表长度 ≥ 8 且数组容量 ≥ 64 时树化为红黑树，降低哈希冲突下的查询复杂度从 O(n) 到 O(log n)。JDK 17（实际从 JDK 9 起持续优化）针对 HashMap 的优化包括：扩容时链表拆分算法优化（利用 `hash & oldCap` 直接判断节点在新表中的位置，无需重新计算 hash）、内部字段和方法的微调以配合 JIT 优化。需要注意「JDK 17 对 HashMap 做了哪些优化」更多是面试官泛泛一问，候选人可重点讲清 JDK7→JDK8 的链表转红黑树这一核心变化。

**5. Spring Boot 3 要求 JDK 17 的原因**

Spring Boot 3 全面拥抱 Jakarta EE 9+（`javax.*` 包名全部迁移到 `jakarta.*`），并且大量使用了 JDK 17 引入的新特性（如密封类 sealed classes、增强的 switch 表达式、性能更优的 G1/ZGC 垃圾回收器），同时 JDK 8 已停止主流支持，Spring 借此推动生态升级，JDK 17 是当时最新的 LTS 版本，兼具长期支持与性能提升（如更快的启动时间、更低的内存占用）。

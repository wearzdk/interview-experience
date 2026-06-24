---
title: 广州精抖云全栈开发面试
company: 精抖云
position: 全栈开发工程师
date: '2026-06'
base: 广州
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2867558
tags: ["Java","MySQL","全栈开发","集合框架","多线程"]
summary: "广州精抖云全栈开发面试面经，要求前后端全部独立开发且禁止使用AI工具。考察Java集合体系（HashMap、ArrayList、HashTable）、String相关类区别、接口与抽象类、线程创建方式、MySQL基础操作与慢查询优化。"
---

### 《面试题目》

1. 薪资能接受吗？
2. 集合接口有哪些？
3. 接口能继承接口吗？
4. HashMap 的实现原理和核心思想？
5. HashMap 和 HashTable 的区别？
6. String 和 StringBuffer 的区别？
7. Array 和 ArrayList 的区别？
8. 接口和抽象类的区别？
9. 创建线程的方式有哪些？
10. Java 的基本数据类型有哪些？
11. Java 能多继承吗？
12. 前端能独立开发吗？
13. MySQL 怎么查前 50 行数据？
14. 慢查询如何优化？
15. varchar 和 char 的区别？

---

### 《参考解析》

1. **HashMap 实现原理**：底层是 数组 + 链表 + 红黑树（JDK 1.8+）。`put` 时先算 `hash(key)`，取模定位到桶（数组下标），冲突用链表处理；链表长度 ≥ 8 且数组容量 ≥ 64 时转为红黑树。默认初始容量 16，负载因子 0.75，扩容时容量翻倍并重新 rehash。

2. **HashMap vs HashTable**：HashMap 线程不安全（非 synchronized），允许一个 null key 多个 null value，性能更好；HashTable 线程安全（所有方法加 synchronized），不允许 null key/value，是遗留类（不推荐使用，并发场景用 ConcurrentHashMap）。

3. **接口 vs 抽象类**：接口是行为规范（全抽象，JDK 8 支持 default 方法），一个类可实现多个接口；抽象类可含具体实现，但只能单继承。选择：is-a 关系用抽象类（继承体系），can-do 关系用接口（能力描述）。

4. **String vs StringBuffer vs StringBuilder**：String 不可变（final char[]），每次操作产生新对象；StringBuffer 可变、线程安全（synchronized）；StringBuilder 可变、非线程安全但性能最好。单线程拼接用 StringBuilder，多线程用 StringBuffer，常量字面量用 String。

5. **慢查询优化**：①用 EXPLAIN 查执行计划，看 type（ALL 为全表扫描，需优化）；②检查是否命中索引（key 字段）；③避免对索引列做函数操作或隐式类型转换；④大分页 `LIMIT offset, size` 改为游标分页（WHERE id > last_id LIMIT size）；⑤考虑加覆盖索引减少回表。

6. **varchar vs char**：char 固定长度，存储时不足位数用空格补齐，检索效率略高但浪费空间；varchar 可变长度，仅用实际字节+1-2字节长度标识，节省空间。短固定值（如国家代码、性别）用 char，可变长度字段（如姓名、简介）用 varchar。

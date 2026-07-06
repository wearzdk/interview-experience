---
title: 中电科金仓Java校招一面面经
company: 中电科金仓
position: Java开发工程师
round: 一面
date: '2026-06'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/900530830483734528
tags: ["Java","MyBatis","SQL注入","框架"]
summary: "中电科金仓Java校招一面面经，面试问题偏重框架层面，重点考察MyBatis使用与SQL注入相关问题，与其他公司常问的基础八股风格不同。"
---

### 《面试题目》

1. 自我介绍
2. MyBatis 相关问题
3. SQL 注入相关问题

---

### 《参考解析》

1. **MyBatis 常见考点**：`#{}` 与 `${}` 的区别（前者预编译防注入，后者字符串拼接存在注入风险）、一级/二级缓存的作用域与失效场景、动态 SQL 标签（`<if>`、`<foreach>`、`<where>`）的使用场景，以及 MyBatis 如何通过动态代理为 Mapper 接口生成实现类。
2. **SQL 注入与 MyBatis 的关联**：MyBatis 中使用 `${}` 直接拼接 SQL 字符串会带来注入风险，而 `#{}` 会被解析为 JDBC 的 `PreparedStatement` 占位符参数，由数据库驱动做参数转义，从根本上杜绝了注入问题，因此涉及排序字段、表名等无法用 `#{}` 的场景需要额外做白名单校验。

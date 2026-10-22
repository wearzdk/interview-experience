---
title: "豪迈软件工程师一面：项目为主，八股只问了 SQL 优化"
company: "豪迈"
position: "软件工程师"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/e96baf16c45740fba83b7c567225a225
tags: ["豪迈", "软件工程师", "一面", "SQL优化", "SpringBoot"]
summary: "豪迈软件工程师一面（约 20 分钟）：会议显示三人实际只有一位面试官，没怎么问八股，主要问项目和实习，顺着项目问了 SQL 优化、Spring Boot 框架，最后问家庭情况、offer 情况和对公司的了解。"
---

### 《面试题目》

1. 自我介绍。
2. 讲一下你的项目和实习经历。
3. 顺着项目问 SQL 优化怎么做。
4. Spring Boot 框架相关。
5. 家庭情况。
6. 目前有没有别的 offer？
7. 你对我们公司了解多少？

### 《参考解析》

**SQL 优化先看执行计划再看索引**：用 EXPLAIN 看 type、key、rows、Extra，确认有没有走索引、有没有回表、有没有 filesort 和临时表。常见手段是加合适索引（联合索引注意最左前缀）、避免在索引列上用函数、减少 select *、分页深翻用游标、拆分大查询。

**Spring Boot 的问题一般围绕自动配置、起步依赖、Bean 生命周期和事务**。自动配置靠 `@EnableAutoConfiguration` + `spring.factories`/`AutoConfiguration.imports` 按条件装配；Bean 生命周期是实例化 → 属性填充 → 初始化 → 使用 → 销毁；事务注意自调用失效和传播行为。

**「对公司的了解」要提前做功课**。豪迈做轮胎模具和高端装备，回答时提到它的主营业务、行业地位和你能匹配的技术方向，比说「贵公司很好」有效得多。

**家庭情况和 offer 情况是在判断稳定性**，如实回答，表达清楚求职偏好即可。

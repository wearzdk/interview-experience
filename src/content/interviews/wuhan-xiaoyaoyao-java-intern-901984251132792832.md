---
title: 武汉小药药Java实习一面二面面经
company: 小药药
position: Java实习生
round: 一面/二面
date: '2026-07'
base: 武汉
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/901984251132792832
tags: ["Java","MyBatis","Redis","MySQL","Spring"]
summary: "武汉小药药Java实习一面、二面面经，一面考察Java8特性、线程池核心参数、MySQL最左匹配原则、Redis分布式锁、MyBatis动态标签及底层实现、Spring事务失效场景；二面聚焦项目介绍与设计模式。"
---

### 《面试题目》

**一面**
1. Java8 特性在你项目中的运用
2. Java 提供的默认线程池有哪些
3. 线程池的核心参数
4. MySQL 最左匹配原则：`where b=1 and a=1 and c=1` 会不会走最左匹配
5. `explain` 关键字，关注哪几个字段
6. Redis 的几种常见数据结构，Redis 分布式锁使用及缺点（锁超时和续期）
7. MyBatis 动态标签说几个
8. MyBatis 底层是怎么实现的
9. Spring 事务失效场景说几个
10. SpEL 表达式了解吗
11. 怎么找到软件在电脑里的运行日志
12. AI 工具用过吗，怎么用的
13. 项目里的 Canal 是什么，你怎么理解的

**二面**
1. 项目介绍，难点以及思路
2. 设计模式知道哪些

---

### 《参考解析》

1. **MySQL 最左匹配原则**：联合索引遵循最左前缀匹配，查询条件中只要包含索引最左列就能走索引，且 MySQL 优化器会自动调整 `and` 条件的顺序（`where b=1 and a=1 and c=1` 若索引是 `(a,b,c)`，仍可以走索引，因为条件里已包含最左列 a）。
2. **Redis 分布式锁的缺点**：单机部署有单点故障风险；主从异步复制场景下，主库宕机可能导致锁丢失（可用 Redlock 算法缓解）；锁超时时间不好设置，业务执行时间不确定容易导致锁提前释放，需配合看门狗机制自动续期。
3. **Spring 事务失效常见场景**：同类内部方法调用（自调用绕过了代理对象）、方法非 public、异常被 catch 未重新抛出、数据库引擎不支持事务（如 MyISAM）、事务方法内手动 try-catch 吞掉了异常导致 AOP 无法感知回滚。
4. **Canal 的作用**：Canal 是阿里开源的基于 MySQL binlog 增量订阅&消费组件，模拟 MySQL slave 的交互协议伪装成从库拉取 binlog，常用于缓存与数据库的一致性同步、数据异构、审计等场景。

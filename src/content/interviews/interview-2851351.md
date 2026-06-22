---
title: 软通动力JAVA面（已挂）
company: 某互联网公司
position: 软件开发实习生
date: '2026-05'
result: 凉经
base: 江苏
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2851351
tags: ["Java", "MySQL", "Spring", "操作系统"]
summary: "某互联网公司软件开发实习生面经，考察Java、MySQL、Spring等核心知识点。包含真实面试题目与解析，适合准备软件开发实习生面试的求职者参考备考。"
---

### 《面试题目》

1. 自我介绍
2. 实习中sql报错处理了哪些
3. 实习中解决的数据加载问题
4. springboot和spring的区别
5. 自动装配的原理
6. mybatis中的selectOne和selectList底层实现有什么区别，写项目中大部分用的哪个
7. A表1000条数据，B表500条数据，能匹配上的只有300条，A inner join B会查出多少条,A LeftJoin B，A RightJoin B
8. 对线程的理解，线程安全的理解，如何保证线程安全（上锁），除了上锁还有
9. error和exception的区别

---

### 《参考解析》

1. **MySQL深度**：MySQL InnoDB使用B+树索引，支持ACID事务。关键知识点：聚簇索引（主键索引）叶节点存完整行数据；辅助索引叶节点存主键值（需回表）；MVCC通过undo log版本链+ReadView实现多版本并发控制，解决脏读/不可重复读；事务隔离级别从低到高：读未提交→读已提交→可重复读（默认）→串行化。

2. **Spring框架**：Spring IoC容器管理Bean生命周期，核心是依赖注入（DI）。AOP面向切面编程通过动态代理（JDK/CGLIB）实现横切关注点（日志/事务/权限）。Spring事务传播行为：REQUIRED（加入现有或新建）、REQUIRES_NEW（挂起当前，新建）、NESTED（嵌套事务）等。

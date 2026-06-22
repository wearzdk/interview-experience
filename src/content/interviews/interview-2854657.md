---
title: java面经，校招，同益实业股份，400+人规模，八股高度一致(同学反馈)
company: 某互联网公司
position: 软件开发工程师
date: '2026-05'
result: OC
base: 广东
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2854657
tags: ["Java", "MySQL", "Spring", "操作系统", "Linux", "算法"]
summary: "某互联网公司软件开发工程师面经，考察Java、MySQL、Spring等核心知识点。包含真实面试题目与解析，适合准备软件开发工程师面试的求职者参考备考。"
---

### 《面试题目》

1. 我简历吹牛逼会硬件，答不出来挂了，只能给各位加油了

**拷打项目部分：**
2. 当时为什么要用socket连接，PLC，不用Modbus
3. 讲一下你对RPA的理解
4. 讲一下你做RPA遇到的难点

**八股部分：**

**反射有什么用？**
5. 反射在业务具体用法？
6. 讲一下Arraylist和HsahMap
7. 讲一下spring启动类注解的原理
8. 除了启动类，还有什么方式启动spring
9. Spring有哪些启动事务的方式
10. MySQL，聚簇索引有哪些类型
11. MySQL怎么用SQL拷贝两张一模一样的表
12. mysql默认隔离级别
13. RR隔离级别，有一个视图，A去修改数据，提交的同时，B查询。B查的是A修改前的还是修改后的？
14. 那如果要让B查询A修改后的数据，怎么做？

**会卡一下吗？**
15. linux怎么获得当前目录路径？
16. linux怎么查看线程
17. linux，Top命令，-u参数是什么用
18. linux怎么查找带固定内容的文件

---

### 《参考解析》

1. **MySQL深度**：MySQL InnoDB使用B+树索引，支持ACID事务。关键知识点：聚簇索引（主键索引）叶节点存完整行数据；辅助索引叶节点存主键值（需回表）；MVCC通过undo log版本链+ReadView实现多版本并发控制，解决脏读/不可重复读；事务隔离级别从低到高：读未提交→读已提交→可重复读（默认）→串行化。

2. **Spring框架**：Spring IoC容器管理Bean生命周期，核心是依赖注入（DI）。AOP面向切面编程通过动态代理（JDK/CGLIB）实现横切关注点（日志/事务/权限）。Spring事务传播行为：REQUIRED（加入现有或新建）、REQUIRES_NEW（挂起当前，新建）、NESTED（嵌套事务）等。

---
title: 某互联网公司前端开发工程师面经
company: 某互联网公司
position: 前端开发工程师
date: '2026-05'
result: 凉经
base: 江西
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2855464
tags: ["Java", "MySQL", "Spring", "前端"]
summary: "某互联网公司前端开发工程师面经，考察Java、MySQL、Spring等核心知识点。包含真实面试题目与解析，适合准备前端开发工程师面试的求职者参考备考。"
---

### 《面试题目》

1. 江西泰豪java凉经
1. 自我介绍 项目介绍
2. 会不会前端 ……只能看懂基本写不出来
3. springboot的端口怎么配
4. set map list集合区别
5. map如何遍历 每个元素怎么取
6. list的遍历方式 每种遍历方式的区别
7. xxl-job定时任务如何配置 我说yaml文件配，面试官无语了……
8. mybatis foreach作用，核心属性  忘了……
9. sql时间规范写法
10. sql题 一个学生表查同名的数据 我这也没答出来……
11. 反问环节：觉得我问题在哪？
12. 面试官说我前端也不会，sql也不熟，后端也是看网上视频抄的，多想想自己学了什么。
13. 当涨经验了，没两个问题是完整答出来的😂

---

### 《参考解析》

1. **MySQL深度**：MySQL InnoDB使用B+树索引，支持ACID事务。关键知识点：聚簇索引（主键索引）叶节点存完整行数据；辅助索引叶节点存主键值（需回表）；MVCC通过undo log版本链+ReadView实现多版本并发控制，解决脏读/不可重复读；事务隔离级别从低到高：读未提交→读已提交→可重复读（默认）→串行化。

2. **Spring框架**：Spring IoC容器管理Bean生命周期，核心是依赖注入（DI）。AOP面向切面编程通过动态代理（JDK/CGLIB）实现横切关注点（日志/事务/权限）。Spring事务传播行为：REQUIRED（加入现有或新建）、REQUIRES_NEW（挂起当前，新建）、NESTED（嵌套事务）等。

---
title: 27届重庆Java小厂面经
company: 某互联网公司
position: 软件开发工程师
date: '2026-06'
result: OC
base: 重庆
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2861357
tags: ["Java", "Spring"]
summary: "某互联网公司软件开发工程师面经，考察Java、Spring等核心知识点。包含真实面试题目与解析，适合准备软件开发工程师面试的求职者参考备考。"
---

### 《面试题目》

1. 简单自我介绍
2. 项目是否上线，按照简历写的点挨个提问
3. 抽象类跟接口的区别
4. Spring IOC
5. 现有两个字符串数组，数组长度均约100000（10万条字符串），求：两个数组中都出现过的相同字符串（交集），选用执行速度最优的实现方案

---

### 《参考解析》

1. **Spring框架**：Spring IoC容器管理Bean生命周期，核心是依赖注入（DI）。AOP面向切面编程通过动态代理（JDK/CGLIB）实现横切关注点（日志/事务/权限）。Spring事务传播行为：REQUIRED（加入现有或新建）、REQUIRES_NEW（挂起当前，新建）、NESTED（嵌套事务）等。

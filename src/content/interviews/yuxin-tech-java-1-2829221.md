---
title: 北京宇信科技Java一面面经
company: 北京宇信科技
position: Java开发工程师
round: 一面
date: '2026-04'
base: 北京
source: 牛客网
tags: ["Java","Spring Boot","MyBatis","MySQL","Redis","Linux"]
summary: "北京宇信科技Java一面面经分享，重点考察Java基础、Spring Boot启动优化、MyBatis分页与索引机制、Redis缓存一致性及Linux部署与运维。适合备考Java岗位的开发者查阅。"
---

### 面试题目

**一、项目经历**
1. 在这边实习了几个月？
2. 给我介绍一下你在这个公司做的项目吧。
3. 给我介绍一下这个系统是干嘛的？
4. 你觉得这个系统最核心的东西是哪些？
5. 支付这块你了解吗？你参与的少，那对这部分有什么了解吗？
6. 你主要负责的是登录模块还有优惠券，是吗？
7. 说一下你的那个登录模块吧。

**二、Java与框架技术**
8. SpringMVC了解吗？给我说一下MVC模式是什么？
9. Spring Boot启动服务的时候怎么优化？
10. Spring Boot核心优点是什么你知道吗？
11. Spring Boot配置文件有哪几种啊？
12. 为什么用YML格式？
13. 怎么改端口知道吗？
14. 你们用Mybatis吗？Mybatis怎么实现分页？
15. 用Mybatis先查用户表，再更新同一条用户数据，再查询同一条数据，查询出来结果是什么？

**三、数据库与缓存**
16. Mysql用in查询条件会导致索引失效吗？
17. 没走索引，可以强制让他走索引吗？
18. Redis了解吗？Redis优点是什么？
19. Redis容易出现什么常见的问题？
20. 数据不一致的话怎么解决？

**四、Linux与工具**
21. Git怎么解决冲突？说一下解决冲突的流程。
22. Linux系统这一块部署过服务吗？说一下怎么部署？
23. 知道怎么查询端口是否被占用吗？
24. Linux系统自带的定时功能用过吗？
25. 普通用户操作需要root权限，怎么处理？
26. Java有什么常用的容器啊？
27. 我想读取一个文本文件，我怎么读取？除了IO流还有其他方法吗？
28. 线程池有哪些核心的参数？
29. 线程池的执行流程是什么？

**五、AI相关**
30. 用过Spring AI吗？
31. 你平时用过AI工具吗？做开发的时候用什么？怎么用的？

---

### 参考解析

* **Spring Boot启动优化**：减少依赖引用、使用懒加载（Lazy Initialization）、优化Bean扫描路径、配置Tomcat最大线程数等。
* **MyBatis分页**：使用PageHelper插件（基于拦截器修改SQL）或在SQL语句中使用LIMIT关键字。
* **MyBatis缓存一致性**：MyBatis默认开启一级缓存（SqlSession级别），两次查询之间有更新操作，需视事务隔离级别而定，通常会触发缓存清空。
* **MySQL IN索引**：IN本身不会导致索引失效，但在IN参数过多时，优化器可能认为全表扫描效率更高。使用`FORCE INDEX`可以强制走索引。
* **Redis数据一致性**：常用策略有先更新数据库后删缓存，或者使用分布式锁（如Redisson）保证原子性；最终一致性可通过消息队列重试实现。
* **线程池参数**：corePoolSize（核心线程数）、maximumPoolSize（最大线程数）、keepAliveTime（空闲存活时间）、workQueue（工作队列）、handler（拒绝策略）。
* **Java读取文件**：除了InputStream/Reader外，还可以使用Java NIO的`Files.readAllLines()`或`Files.readString()`直接读取，适合小文件；大文件推荐使用流式读取。
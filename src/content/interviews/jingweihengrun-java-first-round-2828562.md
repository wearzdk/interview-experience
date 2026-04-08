---
title: 经纬恒润Java开发一面面经
company: 经纬恒润
position: Java开发
round: 一面
date: '2026-04'
result: 挂
source: 牛客网
tags: ["Java","MySQL","Spring Boot","微服务","RBAC模型"]
summary: "经纬恒润Java开发一面面经，面试主要涉及Java基础（泛型、反射、Stream流）、数据库优化（索引失效、分页）、RBAC权限模型、MinIO文件存储以及Spring Boot相关技术，涵盖项目难点与微服务基础，适合Java后端求职者备考参考。"
---

### 面试题目

1. 学习Java的路线规划
2. 项目经验：RAG项目构建细节、实习过程中的技术难点
3. MinIO使用方式及数据库表设计
4. RBAC权限设计模型，及其与ABAC的区别
5. Java基础：泛型、反射、数组与List的转化、JDK 1.8 Stream流
6. 性能优化：数据库优化技巧、索引失效情况、分页查询优化
7. Spring Boot：自启动执行业务代码的方式、定时任务实现
8. 其他：微服务接触情况、上线流程、实习时长与规划
9. 反问：业务内容、技术栈期望、面试反馈

---

### 参考解析

- **RBAC vs ABAC**：RBAC（基于角色的访问控制）通过用户-角色-权限进行管理，适合大多数企业；ABAC（基于属性的访问控制）通过用户属性、环境属性和资源属性进行动态判断，适合细粒度、复杂场景的权限控制。
- **索引失效**：常见包括：在索引列上做计算/函数/类型转换、使用 `!=` 或 `<>`、使用 `like` 以 `%` 开头、`or` 连接非索引列、违反最左前缀法则等。
- **Spring Boot 自启动**：可通过实现 `CommandLineRunner` 或 `ApplicationRunner` 接口，在 `run` 方法中编写初始化逻辑；也可使用 `@PostConstruct` 注解标记初始化方法。
- **定时任务**：简单场景可使用 Spring 自带的 `@Scheduled` 注解配合 `@EnableScheduling`；复杂分布式场景推荐使用 XXL-Job 或 Quartz。
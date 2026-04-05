---
title: 山东胜软科技 Java 后端一面
company: 山东胜软科技股份有限公司
position: Java后端工程师
round: 一面
date: '2026-03'
base: 山东
source: 牛客网
tags: ["SpringBoot","Redis","MySQL","Spring事务","Nacos","分库分表"]
summary: "山东胜软科技Java后端一面，共30分钟，涵盖SpringBoot自动装配原理与启动流程、Spring事务传播机制、Redis缓存穿透/击穿/雪崩、MySQL分库分表、Nacos注册中心等核心知识点，并有15分钟项目深度拷打，适合备考Java后端面试参考。"
---

## 面试题目

### 基本情况

- 自我介绍
- 项目拷打（约15分钟）

### Spring / SpringBoot

- SpringBoot 的自动装配原理是什么？SpringBoot 启动都做了哪些事？
- SpringBoot 用的哪个版本？2.x 的几个版本之间有哪些差异？
- 项目部署上线需要注意什么？

### 数据库

- 事务的特性（ACID）、Spring 事务的传播行为有哪些？
- 除了 MySQL 还会其他数据库吗？
- 数据库分库分表有了解吗？

### 缓存 / 中间件

- Redis 缓存穿透、击穿、雪崩分别是什么？如何解决？
- Nacos 的作用是什么？

### 反问

---

## 参考解析

### SpringBoot 自动装配原理

核心注解 `@SpringBootApplication` 包含 `@EnableAutoConfiguration`，它通过 `AutoConfigurationImportSelector` 读取 `META-INF/spring.factories`（2.7+ 改为 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`）中的配置类，结合 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件注解，按需加载 Bean，实现"约定优于配置"。

### SpringBoot 启动流程

1. 创建 `SpringApplication` 对象，推断应用类型，加载 `ApplicationContextInitializer` 和 `ApplicationListener`。
2. 执行 `run()` 方法：发布启动事件 → 准备环境 → 创建并刷新 `ApplicationContext` → 执行 `CommandLineRunner`/`ApplicationRunner` → 发布就绪事件。

### Spring 事务传播行为

共 7 种，重点记 3 种：`REQUIRED`（默认，有则加入，无则新建）、`REQUIRES_NEW`（始终新建，挂起外层事务）、`NESTED`（嵌套事务，外层回滚则子事务也回滚，子事务回滚不影响外层）。

### Redis 缓存穿透 / 击穿 / 雪崩

- **穿透**：查询不存在的 key，每次打到数据库。解决：布隆过滤器或缓存空值。
- **击穿**：热点 key 过期瞬间，大量请求打到数据库。解决：互斥锁重建缓存或逻辑过期。
- **雪崩**：大量 key 同时过期或 Redis 宕机。解决：过期时间加随机抖动、Redis 集群高可用、熔断降级。

### 数据库分库分表

垂直分库按业务拆分，垂直分表按字段冷热拆分；水平分表按范围或 Hash 将数据行分散到多张表。常用中间件：ShardingSphere、MyCat。需注意分布式事务、跨库查询、全局唯一 ID（雪花算法）等问题。

### Nacos 作用

Nacos 同时承担**注册中心**（服务注册与发现，支持健康检查）和**配置中心**（动态配置推送，支持命名空间与分组隔离）两个角色，是 Spring Cloud Alibaba 微服务体系的核心组件。

### SpringBoot 2.x 版本差异要点

- 2.3：引入优雅停机、分层 JAR 支持。
- 2.4：配置文件加载机制重构（`spring.config.import`）。
- 2.5：支持 OCI 镜像分层构建。
- 2.6：默认禁止循环依赖。
- 2.7：`spring.factories` 自动配置迁移至新路径，为 3.x 过渡。
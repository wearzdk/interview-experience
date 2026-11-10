---
title: "联友科技 AI 产品经理技术面：Spring Boot 自动装配与自定义 Starter 怎么答"
company: 联友科技
position: AI 产品经理
round: 技术面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/949595756812312576
tags: ["联友科技","AI产品经理","SpringBoot","自动装配","Starter","产品经理技术面"]
summary: "联友科技 AI 产品经理（数字化方向）技术面：简历里有小程序开发与 Java 后端联调经历，面试官顺着项目追问 Spring Boot 自动装配的原理、分布式环境下是否成立、怎么定义一个 Starter、自动装配与 @Autowired 的区别，以及条件注解与常见踩坑。"
---

### 《面试题目》

1. Spring Boot 自动装配的原理是什么？
2. 分布式环境下自动装配是怎么运作的？
3. 怎么定义一个 Starter？
4. 自动装配和 `@Autowired` 有什么区别？
5. 追问：自动装配怎么做到按需加载？
6. 追问：自定义 Starter 最容易踩什么坑？

### 《参考解析》

**先区分两个概念**：`@Autowired` 解决的是 Bean 之间的依赖注入，回答「这个对象从哪里来」；Spring Boot 自动配置解决的是「classpath 上引入了什么依赖，就自动把对应的 Bean 配好」，回答「不用手写配置为什么也能跑」。面试官问「自动装配原理」时一般指后者，开场先点明区别，能立刻显出理解是准的。

**四层链路**：启动类上的 `@SpringBootApplication` 组合了 `@EnableAutoConfiguration`，通过 `@Import` 引入 `AutoConfigurationImportSelector`；`selectImports()` 负责收集候选配置类；候选清单来自 classpath 上所有 jar 包的 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（Spring Boot 2.7 之前是 `META-INF/spring.factories`）；候选类再靠条件注解做减法——`@ConditionalOnClass` 要求某个类存在才生效，`@ConditionalOnMissingBean` 要求容器里没有用户自定义的 Bean 才生效（这是默认配置可被覆盖的关键），`@ConditionalOnProperty` 要求配置项满足条件。一句话概括：清单登记加条件过滤，约定优于配置。

**分布式环境下不存在全局自动装配**：自动配置是每个 Spring Boot 应用（也就是每个微服务节点）启动时各自完成的本地行为，没有一个中心节点替所有服务装配 Bean。跨服务的协同靠注册中心、配置中心与 Spring Cloud 那一层，和自动配置不是同一个问题。把这一点讲清楚，比硬编一个「分布式自动装配」的概念更能说明没有死背。

**自定义 Starter 的五步**：命名上第三方用 `xxx-spring-boot-starter`、官方用 `spring-boot-starter-xxx`；写 `@ConfigurationProperties` 属性类绑定配置，`prefix` 只能是小写字母加短横线；写自动配置类，`@Configuration` 加 `@EnableConfigurationProperties` 加条件注解，Bean 上补 `@ConditionalOnMissingBean` 让使用者能覆盖；把配置类登记进 `AutoConfiguration.imports`（每行一个全限定名）；发布时最好拆成 starter（纯依赖）与 autoconfigure（装配逻辑）两个模块，避免把实现类污染到使用者的类路径。

**三个常见坑**：Spring Boot 2.7 之后仍写 `spring.factories`，或者新文件路径写错，启动不报错但配置静默失效；`@ConfigurationProperties` 的 `prefix` 含大写字母或下划线，绑定不上；忘了 `@ConditionalOnMissingBean`，默认 Bean 抢占后用户无法覆盖。

**产品岗被问到技术题怎么答**：不必背源码，讲清它解决什么问题、边界在哪、研发一般改哪里，再补一句对产品的影响——例如引入一个 Starter 的接入成本、默认配置与业务自定义的优先级。这样既证明能和研发顺畅沟通，也不越界装懂。

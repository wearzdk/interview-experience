---
title: "达实智能 Java 面经：项目追问、ES 选型与 JWT 轮换"
company: "达实智能"
position: "Java 后端开发"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/92cae92aeeda4d448d34e0b298a2284e
tags: ["Java","达实智能","Elasticsearch","SpringBoot","MyBatis","JWT","Docker"]
summary: "达实智能 Java 岗面经：前七问全部围绕简历里的实习项目与另外两个项目追问，随后考 ES 选型与替代方案、SpringBoot 启动流程、MyBatis 分页插件原理、JWT 结构与 Token 定期轮换、Docker 常用命令。其中「JWT 定期轮换」是本场最容易答不上来的一问。"
---

### 《面试题目》

1. 自我介绍。
2. 介绍一下实习做的项目，整个项目的流程是怎么样的？（第 2—7 问都在这条主线上持续追问细节）
3. 说一下你另外两个项目在开发时遇到过哪些问题，是怎么解决的？
4. 代码是你自己写的还是 AI 写的？
5. 介绍一下你的 AI Coding。
6. 为什么要用 ES？如果不用 ES 有没有什么替代方案？
7. SpringBoot 的启动流程是什么？
8. MyBatis 的分页插件底层是怎么实现的？
9. JWT 包含哪些部分？
10. JWT Token 定期轮换怎么做？
11. 常用的 Docker 命令有哪些？

### 《参考解析》

**ES 这题要答「检索需求」，不要答「数据量大」。** 选 ES 的正当理由只有一个：需要全文检索或复杂的多维过滤聚合——倒排索引让「按词命中」不必全表扫描，分词器决定了中文能不能搜到，近实时（默认 1 秒 refresh）意味着写入到可搜索有延迟。反面要说清代价：ES 不是事务型存储，数据一致性靠同步机制保证，集群运维成本和内存开销都不低，所以常见架构是 MySQL 存权威数据、ES 做检索副本，用 binlog（Canal）或双写加补偿同步。替代方案按场景分：只是精确匹配和范围查询就用关系库加好索引；需要轻量全文检索可以用 MySQL 的全文索引或 PostgreSQL 的 tsvector；日志与 OLAP 场景用 ClickHouse 或 Loki；语义召回则走向量库。被追问「你的项目真的需要倒排索引吗」时，如果只是 LIKE 查询，坦诚承认并说清当初的取舍，比硬撑更有说服力。

**SpringBoot 启动流程可以按「六步 + 一个 refresh」讲。** 入口是 `SpringApplication.run`：先推断应用类型（Servlet/Reactive/None）并加载 `spring.factories` 里的初始化器与监听器；接着准备环境 `Environment`（读取命令行参数、配置文件、Profile）；打印 Banner；创建 `ApplicationContext` 并 prepare（执行 `ApplicationContextInitializer`、注册主配置类）；随后进入 `refresh()`——这一步是核心：准备 BeanFactory、执行 `BeanFactoryPostProcessor`（其中 `ConfigurationClassPostProcessor` 负责解析 `@ComponentScan` 与自动配置类）、注册 `BeanPostProcessor`、`onRefresh` 时创建内嵌容器（Tomcat/Jetty）、`finishBeanFactoryInitialization` 实例化所有单例、`finishRefresh` 发布 `ContextRefreshedEvent` 并启动 Web 服务器；最后回调 `ApplicationRunner` 与 `CommandLineRunner`。追问常落在自动配置的原理上：`@SpringBootApplication` 里的 `@EnableAutoConfiguration` 通过 `spring.factories`（新版本是 `AutoConfiguration.imports`）导入候选配置类，再由 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件注解筛选——这套「约定加条件」的机制就是「开箱即用」的全部秘密。

**MyBatis 分页插件的本质是拦截器加 SQL 改写。** 它实现 `Interceptor` 并拦截 `Executor.query` 方法，在 SQL 执行前做两件事：先根据原 SQL 生成一条 `count` 语句查出总条数，再把原 SQL 拼上数据库方言对应的 `limit/offset`（Oracle 用 `rownum`，SQL Server 用 `row_number()`）。参数通过 `ThreadLocal`（PageHelper 的 `Page` 对象）传递，所以「设置分页」和「执行查询」必须紧挨着，中间插入别的查询会把分页参数串到错误的语句上——这也是 `ThreadLocal` 用完必须清理的原因。追问点有三个：`count` 语句可以优化（去掉 order by、只选主键、或对无 where 的查询走缓存），嵌套结果（`resultMap` 里有 collection）的分页会把子查询一起限制导致数据缺失，以及物理分页与「内存分页」（查全部再 `List.subList`）的区别——后者在数据量大时是事故。

**JWT 的结构与那问「定期轮换」。** JWT 是三段 Base64URL 拼接：Header（算法与类型，比如 `alg: RS256`、`kid`）、Payload（标准声明 `iss/exp/iat/jti` 加业务声明）、Signature（用密钥对前两段签名）。注意 Payload 只是编码不是加密，谁都能解开，所以不能放敏感信息。所谓「定期轮换」通常指三件不同的事，面试时最好先澄清是哪一种：一是 **Token 轮换**——access token 有效期缩短到十几分钟，配一个长有效期的 refresh token，刷新时签发新的 refresh token 并让旧的失效（一次性使用）；一旦检测到旧 refresh token 被复用，就判定泄露、把该用户整条会话链作废，这是 OAuth2 的 refresh token rotation。二是 **密钥轮换**——JWT 的固有痛点是签发后无法撤销，只能等 `exp` 过期，所以泄露影响面很大；做法是 Header 里带 `kid`，签名密钥定期更换并在 JWKS 端点同时发布多个公钥，验证方按 `kid` 选密钥，旧密钥保留一个「大于最大 token 有效期」的宽限期再下线；紧急情况下可以直接换掉旧密钥，让所有已签发 token 立刻验签失败。三是 **主动失效**——把 `jti` 写进 Redis 黑名单或维护「用户维度的签发时间戳」，验证时对比 `iat`，实现「改密码后所有旧 token 失效」（代价是每次请求多一次查询，等于部分放弃了无状态）。作者没听懂的那问，本质就是「无状态的 JWT 怎么做撤销」，答出这条矛盾并给出上面三类手段中的一两类，比背实现更有分。

**Docker 常用命令按「镜像、容器、排查、编排」分四组说。** 镜像：`build`（配 `-t`、`--no-cache`、多阶段构建）、`images`、`pull/push`、`tag`、`rmi`、`history`。容器：`run`（`-d -p -v -e --name --restart`）、`ps -a`、`start/stop/restart`、`rm`、`exec -it`、`logs -f --tail`、`cp`。排查：`inspect` 看配置与挂载、`stats` 看资源占用、`top`、`diff` 看容器内文件改动、`events`。数据与网络：`volume ls/create/prune`、`network ls/create`。编排层则是 `docker compose up -d`、`compose logs`。被追问时能补一句「镜像分层的道理」很加分：`COPY` 与 `RUN` 的顺序决定了缓存命中，把依赖安装放在源码拷贝之前能显著减少每次构建的时间。

**「代码是不是你写的」和 AI Coding 怎么答。** 面试官问这句不是要道德审判，而是在确认两件事：你对代码的理解程度，以及你的工程判断力。稳妥的说法是把 AI 定位成工具并给出自己的把关环节：用 AI 生成样板代码、测试用例、不熟语法的实现，但需求拆解、方案选型、接口设计、code review 与测试验收由自己负责；能具体举一个「AI 给的实现有坑、我改掉了」的例子最好——这比空谈「我用 AI 提效」有说服力得多。至于项目介绍本身，准备一个固定框架：业务背景与目标、我的角色、整体架构与数据流、技术选型理由、最难的一个点及其定位过程、量化结果（QPS、耗时、错误率）、以及复盘时如果重做会改什么。面试官顺着简历追问时，只要能落到「为什么这么做」这一层，就说明项目真是你做的。

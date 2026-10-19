---
title: "ZBS POS 后端一面二面：Spring 八股与导入导出、定时任务场景设计"
company: "ZBS POS"
position: "后端开发"
round: "一面+二面"
date: "2026-10"
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/7b5c59fa6bb246ab951fe37d8930cd95
tags: ["Java", "Spring", "MySQL", "Redis", "布隆过滤器", "场景题"]
summary: "ZBS POS 后端一面考 Spring Boot、IoC 单例、三级缓存、MySQL 索引失效、Redis 数据结构与布隆过滤器；二面全是导入导出、定时任务、布隆空窗期等场景设计。"
---

### 《面试题目》

1. 自我介绍，并介绍三个项目（两段实习、一个个人项目）。
2. Spring Boot 和 Spring 有什么区别？
3. Spring Boot 的核心注解有哪些？
4. Spring IoC 单例模式下，什么情况会出现创建多个实例？
5. 说说 Spring 的三级缓存。
6. MySQL 索引失效的原因有哪些？
7. Redis 常用数据结构有哪些？
8. 布隆过滤器的原理是什么？
9. 二面场景：导入导出功能分别怎么设计？
10. 定时任务你会怎么设计？
11. 用布隆过滤器做第一层过滤，空窗期怎么避免？
12. 用 set 存空窗期内发布的新内容有什么问题？怎么解决？
13. 定时任务除了轮询还有什么方案？
14. 如果客户提出一个导出需求，你认为他可能的真实目的是什么？

### 《参考解析》

**Spring Boot 与 Spring**：Spring 是一个轻量级容器与框架，核心是 IoC 和 AOP；Spring Boot 是在 Spring 之上的“约定优于配置”封装，提供起步依赖、自动配置、内嵌容器和 Actuator，把原来大量 XML 与依赖配置收拢成 starter 和条件装配。自动配置的本质是 `@EnableAutoConfiguration` 通过 `spring.factories`（Boot 3 起是 `AutoConfiguration.imports`）加载配置类，再按 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件决定是否生效。核心注解常答 `@SpringBootApplication`（组合了 `@SpringBootConfiguration`、`@EnableAutoConfiguration`、`@ComponentScan`）、`@RestController`、`@Configuration`、`@Bean`、`@ConditionalOn...`。

**单例出现多实例**：Spring 默认单例是“容器内单例”，不是 JVM 全局单例。常见破例：多容器（父子容器、多个 ApplicationContext）各有一份；用 `new` 直接创建对象；作用域写成 prototype；被序列化/反序列化或反射创建；`@Bean` 方法被重复注册到不同配置类；以及热部署/类加载器隔离导致同一类被加载多次。还有一点常被忽略：单例 Bean 依赖 prototype Bean 时，prototype 只在注入时创建一次，需要 `ObjectProvider` 或 `@Lookup` 才能每次拿新实例。

**三级缓存**：解决单例 Bean 的循环依赖。一级是成品缓存 `singletonObjects`，二级是提前暴露的半成品 `earlySingletonObjects`，三级是对象工厂 `singletonFactories`。创建 A 时先把 A 的工厂放进三级，填充属性发现依赖 B，去创建 B；B 又依赖 A，从三级拿到工厂生成 A 的早期引用（必要时生成代理）放入二级，B 完成后入一级，A 再完成。三级缓存的关键是“延迟生成代理”，保证循环依赖时注入的是代理而不是原始对象。构造器注入的循环依赖无法解决，因为对象还没实例化；Spring Boot 2.6 起默认禁止循环依赖，需要显式开启。

**索引失效**：对索引列做函数、运算或隐式类型转换；前导模糊 `like '%x'`；联合索引不满足最左前缀；OR 条件中有非索引列；范围查询之后的列无法继续用于精确定位；使用 `!=`、`not in` 等选择性差的条件；表数据量小优化器认为全表扫描更便宜；统计信息过期导致选错执行计划。排查用 `explain` 看 type、key、rows、filtered 和 Extra，不要只看“有没有走索引”。

**Redis 与布隆**：常用结构有 String（缓存、计数、分布式锁）、Hash（对象字段）、List（队列、时间线）、Set（去重、交并差）、ZSet（排行榜、延时队列）、Bitmap（签到、布尔统计）、HyperLogLog（基数估算）、Stream（消息流）。布隆过滤器用多个哈希函数把元素映射到位数组的多个位，查询时所有位都为 1 才可能存在，因此有假阳性、没有假阴性；不能删除元素，要删除得用计数布隆或定期重建。它适合“先挡掉绝大多数不存在”的场景，比如缓存穿透、URL 去重。

**导入导出设计**：导入要分“上传 → 解析 → 校验 → 入库 → 回执”。大文件不要一次性读进内存，用流式解析（EasyExcel/POI 的 SAX）或分片上传；校验分格式、必填、枚举、业务唯一键，错误行收集后一次性返回，不要遇到第一行就中断；入库用批量插入 + 事务分段，失败可重试且幂等。导出要防大结果集打爆内存：异步任务 + 分页查询 + 流式写文件，生成后存对象存储，前端轮询进度或下载链接；同时做行数上限、超时和取消。客户提导出需求的真实目的可能是对账、迁移、给上级汇报或离线分析，先问清字段、口径、频率和保密要求，避免做了一个没人用的全量导出。

**定时任务**：单机用调度线程池 + cron，多机要解决重复执行：数据库乐观锁抢任务、Redis 分布式锁、或专门的调度中心（XXL-JOB、ElasticJob）。任务要幂等、可重试、有超时、失败告警、执行日志和手动补偿。除了轮询，还可以用延时队列（RabbitMQ 死信、RocketMQ 延时消息、Redis ZSet）、时间轮、CDC 事件驱动或数据库定时器。轮询的缺点是空转和延迟，事件驱动的缺点是可靠性要自己兜底，通常“事件触发 + 定时兜底扫描”组合使用。

**布隆空窗期**：布隆过滤器只能加不能删，更新有延迟时，新写入的数据可能还没进布隆，查询会被误判为不存在。做法是双写时先写布隆再写库、或写库成功后同步更新布隆并记录版本；空窗期用一层短的本地缓存或“白名单 set”兜底，set 只存最近一段时间的新 ID 并定期清理。用 set 存全量新内容的问题是内存随数据量线性增长，应该用带 TTL 的 Redis set 或分片 + 定时清理，且要接受“极端情况下多查一次数据库”。

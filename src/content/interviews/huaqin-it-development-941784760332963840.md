---
title: "华勤技术IT开发工程师一面：Java高并发与Spring Bean考点"
company: "华勤技术"
position: "IT开发工程师"
round: "一面"
date: '2026-10'
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/941784760332963840"
tags: ["华勤技术", "IT开发工程师", "Java", "高并发", "Spring", "数据库优化"]
summary: "华勤技术IT开发工程师一面面经，以八股为主，考察Java高并发处理、数据库高并发与大表优化、Spring Bean的定义方式和生命周期，另外聊了加班意向。"
---

### 《面试题目》

**一面**

1. Java 里遇到高并发情况怎么处理？
2. 数据库面临高并发请求怎么处理？
3. 上千万数据的大表，增删改查 / 数据处理怎么优化？
4. Spring 里 Bean 的定义方式有哪些？
5. Bean 的生命周期怎么处理？

### 《参考解析》

**Java 高并发**：答题按「接入层—应用层—存储层」分层展开最清楚。接入层做负载均衡、限流和熔断降级；应用层用线程池承载请求（说清核心线程数、队列、拒绝策略的取舍），共享状态用 ConcurrentHashMap、Atomic 等并发容器与 CAS 无锁方案，读多写少用读写锁，长耗时逻辑异步化或丢进消息队列削峰；再往下用缓存挡住热点读，最后才是 JVM 与锁粒度的调优。

**数据库高并发**：先做读写分离和连接池合理配置，再用 Redis 缓存热点数据、注意穿透、击穿、雪崩的处理；写压力大就分库分表、消息队列削峰、缩短事务并把大事务拆小；热点行可用乐观锁或拆分，同时治理慢查询、补上合适索引。

**千万级大表优化**：查询避免 `SELECT *`、只取必要列并尽量走覆盖索引，联合索引遵守最左前缀；深分页改游标方式（`WHERE id > 上一页最大 id LIMIT n`）；批量增删改分批提交、控制事务大小；历史数据归档或用分区表，DDL 走 online DDL 工具；单表仍扛不住再考虑水平拆分。

**Spring Bean 定义方式**：XML 的 `<bean>` 标签、注解（`@Component` 及 `@Service`、`@Repository`、`@Controller`）配合包扫描、`@Configuration` 里的 `@Bean` 方法、`@Import` 导入配置类，以及实现 `FactoryBean` 或编程式注册 `BeanDefinition`。

**Bean 生命周期**：实例化 → 属性填充（依赖注入）→ Aware 回调 → `BeanPostProcessor` 前置处理 → 初始化（`@PostConstruct`、`InitializingBean.afterPropertiesSet`、init-method）→ `BeanPostProcessor` 后置处理（AOP 代理通常在这一步生成）→ 使用 → 销毁（`@PreDestroy`、`DisposableBean.destroy`、destroy-method）。

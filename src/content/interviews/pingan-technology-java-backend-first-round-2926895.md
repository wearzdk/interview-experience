---
title: "平安科技补录一面：Bean 生命周期与 Redis 队列"
company: "平安科技"
position: "Java 后端"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/f60bf9c1a6ff47549c724d2e90adeeab
tags: ["平安科技","Java后端","Spring","Redis","消息队列","中间件","校招"]
summary: "平安科技 2026 届补录一面：从上一家公司的经历切入，连问 Java 锁的对象、在校用过的框架与特性、中间件使用情况、用 Redis 实现先进先出队列的方案、Spring IOC 与 AOP 的底层原理、Bean 生命周期与自定义注解的实现方式，以及最近在读的技术资料、用过的编码智能体和 skill 的目录结构，最后是反问环节。"
---

### 《面试题目》

1. 在上一家公司的经历。
2. Java 锁的对象有哪些？
3. 在学校使用了 Java 的哪些框架和 Java 的哪些特性？
4. 有用过一些中间件的服务吗？比如消息队列、Redis 这类？
5. 如果我想通过 Redis 实现一个先进先出的队列，有什么方案？
6. 简单介绍一下 Spring 的 IOC 和 AOP 的底层原理。
7. Spring 初始化一个 Bean，它的生命周期大概是什么样的？
8. 如果在 Spring 里要实现一个自定义注解，需要做什么？
9. 最近有在看什么技术方面的书籍或者资料吗？
10. 其他的一些编码智能体有用过吗？
11. skill 的目录结构是什么样的？

### 《参考解析》

**「Java 锁的对象有哪些」这题要答成「锁的是对象，不是代码」。** `synchronized` 加在实例方法上锁的是 `this`，加在静态方法上锁的是类的 Class 对象，修饰代码块时必须显式给一个对象引用（可以是任意对象，甚至是 `new Object()` 专门当锁）。概念上要区分「锁对象」与「锁的是什么数据结构」：`ReentrantLock` 的锁状态在 AQS 的 `state` 里，`synchronized` 的状态在对象头的 Mark Word 里（无锁、偏向锁、轻量级锁、重量级锁的升级过程），`StampedLock`、`ReadWriteLock`、`Semaphore`、`CountDownLatch` 各有自己的语义。几句容易加分的补充：锁的是对象意味着两个不同实例的同步方法可以并发执行；字符串常量、`Integer` 的缓存对象当锁是危险的（会被全局共享）；锁的范围要尽量小，但不要小到失去原子性；数据库层面「锁的对象」则是行、间隙或表，侧重点完全不同——对方如果追问的是数据库，就顺着行锁、间隙锁、Next-Key Lock 讲。

**Spring IOC 与 AOP 的底层原理要能落到具体类名。** IOC 容器启动时 `refresh()` 做的是：解析配置（注解或 XML）成 `BeanDefinition` 注册进 `BeanFactory`，然后按需实例化单例、做依赖注入。依赖注入的解析靠 `InstantiationAwareBeanPostProcessor`、`AutowiredAnnotationBeanPostProcessor` 与类型匹配，循环依赖靠三级缓存处理（`singletonObjects`、`earlySingletonObjects`、`singletonFactories`），核心是「提前暴露一个可以拿到 AOP 代理的工厂」。AOP 在 Bean 初始化后由 `AnnotationAwareAspectJAutoProxyCreator` 这个 `BeanPostProcessor` 判断是否需要代理，需要就用 JDK 动态代理（实现接口时）或 CGLIB（生成子类），并生成 `Advisor` 拦截链，调用时按 `@Order` 顺序执行通知。必须主动指出几个失效场景：自调用不走代理、`private`/`final` 方法代理不了、`@Transactional` 默认只对运行时异常回滚、以及代理对象的类型与目标类不一致时的注入问题。

**Bean 生命周期按顺序背成一条链，比零散记忆可靠。** 实例化（反射调构造器）→ 属性注入（`populateBean`）→ 各类 `Aware` 回调（`BeanNameAware`、`BeanFactoryAware`、`ApplicationContextAware`）→ `BeanPostProcessor.postProcessBeforeInitialization` → `@PostConstruct` → `InitializingBean.afterPropertiesSet` → 自定义 `init-method` → `BeanPostProcessor.postProcessAfterInitialization`（AOP 代理通常在这一步生成）→ 使用 → 容器关闭时 `@PreDestroy` → `DisposableBean.destroy` → 自定义 `destroy-method`。追问常落在「AOP 代理是在哪一步生成的」（初始化后的后置处理阶段）、「`@PostConstruct` 与构造器的差别」（前者能拿到注入的依赖，后者不能）、「原型 Bean 的销毁由谁负责」（容器不管，调用方自己处理）、以及「BeanFactory 与 FactoryBean 的区别」（前者是容器，后者是「生产 Bean 的 Bean」，`getBean("&name")` 拿的是工厂本身）。

**自定义注解 = 元注解声明 + 一个处理它的执行者。** 声明部分要写 `@Retention`（生命周期，运行时可见必须用 `RUNTIME`）、`@Target`（能修饰哪些元素）、`@Documented`、`@Inherited`，属性用「无参方法」定义并可给默认值。真正起作用要靠处理方：AOP 切面（`@Around` 里读注解做日志、限流、鉴权，最常用）、`BeanPostProcessor`（扫描方法或字段上的注解做增强）、`HandlerInterceptor`（Web 层校验）、或者 `BeanDefinitionRegistryPostProcessor`（动态注册 Bean）。答题时补一句 Spring 自带的组合注解机制（`@AliasFor`、`@Component` 作元注解可以把自定义注解直接变成 Bean），以及「注解本身没有行为，没有处理器就什么都不会发生」——这句能区分「背过」和「用过」。

**用 Redis 做先进先出队列，方案要按可靠性分层给。** 最简的是 List：生产者 `LPUSH`（或 `RPUSH`），消费者 `BRPOP`（或 `BLPOP`）阻塞弹出，天然 FIFO；缺点是消息弹出即丢失，消费者崩溃就丢单，也没有广播能力。要可靠性就上 Stream：`XADD` 追加、`XREADGROUP` 加消费者组读、`XACK` 确认，用 `XPENDING` 查未确认消息、`XCLAIM` 做故障转移，等于把 Kafka 的最小可用子集做进了 Redis。更土的兜底是 `BRPOPLPUSH` 把消息同时搬进一个 processing 列表，处理完再 `LREM`，超时的由补偿任务捞回。选型判断要讲清楚：Redis 队列适合「低频、短消息、允许极小概率重投、需要极低延迟」的场景；一旦要求不丢、有序、有积压能力与回溯消费，就该换 Kafka/RabbitMQ/Pulsar，因为 Redis 的持久化（RDB/AOF）不是为消息可靠性设计的，主从切换时也可能丢最近的数据。再补一句幂等：无论哪种方案，消费端都要用业务唯一键去重，因为「至少一次」是这类队列的默认语义。

**最后几题看起来是闲聊，其实在考「你的学习方式与 AI 使用的成熟度」。** 被问最近在看什么资料，最好给出具体的书名或文档加一句收获，比如在读《数据密集型应用系统设计》里的一致性章节、或者在跟 Spring 官方文档的某个新特性，避免「什么都看一点」的空话。被问编码智能体，答法同「用过 Agent 吗」：讲清用它做什么、怎么验证它的产出、什么时候不用它（涉及生产数据、需要精确逻辑的部分）。被问 skill 的目录结构，通常指智能体工具的技能/提示词组织方式——标准做法是一个目录一个技能，里面用一份带元信息（名称、描述、适用场景）的说明文件作为入口，把详细步骤、脚本与参考文档拆成子文件按需加载，好处是上下文只装当前任务需要的那部分、技能可以增删而不影响其它；回答时把「渐进式加载」和「技能与工具（MCP）的分工」这两点讲出来，比背目录名有用。反问环节准备三个层次的问题：团队当前的技术栈与业务、新人前三个月的培养与考核方式、以及这个岗位最看重的能力，别一上来就问薪资与加班。

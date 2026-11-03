---
title: "宇通 IT 岗初面：Spring Bean 注入、B+ 树与线程池七参数"
company: 宇通
position: IT岗
round: 初面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/1846cc900b614f979b7264c997f0df06
tags: ["Java", "Spring", "MySQL", "线程池", "Agent", "设计模式"]
summary: "宇通 IT 岗 11 月 3 日初面，30 分钟，原以为是 HR 面结果是技术面：抽象类与接口、HashMap 底层结构与并发问题、Spring Boot 常用注解、事务失效场景、@Autowired 与 @Resource 的区别、同类型多 Bean 如何精确注入、慢查询优化与 B+ 树、线程池七大参数怎么调、秒杀项目难点与支付模块、Agent 项目技术栈、项目中用到的设计模式。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 抽象类和接口的区别？
3. HashMap 底层数据结构是什么？是否有并发问题，为什么？
4. Spring Boot 常用的注解有哪些？
5. Spring 事务失效的场景有哪些？
6. @Autowired 和 @Resource 有什么区别？
7. 如果有同类型的两个不同名的类，具体怎么写才能保证一定用到某个特定类？（除了 @Qualifier 和 @Resource(name) 属性，还有别的方式吗？）
8. 慢查询 SQL 的优化过程是怎样的？
9. 数据库的存储结构是什么？B+ 树有什么特点？
10. 线程池七大参数有哪些，具体怎么调？
11. 秒杀项目的难点是什么？有没有做支付模块？
12. 介绍一下 Agent 项目用到的技术栈。
13. 设计模式在实际项目中用到了哪些？
14. 反问环节。

### 《参考解析》

**抽象类与接口。** 抽象类可以有构造器、成员变量、已实现的方法，表达「is-a」的继承关系，一个类只能继承一个；接口定义能力契约，方法默认 public abstract（Java 8 起可有 default/static 方法），一个类可以实现多个，表达「can-do」。选择上：需要共享状态或模板方法用抽象类，需要多实现、解耦、面向能力编程用接口。Java 8 之后接口有 default 方法，两者边界变模糊，但「单继承多实现」和「是否有实例状态」仍是判断依据。

**HashMap 与并发。** JDK 8 是数组 + 链表 + 红黑树：key 的 hash 扰动后取模定位桶，桶内链表长度到 8 且容量 ≥64 时转红黑树，扩容时按容量翻倍并拆分高低位链表。并发问题：put 可能覆盖彼此的写入、扩容时并发迁移导致数据丢失或形成环（JDK 7 头插法，JDK 8 改尾插但仍非线程安全）、size 计数不准、fail-fast 迭代器抛 ConcurrentModificationException。并发场景用 ConcurrentHashMap（JDK 8 用 CAS + synchronized 锁单个桶）。

**Spring 事务失效的常见场景。** 方法非 public（代理不生效）；同类内部调用（绕过代理）；异常被 catch 吞掉；抛出的是受检异常而默认只回滚 RuntimeException/Error（需 `rollbackFor`）；类没有被 Spring 管理（自己 new 的）；数据库引擎不支持事务（MyISAM）；多数据源未配事务管理器；`@Transactional` 加在接口上而代理模式为 CGLIB 时不被识别；异步方法（`@Async`）里的事务与原调用不在同一线程。

**@Autowired 与 @Resource。** `@Autowired` 是 Spring 的注解，默认按类型注入，找不到唯一 Bean 时配合 `@Qualifier` 指定名字，`required=false` 可允许为空；`@Resource` 是 JSR-250 标准注解，默认按名称注入（name 属性），找不到名字再按类型。构造器注入是更推荐的方式（不可变、易测试、循环依赖会提前暴露）。

**同类型多 Bean 的精确注入。** 除了 `@Qualifier` 和 `@Resource(name=...)`，还可以：用 `@Primary` 标记默认优先的 Bean；在配置类里用 `@Bean` 方法名作为 Bean 名并按参数名匹配（构造器注入时参数名与 Bean 名一致）；用 `ApplicationContext.getBean("name", Type.class)` 显式取；用自定义 `@Qualifier` 注解做限定符；或用 `@ConditionalOnProperty` 按配置决定注册哪个。生产上更推荐 `@Primary` + 构造器注入，把「选哪个实现」变成配置或编译期可见的决策。

**慢查询优化。** 先开慢查询日志定位具体 SQL 与耗时，再 `EXPLAIN` 看执行计划：type 是否全表扫描、key 用了哪个索引、rows 估算、Extra 是否有 filesort/using temporary。优化顺序：补或改索引（最左前缀、覆盖索引、避免在索引列上做函数运算和隐式类型转换）、重写 SQL（减少回表、拆大查询、避免 `SELECT *`、分页深翻用游标）、调整表结构（冷热分离、归档历史数据）、必要时加缓存或读写分离。改完用 `EXPLAIN` 和实际耗时复验。

**B+ 树。** InnoDB 用 B+ 树做聚簇索引：非叶子节点只存键和指针，叶子节点存完整行（聚簇索引）或主键（二级索引），叶子之间用双向链表相连。特点是层数低（三到四层可覆盖千万级数据，一次查询只需少量磁盘 IO）、所有查询都走到叶子因此性能稳定、范围查询和排序可以顺着叶子链表顺序扫描、非叶子节点不存数据使单页能容纳更多键、降低树高。

**线程池七参数。** corePoolSize、maximumPoolSize、keepAliveTime、unit、workQueue、threadFactory、handler。调参思路：先按任务类型定性——CPU 密集型核心数设为核数 + 1 左右，IO 密集型可放大到核数的数倍（用压测找拐点）；队列必须有界（`ArrayBlockingQueue` 或指定容量的 `LinkedBlockingQueue`），无界队列会让 maximumPoolSize 失效并有 OOM 风险；拒绝策略按业务选（丢弃可接受就 Discard，重要任务用 CallerRuns 做反压，或自定义落库重试）；线程命名要带业务标识便于排查；用 `ThreadPoolExecutor` 显式构造而不是 `Executors` 的快捷方法。

**秒杀项目的难点。** 核心是「瞬时高并发 + 库存不能超卖」：前端限流与按钮防重、网关层限流与黑名单、库存预热到 Redis 并用 Lua 原子扣减、用消息队列削峰异步下单、数据库层面用 `UPDATE ... WHERE stock > 0` 或乐观锁兜底、订单幂等（用户 + 商品唯一键）、防止超时未支付占库存（延迟消息取消）。支付模块要讲清「下单 → 预支付 → 回调验签 → 幂等更新订单状态 → 对账」的闭环，回调必须验签且幂等，状态机单向迁移。

**Agent 项目技术栈。** 按层次讲：模型层（调用哪家、如何做多模型路由与降级）、编排层（ReAct/Plan-Execute、状态机或 LangGraph 之类的图编排、工具注册与调用、循环终止条件）、记忆与知识（会话历史、摘要、向量库检索、工具结果缓存）、执行层（工具/函数的具体实现、权限与沙箱、超时重试）、可观测（trace、token 与成本、成功率）、评测（离线用例集 + 线上反馈）。重点讲清一次请求的完整链路和你在其中解决的具体问题。

**项目里的设计模式。** 举真实例子：策略模式做多支付渠道/多模型路由（接口 + 实现类 + Map 注册）、工厂模式创建不同类型的任务或消息处理器、模板方法固定「校验 → 执行 → 记录」的流程、责任链做参数校验或审批流、观察者/事件机制解耦订单状态变更后的通知、单例管理配置与连接池、建造者组装复杂的请求对象。每个都补一句「不用会怎样」，体现你是为了解决重复与耦合才引入的。

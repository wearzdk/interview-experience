---
title: "秦川物联网 Java 一面：IOC/AOP、缓存与库的删除顺序、@Transactional 失效场景"
company: 秦川物联网
position: Java 开发
round: 一面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/6b4cd5224cba422aa328ce3441a248fb
tags: ["秦川物联网","Java","Spring","IOC","AOP","Redis","事务","微服务"]
summary: "秦川物联网 Java 一面（11 月 5 日约面、9 日面试，全程约 15 分钟）：先问 Spring IOC 与 AOP，再逐条对着简历抠项目——Redis 和 MySQL 的删除是怎么做的、并行查询怎么压缩时间，随后问 @GlobalTransactional 和 @Transactional 能不能一起用、拦截器与过滤器、微服务怎么拆、项目是不是自己写的，以及 @Transactional 失效的场景。"
---

### 《面试题目》

1. Spring 的 IOC 和 AOP 是什么？
2. 项目里写了 Redis 和 MySQL 的删除，具体怎么删？
3. 项目里写了并行查询压缩时间，怎么做到的？
4. `@GlobalTransactional` 和 `@Transactional` 能不能一起用？
5. 拦截器和过滤器有什么区别？
6. 微服务的具体拆分是怎么做的？
7. 这些是不是你自己写的？
8. `@Transactional` 失效的场景有哪些？

### 《参考解析》

**IOC 与 AOP 要答到机制**：IOC 是控制反转，对象的创建与依赖关系交给容器管理，业务类只声明依赖（构造器注入、`@Autowired`），由容器在启动时解析 BeanDefinition、实例化、注入、执行生命周期回调；好处是解耦、可替换、便于测试。AOP 是面向切面，把横切关注点（日志、事务、鉴权、埋点）从业务代码里抽出来，Spring 用动态代理实现——有接口默认 JDK 代理，无接口用 CGLIB 生成子类，切点匹配后在方法调用前后织入增强。补充一句事务就是基于 AOP 实现的，能把两道题串起来。

**缓存与数据库的删除顺序**：常见三种策略——先更新库再删缓存（Cache Aside，主流）、先删缓存再更新库（并发下容易把旧值写回缓存，需要延迟双删）、以及订阅 binlog 异步删缓存（解耦、最终一致，Canal 这类方案）。要讲清为什么用「删」而不是「更新」：并发更新时写缓存可能覆盖成旧值，删除让下次读回源重建更安全。剩下的不一致窗口用过期时间兜底，强一致场景则要加锁或走串行化。被问「怎么删」时把 key 设计、批量删除用 `SCAN` 而不是 `KEYS`、以及删除失败的重试也说清。

**并行查询压缩时间**：把无依赖的查询拆成多个任务提交到线程池（`CompletableFuture.supplyAsync` 配合自定义线程池），用 `allOf` 等全部完成再合并结果，用 `orTimeout` 或 `get(timeout)` 控制总耗时；关键是线程池要独立且大小可控（不能共用 Tomcat 线程池，也不能用默认的 ForkJoinPool 跑阻塞 IO），异常要能传递并降级，某个子查询失败时返回部分结果还是整体失败要事先定好。收益要能用数据说明：串行 800ms、并行后 300ms 这类对照，否则说不清优化效果。

**`@GlobalTransactional` 与 `@Transactional` 一起用**：可以同时存在，但要理解层次。`@GlobalTransactional` 是 Seata 的全局事务入口，开启全局事务并注册分支；`@Transactional` 是本地数据库事务，负责单个库的 ACID。一起用时通常全局事务加在发起方的方法上，各分支服务内部再用本地事务保证自己的原子性。要注意的坑：全局事务的隔离级别默认是读未提交（AT 模式靠全局锁与 undo log 回滚），别指望它提供 RR；分支事务提交后靠 undo log 补偿，所以业务要能接受中间态被读到；`@GlobalTransactional` 与 `@Transactional` 的传播行为、异常回滚规则要显式配置；Redis、消息这类非事务资源不参与回滚，需要自己做补偿。如果面试官其实问的是别的注解，可以请他确认一下拼写，比硬答安全。

**拦截器与过滤器**：过滤器（Filter）属于 Servlet 规范，在请求进入 DispatcherServlet 之前生效，能拿到原始 `ServletRequest`，适合编码、跨域、请求体包装、安全过滤；拦截器（HandlerInterceptor）属于 Spring MVC，在 Handler 执行前后生效，能拿到 HandlerMethod，适合登录校验、权限、日志、参数预处理。执行顺序是 Filter → Interceptor → Controller，异常处理与返回值包装的时机也不同。回答时点明「能不能拿到 Spring 的上下文」这个本质差异。

**微服务拆分**：按业务能力与限界上下文拆，一个服务独占自己的数据与发布节奏；按变更频率拆，避免每次小改都全量发布；按团队边界拆（康威定律），一个团队能独立负责的服务才拆得动。不要按技术分层拆，也不要在事务强相关的模块间硬拆——那会引入分布式事务。拆完要配套：服务注册发现、配置中心、网关、链路追踪、熔断限流。回答时给一个具体例子（订单、库存、支付为什么分开），比背原则清楚。

**`@Transactional` 失效的八种场景**：同类内部方法直接调用（绕过代理，注解不生效）；方法不是 `public`（CGLIB 代理下可以但 JDK 代理不行，且 Spring 的解析行为有版本差异，规范做法是 public）；异常被吞掉或被捕获后没有重新抛出；抛的是受检异常而默认只回滚 `RuntimeException` 与 `Error`（需 `rollbackFor = Exception.class`）；注解加在接口上而代理方式不匹配；多线程里调用（事务绑定在 ThreadLocal，新线程不在同一事务）；数据库引擎不支持事务（MyISAM）；以及传播行为设成 `NOT_SUPPORTED` 或 `REQUIRES_NEW` 导致事务边界与预期不同。回答时按「代理机制、异常类型、线程与连接」三类归组，比零散列点清楚。

**「是不是你自己写的」怎么答**：这题在核实简历真实性，也是在测你对代码的掌握程度。自己写的就说清设计取舍与遇到的问题；参考开源或同事的代码就说明参考了哪部分、自己改了哪里、为什么改。含糊其辞最危险，因为后面任何一个细节追问都会露出来。

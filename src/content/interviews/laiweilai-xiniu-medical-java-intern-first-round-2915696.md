---
title: 来未来科技熙牛医疗Java后端实习一面
company: 来未来科技（熙牛医疗）
position: Java后端开发实习
round: 一面
date: '2026-09'
source: 牛客网
tags: ["Java","JVM","Redis","Spring","MySQL","微服务"]
summary: "来未来科技（熙牛医疗）Java后端实习一面面经。围绕实习项目追问：OOM排查、生产环境查看JVM变量与入参、乐观锁、Redis分布式锁重入与续期、线程池调优、Spring循环依赖、AOP失效场景、慢SQL及微服务交互。"
---

### 《面试题目》

1. 自我介绍 & 实习经历。
2. OOM 之后是怎么排查的？
3. 生产环境怎么查看 JVM 中的变量、请求入参？
4. 项目的乐观锁怎么用的？
5. Redis 分布式锁怎么实现重入和续期？
6. 线程池参数有哪些？怎么调优？
7. Spring 循环依赖是怎么回事？
8. AOP 失效的常规场景有哪些？
9. MySQL 有没有遇到慢 SQL？怎么处理？
10. 微服务之间怎么交互？
11. Dubbo 了解吗？
12. 用过哪些消息中间件？

### 《参考解析》

**OOM 排查**：第一原则是**保留现场**，启动参数加 `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/dump`，否则只能靠复现。线上流程：`jps -l` 找到 pid → `jstat -gcutil <pid> 1000 10` 看各区占用和 GC 频率（老年代持续 99%、Full GC 后不降就是内存泄漏）→ `jmap -histo:live <pid> | head -30` 看哪些类实例最多 → `jmap -dump:live,format=b,file=x.hprof <pid>` 导出 → MAT 看 Dominator Tree 和 Leak Suspects，重点排查无界集合/缓存不淘汰、ThreadLocal 未 remove、监听器未注销、大对象（一次查出百万行）、类加载器泄漏导致 Metaspace 涨。还要分清 OOM 类型：`Java heap space`（堆）、`GC overhead limit exceeded`（堆但 GC 无效）、`Metaspace`（动态代理/热部署）、`Direct buffer memory`（NIO 直接内存，`-XX:MaxDirectMemorySize`）、`unable to create new native thread`（线程数上限）。止血手段：重启 + 限流，根因靠 dump 分析。

**生产环境怎么看变量和入参**：首选 **Arthas**（阿里开源，attach 到运行中的 JVM）。常用命令——`sc -d 类名` 查类加载信息、`jad 类名` 反编译看线上真实代码、`watch 类名 方法名 '{params, returnObj, throwExp}' -x 3` 观察入参和返回值、`trace 类名 方法名` 看方法内部各调用耗时、`tt` 做请求的录制回放、`ognl` 读静态字段。其次：应用日志里用 traceId 串起入参（**必须脱敏**，手机号密码不能打）；APM（SkyWalking、Pinpoint）看链路和慢调用；`jcmd <pid> VM.system_properties`、`jinfo` 看启动参数；GC 日志配 `-Xlog:gc*`。注意生产**不允许**随便开远程 debug 端口（会挂起 JVM、有安全风险）。

**Redis 分布式锁的重入与续期**：自己实现的话，锁的 value 必须是「客户端唯一 id + 线程 id」，避免误删别人的锁，解锁用 Lua 保证「判断 + 删除」原子。**重入**用 Hash 结构：key 是锁名，field 是持有者标识，value 是重入次数；加锁时 field 已存在则 `HINCRBY +1`，解锁 `-1`，减到 0 再 `DEL`，整个过程用一段 Lua 脚本完成。**续期**用"看门狗"：加锁成功后注册一个定时任务，按 `leaseTime / 3` 的间隔检查业务是否还在执行，在跑就 `EXPIRE` 续到完整时长；进程宕机后看门狗随之停止，锁到期自动释放，不会死锁。生产上直接用 **Redisson 的 `RLock`**，`tryLock` 默认 leaseTime = -1 即启用看门狗（30s 租期、每 10s 续一次）。还要知道局限：主从异步复制下主节点宕机可能丢锁，要求强一致得用 RedLock 或换 etcd/ZooKeeper。

**线程池参数与调优**：七个参数——`corePoolSize`、`maxPoolSize`、`keepAliveTime`、`unit`、`workQueue`、`threadFactory`、`handler`。执行顺序是「核心线程 → 队列 → 扩到最大线程 → 拒绝策略」，这个顺序常被问。调优方法：先判断任务类型，CPU 密集型核心数设为 `N+1`，IO 密集型可到 `2N` 甚至更高，最终一定要靠压测确定；队列必须用**有界队列**（`ArrayBlockingQueue`），`Executors.newFixedThreadPool` 用无界 `LinkedBlockingQueue` 会 OOM，这是《阿里巴巴Java开发手册》明令禁止直接使用 Executors 的原因；拒绝策略选 `CallerRunsPolicy` 做背压降级，或自定义策略落库补偿；给线程起有意义的名字便于排查；监控 `activeCount`、`queue.size()`、`completedTaskCount`、拒绝次数并告警；用 `ThreadPoolExecutor` 构造函数显式创建。

**Spring 循环依赖**：指 A 依赖 B、B 又依赖 A。Spring 用**三级缓存**解决单例的字段/setter 注入：一级 `singletonObjects`（成品）、二级 `earlySingletonObjects`（半成品）、三级 `singletonFactories`（`ObjectFactory`，用于在需要时提前生成 AOP 代理）。流程是：创建 A 时先把 A 的工厂放进三级缓存 → 填充属性时发现依赖 B → 去创建 B → B 填充属性时从三级缓存拿到 A 的早期引用（必要时生成代理）放进二级缓存 → B 创建完成 → A 继续填充完成。要注意：**构造器注入的循环依赖无法解决**（对象还没实例化就要求依赖）、prototype 作用域的循环依赖无法解决、Spring Boot 2.6 起默认 `spring.main.allow-circular-references=false`，遇到就直接启动报错。与其依赖三级缓存，不如从设计上打破循环（抽第三个类、用 `@Lazy` 延迟注入、事件解耦）。

**AOP 失效的常见场景**：①**同类内部自调用**（`this.method()`）不走代理，是最常见的坑，解法是拆类、注入自身或 `AopContext.currentProxy()`；②方法不是 `public`（JDK 动态代理基于接口，CGLIB 也无法代理 private/final/static 方法）；③对象不是 Spring 容器管理的 Bean（自己 `new` 出来的）；④类是 `final` 或方法是 `final`，CGLIB 无法继承；⑤切点表达式没匹配上（包名、注解、参数不匹配）；⑥`@Transactional` 默认只对 `RuntimeException` 回滚，捕获异常没抛出、或异常被 `catch` 吞掉导致不回滚；⑦在同一个事务方法内调用另一个事务方法（传播行为不生效）；⑧异步/多线程中调用，事务上下文不传递。

**慢 SQL 的处理**：先发现——开 `slow_query_log`（`long_query_time=1`）配合 `pt-query-digest` 或 `performance_schema.events_statements_summary_by_digest` 排 Top SQL。再分析——`EXPLAIN` 看 `type`（出现 `ALL`/`index` 全扫是重点）、`key`、`rows`、`filtered`、`Extra`（`Using filesort`、`Using temporary`）。优化手段按性价比排序：①加合适的联合索引（遵循最左前缀，尽量做覆盖索引减少回表）；②改写 SQL——避免索引列上的函数和隐式类型转换、大分页改游标、`OR` 改 `UNION ALL`、子查询改 `JOIN`、只查需要的列；③减少回表/减少扫描行数、去掉 `SELECT *`；④大表结构变更用 `gh-ost`/`pt-online-schema-change`；⑤架构层做读写分离、加缓存、冷热数据归档、分库分表。最后一定要有回归验证：优化前后对比执行计划与耗时。

**微服务交互与中间件**：同步交互用 REST（HTTP/JSON，通用、易调试）或 RPC（Dubbo、gRPC，长连接 + 二进制协议，性能高、强类型）；异步交互用消息队列解耦。一套完整的微服务体系还包括注册中心（Nacos、Eureka、ZooKeeper）、配置中心、负载均衡、网关（Spring Cloud Gateway）、熔断限流降级（Sentinel、Hystrix）、分布式链路追踪（SkyWalking）、分布式事务（Seata 的 AT/TCC/Saga 模式）。**Dubbo** 的核心是「接口即契约」：消费方持有接口的代理，通过注册中心发现提供者，走自定义的二进制协议 + Netty 长连接调用，支持多种负载均衡策略与集群容错（Failover/Failfast/Forking），并可通过 SPI 扩展 Filter 做鉴权、限流、埋点。消息中间件选型：Kafka（吞吐最高，日志与流处理）、RocketMQ（事务消息、延迟消息、顺序消息，电商场景多）、RabbitMQ（AMQP，路由灵活，中小规模）、Pulsar（存算分离，多租户）。

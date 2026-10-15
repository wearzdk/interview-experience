---
title: "卓望安全开发一面：SpringBoot 与 JVM 调优问答"
company: "卓望"
position: "安全开发工程师"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/ac5b785974e04f188b8201b72123411f
tags: ["卓望","安全开发","SpringBoot","Java","线程池","MyBatis","MySQL锁"]
summary: "卓望安全开发工程师一面，约 23 分钟：从 AES 加密问到 SpringBoot 加载顺序与静态资源加载、序列化接口要实现什么、MySQL 索引为什么失效、OOM 调优与 jstack 用法、SpringBoot 从 Tomcat 迁移到其他容器的参数调整、Java 线程池种类、MyBatis 中 # 与 $ 的区别、外部接口对接流程与凭证获取，以及两个线程同时输出和 MySQL 表锁场景；作者自评答得很糟、觉得基本凉了。"
---

### 《面试题目》

1. 介绍下自己。
2. 说下 AES 的相关内容。
3. 说下 SpringBoot 的加载顺序。
4. 说下 SpringBoot 静态加载。
5. 序列化接口要实现什么？
6. 说下 MySQL 索引为什么会失效。
7. OOM 怎么调优？jstack 怎么写、怎么看输出内容？
8. SpringBoot 想从 Tomcat 迁移到其他容器，需要注意什么参数调整？
9. Java 线程池有哪几种？
10. MyBatis 中 # 和 $ 有什么区别？
11. 你有对接过外部接口吗？对接外部接口的流程是什么、需要注意哪些内容、使用到什么协议、请求具体怎么构成？凭证怎么获取，获取凭证用了哪些参数？
12. 现在有两个线程，需要它们执行完成后同时 print 一个东西，怎么写？
13. MySQL 什么情况下会是表锁？

### 《参考解析》

**AES 这道题要答出「算法本身没问题，用错模式才是事故」。** AES 是对称分组密码，分组固定 128 位，密钥长度 128/192/256 位，安全性靠轮函数的混淆与扩散，不是靠保密算法。工程上关键在模式与填充的选择：ECB 相同明文出相同密文、会泄露结构，任何场景都不该用；CBC 需要随机且不可预测的 IV、且不提供完整性；推荐 AEAD 模式如 GCM，一次解决加密与完整性校验。要主动提几个实战要点：IV/nonce 每次加密都要新生成且随密文一起存（不要用固定 IV）；密钥不能硬编码在代码或配置仓里，要走 KMS 或密钥管理服务并支持轮换；不要用「加密当作签名」；对同一密钥的加密量要控制（GCM 的 nonce 重用会直接导致密钥流复用而失去安全性）。如果对方问「国密怎么选」，可以补一句 SM4 的定位与 AES 相同。

**SpringBoot 的加载顺序与自动配置是同一件事的两面。** 启动从 `SpringApplication.run` 开始：准备 Environment（读配置、命令行参数、profile）→ 创建 ApplicationContext → 执行 `refresh`（BeanFactory 后置处理器、Bean 定义加载、`BeanPostProcessor` 注册、实例化单例、`onRefresh`）→ 调用 `ApplicationRunner`/`CommandLineRunner` → 发布 `ApplicationReadyEvent`。自动配置的加载顺序由 `@AutoConfigureOrder`、`@AutoConfigureBefore/After` 和条件注解（`@ConditionalOnClass`、`@ConditionalOnMissingBean` 等）决定，配置类清单在 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（2.7 之前是 `spring.factories`）里，用户自定义的 Bean 通常因为「后注册且带 `@ConditionalOnMissingBean`」而优先。至于「静态加载」，如果面试官指的是静态资源，那答案在 `ResourceHttpRequestHandler` 与 `WebMvcAutoConfiguration` 指定的 classpath 静态目录（`/static`、`/public`、`/resources`、`/META-INF/resources`）；如果指的是打包方式，则是 `spring-boot-maven-plugin` 把依赖打进 fat jar 并由自定义类加载器 `LaunchedURLClassLoader` 加载。遇到这种题不要急着答，先确认对方问的是「静态资源」还是「静态加载 / 打包」，澄清本身就是加分项。

**序列化的规范答法是「标记接口 + 版本号 + 自定义读写」。** Java 里实现 `java.io.Serializable` 即可被默认序列化，它本身没有任何方法，是标记接口；要点包括：显式声明 `private static final long serialVersionUID`（否则类一改动反序列化就报 `InvalidClassException`）、`transient` 字段不参与序列化、静态字段不参与、父类不可序列化时需要子类自己负责其状态（父类要有无参构造）。要自定义逻辑就写 `writeObject`/`readObject`（方法签名固定，靠反射调用），或者实现 `Externalizable` 自己控制全部字段（代价是必须有无参构造函数）。安全视角的追问值得主动展开：原生反序列化是历史漏洞重灾区（gadget chain），能用 JSON/Protobuf 就不要用 Java 原生序列化；必须用时要上白名单过滤与 `ObjectInputFilter`。

**索引失效与表锁是 MySQL 的两道经典题，都要按「优化器怎么选」来讲。** 索引失效的典型场景：列上做函数或表达式运算（`where date(create_time)=...`）、隐式类型转换（字符串列传数字）、前导模糊 `like '%x'`、联合索引不满足最左前缀、`or` 前后只有一边有索引、`!=` 与 `not in` 导致优化器判定全表更快、以及区分度太低时优化器主动放弃索引。要注意「失效」不等于「一定不走索引」——最终由优化器按成本估算决定，`EXPLAIN` 里的 `type` 与 `key` 才是事实。至于什么时候是表锁：MyISAM 只有表锁；InnoDB 在没有合适索引可用、条件无法定位行时会退化成锁全表（或锁大量行），`LOCK TABLES` 显式加表锁，DDL 会加元数据锁（MDL）阻塞读写，另外表级意向锁（IS/IX）不阻塞行操作但会与表锁互斥。核心结论是「InnoDB 的行锁是加在索引上的」，所以给查询条件建好索引既能提速也能降低锁范围。

**OOM 调优的答法是「先分类，再取证据，最后才是改参数」。** 先判断是哪种 OOM：堆溢出（`Java heap space`，多半是对象泄漏或缓存无上限）、元空间溢出（动态生成类过多）、GC 开销超限（内存不足且回收无收益）、直接内存或本地内存溢出（NIO、Netty）、还是线程创建失败。取证手段：`-XX:+HeapDumpOnOutOfMemoryError` 拿堆快照后用 MAT 看支配树与大对象引用链；`jstat -gcutil <pid> 1000` 看各代使用率与 GC 次数耗时；`jmap -histo:live` 看对象分布。jstack 的用法是打印线程栈（`jstack <pid> > stack.txt`，必要时 `-l` 附带锁信息、`-F` 强制），看三样东西：CPU 高的线程在跑什么（配合 `top -H -p <pid>` 把线程 ID 转十六进制再在栈里找 `nid`）、有没有大量线程卡在同一把锁上（deadlock 报告会直接打印）、有没有线程池队列堆积。真正的调优动作顺序是「先修代码（无界缓存、未关闭的资源、大对象、频繁创建），再选收集器（G1/ZGC 降停顿），最后才是调堆与分代比例」。只会背 `-Xmx` 的参数是拿不到分的。

**换 Servlet 容器与线程池、MyBatis 的符号题都属于「框架细节见功力」。** 从 Tomcat 换 Jetty 或 Undertow：starter 里要排除 `spring-boot-starter-tomcat` 再引入 `spring-boot-starter-undertow`/`jetty`，配置前缀从 `server.tomcat.*` 换成 `server.undertow.*`；要注意 `max-http-header-size`、连接数、工作线程数、`maxSwallowSize`（请求体丢弃大小）这些参数在两边名字与默认值不同；协议层面要复查 WebSocket、`Transfer-Encoding`、AJP 与 `X-Forwarded-*` 头解析的差异；打包方式如果原来是 war 部署，换成内嵌容器后要改启动类与打包插件。Java 线程池按 `Executors` 的预制工厂有 `newFixedThreadPool`、`newCachedThreadPool`、`newSingleThreadExecutor`、`newScheduledThreadPool`、`newSingleThreadScheduledExecutor`，以及 JDK 21 起的虚拟线程执行器；必须补一句「生产上建议直接 `new ThreadPoolExecutor` 显式指定有界队列与拒绝策略」，因为 `newFixedThreadPool` 用无界队列会 OOM、`newCachedThreadPool` 的线程数上限是 Integer.MAX_VALUE。MyBatis 的 `#{}` 是预编译占位符（`PreparedStatement` 的 `?`，参数按类型安全绑定，防 SQL 注入），`${}` 是字符串拼接（直接拼进 SQL 文本，仅适合表名、列名、`order by` 这类无法参数化的位置，且必须对输入做白名单校验）——安全岗问这题基本就是在确认你知不知道注入风险。两个线程同时输出用 `CyclicBarrier` 更贴题（可重用、await 到齐后一起执行），`CountDownLatch` 是「等 N 个事件完成」的一次性倒计时，`CompletableFuture.allOf(...).thenRun(...)` 是异步编排的现代写法；答清楚「谁等谁」以及三者能否重用，比写出代码更重要。外部接口对接按「鉴权 → 请求 → 幂等 → 容错 → 可观测」五段讲：先确认鉴权模型（OAuth2 client_credentials、AK/SK 签名、mTLS、JWT），拿凭证常用参数是 appId/appKey/timestamp/nonce 加签名；请求构成要说清 method、URL、headers（trace-id、Content-Type）、body 编码、超时与重试；工程上补幂等键、限流熔断、失败重试的退避策略、对账与告警。答的时候最好举一个真实对接过的接口，把「签名串怎么拼」这种细节讲出来，可信度立刻不同。

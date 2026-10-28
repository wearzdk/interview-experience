---
title: 深圳科皓南昌分公司线下面：笔试即面，两位面试官分头问项目与后端基础
company: 深圳科皓
position: Java 后端开发
round: 一面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/fa26d1c0b73f4623ab7bad125e9a8ac2
tags: ["Java","SpringBoot","SpringCloud","线下面试","笔试"]
summary: "深圳科皓南昌分公司线下面：先做一套 Java 基础 + Spring Boot + Spring Cloud 笔试题，交卷即面，一位面试官专问项目经验，另一位按笔试卷面追问后端基础，整体难度不大、反馈很快。"
---

### 《面试题目》

1. 请介绍一下你的项目经验（一位面试官专问项目）。
2. 后端基础现场追问：按笔试卷面逐题展开，范围覆盖 Java 基础、Spring Boot、Spring Cloud（另一位面试官负责）。

### 《参考解析》

**这场面试的流程特点**：笔试和面试是连着的，交卷不隔天，所以笔试的每一道题都要能讲出"为什么"，而不只是选对答案——面试官会拿着卷子回头问。两位面试官分工明确，一位挖项目、一位挖基础，准备时两条线要分开练：项目部分要求能在 3 分钟内讲清背景、你的职责、技术选型和结果；基础部分要求每个知识点能从一个具体问题延伸出去（比如从 HashMap 讲到扩容、并发、红黑树转换）。

**Java 基础的高频落点**：集合（ArrayList 与 LinkedList 的取舍、HashMap 的扩容与树化、ConcurrentHashMap 的分段/CAS）、并发（线程池七个参数与拒绝策略、synchronized 与 Lock 的区别、volatile 的可见性与有序性）、JVM（内存区域、GC 分代与常见收集器、类加载双亲委派）、异常与泛型（受检异常的设计取舍、类型擦除带来的坑）。答题时最好带一句"什么场景下会踩坑"，比背定义更像做过项目。

**Spring Boot 的考察角度**：自动配置的原理（`@SpringBootApplication` 三个注解、`spring.factories`/`AutoConfiguration.imports`、条件注解 `@ConditionalOnClass` 等）、配置加载顺序与 profile、Bean 的生命周期与循环依赖的三级缓存、AOP 的代理方式与失效场景（同类内部调用不走代理）、事务传播行为与 `@Transactional` 失效的几种情况（非 public、自调用、异常被吞、多数据源）。

**Spring Cloud 的组件脉络**：服务注册与发现（Nacos/Eureka）、配置中心、远程调用（OpenFeign，含超时、重试、熔断降级 Sentinel/Resilience4j）、网关（Spring Cloud Gateway 的路由与过滤器）、负载均衡、链路追踪。面试常问的是"你这个组件解决了什么问题、去掉它会怎样"，以及分布式事务（Seata 的 AT/TCC/SAGA 各自适用场景）和幂等设计。答的时候把组件放回一次真实请求的链路上讲，比逐个背名词清楚得多。

**项目介绍的框架**：背景一句话（什么业务、什么规模）→ 你的角色与负责模块 → 技术难点与选型理由 → 量化结果（QPS、耗时、故障率、人力节省）→ 复盘（哪里还能做得更好）。面试官追问时通常会往"为什么这么选""出过什么故障""如果流量翻十倍怎么办"三个方向走，提前准备这三个答案基本就稳了。

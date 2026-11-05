---
title: "一天四面记录：平安科技、启云方、招商银行、平安好医生外包"
company: 多家公司
position: Java 后端与前端开发
round: "多场"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/1a412891f78b40409373aab88c020831
tags: ["外包","Java","前端","SpringBoot","ConcurrentHashMap","JVM","微服务","面经"]
summary: "11 月 5 日一天四场外包面试：平安科技银行外包只问项目没有八股；启云方外包问 JS 事件循环、React Hooks、useEffect 与 useLayoutEffect 顺序、Vue 双向绑定与 Proxy、HashMap 线程安全、SpringBoot 启动类；招商银行外包问 JSON 处理、JVM 异常、类设计原则、线程池、索引与微服务排查；平安好医生外包问 SpringBoot 启动流程、内存泄漏与 CPU 高排查。"
---

### 《面试题目》

1. 平安科技（银行外包，深圳大剧院）：介绍项目，前端后端都问，没有八股。
2. 启云方（外包）：JS 的循环机制是什么？
3. React Hooks 有哪些？`useEffect` 和 `useLayoutEffect` 哪个先执行？
4. Vue 双向绑定的原理？Proxy 监听了什么？
5. 后端：HashMap 线程安全吗？ConcurrentHashMap 为什么安全？
6. SpringBoot 启动用了哪些类？
7. 招商银行（外包）：Java 的 JSON 是用什么处理的？
8. JVM 如何处理异常？
9. Java 类设计原则有哪些？
10. 线程池用的是什么组件？
11. 数据库索引如何建立？索引失效如何处理？
12. 数据库表如何建立？数据库怎么同步？
13. 线上如何处理异常？
14. 有三个服务，其中一个接口报错了，你怎么快速判断是哪一个服务上的？
15. 有几个微服务的数据，如何同步？
16. 平安好医生（外包）：SpringBoot 启动流程？
17. 内存泄漏如何判断哪里出错？
18. CPU 比较高如何排查？

### 《参考解析》

**一天四场的节奏与外包面试的特点**：外包岗位的面试通常由驻场甲方或项目组把关，时长 20~30 分钟，题目偏「能不能马上上手」，八股深度低于自研岗，但会直接问框架与排查。四场里两场没开摄像头、一场迟到十分钟仍继续，说明流程相对宽松，但评价仍看表达与项目匹配。准备时把「项目一句话讲清 + 三个技术点能展开」做扎实，比刷难题有效。

**JS 事件循环与 Hooks 顺序**：同步代码执行完清空微任务队列，再取一个宏任务，如此循环；`Promise.then`、`queueMicrotask`、`MutationObserver` 是微任务，`setTimeout`、`setInterval`、I/O、UI 渲染属于宏任务侧。`useLayoutEffect` 在 DOM 变更后、浏览器绘制前同步执行，`useEffect` 在绘制后异步执行，所以布局测量要用前者，数据请求与订阅用后者。

**Vue 双向绑定与 Proxy**：`v-model` 是语法糖，本质是 `:value` 加 `@input`；响应式由 Proxy 拦截 get/set 实现。Proxy 监听的是整个对象的操作——读取（track 依赖）、写入（trigger 更新）、`deleteProperty`、`has`、`ownKeys` 等，所以新增与删除属性、数组索引赋值都能被感知。

**HashMap 与 ConcurrentHashMap**：HashMap 非线程安全，并发扩容可能导致数据覆盖或链表成环（1.7）；ConcurrentHashMap 在 1.8 用 CAS 插入空桶、`synchronized` 锁桶头节点，锁粒度细，扩容支持多线程协同迁移，size 用 `baseCount` 加 `CounterCell` 分散计数。

**SpringBoot 启动与 JVM 排查**：启动流程是 `SpringApplication.run` → 准备环境（`ConfigurableEnvironment`）→ 创建 `ApplicationContext` → 加载 `@Configuration` 与自动配置（`@EnableAutoConfiguration` 读 `spring.factories` / `AutoConfiguration.imports`）→ 刷新容器（实例化 Bean、执行 `BeanPostProcessor`）→ 启动内嵌容器 → 发布 `ApplicationReadyEvent`。内存泄漏用 `jmap` 取堆转储、MAT 或 VisualVM 分析支配树，结合 GC 日志看老年代增长；CPU 高用 `top -Hp` 找线程、`jstack` 抓栈对照 `nid`，看是死循环、频繁 GC 还是锁竞争。

**微服务排查与数据同步**：三个服务其中一个接口报错，先看网关/调用链追踪（Trace ID）定位失败节点，再看该服务的日志与健康检查、依赖的下游与数据库连接；没有链路追踪时按「入口日志 → RPC 调用日志 → 下游响应」逐段比对。微服务数据同步常用「业务库 binlog + CDC 投递到消息队列 + 各服务幂等消费」，或走统一数据服务；要说明一致性方案（本地消息表、事务消息、对账补偿）。

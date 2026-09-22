---
title: 招银云创Java后端二面面经（项目+故障排查）
company: 招银云创
position: Java后端开发
round: 二面
date: '2026-09'
source: 牛客网
tags: ["Java","设计模式","注解","数据库连接池","故障排查","模型路由"]
summary: "招银云创后端开发二面面经，9月22日面试。项目追问为主：框架选型、大模型底座与模型路由；八股集中在设计模式消除if-else、注解原理、数据库连接失败排查思路与数据库内存占用高的原因。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 讲一下项目，你的工作内容是什么？都是你自己做的吗？
3. 项目用的是什么框架？为什么选它？
4. 项目的底层模型用的是什么？模型路由是怎么做的？
5. 对设计模式了解吗？消除大量 if-else 分支用什么？
6. 你怎么理解注解？
7. 线上系统频繁出现数据库连接失败，请说一下故障排查思路和可能原因。
8. 数据库内存占用高，可能的原因是什么？
9. 谈谈你的优点和缺点。
10. 为什么选择我们公司、选择这个 base？

### 《参考解析》

**消除大量 if-else**：第一反应要给「策略模式 + 工厂/注册表」，而不是硬写 `switch`。Java 里的落地形态通常有三种：①`Map<String, Handler>` 注册表，Spring 启动时把所有 `Handler` 实现按 `@Component` 注入进来，用 `handlerMap.put(handler.getType(), handler)` 建索引，调用时一次查表，把分发从 O(n) 的判断变成 O(1)；②枚举 + 函数式接口，把小段逻辑直接挂在枚举上；③流程本身有先后顺序和条件跳转时，用**责任链**（`List<Validator>` 依次 `filter`）或**状态机**（Spring StateMachine、Cola StateMachine），状态迁移按表驱动。判断标准是：分支维度单一时用策略+Map，多个条件组合时用规则引擎或状态机，别为了消灭 if 而过度抽象。

**注解的本质**：注解是一个继承自 `java.lang.annotation.Annotation` 的接口，编译器为它生成动态代理实现；`@Retention` 决定生命周期（`SOURCE` 只在编译期、`CLASS` 进 class 文件但运行时不保留、`RUNTIME` 才能反射读到），`@Target` 决定可标注的位置。注解本身**没有任何行为**，行为来自读取它的框架代码：Spring 在启动时扫描候选 Bean，通过 `AnnotationConfigUtils` 注册 `AutowiredAnnotationBeanPostProcessor`、`CommonAnnotationBeanPostProcessor` 等后置处理器，在 Bean 实例化后反射读取字段/方法上的注解并注入或生成代理；`@Transactional` 则是 `InfrastructureAdvisorAutoProxyCreator` 匹配到方法后创建代理。所以"注解生效"必须满足：`RUNTIME` 保留 + 有框架在处理它 + 目标对象在容器里。

**线上数据库连接失败排查**：先看异常类型分叉——`Connection refused` 是网络/端口/DB 没起，`Communications link failure` 和 `connection reset` 多是连接被中途掐断，`Too many connections` 是连接数打满，`wait millis xxx, active x` 是连接池等不到连接。排查顺序：①应用侧看连接池指标（HikariCP 的 `active/idle/waiting`、Druid 监控页），先判断是**漏**还是**堵**——连接泄漏（异常分支没 close、事务没提交）表现为 active 长期等于 maxPoolSize 不回落，突发流量表现为等待队列暴涨；②DB 侧 `SHOW PROCESSLIST`、`SHOW STATUS LIKE 'Threads_connected'`、`SHOW VARIABLES LIKE 'max_connections'`，看是不是服务端把连接掐了；③最经典的坑是 **MySQL `wait_timeout`（默认 8 小时）小于连接池 `maxLifetime`**，池子里留着已被服务端关闭的空闲连接，一用就报错——把 `maxLifetime` 配成比 `wait_timeout` 小几十秒，并开 `keepaliveTime`/`validationQuery` 保活；④再往外查网络（防火墙空闲连接回收、VIP 漂移、DNS、K8s Service 的 conntrack 表满）。止血手段：临时调大 `max_connections`、重启应用、限流降级，根因还是要靠连接池参数 + 监控 + 超时重试。

**数据库内存占用高**：先分清是"正常占用"还是"异常膨胀"。InnoDB 的 buffer pool 本来就该吃掉物理内存的 50%~70%，这是设计如此，不算故障。真正要排查的方向有：①连接数过多——每个连接都会分配 `sort_buffer_size`、`join_buffer_size`、`read_buffer_size` 等会话级内存，连接数一上去就成倍放大；②大查询在做排序/哈希 join，触发 `tmp_table_size`/`max_heap_table_size` 超限后落盘，同时内存尖峰；③慢 SQL 与全表扫描把大量页读进 buffer pool，把热数据挤出去（看命中率 `Innodb_buffer_pool_read_requests` 与 `_reads` 的比值）；④prepare statement 缓存、`performance_schema` 自身的开销；⑤版本级别的内存泄漏或碎片（`SHOW ENGINE INNODB STATUS`、`performance_schema.memory_summary_global_by_event_name`、`sys.memory_by_thread_by_current_bytes`）。处置：限流 + kill 掉异常会话，调小会话级 buffer、给慢查询加索引、必要时降 `innodb_buffer_pool_size` 并扩容。

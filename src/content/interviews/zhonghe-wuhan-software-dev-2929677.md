---
title: "中核武汉软件开发岗一面面经"
company: "中核武汉"
position: "软件开发"
round: "一面"
result: "进入体检"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/4b2f931400214b74acb4ffdd7fb76e64
tags: ["Java", "SpringBoot", "微服务", "场景题", "校招"]
summary: "中核武汉软件开发岗线下一面，10 到 30 分钟，问 SpringBoot 注解组成、两个项目问题，以及“文件解析服务与入库服务在下午两三点变卡”的场景排查。"
---

### 《面试题目》

1. 自我介绍。
2. SpringBoot 的八股：`@SpringBootApplication` 由哪些注解组成？
3. 介绍两个项目，并回答项目相关问题。
4. 场景题：两个微服务 A、B，A 负责接收文件并解析，B 负责入库，每天下午两三点很卡，可能是什么问题？怎么解决？

### 《参考解析》

**`@SpringBootApplication`** 是组合注解，核心是 `@SpringBootConfiguration`（本质上是 `@Configuration`）、`@EnableAutoConfiguration` 和 `@ComponentScan`。自动配置通过 `spring.factories` / `AutoConfiguration.imports` 加载候选配置类，再结合 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件决定是否生效；组件扫描默认从启动类所在包往下扫。回答时最好补一句：排除自动配置可以用 `exclude`，自定义 Starter 就是把依赖和自动配置类按这套机制装配起来。

**下午两三点变卡**先怀疑周期性外部因素，而不是先改代码：这个时间点是否有定时任务（对账、报表、全量同步）与文件解析撞车；数据库是否在做备份、统计或批量入库；上游是否集中上传大文件。技术侧按链路拆：A 的文件解析是否 CPU 打满、是否一次性把整个文件读进内存、线程池是否被长任务占满；B 的入库是否单条 insert、事务过大、锁竞争或慢 SQL；两者之间的调用是否同步阻塞、有没有超时和重试放大。

**解决思路**：把解析和入库解耦，文件落对象存储后发消息，B 按批消费并控制并发；大文件流式解析，避免 `readAllBytes`；入库用批量提交、按主键或业务键去重，长事务拆小；对定时任务做错峰和限流；加链路监控、线程池指标和慢 SQL 日志，先定位瓶颈再扩容。若确实是每天固定时段的外部批量任务，和业务方协商调度窗口往往比堆机器更有效。

---
title: "经纬恒润 Java 一面：MySQL 八股与 Spring Bean 生命周期"
company: "经纬恒润"
position: "Java开发"
round: "一面"
date: '2026-09'
source: "牛客网"
tags: ["Java","MySQL","MVCC","Spring","微服务","Docker"]
summary: "经纬恒润 Java 开发一面（9 月 24 日）几乎全程八股：MySQL 从索引结构、回表、联合索引问到 redo/undo log、MVCC、脏读与锁；随后连问 Spring Bean 生命周期、AOP 代理、自定义 Starter、Docker 与 CI/CD，几乎没聊项目。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. MySQL 的索引结构是什么？什么是回表？
3. 联合索引是什么？查询条件的顺序会影响索引的使用吗？
4. redo log 是怎么实现的？
5. undo log 是怎么实现的？
6. MVCC 的原理是什么？
7. 脏读是什么？怎么解决？
8. MySQL 有哪些常用的锁？原理是什么？
9. 实习项目里用过微服务吗？用过 Spring Cloud 吗？
10. Spring Bean 的生命周期是怎样的？
11. @SpringBootApplication 有什么作用？
12. Spring 的 AOP 代理是怎么实现的？
13. 项目里有自己写过 Spring Boot Starter 吗？
14. Docker 用过哪些命令？save 和 build 有什么区别？
15. 用过哪些 CI/CD 工具？

### 《参考解析》

**索引结构与回表**：InnoDB 的主键索引（聚簇索引）叶子节点直接存放整行数据，二级索引叶子节点只存索引列 + 主键值。用二级索引查询时，若 SELECT 的列不在索引里，就要拿叶子节点上的主键值回聚簇索引再查一次，这就是回表。减少回表的手段是覆盖索引（把需要返回的列都放进联合索引）、以及尽量避免 `SELECT *`。这也是「联合索引列的顺序怎么放」常被和回表一起问的原因——顺序决定了能否只靠索引把结果取完。

**联合索引与最左前缀**：联合索引 `(a,b,c)` 实际是按 a、再 b、再 c 排序的一棵 B+ 树，因此只有从最左列开始连续匹配才能用上索引；`WHERE a=? AND c=?` 只能用到 a 那一层。查询条件写的先后顺序不影响是否走索引（优化器会重排），但 `a` 的范围查询会让后面的列失去定位能力（只能做覆盖判断或挨个过滤）。范围条件、`LIKE '%x'`、对索引列做函数/隐式类型转换，都会让后面的列失效——这题要答出「顺序不变的是书写顺序，变的是能否用上后续列」。

**redo log 与 undo log**：redo log 是物理逻辑日志，记录「某个数据页做了什么修改」，采用 WAL 先写日志再刷脏页，配合循环写的 ib_logfile 与 checkpoint，保证崩溃后已提交事务的修改不丢（持久性）。undo log 是逻辑日志，记录反向操作（插入对应删除、更新对应改回旧值），用于事务回滚和 MVCC 读旧版本。两者的分工要讲清：redo 面向「系统崩溃恢复」，undo 面向「语句/事务回滚 + 一致性读」，redo 是循环覆盖写，undo 由 purge 线程按需清理。

**MVCC 与脏读**：MVCC 靠三样东西实现——每行隐藏的 `DB_TRX_ID`、`DB_ROLL_PTR` 和 undo 版本链，加上 ReadView（记录当前活跃事务 ID 集合）。读数据时沿版本链找到「对当前 ReadView 可见」的版本。RC 隔离级别每次 SELECT 都新建 ReadView，所以能读到别人已提交的新数据（可能不可重复读）；RR 只在第一次读时建一次，因此可重复读。脏读是读到别的事务未提交的修改，InnoDB 任何隔离级别下都不会出现，因为读的都是已提交版本或快照；要防的其实是不可重复读和幻读，前者靠 RR 快照、后者靠间隙锁（next-key lock）。

**MySQL 的锁**：按粒度分表锁、行锁；行锁又有记录锁、间隙锁、临键锁（记录锁 + 间隙锁），RR 下 InnoDB 用临键锁在范围查询时防幻读。按模式分共享锁（S）与排他锁（X），还有意向锁（IS/IX）用于表级与行级锁的快速冲突判断。此外要区分乐观锁（版本号/CAS，应用层实现）与悲观锁（`SELECT ... FOR UPDATE`）；MDL 元数据锁在 DDL 时会挡住并发读写，也是线上常见的锁等待来源。回答时把「粒度 + 模式 + 加锁时机」三层讲全，比只背锁名字更得分。

**Bean 生命周期与 @SpringBootApplication**：Bean 的生命周期大致是：实例化 → 属性填充（依赖注入）→ Aware 接口回调（BeanNameAware、ApplicationContextAware）→ BeanPostProcessor 前置处理 → `@PostConstruct` / InitializingBean.afterPropertiesSet / init-method → BeanPostProcessor 后置处理（AOP 代理通常在这里织入）→ 使用 → 销毁回调（`@PreDestroy` / DisposableBean）。`@SpringBootApplication` 是三个注解的组合：`@SpringBootConfiguration`（本质是 `@Configuration`）、`@EnableAutoConfiguration`（通过 spring.factories / AutoConfiguration.imports 加载自动配置类并按条件装配）、`@ComponentScan`（默认扫主类所在包及子包）。回答时最好点出「自动配置是加了一堆 `@ConditionalOnClass` 之类的条件，不是无脑全加载」。

**AOP 代理的两种实现**：Spring AOP 用运行期代理。目标类实现了接口时默认用 JDK 动态代理（基于 `InvocationHandler`，只能代理接口方法）；没有接口时用 CGLIB 生成子类（不能代理 final 类与 final 方法）。Spring Boot 2.x 起默认 `proxyTargetClass=true`，即无脑走 CGLIB。切面逻辑被包在方法调用链上，因此同类内部方法自调用不会走代理（常见坑，解决办法是注入自身或拆类）；另外环绕通知里的异常处理、事务的传播行为与代理层级也是高频追问点。

**自定义 Starter 与 Docker / CI-CD**：写一个 Starter 的套路：新建模块，放一个 `@Configuration` 配置类 + `@ConfigurationProperties` 参数类（用 `@EnableConfigurationProperties` 或 `@Component` 注册），把自动配置类写进 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（Boot 2.7 之前是 `spring.factories`），再用 `@ConditionalOnMissingBean` 留出覆盖口，外部只引依赖就能生效。Docker 这边，`docker build` 是照 Dockerfile 构建镜像，`docker save` 是把已有镜像导出成 tar 文件（配 `docker load` 用），一个是「造」一个是「打包搬运」，别混。CI/CD 工具答 Jenkins、GitLab CI、GitHub Actions 时，最好能说出自己跑过的具体流水线步骤（构建、单测、镜像推送、部署），把工具名落到流程上。

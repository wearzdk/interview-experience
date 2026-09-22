---
title: 浩鲸科技Java一面面经（基础八股为主）
company: 浩鲸科技
position: Java后端开发
round: 一面
date: '2026-09'
source: 牛客网
tags: ["Java","Redis","MyBatis","Spring","MySQL","缓存"]
summary: "浩鲸科技Java一面面经，题目偏基础：Redis缓存穿透与击穿、MyBatis参数选取与参数类型、Spring中Bean互相调用的方式、MySQL建索引为什么能加速查询，以及项目收获、全栈学习与加班出差等软性问题。"
---

### 《面试题目》

1. Redis 的缓存击穿和缓存穿透分别是什么？
2. MyBatis 的参数选取（`#{}` 与 `${}`）有什么区别？
3. MyBatis 的基本参数类型有哪些？
4. Spring 中如果一个 Bean 要调用另一个 Bean，可以怎么做？有哪些方法？
5. 为什么 MySQL 建了索引就能加快搜索？
6. 你的项目给你带来了什么？
7. 你觉得你的实习给你最大的收获是什么？
8. 如果未来你做全栈开发，你会怎么学习前端技术？
9. 你对加班和出差怎么看？
10. 最长能接受多久的出差？

### 《参考解析》

**缓存穿透 vs 缓存击穿**：穿透是"查一个数据库里根本不存在的数据"，缓存永远不命中，请求全部落到 DB 上，常见于恶意用不存在的 id 刷接口。解法：①布隆过滤器在入口拦掉不存在的 key；②把空结果也缓存起来并给一个短 TTL（比如 60 秒）；③入参做合法性校验（id 范围、格式）。击穿是"某一个热点 key 恰好过期"，这一瞬间大量并发请求同时穿透到 DB。解法：①分布式互斥锁/单飞（`SETNX` 拿锁，只有拿到锁的线程去回源，其余等待或返回旧值）；②逻辑过期——value 里存过期时间戳但 Redis key 不设 TTL，发现逻辑过期就异步起一个线程去刷新，当前请求先返回旧值；③热点 key 预热 + TTL 加随机抖动，避免同一时刻集体过期（那就是雪崩了）。三者的区分要一句话讲清：穿透是数据不存在、击穿是单个热点 key 失效、雪崩是大量 key 同时失效。

**MyBatis 的 `#{}` 与 `${}`**：`#{}` 是 `PreparedStatement` 的占位符，最终编译成 `?`，由 `TypeHandler` 做类型处理，天然防 SQL 注入，能用就必须用；`${}` 是纯字符串替换，直接拼进 SQL，只在表名、列名、`ORDER BY`、`LIMIT` 这类不能参数化的位置使用，且值必须由后端白名单校验，绝不能接收前端原样传参。参数选取的具体写法：单个基本类型参数名可以随便写（`#{id}`、`#{value}` 都行）；多个参数要么用 `@Param("name")` 显式命名，要么用内置的 `param1/param2`（或 `arg0/arg1`）；传 POJO 直接写属性名，嵌套属性用 `#{user.addr.city}`；传集合/数组用 `<foreach collection="list" item="it" open="(" separator="," close=")">`，注意 `@Param` 名字要和 `collection` 对上。

**MyBatis 基本参数类型**：基本类型及其包装类（`int/Integer`、`long/Long`、`boolean`、`String`、`Date`、`BigDecimal`）、Map（`HashMap`，key 即占位符名）、POJO/JavaBean、集合与数组（`List`、`Set`、数组）。此外还有 `RowBounds` 分页参数和 `ResultHandler`。几条实战注意：`parameterType` 在 MyBatis 3 里基本可以省略（框架能推断）；传 `null` 值时如果数据库列类型需要，要显式写 `jdbcType`（如 `#{name,jdbcType=VARCHAR}`），否则 Oracle 会报无效列类型；类型映射靠 `TypeHandler`，自定义枚举/JSON 字段就实现一个自定义 `TypeHandler` 注册进去。

**Spring 中 Bean 调用另一个 Bean**：方式包括——①构造器注入（官方推荐，依赖不可变、便于单测、能暴露循环依赖）；②setter 注入；③字段注入 `@Autowired`/`@Resource`（写法最省事但不利于测试，`@Resource` 按名字、`@Autowired` 按类型）；④`ApplicationContextAware` 拿到容器后 `getBean()`（不推荐，属于服务定位器反模式）；⑤`@Lookup` 用于每次取新的原型 Bean；⑥`ObjectProvider`/`ObjectFactory` 做延迟或可选依赖。特别容易被追问的坑是**同类内部自调用不走代理**：`this.otherMethod()` 绕过了 AOP 代理，`@Transactional`、`@Async`、`@Cacheable` 全部失效。解法有把方法拆到另一个 Bean、注入自身（`@Autowired private XxxService self;`，Spring 4.3 起支持）、`AopContext.currentProxy()`（需 `@EnableAspectJAutoProxy(exposeProxy = true)`）。

**MySQL 索引为什么快**：InnoDB 用的是 B+ 树。①树矮：非叶子节点只存键值和页号，一页 16KB 能放几百上千个键，千万级数据树高也只有 3~4 层，一次点查最多 3~4 次磁盘 IO，而且根节点和上层页常驻 buffer pool，实际往往只有 1 次 IO；②叶子节点按顺序双向链表相连，把随机 IO 变成了顺序 IO，范围查询、`ORDER BY`、`GROUP BY` 可以直接顺着链表扫，不用额外排序；③聚簇索引的叶子节点直接存整行数据，命中主键就无需回表，普通索引需要"回表"再查一次主键树，所以能用**覆盖索引**（查询列都在索引里）就尽量用；④B+ 树始终平衡，查询代价稳定可预测。反过来说，索引不是越多越好——每个索引都要占空间、拖慢写入（INSERT 要维护所有二级索引），区分度低的列建了也没用。

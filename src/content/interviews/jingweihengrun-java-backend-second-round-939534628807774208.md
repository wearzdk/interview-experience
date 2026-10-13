---
title: "经纬恒润二面面经"
company: "经纬恒润"
position: "Java 后端"
round: "二面"
date: '2026-10'
result: "凉了"
source: 牛客网
sourceUrl: "https://www.nowcoder.com/discuss/939534628807774208"
tags: ["经纬恒润","Java","集合","MyBatis","SQL","二面","校招"]
summary: "经纬恒润 Java 后端二面面经：从自我介绍、offer 与籍贯，到 Java 基本数据类型与集合、队列操作、HashMap 遍历、MyBatis 动态 SQL、Controller 参数接收、自定义注解、接口与抽象类，以及口述 SQL 和期望薪资。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 目前有没有 offer？你是哪里人？
3. Java 的基本数据类型有哪些？
4. Java 整个集合的概念是什么？队列的基本操作有哪些？HashMap 怎么遍历？
5. MyBatis 动态数组的拼接 SQL 如何实现？
6. Controller 层可以使用哪些方法来接收前端传入的参数？
7. 自定义注解如何实现？
8. 接口和抽象类的区别是什么？
9. 给定表和要求，口述 SQL（共 4 题）。
10. 实习过程中的最大收获/提升是什么？
11. 反问环节。
12. 期望薪资是多少？

### 《参考解析》

**Java 基础与集合：答成一张体系图而不是零散结论。** 基本数据类型共八种：整数 byte/short/int/long、浮点 float/double、字符 char、布尔 boolean，要顺带说清各自的位数、默认值、包装类型以及自动装箱拆箱的坑。集合先给出「Collection 与 Map 两大支」的框架：List 有序可重复（ArrayList 数组、LinkedList 链表）、Set 去重（HashSet 哈希、TreeSet 有序）、Queue 的入队出队语义（offer/poll/peek 与 add/remove/element 的区别在于前者不抛异常而返回 null/false，Deque 还能当栈用）。HashMap 的遍历说全三种：entrySet（最常用，一次拿到键值）、keySet 加 get（多一次查找，不推荐）、Java 8 起的 forEach 或 stream；再补一句遍历中 remove 会抛 ConcurrentModificationException，删元素要用 iterator.remove 或 removeIf。

**MyBatis 动态 SQL：说清 <foreach> 与 #{}、${} 的差别。** 数组或集合拼 IN 条件的标准写法是用 `<foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>`，collection 名要与 Mapper 方法参数的 @Param 一致，数组默认名是 array、List 是 list。更常见的工程做法是用 `<if>` 与 `<where>`/`<trim>` 组合处理条件拼接，避免手写多余的 AND。安全上必须强调：取值用 #{}（预编译占位符，能防 SQL 注入），`${}` 是字符串直接替换，只有排序字段、表名这类无法参数化的位置才用，且必须做白名单校验。被追问「批量插入怎么写」时，可以给出 `<foreach>` 拼 values 的写法与 executor 用 BATCH 的取舍（单条 SQL 过长会撞 max_allowed_packet，批量提交则要自己控制事务与失败回滚）。

**Controller 接收参数的方式要能对着注解脱口而出。** 常见有：@RequestParam 接查询串或表单字段（可设 required、defaultValue），@PathVariable 接路径变量，@RequestBody 接 JSON 请求体并绑定到 DTO（配合 @Valid 做参数校验），@RequestHeader 与 @CookieValue 接头部与 Cookie，实体对象直接作为形参做字段自动绑定，MultipartFile 接文件上传，以及用 HttpServletRequest 读原始请求。再补一层实践经验：DTO 上做校验分组、日期与枚举用 @DateTimeFormat 或 Converter、集合参数用数组或 List 接收、@ModelAttribute 与 @RequestBody 不能混用。能顺手把全局异常处理（@RestControllerAdvice）和统一返回结构一起讲出来，会明显加印象分。

**自定义注解与接口、抽象类的区别属于「必须一次答对」的题。** 自定义注解用 @interface 声明，通过 @Target 限定作用位置、@Retention(RUNTIME) 保证运行时可反射读取、@Documented/@Inherited 控制文档与继承；只有 RUNTIME 才能被反射或 AOP 在运行时解析，具体逻辑仍要自己写在切面、拦截器或处理器里（比如实现 HandlerMethodArgumentResolver 或 AOP 环绕）。接口与抽象类的区别按四个维度答：成员约束（接口方法默认 public abstract、字段默认 public static final，Java 8 起可有 default/static 方法；抽象类可有实例字段、构造器与受保护成员）、继承（类单继承、接口多实现）、构造器（抽象类有、接口没有）、设计意图（接口是能力契约、抽象类是共享实现与模板方法）。答题最后补一句「优先用接口，需要复用实现时才用抽象类」会更完整。

**口述 SQL 是这场最可能拉开差距的环节。** 遇到「给定表和要求口述 SQL」，先把句式固定下来：这句话要解决什么问题、涉及哪几张表、怎么 JOIN、过滤与聚合在哪一层，然后按 SELECT–FROM–JOIN–WHERE–GROUP BY–HAVING–ORDER BY–LIMIT 的顺序念出来。常见题型与套路要提前背熟：分组取每组最大值（窗口函数 ROW_NUMBER 或自连接）、求没有被引用过的记录（LEFT JOIN 后判 NULL 或 NOT EXISTS）、去重计数（COUNT(DISTINCT)）、按时间聚合（DATE_FORMAT 或 DATE_TRUNC）、以及连续问题（用行号差分组）。念完别忘了补一句索引与性能考虑（是否走覆盖索引、WHERE 条件是否导致函数运算而失效），这往往是面试官接着追问的点。

**心态与收尾：二面简单不代表稳过，PPT 和期望薪资都要提前想好。** 作者复盘时提到这场整体简单、疑似 KPI 面，最后也没做自我介绍的 PPT，结果并不理想。可执行的经验是：无论面试看起来多随意，都要准备一页「我是谁 + 项目亮点 + 与岗位匹配点」的结构化材料，自我介绍与实习收获都能直接复用；问到期望薪资时给一个区间并说明依据（同城同岗水平、自己的实习与项目经历），不要只说「都可以」；反问环节问团队技术栈、新人培养与考核节奏，比问加班和薪资更得体。最后把自己的每次面试按「被问到的题 + 答得不好的题」记一份，二面这种基础题密集的场合，复盘一遍就能明显提分。

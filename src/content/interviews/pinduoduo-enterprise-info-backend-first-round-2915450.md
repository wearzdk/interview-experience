---
title: 拼多多企业信息化一面：八股很细加两道算法题
company: 拼多多
position: 企业信息化后端开发
round: 一面
date: '2026-09'
result: 一面已过
source: 牛客网
tags: ["Java","HashMap","线程池","ThreadLocal","JVM","慢查询","索引","算法题"]
summary: "拼多多企业信息化9月21日一面，未问项目而集中考八股，覆盖Spring Boot分层、HashMap底层与红黑树、线程池、ThreadLocal上下文、JVM参数与OOM排查、慢查询优化、索引选型，另有两道easy算法题。"
---

### 《面试题目》

1. Spring Boot 项目代码分层：controller、service、dao（po、vo），为什么这么分？
2. HashMap 底层，红黑树平衡问题，扰动哈希，线程安全的 Map
3. 多线程线程池参数，定时任务
4. ThreadLocal 传递上下文，解释 ThreadLocal
5. JVM 启动参数，排查 OOM
6. MySQL 慢查询优化：开启慢查询日志、设定慢查询标准、用 explain 锁定原因
7. 单列索引和联合索引
8. MySQL 的 char 和 varchar 区别，选型
9. Redis 作为中间件的作用，MQ 的作用，什么是分布式
10. 算法题：首尾调换 string 中的字母，会有其他符号，其他符号原地不动
11. 算法题：找到数组中最接近 k 的 x 个数字，数组已经排序

（作者备注：面试问得很细，很多会追问到具体命令和设置；因为没有深入的项目可问，就集中问八股，但又有很多生产环境的流程处理。命名要规范，参数命名含义要突出，写题时习惯性用 p、q 被提醒。）

### 《参考解析》

**Spring Boot 代码分层及理由**：典型分法是 controller（只做参数校验、权限与协议转换，不写业务逻辑）、service（业务编排与事务边界，接口与实现分离）、dao/mapper（数据访问，只关心 SQL 与持久化）、以及模型对象 entity/PO（数据库映射）、DTO（服务间传输）、VO（返回给前端的视图对象）。分层的价值是职责单一与依赖方向稳定（上层依赖下层，下层不感知上层），让业务逻辑可复用、可单测（service 层不依赖 HTTP），也让数据库结构变化被限制在 dao 与 PO 内。要补一句常见的进阶共识：小项目别过度分层，避免「controller → service → manager → dao」四层转发只做透传；模型对象的转换不要散落在各处，建议用 MapStruct 之类统一处理。

**HashMap 底层与扰动哈希**：见上文同类考点——数组 + 链表 + 红黑树，链表长度 ≥ 8 且容量 ≥ 64 时树化，退化阈值 6，默认容量 16、负载因子 0.75，容量保持 2 的幂以便用位运算取模。**扰动哈希**指 `hash(key)` 的实现：先取 key 的 `hashCode()`，再 `h ^ (h >>> 16)`，让高 16 位参与低位运算——因为寻址只用低几位（`hash & (n-1)`），如果直接用 `hashCode()`，高位差异会被丢掉，冲突概率上升；扰动一次后高位信息混入低位，分布更均匀，这也是「为什么容量必须是 2 的幂」这一设计的配套部分。红黑树的「平衡」指它通过变色与旋转（左旋/右旋）维持近似平衡：根和叶子（NIL）为黑、红节点不能相邻、任一节点到其叶子的所有路径黑高相同，从而保证最长路径不超过最短路径的两倍，操作稳定 O(log n)。线程安全的 Map 有 `ConcurrentHashMap`（推荐）、`Collections.synchronizedMap`（全表锁，性能差）和 `Hashtable`（遗留类，全表锁，已不推荐）。

**线程池参数与定时任务**：参数见前述七项与执行顺序、拒绝策略。定时任务在 Java 里主要有三条路：`ScheduledExecutorService`（`scheduleAtFixedRate` 按固定频率、`scheduleWithFixedDelay` 按固定间隔，注意任务抛异常会导致后续不再执行，必须 try-catch 兜住）；Spring 的 `@Scheduled`（配合 `@EnableScheduling`，默认单线程调度器，多个任务会互相阻塞，生产要自定义 `TaskScheduler` 的线程池大小）；分布式场景必须解决多实例重复执行的问题，方案是分布式锁（Redis `SETNX` + 过期时间 + Lua 续期）或专门的调度平台（XXL-JOB/ElasticJob），并保证任务幂等。要主动提两个坑：`scheduleAtFixedRate` 在任务耗时超过周期时会连续追赶执行；服务重启/发布可能导致同一时刻多个实例同时触发，所以要用「锁 + 幂等」双保险。

**ThreadLocal 与上下文传递**：`ThreadLocal` 是线程本地变量，每个 `Thread` 内部有一个 `ThreadLocalMap`（key 是 ThreadLocal 的弱引用，value 是强引用），所以每个线程读写互不干扰，本质是用空间换隔离。典型用途：保存用户身份/租户 ID/链路 traceId 这类请求上下文，避免在几十层方法签名里透传参数；也用于非线程安全的工具类（`SimpleDateFormat`）做线程封闭。三个必须知道的点：一是**内存泄漏**——key 是弱引用会被回收，value 是强引用却挂在 Thread 上，线程池里线程长期存活就会导致 value 无法回收，所以在 `finally` 里必须 `remove()`；二是**线程池污染**——线程复用时不清理会把上一个请求的上下文带给下一个请求；三是**跨线程不传递**——异步任务或 `CompletableFuture` 里拿不到，解决用 `InheritableThreadLocal`（只在 new Thread 那一刻拷贝，线程池场景失效）或阿里开源的 `TransmittableThreadLocal`（在任务提交时做快照，运行时回放），配合线程池装饰使用。

**JVM 启动参数与 OOM 排查**：常用参数分四类——堆与栈（`-Xms`/`-Xmx` 建议设相等，`-Xss` 线程栈大小，`-XX:MetaspaceSize`/`-XX:MaxMetaspaceSize`）、GC 相关（`-XX:+UseG1GC`、`-XX:MaxGCPauseMillis`、`-XX:SurvivorRatio`、`-XX:MaxTenuringThreshold`）、诊断（`-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/dump`、`-Xlog:gc*:file=gc.log:time,uptime`、`-XX:+ExitOnOutOfMemoryError` 让容器直接重启而不是僵死）、以及运行时（`-D` 系统属性、`-XX:+DisableExplicitGC`）。OOM 排查流程：确认类型（`Java heap space` / `Metaspace` / `unable to create new native thread` / `GC overhead limit exceeded` / `Direct buffer memory`）→ 看 GC 日志与 `jstat -gcutil` 判断是泄漏还是容量不足 → 分析 dump（MAT 看支配树、`jmap -histo:live` 看对象排行、定位 GC Roots 引用链）→ 定位到代码（常见是静态集合、缓存无上限、ThreadLocal 未清理、一次性大查询）→ 修复并加监控。进程还在但没 OOM 时用 `jstack` 看线程状态、`jcmd` 做各类诊断，这是线上常用的组合。

**慢查询优化全流程**：开 `slow_query_log = ON`、`long_query_time` 设业务可接受阈值（如 0.1～0.5s）、`log_queries_not_using_indexes` 视情况开（量大时噪音多），用 `pt-query-digest` 汇总排序；对目标 SQL 用 `EXPLAIN` 看 `type`（避免 `ALL`）、`key`（是否用对索引）、`rows`（扫描行数量级）、`Extra`（`Using filesort`/`Using temporary`/`Using index`）；整改方向包括建合适的联合索引、消除隐式类型转换与列上函数、避免 `SELECT *`、深分页改游标、子查询改 JOIN、把统计类查询异步化或缓存。验证要对比执行计划与 `Handler_read_*` 状态量。要能说出「`Using filesort` 不一定慢，但排序行数大时一定要优化」。

**单列索引与联合索引**：单列索引只覆盖一列，适合高区分度且独立过滤的列；联合索引把多列按顺序建成一棵索引树，遵循**最左前缀**原则——`(a,b,c)` 能支持 `a`、`a,b`、`a,b,c` 的过滤，`a` 上做范围查询后 `b,c` 无法继续用于定位（但能被索引下推用于过滤），而 `b` 或 `b,c` 单独的查询用不上。设计法则：把等值条件列放前面、范围条件列放后面、排序列跟着等值列；把高频查询的 `SELECT` 列都放进索引形成覆盖索引避免回表；一个高频联合索引往往能吃掉多个单列索引的需求，而索引越多写放大越严重，所以要定期用 `sys.schema_unused_indexes` 之类清理无用索引。

**char 与 varchar 的选型**：`char(n)` 是定长，不足部分用空格补齐（读取时尾部空格会被去掉），最大 255 字符；`varchar(n)` 是变长，用 1～2 字节记录实际长度，最大 65535 字节（还要减去行内其他列和长度前缀的占用）。`char` 的优点是定长、更新时不易产生碎片、定长索引查找略快；缺点是短内容也占满空间。选型规则：长度固定或近似固定的用 `char`（MD5、UUID 去横线后的 32 位、性别、状态码、国家代码），长度差异大的用 `varchar`（姓名、地址、备注）。注意字符集影响实际占用（utf8mb4 下单字符最多 4 字节，所以 `varchar(255)` 实际最多约 1020 字节），以及排序规则（`utf8mb4_general_ci` vs `unicode_ci`）和隐式转换问题（与数字比较会导致索引失效）。

**Redis、MQ 与「什么是分布式」**：Redis 的定位是内存数据结构服务，主要作用有缓存（降低 DB 压力，注意穿透/击穿/雪崩）、分布式锁（`SET key val NX PX` + Lua 保证原子释放）、计数器与限流（`INCR`、滑动窗口）、排行榜（ZSET）、会话共享（多实例登录态）、以及轻量消息（Pub/Sub、Stream，但可靠性不如专业 MQ）。MQ 的作用是异步、解耦、削峰（详见其他篇）。**分布式**指把一个系统按职责拆成多个可独立部署的进程/服务，通过网络协作对外提供统一能力，核心收益是可扩展、可容错、便于团队分工；代价是引入了网络不可靠、部分失败、数据一致性、分布式事务、链路追踪、服务治理等一整套复杂问题。回答时给一句判断标准会显得有思考：分布式不是目标而是手段，只有当单机容量或团队规模真的撑不住时才拆，否则单体 + 模块化往往更划算。

**算法题一：首尾调换字符串中的字母**：题意是把字符串中的字母按首尾顺序两两交换，非字母字符保持原位。思路是双指针：左右各找一个字母，交换后继续向中间收缩；非字母就跳过（注意跳过时不要越界）。时间 O(n)、空间 O(n)（字符串不可变时用字符数组或 StringBuilder）。

```java
public String swapLetters(String s) {
    char[] c = s.toCharArray();
    int i = 0, j = c.length - 1;
    while (i < j) {
        while (i < j && !Character.isLetter(c[i])) i++;
        while (i < j && !Character.isLetter(c[j])) j--;
        if (i < j) { char t = c[i]; c[i] = c[j]; c[j] = t; i++; j--; }
    }
    return new String(c);
}
```

边界要说清楚：不含字母、只有一个字母、全是字母都要能正常返回。原帖作者提到「在 string 上用了 StringBuilder 的方法」，也提到被提醒变量命名（前后指针习惯性写 p、q 被纠正为有含义的名字）——面试写代码时命名规范是真实评分点，用 `left`/`right` 这种自解释命名比 p、q 稳。

**算法题二：有序数组中最接近 k 的 x 个数字**：数组已排序，最优是二分找到第一个 ≥ k 的位置，再用左右双指针向两边扩展，比较两端与 k 的距离，选更近的一侧并移动指针，直到取满 x 个。时间 O(log n + x)，空间 O(x)。

```java
public List<Integer> closest(int[] arr, int k, int x) {
    int lo = 0, hi = arr.length - 1;
    while (lo <= hi) {                  // 找第一个 >= k 的位置
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] < k) lo = mid + 1; else hi = mid - 1;
    }
    int left = lo - 1, right = lo;      // left 在左半，right 在右半
    List<Integer> res = new ArrayList<>();
    while (res.size() < x) {
        if (left < 0) res.add(arr[right++]);
        else if (right >= arr.length) res.add(arr[left--]);
        else if (k - arr[left] <= arr[right] - k) res.add(arr[left--]);
        else res.add(arr[right++]);
    }
    return res;
}
```

等价写法是「先二分出长度为 x 的最佳窗口左边界」，再用滑动窗口收缩，复杂度一样。要主动说清平局怎么处理（题目通常约定距离相同时取较小的值，上面的 `<=` 就是这个语义）、x 大于数组长度时怎么办（取全数组）、以及为什么不用「按距离排序」——那是 O(n log n)，浪费了数组有序的条件。

**关于这场面试的复盘**：面试官不问项目、只问八股且追问到具体命令与参数，说明考评点落在基础扎实度和生产实操经验上（慢查询日志怎么开、JVM 参数怎么配）。准备策略是把每个八股答到「原理 + 参数/命令 + 线上注意事项」三层；同时命名规范、边界条件的口头说明这些编码习惯是会被记的评分项，写题前先跟面试官确认题意和边界，再动手。

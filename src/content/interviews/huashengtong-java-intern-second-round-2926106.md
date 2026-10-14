---
title: "华盛通 Java 实习二面：46 问打通 RAG、序列化、Spring MVC 与并发"
company: "华盛通"
position: "Java 后端（实习）"
round: "二面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/fd30324de36044c69ab16437026163d4
tags: ["华盛通","Java","RAG","序列化","HTTP","SpringMVC","多线程","ThreadLocal","HashMap","MySQL","Spring事务"]
summary: "华盛通 Java 实习生二面面经，四十多分钟共 46 问、无手撕：RAG 链路（大模型、embedding、rerank 的选型）与项目难点，序列化机制与用途，浏览器到服务器的完整请求链路与 HTTP/TCP/HTTPS 关系，Spring MVC 里 DispatcherServlet 的作用，线程暂停与 wait/interrupt/sleep、HashMap 结构与哈希函数设计、ThreadLocal 与阻塞队列、Spring 事务参数与回滚条件，以及 MySQL 索引 B+ 树、分页、分库分表。"
---

### 《面试题目》

1. 简单介绍一下。
2. 你是什么时候开始学的？课外自己做了哪些事？
3. 这两个项目都是自己练习的是吧？
4. 有什么难点吗？
5. 调的是什么 API？用的什么大模型？
6. embedding 用的哪个模型？
7. rerank 用的什么？
8. 对象序列化是什么机制？
9. 序列化有什么用？
10. 你用到了吗？在哪里用到的？
11. 浏览器请求到服务器，中间过程是怎样的？
12. 拿到 IP 之后干了什么？
13. HTTP 和 TCP 是什么关系？
14. HTTPS 呢？
15. 服务端是什么？什么样的程序能接收 HTTP 请求？
16. 你怎么实现 REST API？
17. 请求是怎么到 Controller 的？Controller 前面还有什么？
18. DispatcherServlet 有什么用？
19. 让线程暂停有哪些方式？
20. wait 怎么用？
21. interrupt 是干嘛用的？
22. sleep 能被主动唤醒吗？怎么唤醒？
23. HashMap 的数据结构是什么样的？
24. 怎么定位到数组的哪个元素？
25. 桶数组有多长？有多少个元素？
26. hashCode 是怎么找到那个桶的？
27. 如果让你自己设计一个哈希函数来找桶，你怎么设计？
28. hashCode 为什么要用位运算，不用取模？
29. ThreadLocal 用过吗？
30. ThreadLocal 的数据结构是什么样的？
31. 你用了它什么特性？
32. 数据库连接放里面了吗？
33. 阻塞队列用过吗？
34. 为什么叫「阻塞」队列？怎么体现阻塞特性？
35. 阻塞队列你怎么用的？
36. Spring 的事务是怎么用的？
37. @Transactional 可以配哪些参数？
38. 什么情况下会回滚？
39. 还有哪些 RuntimeException？
40. 数据库索引有什么用？
41. 索引内部是什么结构？B+ 树为什么快？
42. MySQL 的分页查询？
43. 分库分表有什么用？
44. 你是电子信息工程专业，都学了哪些科目？
45. 你觉得自己的技术亮点是什么？
46. 你找实习的目的是什么？

### 《参考解析》

**RAG 链路：模型选型的答法要有理由**

被问「用的什么大模型 / embedding / rerank」时，只报名字是拿不到分的，要给出选型维度。生成模型看四点：能力与场景匹配（中文长文、工具调用、结构化输出）、上下文窗口、价格与限流、部署形态（官方 API、第三方中转、还是自己部署）。embedding 模型看：中文语义效果与维度、是否支持长文本切分后的语义完整、检索速度与内存占用、以及和生成模型是否同族（同族不一定更好，跨族有时能互补）。rerank 是「召回后再精排」的一环，通常是交叉编码器，把 query 与候选文档拼接后打分，效果显著优于纯向量相似度但吞吐低，所以只对 Top-K（比如 20 到 50）做。工程上要讲清整条链：文档切分策略（按标题层级或语义切，带重叠）、向量化与入库（含元数据过滤字段）、检索（向量召回 + 关键词召回混合，再融合排序）、rerank 取 Top-N、拼 prompt 时带上引用编号、回答里要求标注来源。追问「为什么要 rerank、不能只靠向量」时答：向量召回是双塔独立编码、精度有限，交叉编码器能建模 query 与文档的交互，代价是必须逐对算，所以只能放在精排阶段。

**序列化与一次 HTTP 请求的完整链路**

序列化是把对象转成可存储或可传输的字节序列，反序列化是逆过程；用途是跨进程/跨网络传输、持久化、以及做深拷贝与缓存。Java 原生 `Serializable` 要显式声明 `serialVersionUID`，反序列化时版本不一致会直接抛 `InvalidClassException`；原生序列化有安全风险（反序列化漏洞）且体积大、性能差，生产上更常用 JSON、Protobuf、Hessian、Kryo 这类。用到的地方可以举实际例子：RPC 调用参数、把对象写进 Redis、MQ 消息体、会话共享。追问常落在「为什么 Redis 里最好别用 JDK 序列化」——可读性差、跨语言不通、体积大、加字段容易出错。

一次 HTTP 请求的链路按顺序讲：域名解析（浏览器缓存、系统 hosts、本地 DNS、递归查询到权威 DNS）拿到 IP，然后建立 TCP 连接（三次握手），如果是 HTTPS 还要 TLS 握手（协商算法与密钥、校验证书链）；连接建立后浏览器拼出请求行、请求头、请求体发出，服务端从 socket 读到字节流、按 HTTP 协议解析；服务端处理完写回响应，浏览器按 `Content-Type` 解析渲染；最后按 `Connection`/keep-alive 决定复用还是关闭。HTTP 与 TCP 的关系是「应用层协议跑在传输层之上」，HTTP 定义报文语义，TCP 负责可靠有序的字节流；HTTPS 是在 HTTP 与 TCP 之间插了一层 TLS，解决机密性、完整性与身份认证，代价是握手往返与加解密开销。同一个域名下浏览器对 HTTP/1.1 有并发连接数限制，HTTP/2 用多路复用解决队头阻塞（应用层），HTTP/3 换 QUIC 到 UDP 上解决 TCP 层队头阻塞——顺着答下去往往能拿到加分。

**Spring MVC 与 DispatcherServlet**

「什么样的程序能接收 HTTP 请求」——本质是监听 TCP 端口、按 HTTP 协议解析报文并返回响应的服务端程序；Java 里常见形态是内嵌 Tomcat/Jetty/Undertow 的 Web 容器，加上一层框架（Spring MVC、JAX-RS）做路由与参数绑定。REST API 的实现要点是把资源用 URL 表达、用 HTTP 方法表达动作（GET 查、POST 建、PUT/PATCH 改、DELETE 删），状态码语义正确（200/201/204/400/401/403/404/409/500），返回统一结构的 JSON，并且保持幂等语义（GET/PUT/DELETE 幂等）。请求到 Controller 中间要经过一条链：Servlet 容器把请求交给 `DispatcherServlet`（前端控制器），它先查 `HandlerMapping` 找到目标 handler，再让 `HandlerAdapter` 适配调用（这中间按顺序跑拦截器 `HandlerInterceptor`、做参数解析与类型转换、数据绑定与校验），拿到返回值后交给 `HandlerMethodReturnValueHandler` 处理（`@ResponseBody` 走 `HttpMessageConverter` 序列化成 JSON），异常由 `HandlerExceptionResolver` 兜住。所以「Controller 前面还有什么」的答案至少有：容器、`DispatcherServlet`、拦截器链、过滤器（Filter 在 Servlet 层、比拦截器更靠外）、以及消息转换器。`DispatcherServlet` 的作用就是把「找谁处理、怎么调用、结果怎么渲染、异常怎么办」这些通用流程收拢到一处，让开发者只写业务方法。

**并发：线程暂停的几种方式与它们的区别**

线程暂停要从「是否释放锁」和「能否被唤醒/中断」两个维度对比。`Thread.sleep` 是让当前线程休眠指定时间，不释放已持有的锁，到点自动醒，被 `interrupt()` 会抛 `InterruptedException` 并清除中断标志。`Object.wait` 必须在 `synchronized` 块内调用（否则抛 `IllegalMonitorStateException`），它释放锁并进入对象的等待集，需要别的线程在同一对象上 `notify`/`notifyAll` 才能被唤醒，且被唤醒后要重新竞争锁；经典用法是放在 `while (条件不满足) wait();` 循环里，因为存在虚假唤醒和「唤醒后条件又被改回去」的情况。`LockSupport.park` 更底层，不要求持锁，靠 `unpark` 或中断唤醒，许可机制让 `unpark` 可以先于 `park` 调用。`interrupt()` 不是「立刻停止线程」，而是设置中断标志，由线程自己决定怎么响应；对处于阻塞（sleep/wait/join/可中断 IO）的线程会抛 `InterruptedException`，对运行中的线程只是置位，所以要靠循环里的 `Thread.currentThread().isInterrupted()` 检查来协作退出，吞掉 `InterruptedException` 不恢复标志位是常见 bug。`sleep` 的「主动唤醒」标准答案是中断：`t.interrupt()` 会让它抛异常提前返回，这是在别的线程里唯一能把它叫醒的办法（不能用 notify，因为 sleep 不涉及对象监视器）。

**HashMap：结构、寻址与为什么要用位运算**

JDK 1.8 的 HashMap 是「数组 + 链表 + 红黑树」：`put` 时先算 key 的 hash（`h ^ (h >>> 16)`，让高位参与运算以减少碰撞），再和数组长度减一按位与得到下标；桶为空就放新节点，非空则比较 hash 与 equals，相同则覆盖、不同则挂在链表尾；链表长度达到 8 且数组长度到 64 时转红黑树，否则优先扩容；扩容按 2 倍增长，1.8 用高低位拆分把节点分到原位置或「原位置 + 旧容量」两个桶，省去了 1.7 重新计算 hash 的开销。默认容量 16、负载因子 0.75，所以阈值是 12，超过就扩容。关于「桶数组有多长、有多少元素」：容量永远是 2 的幂，元素总数是 `size`，桶的平均长度是 `size` 除以容量，个别桶超过 8 才触发树化。为什么用位运算不用取模：当容量是 2 的幂时 `hash & (n-1)` 与 `hash % n` 结果等价，但位运算快得多，而这也正是容量必须为 2 的幂的原因。自己设计哈希函数时可以说：目标是均匀分布且计算便宜，实践中常用「扰动函数（异或高位）+ 位与取模」，并提到如果 key 的 `hashCode` 质量差（比如全是低位相同的字符串），任何取模方式都会碰撞，所以扰动是必要的。

**ThreadLocal、阻塞队列与 Spring 事务**

ThreadLocal 的数据结构是每个 `Thread` 内部的 `ThreadLocalMap`，以 ThreadLocal 实例的弱引用为 key、值为强引用，所以 key 可能被 GC 回收而 value 残留，长期存活的线程池线程上必须 `remove`。典型用途是请求上下文（用户信息、traceId）、`SimpleDateFormat` 这类非线程安全对象的线程私有副本，以及事务/数据源上下文。关于「数据库连接放里面了吗」——主流做法不是把 `Connection` 塞进 ThreadLocal，而是用连接池（HikariCP、Druid）管理连接，Spring 的 `DataSourceUtils` 会把「当前事务绑定的连接」放进 `TransactionSynchronizationManager` 的 ThreadLocal 里，保证同一事务内多次 DAO 调用拿到同一个连接；直接手动持有连接很容易忘记归还。

阻塞队列的本质是「队列满时入队阻塞、队列空时出队阻塞」，靠 `ReentrantLock` 的两个 `Condition`（notFull / notEmpty）加 `await`/`signal` 实现，所以「阻塞」体现在生产者在满队列上等待、消费者在空队列上等待，而不是自旋轮询。常用实现有 `ArrayBlockingQueue`（有界数组、公平可选）、`LinkedBlockingQueue`（可选界限、吞吐高但默认无界要注意）、`SynchronousQueue`（不存储元素，直接交接，`CachedThreadPool` 用它）、`PriorityBlockingQueue`（优先级）、`DelayQueue`（延时任务）。最经典的使用是生产者消费者，配合线程池时任务队列就是它；要讲清为什么生产上不用 `Executors.newFixedThreadPool` 的无界队列——任务堆积会 OOM，正确做法是自己 `new ThreadPoolExecutor` 并指定有界队列与拒绝策略。

Spring 事务最简用法是 `@Transactional` 注解（也可用 `TransactionTemplate` 编程式）。可配参数包括 `propagation`（REQUIRED、REQUIRES_NEW、NESTED、SUPPORTS 等七种）、`isolation`（读未提交到串行化）、`timeout`、`readOnly`、`rollbackFor`/`noRollbackFor`、`rollbackOn` 等。默认只在遇到 `RuntimeException` 和 `Error` 时回滚，受检异常（如 `IOException`）不会回滚，所以业务里想让受检异常也回滚必须写 `rollbackFor = Exception.class`。常见 RuntimeException 可以报一串具体的：`NullPointerException`、`IllegalArgumentException`、`IllegalStateException`、`IndexOutOfBoundsException`、`ClassCastException`、`ArithmeticException`（除零）、`UnsupportedOperationException`、`NumberFormatException`、并发下的 `ConcurrentModificationException`、`RejectedExecutionException`，以及框架层的 `NoSuchBeanDefinitionException`、`DataIntegrityViolationException`。还要主动提三个经典失效场景：方法内部自调用（不经过代理）注解不生效、方法不是 public、异常被自己 `catch` 掉没抛出去——这三条是实战里最容易踩的。

**MySQL 索引、分页与分库分表**

索引的作用是把随机 IO 变成有序查找、避免全表扫描，同时它能支撑排序与去重；代价是占空间、拖慢写入。InnoDB 用 B+ 树：非叶子节点只存键和指针，所以同样大小的页能放更多键、树更矮，一次查询的磁盘 IO 次数少且稳定（三到四层就能撑千万级数据）；叶子节点用双向链表相连，天然支持范围查询与 `order by`，这是它比 B 树（每个节点都存数据、范围查询要回溯）更适合数据库的原因。要顺带讲清聚簇索引（主键即数据、二级索引存主键值，所以二级索引查询可能要回表）、最左前缀原则、覆盖索引、以及索引失效的典型情况（对列做函数或隐式类型转换、`like '%x'`、`or` 连接非索引列、区分度极低的列）。

分页查询要区分深分页问题：`limit offset, size` 在 offset 很大时 MySQL 仍要扫描并丢弃前 offset 行，越翻越慢。优化手段是「游标/延迟关联」——用 `where id > 上次最大id order by id limit size`（要求有序且唯一），或者 `select ... from t join (select id from t order by id limit offset, size) x using(id)` 让子查询先用覆盖索引拿主键再回表。分库分表解决的是单库单表的数据量与写入瓶颈，垂直拆（按业务/按列）通常先做，水平拆（按分片键哈希或范围）才是分表；拆完要面对的问题必须一起说：跨分片查询与聚合、分布式主键（雪花、号段）、跨分片事务（最终一致或 TCC）、扩容时的数据迁移与双写、以及路由规则的中心化。也可以用分区表或「按时间冷热分离 + 归档」来推迟分表，很多场景这样更划算。

**收尾问题：基础背景、亮点与实习目的**

被问专业科目和「你的技术亮点」，答法是把亮点落到证据上，别报形容词：比如「能独立把一个 RAG 链路从切分调到 rerank」，配一个具体数据（召回率、答案准确率、延迟变化），或者「线上问题的定位习惯——先看日志与指标再改代码」。找实习的目的要正面回答且与岗位相关：想进真实工程环境验证自己学的东西、想在有 code review 与线上流量的环境里补上学校学不到的部分、以及希望在某个方向（比如后端 + AI 应用）做出可讲的作品。别答「为了简历好看」，也别把它说成只是想赚点钱——这不是错，但在面试语境里没有任何加分。

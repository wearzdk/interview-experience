---
title: "杭州翔基云创 Java 实习一面：26 道八股连问"
company: 杭州翔基云创
position: Java 开发实习生
round: 技术面
date: '2026-11'
collectedAt: '2026-11-18'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/8a06c7229e3d4bfeaf4b449c5d7f0e56
tags: ["杭州翔基云创","Java","实习","八股","JVM","并发","MySQL","Redis"]
summary: "杭州翔基云创 Java 开发实习面试，26 道题几乎全是八股：HashMap 与 ConcurrentHashMap 的版本差异、反射、JVM 内存与 GC、异常体系、线程池参数与隔离、volatile 与 ThreadLocal、InnoDB 索引与回表、Spring 事务失效与自动装配、Redis 缓存一致性与三大缓存问题，最后落在 Docker 与 Linux 常用命令。"
---

### 《面试题目》

1. HashMap 底层怎么实现？JDK 1.7 和 1.8 的实现有什么区别？默认负载因子是多少？
2. 想实现线程安全用什么？ConcurrentHashMap 怎么实现？JDK 1.7 和 1.8 有什么区别？
3. Java 反射是什么？本质怎么实现的？
4. 反射创建对象和直接 new 创建，哪个快？
5. JVM 哪些内存区域是线程共享 / 独占的？
6. 讲一下 GC？哪些情况下会触发 Full GC？
7. Java 有哪些异常种类及其区别？
8. Spring 里实现全局异常处理器怎么做？
9. 线程池有哪些参数？核心 / 最大线程数怎么设置？什么情况下要做线程池的隔离？
10. 讲一下 volatile？怎么实现可见性和有序性？
11. 要实现并发的原子性怎么做？除了锁还有哪些方式？
12. ThreadLocal 是什么？项目里有什么用？为什么会导致内存泄露？
13. 开启子线程后，要向子线程传递信息，除了直接传参还能怎么做？
14. InnoDB 为什么用 B+ 树组织索引？
15. 什么是回表？
16. 覆盖索引和索引下推有什么区别？
17. 如何判断一个查询有没有用到索引？
18. Spring 里事务注解失效的场景有哪些？@Async 和 @Transactional 同时出现时会失效吗？
19. Spring Boot 相较于 Spring 有什么区别？
20. 自动装配是怎么实现的？
21. Redis 有哪些数据结构？
22. Redis 做缓存，与数据库的一致性怎么保证？为什么先更新 DB 再删缓存？
23. 同路更新缓存相较旁路更新有什么问题？
24. 什么是缓存击穿 / 穿透 / 雪崩？
25. Docker 常用命令有哪些？如何进入一个容器？如何把数据从宿主机拷贝到容器？
26. Linux 命令：如何获取 Java 进程的 pid？如何修改文件名？

### 《参考解析》

**HashMap 与 ConcurrentHashMap**：1.7 是数组 + 链表，扩容时头插法，多线程扩容可能形成环；1.8 改成数组 + 链表 + 红黑树，链表长度到 8 且数组长度不小于 64 时树化，扩容用尾插法，插入后再判断是否需要树化。默认初始容量 16、负载因子 0.75，阈值 12。ConcurrentHashMap 1.7 用 Segment 分段锁（继承 ReentrantLock），锁的粒度是一段；1.8 去掉了 Segment，直接用 Node 数组，空桶用 CAS 插入，非空桶对头节点 `synchronized`，扩容支持多线程协助迁移，size 用 `baseCount` 加 `CounterCell` 分散计数。要点是「锁粒度从段降到桶 + CAS」。

**反射**：`Class` 对象是类在运行时的元数据入口，通过它可以拿到构造器、方法、字段并在运行时调用。本质是 JVM 依据 `Class` 里的方法表与元数据做动态解析；`Method.invoke` 首次调用会做访问检查并生成 `MethodAccessor`（早期是 JNI，后来默认用动态生成的字节码），所以第一次慢、后续会快一些。直接 `new` 通常更快：反射有访问检查、参数装箱与无法内联的开销；高频繁场景可以用 `MethodHandle`、`LambdaMetafactory` 或缓存 `Method` 来降低开销。

**JVM 内存与 GC**：线程私有的有程序计数器、虚拟机栈、本地方法栈；线程共享的有堆和方法区（1.8 起是元空间，使用本地内存）。GC 用可达性分析找存活对象，分代收集：新生代用复制算法（Minor GC），老年代用标记清除 / 标记整理。Full GC 常见触发点：老年代空间不足、元空间不足、显式 `System.gc()`、晋升时老年代没有连续空间（promotion failed）、CMS 的 concurrent mode failure、大对象直接进入老年代、Survivor 放不下导致对象提前晋升。

**异常**：顶层是 `Throwable`，分 `Error`（JVM 层面的严重问题，如 OOM、StackOverflowError，通常不捕获）与 `Exception`。`Exception` 又分受检异常（编译期必须处理，如 IOException）与运行时异常（`RuntimeException` 及其子类，如 NPE、IndexOutOfBounds，编译器不强制）。`finally` 一般都会执行，除非 `System.exit` 或 JVM 崩溃；`return` 在 finally 中会覆盖前面的返回值，不要这样写。

**全局异常处理**：用 `@RestControllerAdvice` 加 `@ExceptionHandler`，按异常类型匹配，返回统一的响应结构；业务异常与参数校验异常分开处理，未知异常记录日志并返回通用错误码。注意别把异常吞掉——日志要带 traceId 与原始堆栈，返回给前端的消息不能暴露内部细节。

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BizException.class)
    public ApiResponse<?> handleBiz(BizException e) {
        return ApiResponse.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<?> handleUnknown(Exception e, HttpServletRequest req) {
        log.error("unhandled exception, uri={}", req.getRequestURI(), e);
        return ApiResponse.fail(500, "服务繁忙，请稍后重试");
    }
}
```

**线程池**：七个参数是核心线程数、最大线程数、空闲存活时间、时间单位、工作队列、线程工厂、拒绝策略。CPU 密集型一般取核数 + 1，IO 密集型按「核数 × (1 + 阻塞时间 / 计算时间)」估，实际要靠压测调；队列必须有界，否则最大线程数永远用不上。需要隔离的场景：不同业务共用池会被慢任务拖垮（舱壁模式）、核心业务与非核心任务优先级不同、下游依赖不同（数据库、第三方接口）、需要单独的监控与拒绝策略。给每个业务建独立池，并设置池大小、队列长度与拒绝策略。

**volatile 与原子性**：volatile 保证可见性与有序性，不保证原子性。可见性靠写操作后把缓存行刷回主存、读操作从主存读（底层是内存屏障与缓存一致性协议）；有序性靠插入内存屏障禁止指令重排，经典的 double-checked locking 需要它。原子性除了锁，可以用 CAS（`AtomicInteger`、`AtomicReference`、`LongAdder`）、数据库乐观锁（版本号）、单线程串行化、或把共享状态改成不可变对象。

**ThreadLocal**：每个线程持有自己的 `ThreadLocalMap`，key 是 ThreadLocal 的弱引用，value 是强引用。线程池里线程会被复用，key 被 GC 后 value 仍挂在 map 上，且不会自动清理，于是泄漏；用完必须在 `finally` 里 `remove()`。项目里常用于存放用户上下文、traceId、事务上下文。子线程传递可以用 `InheritableThreadLocal`（只在线程创建时复制，线程池里失效），线程池场景用 `TransmittableThreadLocal` 或 `TaskDecorator` 手动传递。

**InnoDB 与索引**：B+ 树矮胖，非叶子节点只存键，一个 16KB 页能放很多键，三到四层就能支撑千万级数据，磁盘 IO 次数少；叶子节点用链表相连，范围查询与排序友好；数据都在叶子节点，查询稳定。回表是二级索引只存索引列与主键，查不到完整行时要用主键再去聚簇索引取一次。覆盖索引是查询需要的列都在索引里，不用回表；索引下推（ICP）是把 `where` 中能在索引上判断的条件下推到存储引擎层过滤，减少回表次数，`EXPLAIN` 的 `Extra` 会显示 `Using index condition`。

**判断是否走索引**：用 `EXPLAIN` 看 `type`（`ALL` 是全表扫，`ref` / `range` / `index` 依次不同）、`key`（实际用的索引）、`rows`（预估扫描行数）、`Extra`（`Using index` 是覆盖索引，`Using filesort` / `Using temporary` 要警惕）。常见不走索引的写法：索引列上做函数或运算、隐式类型转换、`like '%x'` 前导通配、`or` 连接非索引列。

**Spring 事务失效**：方法不是 public、同类内部自调用（不走代理）、异常被 catch 吞掉、抛的是受检异常而默认只回滚 `RuntimeException` 与 `Error`、类没有被 Spring 管理、数据库引擎不支持事务、传播行为设置成 `NOT_SUPPORTED` 等。`@Async` 与 `@Transactional` 同用时，异步方法在新线程执行，事务上下文（ThreadLocal）不会传播，原事务与异步方法里的事务是两回事；如果两个注解加在同一个方法上，代理顺序会影响结果，正确做法是把事务方法拆到另一个 Bean 里，由异步方法调用它。自调用同样会让 `@Async` 失效。

**Spring Boot 与自动装配**：Spring Boot 在 Spring 之上提供起步依赖、自动配置、内嵌容器、外部化配置与 Actuator，目标是开箱即用。自动装配由 `@SpringBootApplication` 里的 `@EnableAutoConfiguration` 触发，它通过 `AutoConfiguration.imports`（2.7 之前是 `spring.factories`）加载配置类，再用 `@ConditionalOnClass`、`@ConditionalOnMissingBean`、`@ConditionalOnProperty` 等条件决定是否生效；用户自定义的 Bean 优先于自动配置。

**Redis 数据结构与缓存一致性**：常用 string、list、hash、set、zset，另有 bitmap、HyperLogLog、geo、stream。缓存一致性常用 Cache Aside：读时先读缓存、未命中读库并回填；写时先更新数据库、再删除缓存。先更新库再删缓存的原因是：如果先删缓存再更新库，并发读可能在删完后读到旧库值并写回缓存，脏数据留得更久；先更新库再删，最坏只是短暂读到旧值，下一次读会回填新值。仍存在极小概率的不一致（删缓存失败、主从延迟），可以用延迟双删、订阅 binlog（Canal）异步删除、或加分布式锁保证同一 key 的读写串行。

**双写与旁路**：双写是更新库的同时更新缓存，问题是并发写时后写的请求可能先写缓存，导致缓存留下旧值；而且很多写操作并不需要立刻被读，更新缓存做了无用功。旁路删除把「写」简化成失效，下次读再回填，逻辑简单、出错面小；代价是首次读会穿透到库，需要配合预热或互斥重建。

**三大缓存问题**：击穿是单个热点 key 过期瞬间大量请求打到库，解法是互斥重建（分布式锁）、逻辑过期 + 异步刷新、热点 key 永不过期；穿透是查不存在的数据，缓存永远不命中，解法是布隆过滤器、空值缓存（短 TTL）、参数校验；雪崩是大量 key 同时过期或缓存整体不可用，解法是 TTL 加随机抖动、多级缓存、熔断降级、集群高可用。

**Docker 与 Linux**：常用命令 `docker ps`、`docker images`、`docker run`、`docker logs`、`docker inspect`、`docker stop/rm`；进入容器用 `docker exec -it <容器> /bin/bash`（没有 bash 时用 `sh`）；宿主机与容器之间拷贝用 `docker cp <宿主机路径> <容器>:<容器路径>`，反向同理。查 Java 进程 pid 可以用 `jps -l`、`ps -ef | grep java` 或 `pgrep -f java`；改文件名用 `mv old.txt new.txt`，批量改名配合 `rename` 或 for 循环。

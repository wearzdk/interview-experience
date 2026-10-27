---
title: "宇视科技 Java 一面：并发容器、堆参数与线上内存泄漏排查"
company: "宇视科技"
position: "Java后端"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/dc51311804b74e3596cd212708c1c51b
tags: ["宇视科技","Java","ConcurrentHashMap","JVM","垃圾回收","MySQL索引","Git","大模型"]
summary: "宇视科技 Java 后端一面：ConcurrentHashMap 的 CAS、Bean 单例与线程安全、堆参数为何等大、线上内存泄漏怎么定位、索引优化与写后读不到，最后问怎么降低 AI 幻觉和 token 消耗。"
---

### 《面试题目》

**集合与并发**

1. List 和 Map 有什么区别？
2. ConcurrentHashMap 的 CAS 是怎么用的？

**Spring 与 JVM**

3. Bean 是单例吗？单例安全吗？
4. String、StringBuilder、StringBuffer 有什么区别？
5. JVM 设置初始堆和最大堆为什么要求大小一样？
6. GC 是什么？内存溢出和内存泄漏是什么？Linux 上怎么看线上服务的内存泄漏或溢出是哪个方法造成的？

**Redis、MySQL 与 Git**

7. Redis 的淘汰策略有哪些？
8. MySQL 索引如何优化？写进去却读不到是怎么回事？
9. Git 的 reset、rebase、revert 分别是什么？

**AI 相关**

10. 怎么降低 AI 幻觉？如何降低 token 使用？

### 《参考解析》

**ConcurrentHashMap 的 CAS 用在「桶位抢占」和「计数」上**：JDK 8 里数组某个下标为空时，用 CAS 把新建的 Node 挂上去，失败就说明别人先占了，退回去自旋重试；桶已有节点则对该头节点加 synchronized 再链式或红黑树插入。size 也不再用一把锁或分段锁，而是 baseCount 加一组 CounterCell，多线程各自 CAS 自己的格子，最后求和，减少热点。取舍是：CAS 适合短临界区、无阻塞，但高竞争下自旋白烧 CPU；扩容时用 ForwardingNode 和 helpTransfer 让写线程一起搬数据，保证扩容期间仍可读。

**单例 Bean 安不安全，取决于有没有可变状态**：Spring 默认 singleton，容器里只有一个实例，所有请求共享。如果 Bean 只有方法内的局部变量、注入的依赖本身线程安全（无状态的 Service、Mapper），就是安全的；一旦把请求相关的数据放进成员变量（用户信息、拼接中的字符串、非线程安全的 SimpleDateFormat、HashMap 缓存），立刻出现串数据。正确做法是把状态放进方法参数或 ThreadLocal（用完 remove），共享缓存换 ConcurrentHashMap 或 Caffeine，需要隔离就用 prototype 或 request scope。

**Xms 与 Xmx 设成一样，是为了消除堆的动态伸缩**：堆能自动扩缩，意味着运行期会反复向操作系统申请和归还内存，每次扩容都可能触发 Full GC，停顿不可预期；固定大小后堆边界稳定，GC 次数和停顿更容易预估，也避免容器里因为堆频繁涨落被 OOM Kill 或被内存超卖拖慢。实际部署更常用 -XX:MaxRAMPercentage 按比例分配，并把元空间、直接内存、线程栈算进总量。

**线上内存问题先分清「泄漏」与「溢出」**：泄漏是对象该回收却被引用住，占用持续爬升，最终 OOM；溢出是确实需要的内存超过上限。排查顺序是 top 看进程 RSS、jstat -gcutil 看老年代是否只涨不降且 Full GC 后不回落、jmap -histo:live 看哪些类占大头、必要时 jmap -dump 出来用 MAT 看支配树与 GC Roots 引用链。想定位到方法，靠堆栈采样更直接：arthas 的 profiler 抓热点分配、或 async-profiler 的 alloc 事件，配合 jstack 看线程卡在哪；堆 dump 里找到业务类后再顺引用链回到持有它的静态集合。直接内存泄漏则加 -XX:NativeMemoryTracking 看 committed 增长。

**「写进去读不到」要先分清是隔离级别还是主从延迟**：同一事务里写完立刻用快照读，在 RR 下能否看到取决于是否当前读（加锁读会读最新版本）；读写分离架构下，写主库、读从库，复制延迟就会读到旧值。定位手段是看 binlog 位点与 Seconds_Behind_Master、在代码里确认走的是主还是从、必要时对刚写的数据强制走主库或做会话级粘滞。缓存层不一致（先删缓存后写库、双写顺序错）也会表现成写后读不到，要先确认读路径有没有经过缓存。

**降低幻觉与降 token 是同一套手段的两个方向**：幻觉侧把答案锚在检索到的原文上、要求给出引用、没有依据就拒答，再用结构化输出与规则校验卡住格式和数字，温度往下压。成本侧先砍上下文——只塞命中片段而不是整篇文档，历史对话做摘要与滑窗，系统提示词去冗余并走缓存，简单任务路由到小模型。两边会互相拉扯：检索给得少省钱但更容易瞎编，得在评测集上同时看准确率与单次成本。

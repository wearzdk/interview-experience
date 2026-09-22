---
title: 中兴通讯软件开发一面：Spring事务与线程池
company: 中兴通讯
position: 软件开发
base: 南京
round: 一面
date: '2026-09'
source: 牛客网
tags: ["Java","Spring事务","线程池","HashMap","ConcurrentHashMap","Docker","Kubernetes","分布式"]
summary: "中兴通讯9月22日南京线下一面，28分钟无手撕，两位面试官分别问技术和学习生活，覆盖分布式微服务、Docker与Linux查日志、Spring事务失效、K8s、线程池参数与保护、ConcurrentHashMap并发安全。"
---

### 《面试题目》

1. 实习项目中是否是分布式微服务的？
2. Docker 怎么查看日志？Linux 怎么看？
3. Spring 事务介绍，事务失效的场景
4. K8s 有没有接触？
5. 线程池参数，怎么保护线程池？
6. HashMap 时间复杂度，和 List 的使用区别
7. ConcurrentHashMap 同时查和插入有没有并发安全问题？
8. 有面过其他公司吗？怎么考虑的？
9. 硕士课题是什么？

反问

### 《参考解析》

**Docker 与 Linux 看日志**：`docker logs` 是入口，常用组合是 `docker logs -f --tail 100 <container>`（实时跟随最近 100 行），`--since 10m` 按时间过滤，`--timestamps` 带时间戳；容器日志默认由 json-file driver 落在宿主机 `/var/lib/docker/containers/<id>/<id>-json.log`，所以也可以直接 `tail -f` 那个文件。生产上更常用的是 `docker compose logs -f <service>`（多容器）或 `kubectl logs -f <pod> -c <container> --since=10m` / `kubectl logs --previous`（看上一个崩溃实例的日志，这个点很常考）。Linux 侧的基本功：`tail -f`、`less +F`、`grep -n -C 3 'ERROR' app.log`、`awk`/`sed` 做字段切割、`journalctl -u <service> -f` 看 systemd 服务日志、`dmesg -T | tail` 看内核与 OOM Killer 记录；大文件排查用 `grep` 定位行号后 `sed -n '1000,1050p'`；统计用 `sort | uniq -c | sort -rn`。要能顺口说出「先 tail 看现状、再 grep 找关键错误、最后按时间轴还原」这套顺序。

**Spring 事务与失效场景**：`@Transactional` 基于 AOP 代理实现，默认传播行为 `REQUIRED`、默认只对 `RuntimeException` 和 `Error` 回滚（受检异常需显式 `rollbackFor = Exception.class`）。失效场景要能列全：一是**同类内部自调用**（`this.method()` 不走代理，这是最高频考点）；二是方法不是 `public`（Spring 的代理对非 public 方法不生效）；三是类没有被 Spring 管理（自己 `new` 出来的对象）；四是异常被自己 `try-catch` 吞掉，事务管理器感知不到；五是在另一个线程里执行（事务上下文基于 ThreadLocal，不跨线程传播）；六是数据库引擎不支持事务（MyISAM）或方法上同时开了新事务但用 `REQUIRES_NEW` 而外层未正确配置；七是事务方法被 `final`/`static` 修饰导致 CGLIB 无法代理。解法：把内部调用拆到另一个 Bean、或注入自身代理（`AopContext.currentProxy()` / 自注入）、把 `@Transactional` 加在对外入口方法上。回答时最好补一句事务边界设计原则：事务里不做远程调用、不做大批量循环、尽量短小，避免长事务导致锁等待和主从延迟。

**K8s 接触点**：如果只是了解，就诚实说了解范围。核心概念最小集合：Pod（最小调度单位，一个或多个容器共享网络命名空间）、Deployment（管理无状态应用副本与滚动更新）、Service（稳定虚拟 IP 与负载均衡）、Ingress（七层入口）、ConfigMap/Secret（配置与密钥）、Namespace（隔离）。日常排障命令：`kubectl get pods -o wide`、`kubectl describe pod <name>`（看 Events，定位镜像拉取失败、调度失败、探针失败）、`kubectl logs`、`kubectl exec -it <pod> -- sh`、`kubectl top pod`。要能说清探针（liveness 失败会重启容器，readiness 失败会摘流量，启动慢的服务要用 startupProbe 避免被误杀）和资源限制（requests/limits 决定调度与 OOM 风险，limit 太低会被 kill 成 137）。有实际经验就讲你部署过什么、遇到过什么（比如镜像架构不匹配、PVC 挂载权限、滚动更新卡住）。

**线程池参数与保护**：七个参数：`corePoolSize`、`maximumPoolSize`、`keepAliveTime`、`unit`、`workQueue`、`threadFactory`、`handler`。执行顺序是「核心线程未满建核心线程 → 队列未满入队 → 队列满且未达最大线程数建非核心线程 → 都满则触发拒绝策略」。四种拒绝策略：`AbortPolicy`（默认，抛异常）、`CallerRunsPolicy`（调用线程自己跑，形成天然反压）、`DiscardPolicy`、`DiscardOldestPolicy`。怎么「保护」线程池：一是队列必须有界（`LinkedBlockingQueue` 无界会导致最大线程数形同虚设、请求堆积到 OOM），二是线程池隔离（按业务分组，避免一个慢业务打满公共池拖垮全部接口），三是自定义 `ThreadFactory` 给线程命名，便于定位问题；四是拒绝策略不要用静默丢弃，配合降级或 `CallerRunsPolicy`；五是把 `activeCount`、`queueSize`、`completedTaskCount`、拒绝次数暴露到监控并设告警；六是优雅关闭（`shutdown` + `awaitTermination`，超时再 `shutdownNow`），七是参数按「任务类型」定：CPU 密集型线程数约等于核数 + 1，IO 密集型按「核数 × (1 + 等待时间/计算时间)」估算，最终以压测为准。提一句不用 `Executors` 的快捷方法（`newFixedThreadPool` 用无界队列、`newCachedThreadPool` 最大线程数是 Integer.MAX_VALUE），这是阿里规约里的经典结论。

**HashMap 时间复杂度与 List 的区别**：HashMap 理想情况下 `get`/`put` 是 O(1)，哈希冲突时退化为 O(n)，JDK 1.8 引入红黑树后最坏是 O(log n)；`ArrayList` 按索引随机访问是 O(1)，但按值查找是 O(n)，中间插入/删除是 O(n)（要搬移元素）；`LinkedList` 头尾插入删除 O(1)，随机访问 O(n)。选型口径：频繁按 key 查找用 HashMap，需要保持顺序和索引访问用 List，`HashMap` 不保证迭代顺序（要顺序用 `LinkedHashMap`，要排序用 `TreeMap`）。还可以补 `ArrayList` 的扩容机制（1.5 倍，`System.arraycopy`）和 `HashMap` 的容量必须为 2 的幂的原因。

**ConcurrentHashMap 同时查和插入是否安全**：安全。1.8 的读操作是无锁的，写操作只 `synchronized` 锁住目标桶的头节点，读线程读到的是 `volatile` 修饰的节点状态，因此「一个线程 get、另一个线程 put 不同桶」完全无冲突；即使读写同一个桶，读也只会看到插入前或插入后的状态，不会出现结构不一致（扩容期间读线程遇到 `ForwardingNode` 会转发到新表去查）。但要注意三类「不是它负责」的问题：一是复合操作的原子性——「先 get 判断为 null 再 put」这种 check-then-act 在多线程下仍会重复执行，必须用 `putIfAbsent`/`computeIfAbsent`；二是迭代器是**弱一致**的（不抛 `ConcurrentModificationException`，但不保证看到最新数据），需要强一致快照要自己加锁或用 `CopyOnWriteArrayList`；三是 `size()` 是估算值（`baseCount + CounterCell[]` 求和），并发下不精确，`mappingCount()` 返回 long 更适合大容量场景。另外 JDK 1.7 的分段锁（Segment）与 1.8 的 CAS + 桶级锁的差异也是常见追问点。

**有没有面其他公司、怎么考虑**：这是 HR/技术面都会问的动机题。诚实但要有取舍逻辑：可以说「在投 XX 方向的公司，主要看三点——技术栈是否匹配我的方向、团队有没有真实的技术纵深、以及城市和生活成本的匹配度」，然后落到中兴上：通信与嵌入式/操作系统底层积累深、南京这个 base 符合我的城市规划、岗位方向和我做过的东西对口。避免说「你们是我最后的选择」或「随便投的」，也不要编造一堆并不存在的 offer。

**硕士课题怎么讲**：用「一句话说清问题价值 + 我的方法 + 结果」的结构，控制在 1～2 分钟，并主动往岗位需要的能力上靠。技术面里课题的作用是证明你能独立做研究、能定位问题、能给出可验证的结论，所以重点讲你遇到的卡点和怎么解决，而不是背论文摘要。如果课题和岗位关系不大，就给一句可迁移能力的总结（比如「做的是仿真与数据处理，练出来的是把模糊问题拆成可验证实验的能力」）。

**反问**：技术面适合问部门的技术栈和业务方向（中兴的部门差异很大，做无线、承载、终端的技术栈完全不同），以及新人入职后的培养机制和所在城市。如果面试官是团队负责人，可以问团队当前的技术挑战，这类问题容易换来有价值的回答。

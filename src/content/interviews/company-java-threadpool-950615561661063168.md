---
title: "Java 线程池核心参数与拒绝策略：面试考点全解"
company: "某公司"
position: "后端开发"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/950615561661063168
tags: ["Java","线程池","并发","拒绝策略","JUC"]
summary: "Java 线程池高频面试考点：七个核心参数与任务提交的完整流程，四种拒绝策略的取舍，为什么不要用 Executors 创建线程池，核心线程数怎么定，以及关闭、监控、动态调整与 ThreadLocal 相关的常见坑。"
---

### 《面试题目》

1. 线程池的七个核心参数分别是什么？各自的作用是什么？
2. 提交一个任务后，线程池的完整处理流程是怎样的？
3. 核心线程数已满、队列未满、最大线程数未满时，任务分别去哪里？
4. 为什么线程池要先入队、而不是先扩容到最大线程数？
5. 四种拒绝策略分别是什么？各自适合什么场景？
6. 为什么阿里巴巴开发手册不允许用 `Executors` 创建线程池？
7. 核心线程数、最大线程数、队列容量应该怎么配置？
8. `shutdown` 与 `shutdownNow` 有什么区别？如何优雅关闭线程池？
9. 线程池里的任务抛异常了会怎样？如何感知？
10. 线程池如何监控？需要看哪些指标？
11. 线程池参数可以在运行期动态调整吗？要注意什么？
12. 在线程池中使用 ThreadLocal 有什么风险？

### 《参考解析》

**七个参数**：`corePoolSize` 核心线程数、`maximumPoolSize` 最大线程数、`keepAliveTime` 非核心线程空闲存活时间、`unit` 时间单位、`workQueue` 任务队列、`threadFactory` 线程工厂、`handler` 拒绝策略。核心线程默认不会回收（`allowCoreThreadTimeOut(true)` 可以打开），最大线程数包含核心线程。

**提交任务的完整流程**：线程数小于核心数 → 新建核心线程执行；核心线程已满 → 任务入队；队列已满 → 线程数小于最大值则新建非核心线程；线程数已达最大值且队列已满 → 触发拒绝策略。这个顺序经常被记反，记住「先核心、再排队、再扩容、最后拒绝」。

**为什么先入队**：这是吞吐与资源之间的权衡。创建线程有成本，队列能吸收短时突发流量，避免频繁创建销毁；如果先扩容，遇到大量慢任务时会迅速把线程数顶到最大，线程多了上下文切换和内存占用都会上升，而队列的存在让系统在压力下先缓冲、再拒绝，行为更可预期。代价是队列过长会带来延迟——任务排队很久才被执行，甚至等到超时才有结果，所以队列容量要和可接受的排队时间一起定。

**四种拒绝策略**：`AbortPolicy` 抛 `RejectedExecutionException`，默认策略，适合必须让调用方感知失败的场景；`CallerRunsPolicy` 由提交任务的线程自己执行，形成天然的反压，但会阻塞调用方；`DiscardPolicy` 静默丢弃新任务；`DiscardOldestPolicy` 丢掉队列中最老的任务再提交。后两种会无声丢任务，生产环境除非明确可丢，否则不要用。需要记录、降级或落库时，实现 `RejectedExecutionHandler` 自定义策略。

**为什么禁用 Executors**：`newFixedThreadPool` 与 `newSingleThreadExecutor` 使用无界 `LinkedBlockingQueue`，任务堆积会导致 OOM；`newCachedThreadPool` 的最大线程数是 `Integer.MAX_VALUE`，高并发下会创建大量线程直至耗尽资源；`newScheduledThreadPool` 的队列同样无界。规范要求用 `ThreadPoolExecutor` 显式指定参数，让容量与拒绝行为可见。

**参数怎么定**：CPU 密集型任务线程数接近核数（核数 + 1 是经验值，不是定律）；IO 密集型可以更高，按「核数 × (1 + 等待时间 / 计算时间)」估算，但最终要靠压测验证。队列容量决定能缓冲多少，配合最大线程数与拒绝策略一起评估：队列太长会把拒绝推迟到更晚、把延迟拉高；队列太短会让扩容与拒绝更频繁。上线后按实际 QPS、任务耗时分布、队列水位回调参数，比一次算准更可靠。

**关闭**：`shutdown` 停止接收新任务，已提交的任务继续执行；`shutdownNow` 尝试中断正在执行的任务并返回未执行的任务列表，是否真正停止取决于任务是否响应中断。优雅关闭的步骤是：停止接收新任务、等待队列排空（`awaitTermination` 设超时）、超时后 `shutdownNow`、记录未完成任务。

**异常处理**：`execute` 提交的任务抛异常时，异常会从工作线程抛出并由 `UncaughtExceptionHandler` 处理，但线程池不会感知；`submit` 提交的任务异常被包在 `Future` 里，不调用 `get()` 就永远看不到。所以要么在任务内部 `try-catch` 并记录日志，要么重写 `afterExecute` 统一处理，要么使用 `submit` 后检查 `Future`。

**监控指标**：当前线程数、活跃线程数、队列长度与剩余容量、已完成任务数、拒绝次数、任务平均与 P99 耗时。`ThreadPoolExecutor` 提供 `getPoolSize`、`getActiveCount`、`getQueue().size()` 等方法，配合 Micrometer 暴露到 Prometheus，队列持续高位或拒绝次数上升就要告警。

**动态调整**：`setCorePoolSize`、`setMaximumPoolSize`、`setKeepAliveTime` 可以在运行期调用，队列容量不能直接改，需要替换队列或使用可调整容量的实现。调整时注意 `core > max` 的中间状态、新核心线程的创建时机，以及正在排队的任务不会因为扩容而立刻被消费——扩容只影响后续提交。

**ThreadLocal 的风险**：线程池的线程会被复用，任务结束时没有清理的 `ThreadLocal` 会残留下来，被下一个任务读到，造成数据串用或内存泄漏。规范做法是在 `finally` 里 `remove()`；如果框架层统一使用，可以在任务包装器中做清理。InheritableThreadLocal 在线程池场景下也不会随任务传递，需要显式透传。

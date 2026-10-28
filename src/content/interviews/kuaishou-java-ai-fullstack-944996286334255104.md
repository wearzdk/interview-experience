---
title: "快手 AI 全栈一面（5 年 Java）：虚拟线程、ThreadLocal 与拒绝策略"
company: "快手"
position: "Java AI 全栈"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/944996286334255104
tags: ["快手","Java","虚拟线程","ThreadLocal","ScopedValue","线程池","JVM"]
summary: "五年 Java 面快手 AI 全栈：45 分钟围绕并发新特性深挖，ThreadLocal 在虚拟线程下的问题、虚拟线程的适用边界与 pin 问题、线程池拒绝策略尤其是 CallerRunsPolicy 的副作用。"
---

### 《面试题目》

1. ThreadLocal 在虚拟线程里会有什么问题？底层怎么规避？
2. 虚拟线程一定比平台线程好吗？什么场景下用虚拟线程反而更慢？
3. 线程池的几种拒绝策略，生产环境你用哪种？CallerRunsPolicy 有什么致命副作用？

### 《参考解析》

**ThreadLocal 与虚拟线程**：平台线程数量有限，ThreadLocalMap 最多几百份；虚拟线程可以开到几十万，每个都持有一份不清理的 ThreadLocalMap 会迅速吃满内存。JDK 的思路是用 ScopedValue（作用域值）替代：不可变、随作用域自动失效、可继承给子任务，天然适配大量短生命周期线程。要注意 ThreadLocal 仍可用，但必须 ensure remove，且不能用来缓存大对象。

**虚拟线程的边界**：收益只在 I/O 密集型场景——阻塞时自动卸载载体线程，让少量平台线程跑大量任务。CPU 密集型任务不会变快，反而多一层调度开销。另一个坑是 pinning：虚拟线程在 `synchronized` 块里阻塞（JDK 21/22 的早期实现）会钉住载体线程，并发度退化；改用 `ReentrantLock` 可以缓解。还有 native 方法、`Object.wait` 等场景也会 pin。

**拒绝策略**：AbortPolicy 抛异常、CallerRunsPolicy 由提交线程执行、DiscardPolicy 静默丢弃、DiscardOldestPolicy 丢最老的。CallerRunsPolicy 看似「不丢任务」，但如果提交者是 Tomcat 工作线程或 Netty I/O 线程，它会被任务阻塞，导致整个容器响应变慢甚至事件循环卡死——这就是背压传导。生产上要么评估提交上下文再用，要么自定义策略落盘/入库做异步补偿，核心链路配合限流和队列长度监控。

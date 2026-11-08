---
title: "G1 回收器怎么答：Region、Mixed GC 与 Humongous 对象的线上坑"
company: 某公司
position: 后端开发（Java）
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/949181994624098304
tags: ["JVM","G1","Mixed GC","SATB","Humongous","GC调优"]
summary: "按「内存布局—回收流程—关键机制—线上坑」组织回答：G1 把堆切成等大 Region、按回收收益挑选 Mixed GC 的批次、用 SATB 与写屏障换并发标记的稳定；线上把 MaxGCPauseMillis 照抄成 100 导致 Young GC 频繁并出现 to-space exhausted，以及 3MB 大对象触发 Humongous 分配、碎片化最终 Full GC 的两个案例。"
---

### 《面试题目》

1. 说说 G1 回收器。
2. G1 的内存布局与年轻代、老年代的关系是什么？
3. Young GC、Mixed GC、Full GC 的回收范围与触发条件分别是什么？
4. G1 怎么做到「可预测停顿」？它是硬保证吗？
5. SATB 和 CMS 的增量更新有什么区别？
6. 从 CMS 切到 G1 要注意什么？
7. 为什么一个大对象会引发 Full GC？
8. G1 和 Parallel 怎么选？

### 《参考解析》

**一句话结论**：G1 不是把堆分成固定大小的年轻代和老年代，而是把堆切成一个个大小相等的 Region，每个 Region 在逻辑上归属 Eden、Survivor 或 Old；回收时不追求一次清完整个老年代，而是维护优先级列表，按「回收收益 / 停顿成本」挑一批 Region 做 Mixed GC，用 `MaxGCPauseMillis` 作为软目标预测停顿。用一句话概括：用 Region 化和增量回收把大堆的停顿拆小，用 RSet 和写屏障换可控性。

**内存布局**：Region 大小通常 1MB 到 32MB、取 2 的幂；超过 Region 一半的对象按 Humongous 处理，可能占用连续多个 Region。年轻代不是固定的，Eden 与 Survivor 的 Region 数量会动态调整。

**回收流程**：Young GC 只回收 Eden 与 Survivor，STW，触发条件是 Eden 满；并发标记周期在老年代占用达到 `InitiatingHeapOccupancyPercent` 阈值后启动，用 SATB 做并发标记；Mixed GC 在标记完成后，除年轻代外还挑选部分老年代 Region 一起回收；Full GC 在并发标记跟不上分配速度或晋升失败时退化，代价很高。

**可预测停顿的实现**：不是硬保证，而是基于历史数据做衰减平均，预测每个 Region 的回收成本，再在目标停顿内选出收益最高的一批。`MaxGCPauseMillis` 设得太小，年轻代会被压得很小，反而容易频繁 Young GC，甚至晋升失败。

**SATB 与增量更新的区别**：SATB 在标记开始时记录对象快照，漏标的是「快照之后新产生的引用」，通过写屏障把旧引用记下来；增量更新更关注引用被修改时重新标记。G1 用 SATB 是为了让并发标记阶段更稳定，但写屏障有开销，RSet 也要占内存。

**线上坑一**：服务从 CMS 切到 G1、堆 12G，照抄了 `MaxGCPauseMillis=100`，结果 Young GC 很频繁，日志里偶尔出现 `to-space exhausted`，接着是一次很长的 Full GC。把目标放宽到 200ms、观察一周后，Young GC 次数下降，Mixed GC 的单次停顿也更稳定。

**线上坑二**：报表导出接口一次构造接近 3MB 的 `byte[]`，而 Region 是 4MB，超过一半就按 Humongous 处理、连续分配多个 Region；频繁导出时老年代碎片化，Mixed GC 回收不掉，最终触发 Full GC。把 `G1HeapRegionSize` 调到 8MB 并限制单次导出的批量大小后，问题才压下去。

**参数与选型**：常用的是 `-XX:+UseG1GC`、`-XX:MaxGCPauseMillis=200`、`-XX:G1HeapRegionSize=8m`、`-XX:InitiatingHeapOccupancyPercent=45`，但不要把参数当答案。小堆、追求吞吐的场景 Parallel 可能更合适；大堆、希望停顿可控、能接受 RSet 与写屏障开销再考虑 G1。G1 不是「更高级」，它是在停顿、吞吐和内存之间做了一次取舍。

---
title: "Java后端一面场景题：接口偶发 5-10 秒、内存缓慢上涨怎么查"
company: "某公司"
position: "Java后端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/b4ad197021f94ea991ca47f06353cf5b
tags: ["Java", "Spring Boot", "JVM", "内存泄漏", "性能排查", "GC"]
summary: "一道 Spring Boot 线上排障场景题：接口平时 100ms、偶尔升到 5-10 秒且没有规律，机器内存缓慢上涨、重启后暂时缓解，要求说出排查思路与具体工具命令。"
---

### 《面试题目》

1. 一个 Spring Boot 服务，接口平时约 100 毫秒，偶尔升到 5 至 10 秒，每天出现几次，没有明显规律。机器内存缓慢上涨，重启后暂时改善，运行一段时间后又出现。你会怎样排查，用什么工具或命令？

### 《参考解析》

**先把现象拆成两条线：延迟毛刺和内存上涨可能是同一个根因，也可能是两个独立问题。** 常见的共同根因是内存泄漏导致的 GC 恶化：老年代逐渐被占满，Full GC 越来越频繁、单次停顿越来越长，表现为接口偶发几秒的卡顿；重启后内存归零，所以「暂时改善」。因此排查顺序应该是先确认 GC 与堆的健康度，再分别看内存和延迟，而不是一上来就翻业务代码。

**第一步用低成本命令建立时间线。** `jstat -gcutil <pid> 1000` 观察 Eden、Old 区占用与 Full GC 次数是否随时间上升；`jcmd <pid> GC.heap_info` 看堆与实际占用；`top -Hp <pid>` 找 CPU 高的线程，`pidstat -p <pid> 1` 看 CPU 与缺页；`ss -s`、`netstat` 看连接数与 TIME_WAIT。应用侧打开 GC 日志（`-Xlog:gc*:file=gc.log:time,uptime`），把接口耗时日志与 GC 时间点对齐——如果 5-10 秒的毛刺和 Full GC 对得上，方向就明确了。

**内存缓慢上涨的定位靠堆转储对比。** 先 `jmap -histo:live <pid>` 看对象数量 Top，隔一段时间再取一次，比较哪些类的实例数持续增长；需要看引用链就 `jmap -dump:live,format=b,file=heap.hprof <pid>`（生产上注意停顿与磁盘），用 MAT 或 VisualVM 看 Dominator Tree 和 Path to GC Roots。高频嫌疑：无界缓存（本地 Map 只 put 不 evict）、ThreadLocal 没 remove（线程池复用导致对象长期存活）、连接/流/文件未关闭、静态集合持有请求对象、动态生成类导致的 Metaspace 增长。堆外内存则要看 `NMT`、DirectByteBuffer 计数和 `pmap`。

**延迟毛刺还要排除 GC 以外的原因。** 线程池队列积压（`jstack` 连续抓几次，看是否大量线程卡在同一把锁或同一个 IO）、慢 SQL 与连接池耗尽（`SHOW PROCESSLIST`、连接池指标、`pg_stat_activity` 类视图）、下游超时与重试放大、定时任务/批处理与流量高峰叠加、容器 CPU 限流（`cpu.throttled` 指标）、以及日志同步写导致的偶发阻塞。`arthas` 的 `trace`/`watch` 可以按调用耗时定位到具体方法，`async-profiler` 的 wall-clock 模式适合抓「没在跑但很慢」的等待型问题。

**最后要给出验证与修复闭环。** 找到嫌疑后先做最小验证：在压测环境复现同样的流量模型，观察修复前后 Full GC 次数、P99 延迟、老年代增长斜率；上线后加监控（GC 停顿、堆使用率、线程池队列、接口 P99）并设定告警阈值。面试时按「现象分层 → 工具取证 → 根因假设 → 最小验证 → 修复与监控」讲，比罗列命令更能体现排查能力。

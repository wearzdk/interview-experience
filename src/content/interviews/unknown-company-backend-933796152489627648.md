---
title: "面试官问：你怎么排查线上的 OOM 问题？"
company: "某公司"
position: "后端开发"
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/933796152489627648
tags: ["Java", "JVM", "OOM", "HeapDump", "线上问题排查"]
summary: "以一次凌晨 OOM 事故为例讲线上排查流程：先下线实例止血再定位，用多次堆转储对比 retained size、支配树与 GC Roots 引用链，找到双层循环构造删除 key 未去重的根因；并整理五类常见 OOM 的典型原因与堆转储的两种获取方式。"
---

### 《面试题目》

1. 介绍一下你怎么排查线上 OOM 的问题？
2. 追问：堆转储文件怎么拿？
3. 追问：多个堆转储文件，怎么分析定位到根因？
4. 常见 OOM 类型（Java heap space、Metaspace、GC overhead limit exceeded、Unable to create new native thread、Direct buffer memory）的典型原因与排查重点分别是什么？

### 《参考解析》

1. **线上 OOM 的处置顺序**：先止血再定位——把故障实例从注册中心下线，让流量不再转发到它，然后重启恢复服务；定位根因放到后面做。理由是线上以秒计损失，继续带着故障跑就是在烧钱，而根因分析可以慢慢来。但要注意"先重启"只是止血，不能当成排查的替代，重启后必须回头把 dump、日志、提交记录补齐。
2. **堆转储怎么拿**：两种方式。启动参数 `-XX:+HeapDumpOnOutOfMemoryError` 配 `-XX:HeapDumpPath` 让 JVM 在 OOM 时自动导出；进程还活着、内存已经飙高但还没触发 OOM 时，用 `jmap -dump:format=b,file=heapdump.hprof <pid>` 手动抓，注意文件可能十几 G，先确认磁盘空间。如果进程已经挂了又没配自动导出，就拿不到了——内存已被操作系统回收，只能靠 GC 日志、监控平台或重启后再触发。
3. **多份 dump 怎么定位根因**：思路是找共同点。先按 retained size 排序列出占用最大的对象，再用支配树看谁持有它们，然后看 path to gc roots 找出谁在阻止回收；多份 dump 里持续增长、反复出现在同一条引用链上的那类对象就是嫌疑。定位后回到代码和 git 提交记录核对最近的改动，紧急情况下也可以先修最可能的一处、灰度发布看问题是否消失。
4. **五类常见 OOM**：`Java heap space` 是大对象或内存泄漏，靠堆转储分析；`Metaspace` 是动态代理、反射过多或类加载器泄漏，看类加载数量；`GC overhead limit exceeded` 是堆快满、GC 回收不到东西还占着 CPU；`Unable to create new native thread` 是线程数超过系统限制，查线程池配置；`Direct buffer memory` 是 NIO 的 DirectByteBuffer 没释放，查 Netty 这类框架的使用方式。

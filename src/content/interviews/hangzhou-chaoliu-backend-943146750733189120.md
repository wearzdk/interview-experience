---
title: "杭州潮流网络 Java 社招一面：CompletableFuture、ThreadLocal 跨线程与向量维度"
company: "杭州潮流网络"
position: "Java 后端（社招）"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/943146750733189120
tags: ["杭州潮流网络","Java后端","社招","CompletableFuture","ThreadLocal","向量检索","Linux"]
summary: "杭州潮流网络 Java 后端社招电话一面：项目开场后问 CompletableFuture 的原理、CPU 飙高怎么排查、ThreadLocal 的应用场景以及让主线程数据在池内线程共享的办法、Agent 项目架构、向量维度如何设置，最后是常用 Linux 命令。"
---

### 《面试题目》

1. 讲讲你的项目。
2. CompletableFuture 的原理是什么？
3. CPU 飙高怎么排查？
4. ThreadLocal 有哪些应用场景？如果想让主线程的 ThreadLocal 数据和线程池里的线程共享，有什么方式？
5. 你的 Agent 项目架构是怎样的？
6. 向量维度怎么设置的？越大越好吗？
7. 常用的 Linux 命令有哪些？

### 《参考解析》

**CompletableFuture**：它把异步任务拆成「结果加依赖动作栈」，回调挂在栈上，任务完成时用 postComplete 逐个弹出执行。默认跑在 ForkJoinPool.commonPool，IO 型任务必须传自己的线程池。thenApply 是同线程转换，thenCompose 用来扁平化嵌套 Future，allOf 聚合后要 join 并处理异常，exceptionally 和 handle 才是异常出口。

**CPU 飙高排查**：top 找进程，top -Hp 找线程，printf %x 把线程 id 转十六进制，再在 jstack 里 grep 这个 nid 定位栈。多个线程卡在同一段代码，先怀疑死循环、正则回溯、频繁 GC；GC 线程占满 CPU 就看 jstat -gcutil 的频率与回收效果。火焰图能一次看清热点。

**ThreadLocal 与线程池**：ThreadLocal 给每个线程绑一份上下文，比如用户身份、traceId、事务连接。值存在 Thread 的 threadLocals map 里，key 是弱引用的 ThreadLocal 实例、value 是强引用，池里的线程不销毁，value 就一直挂着，必须 try/finally remove。InheritableThreadLocal 只在 new Thread 时复制一次，池内线程拿不到新值；要在池里传递得在提交时捕获快照再回放，手写包装 Runnable 或用 TransmittableThreadLocal。

**向量维度**：维度由 embedding 模型决定，换模型就要重建索引。维度高上限高，但存储和计算线性增长，检索延迟与内存跟着涨，高到一定程度边际收益很小。选型看评测集召回加成本；Matryoshka 表示的模型可以先高维训练再截断到低维。

---
title: "拼多多 AI Infra 一面：bank conflict、Triton 与字符串乘法"
company: "拼多多"
position: "AI Infra"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/8566c06947a0424396d9ee48e71f10b5
tags: ["拼多多","AI Infra","CUDA","bank conflict","Triton","字符串乘法"]
summary: "拼多多 AI Infra 一面：实习里的监控指标、常用 infra 工具、bank conflict 的成因与解决、Triton 学习情况，手撕字符串乘法。"
---

### 《面试题目》

1. 做一下自我介绍。
2. 要排查代码问题，你会监控哪些指标（实习经历）？
3. AI Infra 相关的工具会使用哪些？
4. bank conflict 是什么？怎么解决？
5. 你是怎么查看问题的、怎么解决的？
6. 学习过 Triton 吗？
7. 手撕：字符串乘法。

### 《参考解析》

**Bank conflict**：GPU 的 shared memory 被划分为 32 个 bank，同一 warp 内的线程如果访问到同一个 bank 的不同地址，就会串行化，这就是 bank conflict。典型场景是按列访问二维数组（步长是 32 的倍数）。解决办法：padding（把数组宽度加 1 打破对齐）、改变访问顺序让同一 warp 落在不同 bank、用 swizzle 重排、必要时改用寄存器或 warp shuffle。要能说出「广播」是例外：同一 warp 访问同一地址不会冲突。

**AI Infra 工具**：Nsight Systems 看整体时间线和通信/计算重叠，Nsight Compute 看 kernel 的 occupancy、访存吞吐、指令效率；PyTorch Profiler 看算子耗时；nvtop / DCGM 看 GPU 利用率和显存；Triton 用来快速写融合算子；分布式侧看 NCCL 日志和拓扑。

**字符串乘法**：模拟竖式乘法。把两个字符串转成数字数组，结果数组长度 m+n，`res[i+j+1] += a[i]*b[j]`，再从后往前处理进位；最后去掉前导零，全零返回 "0"。注意不能直接转 int，会溢出。时间 O(mn)，空间 O(m+n)。

**监控指标**：GPU 利用率、显存占用、SM occupancy、HBM 带宽、kernel 耗时分布、通信耗时占比、队列等待时间、OOM 次数、温度与降频。排查顺序是「先看瓶颈在算、在访存还是在通信」。

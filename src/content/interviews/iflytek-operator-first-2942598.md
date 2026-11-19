---
title: "科大讯飞算子岗一面：SM 占用率、GEMM 计算量与 FlashAttention 迁移"
company: 科大讯飞
position: AI Infra
round: 一面
date: '2026-11'
collectedAt: '2026-11-19'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/018754ed1e144a33a5f0a1616ba45859
tags: ["科大讯飞","AI Infra","算子","CUDA","GPU","GEMM","FlashAttention","性能优化"]
summary: "科大讯飞 AI Infra 方向算子岗一面（线上单面，约 32 分钟），节奏是自我介绍与背景、硬件平台与工具链、项目深挖、GPU 体系结构、算子实现细节、大模型与 FA 连续追问、软性与反问，无手撕无笔试。问题包括 SM 占用率、GEMM 计算量、计算/访存/通信瓶颈的判断、为何不用 cuBLAS、img2col、CPU SIMD、prefetch、Softmax 优化、Hopper 特性与 FA 迁移思路。"
---

### 《面试题目》

1. 自我介绍（项目 / 实习 / 论文）。
2. 讲一个你定位过的最棘手的问题：怎么发现的、怎么定位的、最后怎么解决的？
3. 你们的优化是针对一种特定的计算图实现的吗？还是能推广到别的场景？
4. 你们模型的结构是固定的吗？依赖关系是静态的吗？
5. 你用的加速卡是哪一代？后面更新的型号用过吗？
6. 这张卡有没有工具能把 NVIDIA GPU 上的代码转成它能跑的代码？转换质量怎么样？
7. 你主要在什么硬件上写 kernel？CUDA 写过吗？
8. SM 的占用率跟什么有关？主要受限于哪些因素？
9. 一个 M×N×K 的矩阵乘，计算量怎么算？
10. 两个算子要做并发 / 重叠，前提条件是什么？基准是什么？
11. 一开始完全没有并行，你是怎么发现、怎么归因的？
12. 怎么判断一个算子是计算瓶颈、访存瓶颈还是通信瓶颈？ncu 和 nsys 分别看什么？
13. 写 GEMM 为什么不用 cuBLAS 这类现成库？
14. 有对比过自己实现和 cuBLAS 的效率吗？
15. 写过卷积算子吗？img2col 了解吗？
16. 支持过 ResNet 这类传统模型的推理吗？
17. 在 CPU 上写算子，怎么用 SIMD 做向量化？
18. 写算子时考虑过预取（prefetch）吗？效果怎么样？
19. 做过大模型相关的工作吗？写过 training 算子吗？
20. 如果让你优化 Softmax 的效率，你会怎么做？
21. 了解 Hopper / Blackwell 架构的特性吗？
22. 把一个算子从上一代架构迁到 Hopper 上做优化，以 FlashAttention 为例，你的思路是什么？
23. 了解最新的大模型发展路线吗？
24. 平时有用大模型 / AI 工具帮你写算子吗？效果如何？
25. 手上有几个 offer？
26. 反问。

### 《参考解析》

**SM 占用率**：占用率是每个 SM 上活跃 warp 数与硬件上限的比值，受三类资源限制——寄存器（每线程用量 × 线程数 ≤ 寄存器文件）、共享内存（每 block 分配量）、线程与 block 数量上限（每 SM 最大线程、block、warp 数）。此外 block 大小与分配粒度会造成浪费。占用率高不等于性能好：访存密集型任务需要足够多的在途请求掩盖延迟，而计算密集型可能少量 warp 就能打满流水线；寄存器溢出或占用率过低则无法隐藏延迟。

**GEMM 计算量**：M×N×K 的矩阵乘做 `2×M×N×K` 次浮点运算（一次乘加算 2 FLOPs），访存量约为 `(M×K + K×N + M×N) × 元素字节数`。算术强度 = FLOPs / Bytes，用它判断是计算受限还是带宽受限，再对照硬件的峰值算力与带宽。

**瓶颈判断**：用 ncu（Nsight Compute）看单个 kernel 的指标——SM 利用率、achieved occupancy、内存吞吐占峰值比例、L2/DRAM 命中、warp stall 原因、指令吞吐；用 nsys（Nsight Systems）看时间线上的全局视角——kernel 与 memcpy 的排布、通信与计算是否重叠、空泡在哪。计算瓶颈表现为算力利用率高而带宽未饱和；访存瓶颈是带宽接近峰值、stall 在 long scoreboard；通信瓶颈看 NCCL 调用占比与等待时间。

**为什么自己写 GEMM**：cuBLAS 是通用库，针对特定形状、数据类型、融合需求（如 epilogue 融合 bias/激活、混合精度、特殊布局、稀疏）未必最优；自研可以在固定形状上做更好的 tiling、减少中间结果落盘、与前后算子融合。但要先有对比数据：报告自己实现相对 cuBLAS 在目标形状上的吞吐与延迟，并说明在哪些形状上不如它。

**img2col 与卷积**：img2col 把卷积的每个感受野展开成一列，转成 GEMM 计算，优点是复用成熟的高效 GEMM kernel，代价是展开后显存膨胀（重复存储重叠区域）。改进方向是 implicit GEMM（不实际展开，索引时直接取数）、Winograd（减少乘法次数）、以及针对小卷积核的 specialized kernel。

**CPU SIMD 与预取**：SIMD 用 AVX2/AVX-512 或 NEON 的向量指令一次处理多个数据，前提是数据布局对齐（`alignas`）、循环可向量化（无跨迭代依赖）、必要时用 intrinsic 手写或依赖编译器自动向量化（`-O3 -march=native`，看优化报告）。预取用 `_mm_prefetch` 或编译器提示把即将访问的数据提前拉入缓存，对规律访存有效，对随机访存或带宽已饱和的场景收益有限，过度预取会污染缓存。

**Softmax 优化**：Softmax 需要两次遍历（求最大值与指数和）再归一化，访存是瓶颈。优化手段：online softmax（一遍遍历同时维护 running max 与 running sum，边算边修正）、与前后算子融合（attention 里与 QK^T、PV 融合，避免写回大矩阵）、用向量化与 warp 级归约、数值上用减最大值的稳定写法、低精度（fp16/bf16 计算，fp32 累加）。FlashAttention 正是把这些融合进 tiling 的典型。

**迁到 Hopper 的思路**：先确认 Hopper 的新能力——TMA（张量内存加速器，异步批量搬运）、wgmma（warpgroup 级矩阵乘）、分布式共享内存（cluster 内 SM 共享）、异步流水。迁移 FA 时把全局内存到共享内存的搬运换成 TMA、用 wgmma 替换 mma、用多 stage 的 producer-consumer warp  specialization 隐藏延迟、按 cluster 做跨 SM 的 K/V 共享。步骤是先跑通正确性，再用 ncu 对比每阶段的吞吐与 stall，逐项替换验证，最后在目标 shape 上与基线对比。

**AI 工具写算子**：可以让模型生成骨架、模板代码、边界处理与测试用例，但性能关键部分必须自己看 PTX/SASS 与 profile 数据；模型给的优化建议常停留在「加 shared memory、调 block size」这类通用层面，需要实测验证。

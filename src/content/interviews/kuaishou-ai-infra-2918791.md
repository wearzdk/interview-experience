---
title: "快手 AI Infra 一面面经：Attention 算子优化、prefill 与 decode 调度及量化"
company: "快手"
position: "AI Infra"
round: "一面"
date: '2026-09'
source: 牛客网
tags: ["AI Infra", "推理部署", "Attention", "算子优化", "Triton", "量化", "AWQ", "GPU 架构"]
summary: "快手 AI Infra 一面面经：围绕 Attention 重构与模型部署追问，考察 Triton 算子、profile 与 Roofline 分析、prefill 与 decode 调度、线性注意力，以及 AWQ 与 W8A16。"
---

### 《面试题目》

1. 高性能 Attention 重构具体做了哪些工作？
2. 部署过什么模型、参数量多大？
3. 在项目中承担什么角色？
4. 使用的底层框架是什么？
5. C++ 相关理解
6. 是否部署过小模型？低时延怎么做，重点问 prefill 阶段
7. 是否用过 Triton 写 kernel？解决了什么问题？
8. GPU 架构基础：SM、Warp 相关理解
9. Attention 算子主要优化点
10. 是否用过 profile 性能分析工具？
11. 如何判断算子存在问题？
12. 如何根据 profile 结果做算子优化？
13. 是否了解 Roofline 屋顶线模型？
14. 算子优化常见两类瓶颈是什么？
15. 新请求 prefill 会不会踢掉正在运行的 decode 请求？
16. prefill 与 decode 能否混合调度？
17. 是否了解线性注意力？
18. 意向方向：训练还是推理？
19. 量化了解吗，AWQ 原理？
20. W8A16 在 forward 中执行流程？
21. 手撕算法：三数之和（两数之和变种）

### 《参考解析》

1. **Attention 算子的优化点是「少搬数据」而不是「少算」**：标准 Attention 的瓶颈往往不在算力，而在把 Q、K、V 和中间矩阵反复写回显存又读回来。FlashAttention 这类做法的核心就是 IO 感知：把 Q、K、V 分块塞进片上内存（shared memory / 寄存器），块内做计算并用 online softmax 一边算一边更新归一化因子，避免物化完整的注意力矩阵，把 HBM 读写量从 O(n²) 降到更接近 O(n)。具体可讲的优化点：算子融合（把 softmax、mask、dropout 融进一个 kernel，减少 kernel 启动与中间张量）、向量化访存与合并访问、避免 bank conflict、用 tensor core 做矩阵乘、针对变长序列做打包与减少 padding 浪费、以及对 causal mask 只算下三角省掉一半计算。判断有没有优化到位，最终都要落到实测吞吐与显存占用上。

2. **Roofline 与两类瓶颈**：屋顶线模型把性能上界画成「算力上限」与「带宽上限」两条线，横轴是计算强度（FLOPs / Byte），纵轴是可达性能。落在斜线上说明是访存受限（memory bound），提高计算强度或减少数据搬运才有用；落在平顶说明是计算受限（compute bound），要换更快的计算单元或降低计算量；两者的交点是机器的拐点。实际调优里还会遇到第三类「延迟隐藏不足」：占用率低、寄存器或 shared memory 超限、warp 调度不上，表现为 SM 空转，这时候要减小 block 资源或用更细的分块提升并发。答题时能把「先判断受限于什么，再决定优化方向」说出来，比背一堆优化手段更打动人。GPU 架构基础要能顺口解释：SM（流多处理器）是调度与执行单元，warp 是 32 个线程的调度粒度，同一个 warp 内线程走不同分支会发生 divergence，逐条串行执行；block 的资源占用决定一个 SM 上能同时驻留多少 block。

3. **profile 与「如何判断算子有问题」**：判断手段分三层——端到端的指标（吞吐、TTFT、TPOT、显存峰值）先定位到是哪个阶段慢；框架层的 profiler（PyTorch Profiler、Nsight Systems）看时间轴，找 kernel 之间的空隙、同步点、频繁的小 kernel 与显存拷贝；kernel 层的 ncu / Nsight Compute 看具体指标（计算利用率、访存吞吐、warp 停顿原因、占用率、bank conflict、L2 命中）。常见的「有问题」信号：kernel 时间远超理论值、大量小 kernel 连续启动（说明该做融合）、H2D / D2H 拷贝频繁（说明在 CPU 侧做了张量操作）、GPU 利用率低但延迟高（说明在等 CPU 或等通信）。优化动作按定位结果选：能做融合就融合、能换算法就换（如 online softmax）、能改访存模式就改（对齐、向量化、提高复用），改完必须回到同一套 profile 下对比，别用不同 batch 或不同输入长度的数据自证。

4. **Triton 的定位**：Triton 让你用 Python 写块级（block-level）kernel，编译器负责线程映射、共享内存分配与流水线，写一个 fused kernel 的代码量远小于 CUDA C，适合快速试算法和做算子融合。它适合的场景是访存密集、逻辑规整的融合算子（softmax、layernorm、elementwise、简单的 attention 变体）；不够用的场景是需要精细控制 warp 级原语、异步拷贝、集群（cluster）与极端手工流水的时候，那还是 CUDA 或直接调 CUTLASS / cuBLAS。面试里被问「用 Triton 解决了什么问题」，答题要点是「融合减少了多少次 HBM 往返、用了什么分块与 num_warps 配置、实测相比原生实现快了多少」，而不是只说「会写 Triton」。

5. **prefill 与 decode 的调度**：prefill 一次处理整段 prompt，是计算密集、能把 GPU 喂饱；decode 每步只生成一个 token，是典型访存密集（要把整个 KV cache 读一遍），算力利用率低但延迟敏感。二者的冲突就在这：一个长 prefill 会长时间占住 SM，让正在解码的请求停顿，表现为其他请求的 TPOT 抖动。所以「新请求的 prefill 会不会踢掉正在跑的 decode」答案是——不该踢，主流做法是 chunked prefill，把长 prompt 切成小块，和 decode 请求拼进同一个 batch 交替执行，牺牲一点 prefill 延迟换取 decode 的稳定；更激进的方案是 prefill 与 decode 分实例部署（P/D 分离）再靠 KV cache 传输衔接。调度器的核心机制是连续批处理（continuous batching，每步结束后把完成的请求换出、新请求换入）、抢占与恢复（显存不够时把某些请求的 KV 换出到 CPU 或直接丢弃并在恢复时重算，重算比换出更省传输但费算力），以及公平性策略（不能让长请求一直霸占）。被问到取舍时给指标：TTFT 关注 prefill 排队，TPOT / 吞吐关注批处理效率，两者要按业务 SLO 定策略。

6. **线性注意力、量化与 W8A16**：线性注意力是把 softmax 注意力改写成核函数形式，利用矩阵乘结合律先算 K 与 V 的外积并用一个固定大小的递推状态累积，从而把复杂度从 O(n²) 降到 O(n)、且推理时状态大小与序列长度无关（相当于常量级 KV cache）。代价是表达能力下降、对长程精确检索类任务效果通常不如标准注意力，所以常见做法是混合层（大部分线性层加少量标准注意力层）或只在小模型上使用，答题时要能说清这个取舍。量化方面，AWQ 的前提观察是「权重里只有一小部分通道重要，重要性与激活值的幅度相关」，做法是按通道统计激活尺度，对重要通道按比例放大权重再量化，以缩小量化误差，并把缩放融合进前一层，因此不需要反向传播、校准数据量小。W8A16 的 forward 流程要说清：权重以 int8 加缩放因子存储，激活保持 FP16，计算时在 kernel 内把权重量化值按分组缩放因子反量化回 FP16（或直接在反量化后做 GEMM 的 fused kernel），再与 FP16 激活做矩阵乘。它的收益主要在显存占用与权重读取带宽——访存受限的 decode 阶段收益明显；如果反量化被拆成额外的一遍 kernel，多出来的显存往返会把收益吃掉，所以融合实现是关键。最后「意向方向：训练还是推理」这类问题，提前想好一个和项目经历对得上的理由即可，别临场摇摆。

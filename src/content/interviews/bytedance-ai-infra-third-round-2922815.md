---
title: 字节 AI Infra 三面：CUDA Graph 与 TP 并行的卡死排查
company: 字节跳动
position: AI Infra
round: 三面
date: '2026-10'
source: 牛客网
tags: ["AI Infra","CUDA","MoE","分布式训练","算子优化","Attention"]
summary: "字节 AI Infra 三面面经，主线是分布式训练与算子开发：CUDA Graph 与 TP 并行同时启用导致卡死的定位过程、Triton/CuTe 这类 DSL 的价值、MoE 训练里 Router Replay 与 EP 并行、滑动窗口 Attention 的确定性反向优化，以及国产 GPU 上的算子 Benchmark 方法。"
---

### 《面试题目》

1. 介绍实习项目，说明你在项目中的职责、交付对象，TensorFlow 算子适配的落地场景是什么？
2. CUDA Graph 与 TP 并行同时启用时会出现卡死，关闭 Graph 或者 TP=1 问题就消失，请分析原因。
3. 如何逐步定位，最终排查到是通信算子融合引发的该 bug？
4. 通信状态标记放在哪个位置，选择浮点类型存储的理由？
5. Bug 修复后，如何通过最小复现案例 + 模型回归做正确性验证？
6. 原同步机制的设计思路是什么，为什么会出现前面这个判断逻辑错误？
7. 算子开发中，Triton、CuTe 这类 DSL 被广泛使用的原因，从开发和业务角度分析。
8. Router Replay 里 rollout 保存的 token、层、Top-K 路由信息，会供给哪个环节使用？
9. MoE 训练流程里，在哪一步读取消费这份路由记录？该方案是论文复现，还是线上训练遇到的工程方案？
10. 描述单个 token 进入 MoE 模块的完整前向计算流程，你是否接触过 EP 并行通信？
11. 滑动窗口 Attention 确定性反向优化：dQ 累加存在等待阻塞，如何缩小同步域、重排执行顺序实现计算链并行？
12. 上述优化改动后，如何保证梯度累加顺序不变、维持计算确定性？
13. 国产 GPU 算子 Benchmark 怎么做，如何对比自研 kernel、第三方高性能库与旧版本实现？
14. 简述 GPU 硬件架构、显存带宽、多卡互联对算子性能带来的影响。

### 《参考解析》

**CUDA Graph + TP 卡死：典型是「图捕获期间发生了不该捕获的同步/通信」。** CUDA Graph 的工作方式是先把一段 kernel 序列捕获成图、之后整图重放，好处是消掉逐 kernel 的启动开销。它和 TP 冲突的地方在于：TP 需要在每层做 all-reduce/all-gather，这类集合通信在捕获期会被记录成图节点；而通信库（NCCL）内部有自己的 stream、同步和 host 侧轮询逻辑，一旦被固化进图，就失去了运行时按实际到达情况调度的能力。卡死的常见机制是：**capture 时按某个固定的 rank/流拓扑记录了下发顺序，重放时各 rank 之间等待关系错位，形成互相等待**（A 等 B 的 send，B 在等 A 的 recv，而图里已经没有动态重排的机会）。定位路径就是把变量单一化：先固定 Graph 只留 TP（或反之）复现，再把 TP 内部的通信算子逐个禁用/替换成 no-op 找到最小触发点，然后 dump 各 rank 的 call stack / NCCL 日志看谁在等谁。最终定性到「通信算子融合」是因为融合把原本多个独立、可乱序完成的通信节点合成一个节点，图捕获后节点内部的完成语义与实际执行不一致。

**把「谁在等谁」画出来，是这类死锁唯一有效的排查方式。** 具体动作：① 用 NCCL 的 `NCCL_DEBUG=INFO` + `NCCL_DEBUG_SUBSYS=COLL` 看每个 rank 发出和完成集合通信的顺序；② 卡住时 `py-spy dump` 各进程，看是停在 kernel launch、stream sync 还是通信调用；③ 用 `torch.cuda` 的 stream 记录 / nsys profile 看各 rank 的 stream 交错；④ 逐层缩短模型（1 层、2 层）看是否仍复现，判断是拓扑问题还是数据相关；⑤ 用 `torch.distributed.breakpoint()` 或超时 watchgod 让 rank 在超时后打印状态而不是硬卡。核心思路始终是：**把「并行维度」「图捕获」「通信实现」三个变量解耦**，一次只动一个。

**通信状态标记为什么用浮点存。** 如果用整数（尤其是 32 位 int）在 GPU 上做累加/比较标记，容易和计算里的整数类型混用，且一旦发生类型提升或隐式转换，判断就悄悄失效；更实质的原因是**要与张量的 dtype 对齐**：标记通常随张量一起走一个约定 dtype 的 buffer，用浮点可以避免额外的 cast kernel 和类型不一致带来的分支发散；另外浮点还能承载「未完成 / 进行中 / 已完成」以及计数（用较大值域）这类信息，便于用同一套比较逻辑。代价是浮点比较不能直接用 `==`，必须用约定值（如 0.0 / 1.0）或容差比较——这也是原同步机制出错的地方：**用浮点做了等值判断，却假设它一定精确**。

**Triton / CuTe 这类 DSL 为什么流行。** 从开发角度：把「块划分、共享内存、流水线、线程映射」这些重复劳动抽象掉，用 Python 级别的语法描述 tile 级计算，**开发效率比手写 CUDA 高一个量级，且更容易做 autotune**（同一 kernel 扫不同的 BLOCK_SIZE / num_warps / num_stages，自动挑最优）。从业务角度：算子迭代要快、要能跟上新模型结构（MoE、滑窗、量化），手写 CUDA 的开发成本和维护成本都压不住；同时 Triton 生成的 kernel 在多数访存受限场景已经接近手写水平，只有极端场景（精细的异步拷贝、warp 特化、TMA）才需要下探到 CuTe/CUTLASS 甚至裸 CUDA。所以合理分层是：**能用 Triton 写就用 Triton，性能瓶颈明确且 Triton 表达不了再往下走**。

**Router Replay 的作用与消费点。** MoE 训练里，rollout（推理/生成）阶段路由到的专家是当时算出来的，训练阶段如果重新算路由，会出现「同一条序列在 rollout 和 train 走的专家不一致」，导致重要性采样比失真、梯度有偏。Router Replay 就是把 rollout 阶段每个 token 在每一层的 **Top-K 专家索引与路由权重** 存下来，训练的前向在 MoE 层**读取这份记录**，强制走同样的专家、并用记录的概率算重要性权重。所以消费点在 **训练前向的 MoE 层入口**（拿到 token→experts 映射之后再 dispatch），存的地方通常是按 (layer, token) 组织的索引张量。这属于线上训练遇到的工程方案（RL / 蒸馏链路里为了让 actor 与 rollout 分布一致），不是论文复现。

**单个 token 进入 MoE 的前向流程，与 EP 并行。** 顺序是：token 的 hidden state → **gate/router 线性层**算出对 N 个专家的 logits → softmax / sigmoid 后取 Top-K（常见 K=1、2 或 8）→ 得到专家索引和门控权重 → **按专家分组重排（permute / dispatch）** → 把 token 的 token 级数据发到持有对应专家的 rank（EP 并行下这一步是 all-to-all）→ 各专家做 FFN（两三个矩阵乘 + 激活）→ **反向重排（combine / unpermute）** 回原 token 顺序 → 乘以门控权重后与残差相加。EP 并行下通信开销集中在两次 all-to-all，工程上要解决的是分组后的负载不均（capacity factor / drop token 策略）、通信与计算 overlap（用分组 GEMM 把多个专家的计算合成一个 batched GEMM），以及 EP 组内 rank 数与专家数的对应（专家多、卡少时一个 rank 放多个专家）。

**滑动窗口 Attention 确定性反向的优化思路。** dQ 是各 key 位置贡献的累加，朴素实现里每个 key block 算完都要原子累加或串行等待，形成长依赖链。优化方向是**减小同步域 + 重排执行顺序**：把 key 按 block 切分，让每个 block 的 dQ 贡献先在**寄存器 / 共享内存内局部累加**，只在 block 边界做一次跨线程 / warp 的归约（用 warp shuffle 替代 shared memory 往返）；再把互相独立的 block 的计算排成流水（prefetch 下一块的 K/V 到 shared memory，与当前块计算 overlap），把「等待」填满。要保证确定性，关键是**固定累加顺序**：既然浮点加法不满足结合律，就必须让归约树（tree reduction 的配对顺序）和分块顺序固定不变，不能依赖 atomicAdd 的到达顺序、也不能因为线程调度不同而改变配对；工程上通常用「每个 warp 负责固定的一段 key 区间 → 按固定顺序做树形归约」来保证同一输入每次输出 bitwise 一致（这也是 flash attention 反向能在训练里用的前提）。

**国产 GPU 算子 Benchmark 怎么做。** 至少四个维度分开测：**正确性**（与参考实现逐元素比对，明确容差与数值类型，覆盖边界 shape 和 NaN/Inf 路径）、**性能**（用统一 harness 固定 dtype、shape、warmup 次数和测量方式，报告 P50/P90 的 kernel 时间与端到端时间，区分计算时间与 launch 开销）、**资源**（显存占用峰值、寄存器 / 共享内存使用、occupancy）、**可移植性**（同一 kernel 在不同型号上的表现差异）。对比对象要明确：自研 kernel 对比 **厂商高性能库（如 cuBLAS/cuDNN 的对应实现或国产厂商的 BLAS）**、对比 **未优化版本 / 旧版本**、以及对比 **论文 / 开源实现的公开数字**（注明硬件不同，不能直接比）。报告里必须写清硬件型号、驱动 / 编译器版本、编译 flag、shape 列表——否则数字不可复现。常用工具：nsys / ncu（NVIDIA 侧）、厂商 profiler、以及 `torch.utils.benchmark` 这类可控 warmup 的封装。

**GPU 架构与互联对算子性能的影响，一句话：先看算术强度，再看访存，最后看互联。** 显存带宽决定访存受限算子（elementwise、norm、attention 的 softmax 部分）的上限，L2 / 共享内存决定数据复用能省多少；计算单元（SM 数、Tensor Core 支持的数据类型与吞吐）决定计算受限算子（GEMM、卷积）的上限。多卡互联（NVLink / NVSwitch vs PCIe vs 国产互联）直接决定通信受限算子的效率——TP 每层都要 all-reduce，互联带宽低就变成通信瓶颈，这时候要么改并行策略（TP 换 PP/DP、减少 TP 度）、要么上通信与计算 overlap、要么改算法（ZeRO、梯度压缩）。判断瓶颈的方法论是 **roofline**：算出算子的 arithmetic intensity（FLOPs / Bytes），和硬件的 compute/bandwidth 比值比较，就能预判它是 compute-bound 还是 memory-bound，再决定优化方向（前者做 tiling 与 Tensor Core 利用，后者做融合与减少冗余访存）。

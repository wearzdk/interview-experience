---
title: 新紫光一面（算子工程师）：ncu 与 nsys、roofline 模型
company: "新紫光"
position: "算子工程师"
round: 一面
date: '2026-09'
source: 牛客网
tags: ["算子开发","CUDA","GPU架构","roofline","性能优化","C++"]
summary: "新紫光算子工程师一面，25 分钟、没手撕、八股很少：重点问 ncu 与 nsys 的区别与作用、常用卡的存储架构与带宽量级、峰值性能与计算单元和寄存器、roofline 模型、大模型算子，以及 C++ 的 inline。"
---

### 《面试题目》

1. 自我介绍。
2. 项目拷打（问得不算深）。
3. ncu 和 nsys 的区别和分别的作用？
4. 讲一下你常用的卡的存储架构和带宽数量级。
5. 峰值性能是多少？有多少计算单元、多少寄存器？
6. 介绍一下 roofline 模型。
7. 对 AI 大模型这块的算子有了解过吗？
8. C++ 八股之 inline 的作用。

### 《参考解析》

**ncu 与 nsys：一个看全局，一个抠细节**

用一句话区分：nsys 回答「时间花在哪」，ncu 回答「这个 kernel 为什么慢」。Nsight Systems（`nsys profile`）做系统级时间线剖析，把 CPU 线程、CUDA API 调用、kernel 起止、内存拷贝、同步点、NVTX 区间全部摆在同一条时间轴上，能看出 kernel 之间的空隙、拷贝有没有和计算重叠、是不是在等数据。Nsight Compute（`ncu`）做单 kernel 的深度指标采集：SM 与 Tensor Core 利用率、occupancy、寄存器与共享内存使用、访存效率（L1/L2/DRAM 吞吐、命中率、sector 效率、bank conflict）、warp 停顿原因、指令吞吐，并直接给出 roofline 图。标准流程是先用 nsys 找到热点 kernel 和整体瓶颈，再用 ncu 逐个分析。注意 ncu 会 replay kernel、串行化执行，profiling 开销很大，别在全量训练时开全套指标。

**存储层次与带宽数量级**

以主流数据中心卡为例（答题时说明具体型号并给出量级）：寄存器堆每个 SM 256 KB；共享内存与 L1 共享同一块物理存储，A100 每 SM 可配到 192 KB、H100 到 256 KB；L2 在 A100 是 40 MB、H100 是 50 MB；片外是 HBM，A100 80GB 版本带宽约 2.0 TB/s，H100 SXM 的 HBM3 约 3.35 TB/s。卡间用 NVLink，A100 约 600 GB/s、H100 约 900 GB/s。消费级卡（如 RTX 4090）用 GDDR6X，带宽约 1 TB/s、L2 72 MB，差别主要在带宽和 ECC。这些数字不要死背，要说明怎么查：`nvidia-smi -q` 看显存与带宽，CUDA samples 里的 `deviceQuery` 看每 SM 的寄存器数、共享内存和计算单元数。带宽量级的意义在于：算子优化先判断它是带宽瓶颈还是算力瓶颈。

**峰值性能、计算单元与寄存器怎么答**

按 SM 拆开讲。以 A100 为例：108 个 SM，每个 SM 有 64 个 FP32 核心、4 个第三代 Tensor Core、64K 个 32 位寄存器（合计 256 KB）、最多常驻 2048 个线程，单线程最多用 255 个寄存器。峰值 FLOPS 等于核心数乘频率乘 2（一次 FMA 算两次浮点运算），Tensor Core 的峰值要区分精度（TF32、FP16、BF16、FP8 差好几倍）和稠密与稀疏（稀疏通常标称两倍）。回答时补一句实际可达性：真实 kernel 一般能到峰值的 60% 到 80%，所以先看利用率再谈优化空间。

**roofline 模型**

横轴是算术强度（每字节访存对应的浮点运算次数，单位 FLOP/Byte），纵轴是可达性能。屋顶由两条线组成：斜线是「内存带宽乘算术强度」，代表带宽限制区；水平线是芯片峰值算力，代表算力限制区；两条线的交点是机器的平衡点，等于峰值算力除以带宽。它的用途是判断一个 kernel 落在哪个区域，从而决定优化方向：落在斜线一侧说明是 memory bound，要减少访存、提高数据复用（共享内存 tiling、寄存器分块）、做合并访问和向量化加载；落在水平线一侧说明是 compute bound，要靠 Tensor Core、降低精度、减少冗余计算。举例：A100 的 FP32 平衡点约 19.5 TFLOPS 除以 1.55 TB/s，大概 12 到 13 FLOP/Byte，如果用 FP16 Tensor Core，平衡点会大幅右移，意味着同一个 kernel 的相对位置会变，这也是混合精度能提速的原因。

**大模型里的常见算子**

矩阵乘（GEMM，含 batched GEMM，MoE 场景里的 grouped GEMM）、注意力（FlashAttention 用分块加在线 softmax 加反向重计算把中间矩阵留在片上，避免物化 N×N 的注意力矩阵）、归一化（LayerNorm、RMSNorm，通常和前后算子融合）、位置编码（RoPE）、激活（SiLU、GELU，常和 GEMM 融合成 SwiGLU 这类融合算子）、KV Cache 管理（PagedAttention 的分页存储与重排）、量化算子（反量化加 GEMM 融合、INT8/FP8 的 scale 处理）、通信算子（AllReduce、AllGather、ReduceScatter，要和计算 overlap）、采样（top-k、top-p）。能指出「融合」和「访存优化」是大模型算子优化的两条主线，比罗列名字更有价值。

**C++ 中 inline 的作用**

`inline` 是给编译器的建议：在调用点直接展开函数体，省掉调用开销（压栈、跳转、返回），更重要的是让跨函数的优化成为可能，比如常量传播、死代码消除、更优的寄存器分配。它只是建议，编译器有自己的成本模型，`-O2` 之后小函数本来就会被自动内联，需要强制时用 `__forceinline` 或 `always_inline`。副作用是代码膨胀、指令缓存压力变大、调试困难。另一个语义常被忽略：在头文件里定义函数必须加 `inline`（或 `static`），否则多个编译单元会产生重复符号、链接报错，类内定义的成员函数隐式就是 inline。回答时可以顺带对比宏：inline 有类型检查和作用域，宏没有。

**反问可以问什么**

算子岗值得问的是：技术栈（CUDA、Triton 还是自研 DSL）、目标硬件与自研芯片的进展、日常工作偏写新 kernel 还是做性能优化与模型适配、以及性能指标怎么定（和哪个基线比、达标口径是什么）。

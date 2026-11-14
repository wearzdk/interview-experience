---
title: "中信银行金融科技（人工智能）一面：大模型请求链路、CUDA 优化与算子融合"
company: 中信银行
position: 金融科技（人工智能）
round: 一面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/a14fc690213b4628b05d054765d032f3
tags: ["中信银行","金融科技","大模型","CUDA","算子融合","推理加速","Auto-tuning"]
summary: "中信银行金融科技岗（人工智能方向）线上一面，15 分钟、4 位面试官，原以为是半结构化行为面，实际是纯技术面：一个请求从进入大模型到流式返回经历哪些环节与资源（实际想考 message 的构成）、CUDA 计算优化的原理、为什么通用计算在不同硬件上性能不同、观点题「所有算子都应尽量在 GPU 上跑」、算子融合的常见算法与场景、如何优化算子、是否调研过 auto-tuning、多模态大模型调优经验，以及做的是工程层还是模型层优化。"
---

### 《面试题目》

1. 一分钟自我介绍。
2. 一个请求从进入大模型到流式返回，经历哪些环节，各自作用是什么，涉及哪些资源？（实际想问一个请求 message 的构成）
3. CUDA 计算优化的原理是什么？为什么同一份通用计算在不同硬件上性能会有差异、必须做优化？
4. 观点题：「所有算子都应该尽量在 GPU 上跑，因为 GPU 快」，你认可吗？
5. 算子融合常见的算法与场景有哪些？
6. 如何优化算子？
7. 调算子很辛苦，你有没有调研过 auto-tuning 这类自动调优 / 自动设计的方法？
8. 接触过多模态大模型调优吗？
9. 你做过工程层优化还是模型层优化？有没有做过大模型算子调优、推理加速？

### 《参考解析》

**一个请求的完整链路**：客户端把对话历史与系统提示词组装成 messages（role + content，可能含图片、工具定义），HTTP 请求到网关做鉴权、限流、路由；服务端做模板渲染（chat template）、tokenize，得到 input_ids；调度器把它排进批次（continuous batching），分配 KV Cache 的显存块（PagedAttention 这类分页管理）；模型前向先做 prefill（一次算完整个 prompt，计算密集），再做 decode（逐 token 自回归，显存带宽密集），每步从 logits 采样（temperature、top-p、repetition penalty）；采样出的 token 增量 detokenize 成文本，通过 SSE / WebSocket 流式回传，直到遇到停止符或达到 max_tokens；结束后释放 KV Cache、记录用量。涉及的资源：GPU 算力与显存（权重 + KV Cache + 激活值）、CPU（tokenize、调度）、网络带宽（流式回传）、以及上游模型的配额与并发限制。面试官说「实际想问 message 的构成」，是把这条链路收窄到请求体：system / user / assistant 三类角色、多轮历史如何拼接、工具调用与图片如何编码、以及 token 数怎么估算。

**CUDA 优化的原理**：GPU 是 SIMT 架构，以 warp（32 线程）为单位调度，靠大量并发线程隐藏访存延迟；优化的核心是三条——提高并行度与占用率（足够的 warp 掩盖延迟，受寄存器与共享内存限制）、优化访存（合并访问 global memory、用 shared memory 复用数据、避免 bank conflict、提高 arithmetic intensity）、减少同步与分支发散（warp 内分支会串行化）。同一份通用计算在不同硬件上性能不同，是因为 SM 数量、每 SM 的寄存器/共享内存、显存带宽与容量、L2 缓存、Tensor Core 支持与指令集都不同：一个在 A100 上能塞满 SM 的 kernel，到了消费级卡上可能因显存带宽不足或占用率低而慢数倍；同一份代码的可扩展性也不同（多卡还要考虑 NVLink / PCIe 拓扑）。所以「写一次到处跑」只在正确性层面成立，性能必须针对目标硬件调参。

**「所有算子都在 GPU 上跑」对吗**：不认可。判断依据是「计算密度 + 数据搬运成本 + 启动开销」。GPU 适合大规模并行、计算密集、数据可批处理的算子（GEMM、卷积、attention）；小算子、逐元素小张量、形状频繁变化的算子，kernel 启动与主机-设备同步的开销会超过计算收益；某些控制流复杂、分支多的逻辑在 CPU 上更快；还有些算子受显存容量限制根本放不下。真实推理是 CPU 与 GPU 协同：CPU 做调度、tokenize、采样与后处理，GPU 做矩阵运算，中间还有 host-device 拷贝的取舍（能留在显存就不要来回搬）。更准确的说法是「按 roofline 模型判断：算力受限放 GPU，带宽受限先看能不能融合或量化，延迟敏感的小算子考虑留在 CPU 或做融合」。

**算子融合**：本质是减少中间结果的写回与读取（省显存带宽）和 kernel 启动次数。常见形态：逐元素融合（把 add、mul、relu、layernorm 这类 elementwise 链合成一个 kernel）、GEMM epilogue 融合（矩阵乘后直接接 bias、激活、残差，在输出时顺手算掉，避免再读写一遍）、attention 融合（FlashAttention 把 QK^T、softmax、PV 融合成分块计算，不落地 n×n 注意力矩阵）、归一化与残差融合、量化融合（dequant → GEMM → quant 一体）。图层面还有算子消除（恒等、无用 cast）、常量折叠、布局转换合并。实现路径有手写 CUDA / Triton kernel、编译器自动融合（TVM、XLA、TensorRT 的 layer fusion）以及推理框架的图优化 pass。

**auto-tuning**：确实有成熟方法。搜索式：TVM 的 Ansor / AutoTVM、Triton 的 `autotune`、cuDNN / cuBLAS 的启发式与 benchmark 模式，给定算子与硬件，在切分、向量化、流水、线程块配置的搜索空间里实测选最优。代价是编译与测量时间，所以会缓存 tuning 结果（按 shape + 硬件做 key）。模型式：用代价模型预测性能、或用强化学习 / 进化搜索生成调度（Ansor 的 sketch + annotation 就是这一路）。再往前是自动算子生成（如基于大模型的 kernel 生成），目前仍需人工校验正确性与数值稳定性。工程上更常见的做法是「用厂商库 + 少量热点算子手调 + autotune 兜住形状变化」。

**工程层与模型层**：工程层优化指推理框架与系统侧——批处理调度、KV Cache 管理、量化（INT8 / FP8 / AWQ / GPTQ）、算子融合、并行切分、显存复用、服务编排；模型层指结构改动、蒸馏、剪枝、稀疏化、训练策略。多模态调优则涉及视觉编码器与语言模型的对齐（projector 训练、分辨率与 token 压缩、图文数据配比）。回答时按自己真实做过的说，做过的部分讲清「瓶颈在哪、改了什么、指标变化多少」，没做过的直接说没做过并说明了解到的路径，比硬编经历安全。

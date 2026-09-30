---
title: "快手 AI Infra 一面面经（同场重复投稿）：Attention 算子优化、prefill 与 decode 调度及量化"
company: "快手"
position: "AI Infra"
round: "一面"
date: '2026-09'
source: 牛客网
tags: ["AI Infra", "推理优化", "Attention", "Triton", "性能分析", "量化", "AWQ", "GPU"]
summary: "快手 AI Infra 一面面经（同场重复投稿，题目与另一篇相同）：围绕 Attention 重构、Triton 算子、profile 与 Roofline、prefill 与 decode 调度、线性注意力、AWQ 与 W8A16 追问。"
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

1. **Attention 重构优化什么**：标准注意力的开销大头不是浮点运算，而是把 Q、K、V 与中间矩阵在显存和片上内存之间反复搬运。分块 + online softmax 的思路是把数据切块放进 shared memory 与寄存器，边算边更新归一化因子，不物化完整的 n×n 注意力矩阵，HBM 读写量因此大幅下降。可展开的点还有：算子融合（softmax、mask、dropout 合成一个 kernel）、只算 causal 下三角、变长序列打包减少 padding、访存合并与避免 bank conflict、以及用 tensor core 承担矩阵乘。判断优化是否有效最终都要看实测吞吐与显存占用，不能只看代码「看起来更快」。

2. **profile 与瓶颈判断**：先用端到端指标（吞吐、TTFT、TPOT、显存峰值）圈出慢在哪个阶段，再用框架层 profiler（PyTorch Profiler、Nsight Systems）看时间轴上的 kernel 空隙、同步点与拷贝，最后用 ncu 看 kernel 内部的计算利用率、访存吞吐、warp 停顿原因与占用率。Roofline 屋顶线模型给的是判断框架：计算强度低、落在斜线上就是访存受限，要想办法提高数据复用或减少搬运；落在平顶就是计算受限，要换更快的计算单元或减少计算量；此外还有一类「延迟隐藏不足」——资源占用过高导致驻留 warp 太少，SM 空转。常见信号是「大量小 kernel 连续启动」说明该融合、「GPU 利用率低而端到端延迟高」说明在等 CPU 或等通信。GPU 架构基础要能顺口说出 SM 是执行与调度单元、warp 是 32 线程的调度粒度、同 warp 分支发散会串行执行。

3. **Triton 能做什么、不能做什么**：Triton 提供块级编程模型，线程映射、共享内存与流水线交给编译器，写融合算子比 CUDA C 短得多，适合快速验证算法与做规整的访存密集型融合（softmax、layernorm、简单 attention 变体）。需要 warp 级原语、异步拷贝、cluster 或极端手工流水时，还得回到 CUDA 或 CUTLASS / cuBLAS。答「用 Triton 解决了什么问题」时，落到具体数字才有说服力：融合后减少了多少次显存往返、分块与 num_warps 怎么配、相比原生实现快了多少。

4. **prefill 与 decode 的调度冲突**：prefill 是计算密集、能吃满算力，decode 每步只出一个 token、要读整份 KV cache，属于访存密集且延迟敏感。长 prefill 占住 SM 就会让正在解码的请求卡顿，所以主流方案不是让 prefill 抢占 decode，而是 chunked prefill——把长 prompt 切片，与 decode 请求拼进同一个 batch 交替跑，牺牲一些首 token 延迟换取解码的稳定；另一种方向是 P/D 分离，prefill 与 decode 各用一组实例，中间传 KV cache。调度器层面要讲清连续批处理（每步结束就换出完成的请求、换入新请求）、显存不足时的抢占策略（KV 换出到 CPU 或丢弃后重算，重算省传输费算力）、以及长请求的公平性。取舍最终落到 SLO：TTFT 看 prefill 排队，TPOT 与吞吐看批处理效率。

5. **线性注意力、AWQ 与 W8A16**：线性注意力利用矩阵乘结合律，先算 K 与 V 的外积并维护一个固定大小的递推状态，把复杂度从 O(n²) 降到 O(n)，推理时状态与序列长度无关；代价是表达能力下降，长程精确检索效果通常不如标准注意力，所以落地常见的是混合层或小模型。AWQ 的出发点是「权重里少数通道更重要，且重要性与激活幅度相关」：按通道统计激活尺度，对重要通道放大权重再量化以压低误差，缩放可以融进前一层，因此不需要反向传播、校准数据需求小。W8A16 的 forward 是权重以 int8 加分组缩放因子存储、激活保持 FP16，计算时在 kernel 内反量化回 FP16 再与激活做矩阵乘；收益来自显存占用与权重读取带宽，在访存受限的 decode 阶段最明显，而如果反量化被拆成单独一遍 kernel，多出来的显存往返会把收益抵消掉，所以实现上要融合。「意向方向：训练还是推理」提前准备一个和自身项目对得上的理由即可。

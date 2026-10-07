---
title: "滴滴 AI Infra 算法岗一二面面经"
company: "滴滴"
position: "AI Infra 算法工程师"
round: "一面二面"
date: '2026-10'
source: 牛客网
tags: ["AI Infra","大模型推理","KV Cache","CUDA","分布式训练"]
summary: "滴滴 AI Infra 算法岗一二面面经：一面考 Attention 架构优化、KV Cache 管理、MLA 与线性注意力、GQA 显存估算与 DeepSpeed ZeRO，二面追问调度细节并手撕 CUDA 算子。"
---

### 《面试题目》

**一面**

1. 介绍你的个人经历与实习核心工作。
2. 实习中做过哪些 Attention 架构优化？
3. 行业如何界定长序列？聚合阶段为什么不能做计算优化？
4. 你的 KV Cache 管理方案是什么？新架构如何适配？
5. MLA 与 SFA 的核心区别是什么？如何解释线性注意力？
6. 线性注意力系列方法相比 GQA，能降低多少 KV Cache 开销？
7. GQA 结构下，一次推理需要多大的 KV Cache 显存？
8. 流水线调度（Pipeline）具体做了哪些优化？还有什么优化空间？
9. 训练场景中你参与过哪些工作？DeepSpeed 使用细节？
10. DeepSpeed Zero2/Zero3 的通信开销来源、显存降幅分别是多少？
11. AdamW 优化器为什么会占用 4 倍模型参数量显存？
12. 手撕：CUDA 实现 RMSNorm、Softmax、Online Softmax、SwiGLU。

**二面**

13. 流水线调度优化的动机、具体做法、解决的核心问题？
14. 延迟预测模型是小模型还是传统机器学习算法？
15. 是否改过调度层逻辑？多用户不等长序列如何统一处理？
16. 序列切割落在框架哪一层？分布式 Decode 阶段你做了哪些优化？
17. 你的调度方案相比原有方案，吞吐提升指标是多少？
18. 原生展平调度的缺陷是什么？MTP 方案相比你的方案优劣？
19. 你的 C++、CUDA 工程基础掌握情况如何？
20. PyTorch Dispatch 机制、Kernel 选择全过程？
21. Torch Compile、Dynamo、Inductor 底层原理是什么？
22. CUDA Graph 与 Torch 编译优化的关系？堆和栈的区别？
23. 手撕：实现 LRU Cache，并解释 O(1) 复杂度原理。
24. NanoVLLM Chunk Prefill 原理、是否劣化 TTFT？Triton 精度异常如何 Debug？

### 《参考解析》

1. **长序列的界定与聚合阶段为何不做计算优化**：长序列没有公认阈值，工程上通常按「注意力计算量随长度平方增长、KV Cache 随长度线性增长」的拐点来划，把远超训练长度、或单次 prefill 就撑爆显存的长度视为长序列。解码阶段的聚合（reduce、softmax 归一）属于访存密集型操作，算力用不满，瓶颈在显存带宽与 kernel 启动开销，所以优化方向是减少访存和合并 kernel，而不是减少浮点运算量——回答时把「算力受限还是带宽受限」这条判断讲出来，比直接背优化手段更得分。
2. **KV Cache 管理与显存估算**：显存大小约为 2（K 和 V）× 层数 × KV 头数 × head_dim × 序列长度 × batch × 每元素字节数。GQA 让多个 query 头共享一组 KV 头，按分组比例直接降低这部分占用，MQA 是极端情形。管理上主流是分页（PagedAttention）把 KV 切成固定大小的块按需分配，配合前缀共享与换出（swap、offload）应对碎片和超长上下文。换到 MLA 这类压缩架构后，缓存对象从完整 K/V 变成低秩潜向量，块划分与换出策略都要跟着改。
3. **MLA、线性注意力与 GQA 的差别**：MLA 走低秩压缩加解耦位置编码的路线，缓存压缩后的潜向量，显存降幅大且质量损失可控；线性注意力把 softmax 注意力换成可结合的核函数，推理复杂度从 O(n²) 降到 O(n)，代价是表达能力受限、长程依赖容易丢，实践中往往用混合层来补。被问「能降多少」时，给定层数、头数、head_dim 与分组数自己推一遍公式，比背一个百分比可信得多。
4. **流水线调度与延迟预测**：调度要解决的是多用户、不等长请求、prefill 与 decode 混在一起时怎么排——既不饿死请求，又要把算力打满。常见手段是 chunked prefill 与 decode 混批、按 token 预算而不是请求数组批、设置优先级与抢占（被抢占的请求重算或换出 KV）。延迟预测一般走轻量方案，小模型或梯度提升树这类传统方法即可，输入是序列长度、批次组成与历史耗时；在服务主链路上用大模型做预测不划算。
5. **DeepSpeed ZeRO 与优化器显存**：混合精度下权重与梯度各占 2 字节，AdamW 还要维护一阶动量和二阶动量各 4 字节，再加 4 字节的 fp32 主权重，合计每参数约 16 字节，即相对 2 字节的推理权重是 4 倍参数量级。ZeRO-1 切优化器状态、ZeRO-2 再切梯度、ZeRO-3 连参数也切，显存逐级下降直到接近除以总卡数；代价是每一级都引入额外的 all-gather 与 reduce-scatter 通信，切得越细通信越多，跨节点带宽不足时训练会被通信拖住。
6. **CUDA Graph、torch.compile 与 dispatch**：PyTorch 的 dispatch 是按算子类型、dtype、设备和布局逐层选 kernel 的过程，会产生大量 host 端小开销；Dynamo 负责抓图，Inductor 生成融合后的 Triton 或 C++ kernel，减少算子数量与访存；CUDA Graph 把一串 kernel 启动录制下来整体回放，直接消掉启动开销。两者互补：编译减少 kernel 数量，图回放降低启动成本，decode 这种小 kernel 密集的场景收益最明显。
7. **手撕题的关键点**：CUDA 实现 RMSNorm、Softmax、Online Softmax、SwiGLU，考的是访存合并、warp 内归约与数值稳定性——Online Softmax 靠 running max 和 running sum 在一次遍历里完成，避免把整行存下来；RMSNorm 注意规约维度与 rsqrt 的数值处理。LRU Cache 用哈希表加双向链表，命中就把节点移到表头，超容量淘汰表尾，两个操作都是 O(1)。这类题写之前先说清数据布局与边界条件，比闷头写代码更容易拿到分。
8. **Chunk Prefill 与 Triton 精度排查**：Chunk Prefill 把长 prompt 切成若干块分次前插，好处是首 token 之前就能和其他请求的 decode 混批，整体排队时间下降，代价是单个请求的 TTFT 可能略微变大，属于吞吐与时延的取舍。Triton 精度异常先做二分定位：逐步注释掉算子片段、与 PyTorch 参考实现逐元素对齐、检查累加精度与是否误用了 tf32，再查边界处理与 mask 是否漏项，最后才怀疑硬件或编译器。

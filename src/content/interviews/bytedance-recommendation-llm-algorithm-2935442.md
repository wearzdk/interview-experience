---
title: 字节推荐大模型算法岗一二面：归一化、MoE 与 Attention 细节
company: 字节跳动
position: 推荐算法
round: 一二面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/d3b066e68d644334b14bcf8e199376f9
tags: ["字节跳动","推荐算法","大模型","MoE","BatchNorm","Transformer"]
summary: "字节推荐大模型算法岗一二面：一面围绕论文项目与 Transformer 基本功（BN/LN、Pre-Norm/Post-Norm、Softmax 溢出、Attention 缩放）加手撕最长有效括号；二面转向 MoE（稀疏体现在哪、Router 与 Top-K、专家坍缩、负载均衡）与实验方法论，手撕编辑距离。"
---

### 《面试题目》

1. 简要介绍一下你的论文项目。
2. BatchNorm 和 LayerNorm 有哪些区别？
3. Transformer 里改用 BatchNorm，为什么训练和推理结果会不一致？
4. Softmax 发生数值溢出，该如何处理？
5. Pre-Norm 和 Post-Norm 有什么区别？
6. Attention 为什么要除以 √d_k？不除会出现什么现象，对 Softmax 输出和梯度有什么影响？
7. 手撕算法：最长有效括号。
8. MoE 和多头注意力（Multi-Head Attention）的区别是什么？
9. Sparse MoE 的「稀疏」体现在什么地方？
10. Router、Top-K Expert 的工作流程是怎样的？
11. 什么是 Expert Collapse（专家坍缩）？
12. MoE 为什么要做专家负载均衡？
13. 给 Attention 加上 Gate 机制，和 MoE 还有什么本质差别？
14. 模型效果提升时，如何排除参数量变大等无关变量的影响？
15. 消融实验里，怎么证明性能提升来自新增模块？
16. 手撕算法：编辑距离。

### 《参考解析》

**BN 与 LN**：BatchNorm 在 batch 维度上统计均值方差，依赖同批样本，训练用批统计、推理用滑动平均，批大小小的时候统计不稳，也不适合变长序列；LayerNorm 在单个样本的特征维度上统计，与批无关，训练推理一致，因此 Transformer 这类变长序列默认用 LN。把 BN 搬进 Transformer 会不一致的根因就是训练/推理统计口径不同，加上 padding 位置会把无效 token 的统计混进去。

**Softmax 数值溢出**：实现上先减去输入的最大值（`x - max(x)`）再取指数，保证最大项为 1、不会溢出；分母求和后再取对数时用 log-sum-exp 技巧。混合精度下还要注意上溢用 fp32 计算 softmax、或对 logits 做 clamp。

**Pre-Norm 与 Post-Norm**：Post-Norm 是 `LN(x + Sublayer(x))`，原始 Transformer 的做法，梯度路径上每层都要过 LN，深层训练需要 warmup、容易不稳；Pre-Norm 是 `x + Sublayer(LN(x))`，残差是恒等通路，梯度能直通底层，深层更稳、可以不加 warmup，代价是表达能力和最终效果有时略逊，常用在最后加一层 LN 补偿。

**为什么要除 √d_k**：点积的方差随维度 d_k 线性增长，不缩放会让 logits 数值很大，softmax 变得接近 one-hot，输出的分布熵极低、梯度趋近于 0，训练几乎不动。除以 √d_k 把方差拉回 1 量级，保持 softmax 在梯度敏感区间。

**MoE 与多头注意力**：多头注意力是所有头对同一批 token 都算一遍再拼接，参数量固定、每个位置都用全部参数；MoE 是在 FFN 层放多个专家，由 Router 对每个 token 只激活少数几个专家，用条件计算换容量——总参数量可以很大，但单次前向的算力只按激活的专家算。稀疏体现在每个 token 只走 Top-K（常为 1～2）个专家，其余专家不参与该 token 的计算；Router 用一个小线性层给每个专家打分，取 Top-K 做加权求和，训练时还要处理负载均衡与路由的不可导问题（如 gumbel 扰动、辅助损失）。

**Expert Collapse 与负载均衡**：路由会自我强化——被选得多的专家梯度多、学得更好、更被选中，最后少数专家吃掉全部 token、其余专家废弃，这就是专家坍缩。所以要加辅助负载均衡损失（如 Switch Transformer 的 importance/load loss）、专家容量上限与 token 丢弃、或 router z-loss 控制 logits 幅度。

**Attention 加 Gate 与 MoE 的差别**：给注意力加门控只是对已有的头做加权（同一个参数集合内的软选择），计算量不变；MoE 是参数集合本身按 token 分流，不同 token 走不同的子网络，容量与算力解耦，并且需要路由、负载均衡、通信（专家并行）一整套机制。

**实验方法论**：排除参数量影响就做等参数对照——把小模型加宽到与改进模型同参数量再比，或者反过来把改进模型的参数量降到与基线一致；同时固定训练 token 数、学习率调度与数据，报多 seed 的均值方差。消融要一次只去掉一个模块，并给出「去掉后掉多少、加上后回到多少」的对照表；如果模块带来了额外参数，还要再补一个同参数量的对照组，才能说提升来自结构而不是容量。

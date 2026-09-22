---
title: "淘天集团 Agent 算法一面：SFT 超参、Muon 与 KV Cache"
company: "淘天集团"
position: "Agent算法"
round: "一面"
date: "2026-09"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/931957859154132992"
tags: ["淘天集团","Agent算法","大模型训练","SFT","Muon优化器","KV Cache","ReAct","多头注意力"]
summary: "淘天集团 Agent 算法一面：任务合成与清洗、bad pattern 重采样、RL 轨迹压缩与 SFT 超参，考 Adam 与 Muon 的区别、ReAct、KV cache 为什么只缓存 K 和 V，并用 torch 手写多头注意力。"
---

### 《面试题目》

1. 自我介绍。
2. 聊实习：任务合成用什么方法？数据怎么清洗？有没有考虑对 bad pattern 做修复和重新采样？
3. RL 中怎么解决轨迹 compact（上下文压缩）问题？
4. SFT 的具体参数是什么？学习率、优化器怎么选？知不知道 Adam 和 Muon 的区别？
5. 聊实习：你参与了哪些工作？
6. 讲一下你对 ReAct 的理解。
7. 为什么 KV cache 重要？为什么是对 K、V 做 cache 而不是对 Q 做 cache？
8. 编程题：用 torch 实现多头注意力（MHA）。
9. （反问环节）业务落地情况：团队做的是类似智能客服的 Agent 搭建与模型训练，涉及 SFT、RL、OPD 和 CPT。

### 《参考解析》

**SFT 的超参选择**

SFT 里真正影响结果的参数就那几个，重点是能说清"为什么这么设"，而不是背数字。学习率：全量微调通常 1e-5 ~ 2e-5（7B 级别），LoRA 要高一个量级（1e-4 ~ 2e-4），因为 LoRA 只训练低秩增量、参数量少、需要更大步长；QLoRA 因为量化误差还要再高一点。优化器：主流是 AdamW（β1=0.9、β2=0.95~0.999、weight decay 0.01~0.1，bias 和 norm 层不 decay），长上下文和大 batch 下 β2 取 0.95 更稳。调度：warmup 占总步数 3%~5%（避免初期大步长破坏预训练权重），之后 cosine 衰减到峰值的 10%。批量：全局 batch size 常用 64~128 条序列（可用梯度累积凑），序列长度按数据分布定、超长样本截断或分段。轮次：1~3 个 epoch，超过容易过拟合和灾难性遗忘——**SFT 的目标是"对齐格式和风格"，不是灌知识**，所以数据质量远比 epoch 数重要。此外要与数据特性挂钩：样本长度方差大时用长度分桶（length grouping）减少 padding 浪费；loss 只算在 answer token 上（mask 掉 prompt 部分）是常见但需要按任务决定的选择。

**Adam 与 Muon 的区别**

Adam（及其变体 AdamW）是逐元素的自适应方法：对每个参数维护一阶动量 m 和二阶矩 v，更新量约为 `m / sqrt(v)`，等价于对每个坐标做自适应缩放，尺度被归一化到接近 ±1。优点是几乎不需要调学习率、对稀疏梯度和不同尺度的参数都鲁棒；代价是要存两份状态（7B 模型优化器状态显存约为参数的 2 倍，混合精度下更多）、而且它的更新没有考虑参数矩阵整体的几何结构。

Muon 是 2024 年由 Keller Jordan 等人提出的优化器，核心差别在于**它是矩阵级的、而不是逐元素的**：对二维参数（隐藏层权重矩阵）先取动量，再用 Newton-Schulz 迭代把动量矩阵近似正交化（把奇异值都压到接近 1），然后按这个正交化后的方向更新。直观理解是——Adam 让每个元素步长一致，Muon 让整个矩阵更新在谱范数上受控，相当于对"更新方向"做了白化，从而可以用更大的学习率而不发散，实测在同等算力下收敛更快（论文报告约 1.35x 左右的加速）。工程差异：Muon 只适用于二维矩阵参数，embedding、输出层、norm、bias 仍然要用 AdamW（常见是混合使用）；它只需要存一阶动量，优化器状态显存比 Adam 少一半；代价是每次更新多一次 Newton-Schulz 迭代（一般 5 步）的计算开销，且对超参（学习率、动量、NS 步数）更敏感。面试里能说出"逐元素自适应 vs 矩阵级正交化、适用参数类型、显存与计算代价"这三点就够区分层次了。

**任务合成、数据清洗与 bad pattern 重采样**

任务合成一般是"种子 → 扩展 → 过滤"：从真实业务日志/人工种子任务出发，用强模型按维度模板（场景、工具组合、难度、多轮结构）批量生成候选任务，再让另一个模型或规则做校验与去重。合成最容易出的问题是分布漂移——生成的任务看着多样，实际集中在少数模板句式上，模型学到的只是格式。

清洗要按维度做：格式层（去重、去乱码、剔除超长/超短、特殊 token 处理）、正确性层（答案与工具调用结果对不上、逻辑不自洽、代码跑不通的一律丢）、多样性层（embedding 聚类去重、按意图/难度分桶控制配比）、安全层（去掉 PII 和越狱样本）。

bad pattern 的修复与重采样，是数据飞轮里收益最高的一环：做法是先用评测集/线上失败案例定位失败模式（例如"多轮指代消解错"、"工具参数漏填必填项"、"格式不合法"），再针对每个模式构造正负样本对——失败轨迹保留作为负例（用于 DPO/RL 的 rejected），并让强模型基于失败原因修复生成正例，然后**只对失败模式对应的分布做加权重采样**，而不是整体重训一遍。要注意两点：负例的比例不能过高（否则模型学到"不敢调用工具"这类退避行为），修复样本要人工抽检，避免把模型的错误当成监督信号。

**RL 中的轨迹压缩**

Agentic RL 的轨迹会很长（多轮工具调用 + 每次观测），直接喂进训练会遇到上下文超限、显存爆炸、信用分配困难三个问题。常用手段：① 结构化压缩——把冗长的工具返回（大 JSON、日志）在保留关键字段的前提下摘要化，只留决策需要的部分；② 分轮截断与滑窗——保留系统指令 + 最近若干轮完整内容，更早的轮次替换为摘要或"已执行的动作+结果"紧凑记录；③ 层次化摘要——每 N 轮用一个模型生成一段过程摘要，把摘要代替原始历史；④ 只对关键步骤回传梯度——把中间观测 token 的 loss 置零，只在决策（action）和最终答案上计算 loss，既省显存又让信用分配更集中；⑤ 工程上配合梯度检查点、序列并行、以及把 KV cache 在 rollout 阶段复用。核心判断标准是：压缩后模型的决策质量（用评测集验证）不掉，而单条轨迹 token 数明显下降——不能为了省显存牺牲掉决策所必需的信息。

**对 ReAct 的理解**

ReAct = Reasoning + Acting，把"思考"和"行动"交替展开：模型先输出一段推理（thought），据此决定调用哪个工具、传什么参数（action），环境返回结果（observation），再把观测拼回上下文进入下一轮，直到给出最终答案。它解决的问题是纯 CoT 的局限——CoT 只能靠模型内部知识推理，遇到需要外部事实或需要操作外部系统的任务就会瞎编；ReAct 让模型能用工具校验事实，并且推理过程可追踪（每步的 thought/action 都能打进 trace，便于定位是推理错还是工具错）。

实践中的关键点：要在 prompt 里固定 thought/action/observation 的格式并给 few-shot；必须设最大步数和重复检测（同一 action+参数连续出现就中断），否则模型会原地打转；工具描述决定选对率，要写"什么时候用、什么时候不用"；observation 要截断，否则上下文被工具返回撑爆；ReAct 每步都要一次 LLM 调用，延迟和成本随步数线性增长，所以长任务上常和 Plan-and-Execute 结合（外层给计划、内层用 ReAct 执行单步）。和它对比：CoT 无外部交互，Plan-and-Execute 先全局规划再执行、可控但僵化，Reflexion 在失败后反思重试。

**为什么缓存 K、V 而不是 Q**

自回归解码时，第 t 步的注意力是"当前这个 token 的 Q"去和"位置 1..t 的所有 token 的 K、V"做注意力。K 和 V 是历史 token 经过 `W_k`、`W_v` 投影得到的，**一旦某个 token 被处理过，它的 K、V 就固定不变**，所以可以缓存下来复用；而 Q 只由当前位置的 token 生成，每一步都是一个全新的 Q（第 t 步用完就丢，下一步的 Q 是另一个 token 的），缓存它没有任何复用价值——省不了计算，只白占显存。

收益有多大：不算 cache 的话，生成第 t 个 token 需要对长度 t 的序列重算全部 K、V 投影和注意力，总复杂度是 O(n²) 次投影、整个序列生成是 O(n³) 量级；有了 KV cache，每步只算新 token 的 Q/K/V 投影（O(n) 投影）和它与历史 K、V 的注意力（O(n)），整个生成降到 O(n²)。这也是为什么长上下文推理显存会被 KV cache 吃掉——它的大小是 `2 × batch × n_layers × n_kv_heads × d_head × seq_len × dtype_bytes`，序列越长线性增长。由此衍生出 MQA（所有头共享一份 K/V）、GQA（分组共享，Llama 2/3 常用）、PagedAttention（vLLM 把 KV cache 分页管理减少碎片）、以及量化 KV cache 这些工程优化，答到这里基本就展示出知识纵深了。

**手写 MHA**

关键点是把 `d_model` 拆成 `n_head × d_head`、先 reshape 再 permute 成 `(B, H, T, Dh)`，注意力用缩放点积、mask 用 `-inf` 填充后再 softmax，最后把多头拼回去过一层输出投影。

```python
import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, n_head, dropout=0.0):
        super().__init__()
        assert d_model % n_head == 0
        self.n_head, self.d_head = n_head, d_model // n_head
        self.qkv = nn.Linear(d_model, 3 * d_model, bias=False)
        self.proj = nn.Linear(d_model, d_model, bias=False)
        self.drop = nn.Dropout(dropout)

    def forward(self, x, is_causal=False, key_padding_mask=None):
        B, T, C = x.shape
        qkv = self.qkv(x).reshape(B, T, 3, self.n_head, self.d_head)
        qkv = qkv.permute(2, 0, 3, 1, 4)          # (3, B, H, T, Dh)
        q, k, v = qkv[0], qkv[1], qkv[2]
        att = (q @ k.transpose(-2, -1)) / math.sqrt(self.d_head)   # (B,H,T,T)
        if is_causal:
            mask = torch.tril(torch.ones(T, T, dtype=torch.bool, device=x.device))
            att = att.masked_fill(~mask, float('-inf'))
        if key_padding_mask is not None:          # (B, T)，True 表示该位置是 padding
            att = att.masked_fill(key_padding_mask[:, None, None, :], float('-inf'))
        att = self.drop(F.softmax(att, dim=-1))
        out = (att @ v).transpose(1, 2).reshape(B, T, C)
        return self.proj(out)
```

面试时值得主动补三句：① 生产里不会手写这段，直接用 `F.scaled_dot_product_attention`（会自动选 FlashAttention / 内存高效实现），手写只是为了说明理解；② 推理时 K/V 投影要接上 cache（`torch.cat([past_k, k], dim=2)`），并且 causal mask 在 decode 阶段通常省略（因为 query 长度只有 1，天然看不到未来）；③ 自测要注意 `-inf` 与全 mask 行会导致 softmax 出 NaN，以及 `float('-inf')` 在 fp16 下要用 `torch.finfo(dtype).min` 代替。

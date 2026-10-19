---
title: "三一树根强化学习算法一面：交叉熵、Attention 与贝尔曼方程"
company: "三一树根"
position: "强化学习算法"
round: "一面"
date: '2026-10'
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/53d2967fbb8449e7a3589186a15c4df9"
tags: ["三一树根", "强化学习算法", "Attention", "贝尔曼方程", "交叉熵", "位置编码", "MDP"]
summary: "三一树根强化学习算法一面：从交叉熵、过拟合等深度学习基础切入，追问 LLM 最后一层结构、梯度累积与 Attention 缩放，再考察贝尔曼方程、Return、MDP 等强化学习概念，最后要求手写 Attention。"
---

### 《面试题目》

1. 请做一个简单的自我介绍。
2. 了解交叉熵（Cross-Entropy）吗？请说一下它的定义是什么（可共享屏幕边写边说）。
3. 了解什么叫过拟合（Overfitting）吗？请说一下它的定义及解决方法。
4. 大语言模型（LLM）中最后一层网络是什么网络？
5. 大语言模型最后一层网络输出的 shape 是什么样子的？
6. 了解什么叫梯度累积（Gradient Accumulation）吗？
7. 请说一下 Attention 计算里面为什么要除以 $\sqrt{d_k}$？
8. 了解什么叫 Scaling Law（缩放定律）吗？
9. 强化学习了解吗？知道贝尔曼方程（Bellman Equation）吗？（提示：关于 $V^\pi(s)$ 和 $Q^\pi(s,a)$，或者是某个东西的期望）
10. 在强化学习中，你知道 Return（回报）是什么吗？（提示：关于奖励的一个东西）
11. 知道 MDP（马尔可夫决策过程）吗？请简单描述一下，它决定下一状态跟之前的状态有关吗？
12. 请手写一个简单的 Attention（注意力机制）代码/公式。
13. 了解位置编码（Positional Encoding）吗？请介绍一下常见类型。
14. 大模型预训练（Pre-training）时为什么要用交叉熵？它主要是对什么和什么进行计算？
15. 如果输入序列是 `1 2 3 4`（下一个是 `5`），它的训练标签（Label）应该是什么？
16. 你知道预训练（Pre-training）时和微调（SFT）时的学习率（Learning Rate）数量级大概分别是多少吗？

### 《参考解析》

**Attention 为何除以 √d_k**：点积 q·k 的每一项是 d_k 个分量相乘之和，若 q、k 各分量近似独立且方差为 1，则点积的方差约为 d_k，标准差随 √d_k 增长。维度一大，logits 数值就很大，softmax 会被推到接近 one-hot 的饱和区，梯度趋近 0，训练不稳定。除以 √d_k 相当于把 logits 的方差拉回 1 量级，让 softmax 输出更平滑、梯度更健康，这也是「缩放点积注意力」的由来。

**贝尔曼方程与 Return**：Return（回报）是从 t 时刻起的折扣奖励之和，G_t = r_{t+1} + γr_{t+2} + …，递推形式为 G_t = r_{t+1} + γG_{t+1}，它正是贝尔曼方程的来源。状态价值 V^π(s) 是策略 π 下从 s 出发的期望回报，满足 V^π(s) = Σ_a π(a|s)[r(s,a) + γ Σ_{s'} P(s'|s,a)V^π(s')]；动作价值 Q^π(s,a) = r(s,a) + γ Σ_{s'} P(s'|s,a)V^π(s')，且 V^π(s) = Σ_a π(a|s)Q^π(s,a)。最优情形把期望换成 max：V*(s) = max_a Q*(s,a)，Q*(s,a) = r + γ Σ_{s'} P(s'|s,a)max_{a'}Q*(s',a')。回答时先写 Return 的递推，再说「当前价值 = 即时奖励 + 折扣后的后继价值期望」，逻辑就闭环了。

**梯度累积**：显存放不下大 batch 时，把大 batch 切成若干 micro-batch 依次前向反向，梯度在参数上累加，攒够 k 次再更新并清零，等效 batch = micro_batch × k。要点是 loss 必须按累积步数缩放（通常每步除以 k），否则等效学习率会被放大 k 倍。Transformer 用 LayerNorm 而非 BatchNorm，归一化按样本进行，切分不影响统计量，因此梯度累积与真正的大 batch 基本等价，代价只是训练时间变长。

**预训练为何用交叉熵**：语言模型在每个位置输出词表上的分布 p，真实下一个 token 是 one-hot 的 q，交叉熵 H(q,p) = -Σ q_i log p_i 在 one-hot 下退化为 -log p(正确 token)，即最大似然估计，同时等价于最小化与真实分布的 KL 散度，梯度形式也很干净（p 减 one-hot）。标签是输入右移一位：输入 1 2 3 4，标签就是 2 3 4 5，第 t 个位置用前 t 个 token 预测第 t+1 个。最后一层是线性 LM Head，把 d_model 维隐状态映射到词表大小，输出 shape 为 [batch, seq_len, vocab_size]。

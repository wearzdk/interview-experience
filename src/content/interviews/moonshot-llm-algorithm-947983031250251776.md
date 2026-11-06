---
title: "月之暗面大模型算法一二面：GRPO 的每一个参数都要能往下推一层"
company: "月之暗面"
position: "大模型算法"
round: "一二面"
date: '2026-11'
result: "未通过（9.8 感谢信）"
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/947983031250251776
tags: ["月之暗面", "大模型算法", "GRPO", "PPO", "RL", "强化学习", "手撕"]
summary: "月之暗面大模型算法一二次面：从 SFT 数据与基座选型问到 GRPO 的 group size、advantage 归一化、KL 位置、长度偏置与 DAPO/GSPO 的改动，最后现场手写 GRPO loss。"
---

### 《面试题目》

1. 自我介绍，重点讲和 RL 相关的部分。
2. 你们这轮训练多少 token、几张卡、跑了多久、失败重来过几次？
3. 基座是哪个，7B 还是 32B，为什么选这个尺寸？
4. SFT 阶段的数据量、epoch、学习率、warmup 比例是多少？
5. SFT 之后直接上 RL，还是先做 rejection sampling 冷启动，为什么？
6. 讲一下 GRPO 和 PPO 的区别，为什么 GRPO 可以去掉 critic？
7. GRPO 的 group size 取多少？取 4 和取 16 的区别在哪，显存怎么算？
8. advantage 是 token 级还是序列级？组内归一化时分母用标准差还是标准误？
9. 如果一个 group 里 8 条采样全对，advantage 是多少，这时候 loss 是多少？
10. loss 变成 0，除了「全对」，还有哪几种可能？怎么判断是难度太低还是 reward 写错了？
11. KL 项加在 loss 里还是加在 reward 里？系数给多少，给大了会怎样？
12. 为什么 GRPO 训久了回复会变长？长度和正确率是正相关还是因果？长度惩罚怎么加才不伤害推理能力？
13. DAPO 改了哪几处？dynamic sampling 具体怎么筛？
14. GSPO 把重要性采样比从 token 级改成序列级，解决的是什么问题？
15. clip 的 ε 取 0.2，改成 0.28 会怎样？为什么 DAPO 要用 clip-higher？
16. 训练和推理的 logprob 对不上、差 1e-3 量级，会导致什么，怎么查？
17. 采样温度设多少？温度对 RL 是探索还是噪声？
18. 规则 reward 和 reward model 各自适合什么场景，你们怎么混？
19. 举一个你们实际遇到的 reward hacking，怎么发现的、怎么补的？
20. 多目标 reward（正确性、格式、长度、安全）怎么加权，权重是拍的还是有依据？
21. 评测用 pass@1 还是 pass@k，k 取多少，为什么？训练集难度分布怎么控？
22. 如果给你一批没有标准答案的业务数据，你怎么造 RL 信号？
23. 手撕：实现 GRPO 的 loss（B 条样本、每条 group size G、变长序列的 logprob 与 reward），要求组内归一化 advantage、带 mask 的 token 级 loss 聚合，以及 clip 部分。
24. 二面：你在这个项目里具体负责哪一块？8 卡跑 7B 的 GRPO，rollout 占多少时间、训练占多少？
25. rollout 用 vLLM 还是自家引擎，权重同步怎么做的？采样与训练精度不一致（bf16 与 fp16）怎么保证 on-policy？
26. 如果 rollout 阶段 GPU 利用率只有 30%，瓶颈可能在哪？长尾样本（特别长的回复）怎么处理，截断后 reward 怎么算？
27. 你们做过多轮迭代吗？每一轮是上一轮的 checkpoint 还是重新从 SFT 起？迭代几轮后效果开始掉是什么原因？
28. 线上部署的模型和训练时是同一个吗，量化了吗？这套流程搬到 32B，最先崩的是哪一环？

### 《参考解析》

**GRPO 为什么能去掉 critic。** PPO 需要一个与策略同规模的价值网络估计状态价值作为 baseline，用来算优势函数，训练成本高且价值估计本身有误差。GRPO 换了个思路：对同一个 prompt 采样一组（group size = G）回复，用组内 reward 的均值作为 baseline，用组内标准差做归一化，得到每条回复的相对优势 `A_i = (r_i - mean(r)) / std(r)`。这样不需要 critic，省掉一份模型和一份显存，同时因为 baseline 来自同分布采样，方差控制得也不错。代价是每个 prompt 要多采 G 条，rollout 成本上升；并且当组内 reward 全相同（全对或全错）时优势为 0，这条样本对梯度没有贡献，所以才有 dynamic sampling 这类「把全对/全错的组丢掉或补采」的做法。

**group size 的取舍。** G 越大，组内均值对 baseline 的估计越稳、优势的方差越小，但 rollout 成本线性增长（显存与时间都按 G 倍涨），而且全对/全错的概率上升（简单题更容易全对）。G 小则 baseline 噪声大、梯度方差高，训练不稳。实践上 8 是常见起点，难题可以到 16；判断依据是看组内 reward 的方差和全对组占比，方差太小说明题目太简单、需要提难度或加 dynamic sampling。显存上，GRPO 需要同时保留 G 条序列的 logprob 与梯度图（或用梯度累积与重算），显存约与 G 成正比，长序列时还要算上激活重算的开销。

**全对组的 advantage 与 loss。** 8 条全对时 `r_i` 全相等，`r_i - mean = 0`，advantage 为 0（若分母用标准差，还要注意标准差为 0 时不能直接除，否则得到 NaN，实现里要加 eps 或直接跳过该组）。此时 loss 为 0。但 loss 为 0 不止这一种原因：reward 里有常数分量导致组内方差被稀释、mask 全为 0（整条被截断或 padding 处理错）、old_logprob 与 logprob 完全相等且 advantage 为 0、学习率过小或梯度被裁剪到 0、数据加载出错导致同一批重复。排查顺序是先看组内 reward 分布与全对组占比，再看 mask 的有效 token 数，最后对比 old 与当前 logprob 的差值分布，三者能覆盖绝大多数「loss 不动」的情况。

**KL 项放哪里、长度为什么变长。** KL 可以加在 reward 里（`r - β·KL`，逐 token 累积）也可以加在 loss 里（作为正则项直接对梯度起作用），前者更接近「把 KL 当惩罚计入回报」，后者实现更简单、梯度更直接。β 给大了会把策略拉得离参考模型太近、学不动；给小了会漂移、输出退化。长度变长的机制是：长度归一化的 loss 让长回答的每个 token 权重更小，模型发现「多写不亏」，加上正确率与长度在数据里正相关，策略会朝更长方向漂移——这是优化目标带来的偏置，不是因果关系。长度惩罚的做法有几种：在 reward 里对超出目标长度的部分线性扣分（overlong reward shaping）、按长度分桶归一化、或在 loss 里除以固定的 max_len 而不是实际长度。要点是惩罚要平滑、只惩罚超出部分，避免把「必要的推理步骤」也压掉。

**DAPO 与 GSPO 各自解决什么。** DAPO 主要改四处：clip-higher（把上界 ε_high 抬高，避免策略过早收敛、保留探索）、dynamic sampling（过滤全对/全错的组并补采，保证每个 batch 都有有效梯度）、token-level policy gradient loss（按 token 而不是按序列平均，长序列不会被稀释）、overlong reward shaping（对超长回复做软惩罚，减少截断带来的奖励噪声）。GSPO 把重要性采样比从 token 级改成序列级：token 级 ratio 在长序列上连乘容易方差爆炸、clip 频繁触发，序列级用整条序列的似然比做一次裁剪，训练更稳、对长序列更友好，代价是粒度变粗、对单 token 的纠偏能力下降。

**训练与推理 logprob 不一致。** 差 1e-3 量级很常见，来源包括：推理引擎（vLLM 等）与训练框架的算子实现、精度（bf16 与 fp16）、KV cache 与批处理带来的数值差异、采样参数的实现差异。后果是重要性采样比偏离 1，clip 频繁触发、梯度有偏，严重时策略被推错方向。排查手段：固定同一批输入，分别用训练前向和推理引擎算 logprob，逐 token 对比差值分布，定位是全局偏移（精度/算子）还是个别 token 偏移（采样/温度）；再看 ratio 的分布与 clip 比例，如果 clip 比例很高说明两边确实对不上。缓解办法是提高推理精度、统一算子、缩短 off-policy 程度（更频繁地同步权重）、以及用序列级 ratio（GSPO）降低敏感度。

**手撕 GRPO loss 的三个坑。** 一是归一化分母：loss 应按有效 token 数平均，而不是按 padding 后的总长度，否则短样本被稀释、长样本被放大；二是全对组处理：advantage 为 0 时不能出现 0/0，标准差要加 eps 或跳过该组；三是 ratio 的 detach：`old_logprob` 必须 detach，否则梯度会回传到旧策略，等价于自己和自己比、训练失效。代码骨架是：`ratio = exp(logprob - old_logprob.detach())`，`surr = min(ratio * A, clamp(ratio, 1-ε, 1+ε) * A)`，`loss = -(surr * mask).sum() / mask.sum()`，其中 A 按组归一化后广播到 token 维。

**rollout 与训练的配比、32B 最先崩的环节。** 8 卡跑 7B 的 GRPO，rollout 往往占七成以上时间（生成是逐 token 串行的），训练只占小头，所以优化重点在推理引擎吞吐、权重同步频率与长尾样本。长尾样本会拖慢整个 batch（同步等待最慢的一条），常见处理是按长度分桶、设置最大长度并对超长样本截断（截断后 reward 要么按已完成部分给、要么标记为无效不参与 loss）。搬到 32B 最先崩的通常是显存：模型权重、优化器状态、激活与 G 条 rollout 的 KV cache 叠加，需要 ZeRO/FSDP 切分、offload、减小 group size 或改用更省的推理引擎，其次是通信与权重同步的耗时占比上升。

**没有标准答案的数据怎么造 RL 信号。** 三条路：一是用可验证的代理信号（格式合法性、引用是否命中给定文档、代码能否通过单测、工具调用是否成功），把「可判定」的部分做成规则 reward；二是用强模型做评审（LLM-as-judge）并配合少量人工校准，注意评审模型与被训模型的同源偏差；三是构造偏好对（同一输入的多条输出让人或强模型排序）转成 DPO/奖励模型。没有标准答案时最忌讳直接拿模型自己的输出当正例自举，会放大既有偏差。

---
title: "百度多模态大模型一面（9.10）：PPO 与 GRPO、DPO、持续学习、8 卡 A100 跑 7B VL 的 GRPO"
company: "百度"
position: "多模态大模型算法"
round: "一面"
date: '2026-09'
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/942742943721349120"
tags: ["百度","多模态大模型","PPO","GRPO","DPO","持续学习","DeepSpeed","GQA","MLA","verl"]
summary: "百度 2026 年 9 月 10 日多模态大模型一面：项目深挖后进入训练目标与持续学习（PPO 与 GRPO 的差异、为什么做 DPO、持续学习的方法分类），再到 8 张 A100 训练 7B 视觉语言模型的 GRPO 场景题（Rollout / 推理加速、训练加速、验收指标）、通用训练加速手段、DeepSpeed ZeRO 三阶段、多头注意力变体（MQA/GQA/MLA/滑窗/稀疏）与 verl 类框架的加速机制，最后手撕 MHA。"
---

### 《面试题目》

1. 项目深挖。
2. PPO 和 GRPO 的区别是什么？
3. 为什么要做 DPO？
4. 持续学习方法怎么分类？
5. 场景题：用 8 张 A100 的机器做 7B VL 模型的 GRPO 训练，如何做训练加速、推理加速？
6. 模型训练加速有什么方法？
7. DeepSpeed 的三个阶段分别是什么？
8. 多头注意力有哪些变体？
9. verl 等框架都是如何进行加速的？
10. 手撕：实现多头注意力（MHA）。

### 《参考解析》

**PPO 与 GRPO。** 两者都是策略优化，差别在优势估计与是否需要 Critic。PPO 维护策略、参考策略、奖励模型和价值模型，用 GAE 算优势，再用 clip 目标限制单步更新幅度，还要加相对参考模型的 KL 约束；优势是优势估计细（可到 token 级），代价是 Critic 的显存与训练成本，以及对价值估计误差的敏感性。GRPO 对同一个 prompt 采样一组回答，用组内奖励的均值与标准差构造相对优势，省掉 Critic，特别适合数学、代码、可验证工具调用这类有确定性 reward 的任务；代价是每个 prompt 要多条 rollout（采样成本随 group size 线性增长），且组内方差过小时优势信号会消失。选择依据是 reward 是否可验证、rollout 吞吐、轨迹长度与任务方差，不是「哪个更新」。

**为什么 DPO。** 很多场景能拿到「同一 prompt 下 A 比 B 好」的偏好数据，但做 PPO 需要在线 rollout、奖励模型、价值模型和一堆稳定性控制。DPO 从 KL 正则化 RLHF 的最优策略形式出发，把奖励隐式表达成「策略相对参考模型的对数概率比」，于是可以直接在偏好对上做分类式损失：提高 chosen 的相对概率、压低 rejected。省掉 RM 与 Critic、训练链路短、不需要在线交互。代价是它只学静态偏好——覆盖不到多步工具交互与环境反馈，且对数据质量极敏感：长度偏好、位置偏好、标注者偏差都会被学进去。做 DPO 前先看 chosen/rejected 的长度分布与标注一致性，是最省时间的自检。

**持续学习分类。** 按「怎么保住旧能力」分五类：回放（保存历史样本/特征/生成样本混着训）、正则化（EWC 之类约束重要参数，或用旧模型蒸馏）、参数隔离（每个领域/租户一组 LoRA/Adapter，推理时路由）、架构扩展（加专家或新头）、检索与外部记忆（不改参数，把新知识写进库，推理时取回）。再加一类「周期性重训/增量预训练」，上限高但成本与遗忘风险都要靠回归评估兜。选型先判断变的是什么：知识时效 → 检索；行为与格式 → SFT/DPO/Adapter；可验证的长链路策略 → RL；输入分布漂移 → 回放与重加权。每次更新都要在新域、旧域、对抗集与安全集上做回归。

**8 卡 A100 上跑 7B VL 的 GRPO。** 先定位瓶颈再谈加速：GRPO 的成本大头几乎总在 rollout（每个 prompt 生成一组回答），VL 还有图像编码与长视觉 token 的额外开销。推理侧：用 vLLM / SGLang 做 Continuous Batching 与 PagedAttention 管理 KV Cache；同一 prompt 的图像特征与前缀 KV 只算一次并在组内复用（缓存按模型版本、图像配置与输入哈希隔离）；限制 max_new_tokens、加停止条件与结构化输出约束，别把算力花在无效轨迹上；TP 切分要匹配 8 卡的互联拓扑，小 batch 下 TP 的通信收益可能为负；BF16 + FlashAttention/FlashInfer、CUDA Graph。训练侧：BF16 混合精度、fused optimizer、FlashAttention，FSDP 或 ZeRO 分片参数/梯度/优化器状态 + 梯度累积凑有效 batch，长序列开 activation checkpointing（用算力换显存），按图像 token 数与文本长度分桶/packing 减少 padding。系统层：rollout 与训练做 colocate 或 disaggregate，减少「训练等 rollout」的空转；异步必须记 policy version、控制样本陈旧度。验收指标要一起报：tokens/s、有效 response/s、step time 分解、GPU 利用率与显存峰值、通信占比、reward 计算耗时、KL、组内 reward 方差、任务成功率与单样本成本。

**训练加速的五个方向。** 减少计算（混合精度、fused kernel、CUDA Graph、packing、长度分桶）、减少显存（activation checkpointing、offload、参数/梯度/优化器分片）、减少通信（梯度桶化、通信计算 overlap、拓扑感知映射、梯度累积降同步频率）、提高流水线利用率（DP/TP/PP/SP 组合、micro-batch 填 pipeline bubble）、减少无效数据（去重清洗、动态 batch、异步预取、缓存视觉特征）。方法论比清单重要：固定数据版本与 batch 建基线，每次只改一个变量，同时报吞吐、峰值显存、数值稳定性与验证集效果。

**ZeRO 三阶段。** 都基于数据并行，逐步减少每卡必须完整保存的训练状态：ZeRO-1 只分片优化器状态（参数与梯度仍完整），ZeRO-2 再分片梯度，ZeRO-3 连参数也分片、计算前按层聚合。理想情况下每卡持久状态按卡数缩减，但通信量随之上升——1 到 3 是「省显存换通信」。要和 TP/PP 区分：ZeRO 分的是数据并行里的训练状态，TP/PP 切的是模型计算本身，两者可组合。ZeRO-3 最省显存但小 batch 下通信开销最明显。

**注意力变体。** MHA（每头独立 K/V）→ MQA（所有 Q 头共享一组 K/V，KV Cache 大幅缩小但可能损失质量）→ GQA（分组共享，质量与缓存的折中，现在的主流）→ MLA（缓存低维 latent、用时重建 K/V，长上下文与高并发下更省带宽）。另外还有滑动窗口/局部注意力、稀疏与块稀疏、线性注意力。要点是：自回归解码的瓶颈常不是 QKV 投影而是每步读历史 K/V 的显存带宽，所以降 KV Cache 的变体直接换吞吐；所有变体都在「表示能力 / 每 token KV 大小 / 访存模式」三者间做取舍，必须用质量和 kernel 支持共同验证。

**verl 类框架的加速。** 不是某个神奇算子，而是把 Rollout、Reward、训练更新与数据调度组织成高吞吐流水线：Hybrid Engine 在训练与生成间复用权重、减少加载与空转；Rollout 对接 vLLM/SGLang 拿 Continuous Batching 与 prefix caching；训练后端接 FSDP/Megatron；异步与流水化让生成、奖励、训练重叠（要管 policy version 与陈旧样本）；数据侧按长度分桶、动态 batch；通信侧预分配 buffer、优化 NCCL 与 CPU-GPU 拷贝；最后靠分阶段指标（生成 tokens/s、训练 tokens/s、reward 延迟、权重同步时间、GPU 空闲率）找真正的瓶颈。

**手撕 MHA。** 输入 `[B, Lq, D]`、`[B, Lk, D]`、`[B, Lk, D]`，头数 H、每头维度 `Dh = D/H`；线性投影后 reshape 成 `[B, H, L, Dh]`，算 `softmax(QKᵀ/√Dh + mask)V`，再拼回 `[B, Lq, D]` 过输出投影。要写对四件事：缩放因子用 `√Dh` 而不是 `√D`；mask 用 `-inf` 填充（不是 0）且在 softmax 前加；因果 mask 只对 self-attention 有意义、且要屏蔽未来位置；dropout 作用在 softmax 之后。工程上还可以提一句用 `scaled_dot_product_attention` 或 FlashAttention 内核替代手写实现。

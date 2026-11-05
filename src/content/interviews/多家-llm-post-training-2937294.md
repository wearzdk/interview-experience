---
title: "大模型后训练与 Agent 开发面试总结：三个月二十多场的高频题"
company: 多家互联网公司
position: 大模型后训练与 Agent 开发
round: "多轮"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/e4351ac7f6c54337befa9ed94e833c14
tags: ["大模型","后训练","SFT","RLHF","DPO","GRPO","Agent","面试总结"]
summary: "三个月面试二十多场后整理的题目清单：后训练与对齐集中在方法选型、SFT 细节、PPO/DPO/GRPO 对比与 Reward 设计；Agent 方向集中在架构、工程治理、评测与 Skill 漂移；项目深挖要求讲完整故事；部署侧问 vLLM 的 Prefix Cache 与 Paged Attention，手撕以 Medium 为主。"
---

### 《面试题目》

1. 继续预训练、SFT、偏好优化（DPO/RLHF）和 RLVR 分别在优化什么？
2. 面对新业务，怎么判断用 Prompt、RAG、SFT、DPO 还是 RL？
3. 为什么 RL 前必须先 SFT 冷启动，直接从基座开始 RL 行不行？
4. SFT 和 RL 能否复用同一批数据？Rollout 分布和 SFT 数据不一致怎么办？
5. SFT 的损失函数怎么算，哪些 token 算进 loss？
6. 全量微调和 PEFT 怎么取舍？LoRA 的 rank、alpha、target modules 分别控制什么？
7. SFT 显存大概是模型大小的多少倍？Sequence Packing 的收益和坑是什么？
8. 训练 loss 在降但任务效果变差，可能发生了什么，怎么排查？
9. PPO、DPO、GRPO 的优化方式、数据要求与适用场景有什么区别？
10. DPO 为什么可以不显式训练 Reward Model，依赖哪些假设，哪些场景会失效？
11. GRPO 同组样本 Reward 全相同或整体都很差时优势失效，怎么处理？
12. PPO 里的 Clip、KL Penalty 和 Reference Model 分别约束什么，和 Trust Region 什么关系？
13. 如何通过 Entropy、KL 和输出多样性区分 Entropy Collapse 与 Reward Hacking？
14. 用 LLM Judge 前怎么验证可靠性？长程任务只有最终成功/失败信号时，reward 怎么分配到每一步？
15. 离线 Benchmark、自动 Judge、人工评测和线上业务指标冲突时怎么定位原因？
16. 你理解的 AI Agent 是什么，和大模型对话、RAG 应用的本质区别？
17. ReAct 的核心逻辑是什么？Plan-and-Execute 和 ReAct 有什么区别？用过哪些 Agent 框架，为什么选它？
18. 复杂任务怎么拆？为什么用 Agent Loop、为什么要拆子 Agent？
19. Agent 陷入死循环或工具调用不受控怎么处理？
20. 多轮上下文怎么记，短期、长期、偏好记忆怎么分层？
21. 工具调用失败怎么容错降级，怎么防止模型编造结果？
22. 怎么搭效果监控看板和评测集？评测集至少覆盖哪些维度？
23. Skill 一开始表现好、后面越进化越偏怎么防技能漂移？一次出现 1000 条 bad case、五六成重复，怎么改 Skill？
24. SFT 数据怎么生成和标注，怎么防训练集/测试集重复泄漏？合成数据什么时候有用、什么时候把模型带歪？
25. Agent 轨迹长什么样？给足够算力会怎么改进项目？业务指标上升怎么归因到基模、SFT、RL 还是错误案例分析？
26. 每次改动看哪些指标（成功率、调用成本、失败类型）？效果不好的实验，当时怀疑什么、后来排除了什么？
27. vLLM 的 Prefix Cache 和 Paged Attention 是什么？Prefill 和 Decode 分别是什么，哪个计算密集？
28. 量化后怎么检查商品型号、规格和数值回答有没有退化？
29. 场景题：设计电商售后客服 Agent；股票交易推荐 Agent 有 8000 token 预算，突然来 20000 token、分三类 JSON 的数据，怎么处理。
30. 手撕：MHA 底层实现、GRPO Loss 推导与实现、滑动窗口、二叉树层序遍历、两数之和。

### 《参考解析》

**方法选型是每轮必考的第一题**：继续预训练改的是模型的知识分布（领域语料、词表与分词适配）；SFT 改的是「指令—回答」的格式与风格，让模型学会按任务形式作答；偏好优化（RLHF/DPO）改的是回答之间的排序偏好，把「能答」推到「更符合人类偏好」；RLVR 用可验证的奖励（答案对错、单测是否通过）优化推理能力。选型的判断顺序是：先看 Prompt 能否解决（成本最低）、再看 RAG 能否补上知识缺口（知识时效性强时优先）、然后才考虑 SFT（格式与领域行为不对）、最后才是偏好优化与 RL（需要排序或可验证的正确性）。能把这套决策树讲出来，比背定义得分高。

**为什么 RL 前要 SFT 冷启动**：RL 需要模型在目标分布上采样出「有一定概率正确」的轨迹，基座模型在特定任务格式上成功率极低，采样几乎全是负样本，优势估计没有信号；SFT 先把模型拉到任务分布内，让 rollout 有正样本，RL 才有梯度。SFT 数据与 RL rollout 分布不一致是常态，处理方式是让 SFT 数据覆盖任务的主要形态、在 RL 阶段用 on-policy 采样并定期刷新 SFT 数据，或采用迭代式训练（SFT → RL → 用新模型采样再 SFT）。

**SFT 与 LoRA 的细节**：损失只对回答部分计算（prompt 部分 mask 掉），按 token 求交叉熵再对有效 token 平均；全量微调显存约为参数量的十几倍（含梯度、优化器状态、激活），LoRA 只训练低秩矩阵，显存大幅下降。rank 控制低秩矩阵的秩（表达能力），alpha 是缩放系数（通常设为 rank 的 1~2 倍），target modules 决定挂在哪些线性层（q/k/v/o 或全部）。Sequence Packing 把多条短样本拼进一个序列提高利用率，坑是跨样本注意力泄漏与位置编码错乱，需要用 attention mask 隔离。

**PPO/DPO/GRPO 的对比要落到「需不需要 Reward Model、需不需要在线采样」**：PPO 需要显式 Reward Model 与在线采样，用 Clip 限制策略更新幅度、用 KL Penalty 与 Reference Model 约束不要偏离太远，本质是 Trust Region 的近似；DPO 用偏好对直接优化策略，把 Reward Model 隐式表达为策略与参考策略的比值，省掉 RM 与在线采样，假设是 Bradley-Terry 偏好模型与离线数据覆盖充分，分布外或偏好噪声大时会失效；GRPO 对同一 prompt 采样一组回答，用组内相对优势替代 Critic，省掉价值网络，缺点是组内奖励全相同（全对或全错）时优势为零，需要通过难度采样、过滤全对/全错组、或引入过程奖励缓解。

**Agent 工程治理的答题骨架**：任务拆解（按目标—子目标—工具调用链拆，子 Agent 负责可独立验证的片段）、循环控制（最大轮次、超时、置信度阈值、重复动作检测）、上下文管理（短期对话、长期记忆、偏好记忆分层，按需检索而不是全量塞入）、失败处理（工具报错分类、重试与降级、明确告知用户而不是编造结果）、可观测性（每步的工具、参数、结果、耗时、token 都留痕）。评测集要覆盖长期记忆召回、多轮后事实不丢、工具异常不编造三类；Skill 漂移的治理是「聚类归因 → 改规则 → 回归评测」的闭环，1000 条 bad case 先聚类成几十类，按影响面排序逐类修，每改一条都跑一遍回归。

**部署与手撕**：vLLM 的 Paged Attention 把 KV Cache 按页管理，减少显存碎片、支持前缀共享；Prefix Cache 复用相同前缀的 KV，适合系统提示词很长的场景。Prefill 是并行处理整个输入、计算密集；Decode 逐 token 生成、访存密集。量化后退化的检查要按业务字段抽样（型号、规格、数值），对比量化前后的准确率而不是只看困惑度。手撕重点在 MHA 的矩阵维度与 mask、GRPO loss 的组内归一化，能用基础 math 库写出 Causal Attention 是加分项。

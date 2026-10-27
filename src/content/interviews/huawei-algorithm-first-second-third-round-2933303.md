---
title: "华为算法线下面三面连打：Agentic RAG、PPO 与 DPO 的取舍、GRPO 手撕与多卡推理 OOM"
company: "华为"
position: "算法工程师（大模型）"
round: "一二三面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/db120ae0156249078ffd635bd66f3772
tags: ["华为", "算法", "大模型", "AgenticRAG", "PPO", "DPO", "GRPO", "vLLM", "多卡训练"]
summary: "华为北京线下一二三面连打、每面之间几分钟到二十分钟出结果：一面像技术交流，深挖两段实习与 Agentic RAG 方案选型，追问项目用 PPO 还是 DPO 及两者取舍、样本动态加权与梯度解耦缩放怎么做，最后一道逻辑题结合 BFS；二面节奏快、压力面，问多卡部署框架、精度问题与 OOM 处理、vLLM 推理流程、PPO 奖励解耦、SFT 与 RM 数据格式、训练 OOM 的归因，手撕 GRPO 伪代码并追问 loss 里条件概率怎么算、参数如何更新；三面主管面偏聊天，问为什么实习这么多家公司、挑重要经历讲做事逻辑、论文创新点与 baseline 对比。"
---

### 《面试题目》

1. 自我介绍，并挑一段最核心的实习讲一下（再讲最近一段）。
2. 项目里用了 Agentic RAG，具体怎么做、为什么用这个方案、用了哪些框架？
3. 你这个项目最终用 PPO 还是 DPO？两者有什么区别，什么情况下该选哪个？
4. 样本动态加权和梯度解耦缩放具体是怎么做的？
5. 逻辑题 + 思路讲解 + 算法结合（BFS）。
6. 多卡部署用什么框架？有没有遇到精度问题，OOM 了怎么办？vLLM 的推理流程是什么？
7. PPO 的奖励解耦具体怎么做、为什么要这样做？SFT 数据和 RM 数据的格式分别是什么？
8. 训练 OOM 的情况下怎么做归因，有哪些解决方案？
9. 手撕 GRPO（伪代码），并解释 loss 里的条件概率是怎么算出来的、来自公式还是模型自己计算、loss 算出后参数优化的流程。
10. 为什么实习这么多家公司，选择这些公司的原因分别是什么？
11. 挑几个重要的实习经历介绍（着重做事与思维的逻辑，而非技术细节）。
12. 论文发表情况、创新点是什么、和 baseline 相比如何？

### 《参考解析》

**PPO vs DPO 的取舍要讲成「数据与算力的交换」**：PPO 是 on-policy，需要同时加载策略模型、参考模型、奖励模型（甚至可以四个模型），有 rollout 与训练两段、超参（KL 系数、clip、GAE）多、不稳定，但能持续用新样本探索、上限更高；DPO 把偏好对齐转成「对偏好对做分类」，只需要策略与参考两份模型、离线数据即可，稳定省算力，但效果受偏好数据覆盖度限制、对分布外偏好不敏感。选择逻辑：有可靠 reward model 与算力、需要在线探索 → PPO / GRPO；偏好数据质量好、算力紧、要快速迭代 → DPO。GRPO 是 PPO 的省资源变体，用组内相对优势替代 critic（同一 prompt 采样多条，用组内均值方差归一化算优势），省掉 value model。

**GRPO 伪代码要写出五步**：对每个 prompt 采样 G 条回答 → 用 reward model 或规则打分 → 组内标准化得优势 `A_i = (r_i - mean)/std` → 计算新旧策略的 token 级概率比 `ratio`，代入带 clip 的目标（并加 KL 惩罚相对参考模型）→ 反向传播更新。追问「条件概率怎么来」的答案是模型自己算的（每步对词表做 softmax，取实际 token 的 logprob），不是从公式推出来的；「参数优化流程」是 loss 反传得到梯度 → 优化器（AdamW）更新 → 下一轮 rollout。

**多卡推理 OOM 的处置按层给**：先降显存占用（KV cache 量化、`gpu_memory_utilization` 调低、`max_model_len` 缩短、batch 与并发下调），再上并行（张量并行 TP 跨卡切权重、流水并行 PP 切层、序列并行 / ring attention 切长上下文），最后是工程手段（PagedAttention 减少碎片、prefix caching 复用、CPU offload）。精度问题常见于 fp16 溢出（改 bf16）、TP 切分后 all-reduce 的数值差异、量化（AWQ/GPTQ）带来的分布偏移，验证方式是固定 prompt 对比单卡与多卡的输出一致性。

**vLLM 的推理流程**：请求进来先进 scheduler 队列 → 用 PagedAttention 按 block 分配 KV cache（不像传统实现要预留连续显存）→ prefill 阶段并行算整段 prompt 的 KV → decode 阶段逐 token 生成并在每步做 continuous batching（完成的请求立即让出、新请求插入）→ 采样（top-p / temperature）→ 流式返回。这套设计的核心收益是显存利用率与吞吐，代价是调度与 block 管理的复杂度。

**Agentic RAG 与普通 RAG 的差别在「谁决定检索」**：普通 RAG 是固定流程（检索一次 → 生成），Agentic RAG 把检索变成工具，由模型决定要不要查、查什么、查几次、以及结果不够时换 query 或换数据源；实现上就是 planner + 工具集（检索、计算、查询数据库）+ 循环控制（步数上限、终止条件），框架可用 LangGraph 之类的状态图。选它的理由要落到业务：问题类型杂、单次检索覆盖率不够、需要多跳推理。

---
title: 云鼎科技NLP算法一面面经（简历面）
company: 云鼎科技
position: NLP算法（机器学习）
round: 一面
date: '2026-09'
source: 牛客网
tags: ["NLP","模型量化","推理引擎","显存优化","LSTM","时序预测"]
summary: "云鼎科技NLP/机器学习一面面经，属于围绕简历项目的简历面。四道题分别考察模型量化方法、用过的推理引擎及具体参数、显存优化与推理加速手段，以及LSTM做时序预测的细节与效果。"
---

### 《面试题目》

1. 了解哪些模型量化方法？
2. 用过哪些推理引擎？具体讲讲参数。
3. 了解哪些优化显存或者加速推理的方法？不局限于项目。
4. 有没有做过时序预测？讲讲 LSTM 和具体的效果。

### 《参考解析》

**模型量化方法**：可以从三个维度组织回答，这样显得有体系。①**按量化对象**：只量化权重（W8A16，激活仍是 FP16，如 GPTQ、AWQ）、权重和激活都量化（W8A8，如 SmoothQuant、TensorRT-LLM 的 INT8 路径）、以及极低比特（W4A16、W3、甚至 W2，通常只敢用于权重）。②**按方法**：**PTQ**（训练后量化）——GPTQ 逐层做最小二乘误差补偿，AWQ 依据激活幅值识别并保护重要通道，SmoothQuant 把激活的量化难度通过数学等价变换迁移到权重上，LLM.int8() 则把少数离群值通道保留 FP16、其余走 INT8；**QAT**（量化感知训练）——训练时插入伪量化节点模拟误差，精度更好但成本高；此外还有 QLoRA 里用的 **NF4 + 双重量化**（对量化常数再量化）。③**按粒度与格式**：per-tensor、per-channel、per-group（GPTQ 常用 group size 128），对称/非对称量化与 zero-point、scale 的存储。部署侧还会做 **KV Cache 量化**（FP8/INT8）和激活的 INT8/FP8 kernel。评价指标不能只看困惑度（PPL），要在实际任务上跑准确率，并关注量化后的长尾退化（长上下文、稀有 token）。

**推理引擎与关键参数**：常用引擎和要记住的参数——**vLLM**：PagedAttention 管理 KV Cache、continuous batching 连续批处理，参数有 `--gpu-memory-utilization`（显存占用比例，常见 0.9）、`--max-model-len`（最大上下文）、`--max-num-seqs`（并发序列数）、`--tensor-parallel-size`（张量并行度）、`--enable-prefix-caching`（前缀缓存）、`--quantization awq/gptq/fp8`、`--swap-space`。**TensorRT-LLM**：先编译引擎再部署，参数有 `max_batch_size`、`max_input_len`、`max_output_len`、`max_num_tokens`（in-flight batching 的 token 预算）、`kv_cache_free_gpu_memory_fraction`，支持 FP8/INT8/INT4 与 paged KV。**SGLang**：RadixAttention 做前缀树缓存，参数 `--mem-fraction-static`、`--tp-size`。**llama.cpp / Ollama**：`n_gpu_layers`（放多少层到 GPU）、`n_ctx`、`n_batch`、`n_threads`。**HuggingFace TGI**：`--max-batch-total-tokens`、`--max-concurrent-requests`、flash attention 开关。面试时最好说清一条调参经验：显存先按 `gpu-memory-utilization` 吃满、再根据并发和 `max-model-len` 反推能支持的 `max-num-seqs`，长上下文场景优先开 prefix caching 与 chunked prefill。

**显存优化与推理加速**：建议按"先算账、再分层优化"来说。**算账**：权重显存 = 参数量 × 位宽 / 8（7B 模型 FP16 约 14GB，INT4 约 3.5GB）；KV Cache = `2 × 层数 × kv 头数 × head_dim × 序列长 × batch × 位宽`，长上下文下它常常比权重还大。**模型层**：量化（W4A16/W8A8）、稀疏化与剪枝、蒸馏成小模型、MoE 稀疏激活。**KV Cache 层**：GQA/MQA 减少 kv 头数、PagedAttention 消除显存碎片、KV 量化到 FP8/INT8、prefix caching 复用公共前缀、以及最激进的多轮对话 KV 淘汰策略。**算子层**：FlashAttention（IO 感知，减少 HBM 读写而不是减少计算量）、算子融合（把 RMSNorm+QKV 投影、SwiGLU 融成一个 kernel）、CUDA Graph 消除 kernel launch 开销。**系统层**：continuous batching 提高 GPU 利用率、chunked prefill 让长 prompt 不阻塞解码、投机解码（draft model / Medusa / EAGLE，常见 1.5~3 倍加速）、张量并行/流水并行/专家并行、CPU offload（`accelerate`、DeepSpeed ZeRO-Inference）。**验证手段**：`nvidia-smi` 看显存、`torch.cuda.memory_summary()` 看分配与碎片、Nsight Systems 看时间线，别凭感觉说"优化了"。

**LSTM 与时序预测**：LSTM 靠输入门、遗忘门、输出门和一个贯穿的 cell state 来控制信息流，遗忘门让它能保留长距离信息，缓解了 RNN 的梯度消失问题。但它的硬伤是**串行计算、无法并行**，序列一长训练就慢，而且对超长依赖的表达力仍不如 Transformer（这也是时序领域后来出现 Informer、PatchTST、TimesNet 等模型的原因）。用它做时序预测的工程细节比模型本身更重要：①**样本构造**——滑窗（look-back 窗口 → 预测步长），多变量要把协变量区分成"已知未来值"（如节假日、天气预报）和"仅历史值"；②**预处理**——归一化/标准化、差分去趋势与去季节性（不然模型学到的是缓慢漂移而不是模式）；③**预测形式**——直接多步输出（一个头输出 h 步）或自回归逐步预测，前者误差不累积、后者更灵活；④**评估**——MAE/RMSE/MAPE/SMAPE，但**必须按时序切分训练/验证/测试**，绝不能随机切分（会数据泄漏，指标虚高）；⑤**baseline 一定要先跑**：naive（上期值）、seasonal naive、移动平均，LSTM 打不过 naive 的情况非常常见，这时要老实说"效果一般，原因是数据量/信噪比"而不是硬吹。作者在面试里回答"有 LSTM，简单讲了效果"，建议以后补一句量化结论（相对 baseline 的 MAE 下降百分比），说服力完全不同。

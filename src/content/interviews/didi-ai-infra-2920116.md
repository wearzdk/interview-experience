---
title: "滴滴 AI Infra 算法岗一二面面经"
company: "滴滴"
position: "AI Infra 算法工程师"
round: "一面二面"
date: '2026-10'
source: 牛客网
tags: ["AI Infra","大模型推理","KV Cache","CUDA","分布式训练"]
summary: "滴滴 AI Infra 算法岗一二面：一面考 Attention 优化、KV Cache 显存计算与 ZeRO 分片；二面深挖流水线调度、分布式 Decode 与 PyTorch 编译栈。"
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
10. DeepSpeed ZeRO-2 / ZeRO-3 的通信开销来源、显存降幅分别是多少？
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

**GQA 结构下的 KV Cache 显存怎么算**

先写公式再代数字，面试官要的是推导过程：KV Cache 字节数 = 2（K 和 V）× 层数 × KV 头数 × head_dim × 序列长度 × batch × 每元素字节数，注意乘的是 KV 头数而不是注意力头数。以 70B 级模型为例，80 层、8 个 KV 头、head_dim 128、fp16（2 字节），每 token 约 2×80×8×128×2 = 320 KB；单条 32K 上下文的请求就是 320 KB × 32768 ≈ 10 GB。追问通常落在这里：批大小一上来显存就被 KV Cache 吃掉，这正是 PagedAttention、前缀共享、量化 KV 这些方案的动机。

**MLA 和线性注意力分别省在哪**

GQA 只是让多个 Query 头共享一组 KV 头，压缩比在个位数倍；MLA 走的是低秩投影——把每层的 KV 压成一个远小于 2×heads×head_dim 的 latent 向量缓存，推理时再上投影还原，DeepSeek-V2 报告的是 KV Cache 降到 MHA 的 10% 量级。线性注意力换的是另一条路：用特征映射替掉 softmax，把注意力写成可结合的核形式，于是可以维护一个固定大小的循环状态，显存开销与序列长度无关，代价是表达能力下降、需要靠 chunk 形式的并行实现才能跑满硬件。面试里要能把「省显存的三种不同思路」讲清楚，而不是只背压缩比。

**ZeRO-2 和 ZeRO-3 的显存与通信**

ZeRO-1 只切优化器状态，ZeRO-2 再把梯度切开，两者的参数量仍然在每个 rank 上各存一份，显存降幅主要作用在优化器侧（按数据并行度近似线性下降）；ZeRO-3 连参数也切，模型显存随数据并行度线性缩小，代价是前向要 all-gather 参数、反向再把梯度 reduce-scatter 回去，通信量大约涨到 1.5 倍。工程上的坑是 ZeRO-3 每个算子都要等参数聚合，小算子多的时候通信完全藏不住，常见做法是调大 bucket、配合通信计算重叠，或者干脆回到 ZeRO-2 加模型并行。

**AdamW 为什么占 4 倍参数量的显存**

因为 fp32 主权重之外还有三份与参数量等长的状态：梯度、一阶动量、二阶动量。四份 fp32 就是每个参数 16 字节，一个 10B 参数的模型光这些就要 160 GB。这也是混合精度训练里「模型权重本身才多少、优化器状态才是大头」的由来，顺着这个问题往下，自然会问到 ZeRO 切分、8-bit Adam、以及 CPU offload 各自的取舍。

**Torch Compile、CUDA Graph 与整个编译栈的关系**

Dynamo 负责在图层面拦截 Python 执行、把可编译的片段抽成 FX 图，Inductor 再把 FX 图降到 Triton 或 C++ kernel，中间靠缓存避免重复编译。CUDA Graph 解决的是另一个问题：kernel 本身很快，但每次从 CPU 逐个 launch 的开销不可忽略，把一整段调用序列捕获成一张图再一次提交，就能把这部分开销压掉。两者的结合点是 `torch.compile(mode="reduce-overhead")`，它会在图稳定后自动套 CUDA Graph，代价是要求静态形状与静态显存地址——动态 shape 一多就退回普通模式。被追问 Dispatch 机制时，答清楚 dispatch key 如何按 tensor 类型、布局和 autograd 状态选择后端实现，再去接 kernel 选择就顺了。

**LRU Cache 的 O(1) 实现**

核心是「哈希表 + 双向链表」：哈希表存 key 到链表节点的映射，链表按访问时间排序，头部是最近使用、尾部是最久未用。get 命中后把节点摘下来插到头部，put 时若容量已满就删掉尾节点再插入，每个操作都只改常数个指针，因此是 O(1)。实现细节上挂两个哨兵节点（head/tail）能省掉一堆空指针判断；面试官常追问的是并发场景怎么加锁（分段锁或每 shard 一把锁）、以及 Redis 那种近似 LRU 为什么不用精确链表——内存开销和采样成本的取舍。

**Chunk Prefill 与 TTFT 的取舍**

长 prompt 的 prefill 是计算密集型的，如果整段独占一个批次，同批里正在 decode 的请求就会被卡住，表现为 ITL 抖动。Chunk Prefill 把 prefill 按 token 切块，和 decode 交错调度，牺牲的是长请求自己的 TTFT 会略微变大，换来的是整批的尾延迟和吞吐更稳。Debug Triton 精度异常的顺序大致是：先确认是 kernel 本身还是调用侧问题，再检查累加精度（fp16 直接累加很容易掉精度，需要 fp32 累加器）、mask 与边界处理、tl.dot 的输入精度模式，最后写一个小的 CPU 参考实现对拍。


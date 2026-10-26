---
title: "科大讯飞推理工程部 AI Infra 一面：PagedAttention、RadixAttention 与瓶颈定位连环追问"
company: "科大讯飞"
position: "AI Infra（推理方向）"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/944283905056665600
tags: ["科大讯飞", "AI Infra", "vLLM", "SGLang", "PagedAttention", "推理优化", "GPU 池化"]
summary: "科大讯飞推理工程部 AI Infra 一面（线上视频）：自我介绍后深挖华为的 Infra 经历，接着是原生与异构算力的差别、vLLM 的 PagedAttention 与 Continuous Batching、SGLang 的 RadixAttention 与 prefix caching 的关系、Prefill 与 Decode 的瓶颈怎么定位、优化实验怎么设计，最后反复确认你愿不愿意留在底层引擎。"
---

### 《面试题目》

1. 简单做一下自我介绍，重点讲一下和 Infra 最相关的项目或实习经历。
2. 简历里写了在华为做过 AI Infra，这段主要做了什么？和推理模型有没有关联？
3. 聊聊你对「原生算力」和「异构算力实践」的理解。
4. 用 vLLM 或 SGLang 实际跑过模型吗？框架里各个模块分别起什么作用？
5. vLLM 的 PagedAttention 和 Continuous Batching 分别解决什么瓶颈？
6. SGLang 的 RadixAttention 和 vLLM 的 prefix caching 是什么关系？
7. 推理时的瓶颈主要在哪？内存瓶颈和计算瓶颈分别怎么定位？
8. 如果让你做优化实验，你会怎么设计？
9. 从产品/资源管理角度，弹性扩缩容和 GPU 池化通常有哪些策略？
10. 团队很看重 AI Coding，你怎么看它在 Infra 场景里的价值？
11. 你个人兴趣是不是更偏向 AI 产品？如果 Infra 不匹配，也可以推荐你去产品部门。
12. 我们底层引擎负责把模型更快、更低成本地跑起来，上层再做规模化 API 服务。你觉得哪个和你更契合？

### 《参考解析》

**讲华为那段经历，先划清「我改了什么」和「我用了什么」。** 没动过框架源码就直说，再把工程侧讲具体：什么卡、多大规模的集群、跑的哪个模型；环境适配踩了哪些依赖与驱动的坑；OOM 是权重放不下、KV Cache 超限还是显存碎片；压测怎么设计、看哪几个指标；调优前后 TTFT 或吞吐变了多少。面试官问「和推理模型有没有关联」，是在确认你不是只做过训练侧的数据搬运。收尾补一句「迁到国产算力时算子不兼容和动态 shape 最耗时间」，把话题引到自己能展开的地方。

**PagedAttention 和 Continuous Batching 要分开说清各自治什么病。** PagedAttention 治的是显存碎片：传统实现给每个请求预分配一段连续显存、按最大长度预留，实际用量远小于预留，浪费能到六七成；它把 KV Cache 切成固定大小的 block（默认 16 个 token），用 block table 做逻辑块到物理块的映射，块可以散落存放，按需分配，浪费降到几个百分点，还能让 beam search、并行采样共享同一份前缀块（写时复制）。Continuous Batching 治的是 GPU 空转：静态 batch 要等最长的那条生成完，短请求早结束了也占着槽位；它把调度粒度下沉到每个 decode step，完成的序列立刻退出、排队的请求马上补进来。追问常落到两个点：长 prefill 会把 decode 卡住，所以要有 chunked prefill 把长 prompt 切段插入，代价是 TTFT 变长；显存不够时是先抢占再重算（recompute）还是换出到主机内存（swap），前者省显存费算力，后者反过来。

**RadixAttention 和 prefix caching 是同一目标的两个层次。** 目标都是「相同前缀的 KV 不要重算」，多轮对话、Agent 的工具循环、RAG 的固定 system prompt 都属于前缀高度重复的负载。vLLM 的 automatic prefix caching 是按 block 的哈希做命中，开关式特性，命中就省一次 prefill。SGLang 把前缀复用做成了架构中心：用基数树（radix tree）组织所有历史请求的 token 序列，节点上挂 KV 索引，新请求进来先沿树匹配最长前缀，只对没匹配上的部分做 prefill；树节点带引用计数、按 LRU 淘汰，调度器还会按前缀匹配长度给队列排序（cache-aware scheduling），让同一批共享前缀的请求连着跑以提高命中。代价是元数据开销和淘汰抖动，HiCache 再把缓存从 HBM 分层扩到主机内存与远端存储。容易被扣分的细节：前缀必须严格逐 token 相同，system prompt 里插时间戳、或者工具定义顺序每次不一样，命中率会直接掉到零。

**瓶颈定位要靠 roofline 和 profiler，不是靠感觉。** Prefill 阶段是一次大矩阵乘，算术强度高，属于 compute-bound，看 MFU 和 SM 利用率；Decode 阶段每生成一个 token 都要把全部权重和整条 KV Cache 从 HBM 读一遍，算术强度低，属于 memory-bound，看 HBM 带宽利用率。定位手段是先看四个指标——TTFT、TPOT（或 ITL）、吞吐（tokens/s）、显存峰值——再用 Nsight Systems 或 msProf 抓时间线，看 kernel 之间有没有空隙、有没有多余的同步与拷贝、attention kernel 的时间占比。经验判据：batch 调大吞吐不涨而显存先满，多半是 KV Cache 限制；batch 调大 TPOT 明显变差，说明已经在抢带宽；GPU 利用率上不去但队列有积压，去看调度和 CPU 侧。

**优化实验的设计比结论更重要。** 固定 workload（输入输出长度分布、并发梯度、采样参数），先跑基线并重复三次看方差，然后一次只改一个变量：block size、`gpu-memory-utilization`、`max-num-seqs`、是否开 chunked prefill、量化方案（FP8 / W4A16）、投机采样。每个变体都记录四个指标 + 质量（跑同一套评测集，防止量化把效果压下去）。要区分 warmup 与稳态，别把首次编译和图捕获的时间算进吞吐。投机采样重点看接受率，接受率低的时候反而更慢。最后把结论写成「在什么负载下选什么配置」，因为推理优化几乎没有全局最优，只有针对某个延迟目标和并发区间的最优。

**GPU 池化与扩缩容，难点在「缩」不在「扩」。** MIG 是硬件切分，隔离最好但规格固定、碎片难回收；MPS 共享同一张卡、按 SM 占比分配，隔离弱、显存不受限时会互相拖死；时间切片最灵活但切换有开销。更细的解法是 HAMi 这类在驱动层做显存与算力配额的工具，能把一张卡切给多个 Pod。扩缩容看队列深度、排队等待时间和 KV Cache 使用率，而不是 QPS。推理的冷启动要拆开算：权重从存储读进 HBM、图捕获与编译、warmup 请求，加起来几十秒到几分钟，所以扩容得靠预测和预热池提前做；缩容要有保护期，先停止接新请求、等在跑的 decode 收尾，多机张量并行时还要考虑拓扑，不能随便摘一张卡。能把这套讲完，基本就覆盖了「中间做云原生弹性服务」那一层的考点。

**最后两道「你更适合哪层」是稳定性测试，答法要闭环。** 承认对产品有兴趣，但把逻辑接回底层：AI 产品的体验瓶颈常常就是 TTFT 和单 token 成本，并发一高就 OOM，上层封装再好也留不住用户；正因为懂产品对延迟和成本的敏感，才更该在引擎层把算力榨干。再表态愿意从适配、压测、值班做起。AI Coding 那题给三个具体落点——CUDA 到 CANN 的算子迁移初稿、批量压测脚本、长报错日志的定位——同时说清边界：性能改动以 profiling 为准，生成的代码必须过测试与压测。反问可以问团队的性能回归 CI 怎么跑、国产卡在集群里的占比，这类问题在 Infra 岗比问业务前景更加分。

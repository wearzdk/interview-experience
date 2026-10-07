---
title: "Kimi AI Infra 算法一面"
company: "Kimi"
position: "AI Infra 算法工程师"
round: "一面"
date: '2026-10'
source: 牛客网
tags: ["AI Infra","分布式训练","通信优化","Attention","GPU架构","量化"]
summary: "Kimi AI Infra 算法一面面经，10 问全在分布式训练与 GPU 底层：DeepEP 两种模式取舍、Ulysses 与 Ring Attention 对比、DCP 分片注意力、Online Softmax 与 Blackwell 架构演进。"
---

### 《面试题目》

1. 请说明 DeepEP 常规模式与低延迟模式的设计差异、适用场景与核心优化思路。
2. 这两种模式各自的取舍逻辑是什么？
3. 对比 Ulysses 序列并行与 Ring Attention 并行架构的通信方式、计算特征与适用场景区别。
4. 简述 DCP 分片注意力的完整实现思路，包含序列分片策略、多卡局部注意力计算与结果合并流程。
5. 分布式注意力场景下，Online Softmax 的迭代更新方式与 LSE 合并的底层实现原理是什么？
6. 从 Ampere、Hopper 到 Blackwell 三代英伟达架构，张量计算、数据搬运、编程模型上有哪些核心迭代变化？
7. 新一代架构愈发依赖软件流水线与异步调度，请说明 Tensor Memory 的流水线双缓冲机制，以及 num_stages 参数的选型依据。
8. 寄存器、共享显存资源如何影响 GPU occupancy？Persistent Kernel 架构如何通过内核级流水线隐藏访存延迟？
9. Grouped GEMM 中连续排布与掩码排布的区别是什么？动态 Tile 调度、地址乱序优化如何提升 L2 复用率？
10. 对比 MXFP8 量化与块粒度 FP8 量化的粒度差异、缩放参数开销，以及两者与 MMA 计算的重叠优化区别；同时说明 TMA 与 cp.async 数据搬运指令的选型标准。

### 《参考解析》

**DeepEP：常规模式与低延迟模式的设计差异**

DeepEP 是服务 MoE 专家并行的通信库，两种模式面向两种负载。常规模式走高带宽路径（节点内 NVLink、节点间 RDMA），在 all-to-all 前按 rank 维度对相同目标做数据合并去重，用较大的通信批次把带宽吃满，追求吞吐，适合训练与 Prefill 阶段——这两个场景 batch 大、计算密集，单次通信多几十微秒无所谓。低延迟模式面向 Decode：每步只发几个 token，通信量极小但对延迟极敏感，于是舍弃了常规路径里经由本地显存与 SM 的拷贝环节，让 RDMA 把数据直接写到对端，用更细粒度的同步与更少的 kernel 启动把单次延迟压到最低，代价是带宽利用率低、需要更多并发请求来掩盖延迟。取舍逻辑就是一句话：吞吐优先的训练与 Prefill 用常规模式，延迟优先的在线 Decode 用低延迟模式，把两者混用会在两边都吃亏。追问常落在「为什么低延迟模式不合并去重」「什么时候该切回常规模式」这类边界上。

**Ulysses 与 Ring Attention：通信与计算特征对比**

Ulysses（DeepSpeed-Ulysses）沿序列维切分，再用 all-to-all 把「序列分片」转成「头维分片」，这样每张卡拿到完整序列但只算一部分注意力头，算完再 all-to-all 换回来。它的通信量适中、all-to-all 在节点内 NVLink 上很快，适合序列长度中等、注意力头数足够的场景；短板是并行度受头数限制（头数不够就切不动），且跨节点 all-to-all 对网络拓扑敏感。Ring Attention 沿序列切成块，每张卡持有自己那块 Q，把 K/V 块按环依次传给下一张卡，边算边传，用块级 online softmax 累加结果。它的通信量与序列长度线性相关、与设备数无关，计算与通信能完全重叠，适合超长序列、跨节点带宽受限的场景；代价是实现复杂、对块划分与负载均衡要求高。实践中两者常组合使用：节点内用 Ulysses 换头，节点间用 Ring 传块。

**DCP 分片注意力：分片、局部计算与合并**

DCP 是把 KV cache 沿序列维切到多卡，用来扛长上下文的 Decode。流程三步：先把 KV cache 按序列位置分片，每卡只留一段（通常按 block 粒度均分，避免某卡持有全部 sink token）；每张卡用自己的 Q 与本地 KV 分片算出局部注意力输出与局部 LSE；最后做一次跨卡合并，把所有分片的输出按 LSE 加权归一成一个结果。它的收益是每卡的 KV 显存与访存带宽降到 1/N，代价是每步解码多一次跨卡归约，通信量正比于 hidden size 而不是序列长度，所以长上下文下摊薄得越好越划算。工程上要注意的坑：因果掩码在分片边界上的处理、负载不均衡（分片长度不一时有的卡先算完要空等）、以及与其他并行维度（TP/EP/DP）的通信组如何排布避免互相抢带宽。

**Online Softmax 与 LSE 合并的底层原理**

普通 softmax 要先把一行分数全读进来算出最大值和指数和，再做归一化，这在分块或分卡时做不到。Online softmax 的做法是流式维护两个量：当前最大值 m 与按 m 归一化的指数和 l，以及输出累加器 O。每来一个新块，先算块内最大值，如果它比 m 大，就把已累积的 l 与 O 整体乘上 exp(m_old − m_new) 做重缩放，再累加新块的贡献；遍历完 O 除以 l 即得结果。跨卡合并时，每张卡输出自己的局部输出 O_i 与 log-sum-exp 值 lse_i = m_i + ln l_i，全局 lse = logsumexp(lse_i)，最终 O = Σ exp(lse_i − lse) · O_i。这套重缩放加 LSE 归约是 FlashAttention、split-KV 解码、Ring Attention 与 DCP 共用的地基，数值稳定性的关键在于全程不显式构造完整的分数矩阵。

**从 Ampere 到 Blackwell：架构演进与 num_stages 选型**

Ampere 引入了 cp.async 与 TF32/BF16 张量核、把异步拷贝与计算初步解耦，但累加器仍在线程寄存器堆（每线程 255 个寄存器是硬约束），大 tile 容易把寄存器吃满、occupancy 掉下来。Hopper 带来 TMA（整块 tensor tile 异步搬运，不用线程算地址）与线程块簇（cluster 内可做分布式共享内存与多播），wgmma 让矩阵乘从寄存器堆取操作数，配合 mbarrier 的异步流水线把加载、计算、epilogue 三段重叠起来。Blackwell 进一步把累加器搬到 Tensor Memory（TMEM），MMA 指令（tcgen05）异步发射，寄存器压力显著下降；同时引入 block scale 的 MX 格式支持与更细粒度的异步控制，代价是编程模型更依赖软件流水线。num_stages 决定预取深度：stage 越多越能掩盖 DRAM 与 TMA 延迟，但每个 stage 占一份共享显存，共享显存又限制并发 CTA 数。选型依据就是这三个量的平衡——共享显存上限（Hopper 单 SM 约 228KB）除上每 stage 的 tile 字节数给出可行上界，再看延迟能不能藏住：从 2 加到 3 到 4 收益明显，再往上常常饱和甚至因为 occupancy 下降而回退，所以真实项目里都是实测扫描出来的，不是拍脑袋定的。

**Occupancy 与 Persistent Kernel**

occupancy 是每个 SM 上能同时驻留的 warp 比例，由每 CTA 的寄存器用量、共享显存、线程数与硬件上限共同决定——大 tile 的 GEMM kernel 往往寄存器占用高，occupancy 只有两成到三成，这时就得靠指令级并行和更深的软件流水线来隐藏访存延迟。Persistent Kernel 的思路是只在 SM 数量级的 CTA 上启动一次，每个 CTA 循环领取多个 tile 做计算，好处有三：省掉反复启动与尾部效应、把 tile 调度放到 kernel 内做（可以按负载动态分配）、以及在循环里预取下一个 tile 的操作数、把 epilogue 与下一个 mainloop 重叠。它和 warp specialization 常常一起用：一部分 warp 专做加载与 TMA、一部分专做 MMA、一部分专做 epilogue，用 mbarrier 与命名屏障同步。追问一般会问「occupancy 低是不是一定差」——答案是不一定，只要访存与计算能被流水线藏住，低 occupancy 换取更大的 tile 与更高的数据复用往往更划算。

**Grouped GEMM 的两种排布与 L2 复用**

Grouped GEMM 是 MoE 场景的刚需：一个 batch 里不同专家的 token 要各做一次 GEMM，融合成一次 kernel 启动以避免几十次小 kernel 的调度开销。连续排布把同一专家的 token 紧凑地拼在一起，M 维连续、地址规整，可以按组切出独立 GEMM，tile 调度简单、L2 命中率高；代价是分发阶段要做一次 gather、聚合阶段再做一次 scatter，这两次重排都要读写一遍激活，带宽不便宜。掩码排布（保留原始 token 顺序，用每组指针与 mask 处理跨界）省掉了重排，但跨组边界的 tile 有效 M 很小、算力利用率掉下来，mask 判断还增加指令开销。动态 Tile 调度就是按各专家实际 token 数分配 tile 数并按大小排序，尽量让一个 tile 只属于一个专家，减少 mask 浪费；地址乱序优化则是按 tile 的实际执行顺序重排 A 的读取地址，让相邻 tile 共享 A 的行或 B 的列，从而提高 L2 复用率、把有限的 L2 带宽用在真正复用的数据上。回答时最好带上量化意识：什么时候 gather/scatter 的带宽比 mask 浪费更贵，取决于 token 分布的倾斜程度。

**MXFP8、块粒度 FP8 与搬运指令选型**

MXFP8 是 OCP 定义的 microscaling 格式：每 32 个元素共享一个 E8M0 缩放因子，粒度粗、元数据开销极小（每 32 个值只多 1 字节），而且缩放因子是 2 的幂，反量化只需指数加减，能直接被硬件在 MMA 数据通路上采样，几乎不占额外指令。块粒度 FP8（例如按 128 元素的 per-token、per-channel 或 tile 级缩放）粒度更细、对离群值的适应更好、精度更稳，代价是缩放参数的存储与反量化乘法都更多，通常要在寄存器里做额外 FMA，很难与 MMA 完全重叠。选型上：追求吞吐与硬件原生支持就走 MXFP8；激活离群值大、精度敏感时用更细粒度，也可以混合——权重用 per-channel、激活用 per-token。TMA 与 cp.async 的分工也类似：TMA 是 Hopper 之后的专用拷贝引擎，一条指令搬整个多维 tile，不需要线程参与地址计算、不占寄存器，还能配合 mbarrier 做异步与 cluster 多播，是首选；cp.async 是 Ampere 时代的 16 字节级异步拷贝，需要线程发起、粒度小，留给不规则访问、小粒度搬运或旧架构，以及在 TMA 描述符难以表达的场景里兜底。

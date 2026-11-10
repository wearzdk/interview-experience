---
title: "腾讯混元 AI Infra 二面：三代 GPU 架构、Cache-Aware 路由与 W4A4 稀疏算子"
company: "腾讯（混元）"
position: "AI Infra"
round: "二面"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/f63a43156e7c4564a11a8184db3d8fee
tags: ["腾讯","混元","AI Infra","GPU 架构","TMA","WGMMA","UMMA","KV Cache","量化","CUDA"]
summary: "腾讯混元 AI Infra 二面全部围绕自研推理栈：先对比 Ampere、Hopper、Blackwell 三代架构的 TMA、Tensor Memory 与低比特支持，再追问 WGMMA 与 UMMA 的指令级差异、Cache-Aware 路由的评分与调参、TILE Cache 系统仿真，最后落到 W4A4 稀疏算子的实现细节，并现场手写带工程优化的 Softmax。"
---

### 《面试题目》

1. 英伟达三代 GPU 架构指令集迭代差异。
   - 梳理 Ampere、Hopper、Blackwell 三代架构的核心升级差异，重点对比 TMA 传输机制、Tensor Memory 张量内存特性的迭代。
   - 硬件异步调度能力如何升级？
   - FP4、FP6 低位宽量化的硬件原生支持有哪些特性？
   - 结合推理场景，说明每一代升级对大模型推理提速、显存节省的实际价值。
2. Hopper 与 Blackwell 矩阵计算指令底层差异。
   - Hopper 架构的 WGMMA 指令，为什么必须依赖完整 Warp Group 才能发起计算任务？
   - 新一代 Blackwell 架构的 UMMA 指令，能够支持单 Warp 独立执行的底层原理是什么？
   - Tensor Memory 硬件中，Scale Factor 缩放参数的工程落地与存储适配方案。
3. 面向热点实例的 Cache-Aware 路由优化。
   - 行业主流的 Cache Score + Load Score 双维度负载评估方案如何设计？
   - 超参 Lambda 的取值依据、调优思路，以及参数变化对整体缓存命中率的影响。
   - 多实例部署场景下，跨实例 KV Cache 资源共享的实现思路与适用边界。
   - 自研 Cache 调度策略相较于 Dynamo 原生调度机制的核心优化与差异优势。
4. Intel TILE Cache 系统级仿真工程。
   - 面向客户场景的 TILE Cache 仿真落地流程。
   - 如何基于仿真结果输出最优的模型并行配置与 PD 配比方案？
   - 系统层面的性能瓶颈定位与资源调优思路。
5. W4A4 稀疏量化 Kernel 工程实现。
   - 基于 WMMA 指令集的稀疏矩阵计算实现逻辑。
   - W4A4 量化方案的精度取舍与量化映射规则。
   - 4 个 Tile 单元对应 1 个 Bitmap 稀疏掩码的设计思路。
   - Split Key 分片机制、Double Buffer 双缓冲、LSBD 流水线并行的优化价值。
   - M16N8K64 核心参数的设定依据，以及整套稀疏算子的落地适用场景。
6. 上机笔试：手写实现 Softmax 前向计算，并给出全套工程优化思路，包括 Warp Shuffle 规约、寄存器复用、减少高频显存访存、数值溢出防护。
7. 反问：团队核心业务方向与当前攻坚的技术难点；GPU 算力资源配置与人均硬件资源；调度系统、推理框架、底层算子三个方向的团队划分与业务侧重。

### 《参考解析》

**三代架构的差异要落在「数据怎么搬、计算怎么发、精度怎么表示」三条线上。** Ampere 引入 `cp.async`，把全局内存到共享内存的拷贝异步化，并用第三代 Tensor Core 支持 TF32、BF16 与 2:4 结构化稀疏；这一代没有 TMA，也没有独立的张量内存。Hopper 增加 TMA，用描述符发起多维张量的批量异步拷贝，配合 mbarrier 完成通知，并支持 Thread Block Cluster 与分布式共享内存；计算侧是第四代 Tensor Core 的 WGMMA，原生支持 FP8。Blackwell 把矩阵乘的累加器从寄存器搬到 Tensor Memory（TMEM），由 tcgen05 系列 MMA（通常称 UMMA）异步执行，单线程即可发起；同时原生支持 FP4、FP6 与块缩放格式。对推理的价值分别是：TMA 降低搬运指令开销并提升带宽利用率，TMEM 缓解寄存器压力、让累加器容量与 tile 更大，FP4/FP6 直接降低权重与激活的显存占用和带宽需求，但低比特的收益取决于精度损失是否可接受。

**WGMMA 依赖 Warp Group，是因为指令的操作数布局按 128 个线程定义。** 一个 Warp Group 由 4 个 warp 组成，A/B 矩阵的 fragment 与累加器分散在这 128 个线程的寄存器以及共享内存中，硬件按 Warp Group 统一调度这次矩阵乘；单个 warp 无法提供完整的 fragment 布局，也无法满足指令对线程协作的约束。UMMA 把累加器放到 TMEM，指令本身由单线程发起，硬件异步执行完成后通过 mbarrier 通知，参与计算的线程不必同时持有完整的累加器 fragment，因此可以做到单 Warp 甚至单线程 issue。回答时要把「谁发起、操作数在哪里、结果写到哪里、怎么知道完成」四件事说全。

**Scale Factor 在 TMEM 中要按块布局单独管理。** 块缩放格式让每 16 或 32 个元素共享一个缩放因子，MMA 在累加时按块读取对应的 scale。工程上需要为 scale 预留 TMEM 空间，按 tile 的块边界搬运并对齐主操作数，保证 scale 的更新与权重版本一致；如果 scale 与数据布局错位，数值结果会整体偏移且很难从日志发现，通常要用小规模已知输入的对照测试来校验。

**Cache-Aware 路由的核心是把「省多少计算」与「等多久」量化到同一尺度。** Cache Score 一般由请求与实例已缓存前缀的最长公共前缀长度估算，前缀越长，可跳过的 prefill 计算越多；实现上常用 radix tree 维护每个实例的前缀，查询命中长度后折算成时间收益。Load Score 由排队请求数、运行中请求、KV 显存占用与 GPU 利用率共同决定，输出预计等待时间。两者归一化后加权，Lambda 控制偏向缓存复用还是负载均衡。调参不能凭经验：用真实流量回放，扫 Lambda 网格，观察 TTFT 的 P50/P99、吞吐、缓存命中率与实例间负载方差；Lambda 过大会把请求持续吸到热点实例，形成排队，过小则退化为轮询。跨实例共享 KV 要走高速互联（NVLink、RDMA），并权衡传输成本与重算成本、租户隔离、模型版本一致性与显存回收；共享前缀很长时才划算。

**TILE Cache 仿真的价值在于把架构决策前移到流片之前。** 典型流程是采集负载 trace（算子、tile 尺寸、访问步长与复用距离），建立包含容量、相联度、行大小、替换策略与预取的 cache 模型，跑仿真得到命中率、访存次数与停顿，再用硬件计数器校准模型。基于仿真结果可以评估不同模型并行切分下的通信与访存压力，进而确定 TP/PP/EP 组合与 prefill/decode 实例配比；瓶颈定位按 roofline 先判断是算力、带宽还是同步开销，再逐层下钻。

**W4A4 稀疏算子的难点在反量化开销与数据搬运。** 4-bit 权重与激活按字节打包，计算前要反量化，per-group scale 的粒度直接影响精度与额外访存；稀疏掩码描述哪些块参与计算，4 个 tile 共享一张 bitmap 可以摊薄元数据开销，但要求 tile 的划分与 MMA 的块边界一致。Split-K 把归约维切开以提高并行度，代价是部分和需要额外 reduction；Double Buffer 与多 stage 流水让拷贝与计算重叠；M16N8K64 这类形状是在指令支持、共享内存布局与数据复用之间取的折中，K=64 与 4-bit 打包后的操作数宽度、swizzle 方式相关。精度上要关注激活离群值，通常配合分组缩放、敏感层保留更高比特，并用任务指标而不只是困惑度做验收。

**Softmax 的优化分四层。** 算法层做两遍扫描：先求行最大值，再算 `exp(x - max)` 并求和，最后归一化，减最大值是防溢出的关键；超大行可以用 online softmax 边读边更新。线程层用 `__shfl_xor_sync` 做蝶式归约，32 个 lane 五步完成 max 与 sum，再广播结果；每个线程把负责的元素留在寄存器里复用，避免重复读取。访存层用 128 位向量化加载、合并访问，尽量让一行数据只读一次，中间结果留在寄存器或共享内存，不落全局内存。指令层用 `exp2f(x * log2(e))` 替代 `expf`，并处理 `-inf`、NaN 与整行全为 `-inf` 的边界。写完先给正确版本，再逐项说明优化收益与代价。

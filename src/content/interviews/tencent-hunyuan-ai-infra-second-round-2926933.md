---
title: "腾讯混元 AI Infra 二面：GPU 架构、KV Cache 与算子"
company: "腾讯（混元）"
position: "AI Infra"
round: "二面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/c90e13bc30a4485d930808c2e7196e5c
tags: ["腾讯","混元","AI Infra","CUDA","KV Cache","推理优化","算子优化"]
summary: "腾讯混元 AI Infra 二面：从安培、Hopper、Blackwell 三代架构与 TMA、WGMMA/UMMA 指令差异，问到 Cache-aware 推理路由、跨实例 KV Cache 共享、稀疏算子设计与手撕 Softmax 算子优化，问题全部打在自研推理栈的细节上。"
---

### 《面试题目》

1. 自我介绍：重点讲过过往 AI Infra 相关项目的落地经历与论文核心成果，说明个人核心贡献与技术难点突破点。
2. 对比 NVIDIA 安培、Hopper、Blackwell 三代架构的核心指令集差异，重点说明 TMA 传输机制、张量内存设计、异步调度策略的迭代优化，以及 FP4、FP6 低精度算力的硬件适配特性。
3. 对比 Hopper WGMMA 与 Blackwell UMMA 指令的执行逻辑差异：WGMMA 为什么需要 Warp Group 批量发射？UMMA 为什么单 Warp 就能完成计算？张量内存里的 scale factor 怎么落地应用？
4. 讲解 Cache-aware 推理路由方案：针对线上热点实例负载不均的问题，cache score 与 load score 双维度评估策略是怎么设计的？
5. Cache-aware 路由里的平衡系数 lambda 怎么取值？参数变动对整体缓存命中率有什么影响？对应的调优策略是什么？
6. 介绍跨实例 KV Cache 共享的实现方案、适用业务场景，并对比它与框架原生调度策略的核心差异与性能优劣。
7. 分享英特尔 TILE Cache 仿真项目的经验：仿真平台怎么搭、系统层面的优化思路是什么、怎么基于仿真结果给业务输出并行配置与 PD 配比的标准化参考方案？
8. 讲解 W4A4 稀疏推理 Kernel 的完整实现方案、基于 WMMA 指令的算子适配逻辑与量化精度设计思路。
9. 介绍自研的「4 Tile 对应 1 Bitmap」稀疏算子设计，说明这个方案对稀疏计算效率的提升原理。
10. 阐述算子优化中的 key 拆分策略、双缓冲机制、LSBD 流水线设计，以及 M16N8K64 矩阵分块参数的适配场景与设计依据。
11. 手撕 Save Softmax 算子：完成基础代码实现，并全方位拆解优化思路（Warp Shuffle 归约、寄存器缓存复用减少片上访存等）。
12. 反问：团队的核心业务场景是什么？当前大模型推理落地的核心技术瓶颈与攻坚方向在哪？
13. 反问：团队的 GPU 资源配置与人员分工是怎样的？调度系统、推理框架、底层算子三大模块怎么划分研发侧重？

### 《参考解析》

**三代架构的差异，本质是「数据从 HBM 走到计算单元」这条路径的迭代。** 安培这一代的关键词是 `cp.async`：把 global 到 shared 的拷贝从寄存器旁路出去，让访存和计算重叠，同时上 TF32、BF16 这些算力格式。Hopper 把这件事硬件化：TMA（张量内存加速器）用一个描述符一次搬一整个多维 tile，省掉大量地址计算与寄存器占用，配合线程块簇（cluster）与分布式 shared memory，把跨 SM 的数据共享做进硬件；矩阵乘侧是 WGMMA，异步下发、结果直接落在寄存器上。Blackwell 又往前走一步：累加器从寄存器搬到 tensor memory（tcgen05 架构下的 UMMA 由单个 warp 下发、张量核独立执行），腾出寄存器给别的东西用，并新增 FP4、FP6 这类更低位宽的算力格式。低精度能不能真用起来要看 scale：Hopper 的 WGMMA 对 FP8 基本是 per-tensor / per-channel 级别，Blackwell 支持块级（MX 风格）scale 直接喂进 MMA，这才是 FP4 精度可用的前提。答这条线的时候最好按「搬运方式 → 累加器位置 → 精度格式与 scale 粒度 → 同步/异步模型」四个维度对齐着说，比零散报参数清楚得多。

**WGMMA 需要 Warp Group、UMMA 单 Warp 就够，根因在「谁负责下发、累加器在哪」。** WGMMA 是异步指令，一个大 tile（通常 M=64）的 A/B 要从 shared memory 按描述符读取，单个 warp 的寄存器与执行资源覆盖不了这么大的 tile，也凑不出所需的操作数带宽，所以规定由 4 个 warp 组成的 warpgroup（128 线程）协同下发，配合 `warpgroup.arrive/wait` 做细粒度同步。Blackwell 把结果写到 tensor memory 之后，矩阵乘由 tensor core 独立跑，warp 只承担下发与调度职责，一个线程就能发指令，所以单 warp 即可完成；代价是算完之后要显式把 tensor memory 载回寄存器（tcgen05.ld）才能继续做后续逐元素运算。scale factor 的落地也在这条链上：量化 scale 需要在 MMA 之前以正确的布局驻留在 shared memory（Blackwell 的 UMMA 支持直接按块读取 scale），否则每个 tile 都要额外走一遍寄存器路径，量化收益会被搬运吃掉。

**Cache-aware 路由要讲清「为什么负载不均」和「两个 score 各是什么」。** 前缀复用会让命中率高的实例更快、于是调度又把更多请求送给它，正反馈下热点实例被打爆，所以路由必须同时看缓存与负载。cache score 是「这个请求的前缀能在该实例命中多少」，工程上用前缀哈希 / radix tree 索引近似匹配长度（越长的公共前缀换算成越多的省下 prefill token）；load score 是实例的实时压力，用排队请求数、在跑 batch 的 token 数、GPU 利用率、显存余量与最近时延综合。选择变成 `score = cache_score − λ · load_score` 取最大。λ 的两端很清楚：太大就退化成纯负载均衡，命中率掉、算力成本涨；太小就变成粘性路由，P99 时延与排队抖动明显。取值的关键是先归一化——把「多命中 N 个 token 能省多少毫秒」与「多等多少排队时间」换算到同一量纲，再按业务在乎 TTFT 还是在乎吞吐来定档；线上要能按模型、时段、实例规模在线调，并盯着整体命中率、P99 TTFT、实例间负载方差三个指标做闭环。追问会落在路由抖动（加最小驻留时间与会话级粘性）、缓存元数据的真实性（实例崩溃或淘汰后 score 虚高，需要失效通知或版本号）。

**跨实例 KV Cache 共享有两条实现路线，选哪条取决于业务前缀形态。** 一条是以传输为中心：把 KV block 按前缀哈希寻址，通过 RDMA / 高速互联在实例间搬，谁需要谁拉；另一条是以缓存为中心：做分层存储（显存 → 主机内存 → 远端或分布式缓存池），命中就加载。适用场景都是「前缀长且被多请求共享」——超长 system prompt、多轮对话的历史前缀、同一份 RAG 文档或 few-shot 模板被反复使用。和框架原生调度（例如 KV-aware router）比，原生方案胜在与框架集成、全局视角完整、维护成本低；自研方案胜在能贴合自家业务的前缀分布做更细的 block 级复用与淘汰策略，代价是元数据一致性、跨实例传输与容错都要自己兜。性能账要算全：共享省下的是重复 prefill 的算力与 TTFT，付出的是网络带宽与加载延迟，热点前缀集中时收益会被传输带宽吃掉，所以要配合 locals-first（同机同卡优先）与预取。

**稀疏算子的几个设计点要能各自说清「省了什么」。** 「4 Tile 对应 1 Bitmap」是把 4 个 tile 的稀疏掩码压成一张位图，一次判断覆盖四个 tile，省的是元数据体积与分支/取指开销，让主循环更规整——代价是粒度变粗，稀疏度不均匀时会有更多无效计算。「key 拆分」是把 KV 或权重的维度按硬件友好的方式拆开以对齐 MMA 的 K 维，减少尾块与 padding；双缓冲是 ping-pong 的 shared memory 布局，让下一块的搬运与当前块的 MMA 重叠；LSBD 流水线是把低位宽数据的累加拆成多级、以匹配累加器的精度与时序，避免精度塌陷。M16N8K64 属于 Hopper 起 FP8 类 MMA 常见的形状，K=64 的价值在于单条指令吃进更多数据、减少指令下发次数，适配场景是被量化到 8 位、K 维连续且对齐良好的 GEMM。W4A4 稀疏 kernel 的实现要点则集中在三处：scale 的粒度（per-group 而不是 per-tensor，否则精度掉得厉害）、稀疏元数据与权重的打包布局（保证访问连续、避免 gather 散读）、以及尾块边界处理（非整除时的 mask 与补零）。

**手撕 Save Softmax 的得分点在「先正确再优化」，优化要按访存层级讲。** 基础版是两趟：先求行最大值防 exp 溢出，再 exp、求和、归一化；数值稳定性必须提到，直接 exp 大数会 inf。第一层优化是归约方式：一个 warp 负责一行时用 `__shfl_xor_sync` 做蝶形归约求 max 与 sum，省掉 shared memory 往返与多轮同步；一行很长或一个 block 负责一行时，用 warp 内归约 + shared memory 跨 warp 归约的混合方案。第二层是把两趟压成一趟的 online softmax（running max / running sum 边扫边修正），这也是 FlashAttention 的核心技巧。第三层是访存与寄存器：把 exp 结果留在寄存器里复用，避免重算或写回 shared；做 128 位向量化读写；调整布局或 padding 避免 bank conflict；用 `__expf` 这类近似函数前要主动说明精度代价，并在测试里给出误差对比。最后要能讲取舍：warp-per-row 与 block-per-row 的选择取决于行长、寄存器压力与 occupancy，长行、批量形状不规整时 occupancy 会先成为瓶颈而不是算力。

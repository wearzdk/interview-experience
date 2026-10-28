---
title: "禾赛科技 AI Infra 一面复盘：FlashAttention、NCU 指标与 RL 链路卡死"
company: "禾赛科技"
position: "AI Infra"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/d4edb974c5f74ff1b2225cc0bfe4ab44
tags: ["禾赛科技", "AI Infra", "FlashAttention", "CUDA", "性能分析", "算子优化"]
summary: "禾赛科技 AI Infra 一面：从多卡训练经验问起，深挖 FlashAttention 各代差异、Tiling 与分块搬运、Blackwell 与 H200 架构区别，再追 RL 链路的卡死排查与 NCU 指标判读，最后手写岛屿数量。"
---

### 《面试题目》

**开场与项目**

1. 有多卡、多节点的训练经验吗？实际使用的是什么训练硬件？
2. 是否分析过模型训练的详细耗时？例如 Attention 的前向、反向分别占多少？

**FlashAttention 与硬件**

3. 不同版本的 FlashAttention 有什么区别？
4. Tiling 具体做了什么？
5. 为什么分块能够减少搬运？
6. 分块之后是否就不需要反复搬数据了？
7. Blackwell 与 H200 有哪些架构差异？
8. Tensor Core 是 Blackwell 独有的吗？

**RL 链路与故障**

9. RL 链路里的卡死具体是什么表现？程序会退出吗？运行状态有什么变化？
10. 它和训推一致性是什么关系？
11. 排查时你对照了哪些变量？

**性能分析**

12. 算子优化用过哪些性能分析工具？
13. 在 NCU 中重点关注哪些指标，各代表什么？
14. 怎样判断是计算瓶颈还是访存瓶颈？
15. SM 利用率偏低时，下一步检查什么？
16. warp 有什么特点？
17. warp divergence 是什么？
18. 为什么不同线程不能简单地独立执行各自的分支？

**协作与编程**

19. 实习中最大的挑战是什么？
20. 既然任务由 mentor 对接和分配，为什么沟通仍然是挑战？具体怎么解决？
21. 在线编程：二维网格中的岛屿数量，方案是否最优？

### 《参考解析》

**FlashAttention 的收益不在「少算」，在「少搬」**。标准 Attention 要把 $QK^T$ 的 $N\times N$ 矩阵写回 HBM 再读出来做 softmax，显存带宽成了瓶颈。FlashAttention 按行分块，把 K、V 的一小块加载进 SRAM，在片上算完分块的 $QK^T$、在线 softmax（维护 running max 和 running sum）和加权求和，整个 $N\times N$ 矩阵从不需要完整落地。分块能减少搬运的原因是片上 SRAM 带宽比 HBM 高一个量级，把中间结果留在片上等价于把 HBM 往返换成了片上读写；但 K、V 的每一块仍然要被每个 Q 块重复读取，只是重复发生在片上缓存友好的粒度上，所以「分块之后就不需要反复搬数据」不成立——减少的是中间矩阵的往返，不是输入本身。

**各代差异说清主线就够**：v1 引入 tiling 与 online softmax；v2 把工作划分从「按 Q 块顺序、K/V 循环在外」改成 Q 在外层、K/V 走内层，减少非矩阵乘的 FLOPs 与共享内存读写，并支持因果掩码下跳过大块；v3 针对 Hopper 用 TMA 异步拷贝、WGMMA 和 warp specialization（生产者 warp 负责搬数据、消费者 warp 负责算），把计算与搬运重叠起来；到 Blackwell 主要吃的是更大更快的 Tensor Memory 与新一代张量核心指令。硬件代际这块要能对上：Tensor Core 从 Volta 就有了，不是 Blackwell 独有，Blackwell 的变化在第五代 Tensor Core 支持的精度格式（如 FP4）、更大的片上存储与新的异步拷贝机制。

**RL 链路卡死先固定现象再谈原因**。面试里最容易被追问垮的是把「跑在 RL 链路里」当成解释。正确的叙述顺序是：进程有没有退出、GPU 利用率掉到多少、是全部 rank 卡住还是个别 rank、卡住发生在 rollout 还是 update 阶段、有没有 NCCL 超时日志。然后才是我做了什么对照实验——关掉 CUDA Graph 是否复现、换 TP 配置是否复现、开确定性设置是否复现、换 Graph 执行模式是否复现——每一步对应一个可观测的结论。训推一致性则是另一个问题：训练侧和推理侧对同一批 token 的 logprob 是否一致，通常来自 kernel 实现差异、bf16 累加顺序、CUDA Graph capture 后的静态图与动态 shape 的冲突。两者可能同源（融合通信路径上的数值/同步差异），但要靠实验证，不能靠推理猜。

**NCU 指标要能连成一条推导链**。常用几个：`sm__throughput.avg.pct_of_peak_sustained_elapsed`（SM 流水线占用）、`gpu__dram_throughput.avg.pct_of_peak_sustained_elapsed`（HBM 带宽占用）、`l1tex__throughput` / `lts__throughput`（各级缓存压力）、`smsp__warp_issue_stalled_*`（warp 为什么没发射，如 stall_long_scoreboard 等内存、stall_barrier 等同步、stall_mio_throttle 等共享内存/MIO 队列）。判别计算还是访存瓶颈的实用方法是看 roofline：先算这个 kernel 的 arithmetic intensity（FLOPs / Bytes），跟机器的 ridge point 比，落在左侧就是带宽受限、右侧是算力受限；再对照 SOL 里 SM 与 DRAM 两个百分比，谁先接近 100% 谁就是瓶颈。SM 利用率低时顺着 stall 原因查：long_scoreboard 高说明等全局内存（考虑增大 tile、提高复用、加 prefetch）、barrier 高说明同步过多（考虑减少 __syncthreads、改用 warp 级同步）、mio_throttle 高说明共享内存 bank 冲突或指令发射拥塞。看到某个百分比就下结论是最常见的错。

**warp divergence 的根因是 SIMT 的执行模型**。一个 warp 的 32 个线程共用一条指令流，硬件按「活跃掩码」推进：遇到分支时两条路径要串行执行，各自屏蔽掉不属于自己的线程，代价是两段路径的耗时相加。所以不是「不同线程不能独立执行」，而是同一 warp 内没有独立的 PC，只能靠掩码模拟。减少发散的手段是把分支改成谓词/算术（如用 select 代替 if）、让同一 warp 内的线程走同一分支（按数据重排）、或者把分支粒度提到 warp 之上（一个 warp 处理同一类任务）。

**在线编程部分**：岛屿数量的主线是遍历每个格子，遇到未访问的陆地就计数加一并把整个连通块标记掉。DFS 和 BFS 都能保证每个格子被处理常数次，时间复杂度 $O(mn)$；空间上 DFS 递归深度最坏是 $O(mn)$（全陆地时栈会爆，工程上要么显式栈要么 BFS），BFS 队列最坏也是 $O(mn)$。所以「BFS 更优」的说法不成立，选哪个看的是栈深风险和常数，不是复杂度。这题还有一个常被追问的变体是用并查集，复杂度多了反阿克曼因子，但好处是可以处理流式加入的格子。

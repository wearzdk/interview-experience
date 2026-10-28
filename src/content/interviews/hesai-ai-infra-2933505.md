---
title: "10.27 禾赛科技 AI Infra 一面复盘：FlashAttention、NCU 与 RL 卡死"
company: "禾赛科技"
position: "AI Infra"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/9223191e4b5f485aa0d83a3e7bd0b4dc
tags: ["禾赛科技","AI Infra","FlashAttention","CUDA","Nsight","RL","岛屿数量"]
summary: "禾赛科技 AI Infra 一面复盘：多卡训练耗时拆分、FlashAttention 的 tiling 与硬件代际、RL 链路卡死的排查、NCU 指标与 warp 分支发散、跨方向协作，以及岛屿数量。"
---

### 《面试题目》

1. 多卡、多节点训练经验与训练硬件？
2. 是否分析过模型训练的详细耗时，例如 Attention 前向、反向各占多少？
3. 不同版本 FlashAttention 有什么区别？Tiling 具体做了什么？为什么分块能减少搬运？分块后是否就不需要反复搬数据？
4. Blackwell 与 H200 有哪些架构差异？Tensor Core 是 Blackwell 独有的吗？
5. RL 链路卡死的具体表现是什么？和训推一致性是什么关系？怎么排查？
6. 算子优化用哪些工具？NCU 中重点关注哪些指标？怎么判断计算或访存瓶颈？SM 利用率偏低时下一步检查什么？
7. warp 有什么特点？warp divergence 是什么？为什么不同线程不能简单地独立执行各自的分支？
8. 实习中最大的挑战是什么？任务由 mentor 分配，为什么沟通仍是挑战？具体怎么解决？
9. 在线编程：二维网格中的岛屿数量，DFS/BFS 的复杂度。

### 《参考解析》

**FlashAttention**：核心是 tiling + online softmax，把 Q/K/V 切成能放进 shared memory 的块，逐块计算注意力并增量更新 softmax 的分子分母，避免把完整的 S×S 注意力矩阵写回 HBM。收益是减少 HBM 读写、显存占用从 O(S²) 降到 O(S)；分块后仍要按块加载 K/V，但每块只读一次、复用度高。不同代际的差异在是否支持 Hopper 的 TMA/WGMMA、是否做生产者-消费者 warp 分工、以及 backward 的重计算策略。

**硬件代际**：H200 是 Hopper 架构，HBM3e、带宽更大；Blackwell（B100/B200）是新架构，支持 FP4、更大的 Tensor Core 吞吐和新的互联；Tensor Core 不是 Blackwell 独有，Volta 起就有。

**RL 卡死排查**：先描述现象（进程是否退出、GPU 利用率、是否有 NCCL 超时），再缩小复现规模；对比 CUDA Graph 开关、TP 配置、确定性设置、Graph 执行模式；定位到融合通信路径后看实现和版本；要区分「卡死」和「数值不一致」，后者用固定种子和小规模对拍。

**NCU 指标**：SM 利用率、achieved occupancy、memory throughput、L2/HBM 命中率、instruction throughput、stall reason；计算瓶颈看 FMA/ALU 利用率，访存瓶颈看 HBM 带宽和 L2 命中；SM 利用率低先看 occupancy（寄存器/shared memory 限制）、再看依赖和分支发散。

**warp divergence**：一个 warp 的 32 个线程共用指令指针，遇到分支时不同线程走不同路径会串行执行（先执行一条路径的活跃线程，再执行另一条），吞吐下降。根本原因是 SIMT 架构的锁步执行；解决是让分支条件在 warp 内一致（数据重排）或减少分支。

**岛屿数量**：遍历网格，遇到 1 计数加一，然后 DFS/BFS 把连通的陆地标记为 0；时间 O(mn)，空间 O(mn)（递归栈或队列），DFS 递归深度大时可能栈溢出。

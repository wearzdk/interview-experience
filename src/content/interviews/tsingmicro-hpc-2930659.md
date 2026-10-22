---
title: "清微智能一面（高性能）：FlashAttention、FP16/BF16 与 SpMV"
company: "清微智能"
position: "高性能计算"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/d1a72fe70eb74446b8947a4648c7337a
tags: ["清微智能", "高性能计算", "CUDA", "FlashAttention", "FP16", "BF16", "SpMV"]
summary: "清微智能高性能一面（25 分钟，无手撕）：实习与加速设备、DCU 是什么、算子功能与精度细节、矩阵乘优化、FlashAttention 的原理、CUDA 实现注意事项、FP16/BF16 特点与 float 位宽、SpMV 的稀疏格式选择。"
---

### 《面试题目》

1. 做一个自我介绍。
2. 你之前那段实习使用的设备是什么？是 GPU 吗？
3. 你学业课题里用的计算加速设备基本上都是 GPU 吗？
4. DCU 能讲一下吗？
5. 讲讲你做的算子的功能和精度细节，以及所用设备的体系结构。
6. 这个成果是团队一起做的，还是你一个人做的？写论文了吗？发表了吗？
7. 深度学习、大模型里的矩阵乘优化，以前接触过吗？
8. 这套东西你之前手写过吗？
9. 你提到 FlashAttention，解释一下它「flash」在什么地方？
10. 这套东西让你用 CUDA 写，你觉得应该注意哪些思想？
11. FP16 和 BF16 这两种 16 bit 浮点各有什么特点？
12. float 的指数位、尾数位各有多少位？
13. 不带转置的矩阵乘有做过吗？
14. 给你稀疏矩阵做 SpMV，你会硬做还是先转成 CSR/COO？

### 《参考解析》

**FlashAttention 的「flash」是「不把完整注意力矩阵写回显存」**。标准注意力要物化 N×N 的分数矩阵，显存占用随序列长度平方增长；FlashAttention 用分块（tiling）在 SRAM 里算局部块，配合在线 softmax 逐步累积，避免中间矩阵落 HBM，从而把显存降到线性、速度也更快。

**用 CUDA 实现时要注意的点**：合并访存、shared memory 的分块与 bank conflict、warp 内协作、寄存器压力与 occupancy 的平衡、边界处理（非整除的块）、以及数值稳定性（softmax 减最大值）。

**FP16 与 BF16 都是 16 位**：FP16 有 5 位指数 + 10 位尾数，精度高但动态范围小，容易溢出；BF16 有 8 位指数 + 7 位尾数，动态范围和 FP32 一致但精度低，训练中更稳。float32 是 1 位符号 + 8 位指数 + 23 位尾数。

**SpMV 先用合适格式再优化**：CSR 适合按行遍历和 GPU 并行，COO 适合构建和转换，ELL 适合每行非零数接近的场景。直接按稠密矩阵硬做会浪费大量带宽，稀疏场景下带宽就是瓶颈。

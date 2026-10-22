---
title: "壁仞科技二面（高性能）：CUDA 归约、Hopper 架构与图深拷贝"
company: "壁仞科技"
position: "高性能计算"
round: "二面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/bbfded258b1a4c66a2a6a13be9be305c
tags: ["壁仞科技", "高性能计算", "CUDA", "Hopper", "SpMV", "智能指针", "手撕"]
summary: "壁仞科技高性能二面：16 分钟项目拷打加 CUDA 八股——SpMV、归约指令、H100 架构与内存层次、shared memory 配置、流与同步；C++ 部分追问 static 与智能指针，手撕图的深拷贝和二叉树右视图。"
---

### 《面试题目》

1. 做一下项目介绍，尤其是 CUDA 项目的细节。
2. 讲一下 SpMV（稀疏矩阵向量乘）。
3. CUDA 这块是选修课程还是完全自学？
4. CUDA 里做 Reduce/归约常用哪些指令？
5. 以 H100 为例，讲一下它的架构。
6. 它的内存架构是怎样的？最外面是什么、中间是什么，每一层有什么同步策略？
7. Hopper 的 shared memory 有多大？
8. 开 kernel 时动态 shared memory 和静态 shared memory 怎么配置？
9. CUDA 里流（stream）的概念是什么？
10. 流的同步用什么实现？软件层面用的是什么？
11. 一面问过的 C++ 智能指针和模板编程，这次有没有补充学习？
12. C++ 的 static 关键字有哪些用途？除了变量还有哪些使用场景？
13. 看过哪些复杂一些的开源项目？
14. 你这个项目里（含 profiling）有用到 AI 吗？
15. 手撕：图的深拷贝（Node { int val; vector<Node*> neighbors; }）。
16. 手撕：二叉树的右视图。

### 《参考解析》

**SpMV 是稀疏矩阵乘向量，瓶颈在访存而不是计算**。常见格式 CSR（按行压缩，适合行遍历）、COO（坐标，适合构建）、ELL（固定每行非零数，适合 GPU 规整并行）。GPU 上的优化方向是合并访存、按行分配 warp、使用向量化加载，以及针对不均匀行长的负载均衡。

**CUDA 归约常用 warp shuffle 指令**（`__shfl_down_sync` 等）做 warp 内归约，再配合 shared memory 做 block 内归约，最后用原子操作或第二次 kernel 合并 block 结果。要点是避免 bank conflict、处理非 2 的幂长度。

**H100（Hopper）的内存层次**：寄存器 → shared memory / L1 → L2 → HBM（HBM3，容量 80GB 左右，带宽约 3TB/s）→ 主机内存。Hopper 的 shared memory 每 SM 最多 228KB（可配置 carveout），比 A100 的 164KB 更大。动态 shared memory 在 kernel 启动时用第三个参数指定字节数，静态的在声明时用 `__shared__` 固定。

**流（stream）是任务队列**，同一流内按顺序执行，不同流可并发；同步用 `cudaStreamSynchronize`、事件（`cudaEventRecord` / `cudaEventSynchronize`）或 `cudaDeviceSynchronize`。底层是驱动和硬件队列的完成信号，软件层面靠事件和回调。

**图的深拷贝**用哈希表记录「原节点 → 新节点」，DFS/BFS 遍历，遇到未复制的邻居就新建再递归，避免环导致死循环。**二叉树右视图**用层序遍历取每层最后一个节点，或 DFS 按层记录第一个访问到的右侧节点。

**static 的用途**：修饰局部变量（生命周期延长到程序结束）、修饰全局变量/函数（内部链接，限制在本编译单元）、修饰类成员（属于类而非对象）、C++11 起还能用于类内静态断言等场景。

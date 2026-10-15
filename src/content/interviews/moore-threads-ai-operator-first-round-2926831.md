---
title: "摩尔线程 AI 算子一面：GEMM 分块与手撕 kernel"
company: "摩尔线程"
position: "AI 算子库及高性能计算工程师"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/8f03623a522e4c75a6391f9d3f721c7f
tags: ["摩尔线程","AI算子","高性能计算","GEMM","CUDA","CUTLASS","GPU性能优化"]
summary: "摩尔线程 AI 算子库及高性能计算工程师一面：一小时、一位面试官、含手撕。开场自我介绍后是近四十分钟的项目拷打，随后深入 CPU 侧的 AVX-512 与寄存器分块、多核矩阵乘的归约设计、GPU GEMM 优化与 CUTLASS、反汇编与寄存器用量、ncu 性能分析，最后要求共享屏幕现场写 GPU kernel（二维均值滤波，未写成改考 TopK）。"
---

### 《面试题目》

1. 先做一个自我介绍。
2. 如果数据类型从 double 换成 float、FP16 甚至 FP8，最优的分块会是怎么样的？
3. 矩阵乘为什么一定要把 C 放到寄存器里面？有没有试过不把 C 放到寄存器里面？
4. 多核矩阵乘最后还要不要做一个最终的 reduce？还是各核各算 C 的一部分、核间不需要再合并？
5. 能不能在一个核里把 C 的某一小块全部做完，直接存一个结果到内存里？
6. 这样做会有什么问题？
7. 你应该知道经典的 GEMM 吧？它应该有哪些优化的点、优化的方法？
8. 你有去看过 CUTLASS 的代码或者相关教程吗？
9. 你做向量化的访存优化时，有没有看过编译后反编译出来的情况，有没有真的用到向量化访存的指令？
10. 你知道在 CUDA 和 HIP 这两个平台上怎么去看某一个内核的寄存器用量吗？
11. ncu 你用过、做过哪些事情？基于这些量，你有做过一些尝试的修正和调整吗？
12. 你有去开源的社区里看过一些经典的优化算法吗？有没有学习过访存吞吐、峰值浮点计算利用率、occupancy 这些量的分析，然后运用到算法里来？
13. 手撕：共享屏幕写一个 GPU kernel——二维均值滤波。
14. 手撕：没写出来后，面试官改题写一个 TopK。

### 《参考解析》

**精度变化如何影响最优分块，要从「寄存器预算」推。** 分块大小（thread tile，比如每个线程算 8×8 个 C 元素）本质上受寄存器文件限制：累加器数量 = TM × TN，如果累加用 FP32，每个元素占 1 个寄存器，8×8 就是 64 个寄存器，再加上 A/B 的预取片段与地址计算，很容易越过每个线程 255 个寄存器的上限，超了就 spill 到 local memory，性能直接崩。所以当数据类型从 double 降到 float、FP16、FP8 时，同样一块 shared memory 能装下更多元素，A/B 片段的寄存器占用也变小（FP16 两个元素打包进一个寄存器），于是可以**加大 thread tile 和 block tile、增加流水级数**，让计算访存比（arithmetic intensity）更高。但有两个约束不能忽略：累加器通常仍保留 FP32 精度（FP16 累加会掉精度，FP8 更是必须配 FP32 累加），所以累加器寄存器数并不会随输入精度下降；以及 FP8 需要 scaling 与 tensor core 的特定指令形状支持，分块还得对齐硬件要求的 K 维对齐（比如 16 或 32 的倍数）。结论式回答：输入精度下降给的是「更小的数据搬运量与更高的 shared memory 复用率」，分块要往大做，但上限仍由累加器寄存器数和硬件指令形状决定，最终要通过 ncu 的寄存器用量与 occupancy 实测校准。

**为什么把 C 放在寄存器里——这是 microkernel 的核心。** 矩阵乘的优化目标是把访存次数摊薄：外层把 A、B 的 tile 搬到 shared memory，内层每个线程用寄存器阻塞（register blocking）反复复用寄存器里的 A 片段与 B 片段，只做 FMA 累加，C 的累加结果一直驻留在寄存器中，直到 K 循环结束才写回。如果 C 不放寄存器（比如放在 shared memory 或每次从 global 读回 partial sum），K 循环里每一次迭代都要读写 shared memory 或 global，访存带宽立刻成为瓶颈，shared memory 的 bank conflict 与延迟也会暴露出来。答题时可以说「试过把 C 放在 shared memory」的版本，并给出观测结果——用 ncu 看 Memory Throughput 占比飙升、SM 的计算吞吐上不去，正是 roofline 上从 compute bound 滑向 memory bound 的表现。要一并讲清代价：寄存器是稀缺资源，C 占得越多，能开的线程块越少、occupancy 越低，所以 tile 大小是「每线程工作量」与「并行度」之间的权衡。

**多核（多线程块）GEMM 要不要最终 reduce，取决于按哪个维度切分。** 如果按输出矩阵的 M、N 二维切块，每个 block 只负责 C 的一个子块，块与块之间没有重叠，各算各的、直接写回 global 即可，**不需要任何归约**。只有当 M、N 维度本身太小、并行度不够（GPU 上 SM 空转）时，才会沿 K 维再切（split-K）：此时每个 block 算出的是完整 C 的一部分和，必须做一次跨 block 的加法归约。split-K 的三种实现与代价：一是用 atomicAdd 直接累加到 global，实现简单但浮点加法非确定性（每次运行结果可能有微小差异），而且原子冲突会拖慢写入；二是在 workspace 里按 split 存多份部分和，再用一个轻量的 reduce kernel 合并，结果确定、可控但多一次 kernel 与显存读写；三是用信号量加「最后一个完成的 block 负责归约」的 serial split-K 技巧，省掉第二次启动开销但实现复杂。选择依据是问题形状：K 特别大、M/N 小（比如大 batch 的窄矩阵）时 split-K 收益明显；常规大矩阵乘不该用。回答时把「不需要 reduce」与「split-K 才需要」两种情形分开说，并说明原子加的确定性代价，就是这一题的完整答案。

**「一个核里把 C 的某一小块全部做完、直接写内存」的问题在哪。** 单看这句话本身并不错——标准 microkernel 就是「一个线程算完自己的 C 子块后一次性写回」。面试官追问的是「不切 K、一个 block 独占整条 K 维」的极端做法。这样做会有三个问题：并行度不足，可用的 block 数只剩 M/TM × N/TN，SM 填不满、延迟藏不住；寄存器与 shared memory 压力集中在单个 block 上，occupancy 被压到很低，访存延迟无法靠多 warp 切换掩盖；K 很长时单个 block 串行跑完整条链，缺少流水线交叠，吞吐上不去。更稳的表述是：「切 K 不是必须，但当一个 block 的 K 循环太长导致并行度不足时，用 split-K 换并行度、再付一次归约成本」，也就是把取舍讲清楚，而不是给出绝对答案。

**GEMM 的优化点可以按内存层次逐层说。** 最高层：block tile 大小与形状（要能被 SM 数与矩阵形状整除，避免尾部浪费）、persistent kernel 与 stream-K 调度减少启动开销。中间层：shared memory 里的双缓冲与多级流水（`cp.async` 异步拷贝让搬运与计算重叠）、消除 bank conflict（padding 或 swizzle 布局）、A/B 的读取顺序优化（转置 B 让内层访问连续）。指令层：用 128 位向量化 load、用 tensor core 的 mma/wmma 指令（注意 fragment 布局与 K 维对齐）、累加用 FP32 而输入用 FP16/BF16/FP8 的混合精度策略。访存层：global 访问要合并（coalesced）、用 `__restrict__` 与对齐提示帮助编译器、必要时用 L2 的 swizzle 减少冲突。算法层：分块矩阵乘与分治、Strassen 这类减少乘法次数的变体（工程上少用）、以及把 epilogue（偏置、激活）融进 kernel 避免多一次读写。CUTLASS 的问题不必背 API，说清它的抽象层次即可：用 TileDescription 描述 threadblock/warp/instruction 三级 tiling，用 Policy 选择流水与指令，用 Iterator 与 Epilogue 分离数据加载与结果处理，核心思想与手写 microkernel 完全一致，只是把可组合的部分参数化了。

**反汇编、寄存器用量与 ncu 是「你怎么验证优化」的证据链。** 看向量化用 `cuobjdump -sass` 或 `nvdisasm` 直接读 SASS，看有没有 `LDG.E.128`、`FFMA` 这类指令；`ptxas -v`（或 `nvcc --ptxas-options=-v`）给出每个 kernel 的寄存器数、shared memory 与 spill 情况；`cuobjdump -res-usage` 与 CUDA 运行时的 `cudaFuncGetAttributes` 能在不用重编译的情况下查资源占用。HIP/AMD 侧对应的是 `hipcc --save-temps` 看编译产物、`roc-obj` 或 `llvm-objdump` 反汇编、`rocprof`/`omniperf` 采集指标，关键资源是 VGPR/SGPR（向量与标量寄存器）与 LDS（shared memory）用量，occupancy 由 VGPR 数与 threads per block 共同决定。ncu 的用法按「先看瓶颈在哪、再看细节」组织：SpeedOfLight 看计算与访存吞吐各自打满了多少，据此判断是 compute bound 还是 memory bound；Memory Workload Analysis 看 L1/L2/DRAM 的命中率与事务数，定位是不是访问不合并或 bank conflict；Scheduler Statistics 与 Warp State 看 stall 原因（是等访存、等 barrier 还是指令发射受限）；Occupancy 看理论值与实际占用；Roofline 把实测点放到理论上下界之间比较。做完分析要给闭环：比如发现 shared memory bank conflict 高，就改 swizzle 布局，再测一次看指标是否改善；发现寄存器 spill，就缩小 tile 或调 `maxrregcount`——这正是面试官追问「基于这些量做过哪些修正和调整」想听到的东西。

**手撕 kernel 的两个题：二维均值滤波与 TopK。** 均值滤波的标准解法是 shared memory tiling 加 halo：每个 block 负责输出 TILE×TILE 一块，先把 (TILE+2)×(TILE+2) 的输入（含一圈边界）搬进 shared memory，边界用 clamp（复制边缘像素）处理，`__syncthreads()` 后每个线程对中心像元做邻域求和取平均；如果核是 5×5 或更大，先做水平方向再对中间结果做垂直方向的可分离分解，复杂度从 O(k²) 降到 O(2k)。写出基础版后主动补优化点：用 `float4` 向量化读写、让 shared memory 的行宽加 padding 避免 bank conflict、把常量核放进 constant memory、以及用 `__restrict__` 帮助编译器。TopK 要先问清 K 的量级与数据规模：K 很小（比如每行取前 8 个）用「每线程维护一个小根堆或有序数组、块内用 `__shfl` 归并、块间再归并」；K 较大（比如取前 10%）用分桶加按位选择——先统计直方图，从高位到低位确定阈值所在桶，再对候选做筛选，复杂度 O(n) 且不依赖排序；K 接近 n 就直接排序更简单。真正的加分点不是写完，而是说清选择依据、边界处理（K 大于元素数、含 NaN）、以及为什么没有用 `cub::DeviceRadixSort` 这类现成组件。另外这场的时间分配（近四十分钟项目拷打 + 一个小时总长）也提示：项目的深度比刷题更决定结果，手撕写不出来不等于直接出局，但讲不清自己的项目基本必挂。

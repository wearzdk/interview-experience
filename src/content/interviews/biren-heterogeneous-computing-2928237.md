---
title: "壁仞高性能异构工程师一面：CUDA、C++ 与两道手撕"
company: "壁仞科技"
position: "高性能异构工程师"
round: "一面"
date: "2026-10"
result: "等待结果"
source: "牛客网"
tags: ["壁仞科技","高性能计算","CUDA","HIP","C++","异构计算","手撕代码"]
summary: "壁仞高性能异构工程师一面约半小时，覆盖 CUDA/HIP 差异、内存层次、bank conflict、warp divergence、C++ 与并行模型，并现场手写 shared_ptr 和 CUDA reduce。"
---

### 《面试题目》

1. 请用三分钟做一下自我介绍。
2. 学校在哪里？
3. 老家是哪里的？
4. 如果来了，愿意来上海工作吗？
5. 你当时为什么去那个实习？
6. 你是主动投递我们这个岗位的吗？
7. 你了解我们这个岗位吗？符合你的意向吗？
8. 你做过 CUDA 和 HIP 的开发，两者有什么区别？
9. CUDA 的内存层次结构有哪些？
10. 什么是 bank conflict？
11. 什么是 warp divergence？
12. CUDA 里有哪些同步机制？什么场景下需要使用？
13. 什么是智能指针？有哪些应用场景？
14. 模板元编程是什么概念？有哪些应用场景？技术原理是什么？有什么优缺点？
15. C++ 现在是什么版本？C++11/14/17 分别有哪些新特性？
16. C++ 程序的编译流程和原理是什么？
17. 静态链接和动态链接有什么区别？分别有什么好处？
18. CMake 构建工具用过吗？
19. OpenMP 多线程并行和 MPI 分布式通信有什么关系？各自的应用领域是什么？
20. 实现一个 shared_ptr。
21. 写一个 CUDA reduce。

### 《参考解析》

**CUDA 和 HIP 的编程模型高度相似，差别在生态和硬件细节。** 两者都用 host/device 分工、kernel 启动配置、global/shared 内存层次和类似的同步语义，HIP 的价值是让同一套代码经过工具链迁移到 AMD GPU。回答时要补差异：warp 与 wavefront 的线程分组宽度不同（NVIDIA 通常是 32，AMD 常见 64），这会影响分支聚合和 reduction 的写法；CUDA 的生态、库和 profiler 更成熟，HIP 更强调可移植性。bank conflict 是 shared memory 多个线程同时访问同一 bank 的不同地址导致串行化，常用 padding、改变访问步长、让相邻线程访问相邻地址来消除。warp divergence 是同一 warp 内线程走不同分支，硬件只能串行执行各分支路径，优化方向是让分支条件尽量按 warp 对齐，或把分歧路径拆成不同 kernel。

**同步机制要按作用域回答。** `__syncthreads()` 是 block 内屏障，常放在 shared memory 写入后、读取前；warp 级同步可以用 `__syncwarp()`；跨 block 不能靠 `__syncthreads()`，要么拆 kernel，要么用 cooperative groups 的 grid sync，要么用原子操作/全局标志做更粗的同步。同步不是越多越好，过度同步会掩盖并行度，还会把本来可以重叠的访存和计算串起来。

**C++ 部分考的是底层理解。** 智能指针按所有权分 `unique_ptr`、`shared_ptr`、`weak_ptr`，核心是 RAII 和引用计数；模板元编程是在编译期用模板参数和特化做计算与类型选择，优点是零运行时开销、类型安全，缺点是编译时间、错误信息可读性和代码复杂度。编译流程按预处理、编译、汇编、链接四步讲，静态链接把库代码复制进可执行文件、部署简单但体积大，动态链接在运行时加载共享库、便于复用和升级但会有依赖和版本问题。CMake 至少要说清 `target_link_libraries`、`find_package`、`target_include_directories` 和 out-of-source build。

**手写 shared_ptr 要写控制块，不是只包一个指针。** 控制块里放引用计数、弱引用计数、原始指针和删除器；拷贝构造增加强引用，移动构造转移所有权并把源置空，析构时强引用减到零调用删除器，弱引用减到零释放控制块。还要考虑自定义删除器、`make_shared` 的一次分配优化、线程安全（引用计数用原子操作，但被管理对象本身不因此线程安全）。CUDA reduce 则先讲清思路：每个 block 把数据分段读到 shared memory，做树形归约，注意处理非 2 的幂、边界越界和 bank conflict；block 间再用原子加或第二段 kernel 汇总。能手写 warp shuffle 版本更加分，但要先保证正确性。

**OpenMP 与 MPI 是共享内存和分布式内存两条线。** OpenMP 用编译指示开线程，适合单机多核的循环并行和任务并行，数据默认共享，难点在数据竞争和调度；MPI 用进程和显式消息传递，适合多机集群，难点在通信、同步和数据切分。实际高性能程序常把两者结合：节点间 MPI、节点内 OpenMP，再叠加 GPU kernel。面试官问“关系和场景”，就是想确认你知道它们不是替代关系。

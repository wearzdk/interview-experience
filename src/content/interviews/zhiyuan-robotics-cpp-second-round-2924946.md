---
title: "智元机器人秋招二面凉经：C++ 基础、IO 模型与内存池手撕"
company: 智元机器人
position: 机器人 C++ 开发
round: 二面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/35f007b00ae24b438cd69e141c56cbf7
tags: ["C++","多线程","IO模型","Linux","内存池","手撕代码"]
summary: "智元机器人秋招二面凉经（面试时间 2026.10.10，岗位为机器人 C++ 开发，总时长 45 分钟）：先问实习项目与难点，再问 vector 与 unordered_map 的区别、多线程、进程与线程的区别、IO 模型、Linux 排查问题常用指令、gdb 指令，最后手撕内存池与多线程未写出。"
---

### 《面试题目》

1. 自我介绍
2. 实习项目和难点
3. C++ 的 vector 和 unordered_map 有什么区别？
4. 多线程相关问题
5. 进程和线程的区别？
6. IO 模型有哪些？
7. Linux 排查问题常用的指令有哪些？
8. gdb 常用指令有哪些？
9. 手撕：实现内存池和多线程

### 《参考解析》

**vector 和 unordered_map 不是一类容器，比较要落到「访问模式 + 内存布局 + 复杂度」。** vector 是连续内存的动态数组，支持随机访问 O(1)、尾部插入摊还 O(1)、中间插入删除 O(n)；cache 友好（顺序访问命中率高），但扩容时要重新分配并搬移全部元素（所以 `reserve` 很重要），且元素地址会失效（迭代器失效）。unordered_map 是哈希表，平均查找/插入 O(1)、最坏 O(n)（大量冲突时），内存不连续、每个节点有额外开销（指针 + 哈希 + 桶数组），cache 不友好，迭代顺序不保证，并且哈希函数与负载因子决定性能。选型判据：需要按索引遍历、批量顺序处理用 vector；需要按 key 快速查找用 unordered_map；要保证顺序遍历用 map（红黑树，O(log n)），要稳定内存布局和低延迟（如游戏/音视频）常用开放寻址哈希或自己造表。

**进程与线程的区别，答题要点是「资源单位 vs 调度单位」。** 进程有独立地址空间、文件描述符表、信号处理等资源，线程共享所在进程的地址空间与资源，只独享栈、寄存器和线程局部存储；创建销毁与上下文切换的成本上，进程远高于线程（要切页表、刷 TLB），同进程内线程切换轻；通信方式：进程间用管道、消息队列、共享内存、信号、socket，线程间直接读写共享变量（因此必须配同步原语）。补充一定要主动说的：多线程共享内存方便但带来竞态与死锁风险，多进程隔离性好但通信与内存开销更大；现代高并发服务常见组合是「多进程（多实例）+ 每进程内多线程/协程」。

**IO 模型五个阶段：阻塞、非阻塞、IO 多路复用、信号驱动、异步 IO。** 前四者本质上都是**同步 IO**（数据从内核拷贝到用户态这一步仍要自己等），只有真正的 AIO 是「内核拷贝完成后再通知你」。IO 多路复用里 select 有 1024 的 fd 上限且每次都要遍历和拷贝 fd 集合；poll 去掉了上限但仍是线性遍历；epoll 用红黑树管理 fd + 就绪链表回调，只返回就绪的 fd，适合大量连接中少量活跃的场景（LT 水平触发可以不处理完、ET 边缘触发必须一次读完，通常配非阻塞 + 循环读）。工程上再叠加 Reactor/Proactor 模式与线程池：Reactor 负责事件分发，业务处理丢给线程池，避免在 IO 线程里做耗时逻辑。

**Linux 排查与 gdb 的常用清单要能脱口而出。** 定位 CPU 高：`top`/`htop` 看进程，`top -H -p <pid>` 找线程，把线程号转十六进制后 `jstack`/`gdb` 看栈；内存：`free -h`、`vmstat`、`pmap`、`smem`、`cat /proc/<pid>/status`；IO：`iostat -x`、`iotop`、`pidstat -d`；网络：`ss -lntp`（比 netstat 快）、`tcpdump`、`ping`/`mtr`/`traceroute`；磁盘：`df -h`、`du -sh`、`lsblk`；日志与文件：`tail -f`、`grep`、`awk`、`lsof`。gdb 常用：`run`/`attach <pid>`、`break`（文件:行号或函数名）、`bt`/`bt full`、`frame`、`info locals`/`info args`、`print`/`p *ptr`、`x/16xb` 看内存、`watch` 设观察点、`next`/`step`/`continue`/`finish`、`thread apply all bt` 看所有线程栈、`set print pretty`，配合 core dump（`ulimit -c unlimited` + `gdb ./bin core`）分析崩溃现场。面试时最好带一个真实案例（比如某次线上 CPU 100% 是死循环还是锁竞争），比罗列命令有效。

**手撕内存池，标准答案是「预分配大块 + 空闲链表」的定长分配器。** 思路：启动时一次性 `malloc` 一大块内存并切成固定大小的 slot（或按 size class 分级），用一个空闲链表串起来；`allocate` 从链表头摘一个节点返回，`deallocate` 把它塞回链表头，O(1) 且无系统调用；要处理的问题包括：对齐（按 `alignof(max_align_t)` 对齐）、多线程安全（每线程一个池或用无锁栈 CAS）、以及内存不足时的扩展策略。用 `placement new` + 显式析构把「分配」和「构造」分开是 C++ 的标准做法。如果面试官要的是 STL 兼容的 allocator，就要实现 `allocate`/`deallocate`/`rebind` 并注意类型化分配（不同 sizeof 走不同 size class）。**多线程内存池**的核心取舍是「线程本地池（无锁但内存碎片化、回收复杂）vs 全局池加锁（简单但竞争）」，折中方案是 TLS 缓存 + 全局池两级，或 per-thread free list 定期归还；实现时至少要说清 ABA 问题、false sharing（`alignas(64)` 填充）与释放跨线程归还的处理。

---
title: 地平线嵌入式二面：CAN 驱动、DMA 一致性与 SocketCAN
company: 地平线
position: 嵌入式软件工程师
round: 二面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/945100814861815808
tags: ["嵌入式","CAN驱动","DMA","CMA","SocketCAN","Linux内核"]
summary: "地平线嵌入式二面：全部围绕 CAN 驱动展开——Kernel Panic 怎么定位、probe 与设备匹配、中断上下半部、DMA 的 Cache 一致性、大块连续内存与 CMA、SocketCAN 收发与过滤、Bus-Off 恢复，最后补了一道 fork 与写时复制。"
---

### 《面试题目》

1. CAN 驱动运行中突然出现 Kernel Panic，你通常怎么定位？
2. CAN 驱动中的 probe 函数主要负责什么？设备和驱动怎么匹配？
3. CAN 中断处理为什么分上半部和下半部？中断里为什么不能使用 mutex？
4. CAN 驱动使用 DMA 时要注意哪些问题？Cache 一致性怎么处理？
5. 给 CAN DMA 申请大块连续内存，可以用哪些方式？CMA 是什么？
6. SocketCAN 中用户空间怎么收发 CAN 报文？CAN 过滤器怎么设置？
7. CAN 总线错误处理有哪些？什么是 Bus-Off？怎么恢复？
8. fork 创建子进程时，地址空间怎么处理？什么是写时复制？

### 《参考解析》

**Kernel Panic 的定位路径**：先看串口/`dmesg` 里的 panic 原文——是空指针解引用、Oops 还是 BUG_ON，调用栈（`Call Trace`）基本就指向了出问题的函数；有 `CONFIG_KALLSYMS` 能直接打出符号名。接着按栈回溯到代码，检查并发与生命周期问题：设备是否已 remove 但中断/定时器还在跑、DMA 缓冲区是否已被释放、锁是否在中断上下文里用错。常用工具是 `CONFIG_DEBUG_ATOMIC_SLEEP`（抓原子上下文睡眠）、`CONFIG_DEBUG_SPINLOCK`、KASAN（越界与 use-after-free）、以及 kdump/kexec 在崩溃时保存 vmcore 事后用 crash 分析。定位顺序是"先确认崩在哪一类问题，再查最近改动与并发路径"，而不是一上来就翻代码。

**probe 与设备匹配**：probe 是驱动在匹配到设备后被内核调用的入口，负责：确认硬件存在与版本、申请 IO 内存/中断/DMA/时钟/复位等资源、初始化硬件寄存器、注册 netdev 或字符设备、初始化队列与工作队列、最后使能中断并对外暴露设备。匹配依据是总线类型：设备树平台设备靠 `compatible` 字符串与 `of_match_table` 匹配，PCI 靠 vendor/device ID，I2C/SPI 靠地址与 id table。probe 里任何一步失败都要走反向清理（goto 标签链或 devm_ 系列自动释放），否则 remove 或二次 probe 会泄漏资源。常见坑是把耗时初始化放在 probe 里阻塞启动，正确做法是 probe 里只做必要初始化，重活丢到 workqueue。

**中断上下半部**：硬中断上下文要求极短、不能睡眠，因为会屏蔽同优先级中断、影响系统响应。所以上半部只做"必须立刻做"的事——读状态寄存器、清中断标志、把数据拷到缓冲区、调度下半部；耗时的协议解析、报文入队、唤醒用户进程放到 tasklet/工作队列/线程化中断里。中断里不能用 mutex 是因为 mutex 获取失败会睡眠，而中断上下文没有 task_struct 可调度，睡眠会导致 "scheduling while atomic"；同理不能 `copy_to_user`、不能 `kmalloc(GFP_KERNEL)`、不能用可能阻塞的完成量。需要同步时用 spinlock（必要时 `spin_lock_irqsave`）或 `atomic_t`。

**DMA 与 Cache 一致性**：DMA 绕开 CPU 直接读写内存，而 CPU 侧的 cache 不知道内存被改了，会出现两个方向的不一致：设备写了内存但 CPU 读到旧 cache（应先 invalidate 再读），CPU 写了内存但还在 cache 里没落内存、设备读到旧数据（应先 clean/flush 再启动 DMA）。Linux 的做法是用 DMA API 而不是直接操作 cache：`dma_map_single`/`dma_map_sg` 建立映射并处理一致性，传输前后用 `dma_sync_single_for_cpu/for_device` 同步所有权；缓冲区要用 `dma_alloc_coherent`（一致性内存，通常不经过 cache）或流式映射。注意别同时用 `virt_to_phys` 和 DMA API 混着来，IOMMU 存在时物理地址不等于 DMA 地址。

**连续大块内存与 CMA**：常见方式有 `kmalloc`（上限小、依赖伙伴系统，大块容易失败）、`vmalloc`（虚拟连续但物理不连续，不能直接给 DMA）、`alloc_pages` 高阶分配（开机久了碎片化严重）、启动时 `mem=` 预留、以及 CMA（Contiguous Memory Allocator）。CMA 是在启动时划出一块连续物理内存区域，平时可以给可移动页使用，驱动申请时再迁移出去腾出连续空间，专门解决"大块连续内存 + 不想永久浪费"的矛盾，摄像头、显示、网络 DMA 场景很常见。设备树里用 `reserved-memory` + `shared-dma-pool` 声明，驱动侧用 `dma_alloc_coherent` 配合 `linux,cma` 属性即可。

**SocketCAN 收发与过滤**：用户空间把 CAN 当网络设备用，创建 `socket(PF_CAN, SOCK_RAW, CAN_RAW)`，`ioctl(SIOCGIFINDEX)` 拿接口索引，`bind` 到 `can_ifindex`，然后 `write`/`send` 发标准帧、`read`/`recv` 收帧，结构体是 `struct can_frame`（can_id + len + data），CAN FD 用 `canfd_frame`。过滤器通过 `setsockopt(SOL_CAN_RAW, CAN_RAW_FILTER, ...)` 设置一组 `can_filter{can_id, can_mask}`，内核在软中断里就完成匹配，避免把无关报文全送到用户态；也可以设 `CAN_RAW_ERR_FILTER` 只收错误帧、`CAN_RAW_LOOPBACK` 控制本地回环。

**总线错误与 Bus-Off**：CAN 控制器维护 TEC/REC 两个错误计数器，错误状态分 error-active、error-passive、bus-off。TEC 超过 255 进入 Bus-Off，控制器自动脱离总线、停止收发，常见原因是接线/终端电阻问题、波特率不匹配、无人应答（ACK 错）、或持续受到干扰。恢复方式有两种：硬件自动恢复（`CAN_CTRLMODE_AUTO_RESTART` 或驱动里检测到 bus-off 后延时重启控制器），或用户空间手动 `ip link set can0 down/up`（对应驱动里的 restart）。工程上要做的是把 bus-off 事件上报（`CAN_RAW_ERR_FILTER` 或 netlink），并在恢复后重置软件队列，避免把断线期间的数据当成有效帧。

**fork 与写时复制**：fork 创建子进程时会复制父进程的 task_struct、文件描述符表、信号处理等，但**不复制物理内存页**——父子共享同一批只读页，页表项标记为只读并增加引用计数；任何一方写入触发缺页异常，内核才复制那一页并改成可写，这就是写时复制（COW）。好处是 fork 快、内存省，exec 之后旧地址空间整体丢弃，避免了无意义的复制。要注意的是引用计数的管理（page refcount）、fork 失败时的回滚，以及 `vfork`/`clone` 的差异：vfork 与父进程共享地址空间且父进程会被挂起，clone 可以按标志选择共享哪些资源（线程就是共享地址空间的 clone）。

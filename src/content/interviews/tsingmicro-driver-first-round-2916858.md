---
title: "清微智能驱动工程师一面：设备树、调度源码与中断子系统连环追问"
company: "清微智能"
position: "驱动工程师"
round: "一面"
date: '2026-09'
source: 牛客网
tags: ["驱动开发","Linux内核","设备树","进程调度","中断子系统"]
summary: "清微智能驱动工程师一面约 1 小时（9.24），全程要求讲源码：从设备树的展开与加载时机、进程 A 切到进程 B 的细节、根页表寄存器，一路追问到自旋锁差异、irq domain、GIC 中断类型与 4MB 场景下 vmalloc 和 kmalloc 的区别，面试官习惯围绕一个问题挖到底。"
---

### 《面试题目》

1. 设备树的各个节点是什么时候被使用的？
2. 设备树的信息是怎么展开成树状结构的？
3. 设备树节点是怎么加载到内存的？
4. 进程调度的具体过程是怎样的？
5. 进程 A 切换到进程 B，结合源码讲一讲。
6. 根页表保存在 MMU 的哪个寄存器里？
7. spin lock 和 spin irq lock 有什么区别？
8. 看过中断驱动子系统的源码吗？介绍一下。
9. irq domain 为什么需要它？
10. GIC 有几种中断？
11. 中断能嵌套吗？
12. vmalloc 和 kmalloc 的区别是什么？
13. 申请 4MB 内存，vmalloc 和 kmalloc 有什么区别？
14. 讲讲 vmalloc 的源码，它具体做了什么？
15. kmalloc 和 vmalloc 申请的虚拟地址有什么不同？
16. 围绕项目提了很多问题。
17. AI Infra 有了解吗？
18. 平时自己使用 AI 有什么心得？

### 《参考解析》

**设备树：结构在启动早期就建好，属性按需被消费**

dtb 由 bootloader 放进内存并把地址传给内核。最早的 `early_init_dt_scan` 只扫平坦结构里启动必需的部分：`/chosen`（bootargs、initrd 地址）、`/memory`（可用物理内存）、`/reserved-memory`。随后 `unflatten_device_tree` 把平坦的 FDT 递归展开成 `struct device_node` 组成的树（parent/child/sibling 指针加属性链表），这份结构常驻内存。真正"被使用"发生在匹配阶段：`of_platform_populate` 把节点转成 `platform_device`，驱动注册时用 `of_match_table` 里的 compatible 与节点比对，probe 阶段才通过 `of_property_read_*`、`of_iomap`、`of_irq_get` 去读属性。所以回答"什么时候被使用"要分两层：核心代码早期消费 chosen/memory/cpus/interrupt-controller，驱动只消费自己 compatible 的那个节点。常被追问的还有 `__init` 段的内存回收与 `of_node_put` 的引用计数。

**进程切换：从 `__schedule` 到一段汇编**

`__schedule()` 关抢占、取运行队列锁，`pick_next_task` 选出下一个任务（CFS 取 vruntime 最小的那个红黑树节点，实时类按优先级位图，较新内核是 EEVDF），然后 `context_switch()` 干两件事：`switch_mm()` 切地址空间（换页表基址、更新 ASID/PCID、按需刷 TLB），`switch_to()` 切执行流。x86-64 的 `__switch_to_asm` 只保存 callee-saved 寄存器（rbp、rbx、r12–r15），把当前 rsp 存进 `prev->thread.sp`、从 `next->thread.sp` 恢复，最后 `ret` 直接跳到 next 上次被切出时的返回地址——也就是说在 C 层面看，进程切换就是一次函数返回，调用者保存的寄存器早已由编译器按 ABI 溢出到各自栈上，不需要手工保存。ARM64 对应 `cpu_switch_to`，保存 x19–x28、fp、sp 以及 TLS 寄存器。切回来之后 `finish_task_switch` 做内存屏障、释放前一个任务的 rq 锁、处理 mm 引用计数。面试官爱问"哪些寄存器必须存"，答案正是"不是全部"。

**根页表放在哪里：CR3 与 TTBR**

x86-64 把根页表物理地址放在 CR3，切换进程就是写 CR3；PCID 使能后低 12 位携带 PCID（由 CR4.PCIDE 控制），可以避免每次都刷掉整个 TLB。ARM64 是 TTBR0_EL1（用户态页表）和 TTBR1_EL1（内核态页表），配套还有 TCR_EL1（页粒度、地址范围、ASID 宽度）、MAIR_EL1（内存属性）与 SCTLR_EL1（M 位使能 MMU）。内核直接映射通常放 TTBR1，用户进程页表放 TTBR0，切进程只改 TTBR0 与 ASID，内核空间不用跟着切。要补一句 TLB 不是自动一致的：改完页表必须按范围执行 `invlpg` / `tlbi`，"什么时候必须刷 TLB"就是这么来的。

**spin_lock 与 spin_lock_irqsave：区别在死锁而不是性能**

`spin_lock` 只保证 SMP 下的互斥，抢占内核里顺带关抢占；`spin_lock_irqsave` 在此之上关本地中断并把中断状态存进 flags（配 `spin_unlock_irqrestore` 恢复）。根源是死锁：同一个 CPU 上持有锁的临界区被中断打断，而中断处理程序又去取同一把锁，就会自旋到死——单核同样成立。所以规则是"只要锁可能被中断上下文或软中断取用，就必须关中断或至少关下半部（`spin_lock_bh`）"。延伸考点：`spin_lock_irq` 与 `spin_lock_irqsave` 的差别在于后者保存并恢复原中断状态，不知道自己处在什么上下文时必须用带 save 的版本；自旋锁临界区里不能睡眠，不能调用可能睡眠的函数，也不能直接与用户态拷贝数据。

**irq domain 与中断子系统的分层**

`irq domain` 解决的是硬件中断号（hwirq）与 Linux 虚拟中断号（virq）解耦的问题。现代 SoC 的中断控制器会级联（GIC → GPIO 控制器 → 具体设备），hwirq 只是控制器内部的局部编号，直接当全局号用必然冲突。irq domain 提供 hwirq→virq 的映射（线性映射、Radix 树映射、无映射直通），设备树里的 `interrupt-parent` / `interrupts` 在解析时通过 `irq_of_parse_and_map` 走 domain 拿到 virq，`irq_domain_ops` 的 xlate/alloc/map 三个回调是常见追问点。`request_irq` 拿到的、`/proc/interrupts` 里看到的就是这个 virq。更上一层还有 `irq_desc`、`irq_chip`、上下半部（softirq/tasklet/threaded IRQ/workqueue）的分工，能把这条链路串起来讲就已经超过大多数候选人。

**GIC 的中断类型与"中断能不能嵌套"**

GIC 把中断分三类：SGI（软件生成中断，核间通信，ID 0–15，每个 CPU 私有）、PPI（私有外设中断，ID 16–31，每核一份，本地定时器属于这类）、SPI（共享外设中断，ID 32 以上，可路由到指定 CPU）；GICv3/v4 另有 LPI，基于 ITS 的 MSI 型中断，主要面向 PCIe 设备。至于嵌套，要分层回答：硬中断处理程序在本地中断关闭的状态下执行，同一 CPU 上同级中断不会重入，所以没有传统意义的中断嵌套；但中断处理分上下半部，下半部（softirq、tasklet、workqueue、threaded IRQ）在开中断的环境里运行，可以被新的硬中断打断，也可以睡眠。准确说法是"硬中断不嵌套，上下半部之间会嵌套"。

**vmalloc 与 kmalloc：4MB 正好卡在边界上**

kmalloc 从直接映射区分配物理连续内存，虚拟地址等于物理地址加偏移，访问不需要额外建页表，性能最好；代价是受伙伴系统碎片约束，大块连续物理内存越来越难拿。它的上限是 `KMALLOC_MAX_SIZE`（由 `MAX_ORDER` 决定，常见配置下就是 4MB），超过 `KMALLOC_MAX_CACHE_SIZE` 后不再走 slab、直接向伙伴系统要页。vmalloc 只保证虚拟地址连续，物理页可以零散，每分配一次都要在 vmalloc 区建立页表项并刷 TLB，还要加锁，释放时同样有开销。所以"申请 4MB"这个问法考的就是边界：kmalloc 需要 order-10 的连续页，碎片一重就可能失败，通常直接选 vmalloc（或者 `alloc_pages` 加 `vmap`，先想清楚是否真的需要虚拟连续）。地址形态上的差别还体现在 API：kmalloc 的地址可以直接 `virt_to_phys` 换算，vmalloc 的地址必须 `vmalloc_to_page` 走页表，`is_vmalloc_addr()` 是常用的分支判断；DMA 场景要注意 vmalloc 出来的内存物理不连续，不能直接交给设备。

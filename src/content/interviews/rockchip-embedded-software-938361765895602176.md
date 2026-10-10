---
title: 瑞芯微嵌入式驱动岗面经（凉经）
company: 瑞芯微
position: 嵌入式软件
round: 多轮合集
date: '2026-10'
result: 凉经
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/938361765895602176
tags: ["嵌入式","Linux驱动","设备树","中断","DMA","自旋锁"]
summary: "瑞芯微 SoC 原厂驱动岗两轮技术面：一面考 volatile、static、const 与指针、进程线程、用户态与内核态、系统调用路径、内存对齐、大小端、静态动态库、Makefile 与 I2C；二面深入字符设备驱动注册与 open 路径、设备驱动模型匹配与 of_match、platform 与 probe、设备树、中断上下半部与 workqueue、并发保护与自旋锁、copy_to_user、ioremap 和 DMA。"
---

### 《面试题目》

**一面（约 50 分钟）**

1. volatile 是干嘛的？驱动里读寄存器为什么必须加？
2. static 修饰局部变量、全局变量、函数分别是什么效果？
3. const 和指针那几种写法分别是什么意思？
4. 进程和线程的区别？各自的通信方式有哪些？
5. 用户态和内核态的区别？怎么从用户态陷进内核态？
6. 一次 open/read 系统调用，从应用到内核大概走了哪些路？
7. 内存对齐规则是什么？（给了个结构体让我算大小）
8. 大端小端怎么判断？什么时候必须关心？
9. 静态库和动态库的区别？动态库运行时怎么找到的？
10. Makefile 里伪目标、自动变量大概讲讲。
11. I2C 通信过程、几根线？上拉电阻为什么要有？
12. 你在 Linux 下写过驱动吗？简单讲讲字符设备驱动怎么注册的？

**二面（约 60 分钟）**

13. 字符设备驱动完整讲一遍，从 cdev 注册到用户 open 中间内核做了啥？
14. Linux 设备驱动模型里 device、driver、bus 三者什么关系？怎么匹配上的？
15. platform 设备和 platform 驱动怎么绑定的？probe 什么时候被调用？
16. 设备树是干嘛的？它和 platform 驱动怎么对应起来？
17. 驱动里申请中断，中断上半部下半部怎么拆？下半部有哪几种机制？
18. workqueue、tasklet、softirq 区别在哪？分别什么场景用？
19. 并发情况下驱动怎么保护共享资源？自旋锁和信号量在驱动里怎么选？
20. 为什么中断上下文里只能用自旋锁，不能用信号量？
21. copy_to_user 为什么不能直接用 memcpy？中间做了啥？
22. ioremap 是干嘛的？为什么访问寄存器前要先 ioremap？
23. DMA 在驱动里怎么用？一致性 DMA 和流式 DMA 区别是什么？
24. 你了解 V4L2 或者 DRM 这类子系统吗？大概讲讲框架。

### 《参考解析》

**字符设备驱动的注册与 open 路径**。注册链路是：`alloc_chrdev_region` 申请设备号 → `cdev_init` 把 `file_operations` 绑到 `struct cdev` → `cdev_add` 把 cdev 挂进内核的字符设备映射 → 用 `class_create` 与 `device_create` 在 sysfs 下暴露设备节点、交给 udev 创建设备文件。用户态 `open("/dev/xxx")` 进来后，VFS 按路径解析拿到 inode，通过 inode 找到对应的 cdev，再取出 `file_operations`；内核创建 `struct file` 并把 `f_op` 指向该驱动、把 `private_data` 留给驱动用，然后才调用驱动的 `.open` 回调。也就是说 `.open` 不是第一步，它之前已经有路径解析、权限检查、inode 与 cdev 的关联、file 结构初始化。`read/write` 同理：VFS → 驱动的回调 → 用 `copy_to_user/copy_from_user` 完成数据交换。把「设备号 → cdev → inode → file → f_op」这条链讲出来，比只背 `register_chrdev` 有说服力得多。

**设备驱动模型与匹配优先级**。bus 是总线类型（platform、i2c、spi、pci），device 是硬件描述，driver 是驱动实现，三者构成「总线撮合、设备提供资源、驱动提供行为」的关系。设备或驱动任一注册进来时都会触发 bus 的 match 回调：platform 总线先比对 `driver_override`，再用 `of_driver_match_device`（比较设备树节点的 compatible 与驱动的 of_match_table）、`acpi_driver_match_device`，然后比较 `id_table`，最后退回比较 device 与 driver 的 name 字段。优先级大致是设备树/ACPI 匹配优先于 id_table，name 匹配是最后的兜底。匹配成功后调用驱动的 `.probe`，probe 里申请资源（ioremap、中断、时钟、regulator）并把设备注册进对应子系统。所以现代 ARM SoC 上绝大多数是设备树 compatible 匹配，name 匹配只是最老的兜底路径——这正是追问 `of_match` 与 `id_table` 优先级的原因。

**设备树与 platform 驱动**。设备树把「硬件长什么样」从内核代码里搬到独立描述文件：节点描述寄存器基址与长度、中断号、时钟、GPIO、电源等资源，驱动只负责按描述去取。绑定方式是 compatible 字符串——驱动里的 `of_device_id` 表列出它能处理的 compatible 值，内核拿设备树节点的 compatible 去匹配，匹配上就 probe，驱动再用 `platform_get_resource`、`platform_get_irq`、`devm_*` 系列接口取资源。这样同一份驱动能适配多块板子，改硬件只需要改设备树。

**中断上下半部与三种下半部机制**。上半部（硬中断处理函数）跑在中断上下文，必须极短：只做「确认中断、取走关键数据、清标志」，把耗时活儿丢给下半部。下半部有三种：softirq 编译期静态注册、在中断返回或 ksoftirqd 里执行，优先级最高但数量固定、不能睡眠，网络收发这类高频路径用它；tasklet 建在 softirq 之上、可动态注册，同一 tasklet 不会并发执行，但不能睡眠，适合中小量的延迟处理；workqueue 跑在内核线程上下文、可以睡眠和拿互斥锁，适合访问可能睡眠的资源或耗时较长的场景。选择的判据是「能不能睡眠」和「对延迟的要求」；上下半部之间的数据共享必须配对应的锁与内存屏障。

**为什么中断上下文只能用自旋锁**。根本原因是中断上下文没有进程上下文，不能睡眠：信号量在竞争时会把自己挂到等待队列并让出 CPU，而中断处理函数没有可以调度的 `task_struct`，一旦睡眠就无法被唤醒，轻则该 CPU 卡死、重则内核 panic。自旋锁在竞争时只是忙等，不涉及调度，所以在中断上下文里可用。但要注意死锁风险：如果同一把锁在进程上下文和中断上下文都会被拿，进程侧必须用 `spin_lock_irqsave` 关掉本 CPU 中断再拿锁，否则中断在当前 CPU 上抢占并试图拿同一把锁就会自锁。自旋锁的临界区也必须极短（忙等期间别的 CPU 在空转），里面不能调用可能睡眠的函数。选型上：临界区短、可能在中断上下文访问的用自旋锁；可能睡眠、耗时较长、只在进程上下文用的用互斥锁或信号量。

**copy_to_user 与 ioremap**。`copy_to_user` 不能换成 `memcpy` 有三个原因：一是地址空间不同，用户态指针只在该进程的地址空间有效，可能指向被换出或尚未建立映射的页，直接解引用会访问到错误内存甚至崩溃；二是它内部要做访问权限与合法性检查（access_ok）并处理缺页，还有专门的异常表捕获访问失败、返回未拷贝的字节数；三是安全隔离，靠它才能避免内核被用户传入的恶意指针利用。`ioremap` 的作用是把外设寄存器区的物理地址映射到内核虚拟地址空间，让 CPU 能用 load/store 访问；ARM 上还涉及内存属性（Device 类型、禁止缓存与合并），这也是要用 `readl/writel` 而不是直接指针赋值的原因——编译器和 CPU 都不能对设备寄存器做优化、重排或缓存。ioremap 出来的地址必须用 `iounmap` 释放，并严格按寄存器位宽对齐访问。

**DMA 与两种映射**。驱动里用 DMA 的流程是：确认设备与总线的 DMA 能力（设备树里的 dmas 属性）→ 申请 DMA 通道 → 分配并映射缓冲区 → 把总线上可见的地址交给设备 → 启动传输并等待完成回调 → 解映射并释放。一致性 DMA（coherent mapping）用 `dma_alloc_coherent` 分配，保证 CPU 与设备看到的内容一致（通常是非缓存或硬件保持一致的区域），驱动不必手动同步 cache，代价是分配成本高，适合长期存在、频繁小量传输的描述符环或控制结构。流式 DMA（streaming mapping）用 `dma_map_single/dma_map_sg` 临时映射一段已有内存，需要驱动在 CPU 访问与设备访问之间用 `dma_sync_single_for_cpu/device` 手动维护一致性，开销小、适合大数据块的单向传输。方向参数（TO_DEVICE/FROM_DEVICE/BIDIRECTIONAL）必须写对，否则同步会漏；另一个常见坑是缓冲区必须满足设备要求的总线地址范围与对齐，且不要在传输进行中让 CPU 写同一段内存。

**系统调用路径与 C 基础**。用户态 `read` 进来先是 glibc 封装，通过 `syscall` 指令（ARM 上是 `svc`）触发异常、CPU 切到内核态并从异常向量表进入分派逻辑，按系统调用号查表找到对应的实现。以文件读为例：`ksys_read` → 拿 fd 在进程的文件描述符表里找到 `struct file` → 经 VFS 层的 `vfs_read` 做权限与位置检查 → 调用具体文件系统的 `read` → 对块设备还要经页缓存，未命中就发起 IO 并等待 → 最后用 `copy_to_user` 交回用户态并返回实际字节数。C 基础部分：volatile 保证每次都从内存读写、不被优化掉，这正是读寄存器必须加它的原因；static 修饰局部变量是把生命周期变成整个程序，修饰全局变量或函数是把链接属性收成内部链接、避免符号冲突；const 与指针要看 const 在哪一侧——`const char *p` 是内容不可改、`char * const p` 是指针不可改。静态库在链接期把代码复制进可执行文件，部署简单但更新要重编；动态库运行时由动态链接器按 `DT_NEEDED`、`LD_LIBRARY_PATH`、`ldconfig` 缓存、`rpath` 的顺序查找装载，多程序共享一份、可独立升级，代价是版本兼容问题。

---
title: "OPPO 嵌入式软件开发一二面：SPI 时序、Linux 驱动与 Cache 一致性追问"
company: OPPO
position: 嵌入式软件开发
round: 一面、二面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/949597050885120000
tags: ["OPPO","嵌入式","Linux驱动","SPI","I2C","中断","Cache一致性","U-Boot"]
summary: "OPPO 嵌入式软件开发一面从 C 语言基础问起，覆盖指针与数组、堆栈、const/static/volatile、进程线程、SPI 四种模式与软件模拟、I2C 选型、pinctrl 与中断上下半部、VFS；二面往内核与 SoC 底层挖，问 platform 总线匹配、设备树、U-Boot 启动流程与 MMU、字符设备框架、kmalloc 与 slab、Cache 一致性与 DMA、寄存器竞态、perf 与 DDR 带宽。"
---

### 《面试题目》

1. C 和 C++ 哪个更熟悉？C 语言中指针和数组有什么区别？
2. `typedef` 和 `#define` 有什么区别？分别在什么情况下使用？
3. 堆和栈有什么区别？函数调用时，栈里面一般会保存哪些内容？
4. `const`、`static`、`volatile` 分别有什么作用？在嵌入式开发里用过哪些？
5. Linux 进程和线程有什么区别？进程之间有哪些通信方式？
6. 多线程访问共享资源时，怎么保证线程安全？了解哪些锁？
7. SPI 是什么？常见的 SPI 接口有哪几根信号线？
8. SPI 的四种模式分别是什么？CPOL、CPHA 怎么理解？
9. 有没有使用 GPIO 模拟过 SPI？软件模拟和硬件 SPI 有什么区别？
10. I2C 和 SPI 有什么区别？实际项目里怎么选择？
11. Linux 下的 pinctrl 子系统了解多少？驱动里为什么需要配置引脚复用？
12. Linux 中断的处理流程是什么？上半部和下半部有什么区别？
13. workqueue 是什么？为什么有些工作不能直接放在中断处理函数里完成？
14. 内核态和用户态有什么区别？用户态怎么和驱动交换数据？
15. Linux 文件系统了解多少？VFS、inode、dentry 分别是什么？
16. BusyBox 是什么？它和根文件系统有什么关系？
17. Linux 下写过哪些驱动？如果让你写一个按键或者 LCD 驱动，大概会怎么做？
18. 介绍一个项目里遇到的难题，具体是怎么定位和解决的？
19. Linux 的 platform 总线、设备和驱动之间是什么关系？设备怎么和驱动匹配？
20. 设备树主要解决什么问题？驱动是怎么获取设备树中的硬件资源的？
21. U-Boot 的启动流程大致是什么？进入 U-Boot 之前还需要完成哪些初始化？
22. U-Boot 早期启动使用物理地址还是虚拟地址？MMU 一般什么时候开启？
23. 从 Bootloader 到 Linux 内核启动，主要经历哪些步骤？
24. Linux 字符设备驱动的基本框架是什么？cdev 和 file_operations 分别有什么作用？
25. 用户程序打开 `/dev` 下的设备节点时，怎么找到对应驱动的 open 函数？
26. 内核里有哪些常见的内存分配接口？kmalloc、kzalloc、vmalloc 有什么区别？
27. Linux 的 slab 分配器是为了解决什么问题？
28. 用户态和内核态申请内存有什么区别？驱动里申请内存需要注意什么？
29. CPU 访问内存的大致过程是什么？Cache 在里面起什么作用？
30. Cache miss 是什么意思？怎么判断程序是不是存在比较明显的 Cache 问题？
31. 多核 CPU 下为什么要考虑 Cache 一致性？硬件一般怎么保证？
32. 驱动中使用 DMA 时，怎么申请和管理缓冲区？为什么要注意 Cache 一致性？
33. 多核环境下多个执行单元访问同一个寄存器，怎么避免竞争？
34. perf 工具用过吗？cycles、instructions 这些统计值是什么意思？
35. DDR 带宽一般怎么统计？如果发现带宽占用比较高，怎么继续分析？
36. CPU 动态调频了解多少？cpufreq 和系统性能、功耗有什么关系？
37. 系统偶发卡顿或者性能下降，你会先从哪些地方排查？
38. 如果让你重新优化一个已经完成的项目，会从哪些方面考虑？

### 《参考解析》

**SPI 四种模式与软件模拟**：SPI 用 SCLK、MOSI、MISO、CS 四根线（多从机时 CS 一从一线），全双工、主从由时钟控制。模式由 CPOL（空闲时钟极性）与 CPHA（在第一个还是第二个边沿采样）组合成 0 到 3 四种；选错模式的典型现象是读回的数据整体错位或恒为 0xFF/0x00，示波器上看采样点是否落在数据稳定区间最直接。GPIO 模拟 SPI 靠软件翻转时钟、按序移位输出与采样，优点是引脚可任意分配、能兼容时序古怪的器件，缺点是速率低、占用 CPU、抖动大；硬件 SPI 由控制器产生时钟并可配合 DMA，速率高但受引脚复用限制。被追问「采样在哪个时刻」时，要答出「主机在采样边沿读 MISO、在移位边沿改 MOSI」，并说明 CPHA=0 时第一个边沿采样。

**I2C 与 SPI 的选型**：I2C 两根线（SCL、SDA）、支持多主多从、靠地址寻址、有应答机制与总线仲裁，速率通常 100k/400k/1M；SPI 四根线、速率可到几十 MHz、无应答无仲裁、靠片选选从机。选型看四点：引脚预算（多传感器用 I2C 省线）、速率与实时性（高速 ADC、屏幕、Flash 走 SPI）、是否需要多主与冲突检测、器件本身支持哪种接口。实际项目里传感器与 EEPROM 多用 I2C，高带宽外设与存储器多用 SPI，回答时把「芯片给什么接口就用什么」改成「按这四点权衡」。

**中断上下半部与 workqueue**：上半部在中断上下文执行，要求快、不能睡眠、不能调用可能阻塞的接口；下半部承担耗时处理，机制有 softirq、tasklet、workqueue。workqueue 运行在进程上下文，可以睡眠、可以调用 `msleep`、可以拿 mutex，适合需要等待外设、访问文件系统或做较长计算的工作；tasklet 仍在软中断上下文，不能睡眠。所以「中断处理函数里只置标志、发完成量或调度 work，耗时部分丢给 workqueue」是标准答法。

**U-Boot 启动流程与 MMU**：上电后先执行芯片固化的 BootROM，完成最小初始化并从存储介质加载第一阶段引导（SPL/TPL），此阶段初始化 DDR 与基本时钟，然后加载完整的 U-Boot；U-Boot 再初始化串口、网口、存储等外设，读取环境变量、加载内核镜像与设备树到内存，最后 `bootm`/`booti` 跳转。早期代码运行在物理地址（MMU 关闭或只做恒等映射），U-Boot 通常在重定位到内存高端、准备好页表后才使能 MMU 与 Cache；跳转内核前会关闭 MMU 与 D-Cache、把设备树地址通过寄存器传给内核。被问到「U-Boot 之前是谁初始化 DDR」时，答案就是 BootROM 加载的 SPL。

**platform 总线与设备树**：platform 总线是内核里的一条虚拟总线，用于片上外设这类不挂在可枚举总线（PCI、USB）上的设备。设备（`platform_device` 或设备树节点）与驱动（`platform_driver`）通过 name/`compatible` 匹配，匹配成功后调用驱动的 probe。设备树把硬件描述从内核代码里剥出来：寄存器地址与长度、中断号、时钟、GPIO、引脚复用都写在 dts 里，驱动用 `of_property_read_u32`、`platform_get_resource`、`platform_get_irq` 取；这样同一份内核镜像可以配不同板子，改硬件只改设备树。

**字符设备框架与 open 的落点**：字符设备驱动要分配设备号（`alloc_chrdev_region` 或静态指定）、初始化 `cdev` 并 `cdev_add`、实现 `file_operations`（open/read/write/ioctl/release），再创建类与设备节点（`class_create` + `device_create`，udev/mdev 据此在 `/dev` 下建节点）。用户 `open("/dev/xxx")` 时，内核按 inode 的设备号在 `cdev_map` 里找到对应的 `cdev`，取其 `ops`，再调用 `ops->open`；这也是为什么主次设备号必须与注册时一致。

**内存分配接口与 slab**：`kmalloc` 分配物理连续的小块内存（通常上限几 MB），来自 slab 的通用缓存，速度快但可能失败；`kzalloc` 是清零版；`vmalloc` 分配虚拟连续、物理可不连续的内存，适合大块缓冲区，但每次都要建页表、访问效率略低，且不能在原子上下文用。slab 分配器缓存常用对象（如 inode、dentry、task_struct），避免反复向伙伴系统申请释放带来的碎片与开销；它按对象大小分 cache，回收时对象留在 cache 里复用。

**Cache 一致性与 DMA**：CPU 访问内存先查 L1/L2，命中直接返回，未命中才到 DDR，因此 DMA 直接搬内存时 CPU 可能读到 Cache 里的旧数据，或 DMA 读到尚未写回的脏数据。处理办法是按方向做 Cache 维护：设备到内存（读）在 DMA 前 invalidate、完成后 invalidate；内存到设备（写）在 DMA 前 clean/flush。Linux 里用 `dma_map_single`/`dma_unmap_single` 配合 `dma_alloc_coherent`（一致性内存，通常不做 Cache）或 streaming 映射；缓冲区还要满足对齐与边界要求，避免跨 Cache line 的伪共享。

**多核寄存器竞态**：普通读改写 `reg |= mask` 在汇编层面是 load-modify-store，两个核同时执行会丢更新。要点是：用原子指令或自旋锁保护（中断上下文用 `spin_lock_irqsave`），对硬件寄存器尽量用带置位/清位语义的写（write-1-to-set/clear）避免读改写，必要时用 `readl`/`writel` 加屏障保证顺序。对「写 1 清零」的状态寄存器尤其不能套用读改写，否则会把别的位一起清掉。

**性能排查的顺序**：先确认现象与复现条件（哪个进程、什么负载、持续多久），再看系统层面 `top`/`vmstat`/`mpstat` 区分 CPU、内存、IO、调度谁紧张；然后用 `perf top`/`perf record` 找热点函数，`cycles` 是消耗的时钟周期、`instructions` 是退休指令数，两者比值（IPC）低说明在等内存或分支预测失败；怀疑带宽就看 DDR 控制器的计数器或用 `perf stat` 的 cache-miss、LLC-load-miss 事件，再结合 `cpufreq` 看是否降频。偶发卡顿优先查中断风暴、锁竞争、内存回收（`/proc/pressure`）、以及热降频。

**复盘项目时的优化角度**：先问目标指标是什么（时延、吞吐、功耗、成本），再沿数据通路找瓶颈（采集、传输、处理、存储），然后评估手段的代价：算法复杂度、并行化、DMA 替代 CPU 拷贝、减少内存拷贝与锁、Cache 友好布局、动态调频策略。回答时给出「改前多少、改后多少、怎么验证」三段，比罗列技术名词更有说服力。

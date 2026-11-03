---
title: "新易盛嵌入式一面：STM32 参数与 FreeRTOS 调度"
company: "新易盛"
position: "嵌入式软件开发"
round: "一面"
date: "2026-11"
base: "成都"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/5273e57346d14606baf48da00ef616f5"
tags: ["新易盛", "嵌入式软件开发", "STM32", "I2C", "SPI", "FreeRTOS"]
summary: "成都新易盛嵌入式软件开发一面（9 月 13 日，线下 25 分钟）：英文自我介绍后，追问项目与实习里用的 STM32 型号、主频与内存参数，项目里最大的难题怎么解，I2C 读数据的时序、SPI，FreeRTOS 多任务如何划分与调度、用什么手段调试，最后是实习与反问。"
---

### 《面试题目》

1. 用英文做自我介绍。
2. 项目和实习里用的 STM32 是哪颗型号？主频、Flash、RAM 各是多少？
3. 项目里最大的难题是什么，怎么解决的？
4. I2C 读数据的时序是怎样的？
5. SPI 的时序与几种模式？
6. 项目里 FreeRTOS 的多任务是怎么设计和调度的？
7. FreeRTOS 用过什么手段调试？
8. 实习做了什么？
9. 反问

### 《参考解析》

**芯片参数要能当场报数。** 这题不是背型号，是确认你真的在板子上写过代码。常用几颗要张口就来：STM32F103C8T6 是 Cortex-M3、72MHz、64KB Flash、20KB RAM；STM32F407ZGT6 是 Cortex-M4F、168MHz、1MB Flash、192KB RAM（112KB + 16KB + 64KB 分块，其中 64KB 是 CCM，只能走内核总线、DMA 访问不到）；STM32H743 是 M7、480MHz、2MB Flash、1MB RAM，带 TCM 与多域 SRAM。答的时候再补三层：为什么选它（外设数量、RAM 余量、封装、成本、供货）、时钟怎么来（8MHz 外部晶振经 PLL 倍频）、哪些资源吃紧（RAM 划分、DMA 通道冲突）。CCM 不能被 DMA 访问这类坑，一问就区分出有没有踩过。

**I2C 读一个寄存器：写地址 → 重复起始 → 读。** 完整时序：START（SCL 为高时 SDA 由高拉低）→ 发 7 位从机地址 + 写位（0）→ 从机 ACK → 发寄存器地址 → ACK → **repeated START**（不发 STOP，直接再拉一个起始）→ 地址 + 读位（1）→ ACK → 主机接收字节，每收一字节回 ACK，最后一字节回 **NACK** 告诉从机别再发 → STOP（SCL 高时 SDA 由低升高）。用 HAL 就是 `HAL_I2C_Mem_Read(&hi2c1, addr<<1, reg, I2C_MEMADD_SIZE_8BIT, buf, len, timeout)`，它内部替你做了 repeated start。

坑集中在物理层与协议细节：上拉电阻按总线电容算（100kHz 常用 4.7k，400kHz 用 2.2k 左右），总线电容超 400pF 波形就塌；从机可能做时钟延展（把 SCL 拉低不放），主机要容忍；多主时靠仲裁，SDA 上电平和自己发的不一致就退让；有些器件不认 repeated start，只能 STOP 后重新 START；读之前忘写寄存器地址，读回来永远是最后一个指针位置。调试手段是逻辑分析仪抓 SDA/SCL，先看 ACK 有没有回来，再看第 9 个时钟上谁拉低。

**SPI 的四种模式由 CPOL 与 CPHA 决定。** CPOL 定空闲电平（0 低、1 高），CPHA 定在第几个边沿采样（0 第一个、1 第二个）。于是 mode0（0,0）上升沿采样、mode1（0,1）下降沿采样、mode2（1,0）下降沿采样、mode3（1,1）上升沿采样。全双工靠移位寄存器，主机拉低片选、按位交换，收发的位数一样。答题时接一个真实器件最有说服力：「板上的 W25Q64 用 mode0，最高 80MHz，我实际跑 20MHz，因为走线长、又没有做阻抗控制，超过 40MHz 就误码。」再补多从机两种接法（独立片选 / 菊花链）和片选建立时间。

**FreeRTOS 的任务划分与调度。** 划分按周期和实时性来：采样（1kHz，硬实时，最高优先级）、控制环（100Hz）、通信协议栈（事件驱动）、日志与上报（低优先级、可丢）。调度器是**抢占式 + 同优先级时间片轮转**，所以优先级分配要按单调速率原则——周期越短优先级越高，别凭感觉。共享资源（SPI 总线、全局缓存）用互斥量而不是二值信号量，因为互斥量有优先级继承，能缓解优先级反转；中断到任务用 `xQueueSendFromISR` / `vTaskNotifyGiveFromISR`，中断里绝不做阻塞操作、不调带 `Wait` 的 API。栈深按最坏调用链估，跑起来后用 `uxTaskGetStackHighWaterMark` 看余量，留 30% 以上。开 `configCHECK_FOR_STACK_OVERFLOW=2` 并在钩子函数里记录出问题的任务名。

**调试手段分层。** 软件层：`vTaskList` / `uxTaskGetSystemState` 打印各任务状态、优先级、栈余量；开 `configGENERATE_RUN_TIME_STATS` 用定时器做 CPU 占用统计，看谁在吃时间片；Segger SystemView 或 FreeRTOS+Trace 直接把调度时序画出来，能看见任务被谁打断、阻塞了多久。硬件层：SWO / ITM 打 printf 不占串口、逻辑分析仪看片选与数据线、示波器看电源纹波与复位。典型故障是「周期性抖动」：现象是控制环偶尔晚几百微秒，用 SystemView 一看是被低优先级任务持锁阻塞，改互斥量加优先级继承、缩短临界区后消失。

**实习与反问。** 实习那段按「做了什么模块 + 用什么芯片与外设 + 交付了什么」讲，别只报公司名。反问可以问这个岗位负责的产品线与现有的芯片平台、新人前三个月做什么，答案直接影响你要补哪颗片子的知识。

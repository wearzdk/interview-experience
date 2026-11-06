---
title: "数字 IC 秋招面试总结：Setup/Hold、亚稳态、STA 与 AXI 握手"
company: "多家"
position: "数字 IC 设计"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/948185930316214272
tags: ["数字IC", "芯片设计", "时序分析", "STA", "CDC", "AMBA", "UVM"]
summary: "一篇数字 IC 秋招面试的系统总结：项目 PPT 与串讲方法、Setup/Hold 检查公式与高频追问、亚稳态与同步器、STA 与动态仿真、Corner 与 OCV/CRPR、时序例外、阻塞与非阻塞赋值、AMBA 总线演进与 AXI 握手铁律、跨时钟域处理、复位与 UVM 方法学。"
---

### 《面试题目》

1. 项目：怎么做 PPT、怎么串讲，如何突出设计动机、方案取舍与难点？
2. Setup / Hold 时间的检查公式是什么？为什么 Hold 违例比 Setup 更严重？
3. Setup / Hold 能是负数吗？Skew 对二者有什么影响？
4. 亚稳态的成因、缓解手段？同步器为什么通常用两级？
5. STA 与动态仿真的区别？时序路径分几类？WNS 与 TNS 是什么？
6. Skew 与 Jitter 的区别？clock uncertainty 怎么组成？
7. Setup 与 Hold 各自的最坏 Corner 是什么？什么是温度反转？
8. OCV 与 derate 怎么用？CRPR/CPPR 解决什么问题？
9. False Path、Multicycle Path、set_clock_groups 分别怎么用？为什么 multicycle 的 setup 设 N、hold 设 N−1？
10. 阻塞赋值与非阻塞赋值的区别？reg 一定产生触发器吗？时序 always 没有 else 会产生 latch 吗？
11. AMBA 总线从 APB 到 AHB 再到 AXI 的演进主线是什么？AXI 握手的铁律有哪些？为什么这样规定？
12. burst 与地址规则？为什么不能跨 4KB 边界？ID 与 outstanding 的乱序规则？
13. 跨时钟域：单 bit 与多 bit 分别怎么处理？格雷码适用于什么场景？
14. 为什么用「异步复位、同步释放」？recovery/removal 与 RDC 是什么？
15. UVM 的 phase、config_db、objection、scoreboard 各自的作用与常见陷阱？

### 《参考解析》

**Setup/Hold 与为什么 Hold 更严重。** Setup 检查数据在捕获时钟沿之前稳定足够长的时间，公式是 `Tlaunch + Tcq + Tcomb_max <= T + Tcapture - Tsetup - Tuncertainty`；Hold 检查数据在时钟沿之后保持足够长，公式是 `Tlaunch + Tcq + Tcomb_min >= Tcapture + Thold + Tuncertainty`。Hold 更严重的原因是公式里不含周期 T：降频可以救 Setup（周期变长，留给组合逻辑的时间更多），但降频对 Hold 毫无帮助，流片后发现 Hold 违例只能改版。Setup 与 Hold 都可以是负数（负 hold 表示时钟路径比数据路径慢），但二者构成的窗口宽度必须为正。Skew 的影响相反：捕获时钟晚到（正 skew）改善 Setup、恶化 Hold。

**亚稳态与两级同步器。** 触发器的输入在时钟沿附近变化、违反 setup/hold 时，输出可能停在中间电平或振荡一段时间才稳定，这就是亚稳态。它不能消除，只能把发生概率降到可接受：用同步器（两级或三级触发器）、异步 FIFO、握手协议。MTBF 与可用恢复时间成指数关系（`MTBF ∝ e^(Tr/τ)`），两级同步器给第一级的亚稳态留出约一个周期的恢复时间，通常已经远超产品寿命；频率越高、工艺越先进，Tr 相对周期越小，风险越大，需要三级。还要注意 MTBF 是统计量：单个同步器 5000 年，片上有 1000 个就变成 5 年，再乘出货量就不能忽略。

**STA 与 Corner。** STA 不加激励，把电路拆成时序路径、用库延时判断是否满足约束，优点是穷举、快、不依赖测试向量，缺点是不查功能、不查异步 CDC、完全依赖约束正确；动态仿真（门级 + SDF）查功能但覆盖率受向量限制。时序路径分四类：in→reg、reg→reg、reg→out、in→out，分别对应输入延迟、内部逻辑、输出延迟与纯组合路径的约束。WNS 是最差的负 slack（最难修的一条），TNS 是所有违例端点负 slack 之和（违例规模）。Setup 的最坏 corner 是慢 corner（SS、低压、高温，存在温度反转时低温也可能更慢），Hold 的最坏 corner 是快 corner（FF、高压、低温）；先进工艺低电压下温度反转会让低温反而更慢。OCV 用 derate 建模片上差异：setup 检查中 launch 时钟与数据路径乘 late 系数、capture 时钟乘 early 系数，hold 反之。CRPR 把 launch 与 capture 时钟路径的公共部分被同时按快慢计算造成的过度悲观加回 slack。

**时序例外。** False path 用于结构存在但功能上不发生、或不需要满足时序的路径（异步时钟之间、准静态配置寄存器、互斥选择路径），滥用会掩盖真实违例。Multicycle path 的 setup 设 N 表示允许 N 个周期完成，捕获沿后移 N−1 个周期；hold 检查沿默认跟着后移会变得极难满足，所以 hold 设 N−1 把检查拉回原来的 launch 沿附近。set_clock_groups 的三种模式要分清：asynchronous 是两时钟同时存在但不做组间时序分析（仍考虑串扰）；logically_exclusive 是逻辑上不同时有效；physically_exclusive 是物理上不可能同时存在（连串扰都不算）。

**阻塞与非阻塞。** 区别在更新时机：阻塞赋值 `=` 立即生效，组合逻辑用它让后续语句看到本次计算结果；非阻塞 `<=` 在时间步末尾统一更新，时序逻辑用它实现「右值读旧值」的流水行为，`q1 <= d; q2 <= q1;` 中 q2 读到的是旧 q1。`reg` 不必然产生触发器：完整赋值的组合 always 产生纯组合逻辑，边沿触发的 always 产生触发器，组合过程漏赋值才可能推断出 latch；时序 always 没有 else 不会产生 latch，那是保持行为。全部用 `<=` 也不能避免竞争，关键是单写者与明确的驱动/采样时机。

**AMBA 与 AXI 握手。** 演进主线是不断解决上一个协议的吞吐瓶颈：APB 无流水、无 burst、单主机，适合低速外设寄存器；AHB 引入地址/数据两级流水与 burst；AXI 拆成五个独立通道（AW/W/B/AR/R），读写可并行、地址与数据解耦以支持 outstanding、带 ID 支持乱序返回。握手铁律有三条：VALID 与 READY 同时为高的沿完成传输；VALID 拉高后、握手前不能撤、负载不能变；VALID 不能依赖 READY（READY 可以依赖 VALID）。第三条是防死锁的关键：如果双方都等对方先动，就会互锁。burst 不能跨 4KB 边界，因为互联按第一拍地址路由整个 burst，跨界会让后半段打到错误的从机，DMA 需要在边界处拆 burst。同 ID 的响应必须保序，不同 ID 可以乱序；写数据通道不允许交织，读数据允许不同 ID 的 beat 交织。

**跨时钟域与复位。** 单 bit 电平信号打两拍同步器即可；单 bit 快时钟到慢时钟的脉冲要先展宽到慢时钟能采到，再同步并反馈确认；多 bit 相关数据不能逐位打两拍（各位延迟不同会采到新旧混合值），要用格雷码（只适用于单调变化、每次只变一位的计数指针）、握手（req/ack）或异步 FIFO。复位采用「异步复位、同步释放」：复位立即生效、不依赖时钟，释放经同步器打两拍，避免 recovery/removal 违例导致不同触发器在不同拍退出复位。RDC 是跨复位域的问题，源被异步复位清零的瞬间，目的寄存器可能把亚稳态当成合法数据采走，处理方式是复位域间同步或加约束。

**UVM 要点。** phase 分 build（建树）、connect（连口）、run（并发执行，由 objection 控制结束）、check/report（收尾）；config_db 用于跨层传配置，避免逐层传句柄；objection 的 raise/drop 决定 run phase 何时结束，忘了 raise 仿真会瞬间结束；scoreboard 负责期望与实际的比较，乱序模块要用 ID/tag 匹配。常见陷阱：句柄赋值 `b = a` 复制的是句柄，monitor 重用同一对象会让队列里所有项指向最后一次内容，应每笔新建或 clone；比较用 `!==` 而不是 `!=`，后者遇 X/Z 返回 X，`if` 不会进入真分支从而漏报；`randomize()` 失败必须报错，不能假装拿到新事务。

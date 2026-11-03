---
title: "新易盛嵌入式二面：英文自我介绍与 SPI 追问"
company: "新易盛"
position: "嵌入式软件开发"
round: "二面"
date: "2026-11"
base: "成都"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/b15e20c0b0694e2397a47cb19b3a3846"
tags: ["新易盛", "嵌入式软件开发", "主管面", "SPI", "英文面试"]
summary: "成都新易盛嵌入式软件开发二面（10 月 13 日，线下 40 分钟主管面）：先问英语水平并要求英文自我介绍，再用英文问 SPI 有几种、团队怎么分工，之后转中文深挖在校项目与实习项目，整体问得很细，最后主管介绍了岗位的工作内容。"
---

### 《面试题目》

1. 你的英语怎么样？
2. 用英文做自我介绍。
3. 用英语问：SPI 有几种？
4. 用英语问：团队里是怎么分工的？
5. 用中文讲在校期间做的项目，并追问细节。
6. 用中文讲实习做的项目。

最后主管介绍了岗位的工作内容。

### 《参考解析》

**英文自我介绍按 40 秒准备，句子要短。** 面试官是主管，不是外教，他听的是「能不能和海外客户/文档打交道」。结构四块：身份（学校、专业、毕业时间）、方向（`I've been working on STM32-based embedded systems, mainly sensor acquisition and motor control`）、一个带数字的成果（`I built a four-axis acquisition board; the control loop runs at 1 kHz with about 40 microseconds of jitter`）、为什么这家（`I want to work on hardware-facing firmware, where timing and signal integrity are the real problems`）。用短句、少从句、不用生僻词；提前把每句念到不打结，比写一篇漂亮长文有用。

**SPI 用英语怎么答。** 一句定性再展开：`SPI is a full-duplex, synchronous serial bus with four signals: SCLK, MOSI, MISO and CS. It has four modes defined by CPOL and CPHA.` 然后把四种模式对应到采样边沿：mode 0（CPOL=0, CPHA=0）在上升沿采样，mode 1（0,1）下降沿，mode 2（1,0）下降沿，mode 3（1,1）上升沿。再补两句实操：时钟频率受从机手册和走线长度限制（`the device supports 80 MHz, but I run 20 MHz because the trace is long`）、多从机靠独立片选或菊花链。被追问时最容易卡住的词先背好：采样沿 sample edge、空闲电平 idle level、片选 chip select、全双工 full duplex、移位寄存器 shift register。

**团队分工用英语说，说角色和交付物。** 别说 `we did it together`。模板：`I was responsible for the driver layer and the communication protocol; a hardware engineer designed the board, and a test engineer wrote the production test flow. I synced with them twice a week on interface changes.` 再补一句冲突怎么处理：`when the register map changed, I asked for a one-week freeze so the firmware wouldn't break.`

**主管面深挖项目，准备三层就够。** 第一层一句话说清做什么（给谁用、解决什么问题）；第二层关键取舍（为什么选这颗芯片、为什么用 FreeRTOS 而不是裸机、通信为什么走 SPI 不走 I2C）；第三层踩过的坑与怎么定位（示波器/逻辑分析仪看到什么、日志停在哪、最后改了什么）。数字要能报：任务周期、采样率、通信速率、RAM 与 Flash 占用、功耗。「问得很细」意味着他会顺着你的话往下追到答不出为止——到了边界就直说「这块当时不是我做的，我了解的是接口这一层」，然后给出你当时的判断依据。硬编一层就会被追穿两层。

**主管面的收尾是信息。** 最后他介绍岗位工作内容，这段要认真听：产品做什么、团队规模、你进去接的是新项目还是维护老平台、有没有对外的客户支持。这些是判断要不要去的核心，也是反问的入口——「这个岗位前半年主要交付什么」「团队现在用的是哪家 MCU 平台」都比问薪资合适。
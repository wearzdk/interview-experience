---
title: 联合电子 嵌入式软件开发 技术面（线下）
company: 联合电子
position: 嵌入式软件开发
round: 技术面
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/9ed2d5499f89424d8d77702006d6bf2b
tags: ["联合电子", "嵌入式", "CAN", "CANFD", "Git", "汽车电子"]
summary: "联合电子嵌入式软件开发（base 重庆）线下技术面：自我介绍、项目深挖与整体架构、实习内容、CAN 帧结构与 CAN FD 和 CAN 的区别、Git 常用指令、AI 工具使用情况，最后反问。"
---

### 《面试题目》

1. 自我介绍。
2. 深挖项目：整体架构是怎样的，如何实现的？
3. 介绍一下实习内容。
4. CAN 帧结构是什么？CAN FD 与 CAN 有什么区别？
5. Git 相关指令你用过哪些？
6. AI 工具的使用情况怎么样？
7. 反问环节。

### 《参考解析》

**CAN 帧结构要能按字段顺序讲**：标准帧由帧起始（SOF）、仲裁段（11 位 ID + RTR）、控制段（IDE、DLC）、数据段（0 到 8 字节）、CRC 段（15 位 CRC + 界定符）、ACK 段（ACK 槽 + 界定符）、帧结束（7 个隐性位）组成；扩展帧仲裁段是 29 位 ID。仲裁靠「显性位覆盖隐性位、ID 越小优先级越高」，所以高优先级的报文要分配更小的 ID。错误处理有错误计数器与错误帧，节点会在 error-active、error-passive、bus-off 之间迁移。

**CAN FD 的四个关键变化**：数据长度从最多 8 字节扩到 64 字节；数据段可以切换到更高的波特率（BRS 位），仲裁段仍保持与原 CAN 相同的速率以保证兼容；CRC 更强（根据数据长度使用 17 或 21 位 CRC 并加入填充位计数）；取消了远程帧，帧格式上新增 FDF、BRS、ESI 等位。工程影响是同样的数据量下帧数大幅减少、总线负载下降，但需要收发两端都支持 FD，且高波特率对布线、终端电阻与收发器有更高要求。

**Git 常用指令按场景组织更容易答**：日常提交（status、add、commit、log、diff）、分支（branch、checkout/switch、merge、rebase）、远端（fetch、pull、push、remote）、回退与修复（restore、reset --soft/--mixed/--hard、revert、cherry-pick、stash）、排查（blame、bisect、reflog）。回答时强调两条纪律：公共分支只用 revert 不用 reset；rebase 只用于自己的本地分支。

**「AI 工具使用情况」在汽车电子岗要带上边界**：可以说用 AI 读陌生代码、生成单元测试、解释报错、写脚本与文档；同时说明哪些不能交给它——涉及功能安全的代码、时序与中断相关逻辑、以及需要追溯的需求实现。再补一句质量把关：AI 产出必须过编译、静态检查与评审，不能直接进主干。

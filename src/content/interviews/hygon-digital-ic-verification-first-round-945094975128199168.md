---
title: "海光信息数字 IC 验证校招一面：半小时的“验证基本功”体检"
company: 海光信息
position: 数字 IC 验证工程师
round: 一面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/945094975128199168
tags: ["数字IC","UVM","SystemVerilog","验证","Scoreboard","校招"]
summary: "海光信息数字 IC 验证校招一面，约 30 分钟：不问算法不手撕，全程围绕项目验证环境、scoreboard 怎么写、UVM 层次怎么搭，再加 Perl 脚本与 hash 数据结构，最后聊 offer、社团、动机与规划。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 在校学过哪些课程？成绩怎么样？
3. 介绍一下你的项目（验证对象、环境结构、你负责的组件、覆盖了哪些功能点、发现的 bug）。
4. scoreboard 怎么写？
5. 如何搭验证环境？
6. Perl 相关：怎么用正则匹配日志里的错误、怎么批量替换、怎么解析字段、怎么批量跑用例？
7. hash / 关联数组在验证里怎么用？
8. 有没有其他 offer？
9. 参加过什么社团？校外活动有哪些？
10. 为什么想来海光？
11. 你的职业规划是什么？

### 《参考解析》

**scoreboard 的完整闭环**：输入 → 参考模型 → 期望队列 → DUT 输出 → 队列匹配 → 比对 → 错误上报 → 覆盖率反馈。数据来源有两条路：一是用参考模型（C/C++/SV 写的 golden model）算出期望值，二是从 DUT 内部关键信号采样。比对方式按场景选：逐拍比较适合无延迟的组合逻辑；事务级比较把输入打包成 transaction、等 DUT 处理完再比结果；有流水线延迟时必须用 FIFO 缓存期望值并做延迟对齐；多通道/乱序返回则按 ID 或地址做匹配。数据结构上常用关联数组（按 ID/地址索引）或队列，比较完及时清理避免内存泄漏；不匹配时打印关键字段（ID、期望值、实际值、时间）方便定位，而不是只报一句 error。骨架大致是：

```systemverilog
class my_scoreboard extends uvm_scoreboard;
  protected trans_t expect_q[$];
  function void write_exp(trans_t t); expect_q.push_back(t); endfunction
  function void write_act(trans_t t);
    if (expect_q.size() == 0) begin `uvm_error("SCB", "unexpected output") return; end
    compare(expect_q.pop_front(), t);
  endfunction
endclass
```

**验证环境怎么搭**：标准 UVM 层次是 test → env →（agent：sequencer + driver + monitor、scoreboard、reference model、coverage），interface 连 DUT，tb_top 里例化 DUT 和 interface。步骤是：定义 interface（时钟、复位、总线信号）→ 例化 DUT → 配 agent 处理协议级激励 → driver 做时序转换、monitor 采总线数据 → sequence 组织场景 → 参考模型 + scoreboard 比对 → 加功能覆盖率和断言 → 跑回归收覆盖率。回答时要点出每个组件的职责边界，以及 virtual sequencer 怎么统一调度多个 agent。加分的是提一句断言（`assert property`）和覆盖率收口的具体做法。

**Perl 在验证里的用法**：验证工程师的日常是跑回归、翻日志、批处理，Perl 的强项就是正则和文本处理。匹配错误行用 `if ($line =~ /UVM_ERROR/)`，提取数字用捕获组，批量替换用 `s/old/new/g`，解析字段用 `split /,/`，批量跑用例用 `system("vsim -c -do run.tcl")` 配合循环。典型脚本是从仿真日志里统计 UVM_ERROR 数量、按用例名汇总 pass/fail、把失败的种子和用例名提取出来重跑。虽然新流程多用 Python，但 EDA 老工具链里 Perl 仍然常见，会读会改就是加分。

**hash / 关联数组**：在验证里主要用于"按 key 找期望值"——scoreboard 里用事务 ID 或地址做 key 存期望数据，输出来了就查表比对，天然解决乱序返回；寄存器模型用地址映射；覆盖率收集时按功能点归类。常用操作是 `exists`、`delete`、`keys`、`values`，注意键无序、遍历顺序不保证。SV 里对应 `assoc_array.exists(key)` 与 `foreach`。

**项目怎么讲**：面试官真正想听的是"你怎么证明 DUT 是对的"，而不是 DUT 有什么功能。按这个顺序讲：验证对象（IP 还是 SoC、什么协议、什么规模）→ 环境结构（UVM 层次、你负责哪几个组件）→ 验证计划（功能点拆解、用例设计、覆盖率目标）→ 执行与收敛（回归规模、覆盖率到多少、怎么补洞）→ 抓到的 bug（现象、定位过程、根因、怎么加的回归用例）。只讲功能不讲验证方法，是这类面试最常见的翻车方式。

**动机与软素质**：为什么来海光，别只说"大厂"。可以讲国产 CPU/DCU 的产品线、x86 生态与高性能计算带来的验证复杂度、以及"验证周期长、场景复杂，能沉淀真正值钱的方法论"。社团和校外活动要翻译成岗位需要的能力：多人共建环境的协作、和设计对齐行为的沟通、长回归期间的自律。职业规划按"0-1 年吃透 UVM 与流程、1-2 年独立负责模块验证、2-4 年做 SoC 级、之后往平台与方法学带头人走"来讲。

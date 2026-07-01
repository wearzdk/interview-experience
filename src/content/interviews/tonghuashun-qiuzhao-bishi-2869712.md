---
title: 同花顺27届秋招笔试面经（6.30）
company: 同花顺
position: 秋招开发工程师（笔试）
round: 笔试
date: '2026-06'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2869712
tags: ["Java","MySQL","算法","Prompt工程","Transformer"]
summary: "同花顺27届秋招笔试面经，选择题考察Java基础语法和MySQL知识，编程题以模拟与库函数使用为主，另外还考了Prompt编写设计原则和Transformer架构原理等AI相关内容。"
---

### 《面试题目》

1. 选择题：Java 基础语法和 MySQL 相关知识
2. 文字问答题与系统设计题
3. 编程题：以模拟类题目和标准库函数使用为主
4. AI 相关：Prompt 的编写与设计原则
5. AI 相关：Transformer 架构原理

---

### 《参考解析》

1. **Prompt 设计原则**：明确角色定位和任务目标；提供必要的背景信息和边界约束（如输出格式、字数、禁止项）；对复杂任务做结构化拆解，分步骤引导；给出示例（few-shot）帮助模型对齐预期输出；根据实际输出效果做迭代优化，而不是一次性写完。
2. **Transformer 架构核心原理**：核心是自注意力机制（Self-Attention），通过将输入映射为 Query、Key、Value 三组向量，计算 Query 与所有 Key 的相关性权重后对 Value 加权求和，从而让每个位置都能直接建模与序列中任意其他位置的依赖关系，摆脱了 RNN 的串行依赖。多头注意力（Multi-Head Attention）让模型并行地在多个子空间学习不同的关系模式。由于 Self-Attention 本身不具备顺序信息，还需要加入位置编码（Positional Encoding）来保留序列的位置关系。整体结构由 Encoder-Decoder（或仅 Decoder，如 GPT 系列）堆叠多层，每层内部配合残差连接和 LayerNorm 保证深层网络的训练稳定性。

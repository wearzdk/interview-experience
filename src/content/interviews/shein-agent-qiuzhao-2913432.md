---
title: "SHEIN Agent开发秋招面经：Java基础与Transformer"
company: "SHEIN"
position: "Agent开发"
date: "2026-09"
source: "牛客网"
tags: ["Java", "ConcurrentHashMap", "Transformer", "多头注意力", "多模态", "BLIP2"]
summary: "SHEIN Agent 开发秋招面经，约 50 分钟，按 Java 基础 20 分钟、项目深挖 20 分钟、Transformer 与 AI 10 分钟推进，题目涉及 ConcurrentHashMap、多头注意力与 BLIP2 架构。"
---

### 《面试题目》

1. ConcurrentHashMap 相关的常见问题有哪些？
2. Transformer 的多头注意力机制有什么作用和优势？
3. BLIP2 的架构是什么？它和之前的多模态模型区别在哪？

### 《参考解析》

**面试节奏**

整场约 50 分钟，四段：Java 基础 20 分钟、项目深挖 20 分钟、Transformer 和 AI 相关 10 分钟、反问。基础与项目各占四成，AI 部分只有 10 分钟，但仍然会问到具体模型架构。准备 Agent 方向只背 Java 八股不够，得能把一个多模态模型的内部结构讲清楚。原帖开头另附了本轮校招的招募对象范围（2026 年 9 月至 2027 年 8 月毕业），与面试题无关。

**ConcurrentHashMap**

JDK 7 用 Segment 分段锁（继承 ReentrantLock），并发度等于 Segment 数量（默认 16），扩容以单个 Segment 为单位。JDK 8 取消 Segment，改成 Node 数组加链表和红黑树，锁粒度降到桶的头节点：put 时先 CAS 无锁写入空桶，失败再用 `synchronized` 锁住头节点；数组长度保持 2 的幂，用 `(n - 1) & hash` 定位；链表长度到 8 且数组容量不小于 64 才树化。

size 统计不是一把锁，而是 `baseCount` 加 `CounterCell` 数组分散 CAS 热点（思路同 LongAdder），求和时遍历累加。扩容支持多线程协助迁移：`sizeCtl` 记录步长，迁完的桶放 ForwardingNode，迁移时把原链表按高位拆成两条。和 HashMap 的差别：key 和 value 都不允许 null（并发场景没法用 null 表示不存在），复合操作（先查再写）仍需自己保证原子性，`computeIfAbsent` 在 JDK 8 里是原子的。常见追问是为什么用 synchronized 而不用 ReentrantLock（省对象头内存、JVM 可以做锁升级优化）以及为什么容量必须取 2 的幂。

**多头注意力的作用**

把 `d_model` 拆成 h 个头，每头维度 `d_k = d_model / h`，各自学一套 `W_q/W_k/W_v` 并行做缩放点积注意力，再把各头输出拼接后过 `W_o`。收益在于同一个注意力层里，不同头可以落在不同的表示子空间、关注不同类型的关系：有的头偏向相邻位置，有的头负责长距离依赖，有的对应句法结构或指代。单头只能学出一份平均的注意力分布，等于把这些关系混在一起。

总计算量与「单头做全维度注意力」大致相当，实现上就是一次大矩阵乘加 reshape，所以表达力提升是近乎白送的；同时多头相当于对注意力做了集成，训练更稳。工程细节上 `d_k` 常取 64，各头共享同一个 mask；推理时有 KV Cache，MQA/GQA 通过让多个查询头共享 KV 头来降低显存带宽压力。

**BLIP2 的架构**

三部分：冻结的图像编码器（ViT，如 EVA-CLIP）、可训练的轻量 Q-Former、冻结的大语言模型。Q-Former 内部有两层交互：一组可学习的 query embedding（32 个）先通过 cross-attention 从图像编码器抽取视觉特征，再通过 self-attention 和文本 token 交互。

训练是两阶段。第一阶段做视觉语言表征学习，ITC（图文对比）、ITM（图文匹配）、ITG（图生文）三个目标共享同一个 Q-Former；第二阶段把 Q-Former 输出经一个线性层接到冻结的 LLM 上，做生成式训练。整个过程视觉端和语言端都不更新参数，只训练桥接模块（亿级参数量）。

和早期多模态模型的区别在于「微调什么」。BLIP、Flamingo 那类做法要么端到端微调视觉编码器和融合层，要么在冻结 LLM 里插入 gated cross-attention 层（Flamingo 的 Perceiver Resampler 加交叉注意力层），参数量和训练成本都高得多。BLIP2 用 Q-Former 当信息瓶颈，把一张图的视觉 token 从几百个压到 32 个，既省算力又避免大模型微调带来的灾难性遗忘。代价是 query 数量少、语言端完全冻结，细粒度 OCR、计数这类任务会弱于端到端微调的模型。

---
title: "得物推荐算法实习一面：RankMixer 结构拷问与 cross attention 追问"
company: "得物"
position: "推荐算法实习"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/a5a5c4100c4b42b1898c6284ab544f56
tags: ["得物", "推荐算法", "实习", "DLRM", "RankMixer", "CrossAttention", "手撕算法"]
summary: "得物 APP 推荐算法实习一面（40 分钟）：自我介绍后确认项目是课余做的，第一个传统 DLRM 系统讲完没有提问，第二个 taac2026 项目被连续追问 HyFormer block 的结构、RankMixer 里是什么、几轮 block 与 mixer、序列与非序列 token 怎么生成，以及为什么用 cross attention 而不用 self attention；卡住后转问 Transformer 结构与 self attention 公式，手撕最长回文子串。"
---

### 《面试题目》

1. 自我介绍。
2. 项目是自己课余做的吗？
3. HyFormer block 是怎么做的？
4. RankMixer 里面是什么？
5. 几轮 block？几轮 mixer？
6. 序列和非序列 token 是怎么生成的？
7. cross attention 和 self attention 有什么区别？
8. 为什么用 cross 不用 self？跟只用 self 相比有什么区别？为什么不直接用 self？
9. Transformer 的结构是什么？self attention 的公式写一下。
10. 手撕：最长回文子串。

### 《参考解析》

**「项目是自己课余做的吗」不是寒暄，是定级**。课余项目预期会降低，但追问更狠——没有线上系统兜底，结论只能靠自己的实验说服人。第一个 DLRM 项目「介绍完没有提问」是危险信号：讲得太像教科书，没有给出可追问的判断。有效介绍要带三样：数据集与规模、关键结构的 shape、一个具体对照结果（加了什么、指标涨了多少、延迟涨了多少）。

**被问 block 里是什么时，答结构不如答数据流**。标准答法是按张量走一遍：特征怎么切成 token（每 token 多少维）、block 内先做 token 间混合再逐 token 前馈、残差与归一化放哪、输出怎么聚合。面试官验的是你知不知道每一维代表什么、参数量多少、为什么这个深度就停了。「几轮 block、几轮 mixer」必须报出确切数字并给理由——收益第几轮饱和、延迟预算卡在哪；答「调参试出来的」也比答不上来好。

**RankMixer 的核心是把「特征交互」换成「token 混合 + 逐 token 前馈」**。它把不同特征域打包成 token，用轻量的 token-mixing（沿 token 维做可学习的混合，而不是完整的 self attention）捕获跨特征交互，再对每个 token 独立过 FFN 做特征变换，整体复杂度对 token 数是线性的。这样做的动机是推荐排序模型要在有限的延迟预算里把参数和算力堆上去，full attention 的 O(n²) 在几十上百个特征 token 上不划算。DLRM 的局限也在这里：只建模二阶交互、强依赖人工特征工程，token 化结构则能自己学高阶组合。

**序列与非序列 token 的生成是两套逻辑**。行为序列按时间切片段，每段一个 token，配位置编码与时间差 embedding，长序列还要截断或做兴趣抽取；非序列特征按域分组打包（同域多值做 pooling），缺失值单独给 embedding，数值特征归一化或分桶。两者的 token 拼在一起送进 block，区别在于序列 token 有顺序、有衰减，不能和非序列混在一起做同一个位置的编码。

**cross attention 与 self attention 的区别要落到 Q/K/V 的来源**：self 的 Q、K、V 都来自同一个序列，建模序列内部关系；cross 的 Q 来自目标侧（候选 item 或用户 query），K、V 来自上下文侧（行为序列、多路召回结果），建模「目标从上下文取什么」，复杂度 O(m·n)。为什么推荐里常用 cross：目标与上下文角色不同、模态不同；强行 self 会让候选互相看见——同一 batch 里不同候选信息串味，污染训练也破坏线上一致性；cross 的 Q 只有目标那几个 token，计算量小得多。但要能补一句：实际结构通常是 self 先建模序列内部、再用 cross 做目标与序列的交互，不是二选一。

**被转去问 Transformer 和 self attention 公式，说明前面的结构题没答到点上**。这部分是保底分，必须张口就来：`Attention(Q,K,V) = softmax(QKᵀ/√d_k)V`，除以 √d_k 是防止点积随维度增大而方差过大、softmax 进入饱和区；多头是把表示切到多个子空间分别做注意力再拼接；每个子层后面接残差和 LayerNorm，最后是 FFN。答完补一句复杂度 O(n²d) 与长序列优化方向（稀疏、线性注意力），把话题拉回自己熟的地方。

**最长回文子串**用中心扩展最稳：枚举 2n−1 个中心（偶数长度中心在两个字符之间），向两边扩，O(n²) 时间、O(1) 空间，不容易写错。DP 版本 `dp[i][j] = s[i]==s[j] && dp[i+1][j-1]` 是 O(n²) 空间；Manacher 能到 O(n)，除非明确要求不必冒写错的风险。ACM 模式要自己处理输入输出，多组输入、换行这些细节先跑通。

**最后一条**：算法岗一面通常 40 分钟里 25 分钟问项目，项目讲不透就没有手撕的时间；给每个项目写一张卡片（定位、结构图、关键 shape、指标与消融、延迟成本），被问到任何一层都能落回它。

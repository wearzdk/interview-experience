---
title: "字节/美团 AI Coding 笔试：5 类必考题型与刷题重点"
company: "字节跳动、美团"
position: "算法工程师"
round: 笔试
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/931584533160312832
tags: ["AI Coding","笔试","手写算子","数据处理","PyTorch","系统设计"]
summary: "字节、美团等大厂 AI Coding 笔试的题型梳理：核心算子手写、pandas 数据处理与特征工程、业务场景化算法题、PyTorch 训练与评估代码题、AI 服务系统设计简答题，并给出每类题的考察重点与备考动作。"
---

### 《面试题目》

1. 手写 softmax，要求数值稳定，并说明为什么必须先减去最大值。
2. 手写交叉熵损失函数，说明 log 里为什么要加极小值，并把梯度推出来。
3. 手写 sigmoid、线性层前向传播、批量归一化（BN）的前向与反向，说明难点在哪。
4. 给定一段 JSON 格式的用户行为日志或一份含缺失值、重复值的 CSV，用 pandas 完成去重、缺失值填充、异常值处理，并提取滑动窗口特征（如用户连续点击同一商品的时间间隔、某用户最近 7 天的活跃天数）。
5. 从百万级 embedding 向量中快速找到与目标向量最相似的一个，该怎么设计？社交网络里判断两个用户是否属于同一兴趣社区、对搜索词做相似度聚类，分别该用什么数据结构与算法？
6. 写一个完整的 PyTorch 训练循环：数据加载、前向传播、损失计算、反向传播、优化器更新、学习率衰减与早停。
7. 实现一个简单的逻辑回归模型，并计算验证集上的 AUC、F1、精确率与召回率。
8. 给定一个预训练好的模型，写推理部分的代码，处理 batch 输入、设备迁移与结果保存。
9. 设计一个低延迟、高可用的智能客服意图识别接口，并给出未识别意图的兜底策略。
10. 设计一个批量推理服务：请求队列管理、超时控制与结果缓存。
11. 实现一个带缓存的大模型问答接口，说明缓存键的设计、缓存失效策略与请求合并逻辑。

### 《参考解析》

**手写 softmax：先减最大值不是可选项**
实现就三行：`x = x - x.max(axis=-1, keepdims=True)`、`e = np.exp(x)`、`p = e / e.sum(axis=-1, keepdims=True)`。原因要说得具体：float32 下 `exp` 的输入超过约 88.7 就上溢成 `inf`，`inf / inf` 直接得到 `nan`，而笔试测试用例几乎一定会构造大输入。减去最大值后最大指数为 0，结果落在 `(0, 1]`，数学上与不减完全等价（分子分母同乘 `e^{-max}`），只是把计算挪进了安全区间。反向也要能背：`dx = p * (dy - (dy * p).sum(axis=-1, keepdims=True))`。追问常落在 `keepdims` 上——漏掉它广播维度就错了；以及按行还是按列做 softmax。

**手写交叉熵：eps 与 log-sum-exp**
两个坑：① `-y * log(p)` 在 `p == 0` 时得到 `inf`，工程上加 `eps = 1e-12` 或先 `np.clip(p, eps, 1.0)`；② 更稳的写法是直接从 logits 算，把 softmax 和 log 合并成 log-sum-exp：`loss = -logits[range(n), y] + logsumexp(logits, axis=1)`，不做两次 log/exp，也不需要 eps。梯度极其简洁：`d = softmax(logits); d[range(n), y] -= 1; d /= n`。追问方向是 label smoothing 和 class weight 怎么进这个公式，以及多标签场景为什么换成 `binary_cross_entropy_with_logits`。

**pandas 数据处理题的答题顺序**
给原始日志的标准流程：`drop_duplicates(subset=[...], keep='last')` → 时间字段 `pd.to_datetime` 并排序 → 缺失值按语义分流（数值走中位数，类别走众数或单开 `unknown` 桶，缺失比例过高的列直接丢）→ 异常值用 3σ 或 IQR 截断而不是直接删行。滑动窗口特征的核心是 `groupby(...).rolling('7D', on='ts')`：近 7 天活跃天数 = 按 `user_id` 分组后对去重日期计数；连续点击同一商品的时间间隔 = 先按 `(user_id, item_id)` 分组求 `ts.diff()`；刷单特征可以构造「同一用户 1 分钟内点击次数」「同 IP 关联账号数」这类计数特征。时间紧时优先把 `groupby` / `rolling` / `merge` 敲熟，能向量化就不要 `.apply`。

**算法与业务场景的映射表**
这类题的全部难点是把题面翻译成数据结构：百万级向量找最近邻，暴力是 `O(N·D)`，工程上先降维再建 ANN 索引（HNSW、IVF-PQ），维度超过 ~20 维时 KD 树剪枝基本失效；判断两个用户是否同社区、岛屿数量这类连通性问题用并查集（路径压缩 + 按秩合并，均摊近 O(1)）；搜索词相似度聚类用编辑距离（DP，`O(mn)`，滚动数组可把空间降到 `O(min(m,n))`）或 SimHash + 汉明距离；TopK 高频用小顶堆或桶排序。答题节奏上，多小问的题先写能过基础用例的暴力解再补优化，不要在第一个小问上耗光时间。

**PyTorch 训练循环与常见失分点**
骨架：`DataLoader(dataset, batch_size, shuffle, num_workers, pin_memory)` → `model.train()` → `optimizer.zero_grad(set_to_none=True)` → `loss.backward()` → `optimizer.step()`；验证阶段必须 `model.eval()` + `torch.no_grad()`。考点集中在几个坑上：忘记 `zero_grad` 会梯度累加；用 `CrossEntropyLoss` 时不要再手动 softmax（它内部已经是 log_softmax + NLL）；`loss` 默认 `reduction='mean'`，分批累加要按样本数加权而不是简单相加；模型和数据都要 `.to(device)`；混合精度用 `torch.cuda.amp.autocast()` 配 `GradScaler`；早停看验证集指标，指标取 `sklearn.metrics` 的 `roc_auc_score` / `f1_score` / `precision_recall_curve`，多分类 AUC 要显式指定 `multi_class='ovr'`。

**AI 服务类设计题：先讲模块划分**
意图识别接口的骨架：接入层（限流、鉴权）→ 分类模型（小模型做高置信度快通道，低置信度升级到大模型或规则）→ 兜底策略（阈值以下返回澄清话术、转人工、记 badcase）。必须主动讲三件事：超时预算怎么分、降级路径（模型不可用时退规则词典，保证不 5xx）、可观测性（置信度分布与转人工率打点）。批量推理服务要点：请求进有界队列（满了背压或拒绝，不要无限堆积），按「等待 20ms」与「最大 batch size」双条件触发组批；缓存键用「模型版本 + prompt 模板 hash + 归一化请求体」，失效走 TTL 加版本号，同键并发请求用 singleflight 合并（一次真实调用，结果广播给所有等待者）。

**备考动作**
这五类题的共同点是「限时内写出能跑的代码」。建议按字节、美团近两年的真题做 90 分钟限时模拟，先跑通基础用例再优化；考后把当场卡住的 API 单独抄一遍并手推一次反向。笔试考的不是写出完美代码，而是在有限时间里展示清晰的工程思路。

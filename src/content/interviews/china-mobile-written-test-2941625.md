---
title: "中国移动专业技术笔试：全技术题无 EPI，单选多选判断加两道手撕"
company: 中国移动
position: "网络与计算机技术（笔试）"
date: '2026-11'
collectedAt: '2026-11-17'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/c207597fdda84af8ad195983ac1b41ff
tags: ["中国移动","笔试","5G","Java","Python","机器学习","sklearn"]
summary: "中国移动专业技术类笔试复盘：整卷全是技术题，没有 EPI、没有提示词调试、没有企业文化题。题型为单选、多选、判断、一道编程填空与两道手撕。单选以计算机与 5G 知识为主，多选以计算机知识为主（如 Java 与 Python 的对比、网络应用层会话机制的防护手段、承载 MIB 的物理信道、QoS flow 标识的英文缩写），编程填空考 sklearn 的核心函数与基本流程，手撕没有 OJ、可自测。"
---

### 《面试题目》

**卷面结构**：全技术题，无 EPI、无提示词调试、无企业文化题。题型为单选、多选、判断、编程填空一道、手撕两道；手撕没有 OJ，可自测。

1. 单选（计算机与 5G 为主）：承载 MIB 的物理信道是哪一个？QoS flow 标识的英文缩写是什么？
2. 多选（计算机知识为主）：Java 与 Python 有哪些差异？
3. 多选：网络应用层会话机制有哪几种防护手段？
4. 编程填空：sklearn 建模的核心函数与基本流程。
5. 手撕两道算法题（无 OJ，可自测）。

### 《参考解析》

**承载 MIB 的物理信道**：5G NR 中 MIB（Master Information Block）由 PBCH 承载，与 PSS / SSS 一起构成 SSB（同步信号块）。MIB 携带的是解调 SIB1 所需的最小系统信息（系统帧号高位、子载波间隔、PDCCH 公共搜索空间配置等），因此它必须在 UE 完成时频同步后立刻能读到，这也是它只能用固定编码与固定资源的原因。

**QoS flow 标识**：QFI（QoS Flow Identifier），5G QoS 模型里承载粒度从 EPS 的 bearer 改为 QoS flow，一个 PDU session 内可以有多个 QoS flow，每个 flow 用 QFI 标识，QFI 与 5QI 配合决定调度与转发策略。相关的还有 5QI（5G QoS Identifier）、ARP（Allocation and Retention Priority）。

**Java 与 Python 的对比要按维度说**：类型系统（静态强类型 vs 动态强类型，前者编译期发现错误、后者靠运行时与类型标注工具）、执行方式（编译为字节码 + JIT vs 解释执行 + 字节码缓存）、并发模型（原生线程 + 线程池 vs GIL 限制下的多线程只适合 IO 密集、CPU 密集用多进程）、内存管理（都有 GC，但 Java 分代与多种收集器可调，Python 用引用计数 + 分代回收）、生态（Java 偏企业后端与大数据，Python 偏数据、算法与脚本）。答题时给出「什么场景选哪个」的结论比罗列语法差异更能拿分。

**应用层会话机制的防护手段**：会话劫持与固定攻击的常见防线包括：全程 HTTPS 传输并对 Cookie 设 Secure / HttpOnly / SameSite；登录后重建会话 ID（防会话固定）；会话 ID 使用足够熵的随机值而非可预测序列；设置空闲超时与绝对超时；关键操作二次校验（重新认证或 CSRF Token）；绑定设备指纹或 IP 段作为辅助风控而非唯一依据；服务端集中存储并支持主动失效（登出、改密后踢下线）。

**sklearn 的基本流程**：`train_test_split` 划分数据 → 预处理（`StandardScaler` / `OneHotEncoder`，用 `Pipeline` 串联避免数据泄漏）→ 实例化模型 → `fit(X_train, y_train)` → `predict` / `predict_proba` → 评估（`accuracy_score`、`classification_report`、`cross_val_score`）→ 调参（`GridSearchCV`）。填空常考的点是：`fit` 只接收训练数据，`transform` 用于推理阶段；`fit_transform` 只能用在训练集上；`Pipeline` 保证预处理只 `fit` 训练折。这两条正是最容易写错的。

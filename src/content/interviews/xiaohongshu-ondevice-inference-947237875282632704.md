---
title: "小红书端侧推理一面：内存峰值、int4 变慢与 KV Cache"
company: "小红书"
position: "端侧推理"
round: "一面"
date: "2026-11"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/947237875282632704"
tags: ["小红书", "端侧推理", "模型量化", "KVCache", "推理优化", "Android"]
summary: "小红书端侧推理一面（60 分钟）：从模型大小、首 token 延迟、内存峰值怎么测问起，深入量化公式与 int4 反而更慢，再问 KV Cache 复用与端云协同，最后手撕 per-channel 对称 int8 量化。"
---

### 《面试题目》

1. 你做的端侧功能是什么？跑在什么芯片上？
2. 模型多大，参数多少，什么精度？
3. 首 token 多少毫秒，decode 多少 token/s？
4. 内存峰值多少？怎么测的？
5. 功耗涨了多少？用户能感知到吗？
6. 机型和系统版本怎么适配？
7. int8 和 int4 的量化公式写一下。
8. 对称量化和非对称量化怎么选？
9. per-tensor 和 per-channel 差在哪？
10. 量化之后精度掉了多少？怎么评的？
11. 哪些层不能量化？
12. 量化校准集怎么选，多少条？
13. 为什么 int4 之后反而更慢了？
14. KV Cache 怎么存的？端上怎么省？
15. 上下文 4K 的时候显存够吗？
16. 多轮对话怎么复用 KV？
17. 用户切到后台，推理任务怎么处理？
18. 端云协同怎么分工？什么情况走云？
19. 网络抖了，端上已经生成了半句，怎么办？
20. 端上模型的效果怎么和云端对齐？
21. 同一句话在不同机型上结果不一样，正常吗？
22. 你怎么做 A/B？端侧灰度怎么放？
23. 模型更新怎么下发？包多大？
24. 用户投诉「回答变笨了」，你怎么定位？
25. 反问
26. 手撕：实现 per-channel 对称 int8 量化

### 《参考解析》

**内存峰值要算四块，不是模型大小。** 权重、KV Cache、激活值、算子临时 buffer。7B 模型 int4 权重约 3.8GB；KV Cache 按 `2 × 层数 × 头数 × head_dim × 长度 × 字节数` 算，2K 上下文几百 MB 到 1GB，取决于是否用 GQA；激活值在 prefill 阶段最大，attention 中间矩阵随长度平方增长；融合不好的算子还会多申请几份同尺寸 buffer。四块叠上 Android 的系统占用与图形内存，6GB 机器被 LMK 杀掉很正常，端上要按最坏机型倒推模型规格。测量用 `dumpsys meminfo` 看 PSS 分项、`VmHWM` 看峰值，并在加载、prefill、decode 三段分别打点——峰值几乎总在 prefill。

**为什么 int4 反而更慢。** 量化省的是读权重的字节数，代价是算之前把 int4 反量化回 fp16。芯片没有原生 4bit 指令时，反量化多一轮 kernel：读 int4、乘 scale、写 fp16 临时 buffer，再交给矩阵乘；模型本身计算受限时这笔开销比省下的带宽更贵。所以要看硬件：访存受限的单请求 decode，int4 能降带宽；有原生低精度指令才值得上。

**KV Cache 怎么省。** GQA/MQA 减 KV 头数；KV 量化到 int8；只留最近窗口加少量 attention sink；复用 system prompt 与多轮共同前缀，按前缀哈希索引，命中不重算 prefill。多轮复用的坑在位置编码：拼接历史时 RoPE 位置要跟着偏移；工具返回插进上下文后，插入点之后的 KV 全失效。4K 上下文在 6GB 机器上不够，产品里通常压到 2K 以内。

**per-channel 对称 int8 量化。** 每个输出通道独立算 scale：`scale = max(|w|) / 127`，`q = round(w / scale)` 并 clip 到 `[-128, 127]`，反量化 `ŵ = q × scale`。按通道而不是整张量，是因为各通道动态范围差得多，共用一个 scale 会把小通道压成 0。

```python
def quant_per_channel(w, bits=8):
    qmax = 2 ** (bits - 1) - 1                    # 127
    amax = np.abs(w).max(axis=1, keepdims=True)   # [out, in] 按 out 取
    scale = np.where(amax == 0, 1e-8, amax / qmax)
    q = np.clip(np.round(w / scale), -qmax - 1, qmax).astype(np.int8)
    deq = q.astype(np.float32) * scale
    err = np.abs(deq - w)
    return q, scale, deq, err.max(), err.mean()
```

坑：全零通道不兜住会除零出 inf；`np.round` 是银行家舍入，和 C 的 `round` 不一致，跨端对齐要统一；对称范围下界是 `-128` 不是 `-127`；轴写错就退化成 per-tensor。

**离群点与 percentile 截断。** 某行最大值若是孤立离群点，`amax` 被拉大、scale 变大，其余数值全被压到很小的量化格上，误差反而升高。做法是取 99.9 分位截断，超出部分 clip 后重算 scale，牺牲极少数大值换更小的均方误差；线上在候选比例上搜索，按校验集 MSE 挑。

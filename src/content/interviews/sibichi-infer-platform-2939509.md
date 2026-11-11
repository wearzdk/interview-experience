---
title: "思必驰训推平台一面：口述 decoder-only 模型处理一次请求"
company: 思必驰
position: 训推平台开发
round: 一面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/d0213ef1a15c4ed7bf175f6b326ca597
tags: ["思必驰","训推平台","大模型推理","Transformer","KV Cache","推理优化"]
summary: "思必驰训推平台一面以项目追问为主，技术题是一道口述题：讲清 decoder-only Transformer 架构处理一次请求的完整流程。帖文只记录到这两个环节。"
---

### 《面试题目》

1. 介绍项目，并追问项目细节。
2. 口述 decoder-only Transformer 架构处理请求的流程。

### 《参考解析》

**整体链路**：请求进入服务后先做分词与模板拼接（system、历史轮次、本轮输入），得到 token 序列；随后分两个阶段执行——预填充（prefill）与逐 token 解码（decode），最后反分词并流式返回。

**预填充阶段**：整个 prompt 一次性送入模型，各层并行计算所有位置的 Q、K、V。自注意力用因果掩码保证每个位置只能看到自己和之前的位置；每层算出的 K、V 写入 KV Cache，供后续解码复用。最后一层的最后一个位置经输出头得到 logits，采样出第一个 token。这一阶段是计算密集型，矩阵乘规模大，GPU 利用率高，耗时直接决定首字延迟（TTFT）。

**解码阶段**：每次只输入上一个 token，重新计算该 token 在各层的 Q、K、V，其中 K、V 追加进缓存；注意力只需用当前 Q 与缓存中的全部 K、V 计算，因此每步的计算量随序列长度线性增长，而参数量固定。瓶颈从算力转为显存带宽——每生成一个 token 都要把模型权重与 KV Cache 读一遍。采样策略（贪心、top-k、top-p、温度）在这一步生效，遇到结束符或达到最大长度即停止。

**关键组件**：多头注意力（含 RoPE 位置编码、GQA/MQA 减少 KV 头数）、前馈网络（常见 SwiGLU）、RMSNorm 与残差、因果掩码；训练与推理的差异在于推理不需要反向传播，可以融合算子、量化权重与缓存。

**平台视角的优化**：连续批处理（continuous batching）把不同请求的 prefill 与 decode 混批，提升吞吐；PagedAttention 用分页管理 KV Cache，减少显存碎片；prefill 与 decode 分离部署，避免长 prompt 阻塞解码；KV Cache 量化与前缀缓存（prefix caching）复用相同系统提示词的计算；投机解码用小模型草稿加目标模型校验降低单 token 延迟。平台需要观测 TTFT、每 token 时间（TPOT）、吞吐与显存占用，并按队列长度做扩缩容与限流。

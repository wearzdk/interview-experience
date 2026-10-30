---
title: "小鹏 深度学习平台研发（27 届校招）：DDP、K8s 调度与拓扑排序"
company: 小鹏集团
position: 深度学习平台研发工程师
round: 校招面试
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/945709685955395584
tags: ["小鹏", "AI Infra", "分布式训练", "DDP", "Kubernetes", "KubeVirt", "拓扑排序"]
summary: "小鹏 27 届深度学习平台研发面经（飞书视频 + 在线代码）：DDP 梯度同步与分桶重叠、H100 与 B200 的差异、LLM 推理 Prefill 与 Decode 的瓶颈、K8s Pod 调度链路与 Pause 容器、KubeVirt 与 Kata 的隔离方案、流式接口的工程坑，手撕 DAG 拓扑排序。"
---

### 《面试题目》

1. DDP 的底层机制是什么？多卡训练时梯度是怎么同步的？
2. 梯度分桶（Bucketing）与计算通信重叠是怎么实现的？
3. DDP 和 DP（DataParallel）有什么区别？
4. H100 和 B200 有什么区别？
5. LLM 推理的瓶颈在哪？
6. 平台怎么管理异构算力？K8s 里的 GPU 调度是怎么做的？
7. K8s 的 Pod 创建与调度链路是怎样的？
8. Pause 容器的作用是什么？
9. K8s、KVM 和 KubeVirt 是什么关系？怎么让 K8s 管虚拟机？
10. 平台对外提供推理服务时，流式（Stream）与非流式（Non-stream）的工程差异是什么？
11. 如果平台做网关，输入输出的过滤与合规审计怎么做？对抗性提示词怎么防？
12. 手撕代码：DAG 的拓扑排序。

### 《参考解析》

**DDP 是「多进程 + 梯度 All-Reduce」，没有主卡**：每个进程持有完整模型副本、读不同的数据分片，反向传播算出各自梯度后，通过 Ring All-Reduce 把梯度求和再平均，使各卡参数保持一致。它绕开了 DP 的单进程多线程模型（DP 受 GIL 限制、且主卡要聚合梯度导致显存与带宽不均）。要注意 DDP 并不省单卡显存——每张卡都有完整模型、优化器状态和梯度；省显存要靠 ZeRO、FSDP 这类分片方案。梯度累积时要配合 `no_sync()`，避免每个 micro-batch 都触发一次通信。

**通信与计算重叠靠「反向传播的顺序性 + 分桶」**：反向传播是从输出层往前逐层算梯度，DDP 把参数梯度按逆序装进若干 bucket，某个 bucket 装满就立刻发起 All-Reduce，同时继续算后面层的梯度，从而把通信藏在计算后面。bucket 太大则启动晚、重叠窗口小；太小则通信次数多、启动开销占比高。调优时通常调 `bucket_cap_mb` 和梯度累积步数，并用 profiler 看 communication 与 compute 的时间轴是否真的重叠。

**H100 与 B200 的对比要落在「带宽 + 精度」上**：Hopper（H100）的 HBM3 带宽约 3 TB/s 级别，Blackwell（B200）用双 die 封装把 HBM3e 带宽推到 8 TB/s 级别，并原生支持 FP4 等更低精度格式，对大模型推理的吞吐提升明显。但低精度要评估精度折损与算子支持，量化不是免费的。这类题只要能说清「为什么带宽决定 Decode 性能」就够，不必背完整规格表。

**LLM 推理分两段，瓶颈完全不同**：Prefill 阶段一次处理整个 prompt，是计算密集（矩阵乘为主），决定首 token 延迟；Decode 阶段逐 token 生成，每步只算一个 token 却要把全部权重和 KV Cache 读一遍，是显存带宽密集，决定吞吐。所以优化 Prefill 靠更强的算力与并行切分，优化 Decode 靠 KV Cache 管理（PagedAttention）、批处理（continuous batching）、量化权重、投机解码。面试官问「瓶颈在哪」，答「哪个阶段、瓶颈是算力还是带宽」才是得分点。

**K8s 管 GPU 的现状是「设备插件 + 调度器扩展」**：kubelet 通过 device plugin 上报 `nvidia.com/gpu` 这类扩展资源，Pod 申请后由调度器按资源余量绑定节点；但原生调度不理解拓扑（NVLink、NUMA、同一台机器上的 GPU 亲和），所以生产上会叠一层调度器（Volcano、Koordinator、自研）做 gang scheduling、队列与配额、拓扑感知。异构算力还要区分型号打标签，避免把任务调到不匹配的卡上。

**Pod 创建链路**：kubectl 提交 YAML → API Server 鉴权、准入（Mutating 再 Validating）→ 写入 etcd → Scheduler 过滤与打分选出节点并回写绑定 → 目标节点 kubelet watch 到变化，调 CRI 拉起容器（先建 sandbox/Pause 容器，再建业务容器）→ CNI 配网络、CSI 挂存储 → 状态回报。Pause 容器的作用是持有 Pod 的网络与 IPC 命名空间，业务容器都加入它，这样容器重启不会丢 IP。

**KubeVirt 的思路是「VM inside Pod」**：通过 CRD 扩展 API 定义 VirtualMachineInstance，用 virt-launcher Pod 承载一个 KVM 进程，把虚拟机当作 Pod 来调度、联网、挂存储，从而让 K8s 统一管理容器与虚拟机。强隔离的另一种做法是 Kata Containers——仍然是容器接口，但每个 Pod 跑在轻量虚拟机里，隔离性接近 VM、启动比传统 VM 快。选型依据是隔离强度、启动时延、以及是否要跑老旧内核或特定框架。

**流式接口的工程坑集中在三处**：一是协议，SSE 适合单向推送、实现简单，WebSocket 适合双向交互；二是用量统计，OpenAI 兼容接口在流式下 `usage` 默认不返回，需要显式开启 `stream_options: {include_usage: true}`；三是内容审核，流式的 chunk 语义不完整，逐块过滤会误杀也会漏放，需要滑动窗口拼接后判定，并对已下发内容做撤回或截断策略。

**拓扑排序（Kahn）**：邻接表建图并统计入度，入度为 0 的入队；循环出队、把邻居入度减一，减到 0 的继续入队；最后比较已输出节点数与总节点数，少于总数说明有环。DFS 版本用三色标记检测环。平台调度里的经典用途是任务依赖编排，答题时顺手提一句「有环要报错而不是死循环」是加分项。

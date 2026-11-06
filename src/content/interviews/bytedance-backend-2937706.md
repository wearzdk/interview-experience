---
title: "字节一面 11.4：CAS、DPDK 与 eBPF、Linux 协议栈、nftables 与 IPVS"
company: 字节跳动
position: "后端开发"
round: "一面"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/d94ba0f203e443eca51ea42fb9ddfd5b
tags: ["字节跳动","后端","CAS","DPDK","eBPF","Linux内核","Go GC"]
summary: "字节一面偏基础架构：自我介绍与 base 意向后问实习为什么没留用，深挖项目与实验室横向项目，再考 CAS 原理与问题、DPDK 与 eBPF 的区别、Linux 协议栈处理流程、netfilter 中 nftables 与 IPVS 的区别、Go 的 GC，最后反问。"
---

### 《面试题目》

1. 个人介绍。
2. 倾向的 base 地。
3. 实习为什么没有留用？
4. 拷打项目背景和方案设计。
5. 实验室横向项目介绍。
6. CAS 原理是什么？存在什么问题？
7. DPDK 的原理是什么，和 eBPF 有什么区别？
8. 介绍一下 Linux 协议栈处理。
9. netfilter 中的 nftables 和 IPVS 有什么区别？
10. 讲一下 Go 的 GC。
11. 反问。

### 《参考解析》

**CAS 是「比较并交换」的原子指令**，比较内存当前值与期望值，相等才写入新值，返回是否成功，CPU 通过 `lock cmpxchg` 一类指令保证原子性。Java 的 `AtomicInteger`、AQS、无锁队列都基于它。问题是自旋开销（高竞争下大量失败重试）、ABA（值被改回原值，可用版本号或 `AtomicStampedReference` 解决）、只能保证一个变量的原子性（多个变量要加锁或封装对象）。高并发下用 LongAdder 分散热点。

**DPDK 是用户态数据面加速**：把网卡交给用户态轮询驱动，配合大页内存、无锁环形队列、CPU 亲和性与零拷贝，绕过内核协议栈，适合高吞吐包处理；代价是独占核、要自己实现协议栈、运维复杂。eBPF 是把程序挂到内核钩子（XDP、tc、kprobe、tracepoint）上，在内核里安全执行，不需要改内核模块，适合观测、过滤、转发与轻量数据处理。两者都能做高性能网络，区别是 DPDK 把数据面搬到用户态、eBPF 留在内核内可编程；XDP 在驱动层就能丢包，转发性能也很好，但复杂状态处理不如用户态灵活。

**Linux 协议栈**：网卡收到包触发中断，驱动走 NAPI 的轮询收包，构建 skb 后经 `netif_receive_skb` 进入协议层；先过 tc/ingress 与 netfilter 的 PREROUTING，再判断是本机还是转发，本机则走 IP 层（路由、分片重组）到传输层（TCP/UDP），最后按四元组找到 socket，唤醒等待的进程；发送路径相反，从 socket 到 TCP 分段、IP 封装、邻居子系统取 MAC，经 qdisc 排队后由驱动发出。中间还有 GRO/GSO、校验和卸载等优化。

**nftables 与 IPVS**：nftables 是包过滤与 NAT 框架，替代 iptables，统一了 ip/ip6/arp/ebtables 的语法，支持集合、映射与更高效的规则匹配；IPVS 是内核四层负载均衡器，基于 hash 表做快速转发，支持 NAT、DR、TUN 三种模式，常配合 keepalived 做 VIP 与健康检查。Kubernetes 里 kube-proxy 的 iptables/ipvs 模式就是两者分工的典型：ipvs 负责 Service 到 Pod 的负载均衡，nftables/iptables 负责 SNAT、masquerade 与策略。

**Go 的 GC**：三色标记加并发清除，配合写屏障保证标记正确性。流程是 STW 的标记准备（开启写屏障、扫描根对象）、并发标记（与用户协程同时运行）、STW 的标记终止、并发清除。为避免标记期间分配过快导致堆膨胀，有辅助标记（mutator assist）；`GOGC` 控制触发阈值，`GOMEMLIMIT` 给软内存上限。Go 的 GC 目标是低延迟，代价是吞吐与 CPU 开销，调优时看 GC 频率、停顿与堆增长，而不是一味调大 GOGC。

**非技术问题**：「实习为什么没留用」不要抱怨，讲客观原因（部门无 HC、方向不匹配）加自己的收获；base 意向给明确优先级，不要含糊。

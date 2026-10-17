---
title: "绿盟 AI 应用开发 Java 一面"
company: "绿盟"
position: "AI 应用开发"
round: "一面"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/a97f2c67de3a45c4be137915c4ec0ca3"
tags: ["绿盟", "Java", "AI应用", "Redis", "分布式"]
summary: "绿盟 AI 应用开发 Java 一面围绕实习收获、项目场景与技术选型展开，技术题重点问 Redis LRU 和主从架构下的主节点选举。"
---

### 《面试题目》

1. 自我介绍。
2. 实习做了什么？最大的收获是什么？
3. 项目里遇到的场景设计题和技术选型怎么考虑？
4. Redis 的 LRU 是怎么实现的？
5. Redis 主从架构中主节点怎么选举？如果让你设计会怎么考虑？

### 《参考解析》

Redis 的 LRU 不是严格链表式 LRU，而是近似 LRU：采样若干 key，淘汰最久未使用的那个。样本数由 maxmemory-samples 控制，采样越多越接近真实 LRU，但 CPU 开销也越高。Redis 还支持 LFU 和随机淘汰，选型要看访问分布和是否允许误淘汰。

主从架构本身不负责自动选主，需要 Sentinel 或 Cluster。Sentinel 通过主观下线、客观下线、领导者选举和故障转移选出新主；Cluster 则按分片和 gossip 协议处理节点状态。设计时要考虑脑裂、旧主恢复、客户端重定向和数据丢失窗口。

项目回答不要只讲“用了 Redis”，要说明为什么需要缓存、缓存什么、如何失效、出现不一致时怎么兜底。

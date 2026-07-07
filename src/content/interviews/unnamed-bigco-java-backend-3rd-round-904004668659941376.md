---
title: 某大厂Java后端三面面经：从疯狂延期到一路狂飙
company: 某大厂
position: 服务端研发工程师
round: 三面
date: '2026-07'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/904004668659941376
tags: ["中间件","缓存","MapReduce","校招"]
summary: "某大厂服务端研发三面面经，一面聚焦本地缓存设计与Hadoop MapReduce执行流程等中间件与大数据基础，整体面试节奏灵活、允许候选人自主协调面试时间。"
---

### 《面试题目》

1. 本地缓存的实现方式有哪些？如何解决缓存数据污染问题？
2. Hadoop MapReduce 的整体执行流程是怎样的？Key 是如何分发到 Reduce 端的？

---

### 《参考解析》

1. **本地缓存数据污染的解决**：常见原因是缓存了脏数据或过期数据未及时淘汰，解法包括设置合理的 TTL/TTI 过期策略、写操作时主动失效对应缓存项、对缓存命中的数据做版本号或时间戳校验，避免读到已经被后端更新前的旧值；污染面较大的场景可以引入缓存分层（本地缓存兜底 + 分布式缓存作为一致性来源）。
2. **MapReduce 的 Key 分发机制**：Map 阶段产出 `(key, value)` 后，Partitioner 会根据 key 的 hash 值对 Reduce 任务数取模，决定该条数据发往哪个 Reduce 节点（即 shuffle 过程），确保相同 key 的数据一定被分到同一个 Reducer，从而支持聚合类计算；默认使用 `HashPartitioner`，也可以自定义分区逻辑处理数据倾斜问题。

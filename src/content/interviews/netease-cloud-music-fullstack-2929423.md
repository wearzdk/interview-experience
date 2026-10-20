---
title: "网易云音乐全栈开发工程师面经"
company: "网易云音乐"
position: "全栈开发工程师"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/443517103437406b9ae5139fd8957962
tags: ["全栈", "Redis", "RoaringBitmap", "Go", "Channel", "Kafka", "AI编程"]
summary: "网易云音乐全栈开发一面，围绕社交媒体采集项目的分表与 RoaringBitmap 省内存、Kafka Go 客户端迁移与 channel 阻塞排查、30 亿用户找被关注最多 Top K、Go 并发与取消、无重复最长子串、Kafka 消费失败处理，以及日常 AI 编程流程。"
---

### 《面试题目》

1. 自我介绍，讲两个参与最深的事情。
2. 为什么用 RoaringBitmap？为什么不用 Set 或普通 Bitmap？
3. RoaringBitmap 的原理是什么？
4. 30 亿用户，找出被关注最多的 Top K，怎么设计？
5. 开 10 个协程写 channel 会怎么样？
6. 怎么实现并发控制？怎么取消 goroutine？
7. 代码：无重复最长子串。
8. Kafka 生产投递成功、消费后写数据库失败，这个任务算失败吗？失败应该怎么做？如果是批量任务呢？
9. 平时怎么用 AI？
10. 反问：全栈偏前端还是后端？公司 AI Coding 比例？用什么客户端？

### 《参考解析》

**RoaringBitmap** 适合稀疏的 64 位 ID 集合：把 ID 分桶，每个桶用数组/位图/运行长度编码里最省的一种，避免普通 Bitmap 按最大 ID 分配空间。Set 存 1 亿 int64 大约要几十 GB，普通 Bitmap 对稀疏 ID 浪费严重。回答时给出估算：元素数量、桶数量、压缩后量级。

**Top K** 如果按被关注 ID 统计，要按被关注 ID 分表/分片，局部 `count group by` 取 Top K，再归并；数据量大可以用 MapReduce/Spark 或流式 Count-Min Sketch 找候选再精确统计。10 个协程写无缓冲 channel 会阻塞，直到有消费者；有缓冲则在缓冲满后阻塞。并发控制可以用 WaitGroup、带缓冲 channel 做信号量、errgroup；取消用 context，`select` 监听 `ctx.Done()`。

**Kafka 失败**：生产端成功只代表消息进了 Broker，消费端写库失败仍是任务失败；处理是重试（指数退避）、死信队列、人工介入，并保证幂等。批量任务如果是一个整体，用事务保证全成或全败；分步任务不能放一个事务，要做幂等和补偿。

**无重复最长子串**用滑动窗口 + 哈希表记录字符最近位置，右指针扩展，遇到重复则左指针跳到重复位置后一位，时间 O(n)。AI 编程流程可以讲“需求拆解—让 AI 出 plan—小步实现—本地测试—组合验证—让 AI 补测试”，重点是每步验收。

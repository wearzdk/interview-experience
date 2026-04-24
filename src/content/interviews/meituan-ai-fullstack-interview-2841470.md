---
title: 美团AI全栈工程师面经
company: 美团
position: AI全栈工程师
round: 两轮技术面
date: '2026-04'
result: Offer
source: 牛客网
tags: ["RAG","MySQL","Redis","分布式锁","线程池"]
summary: "美团AI全栈岗位面试经验分享，涵盖RAG架构优化、ES检索、HTTPS通信、Redis深度原理及MySQL核心机制（MVCC、分布式锁、索引优化）。通过真实面试题与考点解析，助你掌握后端高频面试难点，高效备战大厂面试。"
---

### 《面试题目》

#### 一面 (40min)
1. 实习与项目深度拷打：RAG检索流程，文件上传耗时优化（8s到2s），两阶段检索逻辑，ES选型原因，WebSocket vs SSE。
2. HTTPS通信过程。
3. Redis主从同步过程及常见数据结构（压缩列表连锁更新、哈希表、跳表）。
4. 线程池参数及拒绝策略。
5. 场景题：一亿条数据快速导入MySQL。
6. 场景题：微博大V发帖，用户关注50人且每人千条动态的Feed流实现与数据结构设计。
7. 手撕：链表重排。

#### 二面 (80min)
1. 实习与项目深度拷打：死锁检测、MVCC、SQL优化器实现、B+树原理、隔离级别实现、MySQL内存模型与日志系统、SQL调优。
2. ThreadLocal原理与内存泄漏。
3. 基于MySQL实现分布式锁。
4. 手撕：合并两个有序数组 (O(1)空间复杂度)。
5. AI Coding：实现AI自动提交周报。

---

### 《参考解析》

1. **RAG两阶段检索**：第一阶段粗排快速召回候选集，第二阶段精排（Cross-Encoder）提升准确率，从而平衡性能与效果。
2. **Redis压缩列表连锁更新**：当新增元素导致prevlen长度从1字节变为5字节时，可能引发后续节点的连锁重分配，可通过ziplist结构优化解决。
3. **MySQL分布式锁**：利用 `SELECT ... FOR UPDATE` 或唯一索引冲突实现。需注意设置锁超时时间及处理死锁逻辑，生产环境推荐结合Redis或Zookeeper。
4. **Feed流设计**：采用“拉模型”或“推拉结合”。关注博主列表可用Redis ZSet存储，score为时间戳，利用Redis的交集/并集或缓存队列实现快速分页拉取。
5. **ThreadLocal内存泄漏**：ThreadLocalMap的Key为弱引用，Value为强引用。若线程池未销毁，ThreadLocal对象被回收后，Entry残留Value无法释放，需显式调用 `.remove()`。
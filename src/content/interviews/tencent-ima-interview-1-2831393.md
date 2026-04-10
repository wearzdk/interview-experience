---
title: 腾讯 ima 面经：Agent 项目与高并发后端八股
company: 腾讯
position: ima (Golang)
round: 一面
date: '2026-04'
result: 挂
source: 牛客网
tags: ["Golang","Agent","RAG","Redis","SSE","DDD"]
summary: "腾讯ima岗位一面面经。面试涵盖Agent架构设计、RAG应用实践、SSE与WebSocket区别、DDD领域驱动设计，以及高并发场景下的Redis缓存策略、互斥锁、布隆过滤器与消息队列等后端核心技术八股。"
---

### 面试题目

**项目相关：**
1. 自我介绍
2. Agent 构建流程（组装链 + 执行链）及执行中的降级措施
3. RAG 在项目中的具体使用（作为 advisor 角色）
4. SSE 与 WebSocket 的区别，以及如何在 Trigger 层配置 SSE
5. DDD 领域驱动设计的理解与分层
6. 高并发本地服务平台（黑马点评）的测试并发度及 session 共享实现
7. 无感 token 刷新与权限校验的实现逻辑

**技术八股：**
8. Cache Aside 缓存策略原理
9. 延迟双删的含义及 sleep 时间的确定
10. 互斥锁的实现：SETNX/EX 手写锁与 Redisson 对比
11. 布隆过滤器的原理及如何提高准确度
12. Lua 脚本的原子性实现
13. RabbitMQ 的使用场景及与其他队列对比
14. HyperLogLog 的原理
15. ZSet 底层实现（skiplist + ziplist）

**算法手撕：**
- 最大子数组和（DP 方案）

---

### 参考解析

1. **SSE vs WebSocket**: SSE 是单向通信（服务器到客户端），基于 HTTP，协议简单；WebSocket 是全双工，基于 TCP 握手，适用于复杂交互。
2. **延迟双删**: 目的在于删除缓存后数据库同步前避免脏数据。sleep 时间通常应略大于数据库主从同步的耗时。
3. **Redisson 锁**: 基于 Redis 的 Lua 脚本实现，支持锁的可重入性（Hash 结构存储线程重入次数）和自动续期（Watchdog 机制）。
4. **布隆过滤器**: 利用位数组和多个 Hash 函数。空间效率高但存在误判率，增加 Hash 函数数量可降低误判率，但会增加计算开销。
5. **Lua 原子性**: Redis 执行 Lua 脚本时，会阻塞其他命令执行，从而确保脚本内的多条指令作为一个原子整体完成。
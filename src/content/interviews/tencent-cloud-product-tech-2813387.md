---
title: 腾讯云产品与技术方向一面面经
company: 腾讯云
position: 产品与技术方向
round: 一面
date: '2026-03'
result: 凉经
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2813387
tags: ["腾讯云","Go","TCP","Raft","LSM Tree","LRU"]
summary: "腾讯云产品与技术方向一面记录，以实习和项目深挖为主，涉及 Raft、LSM Tree、TCP 粘包、Go 并发编程和 LRU 手写题。"
---

### 《面试题目》

1. 深挖一段实习项目经历。
2. 介绍 Raft 相关项目的实现和关键问题。
3. 介绍 LSM Tree 相关项目的实现和关键问题。
4. 什么是 TCP 粘包？如何处理？
5. 介绍 Go 的并发编程机制。
6. 手写 LRU 缓存。

### 《参考解析》

1. **TCP 粘包**：TCP 是字节流协议，不保留应用消息边界。应用层可使用固定长度、分隔符或“长度字段加消息体”的协议完成拆包，不能把一次读取等同于一条消息。
2. **Go 并发**：Goroutine 是轻量执行单元，Channel 用于通信同步；工程中还需正确使用 Context 取消、WaitGroup 等待、Mutex 保护共享状态，并避免 Goroutine 泄漏和数据竞争。
3. **Raft**：通过领导者选举、日志复制和多数派提交实现一致性；回答项目时应讲清任期、日志匹配、提交索引及网络分区下的处理。
4. **LSM Tree**：写入先进入内存结构和日志，再刷成有序文件，通过 Compaction 合并；优势是顺序写吞吐高，代价包括读放大、写放大和空间放大。
5. **LRU**：哈希表加双向链表可让查询、更新和淘汰均为 O(1)。

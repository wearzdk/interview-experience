---
title: "得物 后端 二面：SSE、HTTP 协议与 Redis 高可用"
company: "得物"
position: "后端开发"
round: "二面"
date: '2026-10'
source: 牛客网
tags: ["后端", "HTTP", "IO模型", "Kafka", "Redis"]
summary: "得物后端二面，2026-10-18，围绕实习项目、代码知识库更新、SSE、HTTP 请求解析、状态码、HTTP/2 多路复用、TCP 挥手、IO 多路复用、Kafka 消费均衡和 Redis 哨兵展开。"
---

### 《面试题目》

1. 实习项目中你负责的核心内容是什么？详细说一下。
2. 代码大仓知识库，代码变更如何及时更新准确率？
3. 多项目仓库，分支是互相独立还是共用大分支？
4. SSE 协议是如何工作的？
5. Web 服务器解析 HTTP 请求，如何保证请求读取完整？
6. 403 状态码是什么含义？503 状态码是什么含义？
7. HTTP 1.0、1.1、2.0 有什么区别？HTTP/2 的多路复用是怎么做的？
8. TCP 四次挥手的过程是什么？
9. Java 中阻塞 IO 与非阻塞 IO 的区别是什么？
10. select IO 多路复用模型的原理是什么？内核如何知道哪些 fd 已经就绪？
11. 使用 Java NIO 手写一个 Web Server 怎么做？
12. 双向链表只做头尾增删，如何实现线程安全？
13. 实现一个哈希表，按 key 插入顺序进行迭代，如何实现？
14. Kafka 消费者之间如何做消费压力负载均衡？
15. Redis 高可用如何实现？哨兵故障转移期间能否写入？
16. 这段时间不能写入，那系统还可用吗？

### 《参考解析》

**SSE 与 HTTP 解析**：SSE 是基于 HTTP 的长连接，响应头 `Content-Type: text/event-stream`，服务端持续写 `data:`、`event:`、`id:` 等字段，客户端用 `EventSource` 接收，断线自动重连。它适合单向推送，比 WebSocket 轻。HTTP 请求要读完整，服务端需要按 `Content-Length` 读满，或者按 `Transfer-Encoding: chunked` 解析 chunk，还要设最大 body、超时和慢连接保护。403 是禁止访问，503 是服务暂不可用，通常带 `Retry-After`。

**HTTP 版本与 TCP**：HTTP/1.1 默认长连接、支持管道化但受队头阻塞；HTTP/2 用二进制分帧，把请求拆成 stream 和 frame，在同一 TCP 连接上交错发送，实现多路复用，并用 HPACK 压缩头部。TCP 四次挥手是 FIN、ACK、FIN、ACK，主动关闭方最后进入 TIME_WAIT。阻塞 IO 在读写未就绪时挂起线程，非阻塞 IO 立即返回，靠 selector 轮询就绪事件；select 用位图传 fd 集合，内核遍历检查，就绪后标记，fd 数量有限；epoll 用事件表回调，适合大量连接。

**NIO 与数据结构**：Java NIO Web Server 的骨架是 ServerSocketChannel 注册 OP_ACCEPT，selector 循环，接受连接后注册 OP_READ，读请求、解析、写响应，半包要缓存。双向链表头尾增删的线程安全可以用一把锁，也可以头尾各一把锁加哨兵节点，但要注意大小计数和边界。按插入顺序迭代的哈希表可以用 `LinkedHashMap`，底层是哈希表 + 双向链表，或者自己维护 entry 链表。

**Kafka 与 Redis**：Kafka 同一消费者组内，分区分配给不同消费者，rebalance 时按策略重新分；消费者数超过分区数会有空闲。Redis 高可用可以用主从 + 哨兵，或 Cluster。哨兵故障转移期间，旧主可能短暂可写，新主选举后需要客户端刷新；严格说这期间写入可能丢，系统可用但一致性降级。要减少影响，用 `min-replicas-to-write`、WAIT、客户端重试和幂等业务。

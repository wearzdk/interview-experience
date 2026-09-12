---
title: Bigo后端一面面经
company: Bigo
position: 后端开发
round: 一面
date: '2026-09'
source: 牛客网
tags: ["Java", "并发", "JVM", "Redis", "MCP"]
summary: "Bigo后端一面面经，系统考察Java集合与并发、JVM、网络、Redis、消息队列和AI项目实践。"
---

### 《面试题目》

1. HashMap 的数据结构、扩容和负载因子是什么？
2. ConcurrentHashMap 如何做并发控制？HashMap 如何实现线程安全？
3. 公平锁、非公平锁和可重入锁分别是什么意思？
4. ThreadLocal 的数据结构是什么？为什么 key 设计为 ThreadLocal 对象？
5. ThreadPoolExecutor 的核心参数、执行流程和拒绝策略是什么？
6. GC 如何排查？JVM 内存模型和对象晋升过程是什么？
7. 死锁的四个必要条件是什么？如何破坏这些条件？
8. TCP 四次挥手、TIME_WAIT 和 HTTP 请求全流程是什么？
9. Redis 缓存与数据库如何保证一致性？覆盖缓存为什么可能产生脏数据？
10. SSE 和 WebSocket 有什么区别？MCP Server 如何设计？
11. MCP 客户端如何传递鉴权信息实现工具权限管控？
12. 如何让三个线程交替打印 `ABC` 100 次？

### 《参考解析》

1. **HashMap 与并发**：HashMap 使用数组加链表或红黑树，容量达到阈值后扩容；它本身不保证并发安全。ConcurrentHashMap 通过 CAS、桶级同步等机制降低锁粒度，适合并发读写。
2. **ThreadLocal**：每个线程持有自己的 ThreadLocalMap，ThreadLocal 实例作为弱引用 key。使用完应及时 `remove()`，在线程池中尤其要避免旧值泄漏到后续任务。
3. **缓存一致性**：更新数据库后删除缓存是常见 Cache-Aside 策略；并发读写下仍需处理删除失败和重建窗口，通常借助重试、消息补偿或短暂互斥降低风险。
4. **MCP 权限**：客户端传递可验证的身份凭据，服务端根据身份、工具和资源范围执行授权；模型只能提出工具调用，不能自行扩大权限。

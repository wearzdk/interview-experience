---
title: 6.1pdd服务端 java一面
company: 某互联网公司
position: 软件开发工程师
round: 一面
date: '2026-06'
result: OC
base: 江苏
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2859330
tags: ["Java", "Redis", "计算机网络", "操作系统"]
summary: "某互联网公司软件开发工程师一面面经，考察Java、Redis、计算机网络等核心知识点。包含真实面试题目与解析，适合准备软件开发工程师面试的求职者参考备考。"
---

### 《面试题目》

1. 手撕718. 最长重复子数组 （但是有序）要求优化时间复杂度
1. 本地缓存未命中，redis命中，怎么处理？
2. 项目中用了redis那些数据结构？rehash过程？
3. 多线程执行a++是否线程安全，为什么，怎么解决？锁的底层实现原理？
4. 数据从网卡到socket缓冲区的流程？
5. ip协议和tcp协议区别？
6. tcp三次握手过程？为什么不是两次？socket连接是什么时候建立的？

**全程1h**

---

### 《参考解析》

1. **计算机网络**：TCP（传输控制协议）是面向连接、可靠的传输协议，提供流量控制和拥塞控制；UDP（用户数据报协议）是无连接、不可靠但速度更快的协议。TCP通过三次握手建立连接（SYN→SYN+ACK→ACK），四次挥手断开（FIN→ACK→FIN→ACK）。

2. **Redis核心**：Redis常用数据结构：String/Hash/List/Set/ZSet。持久化：RDB（定期快照，恢复快，数据可能丢失）和AOF（追加日志，数据安全，文件大）。缓存穿透用布隆过滤器；缓存雪崩加随机过期时间+多级缓存；缓存击穿用互斥锁或逻辑过期。分布式锁用SET key value NX PX + Lua脚本保证原子释放。

3. **Java并发**：Java并发：synchronized关键字（偏向锁→轻量级锁→重量级锁升级）；ReentrantLock（可重入、可中断、公平锁）；volatile（内存可见性+禁止指令重排，不保证原子性）；CAS（Compare-And-Swap，无锁乐观并发）；ThreadLocal（线程本地变量，WeakReference，注意内存泄漏）。线程池核心参数：corePoolSize/maximumPoolSize/keepAliveTime/workQueue/handler。

4. **算法题解析**：常用算法思路：动态规划（状态转移方程，自底向上）；BFS/DFS（图遍历，BFS找最短路，DFS回溯）；双指针（有序数组去重/两数之和）；滑动窗口（子串/子数组问题）；二分查找（有序或单调性）。时间复杂度分析：关注最坏情况和平均情况。

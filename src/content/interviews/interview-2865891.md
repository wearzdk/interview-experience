---
title: 字节红果短剧一面
company: 字节跳动
position: 软件开发工程师
round: 一面
date: '2026-06'
result: OC
base: 江苏
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2865891
tags: ["Java", "MySQL", "计算机网络"]
summary: "字节跳动软件开发工程师一面面经，考察Java、MySQL、计算机网络等核心知识点。包含真实面试题目与解析，适合准备软件开发工程师面试的求职者参考备考。"
---

### 《面试题目》


**自我介绍**
1. b+树对比 b 树，innodb 为什么采用 b+树
2. Java 四种引用类型
3. ThreadLocal 底层实现
4. MySQL 执行一条查询的流程
5. 数据库事务四特性及其如何实现的
6. http 和 https 的区别
7. DNS 域名解析的工作流程？
45. 跳跃游戏 II
207. 课程表

---

### 《参考解析》

1. **计算机网络**：TCP（传输控制协议）是面向连接、可靠的传输协议，提供流量控制和拥塞控制；UDP（用户数据报协议）是无连接、不可靠但速度更快的协议。TCP通过三次握手建立连接（SYN→SYN+ACK→ACK），四次挥手断开（FIN→ACK→FIN→ACK）。

2. **MySQL深度**：MySQL InnoDB使用B+树索引，支持ACID事务。关键知识点：聚簇索引（主键索引）叶节点存完整行数据；辅助索引叶节点存主键值（需回表）；MVCC通过undo log版本链+ReadView实现多版本并发控制，解决脏读/不可重复读；事务隔离级别从低到高：读未提交→读已提交→可重复读（默认）→串行化。

3. **Java并发**：Java并发：synchronized关键字（偏向锁→轻量级锁→重量级锁升级）；ReentrantLock（可重入、可中断、公平锁）；volatile（内存可见性+禁止指令重排，不保证原子性）；CAS（Compare-And-Swap，无锁乐观并发）；ThreadLocal（线程本地变量，WeakReference，注意内存泄漏）。线程池核心参数：corePoolSize/maximumPoolSize/keepAliveTime/workQueue/handler。

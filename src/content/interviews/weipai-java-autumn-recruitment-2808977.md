---
title: 微派 Java 秋招面经（排序挂）
company: 微派
position: Java后端开发
round: 三轮技术面+HR面
date: '2026-03'
result: 排序挂
source: 牛客网
tags: ["Java","Redis","MySQL","HTTP-WebSocket","分布式锁"]
summary: "本篇面经记录了微派Java秋招面试全过程，涉及Java并发编程、分布式锁、Redis集群架构与数据持久化、MySQL事务与索引优化、HTTP协议与长连接机制。同时涵盖了实习经历深度挖掘、系统设计题及综合素质考察，为备考Java后端的同学提供核心技术复习路径。"
---

### 面试题目

#### 一面
1. synchronized 和 ReentrantLock 区别
2. ReentrantLock 公平锁与非公平锁实现原理
3. 对象调用被子类重写的方法，JVM 底层实现原理
4. 分布式锁实现方案
5. WebSocket 底层实现原理
6. WebSocket 和 HTTP 长连接的区别
7. DFS 深度过深导致栈溢出如何处理
8. 实习经历深挖
9. 算法题：打家劫舍 III

#### 二面
1. 自我介绍
2. 实习亮点及核心贡献
3. Redis：主从模式下，主节点写入后未同步即宕机，分布式锁安全性分析
4. Redis：主从、哨兵、Cluster 的区别优缺点
5. Redis：数据类型组成及扩容机制
6. Redis：如何查看 Key 占用内存
7. MySQL：事务实现原理 (MVCC/日志)
8. MySQL：宕机重启后的数据一致性与丢失问题
9. MySQL：索引选择策略与底层 B+ 树实现
10. HTTP：请求报文结构、长连接机制及断开场景
11. 场景题：微信加好友功能设计（接口定义与表结构）
12. 算法题：面试官现场出题
13. 综合题：技术成长的路径、职业规划、离职原因

#### 三面与HR面
1. 对转语言（Go）的看法、学习方法与底层原理探究
2. 实习中的挑战、收获及主动解决问题的案例
3. 技术框架执念、程序员责任心、项目进度压力处理
4. 对新技术（Agent）的了解
5. HR面：个人背景、离职原因、求职考量因素、实习反馈、职业规划等

---

### 参考解析

1. **ReentrantLock实现**：通过AQS（AbstractQueuedSynchronizer）实现，利用CAS操作和volatile变量state记录锁状态，公平锁通过判断等待队列中是否有前驱节点来决定是否抢占。
2. **MySQL事务实现**：依赖Redo Log实现持久性（ACID中的D），Undo Log实现原子性，MVCC（多版本并发控制）结合锁机制实现隔离性。
3. **Redis分布式锁问题**：在主从切换时，若锁信息未同步到从节点，新主节点会丢失锁。生产环境建议使用Redlock算法或基于Redis Cluster的强一致性方案。
4. **MySQL索引选择**：MySQL通过优化器根据成本评估（cost）选择索引，涉及扫描行数估算、是否回表、排序/分组开销等，底层通常是B+树。
5. **WebSocket与HTTP长连接**：WebSocket是基于HTTP协议握手后升级为全双工通信协议，支持服务端主动推送；HTTP长连接（Keep-Alive）主要用于复用TCP连接以减少握手开销。
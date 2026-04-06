---
title: 网易有道Java服务端日常实习一面面经
company: 网易有道
position: Java服务端日常实习
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","并发编程","JVM","Linux","算法"]
summary: "网易有道Java服务端日常实习一面面经，面试时长50分钟。涵盖Java基础（Integer缓存、Stream与for对比）、JVM内存管理与OOM排查、并发编程（线程池与阻塞）、Linux命令与权限、幂等性实现及扫码登录流程等核心考点。"
---

### 《面试题目》
1. 自我介绍
2. 算法题：反转二叉树
3. 为什么从上一家离职
4. 实习中最有成就感的地方
5. 幂等如何实现
6. OOM讲一下
7. 编程题：Integer对象比较（==运算符）
8. 一个整数 * 256 的快速计算方法
9. 最快获取Map对应关系的方法
10. 32个线程并发控制方案
11. 扫码登录的交互流程
12. for循环与Stream流的区别及选型
13. Linux进程管理：杀死进程与查询PID
14. Linux内存占用查看方式
15. Linux文件权限644的含义

---

### 《参考解析》
- **Integer比较**：`a==d`为false（缓存区外），`b==c`为false（new对象地址不同）。需掌握IntegerCache范围（-128~127）。
- **快速计算**：使用位移运算 `n << 8`，比乘法指令效率更高。
- **并发控制**：使用 `Semaphore(32)` 信号量，或者自定义固定大小的 `ThreadPoolExecutor` 并配合 `CallerRunsPolicy` 拒绝策略。
- **OOM分析**：需从堆内存溢出（Heap Space）、元空间（Metaspace）、栈溢出（StackOverflow）及直接内存角度分析，并提及使用 `jmap`、`MAT` 分析堆转储文件。
- **Linux权限**：644表示所有者可读写（4+2）、所属组可读（4）、其他人可读（4）。
- **扫码登录**：基于Token或Session。流程：APP扫码获取UUID，向服务器请求绑定；服务器将二维码状态置为“已扫码”，用户确认后回调授权，前端轮询或长连接感知状态变化。
---
title: 字节跳动后端（大模型安全）实习二面面经
company: 字节跳动
position: 后端开发实习生（大模型安全方向）
round: 二面
date: '2026-03'
source: 牛客网
tags: ["Redis分布式锁","Java","StringBuilder","HashCode","MySQL优化","算法"]
summary: "字节跳动后端实习（大模型安全方向）二面面经，涉及Redis分布式锁、Java StringBuilder与StringBuffer区别、HashCode实现原理、MySQL慢查询优化，以及压缩字符串展开与重压缩算法题，适合备战字节后端实习面试。"
---

## 面试题目

### 项目相关

1. 自我介绍
2. 项目介绍
3. 项目中用了什么锁来实现多进程同步？
4. 详细讲解 Redis 分布式锁的应用场景与工作流程。

### 算法题

5. **改版压缩字符串**（非 LeetCode 原题）：给定一个带有括号和数字的字符串，数字表示括号内内容的重复次数，要求先将字符串完全展开，再重新压缩为不含括号的压缩字符串格式。
   - 示例思路：先用栈展开嵌套结构，再对展开结果按字符计数重新压缩。

### Java 基础

6. StringBuilder 和 StringBuffer 的区别是什么？
7. StringBuffer 具体是怎么实现线程安全的？
8. StringBuilder 和 StringBuffer 哪个代价更大？
9. 了解 HashCode 吗？Java 里 HashCode 具体是怎么实现的？

### 数据库

10. MySQL 查询比较慢的原因可能有哪些？如何优化？（能回答多少说多少）

### 其他

11. 个人情况询问
12. 反问环节

---

## 参考解析

### Redis 分布式锁工作流程

- 使用 `SET key value NX PX timeout` 命令原子性地获取锁，NX 保证只有一个客户端能设置成功，PX 设置过期时间防止死锁。
- 释放锁时需用 Lua 脚本保证「判断 + 删除」的原子性，避免误删其他客户端的锁（value 通常用唯一 UUID 标识持有者）。
- 高可用场景可使用 Redlock 算法，在多个独立 Redis 节点上依次加锁，多数节点成功才认为加锁成功。

### StringBuilder vs StringBuffer

- **线程安全**：StringBuffer 所有公开方法加了 `synchronized`，线程安全；StringBuilder 无同步，非线程安全。
- **性能**：StringBuilder 无锁开销，单线程场景性能更高；StringBuffer 因 `synchronized` 代价更大。
- **底层实现**：两者均继承 AbstractStringBuilder，内部用 `char[]`（Java 9+ 为 `byte[]`）存储，动态扩容策略相同（不足时扩容为原容量 2 倍 + 2）。

### Java HashCode 实现

- Object 的默认 hashCode 由 JVM 基于对象内存地址（或其他算法，如随机数）生成，是一个 native 方法。
- String 重写了 hashCode，采用多项式滚动哈希：`s[0]*31^(n-1) + s[1]*31^(n-2) + ... + s[n-1]`，选 31 是因为其为质数且便于位运算优化（`31*i == (i<<5) - i`）。
- HashMap 中对 hashCode 还会做扰动处理（`(h = key.hashCode()) ^ (h >>> 16)`），减少低位碰撞。

### MySQL 慢查询原因与优化

- **原因**：未命中索引（全表扫描）、索引设计不合理（区分度低/未覆盖）、JOIN 表过多、数据量大、锁等待、慢 SQL 未分页、服务器资源瓶颈。
- **优化方向**：EXPLAIN 分析执行计划，针对性建立复合索引；避免在索引列上使用函数或隐式类型转换；大表分页用游标替代 LIMIT offset；读写分离与分库分表；开启慢查询日志定位问题 SQL。

### 压缩字符串算法思路

- **展开阶段**：用两个栈（字符串栈 + 数字栈），遇到数字入数字栈，遇到 `[` 当前字符串入栈，遇到 `]` 弹出数字和字符串拼接，最终得到完整展开字符串。
- **压缩阶段**：遍历展开字符串，统计连续相同字符的数量，长度为 1 时直接输出字母，大于 1 时输出 `字母+数字`，注意边界处理防止索引越界。
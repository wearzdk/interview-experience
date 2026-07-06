---
title: 快手Java开发实习生（商业化）一面面经
company: 快手
position: Java开发实习生（商业化）
round: 一面
date: '2026-05'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/888396414412156928
tags: ["Java","ConcurrentHashMap","MVCC","MySQL","Redis"]
summary: "快手商业化方向Java实习一面面经（2026.5.22），AI侧考察MCP与Function Calling的区别及LLM幻觉成因，Java侧深挖ConcurrentHashMap锁升级原理、MySQL MVCC在读已提交与可重复读下的差异、B+树索引实现，以及Redis分布式锁与缓存穿透雪崩方案，附环形链表II算法题。"
---

### 《面试题目》

**项目1**
1. 用户画像是什么？
2. MCP 和 Function Calling 的区别，以及各自适应场景？
3. LLM 出现幻觉的原因、怎么解决？

**项目2 / Java基础**
1. ConcurrentHashMap 的原理
2. 偏向锁、轻量级锁、重量级锁
3. CAS 在使用过程中会出现什么问题
4. 线程池工作原理

**MySQL**
1. MVCC 实现原理
2. 读已提交和可重复读的 MVCC 中的区别
3. MySQL B+树索引的实现
4. 主键索引和非主键索引的区别

**Redis**
1. 数据结构有哪些
2. Redis 为什么快
3. 缓存穿透和雪崩问题，解决方案
4. Redis 如何做分布式锁

**算法**
1. 环形链表 II

---

### 《参考解析》

1. **MCP vs Function Calling**：Function Calling 是模型层面的能力——模型根据预定义的函数 Schema 判断是否调用及生成调用参数，具体的函数执行逻辑完全由调用方（应用层）实现，属于"一对一"绑定；MCP（Model Context Protocol）是一套标准化协议，让不同的工具/数据源以统一的方式暴露给任意支持 MCP 的模型客户端，实现"多对多"的工具生态互通，减少每个应用都要为每个模型重新适配工具接口的重复工作。
2. **CAS 的问题**：ABA 问题（值从A改为B又改回A，CAS无法感知期间发生过变化，可用版本号/时间戳解决）、自旋开销（长时间竞争失败会持续占用 CPU 自旋重试）、只能保证单个共享变量的原子操作（多个变量的联合操作需要用锁或 `AtomicReference` 包装成一个对象）。
3. **读已提交 vs 可重复读的 MVCC 差异**：读已提交（RC）级别下，每次快照读都会生成一个新的 Read View，因此同一事务内两次查询可能读到不同的结果（不可重复读）；可重复读（RR）级别下，事务内只在第一次快照读时生成 Read View，之后复用同一个 Read View，保证同一事务内多次读取结果一致。
4. **环形链表 II（找环入口）**：用快慢指针（Floyd判圈算法）先判断链表是否有环——快指针每次走两步、慢指针每次走一步，若相遇则有环；相遇后将其中一个指针重置到头节点，两指针都改为每次走一步，再次相遇的节点即为环的入口，这是基于数学推导（起点到环入口的距离等于相遇点到环入口的距离）得出的经典解法。

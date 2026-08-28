---
title: "合肥某小厂java后端面试"
company: "某公司"
position: "Java后端开发工程师"
date: '2026-07'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2874094
tags: ["Java","Redis","MySQL","JVM","Spring","Docker"]
summary: "某公司Java后端开发工程师面试记录，覆盖Java、Redis、MySQL、JVM等考点，整理了面试流程与高频问题。"
---

### 《面试题目》

1. 说说类加载机制
2. 类是什么时候被jvm加载的
3. Jvm故障如何排查,用什么工具
4. Thread和Runnable区别
5. synchronized是公平锁吗?可重入吗?
6. 和ReentrantLock有什么区别
7. 大批量卡卷导入是怎么做的,逻辑格式校验呢?
8. 如果有两个运营同时导入同一个卡卷呢?
9. 你数据库事务怎么做的
10. 那大文件断点续传怎么做?
11. 如果很多文件很大,要找出前100小的怎么做
12. Spring bean生命周期知道吗
13. Mybatis了解吗,插件了解吗
14. Page helper底层是怎么做的
15. 你知道spring自带的缓存注释吗(我说没用过用的都是redis和guava
16. Redis怎么实现分布式锁的
17. 你拼团原子预占怎么做的
18. 如果数据库失败你怎么补偿reids

### 《参考解析》

1. Redis常用于缓存、分布式锁和计数。缓存与数据库更新通常采用“先写数据库、再删除缓存”，并通过重试、延时双删或消息补偿处理删除失败。
2. MySQL索引通常使用B+树，叶子节点按顺序连接，适合范围查询；设计索引时结合选择性、最左匹配原则和执行计划，避免无效索引与回表开销。
3. 并发问题应先明确共享状态和一致性边界，再选择锁、CAS或队列。线程池需要根据任务是CPU密集还是IO密集设置核心线程数、队列容量和拒绝策略，并监控活跃数与队列长度。

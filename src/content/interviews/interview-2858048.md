---
title: 捷文陌陌java笔试
company: 某互联网公司
position: 软件开发工程师
round: 笔试
date: '2026-05'
base: 湖南
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2858048
tags: ["Java", "MySQL", "Redis", "算法"]
summary: "某互联网公司软件开发工程师笔试面经，考察Java、MySQL、Redis等核心知识点。包含真实面试题目与解析，适合准备软件开发工程师面试的求职者参考备考。"
---

### 《面试题目》


**一共20道选择题**
1. 逆波兰式
2. 堆中的串
3. mysql中并发控制和事务
4. string类型写在不同的地方处于jvm中的哪个位置
5. 邻接矩阵
6. redis的master
7. 执行什么sql语句不会返回null
8. 插入排序
9. sql中的预处理指令
10. liunx系统的指令
11. mysql中封锁机制
12. 给你一个算法 让你判断时间复杂度
13. 什么情况会发送option请求
14. redis中的SCAN指令
15. 逻辑题（考充分必要条件）
16. 一共3道编程题，核心代码模式
1. 给你n个节点，这个树符合中序遍历单调递增，有多少种组织方式
2. 给你一个数组和一个范围，要求算出有多少个连续，非空的子数组。并且子数组的最大值处于给的范围中
3. 我有点不太记得清楚了，好像可以使用滑动窗口或者贪心（我没写来）
4. 还是得多练，加油！！！

---

### 《参考解析》

1. **MySQL深度**：MySQL InnoDB使用B+树索引，支持ACID事务。关键知识点：聚簇索引（主键索引）叶节点存完整行数据；辅助索引叶节点存主键值（需回表）；MVCC通过undo log版本链+ReadView实现多版本并发控制，解决脏读/不可重复读；事务隔离级别从低到高：读未提交→读已提交→可重复读（默认）→串行化。

2. **Redis核心**：Redis常用数据结构：String/Hash/List/Set/ZSet。持久化：RDB（定期快照，恢复快，数据可能丢失）和AOF（追加日志，数据安全，文件大）。缓存穿透用布隆过滤器；缓存雪崩加随机过期时间+多级缓存；缓存击穿用互斥锁或逻辑过期。分布式锁用SET key value NX PX + Lua脚本保证原子释放。

3. **JVM与GC**：JVM内存模型：堆（对象分配，GC管理）、方法区（类信息、常量池）、虚拟机栈（栈帧/局部变量/操作数栈）、本地方法栈、程序计数器。GC算法：标记-清除（内存碎片）、标记-整理（无碎片，但移动对象）、复制（新生代）。G1按Region划分堆，预测停顿时间。

4. **Java并发**：Java并发：synchronized关键字（偏向锁→轻量级锁→重量级锁升级）；ReentrantLock（可重入、可中断、公平锁）；volatile（内存可见性+禁止指令重排，不保证原子性）；CAS（Compare-And-Swap，无锁乐观并发）；ThreadLocal（线程本地变量，WeakReference，注意内存泄漏）。线程池核心参数：corePoolSize/maximumPoolSize/keepAliveTime/workQueue/handler。

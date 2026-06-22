---
title: 袋鼠云 Java 一面面经
company: 袋鼠云
position: 软件开发工程师
round: 一面
date: '2026-05'
result: 凉经
base: 海南
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2848884
tags: ["Java", "Spring", "计算机网络", "操作系统", "算法", "设计模式"]
summary: "袋鼠云软件开发工程师一面面经，考察Java、Spring、计算机网络等核心知识点。包含真实面试题目与解析，适合准备软件开发工程师面试的求职者参考备考。"
---

### 《面试题目》

1. 自我介绍
2. 项目拷打
3. 讲讲项目里的动态路由，有什么应用场景
4. 讲讲项目里的频繁实例化改成单例模式的思路
5. 你说你是用火焰图排查的，为什么要用火焰图
6. 这个实例对象真的是问题而不是特殊设计吗？你怎么确认
7. 优化前后有数据检验吗？
8. 你的修改和团队讨论并上线生产了吗？
1. 线程池的主要参数
2. 线程池的拒绝策略
3. 线程池的线程什么时候初始化？
4. Spring的自动装配
5. 讲讲 NameNode 和 DataNode
6. SecondaryNameNode 是做什么的
7. [牛泪][牛泪][牛泪]已老实。。

---

### 《参考解析》

1. **Spring框架**：Spring IoC容器管理Bean生命周期，核心是依赖注入（DI）。AOP面向切面编程通过动态代理（JDK/CGLIB）实现横切关注点（日志/事务/权限）。Spring事务传播行为：REQUIRED（加入现有或新建）、REQUIRES_NEW（挂起当前，新建）、NESTED（嵌套事务）等。

2. **Java并发**：Java并发：synchronized关键字（偏向锁→轻量级锁→重量级锁升级）；ReentrantLock（可重入、可中断、公平锁）；volatile（内存可见性+禁止指令重排，不保证原子性）；CAS（Compare-And-Swap，无锁乐观并发）；ThreadLocal（线程本地变量，WeakReference，注意内存泄漏）。线程池核心参数：corePoolSize/maximumPoolSize/keepAliveTime/workQueue/handler。

3. **算法题解析**：常用算法思路：动态规划（状态转移方程，自底向上）；BFS/DFS（图遍历，BFS找最短路，DFS回溯）；双指针（有序数组去重/两数之和）；滑动窗口（子串/子数组问题）；二分查找（有序或单调性）。时间复杂度分析：关注最坏情况和平均情况。

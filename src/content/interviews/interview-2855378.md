---
title: 跳槽被问烂的 Java 问题，答不上直接无缘 offer
company: 某互联网公司
position: 软件开发工程师
date: '2026-05'
base: 河北
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2855378
tags: ["Java", "Spring", "操作系统"]
summary: "某互联网公司软件开发工程师面经，考察Java、Spring、操作系统等核心知识点。包含真实面试题目与解析，适合准备软件开发工程师面试的求职者参考备考。"
---

### 《面试题目》

1. java 程序员跳槽面试里，总有一批反复出镜的经典考题，看似老生常谈，却是筛选人才的核心门槛，一旦回答卡顿含糊，基本与心仪 offer 失之交臂。
2. 日常埋头做业务开发，不少人只会基础代码调用，面对底层深挖问题就无从作答。集合源码、JVM 调优、多线程并发、Spring 运行机制、数据库性能优化等，都是每场面试高频必考内容。
3. 如今岗位竞争日趋激烈，企业不再只看代码实操能力，更看重技术原理理解与问题排查思维。想要顺利跳槽升职，务必吃透这些高频考点，结合项目经验梳理答题逻辑，补齐技术短板，才能从容应对面试考核，稳稳拿下满意工作。

---

### 《参考解析》

1. **Spring框架**：Spring IoC容器管理Bean生命周期，核心是依赖注入（DI）。AOP面向切面编程通过动态代理（JDK/CGLIB）实现横切关注点（日志/事务/权限）。Spring事务传播行为：REQUIRED（加入现有或新建）、REQUIRES_NEW（挂起当前，新建）、NESTED（嵌套事务）等。

2. **JVM与GC**：JVM内存模型：堆（对象分配，GC管理）、方法区（类信息、常量池）、虚拟机栈（栈帧/局部变量/操作数栈）、本地方法栈、程序计数器。GC算法：标记-清除（内存碎片）、标记-整理（无碎片，但移动对象）、复制（新生代）。G1按Region划分堆，预测停顿时间。

3. **Java并发**：Java并发：synchronized关键字（偏向锁→轻量级锁→重量级锁升级）；ReentrantLock（可重入、可中断、公平锁）；volatile（内存可见性+禁止指令重排，不保证原子性）；CAS（Compare-And-Swap，无锁乐观并发）；ThreadLocal（线程本地变量，WeakReference，注意内存泄漏）。线程池核心参数：corePoolSize/maximumPoolSize/keepAliveTime/workQueue/handler。

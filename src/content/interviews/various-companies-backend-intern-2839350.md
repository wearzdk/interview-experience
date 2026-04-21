---
title: 26届后端java-go求职心得与面经汇总
company: 多公司汇总
position: 后端开发-实习生
date: '2026-04'
base: 成都
source: 牛客网
tags: ["Java","Spring","JVM","并发编程","算法","微服务"]
summary: "整理26届后端Java-Go求职面经，涵盖滴滴、虎牙、晓多科技等多家公司。涉及Java基础、Spring原理、JVM调优、并发编程、Android底层及算法面试题。总结大厂与中小型公司面试风格差异及简历项目准备心得。"
---

### 面试题目

**致远互联**
- 一面：如何解决客户报出的问题？（前端定位到后端接口流程）；如何在无头服务器定位问题？（jps, jstack工具分析线程及业务逻辑）。
- 二面：针对工作内容多为工单解决、代码编写量少的问题，询问接受度。
- 三面：HR考察稳定性与岗位适配度。

**成都阳程智启软件**
- 数据库：MySQL与PostgreSQL区别。
- AI专题：Agent项目开发经验，提示词窗口限制处理，向量数据库在Agent中的作用。

**北京北方新宇**
- 笔试：Java语言特性、HTML原生、数据库连接查询。
- 一面：Union与Union All语义；Java并发编程线程安全保证机制；优缺点分析；印象深刻的项目。

**虎牙**
- 算法：String类型实现两数相加。
- Android专项：Android消息机制、View测量/布局/绘制、BitMap压缩策略、Parcelable与Serializable区别、事件分发机制。

---

### 参考解析

- **无头服务器故障排查**：使用`jps`查看Java进程ID，通过`jstack <pid>`导出线程栈。重点观察处于RUNNABLE或BLOCKED状态的线程，结合业务堆栈定位死锁或高CPU占用代码段。
- **Union vs Union All**：`Union`会对结果进行去重并排序，性能较低；`Union All`直接合并结果集，不进行去重，处理大数据量时效率明显高于前者。
- **Java线程安全**：常用手段包括使用`synchronized`关键字加锁、`ReentrantLock`显式锁、`volatile`保证可见性，以及使用原子类（如`AtomicInteger`）和并发容器（如`ConcurrentHashMap`）。
- **Android View绘制流程**：核心为`measure`（测量大小）、`layout`（确定位置）、`draw`（绘制图像）。三个阶段通过递归遍历View树完成，是Android UI开发的核心面试点。
---
title: "同行者科技 Android 一面：Activity 生命周期、协程与 Handler"
company: "同行者科技"
position: "Android 开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/dff9d956b9724af986ea7f489fb9270d
tags: ["Android", "Kotlin", "协程", "Handler", "Activity", "一面"]
summary: "同行者科技 Android 一面：自我介绍后讲笔试题（空调控制逻辑、UI 布局改错、1000 个整数找重复），再问 Activity 生命周期与启动模式、任务栈、Kotlin 挂起函数、Handler 与 Looper 的死循环为什么不会卡主线程。"
---

### 《面试题目》

1. 简单自我介绍一下。
2. 讲解笔试题：空调控制逻辑题、UI 布局改错题、重复整数查找算法题（1000 个整数中找出重复的那个数）。
3. Android Activity 的完整生命周期有哪些阶段？
4. 从 Activity A 跳转到 Activity B，两个 Activity 的生命周期执行顺序是怎样的？返回时呢？
5. onStart 和 onResume 的区别是什么？
6. onPause 和 onStop 的区别是什么？
7. Activity 有哪几种启动模式？各自的特点是什么？
8. 任务栈（Task Stack）怎么理解？
9. 什么是挂起函数（suspend）？它的作用是什么？
10. 挂起函数和线程等待有什么区别？
11. Handler 的组成结构和工作原理是什么？
12. Looper 是怎么运行的？里面是死循环吗？为什么死循环不会导致主线程卡顿？
13. 实习期间遇到的最复杂的问题是什么？当时的解决思路是怎样的？

### 《参考解析》

**生命周期顺序**：A 启动 B 时是 `A.onPause → B.onCreate → B.onStart → B.onResume → A.onStop`；返回时是 `B.onPause → A.onRestart → A.onStart → A.onResume → B.onStop → B.onDestroy`。onStart 表示可见但不可交互，onResume 表示可见且可交互；onPause 表示失去焦点，onStop 表示完全不可见。

**四种启动模式**：standard（每次新建）、singleTop（栈顶复用，复用时会回调 onNewIntent）、singleTask（栈内唯一，清掉它上面的实例）、singleInstance（独占任务栈）。任务栈是 Activity 的后进先出容器，决定返回键的行为。

**挂起函数是「可以暂停和恢复的函数」**，它把异步代码写成同步的样子，底层靠状态机和 Continuation 保存恢复点。它和线程等待的区别是：挂起不阻塞线程，线程可以去执行别的任务；线程等待（sleep/join）会占住线程。

**Looper 的循环不会卡主线程，因为主线程本来就要一直活着等消息**。卡顿来自单条消息处理太久或消息队列被大量任务占满；`Looper.loop()` 阻塞在 `MessageQueue.next()` 上，没有消息时休眠，有消息时唤醒处理，ANR 是「主线程 5 秒没响应输入事件」而不是「循环存在」。

**找重复数**：1000 个整数、取值范围 1～999 时，可以用求和差、异或、布尔数组或原地置负；如果范围更大就用 HashSet。答题时先问清范围和是否允许修改原数组。

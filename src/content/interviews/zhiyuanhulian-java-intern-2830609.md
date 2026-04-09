---
title: 致远互联Java日常实习面经
company: 致远互联
position: Java日常实习
date: '2026-04'
source: 牛客网
tags: ["Java集合","ArrayList","LinkedList","HashMap","面向对象"]
summary: "致远互联Java日常实习面试考察，重点考查Java基础知识。面试内容涵盖ArrayList与LinkedList的区别与使用场景、HashMap的遍历方式、重载与重写的区别等核心Java技术点，适合准备实习的同学参考备考。"
---

### 面试题目
1. 自我介绍
2. 实习相关
3. 平时用的多的集合是什么
4. ArrayList与LinkedList的区别，使用场景是什么
5. ArrayList的常用方法有哪些
6. 怎么遍历HashMap
7. 重载与重写的区别
8. 反问

---

### 参考解析
1. **ArrayList与LinkedList的区别**：ArrayList底层基于数组，查询快（O(1)），增删慢；LinkedList底层基于双向链表，增删快（O(1)），查询慢（O(n)）。场景：频繁读取用ArrayList，频繁插入删除用LinkedList。
2. **ArrayList常用方法**：add()添加元素，get()获取元素，remove()删除元素，size()获取长度，isEmpty()判断是否为空，clear()清空集合。
3. **HashMap遍历**：最推荐使用 `entrySet().iterator()` 或 `forEach` 循环，性能最高且能同时获取键值对。避免在遍历过程中直接删除元素（应使用Iterator.remove()）。
4. **重载(Overload)与重写(Override)**：重载发生在本类中，方法名相同但参数列表不同，与返回类型无关；重写发生在父子类间，方法签名完全一致，用于子类实现父类方法，体现多态。
---
title: JAVA银行外包开发面试经验
company: 银行外包
position: JAVA开发
date: '2026-04'
source: 牛客网
tags: ["Java基础","HashMap","Hashtable","final","集合框架"]
summary: "分享银行外包JAVA开发岗面试经验。面试重点考察Java基础八股文，如HashMap与Hashtable区别、final/finally/finalize用法等。适合Java新人备考，技术栈稳定，面试侧重考察基础知识的熟练度。"
---

### 《面试题目》
1. HashMap和Hashtable有什么区别？
2. final、finally、finalize的区别是什么？

---

### 《参考解析》
1. **HashMap vs Hashtable**：
   - 线程安全性：Hashtable是线程安全的（方法由synchronized修饰），HashMap非线程安全。
   - Null值：HashMap允许key和value为null，Hashtable不允许。
   - 继承体系：HashMap继承自AbstractMap，Hashtable继承自Dictionary。
   - 效率：Hashtable由于同步开销，性能较差，现代开发通常推荐在多线程环境下使用ConcurrentHashMap。

2. **final、finally、finalize的区别**：
   - final：修饰符，用于类（不可继承）、方法（不可重写）或变量（常量，不可变）。
   - finally：异常处理结构的关键字，确保代码块无论是否抛出异常都会执行（常用于资源释放）。
   - finalize：Object类的方法，在对象被垃圾回收前由JVM调用，不建议重写，执行时机不确定。
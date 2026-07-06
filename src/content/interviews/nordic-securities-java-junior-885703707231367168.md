---
title: 北欧证券公司Java Junior岗位笔试
company: 某证券公司（北欧办公室）
position: Java Junior开发工程师
round: 笔试
date: '2026-05'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/885703707231367168
tags: ["Java","JavaScript","算法","海外求职"]
summary: "北欧一家证券公司Java Junior岗位笔试，题目一半Java一半JavaScript（岗位JD只提Java，开考才发现有JS部分），涵盖手写继承、try-catch-finally、Lambda表达式Consumer语法及equals方法，算法题为连续子数组最大和及区间最小差值问题。"
---

### 《面试题目》

**Java 部分**
1. 手写 B 类继承 A 类
2. 手写 try catch finally
3. Lambda 表达式 Consumer 语法
4. equals 方法
5. 算法题：连续子数组最大和对应的下标

**JavaScript 部分**
1. 怎么定义变量
2. `apply()` 和 `call()`、`slice()`、`splice()`、`includes()` 等基础方法
3. 对小数取整，不用 `Math.floor()` 应该用什么？
4. JSON 语法
5. 算法题：找出列表内任意两个数之间的最小差值

---

### 《参考解析》

1. **连续子数组最大和（Kadane算法）**：维护一个"当前子数组和" `cur`，遍历数组时若 `cur` 加上当前元素后仍为负收益（即 `cur < 0`）则丢弃之前的累积、从当前元素重新开始，否则继续累加；同时用一个变量记录遍历过程中出现过的最大值，时间复杂度 O(n)，是动态规划思想在一维数组上的经典应用。
2. **JS 对小数取整的其他方法**：除了 `Math.floor()`（向下取整），常见的还有 `Math.ceil()`（向上取整）、`Math.round()`（四舍五入）、`Math.trunc()`（直接截断小数部分，正数效果等同于 `Math.floor()`，负数则不同）、位运算 `~~x` 或 `x|0`（截断取整，但仅对32位整数范围内有效）。
3. **区间最小差值问题**：找出列表中任意两数之间的最小差值，最优解法是先对数组排序（O(n log n)），排序后最小差值必然出现在相邻元素之间（因为排序后数组具有单调性，非相邻元素的差值一定不小于其中间相邻元素差值之和的某一部分），因此排序后只需遍历一次相邻元素求最小差即可，无需 O(n²) 暴力两两比较。

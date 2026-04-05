---
title: 招银网络科技笔试 Java后端方向
company: 招银网络科技
position: Java后端开发
round: 笔试
date: '2026-03'
result: 笔试通过，等待一面
source: 牛客网
tags: ["Java","数据结构","计算机网络","ACM模式","BigDecimal","Collections"]
summary: "招银网络科技Java后端笔试，含15道基础选择题（数据结构、计算机网络、AI、计算机组成原理）、1道ACM模式编程题及2道编程填空题，填空题重点考察String、BigDecimal、Collections等Java常用类的API方法，整体难度适中，适合备考Java后端岗位的同学参考。"
---

## 面试题目

### 笔试结构概览

- **选择题**：15道，涵盖数据结构与算法、计算机网络、AI、软件需求、计算机组成原理等，基础难度
- **编程题**：1道完整编程题 + 2道编程填空题

---

### 选择题

覆盖以下知识点（难度较低，均为基础题）：
- 数据结构与算法
- 计算机网络
- 人工智能（AI）
- 软件需求
- 计算机组成原理

---

### 编程题（ACM模式）

**题目描述：**
- 一道凹形输入结构的编程题
- 计算公式已在题目中给出，直接套用即可
- 使用 ACM 模式，需要用 `Scanner` 手动处理输入，关键在于正确解析输入结构
- 难度：Easy

---

### 编程填空题（2道）

**考察重点：**
- Java 常用数据结构与类的 API 方法掌握，包括：
  - `String` 类常用方法
  - `BigDecimal` 类常用方法
  - `Comparable` / `Comparator` 接口（compare 相关）
  - `Collections` 工具类常用方法
- 共 9 个填空空格

---

## 参考解析

### ACM 模式编程题要点

ACM 模式下需自行处理输入输出，常用模板如下：
```java
Scanner sc = new Scanner(System.in);
int n = sc.nextInt();
// 按题目输入结构逐行读取
```
注意区分 `nextInt()`、`next()`、`nextLine()` 的使用场景，混用易导致换行符残留问题。

---

### String 类高频 API

| 方法 | 说明 |
|---|---|
| `substring(int begin, int end)` | 截取子串 |
| `indexOf(String s)` | 查找子串位置 |
| `split(String regex)` | 按正则分割 |
| `trim()` / `strip()` | 去除首尾空格 |
| `charAt(int index)` | 获取指定字符 |
| `toCharArray()` | 转字符数组 |

---

### BigDecimal 类高频 API

- `BigDecimal.add()` / `subtract()` / `multiply()` / `divide()`：四则运算
- `divide(divisor, scale, RoundingMode.HALF_UP)`：带精度和舍入模式的除法，避免除不尽抛异常
- `compareTo(BigDecimal val)`：比较大小，返回 -1/0/1，**不要用 `equals` 比较带精度的值**
- `setScale(int scale, RoundingMode mode)`：设置精度

---

### Collections 工具类高频 API

- `Collections.sort(list)` / `Collections.sort(list, comparator)`：排序
- `Collections.reverse(list)`：反转
- `Collections.max(collection)` / `Collections.min(collection)`：求最值
- `Collections.frequency(collection, obj)`：统计出现次数
- `Collections.unmodifiableList(list)`：返回不可修改视图

---

### Comparator / Comparable 要点

- `Comparable` 由类自身实现 `compareTo`，`Comparator` 为外部比较器
- Lambda 简写：`list.sort((a, b) -> a - b)`（升序）
- 多字段排序：`Comparator.comparing(T::getField).thenComparing(T::getField2)`
- `compare` 返回值：负数表示第一个参数小，0相等，正数表示第一个参数大
---
title: 超星学习通Java一面面经（纯八股）
company: 超星学习通
position: Java开发工程师
round: 一面
date: '2026-06'
result: 凉经
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2868700
tags: ["Java","JVM","MySQL","索引","垃圾回收","String","hashCode"]
summary: "超星学习通Java一面面经，纯八股题目：StringBuilder vs String拼接对比、常用垃圾回收器类型、==与equals区别、重写equals必须重写hashCode的原因、异常分类、索引失效场景。候选人反映体验极差，面试官不开摄像头，半小时结束无后续。"
---

### 《面试题目》

1. 自我介绍
2. StringBuilder 与 String + 连接符拼接的区别
3. 常用的垃圾回收器有哪些
4. == 与 equals 的区别
5. 为什么重写 equals 后必须要重写 hashCode
6. 异常分为哪几类
7. 索引失效的场景有哪些

---

### 《参考解析》

**StringBuilder vs String + 拼接**
`String + "abc"` 在编译时对常量折叠，运行时每次 `+` 都会创建新的 String 对象并复制，循环拼接时复杂度为 O(n²)。`StringBuilder` 内部维护可扩容 `char[]`，`append()` 均摊 O(1)，循环拼接无额外对象创建。JDK 9+ 编译器会对简单拼接表达式自动优化为 `StringBuilder`，但循环内拼接仍建议手动使用 `StringBuilder`。

**常用垃圾回收器**
- **Serial GC**：单线程，Stop-The-World，适合客户端小堆。
- **Parallel GC**（JDK 8 默认）：多线程，吞吐量优先。
- **CMS**（Concurrent Mark-Sweep）：并发标记清除，低停顿，已被 G1 取代。
- **G1**（JDK 9+ 默认）：分 Region 管理堆，可预测停顿时间，兼顾吞吐量与延迟。
- **ZGC / Shenandoah**：超低延迟（< 10ms），适合大堆（TB 级）。

**重写 equals 必须重写 hashCode 的原因**
Java 规范要求：若两个对象 `equals()` 返回 true，则它们的 `hashCode()` 必须相同。若只重写 equals 而不重写 hashCode，自定义对象放入 `HashMap`/`HashSet` 时，两个内容相同的对象会因 hashCode 不同被映射到不同 bucket，导致无法正确去重或查找，破坏容器语义。

**Java 异常分类**
- **Throwable**：所有错误和异常的根类。
  - **Error**：JVM 不可恢复错误，如 `OutOfMemoryError`、`StackOverflowError`，不建议捕获。
  - **Exception**：
    - **Checked Exception（编译时异常）**：必须 try-catch 或 throws 声明，如 `IOException`、`SQLException`。
    - **Unchecked Exception（运行时异常）**：继承自 `RuntimeException`，如 `NullPointerException`、`ArrayIndexOutOfBoundsException`，编译器不强制处理。

**索引失效场景**
① 对索引列使用函数或表达式（`WHERE LENGTH(name) > 5`）；② 发生隐式类型转换（`WHERE id = '123'`，id 为整型）；③ LIKE 以 `%` 开头（`LIKE '%keyword'`）；④ 联合索引不满足最左前缀（跳过中间列）；⑤ OR 条件中有列未建索引；⑥ NOT IN / != / <> 某些情况；⑦ 数据区分度低（如性别字段），优化器选择全表扫描。
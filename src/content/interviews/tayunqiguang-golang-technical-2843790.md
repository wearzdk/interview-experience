---
title: 上海踏云齐光 Golang 开发面试复盘
company: 踏云齐光
position: Golang 开发
round: 技术负责人直面
date: '2026-04'
base: 上海
source: 牛客网
tags: ["Golang","DDD","MySQL设计","并发编程"]
summary: "踏云齐光Golang开发面经，面试考察点涵盖DDD设计思想、Java与Go接口设计差异、Goroutine与Channel并发模型，以及MySQL购物车订单表设计，含7进制转换手撕代码题，适合准备Go后端面试的学习者参考。"
---

### 面试题目

1. 自我介绍 + 项目介绍
2. 实习经历
3. DDD 的设计
4. Java interface 和 Go struct/interface 的设计差异
   - Java 有 interface，为什么 Go 会有 struct 和 interface 这样的设计？
   - 为什么说 Go 的 interface 和 Java 的 interface 不太一样？
   - 举一个实际例子：Java 这种传统面向对象语言和 Go 的区别是什么？
   - 比如 Java 里面写 Animal，然后 Tiger 继承 Animal，Go 里面会怎么设计？
5. Go 基础八股：channel、goroutine 和线程
   - channel 是什么？
   - goroutine 和线程有什么区别？
   - 为什么不能无限开 goroutine？
   - 实际业务中什么情况下会用 goroutine？
   - 什么情况下会用 channel？
6. MySQL 表设计场景题：购物车和订单设计
   - 假如购物车里面买了两个苹果、一个香蕉，订单表怎么设计？
   - 怎么体现买了两个苹果、一个香蕉？
   - 如果拆成两张表，应该用哪个字段当主键？
7. 手撕代码：7 进制转换
8. 反问：公司 AI 具体业务是什么？

---

### 参考解析

1. **Java vs Go 设计差异**：Java 是显式实现接口（implements），Go 是隐式实现（只要实现方法即视为实现接口）。Go 提倡组合优于继承，使用 struct 组合替代 Java 的类继承，通过接口隔离原则（ISP）定义细粒度接口。
2. **Goroutine 与线程**：Goroutine 是用户态线程（M:N 调度），内存占用小（KB级别）；线程是内核态线程，开销大（MB级别）。无限开 goroutine 会导致内存溢出（OOM）及调度器压力。
3. **购物车表设计**：建议设计两张表，`orders`（订单主表）和 `order_items`（订单明细表）。主键应使用业务无关的自增 ID 或 Snowflake ID（UUID），通过 `order_id` 外键关联明细，存储商品ID、单价、数量等，体现“多对一”关系。
4. **7进制转换**：使用取模 `% 7` 获取余数，整除 `/ 7` 获取商，重复此过程直到商为0，将余数列表反转即得到结果。
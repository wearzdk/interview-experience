---
title: 美团后端暑期实习一面面经
company: 美团
position: 后端开发实习生
round: 一面
date: '2026-04'
source: 牛客网
tags: ["Java","JVM","MySQL","Redis","消息队列","计算机网络"]
---

## 基本信息

- 时长：约 70 分钟
- 面试官态度友好，全程有耐心
- 自述基础薄弱，八股回答模糊，遇到追问容易露馅

---

## 一、项目拷打

- 高并发下如何做防重设计？
- 系统的 QPS 瓶颈在哪里？
- 如果落库失败，如何处理数据一致性？

---

## 二、计算机网络 & 操作系统

### HTTP
- HTTP 1.1 版本有哪些比较重要的新特性？

### TCP
- TCP 链接复用问题：同一浏览器先后打开两个相同的网页标签，它们用的是同一个 TCP 连接吗？
- 如果用不同的浏览器打开呢？

### Linux
- 了解 Linux 的线程模型吗？
- 了解多路复用函数（如 select、poll、epoll）吗？

### OS 理论
- 并发（Concurrency）和并行（Parallelism）的区别？
- 从系统处理器视角分别是什么意思？

---

## 三、Java 基础 & 并发编程（JUC）

### 面向对象
- 封装、继承、多态的概念？
- `protected` 修饰符的访问规则是怎样的？

### Object 类
- Object 类提供了哪些基本函数？

### 线程通信
- `wait()` 和 `Thread.sleep()` 有什么区别？

### 线程池原理
- 线程池的核心参数有哪些？

### 线程池场景
- 核心线程数为 2，最大线程数为 4，队列容量为 10，任务不断进来时，线程池的分配和创建逻辑是怎样的？

### 线程池参数设置
- 针对 CPU 密集型任务和 IO 密集型任务，线程池大小应该如何设置？
- **追问**：为什么 IO 密集型通常设为 2N？
- **追问**：如果两个 IO 任务耗时差异很大（如一个 500ms、一个 50ms），设置原则有何差异？

### 线程池拒绝策略
- 了解哪些拒绝策略？

---

## 四、JVM & 框架

### JVM
- JVM 和 GC 了解过吗？平时这些底层知识是如何学习的？

### Spring
- Spring Boot 和 Spring 框架有什么区别？

### IOC
- `@Autowired` 和 `@Resource` 有什么区别？
- 它们分别是谁约定 / 提供的？

### Web 组件
- 拦截器（Interceptor）和过滤器（Filter）的执行顺序是怎样的？
- 具体有什么差异？

### AOP
- AOP 动态代理在不同场景下有哪些实现机制？

---

## 五、数据库 & 中间件（MySQL、MQ、Redis）

### MySQL 底层
- InnoDB 引擎中，主键使用自增 BigInt 和 UUID 在性能上有什么差异？
- **追问**：如果是通过主键精确查询（`id = xxx`），自增 ID 和 UUID 有区别吗？

### 消息队列
- 消息队列有多个分区（Partition），但某些场景必须保证"顺序消费"，如何实现？
- 例如 A 消息和 B 消息分别进了不同分区，如何保证顺序？

### Redis 容量评估
- 上线新需求时，数据结构和数据量级已确定，如何评估存储所需的 Redis 内存空间是否足够？

### Redis 底层原理
- Redis 是用 C 语言编写的，如何计算一个 C 语言结构体（Struct）占用的内存空间大小？

---

## 六、算法题

**LeetCode 206 - 反转链表**

要求：必须分别用 **递归** 和 **迭代** 两种方式实现。

```java
// 迭代
public ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

// 递归
public ListNode reverseList(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode newHead = reverseList(head.next);
    head.next.next = head;
    head.next = null;
    return newHead;
}
```

---
title: 北京宏途创联Java小厂面经
company: 北京宏途创联科技有限公司
position: Java开发工程师
round: 一面
date: '2026-07'
result: 凉经
base: 北京
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2873160
tags: ["Java基础","集合","多线程","Docker","计算机网络","算法"]
summary: "北京宏途创联 Java 开发面经，问题集中在 Java 基本类型、集合、HashMap、线程状态、synchronized、Docker 部署和反转链表。"
---

### 《面试题目》
1. 简单介绍智学平台相关项目。
2. Java 基本数据类型有哪些。
3. String 是基本数据类型吗。
4. ArrayList、LinkedList 和 HashMap 的区别是什么。
5. HashMap 的底层原理是什么。
6. 创建线程有哪些方式。
7. 线程有哪些状态。
8. `sleep` 和 `wait` 的区别是什么。
9. 介绍 synchronized 锁。
10. 进程和线程有什么区别。
11. 微服务项目中，如何使用 Docker 部署 Java 项目。
12. `==` 和 `equals` 有什么区别。
13. `equals` 返回 true 时，`hashCode` 一定一样吗。
14. 抽象类必须有抽象方法吗，抽象类可以有普通方法吗。
15. final 能修饰抽象类吗。
16. ping 底层使用什么协议。
17. 算法题：反转链表。

---

### 《参考解析》
1. **Java 基本类型与 String**：Java 有 8 种基本类型：byte、short、int、long、float、double、char、boolean。String 是引用类型，不是基本类型。
2. **HashMap 底层原理**：JDK 8 后主要是数组、链表和红黑树。put 时通过 hash 定位桶位，冲突时链表追加，链表过长且数组容量达到阈值后转红黑树，扩容时容量翻倍并重新分布节点。
3. **sleep 和 wait 区别**：`sleep` 是 Thread 静态方法，不释放对象锁；`wait` 是 Object 方法，必须在同步块中调用，调用后释放锁并等待 notify/notifyAll 或超时唤醒。
4. **Docker 部署 Java 项目**：通常先构建 jar，再写 Dockerfile 选择 JRE/JDK 基础镜像，复制 jar，设置启动命令和环境变量，最后构建镜像并通过 Docker Compose 或 K8s 部署。线上还要配置日志、健康检查和资源限制。
5. **ping 底层协议**：ping 使用 ICMP 协议，发送 Echo Request 并等待 Echo Reply，用于检测网络连通性和延迟，不基于 TCP 或 UDP 端口。
6. **反转链表**：迭代法维护 `prev`、`cur`、`next` 三个指针，每次把当前节点指向前一个节点，直到遍历结束，最后 `prev` 就是新头节点。

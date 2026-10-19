---
title: "卓望全栈开发一面：Java 八股、Spring 单例线程安全与定时任务去重"
company: "卓望"
position: "全栈开发"
round: "一面"
date: '2026-10'
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/970ab759862745f4a7dd693ee69f0d66"
tags: ["卓望", "全栈开发", "Java", "Spring", "并发编程", "Vue", "定时任务"]
summary: "卓望秋招全栈开发一面：先深挖实习与项目，再追问 Java 接口与抽象类、try-with-resources、synchronized 与 CAS、Spring 单例线程安全及 XXL-JOB 去重，末尾涉及 Vue 传值与 VO 脱敏。"
---

### 《面试题目》

> 原帖第 1–17 题为实习与个人项目深挖，未记录具体问句。

18. 接口和抽象类有什么区别？什么时候使用？
19. try-with-resources 读取文件还有资源泄漏风险吗？
20. close() 抛异常会怎么样？
21. try-with-resources 中多个资源按照什么顺序关闭？
22. synchronized 是什么？
23. ReentrantLock 和 CAS 是什么？有什么区别？
24. synchronized 具体怎么声明？
25. Spring 单例 Bean 中用成员变量临时保存 userId，会有什么问题？
26. 怎么避免这种线程安全问题？
27. 怎么理解 Spring 单例 Bean 和 Spring 容器？
28. Spring 容器和 Bean 存在哪里？
29. IoC 和 DI 分别是什么？
30. IoC 和 DI 是什么关系？
31. Bean 的实例化和属性填充是什么？
32. Vue 是什么？
33. Vue 中父组件怎么把报名人数传给子组件？
34. 实体类包含前端不显示的字段，有安全风险吗？
35. 如果这个字段是 password 呢？
36. 返回数据时 VO 怎么处理敏感字段？
37. 定时任务设置每 5 分钟执行，但有时候 8 分钟才执行，怎么避免重复和漏处理？
38. XXL-JOB 多实例执行时怎么避免重复处理？
39. 常见设计模式有哪些？举几个实际例子。
40. 面试结束有什么想反问的？

### 《参考解析》

**try-with-resources**：多资源按声明逆序关闭。close() 抛异常时，若 try 块正常结束就抛给调用方；若 try 块已有异常，close 的异常作为 suppressed 挂在主异常上，不覆盖原错误。它也并非绝对不泄漏：资源未实现 AutoCloseable、在 try 外先 new、或 close 自身失败，都仍会漏。

**synchronized、ReentrantLock 与 CAS**：synchronized 是 JVM 监视器锁，可重入、异常自动释放，可修饰实例方法（锁 this）、静态方法（锁 Class 对象）或 synchronized(对象) 代码块。ReentrantLock 基于 AQS，需 finally unlock，换来可中断、可超时、可 tryLock。CAS 是原子的比较并交换，但只能保证单变量原子性、高竞争下自旋、有 ABA 问题。

**Spring 单例 Bean 的成员变量**：单例 Bean 全容器只有一个实例，成员变量被所有请求线程共享；用它存 userId，并发请求会互相覆盖。单例只保证创建一次，不保证内部状态安全。让 Service 保持无状态：userId 用参数或局部变量传递；必须跨层时用 ThreadLocal 并在 finally 里 remove，否则线程池复用会残留上一个请求的数据。

**定时任务的延迟与多实例重复**：5 分钟触发却 8 分钟才跑，多因调度线程池被占、任务超时或固定延迟顺延。别按「最近 5 分钟」处理，改成记录上次成功的时间水位，从水位扫到当前时间；任务保持幂等（唯一索引或处理记录表判重）。XXL-JOB 多实例可用路由策略「第一个」，或分片广播各处理自己的 shardIndex，再以 Redis 锁兜底。

**VO 与敏感字段**：实体直接返回不仅多给字段，还会暴露内部 ID。password 出现在响应里，等于把哈希甚至明文交给前端和代理日志。应在转换层用 VO 只映射所需字段，password 根本不进 VO，必要时加 @JsonIgnore；手机号等做脱敏。

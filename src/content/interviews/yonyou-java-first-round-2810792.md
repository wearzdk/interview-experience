---
title: 广东用友网络Java后端一面面经
company: 用友网络
position: 客户化开发-Java后端
round: 一面
date: '2026-03'
base: 广东
source: 牛客网
tags: ["Java","Spring","多线程","网络协议"]
summary: "分享用友网络Java后端客户化开发岗的一面经历。面试内容涵盖ArrayList与LinkedList区别、final与finally、GET/POST区别、Spring AOP/IOC机制、自定义线程池设计要点及AI coding的应用场景，整体面试耗时约20分钟，流程简练。"
---

### 《面试题目》
1. ArrayList和LinkedList的区别？
2. final和finally有什么区别？
3. 前端发get请求和post有什么区别？
4. Spring AOP和Spring IOC是什么？身份鉴权怎么做？
5. 你在实习中用到了自定义线程池，那需要考虑哪些问题？为什么不用JDK自带的线程池工具创建线程？
6. 对AI coding的看法，工作中怎么用？
7. 个人软性方面问题。
8. 反问阶段。

---

### 《参考解析》
1. **ArrayList与LinkedList**：ArrayList基于动态数组，随机访问快（O(1)），插入删除慢；LinkedList基于双向链表，插入删除快，但内存开销大且不支持随机访问。
2. **final与finally**：final用于修饰类、方法、变量，表示不可变；finally是try-catch-finally结构的组成部分，用于确保代码块执行（如资源关闭）。
3. **GET与POST**：GET参数显示在URL中，安全性低，幂等；POST将数据放入请求体，适合传输敏感数据，非幂等。
4. **Spring IOC与AOP**：IOC是控制反转，将对象创建权交给容器管理；AOP是面向切面编程，常用于日志、鉴权。鉴权一般通过过滤器（Filter）或拦截器（Interceptor）实现。
5. **自定义线程池**：JDK自带的`Executors`方法（如Fixed/Cached）容易导致OOM（任务队列无界）。自定义线程池需根据业务设置核心线程数、最大线程数、拒绝策略及阻塞队列类型，以保障系统资源可控。
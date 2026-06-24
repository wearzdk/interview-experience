---
title: 某公司Java岗与Python岗两次面试经历
company: 某科技公司
position: 后端开发工程师
date: '2026-06'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2867554
tags: ["Java","Python","RabbitMQ","Redis","MySQL","RAG","并发编程"]
summary: "同一公司Java岗与Python岗两次面试对比面经。Java岗考察支付幂等、CompletableFuture、volatile、CAS原子类、RabbitMQ可靠性、MySQL与MongoDB选型、RAG及Java注解；Python岗考察架构、装饰器、HTTP状态码、高并发处理及Redis五大数据结构。"
---

### 《面试题目》

**Java 岗一面（5月25日）**

**一、并发与同步**
1. Token + Redis 分布式锁防重 + 数据库状态机兜底的具体实现逻辑？
2. 设计微信/支付宝支付回调防重方案，分布式锁 key 怎么设计？
3. CompletableFuture 解决什么问题，怎么用？
4. 主线程如何等待所有子线程执行完成？
5. synchronized 和 volatile 的作用与区别？
6. Atomic 原子包解决什么问题？CAS 机制原理？

**二、消息队列**
7. 接触过哪些 MQ？RabbitMQ 适用场景、解决什么问题？
8. 如何保证 RabbitMQ 消息发送成功 + 消费成功？

**三、数据库**
9. 用过哪些数据库？是否接触非关系型数据库？
10. MySQL 和 MongoDB 分别适合什么场景？
11. MySQL 联合索引 (A、B、C) 使用注意事项？
12. 慢 SQL 排查与优化的完整步骤？

**四、AI 与其他**
13. Java 注解的作用？
14. 用过哪些 AI 编程工具？Claude Code 怎么用？
15. RAG 系统 + 向量数据库的实现流程？

---

**Python 岗一面（6月15日）**

1. 平时后端开发使用什么架构？
2. Python 装饰器的用法？
3. HTTP 接口返回 3xx 状态码代表什么含义？
4. 什么是高并发，高并发的常用处理方法？
5. Redis 5 种典型数据结构及各自常用应用场景？
6. 如何简单保障 Redis 和 MySQL 的数据一致性？
7. 讲讲项目开发中遇到的棘手问题或难点？
8. 介绍 RAG 的基本思想及你项目里的 RAG 搭建流程？

---

### 《参考解析》

1. **支付回调幂等设计**：分布式锁 key 格式：`payment:callback:{tradeNo}`，业务层用 `SET NX PX 30000` 抢占锁后查询订单状态机，状态为"待支付"才处理，处理完更新状态为"已支付"并释放锁。DB 层再建 `trade_no` 唯一索引兜底，防止分布式锁 TTL 超时导致的二次处理。

2. **CompletableFuture 等待所有子任务**：
   ```java
   CompletableFuture<Void> all = CompletableFuture.allOf(f1, f2, f3);
   all.join(); // 等待全部完成
   // 收集结果
   List<String> results = Stream.of(f1, f2, f3).map(CompletableFuture::join).collect(Collectors.toList());
   ```

3. **CAS 原理**：Compare And Swap，硬件级原子操作。`AtomicInteger.compareAndSet(expect, update)` → 若内存值 == expect，则更新为 update 并返回 true，否则返回 false（需循环重试）。ABA 问题用 `AtomicStampedReference` 加版本号解决。

4. **MySQL vs MongoDB**：MySQL（关系型）适合结构固定、事务要求强的业务（订单、支付、用户）；MongoDB（文档型）适合 schema 灵活、嵌套结构复杂、写多读少的场景（用户行为日志、商品 SPU/SKU 多属性、内容管理）。

5. **Python 装饰器**：装饰器本质是一个高阶函数，接收函数作为参数并返回新函数。用 `@functools.wraps(func)` 保留原函数元信息：
   ```python
   import functools
   def log_time(func):
       @functools.wraps(func)
       def wrapper(*args, **kwargs):
           import time; start = time.time()
           result = func(*args, **kwargs)
           print(f"{func.__name__} took {time.time()-start:.3f}s")
           return result
       return wrapper
   ```

6. **HTTP 3xx 状态码**：301 永久重定向（浏览器缓存新地址）；302 临时重定向（不缓存）；304 Not Modified（客户端缓存仍有效，服务端不返回资源体）；307/308 类似 302/301 但保留请求方法（不从 POST 变 GET）。

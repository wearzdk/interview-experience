---
title: 珍林网络 Java 面试题
company: 珍林网络
position: Java
date: '2026-04'
source: 牛客网
tags: ["Java","Redis","Spring Boot","分布式锁","数据库索引"]
summary: "珍林网络Java岗位面试题，涵盖IPv6优势、Java泛型机制、电商超卖解决方案、Redis分布式锁设计、数据库索引优化、Spring事务嵌套及Bean生命周期等核心技术点，助力求职者高效备战后端开发面试。"
---

### 《面试题目》
1. ipv6比ipv4有哪些优点
2. Java泛型，以及如何解除泛型
3. 查看内存使用情况
4. 电商系统防止超卖
5. redis和分布式锁如何设计数据结构
6. 如何设计一个比较好的索引
7. 事务可以嵌套吗
8. Java中finally 直接return会怎样
9. Bean 的相关知识
10. spring boot 注解举例
11. 场景题：线程并发从一个 API 取得数据，如何设计

---

### 《参考解析》
- **IPv6优点**：拥有更大的地址空间，简化了报文头部，支持自动配置，并强制支持IPsec提供更好的安全性。
- **Java泛型与擦除**：Java泛型在编译后会被擦除（Type Erasure），可通过反射绕过编译检查插入不同类型数据。
- **防止超卖**：采用Redis Lua脚本原子扣减库存，或利用数据库乐观锁（CAS）防止超卖。
- **分布式锁数据结构**：通常使用Redis的String类型配合SETNX命令，建议设置过期时间并使用UUID防止误删。
- **数据库索引优化**：遵循最左前缀原则，避免在索引列使用函数，控制索引长度，覆盖索引减少回表。
- **事务嵌套**：Spring中通过`Propagation.NESTED`支持嵌套事务，底层依赖JDBC的Savepoint实现。
- **finally返回**：若finally块中有return语句，它会覆盖try/catch中的返回值，并抑制try块中的异常。
- **高并发API调用**：使用CompletableFuture异步编排，配合线程池和信号量（Semaphore）进行限流与异常处理。
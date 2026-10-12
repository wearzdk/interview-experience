---
title: "满帮全栈开发一面：并发容器、线程池、事务与深分页优化"
company: 满帮
position: 全栈开发
round: 一面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/61978ea012e14932bca893781dcfcecd
tags: ["Java","并发","线程池","事务","MySQL","JWT","HTTPS"]
summary: "满帮全栈开发一面面经，16 道题集中在 Java 并发（HashMap 与 ConcurrentHashMap 线程安全、线程池参数与拒绝策略、Lock 与 synchronized、死锁、可重入锁公平性）与 MySQL 调优（慢查询排查、索引选择、走了索引仍慢的原因、深分页优化），另有 @Transactional 与动态代理的边界问题和 JWT/HTTPS 安全问答。"
---

### 《面试题目》

1. 为什么选择南京？北京、上海、广州也在看吗？
2. HashMap 是线程安全的吗？多线程环境下可以用哪些 Map？
3. ConcurrentHashMap 是怎么做到线程安全的？
4. 线程池的核心参数有哪些？
5. 线程池有哪些拒绝策略？CallerRunsPolicy 会有什么问题？
6. Lock 和 synchronized 的区别？
7. ReentrantLock 默认是公平锁还是非公平锁？怎么实现公平锁？
8. 死锁产生的条件是什么？
9. @Transactional 能加在私有方法上吗？为什么？
10. 动态代理为什么只能代理 public 方法？
11. MySQL 查询慢怎么排查？怎么查看走了哪个索引？EXPLAIN 关注哪些字段？
12. 走了索引但还是很慢，可能是什么原因？
13. 深分页怎么优化？
14. JWT 的无状态认证原理？
15. 如何防止 JWT 被中间人攻击拦截？
16. HTTPS 的原理是什么？

### 《参考解析》

**ConcurrentHashMap 的线程安全是「CAS + synchronized 锁桶 + volatile 可见性」的组合。** Java 8 之后取消了分段锁：底层仍是数组 + 链表 + 红黑树，put 时若目标桶为空就用 CAS 直接写入，非空则对**该桶的头节点**加 synchronized，锁粒度是单个桶，冲突少时并发度很高；`size` 用 `baseCount + CounterCell` 分散计数避免热点。读操作不加锁，靠 Node 的 `val` 与 `next` 用 volatile 保证可见性。要注意它只保证**单个操作**原子：`if (!map.containsKey(k)) map.put(k, v)` 这类复合操作依然要 `putIfAbsent`/`computeIfAbsent` 才安全。顺带可以提 Hashtable（全表锁，已淘汰）和 `Collections.synchronizedMap`（包装后每个方法加锁，性能差）。

**线程池参数与拒绝策略要能串成一条决策链。** 七个参数：核心线程数、最大线程数、空闲存活时间、时间单位、任务队列、线程工厂、拒绝策略；执行顺序是「核心线程未满就新建 → 满了进队列 → 队列满了再扩到最大线程数 → 还是满就触发拒绝策略」。队列选型决定行为：用无界队列（LinkedBlockingQueue 默认容量 Integer.MAX_VALUE）时最大线程数形同虚设，任务会无限堆积直到 OOM，所以生产上要用有界队列 + 明确的拒绝策略。`CallerRunsPolicy` 的问题是**由提交任务的线程自己执行**：如果提交方是 Web 容器的工作线程或 Netty 的 IO 线程，它会被这个任务阻塞住，导致响应变慢甚至整个事件循环卡死——所以它只适合「不介意被拖慢、但绝不能丢任务」的场景，且要评估调用方是谁。线程数定量的经验公式：CPU 密集型取 `核心数 + 1`，IO 密集型取 `核心数 × (1 + 等待时间/计算时间)`，最终必须靠压测校准。

**Lock 与 synchronized 的差异要落到「谁管的、能不能中断」。** synchronized 是 JVM 关键字、自动加解锁、无法中断也无法超时，JDK 6 之后有偏向锁/轻量级锁优化，简单场景性能不差；Lock（ReentrantLock）是 API 层面的显式锁，支持 `tryLock`、`lockInterruptibly`、超时获取、公平模式和多条件变量（Condition），代价是必须自己 `try/finally` 释放，漏写就永久泄漏。ReentrantLock 默认**非公平**，构造传 `true` 才公平；公平锁的实现是维护一个 CLH 队列，`tryAcquire` 前先检查队列里有没有前驱，有就排队，因此吞吐通常低于非公平锁。死锁的四个必要条件（互斥、请求并保持、不可剥夺、循环等待）中，工程上最容易打破的是循环等待——给锁定义全局顺序，或者用 `tryLock` 带超时退避。

**@Transactional 加在私有方法上不生效，根因是 Spring 的代理机制。** 声明式事务靠 AOP 代理实现：外部调用先经过代理对象，代理在方法前后开启/提交事务。私有方法不能被外部直接调用（也常被 CGLIB 子类覆盖不了），调用发生在目标对象内部、绕过了代理，所以注解形同虚设。同理失效的场景还有：同类内部方法自调用、方法不是 public、异常被 catch 吞掉、抛的是受检异常但没配 `rollbackFor`、以及多线程里事务不传播。想解决自调用问题可以注入自身代理、用 `AopContext.currentProxy()` 或把方法拆到另一个 Bean。动态代理只能代理 public 方法也是同源：JDK 动态代理基于接口实现，接口方法都是 public；CGLIB 用继承生成子类，私有/静态/final 方法无法覆盖。

**慢查询要先定位再优化，别一上来加索引。** 流程是：开慢查询日志捞 SQL → `EXPLAIN`（8.0 可 `EXPLAIN ANALYZE`）看 `type`（ALL/index/range/ref/const，出现 ALL 说明全表扫）、`key`（实际用到的索引）、`key_len`、`rows`（预估扫描行数）、`filtered`、`Extra`（Using filesort / Using temporary 是危险信号）。**走了索引还是慢**的常见原因：回表次数太多（二级索引只带主键，要回聚簇索引取行，此时该考虑覆盖索引）、索引选择性差导致扫描行数依然很大、范围查询后的列失效、排序/分组落到临时表、锁等待或长事务阻塞、以及单次返回的数据量本身就大。深分页（`limit 100000, 20`）的本质是扫描并丢弃前十万行，两个解法：**延迟关联**（先用覆盖索引取出主键 `select id from t where ... limit 100000,20`，再 join 原表取整行）和**游标/键集分页**（记住上一页最后的 `id` 或排序键，用 `where id > last_id order by id limit 20`），后者要求排序字段唯一且有索引，且不能随机跳页。

**JWT 的无状态认证与 HTTPS。** JWT 是 `header.payload.signature` 三段 base64url，服务端用密钥（HMAC）或私钥（RSA/ECDSA）签名，验证时只需重新计算签名，不用查库也不用维护会话，所以水平扩展友好；代价是**无法主动失效**——登出、改密、封号后旧 token 在过期前依然有效。工程补救：缩短有效期 + refresh token 轮换、维护一个「已吊销 jti」的黑名单（这就退化成了有状态）、或者用短生命周期 token 配合服务端 session。中间人攻击的防护要点：**必须走 HTTPS**（JWT 本身不加密，payload 是明文可读的）、token 不要放 localStorage 以防 XSS（优先 httpOnly + Secure + SameSite 的 cookie，或内存 + 定期刷新）、设置短过期时间、校验 `alg` 防止算法混淆攻击、以及对刷新接口做绑定（设备指纹/IP 变化时要求重新认证）。HTTPS 则是 TLS 握手建立安全通道：客户端验证服务器证书链与域名 → 通过密钥交换（ECDHE）协商出会话密钥 → 用对称加密传输数据，兼有加密、完整性校验与身份认证三件事；ECDHE 提供前向保密，证书校验失败必须硬失败而不是降级继续。

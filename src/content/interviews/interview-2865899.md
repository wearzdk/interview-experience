---
title: 族游网络实习
company: 族游网络
position: 软件开发实习生
date: '2026-06'
base: 江苏
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2865899
tags: ["Java", "MySQL", "Redis", "Spring", "计算机网络"]
summary: "族游网络软件开发实习生面经，考察Java、MySQL、Redis等核心知识点。包含真实面试题目与解析，适合准备软件开发实习生面试的求职者参考备考。"
---

### 《面试题目》


**aop 的理解**

**Java 中的锁**

**sql 优化**
1. redis 用来做什么的

**jvm 内存模型**
2. tcp 和 http

---

### 《参考解析》

1. **计算机网络**：TCP（传输控制协议）是面向连接、可靠的传输协议，提供流量控制和拥塞控制；UDP（用户数据报协议）是无连接、不可靠但速度更快的协议。TCP通过三次握手建立连接（SYN→SYN+ACK→ACK），四次挥手断开（FIN→ACK→FIN→ACK）。

2. **MySQL深度**：MySQL InnoDB使用B+树索引，支持ACID事务。关键知识点：聚簇索引（主键索引）叶节点存完整行数据；辅助索引叶节点存主键值（需回表）；MVCC通过undo log版本链+ReadView实现多版本并发控制，解决脏读/不可重复读；事务隔离级别从低到高：读未提交→读已提交→可重复读（默认）→串行化。

3. **Redis核心**：Redis常用数据结构：String/Hash/List/Set/ZSet。持久化：RDB（定期快照，恢复快，数据可能丢失）和AOF（追加日志，数据安全，文件大）。缓存穿透用布隆过滤器；缓存雪崩加随机过期时间+多级缓存；缓存击穿用互斥锁或逻辑过期。分布式锁用SET key value NX PX + Lua脚本保证原子释放。

4. **Spring框架**：Spring IoC容器管理Bean生命周期，核心是依赖注入（DI）。AOP面向切面编程通过动态代理（JDK/CGLIB）实现横切关注点（日志/事务/权限）。Spring事务传播行为：REQUIRED（加入现有或新建）、REQUIRES_NEW（挂起当前，新建）、NESTED（嵌套事务）等。

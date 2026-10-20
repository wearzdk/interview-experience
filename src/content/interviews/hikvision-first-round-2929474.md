---
title: "海康威视一面面经"
company: "海康威视"
position: "软件开发"
round: "一面"
result: "挂"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/b65327147a4e495e91c2d8628a1a98a0
tags: ["高并发", "超卖", "HashSet", "HashMap", "锁", "乐观锁", "数据库"]
summary: "海康威视一面，以“2 万请求同时选课”为场景问防超卖、防同一人多买、提升响应，再问 HashSet 与 HashMap 的区别及底层、synchronized 锁方法与锁类、乐观锁与悲观锁、如何减少数据库访问。"
---

### 《面试题目》

1. 学校选课场景，2 万个请求同时打过来，怎么防止一门热门课超卖？
2. 如何防止同一个人多买？
3. 如何提高服务器的响应？
4. HashSet 和 HashMap 有什么区别？HashSet 的底层原理是什么？
5. synchronized 锁方法与锁类有什么区别？
6. 乐观锁和悲观锁是什么？
7. 如何减少数据库的访问？

### 《参考解析》

**防超卖**要分层：入口限流和排队，Redis 预扣库存用 Lua 保证原子，数据库更新用 `UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock > 0` 或乐观锁版本号，最后用唯一约束防重复下单。防同一人多买用“用户 ID + 课程 ID”唯一索引或 Redis Set 去重；提高响应可以加缓存、异步化、读写分离和静态资源 CDN。

**HashSet 底层是 HashMap**，元素作为 key、value 是固定占位对象，所以去重依赖 `hashCode` 和 `equals`；HashMap 是键值对，1.8 后数组 + 链表 + 红黑树。synchronized 修饰实例方法锁当前对象，修饰静态方法锁 Class 对象，修饰代码块锁指定对象；锁类范围更大，会影响该类的所有实例。

**乐观锁**假设冲突少，读时记版本，写时比对版本，失败重试；**悲观锁**假设冲突多，先加锁再操作。数据库层面乐观锁用版本号/CAS，悲观锁用 `SELECT ... FOR UPDATE`。减少数据库访问用本地缓存、Redis、批量读写、连接池、读写分离、合理索引和异步落库。

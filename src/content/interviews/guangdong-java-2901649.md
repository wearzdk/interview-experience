---
title: 广东某公司java实习生面经
company: 广东某公司
position: Java开发实习生
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2901649
tags: ["Java", "MySQL", "Redis", "Spring Cloud", "实习"]
summary: 广东某公司 Java 实习生面试，覆盖索引、分布式锁、SQL 安全、OpenFeign、网关和 Seata。
---

### 《面试题目》

1. 数据库索引有哪些优缺点？
2. 分布式锁如何续期？
3. CROSS JOIN 最多可以联查几张表？
4. UNION 和 UNION ALL 有什么区别？
5. CAS 与 synchronized 有什么区别？
6. 数据库表 ID 如何选择类型，分布式 ID 如何设计？
7. 如何防止 SQL 注入？
8. OpenFeign 的底层原理是什么？
9. Gateway 如何实现动态路由？
10. Seata 解决什么问题？
11. 策略模式和单例模式分别有什么作用？

### 《参考解析》

索引能加速查询但会增加写入和存储成本；分布式锁续期应绑定持有者并设置租约上限。UNION 会去重，UNION ALL 直接拼接。CAS 是乐观并发原语，synchronized 由 JVM 管理互斥和可见性。SQL 注入应使用预编译参数。OpenFeign 通过动态代理生成 HTTP 调用，Gateway 路由可从配置中心动态刷新。Seata 通过全局事务协调分布式事务，策略模式封装可替换算法，单例保证受控实例数量。

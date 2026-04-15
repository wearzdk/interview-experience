---
title: 国投智能Java实习面经
company: 国投智能
position: Java实习
date: '2026-04'
result: oc
source: 牛客网
tags: ["Java","Redis","MySQL","并发编程","系统设计"]
summary: "分享国投智能Java实习生面试经验。面试时长40分钟，考察重点涵盖Redis原子性与持久化、分布式全局唯一ID、限流算法、CAS并发机制及SQL连接查询等核心技术点。适合Java求职者查漏补缺。"
---

### 面试题目
1. 自我介绍
2. 云图库抓图实现方案及异常处理思路
3. Redis如何保证原子性
4. 全局唯一ID实现方案
5. 限流的实现方式
6. CAS的使用场景
7. Redis的持久化方式
8. left join、right join、inner join的区别
9. union和union all的区别
10. 个人背景：网络工程专业学习Java的原因
11. 入职时间确认及公司业务介绍

---

### 参考解析
- **Redis原子性**：通过Redis的Lua脚本、MULTI/EXEC事务指令，或者使用分布式锁（如Redisson）来保证多操作的原子性。
- **全局唯一ID**：常用方案包括UUID（无序但唯一）、雪花算法（Snowflake，有序且性能高）、数据库自增主键（配合分库分表策略）或Redis的INCR指令。
- **限流实现**：常见的有令牌桶算法（Token Bucket）和漏桶算法（Leaky Bucket），可利用Guava RateLimiter或Nginx的limit_req模块实现。
- **CAS**：即Compare And Swap，是乐观锁的核心，在Java中通过java.util.concurrent.atomic包下的原子类（如AtomicInteger）实现，用于无锁编程场景。
- **Redis持久化**：主要有RDB（快照模式，适合备份）和AOF（日志追加模式，数据安全性更高）。建议线上环境根据业务需求混合使用。
- **SQL连接查询**：Inner join取交集；Left join以左表为基准，右表匹配不到补null；Right join反之。Union会自动去重，Union all直接合并结果集，效率更高。
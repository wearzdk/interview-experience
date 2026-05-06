---
title: 27届腾讯AI后台开发实习一面面经
company: 腾讯
position: AI后台开发
round: 一面
date: '2026-05'
source: 牛客网
tags: ["Java","MySQL","Kafka","MyBatis","微服务"]
summary: "腾讯AI后台开发实习面试复盘：涵盖Java基础（接口与抽象类、HashMap、线程安全）、MyBatis SQL注入防御、微服务熔断降级与限流、Kafka高并发架构、MySQL性能优化以及大模型工程化落地实践。"
---

### 面试题目
1. 手撕：力扣原题最小路径和
2. Java中的接口和抽象类有什么区别
3. Java中循环拼接字符串（几万次）应使用哪种类型？String、StringBuilder、StringBuffer的区别？
4. Java里面如何实现线程安全的
5. synchronized可以修饰变量吗？
6. Java中哪些注解可以实现依赖注入？
7. Java里的HashMap如何扩容的，扩容机制是怎样的？
8. 什么情况下会进行扩容？
9. Mybatis中如何防止SQL注入的？
10. 微服务的熔断和降级有了解过吗？
11. 了解过哪些限流方法？
12. Kafka如何保持高流量，高可用？
13. 如果说MySQL里出现慢查询，如何进行优化？
14. easyExcel解析Excel，一万行数据在5000行出错如何处理？
15. 项目中是否使用了大模型，接入的哪个大模型？
16. 大模型的数据存放在哪里？

---

### 参考解析
- **StringBuilder/StringBuffer**：循环拼接推荐使用StringBuilder（线程不安全，效率高）；StringBuffer线程安全但有同步开销；String拼接会产生大量临时对象。
- **HashMap扩容**：默认负载因子0.75，容量达到阈值（容量*负载因子）时扩容为原大小的2倍，将原数组节点通过高低位拆分重映射到新数组。
- **MyBatis SQL注入**：使用`#{}`预编译处理，底层通过JDBC的PreparedStatement设置参数，能有效过滤特殊字符；避免使用`${}`拼接SQL。
- **Kafka高可用/高流量**：高流量依赖分区（Partition）机制实现水平扩展；高可用通过副本（Replica）机制，配合ISR（同步副本集）与Ack机制保证数据不丢失。
- **MySQL慢查询优化**：先通过EXPLAIN分析执行计划，查看索引命中情况；重点关注索引失效（如类型转换、左模糊）、大分页查询、SQL语句冗余以及必要的覆盖索引优化。
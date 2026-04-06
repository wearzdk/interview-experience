---
title: 百度后台开发实习一面面经
company: 百度
position: 后台开发
round: 一面
date: '2026-03'
source: 牛客网
tags: ["MySQL","Redis","计算机网络","Linux","算法"]
summary: "百度后台开发实习一面面经，重点考察MySQL索引优化、乐观锁/悲观锁机制、Redis分布式锁及数据一致性，此外涉及计算机网络请求全流程、HTTP状态码及Linux基础命令，最后手撕快速排序。"
---

### 面试题目

1. 在项目中用了哪些索引？
2. 介绍一下主键索引和聚集索引。
3. 介绍一下覆盖索引。
4. 给一个sql语句，`select * from tableA where a = 0 and b < 1 and c = 2 order by d desc;` 问你怎么建索引，并说明理由。
5. 这个b是一个范围查询，能走索引吗？是完全用到索引还是部分用到索引？
6. 对这个sql进行优化。
7. d字段要建索引吗？
8. 介绍一下mysql的乐观锁和悲观锁。
9. 乐观锁是怎么实现的？
10. 乐观锁的这个字段是怎么维护的？
11. 项目中用到redis的场景和数据结构。
12. redis的分布式锁主要用到哪些命令？
13. redis和mysql的数据一致性是怎么实现的？
14. 部署了一个java服务，对外暴露域名，在网址输入域名访问api返回数据，过程是怎么样的？
15. 服务器上有订单服务和登录服务，DNS解析到IP后，请求怎么分发到具体服务？
16. HTTP的状态码分别是什么含义？
17. 502和504状态码分别什么含义？
18. 查看日志文件最后几行的linux命令是什么？

【手撕】快速排序

---

### 参考解析

- **MySQL索引优化**：针对`a=0 and b<1 and c=2`的查询，建议建立联合索引 `(a, c, b)`，这样可以利用a和c的等值匹配过滤，再利用b进行范围查找，将最常用的过滤字段放前面。
- **乐观锁与悲观锁**：悲观锁使用 `select ... for update` 锁定数据；乐观锁通常通过 `version` 字段实现，更新时执行 `update table set val=x, version=version+1 where id=y and version=old_version`。
- **Redis分布式锁**：主要使用 `SET key value NX PX milliseconds` 命令实现加锁，配合Lua脚本或Redis事务确保原子性，防止死锁并处理锁过期问题。
- **HTTP请求分发**：请求到达服务器后，通常通过Nginx等反向代理服务器进行转发，根据域名或路径（URL Rewrite/Proxy Pass）映射到不同的后端服务端口。
- **502 vs 504**：502 Bad Gateway指代理服务器从上游服务器收到无效响应；504 Gateway Timeout指代理服务器未在规定时间内收到上游响应。
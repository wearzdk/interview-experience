---
title: 广东长正Java开发一面面经
company: 广东长正
position: Java开发
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","SpringBoot","MySQL","Redis","SpringMVC"]
summary: "广东长正Java开发面试总结，考察内容涵盖SpringBoot、SpringMVC、Redis基础架构以及MySQL索引与连接查询。适合准备后端开发岗位的应聘者参考，了解高频技术面试题。"
---

### 《面试题目》
1. 自我介绍及项目来源确认。
2. Java学习时长与基础情况。
3. 实战场景题：利用SpringBoot、SpringMVC、Redis和两张表实现增删改查思路。
4. SpringMVC常用注解有哪些？
5. MySQL有哪些不同的连接方式？
6. MySQL索引失效的常见场景有哪些？

---

### 《参考解析》
1. **增删改查设计思路**：Controller层接收请求，Service层处理业务逻辑（如Redis缓存查询与数据一致性同步），DAO层使用MyBatis/JPA操作两张表；读请求优先查Redis，写请求更新数据库并同步删除/更新缓存。
2. **SpringMVC注解**：常用 `@Controller`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@RequestBody`, `@ResponseBody`, `@PathVariable`, `@RequestParam` 等。
3. **MySQL连接方式**：主要包括内连接（INNER JOIN，取交集）、左连接（LEFT JOIN，保留左表所有行）、右连接（RIGHT JOIN，保留右表所有行），以及全连接（FULL JOIN，较少使用）。
4. **索引失效场景**：包括但不限于：在索引列上使用函数或运算、隐式类型转换、使用 `!=` 或 `<>`、`like` 以 `%` 开头、or 条件中有一列无索引、不符合最左前缀原则等。
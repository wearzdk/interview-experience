---
title: 广东长正Java开发一面面经
company: 广东长正
position: Java开发
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java","SpringBoot","SpringMVC","Redis","MySQL"]
summary: "广东长正Java开发一面面经，面试考察了项目经历、SpringBoot与SpringMVC框架、Redis集成开发、MySQL多表关联及索引优化等核心技术点，并探讨了实际场景下的增删改查实现思路。"
---

### 《面试题目》
1. 自我介绍及项目来源背景询问。
2. Java学习时长询问。
3. 实战场景题：使用SpringBoot、SpringMVC、Redis和两张表实现基本的增删改查思路。
4. SpringMVC常用注解有哪些？
5. MySQL的不同连接方式介绍。
6. MySQL索引失效的常见场景。

---

### 《参考解析》
1. **增删改查思路**：通过SpringMVC接收请求，Controller层调用Service层；利用MyBatis或JPA操作两张表（关联查询），数据查询先查Redis缓存，缓存缺失则查库并回写Redis；更新/删除操作需同步删除或更新Redis缓存以保证数据一致性。
2. **SpringMVC常用注解**：@Controller、@RestController、@RequestMapping、@GetMapping/@PostMapping、@RequestParam、@PathVariable、@RequestBody。
3. **MySQL连接方式**：内连接（INNER JOIN，仅返回匹配记录）、左连接（LEFT JOIN，保留左表全部）、右连接（RIGHT JOIN，保留右表全部）、全连接（FULL JOIN）。
4. **MySQL索引失效场景**：使用!=或<>操作符、使用LIKE '%...'、对索引列进行函数运算或表达式计算、索引字段发生隐式类型转换（如字符串未加引号）、在OR连接的条件中若一边无索引则索引失效、联合索引未遵循最左前缀原则。
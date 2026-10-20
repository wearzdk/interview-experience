---
title: "招银网络科技 Java 二面与 HR 面面经"
company: "招银网络科技"
position: "Java开发"
round: "二面、HR面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/942118080807723008
tags: ["Java", "异常", "finally", "SQL", "表连接", "HR面"]
summary: "招银网络科技上海 Java 技术二面加 HR 面，技术面问 try-catch/finally 执行细节、方法访问权限、包装类、hashCode、SQL 统计与 JOIN 写法，HR 面问升学、实习表现、跨团队协作、受挫经历和择业因素。"
---

### 《面试题目》

1. 使用 try-catch 有哪些注意事项？多个异常类存在继承关系时，catch 的顺序应该怎样安排？
2. finally 一定会执行吗？
3. try 中有普通类型和引用类型变量，执行 return 后，finally 又修改这些变量并执行 return，会怎么样？
4. 父类方法的访问权限是 default，子类重写时可以是什么访问权限？为什么？
5. 包装类和普通类有什么区别？
6. 为什么要重写 hashCode？
7. SQL 手撕：学生表（id、name、gender），成绩表（id、course、score），分别统计男生、女生中分数大于 80 分的个数。
8. 在 FROM 中使用 JOIN ... ON，与在 WHERE 中写关联条件有什么区别？
9. 遇到分歧时怎么解决？产品经理、技术总监、开发，你愿意当哪个？和客户意见不一致时怎么办？
10. 聊聊最近学的新东西。
11. 自我介绍与升学规划。
12. 实习中的荣誉是怎么获得的？为什么能获得认可？
13. 你和哪些团队有协作？是自己独立对接吗？方案或意见有分歧时怎么处理？
14. 工作中有过受挫吗？遇到的是什么类型的问题？其他实习生会很轻松吗，你为什么投入这些精力？
15. 实习期间有导师指导吗？导师给过你哪些建议？
16. 秋招主要投哪些企业？进度如何？后续选公司看重什么？之前了解过我们吗？

### 《参考解析》

**异常与 finally**：catch 要按从子类到父类的顺序，否则父类会先捕获、子类分支不可达；finally 通常都会执行，只有 `System.exit`、JVM 崩溃、死循环等极端情况例外。try 中 return 时，基本类型返回的是值的副本，finally 修改局部变量不影响返回值；引用类型返回的是引用副本，finally 修改对象内容会影响结果，但 finally 里再 return 会覆盖 try 的返回值。

**访问权限**：父类方法 default（包可见），子类重写不能降低可见性，可以相同或更宽（protected/public），因为多态调用要保证父类引用能访问。包装类和普通类的区别在于包装类是对象、可为 null、有缓存和工具方法，能用于泛型；`hashCode` 与 `equals` 要一起重写，否则哈希容器里会出现“相等但找不到”的问题。

**SQL**：按性别统计分数大于 80 的个数，可以 `SELECT s.gender, COUNT(*) FROM student s JOIN score c ON s.id = c.id WHERE c.score > 80 GROUP BY s.gender`；如果学生没有成绩也要显示 0，用 LEFT JOIN 并把条件放到 ON 或对计数做 CASE。JOIN ... ON 和 WHERE 关联在 INNER JOIN 下结果通常等价，但 LEFT JOIN 下把右表条件放 WHERE 会退化成内连接，放 ON 才能保留左表全部行。

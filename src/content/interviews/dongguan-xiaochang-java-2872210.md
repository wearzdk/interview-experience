---
title: 东莞小厂Java笔试面经
company: 某小厂
position: Java开发工程师
base: 东莞
date: '2026-07'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2872210
tags: ["Java","MySQL","集合框架","多线程"]
summary: "东莞小厂Java笔试面经，题目以八股为主未涉及项目，涵盖Java数据类型、自动拆装箱、继承与接口、多线程创建方式、集合框架、String类型判断，以及MySQL的LIMIT分页、日期函数、CHAR与VARCHAR区别等基础考点。"
---

### 《面试题目》

1. Java 支持的数据类型有哪些？什么是自动拆装箱？
2. Java 支持哪些继承方式？
3. 接口和抽象类的区别是什么？
4. 创建线程有几种不同的方式？更倾向于哪一种，为什么？
5. 同步方法和同步代码块的区别是什么？
6. Java 集合类框架的基本接口有哪些？
7. HashMap 和 HashTable 有什么区别？
8. 数组（Array）和 ArrayList 有什么区别？
9. String 是最基本的数据类型吗？
10. int 和 Integer 有什么区别？
11. String 和 StringBuffer 的区别？
12. `&` 和 `&&` 的区别？
13. final、finally、finalize 的区别？
14. error 和 exception 有什么区别？
15. `String s = new String("xyz");` 创建了几个 String 对象？
16. 接口是否可以继承接口？
17. 如何显示 MySQL 表的前 50 行？
18. `NOW()` 和 `CURRENT_DATE()` 有什么区别？
19. CHAR 和 VARCHAR 的区别？
20. MySQL 优化思路有哪些？

---

### 《参考解析》

1. **自动拆装箱**：Java 提供 8 种基本数据类型（byte/short/int/long/float/double/char/boolean）及其对应的包装类；自动装箱是基本类型自动转为包装类对象（如 `Integer i = 10` 实际调用 `Integer.valueOf(10)`），自动拆箱是包装类对象自动转回基本类型，编译器在编译期插入相应的转换代码。
2. **HashMap 与 HashTable 的区别**：HashMap 线程不安全但性能高，允许 key/value 为 null；HashTable 线程安全（方法用 `synchronized` 修饰）但性能较低，不允许 null key/value。现代并发场景更推荐用 `ConcurrentHashMap` 替代 HashTable。
3. **`String s = new String("xyz")` 创建对象数**：如果字符串常量池中尚无 `"xyz"`，会创建 2 个对象——1 个在常量池（字面量 `"xyz"` 触发），1 个在堆上（`new` 关键字触发）；如果常量池已有 `"xyz"`，则只创建 1 个堆对象。
4. **CHAR 与 VARCHAR 的区别**：CHAR 是定长类型，不足长度会用空格填充，存储/读取性能更稳定，适合长度固定的字段（如身份证号）；VARCHAR 是变长类型，按实际内容长度存储（额外占用 1-2 字节记录长度），更节省空间，适合长度不固定的字段。

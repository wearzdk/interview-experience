---
title: 新瑞谷科技Java后端开发实习一面面经
company: 新瑞谷科技
position: Java后端开发实习生
round: 一面
date: '2026-07'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2869732
tags: ["Java","AI编程工具","SQL","面向对象"]
summary: "新瑞谷科技Java后端开发实习一面面经，围绕AI编程工具使用、Java基础语法（循环、重载重写、继承、权限修饰符）、Spring注解及SQL基础（union/like/字符串拼接）展开提问。"
---

### 《面试题目》

1. 自我介绍
2. 上一份工作/实习的经历，同事平时使用什么 AI 工具，离职原因是什么
3. Cursor 有什么特点？
4. Cursor 有几种模式，分别叫什么？
5. Java 循环语句有几种写法？break 和 continue 有什么区别？
6. Java 方法的重载与重写有什么区别，分别怎么写？
7. Java 继承相关关键字、权限修饰符有哪些？
8. Spring 常用注解有哪些？启动类上常见的注解有哪些？
9. SQL 中 union 和 union all 的区别？
10. SQL 中 like 后面 % 和 _ 的作用区别？
11. SQL 里字符串拼接怎么写？

---

### 《参考解析》

1. **break vs continue**：break 直接终止整个循环，跳出循环体；continue 只结束当前这一轮循环，跳过本轮剩余代码，继续下一轮判断。
2. **重载 vs 重写**：重载（Overload）发生在同一个类中，方法名相同但参数列表（个数/类型/顺序）不同，属于编译期多态；重写（Override）发生在子类对父类方法的重新实现，方法签名必须一致，属于运行期动态绑定的多态。
3. **Spring 常用注解**：启动类常见 `@SpringBootApplication`（组合了 `@Configuration`、`@EnableAutoConfiguration`、`@ComponentScan`）；此外常用的还有 `@Service`、`@Controller`/`@RestController`、`@Repository`、`@Autowired`/`@Resource`（依赖注入）、`@RequestMapping`/`@GetMapping` 等。
4. **union vs union all**：union 会对多个结果集做去重和排序合并，需要额外的排序/去重开销；union all 直接把结果集拼接在一起，不去重也不排序，性能更好，能确定无重复数据时优先用 union all。
5. **like 通配符**：`%` 匹配任意长度（包括 0 个）的字符；`_` 只匹配单个字符。
6. **SQL 字符串拼接**：MySQL 中常用 `CONCAT(str1, str2, ...)` 拼接多个字符串；如果需要指定分隔符，可以用 `CONCAT_WS(separator, str1, str2, ...)`。

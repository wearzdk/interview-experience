---
title: "10.27 金银湖实验室 Java 一面：集合底层、泛型与模块拆分"
company: "金银湖实验室"
position: "Java 后端"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/d2b8b358524a4fa3b09fe7b2a408256b
tags: ["Java","集合","HashMap","多态","泛型","Spring Boot"]
summary: "金银湖实验室 Java 一面：ArrayList 与 HashMap 的底层、链表与数组的区别、多态与泛型、深拷贝浅拷贝、Spring Boot 多模块拆分与依赖版本管理，以及如何验证 AI 写的代码。"
---

### 《面试题目》

1. 做一下自我介绍。
2. 有过一段实习经历，说一说这段实习。
3. Java 有哪些数据结构？
4. HashSet 和 ArrayList 有什么区别？
5. HashSet 的底层是什么？
6. 你用过哪些其他数据结构（不限于 Java）？
7. 链表和数组有什么区别？
8. Java 的三大基础特征是什么？
9. 详细说一说多态，比如我有一个 List，子类是 ArrayList 和 LinkedList。
10. 泛型了解吗？
11. 泛型和 Object 有什么区别？
12. 深拷贝和浅拷贝的区别知道吗？
13. 如果我 clone 一个对象，这个是深拷贝还是浅拷贝？
14. 如果我有一个 Object 去传参，需要转换成 Integer 和 String，应该强转吗？
15. Java 是单继承还是多继承？
16. 你的 Spring Boot 用的什么版本？
17. 如何细致地拆分模块？
18. 父模块存的是什么？
19. 依赖版本你是怎么做的？
20. 你用过 AI 工具吗？
21. 如何用 AI 写一个模块？
22. 你是怎么验证 AI 写的东西的？

### 《参考解析》

**HashMap 与 ArrayList**：ArrayList 是动态数组，随机访问 O(1)，中间插入删除要搬元素；HashMap 是哈希表，JDK 8 起是数组 + 链表 + 红黑树，查找平均 O(1)，链表长度超过 8 且容量到 64 转红黑树。HashSet 内部就是一个 HashMap，value 是固定的 PRESENT 对象，所以它只存键、去重、无序。回答「HashSet 底层」时要能说出 put 的过程：算 hash、扰动、定位桶、比较 hash 和 equals、链表/树插入、超过阈值扩容。

**多态**：父类引用指向子类对象，调用被重写的方法时走子类实现，靠虚方法表在运行时分派。用 `List<String> list = new ArrayList<>()` 举例：编译期看 List 接口，运行期看 ArrayList 实现，好处是面向接口编程、可替换实现。静态方法、private 方法、final 方法不参与多态。

**泛型与 Object**：泛型是编译期类型检查，运行时擦除，好处是类型安全、免强转、代码复用；用 Object 需要手动强转，错误到运行期才暴露，而且装箱拆箱有开销。`List<String>` 不能当 `List<Object>` 用（不变性），通配符 `? extends` / `? super` 解决读写场景。

**深浅拷贝**：浅拷贝只复制引用，对象内部的引用类型仍指向同一块内存；深拷贝递归复制内部对象。Object.clone() 默认是浅拷贝，要深拷贝得手动克隆引用字段或用序列化。强转前先用 `instanceof` 判断，否则类型不符会抛 ClassCastException；Java 类是单继承、多实现。

**Spring Boot 多模块与依赖管理**：父模块只放 `<packaging>pom</packaging>`、统一的依赖版本（dependencyManagement）、插件配置和公共属性；子模块按「api / service / dao / common / web」或按业务域拆。版本统一在父 POM 的 properties 里定义，子模块引依赖不写版本；用 BOM 管理第三方依赖。拆分原则是高内聚低耦合、依赖单向。

**验证 AI 写的代码**：先让它给设计说明和边界条件，再要求补单测；人审重点看空值、并发、事务边界、异常吞掉、SQL 注入、越权；跑静态检查和类型检查；用真实数据跑一遍；最后把这次踩的坑写成约束补进 prompt。

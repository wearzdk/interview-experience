---
title: "腾讯云智 - 大数据产品架构与支持中心A - 武汉 - 二面面经"
company: "腾讯"
position: "Java后端开发工程师"
date: '2026-08'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2873966
tags: ["Java","JVM","Spring","并发","计算机网络","数据库"]
summary: "腾讯Java后端开发工程师面试记录，覆盖Java、JVM、Spring、并发等考点，整理了面试流程与高频问题。"
---

### 《面试题目》

1. 如何提升 SpringBoot 项目的启动速度？
2. ① 减少类加载与组件扫描开销：在 @SpringBootApplication 中精准指定 scanBasePackages 来限制扫描范围，并利用 exclude 属性排除掉项目中未使用的自动配置类，精简 pom.xml 中的冗余依赖。
3. ② 默认情况下，Spring 会在启动时实例化所有单例 Bean。对于非核心或非强依赖链上的 Bean，可以使用 @Lazy 延迟初始化。
4. ③ 优化外部资源连接：对于非关键的资源初始化，通过 @PostConstruct 将其推迟到应用启动完成后再执行。
5. String str1 = "Hello world!";
6. String str2 = "world!";
7. str1 和 str2 指向的是内存中的同一块地方吗？
8. 若要把 str1 指向的内存块改变（比如将"Hello world!"改为"Hello,world!"），该如何实现？
9. ① 不是。使用双引号声明的字符串字面量会被存放在方法区的字符串常量池中，str1 和 str2 指向的是常量池中两块不同的内存区域。
10. ② 在 JDK 8 及更早的版本中，String 类内部是通过一个 private final char[] value 数组来存储字符的。虽然 String 类本身是 final 的，且 value 字段也是 final 的，但仍可通过反射机制强行修改
11. ⚫通过 str
12. getClass().getDeclaredField("value") 获取到 value 字段。
13. ⚫调用 field.setAccessible(true) 绕过 Java 的访问权限检查。
14. ⚫利用 Unsafe 类或者反射修改 final 修饰符（移除 final 属性）。
15. ⚫最后通过 field.set(str1, newCharArray) 将新的字符数组塞进去。
16. 从 JDK 9 开始，Java 引入了紧凑字符串优化。String 内部不再使用 char[]，而是改为了 byte[]，并增加了一个 coder 字段来标识编码格式。这一底层结构的改变，加上 JVM 对 String 内部字段访问权限的进一步收紧，导致过去那种通过反射直接修改 value 数组的代码在 JDK 9+ 中要么抛出异常，要么无法达到预期效果。
17. 抽象方法可以用 static 修饰吗？为什么？
18. 抽象方法“只定义规范，不提供实现”，核心目的就是为了被子类重写，由子类提供具体的实现逻辑。

### 《参考解析》

1. MySQL索引通常使用B+树，叶子节点按顺序连接，适合范围查询；设计索引时结合选择性、最左匹配原则和执行计划，避免无效索引与回表开销。
2. 并发问题应先明确共享状态和一致性边界，再选择锁、CAS或队列。线程池需要根据任务是CPU密集还是IO密集设置核心线程数、队列容量和拒绝策略，并监控活跃数与队列长度。
3. TCP通过三次握手建立连接、四次挥手释放连接；HTTPS在TLS握手中协商会话密钥，并用证书校验服务端身份，数据传输阶段主要使用对称加密。

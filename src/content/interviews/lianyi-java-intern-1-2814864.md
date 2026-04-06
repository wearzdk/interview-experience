---
title: 广州联奕科技Java后端实习一面面经
company: 联奕科技
position: Java后端实习
round: 一面
date: '2026-03'
result: 挂
base: 广州
source: 牛客网
tags: ["Java基础","JVM","MySQL","Spring","设计模式"]
summary: "联奕科技Java后端实习面试，考察核心技术点。面试内容涵盖Java集合（HashMap）、JVM锁机制、Spring框架注解、MySQL索引优化及数据库底层原理。同时涉及动态代理、设计模式及AI相关技术（MCP、Function Calling），适合准备Java后端实习的同学复习参考。"
---

### 《面试题目》

**笔试环节**
1. 选择题：Java基础、集合、并发。
2. 填空题：Linux命令和Docker命令。
3. 大题：两个SQL语句。

**面试环节**
1. 自我介绍。
2. 对集合的了解。
3. HashMap和HashTable的区别。
4. HashMap的key值可以为null吗？
5. 如果存在哈希冲突，如何通过key找到对应位置？
6. 对Java中锁的了解。
7. 什么是轻量级锁？
8. 在业务中如何实现一个轻量级锁？
9. 锁的升级过程。
10. 业务中出现循环依赖如何解决？
11. 创建一个类如何交给Spring管理？
12. @Resource和@Autowired的区别。
13. 静态代理和动态代理。
14. 了解哪些设计模式？
15. 联合索引有了解吗？
16. 联合索引(a, b, c)，查询 a=1 and b=2 and c=3，哪些字段用到索引？
17. 查询 a=1 and b>1 and c=3，索引使用情况？
18. B树和B+树的区别。
19. 说一下AQS。
20. 对向量数据库的了解。
21. 解决过数据库命中率的问题吗？
22. 对目前AI的了解。
23. OpenClaw执行流程。
24. MCP和Function Calling的区别。

---

### 《参考解析》

*   **HashMap与HashTable区别**：HashMap线程不安全，支持null键值；HashTable线程安全，key和value均不允许为null，目前基本被ConcurrentHashMap替代。
*   **HashMap处理哈希冲突**：通过key的hashCode方法计算哈希值，定位到数组下标。若冲突，则通过equals方法在链表或红黑树中查找对应Entry。
*   **锁的升级过程**：无锁 -> 偏向锁 -> 轻量级锁 -> 重量级锁。升级是为了减少锁带来的开销，是根据竞争激烈程度自动演变的。
*   **Spring循环依赖**：Spring通过“三级缓存”机制解决单例模式下的Setter注入循环依赖问题。
*   **@Resource与@Autowired**：@Autowired是Spring提供的，默认按类型(byType)注入；@Resource是JDK提供的，默认按名称(byName)注入。
*   **联合索引失效**：遵循最左前缀原则。a=1 and b>1 and c=3中，a和b会用到索引，c无法使用，因为b的范围查询导致后续列索引失效。
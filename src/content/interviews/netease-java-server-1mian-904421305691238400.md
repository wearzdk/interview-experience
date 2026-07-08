---
title: 网易Java服务端一面面经
company: 网易
position: Java服务端
round: 一面
date: '2026-06'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/904421305691238400
tags: ["算法","Java","AI项目","HashMap"]
summary: "网易Java服务端一面面经，涉及LeetCode零钱兑换动态规划题、AI智能问答项目的短期/长期记忆机制与相似度召回设计、Map遍历方式及String相等性判断等Java基础题。"
---

### 《面试题目》

1. 自我介绍
2. 算法题：LeetCode 322 零钱兑换（一维 DP）
3. AI 项目中团队智能问答知识库的短期记忆和长期记忆机制是怎样的？
4. AI 项目中相似度召回具体是怎么做的？
5. AI 开发中主要使用什么工具？
6. AI 项目里是否只做 AI Code Review，还是也涉及自动化测试？
7. 如果需要测试，是直接说明需求 agent 就能完成一系列自动化测试，还是需要用户手动设置？
8. 如何遍历一个 Map，拿到所有的 key 和 value 对应关系？
9. `String a = "abc"`、`String b = new String("abc")`、`String c = new String("abc")`、`String d = "abc"`，四者之间的 `==` 关系？
10. 对一个对象重写 `equals()` 方法需要注意什么？

---

### 《参考解析》

1. **零钱兑换（LC322）**：定义 `dp[i]` 为凑齐金额 `i` 所需最少硬币数，初始化 `dp[0]=0`，其余为最大值；状态转移为 `dp[i] = min(dp[i], dp[i-coin]+1)`，对每个金额遍历所有硬币面值取最优解，最终 `dp[amount]` 若仍为初始最大值说明无法凑齐。
2. **Map 遍历取 key/value**：可以用 `entrySet()` 遍历（一次拿到 key 和 value，效率最高，推荐方式），也可以用 `keySet()` 遍历后再 `get(key)`（多一次查找开销），或用 Java 8 的 `forEach((k, v) -> ...)`。
3. **String 的 `==` 关系**：字符串常量 `"abc"` 存于字符串常量池，`a` 和 `d` 指向同一个常量池对象，`a == d` 为 `true`；`new String("abc")` 会在堆上新建对象，`b`、`c` 各自指向不同的堆对象，`a == b`、`b == c` 均为 `false`。
4. **重写 equals() 的注意事项**：需要满足自反性、对称性、传递性、一致性和对 null 返回 false；通常同时重写 `hashCode()`，保证相等的对象 hashCode 一致，否则会破坏 HashMap/HashSet 等基于哈希的集合的正确性。

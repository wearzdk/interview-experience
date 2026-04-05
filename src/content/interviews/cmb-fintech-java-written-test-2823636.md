---
title: 招银网络科技社招Java笔试题整理（成都）
company: 招银网络科技
position: Java开发工程师
round: 笔试
date: '2026-03'
base: 成都
source: 牛客网
tags: ["Java","JVM","Spring Boot","NIO-BIO","数据结构","设计模式"]
summary: "招银网络科技成都Java社招笔试，共2小时，30道选择题+2道编程题。涉及JVM GC可达性分析、类加载器、Java IO/NIO-BIO、Spring Boot自动配置、Hash冲突解决、线程拒绝策略、设计模式（代理、工厂）等核心知识点，编程题考察最长公共子串与字符串词频统计。"
---

## 面试题目

### 笔试概况

- 时长：2小时
- 题型：30道选择题 + 2道编程题
- 整体评价：考点多且全面，部分题目较难

### 选择题考点

1. GC 可达性分析：哪些对象**不能**作为 GC Root
2. 允许 trace 方法是否存在风险
3. 斐波那契数列递归调用次数
4. `List` 接口各实现类在高并发场景下的效率对比
5. Hash 冲突解决方法中，哪种适合大存储空间场景
6. `FileInputStream` 相关用法
7. Java IO、NIO 与 BIO 的区别
8. Spring Boot 自动配置原理
9. 静态工厂模式与工厂方法模式：修改类时是否需要同步修改工厂类
10. 类加载器机制
11. 其他考点：`jmap`、`jps` 命令；组合与继承的选择；线程池拒绝策略；最佳重构方法；代理模式

### 编程题

1. **最长公共子串**：给定两个字符串，求最长公共子串（注意：子串要求连续）
2. **词频统计**：给定一个英文句子，统计其中出现次数恰好为 n 的单词，并输出这些单词

---

## 参考解析

### 1. GC Root 对象

GC Root 包括：虚拟机栈中引用的对象、方法区中类静态属性引用的对象、方法区中常量引用的对象、本地方法栈 JNI 引用的对象。
**不能**作为 GC Root 的典型示例：堆中普通的 Java 对象实例、软/弱/虚引用指向的对象。

### 2. 斐波那契递归调用次数

求 `fib(n)` 的递归调用总次数为 `2*fib(n+1) - 1`。例如 `fib(5)` 调用次数为 `2*8-1=15`。
原因在于递归树中每个非叶节点都产生两次子调用，存在大量重复计算，时间复杂度为 O(2ⁿ)。

### 3. List 高并发效率

- `ArrayList`：线程不安全，高并发下会出现数据错误。
- `Vector`：线程安全，但方法级 `synchronized`，并发性能差。
- `CopyOnWriteArrayList`：读写分离，高并发读场景效率最高，适合读多写少。
- 高并发首选 `CopyOnWriteArrayList`。

### 4. Hash 冲突解决方法

- **链地址法（拉链法）**：适合存储空间较小、冲突频繁场景（如 HashMap）。
- **开放地址法**：需要连续内存，适合装载因子低的场景，**不适合大存储空间**。
- **大存储空间**场景推荐链地址法，因为不需要预分配连续大块内存。

### 5. Java IO / NIO / BIO 区别

| 特性 | BIO | NIO | AIO |
|------|-----|-----|-----|
| 模型 | 同步阻塞 | 同步非阻塞 | 异步非阻塞 |
| 线程模型 | 一连接一线程 | 多路复用（Selector） | 回调通知 |
| 适用场景 | 连接数少 | 高并发连接 | 高并发大文件IO |

NIO 核心三要素：**Channel、Buffer、Selector**。

### 6. Spring Boot 自动配置原理

核心注解 `@SpringBootApplication` 包含 `@EnableAutoConfiguration`，通过读取 `META-INF/spring.factories`（Spring Boot 3.x 改为 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`）中注册的自动配置类，结合 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件注解按需加载 Bean。

### 7. 静态工厂 vs 工厂方法模式

- **静态工厂**：创建逻辑写死在工厂类中，新增产品类型需修改工厂类，违反开闭原则。
- **工厂方法模式**：每种产品对应一个具体工厂子类，新增产品只需新增工厂子类，**无需修改已有工厂类**，符合开闭原则。

### 8. 线程池拒绝策略

JDK 内置四种：
- `AbortPolicy`（默认）：直接抛出 `RejectedExecutionException`。
- `CallerRunsPolicy`：由调用者线程执行该任务。
- `DiscardPolicy`：静默丢弃新任务。
- `DiscardOldestPolicy`：丢弃队列中最旧的任务，再重新提交。

### 9. 编程题1：最长公共子串（动态规划）

```java
public String longestCommonSubstring(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];
    int maxLen = 0, endIndex = 0;
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
                if (dp[i][j] > maxLen) {
                    maxLen = dp[i][j];
                    endIndex = i;
                }
            }
        }
    }
    return s1.substring(endIndex - maxLen, endIndex);
}
```

时间复杂度 O(m×n)，空间复杂度 O(m×n)，可用滚动数组优化为 O(n)。

### 10. 编程题2：词频统计

```java
public List<String> wordsWithFrequency(String sentence, int n) {
    String[] words = sentence.trim().split("\\s+");
    Map<String, Integer> freq = new LinkedHashMap<>();
    for (String word : words) {
        freq.merge(word.toLowerCase(), 1, Integer::sum);
    }
    List<String> result = new ArrayList<>();
    freq.forEach((word, count) -> {
        if (count == n) result.add(word);
    });
    return result;
}
```

注意：单词比较建议统一转小写；使用 `split("\\s+")` 处理多空格。
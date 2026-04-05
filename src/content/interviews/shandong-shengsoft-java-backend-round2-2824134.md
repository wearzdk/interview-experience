---
title: 山东胜软科技 Java 后端二面
company: 山东胜软科技股份有限公司
position: Java后端开发
round: 二面
date: '2026-03'
base: 东营
source: 牛客网
tags: ["Java","线程池","单例模式","MyBatis","事务","反射"]
summary: "山东胜软科技Java后端二面，历时25分钟，涉及线程池核心机制、单例模式写法、MyBatis循环遍历、Java反射原理、事务理解与失效场景、SQL查询语句、Linux关闭Tomcat命令等核心Java后端知识点，同时考察职业规划与全栈能力。"
---

## 面试题目

### 基本情况

1. 自我介绍
2. 对工作氛围、工作环境、工作内容有哪些要求？
3. 工作地点东营是否能接受？3-5年职业规划？
4. 成绩排名、四六级等个人情况

### 项目相关

5. 项目中负责的工作内容有哪些？

### Java 核心

6. 线程池的核心机制（线程管理、拒绝策略、工作流程等）
7. 单例模式代码怎么写，大致讲一下
8. MyBatis 中 mapper 循环遍历应该怎么写？
9. 讲一下 Java 中哪些语句用到了反射，反射的原理？

### 数据库 & 事务

10. 讲讲你对事务的理解，项目用到了吗？为什么这里必须用事务，不用会怎样？
11. 事务失效的场景
12. 给了一张数据库表，两个查询需求，说一下怎么写查询语句

### 其他

13. 用前端写过网页吗？（岗位要求全栈）
14. Linux 中想要关掉 Tomcat 服务，怎么写命令？

---

## 参考解析

### Q6 线程池核心机制

- 核心参数：`corePoolSize`、`maximumPoolSize`、`keepAliveTime`、`workQueue`、`handler`。
- 工作流程：提交任务 → 核心线程未满则创建 → 已满则入队 → 队列已满则创建非核心线程 → 达到最大线程数则触发拒绝策略。
- 四种拒绝策略：`AbortPolicy`（抛异常）、`CallerRunsPolicy`（调用者执行）、`DiscardPolicy`（丢弃）、`DiscardOldestPolicy`（丢弃队头）。
- 面试官补充"使用"，可能期望聊 `Executors` 工厂方法或实际业务中的线程池配置实践。

### Q7 单例模式

- 懒汉式（线程安全）推荐写**双重检查锁（DCL）**：`volatile` 修饰实例字段 + 两层 `synchronized` 判空。
- 饿汉式：类加载时直接初始化，天然线程安全，代码最简洁。
- 最优雅写法：**静态内部类**，利用类加载机制保证懒加载与线程安全。

```java
public class Singleton {
    private Singleton() {}
    private static class Holder {
        private static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton getInstance() {
        return Holder.INSTANCE;
    }
}
```

### Q8 MyBatis mapper 循环遍历

- 使用 `<foreach>` 标签，常用于 `IN` 查询或批量插入。
- 关键属性：`collection`（list/array/map key）、`item`、`separator`、`open`、`close`。

```xml
<select id="queryByIds" resultType="User">
    SELECT * FROM user WHERE id IN
    <foreach collection="list" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>
```

### Q9 反射原理

- 反射允许在运行时获取类的结构信息并动态调用。核心类：`Class`、`Method`、`Field`、`Constructor`。
- 典型使用场景：Spring IoC（`Class.forName` + `newInstance`）、JDBC 加载驱动、注解处理器、MyBatis 结果集映射。
- 原理：JVM 将每个类的元数据存储在 `Class` 对象中，反射通过 JNI 访问这些元数据并绕过编译期检查。

### Q10 & Q11 事务理解与失效场景

- 事务四大特性 ACID：原子性、一致性、隔离性、持久性。
- Spring 事务通过 AOP 代理实现，注解为 `@Transactional`。
- **常见失效场景**：
  1. 方法非 `public`（Spring AOP 无法代理）
  2. 同类内部方法调用（绕过代理）
  3. 异常被 `catch` 吞掉未抛出
  4. 异常类型不匹配（默认只回滚 `RuntimeException`）
  5. 数据库引擎不支持事务（如 MyISAM）
  6. 多线程环境下事务上下文不传递

### Q14 Linux 关闭 Tomcat

- 优雅停止：进入 Tomcat `bin` 目录执行 `./shutdown.sh`。
- 强制终止：`ps -ef | grep tomcat` 找到 PID，再执行 `kill -9 <PID>`。
- 也可用 `systemctl stop tomcat`（若注册为系统服务）。
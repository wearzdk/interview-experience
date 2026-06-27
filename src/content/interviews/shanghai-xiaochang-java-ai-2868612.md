---
title: 上海自研小厂Java开发一面面经（含AI应用考察）
company: 上海某自研小厂
position: Java开发工程师
round: 一面
date: '2026-06'
base: 上海
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2868612
tags: ["Java","AI应用","ReAct","KVCache","并发","缓存","算法"]
summary: "上海某自研小厂Java一面，亮点是含AI应用考察（ReAct框架终止信号、KVCache原理、工具调用失败处理）。同时覆盖Java基础、锁对比、场景题（缓存宕机恢复、服务兜底）、代码题（单例模式、有效括号）。"
---

### 《面试题目》

**常规八股**

1. == 与 equals 的区别
2. String、StringBuffer、StringBuilder 的区别
3. 数组与链表的区别及各自适用场景
4. 栈与队列的区别及各自适用场景
5. synchronized 与 ReentrantLock 的区别及底层原理
6. git rebase 与 git merge 的区别

**场景题**

1. 项目缓存挂了，如何快速恢复
2. pay_service 挂了之后的兜底方案是什么
3. 某方法逻辑过长，如何进行拆分

**AI 应用考察**

1. ReAct 是什么（推理和行动）
2. 追问：ReAct 的终止信号是什么
3. 如何调用 tools
4. tools 调用失败了怎么办
5. KVCache 是什么

**手写题（可使用自己熟悉的 IDE）**

1. 手写单例模式
2. LeetCode 20：有效的括号（HashMap + Stack）

---

### 《参考解析》

**String/StringBuffer/StringBuilder 区别**
`String` 不可变（final char[]），拼接每次产生新对象，适合常量字符串；`StringBuffer` 可变且线程安全（方法加 synchronized），适合多线程场景；`StringBuilder` 可变非线程安全但性能最高，单线程字符串拼接首选。

**ReAct 框架**
ReAct（Reasoning + Acting）让 LLM 交替输出「思考（Thought）→ 行动（Action）→ 观察（Observation）」循环。终止信号是 LLM 生成 `Finish[answer]` 动作，或达到最大迭代次数上限；框架捕获该信号后停止循环并返回最终答案。

**KVCache**
大模型自回归推理时，Transformer 每步都需要计算所有历史 token 的 Key/Value 注意力向量。KVCache 将已计算的 K/V 矩阵缓存在显存中，生成新 token 时直接复用，避免重复计算，可大幅降低推理延迟（从 O(n²) 降至 O(n) 每步）。

**缓存宕机恢复**
① 重启 Redis 并检查 RDB/AOF 持久化文件是否完整，优先从 AOF 恢复数据；② 启动缓存预热脚本批量加载热点数据（防止冷启动缓存雪崩）；③ 恢复前对数据库层限流降级，拒绝超出容量的请求直接返回兜底数据。

**单例模式（双重检查锁）**
```java
public class Singleton {
    private static volatile Singleton instance;
    private Singleton() {}
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```
volatile 防止指令重排序导致返回未初始化完成的对象。
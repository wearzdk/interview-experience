---
title: 快手电商后端一面面经
company: 快手
position: 电商后端开发
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java基础","分布式锁","MySQL","RAG","链表算法","多线程"]
summary: "快手电商后端一面面经，涵盖Java异常体系、Object类方法、hashCode与equals规范、wait/notify与Thread.sleep区别、深浅拷贝、反转链表II算法、Redis分布式锁实现、MySQL原子性保证，以及RAG系统设计与向量化概念，适合Java后端求职备考参考。"
---

## 面试题目

**面试信息：** 2026年3月30日下午14:00，时长约47分钟

### 自我介绍

### Java 基础

1. 你在写 Java 的过程中见到过哪些 Java 的异常类，以及这些异常类大概都什么时候是触发的？
2. 刚才提到堆栈的异常，假如说一个程序发生了 OOM（Out of Memory），出现了这个异常，那这个程序是不是就 down 掉了？还是说它还会继续运行？
3. Java 有个 Object 类，是所有类的基类，它上面有一些方法是所有类都可以使用的，你知道哪些方法以及大概作用？
4. hashCode 和 equals 方法是做什么的呢？
5. 通常 Java 规范里面有一条要求：针对这两个方法，要 override 必须一起 override，不允许只 override 一个。为什么会有这种规范要求？或者说假如真的只 override 一个，不重写另外一个会有什么问题？
6. wait 和 notify 这两个方法的作用是什么？
7. wait 经常和 Thread.sleep() 方法做比较，这两个有什么区别？
8. notify 可以唤醒指定的线程吗？假如有好几个线程在等待，可以唤醒一个指定的线程吗？
9. 你知道什么叫深拷贝和浅拷贝吗？
10. 如果让你去深拷贝一个对象，你会怎么做？

### 算法

- 反转链表 II（LeetCode 92）

### 其他

1. 假如现在让你实现一个分布式锁，你该怎么实现？
2. MySQL 怎么保证原子性的？
3. 如果我们要实现 Agent，为什么要嵌入 RAG 这种技术？
4. 做一个 RAG 系统，分几部分？
5. 向量化是什么意思？
6. 你平时用 AI 就是用它写代码对吧？（求问：这个问题怎么回答比较好？）

### 反问

1. 团队业务方向
2. 快手面向哪些用户，与抖音的区别
3. 入职后主要工作内容

---

## 参考解析

### Java 常见异常类

- **Error 体系**：`StackOverflowError`（递归过深）、`OutOfMemoryError`（堆/方法区内存不足）。
- **RuntimeException（非受检）**：`NullPointerException`、`ArrayIndexOutOfBoundsException`、`ClassCastException`、`IllegalArgumentException` 等，无需显式 catch。
- **受检异常**：`IOException`、`SQLException`，必须显式处理。

### OOM 后程序是否崩溃

- `OutOfMemoryError` 是 `Error` 的子类，**不一定导致整个 JVM 崩溃**。
- 若 OOM 发生在某个线程中且未被捕获，该线程终止；若主线程或关键线程挂掉则程序 down 掉。
- 可通过 `try-catch (OutOfMemoryError e)` 捕获（不推荐），程序在极端情况下仍可继续运行其他逻辑，但状态通常已不可靠。

### Object 类常用方法

| 方法 | 作用 |
|---|---|
| `equals()` | 判断对象逻辑相等，默认比较引用 |
| `hashCode()` | 返回哈希码，用于散列集合 |
| `toString()` | 返回对象字符串表示 |
| `getClass()` | 返回运行时类型 |
| `clone()` | 浅拷贝对象（需实现 Cloneable） |
| `wait()/notify()/notifyAll()` | 线程协作，配合 synchronized 使用 |
| `finalize()` | GC 前调用（已废弃，Java 9+） |

### hashCode 与 equals 必须同时重写

- **规范**：`equals` 相等的两个对象，`hashCode` 必须相同。
- **只重写 equals 不重写 hashCode**：两个逻辑相等的对象放入 `HashMap`/`HashSet` 时，因 hashCode 不同会落在不同桶，导致去重失效、查找失败。
- **只重写 hashCode 不重写 equals**：hashCode 相同时还会用 equals 判断，逻辑相等判断失效。

### wait 与 Thread.sleep 的区别

| 对比项 | `wait()` | `Thread.sleep()` |
|---|---|---|
| 所属类 | Object | Thread |
| 是否释放锁 | **释放**锁 | **不释放**锁 |
| 唤醒方式 | notify/notifyAll 或超时 | 超时自动唤醒 |
| 使用前提 | 必须在 synchronized 块内 | 任意位置可用 |

### notify 能否唤醒指定线程

- `notify()` **不能指定**唤醒某个线程，由 JVM 随机（或按优先级）选一个等待线程唤醒。
- `notifyAll()` 唤醒所有等待线程，各自竞争锁。
- 若需精准唤醒，可使用 `java.util.concurrent.locks.Condition`，多个 `Condition` 对象分别管理不同等待队列。

### 深拷贝 vs 浅拷贝

- **浅拷贝**：复制对象本身，内部引用类型字段仍指向同一对象（`Object.clone()` 默认行为）。
- **深拷贝**：递归复制所有引用对象，完全独立。
- **实现深拷贝的方式**：
  1. 手动递归复制每个引用字段。
  2. 实现 `Cloneable` 并在 `clone()` 中对引用字段也调用 `clone()`。
  3. 序列化/反序列化（`Serializable`）。
  4. 使用第三方库如 Jackson（JSON 转换）或 Apache Commons `SerializationUtils.clone()`。

### 反转链表 II（LeetCode 92）

```java
// 反转第 left 到 right 之间的节点
public ListNode reverseBetween(ListNode head, int left, int right) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode pre = dummy;
    for (int i = 1; i < left; i++) pre = pre.next;
    ListNode cur = pre.next;
    for (int i = 0; i < right - left; i++) {
        ListNode next = cur.next;
        cur.next = next.next;
        next.next = pre.next;
        pre.next = next;
    }
    return dummy.next;
}
```

- 核心思路：哑节点 + 头插法，时间 O(n)，空间 O(1)。

### 分布式锁实现

- **Redis 方案（主流）**：`SET key value NX PX timeout`，原子性加锁，value 存唯一标识防误删，解锁用 Lua 脚本保证原子性。可使用 Redisson 客户端，内置看门狗续期。
- **ZooKeeper 方案**：创建临时顺序节点，最小节点获得锁，天然支持公平锁，但性能低于 Redis。
- **注意点**：锁超时时间设置、可重入性、主从切换下的安全问题（RedLock 方案）。

### MySQL 原子性保证

- 通过 **Undo Log（回滚日志）** 实现原子性。
- 事务中每次修改数据前，先将旧值写入 Undo Log；若事务失败或回滚，利用 Undo Log 将数据恢复到修改前状态。
- Undo Log 同时也用于 MVCC 的历史版本读取。

### 为什么 Agent 需要 RAG

- **LLM 局限**：训练数据有截止日期，无法获取实时/私域知识，且存在幻觉问题。
- **RAG 作用**：在推理时动态检索外部知识库，将相关文档片段注入 Prompt，使 Agent 能基于最新、准确的上下文回答，降低幻觉。
- 对于电商场景：商品信息、订单政策等私域数据无法预训练，必须依赖 RAG 实时检索。

### RAG 系统组成

1. **数据预处理**：文档切片（Chunking）。
2. **向量化（Embedding）**：将文本块用 Embedding 模型转为高维向量，存入向量数据库（如 Faiss、Milvus、Pinecone）。
3. **检索（Retrieval）**：用户 Query 向量化后，在向量库中做相似度检索（ANN），召回 Top-K 相关文档。
4. **生成（Generation）**：将召回文档拼接到 Prompt，交由 LLM 生成最终答案。

### 向量化是什么

- 将文本（或图像等）通过 Embedding 模型映射为固定维度的稠密浮点数向量（如 1536 维）。
- 语义相近的文本在向量空间中距离更近，可通过余弦相似度、点积等方式度量相似性。
- 常用模型：OpenAI `text-embedding-ada-002`、BGE、M3E 等。

### 关于"你平时用 AI 写代码"的回答建议

- **推荐思路**：如实回答，展示你对 AI 工具的理性使用态度。
- 参考话术：「会使用 AI 辅助编码（如 Copilot/Cursor），主要用于补全样板代码、查阅 API 用法、生成单元测试，但核心逻辑、架构设计和代码 Review 仍由自己主导。我认为 AI 是提升效率的工具，关键是要理解生成的代码而不是盲目复制。」
- 避免说"全靠 AI 写"或刻意否认使用 AI，诚实且展示独立思考能力是加分项。
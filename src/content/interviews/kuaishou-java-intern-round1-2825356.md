---
title: 快手 Java 暑期实习一面
company: 快手
position: Java 后端开发实习生
round: 一面
date: '2026-04'
result: 疑似挂
source: 牛客网
tags: ["Java","多线程","缓存一致性","Spring事务","SQL索引优化","Kafka幂等性"]
summary: "快手 Java 后端暑期实习一面，共 30 分钟，涵盖 Caffeine+Redis 两级缓存一致性、乐观锁并发处理、Kafka 幂等性、synchronized 锁竞争、Spring 事务失效、SQL 索引失效、三叉树 BFS 等核心考点，适合备战大厂 Java 实习面试。"
---

## 面试题目

### 项目相关

1. 你用 Caffeine + Redis 构建了两级缓存，这两级缓存的数据如何保持一致？
2. 你简历上写了"通过乐观锁解决支付回调与关单任务的并发冲突"，能介绍一下具体是怎么用乐观锁解决的？假设关单任务已经开始执行，这时候支付成功的回调过来了，是一个怎样的处理过程？
3. **（追问）** 如果支付回调过来，但乐观锁没抢到（update 失败），后续流程是什么？（用户已经付了钱，但订单被关闭了，怎么处理？）
4. 你的扣减库存是通过 Kafka 异步处理的，那消费 Kafka 消息进行库存扣减时，如何保证幂等性？（即一个订单不会被扣多次）
5. 你设计了 AI CodeReview 提示词，提高了代码缺陷识别率和 AI 输出质量，中间做了哪些优化？有没有一个递进改进的过程？
6. 在做 RAG 系统时，知识库是以什么方式进行切分（分块）的？

### 代码题

1. **锁竞争：** 给一段代码，多线程并发调用同一个对象的 Method1 和 Method2（两个方法都加了 `synchronized`，锁对象分别是两个不同变量 A、B，但 A 和 B 指向同一个对象），它们之间的锁是否会产生竞争？
2. **Spring 事务失效：** 给一段代码，是通过 Spring 管理的 Bean 实例调用 Method1，Method1 内部用 `this` 调用 Method2，Method2 上的 `@Transactional` 注解是否会生效？为什么？
3. **线程访问局部变量：** 要求写代码实现：有一个局部变量 `int x = 5`，不能移动它的定义位置，要在线程里对它加 5，最终输出 10，如何实现？
4. **（上一题改为八股）线程池参数：** 线程池的 `corePoolSize`、`maxPoolSize`、`workQueue` 这几个核心参数的关系是什么？假设使用无界队列，有新任务提交进来时，这几个参数的行为是怎样的？
5. **SQL 索引优化：** 有一张员工表，包含若干字段，给出一段查询 SQL（WHERE 条件中有对字段使用函数的情况，还有 ORDER BY），不考虑其他查询条件，想通过建索引来优化，应该在哪些字段上建索引？
6. **（追问）** 为什么在有函数的字段上建索引会失效？
7. **算法题：** 自定义三叉树节点结构，实现三叉树的广度优先遍历。

### 反问

1. 业务和技术栈
2. AI 的使用情况

---

## 参考解析

### 项目相关

**Q1. Caffeine + Redis 两级缓存一致性**
- 更新数据时采用"先更新 DB → 删除 Redis → 删除/失效本地 Caffeine"的顺序。
- 本地缓存失效可通过 Redis Pub/Sub 或 MQ 广播通知所有节点，各节点收到消息后主动淘汰本地缓存。
- Caffeine 设置较短的 TTL 作为兜底，避免长时间脏读。

**Q2-Q3. 乐观锁处理支付回调与关单并发**
- 核心字段：订单表增加 `version` 字段，`UPDATE ... WHERE id=? AND version=? AND status=?`，更新成功则继续，失败则回滚/重试。
- 关单先执行：将 status 改为"已关闭"，version+1；支付回调此时 update 影响行数为 0，进入补偿逻辑。
- 补偿方案：回调失败时发起退款流程，或将事件投入延迟队列，人工/自动核查后补偿退款，保障资金安全。

**Q4. Kafka 消费库存扣减幂等性**
- 在库存扣减前，用订单 ID 作为唯一键查重（Redis Set 或数据库唯一索引）。
- 若已消费过该订单，直接 ack 跳过；否则执行扣减并记录已消费标记，两步操作用事务或 Lua 脚本保证原子性。
- 也可在 `UPDATE` SQL 中加 `WHERE stock >= quantity` 做数量兜底，防止超扣。

---

### 代码题

**Q1. synchronized 锁竞争**
- A 和 B 是两个引用变量，但指向同一个对象，因此 `synchronized(A)` 与 `synchronized(B)` 持有的是同一把锁。
- 结论：**会产生锁竞争**，两个方法不能同时被不同线程执行。

**Q2. Spring 事务失效（this 调用）**
- Spring 事务基于 AOP 动态代理实现，`this.method2()` 绕过了代理对象，直接调用原始对象的方法。
- 结论：**`@Transactional` 不会生效**。解决方案：注入自身代理（`@Autowired` 自身 Bean）或通过 `AopContext.currentProxy()` 获取代理对象后调用。

**Q3. 线程访问局部变量**
- 局部变量需声明为 `final` 或等效 effectively final 才能被匿名内部类/Lambda 捕获，但 `int` 不可变，无法在线程内修改。
- 可将 `x` 包装为 `int[] x = {5}`，在线程中操作 `x[0] += 5`；或使用 `AtomicInteger`；也可用单元素数组绕过 final 限制。

**Q4. 线程池参数关系**
- 任务提交流程：线程数 < `corePoolSize` → 新建核心线程；≥ core → 入队 `workQueue`；队满 → 新建非核心线程直到 `maxPoolSize`；再满 → 触发拒绝策略。
- 使用**无界队列**（如 `LinkedBlockingQueue` 默认容量）时，队列永远不会满，`maxPoolSize` 参数实际上永远不会生效，非核心线程不会被创建，需警惕 OOM。

**Q5-Q6. SQL 索引失效（函数作用于索引列）**
- `WHERE YEAR(create_time) = 2024` 等对列使用函数，会导致 MySQL 无法使用该列的 B+ 树索引，需全表扫描。
- 优化方式：改写为范围查询 `WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01'`，使索引生效。
- `ORDER BY` 字段若与 `WHERE` 字段组成联合索引，且满足最左前缀原则，可同时优化过滤和排序，避免 filesort。

**Q7. 三叉树 BFS**
```java
class TreeNode {
    int val;
    TreeNode left, mid, right;
    TreeNode(int val) { this.val = val; }
}

void bfs(TreeNode root) {
    if (root == null) return;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        TreeNode node = queue.poll();
        System.out.print(node.val + " ");
        if (node.left  != null) queue.offer(node.left);
        if (node.mid   != null) queue.offer(node.mid);
        if (node.right != null) queue.offer(node.right);
    }
}
```
- 与二叉树 BFS 完全一致，只需在出队时将三个子节点依次入队即可。
---
title: 美团小象超市后端开发暑期实习一面
company: 美团
position: 后端开发实习生
round: 一面
date: '2026-03'
source: 牛客网
tags: ["Java并发","MySQL","Redis","消息队列","分库分表","JVM"]
summary: "美团小象超市营销组后端开发暑期实习一面，历时50分钟，涉及CompletableFuture、HashMap红黑树转换、G1与CMS对比、MySQL事务隔离级别、接口超时排查、水平分表跨片分页、消息队列消息不丢失、Redis库存扣减原子性与分布式事务，以及算法题前K个高频单词。"
---

## 面试题目

### 基本信息
- 部门：食杂零售 - 小象超市营销组
- 时长：约 50 分钟
- 类型：暑期实习一面

### 实习经历追问
- 拷打实习项目经历

### Java & JVM
1. `CompletableFuture` 中 `allOf` 和 `anyOf` 的区别？
2. HashMap 中的链表什么时候会转变为红黑树？为什么不直接使用红黑树？
3. G1 和 CMS 的区别？G1 在什么场景下使用？

### MySQL
4. MySQL 事务隔离级别有哪些？

### 系统设计 & 排查
5. 接口超时了怎么排查？
6. 水平分表后，如何处理跨分片的分页查询？

### 消息队列
7. 消息队列如何保证消息不丢失？

### Redis & 分布式
8. 给了一段 Redis 库存扣减 + 写 DB 订单的代码，问有什么问题？
   - 核心问题一：没有用 Lua 脚本保证库存扣减的原子性
   - 核心问题二：Redis 操作与 DB 操作不是原子性的，需要引入分布式事务

### 算法题
9. 手撕：前 K 个高频单词（LeetCode 692）

### 行为问题
- 为什么不做专业相关的工作？是怎么学习 Java 的？学习过程中遇到了什么阻碍？
- 学习和生活中怎么获得反馈？印象最深刻的一次反馈是什么？
- 怎么使用 AI Coding 工具？

---

## 参考解析

### 1. CompletableFuture allOf vs anyOf
- `allOf`：等待**所有**传入的 Future 全部完成后才完成，返回 `CompletableFuture<Void>`。
- `anyOf`：只要**任意一个** Future 完成，就立即完成，返回值为最先完成的那个结果（`CompletableFuture<Object>`）。
- 实际场景：allOf 适合聚合多个并行任务结果；anyOf 适合竞速、降级等场景。

### 2. HashMap 链表转红黑树
- 触发条件：链表长度 ≥ 8 **且** 数组长度 ≥ 64 时才转为红黑树；数组长度不足 64 时优先扩容。
- 不直接用红黑树原因：红黑树节点占用空间约为链表节点的 2 倍；元素较少时链表查询（O(n)）的实际开销并不大，且构造/旋转红黑树有额外开销；大多数情况下哈希分布均匀，链表长度很短。

### 3. G1 vs CMS
- CMS（Concurrent Mark Sweep）：以最短停顿为目标，老年代并发标记清除，会产生内存碎片，无法压缩。
- G1（Garbage First）：将堆划分为等大小的 Region，可预测停顿时间（`-XX:MaxGCPauseMillis`），兼顾吞吐量与低延迟，JDK 9+ 默认 GC。
- 选 G1 的场景：堆内存较大（≥ 6GB）、需要可控停顿时间、CMS 频繁 Full GC 或碎片严重时。

### 4. MySQL 事务隔离级别
| 级别 | 脏读 | 不可重复读 | 幻读 |
|------|------|-----------|------|
| READ UNCOMMITTED | ✓ | ✓ | ✓ |
| READ COMMITTED | ✗ | ✓ | ✓ |
| REPEATABLE READ（默认）| ✗ | ✗ | 部分解决 |
| SERIALIZABLE | ✗ | ✗ | ✗ |
- InnoDB 在 RR 下通过 MVCC + Gap Lock 解决大部分幻读问题。

### 5. 接口超时排查思路
- 链路层：查看监控/链路追踪（Tracing），定位是哪个服务/中间件耗时长。
- DB 层：慢查询日志、执行计划（EXPLAIN）、索引缺失、锁等待。
- 第三方调用：下游服务超时、网络抖动，考虑熔断降级。
- 本机：线程池打满、GC 停顿、CPU 飙升导致排队。
- 结合日志、APM 工具（SkyWalking/Prometheus）综合定位。

### 6. 跨分片分页查询
- 全局排序法：将每个分片的数据汇聚到应用层或中间件，全局排序后取目标页，性能较差。
- 禁止跳页：只支持"下一页"，记录上一页最后一条记录的游标（Cursor-based pagination），效率高。
- 二次查询法：先各分片查 offset+limit 条，汇总排序取前 limit 条，页数越深性能越差。
- 业务限制：限制最大翻页深度（如电商只展示前 100 页）。

### 7. 消息队列保证消息不丢失
- **生产者**：开启确认机制（Kafka acks=all；RocketMQ 同步发送 + 重试）。
- **Broker**：持久化消息到磁盘，主从同步后再 ACK。
- **消费者**：手动 ACK，业务处理成功后再提交 offset/确认消费，失败放入死信队列重试。
- 幂等性：消费者做好幂等，避免重复消费带来的副作用。

### 8. Redis 库存扣减 + 写 DB 的问题
- **原子性问题**：先判断库存再扣减是两步操作，并发下会超卖；应使用 Lua 脚本将"查询 + 扣减"合并为原子操作。
- **一致性问题**：Redis 扣减成功但 DB 写入失败（或反之），会导致数据不一致；解法：引入分布式事务（如 Seata AT 模式）或使用可靠消息最终一致性方案（本地消息表 + MQ）。

### 9. 前 K 个高频单词（LeetCode 692）
```java
public List<String> topKFrequent(String[] words, int k) {
    Map<String, Integer> freq = new HashMap<>();
    for (String w : words) freq.merge(w, 1, Integer::sum);
    // 小根堆：频次小的在堆顶，频次相同时字典序大的在堆顶（方便淘汰）
    PriorityQueue<String> heap = new PriorityQueue<>(
        (a, b) -> freq.get(a).equals(freq.get(b))
            ? b.compareTo(a) : freq.get(a) - freq.get(b)
    );
    for (String w : freq.keySet()) {
        heap.offer(w);
        if (heap.size() > k) heap.poll();
    }
    List<String> res = new LinkedList<>();
    while (!heap.isEmpty()) res.add(0, heap.poll());
    return res;
}
```
- 时间复杂度 O(n log k)，空间 O(n)。

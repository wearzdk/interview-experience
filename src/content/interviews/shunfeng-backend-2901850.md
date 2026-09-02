---
title: 9.2顺丰提前批一面
company: 顺丰
position: Java后端开发
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2901850
tags: ["Java", "Kafka", "Redis", "数据库", "项目面"]
summary: 顺丰提前批一面，围绕项目中的热点探测、Kafka 灾难回放、限流、Redis 哨兵和数据库索引展开。
---

### 《面试题目》

1. 项目中的 hotkey 探测如何实现，如何识别假热点数据？
2. Kafka 宕机时如何保证灾难回放能够继续或恢复？
3. 限流排队为什么使用 ZSet 而不是阻塞队列？
4. Expirable Semaphore 如何防止 permit 泄露？
5. ArrayList 和 LinkedList 有什么区别？
6. Java 有哪些引用类型？
7. 哪些异常会触发事务回滚，如何配置回滚规则？
8. `@Autowired` 和 `@Resource` 有什么区别？
9. Redis 哨兵如何判断主节点下线并选择切换节点？
10. `c>1 AND b=1 AND a=2` 时联合索引能否生效？
11. 如何从一百亿个数中找出最大的十个？

### 《参考解析》

热点探测应结合访问频率与时间窗口，并用业务校验过滤伪造数据。Kafka 回放要依赖持久化日志、消费位点和幂等处理，宕机后从已确认位点恢复。ZSet 能按时间或优先级排序并支持过期清理；信号量租约需在超时后回收。哨兵通过主观下线与多数哨兵确认形成客观下线，再选举执行故障转移。联合索引遵循最左匹配和范围截断原则，具体是否使用需以执行计划为准。海量数据取 Top-K 可用大小为 K 的最小堆，复杂度 O(n log K)。

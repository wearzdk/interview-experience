---
title: "从手机号全表扫描到联合索引顺序：索引失效的四个追问"
company: 某公司
position: 后端开发（实习）
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/949175095493226496
tags: ["MySQL","索引失效","隐式转换","联合索引","索引跳跃扫描","EXPLAIN"]
summary: "实习时一个用户查询接口把 phone 传成 Long，慢查询日志里频繁出现全表扫描，`possible_keys` 有值但 `key` 为空。帖主由此复盘：最左前缀不是背顺序、等值条件顺序会被优化器重排、范围查询之后的列只能过滤、`OR` 与字符集不一致最隐蔽，以及「有索引但优化器不走」属于成本问题而非失效。"
---

### 《面试题目》

1. 说说索引失效的场景。
2. 你项目里真遇到过吗？怎么确认是索引失效，而不是优化器不想用？
3. `phone` 是 `varchar`、参数是 `Long`，为什么就全表扫了？把字段改成 `bigint` 是不是更好？
4. 联合索引 (status, type, created_at)，`WHERE type = 2 AND status = 1 ORDER BY created_at DESC` 能用上索引吗？只查 `type` 呢？
5. `WHERE status = 1 AND type > 2 AND created_at = '...'` 里 `created_at` 还能定位吗？
6. `OR` 和字符集不一致分别会造成什么问题？
7. `status` 上有索引，为什么查 `status = 1` 还是全表扫？要不要 `force index`？
8. 你现在排查慢 SQL 的顺序是什么？

### 《参考解析》

**手机号查询的定位过程**：`select id, nickname from user where phone = ?`，`phone` 是 `varchar(20)`、Java 侧参数是 `Long`。功能正常但慢查询频繁，`EXPLAIN` 显示 `type=ALL`、`key=null`、`rows` 接近全表，而 `possible_keys` 里有 `idx_phone`。原因是隐式类型转换把字符串列转成数字，等价于在索引列上套了函数。参数改成 `String` 后 `type` 变成 `ref`，扫描行数立刻下降。帖主特别提醒：不要把手机号改成 `bigint` 来「省空间」，前导零、长度变化与国际号码都会出问题，字段类型应跟业务语义走。

**联合索引的顺序**：`(status, type, created_at)` 上 `WHERE type = 2 AND status = 1 ORDER BY created_at DESC`，等值条件的位置优化器会重排，status 与 type 都能用于索引查找，created_at 还能顺带满足排序。真正出问题的是只查 `type`：最左列 status 没出现，普通 B+ 树索引用不上。MySQL 8.0 的索引跳跃扫描在某些场景能救，但不应当作常规设计依据。

**范围截断**：`WHERE status = 1 AND type > 2 AND created_at = '...'`，type 走范围后，created_at 不能继续用于定位，只能在索引下推时做过滤。这个细节面试官很爱追问，回答时要区分「缩小扫描区间」与「减少回表」。

**OR 与字符集**：`WHERE a = 1 OR b = 2`，b 没索引时优化器很可能直接全表扫；两张表关联字段一个 `utf8` 一个 `utf8mb4` 时，join 需要转换，被驱动表的索引失效，而且 `EXPLAIN` 里不一定直接告诉你原因，只能靠对比单表查询与 join 的差异定位。

**「有索引但优化器不走」**：`status` 只有两三个取值、查询又要取大半张表时，回表成本比顺序扫更高，优化器主动放弃；小表同理。`possible_keys` 有值但 `key` 为 `null` 就是这种情况。不要急着 `force index`，先看数据分布与统计信息，再对比强制走索引的实际耗时，最后决定调整索引还是接受全表扫。

**排查顺序**：`EXPLAIN` 的 `type`、`key`、`rows`、`Extra` → 检查 SQL 有没有函数、运算、隐式转换 → 检查联合索引顺序与范围查询位置 → 看 `OR`、字符集、排序分组 → 最后看优化器成本与数据分布。帖主的总结是：索引失效不是非黑即白的结论，很多时候是「这个查询在当前数据下，走索引不划算」。

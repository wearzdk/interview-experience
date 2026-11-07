---
title: "三面挂在一道索引题上：联合索引、IN 与 ORDER BY 的真实判断"
company: 某公司
position: 后端开发
round: 三面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/948705744176640000
tags: ["MySQL","联合索引","filesort","覆盖索引","IN","执行计划"]
summary: "三面时面试官给了一条带 `user_id = ? AND status IN (?, ?) ORDER BY created_at DESC LIMIT 20` 的 SQL，问能不能走联合索引、需不需要回表。作者答「能走索引但会回表 + filesort」，被追问「status IN 之后 user_id 还能高效用上吗、排序真的避免不了吗」当场卡住。复盘后的结论是：判断索引问题要回到 B+ 树怎么排序，而不是背失效清单。"
---

### 《面试题目》

1. 表上有 `KEY idx_user_status (user_id, status)`，下面这条 SQL 能用到这个索引吗？需不需要回表？
2. `status IN (1, 2)` 之后，`user_id` 那部分索引还能高效用上吗？
3. `ORDER BY created_at DESC` 的排序能不能避免？
4. 如果把 `created_at` 加进联合索引，能改善什么？filesort 会消失吗？
5. `IN` 在索引使用上算等值还是范围？
6. 「走了索引」就等于「快」吗？还要看哪些字段？

```sql
SELECT id, created_at
FROM orders
WHERE user_id = 10086
  AND status IN (1, 2)
ORDER BY created_at DESC
LIMIT 20;
```

### 《参考解析》

**先回答第一层：能走索引，但有回表和排序。** `idx_user_status (user_id, status)` 是按 `(user_id, status)` 排好序的 B+ 树，`user_id` 等值定位后，`status IN (1,2)` 等价于两段不连续的区间，扫描的是 `(10086,1)` 与 `(10086,2)` 两段，所以索引前缀确实用上了。问题在于 `SELECT` 里的 `created_at` 不在索引里，需要回表取；而索引按 `(user_id, status)` 有序，同一组 `(10086, 1)` 内部 `created_at` 是无序的，排序只能走 filesort。于是真实代价是：扫描该用户所有 `status IN (1,2)` 的行 → 全部回表 → 排序 → 取前 20。

**第二层：`IN` 在索引里是多段区间。** 很多资料把 `IN` 当等值处理，这在「能否用上该列」上大致成立（`EXPLAIN` 可能显示 `range` 或 `ref`），但在「能否继续用后面的列排序」上不成立——多个取值对应多段区间，段与段之间不是全局有序。本例里 `status` 已是联合索引的最后一列，所以影响不大；如果索引是 `(user_id, status, created_at)`，各段内部的 `created_at` 有序，跨段仍然无序，排序仍可能触发 filesort，具体要看优化器是否做区间归并。

**第三层：加 `created_at` 到索引，收益是覆盖而不是消灭排序。** `ALTER TABLE orders ADD KEY idx_user_status_time (user_id, status, created_at)` 之后，`WHERE` 用上前两列，`created_at` 进入索引：`SELECT` 需要的 `created_at` 可以直接从二级索引取到，`id` 作为主键天然存在于 InnoDB 二级索引中，于是不再回表——这是实打实的提升。用 `EXPLAIN` 对比：原索引 `type` 可能是 `ref`，`Extra` 显示 `Using where; Using filesort`；新索引 `type` 变成 `range`，扫描行数与回表次数明显下降，但 `Using filesort` 可能仍然存在。

**第四层：要区分「用上了」和「用好了」。** 判断一条 SQL 的索引效果，不能只看 `type` 是否为 `ALL`，要同时看 `key`（实际用了哪个索引）、`key_len`（联合索引用到第几列）、`rows`（预估扫描行数）、`Extra`（`Using index` 表示覆盖、`Using filesort` 表示额外排序、`Using index condition` 表示索引下推）。作者复盘时承认自己当时只回答了第一层，没意识到「走了索引」与「快」是两件事。

**可选的改写方向。** 若这个查询很热，除了加索引，还可以把条件改写成索引更友好的形式：拆成 `status = 1` 与 `status = 2` 两条分别查、在应用层归并，各自都能走 `(user_id, status, created_at)` 且段内有序；或者按 `status` 做冗余/分表。选择哪一种取决于数据分布与查询频率，而不是「哪种写法看起来更高级」。

**这道题的教训。** `LIKE '%x'`、函数包裹列、隐式类型转换这些失效清单背得再熟，遇到「联合索引列顺序 + 排序」的组合仍会露馅。索引问题的本质是 B+ 树怎么排序、优化器怎么算成本，把这一点想清楚，比背十条结论有用。

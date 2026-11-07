---
title: "后端实习面试复盘：联合索引顺序、IN 与排序被追问二十分钟"
company: 某公司
position: 后端开发（实习）
round: 二面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/948706188814774272
tags: ["后端实习","联合索引","最左前缀","filesort","执行计划","简历真实性"]
summary: "简历上写了一句「优化过一条慢查询」，第三轮技术面被盯着问了近二十分钟：`(user_id, status)` 与 `(status, user_id)` 有什么区别、只按 status 查能不能用上索引、`status IN (1,2)` 会不会破坏排序、`WHERE user_id = ? AND status IN (?,?) ORDER BY created_at DESC` 会不会 filesort。作者复盘：知道「加了索引变快」，但说不清为什么是这个顺序。"
---

### 《面试题目》

1. `(user_id, status)` 和 `(status, user_id)` 两个联合索引有什么区别？
2. 如果有一个查询只按 status 查，能用上 `(user_id, status)` 吗？
3. 联合索引的顺序到底怎么定？「区分度高的列放前面」是不是铁律？
4. 下面这条 SQL 会走索引吗？会不会 filesort？为什么不用 `(user_id, status, created_at)`？`status IN (1,2)` 会不会破坏排序？
5. `WHERE DATE(created_at) = '2024-01-01'`、`WHERE order_no LIKE '%abc'`、`WHERE amount + 1 > 100` 为什么会让索引失效？
6. 隐式类型转换是怎么让索引失效的？
7. `EXPLAIN` 里 `Using index condition` 与 `Using filesort` 应该怎么判断？

### 《参考解析》

```sql
select id, order_no, amount, created_at
from orders
where user_id = 123 and status in (1, 2)
order by created_at desc
limit 20;
```

**两个索引的区别在「谁做最左列」。** `(user_id, status)` 可以服务「按 user_id 过滤、再按 status 过滤」以及「只按 user_id 过滤」，但只按 status 查时用不上（除非覆盖索引或 8.0 的 skip scan）；`(status, user_id)` 反过来。最左前缀不是背出来的规则，而是 B+ 树的物理排序：索引先按第一列排序、第一列相同再按第二列排序，所以查询条件必须从最左列开始才能定位区间。

**联合索引顺序的实用判据。** 「区分度越高越靠前」只是经验，更实用的判断是：先看这两列各自出现在哪些查询里、能否共用；等值条件放前面，范围条件放最后（范围之后的列无法继续用于定位）。如果两列区分度差不多，就按「哪一列在更多查询里以等值出现」来定。写入频繁的表还要控制索引数量，每多一个索引就多一次写放大。

**那条 SQL 的判断分两层。** 第一层：`user_id` 等值定位、`status IN (1,2)` 是两段区间，`(user_id, status)` 能用上，但 `created_at` 不在索引里，需要回表取；索引按 `(user_id, status)` 有序，同一组内部 `created_at` 无序，所以 `ORDER BY created_at DESC` 只能 filesort。第二层：如果改成 `(user_id, status, created_at)`，`created_at` 进入索引，`SELECT` 需要的列（`created_at` 与主键 `id`）都能从二级索引取到，不再回表——这是主要收益。但 `status IN (1,2)` 是多段区间，各段内部有序、跨段无序，严格说 filesort 仍可能出现，具体看优化器是否做区间归并。面试时把「收益是覆盖，不一定是消灭排序」说清楚，比笼统回答「加了索引就不 filesort」准确。

**三类经典失效的原因要说「为什么」而不是「会失效」。** `DATE(created_at)` 包住了列，优化器无法用 B+ 树的有序性定位区间；`LIKE '%abc'` 前导通配符无法确定起点；`amount + 1 > 100` 在列上做了运算。隐式类型转换是同一类问题：`order_no` 是 varchar 而传了数字，MySQL 把列转成数字比较，等价于在列上套了 `CAST`。

**`EXPLAIN` 要组合看，不要当成开关。** `Using index condition` 表示索引下推（在存储引擎层过滤，减少回表），不等于「用上了索引定位」；`Using filesort` 表示需要额外排序，但如果排序的数据量很小（例如回表后只剩几十行），代价可以接受。判断时应同时看 `key`、`key_len`（联合索引用到第几列）、`rows`、`filtered` 与 `Extra`。

**简历上写的东西必须能讲到第二层。** 作者复盘说，他知道「加了索引变快」，但面试官问「为什么是这个顺序」「为什么不建两个单列索引」时就含糊了。补救办法很笨但有效：每加一个索引，先记录加之前与之后的 `key`、`rows`、`Extra`，再手动把索引顺序换一次做对比；下次被问「为什么是这个顺序」，至少能说出自己试过什么、结果差在哪里。

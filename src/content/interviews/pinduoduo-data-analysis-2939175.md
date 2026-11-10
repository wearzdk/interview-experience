---
title: "拼多多数分面经：两种 SQL 写法求每日新用户与七日留存"
company: "拼多多"
position: "数据分析"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/482fb551ba014ad09a754cf7a67249bd
tags: ["拼多多","数据分析","SQL","窗口函数","留存率","lead","case when"]
summary: "拼多多数分面试的 SQL 题：求每日新用户（首次下单）数量与七日留存率，要求分别用 lead() 和 max(case when) 两种写法完成，并说明首次下单如何锁定、留存窗口如何判断。"
---

### 《面试题目》

1. 求每日新用户（首次下单）的数量和七日内留存率，要求用两种方法：一种用 `lead()`，一种用 `max(case when)`。

### 《参考解析》

**先把口径定清楚。** 「新用户」指当日完成首次下单的用户，首次下单日期取每个用户的最早下单日；「七日留存」指首次下单后 7 天内再次下单，分母是当日新用户数。两个细节会改变结果：首单当天重复下单算不算留存（通常不算，要严格晚于首单日），以及第 7 天是否包含在窗口内（本解法包含，条件写成小于等于首单日加 7 天）。如果业务口径是 D1 到 D7 的自然日留存，条件要改成 `between first_order_date + 1 and first_order_date + 7`。

**方法一：`lead()` 取下一单日期。** 先按用户和日期去重，避免一天多单影响排序；再用 `row_number()` 标记首单，用 `lead()` 取同一用户的下一次下单日期；筛出首单后判断下一次下单是否落在 7 天窗口内。

```sql
WITH user_order_days AS (
    SELECT DISTINCT user_id, DATE(order_time) AS order_date
    FROM orders
),
ordered AS (
    SELECT
        user_id,
        order_date,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date) AS rn,
        LEAD(order_date) OVER (PARTITION BY user_id ORDER BY order_date) AS next_order_date
    FROM user_order_days
),
new_users AS (
    SELECT user_id, order_date AS first_order_date, next_order_date
    FROM ordered
    WHERE rn = 1
)
SELECT
    first_order_date AS dt,
    COUNT(*) AS new_user_cnt,
    SUM(CASE WHEN next_order_date <= DATE_ADD(first_order_date, INTERVAL 7 DAY)
             THEN 1 ELSE 0 END) / COUNT(*) AS retention_7d
FROM new_users
GROUP BY first_order_date
ORDER BY dt;
```

`lead()` 只看下一单，但这里足够：日期已排序，如果下一单都超出 7 天，后面更不可能落在窗口内。反过来，下一单在窗口内就说明 7 天内至少有一次复购。

**方法二：`max(case when)` 标记是否留存。** 先算出每个用户的首次下单日，再与按日去重的下单记录左连接，用 `max(case when ... then 1 else 0 end)` 汇总窗口内是否存在复购，最后按首单日分组统计。

```sql
WITH user_first_order AS (
    SELECT user_id, MIN(DATE(order_time)) AS first_order_date
    FROM orders
    GROUP BY user_id
),
user_order_days AS (
    SELECT DISTINCT user_id, DATE(order_time) AS order_date
    FROM orders
),
user_retention AS (
    SELECT
        f.user_id,
        f.first_order_date,
        MAX(CASE WHEN o.order_date > f.first_order_date
                  AND o.order_date <= DATE_ADD(f.first_order_date, INTERVAL 7 DAY)
                 THEN 1 ELSE 0 END) AS is_retained
    FROM user_first_order f
    LEFT JOIN user_order_days o ON f.user_id = o.user_id
    GROUP BY f.user_id, f.first_order_date
)
SELECT
    first_order_date AS dt,
    COUNT(*) AS new_user_cnt,
    SUM(is_retained) AS retained_user_cnt,
    ROUND(SUM(is_retained) / COUNT(*), 4) AS retention_7d
FROM user_retention
GROUP BY first_order_date
ORDER BY dt;
```

左连接保证没有复购的用户也留在分母里；如果用内连接，未留存用户会被丢掉，留存率会虚高。

**容易追问的边界。** 一是数据完整性：统计当天的新用户还没有满 7 天观察窗口，严格口径应只统计已满窗口的 cohort，或在报表上标注「未成熟」。二是订单状态：退款、取消、风控拦截的订单是否计入，要在 `orders` 的过滤条件里统一。三是时区：`DATE(order_time)` 依赖会话时区，跨时区业务要先统一到业务时区。四是性能：`orders` 表按 `(user_id, order_time)` 建索引，先聚合再去重，大表按日期分区或做增量物化，避免每次全表扫描。

**两种写法的取舍。** `lead()` 版本只扫一遍有序数据，适合按用户维度已经排好序的场景；`max(case when)` 版本更直观，便于扩展成「7 天内下单次数」「7 天内下单金额」这类多指标，但连接与聚合的开销更大。面试时先写能跑对的版本，再说明另一种写法与各自的适用条件。

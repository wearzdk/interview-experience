---
title: 拼多多数据分析笔试面经（0922 SQL三题）
company: 拼多多
position: 数据分析
round: 笔试
date: '2026-09'
result: 笔试AC
source: 牛客网
tags: ["SQL","数据分析","窗口函数","留存","笔试"]
summary: "拼多多9月22日数据分析笔试面经，只有三道SQL题且难度不高：计算上/下半年销售额及增长、统计第0/1/2个月留存人数、取每个品类GMV最高的两个产品，作者全部AC。"
---

### 《面试题目》

1. 计算上半年、下半年的销售额以及增长率（原帖对指标名记忆模糊）。
2. 统计第 0、1、2 个月的留存人数。
3. 取每个品类中 GMV 最高的两个产品。

### 《参考解析》

**第 1 题：上下半年销售额与增长率**。核心是「条件聚合」，不需要写两个子查询再 JOIN：

```sql
SELECT
  SUM(CASE WHEN MONTH(dt) BETWEEN 1 AND 6 THEN amount ELSE 0 END) AS h1,
  SUM(CASE WHEN MONTH(dt) BETWEEN 7 AND 12 THEN amount ELSE 0 END) AS h2,
  (SUM(CASE WHEN MONTH(dt) BETWEEN 7 AND 12 THEN amount ELSE 0 END)
   - SUM(CASE WHEN MONTH(dt) BETWEEN 1 AND 6 THEN amount ELSE 0 END))
  / NULLIF(SUM(CASE WHEN MONTH(dt) BETWEEN 1 AND 6 THEN amount ELSE 0 END), 0) AS growth
FROM orders
WHERE dt >= '2026-01-01' AND dt < '2027-01-01'
  AND status = 'paid';
```

几个必须提的细节：①增长率一定要用 `NULLIF(分母, 0)` 兜底，否则上半年为 0 时会直接报除零错误；②`SUM` 里用 `ELSE 0` 而不是靠 `NULL` 忽略，避免整行被过滤成 NULL；③如果表里有多年的数据，`GROUP BY YEAR(dt)` 分开算，别把年份混在一起；④"销售额"的口径要跟面试官确认——是下单金额、支付金额还是剔除退款后的实收，这直接决定 `WHERE` 条件，面试里主动问口径是加分项。

**第 2 题：第 0/1/2 个月留存**。留存的标准做法是「先定 cohort（用户首次活跃/首单月份），再按自然月对齐做条件计数」：

```sql
WITH first_m AS (
  SELECT user_id, DATE_FORMAT(MIN(dt), '%Y-%m') AS cohort
  FROM user_actions GROUP BY user_id
),
act AS (
  SELECT DISTINCT user_id, DATE_FORMAT(dt, '%Y-%m') AS m
  FROM user_actions
)
SELECT
  f.cohort,
  COUNT(DISTINCT CASE WHEN TIMESTAMPDIFF(MONTH, CONCAT(f.cohort,'-01'), CONCAT(a.m,'-01')) = 0 THEN a.user_id END) AS m0,
  COUNT(DISTINCT CASE WHEN TIMESTAMPDIFF(MONTH, CONCAT(f.cohort,'-01'), CONCAT(a.m,'-01')) = 1 THEN a.user_id END) AS m1,
  COUNT(DISTINCT CASE WHEN TIMESTAMPDIFF(MONTH, CONCAT(f.cohort,'-01'), CONCAT(a.m,'-01')) = 2 THEN a.user_id END) AS m2
FROM first_m f
JOIN act a ON a.user_id = f.user_id
GROUP BY f.cohort;
```

要点：①第 0 月留存按惯例等于 100%（分母就是当月新增），有的公司要求第 1 月就是首月之后那个月；②必须用**自然月对齐**（`TIMESTAMPDIFF(MONTH, ...)`）而不是"加 30 天/60 天"，两者的口径完全不同；③分母是该 cohort 的新增用户数，所以最后还要除以 `COUNT(DISTINCT user_id)` in `first_m` 得到留存率；④`COUNT(DISTINCT ...)` 不能写成 `SUM`，否则同一用户同月多次活跃会被重复计数。

**第 3 题：每个品类 GMV 最高的两个产品**。窗口函数是最干净的写法：

```sql
WITH t AS (
  SELECT
    category_id,
    product_id,
    SUM(amount) AS gmv,
    ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY SUM(amount) DESC, product_id) AS rn
  FROM orders
  WHERE status = 'paid'
  GROUP BY category_id, product_id
)
SELECT category_id, product_id, gmv FROM t WHERE rn <= 2;
```

考点在三个地方：①窗口函数和 `GROUP BY` 的**执行顺序**——`SUM` 聚合先算，窗口函数在聚合结果之上再排序，所以 `ORDER BY SUM(amount)` 是合法的，写成子查询嵌套只是风格问题；②并列怎么处理——只要"两个"用 `ROW_NUMBER()`，允许并列都保留用 `RANK()`，或 `DENSE_RANK()`；`ORDER BY` 里补一个 `product_id` 做 tie-breaker 可以保证结果稳定可复现；③如果面试官追问 MySQL 5.7（不支持窗口函数），就用自连接计数：`SELECT ... FROM t a WHERE (SELECT COUNT(*) FROM t b WHERE b.category_id=a.category_id AND b.gmv > a.gmv) < 2`，或者用用户变量模拟排名。

**这场笔试的启示**：三道题都在考"能不能把业务口径翻译成 SQL 结构"，而不是炫技。真正容易失分的地方不是窗口函数写不出来，而是漏掉除零、NULL、退款口径、去重、并列这些边界。写完自查一遍这几项，比多刷十道题管用。

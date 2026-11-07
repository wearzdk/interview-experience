---
title: "滴滴数据分析 SQL 三题：分组排名、连续 id 与连续登录"
company: 滴滴
position: 数据分析师
round: SQL 面试
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/ef232ec8249747a5bb4bf5ba03e84ddf
tags: ["滴滴","数据分析","SQL","窗口函数","连续登录","留存","面试题"]
summary: "滴滴数据分析岗三道 SQL 题及写法：不及格课程数不少于两门的学生求全部科目平均分并排名；对连续 id 分组、求每组最后一个 id 与组内条数；求每个用户截至当天的连续登录天数，并找出连续登录七天以上后次日流失、以及彻底流失的用户。三题都用「日期或 id 减去行号构造分组键」这一套思路。"
---

### 《面试题目》

1. 从成绩表 `tb_score` 中，找出不及格课程数 ≥ 2 的学生的全部科目平均分，并按平均分给出排名。
2. 给定一张自增 id 表 `tb_id`，把连续 id 分成一组，求每组的最后一个 id 及组内个数。
3. 给定登录表 `tb_login`（uid、login_date）：
   - 3.1 求每个用户截至当天的连续登录天数；
   - 3.2 找出连续登录 ≥ 7 天后次日流失的用户；
   - 3.3 如果「流失」指彻底不再登录，SQL 怎么写？

### 《参考解析》

**第一题先聚合再过滤，排名用窗口函数。** 先在子查询里按 `student_id` 分组，算出 `AVG(score)` 与不及格门数 `SUM(CASE WHEN score < 60 THEN 1 ELSE 0 END)`，外层再筛 `fail_cnt >= 2`，并用 `RANK() OVER (ORDER BY avg_score DESC)` 给出排名。注意两点：`AVG` 会自动忽略 NULL，若缺考记为 0 分需要先 `COALESCE`；排名用 `RANK` 会出现并列同名次，用 `ROW_NUMBER` 则强制唯一，按题目口径选择。若学生可能没有任何成绩记录，`GROUP BY` 后该学生不会出现，需要确认口径是否要补 0。

```sql
WITH t AS (
  SELECT student_id,
         AVG(score) AS avg_score,
         SUM(CASE WHEN score < 60 THEN 1 ELSE 0 END) AS fail_cnt
  FROM tb_score
  GROUP BY student_id
)
SELECT student_id, avg_score,
       RANK() OVER (ORDER BY avg_score DESC) AS rk
FROM t
WHERE fail_cnt >= 2
ORDER BY rk;
```

**第二题的核心是「id 减去行号」构造分组键。** 对按 id 升序排列的行编号 `ROW_NUMBER()`，若 id 连续，则 `id − rn` 恒定；一旦出现断档，差值就会跳变，于是同一个差值就是同一组。分组后取 `MAX(id)` 与 `COUNT(*)` 即可。

```sql
WITH t AS (
  SELECT id, id - ROW_NUMBER() OVER (ORDER BY id) AS grp
  FROM tb_id
)
SELECT MAX(id) AS last_id, COUNT(*) AS cnt
FROM t
GROUP BY grp
ORDER BY last_id;
```

这个套路可以平移到日期：`DATE_SUB(dt, INTERVAL ROW_NUMBER() OVER (PARTITION BY uid ORDER BY dt) DAY)` 得到连续登录段的分组键，是「连续 N 天」类问题的通用解法。

**第三题要先对日期去重。** 同一用户一天可能有多条登录记录，不去重会把同一天算成多天，连续段长度就失真。

3.1 求截至当天的连续登录天数：先去重得到 `(uid, dt)`，用上面的方法构造 `grp`，按 `(uid, grp)` 分组取 `MAX(dt)` 与 `COUNT(*)`，再筛选 `MAX(dt) = CURRENT_DATE`（今天仍在登录），此时的 `COUNT(*)` 就是截至今天的连续天数。若要「截至任意一天的连续天数」，则需要对每一天做关联或使用窗口函数逐行计算，成本更高。

3.2 连续登录 ≥ 7 天后次日流失：在去重后的表上用 `LEAD(dt)` 取下一次登录日期，构造分组键后按 `(uid, grp)` 聚合，取段起点、段终点、段长度与段结束后的下一次登录日期，筛 `login_days >= 7 AND DATEDIFF(next_login_date, end_date) > 1`。这里 `next_login_date` 为 NULL 表示之后再也没有登录，属于「彻底流失」，与「次日流失」要分开处理。

3.3 彻底流失：段长度 ≥ 7 且段结束后不存在任何更晚的登录记录，用 `NOT EXISTS` 判断，同时加 `end_date < CURRENT_DATE` 避免把「今天还在登录、只是明天还没到」误判为流失。

```sql
WITH d AS (
  SELECT DISTINCT uid, DATE(login_date) AS dt FROM tb_login
), g AS (
  SELECT uid, dt,
         DATE_SUB(dt, INTERVAL ROW_NUMBER() OVER (PARTITION BY uid ORDER BY dt) DAY) AS grp
  FROM d
), seg AS (
  SELECT uid, grp, MIN(dt) AS start_date, MAX(dt) AS end_date, COUNT(*) AS login_days
  FROM g GROUP BY uid, grp
)
SELECT s.uid, s.start_date, s.end_date, s.login_days
FROM seg s
WHERE s.login_days >= 7
  AND s.end_date < CURRENT_DATE
  AND NOT EXISTS (SELECT 1 FROM d WHERE d.uid = s.uid AND d.dt > s.end_date);
```

**三题的共同考点。** 面试官通常在验证三件事：能不能把「连续」翻译成「有序序列上的差值分组」、有没有意识到去重与 NULL 的影响、以及能不能区分「次日未登录」和「彻底流失」这两种业务口径。写完后主动说明边界（同一天多条记录、时区、今天是否算流失），比多写一个优化更能加分。

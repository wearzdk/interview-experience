---
title: "恒生电子笔试SQL题：客服风险分排名"
company: 恒生电子
position: 后端开发
round: 笔试
date: 2026-09
source: 牛客网
tags: ["笔试","SQL","窗口函数","CTE","时间聚合"]
summary: "恒生电子9.23笔试里一道复杂度偏高的SQL题：三张表分别是客服、工单与支付订单，要求先圈出高价值用户，再筛出2026年7月已完结且属于高价值用户的工单，按客服聚合出紧急数、超时数、低满意数与平均处理小时，用加权公式算风险分，最后过滤工单数不少于2且风险分不低于10，用ROW_NUMBER排出名次并按指定字段输出。"
---

### 《面试题目》

1. 有三张表：`support_agents`（agent_id、agent_name、team_name）、`service_tickets`（ticket_id、user_id、agent_id、created_at、closed_at、status、priority、channel、tags、satisfaction_text）、`pay_orders`（order_id、user_id、paid_at、pay_status、amount_text）。请写一条 SQL 完成下面的统计：
   - 高价值用户为 2026-06-01（含）到 2026-08-01（不含）期间、状态为 paid 的订单累计金额不低于 500 元的用户。
   - 纳入统计的工单需创建于 2026 年 7 月、状态为 RESOLVED，且属于高价值用户；单个工单处理小时数为创建到完结时间的分钟差除以 60 后向上取整。
   - 紧急工单指优先级为 p0 或 p1，或 tags 的第一个标签为 refund；超时工单指处理小时数大于 48；低满意工单指 satisfaction_text 转换为数值后不高于 3。
   - 风险分 = 紧急工单数 × 5 + 超时工单数 × 3 + 低满意工单数 × 2 + 平均处理小时数 ÷ 24 后向下取整；平均处理小时数先按纳入统计的工单计算，再保留 2 位小数。
   - 只输出纳入统计工单数不少于 2 且风险分不低于 10 的客服人员；先按风险分降序、工单数降序、客服 ID 升序排序，再按该顺序用 ROW_NUMBER 生成排名。
   - 输出字段固定为 rank_no、agent_id、agent_name、ticket_cht、urgent_cnt、timeout_cnt、low_score_cnt、avg_handle_hours、risk_score；最终结果按 rank_no 升序、agent_id 升序排列。

### 《参考解析》

**整体思路**：这道题的复杂度全在「口径层层嵌套」，所以不要试图用一条大 SQL 一次写完，而是用 CTE 把口径一层层筛出来，每一层只负责一件事：`high_value_user`（谁是高价值用户）→ `ticket_base`（哪些工单纳入统计，并算好单工单处理小时数）→ `agent_stat`（按客服聚合出四个基础指标）→ `agent_risk`（算风险分并过滤）→ `agent_rn`（排名并输出）。这样每一层的过滤条件都能单独验证，面试时也便于向面试官解释每一步在做什么。

```sql
WITH high_value_user AS (
    SELECT user_id
    FROM pay_orders
    WHERE pay_status = 'paid'
      AND paid_at >= '2026-06-01'
      AND paid_at <  '2026-08-01'
    GROUP BY user_id
    HAVING SUM(CAST(amount_text AS DECIMAL(12,2))) >= 500
),
ticket_base AS (
    SELECT st.ticket_id, st.agent_id, sa.agent_name,
           CEIL(TIMESTAMPDIFF(MINUTE, st.created_at, st.closed_at) / 60.0) AS handle_hours,
           st.priority, st.tags,
           CAST(st.satisfaction_text AS UNSIGNED) AS satisfaction_score
    FROM service_tickets st
    JOIN high_value_user hvu ON st.user_id = hvu.user_id
    LEFT JOIN support_agents sa ON st.agent_id = sa.agent_id
    WHERE st.status = 'RESOLVED'
      AND st.created_at >= '2026-07-01'
      AND st.created_at <  '2026-08-01'
),
agent_stat AS (
    SELECT agent_id, agent_name,
           COUNT(*) AS ticket_cht,
           SUM(CASE WHEN priority IN ('p0','p1')
                     OR SUBSTRING_INDEX(tags, ',', 1) = 'refund'
                    THEN 1 ELSE 0 END) AS urgent_cnt,
           SUM(CASE WHEN handle_hours > 48 THEN 1 ELSE 0 END) AS timeout_cnt,
           SUM(CASE WHEN satisfaction_score <= 3 THEN 1 ELSE 0 END) AS low_score_cnt,
           ROUND(AVG(handle_hours), 2) AS avg_handle_hours
    FROM ticket_base
    GROUP BY agent_id, agent_name
    HAVING COUNT(*) >= 2
),
agent_risk AS (
    SELECT *,
           urgent_cnt * 5 + timeout_cnt * 3 + low_score_cnt * 2
           + FLOOR(avg_handle_hours / 24) AS risk_score
    FROM agent_stat
    HAVING risk_score >= 10
)
SELECT ROW_NUMBER() OVER (ORDER BY risk_score DESC, ticket_cht DESC, agent_id ASC) AS rank_no,
       agent_id, agent_name, ticket_cht, urgent_cnt, timeout_cnt,
       low_score_cnt, avg_handle_hours, risk_score
FROM agent_risk
ORDER BY rank_no ASC, agent_id ASC;
```

**几个容易翻车的点**。第一，时间区间的开闭：题面反复用「含」与「不含」，所以要严格写成 `>= 起点 AND < 终点`，用 `BETWEEN` 会把 8 月 1 日 00:00:00 那一条错误地算进来。第二，金额字段是文本 `amount_text`，必须先 `CAST` 成 `DECIMAL` 再求和，用浮点类型求和会在钱的场景引入精度误差；同时要能回答「如果表里有非数字脏数据怎么办」——`CAST` 遇到非法串在 MySQL 里会变成 0 并给警告，严格场景应先用 `REGEXP` 过滤或 `NULLIF` 处理。第三，处理小时数要「向上取整」，所以是 `CEIL(分钟差 / 60)`，除法里必须带小数点（`/ 60.0`），否则整数除法会先截断再取整，结果偏小。第四，`tags` 是逗号拼接的字符串，取第一个标签要用 `SUBSTRING_INDEX(tags, ',', 1)`，不能直接用 `LIKE '%refund%'`——那样会把 refund 出现在第二、三个位置的工单也算成紧急。第五，过滤顺序：`HAVING COUNT(*) >= 2` 必须在算风险分之前，因为「平均处理小时数先按纳入统计的工单计算」意味着工单数不够的客服根本不进入平均值的计算。第六，风险分的取整只作用于「平均处理小时数 ÷ 24」这一项，不要写成对整个风险分取整；而平均处理小时数本身要先 `ROUND` 到两位再做除法，顺序反了分值可能差 1 分，恰好卡在 10 这个门槛上就会改变结果集。第七，`ROW_NUMBER` 必须写在最外层 select 里（或者单独一层），因为窗口函数不能出现在 `WHERE`/`HAVING` 中，而 rank 又依赖已经算好的风险分。第八，输出里的 `ticket_cht` 是题面给死的字段名（正常应该是 `ticket_cnt`），笔试时要照抄题面，不要自作主张改名。

**可以主动加分的补充**：说明这条 SQL 假设 `satisfaction_text` 存的是数字字符串，如果实际混有「非常满意」这类中文，需要维护一张映射表或改用 `CASE`；说明 `LEFT JOIN support_agents` 是为了兼容工单里出现未登记客服的情况（如果业务保证一定存在，`JOIN` 语义更清晰且能提前暴露脏数据）；以及指出可读性上把「紧急/超时/低满意」的判定抽成一个视图或一个 `CASE` 宏会让维护成本低很多。笔试面试里这类题拿分的关键不是写得多花哨，而是每个口径都能对得上题面的字面要求。

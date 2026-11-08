---
title: "索引失效三种场景与一个反向问题：为什么 int 列传字符串不失效"
company: 某公司
position: 后端开发（Java）
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/949174617770319872
tags: ["MySQL","索引失效","隐式转换","最左前缀","索引下推","key_len"]
summary: "背了三条口诀后被问「为什么反向不会失效」当场愣住。三个真实场景：varchar 列传数字触发隐式转换、索引列上套函数或运算、联合索引最左前缀被跳过；并补上两个常被忽略的判断手段——`SHOW WARNINGS` 看优化器重写、`key_len` 推算实际用了几列。"
---

### 《面试题目》

1. 你知道哪些情况索引会失效？
2. 隐式类型转换到底转的是什么？为什么反向（int 列传字符串）不会失效？
3. 索引列上做运算或套函数为什么会失效？怎么改写？
4. 联合索引 (a, b, c)，`WHERE b = ? AND c = ?`、`WHERE a = ? AND c = ?`、`WHERE a = ? AND b > ? AND c = ?` 分别用到哪些列？
5. 看到 `Using index condition` 是不是说明联合索引全用上了？
6. `OR`、`!=`、`NOT IN`、`IS NOT NULL` 一定会失效吗？
7. 字符集不一致的 join 为什么会失效？
8. 你怎么判断一次慢查询到底是索引失效还是优化器不想用？

### 《参考解析》

**隐式转换的机制与方向**：订单表 `order_no` 定义为 `varchar(32)` 以兼容外部渠道的字母编号，测试脚本写成 `WHERE order_no = 880123`，`EXPLAIN` 出来 `type: ALL`，扫了几十万行。原因是字符串与数字比较时，MySQL 会把字符串侧转成数字，等价于 `CAST(order_no AS SIGNED) = 880123`，列被函数包住，索引失效。反向不失效：`WHERE id = '880123'` 中 id 是 int，转的是常量，列本身没变，索引照用。判断手段是 `EXPLAIN` 之后紧跟 `SHOW WARNINGS`，能看到优化器重写后的语句里带着 `CONVERT`。

**函数与运算**：`DATE(create_time) = '2024-05-01'` 改成 `create_time >= '2024-05-01' AND create_time < '2024-05-02'`；`id + 1 = 100` 改成 `id = 99`；`SUBSTR(name,1,3) = 'abc'` 这类前缀匹配也不走索引。本质都是让 B+ 树无法按有序性定位。`LIKE 'abc%'` 能用索引是因为前缀有序，`LIKE '%abc'` 不行。

**最左前缀的三种情况**：跳过最左列（`b`、`c`）完全用不上；`a` 加 `c` 只用到 a；`a = ? AND b > ? AND c = ?` 中 a、b 用于定位区间，c 只能靠索引下推过滤。第三种的细节帖主是造了几十万行数据实测才弄明白的：MySQL 5.6 之后有 ICP，`Extra` 会出现 `Using index condition`，但真正缩小扫描区间的是 a 和 b。

**`Using index condition` 不等于全用上**：ICP 只是把过滤下推到存储引擎、减少回表，不改变扫描范围。判断实际用了几列要看 `key_len`：把它与单列索引长度对比，能推算出参与定位的列数。只看 `key` 有没有值容易自我安慰。

**其他几类**：`OR` 两边只要有一边没索引，整体大概率全表，可以拆 `UNION ALL`；`!=`、`NOT IN` 通常因为选择性差被优化器放弃；字符集或排序规则不一致的 join（`utf8` 与 `utf8mb4`）会失效；`IS NOT NULL` 能否走索引取决于该列的空值比例，没有固定答案。

**判断顺序**：先看 `EXPLAIN` 的 `type`、`key`、`key_len`、`rows`、`Extra` 五个字段；怀疑类型转换就 `SHOW WARNINGS`；最后用接近生产的数据量验证——几千行的测试库里 `type=ALL` 可能只是优化器觉得全表更便宜，不能据此下结论。

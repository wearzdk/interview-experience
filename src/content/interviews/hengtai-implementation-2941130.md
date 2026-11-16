---
title: "衡泰技术实施工程师一面：Oracle 与 MySQL 对比、Linux 常用命令"
company: 衡泰技术
position: 实施工程师
round: 一面
date: '2026-11'
collectedAt: '2026-11-16'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/325031fe81eb4506920e3d37711fb89b
tags: ["衡泰技术","实施工程师","Oracle","MySQL","Linux"]
summary: "衡泰技术实施工程师一面：数据库部分十问，覆盖 Oracle 与 MySQL 的架构与函数差异、分组、排序、去重、字符串截取、多表连接与模糊查询；Linux 部分问常用命令、关闭防火墙与清空日志；最后问遇到不会的问题如何学习。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 你们接触到的数据库都有哪些？
3. Oracle 和 MySQL 的核心区别，能大致介绍一下吗？
4. Oracle 和 MySQL 中常用的函数，能分别举个例子吗？
5. GROUP BY 是做什么用的？
6. 排序用什么？
7. 去重用什么？
8. 截取字符串用什么？
9. 多表连接查询（JOIN）能举一个实际的查询例子吗？
10. 除了等号连接之外，还有什么连接方式？
11. 模糊查询用到的函数是什么？
12. 你接触过哪些操作系统？Linux 常用命令有哪些？
13. 如何关闭防火墙？
14. 如何清空日志？
15. 遇到不会的问题，你是怎么去学习的？

### 《参考解析》

**Oracle 与 MySQL 的核心区别**：从架构讲起最清楚。Oracle 是实例加表空间加数据文件的组织方式，一个实例对应一个库，schema 与用户绑定，同一用户下的对象默认同名互斥；MySQL 是实例下多个 database，存储引擎可插拔，事务与行锁由 InnoDB 提供。差异还体现在若干具体行为上：分页 Oracle 用 `ROWNUM` 或 12c 之后的 `FETCH FIRST n ROWS ONLY`，MySQL 用 `LIMIT offset, size`；自增 Oracle 用序列或 `IDENTITY` 列，MySQL 用 `AUTO_INCREMENT`；字符串拼接 Oracle 用 `||`，MySQL 默认用 `CONCAT`（`||` 在默认 SQL 模式下是逻辑或）；空串处理 Oracle 把 `''` 当作 NULL，MySQL 区分空串与 NULL；默认隔离级别 Oracle 是 READ COMMITTED，InnoDB 默认 REPEATABLE READ，后者配合间隙锁会带来更多锁等待与死锁场景；DDL 在 Oracle 中隐式提交，MySQL 8.0 的原子 DDL 才解决了部分问题。实施岗回答这题，落点应放在「迁移或兼容时哪些写法必须改」，而不是只列概念。

**常用函数按类别对照**：字符串类，截取 Oracle 用 `SUBSTR`、MySQL 用 `SUBSTRING` 或 `LEFT`/`RIGHT`；查找位置 Oracle 用 `INSTR`、MySQL 用 `LOCATE` 或 `INSTR`；替换 `REPLACE`、去空格 `TRIM` 两边一致。日期类，取当前时间 Oracle 用 `SYSDATE`、MySQL 用 `NOW()`；格式化 Oracle 用 `TO_CHAR`、MySQL 用 `DATE_FORMAT`；字符串转日期 Oracle 用 `TO_DATE`、MySQL 用 `STR_TO_DATE`；日期加减 Oracle 直接对日期加数字或用 `ADD_MONTHS`，MySQL 用 `DATE_ADD`/`DATE_SUB`。空值类，Oracle 用 `NVL`、`NVL2`、`DECODE`，MySQL 用 `IFNULL`、`COALESCE`、`CASE WHEN`。数值与聚合函数基本通用，`ROUND`、`TRUNC`、`SUM`、`AVG`、`COUNT` 行为接近，但 `COUNT` 对 NULL 的处理、除法除零的返回（Oracle 报错、MySQL 返回 NULL）不同，这类细节在跨库核对数据时最容易出事。

**分组、排序、去重与截取**：`GROUP BY` 把行按列取值分组，每组输出一行聚合结果，配合 `HAVING` 过滤分组后的结果，执行顺序是 `WHERE` 先过滤行、`GROUP BY` 再分组、`HAVING` 过滤组、最后 `ORDER BY` 排序；`SELECT` 列表中的非聚合列必须出现在 `GROUP BY` 中（MySQL 关闭 `ONLY_FULL_GROUP_BY` 时会放过，属于坑）。排序用 `ORDER BY`，可多列并指定 `ASC`/`DESC`，需要注意 NULL 的位置：Oracle 升序时 NULL 排在最后，MySQL 升序时 NULL 排在最前，跨库结果不一致往往来自这里。去重用 `DISTINCT`，作用于整行而非单列；需要按某列去重并保留其他列时，用 `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)` 取 `rn = 1` 更可控。截取除 `SUBSTR` 与 `SUBSTRING` 外，MySQL 另有 `LEFT`、`RIGHT` 与按分隔符取段的 `SUBSTRING_INDEX`，Oracle 通常用 `INSTR` 定位后再配 `SUBSTR`；需要在数据库里截取就优先用内置函数，避免把大量数据取回应用再处理。

**多表连接与连接方式**：实际查询的例子可以取客户、账户、持仓三表：客户表按客户号关联账户表，账户表按账户号关联持仓表，用 `INNER JOIN` 取有持仓的客户，用 `LEFT JOIN` 保留无持仓客户并配合 `IS NULL` 找出未开户或空仓客户。除等值连接外，还有非等值连接（`BETWEEN`、`>`、`<`，常用于区间费率、日期区间匹配）、自连接（同一张表按上下级或前后记录关联，如员工与主管、流水的前后笔）、交叉连接（`CROSS JOIN`，用于生成笛卡尔积做维度补齐）、以及 `FULL OUTER JOIN`（Oracle 支持，MySQL 需要用 `LEFT JOIN` 加 `UNION` 的 `RIGHT JOIN` 模拟）。实施岗还应能说清性能侧的基本判断：连接列上要有索引、尽量用小结果集驱动、避免在连接列上做函数运算导致索引失效，`EXPLAIN` 看执行计划是必备动作。

**Linux 常用命令与「关防火墙、清日志」**：常用命令按用途记：查看系统 `cat /etc/os-release`、`uname -a`；进程与资源 `ps -ef`、`top`、`free -h`、`df -h`、`du -sh *`；日志 `tail -f`、`grep`、`journalctl -u`；网络 `ss -tunlp`（替代 `netstat`）、`ping`、`curl`、`telnet`；服务 `systemctl status/start/stop/enable`；文件 `find`、`tar`、`chmod`、`chown`、`scp`、`rsync`；文本 `awk`、`sed`、`sort`、`uniq`。关闭防火墙按发行版给出：CentOS 7 及以上用 `systemctl stop firewalld` 与 `systemctl disable firewalld`，或只放行端口 `firewall-cmd --add-port=8080/tcp --permanent` 后 `--reload`；Ubuntu 用 `ufw disable`；`iptables -F` 只清当前规则、重启即失效。清空日志的正确做法是截断而不是删除：`> app.log` 或 `truncate -s 0 app.log`，因为 `rm` 一个正被进程写入的文件，文件句柄仍被占用，`df` 显示磁盘不降，需要用 `lsof +L1` 找到已删除但仍打开的文件并重启或 reload 对应进程；系统日志用 `journalctl --vacuum-size=500M` 控制总量。生产环境执行这两类操作前先确认变更窗口与留档要求，直接清空应用日志等于丢掉排障证据。

**学习方法这题怎么答出可信度**：不要泛泛说「看文档、多实践」，给一条可复述的路径：先用官方文档确认语义与版本差异，再在本地或测试库构造最小可复现的例子验证，然后把结论写成可检索的笔记（错误码、现象、原因、解法），最后在下次遇到同类问题时回查并修订笔记。举例说明更有说服力，例如遇到 ORA- 开头的错误码或 MySQL 的死锁日志，先按错误码查官方文档与已知问题，再看执行计划与锁等待信息定位，复现后记录触发条件。实施岗还有个加分项：说明你会把客户现场的问题按「环境、版本、数据、操作步骤」四要素记录完整再升级，避免来回追问，这体现的是工程习惯而不只是学习意愿。

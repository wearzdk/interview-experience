---
title: "长沙联软科技一面面经"
company: "联软科技"
position: "软件测试"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/203f729cc99f48a9954f5aaeb9224a1f
tags: ["软件测试","Linux","Docker","MySQL","慢查询","JMeter"]
summary: "长沙联软科技一面：作者没有实习经历、包装了一段实习后被面试官拷打半小时，被要求共享屏幕在虚拟机实操 Linux 基础命令、查系统日志，以及 Docker 部署流程、MySQL 语句实操、索引与慢查询排查、JMeter 登录接口的会话设置。"
---

### 《面试题目》

1. 自我介绍。
2. 关于实习经历：你是为什么从上家实习离职的？
3. 你平常 Linux 命令用得多不多？查一下系统日志。
4. Docker 命令，你们公司整套的 Docker 部署流程是咋样的？
5. MySQL 各种语句实操。
6. 索引是什么？你说你了解慢查询，你会怎么排查慢查询？
7. JMeter 性能压测：让你实操 JMeter 的登录接口，会话怎么设置？

### 《参考解析》

**现场实操类面试怎么准备**。这家公司直接要求共享屏幕在虚拟机里敲命令，考的是肌肉记忆，背概念没用。最低限度要备齐这些：`ls/cd/pwd/cp/mv/rm/mkdir/touch`、`cat/less/head/tail`、`find`、`grep`（含 `-r`、`-n`、`-i`、`-C` 上下文）、`chmod/chown`、`ps/top`、`df/du`、`netstat`/`ss`、`systemctl`、`tar`、`vim` 的基本操作；查日志要知道日志通常在哪（`/var/log/messages`、`/var/log/syslog`、`journalctl -u <service>`、应用的 `nohup.out` 或业务日志目录），以及按时间与关键字过滤（`grep`、`awk`、`sed -n 'a,bp'`）、统计与去重（`sort | uniq -c`）、实时观察（`tail -f`）。实操题最常见的失分点是「命令记得但参数搞反」和「不敢敲、一直在解释」，练的时候就直接在虚拟机里以「给我 5 分钟查出某服务为什么起不来」为题目练几遍。

**Docker 部署流程怎么讲**。按「镜像—编排—发布—运维」讲一遍。镜像：基于基础镜像（`openjdk`/`node`/`nginx`）写 Dockerfile，多阶段构建减小体积（构建阶段装依赖编译，运行阶段只拷产物）、用 `.dockerignore` 排除无关文件、固定基础镜像版本标签而不是 `latest`。编排：用 docker-compose 定义服务、网络、数据卷、环境变量与依赖顺序（`depends_on` 只保证启动顺序，健康检查要配 `healthcheck`），生产用 K8s 或 Swarm。发布：镜像推到私有仓库（Harbor）并打版本号，部署到环境时改 tag，回滚就是换回上一个 tag。运维：容器日志输出到 stdout 由日志驱动收集、`docker logs`/`exec` 排查、`docker stats` 看资源、数据用 volume 持久化、敏感配置用 secret 而不要写进镜像。要能说出「容器不是虚拟机」：进程要前台运行（`-d` 与 `ENTRYPOINT` 的配合）、`PID 1` 的信号处理（用 `tini` 或 exec 形式启动避免收不到 SIGTERM）、数据无状态化。

**MySQL 语句实操与索引**。把「增删改查 + 联表 + 聚合 + 索引」这几类练到能盲打：建表（含主键、唯一索引、普通索引、字段类型与字符集）、`INSERT`（批量与 `ON DUPLICATE KEY UPDATE`）、`UPDATE`/`DELETE`（一定带 `WHERE`，先 `SELECT` 确认影响范围）、`SELECT`（`JOIN` 的左右连接区别、`GROUP BY` 与 `HAVING`、`ORDER BY` + `LIMIT` 分页、子查询与 `EXISTS`）、以及 `CREATE INDEX`/`EXPLAIN`。索引的本质是把「全表扫描」变成「按有序结构定位」，常见类型是 B+ 树（InnoDB 的聚簇索引：主键索引的叶子节点存整行数据，二级索引的叶子节点存主键值，所以走二级索引会有一次回表）；索引能加速 `WHERE`、`JOIN` 的连接字段、`ORDER BY`/`GROUP BY`，但会拖慢写入并占空间。要注意的失效场景：对索引列做函数或运算、隐式类型转换、`LIKE '%xx'` 前置通配、联合索引不满足最左前缀、`OR` 混用非索引列。还要知道覆盖索引（查询字段都在索引里就不用回表）与索引下推。

**慢查询排查**。分四步：一是**开慢查询日志**（`slow_query_log`、`long_query_time`，或用 `performance_schema`/`sys` 库统计），确认到底哪些 SQL 慢、慢在哪个阶段。二是**用 EXPLAIN 看执行计划**：`type` 是不是 `ALL`（全表扫描）、`key` 有没有用上索引、`rows` 扫描行数、`Extra` 里有没有 `Using filesort`/`Using temporary`（意味着额外的排序与临时表）。三是**定位原因**：索引缺失或失效（加/改索引）、SQL 写法问题（`SELECT *`、大偏移量分页 `LIMIT 100000, 20` 要改成游标或延迟关联）、数据量增长导致统计信息不准（`ANALYZE TABLE`）、表锁或行锁等待（`SHOW PROCESSLIST`、`information_schema.innodb_trx`、`SHOW ENGINE INNODB STATUS` 看锁等待）、以及硬件与配置（缓冲池太小、磁盘 IO 瓶颈）。四是**验证**：改完后用同样的数据量回归执行计划与响应时间，并观察 QPS 与慢查询数量趋势。回答时提一句「先看是不是 SQL 本身的问题，再看是不是并发与锁的问题，最后才怀疑硬件」，显得有排查顺序而不是碰运气。

**JMeter 登录接口与会话设置**。JMeter 里登录接口的关键是「拿到会话凭证并在后续请求里带上」。步骤：建线程组与 HTTP 请求默认值（服务器、端口、编码）→ 加 HTTP 请求填登录的路径与参数（表单用 Parameters，JSON 用 Body Data + HTTP 信息头管理器）→ 加响应断言（状态码或响应体关键字）→ **关联**：如果登录返回 token 在 JSON 里，加 JSON 提取器（或正则提取器）把它存成变量；如果是 Cookie 会话，加 HTTP Cookie 管理器，JMeter 会自动保存并携带 `Set-Cookie`；用 `__threadNum`/`${token}` 在后续请求里引用 → 加察看结果树与聚合报告看响应时间、吞吐与错误率。要能说出几个实战坑：每个线程用不同账号登录（用 CSV 数据文件设置参数化，避免同一账号并发触发风控）、`Cookie 管理器`的「每次迭代清空」策略影响会话复用、首屏与登录接口的先后顺序要用事务控制器或逻辑控制器保证、以及压测前先做基准（单用户）再逐步加并发找拐点而不是直接上 500 并发。

---
title: "SHEIN 后端开发 一面：MySQL 隔离级别与单接口 502 排障"
company: "SHEIN"
position: "后端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/76b62ea6a32748298aadc395afd16afa
tags: ["SHEIN", "后端开发", "MySQL", "事务隔离", "OpenResty", "502", "排障"]
summary: "SHEIN 信息技术类后端一面只问两题：MySQL 8 默认隔离级别，以及生产环境只有单个接口报 OpenResty 502 时从哪一层开始查。题少但第二题很吃排障框架。"
---

### 《面试题目》

1. MySQL 8 的默认隔离级别是什么？
2. 场景题：生产环境分布式部署、前面挂负载均衡，有一个接口调用时出现 502，只有这一个接口报 502，其他接口都正常，报错页是 OpenResty 的默认页，现在只有这么点信息。如果是你，排查思路是什么？

### 《参考解析》

**MySQL 8 的默认隔离级别是 REPEATABLE READ（可重复读），不是 READ COMMITTED。** InnoDB 在 RR 下用 MVCC 给事务提供一致性快照：普通 `SELECT` 是快照读，第一次读时建立 Read View，之后看到的是同一版本的数据；`UPDATE`、`DELETE`、`SELECT ... FOR UPDATE` 这类当前读会读最新版本并加锁。RR 通过 next-key lock（记录锁 + 间隙锁）在锁定读时阻止其他事务在区间内插入，从而避免大部分幻读；但快照读和当前读混用时仍可能出现“同一事务里两次读结果不一致”的现象，所以不要把它理解成绝对没有幻读。RC 每条语句新建 Read View，能看到已提交的最新数据，锁的粒度更小、并发更高，但会出现不可重复读和幻读；很多互联网业务会把隔离级别改成 RC，代价是要接受同一事务内多次读可能不一致。查看和修改用 `SELECT @@transaction_isolation`、`SET GLOBAL transaction_isolation='READ-COMMITTED'`（需要新连接生效）。另外要区分隔离级别和 binlog 格式：RC 下 statement 格式可能不安全，生产通常用 row 格式。

**只有单个接口 502，说明问题大概率不在入口负载均衡，而在“这个接口特有的链路”上。** 502 的定义是网关/代理从上游收到了无效响应，常见原因是上游连接被拒绝、连接被重置、提前关闭、返回了非法响应头；超时通常表现为 504，但有些网关或自定义配置会统一成 502。排查要沿链路分层：客户端 → DNS/接入层 → SLB/负载均衡 → OpenResty/Nginx → 上游应用 → 该接口依赖的下游。先在 OpenResty 的 access log 里看 `upstream_addr`、`upstream_status`、`upstream_connect_time`、`upstream_header_time`、`upstream_response_time` 和 `request_time`，确认是连不上、连上了但没按时回、还是回了非法内容；再看 error log 的关键字，比如 `upstream prematurely closed connection`、`connect() failed`、`no live upstreams`、`upstream sent too big header`、`upstream timed out`。然后做对比实验：同一个接口换实例、换参数、换请求体大小、绕过负载均衡直连上游、用 HTTP/1.1 和 HTTP/2 各打一次，看是否稳定复现；同时查上游应用日志、GC、OOM、线程池、数据库连接和该接口依赖的下游。只有单接口出问题，要重点怀疑这条代码路径特有的慢查询、大响应、特殊 header、长连接复用、超时设置或某个下游依赖，而不是全网故障。

**OpenResty 场景还要额外查 Lua、连接池和代理缓冲区。** 常见坑包括：`lua-resty-http` 或 `ngx.location.capture` 的 cosocket 连接池复用了已经被上游关闭的连接，导致 `closed`/`connection reset`；`proxy_http_version` 没设成 1.1 却开了 `keepalive`，长连接行为不符合预期；`proxy_read_timeout` 太短，接口处理时间超过阈值；上游返回的响应头或响应体超过 `proxy_buffer_size`/`proxy_buffers`，出现 `upstream sent too big header`；`balancer_by_lua` 选到了一个不健康或配置错误的节点；TLS 握手、SNI、证书链问题只影响某个上游；`content_by_lua` 里显式 `ngx.exit(502)` 或 Lua 异常被包装成 502。验证手段是打开 debug 日志或临时提高错误日志级别，抓一次完整请求的 upstream 状态；用 `curl -v` 直连上游对比；在 OpenResty 侧加 request id 并透传到上游，把网关日志和应用日志串起来。止血可以先把该接口切到健康实例、调大超时/缓冲区、关闭问题连接池或回滚最近变更；根因则要落到代码、配置或下游依赖，并补上对应的监控和告警，避免下次只能看到一张默认 502 页。

---
title: "SHEIN希音Java一面：HTTP缓存与随机502排查"
company: SHEIN
position: Java后端开发
round: 一面
date: 2026-09
source: 牛客网
tags: ["Java","HTTP缓存","TCP","缓存雪崩","数据库死锁","线上排查"]
summary: "SHEIN希音Java后端一面面经，全程约35分钟、无手撕代码。面试围绕Cookie与Session、HTTP缓存与响应码、TCP三次握手四次挥手、IOC、缓存雪崩与随机TTL实现、数据库死锁，以及分布式部署下接口随机502的排查思路展开。"
---

### 《面试题目》

1. 从 HTTP 角度聊一聊 Cookie 和 Session 的区别和联系。
2. GET 请求可以带请求体吗？为什么不推荐？
3. 整个 Web 链路涉及哪些缓存？
4. HTTP 场景下有哪些响应码？命中缓存是哪个响应码？
5. OSI 七层模型是什么？HTTP 在哪一层？
6. TCP 三次握手、四次挥手的过程。
7. 了解 IOC 吗？
8. 给一串 30 行代码，分析其中存在的问题。
9. 缓存雪崩怎么解决？随机 TTL 怎么实现？
10. 数据库死锁是怎么回事？
11. 分布式部署下接口出现随机 502，怎么排查？
12. 数据库有两张表 A、B 需要数据完全一致，count 后 B 比 A 多两条数据，不用 join 怎么查？
13. 反问环节。

### 《参考解析》

**Cookie 和 Session 的区别与联系**：Session 数据存在服务端（内存、Redis 或数据库），浏览器只持有一个 `JSESSIONID` 之类的会话 ID，通常放在 Cookie 里；Cookie 存在客户端，每次请求由浏览器按域名和路径自动带上。所以两者不是对立的：Cookie 是载体，Session 是状态，典型用法就是「Session 内容存服务端 + 会话 ID 通过 Cookie 传递」。面试里最好再补三点：一是 Cookie 的属性（`HttpOnly` 防 XSS 读取、`Secure` 只走 HTTPS、`SameSite` 防 CSRF、`Max-Age`/`Expires` 控制过期）；二是分布式场景下 Session 必须外置共享，否则多台机器之间会「登录态飘忽」，常见做法是 Spring Session + Redis 或干脆改成 JWT 无状态令牌；三是禁用 Cookie 时的降级方案（URL 重写）以及它的安全问题。

**GET 能不能带请求体**：HTTP 语义上不禁止——RFC 9110 只规定 GET 的语义是安全、幂等的，没有禁止报文体，但明确定义「GET 的报文内容没有一般性语义」，服务端可以忽略。不推荐的原因在于：大量中间件（Nginx、网关、CDN、部分 WAF）会直接丢弃或拒绝 GET 的 body；浏览器 `fetch`/`XMLHttpRequest` 也主动禁止给 GET 设置 body；缓存与重放语义会变得不可预期。所以参数放 query，需要携带复杂结构就改用 POST。

**Web 链路上的缓存分层**：从浏览器到数据库大致是——浏览器缓存（强缓存 `Cache-Control`/`Expires`，协商缓存 `ETag`/`Last-Modified` → 304）→ Service Worker / 本地存储 → CDN 边缘节点（按 `Cache-Control`、`s-maxage`、`Vary` 缓存）→ 反向代理如 Nginx（`proxy_cache`）→ 应用层缓存（进程内 Caffeine/Guava，本地缓存要处理多实例一致性）→ 分布式缓存 Redis/Memcached → 数据库自身的缓冲池（InnoDB Buffer Pool）、MySQL 查询缓存（8.0 已移除）。命中缓存的响应码：协商缓存命中是 `304 Not Modified`；强缓存直接由浏览器返回本地副本，根本不发请求，因此没有响应码（DevTools 里显示 `200 (from disk cache)` 或 `from memory cache`）。顺便记住 502 是网关从上游收到非法响应，504 是网关等上游超时。

**随机 TTL 缓解缓存雪崩**：缓存雪崩是大量 key 在同一时刻集中失效，请求全部打到数据库。真正的解法组合是：过期时间加随机抖动、热点数据逻辑过期或永不过期（后台异步刷新）、互斥锁/单飞（singleflight）保证同一 key 只有一个请求回源、多级缓存兜底、Redis 集群做高可用避免整体宕机，再配合接口限流和熔断。随机 TTL 的实现要点是「基础过期时间 + 随机偏移」并保证偏移量不为负，例如：

```java
int base = 30 * 60;                       // 30 分钟
int jitter = ThreadLocalRandom.current().nextInt(0, 5 * 60); // 0~5 分钟抖动
redis.set(key, value, base + jitter, TimeUnit.SECONDS);
```

热点 key 不建议一次批量预热到同一秒，预热任务本身也要打散写入时间；如果 key 数量极大，抖动区间可以按「基础时长的 10%~20%」来定，避免 TTL 过长导致数据陈旧。

**随机 502 的排查路径**：先定性再看细节。第一步看网关/接入层（Nginx、SLB、Ingress）错误日志，确认 502 的 upstream 地址、时间点和是否集中在某几台后端；第二步确认是「全部实例」还是「某台/某次扩容的新实例」——如果只有新实例出问题，重点看健康检查和启动预热（应用还没就绪就被挂上流量、连接池未初始化）；第三步看后端进程本身有没有 OOMKilled、GC 停顿、线程池耗尽或重启记录（`dmesg | grep -i oom`、PM2/K8s 事件、GC 日志）；第四步核对长连接与超时参数，`keepalive_timeout` 小于上游 `keepalive` 空闲回收时间时会出现「复用已经关闭的连接」，表现就是随机 502；第五步查是否被限流、被 WAF 拦截以及端口/文件描述符耗尽。定位手段上建议先按实例比例统计错误率来缩小范围，再用 `tcpdump`/链路追踪看单个失败请求卡在哪一跳。

**两表数据不一致、不用 join 的排查**：先把「多两条」拆成「哪两条」和「为什么多」两个问题。定位差异的常见做法是哈希比对：对两表按主键（或业务唯一键）取全量 ID，用 `EXCEPT`/`MINUS` 做集合差（`SELECT id FROM B EXCEPT SELECT id FROM A`），或者把每行做一致性哈希（`MD5(CONCAT_WS('#', id, col1, col2...))`）后比对哈希值，这样只在 ID 集合或哈希集合上做交集/差集，成本远低于逐行 join。工程上更实用的是把结果分批导出（`SELECT ... ORDER BY id LIMIT n OFFSET m` 或按 ID 区间切分）到临时表/离线文件，再在应用层或 ClickHouse、Spark 里做比对。查到差异后还要追问根因：通常是写入不是同一事务、消息丢重（MQ 重复消费或漏消费）、软删除/归档口径不一致、binlog 同步断点或重试产生的重复行。修复时先建唯一索引防重，再补齐数据，并加对账任务定期兜底。

**数据库死锁**：死锁是多个事务以不同顺序持有并等待对方持有的锁。InnoDB 会自动检测死锁（`innodb_deadlock_detect`）并回滚代价较小的事务，报 `Deadlock found when trying to get lock`。常见诱因是加锁顺序不一致（比如一个事务先更新 A 再更新 B，另一个反过来）、唯一索引冲突时的间隙锁/插入意向锁、缺少合适索引导致锁范围从行锁升级为大量行锁甚至表锁，以及长事务放大冲突窗口。应对手段：统一业务侧加锁顺序、把大事务拆小并缩短事务时长、为条件列建好索引让锁落在索引行上、必要时用 `SELECT ... FOR UPDATE` 按主键排序批量加锁，以及捕获死锁异常做有限重试。线上排查用 `SHOW ENGINE INNODB STATUS` 看 `LATEST DETECTED DEADLOCK` 段，`performance_schema.data_locks` 和 `data_lock_waits` 看当前锁等待。

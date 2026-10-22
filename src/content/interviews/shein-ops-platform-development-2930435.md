---
title: "SHEIN 技术秋招面经：运维平台开发一面（Redis 锁、Docker 资源限制、Gin 路由与健康检查）"
company: "SHEIN"
position: "运维平台开发"
round: "一面"
date: '2026-10'
base: "南京"
source: "牛客网"
tags: ["SHEIN","运维平台开发","Redis锁","Docker","Gin","健康检查","Go","秋招"]
summary: "SHEIN 南京运维平台开发秋招一面真题 8 问：Redis 锁及常用命令、Docker 限制容器资源的做法、Gin 路由的底层实现与 context、测接口端口用什么命令、健康检查怎么做、故障节点如何摘除、健康检查内部到底检查什么。"
---

### 《面试题目》

1. 什么是 Redis 锁？常用的话有什么关键字，怎么用？
2. Docker 镜像怎么设置占用资源的命令？
3. Gin 的路由底层是怎么实现的？
4. Gin 的 context 是什么？
5. 假如你要测接口的端口，用哪些命令？
6. 你是怎么做的健康检查？
7. 故障节点是怎么摘除的？
8. 健康检查的内部主要检查什么东西？

### 《参考解析》

**Redis 锁。** 最基本是 `SET key value NX PX 30000`——NX 保证只有一个人拿到，PX 给过期时间防死锁，value 放唯一标识（如 requestId）以便安全释放。释放要用 Lua 脚本先比对 value 再 `DEL`，避免误删别人的锁；续期用看门狗（Redisson 的 watchdog 默认每 10 秒续一次）。单机 Redis 的锁在主从切换时可能丢（主节点写入未同步就挂了，新主上没有这把锁），所以对正确性要求高的场景要用 Redlock 或直接上 ZooKeeper/etcd，或者用「锁 + 幂等」兜底。

**Docker 资源限制。** 运行时用 `docker run --cpus=2 --memory=2g --memory-swap=2g --pids-limit=...`，块设备用 `--device-read-bps`；Compose 里写 `deploy.resources.limits`，K8s 里是 `resources.limits/requests`。注意 JVM 这类进程要配合 `-XX:MaxRAMPercentage` 或 cgroup 感知，否则容器被限制而 JVM 按宿主机内存算堆，直接被 OOMKill。

**Gin 路由底层。** 基于 httprouter 的前缀树（radix tree）：每个 HTTP 方法一棵树，节点按公共前缀压缩，支持 `:param` 与 `*catchAll` 两类通配。查找时按字符逐段下探，命中参数节点就记录值，复杂度与路径长度相关而不是路由条数。它不支持同一路径注册冲突的通配（会 panic），这也是为什么 Gin 的路由性能好但灵活性有取舍。

**Gin 的 context。** 是每次请求的上下文载体：封装了 `http.Request`/`ResponseWriter`，提供参数解析（`Param`、`Query`、`ShouldBind`）、JSON 响应、以及 `Set/Get` 在中间件链之间传值；还有 `Abort` 中断链路、`Next` 手动推进。要注意它从对象池复用，不能在 handler 里起 goroutine 后继续持有——需要异步用必须 `c.Copy()`。

**测端口的命令。** `ss -lntp` / `netstat -lntp` 看监听、`curl -v telnet://host:port` 或 `nc -zv host port` 探连通、`telnet host port` 老牌但常没装、`lsof -i:port` 找占用进程。排障时按「本机监听 → 本机自连 → 跨机连 → 防火墙/安全组」的顺序逐层排除。

**健康检查与故障摘除。** 健康检查分三层：存活（进程还在不在，liveness）、就绪（能不能接流量，readiness，检查依赖如 DB/Redis/下游 RPC）、深度（业务链路自检，比如跑一笔只读查询）。内部检查的内容通常是端口可连、关键依赖往返一次、关键资源余量（连接池、磁盘、队列积压）。故障节点摘除靠健康检查结果驱动注册中心或负载均衡：连续 N 次失败标记不健康、从上游列表摘掉，恢复后连续 M 次成功再放回（避免抖动），同时要有摘除后的容量评估，别让剩下的节点被压垮。回答时最好给一次真实故障：怎么发现的、多久摘掉、事后加了什么检查项。

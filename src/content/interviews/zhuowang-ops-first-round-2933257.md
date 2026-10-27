---
title: "卓望运维一面：内存接近 100% 是否不足、Flume 三件套、从库延迟与 30% 节点错配止损"
company: "卓望"
position: "运维开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/6f1d6a1995c646c19c4b86f23670ef86
tags: ["卓望", "运维", "一面", "Linux内存", "crontab", "Flume", "主从延迟", "K8s", "发布回滚"]
summary: "卓望运维一面直接用公司内部题库问，30 分钟：Linux 主机内存接近 100% 是否等于内存不足、怎么判断；每天凌晨跑巡检脚本的最常见做法与上线注意点；交班只说「今天没问题」够不够、好的交接该包含什么；Flume 的 Source/Channel/Sink 各自作用；主从数据库从库延迟越来越大的原因与先看哪些指标；K8s Pod 一直 Pending 怎么排查；综合场景是自动化发布把错误配置推到 30% 节点导致间歇 5xx，如何止损、事后要补哪些能力；共享 root 账号有哪些问题。"
---

### 《面试题目》

1. 一台 Linux 主机内存看起来接近 100%，这一定说明内存不足吗？你会如何判断？
2. 需要每天凌晨执行一次巡检脚本，最常见的实现方式是什么？上线前要注意哪些基本问题？
3. 交接班时只说「今天没问题」是否足够？一个好的运维交接至少应该包含什么？
4. Flume 常见的 Source、Channel、Sink 分别是什么作用？
5. 主从数据库中，从库延迟越来越大，可能有哪些原因？应该先看哪些指标？
6. K8s 有了解吗？Pod 一直 Pending 怎么办，怎么排查？
7. 一次自动化发布把错误配置推到了 30% 的节点，业务开始出现间歇性 5xx，你会如何止损？事后自动化体系需要补哪些能力？
8. 共享 root 账号会有哪些问题？

### 《参考解析》

**Linux 内存接近 100% 不等于不足**：`free` 的 `available` 才是可分配给新进程的量，`buff/cache` 占满是被动利用空闲内存做缓存、可回收；判断要看 `available` 是否够、有没有 swap 换入换出（`si/so` 持续非零说明真吃紧）、有没有 OOM killer 记录（`dmesg | grep -i oom`）、以及 page cache 命中率。真正的问题是「可用内存不足 + 频繁回收」，不是「used 高」。

**凌晨巡检脚本**最常见是 `crontab -e` 写 `0 2 * * * /path/check.sh`，或者用 systemd timer（有日志与依赖管理，更现代）。上线注意点：绝对路径与显式环境变量（cron 的 PATH 很干净）、脚本要幂等、输出与退出码要落日志、失败要能告警（否则脚本静默死掉没人知道）、加锁防重入（`flock`）、避开业务高峰、以及脚本本身纳入版本管理与变更评审。

**好的交接要有五块**：当前系统状态与关键指标、进行中的变更与回滚点、已知问题与临时处置、待办与负责人、以及异常事件的时间线。只说「今天没问题」等于把风险留给下一个人。

**Flume 三件套**：Source 负责采集（taildir / spooling directory / kafka / exec），Channel 负责缓冲（memory 快但可能丢、file / kafka 持久），Sink 负责写出（HDFS / Kafka / HBase）。调优点在 Channel 容量与批量、以及 Sink 的并发与失败重试。

**主从延迟**：先看 `SHOW SLAVE STATUS` 的 `Seconds_Behind_Master`、`Read_Master_Log_Pos` 与 `Exec_Master_Log_Pos` 的差、以及 `Relay_Log_Space`；原因通常是大事务 / 大批量 DML、从库单线程回放（MySQL 5.7+ 可开并行复制 `slave_parallel_workers` + `LOGICAL_CLOCK`）、从库硬件或 IO 跟不上、主库写入突增、长查询阻塞回放、网络带宽、以及无主键表导致行锁扫描。处置是拆大事务、加索引、开并行复制、读写分离时对强一致读走主库。

**Pod Pending 排查**：`kubectl describe pod` 看 Events 里的原因——资源不足（`Insufficient cpu/memory`，看 requests 与节点可分配量）、节点亲和 / 污点容忍不匹配、PVC 未绑定、镜像拉取失败（那通常是 ImagePullBackOff）、节点 NotReady、以及配额（ResourceQuota / LimitRange）。按 Events 的提示逐项排除最快。

**30% 节点错配的止损顺序**：先止血——暂停发布流水线、把流量从异常节点摘掉（摘除 LB 后端 / 驱逐或回滚该批节点的配置）、必要时整体回滚到上一版本；再确认影响面（哪些接口、多少请求、是否影响资金类操作）；然后修复配置并灰度验证。事后要补的能力：配置的 schema 校验与 diff 预览、分批灰度 + 自动金丝雀（错误率阈值自动中止）、发布可回滚（版本化配置与一键回滚）、发布前 dry-run、以及全链路监控与告警联动。**共享 root 的问题**是权限过大误操作风险、无法审计到人、无法最小权限、密钥轮换困难、一旦泄露影响全局——解法是个人账号 + sudo 授权 + 跳板机审计 + 密钥托管。

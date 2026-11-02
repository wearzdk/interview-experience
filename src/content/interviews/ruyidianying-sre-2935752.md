---
title: "儒意电影运维开发面试：Linux 排查、请求链路与 K8s"
company: 儒意电影
position: 运维开发
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/573af4e8ca584bbe97126177f73ad0a9
tags: ["运维", "Linux", "K8s", "内存排查", "AI工具"]
summary: "儒意电影运维开发面试：Linux 查磁盘的命令、移动端 App 发请求的全链路与经过的中间件、K8s 熟悉程度、怎么排查内存占用；反问环节确认需要 24 小时 on call，以及工作中如何使用 AI。"
---

### 《面试题目》

1. Linux 查磁盘的命令有哪些？
2. 讲一下移动端 App 发请求的全链路都发生了什么，经过的中间件有哪些？
3. 熟悉 K8s 吗？
4. 怎么排查内存占用？
5. 反问：需要 24 小时 on call 吗？工作中如何使用 AI？

### 《参考解析》

1. **查磁盘**：`df -h` 看文件系统使用率和挂载点，`du -sh *` 逐层定位大目录，`lsblk` 看块设备与分区，`fdisk -l` 看分区表，`iostat -x` 看磁盘 IO 压力，`lsof +L1` 找已删除但仍被进程占用的文件（这是「df 显示满但 du 找不到」的经典原因）。

2. **App 请求全链路**：DNS 解析 → 建立 TCP/TLS 连接 → 经过 CDN 或负载均衡 → 网关（鉴权、限流、路由）→ 应用服务 → 缓存 → 数据库/下游服务，返回时再经网关和 CDN。移动端还要考虑网络切换、弱网重试、HTTP/2 多路复用和连接复用。中间件通常包括 DNS、CDN、四层/七层负载均衡、API 网关、消息队列、缓存、注册中心。

3. **K8s**：能讲清 Pod、Deployment、Service、Ingress、ConfigMap/Secret、HPA 的作用，以及滚动更新、探针（liveness/readiness）、资源 requests/limits、节点调度与污点容忍。运维视角还要会看事件（`kubectl describe`）、日志（`logs -f --previous`）、进入容器排查（`exec`）。

4. **排查内存占用**：先分层——是节点内存、容器内存还是进程内存。节点上看 `free -h`、`top`、`smem`；容器看 `kubectl top pod` 和 limit 是否触顶（触顶会被 OOMKill，看退出码 137）；进程内用 `pmap`、`/proc/<pid>/status`、堆dump 或 pprof 看具体分配。还要区分 RSS 和 page cache，cache 高不一定有问题。

5. **24 小时 on call**：如实确认自己的接受度，同时问清轮转频率、告警分级和补偿机制。这是运维岗的核心工作方式，含糊回答会在入职后出问题。

6. **运维怎么用 AI**：写排查脚本、解析日志、生成告警摘要、辅助定位（把错误和相关配置一起喂给模型）、写变更文档。边界是生产变更必须有人确认，AI 的输出要回读验证。

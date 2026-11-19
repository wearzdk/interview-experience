---
title: "海康威视技术支持面经：网络协议、Linux 命令与虚拟机扩容"
company: 海康威视
position: 技术支持工程师
date: '2026-11'
collectedAt: '2026-11-19'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/942ce90385474651bb76cf82a9f798c2
tags: ["海康威视","技术支持","网络","Linux","TCP","Kafka","虚拟机"]
summary: "海康威视内蒙古技术支持岗，线下一面二面连面，一小时四人、每人约十五分钟：问题不难但覆盖面很广，从 OSI 七层与 TCP/IP 四层、HTTP 与 HTTPS、TCP 三次握手四次挥手、交换机 VLAN 配置，到 Linux 查文件/改权限/加用户/看负载/查端口、Kafka 与 Zookeeper 默认端口、数据库增删查、模型指标与召回率、VMware 虚拟机能否热扩容。"
---

### 《面试题目》

1. OSI 七层网络模型有什么？TCP 的四层是什么？为什么一个是七层一个是四层，区别是什么？
2. HTTP 和 HTTPS 的区别？端口号分别是多少？
3. TCP 和 UDP 有什么区别？TCP 的三次握手四次挥手的具体流程？
4. 华为交换机如何配置 VLAN？
5. 用过哪些 Linux 系统？
6. Linux 系统查找文件位置的命令？移动文件？删除文件？查看文件？
7. Linux 怎么更改文件权限？chmod 后面的数字 7 表示什么意思？
8. 如何新增 Linux 用户？怎么切换用户？
9. Linux 怎么使用管理员权限操作？
10. 怎么查看 Linux 系统的版本？CPU 占用率？内存占用率？
11. 如何在 Linux 上判断网络连接是否正常？
12. 如何查看 Linux 监听的端口号？
13. Kafka 默认端口号是多少？Zookeeper 是多少？
14. 数据库如何读取某张表中的某行数据？
15. 如何清空某张表的内容？
16. 如何删除表？
17. 模型训练的效果通过什么指标判断？召回率什么意思？
18. VMware 虚拟机在开机状态下能不能扩内存，能不能扩存储？能不能缩存储？

### 《参考解析》

**OSI 与 TCP/IP**：OSI 是七层参考模型——物理、数据链路、网络、传输、会话、表示、应用；TCP/IP 是四层实现模型——网络接口、网络、传输、应用。七层把功能拆得更细（会话与表示独立），便于教学与协议描述；四层把上层合并，贴近实际协议栈的实现。回答时说明两者是「参考模型」与「工程实现」的关系，而不是互相矛盾。

**HTTP 与 HTTPS**：HTTP 明文传输，默认 80；HTTPS 在 HTTP 之下加 TLS，提供加密、完整性校验与身份认证，默认 443。HTTPS 需要证书，握手阶段多出密钥协商，性能开销靠会话复用与 TLS1.3 降低。

**TCP 与 UDP**：TCP 面向连接、可靠、有序、有流量控制与拥塞控制，开销大；UDP 无连接、不保证送达与顺序，开销小、延迟低，适合实时音视频与 DNS。三次握手是 SYN、SYN+ACK、ACK，目的是确认双方收发能力并同步序号；四次挥手是 FIN、ACK、FIN、ACK，因为 TCP 全双工，两个方向要分别关闭。

**交换机配 VLAN（华为）**：进入系统视图 `system-view`，创建 VLAN `vlan 10`，进入接口 `interface GigabitEthernet0/0/1`，配置接入模式 `port link-type access` 并划分 `port default vlan 10`；跨交换机用 trunk 口 `port link-type trunk` + `port trunk allow-pass vlan 10`。三层互通需要配 VLANIF 接口地址。

**Linux 常用命令**：查找文件用 `find / -name "x"`（按内容搜 `grep -r`）；移动 `mv`、删除 `rm -rf`、查看 `cat`/`less`/`tail -f`；改权限 `chmod`，数字 7 = 4（读）+2（写）+1（执行）；新增用户 `useradd`、设密码 `passwd`、切换 `su -`；管理员权限用 `sudo` 或 `su -`；系统版本 `cat /etc/os-release` 或 `uname -a`；CPU 与内存用 `top`、`free -h`；网络连通 `ping`、`curl`、`ss -tulnp`；监听端口 `ss -tulnp` 或 `netstat -tulnp`。

**中间件默认端口**：Kafka 默认 9092，Zookeeper 默认 2181。生产环境常改端口并配 ACL/SASL。

**数据库基本操作**：读某行 `SELECT * FROM t WHERE id = ?`（或按唯一键）；清空表内容 `TRUNCATE TABLE t`（不可回滚、重置自增）或 `DELETE FROM t`（可回滚、逐行删）；删表 `DROP TABLE t`。回答时补一句 TRUNCATE 与 DELETE 的差异，能体现理解。

**模型指标与召回率**：分类任务看准确率、精确率、召回率、F1、AUC；回归看 MAE、RMSE、R²。召回率 = 真正例 /（真正例 + 假负例），即「所有实际为正的样本中被找出来的比例」，与精确率（找出来的里有多少是对的）互为权衡。

**VMware 热扩容**：内存可以在开机状态增加（需客户机系统与 VMware Tools 支持热添加），存储可以在开机状态扩容虚拟磁盘，但扩完之后还要在客户机里扩展分区与文件系统；缩减虚拟磁盘通常不能在线做，需要关机、清理后压缩，且有损坏风险，生产环境一般不建议缩容。

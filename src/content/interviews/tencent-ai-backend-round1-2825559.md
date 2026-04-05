---
title: 腾讯 AI后台开发一面凉经
company: 腾讯
position: AI后台开发
round: 一面
date: '2026-04'
result: 凉经
source: 牛客网
tags: ["Java","Redis","TCP-IP","Linux","Git","多线程"]
summary: "腾讯AI后台开发一面凉经，历时1小时，涵盖Java内存结构、sleep/wait区别、Redis zset与set、死锁定位、TCP四次挥手、Linux权限与磁盘命令、进程调度算法、Git冲突解决，以及IP地址转32位整数手撕题，适合后台开发求职者备考参考。"
---

## 面试题目

### 项目与背景

1. 项目拷打
2. 实习拷打
3. 简历上都是自己玩的项目吧，实验室有没有做过项目？

### AI工具与生态

4. 介绍一下 React 模式？
5. 有用过 MCP 和 Skill 吗？详细介绍一下，两者区别是什么？
6. 平时写代码用过什么 AI 工具？
7. AI 工具，VS Code 里面用和命令行用有什么区别？
8. 有没有关注过业界最火的编程工具？
9. Openclaw 是什么，有养过虾吗？

### Java 基础

10. 介绍一下 Java 内存结构？
11. `sleep()` 和 `wait()` 的区别？
14. Java 程序出现死锁如何定位？
15. 死锁是如何造成的？
16. Java 内存使用率过高，如何定位？
21. Java 里面如何改进程优先级？

### Redis

12. Redis 中 zset 和 set 的区别？
13. Redis 内存不够了，如何定位？

### 网络

17. TCP 四次挥手？
18. IP 头有个 protocol 字段，TCP 数值是多少？

### 操作系统 & Linux

19. 介绍进程调度算法？
20. Windows 系统如何看进程优先级？
22. `chmod 644` 表示什么？具体而言 6 表示什么？为什么有 3 个数字？
23. 如何查看 Linux 磁盘空间使用率？

### Git

24. git 中，要提交更新到主线，主线提示冲突，如何解决？

### 手撕代码

25. 将 `192.168.1.1` 转化为 32 位无符号整数（限时 10min）

---

## 参考解析

### sleep() 和 wait() 的区别
- `sleep()` 是 `Thread` 的静态方法，不释放锁，时间到自动恢复。
- `wait()` 是 `Object` 的方法，必须在 `synchronized` 块中调用，**会释放锁**，需要 `notify()/notifyAll()` 唤醒。
- 核心区别：是否释放锁、所属类不同、使用场景不同（wait 用于线程间通信）。

### Redis zset 和 set 的区别
- `set` 是无序不重复集合，底层用 hashtable 或 intset。
- `zset`（有序集合）每个元素关联一个 **score**，按 score 排序，底层用 ziplist 或 skiplist+hashtable。
- 典型场景：zset 用于排行榜、延迟队列；set 用于去重、共同好友。

### Redis 内存不够如何定位
- `INFO memory` 查看 `used_memory`、`maxmemory` 等指标。
- `OBJECT ENCODING key` 查看数据结构编码是否合理。
- 使用 `redis-cli --bigkeys` 找出大 key。
- 检查 maxmemory-policy 淘汰策略是否配置合理（如 allkeys-lru）。

### Java 死锁定位
- 使用 `jstack <pid>` 打印线程栈，搜索 `deadlock` 关键字即可定位。
- 死锁成因：线程 A 持有锁1等待锁2，线程 B 持有锁2等待锁1，循环等待。
- 四个必要条件：互斥、持有并等待、不可剥夺、循环等待。

### Java 内存使用率过高定位
- `jmap -heap <pid>` 查看堆内存概览；`jstat -gcutil <pid>` 观察 GC 频率。
- `jmap -dump:format=b,file=heap.hprof <pid>` 导出堆快照，用 MAT/VisualVM 分析大对象和内存泄漏。
- 关注 Old 区占用是否持续升高（内存泄漏特征）。

### TCP 四次挥手
- ① 客户端发 FIN，进入 FIN_WAIT_1；② 服务端回 ACK，进入 CLOSE_WAIT；
- ③ 服务端发 FIN，进入 LAST_ACK；④ 客户端回 ACK，等待 2MSL 后关闭。
- 为什么四次：服务端的 ACK 和 FIN 不能合并，因为服务端可能还有数据要发送。

### IP 头 protocol 字段
- TCP 对应值为 **6**，UDP 为 17，ICMP 为 1。
- 该字段占 8 位，标识上层传输层协议类型。

### chmod 644
- 3 个数字分别对应：**owner / group / others** 的权限。
- 6 = 4（read）+ 2（write）= 读写权限；4 = 只读。
- 644 含义：文件所有者可读写，同组和其他用户只读，常见于普通文件。

### 查看 Linux 磁盘空间
- `df -h`：查看各挂载点磁盘使用率（人类可读格式）。
- `du -sh <目录>`：查看某目录占用大小。
- `du -sh /* | sort -rh | head` 可快速找到占用最大的目录。

### Git 冲突解决
- `git pull` 后提示冲突，用编辑器打开冲突文件，手动解决 `<<<<<<<` 标记区域。
- 解决后 `git add <file>`，再 `git commit` 完成合并。
- 也可使用 `git mergetool` 调用可视化工具辅助解决。

### 手撕：IP 转 32 位无符号整数
```java
public long ipToLong(String ip) {
    String[] parts = ip.split("\\.");
    long result = 0;
    for (int i = 0; i < 4; i++) {
        result = result * 256 + Long.parseLong(parts[i]);
    }
    return result;
}
// 192.168.1.1 => 192<<24 | 168<<16 | 1<<8 | 1 = 3232235777
```
- 每段 0-255，共 4 段，依次左移 24/16/8/0 位后按位或即可。
- 注意用 `long` 接收，避免 Java int 符号位溢出。
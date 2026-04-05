---
title: 字节跳动抖音生活服务Java后端一面凉经
company: 字节跳动
position: Java后端（用户增长）
round: 一面
date: '2026-04'
result: 凉经
source: 牛客网
tags: ["Java","Redis","MySQL","计算机网络","消息队列","算法"]
summary: "字节跳动抖音生活服务用户增长方向Java后端一面凉经，涵盖HTTP/HTTPS协议、进程通信、Redis集群与持久化、MySQL B+树原理、消息队列MQ、微服务架构等核心知识点，算法题为LeetCode Hard第60题排列序列。适合备战字节Java后端面试的候选人参考。"
---

## 面试题目

### 一、个人 & 实习背景

- HTTP 协议讲讲
- 只是把 HTTP 改成 WebSocket，那内部处理流程或编排具体有什么变化？
- 关键是怎么把完整音频基于什么维度切割？
- 延迟从 800ms 降到 200ms，这个 800ms 是处理完成返回的时间吗？
- 是发起请求之后，完整响应吗？从请求到所有 response 收完？
- 确认一下延迟口径：是接口请求维度，从发起网络请求到数据全部接收完成？
- 端到端的链路流程说一下？

### 二、计算机网络 & 操作系统

- HTTP 请求信息里面有哪些内容？Request 里都有什么？
- HTTP 和 HTTPS 的区别是什么？
- HTTPS 传输过程中具体是怎么保证数据安全的？
- 现在浏览器都是多进程，进程之间协作通信方式有哪些？
- 进程之间的通信方式有哪些？
- 方法的入参、出参、局部变量在内存哪块区域？

### 三、Redis & MySQL & 中间件

- Redis、MySQL 这些组件用过吗？
- 缓存怎么使用 Redis？具体怎么用？
- 积分排行榜是整个站点所有用户积分排名吗？
- Redis List 有数量上限，量大后性能会有问题，几万几十万用户还能用吗？
- Redis 集群解决了什么问题？
- 排行榜是一个 key，集群怎么分？
- 100 万用户按 1 万一组分片：
  - 新用户进来往哪个分片加？
  - 边缘用户积分变动，跨分片时数据怎么处理？
  - 有更好的方案吗？
- Redis 还用过其他功能吗？
- 不重复领优惠券是什么场景？
- Lua 脚本里查，其他人同时执行不也会有问题吗？
- Redis 持久化方式有哪些？
- MySQL InnoDB 为什么用 B+ 树？
- MQ 用过吗？了解吗？知道是做什么、解决什么问题吗？

### 四、项目 & 架构

- 之前做的都是 Spring Boot 单体服务吗？
- 有没有接触过微服务架构？

### 五、算法题

- 第 k 个排列有思路吗？
- LeetCode Hard 60. 排列序列

---

## 参考解析

### HTTP 与 HTTPS 区别及 HTTPS 安全保障

HTTPS = HTTP + TLS/SSL，主要差异：端口（80 vs 443）、数据加密、身份验证。
TLS 握手流程：客户端发 ClientHello → 服务端返回证书 → 客户端验证证书并生成预主密钥（用服务端公钥加密）→ 双方各自生成会话密钥 → 后续使用对称加密传输。
核心保障：非对称加密交换密钥，对称加密传输数据，CA 证书防中间人攻击。

### HTTP Request 组成

请求行（Method + URL + HTTP版本）、请求头（Host、Content-Type、Cookie、Authorization 等）、空行、请求体（POST/PUT 时携带数据）。

### 进程间通信方式（IPC）

管道（匿名/命名）、消息队列、共享内存、信号量、Socket、信号。浏览器多进程间常用 IPC（Chromium 用 Mojo 框架），本质是 Socket 或共享内存。

### 方法入参/出参/局部变量的内存区域

均存放于**虚拟机栈（Stack Frame）**中的局部变量表。每次方法调用创建一个栈帧，方法返回后栈帧出栈，内存自动释放。对象本身在堆上，栈中存的是引用。

### Redis ZSet 做排行榜 & 集群分片问题

ZSet（有序集合）天然支持排行榜，底层跳表+哈希，O(log N) 插入/查询。
单 key 在集群中只能落在一个 slot/节点，无法水平扩展。
大规模方案：按分数区间分桶（如每10万分一个 ZSet key），查全榜时多桶合并；或使用 Top-K 近似算法；跨分片积分变动需先删旧桶再插新桶，可用 Lua 脚本保证原子性。

### Redis Lua 脚本与原子性

Redis 单线程执行 Lua 脚本，整个脚本执行期间不会被其他命令打断，天然原子。因此"查+写"放在同一 Lua 脚本内可解决并发重复领券问题（相比 GET + SET 两步操作有竞态）。

### Redis 持久化方式

- **RDB**：定时快照，文件紧凑，恢复快，但可能丢失最后一次快照后的数据。
- **AOF**：记录每条写命令，数据更安全，文件较大，恢复慢；支持 always/everysec/no 三种 fsync 策略。
- **混合持久化**（Redis 4.0+）：AOF 重写时以 RDB 格式存量 + AOF 格式增量，兼顾速度与安全。

### MySQL InnoDB 为什么用 B+ 树

- B+ 树非叶节点只存 key，叶节点存数据，同等页大小可容纳更多索引项，树高更低（通常 3-4 层），磁盘 IO 少。
- 叶节点双向链表，范围查询只需一次定位后顺序扫描，效率高。
- 相比哈希索引，支持范围查询和排序；相比 B 树，叶节点链表使范围查询无需回溯。

### MQ 的作用

三大核心价值：**异步解耦**（生产者/消费者独立扩展）、**流量削峰**（缓冲突发流量）、**数据分发**（一条消息多消费者广播）。常见组件：Kafka（高吞吐日志流）、RocketMQ（金融级可靠）、RabbitMQ（低延迟任务队列）。

### LeetCode 60. 排列序列

核心思路：**康托展开**（逐位确定）。
1. 预计算阶乘数组 `fact[]`，`fact[i] = i!`。
2. `k -= 1`（转为0-indexed），维护可用数字列表。
3. 每次用 `k / fact[n-1]` 确定当前位选第几个数，`k %= fact[n-1]`，`n--`，重复直到选完。
时间复杂度 O(n²)（列表删除），空间 O(n)。

```java
public String getPermutation(int n, int k) {
    int[] fact = new int[n];
    fact[0] = 1;
    for (int i = 1; i < n; i++) fact[i] = fact[i-1] * i;
    List<Integer> nums = new ArrayList<>();
    for (int i = 1; i <= n; i++) nums.add(i);
    k--;
    StringBuilder sb = new StringBuilder();
    for (int i = n - 1; i >= 0; i--) {
        int idx = k / fact[i];
        sb.append(nums.get(idx));
        nums.remove(idx);
        k %= fact[i];
    }
    return sb.toString();
}
```
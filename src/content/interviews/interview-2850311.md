---
title: 合肥暑期实习小厂golang面经
company: 某互联网公司
position: 前端开发工程师
date: '2026-05'
result: OC
base: 安徽
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2850311
tags: ["Java", "Go", "C++", "Redis", "计算机网络", "LLM"]
summary: "某互联网公司前端开发工程师面经，考察Java、Go、C++等核心知识点。包含真实面试题目与解析，适合准备前端开发工程师面试的求职者参考备考。"
---

### 《面试题目》

1. 自我介绍
2. 介绍自己对内外网的认识
3. 如果想要内网发数据给外网怎么做 （不知道，我回答的是使用内网穿透，花生壳这种）
4. 对内网穿透了解多少？ UDP点对点打洞了解吗？
5. channel了解吗？无缓冲channel和有缓冲channel区别 ？ 项目中channel使用情况？
6. go的切片底层
7. 有使用ai编程吗？ 感觉如何？ 如果让你使用ai编程，怎么开始？
8. 如果ai生成的代码出错，或者不符合你需求，怎么改变？
9. 问了项目websocket的部分
10. 问了为什么选择go语言而不是java/c++
11. gin问了如果url传的字段绑定失败了怎么办？ 我项目是抽象了dto层去收前端的json请求，所以我说绑定失败直接打印错误，返回了。 我感觉应该是说如果用model层去接受前端请求，这时绑定失败是可以宽松绑定
12. 项目的数据流 router -> handler- > service -> dao
13. 为什么要依赖注入？
14. 1000 个用户，每个用户建立一次 TCP 三次握手，就有 3000 次 TCP 握手开销，怎么办？（回答的HTTP2.0， 一个TCP可以跑多个stream流，每个流有唯一流ID,应用层根据Stream ID区分。）
15. 问了项目的帖子排行榜（主要说了怎么设计的， 介绍了一下怎么获取热门帖子，ZSET的一个排序函数）
16. 提了一下策略模式， 帖子列表支持热度排序和时间排序
17. 查数据时并发怎么保证？ （用redis的Setnx做一个短锁，没抢到的自旋等待，抢到锁的读库，写入缓存没有缓存空值）
18. defer执行顺序， defer中值的初始化时间？
19. 关闭的channel能读数据吗？ 能关闭已经关闭的channel吗？ 向已经关闭的channel发数据会怎样？
20. 总结： 因为准备时间比较短40天， 也是也学越焦虑。就想去试试水，体验还不错。  建议： 打牢基础，技术广度可以拓宽下。 大模型知识挺喜欢问的，可以背一背。

---

### 《参考解析》

1. **计算机网络**：TCP（传输控制协议）是面向连接、可靠的传输协议，提供流量控制和拥塞控制；UDP（用户数据报协议）是无连接、不可靠但速度更快的协议。TCP通过三次握手建立连接（SYN→SYN+ACK→ACK），四次挥手断开（FIN→ACK→FIN→ACK）。

2. **Redis核心**：Redis常用数据结构：String/Hash/List/Set/ZSet。持久化：RDB（定期快照，恢复快，数据可能丢失）和AOF（追加日志，数据安全，文件大）。缓存穿透用布隆过滤器；缓存雪崩加随机过期时间+多级缓存；缓存击穿用互斥锁或逻辑过期。分布式锁用SET key value NX PX + Lua脚本保证原子释放。

3. **Spring框架**：Spring IoC容器管理Bean生命周期，核心是依赖注入（DI）。AOP面向切面编程通过动态代理（JDK/CGLIB）实现横切关注点（日志/事务/权限）。Spring事务传播行为：REQUIRED（加入现有或新建）、REQUIRES_NEW（挂起当前，新建）、NESTED（嵌套事务）等。

4. **Java并发**：Java并发：synchronized关键字（偏向锁→轻量级锁→重量级锁升级）；ReentrantLock（可重入、可中断、公平锁）；volatile（内存可见性+禁止指令重排，不保证原子性）；CAS（Compare-And-Swap，无锁乐观并发）；ThreadLocal（线程本地变量，WeakReference，注意内存泄漏）。线程池核心参数：corePoolSize/maximumPoolSize/keepAliveTime/workQueue/handler。

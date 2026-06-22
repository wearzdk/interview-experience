---
title: 网易雷火游戏服务端凉面
company: 网易
position: 移动端开发工程师
round: 一面
date: '2026-05'
base: 重庆
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2851410
tags: ["Java", "MySQL", "Redis", "计算机网络", "操作系统", "Linux"]
summary: "网易移动端开发工程师一面面经，考察Java、MySQL、Redis等核心知识点。包含真实面试题目与解析，适合准备移动端开发工程师面试的求职者参考备考。"
---

### 《面试题目》

1. 搞Java的面这个真是全程被拷打。。。
5. 12 一面 50min
6. 迭代器删除，如何正确操作避免迭代器失效导致程序崩溃
7. Java虚函数，Java内存对齐
8. 大端序小端序，写代码
9. 最小生成树两个算法思想
10. avl树，用于什么场景，有什么问题
11. Linux怎么看进程状态时运行、睡眠还是僵尸状态
12. 编写sql返回每个产品的总销售量

**ipv4子网划分**
13. tcp建立连接释放连接，FIN_wait2，close_wait，time_wait，会不会出现客户端服务器同时time_wait

**大语言模型原理**
14. 1024盏灯，初始化全为1，第一次改变1，2，3...灯的状态，第二次改变2，4，6...，第三次3，6，9...，执行到1024次还有多少亮着的灯
15. m*n网格有多少正方形
16. 二面5.13  30min
17. 实例化没有成员变量的类，分配内存为0吗，为什么

**代码LRU**

**有哪些异步io**
18. epoll和using
19. 大模型的K-V 缓存，一个token需要和前面的所有token进行计算吗
20. rag是什么，向量匹配不高怎么解决
21. skills是怎么加载的
22. 平时用不用ai，怎么用
23. 你用trae为什么不用codex和Claude

---

### 《参考解析》

1. **计算机网络**：TCP（传输控制协议）是面向连接、可靠的传输协议，提供流量控制和拥塞控制；UDP（用户数据报协议）是无连接、不可靠但速度更快的协议。TCP通过三次握手建立连接（SYN→SYN+ACK→ACK），四次挥手断开（FIN→ACK→FIN→ACK）。

2. **MySQL深度**：MySQL InnoDB使用B+树索引，支持ACID事务。关键知识点：聚簇索引（主键索引）叶节点存完整行数据；辅助索引叶节点存主键值（需回表）；MVCC通过undo log版本链+ReadView实现多版本并发控制，解决脏读/不可重复读；事务隔离级别从低到高：读未提交→读已提交→可重复读（默认）→串行化。

3. **Redis核心**：Redis常用数据结构：String/Hash/List/Set/ZSet。持久化：RDB（定期快照，恢复快，数据可能丢失）和AOF（追加日志，数据安全，文件大）。缓存穿透用布隆过滤器；缓存雪崩加随机过期时间+多级缓存；缓存击穿用互斥锁或逻辑过期。分布式锁用SET key value NX PX + Lua脚本保证原子释放。

4. **RAG与大模型**：RAG（检索增强生成）流程：文档切片→向量化（Embedding）→存向量数据库→检索时将query向量化→TopK语义检索→将相关文档拼入prompt→LLM生成。优化：混合检索（语义+关键词）、重排序Rerank、查询改写、上下文压缩。评估：召回率（relevant docs retrieved/total relevant）、精确率、Answer相关性。

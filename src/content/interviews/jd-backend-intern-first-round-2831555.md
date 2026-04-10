---
title: 京东后端实习一面面经
company: 京东
position: 后端实习
round: 一面
date: '2026-04'
result: 凉经
source: 牛客网
tags: ["MySQL","SpringCloudAlibaba","Redisson","线程池","AI Agent"]
summary: "京东后端实习一面面经。面试官深入考察了MySQL架构与索引、SpringCloudAlibaba组件原理（Nacos/Sentinel/Seata）、Redisson锁机制及线程池参数。同时重点考核AI Agent开发相关技术，包括微调、RAG、MCP协议及Spring AI底层原理。"
---

### 《面试题目》

**MySQL**
- InnoDB为什么支持事务，有什么锁，有什么索引，索引实现场景，为什么失效，怎么不失效
- MyISAM为什么不支持事务，有什么锁，有什么索引
- MySQL什么版本开始支持全文索引

**SpringCloudAlibaba**
- Nacos是什么，有什么用，有哪些算法(数据同步的一致性协议和流量分发的负载均衡策略)
- Sentinel是什么，有什么用，有哪些算法(数据统计的算法和流量控制的算法)
- Seata怎么实现的，Dubbo需要注意哪些问题

**Redisson/Java基础**
- RLock能干啥，原理？
- RRateLimiter能干啥，原理？
- 看门狗怎么实现的
- ThreadLocal需要注意什么
- 线程池7个参数，流程？

**Agent开发**
- 微调，MCP底层，长记忆管理，短记忆管理
- Spring AI底层，Spring AI Alibaba封装了什么，跟LangChain4j区别
- 怎么解决幻觉

---

### 《参考解析》

- **InnoDB事务与锁**：支持事务基于MVCC和Redo/Undo Log；有行锁/间隙锁/临键锁；索引使用B+树。失效常见于对索引列进行函数计算、使用!=、like '%xxx'等。
- **Nacos与Sentinel核心**：Nacos一致性协议常用Raft或Distro，负载均衡常用轮询或一致性Hash；Sentinel流量统计基于滑动窗口算法，流控基于令牌桶或漏桶算法。
- **Redisson看门狗**：其核心是定时任务（TimerTask），每隔一段时间（默认10s）检查锁是否还持有，若持有则延长锁的过期时间，防止业务未执行完锁过期。
- **线程池流程**：核心线程数 -> 任务队列 -> 最大线程数 -> 拒绝策略。注意线程池资源上限与线程上下文切换开销。
- **AI Agent技术点**：RAG（检索增强生成）通过外挂知识库减少幻觉；MCP（模型上下文协议）用于规范Agent与数据源的交互；Spring AI封装了LLM的接入接口，使开发者能像操作传统API一样调用模型。
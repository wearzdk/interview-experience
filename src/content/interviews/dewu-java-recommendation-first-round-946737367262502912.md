---
title: "得物 Java（推荐系统）一面：Agent 信息准确性、Spring AI 与 TCP/IP"
company: "得物"
position: "Java 开发（推荐系统）"
round: "一面"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/946737367262502912
tags: ["得物","Java","推荐系统","Agent","Spring AI","TCP","UDP","HTTP"]
summary: "得物 Java（推荐系统）一面（约 30 分钟，无手撕）：自我介绍后围绕简历项目提问，重点追问 Agent 工作中如何保证信息准确性、Spring AI 的关键组件、TCP/IP 整个体系、TCP 与 UDP 的区别，以及「能不能用 TCP 客户端向 HTTP 服务器建立请求并接收响应」。"
---

### 《面试题目》

1. 自我介绍。
2. 针对简历项目提问：在 Agent 工作中如何保证信息的准确性？
3. Spring AI 有哪些关键组件？
4. 介绍一下 TCP/IP 整个体系。
5. 分别介绍一下 TCP 和 UDP。
6. 能不能通过一个 TCP 客户端向 HTTP 服务器建立请求并接收响应？

### 《参考解析》

Agent 的信息准确性要拆成三层答：输入层（检索到的资料是否相关、是否新鲜，靠检索策略与数据源治理）、生成层（是否强制引用来源、是否要求模型在证据不足时拒答、是否用结构化输出约束格式）、校验层（关键字段用规则或二次模型核对、把「模型说」和「系统查到」分开）。工程上再加一道兜底：把不确定性暴露给用户（标注来源与置信度），并留下可回放的全链路日志，方便事后定位是哪一层出的错。

Spring AI 的关键组件按「抽象」记：ChatClient / ChatModel（对话与模型抽象）、EmbeddingModel、VectorStore（向量存储与相似度检索）、Tool/Function Calling（把 Java 方法暴露成模型可调用的工具）、Advisors（在请求前后插入检索、记忆、日志等横切能力）、PromptTemplate，以及流式输出与结构化输出的支持。答的时候把它和 LangChain 的对应概念对一下，说明你理解的是设计模式而不是背类名。

TCP/IP 体系从下往上讲：链路层（以太网、ARP）→ 网络层（IP、ICMP、路由）→ 传输层（TCP/UDP）→ 应用层（HTTP、DNS 等）。TCP 面向连接、可靠、有序、有流量控制与拥塞控制（三次握手建立、四次挥手关闭、超时重传、滑动窗口、慢启动）；UDP 无连接、不保证顺序与到达，换来低开销和低延迟，适合音视频、游戏状态同步、DNS 这类场景。

最后一题是个很好的辨析题：能。HTTP 是应用层协议，本身跑在 TCP 之上，你完全可以用原始 socket 建 TCP 连接，然后按 HTTP 报文格式手写请求行（`GET / HTTP/1.1`）、Host 头、空行，再解析响应头和 body（注意 `Content-Length` 或 `Transfer-Encoding: chunked`）。这题考的是「协议分层」的理解——面试官想确认你知道 HTTP 不是魔法，也知道实际项目里不该手写而是用 HTTP 客户端库（连接池、重试、超时、TLS）。

推荐系统方向被问到这一组题，说明一面还是以「基础扎实 + 项目真实」为主，算法部分留到后面。

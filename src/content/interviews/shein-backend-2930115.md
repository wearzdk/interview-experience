---
title: "SHEIN 后端 一面：Session/Cookie、GET 请求体与 TCP"
company: "SHEIN"
position: "后端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/08da697f35e542eba9d55ecdad1c1639
tags: ["SHEIN", "后端开发", "HTTP", "Session", "Cookie", "TCP", "IOC"]
summary: "SHEIN 信息技术类后端一面，从 AI Coding 的使用习惯切入 HTTP：session 与 cookie 的报文关系、GET 能否带请求体、OSI 分层与 TCP 三次握手四次挥手，最后问 Spring IOC 容器的理解。"
---

### 《面试题目》

1. 平时古法编程多一点，还是 AI Coding 多一点？
2. 从 HTTP 协议跟报文的角度上，讲一下 session 和 cookie 的关系是什么？
3. 辩论一个问题：你认为 GET 请求可以带请求体吗？如果可以，你觉得可以的依据是什么？
4. HTTP 协议在 OSI 七层模型中的哪一层？
5. OSI 七层模型讲一下。
6. TCP 和 UDP 在哪一层？
7. 口述一下 TCP 的三次握手和四次挥手。
8. 讲一下对 IOC 容器的理解。

### 《参考解析》

**Session 是服务端状态，Cookie 是浏览器侧的载体，两者通过 Session ID 在报文里对上。** HTTP 本身无状态，服务端要在多次请求间认出同一个用户，就在登录成功后生成一个随机 Session ID，把用户数据存进服务端（内存、Redis 或数据库），然后回一个响应头 `Set-Cookie: SESSIONID=...; HttpOnly; Secure; SameSite=Lax; Path=/`。浏览器按域、路径、过期时间保存，后续同源请求自动带上 `Cookie: SESSIONID=...`；服务端从 Cookie 里取出 ID，回查 Session 存储，从而恢复登录态。所以严格说 Cookie 不等于 Session：Cookie 只是 ID 的运输工具，也可以存别的非敏感数据；Session 也可以不用 Cookie，而用 URL 重写或自定义 header 传 ID，只是浏览器自动携带这点让 Cookie 最方便。工程上要注意：Session ID 要足够随机、登录后轮换以防固定会话攻击；Cookie 加 `HttpOnly` 防 XSS 读取、`Secure` 只走 HTTPS、`SameSite` 防 CSRF；分布式部署时 Session 要集中存储或做粘性会话，否则请求落到另一台机器就掉登录。和 JWT 的对比可以一句话带过：JWT 把状态放在客户端签名令牌里，服务端无状态但撤销和续期更麻烦。

**GET 能不能带请求体，答案要分“协议语法”“语义”“客户端实现”三层。** HTTP 消息本身由起始行、头部、空行和消息体组成，RFC 9110 并没有在语法上禁止 GET 带 content，但它明确说 GET 的 content 没有普遍定义的语义，很多实现会忽略、拒绝或缓存出错；RFC 7231 更直白地提醒“发送 GET 请求体可能导致现有实现拒绝”。浏览器侧，Fetch 规范直接禁止 GET/HEAD 带 body，`XMLHttpRequest.send(body)` 对 GET 也会忽略或抛错；curl 用 `-X GET -d` 能发出去，服务端框架有的能读到，有的直接丢掉，中间的代理、缓存、WAF 也可能不转发。所以辩论时可以站“语法上可以，工程上不应该”：如果确实需要传复杂条件，用 POST（语义是“处理”而非“获取”）或把参数放 query；如果只是超长查询，考虑 POST + 明确的缓存/幂等设计。面试官要听的是你知道边界，而不是背一句“GET 不能带 body”。

**HTTP 在 OSI 的应用层，TCP/UDP 在传输层，但真实网络栈常按 TCP/IP 四层来讲。** OSI 七层从下到上是物理层、数据链路层、网络层、传输层、会话层、表示层、应用层；HTTP 属于应用层，负责请求/响应的语义；TLS 在 OSI 里常被放在会话层/表示层附近，但工程上它就是介于应用和 TCP 之间的一层；TCP/UDP 属于传输层，IP 属于网络层，以太网/Wi-Fi 属于数据链路和物理层。实际互联网用 TCP/IP 模型：网络接口层、网际层、传输层、应用层，HTTP、DNS、SMTP 都在应用层。HTTP/1.1 和 HTTP/2 都跑在 TCP 上，HTTP/3 跑在 QUIC 上，而 QUIC 基于 UDP，所以“HTTP 一定在 TCP 上”是错的。回答时画出分层、每层给一个协议例子，再补 HTTP/3 这个例外，基本就不会被追问倒。

**三次握手解决“双方都确认收发能力 + 同步初始序列号”，四次挥手是因为 TCP 是全双工。** 握手：客户端发 `SYN, seq=x`，进入 SYN_SENT；服务端回 `SYN+ACK, seq=y, ack=x+1`，进入 SYN_RCVD；客户端再发 `ACK, ack=y+1`，双方进入 ESTABLISHED。三次而不是两次，是为了让服务端确认客户端收到了自己的 SYN，同时防止网络中滞留的旧连接请求突然建立连接；两次会让服务端单方面认为连接已建立。挥手：主动关闭方发 `FIN`，进入 FIN_WAIT_1；对方回 `ACK`，进入 CLOSE_WAIT，主动方进入 FIN_WAIT_2；对方处理完数据再发 `FIN`，主动方回 `ACK` 并进入 TIME_WAIT，等待 2MSL 后关闭。四次是因为每个方向都要单独关闭：收到 FIN 只表示对方没有数据要发了，自己可能还有数据要发，所以 ACK 和 FIN 不能合并。TIME_WAIT 的作用是确保最后一个 ACK 能到达、并让旧连接的重复报文在网络中消失；大量 TIME_WAIT 会占端口，可通过连接复用、调参缓解，但不要简单理解为“服务器有 bug”。还要能提 SYN Flood 与 SYN Cookie、半连接队列/全连接队列这些延伸。

**AI Coding 和手写不是二选一，按风险分工。** 日常可以用 AI 生成样板代码、单测、SQL、脚本、解释报错和陌生代码，省掉查语法和搭脚手架的时间；核心的并发、安全、资金、协议细节自己写并逐行 review，因为这部分错了代价高，而且需要你真的理解才能排查。回答“古法多还是 AI 多”时不用站队，讲清使用比例、验证流程和一次具体提效案例即可：AI 产出要过编译、lint、单测和 code review，敏感数据不贴进去，关键逻辑不直接复制。

**IOC 是把“对象的创建和依赖装配”交给容器，依赖注入只是它的实现方式。** 传统写法里一个类自己 `new` 依赖，控制权在类内部；IOC 反过来，由 Spring 的 BeanFactory/ApplicationContext 读取 BeanDefinition，反射实例化对象，再按构造器、setter 或字段把依赖注进去。容器还负责生命周期：实例化、属性填充、Aware 回调、BeanPostProcessor 前后处理、`afterPropertiesSet`/init-method、使用、销毁；默认单例，也有 prototype、request 等作用域。好处是解耦、可替换实现、方便测试（可以注入 mock）、统一管理横切逻辑（AOP 代理）；代价是启动变慢、链路不直观、出问题要靠日志和断点定位，字段注入还会掩盖循环依赖。循环依赖方面，单例的 setter/字段注入可以通过三级缓存提前暴露引用解决，构造器注入循环依赖则直接失败，所以更推荐构造器注入，让依赖关系在编译期就暴露。回答时把“控制反转”和“依赖注入”区分开，再补一个自己项目里用 IOC 解耦的例子，会比背概念更扎实。

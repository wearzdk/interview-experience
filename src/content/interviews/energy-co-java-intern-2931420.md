---
title: "杭州某能源公司 Java 实习一面：Spring 接口与基础网络"
company: "某能源公司"
position: "Java 后端实习"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/6faab8e81c9a45598b6c3a277165ab77
tags: ["Java","SpringBoot","实习面经","Controller","TCP"]
summary: "节奏很快的一场线上面：两分钟自我介绍、学校与实习、Java 和 SpringBoot 的熟悉程度、和前端协作该用哪类接口、Controller 的常用注解、目前在用什么数据库、TCP 与 UDP，二十多分钟结束，当场给了口头 offer。"
---

### 《面试题目》

1. 两分钟介绍自己。
2. 学校与实习经历。
3. Java 和 SpringBoot 熟吗？
4. 如果要与前端合作，用哪类接口？
5. Controller 的常用注解有哪些？
6. 目前在用什么数据库？
7. TCP 与 UDP 的区别？
8. 有没有什么要问我们的？

### 《参考解析》

**和前端协作用什么接口**：业务系统里最常见的是 **RESTful HTTP 接口**（JSON over HTTPS），按资源组织 URL、用 GET/POST/PUT/DELETE 表达语义、用状态码表达结果。需要强类型契约时可以上 OpenAPI 生成前端 SDK。实时性要求高的场景用 WebSocket 或 SSE（比如进度推送、消息通知）；内部服务间调用可以用 RPC（gRPC/Dubbo）换取性能和强类型。回答时补一句取舍：HTTP 简单通用、易调试、易跨语言，RPC 性能好但耦合强、运维复杂。

**Controller 的常用注解**：`@RestController`（= `@Controller` + `@ResponseBody`，返回值直接序列化成 JSON）、`@RequestMapping`（类级前缀，方法级用 `@GetMapping` / `@PostMapping` 等更具体）、`@PathVariable`（路径变量）、`@RequestParam`（查询参数）、`@RequestBody`（JSON 请求体反序列化成对象）、`@RequestHeader` / `@CookieValue`、`@Valid` / `@Validated`（配合 JSR-303 注解做参数校验）、`@ExceptionHandler` + `@RestControllerAdvice`（统一异常处理）。加分点：说清参数校验失败会抛 `MethodArgumentNotValidException`，由全局异常处理器转成统一错误结构。

**TCP 与 UDP**：TCP 面向连接、字节流、可靠有序、有流量与拥塞控制，代价是握手、重传和队头阻塞；UDP 无连接、面向报文、不保证到达与顺序，开销小、延迟低。选型看业务能不能容忍丢包：文件传输、接口调用用 TCP；音视频、游戏状态同步、DNS 用 UDP，丢了的包由应用层决定补不补。

**数据库**：说清用的什么（MySQL 版本）、为什么（团队生态、事务能力）、以及自己实际做过的事——建表设计、索引优化、慢查询排查。如果还用了 Redis，说清它承担的角色（缓存/会话/计数）而不是只报名字。

**反问**：实习岗可以问团队用什么技术栈、实习生的日常任务、有没有转正机会与考核方式。

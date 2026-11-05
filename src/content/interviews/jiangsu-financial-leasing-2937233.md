---
title: 江苏金租一面：Agent 理解与 HTTP 状态码
company: 江苏金租
position: 软件开发
round: 一面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/a3e1a89d12a547a0836a529b28546954
tags: ["Agent","OpenAI 协议","HTTP 状态码","故障处理"]
summary: "江苏金租一面记录，四道题：自我介绍、谈谈你理解的 Agent、使用 OpenAI 协议时的字段、4xx 与 5xx 的含义与处理方式。"
---

### 《面试题目》

1. 请做一下自我介绍。
2. 介绍你理解的 Agent。
3. 使用 OpenAI 协议时有哪些字段？
4. 4xx、5xx 分别是什么，怎么处理？

### 《参考解析》

**Agent 的理解**：Agent 是能自主决定下一步动作的系统，核心是「模型 + 工具 + 循环 + 状态」。模型负责理解目标与选择动作，工具让它能读文件、查数据、调接口，循环把动作结果回灌给模型直到满足终止条件，状态则保存任务进度与已确认的事实。与传统程序的区别在于控制流由模型在运行时决定，因此需要额外设计权限、沙箱、可观测性与失败兜底。

**OpenAI 协议的字段**：请求侧主要是 model、messages（role 为 system、user、assistant、tool，含 content 与 tool_calls）、tools（type 为 function，含 name、description、parameters 的 JSON Schema）、tool_choice、temperature、top_p、max_tokens、stream、stop、response_format。响应侧是 id、object、created、model、choices（含 message、finish_reason、index）、usage（prompt_tokens、completion_tokens、total_tokens）。工具调用的结果以 role 为 tool、带 tool_call_id 的消息回传。流式响应则以 data 事件逐块返回 delta。

**4xx 与 5xx**：4xx 表示客户端侧问题，服务端不应重试同一请求。400 是参数错误，检查请求体与 schema；401 未认证、403 无权限，检查密钥与授权范围；404 资源不存在；409 冲突，通常需要先读后写；422 语义校验失败；429 是限流，应当退避重试并遵守 Retry-After。5xx 表示服务端故障，500 内部错误、502 网关错误、503 暂不可用、504 超时，可以带指数退避与抖动重试，但要区分幂等性，非幂等写操作重试前需先确认是否已生效。超时属于结果未知，不能简单当作失败。

**故障处理的原则**：给每一类错误定义明确的处置策略与上限，记录结构化日志（请求 id、状态码、耗时、重试次数），并在重试耗尽后降级或向用户给出可理解的提示，而不是无限重试或静默吞掉。

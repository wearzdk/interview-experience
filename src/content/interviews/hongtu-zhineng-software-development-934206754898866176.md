---
title: "宏图智能一面面经：Agent 工具调用、MCP 原理与 Spring MVC"
company: "宏图智能"
position: "软件开发"
round: "一面"
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/934206754898866176
tags: ["Agent", "MCP", "Function Calling", "Spring MVC", "ER图", "MySQL", "慢查询"]
summary: "宏图智能软件开发岗一面面经，9 月：先问 Agent 侧大模型调用 Tool 的原理、Tool 与 CLI、MCP 的区别及 MCP 架构，再问 Spring MVC 的请求处理流程、ER 图设计与数据库慢查询优化。"
---

### 《面试题目》

1. Agent 调用 Tool 的原理是什么？
2. Tool、CLI、MCP 的区别是什么？
3. MCP 的原理是什么？
4. 说一下你对 Spring MVC 的理解。
5. ER 图怎么设计？
6. 数据库慢查询怎么优化？

### 《参考解析》

1. **Agent 调用 Tool 的原理**：模型自己不执行任何东西，它输出的是「调哪个工具、传什么参数」的结构化意图（Function Calling / Tool Use），真正执行的是你的应用代码——这是整条链路的核心。完整闭环是：用 JSON Schema 声明工具名、用途和参数结构 → 模型结合上下文判断是否需要调用 → 返回结构化调用请求 → 应用执行并把结果回传 → 模型基于结果生成有依据的回答。工程上还要补几件事：支持一次返回多个 tool_call 并行执行、参数先做 schema 校验再执行（模型会编参数）、工具报错也作为结果回传而不是直接甩给用户、循环设最大轮数防止无限调用、写操作类工具必须幂等。常见坑是把工具返回硬拼成自然语言再塞回上下文、工具描述写得太含糊导致选错工具、没有超时控制让一次调用拖死整轮对话。

2. **Tool、CLI、MCP 的层次区别**：三者不在同一层。Tool 是「模型能看见的能力声明」，粒度最细，由模型决定调用；CLI 是已经存在的命令行程序，Agent 起子进程、传参数、读 stdout，零 schema 开销但依赖 shell 权限；MCP 是把外部系统和数据源标准化接进来的协议层，走 JSON-RPC 长连接，有工具发现、能力协商和集中式鉴权。选型上，本地、快速、一次性的内循环任务用 CLI 更省；多客户端共享、需要版本化接口和权限管理的企业级集成用 MCP，代价是维护服务端与协议开销。答题时把「谁决策、怎么执行、怎么鉴权」三件事拆开讲，比背一句「CLI 更省 token」有信息量。

3. **MCP 的架构与安全边界**：MCP 是 Host–Client–Server 结构。Host 是宿主应用（IDE、桌面客户端），负责创建和管理多个 Client；每个 Client 与一个 Server 建一对一隔离连接，管协议协商、消息路由与订阅；Server 通过 Resources、Tools、Prompts 三类原语暴露能力，可以是本地进程也可以是远程服务。底层是 JSON-RPC 2.0 上的有状态会话，初始化时双方做能力协商，只声明各自支持的功能。安全设计的关键是 Server 只看得到必要的上下文：它读不到完整对话历史，也看不到别的 Server，边界由 Host 强制。容易踩的点在传输方式（stdio 适合本地进程，HTTP 类传输适合远程）、连接生命周期与超时管理，以及把 Server 的返回当可信数据直接拼进 prompt。

4. **Spring MVC 的请求处理流程**：核心是前端控制器 DispatcherServlet，所有请求先到它，再由它协调各组件。流程是：请求进来后绑定 WebApplicationContext 与本地化、主题等解析器 → HandlerMapping 按 URL 找到处理器和执行链（含拦截器）→ HandlerAdapter 真正调用处理器方法、准备 Model 数据 → 返回视图名就交给 ViewResolver 解析并渲染，处理器直接写响应体（@RestController / @ResponseBody）则走 HttpMessageConverter 序列化、不再渲染视图 → 全程抛出的异常交给 HandlerExceptionResolver 统一处理。两个「为什么」要讲得出：HandlerAdapter 的存在是为了让 DispatcherServlet 只依赖统一接口，从而适配注解式、函数式等多种处理器；职责分离是这套设计最大的价值。可以延伸到拦截器与过滤器的区别（前者在 DispatcherServlet 内、拿得到 HandlerMethod，后者在 Servlet 容器层）、参数绑定与数据校验、全局异常处理。

5. **ER 图设计**：概念设计阶段用矩形（实体）、椭圆（属性）、菱形（关系）三件套描述数据模型，步骤是找出核心实体 → 给实体定属性 → 明确实体间关联 → 标注基数（1:1、1:N、M:N）。要主动说出两个关键处理：多对多在转关系模型时必须拆中间表（学生—选课—课程），联系自身的属性（成绩、选课时间）放到中间表上；弱实体、复合属性、多值属性各有转换规则。再补一句从概念模型到物理表的动作——主键怎么选（自增、业务键还是雪花 ID）、外键与索引、范式化与必要的反范式（读多写少的宽表、冗余计数字段），以及常用工具。面试官更想听的是「为什么这样拆」，不是符号怎么画。

6. **慢查询优化**：按「先定位、再看执行计划、后改 SQL 或索引」的顺序答。定位手段是慢查询日志（生产阈值一般 1 秒，核心链路可到 0.5 秒）、performance_schema 与 sys 库的聚合视图、show processlist 看当前阻塞。拿到 SQL 后用 EXPLAIN 关注四列：type（ALL 全表最差，ref / range 可接受）、key（为 NULL 说明索引没用上）、rows（预估扫描行数）、Extra（出现 Using filesort、Using temporary 就要警惕）。索引失效的高频场景要能解释而不仅是背：索引列上套函数或表达式、字段与参数类型不一致触发隐式转换、联合索引违反最左前缀、以 % 开头的 LIKE、OR 连接了没有索引的列。最后是 SQL 与表结构层面的动作：覆盖索引避免回表、深分页改游标或子查询、联合索引把区分度高的列放前面、只查需要的列、定期清理无用索引。改完要用同一批数据回测，别凭感觉判断。

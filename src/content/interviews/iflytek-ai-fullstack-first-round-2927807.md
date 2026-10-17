---
title: "科大讯飞 AI 全栈开发一面：前端架构、进程线程与 Agent 框架"
company: "科大讯飞"
position: "AI 全栈开发"
round: "一面"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/28c95d580a13429c9aa43fd0fed2f1d7"
tags: ["科大讯飞","AI全栈","前端架构","Next.js","进程与线程","MySQL","Redis","Docker","Agent"]
summary: "科大讯飞 AI 全栈开发一面，整体偏技术摸底、考知识广度而非深度：前端问原生 JS 与其他框架的差异、自我评价、React/Next.js 的使用、Next.js 页面报错与控制台报错的区别；后端问主要语言；操作系统问进程与线程、项目里是否用到线程、Linux 使用程度；数据库问 MySQL 事务隔离级别及各自解决的问题；中间件问 Docker/K8s、Redis 的用途；AI 侧问了解哪些 Agent 框架。面试官反馈知识面较广。"
---

### 《面试题目》

1. 自我介绍。
2. 你实习用的是原生 JS，其他项目有用过什么前端架构吗？
3. 你自我评价前端是什么水平？
4. 这些前端架构用起来和原生相比有什么区别和优势？
5. 哪些项目用了 React 或 Next.js？
6. Next.js 的页面报错和控制台报错有什么区别？报错都来源于哪里？
7. 后端主要用的什么语言？
8. 进程和线程的区别？项目里有用到线程吗？
9. Linux 用得多吗？
10. 用过哪些数据库？MySQL 的事务隔离有哪些？分别解决什么问题？
11. Docker 和 K8s 用过吗？Redis 用过吗？用来做什么？
12. 了解哪些 Agent 框架和技术？
13. 反问。

### 《参考解析》

**原生 JS 与框架的差异，要落到「谁在替你管什么」。** 原生 JS 需要自己处理 DOM 更新、事件绑定与解绑、状态同步、路由、构建与兼容性；React/Vue 这类框架提供的是组件化（UI 与状态放在一起、可复用）、声明式渲染（描述状态对应的 UI，框架负责最小化 DOM 操作）、单向/双向数据流、以及生态（路由、状态管理、构建工具）。代价是运行时体积、构建链路复杂、以及「框架心智负担」——出问题时要理解框架的调度与更新机制。Next.js 在此之上又加了约定式路由、SSR/SSG/ISR、服务端组件与数据获取、API Routes，代价是服务端与客户端边界更复杂。回答「自我评价」时别空泛，给证据：做过什么页面、遇到什么性能问题、怎么定位（Lighthouse、Performance 面板、bundle 分析），比自评「熟练/精通」可信。

**Next.js 的页面报错 vs 控制台报错。** 页面报错通常指渲染阶段抛出的错误：服务端渲染时在 Node 侧抛出（会返回 500 或触发 `error.tsx` 错误边界），客户端 hydration 时抛出（页面白屏或局部崩溃），以及数据获取失败（`getServerSideProps`/Server Component 里 throw）。控制台报错范围更杂：网络请求 4xx/5xx、资源加载失败、React 警告（key、受控组件）、hydration mismatch 警告、以及未捕获的 Promise rejection。回答时按「错误发生在哪一层」拆：构建期（类型/模块解析）、服务端渲染期、客户端运行期、网络层。定位手段是看错误堆栈的第一行业务代码、看是服务端日志还是浏览器 console、以及用 `error.tsx` / `not-found.tsx` 做边界兜底。hydration mismatch 是 Next.js 的高频坑：服务端与客户端首屏输出不一致（用了 `Date.now()`、`Math.random()`、`window` 判断），解决是把这类逻辑放到 `useEffect` 或动态导入。

**进程与线程。** 进程是资源分配的基本单位，有独立地址空间；线程是 CPU 调度的基本单位，同进程内线程共享堆和方法区、各自有栈和程序计数器。通信上进程要靠 IPC（管道、消息队列、共享内存、socket），线程直接读写共享变量但要加锁。切换成本进程远高于线程（页表、TLB、地址空间），线程切换只换栈和寄存器。项目里「有没有用到线程」要答具体：Web 服务器每请求一线程/线程池、异步任务用线程池、定时任务、以及并发带来的共享状态问题（用锁、无锁结构、或消息传递）。Linux 使用程度则按「排查」答：`top/htop`、`ps`、`ss`、`lsof`、`df/du`、`free`、`journalctl`、`strace`、`tcpdump`。

**MySQL 事务隔离级别。** 四种：读未提交（RU，能读到别人未提交的数据，脏读）、读已提交（RC，只读已提交，避免脏读但不可重复读）、可重复读（RR，MySQL 默认，同一事务内多次读一致，InnoDB 用 MVCC + 间隙锁在很大程度上避免幻读）、串行化（Serializable，读加共享锁、写加排他锁，全部串行）。对应的问题：脏读、不可重复读、幻读。要补一句「实现」：MVCC 靠 undo log + ReadView（RC 每次快照读生成新 ReadView，RR 在事务第一次快照读时生成并复用），间隙锁（Next-Key Lock）解决当前读下的幻读。以及「RC 为什么很多互联网公司用」：RC 减少间隙锁、降低死锁概率，配合 binlog 的 row 格式保证主从一致。

**Docker/K8s 与 Redis 的用途。** Docker 解决「环境一致性」：镜像分层、容器隔离（namespace + cgroups）、可复现构建；K8s 解决「编排」：Pod/Deployment/Service/Ingress、滚动发布与回滚、扩缩容、健康检查、配置与密钥管理。答题时别只背概念，讲你实际用过的：Dockerfile 怎么写多阶段构建、compose 怎么起本地依赖、K8s 里怎么做探针和资源限制。Redis 的用途按场景说：缓存（旁路缓存、TTL、淘汰策略）、分布式锁（SETNX + 过期 + 唯一 value，释放用 Lua 校验）、计数器/限流（INCR、滑动窗口）、排行榜（ZSet）、会话共享、消息队列（Stream/List）。再补一句「什么时候不该用 Redis」：需要强一致、需要复杂查询、数据量远超内存。

**Agent 框架与技术。** 主流分三类：编排框架（LangChain/LangGraph、LlamaIndex、Semantic Kernel、Spring AI）、低代码平台（Coze、Dify、n8n）、以及模型厂商的 SDK（OpenAI Agents SDK、Claude Agent SDK）。核心概念要能说清：工具调用（Function Calling / MCP）、ReAct 循环、计划-执行、记忆（短期上下文、长期向量库）、多 Agent 协作（主管-工人、辩论、流水线）、可观测与评测。选择框架的判据是：要不要复杂状态机（LangGraph 适合有环、有分支、需要持久化状态的流程）、要不要快速搭 demo（Coze/Dify）、以及团队技术栈。答题时最好带一个自己做过的例子：工具怎么定义、失败怎么重试、怎么防止死循环、怎么评估效果。

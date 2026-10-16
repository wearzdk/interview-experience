---
title: "哔哩哔哩 Java后端（交易）一面"
company: "哔哩哔哩"
position: "Java后端"
round: "一面"
date: "2026-10"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/d2150475019f47d4a2a1c8fbf6c03ed9"
tags: ["Java", "AQS", "线程安全", "AI Agent", "职业规划"]
summary: "哔哩哔哩 Java 后端交易方向一面凉经：全程 25 分钟，主要问手上 offer 与一面挂的原因，八股只考 AQS、Java 如何实现线程安全、Agent 常见设计模式与选型，外加实习简单询问、AI 对开发人员的冲击与反问，未问项目。"
---

### 《面试题目》

1. 自我介绍
2. 面试官介绍部门业务
3. 询问手上有哪些 offer？面其他公司时一面挂的原因是什么？为什么考虑来 b 站？
4. 八股部分：
   （1）AQS
   （2）Java 如何实现线程安全
   （3）Agent 常见的设计模式
   （4）如何选择不同的 Agent 设计模式
5. 简单询问实习
6. AI 对开发人员的冲击
7. 反问

### 《参考解析》

**AQS**：AbstractQueuedSynchronizer 是 JUC 里锁与同步器的基础框架，核心是「一个 volatile 的 state + 一个 CLH 双向队列」。子类通过 CAS 修改 state 表示获取 / 释放（`tryAcquire` / `tryRelease`），获取失败就把当前线程包装成 Node 入队并 `LockSupport.park` 挂起，释放时唤醒后继节点。它支持独占（ReentrantLock）与共享（Semaphore、CountDownLatch、ReadWriteLock 的读锁）两种模式，还提供 Condition 条件队列。面试常追问：为什么用双向队列（需要知道前驱做唤醒与取消）、公平与非公平的差别（是否检查队列中是否有前驱）、以及为什么 state 用 volatile + CAS 而不是直接加锁。

**Java 实现线程安全的手段**：从轻到重排列——不可变对象（final、String、`Collections.unmodifiableList`）；线程封闭（ThreadLocal、栈上变量、局部对象）；无锁 CAS / 原子类（AtomicInteger、LongAdder）与 volatile（只保证可见性不保证原子性）；synchronized（锁升级：偏向锁、轻量级锁自旋、重量级锁）；显式锁（ReentrantLock 可中断、可超时、可公平）与读写锁 / StampedLock；并发容器（ConcurrentHashMap、CopyOnWriteArrayList、BlockingQueue）；以及更高层的工具（CountDownLatch、CyclicBarrier、Semaphore、CompletableFuture）。回答时要带出「优先无共享，其次不可变，最后才加锁」的思路。

**Agent 设计模式**：常见的有 ReAct（推理与行动交替）、Plan-and-Execute（先规划后执行）、Reflection（自我批判与重试）、Tool Use（函数调用）、Router / 分发（按意图路由到子 agent）、Multi-Agent 协作（规划者 + 执行者 + 评审者）、以及 Human-in-the-loop（关键步骤人工确认）。选型判据是「任务确定性、步骤长度、错误代价、延迟与成本预算」：步骤少而明确走 ReAct 或直接工具调用；步骤多且可预规划走 Plan-and-Execute；错误代价高就加 Reflection 和人工确认；任务之间独立可并行才上多 agent，否则只会放大成本和不确定性。

**AI 对开发人员的冲击怎么答**：这类开放题没有标准答案，考的是判断力。可以这样组织：短期影响在编码与样板代码，CRUD、单测、脚本这类工作被显著压缩，初级岗位的门槛抬高；中期影响在「验收与架构」，写代码不再稀缺，能定义问题、拆解任务、设计约束、审查 AI 输出的人更值钱；长期看，业务理解与跨系统协调仍然是人类的主场。落到个人身上是两件事：把 AI 用成稳定产出的一部分（工程化地用，而不是随手问），以及往下扎一层（性能、并发、分布式、领域知识）——这些是模型暂时给不出可靠答案的地方。

**这一轮的特点**：25 分钟、不问项目、面完秒挂，作者的判断是 KPI 面。这类面试的应对是：把标准化问题答得干净利落，同时在「为什么来」「手上有哪些 offer」这类问题上给一个明确、体面的回答（有 Offer 不必隐瞒，但要说清选择的理由）。被问「一面挂的原因」，可以诚实地讲自己的短板与改进行动，而不是解释成运气——面试官问这句往往是在看自我认知。

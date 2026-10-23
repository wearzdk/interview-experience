---
title: "快手客户端 infra 四面：weak/strong、C++20 协程与内存块类型判断"
company: "快手"
position: "客户端 infra"
round: "四面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/943172379738447872
tags: ["快手","客户端infra","Objective-C","C++","协程","MVVM","Agent"]
summary: "快手客户端中台 infra 的完整流程（一至四面 + HR）：每轮都是自我介绍加实习，技术点是 OC 的 weak/strong 代码纠错、MVVM、HTTP 与 HTTPS、拿到一块内存怎么判断是 OC 对象还是 C++ 对象、用 C++20 写协程框架，以及客户端如何被 Agent 赋能的理解。"
---

### 《面试题目》

1. 自我介绍。
2. 讲一下实习，重点说做了有挑战的事情。
3. 代码纠错题：OC 经典的 weak/strong 问题。
4. 谈谈 MVVM。
5. HTTP 和 HTTPS 的区别。
6. 给你一个内存块，如何判断它是 OC 的类、C++ 的类，还是其他？
7. HTTP、HTTPS、TCP、UDP 的区别。
8. 如何看待 Agent？
9. 如何使用 C++20 写一个协程框架？
10. 你对性能稳定这个方向是否感兴趣？
11. 谈谈你对客户端未来如何被 Agent 赋能的理解。

### 《参考解析》

**OC 的 weak/strong 代码纠错**：这一类题通常出现在 block 里捕获 self 造成的循环引用——self 持有 block，block 又强引用 self。修法是用 `__weak typeof(self) weakSelf = self;` 在 block 里捕获 weakSelf，进入 block 后再 `__strong typeof(weakSelf) strongSelf = weakSelf;` 并在解引用前判空。为什么要 weak + strong 两步：只用 weak 在 block 执行过程中对象可能被释放，中途变成 nil；转成 strong 能在 block 执行期间保证对象存活。另外 store 到属性上的 block 用 `copy`（现在 ARC 下 `strong` 等价），以及 delegate 属性要用 `weak` 避免循环引用与悬垂指针。

**MVVM**：M（数据模型）+ V（视图）+ VM（视图模型）。VM 把 V 的状态与行为抽象出来，暴露可绑定的属性，V 通过绑定（KVO、RAC、Combine 之类）自动更新，从而让 V 不直接依赖 M、也不写业务逻辑。相比 MVC，MVVM 解决的是「Controller 变成巨型类」的问题，代价是绑定机制带来隐式数据流、调试更难。判断用得好不好看一点：VM 是否可独立测试、是否没有 import UIKit。

**HTTP 与 HTTPS**：HTTPS = HTTP + TLS。TLS 握手完成三件事：身份认证（证书链校验到受信根）、密钥协商（ECDHE 做前向保密）、加密与完整性（对称加密 + MAC/AEAD）。代价是握手多一到两个 RTT（TLS1.3 降到 1-RTT，支持 0-RTT 恢复）、有加解密开销与证书维护成本。HTTP/2 的多路复用、头部压缩、服务器推送解决的是 HTTP/1.1 的队头阻塞与重复头部问题；HTTP/3 把传输层换成 QUIC（UDP 之上），解决 TCP 层的队头阻塞与连接迁移。

**判断内存块的类型**：这是个陷阱题，**C++ 侧没有可靠的通用方法**——C++ 对象没有运行时类型标记（除非你开了 RTTI 并且知道基类类型，才能 `dynamic_cast`），裸内存块里可能只是 POD 结构。能做的判断都是启发式：检查开头是否有 OC 对象的 `isa` 指针且指向已知类（`object_getClass` 验证，但野指针可能崩）、检查是否有已知的 magic number（很多库会在结构体头部放魔数）、检查对齐与长度是否合理。**工程上的正确做法是不要靠猜**——给自己管理的对象加显式类型标记（头部放 type tag + 长度），或者让调用方传类型信息。回答时先指出「不可靠」，再说可用的启发式与推荐的设计，比硬答一个方法更好。

**用 C++20 写协程框架**：C++20 提供的是**语言机制**不是运行时，所以要自己补：`promise_type`（定义 `get_return_object`/`initial_suspend`/`final_suspend`/`return_value`/`unhandled_exception`，以及 `await_transform`）、awaiter（`await_ready`/`await_suspend`/`await_resume`）、以及一个**调度器**——把挂起的协程句柄（`coroutine_handle`）放进就绪队列，由事件循环（epoll/kqueue/IOCP）驱动恢复。要做的决定：协程在哪个线程恢复（指定 executor）、异常怎么传播、取消怎么传递（用 stop_token 或自己的取消标志）、以及避免悬垂——协程帧的生命周期要由 handle 的所有者管理。实际框架还要封装 Task<T> 类型、支持 `co_await` 网络 IO 与定时器。

**Agent 与客户端**：可以从三个方向讲。**交互层**：从「人找功能」变成「说一句话完成任务」，客户端要提供可被 Agent 调用的能力（页面跳转、表单填充、状态查询），也就是把 UI 能力 API 化。**执行层**：端侧模型做意图理解与简单任务，复杂任务交给云端；端侧的价值是隐私、延迟、离线可用。**质量层**：Agent 的操作要可观测、可撤销、可确认，尤其是在有副作用的场景（下单、支付、发送）。难点在于客户端的强状态性（页面栈、生命周期）与 Agent 的无状态假设之间的冲突。

**性能稳定方向**：这个方向在客户端主要指启动耗时、卡顿/掉帧、内存与 OOM、崩溃率、网络耗时、包体积。回答兴趣时要能说出**怎么定位**——启动用埋点分段与 systrace，卡顿用帧率监控与主线程耗时采样，内存用 leaks/Allocations，崩溃用符号化堆栈聚合——以及**怎么防回归**（线上指标看板 + 灰度对比 + 自动化基线）。

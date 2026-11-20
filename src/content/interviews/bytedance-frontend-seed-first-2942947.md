---
title: "字节 Seed 前端日常实习一面：Electron、MQTT 与可暂停的计时器"
company: 字节跳动
position: 前端开发（Seed 产品研发，实习）
round: 一面
date: '2026-11'
collectedAt: '2026-11-20'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/31ba86e6c208442bb82f574cffa54295
tags: ["字节跳动","前端","Electron","MQTT","HTTPS","TCP","事件循环","计时器","Agent","实习"]
summary: "字节 Seed 产品研发前端日常实习一面：实习项目涉及 Electron 与 Web3D，先问 Electron 基础知识；随后是 MQTT、HTTPS 加密过程（对称还是非对称）、TCP 三次握手四次挥手、怎么学 AI 或做过什么 AI 项目、事件循环输出题、手写一个每秒输出数字且能暂停恢复进度的计时器、给一套 Agent 代码找错误点。整体偏基础，但最后没有反问环节、卡着一小时结束，面试官直接道谢。"
---

### 《面试题目》

1. 实习时做的东西有 Electron 和 Web3D 相关，问一些 Electron 的基础知识。
2. 项目相关。
3. MQTT 讲一下。
4. HTTPS 加密的过程，是对称还是非对称加密？
5. TCP 三次握手、四次挥手。
6. AI 是怎么学的？有做过什么项目？
7. 事件循环输出题。
8. 手写一个计时器，每隔一秒输出一个数字，要设计方法可以暂停然后恢复进度。
9. 一套 Agent 的代码，找出错误的点。

### 《参考解析》

**Electron 基础**：主进程（main）负责创建窗口、管理生命周期与系统能力，渲染进程（renderer）跑网页，二者通过 IPC（`ipcMain` / `ipcRenderer`、`contextBridge`）通信。安全实践是开启 `contextIsolation`、关闭 `nodeIntegration`、通过 preload 暴露白名单 API。打包用 electron-builder / electron-forge，体积大的主要原因是 Chromium 与 Node 运行时；性能问题常见于渲染进程内存泄漏、主进程阻塞（同步 IO）、以及多窗口共享状态。Web3D 场景还要注意 GPU 加速开关、`webgl` 上下文丢失与窗口缩放时的重绘。

**MQTT**：轻量级的发布/订阅协议，基于 TCP，头部最小 2 字节，适合弱网与海量设备。核心概念是 Broker、Topic（层级用 `/` 分隔，支持 `+` 单层与 `#` 多层通配）、QoS 0/1/2（最多一次 / 至少一次 / 恰好一次）、保留消息（retained）与遗嘱消息（will）。连接时有 keepalive 心跳与 clean session 选项。相比 HTTP 的请求—响应，MQTT 是长连接推送，适合 IoT 与实时通知；代价是要维护 Broker 与连接状态。

**HTTPS 的加密过程**：混合加密。握手阶段用非对称加密（RSA 密钥交换或 ECDHE）完成身份认证与密钥协商——客户端验证服务器证书链，双方协商出会话密钥；之后的数据传输用对称加密（AES-GCM、ChaCha20-Poly1305）。TLS 1.3 把握手压缩到 1-RTT（会话恢复可 0-RTT），并删除了不安全的加密套件。所以答案是「两者都用」：非对称用于协商与认证，对称用于传输。

**三次握手与四次挥手**：握手是 SYN → SYN-ACK → ACK，确认双方收发能力与初始序列号；挥手是 FIN → ACK → FIN → ACK，因为 TCP 是全双工，一方没有数据要发时才能发 FIN，两个方向各自关闭，所以通常四次（延迟确认或合并时可能三次）。主动关闭方最后进入 `TIME_WAIT` 等待 2MSL。

**可暂停的计时器**：不能只用 `setInterval` 累加计数，因为暂停期间时间仍在流逝。做法是记录三个量：已累计的毫秒数 `elapsed`、本次启动的时间戳 `startedAt`、定时器句柄。运行时显示的进度是 `elapsed + (now - startedAt)`；暂停时把这段增量并入 `elapsed` 并清除定时器；恢复时重置 `startedAt` 并重新起定时器。若要求精确到秒且不漂移，用 `setTimeout` 按「到下一个整秒的剩余时间」递归调度，而不是固定 1000ms（`setInterval` 会累积漂移）。页面隐藏时定时器会被节流，恢复时用时间戳校正。

**事件循环输出题**：先同步代码，再清空微任务队列（`Promise.then`、`queueMicrotask`、`MutationObserver`），然后取一个宏任务（`setTimeout`、`setInterval`、I/O），每个宏任务结束后再清微任务，如此循环。`async/await` 中 `await` 之后的代码相当于 `then` 回调，进入微任务；`process.nextTick`（Node）优先于 Promise 微任务。答题时按「同步 → 微任务 → 宏任务」逐轮列出，不要凭感觉排序。

**Agent 代码找错**：常见错误点包括——工具调用的参数未校验就执行、循环没有终止条件或最大轮数限制、工具报错被吞掉导致模型反复重试、把模型输出直接拼进系统提示词（提示注入）、并发调用共享状态未加锁、token 超限未做截断、以及没有超时与重试策略。审查时按「输入校验 → 循环控制 → 错误传播 → 状态隔离 → 资源上限」逐项过。

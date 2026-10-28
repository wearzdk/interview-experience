---
title: "10.20 长虹机器人软件开发二面：ROS2、DDS 与 TensorRT"
company: "长虹"
position: "机器人系统软件开发"
round: "二面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/faa6f81e27694aa1b887ccc0370c692d
tags: ["长虹","机器人","ROS2","DDS","TensorRT","Python","AUTOSAR"]
summary: "长虹机器人系统软件开发二面（主管面）：Python 迭代器与装饰器、注意力机制、中间件与执行器、ROS2 的优缺点、DDS、TensorRT 加速原理、AUTOSAR 与 ROS2 的区别、URDF 反解。"
---

### 《面试题目》

1. 做一下自我介绍。
2. Python 的迭代器和装饰器是什么？
3. 注意力机制怎么计算？
4. 接触过哪些中间件？
5. 执行器是什么？
6. ROS2 的缺陷和优点是什么？
7. DDS 了解吗？
8. 项目的来源、目标、架构是什么？
9. 项目拷打。
10. 算法做了哪些改进？
11. TensorRT 加速的原理是什么？
12. 实习拷打。
13. AUTOSAR 与 ROS2 有什么区别？
14. URDF 反解的原理是什么？
15. Git 相关。
16. 工作期望、offer 情况。
17. 反问。

### 《参考解析》

**ROS2 与 DDS**：ROS2 用 DDS 做底层通信，节点通过 Topic/Service/Action 交互。优点：去中心化（无 master）、实时性和 QoS 可配（可靠性、历史深度、deadline）、跨平台、多语言、支持安全认证。缺点：DDS 实现重、资源占用高、QoS 配置复杂、调试门槛高、生态和工具还不如 ROS1 成熟。执行器（executor）负责从中间件取就绪的回调并调度执行，单线程执行器简单但会互相阻塞，多线程执行器要配回调组（MutuallyExclusive / Reentrant）避免数据竞争。

**TensorRT 加速**：图优化（层融合、消除无用层、常量折叠）→ 精度校准（FP16/INT8，INT8 需要校准集）→ 内核自动调优（针对目标 GPU 选最快实现）→ 显存复用与动态 batch → 序列化 engine。要能说清「为什么快」：减少 kernel 启动和显存读写、融合算子、用 Tensor Core。

**AUTOSAR vs ROS2**：AUTOSAR 是车规级软件架构，强调确定性、安全（ISO 26262）、静态配置和 MCU 上的实时性，通信基于 CAN/FlexRay/以太网 SOME/IP；ROS2 更偏原型和上层计算，跑在 Linux/SoC 上，灵活但实时性和功能安全需要额外补。二者常被放在「量产 vs 研发」的语境下对比。

**URDF 反解**：URDF 描述连杆和关节的树形结构，正解是按关节角算末端位姿；反解是给定末端位姿求关节角，常用解析法（几何结构简单时）或数值迭代（雅可比伪逆、阻尼最小二乘）。工程上还要处理多解、奇异位形和关节限位。

**Python 迭代器与装饰器**：迭代器实现 `__iter__` 和 `__next__`，用 `StopIteration` 结束；生成器用 `yield` 更简洁。装饰器是接收函数返回新函数的高阶函数，用 `functools.wraps` 保留元信息，常用于日志、计时、缓存、权限。

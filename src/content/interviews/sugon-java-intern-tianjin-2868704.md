---
title: 中科曙光天津Java实习面经（线程+JVM+Spring）
company: 中科曙光
position: Java实习生
round: 技术面
date: '2026-06'
base: 天津
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2868704
tags: ["Java","多线程","JVM","Spring","SpringCloud","微服务","实习"]
summary: "中科曙光天津Java实习技术面经，全为开放性问题，考察多线程原理（线程安全与锁机制）、JVM内存结构与垃圾回收、Spring框架体系（IoC/SpringBoot/SpringCloud微服务），适合准备国企/央企Java实习面试参考。"
---

### 《面试题目》

1. 自我介绍
2. 基于自己的理解谈谈线程（单核时间片机制 vs 多核并行、线程安全问题及解决方案）
3. 谈谈你对 Java 虚拟机（JVM）的了解
4. 谈谈 Spring 框架（从 SSM 到 Spring Boot，再到 IoC/Bean 管理，最后到 Spring Cloud 微服务）

---

### 《参考解析》

**线程**
线程是 CPU 调度的基本单位。单核处理器通过时间片轮转模拟并发，多核处理器可真正并行执行多个线程。多线程共享堆内存时存在线程安全问题（可见性、原子性、有序性），解决手段包括：`synchronized`（对象锁/类锁，JVM 层面）、`ReentrantLock`（AQS 实现，支持公平锁/可中断锁）、`volatile`（保证可见性和禁止重排序，不保证原子性）、`java.util.concurrent` 并发工具类（CountDownLatch、Semaphore、ConcurrentHashMap 等）。

**JVM 内存结构**
- **堆（Heap）**：对象实例和数组，分 Young Gen（Eden + Survivor × 2）和 Old Gen，是 GC 主要区域。
- **方法区/元空间（MetaSpace）**：类元数据、静态变量、常量池，JDK 8 后改用堆外内存实现。
- **虚拟机栈（JVM Stack）**：每个线程独立，存放栈帧（局部变量表、操作数栈、方法出入口）。
- **程序计数器（PC Register）**：每个线程独有，记录当前字节码执行位置。
- **本地方法栈（Native Stack）**：服务 native 方法调用。

垃圾回收算法：标记-清除、标记-整理、复制算法；回收器：Serial、Parallel、CMS、G1、ZGC。

**Spring 框架体系**
- **IoC**：控制反转，将对象创建权交给 Spring 容器（BeanFactory/ApplicationContext），底层通过反射 + BeanDefinition 实现依赖注入（@Autowired/构造器注入）。
- **AOP**：面向切面，基于 JDK 动态代理（接口）或 CGLIB（类）实现横切关注点（日志、事务、鉴权）。
- **Spring Boot**：约定优于配置，自动装配（@EnableAutoConfiguration + spring.factories），内嵌 Tomcat，开箱即用。
- **Spring Cloud**：微服务治理套件，核心组件包括服务注册/发现（Nacos/Eureka）、网关（Gateway）、负载均衡（Ribbon/LoadBalancer）、熔断降级（Sentinel/Hystrix）、远程调用（OpenFeign）。
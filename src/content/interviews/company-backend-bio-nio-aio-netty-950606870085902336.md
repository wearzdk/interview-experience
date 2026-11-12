---
title: "后端面试：BIO、NIO、AIO 的区别与 Netty 核心原理"
company: "某公司"
position: "后端开发"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/950606870085902336
tags: ["Java","IO模型","NIO","Netty","Reactor","网络编程"]
summary: "Java 网络编程高频考点整理：BIO、NIO、AIO 的模型差异与适用场景，select、poll、epoll 的演进，Reactor 主从模式，Netty 的 EventLoop、Pipeline、ByteBuf 与零拷贝，以及粘包拆包和高性能的原因。"
---

### 《面试题目》

1. BIO、NIO、AIO 分别是什么？三者的线程模型有什么区别？
2. 同步阻塞、同步非阻塞、异步非阻塞的划分标准是什么？
3. NIO 的三个核心组件（Channel、Buffer、Selector）分别解决什么问题？
4. select、poll、epoll 的区别是什么？epoll 为什么高效？
5. epoll 的水平触发与边缘触发有什么区别？各自要注意什么？
6. 什么是 Reactor 模式？单 Reactor 单线程、单 Reactor 多线程、主从 Reactor 分别适合什么场景？
7. Netty 的线程模型是怎样的？BossGroup 与 WorkerGroup 分别负责什么？
8. Netty 的 Pipeline 与 Handler 是如何工作的？入站和出站事件有什么区别？
9. Netty 的 ByteBuf 与 JDK ByteBuffer 有什么区别？引用计数解决什么问题？
10. Netty 的零拷贝体现在哪些地方？
11. TCP 粘包和拆包是怎么产生的？Netty 有哪些解码器可以解决？
12. Netty 为什么比直接使用 JDK NIO 性能更好、更易用？
13. Netty 中一个连接的生命周期由哪个线程处理？如何保证同一个 Channel 的 Handler 不被并发执行？

### 《参考解析》

**三种 IO 模型的本质差异在「谁等数据」和「谁拷贝数据」。** BIO 是同步阻塞：线程发起 `read` 后一直阻塞到数据就绪并完成拷贝，一个连接一个线程，连接数一多线程就被耗尽。NIO 是同步非阻塞：Selector 负责告诉你有多少 Channel 就绪，线程只在就绪时去读写，一个线程可以管理大量连接，但读写本身仍是同步的、由应用线程完成。AIO 是异步非阻塞：应用发起读请求后立即返回，由内核完成数据读取与拷贝再回调通知，编程模型最省心，但 Linux 上成熟的异步 IO 支持有限，JDK 的 AIO 在 Linux 上底层仍依赖 epoll 模拟，实际使用远少于 NIO。判断标准是两问：发起调用后线程是否被挂起（阻塞与否），数据从内核到用户态的拷贝由谁完成（同步还是异步）。

**select、poll、epoll 的演进方向是「减少无谓的遍历与拷贝」。** select 用位图传 fd 集合，有 1024 上限，每次调用都要把集合从用户态拷到内核态，返回后还要线性扫描找出就绪的 fd。poll 用数组去掉了数量上限，但仍需全量拷贝与遍历。epoll 在内核里维护一棵红黑树保存关注的 fd，并用就绪链表记录已触发的事件，`epoll_wait` 只返回就绪的 fd，不需要每次传全量集合；fd 只在 `epoll_ctl` 时注册一次。所以连接数多、活跃连接比例低的场景，epoll 的优势最明显。LT（水平触发）只要缓冲区还有数据就会持续通知，写起来简单但可能重复处理；ET（边缘触发）只在状态变化时通知一次，必须一次把数据读干净（循环读到 `EAGAIN`），否则会丢事件。

**Reactor 模式解决的是「事件分发与业务处理的解耦」。** 单 Reactor 单线程：一个线程既做 accept 又做读写和业务，实现简单，适合连接少、业务轻的场景，任何阻塞都会拖垮全部连接。单 Reactor 多线程：Reactor 负责 IO 事件，业务丢给线程池，适合计算密集但连接不算多的场景。主从 Reactor：主 Reactor 只负责 accept，把新连接分配给多个从 Reactor，每个从 Reactor 管理一组连接的读写，业务再交给线程池——Netty 的主从模型就是这一种，`BossGroup` 对应主 Reactor，`WorkerGroup` 对应从 Reactor。

**Netty 的线程模型**：每个 `EventLoop` 绑定一个线程，内部维护一个任务队列和一个 Selector；一个 `Channel` 注册到一个 `EventLoop` 后，生命周期内的所有 IO 事件都由同一个线程处理，因此 Handler 天然是串行的，不需要额外加锁。`EventLoop` 除了处理 IO，还执行提交到它上面的普通任务与定时任务，所以 Handler 里做耗时操作会阻塞该线程上的所有连接，必须丢到业务线程池。`NioEventLoop` 的线程数默认是 CPU 核数乘二，`BossGroup` 通常一个线程就够。

**Pipeline 是责任链**：入站事件（读到的数据、连接建立、异常）从 head 向 tail 传播，出站事件（写、flush、关闭）从 tail 向 head 传播，`ChannelHandlerContext` 决定从当前节点的下一个节点继续传递。`ByteToMessageDecoder` 这类解码器属于入站，编码器属于出站；`SimpleChannelInboundHandler` 会自动释放消息，`ChannelInboundHandlerAdapter` 需要自己管引用计数。

**ByteBuf 相比 ByteBuffer 的改进**：读写指针分离（`readerIndex` / `writerIndex`），不需要 `flip()`；支持自动扩容；支持池化（`PooledByteBufAllocator`）减少分配与 GC；支持切片与复合缓冲区，可以把多个缓冲区逻辑上合成一个。引用计数（`retain` / `release`）是池化的前提，谁最后持有谁释放，漏释放会内存泄漏，重复释放会抛异常。

**零拷贝在 Netty 里有三层含义**：一是堆外内存（DirectByteBuf）避免堆内到堆外的复制；二是 `CompositeByteBuf` 把多个缓冲区组合起来，逻辑上连续、物理上不复制；三是 `FileRegion` 基于 `sendfile`，文件内容直接从内核页缓存送到网卡，不经过用户态。注意它和「减少上下文切换」不是一回事，面试时要区分 JDK NIO 的 `transferTo` 与 Netty 的组合缓冲区。

**粘包拆包**：TCP 是字节流，没有消息边界，发送方的多次写可能被合并成一个包到达，一次写也可能被拆成多段。解决方式有三种：固定长度、分隔符、长度字段。Netty 对应提供 `FixedLengthFrameDecoder`、`DelimiterBasedFrameDecoder`、`LengthFieldBasedFrameDecoder`，最常用的是最后一种，配置好长度字段偏移、长度字段长度、长度调整值与跳过字节数即可。

**Netty 更快的原因**要落到具体机制：主从 Reactor 与无锁串行化设计减少竞争；epoll 边缘触发 + 多路复用；池化的直接内存与 ByteBuf 减少分配和拷贝；可配置的 TCP 参数（`SO_BACKLOG`、`TCP_NODELAY`、`SO_KEEPALIVE`）；内置编解码、心跳、流量整形、优雅关闭等能力，省去大量重复实现。回答时避免只说「基于 NIO」，要指出它把 NIO 的复杂度封装掉了。

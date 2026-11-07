---
title: "后端面试题：BIO/NIO/AIO 三种 IO 模型与 Netty 核心原理"
company: "某公司"
position: "后端开发"
date: "2026-11"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/948776011942948864"
tags: ["BIO","NIO","AIO","IO多路复用","epoll","Netty","Reactor","零拷贝","粘包","后端"]
summary: "该帖标题指向 BIO、NIO、AIO 三种 IO 模型的区别与 Netty 的核心原理，正文为通用分享。本文按主题整理常见问法：同步异步与阻塞非阻塞的区分、NIO 的三大组件、select/poll/epoll 的差异与触发模式、Reactor 线程模型、Netty 的 EventLoop 与 ByteBuf、零拷贝、粘包拆包的解决方式以及内存泄漏排查。"
---

### 《面试题目》

1. BIO、NIO、AIO 三种 IO 模型的区别是什么？
2. 同步／异步与阻塞／非阻塞这两组概念怎么区分？
3. NIO 的三大组件（Channel、Buffer、Selector）各自的作用？
4. select、poll、epoll 的区别是什么？水平触发与边缘触发有何不同？
5. Reactor 模式有几种？主从 Reactor 解决了什么问题？
6. Netty 的线程模型是怎么组织的？EventLoop 与 Channel 的关系？
7. Netty 为什么快？零拷贝具体指什么？
8. Netty 的 ByteBuf 与 JDK 的 ByteBuffer 有什么区别？
9. TCP 粘包拆包是怎么产生的？Netty 有哪些解码器解决它？
10. Netty 使用中有哪些坑？内存泄漏怎么排查？

### 《参考解析》

**三种模型的分界在于「谁来等数据」和「谁来搬数据」。** BIO 是同步阻塞：一个连接一个线程，`read` 在数据没到时把线程挂住，连接数一多线程数就爆炸，靠线程池只能缓解不能根治。NIO 是同步非阻塞：线程不阻塞在单个连接上，而是通过选择器同时监听多个通道，谁就绪处理谁，一个线程可以服务成千上万个连接，代价是编程模型复杂（半包、读写事件、空轮询）。AIO 是异步非阻塞：发起 `read` 后立即返回，由操作系统在数据就绪并复制完成后回调，线程完全不参与等待。要补一句工程现实：Linux 上真正的异步 IO（io_uring）普及较晚，主流框架走的仍是 NIO 多路复用，「AIO 性能一定更好」并不成立。

**同步／异步看结果通知方式，阻塞／非阻塞看调用是否立即返回。** 同步是调用方自己检查或等待结果，异步是结果由回调、Future 或事件通知送达；阻塞是调用后线程被挂起，非阻塞是立即返回一个「还没好」的状态。两组正交，因此有「同步非阻塞」（NIO 轮询）这种组合。面试里最常见的错误是把 NIO 说成「异步」，它只是非阻塞。

**NIO 三大组件。** Channel 是双向的数据通道（区别于流的单向），Buffer 是数据的载体，读写都经过 Buffer，需要 `flip` 切换读写模式；Selector 是事件注册与就绪查询的中心，一个线程调 `select()` 阻塞等待，返回就绪的 SelectionKey 集合（可读、可写、可接受连接）。工作机制是：Channel 注册到 Selector 上并声明关心的事件，事件就绪后由 Selector 通知，线程再去处理对应的 Channel。

**select、poll、epoll 的差别在「每次调用要不要把关注集合搬进内核」以及「内核怎么找就绪的 fd」。** select 用位图，fd 数量受 FD_SETSIZE（通常 1024）限制，每次调用都要把整个集合从用户态拷到内核态，返回后还要线性扫描；poll 用数组去掉了数量上限，但拷贝与线性扫描仍在；epoll 用 `epoll_ctl` 把 fd 一次性注册进内核的红黑树，`epoll_wait` 只返回就绪链表，不需要重复拷贝与全量扫描，因此在高并发下 O(1) 获取就绪事件。水平触发（LT）只要缓冲区还有数据就会持续通知，编程简单；边缘触发（ET）只在状态变化时通知一次，必须一次读到 `EAGAIN`，配合非阻塞 fd 使用，否则会丢事件。Netty 在 Linux 上默认使用 epoll 的 LT。

**Reactor 的三种形态。** 单 Reactor 单线程：一个线程既做 accept 又做读写与业务，实现简单，任一环节阻塞都会拖垮全局。单 Reactor 多线程：IO 线程只负责读写，业务丢给线程池。主从 Reactor：主 Reactor 只处理 accept，把连接分给多个从 Reactor 处理读写，解决了「accept 与 IO 争抢同一线程」以及连接分配不均的问题，Netty 的主从 EventLoopGroup 就是这一形态。

**Netty 的线程模型。** `bossGroup` 负责 accept，`workerGroup` 负责已建立连接的读写，每个 `EventLoop` 绑定一个线程，内部维护一个任务队列，一个 Channel 从注册那一刻起就固定绑定到某个 EventLoop（因此单个 Channel 的所有事件天然串行、无锁）。`NioEventLoop` 的循环做三件事：`select` 等待就绪事件、处理 IO 事件、执行任务队列（包括用户提交的 `channel.write` 与定时任务）。耗时业务必须丢到独立的业务线程池，否则会阻塞该 EventLoop 上的所有 Channel。

**Netty 快的几个来源。** 一是 IO 多路复用 + 主从 Reactor，连接数与线程数解耦；二是无锁串行化设计，单个 Channel 的事件在同一个 EventLoop 上顺序处理，避免同步开销；三是 ByteBuf 的读写双指针，读不需要 `flip`，配合池化（PooledByteBufAllocator）减少分配与 GC；四是零拷贝，包括堆外直接内存（少一次用户态拷贝）、`CompositeByteBuf` 把多个缓冲区逻辑合并而不再拷贝、`FileRegion` 用 `transferTo` 走内核态直接发送文件、以及 `slice`／`duplicate` 共享底层内存。回答时要把「零拷贝」拆成这几种具体机制，只说「用了零拷贝」会被追问。

**ByteBuf 与 ByteBuffer 的差别。** JDK 的 ByteBuffer 只有一个 position，读写模式切换要 `flip()`，容易出错；容量固定，扩容要自己新建再拷贝。ByteBuf 用 `readerIndex` 与 `writerIndex` 分离读写位置，容量可动态扩展，支持池化与引用计数，还能按需选择堆内或堆外内存。

**粘包拆包的本质是 TCP 是字节流、没有消息边界。** 应用层的三次短写可能被合并成一次读，一次长写也可能被拆成多次读，与 TCP 的 Nagle 算法、MSS、接收窗口都有关。解决办法是让接收方能自己划出边界：定长（`FixedLengthFrameDecoder`）、分隔符（`DelimiterBasedFrameDecoder`）、长度字段（`LengthFieldBasedFrameDecoder`，最常用，要指定长度字段的偏移与字节数、长度是否含头、跳过的字节数）。HTTP、Dubbo、自定义协议都是「长度 + 消息体」这一类的变体。

**常见坑与内存泄漏排查。** 坑包括：在 ChannelHandler 里做阻塞操作（数据库查询、同步 HTTP）；忘记释放 `ByteBuf` 或用 `SimpleChannelInboundHandler` 与 `ChannelInboundHandlerAdapter` 混淆导致重复释放；`writeAndFlush` 在非 EventLoop 线程调用时的线程安全与顺序；`LengthFieldBasedFrameDecoder` 的 `maxFrameLength` 设得过大导致内存被打爆；以及心跳与空闲检测缺失导致连接被中间设备静默断开。排查内存泄漏用 Netty 的 `ResourceLeakDetector` 把级别调到 `PARANOID`，看泄漏的 `ByteBuf` 分配栈；线上用堆外内存监控与 `-Dio.netty.leakDetection.level`。

**一个容易被追问的边界：** NIO 的 `select` 有空轮询问题（内核 bug 导致没有事件也返回），Netty 通过在空轮询次数超过阈值（默认 512）时重建 Selector 来规避。能说出这个细节，通常说明读过源码而不是只背概念。

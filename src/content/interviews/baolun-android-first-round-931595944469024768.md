---
title: "保伦电子安卓开发一面：音视频流与多线程八股"
company: "保伦电子"
position: "安卓开发"
round: 一面
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/931595944469024768
tags: ["Android","音视频","H264","OkHttp","多线程"]
summary: "保伦电子（音视频方向）安卓开发一面记录，技术问题集中在音视频与通信基础：H264 的 I 帧识别、B/P 帧区别、PCM 转 MP3 的实现、多线程同步、OkHttp 相比普通 HTTP 的优势，最后聊到 2 年经验 15k 的薪资预期。"
---

### 《面试题目》

1. 通信方面做了什么工作，有没有涉及到音视频流传输或者显示？
2. H264 流如何知道这一帧是 I 帧？
3. B 帧和 P 帧有什么区别？
4. PCM 转 MP3 你是怎么实现的？
5. 说说你对多线程同步的理解。
6. 用过 OkHttp 吗？比普通 HTTP 好在哪里？
7. 介绍一下你做的项目。
8. 自我介绍。
9. 为什么选择安卓开发？
10. 上一份工作的离职原因？
11. 反问。

### 《参考解析》

**判断 H264 的 I 帧：看 NAL 类型，不要猜**
H264 码流由 NAL 单元组成，每个单元前面是起始码（`00 00 01` 或 `00 00 00 01`），紧随的第一个字节是 NAL Header：`forbidden_zero_bit(1) + nal_ref_idc(2) + nal_unit_type(5)`，所以 `nal_type = byte & 0x1F`。类型 5 是 IDR 帧，解码器从这里可以独立解出图像，是真正可随机接入的关键帧；类型 1 是普通 slice（其中也可能是 I slice，但不能作为随机接入点）；类型 7/8 是 SPS/PPS，收流时要先缓存它们。实战里两点要注意：① MP4/MKV 这类封装走的是长度前缀（AVCC），没有起始码，要先转换格式；② 在 Android 上更省事的判断是 `MediaExtractor` 的 sample flags 或 `MediaCodec.BUFFER_FLAG_KEY_FRAME`，而不是自己去解析裸流。

**B 帧与 P 帧的区别**
P 帧只做前向预测，参考已解码的前面的帧；B 帧做双向预测，可以同时参考前向和后向的帧，压缩率最高，同样画质下码率最小。代价是解码顺序和显示顺序不一致：B 帧必须等它后面的参考帧先解出来，因此需要重排序缓存，PTS（显示时间戳）与 DTS（解码时间戳）分开，播放器要按 PTS 重排输出。另外 B 帧通常 `nal_ref_idc == 0`，不作为其他帧的参考。延迟敏感的场景（视频会议、直播、远程控制）一般把 `bframes` 设为 0，用一点码率换端到端延迟——这正是音视频岗最想听到的取舍。

**PCM 转 MP3 的实现要点**
Android 上有两条路：① 系统 `MediaCodec` 的 `audio/mpeg` 编码器（部分机型只提供 MP3 解码器，需要先用 `MediaCodecList` 查询是否支持编码）；② JNI 里集成 LAME 或 ffmpeg 交叉编译产物。两条路的流程一致：拿到 PCM 裸流（`ENCODING_PCM_16BIT`、44.1kHz、单/双声道）→ 按编码器输入缓冲区大小**按帧对齐**切片（MP3 是 1152 个样本/帧/声道，不要按 4096 字节随意切）→ `queueInputBuffer` 时带上正确 PTS → 输入结束后发一个 `BUFFER_FLAG_END_OF_STREAM`，并把编码器残留的输出全部 `dequeueOutputBuffer` 出来。常见坑：采样率或声道数与编码器配置不符会直接抛异常；不做 EOS 会丢掉最后一帧；MP3 每帧自带帧头，拼接时不要额外加字节。

**多线程同步的理解**
按层次回答：原子性（`volatile` 只保证可见性和禁止重排，不保证 `i++` 原子）、互斥（`synchronized`、`ReentrantLock`，后者支持可中断、超时、公平锁与多个 `Condition`）、无锁（`AtomicInteger` 的 CAS、`LongAdder` 分段累加）、并发容器（`ConcurrentHashMap`、`CopyOnWriteArrayList`）、线程协作（`wait/notify`、`CountDownLatch`、`CyclicBarrier`、`Semaphore`）。工程经验比背 API 值钱：锁粒度要小（锁里不做 IO、不发网络请求）、能说清死锁的四个必要条件以及用 `jstack` 查 `deadlock` 段落、Android 主线程不能阻塞所以要用 `Handler` 或协程切线程。面试官问的是「理解」，所以最后一定要落到自己项目里用过哪一把锁、解决的是什么竞态。

**OkHttp 相比 HttpURLConnection 的优势**
① 连接池复用 TCP，省掉重复的三次握手和 TLS 握手，HTTP/2 下还能在同一连接上多路复用并发请求；② 拦截器链把重试、缓存、日志、鉴权、压缩做成可插拔的责任链，扩展和排查都方便；③ 透明 GZIP、响应缓存（`Cache` + `Cache-Control` 语义）、WebSocket 都是一等公民；④ 超时与重试细粒度可控（`connectTimeout` / `readTimeout` / `writeTimeout` / `retryOnConnectionFailure`）；⑤ DNS、代理、TLS 都有扩展点（`CertificatePinner` 可做证书锁定）。补一句加分项：`Dispatcher` 默认 `maxRequests=64`、`maxRequestsPerHost=5`，高并发场景下请求是排队而不是失败，需要自己调或换 `Dispatcher`。

**面试背景与薪资**
面试官所在团队做音视频，规模不算小但非大厂，作息 5.5 天、每月两次四小时带薪假，相当于大小周（周六上半天）。作者要 15k，面试官认为 2 年经验 15k 偏高，估计最高给到 14k。技术问题问得不多，整体偏「经历核对 + 音视频基础」，准备这类面试时把简历里写过的音视频链路（采集 → 编码 → 传输 → 解码 → 渲染）自己完整讲一遍比刷八股更有效。

---
title: "金舟软件安卓开发一面：性能优化与 FFmpeg 实践"
company: "金舟软件"
position: "安卓开发"
round: 一面
date: '2026-09'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/931974289211785216
tags: ["安卓开发","性能优化","FFmpeg","音视频","多渠道打包","面试经验"]
summary: "金舟软件（惠州，工具类 App）安卓开发一面记录：技术问题集中在性能优化（内存泄漏、内存抖动、包体积、多渠道打包）、C++ 使用场景与 framework 了解程度，以及 PCM 转 MP3 链路、FFmpeg 集成与版本、多线程下载 TS、YUV420P 区别、检测更新与 AI 工具使用。"
---

### 《面试题目》

1. 自我介绍
2. 你是哪里人？
3. 未来的职业规划是什么？
4. 离职原因是什么？
5. 性能优化都做了哪些？为什么要做、背景是什么？（作者讲了内存泄漏、内存抖动、包体积优化、多渠道打包优化）
6. 多渠道打包优化是为什么想到这么做的？是公司内部已有的技术，还是你自己想的？
7. C++ 在哪些地方使用了？
8. 你觉得 C++ 在哪些方面对你的工作有帮助？
9. 了解过 framework 的哪些东西？
10. PCM 转 MP3 的整个链路是怎么样的？
11. 项目中 FFmpeg 是怎么用的？在哪些地方使用？
12. 下载流程有做多线程下载 TS 吗？流程是怎么样的？
13. 后续换成开源库的原因是什么？解决了什么需求？
14. 有编译过 FFmpeg 或安卓系统源码吗？你们项目的 FFmpeg 是什么版本？
15. Firebase 后台看过埋点数据吗？感觉怎么样？
16. 谷歌后台一般你会在什么时候使用、用来干什么？
17. Firebase 埋点数据上报效果怎么样？实际使用的情况如何？
18. 项目里怎么做检测更新的？
19. YUV420 和 YUV420P 的区别是什么？
20. 平时工作中 AI 使用的情况怎么样？有用过什么 skill、提示词之类吗？

### 《参考解析》

**性能优化要讲成"背景—动作—收益"**：面试官问"为什么要做"，就是要你给量化收益，别只报技术名词。内存泄漏：用 LeakCanary 抓引用链、MAT 看支配树，常见根因是静态单例持有 Activity、Handler 非静态内部类、未注销的监听器与 WebView，修完看崩溃率与 OOM 率变化。内存抖动：循环里 new 对象、字符串拼接、频繁装箱、`onDraw` 里分配，解法是对象池、复用 `StringBuilder`、`onDraw` 零分配，指标看 GC 次数与卡顿帧。包体积：R8/ProGuard 混淆裁剪、`shrinkResources`、资源混淆（AndResGuard）、so 只留 `arm64-v8a` 或做 so 裁剪、图片换 WebP、Lint 扫未用资源，指标是 APK 下载转化率。多渠道打包：早期 `productFlavors` 每个渠道重新签名打包太慢，改用 Walle 之类的"往 APK 的 ZIP 注释块写渠道信息 + 运行时读取"，几百个渠道从几十分钟压到几分钟。作者特别提到要能答出"这是我自己想的还是公司已有技术"，如实说，并讲清调研与落地过程。

**PCM 转 MP3 的完整链路**：`AudioRecord` 按 16bit/单声道/44.1kHz 采集 PCM（注意 `AudioRecord` 的 buffer 要按 `minBufferSize` 的 2~4 倍申请，避免 underrun）→ 预处理（音量归一化、混音、重采样，采样率不一致时用 `libswresample` 的 `SwrContext` 或 `MediaCodec` 做 48k→44.1k）→ 编码：Android 系统没有 MP3 编码器（`MediaCodec` 只有解码器和 AAC 编码），所以要走 `libmp3lame` 或 FFmpeg 的 `AV_CODEC_ID_MP3`，编码器 frame size 是 1152 个采样点，按 PTS 顺序 `avcodec_send_frame` / `avcodec_receive_packet` 取包 → 封装进 MP3（`avformat` 写头与 ID3）→ 落盘与分享。踩坑点：录音与编码放不同线程并用环形缓冲解耦、`AudioRecord` 采样率不保证被设备支持要先查 `getSupportedSampleRates`、退出时正确 flush 让编码器吐出最后一帧。

**FFmpeg 集成与换库的取舍**：集成一般是自己用 NDK 编译 so（`--enable-libmp3lame`、`--disable-programs`、`--disable-doc`、按 `arm64-v8a`/`armeabi-v7a`/`x86_64` 出包、`target=android-21`），再写 JNI 薄封装暴露"转码/裁剪/合流"几个能力。有编译经验要能说清 configure 参数含义、so 体积控制（去掉不用的 codec 能砍掉一半以上体积）、以及高版本 Android 对 16KB page size 与 `extractNativeLibs` 的要求。换开源库的理由通常是：自维护 FFmpeg 的编译与升级成本高、so 体积太大、只用一两个能力（比如单纯 PCM→MP3）不值得背整个 FFmpeg、或者许可证与专利问题，换成轻量的专用库后包体积和维护成本都下降。回答时讲清"换之前它解决了什么需求、换之后少了什么能力"最有说服力。

**YUV420 与 YUV420P**：420 表示色度做了 2×2 下采样，每 4 个 Y 共用一组 U、V，一个像素平均 1.5 字节。YUV420P 是 planar（平面）格式，Y、U、V 三个分量分别存在三块连续内存里；YUV420SP 是 semi-planar，Y 一块、UV 交错一块，Android Camera 默认输出的 NV21 就是 `YYYY...VUVU...`（NV12 是 `UVUV`）。区别直接影响拷贝与转换：planar 要处理三个 plane 的 stride，semi-planar 只要处理两块；`MediaCodec` 的 color format 常给 `COLOR_FormatYUV420Flexible`，需要按 plane 取 stride 和 offset，写错就花屏或发绿。面试常追问 stride 与宽度的区别（对齐到 16/64 后 stride 可能大于 width）以及 CameraX/ImageReader 的转换方式。

**检测更新怎么做**：客户端带版本号与渠道请求版本接口 → 服务端返回最新版本、下载地址、更新说明、是否强制 → 客户端按"强制/推荐/忽略"三态提示（强制更新要拦在启动前）→ 下载（支持断点续传，必要时上 bsdiff 增量包）→ 校验（MD5/SHA256 + APK 签名一致）→ 安装（Android 8.0 以上要申请 `REQUEST_INSTALL_PACKAGES`，并用 FileProvider 传 URI）。可以说清灰度发布、按渠道/机型分批、以及更新失败的回滚与埋点。

**AI 工具与提示词怎么答**：这类问题想看你是不是真的把 AI 用进了工作流。可以讲场景分层——生成样板代码与单测、读陌生代码库时让它先解释调用链、把崩溃堆栈丢进去定位、写脚本/正则/SQL、翻译与整理文档；再说你的验证方式（生成的代码逐行读、跑单测、对比文档）。如果用过具体工具或 skill，讲清"哪个场景用哪个、效果差异在哪"，比报一堆名字好。

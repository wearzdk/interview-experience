---
title: "东莞拓久柘安卓系统开发一面：点击事件全链路、开机流程与 NFC 模块对接"
company: "拓久柘电子科技"
position: "Android 系统开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/944628400897933312
tags: ["拓久柘", "Android", "系统开发", "Framework", "点击事件", "开机流程", "NFC", "驱动移植"]
summary: "HR 主动联系的安卓岗，以为是应用开发兼一点 framework，结果主要是系统开发、framework、调试与驱动移植、对接设备：问点击屏幕某个位置到屏幕开始响应事件的整个过程（硬件到响应，响应之后不管）、手机从关机到启动的流程、从 ImageView 设置 Bitmap 到显示到屏幕的流程、DecorView 算哪一层及为什么、从浏览器输入域名到显示网页的流程、为什么都是 HTTPS 有些网站显示不安全、给一块安卓开发板如何对接 NFC 模块，以及后端技术（Spring Boot / Go / Nginx / Docker / K8s）与 AI 使用情况。"
---

### 《面试题目》

1. 自我介绍。
2. 点击屏幕上某个位置到屏幕开始响应事件，整个过程是怎样的（从硬件到开始响应，响应后的逻辑不用讲）？
3. 手机从关机状态到启动的流程是什么？
4. 从 ImageView 设置 Bitmap 到显示到屏幕上，流程是怎样的？
5. DecorView 算哪一层，为什么？
6. 从浏览器输入域名到显示网页的流程是什么？
7. 为什么都是 HTTPS，有些网站会显示不安全？
8. 给你一块安卓开发板，如何对接 NFC 模块？
9. 对后端技术了解吗？比如 Spring Boot、Go、Nginx、Docker、K8s。
10. 你的 AI 使用情况如何？

### 《参考解析》

**点击事件从硬件到响应是一条完整的输入链路**：触摸屏（电容屏的 TX/RX 电极检测电容变化）→ 触摸控制器（Touch IC）采样并做去抖、坐标换算 → 通过 I²C/SPI 上报中断 → 内核里的 input 子系统（驱动注册 `input_dev`、上报 `ABS_MT_POSITION_X/Y` 与 `BTN_TOUCH` 事件）→ evdev 节点 → Android 的 `InputReader`（EventHub 用 epoll 监听 `/dev/input`）→ `InputDispatcher` 做窗口命中测试（找到目标 window，检查触摸区域与权限）→ 通过 socket 把事件投递给应用进程的 `ViewRootImpl` → 主线程的 `InputEventReceiver` 分发到 `View.dispatchTouchEvent` → `onTouchEvent` 开始响应。答这条链时把「谁把事件变成窗口坐标」「跨进程怎么投递」说清就够，不必展开业务逻辑。

**开机流程**：上电 → BootROM（固化在芯片里，校验并加载 bootloader）→ bootloader（解锁、加载 kernel 与 dtb）→ kernel 启动（初始化驱动、挂载根文件系统）→ init 进程（解析 `init.rc`，启动 servicemanager、zygote、surfaceflinger 等）→ zygote fork 出 system_server（启动 AMS/PMS/WMS 等系统服务）→ 启动 Launcher，桌面可用。

**ImageView 到屏幕**：`setImageBitmap` 只更新 View 的属性并 `invalidate()` → 下一帧 vsync 到来时 `ViewRootImpl.performTraversals` 依次 measure / layout / draw → 生成 DisplayList（RenderNode 记录绘制命令）→ RenderThread 把 DisplayList 提交给 SurfaceFlinger → SurfaceFlinger 合成所有 layer（HWC 或 GPU）→ 送显到屏幕。DecorView 是「窗口视图树的根」，位于 `PhoneWindow` 内、承载状态栏与内容区的窗口装饰，属于应用窗口这一层（WindowManager 管理的 View 层级，不是系统服务层），它挂到 `WindowManagerService` 创建的 Surface 上。

**HTTPS 却「不安全」**：最常见是证书不受信任——自签名、证书链不完整（缺中间证书）、域名与证书 SAN 不匹配、证书过期；第二种是页面里混入了 HTTP 资源（混合内容）被浏览器标记；第三种是用了被浏览器淘汰的算法（SHA-1、TLS 1.0/1.1）或证书被吊销 / 中间人（企业代理装了自己的根证书）。排查就点地址栏的锁看证书详情与「不安全」的具体原因。

**给开发板对接 NFC 模块**：先确认模块接口（I²C/SPI/UART）与电源、时钟、中断、复位脚 → 硬件上核对电平与上拉 → 内核侧写 / 移植驱动（注册字符设备或 input 设备、处理中断读数据）→ 上层按 Android 的 NFC HAL 约定（HIDL/AIDL 接口、`libnfc-nci` 的 HAL 实现）把它接进框架 → 用 `nfc` 相关系统服务与测试 App 验证卡片读写。回答时强调「先定协议与电气连接，再定内核驱动形态，最后对 HAL 接口」这三步，比只讲「写个驱动」完整得多。

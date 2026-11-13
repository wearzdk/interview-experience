---
title: "正运动技术 工控 C++ 二面：交叉编译、glibc 兼容与两道手写题"
company: 正运动技术
position: 工控软件开发（C++）
round: 二面
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/495c0478b41947c7b0fe4b79e8fc0bfb
tags: ["正运动技术","工控软件开发","交叉编译","glibc","Qt","扫描线算法","多线程"]
summary: "正运动技术工控 C++ 软件二面共 90 分钟，60 分钟问答覆盖跨平台同一套代码、x86_64 交叉编译到 ARM64、目标板 glibc 版本偏低且不能改源码时的部署方案、运行三天后崩溃与 UI 卡死但进程存活，另有 30 分钟两道现场手写题：不规则多边形按 0.1mm 间距填充，以及定时器读控制器数据导致 UI 卡顿的重设计。"
---

### 《面试题目》

**项目与跨平台**

1. 项目有没有做跨平台？
2. 程序部署在哪些平台上？
3. 跨平台是同一套代码吗？
4. x86_64 上做交叉编译、部署到 ARM64 平台，具体怎么做？
5. 开发机是 glibc 2.39，目标板是 glibc 2.32，Qt 程序不能改源码，如何部署？

**崩溃与稳定性**

6. 线上交付的程序崩溃，你怎么处理？
7. ARM 板子连续运行三天之后崩溃，分析可能的原因？
8. 程序跑三天 UI 卡死，但进程没有崩溃，是什么情况？
9. 有没有分析过 Windows 下的 DMP 崩溃转储文件？

**工具与协作**

10. 开发过程中 AI 工具用到什么程度？
11. 开发遇到 bug 一般怎么排查？
12. AI 生成单个函数实现，除人工 Review 外，如何降低错误率？

**现场手写题（30 分钟）**

13. 给定一个不规则多边形，按水平线间距 0.1mm 填充，设计算法输出所有线段的起止点。
14. 主线程定时器读取控制器数据造成 UI 卡顿，请重新设计方案，并增加消息优先级。

**反问**

15. 岗位主要做哪些业务？
16. 应届生需要重点补强哪些能力？

### 《参考解析》

**x86_64 交叉编译到 ARM64**：核心是「工具链加 sysroot」两件事。工具链用 `aarch64-linux-gnu-*`，或使用与目标板系统一致的工具链；sysroot 必须来自目标板的系统镜像（把 `/usr/include`、`/usr/lib`、`/lib` 拷出来），否则头文件与库的版本会和板上不一致，出现链接成功但运行时报符号缺失。构建系统通过 CMake 的 toolchain file 或 qmake 的 `QMAKE_CC`、`QMAKE_CXX`、`QMAKE_SYSROOT` 指定交叉前缀与 sysroot，Qt 本身也要有对应的 ARM64 版本，或使用板上自带的 Qt 开发包。链接时用 `-Wl,-rpath-link` 指向 sysroot 的库目录，最后 `strip` 减小体积。验证方式是 `file` 确认架构、`readelf -d` 看依赖与 RPATH，再到板上用 `ldd` 跑一遍。

**glibc 不兼容且不能改源码时的部署**：先确认问题性质，用 `objdump -T` 或 `readelf -V` 看程序要求的最高 GLIBC 符号版本，报错形如 `version 'GLIBC_2.34' not found` 说明构建环境的 glibc 比目标板新。可行的做法按推荐度排列：其一，在与目标板同版本的系统镜像或容器里重新构建，交叉编译时严格使用目标板 sysroot，这是唯一干净的方案；其二，把程序依赖的非系统库（Qt、第三方库）随包分发并用 RPATH 指定，若只是 Qt 版本不一致，这一条即可解决；其三，用 AppImage 或容器把运行环境整体打包；其四，静态链接，但 glibc 静态链接在 `dlopen`、NSS、locale 上有已知问题，改用 musl 更稳。直接把新版的 `libc.so.6` 拷到板上不可取，动态加载器 `ld-linux-aarch64.so.1` 必须与 libc 严格配套，且会影响板上其他程序。

**运行三天后崩溃与 UI 卡死**：长稳故障的共性是「缓慢累积，最后越过阈值」。崩溃一侧常见原因有内存或句柄缓慢泄漏（连接未关闭、缓存无上限、对象只增不减）、日志文件写满磁盘、定时器与线程越建越多、以毫秒计时的 32 位计数器溢出（约 24.8 天，若单位更细则更早）、内存碎片导致大块分配失败、以及温度升高后的硬件或降频异常。UI 卡死而进程存活则是另一类：主线程死锁或长时间等锁、主线程被同步 IO 或重计算占住、跨线程直接操作界面导致事件循环重入、模态对话框嵌套事件循环、`paintEvent` 里出现死循环、事件队列被高频信号塞满。诊断手段是 gdb 或 pstack attach 看主线程调用栈，持续采样进程的 RSS、fd 数、线程数与事件处理耗时，用 `heaptrack`、`valgrind --leak-check` 复查分配。工程上应把 72 小时长稳测试纳入交付流程，并为界面加主线程心跳检测。

**不规则多边形按 0.1mm 水平线填充**：这是扫描线填充。把多边形拆成边表，对每条扫描线求与各边的交点，排序后按奇偶规则两两配对，得到线段起止点。两个细节决定正确性：水平边不参与求交；顶点处用半开区间 `y ∈ [y_min, y_max)` 判定，避免同一条扫描线在顶点被计两次。扫描线取 `y_min + step/2` 起步，可避开扫描线正好落在顶点上的退化情况。

```c
typedef struct { double x1, y1, x2, y2; } edge_t;
typedef struct { double y, x1, x2; } seg_t;

static int fill_polygon(const edge_t *e, int n, double y0, double y1,
                        double step, seg_t *out, int max_out)
{
    int cnt = 0;
    double xs[256];                      /* 单条扫描线的交点数上限 */
    for (double y = y0 + step * 0.5; y < y1; y += step) {
        int k = 0;
        for (int i = 0; i < n; ++i) {
            double ya = e[i].y1, yb = e[i].y2;
            if (ya == yb) continue;                  /* 水平边跳过 */
            if (ya > yb) { double t = ya; ya = yb; yb = t; }
            if (y < ya || y >= yb) continue;         /* 半开区间，顶点只计一次 */
            double t = (y - e[i].y1) / (e[i].y2 - e[i].y1);
            xs[k++] = e[i].x1 + t * (e[i].x2 - e[i].x1);
        }
        for (int i = 1; i < k; ++i) {                /* 交点数少，插入排序足够 */
            double v = xs[i];
            int j = i - 1;
            while (j >= 0 && xs[j] > v) { xs[j + 1] = xs[j]; --j; }
            xs[j + 1] = v;
        }
        for (int i = 0; i + 1 < k; i += 2) {
            if (cnt >= max_out) return cnt;
            out[cnt].y  = y;
            out[cnt].x1 = xs[i];
            out[cnt].x2 = xs[i + 1];
            ++cnt;
        }
    }
    return cnt;
}
```

复杂度为 O(R·E + R·K log K)，R 为扫描线条数、E 为边数、K 为单条扫描线的交点数；用活性边表按 y 增量维护可将求交降到接近 O(R + K)。落到激光打标工艺还要处理三件事：线段端点按光斑半径做内缩或外扩补偿；同一扫描线上相邻且间隙小于光斑直径的线段合并，减少空走；扫描方向交替（蛇形）以缩短跳转距离。

**定时器读控制器导致的 UI 卡顿重设计**：症结在主线程同时承担界面刷新与阻塞式通信。改法是把轮询搬到工作线程，主线程只消费结果：工作线程按固定周期从控制器读数据，封装成带优先级与序号的消息放入队列；高优先级消息（报警、急停、状态跳变）立即投递，普通与低优先级消息按 16ms 合并后再投递，避免高频数据把事件队列塞满；跨线程用队列连接投递，界面只在数据真正变化时 `update()`，并对重绘做限频。

```cpp
enum class MsgPri { High, Normal, Low };

struct ControllerMsg {
    MsgPri   pri;
    quint64  seq;
    QByteArray payload;
};

class ControllerPoller : public QObject {
    Q_OBJECT
public:
    void start(int periodMs) {
        timer_ = new QTimer(this);
        timer_->setInterval(periodMs);
        connect(timer_, &QTimer::timeout, this, &ControllerPoller::pollOnce);
        timer_->start();
    }
signals:
    void dataReady(const ControllerMsg &msg);
private slots:
    void pollOnce();                 /* 在工作线程中执行，阻塞读不影响界面 */
private:
    QTimer *timer_ = nullptr;
};

/* 主线程侧：队列连接，天然跨线程 */
connect(poller, &ControllerPoller::dataReady, this,
        &Widget::onControllerData, Qt::QueuedConnection);
```

配套约束：工作线程不得触碰任何 QWidget，界面更新一律回主线程；消息队列设上限，拥塞时丢弃过期的低优先级数据而不是无限堆积；读取失败与超时要转成报警消息，不能静默重试。

**降低 AI 生成代码的错误率**：人工 Review 之外可以做四层。一是约束输入，把接口签名、数据结构、错误码约定与调用示例一起给模型，要求只改指定函数、不改公共接口。二是机器校验，编译告警全开（`-Wall -Wextra -Werror`）、静态分析（clang-tidy、cppcheck）、类型与边界检查工具一起跑，把不通过的直接打回。三是测试先行，为函数补边界用例（空输入、极值、并发、失败路径）并用覆盖率确认分支被执行。四是限定生成范围，复杂算法与并发逻辑不让模型整段生成，改为生成测试用例或重构建议，由人写核心实现。

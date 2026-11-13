---
title: "正运动技术 嵌入式软件笔试：三轴机械臂打胶系统的设计、模块划分与接口"
company: 正运动技术
position: 嵌入式软件开发
round: 笔试
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/fccfd0716e5c41c699512d608049dfa6
tags: ["正运动技术","嵌入式软件开发","运动控制","插补算法","系统设计","C++"]
summary: "正运动技术的笔试采用腾讯会议真人监考、共享屏幕在文档中作答，题目是一道三轴机械臂打胶的工程题，共五个小问，要求给出系统设计思路、模块划分、模块接口与其中一个模块的具体代码，编程部分可切到本地编译器写完后粘贴回文档。"
---

### 《面试题目》

题目：设计一套三轴机械臂打胶系统，共五个小问。

1. 写出系统的整体设计思路。
2. 写出系统包含的各个模块。
3. 写出各个模块的代码接口。
4. 写出其中某个模块的具体代码。
5. 写出其中某个模块的单独设计思路。

### 《参考解析》

**整体设计思路**：按「人机层、工艺层、运动控制层、驱动与 IO 层」四层划分，数据自上而下单向流动，状态自下而上反馈。人机层负责配方编辑、轨迹示教、参数下发与报警展示；工艺层把打胶工艺翻译成运动段序列，决定每段的开关胶时机、速度与拐角处理；运动控制层做插补与速度规划，按固定控制周期输出各轴位置增量；驱动与 IO 层把位置增量下发到伺服或步进驱动器，并按周期采样限位、急停、胶压与流量信号。核心约束有三条：控制周期必须固定（常见 1 ms），插补计算量要能在一个周期内算完；胶枪开关与运动必须同步，否则起点堆胶、终点拖尾；任何异常都要在最近的一个周期内进入安全状态，因此急停走硬件回路，软件只做状态记录与复位流程。

**模块划分**：轨迹解析与插补（直线、圆弧、点位）、速度规划（梯形或 S 形，含拐角降速与前瞻）、工艺控制（开关胶延时、胶量随速度联动）、IO 与信号采样（限位、急停、气压、流量）、状态机与报警、通信（与上位机的配方下发，与驱动器的总线通信）、日志与配方存储。模块之间只通过结构化的段描述与状态查询交互，不要让插补模块直接读写 IO，否则工艺变更会牵动运动代码。

**接口定义示例**：

```c
typedef enum { MC_IDLE, MC_HOMING, MC_READY, MC_RUNNING, MC_PAUSED, MC_FAULT } mc_state_t;

typedef struct {
    double start[3];      /* mm */
    double end[3];        /* mm */
    double feed;          /* mm/s */
    double accel;         /* mm/s^2 */
    int    glue;          /* 0 关胶，1 开胶 */
} mc_segment_t;

typedef struct {
    mc_state_t state;
    double     pos[3];
    double     vel[3];
} mc_status_t;

int  mc_init(void);
int  mc_home(void);
int  mc_submit(const mc_segment_t *seg, int count);   /* 入队，非阻塞 */
int  mc_start(void);
int  mc_pause(void);
int  mc_stop(void);                                    /* 平滑停止 */
int  mc_estop(void);                                   /* 立即停止并断胶 */
int  mc_get_status(mc_status_t *out);
int  glue_set(int on);
int  io_read(int channel);
```

接口设计要点：提交与执行分离，`mc_submit` 只做参数校验与入队，执行由控制周期中断驱动；查询接口返回快照而不是内部指针；所有返回 int 的函数用错误码而不是布尔值，便于上层区分参数越界、队列已满与硬件故障。

**直线插补与速度规划的实现**：以固定周期推进，先由位移与加减速能力算出加速段时长、匀速段时长与峰值速度，再在周期中断里按时间取速度，累加得到位置。

```c
static double ramp_vel(double t, double ta, double tc, double vp, double a)
{
    if (t < ta)          return a * t;                 /* 加速段 */
    if (t < ta + tc)     return vp;                    /* 匀速段 */
    double v = vp - a * (t - ta - tc);                 /* 减速段 */
    return v > 0.0 ? v : 0.0;
}

int mc_run_line(const mc_segment_t *seg)
{
    double dir[3], len = 0.0;
    for (int i = 0; i < 3; ++i) {
        dir[i] = seg->end[i] - seg->start[i];
        len += dir[i] * dir[i];
    }
    len = sqrt(len);
    if (len < 1e-6) return 0;
    for (int i = 0; i < 3; ++i) dir[i] /= len;          /* 单位方向向量 */

    double ta = seg->feed / seg->accel;                /* 达到进给速度所需时间 */
    double da = 0.5 * seg->accel * ta * ta;            /* 加速段位移 */
    double vp = seg->feed, tc;
    if (2.0 * da > len) {                              /* 三角形速度曲线 */
        vp = sqrt(seg->accel * len);
        ta = vp / seg->accel;
        tc = 0.0;
    } else {
        tc = (len - 2.0 * da) / vp;
    }
    double total = 2.0 * ta + tc;

    double s = 0.0;                                     /* 累计弧长 */
    for (double t = 0.0; t < total; t += MC_PERIOD) {    /* MC_PERIOD = 0.001 s */
        double v = ramp_vel(t + MC_PERIOD, ta, tc, vp, seg->accel);
        s += v * MC_PERIOD;
        if (s > len) s = len;
        for (int i = 0; i < 3; ++i)
            set_axis_target(i, seg->start[i] + dir[i] * s);
        wait_next_period();
        if (s >= len) break;
    }
    for (int i = 0; i < 3; ++i)                          /* 末周期对齐目标点，消除离散残差 */
        set_axis_target(i, seg->end[i]);
    return 0;
}
```

上例先按时间取速度，再对速度积分得到累计弧长，最后按单位方向分量下发各轴目标位置，周期内只做乘加，计算量固定。按周期离散步进会留下不到一个周期的残差，末周期直接把目标位置对齐即可消除。拐角处理不能每段都减到零，否则多段连续轨迹会走走停停，需要在预读队列里按相邻段夹角与向心加速度限制做前瞻降速。

**现场工程约束**：打胶工艺上，起点要提前开胶并留出稳定时间，终点要延时关胶以补偿胶路惯性，拐角处按夹角降速避免胶量堆积；速度与出胶量需联动，否则高速段胶线变细。安全上，限位与急停接入硬件回路，软件状态机只负责记录与复位；断胶、气压不足、流量异常要能在一个周期内停运动并报警。可维护性上，配方与参数外置为文件，日志按天滚动并记录每个运动段的起止时间与报警码，便于现场复盘。

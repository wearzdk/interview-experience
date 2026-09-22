---
title: "字节豆包团队客户端一面：88分钟硬核拷打"
company: 字节跳动（豆包）
position: 客户端开发（Android）
round: 一面
date: 2026-09
source: 牛客网
tags: ["Android","客户端","Activity生命周期","事件分发","内存泄漏","Agent工程化","算法"]
summary: "字节豆包团队客户端一面面经，9月22日、时长88分钟。两道编码题（带parent指针的二叉树最近公共祖先、含ab子序列的子序列数量取模），随后是业务链路、Skill深挖与Agent工程化追问，最后是Activity生命周期、内存泄漏等客户端基础。"
---

### 《面试题目》

1. 自我介绍；技术栈按 1-5 分排序；这些语言是实习里学的吗？学校计算机课程有哪些？已转正拿 offer 了吗？为什么还来面？
2. 编码题：二叉树两节点的最近公共祖先，节点带 parent 指针，要求空间 O(1)。
3. 编码题：计算包含 "ab" 子序列的子序列数量，结果取模。
4. 端到端链路串一遍；整个需求完全是你开发的吗？
5. 下发时机需要调吗？优先级控制和评控怎么处理？
6. 互斥/优先级逻辑是后端完全控制吗？哪部分后端做、哪部分客户端兜底？
7. AB 实验数据不错吧？曝光的口径是什么？弹出来就算曝光吗？
8. 这个 Skill 主要写了些什么？是对已有 MCP 和 Skill 的编排吗？
9. mock 数据在 Skill 里怎么体现、存在哪、跟着什么走？
10. 自动检测具体怎么实现？
11. 代码仓库是什么关系？workspace 本身是 git 仓库吗？
12. 研发交付 Agent 最终交付什么形态？用的 Codex 吗？单独仓库放七个 Skill 怎么管理？
13. 谁审核 Skill 该不该合入？几个人做的、怎么分工？
14. 怎么验证后才合入？完成率 90% 的分子分母是什么？省一到两人日怎么统计？
15. AI 没搞定、需要人纠偏的 case，人工调有更好办法吗？人做出来的效果为什么 AI 没实现？
16. 哪些阶段必须人工干预？给 AI 的资料前经过人工讨论吗？PRD 有歧义怎么办？
17. 迭代中怎么保证 Skill 不变差？有没有评测集？报告怎么对比新旧、哪个更好？
18. native 仓库现在怎么迭代？推广 workspace 的难点在哪里？
19. Activity 生命周期是什么？onPause 和 onStop 的区别？被遮挡、部分遮挡分别走什么？
20. A 启动 B 再退回 A，按时间顺序走哪些生命周期？
21. 事件分发：dispatchTouchEvent / onInterceptTouchEvent / onTouchEvent 的职责关系？requestDisallowInterceptTouchEvent 是干什么的？ACTION_CANCEL 什么时候出现？
22. 常见内存泄漏场景有哪些？
23. 项目里用过哪些设计模式？课程里没教过吧？
24. 为什么选做客户端？之前没做过这块。
25. 大模型新技术通过哪些渠道关注？开发者会议看哪些？看到新闻会实操吗？订阅了哪些家模型？自己做过哪些小工具？

### 《参考解析》

**带 parent 指针的 LCA，空间 O(1)**：有 parent 指针就等价于「两条链表求交点」，而且要求 O(1) 空间就不能用哈希集合。经典做法是「先对齐深度，再同步上移」：从两个节点分别沿 parent 向上走到根，得到深度 `d1`、`d2`（这一步 O(1) 空间，只存两个整数）；让较深的那个先向上走 `|d1 - d2|` 步，然后两个指针同时向上，第一次相遇的节点就是 LCA。时间 `O(h)`，空间 `O(1)`。写的时候注意：一个节点是另一个的祖先时循环会自然返回它；入参要处理 `null`；如果连深度都不想算两遍，也可以用「双指针走完全程」的思路（各自走完自己那一段后跳到对方起点），但带 parent 的链表式走法直接对齐深度最直观。追问「如果没有 parent 指针」就要用递归后序遍历（`O(h)` 栈空间）或迭代 + parent map（`O(n)` 空间）。

**统计包含 "ab" 子序列的子序列数量（取模）**：这是「按子序列自动机做 DP 计数」的模板题。「子序列」不要求连续，所以每个字符有选/不选两种可能。设状态机为「还没匹配到 a」→「已匹配 a」→「已匹配 ab」，遍历字符串时维护两个计数：`cntA` = 目前形成的、以 `a` 结尾的「含 a 子序列」数量；`cntAB` = 已经形成「含 ab 子序列」的子序列数量。转移规则是——遇到 `'a'`：它可以单独开启一段新的（`cntA += 1`），也可以接在已有的 a 序列后面（`cntA += cntA`），统一写成 `cntA = cntA * 2 + 1`；遇到 `'b'`：它可以接在所有 `cntA` 后面形成新的 ab（`cntAB += cntA`），同时已有的 ab 序列保持（`cntAB = cntAB * 2 + cntA`）——注意这里 `cntA` 用的是本轮的旧值，且 `'b'` 不能开启 a，所以 `cntA` 不变；遇到其他字符：选或不选都不影响状态，`cntA *= 2`、`cntAB *= 2`（若题目只统计「包含 ab 作为子序列」的串长固定的情况，需按题意调整是否给不相关字符计数）。全程对 `1e9+7` 取模。核心要点有三个：一是「每个字符选或不选」导致的 `×2` 是这类题的通用骨架；二是状态转移必须严格按自动机顺序，遇到 `b` 时不能反向更新 `cntA`；三是取模要在每步做，避免溢出（Java 用 long 中间量）。如果面试官改成「包含 `abc` 子序列」或「长度为 k 的子序列」，把状态机扩成三态/加一维长度即可。

**Activity 生命周期与 onPause/onStop 的区别**：完整顺序是 `onCreate → onStart → onResume → onPause → onStop → onDestroy`，配套 `onRestart` 在「停止后重新回到前台」时插在 `onStart` 之前。`onPause` 表示 Activity 失去焦点、不能再交互但**仍然部分可见**（例如上面盖了一个对话框主题的 Activity、来电半屏提示、分屏下的另一侧）；`onStop` 表示完全不可见（跳到另一个全屏页面、按 Home 键回到桌面）。因此 `onPause` 里应该做轻量级收尾（停止动画、释放相机、暂停传感器、保存草稿），不能做耗时操作，因为它是下一个 Activity 启动的关键路径；重活（注销监听、释放大数据、断开连接）放 `onStop`。被部分遮挡（对话框主题）：本 Activity 走 `onPause`，一般不触发 `onStop`；被完全遮挡：先 `onPause` 再 `onStop`；被系统回收后再回来重建：`onCreate → onStart → onResume`（可用 `onSaveInstanceState` 恢复状态，注意它只在「因系统回收/配置变更」时可靠调用，不能当作持久化）。A 启动 B 再返回的完整顺序是：A.onPause → B.onCreate → B.onStart → B.onResume → A.onStop →（返回时）B.onPause → A.onRestart → A.onStart → A.onResume → B.onStop → B.onDestroy。配置变更（旋转屏幕）默认会销毁重建，可用 `android:configChanges` 或 ViewModel 保留数据。

**事件分发机制**：三个方法的职责是「分发—拦截—处理」。`dispatchTouchEvent` 负责把事件往下传（父容器先收到）；`onInterceptTouchEvent` 只有 ViewGroup 有，用来决定是否截断，返回 true 表示「这一层要自己处理，不再往下传」，此后同一手势的后续事件不再调用它（`down` 一旦被拦截，后续 `move/up` 直接进自己的 `onTouchEvent`）；`onTouchEvent` 负责实际消费，返回 true 表示已处理，返回 false 会把事件回退给父容器处理。整体流程是「U型」：从 Activity → DecorView → 逐层 ViewGroup 的 `dispatchTouchEvent`/`onInterceptTouchEvent` 向下，若没有子 View 消费则沿 `onTouchEvent` 向上回溯，最终没人消费就由 Activity 的 `onTouchEvent` 兜底。`requestDisallowInterceptTouchEvent(true)` 由子 View 调用来「请求父容器在本手势剩余过程中不要拦截」，典型场景是 ViewPager 里的横向滑动控件、列表里的拖拽排序——它只对当前手势有效，且父容器可以在 `ACTION_DOWN` 时无视该标记（因为 down 是新一轮手势的起点，标记会被重置）。`ACTION_CANCEL` 出现在「手势被打断」时：父容器中途开始拦截（例如 RecyclerView 在滑动阈值后抢走事件）、`requestDisallowInterceptTouchEvent` 让父级放弃、窗口失去焦点/被弹窗覆盖、组件被移除——收到 CANCEL 表示「这个手势不再属于你了」，必须在此重置按下态、取消长按与拖拽动画，否则会出现按钮一直高亮、状态错乱。另外要提 `onTouchEvent` 与 `OnTouchListener`、`OnClickListener` 的优先级（`OnTouchListener.onTouch` 返回 true 时 `onClick` 不会触发）。

**常见内存泄漏场景**：核心都是「长生命周期对象持有了短生命周期对象的引用」。① 非静态内部类/匿名类（Handler、Runnable、AsyncTask、回调）隐式持有 Activity，加上消息队列里还有延迟消息，Activity 就无法回收——改用静态内部类 + `WeakReference` 或 `Handler.removeCallbacksAndMessages(null)`。② 单例持有 Context——传 `applicationContext` 而不是 Activity。③ 静态变量持有 View/Activity/Bitmap。④ 未注销的监听器与广播接收器（传感器、EventBus、ContentObserver、`addOnGlobalLayoutListener`）。⑤ 资源未关闭（Cursor、File、Stream、MediaPlayer、Camera、Sensor）。⑥ 线程与定时器未停止（Thread 持有外部类引用，`Timer`/`ScheduledExecutor` 持续运行）。⑦ 动画未取消（属性动画持 View，走 `onDestroy` 时 `cancel`）。⑧ WebView 泄漏（独立进程或 `destroy()` 后移除）。⑨ 集合只增不减（缓存 Map、列表持有 Bitmap）。排查工具要说得出：Android Studio Profiler / Memory Profiler 抓堆转储后用 MAT 或 LeakCanary 分析引用链（从 GC Roots 到泄漏对象的最短强引用路径），LeakCanary 能在 debug 包里自动报告。修复原则是「谁持有谁释放、能用弱引用就不强持有、生命周期对齐」。

**Agent 工程化追问怎么答（Skill 管理、验收与度量）**：这类问题考的是你有没有真的把 AI 工作流跑成可维护的工程。Skill 管理：每个 Skill 一个目录（含说明、提示词、工具声明、示例、测试），有 owner、有变更记录（git 仓库里的 PR 评审 + CODEOWNERS），版本化并在 runtime 里可回滚，避免一个巨型提示词文件成为不可维护的黑盒。验收与合入：用评测集做门禁——固定用例集跑通过率对比新旧版本，核心用例不许回退，再配合人工抽检；PR 里必须附评测报告。度量要经得起追问：说「完成率 90%」时必须能讲清分子分母（是 100 个历史任务里 90 个一次通过，还是每轮工具调用成功率？分母里排除了哪些？），说「省一到两人日」要能讲清口径（人工基线怎么测的、统计了几个任务、是否包含返工时间），否则指标会被面试官一眼看穿。迭代中防止变差：建回归评测集 + 版本基线对比报告 + 灰度上线 + 收集线上 badcase 回灌。人工干预的边界：需求/口径澄清、高风险写操作审批、AI 反复失败的 case（要沉淀成人写规则或补进提示词），以及「人做得更好」的 case 必须做归因——是缺信息、缺工具，还是判断力问题，前者补上下文，后者才需要人工兜底。

**为什么选客户端 / 怎么关注新技术**：转方向的问题要给「动机 + 已有准备 + 长期打算」：动机可以来自对端上体验与性能的实感（用户直接感知的流畅度、启动速度、交互细节），准备说明你补了哪些基础（四大组件、生命周期、事件分发、Binder/Handler、性能工具），长期打算说明你想在端侧把体验与稳定性做深（而不是把客户端当跳板）。关注新技术的渠道要具体：官方博客与文档（Android Developers Blog、Android 15 行为变更）、开源社区与论文（arXiv、HuggingFace、GitHub Trending）、会议（Google I/O、WWDC、QCon、字节的技术公众号）、模型厂商的发布说明与 changelog；关键是要说明「看到之后会动手试」——比如自己做过什么小工具（浏览器插件、脚本、本地跑的 Agent demo），这比罗列渠道列表更能证明好奇心与动手能力。

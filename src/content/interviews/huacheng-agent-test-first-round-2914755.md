---
title: 华橙 Agent 评测一面：测试用例设计与 Java 集合
company: "华橙"
position: "测试开发（Agent 评测）"
round: 一面
date: '2026-09'
source: 牛客网
tags: ["测试开发","Agent评测","测试用例","Java","ArrayList","集合"]
summary: "华橙 Agent 评测岗一面 9 问：从求职动机、实习工作与 AI 难题，到「微信发送图片」的场景化测试用例设计，以及 Java Collection 体系、List 与 Set、ArrayList 与 LinkedList 的区别。"
---

### 《面试题目》

1. 自我介绍。
2. 为什么选择测试或者测开方向？
3. 实习时主要做的工作是什么？
4. 实习中遇到的和 AI 有关的难题，你是怎么解决的？
5. 场景题：针对微信「发送图片」的场景，设计测试用例。
6. 你主要的技术栈是什么？
7. 讲解一下 Java 的 Collection 类。
8. List 和 Set 的区别？
9. ArrayList 和 LinkedList 的区别？

### 《参考解析》

**「微信发送图片」的测试用例怎么分层设计**

不要一上来就罗列几十条，先分维度再往下列条目，最后补上异常和兼容。功能维度：选图来源（相册、拍摄、文件、其他 App 分享）、张数（单张、多张、超过上限时的提示）、图片处理（原图与压缩、编辑裁剪、旋转、水印）、发送路径（发送成功、失败、取消、发送中撤回、转发）；格式与内容：JPG/PNG/GIF/HEIC/WebP、超大图（十几 MB）、超长截图、透明图、损坏文件；网络维度：WiFi 与移动网切换、弱网限速丢包、断网、飞行模式恢复、弱网下的重试与进度；异常与恢复：发送中杀进程再打开、存储空间不足、相册权限被拒或只授权部分照片、登录态过期；兼容性：iOS 与 Android 各版本、折叠屏与深色模式、超大字体；性能与体验：首帧时间、上传耗时、内存占用、批量发送的并发数、失败后的重发入口、缩略图与实际图一致。最后用等价类加边界值收敛条数，并说明优先级——崩溃和发送数据丢失最高，样式问题最低。

**Agent 评测岗具体做什么**

从反问环节能看出岗位的三块内容：评测脚本开发、面向测试的 Agent 提效工具开发、以及 AI Agent 与算法的效果评测。所以这个岗位需要同时懂测试方法和一点模型评测。评测体系的核心是用例集设计（正例、负例、边界、多轮）加指标定义（任务完成率、工具选择准确率、参数正确率、平均步数、单次成本、幻觉率、拒答与安全合规），评价方法上规则断言适合确定性的部分，语义质量用 LLM-as-judge 加人工抽检兜底，最后要把这套东西做成可重复跑的回归，接了新版本先跑回归再上线。

**Java Collection 体系**

两条线：Collection 下有 List（ArrayList、LinkedList、Vector、CopyOnWriteArrayList）、Set（HashSet、LinkedHashSet、TreeSet）、Queue（ArrayDeque、PriorityQueue、BlockingQueue 家族）；另一条是 Map（HashMap、LinkedHashMap、TreeMap、ConcurrentHashMap、Hashtable）。答题时按「底层数据结构、是否有序、是否允许 null、是否线程安全、常见操作复杂度」五个属性去对比，比背名字有用。例如 ArrayList 是动态数组，随机访问 O(1)，允许 null；HashSet 内部就是一个 HashMap，key 是元素、value 是固定的占位对象；TreeMap/TreeSet 基于红黑树，按 key 有序，操作 O(log n)。

**List 与 Set 的区别**

List 有序、可重复、按下标访问；Set 通常不保证顺序且元素不重复。Set 的去重依赖元素的 `equals` 和 `hashCode`，所以自定义对象放进 HashSet 必须正确重写这两个方法，否则会出现「看起来一样却塞进去了两个」。需要保留插入顺序用 LinkedHashSet，需要排序用 TreeSet（要求元素可比较，或传入 Comparator）。注意 Set 没有下标，取第 k 个元素只能遍历。

**ArrayList 与 LinkedList 的区别**

ArrayList 底层是数组，随机访问 O(1)，尾部追加均摊 O(1)，中间插入删除要搬移元素 O(n)，扩容时会申请约 1.5 倍的新数组并复制（`newCapacity = oldCapacity + (oldCapacity >> 1)`），所以能预估容量时用 `new ArrayList<>(n)` 免掉多次扩容。LinkedList 底层是双向链表，头尾插入删除 O(1)，随机访问 O(n)，每个节点额外存两个指针、内存开销大且缓存不友好。实践结论：绝大多数场景选 ArrayList，即使频繁在头部插入，ArrayDeque 也比 LinkedList 更合适；LinkedList 主要价值在于它同时实现了 Deque 和 List。

**为什么选测试/测开，以及 AI 相关的实习难题怎么讲**

动机不要答成「开发没面上」，落到「喜欢把不确定的东西变成可复现的用例」「质量本身是工程能力」这类真实理由，并举一个你发现过的高价值 bug。实习里的 AI 难题用 STAR 讲：背景（比如模型输出不稳定导致用例无法断言）→ 你的做法（把断言从字符串匹配改成结构化校验，加置信度阈值和人工抽检）→ 结果（用例稳定性从多少提到多少、回归耗时缩短多少）。有数字才有说服力。

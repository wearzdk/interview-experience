---
title: "小鹏秋招前端一面：曝光埋点与事件循环"
company: 小鹏汽车
position: 前端开发（仿真）
round: 一面
date: 2026-09
result: 已过
source: 牛客网
tags: ["前端","埋点","IntersectionObserver","事件循环","算法","React"]
summary: "小鹏汽车秋招前端（仿真方向）一面面经，面试时间9.15，已通过。项目侧重点考察埋点体系与通用曝光埋点组件的设计（含不用IntersectionObserver、改为监听scrollTop的React实现），另有事件循环输出题、岛屿算法题与技术难点讲述。"
---

### 《面试题目》

1. 请简单介绍两段实习经历。
2. 埋点是怎么做的？
3. 如何设计一个通用曝光埋点组件：组件包裹任意子元素，子元素进入视口时自动上报曝光埋点，如何实现？
4. 不用 IntersectionObserver，通过监听 scrollTop 实现上述曝光埋点组件，用 React 组件形式如何写？
5. 手写 JS 事件循环输出顺序，并解释执行逻辑。
6. 实习、项目相关问题（原帖略）。
7. 算法题：岛屿（要求 10 分钟内完成）。
8. 讲一个实习中遇到的技术难点以及解决过程。
9. 反问：自动驾驶仿真业务是做什么的？
10. 反问：仿真业务是否会经过后端？数据流转是怎样的？
11. 反问：项目技术栈是什么？
12. 反问：业务是否涉及移动端，是否只做网页端？
13. 反问：组内架构情况、人员规模？
14. 反问：组内有没有 AI 相关工具/能力建设？
15. 反问：新人培养机制是怎样的？
16. 反问：部门是否提供 AI 工具、报销相关政策？
17. 反问：可视化业务对开发者有什么额外技术要求？有没有自研框架？
18. 反问：面试结果大概什么时候出？

### 《参考解析》

**通用曝光埋点组件的设计要点**：一个能上生产的曝光组件要解决「怎么判定曝光」「曝光几次」「带什么参数」「什么时候上报」四件事。判定上优先用 `IntersectionObserver`，组件把子元素包进一个容器并 `observe` 它，回调里判断 `entry.isIntersecting`；关键参数是 `threshold`（0 还是 0.5 决定元素露多少算曝光）与 `rootMargin`（常用于提前触发）。次数上要按业务定：一次性曝光（每个 `itemId` 只报一次，用 `Set` 加唯一 key 去重）还是时长曝光（进入视口后连续可见满 1 秒才算，用定时器 + 离开时清除，避免快速滑动被算作曝光）。参数上用 props 传入业务字段（`itemId`、`feedId`、`position`、`module`），并做批量与合并上报：攒一小段时间（如 200ms）或攒够 N 条再发，页面 `visibilitychange` 为 hidden 时用 `navigator.sendBeacon` 发出，防止用户关页面丢数据。实现上还要处理组件卸载时 `unobserve`/`disconnect` 防内存泄漏、列表虚拟滚动时元素复用导致的误报（曝光 key 要含唯一业务 ID），以及 SSR 环境下 `IntersectionObserver` 不存在时的降级。

**不用 IntersectionObserver，监听 scrollTop 怎么写**：思路是「订阅滚动 → 计算元素相对视口的位置 → 判定 → 去重上报」。用 React 写大致是：

```jsx
const ExposeItem = ({ itemId, onExpose, children }) => {
  const ref = useRef(null);
  const exposedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ticking = false;

    const check = () => {
      ticking = false;
      if (exposedRef.current) return;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      // 可见高度超过自身 50% 且顶部在视口内，视为曝光
      const visible = Math.min(rect.bottom, viewportH) - Math.max(rect.top, 0);
      if (visible > 0 && visible >= rect.height * 0.5) {
        exposedRef.current = true;
        onExpose?.(itemId);
        cleanup();
      }
    };

    // 用 rAF 节流，避免滚动事件高频触发导致 layout thrash
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    };

    // 滚动容器不一定是 window，可能是某个 overflow:auto 的父节点
    const scrollParent = getScrollParent(el);
    scrollParent.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    check(); // 首次挂载先判一次

    const cleanup = () => {
      scrollParent.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    return cleanup;
  }, [itemId, onExpose]);

  return <div ref={ref}>{children}</div>;
};
```

回答时的加分点是：`getBoundingClientRect()` 会触发同步布局，所以必须用 rAF 或时间片节流、把读写分离（先批量读 rect 再统一写 DOM）；监听要挂到真正的滚动祖先而不是永远挂 `window`（`getScrollParent` 向上找 `overflow` 非 visible 的祖先）；`passive: true` 让滚动不被阻塞；对长列表更彻底的做法是滚动容器统一在列表层做一次批量检测（一个 scroll 回调里遍历可见区间的 item），而不是每个 item 各挂一个监听。

**事件循环输出题的解题方法**：先把代码按优先级分层，再按层输出。同步代码（含 `new Promise` 的执行器）属于当前宏任务，最先跑完；微任务队列包含 `process.nextTick`（Node 中优先于 Promise）、`Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`，每个宏任务结束后清空整个微任务队列（清空过程中新产生的微任务也在本轮继续执行）；宏任务包含 `setTimeout`/`setInterval`、I/O、`setImmediate`（Node）、UI 渲染相关。浏览器与 Node 的差别要能说清：Node 的事件循环分 phases（timers → pending callbacks → poll → check → close），`setImmediate` 在 check 阶段执行，因此主模块里 `setTimeout(fn, 0)` 与 `setImmediate` 的顺序不确定，但在 I/O 回调里 `setImmediate` 一定先于 `setTimeout`；`async/await` 中 `await` 之后的代码等价于 `then` 回调，属于微任务。答题时建议在纸上画出「同步段 → 微任务队列 → 宏任务1（同步段 → 微任务队列）→ 宏任务2」的表格，逐条填，几乎不会错。顺带准备 `await` 与 `Promise.resolve` 混用、`then` 返回值的链式拍平这两个高频陷阱。

**岛屿数量（Grid 连通块计数）**：标准解法是「遍历网格 + 遇到陆地就计数并淹没整块」。DFS 递归写法：遍历每个格子，若为 `'1'` 则 `count++` 并 `dfs(i, j)`，把访问过的陆地改成 `'0'`（原地标记省一个 visited 数组），越界或非陆地直接返回。网格较大时递归可能爆栈，改用显式栈的迭代 DFS 或 BFS（队列）更稳；复杂度都是 `O(m·n)`。10 分钟内写完的关键是先把四个方向的偏移数组写好：`dirs = [[1,0],[-1,0],[0,1],[0,-1]]`，BFS 里用 `deque` 或数组加头指针。常见变体要提前准备：岛屿最大面积（DFS 返回面积累加）、封闭岛屿数量（把边界陆地先淹掉）、不同岛屿的个数（形状哈希序列化）。另外注意输入是 `'1'/'0'` 字符还是数字 1/0，别在这上面翻车。

**实习技术难点怎么讲**：用 STAR 但不啰嗦，重点放在「为什么难」和「你怎么验证解决有效」。一句背景（业务目标），一句问题（现象 + 数据，比如「首屏 3.2s、埋点丢失率 12%」），然后讲定位过程（怎么复现、用了什么工具、排除了哪些假设），再讲方案与取舍（为什么选 A 不选 B，代价是什么），最后给结果数据（优化到多少、有没有副作用）和复盘。面试官最想听的是你的定位思路和取舍理由，而不是「我用了一个库就搞定了」。

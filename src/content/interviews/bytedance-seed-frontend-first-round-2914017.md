---
title: 字节Seed一面凉经：三道前端手撕（useTimeout/并发限制）
company: 字节跳动
position: 前端开发
round: 一面
date: '2026-09'
result: 已挂
source: 牛客网
tags: ["字节跳动","前端","手撕代码","React Hooks","并发控制","组件设计"]
summary: "字节 Seed 前端一面凉经（2026.9.18）：自我介绍后被追问封装过的 list layout 如何应对跨页面字段，随后连撕三道题——useTimeout 钩子、AntV 风格下拉框组件、限制最大并发为 3 的 requestLimit，作者完成度 80~90% 却因写法细节被挂。"
---

### 《面试题目》

1. 自我介绍
2. 你封装的 list layout 是怎么封装的？追问：需要用到其他页面的字段怎么办？
3. 手撕：实现 useTimeout 钩子。
4. 手撕：实现 AntV 的 Select 下拉框组件。
5. 手撕：实现 requestLimit，限制最大并发数为 3（面试官指出有一处写得不好）。
6. 反问（业务方向：面试官说进来后会分配不同业务组；建议：多看看数据结构和力扣）

### 《参考解析》

**list layout 怎么封装 + 跨页面字段的问题**：标准答案是「布局壳与字段渲染分离」。布局组件只负责栅格、间距、响应式（配置驱动：columns、span、gutter、breakpoint），具体字段通过配置项 `{ key, label, render }` 或 render props / 作用域插槽交给调用方，布局组件不 import 任何业务字段。跨页面复用字段时，把字段定义抽成独立的 schema/注册表（例如 `fields/userName.tsx`），页面按需组合；如果不同页面存在同名不同义的字段，用命名空间前缀（`order.status` 与 `user.status`）区分，而不是在组件里靠 `if (page === 'x')` 判断——后者会让组件与页面强耦合。React 下还要注意两点：配置对象不要每次渲染新建（否则整表重渲染，用 `useMemo`），以及 render 函数的闭包会捕获旧 state（用 ref 或把依赖列全）。

**手撕 useTimeout**：核心是把延迟执行抽象成声明式 hook，并处理好清理与依赖：

```js
function useTimeout(callback, delay) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; }, [callback]);
  useEffect(() => {
    if (delay == null) return;              // null/undefined/NaN 表示不启动
    const id = setTimeout(() => cbRef.current(), delay);
    return () => clearTimeout(id);          // 卸载或 delay 变化时清理
  }, [delay]);
}
```

要点：① 用 ref 保存最新回调，避免把 callback 放进依赖数组导致定时器被反复重建；② `delay == null` 或非有限数时不启动；③ 清理函数必须 `clearTimeout`，否则卸载后回调触发会引发警告或内存泄漏；④ 如果还要支持手动 `reset` / `clear`，返回 `{ reset, clear }`，reset 时用自增的 key 触发 effect 重跑。同一族题目还有 `useInterval`（Dan Abramov 的经典写法）与 `useDebounce`，可以一并准备。

**手撕 Select 下拉框**：面试官主要看组件设计能力而不是样式，回答时先把能力清单说清楚再动手：受控与非受控（`value + onChange` / `defaultValue`）、选项数据结构 `{ label, value, disabled }`、开合状态与点击外部关闭（`useEffect` 监听 `document` 的 mousedown，配合 `ref.current.contains(e.target)` 判断）、键盘无障碍（↑↓ 移动高亮、Enter 选中、Esc 关闭、`role="listbox"` 与 `aria-activedescendant`）、搜索过滤与高亮匹配、多选（value 为数组 + tag 展示）、分组与自定义渲染（`renderOption`）、选项上千时的虚拟滚动、以及下拉面板的定位（Portal + 边界翻转）。策略是先问清面试官想要的范围，再写核心部分，比闷头写一个只有样式的 div 好得多。

**手撕 requestLimit（最大并发 3）**：经典并发池：

```js
function createLimiter(limit) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= limit || queue.length === 0) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve().then(fn).then(resolve, reject).finally(() => { active--; next(); });
  };
  return (fn) => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); next(); });
}
```

容易被扣分的细节：① 任务失败不能卡住队列——必须在 `finally` 里 `active--` 并继续 `next()`，用 `then` 的第二个参数或漏掉失败路径都会让队列停滞；② 返回值顺序：每个任务的 Promise 各自 resolve，用 `Promise.all(tasks.map(limiter))` 就能保持与传入顺序一致；③ 边界：`limit <= 0` 应该报错或退化成串行；④ 资源释放与错误传播（别吞掉 reject）；⑤ 进阶可以聊取消与超时（AbortController + `Promise.race`）。作者被指出「有个地方写得不好」，通常就是这几处之一。

**这场面试的复盘**：手撕完成度 80~90% 却被挂，说明前端岗的手撕评分不只看 AC，还看命名、边界、清理、错误处理这些工程细节，以及能否在写之前把方案讲清楚。面试官给的建议是「多看看数据结构和力扣」——说明基础编码规范与算法熟练度仍是硬门槛。另外要注意：面试官一开始说「进来会分配不同业务组」，意味着业务方向不是考察重点，别把时间花在猜业务上。

---
title: "上海银行外包前端一面（4 年经验）：Hooks 原理、渲染流程与虚拟列表"
company: 上海银行外包
position: 前端开发
round: 一面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/f3fbdfa341e44cd3bbe913771b4247f3
tags: ["前端","React","Hooks","HTTP","虚拟列表","分片上传"]
summary: "4 年经验社招、空窗 1 年的前端面试记录：围绕 React Hooks（useEffect/useMemo/useLayoutEffect/useRef/useState）、类组件与函数组件对比、受控组件、HTTP 1.1/2.0/3.0 多路复用、Flex 布局，以及分片上传、虚拟列表、动态表单三道实现题展开，时长 30 分钟。"
---

### 《面试题目》

1. Hooks 有什么作用？
2. `useEffect`、`useMemo`、`useLayoutEffect`、`useRef`、`forwardRef` 分别是什么？
3. `useState` 是同步还是异步？
4. React 的渲染流程是怎样的？
5. Hooks 和类组件各自的优缺点？
6. 受控组件是什么意思？
7. HTTP 1.1、2.0、3.0 的多路复用有什么区别？
8. CSS 的 Flex 布局怎么用？
9. 文件分片上传如何实现？
10. 虚拟列表如何实现？
11. 动态表单如何实现？

### 《参考解析》

**Hooks 的价值是让函数组件具备状态与副作用能力，同时把逻辑按「关注点」而不是「生命周期」组织。** `useState` 存状态，`useEffect` 处理副作用（依赖数组决定执行时机），`useMemo`/`useCallback` 做值与方法缓存，`useRef` 存跨渲染的引用或 DOM 节点，`useLayoutEffect` 在 DOM 变更后、浏览器绘制前同步执行（适合测量布局、避免闪烁），`forwardRef` 让函数组件把 ref 透传给内部节点。和类组件比，优点是逻辑复用靠自定义 Hook（不再需要 HOC/render props 嵌套）、this 心智负担消失、代码更贴近「状态 → 视图」；代价是闭包陷阱（异步回调里拿到旧 state）、依赖数组漏写导致的陈旧值，以及每次渲染重新创建函数带来的性能问题——后者正需要 `useMemo`/`useCallback` 配合 `React.memo`。

**「`useState` 是同步还是异步」要答成「更新是异步批处理的，不是同步的」。** 在 React 18 之前，只有事件回调和生命周期里的更新会合并成一次渲染；18 起 `createRoot` 下的所有更新（包括 setTimeout、Promise、原生事件）都自动批处理。所以连续调用多次 `setCount(count + 1)` 只会加 1，正确写法是传函数式更新 `setCount(c => c + 1)`。批处理的目的是减少渲染次数；如果确实要在 DOM 更新后立刻读取布局，就用 `useLayoutEffect` 或 `flushSync`（后者会破坏批处理，慎用）。

**React 渲染流程可以拆成两段：render 阶段与 commit 阶段。** 状态更新触发调度（`setState` → 收集更新 → 计算优先级 → 生成新的 Fiber 树），render 阶段是「可中断」的纯计算，负责 diff 出变更（React 的 diff 依赖同层比较 + key 复用，所以列表 key 不能用 index）；commit 阶段不可中断，依次执行 DOM 变更（before mutation / mutation）、`useLayoutEffect`、浏览器绘制，最后再异步执行 `useEffect`。理解这条链路才能解释常见问题：为什么 `useLayoutEffect` 能避免闪烁、为什么在 render 里做副作用会重复执行、以及为什么大列表要用虚拟滚动而不是硬渲染。

**受控组件指表单值由 React state 驱动。** 输入框的 `value` 来自 state、`onChange` 里更新 state，组件状态是唯一数据源，便于校验和联动；非受控组件把值交给 DOM 自己管，用 `ref` 或 `defaultValue` 读取，代码少但联动和校验要手动同步。实践中大型表单常用「受控 + 表单库（react-hook-form 的非受控模式）」折中，避免每个输入都触发整表重渲染。

**HTTP 多路复用是三代协议的核心差异。** HTTP/1.1 是「一个连接同时只能处理一个请求」，浏览器靠开 6 个并发连接绕过队头阻塞，且头部重复发送；HTTP/2 在一条 TCP 连接上把请求拆成二进制帧并打上 stream id，实现真正的多路复用、头部压缩（HPACK）和服务端推送，但**TCP 层的队头阻塞仍在**——一个丢包会拖住这条连接上的所有流；HTTP/3 换到基于 UDP 的 QUIC，每个流独立重传，彻底消除传输层队头阻塞，还支持 0-RTT 建连和连接迁移。注意 HTTP/2 的多路复用并不等于没有并发上限，服务端一般用 `SETTINGS_MAX_CONCURRENT_STREAMS` 限制。

**虚拟列表的本质是「只渲染可视区 + 上下留白」。** 外层容器固定高度并监听滚动，根据 `scrollTop` 和每项高度算出可视起止下标，只渲染这一段；上下用两个撑高的空白 div（或 `transform: translateY`）保证滚动条长度正确。难点在动态高度（需要用 ResizeObserver 实测并缓存，或按预估高度 + 校正）和滚动抖动（用 `requestAnimationFrame` 节流、避免每帧 setState）。上拉加载要和虚拟滚动配合：提前触发预取，加载过程中保持占位高度不变，否则会跳。

**分片上传与动态表单。** 分片上传要点：把文件按固定大小（1–5MB）切片，每片带上文件指纹和分片序号并发上传（限制并发数），服务端按 `uploadId + index` 落临时存储；全部分片完成后调合并接口，合并前校验每片 hash 和文件整体 hash，实现秒传（哈希已存在直接返回）与断点续传（查询已上传分片列表，只补缺失片）。动态表单本质是「用 JSON Schema 描述字段，渲染器递归生成组件」：每个字段声明类型、校验规则、联动条件（`visibleWhen`）、默认值，渲染层按类型映射到输入组件，校验统一走同一套规则引擎，提交时按 schema 序列化——关键是让 schema 成为唯一数据源，避免 UI 和数据两处维护。

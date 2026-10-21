---
title: "MetaApp 前端开发 一面：多端唤起、抛物线动画与 nextTick"
company: "MetaApp"
position: "前端开发"
round: "一面"
date: '2026-10'
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/7eba0be644e5468da29b2bdc0c3c035e"
tags: ["MetaApp", "前端开发", "多端适配", "动画", "Promise", "Vue"]
summary: "MetaApp 前端开发一面，以八股为主：从实习离职原因问到多端适配与浏览器唤起 App 的判定、组件化、抛物线动画实现，再考 Promise.all 与 allSettled、Vue 自定义 hook、nextTick 与定时器生命周期，最后问 FCP、AI coding 占比和对 Agent 的理解。"
---

### 《面试题目》

1. 自我介绍。
2. 之前实习为什么离职？
3. 介绍一下你的实习。
4. 多端适配是怎么做的？
5. 用户在浏览器打开一个 URL，怎么知道是手机打开的、然后去唤起 App 端？
6. 你对组件化开发是怎么理解的？
7. 有没有接触过动画？
8. 怎么实现一个抛物线动画？
9. Promise 的 all 和 allSettled 有什么区别？
10. Vue 的自定义 hook 怎么用？
11. nextTick 是微任务吗？
12. A 页面有个定时器，跳转到 B 页面，A 页面的定时器会销毁吗？
13. 知道 FCP 吗，健康指标是多少？
14. AI coding 的比例有多大？
15. 你对 Agent 的理解怎么样？
16. 反问业务。

### 《参考解析》

**唤起 App 的判定靠 UA 加深链，兜底靠超时。** 移动端判定：UA 里匹配 iPhone、iPad、Android；iPadOS 13 之后 Safari 的 UA 会伪装成 macOS，要配合 navigator.maxTouchPoints 大于 1 与 platform 一起判断，屏幕宽度和 touch 能力可以做辅助，服务端也可以按 UA 直接 SSR 分流。唤起方式：自定义 scheme（myapp://path）兼容老系统，iOS 9 以上用 Universal Link、Android 用 App Links，需要域名下放 apple-app-site-association 或 assetlinks.json 并通过校验，才能在未安装时不弹错误页。实现上先尝试跳转，起一个 1.5 到 2.5 秒的定时器，页面进入后台（visibilitychange 变成 hidden）就认为唤起成功并清掉定时器，否则落到下载页或应用商店。微信内置浏览器会拦 scheme，需要引导「在浏览器中打开」或使用微信开放标签。

**抛物线动画是「水平匀速加垂直加速」的合成。** 物理上就是水平初速度加一个向下的恒加速度：x 等于 v0x 乘 t，y 等于 v0y 乘 t 加二分之一 g t 方。实现有三条路：CSS 用两层嵌套元素，外层 translateX 线性、内层 translateY 用 cubic-bezier 近似加速，性能最好、走合成层；JS 用 requestAnimationFrame 按时间戳算位置，逐帧设置 transform（不要改 left 和 top，那会触发布局），灵活但要自己控帧率；也可以用 Web Animations API 写关键帧或用贝塞尔拟合任意轨迹。飞行过程中要处理起点终点的动态计算（getBoundingClientRect）、缩放与透明度渐隐、快速连点时的动画复用与取消，以及 prefers-reduced-motion 下的降级。

**nextTick 是微任务，这正是它能「在本轮事件循环末尾」执行的原因。** Vue 2 的 nextTick 优先用 Promise.then，降级到 MutationObserver、setImmediate、setTimeout；Vue 3 直接基于 Promise.then 实现，调度器用微任务队列 flush jobs。所以 DOM 更新回调在当前宏任务结束后、浏览器渲染前执行，能拿到更新后的 DOM；在 nextTick 里再改状态会在同一个 flush 里继续排队，不会立刻重渲染。要注意微任务会饿死渲染：在 nextTick 里递归排大量任务会卡住首屏；SSR 与测试环境里也要靠 await 等时序，而不是用 setTimeout 去猜。

**A 页面的定时器跳到 B 页面会不会销毁，取决于路由和组件生命周期。** SPA 里 push 到 B 只是卸载 A 的组件（用了 keep-alive 时 A 被缓存、根本不卸载），而 setInterval 挂在全局，不会因为路由切换自动清除——「页面跳走了定时器还在跑」是常见的内存泄漏与后台请求来源。正确做法是在组件卸载钩子（Vue 的 onUnmounted、React useEffect 的 cleanup）里 clearInterval，多个定时器统一登记管理；更稳的是把定时任务放进可销毁的调度器，或用 setTimeout 自递归避免任务堆积，页面不可见时用 visibilitychange 暂停，需要跨页共享的放 store 或 Web Worker 并显式管理生命周期。答题时把 keep-alive、路由守卫、SPA 与整页跳转的差别一起说清，比只答「会销毁」完整。

**Promise.all 与 allSettled 的分工。** all 是「全成才算成」：任一 reject 立刻 reject（fail-fast），但已发起未完成的请求不会被取消；allSettled 等全部落定，返回 fulfilled 或 rejected 的状态数组，适合批量任务要汇总成功与失败明细的场景。两者入参都是 iterable，结果顺序与入参一致，空数组直接 resolve；想限制并发要自己写池子或 p-limit，别一次并发几百个把下游打挂。FCP（First Contentful Paint）衡量首次内容绘制，Lighthouse 的口径是 1.8 秒以内良好、1.8 到 3 秒待改进、超过 3 秒差；优化手段是减小首屏关键资源——内联关键 CSS、字体 preload 加 swap、SSR 或骨架屏、拆包与预加载。

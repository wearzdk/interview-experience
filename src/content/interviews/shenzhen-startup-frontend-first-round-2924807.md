---
title: "深圳小公司前端一面（4 年经验）：uniapp 生命周期、Electron 通信与防抖节流"
company: 深圳小公司
position: 前端开发
round: 一面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/8d9839a9dc8648c58001208ac96af1bf
tags: ["前端","uniapp","Electron","防抖节流","WebSocket","线下笔试"]
summary: "4 年经验、空窗 1 年的前端社招线下面试记录：题目集中在 uniapp 生命周期、Electron 多线程与组件间通信、防抖与节流、WebSocket API、项目最难的技术点，以及「没有梯子怎么查谷歌」这类工作方式问题，面试时长约 30 分钟。"
---

### 《面试题目》

1. uniapp 的生命周期有哪些？
2. Electron 的多线程与组件间通信怎么做？
3. 防抖和节流的区别，分别怎么实现？
4. WebSocket 的 API 怎么用？
5. 你项目里技术最难的点是什么？
6. 你了解过我们公司的产品吗？
7. 如果没有梯子，你怎么查谷歌？

### 《参考解析》

**uniapp 的生命周期分三层。** 应用级（`onLaunch`、`onShow`、`onHide`、`onError`）、页面级（`onLoad`、`onShow`、`onReady`、`onHide`、`onUnload`，以及下拉刷新 `onPullDownRefresh`、触底 `onReachBottom`）、组件级（Vue 的 `created`/`mounted` 等）。实际踩坑最多的是**页面栈与返回时的生命周期**：`onShow` 在每次回到该页时都会触发（适合刷新数据），`onLoad` 只在首次进入执行；`navigateTo` 保留当前页（栈深不超过 10 层）而 `redirectTo` 会替换当前页，`switchTab` 会清空非 tab 页栈。小程序端还要注意分包加载与 `onReady` 之后才能安全操作 DOM（`uni.createSelectorQuery`）。

**Electron 的多线程与通信，本质是「主进程 + 渲染进程 + 预加载脚本」。** 主进程管窗口、菜单、系统能力，渲染进程跑页面，二者不能直接互相调用，要通过 `ipcMain`/`ipcRenderer` 发消息：渲染进程用 `ipcRenderer.invoke` 请求、主进程 `ipcMain.handle` 响应（Promise 风格，推荐），或者 `send`/`on` 单向通知。真正消耗 CPU 的任务（大文件解析、加密、图像处理）不应该塞进主进程，而是用 `utilityProcess`（或旧的隐藏渲染进程/`worker_threads`）跑，算完再回传，否则会卡住窗口。安全上要开 `contextIsolation`、关 `nodeIntegration`，只通过 `contextBridge` 暴露白名单方法。

**防抖和节流解决的是「高频触发」的两种不同诉求。** 防抖（debounce）是「等安静下来再执行」：每次触发重置定时器，适合搜索联想、表单校验、窗口 resize 结束后的重算；节流（throttle）是「固定频率执行」：时间窗口内最多一次，适合滚动监听、拖拽、按钮防连点。实现上防抖要注意保留 `this` 和参数、提供 `immediate` 选项和 `cancel` 方法；节流常用时间戳 + 定时器双实现（保证最后一次也执行）。面试里最好补一句：真正影响性能的滚动场景优先用 `requestAnimationFrame` 而不是定时器，因为它和浏览器绘制对齐。

**WebSocket 的工程要点在「连接治理」而不是 API 本身。** 浏览器端 `new WebSocket(url)` 之后靠 `onopen`/`onmessage`/`onerror`/`onclose` 四个回调驱动；生产上必须补：心跳保活（定时发 ping，超时未收到 pong 就重连）、断线重连（指数退避 + 最大次数）、消息序号与去重（重连后可能收到重复消息）、以及鉴权（浏览器 WebSocket 不能自定义 header，通常用 URL 带一次性 token 或首帧发认证消息）。SSE 与它的差异是单向、基于 HTTP、自带断线重连语义，适合只需要服务端推送的场景。

**「没有梯子怎么查谷歌」考的是解决问题的路径，不是工具。** 可以答：优先看官方文档和源码（MDN、GitHub issue、RFC），中文社区用掘金/思否/CSDN 交叉验证，遇到报错直接搜原文错误信息；需要外网资料时用国内的镜像站、npm/镜像加速、或者让同事/公司账号代查。回答时给出真实做过的例子（比如某次 bug 是翻某个 issue 的讨论解决的），比罗列工具更有说服力。

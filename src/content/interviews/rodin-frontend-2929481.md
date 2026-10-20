---
title: "Rodin 前端开发一面面经"
company: "Rodin"
position: "前端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/efd457c4e9de49e79cc712abce5a9097
tags: ["前端", "语义化", "事件循环", "事件委托", "SEO", "SSR", "SSG"]
summary: "Rodin 前端一面，题目不难但覆盖语义化标签、事件循环与大量微任务、事件委托、落地页优化、SEO、SSR/SSG，以及“AI 时代前端还能做什么”。"
---

### 《面试题目》

1. 自我介绍。
2. 挑一个项目介绍。
3. 语义化标签：链接和按钮分别使用什么标签？
4. 事件循环：大量微任务会怎样？
5. 事件委托及其使用场景。
6. Landing 页面如何优化？
7. SEO 怎么做？
8. SSR 和 SSG 有什么区别？
9. AI 时代，我们还能做什么？

### 《参考解析》

**语义化**：链接用 `<a href>`，按钮用 `<button>`；前者负责导航、可被爬虫跟踪，后者负责页内动作、天然支持键盘和禁用态。不要用 `div` 加点击事件替代，除非补全 role、tabindex 和键盘处理。

**事件循环**：大量微任务会一直占用当前宏任务之后的清空阶段，导致渲染和用户输入被推迟；把长任务拆成多个宏任务或 `requestIdleCallback`/`scheduler.postTask` 分片，避免主线程卡死。事件委托把监听器挂在父元素，利用冒泡处理动态子元素，适合列表、表格等大量同类节点，但要注意 `stopPropagation` 和不冒泡事件。

**落地页与 SEO**：首屏优化用关键 CSS、图片懒加载/压缩、字体子集、预连接和 CDN；减少第三方脚本，LCP/CLS/INP 作为核心指标。SEO 要有可抓取的 HTML、语义化结构、title/description、canonical、sitemap、结构化数据和内链；SSR 在服务端生成 HTML，适合动态内容；SSG 在构建时生成静态页，适合变化不频繁的内容，二者可以结合 ISR。

**AI 时代**：重复的模板代码会被生成，前端更值钱的是需求拆解、体验设计、性能与稳定性、跨端和业务理解；把 AI 当协作者，自己负责验收、边界和最后的质量。

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

面灵面经 — 基于 Astro 6 的静态站点，聚合牛客、脉脉等平台的真实大厂面经。部署地址：https://mj.mianlingai.com

## 常用命令

```bash
bun dev        # 启动开发服务器 localhost:4321
bun build      # 构建静态站点到 ./dist/
bun preview    # 预览构建产物
```

包管理器：**Bun**，无测试套件。

## 架构

基于 Astro 内容集合的纯静态站点，文件路由，构建时预渲染所有页面。

### 内容系统

面经数据以 Markdown + frontmatter 形式存放在 `src/content/interviews/*.md`，Schema 定义在 `src/content/content.config.ts`：

- 必填：`title`、`company`、`position`、`date`
- 选填：`round`、`result`、`base`、`source`（默认"牛客网"）、`tags`（字符串数组）、`summary`

通过 Astro 的 `getCollection("interviews")` API 查询内容。

### 路由

- `/` — 首页，含公司/岗位/标签筛选，展示最新 20 条面经
- `/interview/[slug]` — 面经详情页，含相关面经推荐、JSON-LD 结构化数据
- `/company/[company]` — 按公司筛选面经列表
- `/position/[position]` — 按岗位筛选面经列表
- `/tag/[tag]` — 按标签筛选面经列表

### 关键文件

- `src/consts.ts` — 站点标题、描述、小程序名，以及拼主站 utm 链接的 `mainSiteUrl(campaign)`
- `src/styles/global.css` — 全局 CSS 变量（主色 #105fd9，与主站品牌蓝一致）+ 全局 `.co-badge`
- `astro.config.mjs` — 站点 URL、sitemap 集成配置
- `src/components/BaseHead.astro` — SEO meta 标签、OpenGraph

### 复用组件

- `InterviewList.astro` — 面经条目列表，首页与公司/岗位/技术点聚合页共用。`hideCompany` / `hidePosition` 隐藏聚合页上重复的那一维；聚合页上方没有 h2 时传 `titleLevel={2}`
- `PageHeader.astro` — 聚合页的面包屑 + 标题 + 副标题（副标题走默认 slot）
- `Pagination.astro` — 只渲染首页、末页和当前页附近的页码，其余折叠成省略号
- `MiniProgram.astro` — 微信小程序入口（二维码 + 搜一搜引导），三个变体：`card`（首页 hero 侧栏）/ `banner`（聚合页与详情页正文后）/ `compact`（页脚）。二维码源图在 `src/assets/`，走 `astro:assets` 构建时转 webp
- `src/lib/company-hue.ts` — 由公司名派生 `.co-badge` 的稳定色相，色相锁在蓝—青—紫的品牌邻域内

### 样式

Astro 作用域 CSS + 全局 CSS 自定义属性，响应式断点 768px（首页另有 1000px 断点），无 CSS 框架，纯手写样式。
配色一律用 `global.css` 里的 `--color-*` 变量，不要在组件里写死十六进制色值。

## 添加面经内容

在 `src/content/interviews/` 下新建 `.md` 文件，填写必填 frontmatter 字段即可。文件名即为 slug。注意：tags 中不能包含 `/`，否则会导致路由报错；含 `#` 等 URL 保留字符的 tag（如 `C#`）会导致标签聚合页 404，需要在 `src/lib/tag-slug.ts` 的 `TAG_SLUG_OVERRIDES` 里补充 URL-safe slug 映射。

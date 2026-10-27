---
title: "宇视科技 Web 软件开发一面：老项目上加新功能怎么用 AI、Electron 与前端基础"
company: "宇视科技"
position: "Web 软件开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/6ec5e1783b0e405bb043c8ce8069653a
tags: ["宇视科技", "Web开发", "一面", "Electron", "AI编程", "Skill", "MCP", "防抖节流", "Vue"]
summary: "宇视科技 Web 软件开发一面 30 分钟：先讲两个项目背景，再集中问 AI 使用——实习里 AI 占多少、哪些是你用 AI 做的、遇到过什么问题怎么解决、公司用的是自研 AI 还是 CodeBuddy/VSCode、接手老项目写新项目时怎么用 AI 保证代码规范一致不出问题、Skill 与 MCP 了解吗、写过 agent 吗；技术部分问为什么选 Electron 开发、Electron 打包多大，以及防抖与节流、Vue2 与 Vue3 的区别、水平垂直居中的几种方法。"
---

### 《面试题目》

1. 讲讲你两个项目的背景。
2. 实习里 AI 占多少工作量？哪些部分是你用 AI 做的？
3. 用 AI 的过程中遇到过什么问题，怎么解决的？
4. 你们公司用的是自研 AI，还是 CodeBuddy / VSCode 这类工具？
5. 在一个老项目基础上写新项目，你怎么用 AI 完成并保证代码规范一致、不出问题？
6. Skill、MCP 这些了解吗？有没有写过 agent？
7. 为什么选用 Electron 开发？Electron 打包有多大？
8. 你了解我们公司吗？
9. 防抖和节流分别是什么？
10. Vue2 和 Vue3 有什么区别？
11. 水平垂直居中有什么方法？

### 《参考解析》

**「在老项目上写新功能怎么保证规范一致」这题答成流程最加分**：先让 AI 读现有代码（挑几个同类型的模块作为上下文与风格样本），把项目的 lint / 目录约定 / 公共组件用法写进规则文件（AGENTS.md / .cursorrules 之类），要求它先给出改动计划与涉及文件再动手，改完必须跑 lint + 类型检查 + 单测，最后人工 review diff 只看新增与删除边界。核心是「用规则约束风格、用工具约束正确性、用 diff 约束范围」，而不是靠 prompt 里多说几句「请保持风格一致」。

**Electron 的体积问题**：它把 Chromium 与 Node 一起打包，安装包通常上百 MB，解压后几百 MB；作者说 200MB 而面试官说八十多 MB，差别在于打包方式与裁剪——是否只带目标平台、是否用 asar 压缩、是否剔除不需要的 locale 与 devtools、是否用 `electron-builder` 的差分与压缩。回答这类题时给「为什么会大、怎么裁」比报一个数字更稳。

**防抖与节流**：防抖是「事件停止触发后延迟 N 毫秒才执行一次」（适合搜索框输入、窗口 resize），节流是「固定时间窗口内最多执行一次」（适合滚动、拖拽、鼠标移动）；实现上防抖用 `setTimeout` + `clearTimeout`，节流用时间戳或定时器加锁。要能说出「立即执行版防抖」和「尾触发」的区别。

**Vue2 与 Vue3 的核心差异**：响应式从 `Object.defineProperty` 换成 `Proxy`（能监听新增 / 删除属性与数组索引，性能更好）、Composition API 与 `<script setup>`、更好的 TypeScript 支持、Fragment / Teleport / Suspense 等新特性、以及打包工具从 webpack 生态向 Vite 迁移、体积更小。**水平垂直居中**至少有五种：flex（`justify-content` + `align-items`）、grid（`place-items: center`）、绝对定位 + `transform: translate(-50%,-50%)`、绝对定位 + `inset: 0` + `margin: auto`、以及已知宽高时用 `margin` 负值。

---
title: "字节大数据开发面经：Hadoop 八股加一道业务建模场景题"
company: "字节跳动"
position: "大数据开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/cfc607bc67f44807a5783c43d1eaed12
tags: ["字节跳动", "大数据开发", "Hadoop", "建模", "一面"]
summary: "字节大数据开发面经：Hadoop 老八股答得不顺，最后一道业务建模场景题因为和实习高度相似答得流畅，整体一般但约上了二面。"
---

### 《面试题目》

1. 自我介绍与项目。
2. Hadoop 相关八股。
3. 业务场景建模题：给一个和实习类似的业务场景，让设计建模方案。

### 《参考解析》

**Hadoop 八股的重点是「组件职责 + 读写流程」**。HDFS 的 NameNode 管元数据、DataNode 存块、默认三副本；写流程是客户端请求 → NameNode 返回可写 DataNode → 管道写 → 逐级确认；读流程是按块位置就近读。MapReduce 讲清 map → shuffle → reduce 三个阶段，以及 shuffle 为什么是瓶颈。YARN 讲 ResourceManager、NodeManager、ApplicationMaster 的分工。

**场景建模题要先问口径**：数据量级、更新频率、查询模式（点查还是范围扫描）、一致性要求。然后选模型：维度建模（星型/雪花）适合分析场景，宽表适合固定报表，湖仓格式适合既要明细又要更新的场景。最后说分区和分桶策略、以及怎么处理迟到数据。

**和实习相似是优势**：把自己的项目按「业务背景 → 数据链路 → 表设计 → 指标口径 → 遇到的问题」讲一遍，面试官很容易接话。

---
title: "保融 Java 笔试：5 道 SQL 加浮点数转中文大写"
company: "保融"
position: "Java 开发"
round: "笔试"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/8f453bbcd6fb4b92aa590cdb1eecc52f
tags: ["保融", "Java", "笔试", "SQL", "编程题"]
summary: "保融 Java 笔试记录：基本信息、Java 基础选择、5 道 SQL 编写题，最后一题是把浮点数转成中文大写的编程题，整体不难但时间只有 30 分钟。"
---

### 《面试题目》

1. 基本信息：个人情况和求职意愿。
2. 基础选择题：偏 Java 的通用八股。
3. Java 选择题：继承、常量池、浮点、引用、反射等。
4. SQL 题：5 道手写 SQL，涉及 select、join、where、in、and/or、group by、having、order by、desc、limit。
5. 编程题：把一串浮点数转换为中文大写，写出思路和代码。

### 《参考解析》

**5 道 SQL 基本把常用关键字考全了**。这类题的通用套路是：先确定要从哪几张表取数（from/join），再写过滤条件（where），需要聚合就 group by + having，最后 order by + limit 控制顺序和条数。多表题注意 left join 和 inner join 的语义差别——要保留主表全部记录就用 left join，并且把右表的过滤条件写在 on 里而不是 where 里，否则会退化成内连接。

**浮点数转中文大写的关键是分层处理**。先把数拆成整数部分和小数部分：整数部分按四位一节分组（个、万、亿），每节内部按千百十转换并补「零」；小数部分通常只保留两位，按角、分读。要注意连续零只读一个、末尾零不读、以及「壹拾」这类规范写法。边界上处理 0、负数、超过亿位的情况。

**时间紧的时候先拿稳客观题和 SQL**。编程题写不完也要把思路写清楚：数据结构怎么选、每个函数负责什么、特殊输入怎么处理。很多笔试是按步骤给分的，思路分往往比半截代码值钱。

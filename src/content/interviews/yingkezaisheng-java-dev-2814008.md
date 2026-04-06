---
title: 英科再生 Java开发面经
company: 英科再生
position: Java开发
date: '2026-03'
source: 牛客网
tags: ["Spring Security","JWT","Kafka","MySQL","Elasticsearch"]
summary: "英科再生Java开发面试题分享。面试重点围绕项目实战与核心中间件，涵盖Spring Security与JWT安全认证机制、Kafka底层原理及数据流向、MySQL存储架构优化、Elasticsearch搜索底层原理等高频面试考点。"
---

### 面试题目
1. 自我介绍，后面主要问项目和简历中的内容。
2. 项目中使用了Spring Security，为什么还要再使用JWT？
3. Kafka的底层细节，如何在项目中工作的，topic是什么，项目里有几个？
4. Mysql一个问题：修改数据库表某两行的顺序，底层会怎么改？
5. 前端比如要画一个图标，后端怎么把数据传给前端，传什么形式的数据？
6. Elasticsearch的底层原理，是怎么搜索的？

---

### 参考解析
1. **Spring Security与JWT配合**：Spring Security负责权限鉴权框架，JWT解决分布式系统无状态会话问题。JWT用于在客户端存储用户信息，减少服务器Session压力，实现跨域及前后端分离的认证。

2. **Kafka核心**：Kafka基于分区(Partition)实现高并发，通过日志追加写入保证顺序。Topic是逻辑分类，底层对应不同的物理分区文件。项目中使用需关注Offset偏移量管理及消费者组负载均衡。

3. **MySQL行顺序**：数据库表本质是B+树结构，物理存储无序。修改顺序通常通过添加排序字段(如order_id)并执行UPDATE语句，由MySQL根据B+树索引重新排序，不会改变底层存储物理行的绝对位置。

4. **数据传输**：后端通过RESTful API接口，将数据封装为JSON格式（如包含坐标、数值的数组或对象）传给前端。前端利用ECharts等库解析JSON中的字段进行渲染。

5. **Elasticsearch原理**：ES采用倒排索引(Inverted Index)技术，将文档分词并映射为“词项->文档ID”列表。搜索时先定位词项，再通过布隆过滤器和跳表高效检索对应的文档ID集合。
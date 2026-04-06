---
title: 西安天源迪科Java开发实习面经
company: 天源迪科
position: Java开发实习
date: '2026-03'
result: 已通过
base: 西安
source: 牛客网
tags: ["Java","MySQL","Redis","Spring Boot","消息队列"]
summary: "分享西安天源迪科Java开发实习面试经历。面试重点考察Java基础、Spring MVC与Spring Boot原理、MySQL优化及Redis缓存策略。同时详细探讨了秒杀系统实现方案、缓存击穿与穿透处理以及项目登录流程安全性设计，适合Java实习生备考参考。"
---

### 面试题目

1. 自我介绍

2. 八股：
   - Java基本数据类型
   - 进程与线程
   - 线程的唤起方式
   - Springmvc的mvc代表什么
   - String的长度是可变的吗
   - String buffer和string builder的区别
   - 常见的集合
   - Arraylist和linkedlist的区别
   - Set存放有序吗，可重复吗
   - Hashmap的key可以为null吗
   - Redis的优势
   - 经常改变的数据适合存redis吗
   - 面向对象三大特性
   - Mysql的优化
   - Spring的核心思想
   - Springboot的自动化配置原理
   - 用过哪些注解
   - 锁的种类

3. 项目：
   - 介绍一下第一个项目
   - 描述一下秒杀是怎么实现的
   - 缓存击穿与缓存穿透
   - 秒杀阻塞过程中，页面有什么样的提示
   - 消息队列
   - 介绍一下第二个项目
   - 登录流程描述
   - 传输过程中有没有对令牌加密

4. 反问

---

### 参考解析

- **Spring Boot自动化配置原理**：基于@EnableAutoConfiguration注解，通过SpringFactoriesLoader读取classpath下的META-INF/spring.factories配置文件，根据条件注解（@ConditionalOnClass等）判断是否加载相关配置类。
- **缓存击穿与穿透**：穿透是请求不存在的数据导致缓存库均未命中；击穿是热点Key过期导致瞬间流量压垮数据库。前者通常使用布隆过滤器或缓存空对象解决，后者通过互斥锁或逻辑过期解决。
- **String/StringBuilder/StringBuffer**：String是不可变的；StringBuffer线程安全但性能低，StringBuilder非线程安全但性能高。
- **HashMap key为null**：允许存储一个null作为Key，底层逻辑是将其固定定位在数组下标为0的位置。
- **秒杀系统实现**：核心在于削峰填谷，通常使用Redis预减库存+Lua脚本保证原子性，利用消息队列进行异步下单处理，防止数据库过载。
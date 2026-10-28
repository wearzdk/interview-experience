---
title: "某大厂 28 届日常实习二面：PostMapping 源码与二叉树公共祖先"
company: "某大厂"
position: "Java 后端实习"
round: "二面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/95b6eec89dca4195876986f1d0a6f08f
tags: ["Java","Spring","源码","二叉树","实习面试"]
summary: "28 届找日常实习的一场二面：不开摄像头、要求共享屏幕对着代码讲项目，追问 @PostMapping 为什么能把 URL 映射到方法上的源码，手撕二叉树公共祖先。"
---

### 《面试题目》

1. 你还在上学，怎么到岗？课程怎么办？
2. 共享屏幕跑项目，对着代码讲你的项目。
3. `@PostMapping` 有没有看过源码？为什么 URL 里写了就能到你的代码上来？
4. 一堆 Spring 源码相关的问题。
5. 手撕：二叉树的最近公共祖先。

### 《参考解析》

**@PostMapping 的链路**：注解本身只是元数据，`@PostMapping` 组合了 `@RequestMapping(method = POST)`。启动时 `RequestMappingHandlerMapping` 扫描所有 `@Controller`/`@RestController` 的 Bean，用 `RequestMappingHandlerMapping#detectHandlerMethods` 找出带注解的方法，解析出路径、方法、参数、produces/consumes，注册到 `MappingRegistry` 的 Map 里（按路径和条件索引）。请求进来后 `DispatcherServlet` 调 `HandlerMapping#getHandler`，用 `RequestContext`（路径、方法、头）匹配到 `HandlerMethod`，再交给 `RequestMappingHandlerAdapter` 反射调用。要能说到「映射在启动时建立、运行时按条件查表」，以及路径变量、通配符、精确匹配优先于模糊匹配。

**二叉树的最近公共祖先**：递归。当前节点为空或是 p/q 就返回当前节点；递归左右子树；如果左右都非空，当前节点就是 LCA；否则返回非空的那一侧。时间 O(n)，空间 O(h)（递归栈）。如果是 BST，可以用值的大小关系迭代下降，空间 O(1)。

**对着代码讲项目**：提前准备「入口—核心链路—数据流—异常处理」四条线，能说清每个类为什么这么拆；被问到不熟的源码，先讲你理解的机制和验证方法，别硬编。

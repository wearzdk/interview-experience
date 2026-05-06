---
title: 神州信息-Java开发岗面试题
company: 神州信息
position: Java开发
date: '2026-05'
result: 凉经
base: 北京
source: 牛客网
tags: ["Java","Redis","MySQL","消息队列","SpringCloud"]
summary: "神州信息Java开发岗面试题整理，涵盖线程池核心参数、HashMap底层实现、Redis缓存穿透与布隆过滤器、MySQL索引优化、RabbitMQ消息顺序性及Spring Cloud Alibaba组件原理等核心技术点，助你备考Java后端开发面试。"
---

### 面试题目
1. 项目拷打：项目中用到的线程池的核心参数
2. 项目中接口的幂等性如何做到的
3. 线程池的参数
4. JDK1.7与JDK1.8中的HashMap的变化
5. 索引的使用原则
6. 什么是回表
7. RabbitMQ与RocketMQ的区别
8. RabbitMQ如何保证消费的顺序性
9. @Transactional失效的场景
10. Socket与HTTP的区别
11. 分布式锁
12. Redis的数据类型
13. Redis缓存穿透的解决方式
14. 布隆过滤器的原理
15. 若Redis中缓存的空值过多怎么办？
16. Spring Cloud Alibaba的组件有哪些？
17. Spring Cloud OpenFeign的工作原理
18. Gateway网关的作用
19. 常见Linux命令：查询端口用哪个命令？若要通过PID查询端口如何操作？

---

### 参考解析

*   **线程池核心参数**：包括corePoolSize(核心线程数)、maximumPoolSize(最大线程数)、keepAliveTime(空闲存活时间)、unit(单位)、workQueue(任务队列)、threadFactory(线程工厂)、handler(拒绝策略)。
*   **JDK1.8 HashMap变化**：引入了红黑树，当链表长度超过8且数组长度超过64时转为红黑树，提升查询效率；同时扩容从头插法改为尾插法，解决了并发下的死循环问题。
*   **索引原则与回表**：最左前缀匹配、覆盖索引、避免在列上进行计算。回表指在二级索引树查到主键后，需回到聚簇索引树查找完整记录的过程。
*   **RabbitMQ顺序性**：通过将需要顺序处理的消息路由到同一个队列，并配置单消费者处理，或者使用分布式锁/分片策略来保证消息顺序。
*   **@Transactional失效场景**：方法被final/static修饰；方法为private；类未被Spring管理；在同一个类中被非事务方法直接调用；异常被try-catch捕获未抛出。
*   **Redis缓存穿透**：指查询不存在的数据导致直接压垮数据库。解决方法：缓存空值、使用布隆过滤器拦截、接口层校验（如ID合法性校验）。
*   **OpenFeign工作原理**：通过动态代理生成FeignClient接口实现类，解析注解构建HTTP请求模板，通过负载均衡组件选择服务实例，最终通过HttpClient或OkHttp发送请求。
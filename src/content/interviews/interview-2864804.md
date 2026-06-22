---
title: 面筋
company: 某互联网公司
position: 全栈开发工程师
date: '2026-06'
base: 北京
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2864804
tags: ["Java", "MySQL", "微服务", "Spring", "LLM", "算法"]
summary: "某互联网公司全栈开发工程师面经，考察Java、MySQL、微服务等核心知识点。包含真实面试题目与解析，适合准备全栈开发工程师面试的求职者参考备考。"
---

### 《面试题目》

1. 东莞 全栈开发偏agent

**现在用哪些技术栈**

**了解过pgsql吗**

**微服务接触过吗**
2. 挑一个自己的项目讲讲
3. （我讲了项目中的一个索引优化过程）
4. 精简字段后速度有提高吗

**用的什么索引**
5. 了解spring aop吗什么场景用aop
6. 项目中token鉴权用的是什么组件

**知道懒加载吗**

**JAVA反射知道吗**

**AI框架有了解吗**
7. Langchain有几个要素呢
8. 用过什么ai编程工具

**实习时间，到岗时间**

---

### 《参考解析》

1. **MySQL深度**：MySQL InnoDB使用B+树索引，支持ACID事务。关键知识点：聚簇索引（主键索引）叶节点存完整行数据；辅助索引叶节点存主键值（需回表）；MVCC通过undo log版本链+ReadView实现多版本并发控制，解决脏读/不可重复读；事务隔离级别从低到高：读未提交→读已提交→可重复读（默认）→串行化。

2. **Spring框架**：Spring IoC容器管理Bean生命周期，核心是依赖注入（DI）。AOP面向切面编程通过动态代理（JDK/CGLIB）实现横切关注点（日志/事务/权限）。Spring事务传播行为：REQUIRED（加入现有或新建）、REQUIRES_NEW（挂起当前，新建）、NESTED（嵌套事务）等。

3. **JVM与GC**：JVM内存模型：堆（对象分配，GC管理）、方法区（类信息、常量池）、虚拟机栈（栈帧/局部变量/操作数栈）、本地方法栈、程序计数器。GC算法：标记-清除（内存碎片）、标记-整理（无碎片，但移动对象）、复制（新生代）。G1按Region划分堆，预测停顿时间。

4. **RAG与大模型**：RAG（检索增强生成）流程：文档切片→向量化（Embedding）→存向量数据库→检索时将query向量化→TopK语义检索→将相关文档拼入prompt→LLM生成。优化：混合检索（语义+关键词）、重排序Rerank、查询改写、上下文压缩。评估：召回率（relevant docs retrieved/total relevant）、精确率、Answer相关性。

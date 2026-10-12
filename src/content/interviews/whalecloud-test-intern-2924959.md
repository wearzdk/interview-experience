---
title: "浩鲸科技测试实习生一面：SQL、Linux 与 TestNG 自动化实践"
company: 浩鲸科技
position: 测试实习生
round: 一面
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/0c79875ad38e4842b5ffeb2bdb9b7b58
tags: ["测试","自动化测试","TestNG","Selenium","SQL","Linux"]
summary: "浩鲸科技测试实习生一面面经（2026/10/12）：围绕测试工程实践展开，先考 SQL（查询所有不同班级中成绩及格的同学）与 Linux 常用指令，再深挖 TestNG 的引入方式与注解、依赖管理、Postman 接口测试经验、代码复用与用例失败重试的实现，以及元素定位失败的排查思路。"
---

### 《面试题目》

1. 做个自我介绍
2. MySQL 语句：查询出所有不同班级中成绩及格的同学有哪些？
3. Linux：你知道哪些 Linux 指令？查看文件内容的指令是什么？
4. 你是怎么将 TestNG 引入到项目中的（或者 TestNG 的注解）？怎么管理项目依赖？
5. 你使用 Postman 做过哪些接口测试？
6. 你是怎么实现代码复用的？
7. 怎么实现用例失败重试？
8. 如果元素定位失败报错了，有可能是什么原因造成的？
9. 我看你的测试项目都是基于 Java、Selenium、TestNG 展开的，那你了解 Python 吗？
10. 你有什么问题要问面试官？

### 《参考解析》

**那道 SQL 题考的是去重与条件过滤的组合。** 基本写法是 `SELECT DISTINCT s.name, s.class FROM student s JOIN score sc ON s.id = sc.student_id WHERE sc.score >= 60;`，如果「班级」要按班级维度去重统计则用 `GROUP BY`：`SELECT class, COUNT(DISTINCT student_id) FROM score ... GROUP BY class;`。要点：`DISTINCT` 作用于整行（多列时要写清语义）、`WHERE` 在分组前过滤而 `HAVING` 在分组后、及格线如果有多个科目要明确「所有科目都及格」还是「有任一科目及格」（前者用 `HAVING MIN(score) >= 60` 或 `NOT EXISTS` 反向判断）。面试时把边界条件问清楚，比直接写 SQL 更能体现测试思维。Linux 部分常答：`cat`/`less`/`head`/`tail -f` 看文件内容，`grep -rn` 搜索，`ps -ef`/`top` 看进程，`df -h`/`du -sh` 看磁盘，`ss -lntp` 看端口，`chmod`/`chown` 权限，`find` 查找文件，`tar` 打包，`scp` 传输。

**TestNG 的引入与依赖管理，答的是「工程化能力」。** Maven 项目在 `pom.xml` 里加 `org.testng:testng` 依赖（scope 通常为 test），配合 `maven-surefire-plugin` 执行，或在 `testng.xml` 里定义 suite/test/class/package 的层级与参数；Gradle 则是 `testImplementation 'org.testng:testng'`。常用注解：`@Test`（可配 `priority`、`enabled`、`expectedExceptions`、`dataProvider`）、`@BeforeSuite/@BeforeTest/@BeforeClass/@BeforeMethod` 与对应的 After 系列、`@DataProvider` 做参数化、`@Parameters` 读 testng.xml 传参、`@Listeners` 挂监听器。**依赖管理**的核心是「统一版本 + 传递依赖收敛」：父 POM 用 `dependencyManagement` 锁版本、避免不同模块引入冲突版本，必要时用 `exclusions` 排除传递依赖，CI 里固定镜像与离线仓库保证可重现。

**用例失败重试的实现，标准做法是监听器 + 重试分析器。** TestNG 实现 `IRetryAnalyzer`（`retry()` 返回 true 表示重跑），在 `@Test(retryAnalyzer = X.class)` 或全局通过 `IAnnotationTransformer` 挂上；同时用 `ITestListener`/`IReporter` 记录每次重试的结果，最终报告里要能区分「一次通过」和「重试后通过」，后者往往是**不稳定用例**（flaky），需要单独建台账跟踪根因，而不是靠重试掩盖。重试必须配次数上限与间隔，只对特定异常（网络抖动、环境未就绪）重试；对写操作（下单、支付）重试还可能造成重复副作用，需要幂等保护。

**元素定位失败的排查要形成清单。** 常见原因：页面还没加载完（要换显式等待 `WebDriverWait` 而不是 `sleep`）、元素在 iframe 里（需 `switchTo().frame`）、被新窗口/标签页打开（需切窗口句柄）、被弹窗或遮罩挡住、元素动态生成导致 id/class 每次变化、多个元素匹配到同一选择器（返回列表取下标）、元素不可见或不可点击（要滚动到可见区、或等动画结束）、以及 shadow DOM 隔离。**定位策略的优先级**：优先用稳定的业务属性（`data-testid`、`id`）而不是依赖 DOM 层级和样式类，并把选择器统一收敛到 Page Object 里，一处改动全局生效——这也正是「代码复用」问题想听的答案：PO 模式（页面对象封装元素与操作）、把公共步骤抽成基类或工具方法、用数据驱动（`@DataProvider` + 外部 Excel/YAML）把用例数据与逻辑分离、以及把前置/后置（登录、清理数据）放到 `@BeforeMethod` 或公共 fixture 中。

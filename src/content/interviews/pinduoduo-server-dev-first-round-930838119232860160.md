---
title: "拼多多服务端研发一面：ID 透传组件深挖与 MySQL 基础"
company: "拼多多"
position: "服务端研发"
round: "一面"
date: "2026-09"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/930838119232860160"
tags: ["服务端","Java","MySQL","线程安全","手撕代码","traceId","分页查询"]
summary: "拼多多服务端研发一面面经，约半小时：从简历项目切入深挖 ID 透传组件（异步任务为何断链、MDC 记录 traceId、快照与 finally 清理防串号）、CSV Reader 双重全量加载的高负载治理，随后考 MySQL 的 count 区别、去重统计、limit 分页与手撕电话号码的字母组合、线程安全判定。"
---

### 《面试题目》

1. 选择一个需求或项目深入展开讲一下
2. 简历里提到一个 ID 透传组件，这个异步任务断掉的原因是什么？
3. 你刚说的是用 log/MDC 记录 traceId 吗？还是其他方式？
4. 简历里写「实现线程上下文传递扩展组件，通过快照、MDC 包装与 finally 清理防串号」，这句话具体是什么意思？是指设置上下文吗？
5. 为什么要用 finally 做清理来防串号？
6. 生产环境高负载治理中，CSV Reader 双重全量加载是什么意思？后来怎么处理的？
7. 这个实例的内存大小是多少？是 2G 吗？CPU 配置是多少？
8. 项目里用的垃圾回收器是什么？
9. MySQL 中 `count(*)` 和 `count(某列)` 有什么区别？
10. 去重统计需要用到什么函数？
11. MySQL 分页使用什么？如果要每页 100 行，查第三页，limit 该怎么写？
12. 手撕题：电话号码的字母组合
13. 这段代码是线程安全的吗？判断一段代码是否线程安全，核心依据是什么？
14. 这段代码有竞争吗？按你刚才说的判断依据，StringBuilder 在多线程场景下会有竞争吗？

### 《参考解析》

**ID 透传为什么会断，以及为什么要 finally 清理**

traceId 这类链路标识通常放在 `ThreadLocal` 里，`MDC` 也是 `ThreadLocal<Map>` 的实现。同步调用没问题，一旦把任务交给线程池、`@Async`、`CompletableFuture` 或消息队列，执行线程换了，新线程的 `ThreadLocal` 是空的，日志里 traceId 就断了——这是「异步任务断链」的根本原因，不是日志配置问题。

正确的做法是「提交时快照 + 执行时还原 + 结束清理」：在**任务提交的那个线程**上把当前上下文（traceId、userId、租户等）快照出来，随任务一起带到线程池（Spring 里就是 `TaskDecorator` 包装 `Runnable`，或自己包一层 `Callable`，也可以用阿里的 `TransmittableThreadLocal` 让线程池自动传递）；任务真正执行前把快照写回执行线程的 `ThreadLocal`/`MDC`，执行完在 `finally` 里清掉。

`finally` 清理不是可有可无的收尾，而是防串号的必要条件：线程池的线程会被复用，如果上一个任务把 traceId 留在 `ThreadLocal` 里没清，下一个任务在还没设置新上下文之前（或某条路径漏设时）就会打印出上一个请求的 traceId 和 userId——日志串号还只是可观测性问题，如果透传的是用户/租户身份，那就是**上下文串号引发的越权风险**（ThreadLocal 复用导致的身份泄漏）。线上排查时这类问题的典型现象是「同一个 traceId 下出现两个不同用户的日志」。另外注意两点：快照要在提交时做，而不是执行时读取（执行时读到的已经是别的线程的上下文）；`InheritableThreadLocal` 只在 `new Thread` 时继承，对线程池无效，不能拿来当方案。

**CSV Reader 双重全量加载：峰值内存约为文件大小的两倍**

「双重全量」指的是先把整个文件读进内存（一个 `String` 或字节数组），再解析成一个全量 `List<对象>` 持有，两份数据同时存活，峰值内存约为文件大小的 2~3 倍（加上对象头和字符串膨胀）。高负载下直接后果是堆吃紧、GC 频率飙升、严重时 OOM，而且并发导入时这个倍数还会按并发数放大。

治理方向是**流式处理**：用 `BufferedReader`/OpenCSV/commons-csv 的迭代器或 EasyExcel 的 `ReadListener`，边读边按批处理（例如每 1000 行落库一次并清空缓存），全程只保留当前批次；配合限流（同时只允许 N 个导入任务）、给文件大小设上限、把大文件交给异步任务并暴露进度；JVM 侧确认堆大小与 GC（`-Xmx`、G1/ZGC）是否匹配峰值，并用 `jstat -gcutil`、堆 dump、压测数据来验证治理效果，而不是凭感觉。面试官接着追问「实例多大内存、什么 GC」，考的就是你有没有真的上过线看数据——回答要给出具体配置和依据，答不出来比答错更扣分。

**MySQL：count 的区别、去重与分页**

`count(*)` 统计结果集行数，InnoDB 会挑一棵最小的可用二级索引来扫，不读具体列值，`NULL` 也计入；`count(col)` 只统计该列**非 NULL** 的行数，所以两者结果可能不同（有 NULL 时 `count(col) < count(*)`）；`count(1)` 与 `count(*)` 在 InnoDB 里基本等价，优化器都按行数处理。去重统计用 `COUNT(DISTINCT col)`，多列组合去重写 `COUNT(DISTINCT a, b)`；如果是超大表只要近似值，可以用 HyperLogLog 一类的近似去重。

分页用 `LIMIT offset, size` 或 `LIMIT size OFFSET offset`，每页 100 行查第三页就是 `LIMIT 200, 100`（等价于 `LIMIT 100 OFFSET 200`）。深分页是常见追问：`LIMIT 1000000, 100` 要先扫并丢弃 100 万行，优化手段是**游标分页**（记住上一页最后一个 id，`WHERE id > ? ORDER BY id LIMIT 100`，前提是有序且不跳页）或**延迟关联**（先用覆盖索引子查询拿到主键，再 `JOIN` 回表取整行）。

**手撕：电话号码的字母组合**

经典回溯（也可以理解为按位做笛卡尔积）。数字到字母的映射固定，逐位扩展、到最后一位收集结果；空输入返回空列表。

```python
def letter_combinations(digits: str):
    if not digits:
        return []
    table = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
             "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
    res, path = [], []

    def dfs(i):
        if i == len(digits):
            res.append("".join(path))
            return
        for ch in table[digits[i]]:
            path.append(ch)
            dfs(i + 1)
            path.pop()

    dfs(0)
    return res
```

复杂度是结果数量级 `O(4^n · n)`（每位最多 4 个字母，n 为位数），空间是递归深度 `O(n)` 加结果本身。写的时候注意 `path.pop()` 回溯要成对出现，以及 `digits` 为空的边界。

**线程安全的判定依据**

判断标准只有一条主线：**是否存在被多个线程并发访问的共享可变状态，且访问路径没有同步**。展开成三要素就是原子性（读-改-写是否整体不可分割）、可见性（一个线程的写对另一个线程是否及时可见）、有序性（编译器和 CPU 的重排序会不会破坏依赖），对应 JMM 的 happens-before 规则。局部变量天然安全（各线程自己的栈帧，前提是不逃逸），不可变对象、`final` 字段安全发布、`ThreadLocal` 也都是免锁手段；共享可变状态则需要锁、`synchronized`/`ReentrantLock`、原子类或并发容器来兜。

回到 `StringBuilder`：它明确**不是线程安全的**（JDK 文档里写着 not thread-safe），内部 `char[] value` 和 `count` 的 `append`/扩容都是「读-改-写」且没有同步，多线程并发 `append` 会出现丢字符、数组越界或数据错乱；要共享就用 `StringBuffer`（方法级 `synchronized`）或加锁。但要注意面试官常设的陷阱：如果 `StringBuilder` 是方法内的局部变量、不逃逸、不被多线程共享，那段代码就是线程安全的——所以「这段代码线程安全吗」的正确答法是先看作用域和共享情况，再谈同步手段。

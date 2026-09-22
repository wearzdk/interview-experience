---
title: "帆软Java一面：单例、类加载与CPU100%定位"
company: 帆软
position: Java后端开发
round: 一面
date: 2026-09
source: 牛客网
tags: ["Java","单例模式","volatile","类加载","双亲委派","HashMap","快排"]
summary: "帆软Java后端一面面经。覆盖手写单例与volatile、类加载过程与双亲委派及如何破坏、CPU 100%的定位方法、HashMap结构与resize及并发问题、ConcurrentHashMap、乐观锁、快排退化与优化、摩尔投票及找出1/3的变形题。"
---

### 《面试题目》

1. 自我介绍与项目介绍。
2. 手写单例模式。
3. volatile 的作用是什么？如果不加可能会出现什么问题？
4. 单例模式里两个 if 的作用是什么？
5. 类的加载过程是什么？
6. 双亲委派机制是什么？
7. 怎么破坏双亲委派？
8. CPU 占用到了 100%，怎么定位？
9. HashMap 的结构是什么？resize 过程是怎样的？并发安全问题有哪些？
10. 介绍一下 ConcurrentHashMap。
11. 乐观锁是什么？
12. 快速排序会退化到 O(n²)，怎么避免？
13. 摩尔投票，以及一个变形：找出出现次数超过 1/3 的元素。

### 《参考解析》

**手写单例 + 两个 if + volatile**：标准答案是双重检查锁定（DCL）+ volatile：

```java
public class Singleton {
    private static volatile Singleton instance;   // volatile 不可省

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {                   // 第一个 if：避免每次加锁，提升性能
            synchronized (Singleton.class) {
                if (instance == null) {           // 第二个 if：防止多线程重复创建
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

两个 `if` 的分工：外层 `if` 是快速路径——实例创建后所有调用都不必进同步块，避免每次 `getInstance()` 都付出锁的开销；内层 `if` 是正确性保证——A、B 两个线程同时通过外层判断，A 拿到锁创建完实例释放锁，B 再拿到锁时若不复查就会又创建一个新对象，破坏单例。volatile 的必要性在于 `new Singleton()` 不是原子的，字节码分三步：分配内存 → 初始化对象 → 把引用赋给 `instance`。JIT 与 CPU 可能把第 2、3 步重排序，此时另一个线程在外层 `if` 看到 `instance != null` 就返回，拿到的是一个「引用已可见但字段还是默认值」的半成品对象。volatile 通过插入内存屏障禁止这种重排序，同时保证可见性。回答时最好补上更简洁的替代方案：静态内部类（类加载机制保证线程安全且懒加载）、枚举单例（《Effective Java》推荐，天然防反射与反序列化破坏），以及反射/反序列化如何破坏单例、怎么防（私有构造里判断、`readResolve`）。

**volatile 的作用与不加的后果**：volatile 提供可见性与有序性（禁止指令重排序、插入内存屏障），但不保证原子性——`i++` 这种「读-改-写」复合操作加 volatile 依然会丢更新，要原子性得用 `synchronized`、`AtomicInteger`/`LongAdder` 或锁。不加 volatile 的典型后果有三类：一是可见性问题，一个线程改了标志位，另一个线程因为工作内存副本没刷新而一直在循环里出不来（经典 `while(!flag)` 死循环，加上 volatile 或 `synchronized` 才能退出）；二是 DCL 单例的半初始化对象问题；三是依赖「写在前面的操作对后续读可见」的场景失效。配套概念：`synchronized` 与 `Lock` 既保证可见性也保证原子性；`final` 字段有特殊的初始化安全保证；`happens-before` 规则（程序顺序、监视器锁、volatile 写读、线程启动/终止、传递性）是解释这些现象的底层依据。

**类的加载过程**：五个阶段——加载（通过类的全限定名把字节码读入，生成方法区中的运行时数据结构与堆中的 `Class` 对象）、验证（文件格式、元数据、字节码、符号引用验证，防止恶意字节码）、准备（为静态变量分配内存并设零值，`static int a = 10` 此时是 0；`static final` 常量在编译期就进了常量池，准备阶段直接赋终值）、解析（把常量池的符号引用替换为直接引用，可在首次使用时惰性进行）、初始化（执行 `<clinit>`，也就是静态变量赋值与静态代码块，按源码顺序执行，父类先于子类）。触发初始化的时机（主动引用）：`new`、访问静态字段/静态方法、反射、初始化子类时父类先初始化、作为启动类（含 `main`）。之后对象才谈得上实例化（分配内存、零值、设置对象头、执行 `<init>`）。类加载器层次是 Bootstrap（加载 `java.lang.*` 等核心类）→ Extension/Platform → Application（classpath）→ 自定义加载器。

**双亲委派与如何破坏**：双亲委派是「收到加载请求先委派给父加载器，父加载器加载不了才自己加载」。它保证核心类库不被篡改（你自己写一个 `java.lang.String` 也无法被加载，因为会一路委派到 Bootstrap），并避免同一个类被不同加载器重复加载（同一个类 = 类加载器 + 全限定名，不同加载器加载的同名类互不兼容，强转会抛 `ClassCastException`）。破坏方式有三类：① 重写 `loadClass` 方法——不再先委派，典型是 Tomcat 的 WebAppClassLoader，为了 Web 应用之间隔离以及优先加载应用自己的类（先自己找、找不到再委派），这也是「同一个 Tomcat 里不同应用可以带不同版本同名库」的原理；② 线程上下文类加载器（`Thread.currentThread().setContextClassLoader`）——父加载器要调用子加载器才能拿到的实现类时用它，SPI（JDBC 的 `DriverManager` 加载各厂商 Driver）就是典型；③ 模块化/热部署场景——OSGi、Spring Boot 的 `LaunchedURLClassLoader` 以及各种热更新框架自定义加载器，用于加载外部 jar 或实现类的重新加载（旧的 ClassLoader 被丢弃以便卸载类）。回答时把「为什么需要委派」与「什么场景必须打破它」讲清楚，比背三种方式更有价值。

**CPU 100% 的定位步骤**：① 先找到进程：`top`（`-c` 看命令行）或 `ps -ef`，确认是哪个 Java 进程，排除是别的进程在吃 CPU。② 找到线程：`top -Hp <pid>` 按 CPU 排序拿到最耗 CPU 的线程 ID（TID），或 `ps -mp <pid> -o THREAD,tid,time | sort -k2 -r`。③ 把 TID 转成十六进制：`printf '%x\n' <tid>`（jstack 输出里是十六进制 nid）。④ 抓线程栈：`jstack <pid> > /tmp/jstack.log`（线上注意 `-F` 强制导出会暂停，谨慎使用），在文件里搜 `nid=0x<hex>` 定位到具体线程与调用栈；多次采样（间隔几秒各抓一次）能区分「长时间计算」与「死循环」，也能看清热点方法。⑤ 辅助工具：`jstat -gcutil <pid> 1000` 看 GC 是否频繁、老年代是否持续增长（GC 线程吃 CPU 常见于内存泄漏导致 Full GC 不断）；`arthas` 的 `thread -n 3`（直接列出最忙线程及栈）、`profiler start` 火焰图定位热点；`jcmd <pid> Thread.print`、`jmap -histo:live` 看对象分布。常见根因清单：死循环或正则回溯爆炸、频繁 Full GC（内存泄漏/堆太小）、大量线程上下文切换与锁竞争（自旋）、频繁日志与序列化、加密/压缩等 CPU 密集任务被打到请求线程、以及外部依赖超时后的重试风暴。定位到代码后，修复方案通常是加缓存、拆分计算、异步化、限流或者修正内存泄漏。

**HashMap 的结构、resize 与并发问题**：结构是「数组 + 链表 + 红黑树」：JDK 8 起当链表长度达到 8 且数组容量达到 64 时把该桶转成红黑树（否则先扩容），树节点数降到 6 以下退化为链表。哈希扰动是 `h ^ (h >>> 16)`，用高 16 位参与低位运算减少碰撞；索引是 `(n - 1) & hash`，所以容量必须是 2 的幂。扩容（resize）在 `size > capacity * loadFactor`（默认 0.75）时触发，容量翻倍，JDK 8 用高低位拆分（`hash & oldCap` 为 0 留在原位置，否则移到 `原索引 + oldCap`）避免重新计算哈希，元素顺序在 JDK 8 中保持相对稳定（JDK 7 的头插法会逆序，这正是并发扩容死循环的成因）。树化阈值 8 的依据是泊松分布——正常散列下链表长度到 8 的概率约亿分之六。并发安全问题：一是 JDK 7 头插法在并发扩容时可能形成环形链表，导致 `get` 死循环打满 CPU；二是并发 `put` 可能互相覆盖导致数据丢失；三是 `size` 计数不准；四是 JDK 8 虽然修掉了死循环，但并发下仍可能丢数据或树化过程出错。因此多线程环境必须用 `ConcurrentHashMap`，或者用 `Collections.synchronizedMap`（全表锁，性能差）。

**ConcurrentHashMap**：JDK 7 是「分段锁 Segment（继承 ReentrantLock）+ HashEntry 数组」，默认 16 段，理论上支持 16 个线程并发写；JDK 8 改成「CAS + synchronized 锁单个桶头节点」，锁粒度细化到一个数组槽，并发度等于桶数量，同时引入红黑树优化长链表。关键机制：`put` 时若目标桶为空用 CAS 直接写入，非空则 `synchronized` 锁住头节点再插；`size` 用 `baseCount` + `CounterCell[]` 分治计数（借鉴 LongAdder）避免热点；扩容支持多线程协同迁移（`transfer` / `helpTransfer`），每个线程认领一段桶区间。读操作（`get`）基本无锁，靠 `volatile` 保证节点可见性（Node 的 `val` 与 `next` 是 volatile）。与 Hashtable 的对比很能说明问题：Hashtable 用 `synchronized` 方法锁整表，并发度 1；CHM 锁粒度更细且读不加锁。注意 CHM 不允许 null 键值（因为并发下无法区分「不存在」与「值为 null」，而 `get` 返回 null 会有歧义），以及复合操作（`get` 后 `put`）不是原子的，要用 `putIfAbsent`/`computeIfAbsent`/`merge` 等原子方法，且 `size()` 在并发下是近似值。

**乐观锁**：乐观锁假设冲突少，不做加锁而是「提交时校验数据没被别人改过」，典型实现是版本号或 CAS。数据库层面：表加 `version` 字段，更新时 `UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?`，影响行数为 0 表示冲突需重试；也可以用时间戳或状态字段做校验。Java 层面：`AtomicInteger` 的 `compareAndSet` 基于 `Unsafe` 的 CAS 指令加上自旋。乐观锁的优点是并发下无阻塞、不持有锁、适合读多写少；缺点是冲突多时重试成本高（还可能导致 CPU 空转）、需要处理 ABA 问题（用 `AtomicStampedReference` 加版本戳）。与悲观锁（`SELECT ... FOR UPDATE`、`synchronized`）的选型口诀：冲突概率低用乐观锁、冲突高或临界区长用悲观锁。分布式场景下乐观锁常与唯一约束、幂等键组合使用来替代分布式锁。

**快排退化与优化**：快排最坏 `O(n²)` 出现在每次分区都极度不平衡时——数组已经有序或逆序、且固定取第一个或最后一个元素作为 pivot，此时每轮只确定一个元素的位置，递归深度退化为 `n`。避免手段：① 随机化 pivot（`random.nextInt(l, r)` 后与首元素交换），把「构造出最坏输入」的概率降到可忽略，期望复杂度 `O(n log n)`；② 三数取中（取左中右三个位置的中位数），对近乎有序的数据效果好；③ 三路划分（荷兰国旗问题，把数组分成 `< pivot`、`= pivot`、`> pivot` 三段），大量重复元素时不会退化，这也是为什么工程实现偏爱三路快排；④ 小区间改用插入排序（阈值一般 8~16），减少递归开销；⑤ 尾递归优化或手动用栈，把递归深度控制在 `O(log n)` 内防栈溢出；⑥ 工程上直接对基本类型用双轴快排（Java `Arrays.sort`）、对象用 Timsort（稳定且对部分有序数据接近 `O(n)`），或者干脆用堆排序保证最坏 `O(n log n)` 并配合内省排序（introsort：快排递归过深就切堆排）。要能顺口说明「快排为什么平均最快」：原地、常数小、缓存友好。

**摩尔投票与 1/3 变形**：基础题的直觉是「不同元素两两抵消」——维护一个候选 `cand` 与计数 `count`，遇到相同元素 `count++`，不同则 `count--`，`count` 归零时换候选。遍历一遍后 `cand` 就是出现次数超过 `n/2` 的元素（若题目不保证存在，需要第二遍验证计数）。变形「找出出现次数超过 `n/3` 的元素」的结论是：这样的元素最多只有 2 个，所以维护两个候选与两个计数即可；在抵消时要注意「先判断是否等于某个候选再考虑抵消」的顺序，避免候选互相抵消掉：

```python
def majority_third(nums):
    cand1 = cand2 = None
    cnt1 = cnt2 = 0
    for x in nums:
        if cand1 == x: cnt1 += 1
        elif cand2 == x: cnt2 += 1
        elif cnt1 == 0: cand1, cnt1 = x, 1
        elif cnt2 == 0: cand2, cnt2 = x, 1
        else: cnt1 -= 1; cnt2 -= 1
    # 不保证存在时必须复验
    res = []
    for c in (cand1, cand2):
        if c is not None and nums.count(c) > len(nums) // 3:
            res.append(c)
    return res
```

一般化结论是「找出出现次数超过 `n/k` 的元素」最多有 `k-1` 个，维护 `k-1` 组候选与计数即可，时间 `O(n·k)`、空间 `O(k)`。面试官通常还会追问「为什么必须复验」以及「如果保证一定存在，能否省掉复验」，答清「抵消只是筛出候选，不保证票数过半」即可。

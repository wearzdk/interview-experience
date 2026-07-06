---
title: 携程暑期实习Java一面面经
company: 携程
position: Java后端开发（暑期实习）
round: 一面
date: '2026-03'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2865892
tags: ["Java","JVM","线程池","MySQL","HashMap"]
summary: "携程暑期实习Java一面面经，围绕项目深挖缓存穿透/雪崩/击穿、多级缓存节点数据一致性、ThreadLocal内存泄露原理，以及HashMap与ArrayList扩容时机差异等JVM与并发核心考点。"
---

### 《面试题目》

1. 缓存穿透、雪崩、击穿
2. 二级缓存不同节点数据一致性问题？
3. ThreadLocal 内存泄露问题
4. 子线程如何访问父线程的 ThreadLocal 值
5. 线程池工作原理
6. 阻塞队列使用 LinkedBlockingQueue 的问题，为什么？OOM 发生在哪个区域？
7. 针对线下点餐和线上点餐服务，线程池如何设置参数
8. OOM 发生在 JVM 的哪个区域？举例说明
9. 项目中如何防止无限的递归调用
10. MySQL 索引失效
11. HashMap put 过程，扩容原理，为什么在 put 之后检查扩容
12. ArrayList 为什么是在添加之前扩容？
13. ArrayList 在并发添加元素时会出现什么问题

---

### 《参考解析》

1. **ThreadLocal 内存泄露原理**：ThreadLocal 的 Entry 是弱引用指向 ThreadLocalMap 的 key（即 ThreadLocal 实例本身），但 value 是强引用；当 ThreadLocal 实例被回收后，key 变为 null，但对应 value 仍被 Entry 强引用无法回收，如果线程长期存活（如线程池中的线程），就会导致 value 对象持续累积造成内存泄露，因此使用完 ThreadLocal 后应主动调用 `remove()`。
2. **子线程访问父线程 ThreadLocal 值**：普通 ThreadLocal 是线程隔离的，子线程无法直接访问父线程设置的值；需要使用 `InheritableThreadLocal`，它会在子线程创建时把父线程的值拷贝一份到子线程自己的 ThreadLocalMap 中（但线程池复用场景下会失效，需要用阿里开源的 `TransmittableThreadLocal` 解决）。
3. **HashMap vs ArrayList 扩容时机**：HashMap 是先插入元素、再判断 `size > threshold` 触发扩容（懒扩容，因为插入前不确定是否会造成哈希冲突超阈值）；ArrayList 是先判断容量是否足够、不足则先扩容再插入元素（因为数组必须先有足够空间才能存放新元素，不能像链表那样先挂上去再处理）。
4. **ArrayList 并发添加问题**：ArrayList 不是线程安全的，多线程并发 `add()` 时可能出现：`modCount` 检查失败抛出 `ConcurrentModificationException`、元素覆盖丢失（多个线程同时写入同一 `size` 位置）、甚至数组越界异常，解决方案包括使用 `Collections.synchronizedList()`、`CopyOnWriteArrayList` 或加锁。

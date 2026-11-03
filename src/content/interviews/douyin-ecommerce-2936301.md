---
title: "抖音电商一面：只聊了实习，手撕 LRU 缓存"
company: "字节跳动"
position: "电商业务（岗位未注明）"
round: "一面"
date: "2026-11"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/feed/main/detail/349ad96365534d85a9a64148fd721f7a"
tags: ["字节跳动", "抖音电商", "后端开发", "LRU", "手撕代码", "数据结构"]
summary: "抖音电商一面记录：开场只简单问了实习，项目没有追问（面试官觉得简历项目太烂大街），随后直接手撕 LRU 缓存；整场偏短，被候选人视作 KPI 面。"
---

### 《面试题目》

1. 简单讲讲你的实习经历。
2. 手撕：实现一个 LRU 缓存。

### 《参考解析》

**LRU 的写法。** `get` 和 `put` 都要 O(1)，所以结构固定是「哈希表 + 双向链表」：哈希表存 `key → 节点指针` 用于定位，双向链表按访问时间排序，头部最新、尾部最旧。

```python
class Node:
    __slots__ = ("k", "v", "prev", "next")
    def __init__(self, k=0, v=0):
        self.k, self.v, self.prev, self.next = k, v, None, None

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}
        self.head, self.tail = Node(), Node()   # 哨兵，省掉所有空指针判断
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, node):
        node.prev.next, node.next.prev = node.prev, node.next

    def _add_front(self, node):
        node.next, node.prev = self.head.next, self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        if key not in self.map:
            return -1
        node = self.map[key]
        self._remove(node)
        self._add_front(node)
        return node.v

    def put(self, key, value):
        if key in self.map:                     # 已存在：更新值并前置，不能新建节点
            node = self.map[key]
            node.v = value
            self._remove(node)
            self._add_front(node)
            return
        node = Node(key, value)
        self.map[key] = node
        self._add_front(node)
        if len(self.map) > self.cap:            # 超容：摘掉尾部真实节点
            old = self.tail.prev
            self._remove(old)
            del self.map[old.k]
```

伪代码级的关键点就三条：访问后把节点移到头部、写入已存在的 key 时是更新不是新增、超容删尾并同步删哈希表。有哨兵头尾能省掉一堆 `if node.prev is None` 的判断，这是手写时最容易漏、也最能体现基本功的地方。

**常见坑。** ① `capacity` 为 0 或 1 的边界，容量 0 时 `put` 不能留下任何元素，写测试用例时要专门覆盖；② 只改链表不删哈希表（或反过来），内存泄漏且 `get` 会命中已淘汰的节点；③ `res.append` 之外的另一类引用错误——把节点对象直接返回给调用方，调用方改了就破坏结构，工程里应返回值而不是节点；④ 双链表摘链时先存 `prev`/`next` 再改指针，顺序写错会把自己指成环；⑤ 手写时忘了 `__slots__` 或用了 `dict` 做链表，复杂度掉到 O(n)。写完主动报「时间 O(1)，空间 O(capacity)」并口述三个用例，能省下面试官挑刺的时间。

**语言与工程延伸。** Java 可以用 `LinkedHashMap` 的 `accessOrder=true` 加 `removeEldestEntry` 十行写完，但面试要的是手写，提一句「知道标准库有现成的」即可；生产环境要考虑线程安全，常见做法是 `ConcurrentHashMap` 加分段锁，或直接用 Caffeine 这类带 W-TinyLFU 的库。Redis 的 LRU 是近似实现——采样若干个 key 淘汰最久未用的，换来内存开销可控，这个取舍值得在答完题后补一句。如果面试官继续问「怎么加过期时间」，答案是在节点里存 `expireAt`，`get` 时惰性删除，再加一个定时任务或 Redis 那样的定期抽样清理。

**遇到疑似 KPI 面怎么办。** 流程短、问题浅的时候，能控的只有自己：把手上这道题写到无懈可击（边界、异常、复杂度、测试用例全说到），再主动往深处引一两句（并发、淘汰策略、命中率统计），把二十分钟的面谈撑成有效信号。面试官不深挖项目，往往是简历项目同质化太高——下次准备时换一个「有真实数据、有你独立决策、有踩坑」的项目讲，比换一家公司更有效。

---
title: 广东用友软件Java后端面经
company: 用友软件（广东）
position: Java后端开发工程师
base: 珠海
result: OC
date: '2026-05'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/887289430094934016
tags: ["Java集合","Arrays.asList","面试基础"]
summary: "广东用友软件Java后端面经，围绕数组与List相互转换时底层数据共享关系的细节问题深挖，最终顺利拿到OC。"
---

### 《面试题目》

1. 自我介绍
2. 如何实现数组和 List 之间的相互转换？
3. 用 `Arrays.asList` 转换 List 后，如果修改了原数组的内容，List 会受影响吗？
4. 用 List 的 `toArray` 转换为数组后，如果修改了 List 的内容，数组会受影响吗？

---

### 《参考解析》

1. **`Arrays.asList` 转换的底层原理**：`Arrays.asList` 返回的并不是 `java.util.ArrayList`，而是 `Arrays` 类内部的一个私有内部类 `Arrays.ArrayList`，它的构造函数直接持有传入数组的引用而非拷贝，因此修改原数组内容会同步反映到这个 List 上；同时该内部类没有实现 `add`/`remove` 方法（继承自 `AbstractList` 的默认实现会抛异常），所以返回的 List 是固定大小、不可增删的。
2. **`List.toArray()` 转换的原理**：`toArray()` 方法内部会创建一份新的数组并把 List 中的元素值逐一拷贝进去，返回的数组和原 List 之间不再有引用关系，因此后续修改 List 的内容不会影响到已经生成的数组，反之亦然。

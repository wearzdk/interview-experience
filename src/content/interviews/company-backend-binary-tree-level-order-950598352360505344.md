---
title: "面试手撕二叉树层序遍历：代码实现与常见变形题"
company: "某公司"
position: "后端开发"
date: '2026-11'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/950598352360505344
tags: ["算法","二叉树","BFS","层序遍历","手撕代码"]
summary: "二叉树层序遍历的手撕要点与变形题整理：按层分组的 BFS 模板、如何用队列长度区分层级、之字形遍历、右视图、最大宽度、每层平均值与自底向上输出，附常见写错的地方与复杂度分析。"
---

### 《面试题目》

1. 手写二叉树的层序遍历，要求返回按层分组的节点值。
2. 只用队列、不用额外分隔符，怎么知道当前处理到了第几层？
3. 之字形层序遍历：第一层从左到右，第二层从右到左，依次交替，怎么写？
4. 二叉树的右视图：输出从右侧能看到的每一层第一个节点。
5. 二叉树的最大宽度：把空节点也算进位置，求任意一层最左与最右非空节点之间的距离。
6. 求二叉树每一层的平均值。
7. 求二叉树的最小深度。
8. 自底向上的层序遍历：按层从叶子到根输出。
9. 层序遍历与深度优先遍历分别适合什么场景？各有什么代价？

### 《参考解析》

**基础模板：队列 + 每层长度快照。** 层序遍历的骨架是 BFS：根节点入队，每次取出队首、把左右孩子入队。要按层分组，关键是在进入内层循环前把当前队列长度存下来，这个长度就是本层节点数；循环结束后队列里正好是下一层的全部节点。不要在循环条件里直接写 `queue.size()`，它每轮都在变。

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Deque<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();          // 本层节点数，必须先固定
        List<Integer> level = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        res.add(level);
    }
    return res;
}
```

时间复杂度 O(n)，每个节点进出队各一次；空间复杂度 O(w)，w 为树的最大宽度，完全二叉树最后一层约为 n/2，所以最坏是 O(n)。递归写法用 DFS 带深度参数也能做，但对层序语义不直观，面试手撕优先写 BFS。

**之字形遍历**：在基础模板上加一个层号，偶数层正常收集，奇数层把本层结果反转，或者用双端队列按方向头插/尾插。反转写法更短，代价是每层多一次 O(k) 操作，整体仍是 O(n)。注意别在遍历过程中改变队列顺序，方向只影响结果收集。

```java
for (int level = 0; !queue.isEmpty(); level++) {
    int size = queue.size();
    LinkedList<Integer> cur = new LinkedList<>();
    for (int i = 0; i < size; i++) {
        TreeNode node = queue.poll();
        if (level % 2 == 0) cur.addLast(node.val);
        else cur.addFirst(node.val);
        if (node.left != null) queue.offer(node.left);
        if (node.right != null) queue.offer(node.right);
    }
    res.add(cur);
}
```

**右视图**：每层最后一个节点就是右侧能看到的节点，在基础模板的内层循环里判断 `i == size - 1` 时收集即可。左视图同理取第一个。不要用「一直往右走」的写法，右侧被挡住时答案会错。

**最大宽度**：这一题的关键是把节点在完全二叉树中的位置编号带进队列（根为 0，左孩子 `2i+1`，右孩子 `2i+2`），每层用「最后一个编号 − 第一个编号 + 1」计算宽度。编号会随深度指数增长，用 `long` 或每层减去本层最小下标来避免溢出。空节点不入队，但编号要按完全二叉树的位置算，否则宽度会算小。

**每层平均值**：在基础模板里对本层求和再除以 size，注意用浮点除法，节点值可能为负。**最小深度**：层序遍历第一次遇到叶子节点时返回当前层号加一，比递归写法更直观，也能提前结束。**自底向上**：正常层序收集后把结果列表反转，或每层结果插入到列表头部（`res.add(0, level)`，链表结构下更合适）。

**常见写错的地方**：进入内层循环前忘了缓存 size；把 `null` 孩子也入队导致空指针或层数错乱；在之字形里先反转队列而不是结果；最大宽度用 `int` 编号溢出；空树没有单独判断。手撕时先把边界（空树、单节点、只有左子树、完全二叉树）在纸上过一遍，再落笔。

**BFS 与 DFS 的取舍**：BFS 适合按层聚合、最短路径、第一次遇到目标即返回的场景，代价是队列可能很宽；DFS 适合路径、回溯、树形 DP，空间只与树高有关。层序相关的题优先 BFS，但涉及「每层内部还要做复杂状态合并」时，带深度的 DFS 反而更好写。

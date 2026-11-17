---
title: "虾皮 11 月 15 日机考笔试：恰好 t 种数字的子数组与迷宫不可达格数"
company: 虾皮
position: 软件开发
round: 笔试
date: '2026-11'
collectedAt: '2026-11-18'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/952385652383936512
tags: ["虾皮","笔试","滑动窗口","容斥","BFS","算法","机考"]
summary: "虾皮 2026 年 11 月 15 日机考的两道编程题：第一题统计「恰好包含 t 种不同数字」的连续子数组个数，输入规模 2×10^4，做法是「至多 k 种」的滑动窗口加容斥；第二题在 m×m 的 0/1 迷宫里统计从左上角出发走不到的格子数（含墙格），m 最大 1000，做一次 BFS 后总数减可达数即可。原文在第二题的解析处被服务端截断，这里补全解法。"
---

### 《面试题目》

**第 1 题：兵种混编子数组统计**

候选人列表为 `a`，每个数字对应不同的兵种，求有多少个连续子数组恰好包含 `t` 种不同数字。

输入只有一行：开头是整数 `t`，后面紧跟整数数组 `a`，两段之间用一个英文逗号隔开。数组长度为 `m`，`1 ≤ t ≤ m ≤ 2×10^4`，`1 ≤ a_i ≤ m`。输出一个整数，表示满足条件的连续子数组个数。

样例输入：

```text
2,[4,4,4,4,1,2]
```

样例输出：`5`。满足条件的子数组是 `[4,4,4,4,1]`、`[4,4,4,1]`、`[4,4,1]`、`[4,1]`、`[1,2]`。

**第 2 题：迷宫不可达格数**

迷宫用 `m × m` 的矩阵表示，`0` 表示可以到达的区域，`1` 表示不可到达的区域。从起点 `a[0][0]` 出发，只能上下左右移动，统计走不到的格子数，包括墙格与被墙隔开的空格。`1 ≤ m ≤ 10^3`，保证 `a[0][0] = 0`。

样例输入：

```text
[[0,0,1,0,0],[0,0,1,0,0],[0,0,1,1,1],[0,0,0,0,0],[1,1,0,0,0]]
```

样例输出：`11`。墙格 7 个，加上被隔开的空格 `a[0][3]`、`a[0][4]`、`a[1][3]`、`a[1][4]` 共 4 个。

### 《参考解析》

**第 1 题的关键是「恰好 k 种」不单调，「至多 k 种」单调**。固定右端点 `r`，随着左端点向右移动，窗口内不同元素的个数只减不增，所以合法的左端点是一段后缀。用滑动窗口可以在 O(n) 内算出「不同元素个数不超过 k」的子数组数，记作 `atMost(k)`；再做容斥，恰好 k 种就是 `atMost(k) - atMost(k-1)`。左指针最多右移 n 次、右指针扫一遍，哈希表操作均摊 O(1)，总时间 O(n)，空间 O(k)。

```python
import re
import sys

def at_most(nums, limit):
    if limit <= 0:
        return 0
    freq = {}
    left = 0
    distinct = 0
    total = 0
    for right, value in enumerate(nums):
        freq[value] = freq.get(value, 0) + 1
        if freq[value] == 1:
            distinct += 1
        while distinct > limit:
            old = nums[left]
            freq[old] -= 1
            if freq[old] == 0:
                distinct -= 1
            left += 1
        total += right - left + 1
    return total

data = list(map(int, re.findall(r"\d+", sys.stdin.read())))
t, nums = data[0], data[1:]
print(at_most(nums, t) - at_most(nums, t - 1))
```

实现细节：输入是 `t,[...]` 这种带方括号与逗号的格式，最省事的是用正则抽出全部整数，第一个是 `t`，其余是数组；`t = 1` 时 `atMost(0)` 返回 0，容斥仍然成立；计数用 64 位整数（Python 无需关心）。不要枚举左右端点，O(n²) 在 2×10^4 下大约 4×10^8 次操作，会超时。

**第 2 题是一次连通性遍历**。把每个格子看成图上的点，上下左右相邻的格子连边，值为 1 的格子不能站上去，相当于从图中删掉；从 `(0,0)` 做一次 BFS，能访问到的就是所有可达格。答案等于总格数 `m*m` 减去可达格数——墙格从未入队，被墙围住的空地也进不来，两类都自然被计入不可达。

```python
from collections import deque

def unreachable(grid):
    m = len(grid)
    seen = [[False] * m for _ in range(m)]
    seen[0][0] = True
    q = deque([(0, 0)])
    reached = 1
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < m and 0 <= ny < m and not seen[nx][ny] and grid[nx][ny] == 0:
                seen[nx][ny] = True
                reached += 1
                q.append((nx, ny))
    return m * m - reached
```

`m` 最大 1000，格子数 10^6，BFS 的 O(m²) 时间与空间都可以接受。两个容易踩的坑：① 用递归 DFS 在 10^6 个格子的链状路径上会爆栈，改成显式栈或 BFS；② 输入是二维数组字面量，按行读进来后要正确解析，别把方括号与逗号当成数据。

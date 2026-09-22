---
title: "迅雷测试岗笔试：连续超时告警编程题"
company: "迅雷"
position: "测试开发"
round: "笔试"
date: "2026-09"
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/931692144220176384"
tags: ["测试开发", "笔试题", "算法题", "SQL 索引", "Python", "B+Tree", "字符串处理"]
summary: "迅雷测试岗笔试真题复盘，题型含选择题、SQL 索引机制问答、Python 字典与列表问答，编程题是「连续超时告警」模拟题，需按日志顺序维护消息状态并按连续超时数输出 YES/NO。"
---

### 《面试题目》

**题型**

1. 选择题：不定项选择，基本以测试基础为主。
2. 问答题：SQL 查询（索引机制）。
3. 问答题（选做）：Python 字典与 List。

**编程题：连续超时告警**

4. 顺序读取日志，维护所有消息的实时状态，每遇到一条 `QUERY`，输出 `YES` 告警 / `NO` 不告警。要求实现完整可执行程序。

日志操作：

1. `POST t`：发送新消息，ID 从 1 递增，发送时刻为 `t`。
2. `DONE k`：第 k 条消息已收到确认。
3. `QUERY T D`：假定当前时刻为 `T`，等待上限为 `D`，判定是否告警。

告警规则：对已发出消息编号 1~n，执行 `QUERY T D` 时按消息号从小到大扫描，维护 `streak`（初始 0）：

- 已确认：`streak = 0`
- 未确认且 `T - D >= 发送时刻`：`streak += 1`
- 未确认且 `T - D < 发送时刻`：`streak` 不变

若 `streak >= 5` 输出 `YES`，否则输出 `NO`。注意统计的是**连续**超时未确认的消息数，而不是总超时数。

样例输入：

```
8
POST 0
POST 1000
POST 2000
POST 3000
POST 4000
QUERY 5000 1000
DONE 3
QUERY 6000 1000
```

样例输出：

```
QUERY 5000 1000 YES
QUERY 6000 1000 NO
```

### 《参考解析》

**先读懂「连续」这两个字**

规则里最容易看错的一点是：**「未确认但还没超时」的消息不重置 streak**，只有「已确认」才清零。所以 streak 不是「最后几条连续超时」，也不能用滑动窗口去数尾部连续段——扫描过程中夹在中间的那些「未超时」消息只是不计数，并不会把计数打断。

**关键等价：streak 等于最后一次 DONE 之后超时消息的条数**

设 `maxConf` 为所有已 `DONE` 的消息编号的最大值。编号 `1..maxConf` 的区间里，扫到 `maxConf` 时 streak 必然被清零（它本身是已确认的），所以最终 streak 完全由区间 `(maxConf, n]` 决定。而这个区间里的消息**没有一个被确认过**（否则 maxConf 会更大），全属「未确认」：其中超时的贡献 +1，未超时的贡献 0。于是有：

```
streak = count{ i ∈ (maxConf, n] : t_i <= T - D }
```

这一等价把「按顺序模拟扫描」变成了「后缀计数」，是本题从 O(n) 每次查询优化到 O(log n) 的根据。

**参考实现（Python）**

```python
import sys

def main():
    data = sys.stdin.read().split()
    idx = 0
    out = []
    while idx < len(data):
        m = int(data[idx]); idx += 1
        times = [0]          # 1-indexed，times[i] 为第 i 条消息的发送时刻
        max_conf = 0         # 已 DONE 的最大消息编号
        for _ in range(m):
            op = data[idx]; idx += 1
            if op == "POST":
                times.append(int(data[idx])); idx += 1
            elif op == "DONE":
                max_conf = max(max_conf, int(data[idx])); idx += 1
            else:  # QUERY
                T = int(data[idx]); D = int(data[idx + 1]); idx += 2
                limit = T - D
                streak = 0
                for i in range(max_conf + 1, len(times)):
                    if times[i] <= limit:
                        streak += 1
                out.append("QUERY %d %d %s" % (T, D, "YES" if streak >= 5 else "NO"))
        # 多组 case 时继续循环
    sys.stdout.write("\n".join(out) + ("\n" if out else ""))

main()
```

上面的后缀遍历是 O(n)，适合笔试的数据规模；如果要压到 O(log n)，可以利用日志中 `t` 单调不减这一特性：在 `times` 上二分找最后一个 `times[i] <= limit` 的下标 `pos`，则 `streak = max(0, pos - max_conf)`。如果题目不保证 `t` 有序，稳妥做法是把发送时刻离散化后用树状数组统计，一次查询 O(log n)。

**几个容易丢分的细节**

① **多组 case**：输入可能有多轮，Java 里习惯写 `while (in.hasNextInt())`，但 `hasNextInt` 和 `hasNextLine` 混用会把换行吃掉导致读到空行，用 `Scanner` 统一按 token 读更安全；② **输出格式**：要连同 `QUERY T D` 一起回显，写裸 `YES`/`NO` 会判错；③ **边界**：`limit` 可能为负数（`D > T`），此时没有任何消息超时，`streak` 必须是 0；`QUERY` 可能出现在任何 `POST` 之前，此时消息数为 0，直接输出 `NO`；④ **编号与下标**：`POST` 的 ID 从 1 递增，别用 0 起始的数组下标去对应消息号，加一个占位元素最省事；⑤ **`DONE` 乱序**：`DONE` 的 k 不一定递增，所以 `maxConf` 要取最大值而不是直接覆盖。

**SQL 索引机制问答怎么答**

先讲结构：InnoDB 的索引是 B+Tree，非叶子节点只存键、叶子节点存数据且用双向链表相连，所以三层左右就能支撑千万级数据，范围查询也只需顺着叶子链表走。再讲分类：主键索引是聚簇索引，叶子节点直接存整行数据；二级索引（非聚簇）的叶子存主键值，因此查非索引列要「回表」再查一次聚簇索引，如果查询列都在索引里就是覆盖索引，能免掉回表。然后是使用规则：联合索引遵守最左前缀，`WHERE a = ? AND b > ?` 里 `b` 之后的列用不上索引；对索引列做函数运算、隐式类型转换、前导通配 `LIKE '%x'`、`OR` 连接非索引列都会导致失效。验证手段是 `EXPLAIN`：看 `type`（`const` > `eq_ref` > `ref` > `range` > `index` > `ALL`）、`key`、`rows` 和 `Extra`（`Using index` 是覆盖索引，`Using filesort`、`Using temporary` 说明有额外排序或临时表）。索引不是越多越好——每个索引都要在写入时维护，且占用缓冲池。

**Python 字典与 List 的考点**

`dict` 是哈希表实现，平均 O(1) 查找，键必须可哈希（list、dict 不能当键），CPython 3.7 起保证插入有序；`list` 是动态数组，随机访问 O(1)、尾部 `append` 平摊 O(1)、中间插入删除 O(n)。测试岗常见的几问：`d.get(k, default)` 不会写入新键而 `d.setdefault(k, v)` 会写入；去重并保持顺序用 `dict.fromkeys(seq)`；`a = b` 是引用赋值，浅拷贝用 `copy()`，嵌套结构要用 `copy.deepcopy()`；遍历字典时修改它会抛 `RuntimeError`，要先转成 `list(d.items())`。另外注意 `list` 作为默认参数会跨调用累积这个经典坑。

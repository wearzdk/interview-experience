---
title: 字节Agent一面凉经：手撕买卖股票与Redis令牌桶
company: 字节跳动
position: Agent应用开发
round: 一面
date: '2026-09'
result: 已挂
source: 牛客网
tags: ["字节跳动","Agent开发","手撕算法","动态规划","Redis","令牌桶","限流"]
summary: "字节 Agent 岗一面凉经，全程约 45 分钟：自我介绍后手撕买卖股票最佳时机（不限次数、最多两次、最多 n 次三问），随后深挖实习与项目经历，并考 Redis 令牌桶的实现，作者只完整写出一问、实习经历答得不理想，最终未通过。"
---

### 《面试题目》

1. 自我介绍
2. 手撕：买卖股票的最佳时机（力扣原题）。第一问没有交易次数上限；第二问最多交易两次；第三问最多交易 n 次。前两问写实现，第三问说思路。
3. 实习经历拷打
4. 项目拷打
5. Redis 令牌桶怎么实现？
6. 反问

### 《参考解析》

**买卖股票三问的状态机统一解法**：三问本质是同一套状态机的不同特例。
- 不限次数（力扣 122）：贪心最简——把每一天的正收益全吃掉，`ans += max(0, p[i] - p[i-1])`；或者写成两个状态滚动 `hold = max(hold, cash - p[i])`、`cash = max(cash, hold + p[i])`。
- 最多两次（力扣 123）：四个状态滚动更新——`buy1 = max(buy1, -p)`、`sell1 = max(sell1, buy1 + p)`、`buy2 = max(buy2, sell1 - p)`、`sell2 = max(sell2, buy2 + p)`，答案是 `sell2`；等价写法是前后缀分解：`pre[i]` 表示前 i 天做一次交易的最大收益，`suf[i]` 表示第 i 天之后做一次交易的最大收益，再枚举分割点取 `max(pre[i] + suf[i])`。
- 最多 n 次（力扣 188，题干里的 k 次）：通用 DP `dp[j][0/1]` 表示已完成 j 笔交易时「手上无股票 / 持有股票」的最大收益，转移为 `dp[j][0] = max(dp[j][0], dp[j][1] + p)`、`dp[j][1] = max(dp[j][1], dp[j-1][0] - p)`，复杂度 O(nk)、空间可压到 O(k)。注意当 `k >= n / 2` 时退化成不限次数，直接走贪心分支，否则 O(nk) 在 k 很大时会超时。

**先说清题意再写代码**：三问连着出，面试官看的是你能不能复用同一套状态定义，而不是写三段不同的代码。实现前先用一句话确认「是否可以当天买当天卖」「是否必须买卖交替」，这两点决定初始化与转移的写法。

**Redis 令牌桶实现**：桶的状态放一个 hash（字段 `tokens`、`ts`，外加配置 `capacity`、`rate`），核心逻辑是「按流逝时间补令牌 → 判断是否够 → 扣减并回写」，且必须整段原子执行，通常用 Lua 脚本：

```lua
-- KEYS[1]=桶key, ARGV: now, rate(个/毫秒), capacity, need
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(b[1]) or tonumber(ARGV[3])
local ts = tonumber(b[2]) or tonumber(ARGV[1])
tokens = math.min(tonumber(ARGV[3]), tokens + (tonumber(ARGV[1]) - ts) * tonumber(ARGV[2]))
local allowed = tokens >= tonumber(ARGV[4])
if allowed then tokens = tokens - tonumber(ARGV[4]) end
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', ARGV[1])
redis.call('PEXPIRE', KEYS[1], math.ceil(tonumber(ARGV[3]) / tonumber(ARGV[2]) * 2))
return { allowed and 1 or 0, math.floor(tokens) }
```

要讲到的四个点：① 必须 Lua（或直接用 Redis 的 `CL.THROTTLE` / redis-cell 模块），否则 `GET` 与 `SET` 之间存在竞态，高并发下限流失效；② 时间戳建议由客户端传入或用 `redis.call('TIME')` 统一取，但要防时钟回拨；③ 令牌数用浮点会有精度问题，可以按「毫秒 × rate」整数化；④ key 必须设过期时间，否则大量低频 key 会常驻内存。补充对比：漏桶是恒定速率流出、能削峰但突发要排队；令牌桶允许一定突发（桶容量就是突发上限），所以更适合 API 限流。

**实习与项目拷打怎么准备**：面试官会顺着简历往下钻，每一句都要能接住追问。建议每个项目准备三层：一句话业务价值、我负责模块的技术方案与选型理由（为什么用 A 不用 B）、一个具体的难点与解决过程（最好带数字）。另外这场面试「竟然没问 agent」，说明简历上写了大模型相关经历不代表一定被问——但反过来，如果把 Agent 相关的内容写进简历，就要准备好被问到工具调用、上下文管理、评测这些细节。

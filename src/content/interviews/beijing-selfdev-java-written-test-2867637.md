---
title: 北京自研小厂（游戏服务端方向）Java笔试
company: 某北京自研小厂
position: 服务端开发工程师
round: 笔试
date: '2026-06'
base: 北京
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2867637
tags: ["Java","系统设计","算法","数据库","高并发"]
summary: "北京自研小厂游戏服务端笔试面经，全程手写不得用编辑器。考察签到系统设计（缓存方案、高并发、幂等）、技能特效二维数组区间合并算法、排行榜接口设计及数据库表结构设计。"
---

### 《面试题目》

1. 给定签到系统设计场景：
   1.1 说明签到系统的核心实体类字段，缓存如何设计？
   1.2 说明业务逻辑实现，如何抗高并发，如何做幂等？
   1.3 简单实现伪代码
2. 给定技能特效二维数组：每个 `int[]` 表示 `[start_time, end_time]`，计算最少需要多少个特效轨迹（区间合并问题）
3. 写一个排行榜的 HTTP 请求（URL、传参），并写出 JSON 格式返回体
4. 附加题：
   4.1 每 100ms 上传一次攻击 Boss 的总伤害，设计记录表的字段
   4.2 根据记录数据，按规则判断谁是 MVP
   4.3 如果同一时间有 5 个用户上交了能击败 Boss 的数据，如何保证 MVP 的唯一性

---

### 《参考解析》

1. **签到系统设计**：核心实体字段包括 `user_id`、`sign_date`、`sign_streak`（连签天数）、`created_at`。缓存方案：以 `sign:{userId}:{yyyyMM}` 为 key 存 Bitmap（每位代表当月第几天），O(1) 查写，月底过期。高并发：Redis Bitmap 原子操作 + 异步落库（MQ 削峰）。幂等：Redis `SET NX` 先占位，成功才写 DB，防重放攻击。

2. **区间合并（最少轨迹）**：按 `start_time` 升序排列所有区间；用贪心维护"当前最远结束时间"，新区间 `start <= maxEnd` 则合并（更新 maxEnd），否则新开轨迹。时间复杂度 O(n log n)。

3. **排行榜接口设计**：
   ```
   GET /api/v1/leaderboard?bossId=1&limit=10&offset=0
   响应: { "code":0, "data":{ "total":100, "list":[{"rank":1,"userId":123,"nickname":"xxx","damage":99999},...] } }
   ```

4. **MVP 唯一性保证**：在 Boss 被击杀瞬间，用 `Redis SET boss:{bossId}:mvp {userId} NX PX 5000` 争抢唯一锁；仅抢到锁的用户写入 MVP 记录。数据库层面可建 `boss_id` 唯一索引兜底，并发写时 DB 层会报主键冲突，业务层忽略重复异常即可。

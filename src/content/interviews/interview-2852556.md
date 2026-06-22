---
title: 28学院本第一次Java面试面经分享
company: 某互联网公司
position: 软件开发工程师
date: '2026-05'
base: 广东
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/2852556
tags: ["Java", "Redis"]
summary: "某互联网公司软件开发工程师面经，考察Java、Redis等核心知识点。包含真实面试题目与解析，适合准备软件开发工程师面试的求职者参考备考。"
---

### 《面试题目》

1. 兄弟们可以过来给我提提建议吗，项目和八股刚开始准备，就会一个redis还不熟了，第一次面试吓哭了😭😭😭
2. 某音：jackson凌

---

### 《参考解析》

1. **Redis核心**：Redis常用数据结构：String/Hash/List/Set/ZSet。持久化：RDB（定期快照，恢复快，数据可能丢失）和AOF（追加日志，数据安全，文件大）。缓存穿透用布隆过滤器；缓存雪崩加随机过期时间+多级缓存；缓存击穿用互斥锁或逻辑过期。分布式锁用SET key value NX PX + Lua脚本保证原子释放。

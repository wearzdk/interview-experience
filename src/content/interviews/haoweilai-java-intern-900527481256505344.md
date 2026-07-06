---
title: 好未来Java日常实习一面面经
company: 好未来
position: Java日常实习生
round: 一面
date: '2026-06'
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/900527481256505344
tags: ["Java","Spring","FactoryBean","八股"]
summary: "好未来Java日常实习一面面经，因候选人应聘方向（日常实习）与面试官期待（转正实习）不一致导致面试潦草收场，技术侧印象最深的问题是FactoryBean与BeanFactory的区别。"
---

### 《面试题目》

1. 自我介绍
2. 是找日常实习还是想转正实习？
3. FactoryBean 和 BeanFactory 的区别
4. 其他若干八股问题

---

### 《参考解析》

1. **FactoryBean vs BeanFactory**：BeanFactory 是 Spring IOC 容器的顶层接口，定义了获取 Bean、判断 Bean 类型等容器级别的能力；FactoryBean 则是一个特殊的 Bean，它本身是一个工厂，实现该接口后，容器中通过 `getBean()` 拿到的不是 FactoryBean 本身，而是它的 `getObject()` 方法返回的对象（若要获取 FactoryBean 本身需要在 Bean 名前加 `&`），常用于封装复杂对象的创建逻辑（如 MyBatis 的 `SqlSessionFactoryBean`）。
2. **投递前置沟通的重要性**：面经反映出岗位类型（日常实习 vs 转正实习）在投递和面试环节存在信息不对称，导致双方期待错位、面试草草收场，建议投递前仔细核对 JD 描述、面试初期主动确认岗位性质，避免无效面试。

---
title: 某公司后端二面：字符串转整数手撕题
company: 某互联网公司
position: Java后端开发
round: 二面
date: '2026-09'
source: 牛客网
tags: ["Java","手撕算法","边界处理","整数溢出","面试复盘"]
summary: "某公司后端二面面经，面试以基本闲聊为主，算法题是一道手撕实现：用 Java 写 parseInteger(String)，把字符串转成 int，非法输入或溢出返回 null。原帖给出了完整参考代码，考察点是非数字字符校验与运算前溢出判断。"
---

### 《面试题目》

1. 手撕算法题：实现 `public static Integer parseInteger(String integerString)`，把字符串转成整数；`null` 或空串返回 `null`，出现非数字字符返回 `null`，溢出也返回 `null`。原帖给出的参考代码如下：

```java
public static Integer parseInteger(String integerString) {
    if (integerString == null || integerString.isEmpty()) {
        return null;
    }
    int sum = 0;
    for (char c : integerString.toCharArray()) {
        if (c < '0' || c > '9') {
            return null;
        }
        int x = c - '0';
        if (sum > (Integer.MAX_VALUE - x) / 10) {
            return null;
        }
        sum = sum * 10 + x;
    }
    return sum;
}
```

2. 基本闲聊（原帖未记录具体内容）。

### 《参考解析》

**这段代码在做什么**：整体是「逐位累乘加」的经典写法，两个关键判断值得讲清楚。第一个是字符合法性：`c < '0' || c > '9'` 直接拒绝任何非数字字符，注意这里比较的是字符的 ASCII 值，等价于 `!Character.isDigit(c)`，但字符版更快也更明确。第二个是溢出保护：在真正做 `sum * 10 + x` 之前先判断 `sum > (Integer.MAX_VALUE - x) / 10`，也就是把「`sum * 10 + x > Integer.MAX_VALUE`」这个不等式两边做等价变形后避免了乘法本身溢出——因为 `int` 相乘溢出会静默回绕，等到算完再比较就已经晚了。这个「先判断、后运算」的写法是手撕题的核心得分点。

**边界与不足（面试官最可能追问的地方）**：① 不支持负数。`"-1"` 会在第一个字符 `-` 上直接返回 `null`，如果题目要求支持符号位，需要在开头单独判断首字符是 `+`/`-`，记下符号后从下标 1 开始循环，并且下界要用 `Integer.MIN_VALUE`（因为 MIN_VALUE 的绝对值比 MAX_VALUE 大 1，直接取反会溢出）；② 不支持前导空白，JDK 的 `Integer.parseInt` 会先 `trim` 或者用 `Character.digit` 处理；③ 前导零能正确解析（`"007"` → 7），后面带空格（`"12 "`）会返回 null，要按题目约定确认；④ 语义上返回 `null` 与 JDK 抛 `NumberFormatException` 不同——返回值表达失败在业务代码里容易被忽略（忘记判空就 NPE 或者被自动拆箱抛异常），生产代码更推荐抛异常或用 `Optional`；⑤ 空串和 `null` 都返回 `null`，但这两种情况语义并不相同（一个是没有输入、一个是输入缺失），如果有日志或错误码需求可以区分。

**如果要求对齐 JDK 实现**：JDK 的 `Integer.parseInt` 用的是「负数累积」的技巧：把结果始终按负数累加（`result = result * radix + digit` 用负的 digit），累加过程中用 `result < limit` 判断溢出，其中 `limit = MIN_VALUE / radix`，最后再根据符号取反。这样做的原因是 `Integer.MIN_VALUE` 的绝对值范围比 `MAX_VALUE` 大，负数域能同时覆盖正负两端的边界值，一套判断逻辑搞定两种符号，也避免了正数累加时 `-Integer.MIN_VALUE` 的溢出问题。面试时能主动提这一段，说明你不是背了模板而是理解原理。如果面试官要求改成支持任意进制，把 `x = c - '0'` 换成 `Character.digit(c, radix)` 并对 `x >= radix` 判非法即可。

**闲聊面怎么把握**：原帖说这场二面「基本闲聊」加一道手撕，这类安排通常意味着技术面在一面已经过了，二面在确认稳定性、沟通和基本编码功底。闲聊部分仍要准备三件事：一是项目的一句话版本和两分钟版本（面试官可能只想听结论）；二是为什么换方向 / 为什么选这家公司，答案要与简历自洽；三是反问，问团队正在做的事、代码 review 和测试流程、新人上手周期这类能体现你在意工程实践的问题。手撕环节则务必边写边讲：先说清函数契约（输入输出、非法输入怎么处理），再写主循环，最后主动报边界用例（空串、`null`、非数字、`2147483647`、`2147483648`、`-2147483648`）并解释代码在这些输入下的行为——很多人代码写对了但一声不吭，面试官看不到你的思考过程。

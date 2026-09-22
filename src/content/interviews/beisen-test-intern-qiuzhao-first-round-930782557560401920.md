---
title: "北森测试实习秋招一面：网络协议与测试设计"
company: "北森"
position: "测试开发"
round: "实习一面"
date: '2026-09'
source: "牛客网"
sourceUrl: "https://www.nowcoder.com/discuss/930782557560401920"
tags: ["测试开发","软件测试","HTTP3","QUIC","UI自动化","接口幂等","SQL优化","秋招实习"]
summary: "北森测试实习秋招一面面经：考察 HTTP/2 队头阻塞与 HTTP/3 的流隔离、UDP 传关键业务数据的测试点、UI 自动化用例偶发失败定位、HTTPS 抓包握手失败排查、接口超时重试重复下单的幂等设计，另含两道统计与取数的 SQL 题。"
---

### 《面试题目》

1. HTTP/2 中为什么仍然可能出现队头阻塞？HTTP/3 是如何解决的？
2. 如果系统使用 UDP 传输关键业务数据，应该重点测试什么？
3. 一条 UI 自动化用例偶发失败，但手工执行始终正常，你会怎么定位？
4. HTTPS 接口在抓包工具中显示握手失败，你会如何排查？
5. 一个接口因为超时被客户端重试，最终生成了两笔订单，应该如何测试和预防？
6. 如何查询实付金额大于 100 元，并且排除已全额退款的订单？
7. 如何查询每个用户最后一次成功操作的完整记录？
8. SQL 明明创建了索引，查询仍然很慢，测试人员应该如何分析？
9. 请做一下自我介绍

### 《参考解析》

**HTTP/2 的队头阻塞在传输层，HTTP/3 靠流隔离拆掉它**：HTTP/1.1 的问题是一个 TCP 连接上请求要排队，浏览器只能靠开 6 条并发连接绕过去；HTTP/2 把报文切成带 stream id 的二进制帧在同一条 TCP 连接上交错发送，应用层的排队确实没了。但所有 stream 的帧终究要挤进同一条 TCP 字节流，而 TCP 的交付契约是"按序的字节流"——只要有一个 segment 丢了，内核接收缓冲区里后面已经到达的 segment 也不能上交给应用，得等重传把空洞补上。于是丢一个包，全部并发请求一起卡住，这就是传输层队头阻塞。丢包率越高越明显，2% 丢包的长肥连接下 HTTP/2 的尾延迟可能比 HTTP/1.1 的多连接还差；HTTP/2 的优先级和依赖树只能决定谁先发，改不了 TCP 的按序交付。

HTTP/3 换到基于 UDP 的 QUIC：每个 stream 维护自己独立的偏移量，接收端可以按 stream 分别重组，A 流的包丢了只阻塞 A 流，B/C 流的数据照常交付。QUIC 还把 TLS 1.3 嵌进传输握手（1-RTT 建连、复用会话可 0-RTT），并用 connection id 取代四元组做连接标识，Wi-Fi 切 4G 时连接不会断。代价也要知道：UDP 443 在部分企业网和运营商侧被限速甚至直接丢，QUIC 的用户态协议栈 CPU 开销更高，所以线上必须保留回退到 HTTP/2 的能力。

测的时候别只断言协议版本（`curl -sI --http3 https://host/ -o /dev/null -w '%{http_version}\n'`，或看 DevTools Network 面板的 Protocol 列是不是 `h3`），要制造弱网对比两条链路：本机注入 `tc qdisc add dev eth0 root netem delay 100ms loss 2%`，同一页面并发 20 个请求，分别跑 h2 与 h3，比较整页完成时间和 p95；关注点应是"某一条流丢包有没有拖慢其他流"。再补两类用例：网络切换后连接是否靠 connection id 复用、有没有请求被重发；以及回退能力——`iptables -A OUTPUT -p udp --dport 443 -j DROP` 屏蔽 UDP 后，客户端应在秒级内退回 h2 且用户无感，而不是长时间白屏。

**UDP 传关键业务数据：测的不是收不收得到，而是业务层怎么收敛不靠谱**：UDP 无连接、不重传、不保序，checksum 还是可选的，源地址也能随手伪造，所以测试点必须成矩阵地打：丢包（1%/5%/20% 三档）、重复包、乱序、抖动延迟、报文截断（超过 MTU 触发 IP 分片，再单独丢分片）、以及伪造源地址的注入包。用 `tc qdisc add dev eth0 root netem loss 5% duplicate 10% reorder 25% 50% delay 50ms` 一次把大部分异常叠上，或用 `scapy` 直接构造同一个序列号的报文连发三次（`send(IP(dst=t)/UDP(sport=9999,dport=8888)/payload)`）。

如果业务要求可靠，协议就得自己在应用层补齐：单调递增的业务序列号、ACK 确认、超时重传与指数退避、去重窗口（记住最近 N 个 seq）、报文完整性校验、以及重传次数耗尽后的告警而不是静默丢弃。对应的断言要落在最终业务状态上，而不是网卡收包计数：同一个支付状态通知到达三次，只能产生一次状态变更、一次库存流水、一条下游消息；乱序到达的旧报文不能把新状态覆盖回去（比较 seq 或业务时间戳，只接受更新的那条）；重传打满之后必须有一条告警或进对账队列，业务不能就这么卡死。

工程上真正兜底的是幂等落点——唯一索引或者状态机只允许 `CREATED → PAID`，重复通知命中已终态就直接返回成功。测试还要覆盖"UDP 通道整体不可用 5 分钟"这种场景，确认定时对账/主动查询能把数据追平，最终一致，而不是永远差那一笔。

**UI 自动化偶发失败：先固证，再分层，最后才谈重试**：手工能过、机器偶挂，说明问题大概率在等待时机、定位器稳定性或测试数据隔离，而不是功能本身。第一步是让失败现场可复盘，别让它一闪而过：失败时自动落截图、`driver.page_source` 或 DOM 快照、浏览器 console 日志（Chrome 用 `goog:loggingPrefs` 打开）、失败那一刻的 HAR/网络请求、driver 日志、用例耗时和 CI 机器负载，统一 attach 到报告里。

第二步按现象分类，最常见的五类：元素压根没渲染出来（页面还没到）；元素在但不可点击（被弹窗或动画遮罩盖住、在视口外）；点击生效了但断言跑太早（异步请求没回来）；路由跳转不对（被登录态踢回登录页）；数据被别的用例改了（共用账号、共用订单号）。根因往往是固定 `sleep`、脆弱的定位器（`nth-child`、按文案找、绝对路径 xpath）、隐式等待和显式等待混用互相干扰、用例间抢同一份数据、以及 CI 机器比本地慢一个数量级。

正确做法是等待明确的业务状态，而不是等时间。定位器优先 `data-testid`，显式等待给 `WebDriverWait` 配上忽略异常：

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import StaleElementReferenceException

wait = WebDriverWait(driver, 15, poll_frequency=0.2,
                     ignored_exceptions=(StaleElementReferenceException,))
wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='order-list']")))
wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, ".loading-mask")))
wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='submit-order']"))).click()
wait.until(lambda d: d.find_element(By.CSS_SELECTOR, "[data-testid='order-status']").text == "支付成功")
```

`StaleElementReferenceException` 一定要放进 `ignored_exceptions`——页面重渲染后旧句柄会失效，不忽略就会随机抛错。

第三步做复现二分：把这条用例单独跑 20 次（`pytest -k test_x --count=20`，配 pytest-repeat）；按原顺序跑一遍；再打乱顺序、并行开 4 个 worker 跑一遍（pytest-xdist `-n 4`）。只在并行时挂 → 数据和账号隔离问题；只在特定顺序挂 → 前置用例没清数据；单跑也稳定挂 → 就该去看那次失败的 HAR，把用例步骤时间戳和接口耗时对齐，通常能看到某个接口的 p99 比代码里的固定等待长。修复之后要有回归口径：同一个用例连跑 100 次失败率归零，`pytest-rerunfailures` 这类重跑只能当观测手段，不能当修复。

**抓包 TLS 握手失败：按层次砍，最后落到 alert 码**：先分清是握手就没成，还是握手成功之后业务请求失败——抓包里没有 ServerHello / Application Data 就是前者。然后逐层排查：

- 传输与端口：`curl -v https://host/` 看 TCP 有没有连上 443，`nc -vz host 443`；连不上就别查证书了，先查网络 ACL、负载均衡监听和中间设备阻断。
- 协议与套件：`nmap --script ssl-enum-ciphers -p 443 host`，看两端支持的 TLS 版本和密码套件有没有交集（客户端只开 TLS 1.0、服务端只留 1.2+ 就会 `no protocols available`）；老客户端不带 SNI 时，服务端会回默认站点的证书，表现为域名不符。
- 证书与时间：`openssl s_client -connect host:443 -servername host -showcerts </dev/null`，核对 `notAfter`、SAN 是否包含实际访问的域名（用 IP 访问最容易踩）、以及中间证书有没有下发完整（缺中间证书时 Java/Android 报 `unable to get local issuer certificate`，浏览器有时会自己补全所以看不出来）；设备系统时间漂移也会被判成证书过期。
- 代理工具特有的：客户端是否信任代理生成的根证书——iOS 装完描述文件还要去"关于本机-证书信任设置"手动打开，Android 7 以上用户证书对 app 默认不生效，得装进系统证书区或改 networkSecurityConfig。如果系统浏览器能抓包、app 抓不到，重点怀疑证书绑定（pinning）：应用内置了服务端证书或公钥哈希，代理证书直接被拒，这时只能让开发出关闭 pinning 的调试包，或在授权测试环境用 Frida 绕过。
- 双向 TLS：服务端发了 CertificateRequest，客户端没带证书、私钥不匹配、或证书用途不是 clientAuth，都会失败。验证命令是 `openssl s_client -connect host:443 -cert client.crt -key client.key -CAfile ca.crt`。

结论不要停在页面的"网络异常"上。TLS alert 码能直接指出责任方：40 `handshake_failure`（无共同套件/版本）、42 `bad_certificate`、45 `certificate_expired`、48 `unknown_ca`（不信任签发链）、112 `unrecognized_name`（SNI 不匹配）。把代理日志、客户端日志、网关日志三边按时间戳对齐，定位到具体是哪个阶段断的。

**超时重试造出两笔订单：超时不等于失败，幂等键加唯一索引才治本**：客户端读超时只说明"结果未知"——服务端很可能已经提交了。所以第一件事是承认重试天然会重复，靠"服务端会不会重发"来做判断是错的。

方案分三层。接口层：客户端在发请求前生成全局唯一的 `Idempotency-Key`（UUID，或 `userId + 业务号 + 日期` 拼出来的业务唯一号），每个请求带上；服务端在同一个事务里写幂等键记录并建订单，键已存在就返回第一次执行的结果（响应体和状态码都要缓存下来原样返回）。幂等表建议是 `(key varchar(64) PRIMARY KEY, request_hash char(64), status tinyint, response_body json, created_at)`，其中 `request_hash` 用来识别"同一个键带了不同参数"，这种情况要明确报 409 而不是复用旧订单——这是最容易被漏测的一条。键的 TTL 至少要大于客户端最大重试窗口加对账窗口，比如 24 小时。

数据层：对业务唯一号建唯一索引，比如 `UNIQUE KEY uk_biz_no (user_id, out_trade_no)`，代码里捕获 `DuplicateKeyException` 后回查返回。注意必须是"直接 INSERT 靠唯一索引挡"，而不是先 SELECT 再 INSERT——后者在并发下必然有竞态，测试并发同键就能把它打出来。状态类操作再加乐观锁：`UPDATE orders SET status='PAID' WHERE id=? AND status='CREATED'`，影响行数为 0 就直接返回成功。消息侧同样要幂等，消费端用业务号做去重表，避免重试把通知发两遍。

测试怎么造出"服务端已提交但客户端读不到响应"：在服务端出向丢一段时间的响应包，比如 `iptables -A OUTPUT -p tcp --sport 8080 -j DROP`，或把接口对到 toxiproxy 上加 timeout 毒化；然后用同一个键、同一份参数连发（并发更狠）：

```bash
for i in $(seq 10); do
  curl -s -o resp_$i.json -w '%{http_code}\n' -X POST https://host/api/orders \
    -H "Idempotency-Key: $KEY" -H "Content-Type: application/json" -d @body.json &
done
wait
```

断言要逐表数数：`orders` 只能有一行；支付记录、库存流水、下游消息发送次数各只能有一条；10 个响应的 body 字节级一致、order_id 相同、状态码相同；再跑一次"同键不同参数"应返回 409 且订单数不变、也不会返回旧订单。

最后别忘了重试策略本身也是被测对象：只在幂等请求上重试，用指数退避加抖动，次数有上限；单次超时阈值要设得大于服务端 p99 而不是平均耗时，否则正常但偏慢的请求也会被重试，把重复率放大。上线后留个对账兜底：每天扫一次"同业务号多行"，结果必须为空。

**三道 SQL 题要盯住的其实是边界，不是语法**：先看"实付大于 100 且排除全额退款"。订单表存的是应付/实付，退款在另一张流水表里，所以不能只查订单表，也不能用 `status != 'REFUNDED'` 糊弄——部分退款是既不等于全额也不能算没退。正确姿势是先按订单聚合成功退款，再算净额：

```sql
SELECT o.order_id, o.user_id, o.pay_amount - COALESCE(r.refunded, 0) AS net_paid
FROM orders o
LEFT JOIN (
    SELECT order_id, SUM(refund_amount) AS refunded
    FROM refunds
    WHERE refund_status = 'SUCCESS'
    GROUP BY order_id
) r ON r.order_id = o.order_id
WHERE o.pay_status = 'PAID'
  AND o.pay_amount - COALESCE(r.refunded, 0) > 100;
```

两个细节容易写错：把 `refund_status` 的条件写进 WHERE 会顺手把 LEFT JOIN 降级成 INNER JOIN，没退过款的订单会整体消失；`SUM` 遇到全 NULL 会返回 NULL，得用 `COALESCE` 兜。金额一律用整数分（bigint）或 `DECIMAL(18,2)`，绝不能落 float。`>` 是严格大于，边界数据至少覆盖 99.99 / 100.00 / 100.01，退款侧覆盖从未退款、部分退款、全额退款、多次退款、退款处理中、退款失败。

再看"每个用户最后一次成功操作的完整记录"。`GROUP BY user_id` 配 `MAX(operation_time)` 只拿得到时间，拿不到同一行的 `request_id`，在 `ONLY_FULL_GROUP_BY` 下直接报错，就算能跑也是随机取一行。用窗口函数才对：

```sql
SELECT user_id, operation_type, operation_time, request_id
FROM (
    SELECT t.*, ROW_NUMBER() OVER (
               PARTITION BY user_id
               ORDER BY operation_time DESC, id DESC
           ) AS rn
    FROM user_operation_log t
    WHERE operation_status = 'SUCCESS'
) x
WHERE rn = 1;
```

排序里补 `id DESC` 是为了处理同一用户同一秒内的多条记录；换成 `RANK()` 则并列时会返回多行。测试要点：同秒多条、无成功记录的用户不该出现在结果里、时区（库里存 UTC 还是本地时间，跨时区展示要一致）、时间字段精度（`DATETIME` 默认秒级，所以业务表必须有自增主键兜底）、主从延迟导致刚写入查不到；索引按 `(user_id, operation_status, operation_time, id)` 建。

最后是"建了索引还是慢"。第一步永远是看执行计划而不是猜：MySQL 8 用 `EXPLAIN ANALYZE`，老版本用 `EXPLAIN FORMAT=JSON` 关注 `used_key_parts`、`rows_examined_per_scan`、`filtered`，再看 `SHOW INDEX FROM t` 的 `Cardinality` 判断选择性。常见原因按出现频率排：索引列上套了函数或运算（`WHERE DATE(create_time)='2026-09-01'` 用不上索引，改成 `create_time >= '2026-09-01' AND create_time < '2026-09-02'`）；隐式类型转换（`varchar` 的手机号写成 `WHERE mobile = 13800000000`，MySQL 会把列转成数字，全表扫；JOIN 两侧字符集不一致同样让索引失效）；联合索引不满足最左前缀，或者范围条件后面的列只能过滤不能定位；选择性太低时优化器主动放弃索引（`status` 只有三个值又返回三成行，回表成本高于全扫），这时考虑覆盖索引或分区归档；统计信息过期，`ANALYZE TABLE` 之后基数才准；`ORDER BY` 和索引顺序不一致产生 filesort、出现 `Using temporary`；`SELECT *` 拉回太多列导致回表次数暴涨。还有一种根本不是慢而是等：`SHOW PROCESSLIST` 看到大量 `Waiting for table metadata lock` 就是被锁住了，跟索引无关。测试视角的验收标准是前后对比 `rows_examined` 要下降一个数量级，慢查询日志把 `long_query_time` 调到 0.1 秒来抓，别只看单次响应时间——索引也不是越多越好，写放大和优化器选错索引都是成本。

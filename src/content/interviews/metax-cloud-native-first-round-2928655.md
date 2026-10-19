---
title: "沐曦云原生开发一面：Docker 多架构、Go 并发与 socket 排障"
company: "沐曦"
position: "云原生开发"
round: "一面"
date: "2026-10"
source: 牛客网
sourceUrl: https://www.nowcoder.com/feed/main/detail/a4da773dd5014416b792c8c3854f4c70
tags: ["云原生", "Go", "Docker", "Kubernetes", "Linux", "socket"]
summary: "沐曦云原生开发一面 60 分钟：35 分钟拷打简历，15 分钟八股覆盖 Docker 多架构构建、Go map 并发、sync.Map、channel、atomic 与 mutex、文件描述符和 socket 排障，最后 10 分钟手写合并有序数组去重。"
---

### 《面试题目》

1. 你知道这个岗位主要做什么吗？在腾讯实习做了什么？base 地怎么考虑？
2. 自我介绍，并深挖简历项目。
3. Docker 如何在一台机器上构建不同架构的镜像？
4. Kubernetes 的观测/监控了解哪些？
5. Go 的 map 能否并发读写？不能的话用什么可以并发读？
6. 为什么 sync.Map 可以并发读写？
7. channel 是阻塞还是非阻塞的？
8. atomic 和 mutex 有什么区别？分别适用什么场景？
9. Linux 的文件描述符是什么？
10. Linux 如何向 socket 中发送和读取数据？
11. 如何判断一个服务是否 socket 泄露？
12. Docker 如何把容器端口映射到主机？
13. 手撕：合并两个有序数组并去重。

### 《参考解析》

**Docker 多架构构建**：两种主流方式。一是 QEMU 模拟：安装 binfmt_misc，用 `docker buildx create --name multiarch` 建 builder，`docker buildx build --platform linux/amd64,linux/arm64 -t repo/img:tag --push .`，BuildKit 会在不同架构的节点或本地模拟环境里分别构建并生成 manifest list；二是原生交叉编译：在 Dockerfile 里用 `--platform=$BUILDPLATFORM` 固定构建阶段，通过 `TARGETARCH` 参数让编译器产出目标架构二进制，运行阶段再选对应基础镜像。生产上更推荐原生构建节点或 CI 多节点，QEMU 模拟慢且可能遇到依赖包不兼容。注意基础镜像本身要支持目标架构。

**Go map 并发**：内置 map 不是并发安全的，并发读写会触发 fatal error（不是 panic 可 recover 的那种）。只读场景只要初始化后不再写，多 goroutine 读是安全的；读写混合要用 `sync.RWMutex` 保护，或改用 `sync.Map`。sync.Map 适合“读多写少、key 相对稳定”的场景，内部用 read map（原子读）加 dirty map，读路径大多无锁；频繁写入时它会退化成加锁并持续提升 dirty map，不一定比 RWMutex 快。不要把它当万能并发 map。

**channel 与同步原语**：channel 默认是阻塞的：无缓冲 channel 的发送和接收必须配对，有缓冲 channel 在缓冲区满时发送阻塞、空时接收阻塞；用 `select` 加 `default` 可以非阻塞，用 `close` 关闭后接收会立即返回零值。atomic 适合单个变量的读改写（计数器、标志位、指针替换），无锁、开销小，但不能保护一段临界区；mutex 适合保护多行逻辑或复合数据结构，代价是可能阻塞和上下文切换。Go 的原则是“不要通过共享内存通信，而要通过通信共享内存”，但计数、状态位这类用 atomic 更直接。

**文件描述符与 socket**：fd 是进程打开文件表的索引，内核里对应 file 对象，socket 也是文件，所以读写 socket 可以用 read/write，也可以用 send/recv。发送时数据从用户缓冲区拷贝到内核 socket 发送缓冲区，再由协议栈分段、加 TCP 头、走网卡；接收时网卡中断把数据放进接收缓冲区，应用 read 时拷贝到用户态。fd 数量受 `ulimit -n` 限制，耗尽会报 `too many open files`。判断 socket 泄露看 `/proc/<pid>/fd` 数量是否持续增长、`ss -s`/`lsof -p` 里 CLOSE_WAIT 是否堆积、以及 fd 类型分布；CLOSE_WAIT 多通常是应用没调 close，TIME_WAIT 多则是主动关闭方正常现象。排查还要看连接池是否只借不还、异常分支是否漏了 defer close。

**端口映射**：Docker 默认通过 iptables NAT 实现：`-p 8080:80` 会在 nat 表加 DNAT 规则，把宿主机 8080 转到容器 IP:80，同时放行 forward 链；userland proxy 在部分场景做转发。K8s 里则是 Service 的 ClusterIP/NodePort/LoadBalancer 做四层转发，Ingress 做七层。排查端口不通要按“容器内监听地址（0.0.0.0 还是 127.0.0.1）→ 容器网络 → 宿主机 iptables → 云安全组”逐层看。

**合并有序数组去重**：双指针从前往后比，相等时只取一个并同时后移，谁小取谁；结果可以直接写回 nums1 的尾部（如果题目是合并到 nums1），从后往前填避免覆盖。去重要在取数时判断“与结果最后一个是否相同”，而不是先合并再 unique。时间复杂度 O(m+n)，空间 O(1)。边界：一个数组为空、全是重复、负数。写完主动说测试用例。

---
title: "安卓客户端面试实录：Fragment 生命周期、ViewModel 与多线程集合"
company: "硬件出海厂商"
position: "Android 客户端开发"
round: "一面"
date: '2026-10'
source: 牛客网
sourceUrl: https://www.nowcoder.com/discuss/939994065339154432
tags: ["Android","客户端开发","Fragment生命周期","ViewModel","LiveData","RecyclerView","多线程集合","JVM","GC","Binder","HTTP","TCP"]
summary: "一份安卓客户端方向的面经，28 问：Activity 嵌套 ViewPager 与 Fragment 的生命周期回调、滚动状态保存的多种方式、Activity 之间返回后同步数据与屏幕旋转后 ViewModel/LiveData 的表现、RecyclerView 多类型 ViewHolder 的构建与 RecyclerPool 的分组、多线程写 ArrayList 的线程安全问题与 CopyOnWriteArrayList、JVM 内存回收与 GC Roots、内存泄漏的常见场景与定位工具、多进程通信与 Binder 中 service 如何感知 client 断开、有序与无序数组的逆序、HTTP 核心方法与协议栈、TCP 握手与最后一次 ACK 丢失的处理，以及 Schema 的编写与中文处理、RecyclerView 快速滑动时卡片的回收。"
---

### 《面试题目》

1. 自我介绍。
2. Activity 里嵌了一个 ViewPager，里面放 Fragment；点击跳转时，说出 Fragment 生命周期回调。
3. 我想存一下当前的滚动状态、滚动的位置，用什么方法来做？除了用 ViewModel 来存，还有别的方法来存吗？
4. Activity A 跳 Activity B，B 操作后返回，A 需要同步 B 的结果数据。你会用什么方法来同步这个数据？
5. 在这个操作过程中，会涉及到一些屏幕旋转的问题，重建的话，那个 ViewModel 的数据还在吗？
6. ViewModel 在这个重建的过程中，它里面有一个 LiveData，LiveData 的数据在重建之后还能观察到重建之前的数据吗？
7. 当 Model 调用什么接口之后，LiveData 就不能观察到数据了？
8. RecyclerView 里面用的 data 不一样，可能用多种 data，每一个 ViewHolder 是怎么来构建的？
9. RecyclerPool 是按组分类的，还是统一分类的？
10. RecyclerPool 会不会分组？怎么分组？
11. 我们有 ArrayList，如果是用多线程往这个 list 里面去做 add 的话，会线程安全问题吗？
12. 你平常用 CopyOnWriteArrayList 还是 ConcurrentLinkedQueue？
13. Java 虚拟机的内存回收的原理。
14. 标记成垃圾的标准。
15. 什么可以作为 GC Roots 的对象？
16. 内存泄漏的常见场景、定位工具、解决思路。
17. 多进程开发有什么方法去相互传递消息？
18. Binder 有一个 client、一个 service，service 能不能知道 client 死掉了？
19. 有一个有序数组，就是从 1~10，怎么快速把它变成从 10~1？
20. 无序数组（含 1~10 但要变 10~1）。
21. HTTP 最核心的四个方法。
22. HTTP 基于什么协议栈？
23. TCP 有几次握手？
24. 最后一次 ACK 如果说没发到位的话，他会怎么办？
25. 简单地描述一下怎么做的 Schema 码？
26. Schema 中间，如果用到中文，该怎么去做？
27. RecyclerView 快速滑动的时候，卡片滑出屏幕之后会被销毁吗？
28. 介绍一下线程安全集合。

### 《参考解析》

**Fragment 生命周期、滚动状态与数据同步**

Activity 里嵌 ViewPager 放 Fragment 时，生命周期回调顺序是：Activity 创建（`onCreate` → `onStart` → `onResume`），ViewPager 在布局完成后创建当前页的 Fragment（`onAttach` → `onCreate` → `onCreateView` → `onViewCreated` → `onStart` → `onResume`）；切换页面时相邻页可能被预加载而处于 `onStart` 或 `onResume`，被移出缓存的页走 `onPause` → `onStop` → `onDestroyView`（视图销毁但 Fragment 实例保留）；`FragmentPagerAdapter` 会保留全部 Fragment 实例（只销毁视图），`FragmentStatePagerAdapter`/`ViewPager2` 会销毁实例。屏幕旋转或 Activity 被重建时，Fragment 会先经历 `onPause`/`onStop`/`onDestroyView`/`onDestroy`/`onDetach` 再重新走一遍创建流程（除非用 `setRetainInstance` 或 ViewModel 保留数据）。

保存滚动位置的常见方式有三类：一是把位置存进 `ViewModel`（跨重建存活，推荐）、二是用 `onSaveInstanceState` 把位置写进 Bundle（系统回收进程后也能恢复，适合轻量数据）、三是用持久化存储（`SharedPreferences`/数据库，用于下次进入也要恢复的场景）。滚动状态的恢复 API 是 `RecyclerView.LayoutManager#onSaveInstanceState()` 与 `onRestoreInstanceState()`（或直接存 `findFirstVisibleItemPosition` 加 offset），注意要在数据加载完成后再恢复，否则会滚到错误位置。

Activity A → B → 返回 A 同步数据有三种做法：`startActivityForResult`（已废弃）或现代的 `registerForActivityResult`（Activity Result API）；`onNewIntent` 配合 `singleTop` 在 B 返回时把结果通过 Intent 带回；以及共享 ViewModel（同一宿主 Activity 作用域）或事件总线/Flow 通知。工程上推荐 Activity Result API，因为它明确了启动与回调的配对，避免 requestCode 混乱。

**ViewModel 与 LiveData 在重建中的行为**

ViewModel 在配置变更（屏幕旋转）时数据是保留的——它在 Activity 销毁重建时通过 `ViewModelStore` 与 `NonConfigurationInstance` 机制幸存，所以适合放页面状态与跨请求的数据；但它**不会**在进程被杀后存活（那属于 `SavedStateHandle` 或持久化的职责），所以关键状态还是要在 `onSaveInstanceState` 里写一份。LiveData 在旋转重建后依然可以观察到重建前已经 set 的值，因为它会向新的观察者重放最新的值（粘性特性）；但要注意两点：一是观察者重新订阅时会立刻收到旧值，可能导致重复执行（比如弹一次 Toast 又弹一次），解决办法是用 `SingleLiveEvent`/`Event` 包装消费一次性的语义；二是如果用 `observe` 绑定了错误的 lifecycleOwner（比如传了 Fragment 而不是 viewLifecycleOwner），会出现视图已销毁仍收到回调的问题。

「LiveData 什么时候不能再观察到数据」的答案是生命周期终止时：观察者绑定的 LifecycleOwner 进入 `DESTROYED` 状态后会被自动移除（这是 LiveData 的自动解绑机制）；此外 `removeObserver` 是主动移除，`onInactive` 只是停止接收活跃通知（但仍是观察者，重新活跃后会收到最新值）。

**RecyclerView：多类型 ViewHolder 与缓存池分组**

多类型列表的做法是重写 `getItemViewType(position)` 按数据类型返回不同常量，`onCreateViewHolder` 里按 viewType 创建不同的 ViewHolder 子类（各自持有不同的控件引用），`onBindViewHolder` 里按 viewType 分发绑定逻辑。要讲清优化的细节：类型的判定不要每次遍历数据（提前维护类型或按数据字段判断）、把共用的绑定逻辑抽到基类、以及不同 ViewHolder 的布局要尽量扁平（嵌套层级影响 inflate 与测量耗时）。

RecyclerView 的缓存分四级：`mAttachedScrap`/`mChangedScrap`（屏幕内、复用同一位置的 ViewHolder，不重新绑定）、`mCachedViews`（默认 2 个，滑出屏幕但按位置缓存，回收时若数据未变可不重新绑定）、`ViewCacheExtension`（自定义扩展，一般不用）、以及 `RecycledViewPool`。RecycledViewPool 是**按 viewType 分组**的（每个 viewType 一个 `ArrayList`，默认每种类型最多存 5 个），所以「按组分类」就是指按 item type 分组；这一点在多类型列表里很关键——如果所有类型共用一个池，就会出现「拿到的 ViewHolder 类型不匹配」的问题（实际不会，因为按类型取）。跨多个 RecyclerView 复用同一个 pool 时，要保证 viewType 在全局唯一（用 ID 资源或全局常量），否则不同列表的相同 viewType 会互相拿到不兼容的 ViewHolder。

「快速滑动时卡片滑出屏幕会不会被销毁」——ViewHolder 的视图对象被回收进缓存池而不是销毁（除非池满被丢弃），所以复用的是同一个 ViewHolder 实例与视图，`onBindViewHolder` 会带上新的位置与新数据；真正的视图销毁发生在 ViewHolder 被完全丢弃时。由此带来的经典 bug 是「异步加载图片回来后设置到了复用的 ViewHolder 上」（图片错位），解决方式是给 ViewHolder 打上标记（tag 或请求 ID）并在回调里比对，或用 Glide/Coil 这类库自带的请求管理。

**多线程集合、JVM 回收与 GC Roots**

ArrayList 的 `add` 不是线程安全的：多线程并发添加会丢数据（两个线程读到同一个 size 后互相覆盖）、可能抛 `ArrayIndexOutOfBoundsException`（扩容与写入竞态）、以及读到中间状态。线程安全的替代按场景选：`CopyOnWriteArrayList` 适合读多写极少（写时整体复制，读不加锁，写开销 O(n)、内存翻倍），`ConcurrentLinkedQueue` 适合高并发队列（CAS 无锁、不阻塞、但不支持随机访问与按索引取），`Collections.synchronizedList` 是简单加锁包装（复合操作仍需手动同步），`Vector` 已淘汰。答题时给出「按读写比选」的判断，比只报名称更有价值。

JVM 垃圾回收的原理按「如何判定 + 如何回收」讲：判定用可达性分析（从 GC Roots 出发标记可达对象，不可达的即可回收），回收算法有标记清除（内存碎片）、标记复制（新生代，浪费一半空间但效率高）、标记整理（老年代，无碎片但移动成本高），分代收集把不同生命周期的对象分开处理。标记为垃圾的标准是「从 GC Roots 不可达」，并且要提 `finalize`（已废弃，仅说明历史机制）。GC Roots 包括：虚拟机栈中局部变量表引用的对象（方法参数与局部变量）、方法区中类静态属性引用的对象、常量引用的对象、本地方法栈 JNI 引用的对象、活跃线程对象、以及 JVM 内部引用（基本类型 Class、常驻异常、系统类加载器、被同步锁持有的对象）。要能补一句可达性分析的边界：软引用在内存不足时回收、弱引用下次 GC 就回收、虚引用仅用于回收通知。

内存泄漏的常见场景在 Android 上尤其典型：静态变量持有 Activity/Context（单例传了 Activity 的 context）、非静态内部类/匿名类（Handler、Runnable、回调）隐式持有外部 Activity、未注销的监听器与广播、资源未关闭（Cursor、流、`Bitmap`）、线程池里的长任务持有引用、以及 WebView。定位工具是 Android Profiler（内存实时曲线 + Heap Dump）、LeakCanary（自动检测并给出引用链）、MAT（分析 hprof 的支配树与 GC Roots 路径）；解决思路是缩短生命周期（用 ApplicationContext、静态内部类加弱引用、在 `onDestroy` 注销与取消）、及时关闭资源、以及用工具验证泄漏确实消失。

**多进程通信与 Binder 的死亡感知**

Android 多进程通信的方式包括：Binder/AIDL（最常用，跨进程方法调用）、Messenger（基于 Binder 的消息队列，串行、简单）、ContentProvider（跨进程数据共享）、Socket 与文件/共享内存（低频、大数据量时用）、以及广播（松散、非定向）。Binder 的机制要讲清：它是基于内存映射的一次拷贝（相比 Socket 的两次拷贝更高效），通过 ServiceManager 注册与查询，客户端拿到的是代理对象（Proxy），服务端是 Stub。

「service 能不能知道 client 死掉了」可以通过 `DeathRecipient`（`linkToDeath`）实现：客户端注册死亡通知后，服务端在 Binder 驱动通知 client 的 Binder 引用失效时收到回调，从而清理资源；反过来客户端感知服务端死亡可以用 `ServiceConnection` 的 `onServiceDisconnected` 或同样注册死亡通知。要说明这是 Android 进程管理里非常重要的一环——不做死亡感知就会出现「服务端已死但客户端仍持有代理」导致的调用失败或卡顿。

**数组逆序、HTTP/TCP 与 Schema**

有序数组（1~10）逆序最快的做法是双指针原地交换（`i` 从头、`j` 从尾，交换后向中间靠拢），O(n/2) 次交换、O(1) 空间；如果只是要「输出」逆序而不用修改数组，倒序遍历即可（O(n) 时间、无额外空间）；也可以用 `Collections.reverse` 或语言内置的 `reversed`。无序数组要变成 10~1 就必须先排序再逆序（O(n log n)），如果元素恰好是 1~n 的一个排列，可以用「值放到对应下标」的方式做到 O(n)（把值为 v 的元素换到下标 v-1 处），但通用情况还是要排序。

HTTP 最核心的方法是 GET、POST、PUT、DELETE（了解 PATCH/HEAD/OPTIONS 更好）：它们分别对应查、建、改、删，其中 GET/PUT/DELETE 应当是幂等的，POST 不幂等。HTTP 基于 TCP/IP 协议栈（HTTP/1.1 与 HTTP/2 跑在 TCP 上，HTTP/3 换成 QUIC 跑在 UDP 上），应用层协议依赖传输层提供可靠字节流。TCP 是三次握手。最后一次 ACK 丢失的处理要讲清「谁在等」：客户端发完 ACK 后认为连接已建立，若该 ACK 丢失，服务端会因没收到确认而超时重传 SYN+ACK，客户端收到重复的 SYN+ACK 会重发 ACK（因为自己处于 ESTABLISHED 状态）；若服务端多次重传仍无响应，则释放半连接资源。所以不会导致连接状态不一致，只是延迟建立并消耗一次重传。要顺带说清「为什么 TIME_WAIT 是 2MSL」——保证最后那个 ACK 有机会到达、并让旧连接的延迟报文在网络中消散。

Schema（应为 JSON Schema 或 Protobuf/Thrift 的 schema）的编写要点是定义字段名、类型、是否必填、取值范围与默认值，并对嵌套结构递归描述；跨语言序列化用 Protobuf 时还要给字段分配编号且编号一旦发布不能改（否则解析错位）。中文处理的两个坑：一是编码统一用 UTF-8（源文件、传输、存储三处都要一致，避免出现乱码）；二是在 JSON 里中文可以直接放（UTF-8）或转义为 `\uXXXX`，如果要控制体积或某些网关限制非 ASCII 字符，就做转义；此外还要注意长度限制按「字符数还是字节数」计算（中文一个字符通常占 3 字节），以及排序与比较时的排序规则（collation）对中文的影响。

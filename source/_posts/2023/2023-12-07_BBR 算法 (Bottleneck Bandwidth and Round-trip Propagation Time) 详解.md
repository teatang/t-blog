---
title: BBR 算法 (Bottleneck Bandwidth and Round-trip Propagation Time) 详解
date: 2023-12-07 06:24:00
tags:
  - 2023
  - 拥塞控制算法
  - 代理协议
  - 计算机网络
categories:
  - 计算机网络
  - 代理协议
---

> **BBR (Bottleneck Bandwidth and Round-trip Propagation Time)** 是由 Google 开发的一种 TCP 拥塞控制算法。与传统的基于丢包的拥塞控制算法（如 Cubic, Reno）不同，BBR 专注于**测量网络瓶颈带宽 (Bottleneck Bandwidth) 和往返传播时间 (Round-trip Propagation Time)**，并以此为基础来控制发送速率，旨在达到高吞吐量和低延迟的最佳平衡。

{% note info %}
核心思想：**基于带宽和 RTT 测量，而不是丢包，来探知网络的实际容量，从而更精准地控制发送速率，避免不必要的丢包，并充分利用带宽。**
{% endnote %}
------

## 一、为什么需要 BBR？

传统的 TCP 拥塞控制算法（如 Cubic、Reno）主要依赖于**丢包**作为网络拥塞的信号。它们的工作原理是：

1.  不断增加发送窗口，直到出现丢包。
2.  丢包发生后，认为网络拥塞，降低发送窗口。
3.  循环往复，形成“锯齿状”的发送速率。

这种基于丢包的机制存在以下问题：

1.  **“缓冲区膨胀” (Bufferbloat)**：
    *   现代网络设备通常拥有较大的缓冲区。当网络开始拥塞时，数据包不会立即被丢弃，而是先在这些缓冲区中排队。
    *   传统的 TCP 算法会继续填充这些缓冲区，导致队列越来越长，从而显著增加数据包的**延迟 (latency)**。虽然最终没有丢包，但用户体验却变差了。
    *   只有当缓冲区完全填满后，数据包才会被丢弃，此时传统算法才感知到拥塞。
2.  **不公平竞争**：在某些场景下，丢包率高但实际带宽充足的网络中，传统算法会过早地降低发送速率，导致带宽利用率不足。
3.  **对新型网络适应性差**：传统算法在低丢包、高带宽、长延迟的网络（如数据中心内部、跨洋光纤）中表现不佳。

BBR 旨在解决这些问题，它将拥塞的信号从**丢包**转换为**更高的 RTT (round-trip time 往返时间)** 和**更低的带宽利用率**。

## 二、BBR 的核心概念与原理

BBR 的核心在于持续动态地估计网络的两个关键参数：

1.  **瓶颈带宽 (Bottleneck Bandwidth, `BtlBw`)**：
    *   路径上最慢链路的实际传输速率。VBR 通过测量发送的数据量和传输这些数据所需的时间来估算。它不是瞬时带宽，而是持续一段时间内的最大传输速率。
2.  **往返传播时间 (Round-trip Propagation Time, `RTT_min`)**：
    *   路径上数据包的最小往返时间，不包含排队延迟。这是纯粹的信号传输时间。

BBR 的目标是将发送速率调整到 `BtlBw`，同时保持在 `RTT_min` 附近，以避免在网络缓冲区中排队，从而实现高吞吐量和低延迟。

### 2.1 BBR 的数学模型 (理论发送限制)

根据网络流量控制的经典模型，一个TCP连接在理想状态下，其在途数据量（`Inflight`）应等于 `BtlBw * RTT_min`，这被称为**带宽延迟积 (Bandwidth-Delay Product, BDP)**。

*   如果 `Inflight < BDP`：连接并没有完全利用带宽，发送窗口可以增加。
*   如果 `Inflight > BDP`：连接将导致排队延迟增加，可能会导致拥塞，发送窗口应该减小。

BBR 就是根据实时测量到的 `BtlBw` 和 `RTT_min` 来动态地维持 `Inflight` 接近 `BDP`。

### 2.2 BBR 的四个阶段 (Probe)

BBR 拥塞控制算法通过在四个不同的探测阶段（`Startup`, `Drain`, `ProbeBandwidth`, `ProbeRTT`）之间循环切换，来持续测量和维护 `BtlBw` 和 `RTT_min` 的估计值，并调整发送速率：

{% mermaid %}
graph TD
    A[Idle] --> B[Startup]
    B -- Bandwidth growth slows --> C[Drain]
    C -- Inflight at BDP --> D[ProbeBandwidth]
    D -- Periodically, to refresh RTT_min --> E[ProbeRTT]
    E -- RTT_min refreshed --> D
    D -- High loss / Congestion --> D
{% endmermaid %}

1.  **Startup (启动阶段)**：
    *   目标：快速增加发送速率以探测网络的实际 `BtlBw`。
    *   行为：类似传统 TCP 的慢启动，但`cwnd`和`pacing_rate`（发送速率）呈指数级增长，直到 `BtlBw` 的增长出现停滞。
    *   判断：当 `BtlBw` 的增长率低于某个阈值（例如 1.25 倍）时，认为已经达到瓶颈带宽边缘，进入 `Drain` 阶段。

2.  **Drain (排空阶段)**：
    *   目标：在 `Startup` 阶段快速填充缓冲区后，快速排空网络队列，使在途数据量回到 `BDP`，从而降低延迟。
    *   行为：`pacing_rate` 被设置为 `BtlBw` 的很小一部分（例如 0.75倍），持续发送直到在途数据量降至 `BDP`。
    *   判断：当在途数据量接近 `BDP` 时，进入 `ProbeBandwidth` 阶段。

3.  **ProbeBandwidth (探测带宽阶段)**：
    *   目标：这是 BBR 的主要工作阶段。在此阶段，BBR 保持发送速率在 `BtlBw` 附近，并且周期性地轻微提升发送速率，以探测是否有新的可用带宽。
    *   行为：`pacing_rate` 以一个周期性的模式在 `BtlBw` 的 5/4 倍和 3/4 倍之间波动，同时跟踪新的 `BtlBw`。这种波动称为**增益周期 (gain cycle)**，通常持续 8 个 RTT 周期。
        *   **高增益 (High Gain)**：以高于 `BtlBw` 的速率发送，尝试填充潜在的额外带宽。
        *   **低增益 (Low Gain)**：以低于 `BtlBw` 的速率发送，有助于排出之前高增益阶段可能积累的队列，并探测`RTT_min`。
    *   判断：根据是否有新的更快的 `BtlBw` 估计值，调整 `pacing_rate`。

4.  **ProbeRTT (探测 RTT 阶段)**：
    *   目标：周期性地测量真实的 `RTT_min`，因为网络路径中的 `RTT` 可能会随时间变化。
    *   行为：当 `RTT` 在一段时间内 (例如 10 秒) 没有达到其历史最小值时，BBR 会强制性地将发送窗口`cwnd`降低到 4 个数据包，持续至少一个 `RTT_min` 的时间。
    *   结果：通过这种方式，BBR 排空了所有网络队列，从而可以精确地测量到当前的纯粹 `RTT_min`。完成后，返回 `ProbeBandwidth` 阶段。

## 三、BBR 的优势与不足

### 3.1 优势：

1.  **更高的吞吐量**：在高带宽、高延迟或一定丢包率的网络中，BBR 能更好地利用可用带宽，实现更快的传输速度。
2.  **更低的延迟**：BBR 避免了过度填充缓冲区，从而显著减少了网络排队延迟 (`queueing delay`)，提升了交互式应用的响应速度。
3.  **对丢包的鲁棒性**：BBR 不完全依赖丢包作为拥塞信号，因此在适度丢包但带宽充足的网络中，表现优于传统算法。
4.  **对带宽探测更精准**：通过持续测量 `BtlBw` 和 `RTT_min`，更准确地匹配网络实际容量。
5.  **公平性改善**：BBR 旨在获取其应有的带宽份额，而不会像传统算法那样在共享瓶颈时过度让步。

### 3.2 不足：

1.  **公平性问题 (BBRv1)**：在 BBRv1 中，如果与大量传统的 Cubic 连接共存，BBR 可能会表现得过于“激进”，抢占更多带宽，导致 Cubic 连接性能下降。这是因为 Cubic 看到丢包会退让，而 BBR 不太会因丢包而退让。BBRv2 在这方面有所改进。
2.  **TCP Overhead (开销)**：BBR 算法需要持续的测量和状态维护，这可能引入轻微的 CPU 开销，但通常可以忽略不计。
3.  **部署**：需要内核支持，目前主要在 Linux 内核上广泛使用（版本 4.9 及更高）。
4.  **对短连接可能效果不明显**：BBR 的优势主要体现在长连接和持续传输任务上。对于大量短连接，握手和慢启动阶段依然占据主要时间。

## 四、如何启用 BBR？

BBR 算法在 Linux 内核 4.9 及以上版本中可用。

### 4.1 检查内核版本

```bash
uname -r
```
如果版本低于 4.9，则需要升级内核。

### 4.2 启用 BBR

在 `/etc/sysctl.conf` 文件中添加以下行：

```
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
```

*   `net.core.default_qdisc=fq`：`fq` (Fair Queue) 是 BBR 推荐的队列调度算法，它有助于 BBR 更准确地进行带宽测量和速率控制。
*   `net.ipv4.tcp_congestion_control=bbr`：将 TCP 拥塞控制算法设置为 BBR。

保存文件后，执行以下命令使配置生效：

```bash
sudo sysctl -p
```

### 4.3 验证 BBR 是否启用成功

```bash
sysctl net.ipv4.tcp_congestion_control
```
如果输出是 `net.ipv4.tcp_congestion_control = bbr`，则表示 BBR 已成功启用。

还可以通过以下命令查看当前活跃的 TCP 连接正在使用的拥塞控制算法：

```bash
ss -afi | grep bbr
```
如果看到 `bbr` 字样，说明连接正在使用 BBR。

## 五、BBRv2 的改进

Google 认识到 BBRv1 在与传统拥塞控制算法共存时的公平性问题，以及对丢包的适应性有时不足。因此，他们开发了 BBRv2，主要改进包括：

1.  **更强的公平性**：BBRv2 在遇到严重丢包或瓶颈带宽被其他 Cubic 流量完全占据时，能够更合理地降低发送速率，实现与其他算法的更公平共存。
2.  **丢包敏感度提升**：BBRv2 在高丢包率下能够更积极地降低 Inflight，防止不必要的丢包。
3.  **更优的主动探测**：改进了 `ProbeBandwidth` 阶段的逻辑，使其在探测新带宽时更加稳定和高效。
4.  **更智能的 `RTT_min` 探测**：改进了 `ProbeRTT` 阶段，使其能够更准确地判断是否需要重置 `RTT_min`。

BBRv2 仍在积极开发和部署中，逐渐取代 BBRv1 成为默认选择。

## 六、总结

BBR 算法是 TCP 拥塞控制领域的一项重大创新，它通过基于带宽和 RTT 测量而非丢包信号，极大地改善了网络传输的吞吐量和延迟，尤其在长距离、高带宽、低丢包的网络环境中表现卓越。它的出现有效缓解了“缓冲区膨胀”问题，为用户提供了更流畅、更迅速的网络体验。随着 BBRv2 的不断完善，BBR 将在未来的互联网中扮演越来越重要的角色。
---
title: MTU (Maximum Transmission Unit) 与 MSS (Maximum Segment Size) 详解
date: 2024-11-22 06:24:00
tags:
  - 2024
  - 计算机网络
  - 网络技术
categories:
  - 计算机网络
  - 网络技术
---

> 在计算机网络中，**MTU (Maximum Transmission Unit - 最大传输单元)** 和 **MSS (Maximum Segment Size - 最大报文段长度)** 是两个至关重要的概念，它们直接影响着网络数据传输的效率、链路的健壮性以及应用程序的性能。理解这两个参数的区别、它们如何协同工作以及它们在网络通信中的作用，对于优化网络配置、诊断性能问题具有深远的意义。简而言之，MTU 关注网络层及以下的最大数据帧大小，而 MSS 则关注传输层 TCP 报文段中应用数据的最大大小。

{% note info %}
核心思想：MTU 限制了IP数据包在物理链路上的最大尺寸，而 MSS 限制了TCP数据段的大小，以避免在IP层发生分片，从而提高网络传输效率和减少重传开销。
{% endnote %}
------

## 一、MTU (Maximum Transmission Unit)

### 1.1 定义

**MTU (Maximum Transmission Unit - 最大传输单元)** 是指**网络层**可以一次性发送的最大 IP 数据包大小（包括 IP 头部和数据部分），但不包括数据链路层（如以太网）的帧头和帧尾。它是一个**链路层特性**，由网络接口或链路类型决定。

### 1.2 为什么存在 MTU？

*   **资源限制**：早期的网络设备内存和处理能力有限，无法处理过大的数据块。
*   **并发性**：大数据包会长时间占用链路，导致其他数据包等待，增加延迟。小数据包可以提高链路的并发性。
*   **差错控制**：数据包越大，在传输过程中发生错误导致整个数据包重传的概率就越高。小数据包可以缩小重传的粒度。

### 1.3 常见的 MTU 值

*   **以太网 (Ethernet)**：`1500 字节` (最常见)。
*   **PPPoE (Point-to-Point Protocol over Ethernet)**：由于 PPP 头部和 PPPoE 头部会占用 IP 包的一部分，因此在标准以太网 1500 字节 MTU 的基础上，PPPoE 的有效 MTU 通常是 `1492 字节` (1500 - 8 字节 PPPoE 头 - 6 字节 PPP 头)。
*   **IPv6 Jumbo Frames**：支持更大的 MTU，例如 9000 字节，适用于高性能网络。
*   **光纤网络**：通常使用比以太网更大的 MTU，但也可能被中间设备限制。

### 1.4 IP 分片 (IP Fragmentation)

当一个 IP 数据包的大小超过了其传输路径上任何一个链路的 MTU 时，路由器会将其切割成更小的片段 (Fragments)，每个片段的大小都不超过该链路的 MTU。这个过程称为**IP 分片**。

*   **分片过程**：
    1.  发送主机或中间路由器检查数据包大小是否大于下一跳接口的 MTU。
    2.  如果大于，则将原始 IP 数据包分成多个独立的片段。
    3.  每个片段都有独立的 IP 头部，其中包含源 IP、目的 IP、标识符 (Identification)、片偏移 (Fragment Offset) 和标志 (Flags - MF 位，表示“更多片段”或“最后一个片段”)。所有片段共享相同的标识符。
    4.  这些片段独立地在网络中传输，并通过目的 IP 地址路由。
*   **重组过程**：
    1.  只有**目的主机**负责将所有接收到的片段重新组装成原始的 IP 数据包。
    2.  如果任何一个片段丢失，目的主机将无法重组完整的 IP 数据包，并会丢弃所有接收到的片段（需要上层协议重传）。

#### 1.4.1 IP 分片的优缺点

*   **优点**：
    *   **适应异构网络**：允许不同 MTU 值的网络之间传输数据。
    *   **灵活性**：无需所有链路都具有相同的 MTU。
*   **缺点**：
    *   **增加开销**：每个片段都有 IP 头部，增加了网络带宽的消耗。
    *   **增加处理器负担**：路由器和目的主机需要额外的处理来分片和重组。
    *   **降低可靠性**：任何一个片段的丢失都会导致整个原始数据包的重传，效率低下。
    *   **防火墙问题**：防火墙可能会因为无法识别分片所属的完整数据包而丢弃分片，或者在进行状态检测时遇到困难。
    *   **安全风险**：分片攻击可能被滥用来绕过防火墙或入侵检测系统。

### 1.5 PMTUD (Path MTU Discovery)

为了避免 IP 分片带来的问题，现代网络通常采用 **PMTUD (Path MTU Discovery - 路径 MTU 发现)** 机制。

*   **工作原理**：
    1.  源主机发送数据包时，将 IP 头部中的 **DF (Don't Fragment - 不要分片)** 标志位设置为 1。
    2.  当数据包经过一个 MTU 小于数据包大小的路由器时，该路由器不会对数据包进行分片，而是**丢弃**它。
    3.  同时，该路由器会向源主机发送一个 **ICMP "Destination Unreachable - Fragmentation Needed and DF Set" (需要分片但 DF 标志位已设置)** 消息，其中包含该路由器接口的 MTU 值。
    4.  源主机收到 ICMP 消息后，会减小其发送数据包的大小（或调整 TCP MSS），并重传数据包。
    5.  这个过程重复进行，直到找到达到目的地的最小 MTU 值，即**路径 MTU (Path MTU)**。

*   **PMTUD 的作用**：在整个数据传输路径上动态地找到最小 MTU，并调整发送数据包的大小，从而避免不必要的 IP 分片，提高传输效率和可靠性。

## 二、MSS (Maximum Segment Size)

### 2.1 定义

**MSS (Maximum Segment Size - 最大报文段长度)** 是指 TCP 连接的每一端愿意接收的、**不包含 TCP 头部和 IP 头部**的**最大 TCP 报文段的大小**。它是**传输层 (TCP) 的概念**。

### 2.2 为什么存在 MSS？

MSS 的引入是为了**避免 IP 分片**。TCP 协议在建立连接时会进行 MSS 协商，双方告知对方自己能接收的最大数据段长度，从而确保发送的数据报文段不会超过链路的 MTU。

### 2.3 MSS 的计算

MSS 是根据 MTU 计算得出的：

`MSS = MTU - IP 头部长度 - TCP 头部长度`

*   **IP 头部长度**：通常是 20 字节 (IPv4)，如果包含选项则会更长。
*   **TCP 头部长度**：通常是 20 字节，如果包含选项则会更长。

**示例：**
*   **标准以太网 (MTU = 1500 字节) 的 MSS**：
    `MSS = 1500 - 20 (IP头) - 20 (TCP头) = 1460 字节`
*   **PPPoE (MTU = 1492 字节) 的 MSS**：
    `MSS = 1492 - 20 (IP头) - 20 (TCP头) = 1452 字节`

### 2.4 MSS 的协商过程

*   **三次握手**：MSS 协商发生在 TCP 连接建立的**三次握手 (Three-Way Handshake)** 过程中。
*   **SYN 标志位**：在 TCP SYN 和 SYN-ACK 报文段中，都会有一个 MSS 选项。
*   **各自声明**：客户端在发送 SYN 时，声明自己能够接收的 MSS 大小。服务器在发送 SYN-ACK 时，也声明自己能够接收的 MSS 大小。
*   **取最小值**：双方会根据对方声明的 MSS 值、自身 MTU 和路径 MTU 发现 (PMTUD) 的结果，最终选择一个合适的 MSS 值。通常是取双方声明的 MSS 和路径 MTU 派生出的 MSS 中的最小值，作为该 TCP 连接的实际 MSS。

{% mermaid %}
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: SYN (MSS=1460)
    Server->>Client: SYN, ACK (MSS=1460)
    Note over Client,Server: 双方协商的MSS通常为1460 (如果路径MTU为1500)
    Client->>Server: ACK
    Note over Client,Server: TCP连接建立完成，双方将发送MSS不超过1460字节的数据
{% endmermaid %}

### 2.5 MSS 和 IP 分片的区别

| 特性     | MTU (Maximum Transmission Unit)            | MSS (Maximum Segment Size)                       |
| :------- | :----------------------------------------- | :----------------------------------------------- |
| **协议层** | 网络层及以下 (数据链路层协议特性)          | 传输层 (TCP 协议特性)                          |
| **包含内容** | IP 头部 + 数据 (包括传输层头部和应用数据) | 仅指应用数据部分 (不含 IP 头部、TCP 头部)      |
| **作用** | 限制 IP 数据包在特定链路上的最大传输大小   | 限制 TCP 报文段在 IP 层**不分片**的最大数据量 |
| **协商** | 非协商，由链路物理特性决定，通常通过 PMTUD 发现路径最小 MTU。 | 在 TCP 连接建立时（三次握手）协商确定。        |
| **处理** | 若超过链路 MTU，则发生 IP 分片或丢弃 (若设置 DF)。 | 报文段大小永远不会超过 MSS，因此避免了 IP 分片。 |
| **单位** | 字节                                       | 字节                                             |

### 2.6 TCP MSS Clamping

在一些网络设备（如路由器、防火墙）上，为了解决 PPPoE 等场景下 MTU 不匹配导致的问题（例如 PMTUD 失败），会使用 **TCP MSS Clamping (TCP MSS 钳制)** 技术。

*   **工作原理**：当 TCP 连接的 SYN 请求经过这些设备时，设备会检查报文中的 MSS 选项。如果 MSS 值大于预设的最大值（例如为 PPPoE 链路设置 1452），设备会**强制修改**报文中的 MSS 值为一个较小的值（例如 1452），然后转发。
*   **作用**：主动确保 TCP 连接双方协商的 MSS 小于或等于 PMTU 减去 IP/TCP 头部开销，从而强制避免 IP 分片，提高传输效率。

## 三、MTU 和 MSS 对网络性能的影响

*   **过小的 MTU/MSS**：
    *   **增加头部开销**：每个数据包的头部相对数据部分的比例增加。例如，传输 14600 字节数据，如果 MSS 是 1460，需要 10 个数据包；如果 MSS 是 146，则需要 100 个数据包，头部开销增加 10 倍。
    *   **增加处理负担**：发送方和接收方需要处理更多的数据包（比如更频繁的上下文切换、定时器事件）。
    *   **ACK 延迟**：TCP 拥塞控制和流量控制机制会受到影响。
*   **过大的 MTU/MSS**：
    *   **导致 IP 分片**：如果 MTU 太大，但在路径上遭遇了更小的 MTU 链路，就会导致 IP 分片。分片会降低可靠性（一个片段丢失导致整个重传）、增加 CPU 负担、可能被防火墙丢弃。
    *   **PMTUD 失败**：有些防火墙或糟糕的路由器可能会阻止 ICMP 错误消息，导致 PMTUD 失败。此时，源主机无法得知正确的路径 MTU，会一直尝试发送过大的数据包，最终导致“黑洞”现象（数据包被默默丢弃，连接陷入停滞）。

### 3.1 最佳实践

*   **标准以太网环境**：默认 MTU 1500 字节，MSS 1460 字节通常工作良好。
*   **PPPoE 环境**：将 MTU 设置为 1492 字节，MSS 设置为 1452 字节，或启用 TCP MSS Clamping。
*   **光纤、隧道等特殊环境**：根据具体情况调整 MTU。例如，在 VPN 隧道或其他封装协议中，原始 IP 包会被添加额外的头部而变大，需要相应减小内部的 MTU/MSS 以避免隧道内分片。
*   **确保 ICMP 消息畅通**：不要在防火墙中盲目禁用所有 ICMP 消息，特别是 PMTUD 所需的 ICMP "Fragmentation Needed" 消息。

## 四、代码示例 (Linux 系统命令)

虽然 MTU/MSS 是协议层的概念，但它们可以通过系统命令进行查看和配置。

### 4.1 查看网卡 MTU (Linux)

```bash
# 查看所有网卡 MTU
ip link show

# 查看特定网卡（例如 eth0 或 ens33）的 MTU
ip link show eth0
# 或
ifconfig eth0 | grep MTU # ifconfig 已被 ip 命令取代，但仍广泛使用
```

**示例输出：**
```
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP mode DEFAULT group default qlen 1000
    link/ether 00:0c:29:ab:cd:ef brd ff:ff:ff:ff:ff:ff
```
这里 `mtu 1500` 表示该网卡的 MTU 是 1500 字节。

### 4.2 设置网卡 MTU (Linux)

```bash
# 临时设置 MTU (立即生效，重启后失效)
sudo ip link set eth0 mtu 1492

# 使配置永久生效（取决于 Linux 发行版）：
# Debian/Ubuntu (修改 /etc/network/interfaces)
# auto eth0
# iface eth0 inet dhcp
#    mtu 1492

# CentOS/RHEL (修改 /etc/sysconfig/network-scripts/ifcfg-eth0)
# MTU="1492"
```

### 4.3 查看 TCP MSS (Linux)

MSS 是在 TCP 连接建立时协商的，无法直接通过系统命令查看一个通用值。但可以通过抓包工具（如 Wireshark）查看特定 TCP 连接的 SYN/SYN-ACK 报文中的 MSS 选项。

例如，通过 `netstat` 或 `ss` 命令可以查看当前活动的 TCP 连接信息，但通常不直接显示 MSS。

```bash
# 查看网络统计信息，不包含 MSS
netstat -s
ss -s
```

### 4.4 配置 TCP MSS Clamping (Linux 路由器)

在 Linux 作为路由器时，可以使用 `iptables` 来实现 TCP MSS Clamping。

```bash
# 假设 eth0 是内部 LAN 接口，eth1 是连接 PPPoE 的 WAN 接口
# 将出站流量的 MSS 钳制到 1452，以适应 PPPoE 链路 MTU 1492
sudo iptables -t mangle -A FORWARD -o eth1 -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1452

# 对于入站流量，将 MSS 也钳制到 1452
sudo iptables -t mangle -A FORWARD -i eth1 -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1452

# 保存 iptables 规则 (根据发行版而异)
# sudo service netfilter-persistent save
```

## 五、总结

MTU 和 MSS 是网络通信中相互关联且至关重要的两个参数。MTU 决定了IP数据包在特定链路上的总大小限制，而 MSS 则在 TCP 层面规范了数据报文段的有效载荷大小，旨在完美适配链路 MTU，避免 IP 分片。理想情况下，通过 PMTUD 机制或 MSS 钳制技术，TCP 连接的 MSS 总是能够调整到最优值，确保数据包在整个路径上无需分片就能高效传输。合理配置和理解 MTU/MSS 对于诊断网络性能瓶颈、保障数据传输的可靠性以及构建健壮的网络架构具有不可替代的价值。
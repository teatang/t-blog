---
title: STUN (Session Traversal Utilities for NAT) 详解
date: 2024-02-12 06:24:00
tags:
  - 2024
  - STUN
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---

> **STUN (Session Traversal Utilities for NAT)，即 NAT 会话穿越工具**，是一种网络协议，它允许位于**NAT (Network Address Translation，网络地址转换)** 设备之后的客户端发现其外部（公共）IP 地址和端口号，以及 NAT 设备的类型。STUN 的主要目的是协助建立对等连接 (P2P)，尤其是在 VoIP、视频会议和 WebRTC 等实时通信应用中。

{% note info %}
核心思想：**帮助内网主机探测 NAT 类型和获取公网 IP:Port，为 P2P 连接做准备。**
{% endnote %}
------

## 一、为什么需要 STUN？

现代互联网中，IPv4 地址资源日益枯竭，导致大多数终端设备都部署在 NAT 设备（如路由器）之后。NAT 设备通过将内部私有 IP 地址映射到外部公共 IP 地址和端口，允许多个内部设备共享一个公共 IP 地址访问互联网。

然而，NAT 给直接的点对点 (P2P) 通信带来了巨大的挑战：

1.  **内网 IP 地址不可路由**：内部私有 IP 地址在公共互联网上是不可见的，外部设备无法直接通过私有 IP 地址联系到内部设备。
2.  **端口映射不确定**：NAT 设备会动态地将内部端口映射到外部端口。这个映射关系对内部设备是透明的，且可能每次连接时都会变化。内部设备不知道自己对外暴露的“实际”公共地址和端口是什么。
3.  **NAT 类型多样**：不同类型的 NAT 设备（例如，全锥型 NAT、地址受限锥型 NAT、端口受限锥型 NAT、对称型 NAT）对数据包的转发规则不同，这会影响 P2P 连接的成功率。

在 VoIP、视频聊天 (如 WebRTC) 等应用中，客户端需要直接建立连接以实现低延迟通信，而传统的客户端-服务器模式会导致流量绕道服务器，增加延迟和服务器负担。STUN 就是为了解决这些 NAT 穿越问题而诞生的工具。

## 二、STUN 的工作原理

STUN 主要通过一次简单的请求/响应交换来帮助客户端：

1.  **客户端查询外部 IP 和端口**：
    *   客户端向一个公共的 STUN 服务器发送一个 **STUN Binding Request** 报文。
    *   这个请求报文通过客户端所在的 NAT 设备，NAT 设备会对其进行端口映射，创建一个外部 IP:Port 的映射。
2.  **STUN 服务器响应**：
    *   STUN 服务器收到请求后，会从报文的源 IP 地址和源端口中提取出客户端的**公共 IP 地址和端口号**，因为这些正是 NAT 设备转换后的外部地址和端口。
    *   服务器将这些公共地址和端口封装在 **STUN Binding Response** 报文中，发送回客户端。
3.  **客户端获取信息**：
    *   客户端收到响应后，就能知道自己对外可见的公共 IP 地址和端口号是什么。

**STUN 的主要查询内容包括：**

*   **NAT 后的公共 IP 地址和端口**：这是 STUN 最基本的功能。
*   **NAT 类型**：通过发送不同种类的 STUN 请求（例如，从同一 STUN 服务器的不同 IP 地址或端口发送请求，或者向 STUN 服务器请求从其他地址回复），客户端可以推断出其 NAT 设备的具体类型。

### 2.1 STUN 的报文格式 (简化)

STUN 报文通常基于 UDP 传输，报文结构包含：

*   **消息类型 (Message Type)**：指示是请求 (Binding Request)、响应 (Binding Response) 还是错误 (Error Reponse) 等。
*   **事务 ID (Transaction ID)**：客户端生成的唯一标识符，用于匹配请求和响应。
*   **属性 (Attributes)**：报文的核心部分，包含各种信息。
    *   `MAPPED-ADDRESS`：包含 STUN 服务器观测到的客户端的公共 IP 地址和端口。
    *   `XOR-MAPPED-ADDRESS`：`MAPPED-ADDRESS` 的 XOR 处理版本，用于增加安全性并兼容某些早期 NAT。
    *   `CHANGE-REQUEST`：请求 STUN 服务器从一个不同的 IP 地址和/或端口回复。
    *   `SOURCE-ADDRESS`：STUN 服务器自己的源地址和端口。
    *   `OTHER-ADDRESS`：STUN 服务器的另一个 IP 地址和端口。

### 2.2 NAT 类型的识别

客户端通过以下步骤识别 NAT 类型：

1.  客户端向 STUN 服务器 A 的 `IP1:Port1` 发送 `Binding Request`。
    *   服务器 A 响应 `MAPPED-ADDRESS` 为 `PublicIP:PublicPort`。客户端也知道自己的 `LocalIP:LocalPort`。
2.  **如果 `PublicIP:PublicPort` 等于 `LocalIP:LocalPort`**：客户端不在 NAT 后面，或者 NAT 是一个全锥型 NAT 并且客户端是 DMZ 主机。
3.  **如果 `PublicIP:PublicPort` 不等于 `LocalIP:LocalPort`**：客户端在 NAT 后面。
    *   **发送第二个请求**：客户端向 STUN 服务器 A (或者另一个 STUN 服务器 B) 发送一个 `Binding Request`，但是请求服务器从 `IP2:Port2`（STUN 服务器的另一个地址/端口）回复。
        *   **如果客户端收到回复**：说明 NAT 不会限制目的 IP 或目的端口（即，只要有外部映射，就可以收到来自任何外部 IP:Port 的回复）。这通常是**全锥型 NAT (Full Cone NAT)**。
        *   **如果客户端没有收到回复**：说明 NAT 对数据包的源 IP 或源端口做了限制。
            *   **再发送一个请求**：客户端向 STUN 服务器 A 的 `IP1:Port1` 发送 `Binding Request`，但是请求服务器使用 `IP2:Port1` 回复。
                *   **如果客户端收到回复**：说明 NAT 限制了源 IP，但不限制源端口。这通常是**地址受限锥型 NAT (Address-Restricted Cone NAT)**。
                *   **如果客户端没有收到回复**：说明 NAT 限制了源 IP 和源端口。这通常是**端口受限锥型 NAT (Port-Restricted Cone NAT)**。

4.  **对称型 NAT (Symmetric NAT)**
    *   对称型 NAT 的特点是：对于每一个新的目的 IP 地址和端口，它都会创建一个**新的**端口映射。
    *   这意味着，如果客户端使用 `LocalIP:LocalPort` 与 STUN 服务器 A 通信，NAT 映射为 `PublicIP:PublicPort_A`。如果客户端再使用 `LocalIP:LocalPort` 与 STUN 服务器 B 通信，NAT 会映射为 `PublicIP:PublicPort_B`，`PublicPort_A` 和 `PublicPort_B` 通常是不同的。
    *   STUN 客户端无法直接通过 STUN 协议获取对称型 NAT 的外部映射，因为它每次与不同目标通信时，外部映射都会改变。对于对称型 NAT，通常需要 **TURN (Traversal Using Relays around NAT)** 服务器进行中继。

{% mermaid %}
graph TD
    %% 测试一：基础连通性与公网映射
    subgraph Test1["测试 I：探测公网 IP 与端口映射 (Send to IP1:Port1)"]
        direction TB
        T1_Req["客户端发送 Binding Request<br/>目标: STUN_A (IP1:Port1)"]
        T1_Chk{"是否收到响应？"}
        T1_Fail["❌ UDP 阻断 / 防火墙拦截<br/>(UDP Blocked)"]
        T1_Map{"Mapped-Address<br/>== 本地 Local Socket？"}

        T1_Req --> T1_Chk
        T1_Chk -->|"否 (超时)"| T1_Fail
        T1_Chk -->|"是"| T1_Map
    end

    %% 无 NAT 分支
    subgraph NoNAT["公开 IP 分支 (Public IP)"]
        direction TB
        T1_Change{"测试 II (改变 IP & Port)<br/>能否收到对端跨 IP 回复？"}
        R_Open["✅ 开放因特网 (Open Internet)<br/>直连无 NAT / 公网宿主机"]
        R_SymUDP["⚠️ 对称防火墙 (Symmetric UDP Firewall)<br/>无地址转换但限制入站"]

        T1_Change -->|"收到回复"| R_Open
        T1_Change -->|"超时未收到"| R_SymUDP
    end

    %% 存在 NAT 分支
    subgraph HasNAT["NAT 存在分支 (检测锥型与对称型)"]
        direction TB
        T2_Req["测试 II：请求服务端从 (IP2:Port2) 跨地址回包"]
        T2_Chk{"是否收到回包？"}
        R_FullCone["🟢 全锥型 NAT (Full Cone / NAT 1)<br/>任意外部主机均可主动打通端口"]

        %% 判定对称 NAT
        T3_Req["测试 III：向另一独立服务器 STUN_B (IP2:Port1) 发包"]
        T3_Map{"映射公网端口是否改变？<br/>(New Mapped-Port == Old Port?)"}
        R_Symmetric["🔴 对称型 NAT (Symmetric / NAT 4)<br/>每次通信端口动态分配 (必须 TURN 中继)"]

        %% 细分限制型
        T4_Req["测试 IV：向 STUN_A 请求仅改变端口 (从 IP1:Port2 回复)"]
        T4_Chk{"是否收到回包？"}
        R_Restricted["🟡 受限锥型 / 地址限制 (NAT 2)<br/>仅允许已发过包的远端 IP 访问"]
        R_PortRestricted["🟠 端口受限锥型 (NAT 3)<br/>必须精确匹配远端 IP + Port"]

        T2_Req --> T2_Chk
        T2_Chk -->|"收到"| R_FullCone
        T2_Chk -->|"超时"| T3_Req

        T3_Req --> T3_Map
        T3_Map -->|"端口改变"| R_Symmetric
        T3_Map -->|"端口一致 (依然是锥型)"| T4_Req

        T4_Req --> T4_Chk
        T4_Chk -->|"收到"| R_Restricted
        T4_Chk -->|"超时"| R_PortRestricted
    end

    %% 跨子图决策流转
    T1_Map -->|"相同"| T1_Change
    T1_Map -->|"不同"| T2_Req

    %% 容器深色面板样式
    style Test1 fill:#0f172a,stroke:#334155,stroke-width:1.5px,color:#94a3b8
    style NoNAT fill:#0f172a,stroke:#38bdf8,stroke-width:1.5px,color:#93c5fd
    style HasNAT fill:#0f172a,stroke:#10b981,stroke-width:1.5px,color:#6ee7b7

    %% 判定菱形深色样式
    style T1_Chk fill:#1e1b4b,stroke:#818cf8,stroke-width:1.5px,color:#e0e7ff
    style T1_Map fill:#1e1b4b,stroke:#818cf8,stroke-width:1.5px,color:#e0e7ff
    style T1_Change fill:#1e1b4b,stroke:#818cf8,stroke-width:1.5px,color:#e0e7ff
    style T2_Chk fill:#1e1b4b,stroke:#818cf8,stroke-width:1.5px,color:#e0e7ff
    style T3_Map fill:#1e1b4b,stroke:#818cf8,stroke-width:1.5px,color:#e0e7ff
    style T4_Chk fill:#1e1b4b,stroke:#818cf8,stroke-width:1.5px,color:#e0e7ff

    %% 流程执行节点
    style T1_Req fill:#1e293b,stroke:#64748b,color:#f8fafc
    style T2_Req fill:#1e293b,stroke:#64748b,color:#f8fafc
    style T3_Req fill:#1e293b,stroke:#64748b,color:#f8fafc
    style T4_Req fill:#1e293b,stroke:#64748b,color:#f8fafc

    %% 结果节点配色（绿 -> 黄 -> 橙 -> 红）
    style R_Open fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#ecfdf5
    style R_FullCone fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#ecfdf5
    style R_Restricted fill:#451a03,stroke:#fbbf24,stroke-width:2px,color:#fef3c7
    style R_PortRestricted fill:#451a03,stroke:#fb923c,stroke-width:2px,color:#ffedd5
    style R_Symmetric fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fee2e2
    style T1_Fail fill:#450a0a,stroke:#ef4444,color:#fee2e2
    style R_SymUDP fill:#334155,stroke:#94a3b8,color:#f1f5f9

{% endmermaid %}


## 三、STUN 的局限性与相关技术

### 3.1 局限性

STUN 并非万能，它无法解决所有 NAT 穿越问题：

1.  **对称型 NAT (Symmetric NAT)**：STUN 无法直接帮助对称型 NAT 后面的客户端建立 P2P 连接。因为对称型 NAT 会为每个新的目的 IP 地址和端口生成一个新的外部映射，因此客户端通过 STUN 服务器获取的映射地址，在与另一个 P2P 对等体通信时可能不再适用。
2.  **防火墙**：虽然 NAT 和防火墙功能可能集成在一起，但严格的防火墙规则可能完全阻止 STUN 流量，或者阻止外部非请求连接，即使 STUN 成功获取了公共地址，P2P 连接也可能无法建立。

### 3.2 STUN 的演进与相关技术

为了解决 STUN 的局限性，特别是对称型 NAT 的问题，引入了其他协议：

1.  **TURN (Traversal Using Relays around NAT)**：
    *   TURN 是 STUN 的一个扩展，它扮演**中继服务器**的角色。
    *   当 P2P 连接无法直接建立（例如由于对称型 NAT 或严格的防火墙）时，客户端可以将所有流量发送到 TURN 服务器，TURN 服务器再将流量转发给目标对等体。
    *   优点：增加了连接成功率。
    *   缺点：数据需要经过中继服务器，增加了延迟，并消耗服务器带宽和资源。

2.  **ICE (Interactive Connectivity Establishment)**：
    *   ICE 不是一个单独的协议，而是一个**框架或机制**，它结合了最常用的 NAT 穿越技术，包括 STUN 和 TURN。
    *   ICE 客户端会尝试多种策略来建立 P2P 连接：
        *   首先尝试使用自己的私有 IP 地址和端口进行直连。
        *   然后使用 STUN 获取的公共 IP 地址和端口进行直连 (称为**服务器反射地址**)。
        *   如果直连失败，最终会使用 TURN 服务器作为中继 (称为**中继地址**) 来传输数据。
    *   ICE 确保了在大多数网络拓扑下，P2P 通信都能找到可行的路径，并且会优先选择最直接（低延迟）的连接方式。

## 四、STUN 应用场景

STUN 协议在需要 P2P 连接的实时通信领域广泛应用：

*   **VoIP (Voice over IP)**：如 SIP 电话客户端，需要发现其公共地址以便其他 SIP 用户可以直接呼叫。
*   **视频会议**：在 WebRTC 出现之前，许多视频会议软件使用 STUN 进行 NAT 穿越。
*   **WebRTC (Web Real-Time Communication)**：WebRTC 是现代浏览器和移动应用中实现实时音视频通信的基石。ICE 是 WebRTC 的核心组成部分，而 STUN 又是 ICE 的关键部分。浏览器会默认配置一些公共 STUN 服务器来获取自己的外部地址。
*   **某些在线游戏**：为了提高连接速度和减少服务器负担，P2P 联机游戏也可能使用 STUN。

## 五、总结

STUN 协议虽然简单，但对于解决 IPv4 世界中 NAT 带来的 P2P 通信障碍至关重要。它通过帮助内部客户端发现其外部可见的 IP 地址和端口，以及识别 NAT 类型，为建立直接的点对点连接奠定了基础。尽管其自身存在局限性（尤其是在对称型 NAT 环境下），但与 TURN 和 ICE 等协议结合使用时，STUN 构成了现代 WebRTC 和其他实时通信应用中强大的 NAT 穿越解决方案，确保了即使在复杂的网络环境下，用户也能享受到高效、低延迟的直接通信体验。
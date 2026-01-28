---
title: PPPoE (Point-to-Point Protocol over Ethernet) 详解
date: 2024-02-07 06:24:00
tags:
  - 2024
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---

> **PPPoE (Point-to-Point Protocol over Ethernet)**，中文常译为“**以太网上的点对点协议**”，是一种将传统的点对点协议 (PPP) 封装在以太网数据帧中的网络协议。它主要用于在以太网局域网中实现点对点连接，最常见的应用场景是**通过 DSL (数字用户线路) 或光纤等宽带接入技术向最终用户提供上网服务**。PPPoE 允许 ISP (互联网服务提供商) 对用户进行身份验证 (Authentication)、会话管理以及基于会话的计费，同时为用户分配 IP 地址和其他网络参数。

{% note info %}
核心思想：在以太网链路的基础上，模拟 PPP 连接的拨号体验，为每个用户提供独立的虚拟“隧道”，实现用户身份认证、IP地址分配和会话管理，以便进行计费和带宽控制。
{% endnote %}
------

## 一、什么是 PPPoE？

在 ADSL (非对称数字用户线路) 和早期的光纤宽带时代，ISP 需要一种机制来管理大量拨号上网的用户。传统的拨号上网（通过电话线 Modem 连接）使用的是 PPP 协议，它能够提供用户认证、IP 地址分配和加密等功能。然而，随着局域网 (LAN) 和以太网的普及，人们希望在以太网环境下也能获得类似 PPP 的功能。

PPPoE 正是为解决这一问题而设计的。它将 PPP 帧封装在以太网帧中，使得在以太网上建立虚拟的点对点连接成为可能。通过 PPPoE，每个用户都可以像拨号上网一样，通过输入用户名和密码连接到 ISP 网络，获得独立的 IP 地址和互联网访问权限。

## 二、为什么需要 PPPoE？

PPPoE 协议主要解决了以下几个核心问题：

1.  **用户认证 (Authentication)**：ISP 可以通过 PPPoE 要求用户提供有效的用户名和密码（通常使用 PAP 或 CHAP 协议），确保只有授权用户才能接入网络。这对于运营商提供服务、管理用户是基础。
2.  **IP 地址分配 (IP Address Assignment)**：ISP 不必为每个潜在用户预留固定 IP 地址。当用户拨号成功后，PPPoE 服务器会动态地为用户分配一个公共 IP 地址（或私有 IP 地址，配合 NAT）。用完即还，提高了 IP 地址的利用率。
3.  **会话管理 (Session Management)**：每个 PPPoE 连接都是一个独立的会话。ISP 可以根据单个会话来管理带宽、监控流量、设置QoS (服务质量) 和防火墙策略。
4.  **计费 (Accounting)**：由于每个用户都有独立的会话，ISP 可以精确地追踪每个用户的在线时长或流量消耗，从而实现按时间或按流量计费。
5.  **安全性**：虽然 PPPoE 本身不提供强大的加密，但其基于 PPP 的认证机制提供了基本的用户识别。
6.  **易于部署**：利用了现有以太网基础设施，用户只需一个支持 PPPoE 的客户端软件（操作系统内置或路由器内置）即可连接。

## 三、PPPoE 的工作原理

PPPoE 会话的建立通常分为两个主要阶段：**发现阶段 (Discovery Stage)** 和 **会话阶段 (Session Stage)**。

### 3.1 发现阶段 (Discovery Stage)

在发现阶段，PPPoE 客户端（用户设备，如家庭路由器或 PC）和 PPPoE 服务器（ISP 端设备，如接入服务器 BNG/BRAS）相互发现对方，并建立一个唯一的会话 ID。这个阶段使用标准的以太网广播帧进行通信。

1.  **PADI (PPPoE Active Discovery Initiation)**：
    *   客户端向以太网广播一个 PADI 帧，寻找可用的 PPPoE 服务器。
    *   PADI 帧包含客户端的 MAC 地址和它想要的服务名称（可选）。
    *   目的 MAC 地址是广播地址 (`FF:FF:FF:FF:FF:FF`)。
    *   目的 IP 地址未使用（因为客户端还没有 IP 地址）。

2.  **PADO (PPPoE Active Discovery Offer)**：
    *   所有接收到 PADI 帧的 PPPoE 服务器（例如 BNG/BRAS - Broadband Network Gateway/Broadband Remote Access Server）都会响应一个 PADO 帧。
    *   PADO 帧包含服务器的 MAC 地址、服务名称和唯一的名称标签（表示该服务器能够提供什么服务）。
    *   目的 MAC 地址是客户端的 MAC 地址（单播响应）。

3.  **PADR (PPPoE Active Discovery Request)**：
    *   客户端从多个 PADO 帧中选择一个服务器（通常是第一个响应或服务最优的），然后发送一个 PADR 帧给选择的服务器。
    *   PADR 帧包含客户端的 MAC 地址、选择的服务名称和它要启动的会话 ID（通常为零）。
    *   目的 MAC 地址是选择的服务器的 MAC 地址（单播）。

4.  **PADS (PPPoE Active Discovery Session-confirmation)**：
    *   被选择的服务器收到 PADR 帧后，会生成一个唯一的会话 ID，并发送一个 PADS 帧响应给客户端。
    *   PADS 帧包含服务器的 MAC 地址、客户端的 MAC 地址、选择的服务名称和分配给本次会话的唯一**会话 ID (Session ID)**。
    *   至此，发现阶段结束，一个点对点的 PPPoE 会话连接正式建立（逻辑链路）。

{% mermaid %}
sequenceDiagram
    participant Client as PPPoE 客户端
    participant Server as PPPoE 服务器 (ISP BRAS)

    Client->>Server: 1. PADI (Discovery Initiation) - 广播帧
    Server->>Client: 2. PADO (Discovery Offer) - 单播帧 (响应多个PADO，客户端选择一个)
    Client->>Server: 3. PADR (Discovery Request) - 单播帧 (告知选择哪个服务器)
    Server->>Client: 4. PADS (Discovery Session-confirmation) - 单播帧 (分配会话ID)
    Note over Client,Server: 发现阶段完成，会话ID建立
{% endmermaid %}

### 3.2 会话阶段 (Session Stage)

一旦会话 ID 建立，双方就可以开始使用标准的 PPP 协议进行通信。这个阶段所有的通信都是**单播**的。

1.  **LCP (Link Control Protocol - 链路控制协议)**：
    *   客户端和服务器通过 LCP 协商链路参数，例如认证类型（PAP/CHAP）、魔术数字、最大接收单元 (MRU) 等。
    *   认证 (Authentication)：客户端提交用户名和密码给服务器。
    *   服务器验证用户的凭据。

2.  **Authentication (认证)**：
    *   客户端使用协商好的认证协议（如 PAP 或 CHAP）向服务器发送用户名和密码。
    *   **PAP (Password Authentication Protocol)**：明文传输密码，安全性低。
    *   **CHAP (Challenge Handshake Authentication Protocol)**：挑战-应答机制，不直接传输密码，安全性相对较高。

3.  **NCP (Network Control Protocol - 网络控制协议)**：
    *   认证成功后，双方会进入 NCP 阶段，最常用的是 **IPCP (IP Control Protocol)**。
    *   IPCP 协商和分配 IP 地址、DNS 服务器地址、默认网关和其他 IP 相关参数给客户端。

4.  **数据传输**：
    *   一旦 IP 地址等网络参数配置完毕，客户端就可以开始通过 PPPoE 会话发送和接收 IP 数据包，接入互联网。
    *   每传输一个 IP 数据包，它都会被 PPP 封装，然后 PPP 帧再被 PPPoE 和以太网封装。

5.  **PADT (PPPoE Active Discovery Terminate)**：
    *   当客户端或服务器希望终止会话时，会发送一个 PADT 帧。
    *   PADT 帧会带上要终止的会话 ID，通知对方会话已结束。
    *   会话结束后，分配给客户端的 IP 地址会被释放。

{% mermaid %}
sequenceDiagram
    participant Client as PPPoE 客户端
    participant Server as PPPoE 服务器 (ISP BRAS)

    Client->>Server: LCP (协商链路参数)
    Server->>Client: LCP ACK (确认参数)
    Client->>Server: PAP/CHAP (发送认证凭据)
    Server->>Client: PAP/CHAP 认证结果 (成功/失败)
    alt 认证成功
        Client->>Server: IPCP (协商IP地址、DNS等)
        Server->>Client: IPCP ACK (分配IP地址、DNS等)
        Note over Client,Server: 会话阶段开始，可以传输数据 (PPPoE 封装)
        Client-->>Server: 数据包 (封装在 PPPoE/PPP/Ethernet)
        Server-->>Client: 数据包 (封装在 PPPoE/PPP/Ethernet)
    else 认证失败
        Server->>Client: LCP Terminate (终止链路)
        Note over Client,Server: 连接失败
    end
    Client->>Server: PADT (Terminate) / 服务器超时
    Server-->>Client: PADT (Terminate ACK)
    Note over Client,Server: PPPoE 会话终止
{% endmermaid %}

## 四、PPPoE 数据帧结构

PPPoE 帧是 PPP 帧封装在以太网帧中的结果。

### 4.1 以太网帧头

*   **目的 MAC 地址 (6 字节)**：在发现阶段可以是广播地址 (`FF:FF:FF:FF:FF:FF`)，在会话阶段是 PPPoE 服务器的 MAC 地址（或客户端 MAC）。
*   **源 MAC 地址 (6 字节)**：发送方的 MAC 地址。
*   **EtherType (2 字节)**：
    *   `0x8863`：表示 PPPoE 发现阶段的帧。
    *   `0x8864`：表示 PPPoE 会话阶段的帧。

### 4.2 PPPoE 头部

紧跟在以太网帧头之后是 PPPoE 专有的头部：

*   **版本 (Version - 4 bits)**：通常为 1。
*   **类型 (Type - 4 bits)**：通常为 1。
*   **Code (8 bits)**：
    *   发现阶段：PADI (`0x09`), PADO (`0x07`), PADR (`0x19`), PADS (`0x65`), PADT (`0xA7`)
    *   会话阶段：总是 `0x00`
*   **会话 ID (Session ID - 16 bits)**：由 PADS 帧分配的唯一会话标识符，在会话阶段中所有通信都携带此 ID。
*   **长度 (Length - 16 bits)**：表示 PPP Payload 的长度。

### 4.3 PPP 头部和 Payload

*   **PPP 头部（通常 2 字节）**：在会话阶段，PPPoE 头部后面是标准的 PPP 帧。PPP 帧通常以协议字段（如 `0xC021` for LCP, `0xC023` for PAP, `0xC223` for CHAP, `0x8021` for IPCP, `0x0021` for IP）开始。
*   **PPP Payload**：这部分是真正的用户数据（如 IP 包），或者更高层协议（如 LCP、IPCP、认证数据）的数据。

最终的封装结构看起来是这样的：
`Ethernet Header (MAC, EtherType) | PPPoE Header (Version, Type, Code, Session ID, Length) | PPP Header (Protocol) | PPP Payload (IP Packet/LCP/CHAP etc.) | FCS`

## 五、PPPoE 的部署与应用

### 5.1 家庭宽带接入

这是 PPPoE 最主要的应用场景。

*   **用户设备**：通常是家庭路由器（内置 PPPoE 客户端）或直接在电脑上进行 PPPoE 拨号。
*   **连接方式**：用户路由器通过网线连接到光猫 (ONT/ONU) 或 ADSL Modem，光猫/Modem 将以太网信号转换成光信号/ADSL 信号传输到 ISP 的局端设备。
*   **ISP 端**：BRAN (Broadband Remote Access Server) 设备作为 PPPoE 服务器接收用户请求，进行认证、IP 分配和会话管理。

### 5.2 企业虚拟专网 (VPN)

在某些企业环境中，PPPoE 也可能被用于在现有以太网 LAN 上建立虚拟的专用连接，实现更精细的用户管理和隔离，尽管更多时候企业会选择 IPsec VPN 或 MPLS。

## 六、总结

PPPoE 是连接了传统 PPP 和现代以太网的桥梁，它成功地将 PPP 协议的认证、授权和计费 (Authentication, Authorization, Accounting - AAA) 功能扩展到了以太网环境中。尤其是在 ADSL 和光纤宽带接入中，PPPoE 扮演着至关重要的角色，使得运营商能够高效地管理海量宽带用户。理解 PPPoE 的发现和会话阶段的工作原理，以及其帧结构，对于网络工程师和故障排除人员来说，都是掌握现代宽带接入技术的关键。尽管在一些高级企业网络或数据中心场景下，PPPoE 可能不如其他技术普遍，但其在“最后一公里”的宽带接入中，依然是不可或缺的核心协议。
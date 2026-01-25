---
title: ARP (Address Resolution Protocol) 详解
date: 2024-01-31 06:24:00
tags:
  - 2024
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---
> **ARP (Address Resolution Protocol)**，即**地址解析协议**，是一个在局域网 (LAN) 内使用的网络层协议，主要用于将**IP 地址 (网络层地址)**解析为**MAC 地址 (数据链路层地址)**。在 TCP/IP 协议栈中，当一台主机知道目标主机的 IP 地址，但需要知道其在同一物理网络上的 MAC 地址才能进行数据帧的发送时，就会使用 ARP 协议。

{% note info %}
核心思想：**将逻辑地址 (IP) 映射到物理地址 (MAC)**，使得 IP 数据包能够在数据链路层封装成帧并通过物理网络介质传输到正确的目标设备。
{% endnote %}
------

## 一、为什么需要 ARP？

在理解 ARP 之前，我们需要明确 IP 地址和 MAC 地址在网络通信中的角色：

*   **IP 地址 (Internet Protocol Address)**：工作在 **OSI 模型的第三层 (网络层)**。它是一个逻辑地址，用于在不同网络之间识别和路由数据包。IP 地址是分层的，包含网络部分和主机部分，使得路由器能够根据网络部分将数据包转发到正确的网络。
*   **MAC 地址 (Media Access Control Address)**：工作在 **OSI 模型的第二层 (数据链路层)**。它是一个物理地址，是烧录在网卡 (NIC) 上的全球唯一标识符，用于在同一物理网络段内识别设备。

当一台主机 (例如计算机 A) 要向另一台主机 (例如计算机 B) 发送数据时：

1.  **如果目标主机 B 与主机 A 处于同一个局域网内**：
    主机 A 知道主机 B 的 IP 地址，但为了在物理网络上直接发送数据帧（如以太网帧），它需要将目标 IP 地址解析成目标 MAC 地址。以太网帧头中包含目标 MAC 地址，物理网络设备（如交换机）根据 MAC 地址进行转发。**此时，ARP 协议登场。**

2.  **如果目标主机 B 与主机 A 不在同一个局域网内**：
    主机 A 知道主机 B 的 IP 地址，但它不会直接寻找主机 B 的 MAC 地址。相反，它会寻找**本地网关 (路由器)**的 MAC 地址，并将数据包发送给网关。网关收到数据包后，会根据目标 IP 地址进行路由，可能再次使用 ARP 来寻找下一跳路由器的 MAC 地址，直到数据包到达目标网络的网关。最后，目标网络的网关会使用 ARP 找到目标主机 B 的 MAC 地址，并将数据包发送给它。

简而言之，ARP 的作用就像一个**电话簿**，你输入一个人的名字 (IP 地址)，它会告诉你这个人的电话号码 (MAC 地址)，以便你能够直接联系到他（在本地网络）。

## 二、ARP 的工作原理

ARP 协议的运作基于**请求 (Request)** 和 **响应 (Reply)** 机制。以下是主机 A (IP: 192.168.1.10, MAC: AAAA) 向主机 B (IP: 192.168.1.20, MAC: BBBB) 发送数据时，寻找主机 B 的 MAC 地址的典型过程：

{% mermaid %}
sequenceDiagram
    participant HostA as 主机 A (192.168.1.10)
    participant Switch as 交换机
    participant HostB as 主机 B (192.168.1.20)
    participant OtherHosts as 其他主机

    HostA->>HostA: 1. 需要发送IP数据包到192.168.1.20
    HostA->>HostA: 2. 检查ARP缓存，未找到192.168.1.20的MAC
    HostA->>Switch: 3. 发送ARP请求 (广播帧)<br/>(目标IP: 192.168.1.20, 目标MAC: FF:FF:FF:FF:FF:FF)
    Switch->>HostB: 4. 广播ARP请求
    Switch->>OtherHosts: 5. 广播ARP请求

    HostB->>HostB: 6. 收到ARP请求，发现目标IP匹配
    HostB->>HostB: 7. 将主机A的IP-MAC映射加入ARP缓存
    HostB->>HostA: 8. 发送ARP响应 (单播帧)<br/>(源IP: 192.168.1.20, 源MAC: BBBB,<br/>目标IP: 192.168.1.10, 目标MAC: AAAA)
    OtherHosts->>OtherHosts: 9. 收到ARP请求，目标IP不匹配，丢弃

    HostA->>HostA: 10. 收到ARP响应，获取192.168.1.20的MAC (BBBB)
    HostA->>HostA: 11. 将192.168.1.20 -> BBBB 映射加入ARP缓存
    HostA->>Switch: 12. 封装数据包到帧，目标MAC: BBBB
    Switch->>HostB: 13. 转发数据帧
    HostB->>HostB: 14. 收到数据帧并处理
{% endmermaid %}

1.  **主机 A 检查 ARP 缓存**：在发送 IP 数据包之前，主机 A 会首先检查其本地的 ARP 缓存表，看是否已经有目标 IP 地址 192.168.1.20 对应的 MAC 地址。
2.  **发送 ARP 请求**：如果 ARP 缓存中没有找到，主机 A 会构建一个 ARP 请求数据包。
    *   请求数据包中包含：发送者 IP 地址 (192.168.1.10)、发送者 MAC 地址 (AAAA)、目标 IP 地址 (192.168.1.20) 和一个全零或空的 MAC 地址字段（表示请求目标 MAC）。
    *   这个 ARP 请求数据包会被封装在一个以太网帧中，**该以太网帧的源 MAC 地址是主机 A 的 MAC 地址 (AAAA)，目标 MAC 地址是广播地址 (FF:FF:FF:FF:FF:FF)**。
3.  **广播 ARP 请求**：主机 A 将这个广播帧发送到局域网。交换机收到广播帧后，会将其转发给同一局域网内的所有端口上的所有设备。
4.  **接收 ARP 请求**：局域网内的所有设备都会收到这个 ARP 请求帧。它们会检查 ARP 请求中的“目标 IP 地址”字段。
5.  **目标主机响应**：
    *   如果某个设备的 IP 地址与 ARP 请求中的“目标 IP 地址”匹配 (例如主机 B 的 IP 是 192.168.1.20)，则该设备认为自己是目标。
    *   主机 B 会将请求中发送者 (主机 A) 的 IP-MAC 映射 (192.168.1.10 -> AAAA) 存入自己的 ARP 缓存，以便之后能够直接响应。
    *   主机 B 构建一个 ARP 响应数据包。
    *   响应数据包中包含：发送者 IP 地址 (192.168.1.20)、发送者 MAC 地址 (BBBB)、目标 IP 地址 (192.168.1.10) 和目标 MAC 地址 (AAAA)。
    *   这个 ARP 响应数据包会被封装在一个以太网帧中，**该以太网帧的源 MAC 地址是主机 B 的 MAC 地址 (BBBB)，目标 MAC 地址是主机 A 的 MAC 地址 (AAAA)**。
6.  **单播 ARP 响应**：主机 B 将这个以太网帧发送给主机 A (这是一个单播帧，不再是广播)。
7.  **主机 A 接收响应**：主机 A 收到 ARP 响应后，就获取到了目标 IP 地址 192.168.1.20 对应的 MAC 地址 BBBB。
8.  **更新 ARP 缓存并发送数据**：主机 A 将 192.168.1.20 -> BBBB 的映射存入自己的 ARP 缓存，并开始将原始的 IP 数据包封装到以太网帧中，使用目标 MAC 地址 BBBB 进行发送。

## 三、ARP 缓存 (ARP Cache)

为了避免每次通信都进行 ARP 请求和响应，主机和路由器都会维护一个 ARP 缓存表 (或 ARP 表)。

*   **存储内容**：ARP 缓存存储了 IP 地址与 MAC 地址的映射关系。
*   **缓存寿命**：ARP 缓存中的条目通常会有一个**超时时间 (TTL)**。
    *   **动态条目 (Dynamic Entries)**：通过 ARP 请求/响应自动学习到的映射，具有较短的生命周期 (通常几十秒到几分钟)。
    *   **静态条目 (Static Entries)**：管理员手动配置的映射，永不超时，直到被手动删除。主要用于安全目的或特殊网络配置。
*   **优势**：减少网络中的 ARP 广播流量，提高通信效率。
*   **查看 ARP 缓存**：
    *   在 Windows 命令提示符 (cmd) 中：`arp -a`
    *   在 Linux 终端中：`ip neigh show` 或 `arp -a`

**示例 (Windows `arp -a` 输出):**
```
C:\Users\username>arp -a

Interface: 192.168.1.10 --- 0x3
  Internet Address      Physical Address      Type
  192.168.1.1           00-11-22-33-44-55     dynamic
  192.168.1.20          aa-bb-cc-dd-ee-ff     dynamic
  192.168.1.255         ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
```

## 四、ARP 协议的类型和变种

### 4.1 代理 ARP (Proxy ARP)

当 ARP 请求的目标 IP 地址与发送者不在同一物理网络段，但可以通过某个路由器到达时，路由器会响应这个 ARP 请求，向发送者提供自己的 MAC 地址。
*   **作用**：让不在同一网段的主机之间能够通过路由器进行通信，而发送者无需知道子网掩码或路由信息。
*   **缺点**：增加了 ARP 流量，可能导致性能下降和安全风险，现代网络中较少使用。

### 4.2 无故 ARP (Gratuitous ARP)

无故 ARP 是一种特殊的 ARP 帧，主机发送自己的 IP 地址和 MAC 地址映射，而不是请求其他主机的 MAC 地址。
*   **作用**：
    *   **IP 地址冲突检测**：当主机启动并配置 IP 地址时，发送无故 ARP，如果收到响应，则表示该 IP 地址已被占用。
    *   **更新 ARP 缓存**：当主机 MAC 地址发生变化 (例如网卡故障切换，VRRP/HSRP 路由器主备切换) 时，发送无故 ARP 可以及时更新其他设备中的 ARP 缓存，避免通信中断。
    *   **告知新设备**：当新的交换机连接到网络时，发送无故 ARP 可以帮助其学习主机的 MAC 地址。

## 五、ARP 的安全隐患

ARP 协议在设计时并没有考虑安全性，导致它容易受到攻击。最常见的攻击是 **ARP 欺骗 (ARP Spoofing)** 或 **ARP 缓存投毒 (ARP Cache Poisoning)**。

### 5.1 ARP 欺骗原理

攻击者 (Host C) 通过发送伪造的 ARP 响应包，使得网络中的其他设备 (Host A 和 Host B) 错误地更新其 ARP 缓存表：

1.  **欺骗 Host A**：攻击者向 Host A 发送一个伪造的 ARP 响应，声称自己是 Host B (192.168.1.20) 的 MAC 地址 (CC:CC:CC:CC:CC:CC)。Host A 会将 `192.168.1.20 -> CC:CC:CC:CC:CC:CC` 存入缓存。
2.  **欺骗 Host B**：攻击者向 Host B 发送一个伪造的 ARP 响应，声称自己是 Host A (192.168.1.10) 的 MAC 地址 (CC:CC:CC:CC:CC:CC)。Host B 会将 `192.168.1.10 -> CC:CC:CC:CC:CC:CC` 存入缓存。

{% mermaid %}
sequenceDiagram
    participant HostA as 主机 A (192.168.1.10, AAAA)
    participant Attacker as 攻击者 (192.168.1.30, CCCC)
    participant HostB as 主机 B (192.168.1.20, BBBB)

    HostA->>HostB: (正常通信前) Host A 要发数据给 Host B
    Attacker->>HostA: 1. 伪造ARP响应: 192.168.1.20 的MAC是 CCCC
    HostA->>HostA: 2. ARP缓存: 192.168.1.20 -> CCCC
    Attacker->>HostB: 3. 伪造ARP响应: 192.168.1.10 的MAC是 CCCC
    HostB->>HostB: 4. ARP缓存: 192.168.1.10 -> CCCC

    HostA->>Attacker: 5. 发送给 192.168.1.20 的数据包 (目标MAC: CCCC)
    Attacker->>HostB: 6. 攻击者转发数据包给 192.168.1.20 (可选修改)
    HostB->>Attacker: 7. 发送给 192.168.1.10 的数据包 (目标MAC: CCCC)
    Attacker->>HostA: 8. 攻击者转发数据包给 192.168.1.10 (可选修改)

    Note over Attacker: 攻击者现在是中间人，可以监听、修改或丢弃所有流量
{% endmermaid %}

### 5.2 攻击后果

*   **中间人攻击 (Man-in-the-Middle, MITM)**：攻击者可以截获 Host A 和 Host B 之间的所有流量，进行监听、篡改或重放。
*   **拒绝服务攻击 (Denial of Service, DoS)**：攻击者可以冒充网关，将所有流向外部网络的流量重定向到不存在的 MAC 地址，导致网络中断。
*   **会话劫持**：通过截获流量获取敏感信息（如会话 ID），从而劫持用户会话。

### 5.3 防范措施

1.  **静态 ARP 表**：手动为重要设备（如网关、服务器）配置静态 ARP 条目，防止其被动态修改。但这种方式不适用于大型网络。
2.  **动态 ARP 检测 (Dynamic ARP Inspection, DAI)**：交换机功能，通过检查 DHCP snooping 数据库或其他可信源来验证 ARP 数据包的合法性。非法的 ARP 包会被丢弃。
3.  **端口安全 (Port Security)**：交换机功能，限制一个端口可以学习到的 MAC 地址数量，或只允许特定 MAC 地址通过。
4.  **IP-MAC 绑定**：在路由器或服务器上将 IP 地址和 MAC 地址进行绑定，拒绝不匹配的请求。
5.  **ARP 防火墙或监测工具**：部署专门的工具来实时监测网络中的 ARP 流量，发现异常行为并告警。
6.  **加密通信**：使用 HTTPS、VPN、SSH 等加密协议，即使流量被截获，内容也难以被解密。

## 六、ARP 与 IPv6

IPv6 中不再使用 ARP。其地址解析功能由 **邻居发现协议 (Neighbor Discovery Protocol, NDP)** 取代，NDP 是 **ICMPv6 (Internet Control Message Protocol for IPv6)** 的一部分。

*   **NDP 的优势**：
    *   **多播 (Multicast) 而非广播**：NDP 使用多播地址进行请求，只发送给具有特定多播地址的设备，减少了网络中的广播风暴。
    *   **更安全**：NDP 提供了扩展性以支持安全性机制 (如 SEcure Neighbor Discovery, SEND)。
    *   **功能更丰富**：NDP 不仅能解析地址，还包括路由器发现、前缀发现、参数发现等功能，更好地支持 IPv6 的无状态自动配置。

## 七、总结

ARP 是 TCP/IP 协议栈中一个看似简单但至关重要的协议，它在网络层 (IP 地址) 和数据链路层 (MAC 地址) 之间架起了桥梁，使得数据包能够在本地网络中正确寻址和传输。尽管在 IPv6 中已被 NDP 取代，但在 IPv4 网络中，ARP 依然是核心协议。理解其工作原理对于网络管理员和开发者都至关重要，特别是要警惕其固有的安全漏洞，并采取相应的防范措施，以确保网络通信的稳定性和安全性。
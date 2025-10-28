---
title: Dokodemo-door 协议详解
date: 2023-10-01 06:24:00
tags:
  - 2023
  - 代理协议
  - 计算机网络
categories:
  - 计算机网络
  - 代理协议
---

> **Dokodemo-door (任意门)** 是 V2Ray (Project V) 中一个特殊的 Inbound (入站) 代理协议。它的设计灵感来源于哆啦A梦的“任意门”，主要作用是**将指定端口或 IP/端口范围的所有流量透明地转发到预设的目标地址**。与 SOCKS、HTTP 等常见的代理协议不同，Dokodemo-door 不期望客户端发送任何代理协议头信息，而是直接捕获并处理原始的 TCP/UDP 流量。

{% note info %}
核心思想：**透明地拦截并重定向指定端口/IP 的网络流量，无需客户端配置代理，实现“强制代理”或“透明代理”的效果。**
{% endnote %}
------

## 一、Dokodemo-door 的工作原理与用途

Dokodemo-door 协议本身并不是一个用于客户端与 V2Ray 服务端通信的“伪装”或“加密”协议（如 VMess、VLESS、Trojan）。它是一个**入站协议 (Inbound Protocol)**，这意味着它在 V2Ray 的服务器端或本地代理端接收流量。

### 1.1 工作原理

当配置了 Dokodemo-door Inbound 时，V2Ray 会监听指定的端口和/或 IP 地址。任何符合这些监听条件的 TCP 或 UDP 流量，都会被 Dokodemo-door 捕获，然后 V2Ray 会根据 Dokodemo-door 的配置，将其透明地转发到指定的 **`address`** 和 **`port`**。

这个过程对发起流量的应用程序是**完全透明**的，应用程序并不知道它的流量被 V2Ray 拦截并重定向了。

### 1.2 典型用途

Dokodemo-door 的主要用途体现在以下几个方面：

1.  **Socks/HTTP 代理流量的出口加速**：
    *   在 V2Ray 服务器上，通常会有一个 SOCKS/HTTP Inbound 接收来自客户端的代理请求。这些代理请求最终需要经过一个 Outbound (出站) 协议（如 VMess、VLESS）转发到目标网站。
    *   Dokodemo-door 可以与 SOCKS/HTTP Inbound 结合使用：当 SOCKS/HTTP Inbound 接收到客户端的请求时，它会知道客户端想访问哪个目标地址。此时，V2Ray 可以将这些请求内部转发到 Dokodemo-door Inbound，而 Dokodemo-door 配置的 `address` 和 `port` 则指向一个 Outbound。这样可以实现更灵活的路由配置。

2.  **透明代理 (Transparent Proxy)**：
    *   这是 Dokodemo-door 最常见的应用场景之一。在路由器、网关或其他具有流量转发能力的设备上，通过配合 iptables (Linux) 或其他流量重定向规则，可以将局域网内设备的**所有或部分** TCP/UDP 流量强制重定向到 V2Ray 监听的 Dokodemo-door 端口。
    *   这样，局域网内的设备（如游戏机、智能电视、手机等）无需进行任何代理配置，就能享受到 V2Ray 带来的代理服务（如访问境外网站）。
    *   此时，Dokodemo-door 的 `address` 和 `port` 配置至关重要，它会告诉 V2Ray 原始流量的目标地址是什么，以便 V2Ray 能够正确地转发。

3.  **内网穿透 / 端口转发**：
    *   将来自某个内网端口的流量，通过 V2Ray 隧道转发到另一个目标地址。

4.  **特殊流量处理**：
    *   根据 IP/端口拦截特定流量并做特殊处理，例如将所有访问特定 IP 的流量导入特定节点、进行分析等。

## 二、Dokodemo-door 配置选项

Dokodemo-door 在 V2Ray 配置文件的 `inbounds` 数组中定义。

```json
{
  "inbounds": [
    {
      "port": 12345,            // (必填) V2Ray 监听的端口
      "listen": "127.0.0.1",    // (可选) V2Ray 监听的 IP 地址，默认为 0.0.0.0
      "protocol": "dokodemo-door",
      "settings": {
        "network": "tcp",       // (可选) 监听的网络协议，可以是 "tcp", "udp", 或 "tcp,udp"，默认为 "tcp"
        "address": "8.8.8.8",   // (必填) 被 Dokodemo-door 捕获的流量将被转发到的目标 IP 或域名
        "port": 53,             // (必填) 被 Dokodemo-door 捕获的流量将被转发到的目标端口

        // 以下选项主要用于透明代理，当原始目标地址需要被 V2Ray 获取时
        "followRedirect": true, // (可选) 是否遵循重定向。
                                // 如果为 true，V2Ray 会尝试获取原始流量的真实目标地址。
                                // 通常与 iptables 重定向配合使用，捕获由 iptables 转向到 Dokodemo-door 的流量。
                                // 默认为 false。
        "timeout": 360,         // (可选) 连接超时时间（秒），默认为 300 秒。
        "userLevel": 0          // (可选) 用户等级，用于路由规则。
      },
      "sniffing": {             // (可选) 流量嗅探配置，用于识别内层协议，如 HTTP/TLS
        "enabled": true,
        "destOverride": ["http", "tls"] // 启用嗅探后，可以覆盖目标地址为嗅探到的 HTTP/TLS 域名。
      }
    }
  ],
  "outbounds": [
    // ... 其他出站协议 ...
  ]
}
```

### 2.1 `address` 和 `port` 的作用

理解 Dokodemo-door 最关键的是理解 `address` 和 `port`：

*   **如果 `followRedirect` 为 `false` (默认值)**：所有通过此 Dokodemo-door 监听端口的流量，无论其原始目标是什么，都会被强制转发到 `settings.address` 和 `settings.port` 指定的地址和端口。这适用于你明确知道所有流量都要去一个特定地址的场景（例如，强制 DNS 请求到特定的 DNS 服务器）。

*   **如果 `followRedirect` 为 `true`**：
    *   此模式通常与操作系统的流量重定向规则 (如 Linux 的 iptables) 配合使用。
    *   当操作系统将一个原本要发往 `Target_IP:Target_Port` 的流量，重定向到了 V2Ray 监听的 Dokodemo-door 端口时，V2Ray 会从操作系统提供的元数据中**尝试获取这个原始的 `Target_IP` 和 `Target_Port`**。
    *   此时，`settings.address` 和 `settings.port` **不再是最终转发的目标**，它们在这里仅仅是作为**回退 (fallback)** 或**默认目标**使用。也就是说，如果 V2Ray 成功从操作系统那里获取到了原始目标地址和端口，它就会将流量转发到原始目标；如果获取失败，才会使用 `settings.address` 和 `settings.port`。
    *   **在透明代理场景中，通常会启用 `followRedirect` 为 `true`，以确保捕获到的流量能正确地转发到其最初想要访问的目标。**

### 2.2 `sniffing` 的作用

`sniffing` (嗅探) 允许 V2Ray 识别透明代理下流量的真实协议（如 HTTP、TLS）。

*   在透明代理场景中，原始流量的目标地址是 IP 地址。但很多网站和服务是基于域名的（例如 HTTP Host 头、TLS SNI）。
*   启用 `sniffing` 后，V2Ray 会在数据流开始时尝试识别应用层协议。如果识别出 HTTP 或 TLS，它会从协议头中提取出**域名**。
*   `destOverride` 配置项允许 V2Ray 在嗅探到域名后，将内部流量的目标地址**覆盖**为这个嗅探到的域名，而不是原始的 IP 地址。这对于依赖域名进行路由或传输的主流出站协议（如 VMess、VLESS、Trojan）至关重要。

## 三、透明代理 (Transparent Proxy) 示例

以下是 Dokodemo-door 配合 `iptables` 实现透明代理的一个简化示例（通常在 Linux 路由器或网关上配置）：

**V2Ray 配置 (服务器端或本地代理端)**:

```json
{
  "inbounds": [
    {
      "port": 12345,
      "listen": "0.0.0.0", // 监听所有接口
      "protocol": "dokodemo-door",
      "settings": {
        "network": "tcp,udp",
        "followRedirect": true, // 启用重定向追踪，获取原始目标地址
        "address": "1.1.1.1",   // 回退地址，通常为公共 DNS
        "port": 53             // 回退端口
      },
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls", "fakedns"] // 嗅探并覆盖目标地址，fakedns 用于处理 DNS
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "vmess", // 例如，所有流量通过 VMess 出站
      "settings": {
        // ... VMess 连接信息 ...
      },
      "tag": "proxy"
    },
    {
      "protocol": "freedom", // 直连，用于国内流量
      "settings": {},
      "tag": "direct"
    },
    {
      "protocol": "dns", // DNS 出站
      "settings": {
        "servers": [
          "1.1.1.1",
          {
            "address": "8.8.8.8",
            "port": 53,
            "domains": ["geosite:google"] // 可以根据域名使用不同的DNS服务器
          }
        ]
      },
      "tag": "dns_out"
    }
  ],
  "routing": {
    "domainStrategy": "AsIs",
    "rules": [
      {
        "type": "field",
        "ip": ["geoip:cn"], // 中国大陆IP直连
        "outboundTag": "direct"
      },
      {
        "type": "field",
        "domain": ["geosite:cn", "geosite:private"], // 中国大陆域名和私有域名直连
        "outboundTag": "direct"
      },
      {
        "type": "field",
        "outboundTag": "dns_out", // DNS请求由dns_out处理
        "port": 53
      },
      {
        "type": "field",
        "port": "0-65535", // 其他所有流量走代理
        "outboundTag": "proxy"
      }
    ]
  }
}
```

**Linux `iptables` 规则 (将局域网流量重定向到 V2Ray)**:

```bash
# === TCP 流量重定向 ===
# 1. 忽略 V2Ray 自身的流量，避免死循环
iptables -t nat -A PREROUTING -p tcp -d 127.0.0.1 --dport 12345 -j RETURN
iptables -t nat -A PREROUTING -p tcp -d YOUR_V2RAY_SERVER_IP -j RETURN # 如果V2Ray在远程机器上，则不写这一条

# 2. 忽略局域网及私有地址流量，通常不需要代理
iptables -t nat -A PREROUTING -p tcp -d 0.0.0.0/8 -j RETURN
iptables -t nat -A PREROUTING -p tcp -d 10.0.0.0/8 -j RETURN
iptables -t nat -A PREROUTING -p tcp -d 127.0.0.0/8 -j RETURN
iptables -t nat -A PREROUTING -p tcp -d 172.16.0.0/12 -j RETURN
iptables -t nat -A PREROUTING -p tcp -d 192.168.0.0/16 -j RETURN
iptables -t nat -A PREROUTING -p tcp -d 224.0.0.0/4 -j RETURN
iptables -t nat -A PREROUTING -p tcp -d 240.0.0.0/4 -j RETURN

# 3. 将所有出站的 TCP 流量重定向到 V2Ray 的 Dokodemo-door 监听端口
# 可以根据需要限制重定向的端口，例如只重定向 80, 443 端口
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 12345
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-ports 12345
# 或者重定向所有 TCP 端口 (注意：这可能导致一些本地服务无法正常工作)
# iptables -t nat -A PREROUTING -p tcp -j REDIRECT --to-ports 12345

# === UDP 流量重定向 (通常用于 DNS) ===
# 1. 忽略 V2Ray 自身的流量
iptables -t nat -A PREROUTING -p udp -d 127.0.0.1 --dport 12345 -j RETURN

# 2. 忽略局域网及私有地址流量
iptables -t nat -A PREROUTING -p udp -d 0.0.0.0/8 -j RETURN
# ... (同TCP，省略其他私有IP过滤)

# 3. 将所有出站的 UDP 53 (DNS) 流量重定向到 V2Ray 的 Dokodemo-door 监听端口
iptables -t nat -A PREROUTING -p udp --dport 53 -j REDIRECT --to-ports 12345

# === POSTROUTING 规则 (针对 V2Ray 在网关模式下) ===
# 允许 V2Ray 转发来自内部网络的流量
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE # eth0 替换为您的外网接口名

# 清理规则
# iptables -t nat -F
# iptables -t nat -X
```

**注意事项：**

*   `REDIRECT` 将流量重定向到**本机**端口。如果 V2Ray 运行在另一台机器，需要使用 `DNAT`。
*   `iptables` 规则需要谨慎配置，错误的规则可能导致网络不稳定或中断。
*   透明代理通常还需要配合 V2Ray 的 `routing` 规则，来实现境内外流量的分流。

## 四、总结

Dokodemo-door 协议以其独特的透明代理能力，在 V2Ray 的应用中扮演着关键角色。它使得 V2Ray 能够无缝地处理各种流量，特别是当需要为整个网络或无法配置代理的设备提供安全代理服务时。理解 `address`, `port`, `followRedirect` 和 `sniffing` 选项的协同工作方式，是高效利用 Dokodemo-door 进行网络流量管理的基石。
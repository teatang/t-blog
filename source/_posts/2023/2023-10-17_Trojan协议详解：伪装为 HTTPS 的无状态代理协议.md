---
title: Trojan协议详解：伪装为 HTTPS 的无状态代理协议
date: 2023-10-17 06:24:00
tags:
  - 2023
  - Trojan
  - 代理协议
  - 计算机网络
categories:
  - 计算机网络
  - 代理协议
---

> **Trojan** 是一个开源的代理协议，其核心设计理念是“**伪装为最常见的 HTTPS 流量**”。它通过模仿 HTTPS 流量的特征，并利用 TLS (Transport Layer Security) 的加密和认证机制，旨在实现几乎无法被识别和阻断的代理连接。Trojan 协议放弃了传统代理协议常见的复杂头部和混淆算法，转而**直接将代理数据封装在 TLS 中，并强制要求使用 443 端口和合法 TLS 证书**，以最大化其隐蔽性。

{% note info %}
核心思想：**将代理流量深度伪装为 HTTPS 流量，通过在 443 端口上直接利用 TLS 协议的加密会话来传输代理数据，从而使其在外部看来与正常的 HTTPS 流量几乎无异。**
{% endnote %}
------

## 一、Trojan 协议的诞生背景与目标

Trojan 协议的出现，是对传统代理协议（如 Shadowsocks、VMess 等）在对抗深度包检测 (DPI) 和主动探测时的局限性的一种回应。主要背景如下：

1.  **协议特征识别**：许多代理协议，即使经过混淆，仍可能因其特定的协议头部、握手流程、流量模式或不符合 TLS 规范的行为而被识别。
2.  **主动探测**：审查系统可能会主动连接代理服务器，发送探测包，然后根据响应的特征来判断是否是代理服务器。
3.  **TLS 指纹**：即使使用 TLS 加密，客户端和服务器的 TLS 握手细节（如支持的密码套件、扩展等）也可能形成独特的指纹，被识别为非浏览器行为。

Trojan 的设计目标是：

*   **极致隐蔽性**：使代理流量与正常的 HTTPS 流量完全融合，甚至无法通过 DPI 和主动探测来区分。
*   **简洁高效**：协议本身尽可能简单，减少不必要的开销。
*   **安全性**：充分利用 TLS 提供的加密和认证，确保数据传输安全。

## 二、Trojan 协议的核心原理

Trojan 的核心原理可以概括为：“**伪装成 HTTPS，并且只做 HTTPS**”。它通过以下几个关键点实现这一目标：

### 2.1 基于 TLS 协议 (TLS-Based)

Trojan 完全依赖于标准的 TLS 协议来提供加密和认证。它不实现自己的加密算法，而是直接在 TLS 连接上运行。

*   **优势**：
    *   **安全性**：继承了 TLS 协议的所有安全特性，如端到端加密、完整性保护和身份验证。
    *   **隐蔽性**：TLS 流量在全球互联网中占据主导地位，将其伪装成 TLS 流量是极其有效的混淆手段。

### 2.2 端口与证书要求 (Port 443 & Valid Certificate)

Trojan 强制要求监听 **443 端口**，并使用一个**合法且有效的 TLS 证书**（通常通过 Let's Encrypt 签发）。

*   **优势**：
    *   **端口伪装**：443 端口是 HTTPS 的标准端口，使用该端口可有效避免因端口异常而被关注。
    *   **证书信任**：合法证书使得流量在证书验证阶段与正常网站无异，提高了信任度，难以被怀疑。

### 2.3 模仿 HTTPS 握手与数据流 (Mimic HTTPS Flow)

Trojan 客户端在与服务器建立连接时，会模拟标准的 HTTPS 握手过程。一旦 TLS 握手成功，客户端会发送一个**认证信息**，然后直接通过 TLS 加密的通道传输代理数据。

*   **认证过程**：客户端在 TLS 握手完成后，会发送一个纯文本形式的密码（用十六进制表示）以及一个换行符 (`\r\n`)，然后是代理的请求头。这个密码是唯一的用户认证凭据。
*   **数据传输**：认证成功后，所有后续的代理流量（包括请求和响应）都直接作为 TLS `application_data` 记录进行传输。

### 2.4 无协议特征 (No Protocol Fingerprint)

Trojan 协议自身没有复杂的头部或特殊的握手模式。它的“**协议”就是 TLS 协议本身**，在其之上承载的认证信息也非常简洁，难以形成独特的指纹。

*   **优势**：对 DPI 来说，Trojan 流量在表面上与普通的 HTTPS 流量几乎无法区分。

### 2.5 拒绝非 Trojan 流量 (Reject Non-Trojan Traffic)

当非 Trojan 客户端（如普通浏览器）连接到 Trojan 服务器的 443 端口时：

*   如果服务器配置了**回落 (Fallback)** 功能，可以将这些非 Trojan 流量转发给一个本地的 Web 服务器（例如 Nginx），使其表现为一个正常的网站。
*   如果没有配置回落，Trojan 服务器会直接关闭连接或返回错误，这可能会引起一定的怀疑，但相比返回代理协议特征要好得多。
*   **推荐始终配置回落**，让 Trojan 端口同时提供一个正常的 Web 服务，以最大化隐蔽性。

## 三、Trojan 协议结构概述

Trojan 协议的结构非常简单，在 TLS 握手成功之后，客户端发送的数据流如下：

```
密码(Hex) + CRLF + [CRLF] + 请求头 + CRLF + 数据
```

*   **密码 (Password)**：这是一个纯文本（十六进制表示）的密码字符串，用于客户端身份验证。服务器会比对这个密码。
*   **CRLF**：回车换行符 (`\r\n`)。
*   **请求头 (Request Header)**：这部分通常是一个标准的 HTTP 请求头，指示代理类型（CONNECT 或 GET/POST）。例如，对于 SOCKS5 代理，通常是 `CONNECT www.example.com:443 HTTP/1.1\r\nHost: www.example.com\r\n\r\n`。
*   **数据 (Data)**：后续就是实际的代理数据。

所有这些数据都通过已建立的 TLS 加密通道进行传输。服务器会解析密码进行认证，然后解析请求头确定目标，并转发后续数据。

## 四、Trojan 的工作流程

{% mermaid %}
flowchart TD
    %% 阶段 1：客户端本地处理
    subgraph Client [" 💻 客户端本地环境 (Local Client) "]
        direction TB
        App(["🌐 应用程序 (浏览器 / 终端)"])
        Inbound["📥 本地入站监听<br/><code>SOCKS5 / HTTP (1080/10808)</code>"]
        TrojanWrap["📦 <b>Trojan 协议封装</b><br/>构建首包: <code>SHA224(Password) + 目标地址</code>"]
        ClientTLS["🔒 <b>标准 TLS 客户端封装</b><br/>携带伪装域名 SNI · 建立真实 HTTPS 握手"]

        App --> Inbound --> TrojanWrap --> ClientTLS
    end

    %% 阶段 2：公共网络穿透
    subgraph Channel [" 📡 公开互联网 (审查者 / GFW 视角) "]
        Traffic[("🛡️ <b>不可区分的标准 HTTPS 流量</b><br/>443 端口 · 真实机构证书 · 规范 TLS 指纹")]
    end

    ClientTLS -->|"发送 TLS 加密流量"| Traffic

    %% 阶段 3：Trojan 服务端鉴权与分流
    subgraph Server [" 🚀 Trojan 服务端 (Trojan-Go / Xray) "]
        direction TB
        TLS_Term["🔑 <b>TLS 终结 (握手完成)</b><br/>终止外层加密 ➔ 解出明文 Application Data"]
        AuthCheck{"首包特征校验<br/><b>匹配 SHA224 密码散列？</b>"}

        subgraph Core [" ⚡ Trojan 代理核心中继 "]
            ParseTarget["🧩 <b>解析 Trojan 指令头</b><br/>提取目标主机 <code>IP:Port</code> 及连接类型 (TCP/UDP)"]
            Forwarder["📤 <b>直通中继 (Pass-Through)</b><br/>去除协议头，直接双向透传原始数据载荷"]
            ParseTarget --> Forwarder
        end

        subgraph FallbackMod [" 🛡️ 防探测回落机制 (Fallback) "]
            direction TB
            ProxyFallback["🔄 <b>透明协议降级 / 反向代理</b><br/>不掐断连接，转交至本地 Web 服务"]
        end

        TLS_Term --> AuthCheck
        AuthCheck -->|"✅ 密码哈希匹配 (合法代理流量)"| ParseTarget
        AuthCheck -->|"❌ 密码错误 / GFW 主动嗅探 / 普通 HTTPS 访问"| ProxyFallback
    end

    Traffic -->|"入站流量"| TLS_Term

    %% 阶段 4：出口去向
    subgraph Destinations [" 🌐 最终出口服务 "]
        direction TB
        LocalWeb["🏢 <b>本地伪装站点 (Fallback Web)</b><br/>Nginx / Caddy 托管的真实合规网站"]
        TargetWeb(["🎯 <b>目标外网站点 (Internet Target)</b><br/>真实目标 Web / API 服务器"])
    end

    ProxyFallback -->|"回落到内部端口 (如 127.0.0.1:80/8080)"| LocalWeb
    Forwarder -->|"1. 建立 TCP/UDP 连接并转发原始请求"| TargetWeb
    TargetWeb -.->|"2. 返回原始响应数据"| Forwarder

    %% 响应数据回流路径 (虚线标记)
    Forwarder -.->|"3. 响应载荷送入 TLS"| TLS_Term
    TLS_Term -.->|"4. 封装为标准 TLS Record 回传"| Traffic
    Traffic -.->|"5. 客户端 TLS 接收并解密"| ClientTLS
    ClientTLS -.->|"6. 还原原始应用响应"| App

    %% 深色主题样式定制
    style Client fill:#0c192c,stroke:#38bdf8,stroke-dasharray: 4 4,color:#93c5fd
    style Channel fill:#0f172a,stroke:#334155,stroke-dasharray: 2 2,color:#94a3b8
    style Server fill:#1e1035,stroke:#a855f7,stroke-dasharray: 4 4,color:#d8b4fe
    style Core fill:#170f2a,stroke:#c084fc,stroke-width:1px,color:#e9d5ff
    style FallbackMod fill:#260d13,stroke:#f87171,stroke-dasharray: 3 3,color:#fca5a5
    style Destinations fill:#0d1d18,stroke:#22c55e,stroke-dasharray: 4 4,color:#86efac

    style App fill:#1e293b,stroke:#64748b,stroke-width:1.5px,color:#f8fafc
    style Inbound fill:#1e293b,stroke:#0ea5e9,color:#f8fafc
    style TrojanWrap fill:#0369a1,stroke:#38bdf8,stroke-width:1.5px,color:#ffffff
    style ClientTLS fill:#075985,stroke:#38bdf8,stroke-width:1.5px,color:#ffffff

    style Traffic fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc

    style TLS_Term fill:#581c87,stroke:#c084fc,stroke-width:1.5px,color:#ffffff
    style AuthCheck fill:#312e81,stroke:#818cf8,stroke-width:1.5px,color:#ffffff
    style ParseTarget fill:#1e293b,stroke:#c084fc,color:#f8fafc
    style Forwarder fill:#6b21a8,stroke:#c084fc,stroke-width:1.5px,color:#ffffff

    style ProxyFallback fill:#3f1418,stroke:#ef4444,stroke-width:1.5px,color:#fecaca
    style LocalWeb fill:#270f12,stroke:#f87171,color:#fca5a5
    style TargetWeb fill:#14532d,stroke:#22c55e,stroke-width:2px,color:#f0fdf4
{% endmermaid %}

**流程说明：**

1.  **TCP 连接建立 & TLS 握手**：客户端发起 TCP 连接到 Trojan 服务器的 443 端口，并开始 TLS 握手。客户端会提供一个 SNI（通常是代理服务器的域名）。
2.  **Trojan 认证**：TLS 握手成功后，客户端立即发送 Trojan 密码和请求头。
3.  **服务器识别与分流**：
    *   Trojan 服务器尝试解析收到的数据。如果数据符合 Trojan 的认证格式且密码正确，则认为是合法的 Trojan 流量。
    *   **如果是合法的 Trojan 流量**：服务器接管连接，解析请求头，并建立与目标网站的连接。
    *   **如果不是 Trojan 流量**（例如普通浏览器连接，或者探测流量）：服务器将该连接透明地转发给配置的回落目标（通常是本地运行的 Nginx Web 服务器），由 Nginx 处理正常的 HTTPS 请求。
4.  **数据传输**：一旦认证成功并建立了与目标网站的连接，后续的所有数据（客户端请求数据、目标网站响应数据）都直接通过已建立的 TLS 加密通道进行双向传输，不再有额外的协议封装。
5.  **目标响应**：目标网站的响应数据原样通过 Trojan 服务器，在 TLS 加密通道中返回给客户端。

## 五、Trojan 的优缺点与适用场景

### 5.1 优点：

1.  **极强隐蔽性**：
    *   完全伪装成标准的 HTTPS 流量，难以被深度包检测 (DPI) 识别。
    *   使用 443 端口和合法 TLS 证书，使得流量在表面上与普通网站流量无异。
    *   回落功能进一步增强了伪装能力，即使被主动探测，也只会看到一个正常网站。
2.  **安全性高**：完全依赖 TLS 协议，继承了其提供的端到端加密和身份认证能力。
3.  **性能优秀**：协议本身非常简洁，没有额外的加密/解密或复杂混淆，性能损耗小。
4.  **抗封锁能力强**：由于其极致的隐蔽性，对各种网络审查策略有强大的抵抗力。

### 5.2 缺点：

1.  **配置相对复杂**：需要域名、TLS 证书、Web 服务器（用于回落）和 Trojan 服务器的配合，配置步骤比 Shadowsocks 等简单协议要多。
2.  **必须依赖域名和 TLS 证书**：这是 Trojan 隐蔽性的基础，缺少这些将严重影响其效果和安全性。
3.  **对服务器资源有一定要求**：TLS 握手和加密解密本身需要一定的 CPU 资源。
4.  **安全性依赖于密码强度和证书**：密码需要足够复杂，TLS 证书要保持有效。
5.  **单点故障**：如果域名或证书被封锁，整个代理服务可能会受影响。

### 5.3 适用场景：

*   **对隐蔽性和抗审查能力要求最高**的用户和环境。
*   **愿意投入时间和资源**进行域名、证书和服务器配置的个人或组织。
*   **追求高性能和稳定连接**的用户。
*   **对抗高度复杂的网络审查系统**。

## 六、总结

Trojan 协议以其独特的“伪装成 HTTPS”设计理念，为网络代理技术提供了一种极具创新性的解决方案。它通过将代理流量深度融入到最普遍的 HTTPS 流量中，有效地规避了传统代理协议在 DPI 和主动探测下的识别风险。对于身处网络审查严格环境下的用户而言，Trojan 协议凭借其卓越的隐蔽性、安全性和性能，已成为当前最主流且高效的突破网络限制的工具之一。正确部署和维护 Trojan 服务，是确保其长期有效性的关键。
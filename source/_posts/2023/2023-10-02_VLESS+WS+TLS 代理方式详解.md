---
title: VLESS+WS+TLS 代理方式详解
date: 2023-10-02 06:24:00
tags:
  - 2023
  - VLESS
  - 代理协议
  - 计算机网络
categories:
  - 计算机网络
  - 代理协议
---

> **VLESS+WS+TLS** 是一种高效、安全且隐蔽的代理组合方案，广泛应用于突破网络审查和实现隐私保护。它结合了 VLESS 协议的轻量和高性能、WebSocket (WS) 的伪装能力以及 TLS 的加密和流量混淆特性。这种组合使得代理流量在网络传输中难以被检测和干扰，提供了良好的稳定性和抗封锁能力。

{% note info %}
核心思想：**VLESS 负责高效数据传输，WebSocket 将代理流量伪装成正常的网页浏览流量，TLS 提供端到端加密和证书认证，三者结合形成一个难以被识别、安全且高性能的代理通道。**
{% endnote %}
------

## 一、各组件详解

### 1.1 VLESS 协议

VLESS 是一种由 Xray-core 开发的轻量级代理协议。它旨在提供比 VMess 更简单、更高效的数据传输，并减少协议开销。

*   **特点：**
    *   **无状态 (Stateless)**：与 VMess 不同，VLESS 不包含复杂的握手和会话管理，减少了协议开销。
    *   **高性能 (High Performance)**：由于协议简单，数据传输效率高。
    *   **透明性 (Transparency)**：VLESS 可以相对透明地传输数据，不进行额外的加密或混淆（通常与 TLS 或 XTLS 结合使用）。
    *   **易于实现**：协议结构简单，易于客户端和服务器端实现。
    *   **UUID 认证**：客户端和服务器通过 UUID (Universally Unique Identifier) 进行认证。

*   **工作原理：**
    VLESS 在客户端和服务器之间建立连接后，主要负责数据的封装和转发。它本身不提供加密或混淆，这些功能通常由传输层（如 TLS）提供。客户端使用配置的 UUID 向服务器发送请求，服务器验证 UUID 后，即可开始数据传输。

### 1.2 WebSocket (WS)

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。在代理场景中，WebSocket 被用于将代理流量伪装成正常的网页浏览流量。

*   **特点：**
    *   **端口复用**：WebSocket 通常运行在 80 (HTTP) 或 443 (HTTPS) 端口，与 Web 服务器共享端口，这增加了流量的隐蔽性。
    *   **流量伪装**：代理流量被封装在 WebSocket 帧中，看起来就像普通的 Web 流量，从而绕过深度包检测 (DPI)。
    *   **持久连接**：WebSocket 建立后可以保持长时间连接，减少了连接建立的开销。
    *   **HTTP 升级**：WebSocket 连接是基于 HTTP 协议升级而来的，使得其流量在初始阶段与 HTTP 流量无异。

*   **工作原理：**
    客户端首先发送一个标准的 HTTP `Upgrade` 请求到服务器，要求升级到 WebSocket 协议。如果服务器支持，则会响应 `101 Switching Protocols`，之后客户端和服务器就可以通过 WebSocket 帧进行双向数据传输。VLESS 流量被封装在这些 WebSocket 帧中。

### 1.3 TLS (Transport Layer Security)

TLS 是用于在计算机网络上提供安全通信的协议，是 HTTPS 的核心组成部分。在代理场景中，TLS 提供端到端加密和身份验证，是确保流量安全和隐蔽的关键。

*   **特点：**
    *   **端到端加密**：所有通过 TLS 传输的数据都是加密的，防止窃听和篡改。
    *   **身份认证**：通过数字证书验证服务器的身份，防止中间人攻击 (MITM)。
    *   **流量混淆**：加密后的流量呈现为随机字节，难以被识别为代理流量。结合 WebSocket，它进一步增强了伪装效果，使流量看起来像加密的 HTTPS Web 流量。
    *   **SNI (Server Name Indication)**：TLS 握手的一部分，客户端会告诉服务器它想访问哪个域名。这可以被利用来伪装成访问一个合法的网站。
    *   **ALPN (Application-Layer Protocol Negotiation)**：TLS 握手的一部分，允许客户端和服务器在不引入额外往返延迟的情况下协商应用层协议（如 HTTP/1.1 或 HTTP/2）。

*   **工作原理：**
    在 WebSocket 连接建立之前，TLS 握手首先发生。客户端和服务器协商加密算法、交换密钥，并验证服务器证书。一旦 TLS 隧道建立，所有后续的 WebSocket 流量都会通过这个加密隧道传输。这意味着 VLESS 流量被封装在 WebSocket 帧中，然后 WebSocket 帧又被封装在 TLS 记录中，从而实现多层保护。

## 二、VLESS+WS+TLS 的工作流程

整个 VLESS+WS+TLS 的代理流程可以概括如下：

1.  **DNS 解析**：客户端解析代理服务器的域名，获取 IP 地址。
2.  **TCP 连接建立**：客户端与代理服务器建立 TCP 连接。
3.  **TLS 握手**：
    *   客户端发起 TLS 握手，验证服务器的 SSL/TLS 证书。
    *   客户端在 TLS 握手过程中，通过 SNI 字段发送伪装域名（例如 `www.cloudflare.com`），让流量看起来像访问一个正常的 HTTPS 网站。
    *   如果服务器配置了 TLS，并且证书有效，双方协商加密参数，建立安全的 TLS 隧道。
4.  **WebSocket 升级**：
    *   在已建立的 TLS 隧道内，客户端发送 HTTP `Upgrade` 请求，要求将协议升级到 WebSocket。
    *   服务器响应 `101 Switching Protocols`，完成 WebSocket 协议升级。
5.  **VLESS 认证与数据传输**：
    *   客户端通过 WebSocket 连接发送 VLESS 认证信息（UUID）。
    *   服务器验证 UUID。
    *   认证成功后，客户端的实际请求（例如访问 Google.com）通过 VLESS 协议封装，然后封装在 WebSocket 帧中，并通过 TLS 隧道发送到服务器。
    *   服务器接收到数据后，解封装 VLESS 协议，将实际请求发送到目标网站。
    *   目标网站的响应反向经过 VLESS 封装，通过 WebSocket 帧，再通过 TLS 隧道传回客户端。

{% mermaid %}
graph TD
    subgraph "客户端 (Client)"
        A[应用层请求] --> |HTTP/S 请求| A1(TCP/IP 栈)
    end

    subgraph "代理服务器 (Proxy Server)"
        P1(入站流量处理 - TLS/WS)
        P2(VLESS 核心处理)
        P3(出站流量处理 - TCP/IP 栈)
    end

    subgraph "目标网站 (Target Website)"
        D[目标服务器]
    end

    A1 --> |"1. TCP 连接建立 + <br/>2. TLS 握手 (SNI 伪装)"| P1
    A1 --> |"3. WebSocket 升级请求 (在TLS内)"| P1

    P1 --> |4. WebSocket 隧道建立| P2
    P2 --> |5. VLESS 认证 & 数据封装| P1
    P1 --> |"6. 加密 VLESS 数据 (WS over TLS)"| A1

    P2 --> |7. VLESS 解封装 & 转发请求| P3
    P3 --> |8. 发送原始请求| D

    D --> |9. 返回原始响应| P3
    P3 --> |10. 接收原始响应| P2
    P2 --> |11. VLESS 封装响应 & WS 封装| P1
    P1 --> |"12. 加密 VLESS 响应 (WS over TLS)"| A1
    A1 --> |"13. 解密 & 解封装响应"| A

{% endmermaid %}

## 三、VLESS+WS+TLS 的优点

1.  **高隐蔽性**：
    *   **流量伪装**：WebSocket 将代理流量伪装成正常的 Web 流量。
    *   **加密混淆**：TLS 加密使得流量内容不可见，且看起来像随机数据，进一步增加了难以识别为代理流量的难度。
    *   **端口复用**：通常运行在 443 端口，与 HTTPS 流量混淆，不易被防火墙识别和拦截。
    *   **域名伪装**：通过 SNI (Server Name Indication) 和 Host 头伪装成访问合法网站，进一步增强隐蔽性。

2.  **强安全性**：TLS 提供端到端加密，有效防止数据窃听和篡改，保护用户隐私。

3.  **高性能**：VLESS 协议本身设计简洁，协议开销小，配合 WebSocket 的持久连接特性，可以提供较好的传输性能。

4.  **抗封锁能力强**：由于其高度的隐蔽性和安全性，VLESS+WS+TLS 组合能够有效抵抗深度包检测 (DPI) 和各种网络封锁策略。

5.  **易于部署和维护**：Xray-core (或 V2Ray) 客户端和服务器的配置相对简单，且有丰富的社区支持。

## 四、VLESS+WS+TLS 的缺点

1.  **对服务器资源有一定要求**：TLS 握手和数据加密解密会消耗 CPU 资源，尤其在高并发情况下。
2.  **配置相对复杂**：相较于 Socks5 或 Shadowsocks 等简单代理，VLESS+WS+TLS 的配置（包括域名、TLS 证书、Web 服务器反向代理等）更为复杂。
3.  **依赖 TLS 证书**：需要一个有效的域名和 TLS 证书。自签名证书容易被识别，通常需要使用 Let's Encrypt 等权威机构颁发的免费证书。
4.  **可能存在 CDN 绕过风险**：如果使用 CDN 伪装，部分 CDN 可能会限制 WebSocket 流量或其传输性能。

## 五、部署要点

1.  **域名和 SSL/TLS 证书**：
    *   需要一个合法域名。
    *   获取一个有效的 TLS 证书（推荐使用 Let's Encrypt 提供的免费证书，并通过 Certbot 等工具自动续期）。
2.  **Web 服务器 (Nginx/Caddy)**：
    *   通常需要一个 Web 服务器（如 Nginx 或 Caddy）作为反向代理，用于处理 443 端口的 TLS 流量，并将 WebSocket 流量转发给 Xray-core。
    *   Web 服务器还可以同时提供一个正常网站服务，进一步增强伪装效果。
3.  **Xray-core 安装与配置**：
    *   在服务器上安装 Xray-core。
    *   配置 Xray-core 的 `inbound` 监听 `VLESS` 协议，并设置 `transport` 为 `websocket`，同时启用 `tls`。
    *   配置 `outbound` 为 `freedom` (直连) 或其他代理协议。
4.  **客户端配置**：
    *   在客户端安装支持 VLESS+WS+TLS 的代理软件（如 V2RayN, Qv2ray, Clash, Shadowrocket 等）。
    *   输入服务器地址、端口、用户 UUID、伪装域名、WebSocket 路径、TLS 开启等信息。

## 六、总结

VLESS+WS+TLS 是一种目前非常主流和有效的代理组合方案。它在隐蔽性、安全性和性能之间取得了良好的平衡，使其成为突破网络审查和保护网络隐私的强大工具。尽管部署相对复杂，但其强大的抗封锁能力使其在许多场景下成为首选。深入理解其工作原理，并正确配置，是确保代理服务稳定运行的关键。
---
title: SNI (Server Name Indication) 详解
date: 2023-04-09 06:24:00
tags:
  - 2023
  - SNI
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---

> **SNI (Server Name Indication)** 是 **TLS (Transport Layer Security) 协议**的一个扩展，它允许客户端在建立 TLS/SSL 握手时，**在 Client Hello 报文中指定其尝试连接的主机名（域名）**。SNI 主要解决了在**单个 IP 地址和端口上托管多个 HTTPS 网站**（每个网站有不同的域名和证书）的问题。

{% note info %}
核心思想：**TLS 握手阶段，客户端告诉服务器它想访问哪个域名，这样服务器就知道应该提供哪个域名的证书。**
{% endnote %}
------

## 一、为什么需要 SNI？

在 SNI 出现之前，建立 HTTPS 连接的过程是这样的：

1.  客户端通过 IP 地址和端口 (通常是 443) 连接到服务器。
2.  服务器接收连接，然后发送其数字证书给客户端。
3.  客户端验证证书，然后建立加密通信。

这里的问题在于，一个服务器 IP 地址可以托管多个网站，每个网站都有其自己的域名。在 HTTPS 中，每个域名都需要一张匹配的 SSL/TLS 证书。

**没有 SNI 的局限性：**

*   **IP 地址瓶颈**：服务器在收到客户端的连接请求时，它只知道客户端连接的是哪个 IP 地址和端口，而不知道客户端究竟想访问的是哪个域名。
*   **证书匹配问题**：如果服务器上有 `www.example.com` 和 `www.anothersite.com` 两个网站共享同一个 IP 地址，服务器不知道应该提供 `example.com` 的证书还是 `anothersite.com` 的证书。
*   **解决方案的不足**：
    *   **一个 IP 一个证书**：这将导致每个 HTTPS 网站都需要一个独立的 IP 地址，造成 IPv4 地址的巨大浪费，且成本高昂。
    *   **通配符证书或多域名 (SAN) 证书**：可以用于保护同一主域名下或少数几个指定域名，但无法覆盖任意多个不相关的域名。
    *   **自签名证书**：客户端会收到警告，用户体验差。

SNI 的引入完美解决了这个问题，它使得服务器能够根据客户端在握手阶段提供的域名信息，返回正确的证书。

## 二、SNI 的工作原理

SNI 的作用机制其实非常简单直观：

1.  **客户端发起连接**：当客户端（如浏览器）尝试通过 HTTPS 访问一个网站 (例如 `https://www.example.com`) 时，它首先会解析域名 `www.example.com` 得到服务器的 IP 地址。
2.  **发送 Client Hello**：客户端使用这个 IP 地址和 443 端口发起 TCP 连接，并在随后的 **TLS 握手**的**第一个报文——Client Hello** 中，明确地包含一个 **SNI 扩展字段**。这个字段会写入客户端想要访问的完整域名，即 `www.example.com`。
3.  **服务器接收并识别**：服务器接收到 Client Hello 报文后，会读取其中的 SNI 字段。
4.  **服务器提供证书**：根据 SNI 字段中指定的域名，服务器在其内部存储的多个 SSL/TLS 证书中找到与 `www.example.com` 匹配的证书。
5.  **完成握手与加密**：服务器将正确的数字证书发送回客户端，然后按照标准的 TLS 握手流程，完成身份验证和密钥协商，最终建立加密的 HTTPS 通信隧道。

{% mermaid %}
sequenceDiagram
    participant Client as 客户端 (浏览器)
    participant Server as 服务器 (多个域名共享IP)

    Client->>Server: 1. TCP 连接 (到 ServerIP:443)
    Note over Client,Server: 开始 TLS 握手
    Client->>Server: 2. Client Hello <br/> (包含 SNI: www.example.com)
    Server->>Server: 3. 解析 Client Hello，<br/>根据 SNI 找到 www.example.com 的证书
    Server->>Client: 4. Server Hello <br/> (包含 www.example.com 的证书)
    Client->>Client: 5. 验证证书，协商密钥
    Client<<->>Server: 6. 建立安全连接并开始加密通信 (HTTP 请求/响应)
{% endmermaid %}

## 三、SNI 的关键特性与版本支持

### 3.1 关键特性：

*   **多域名共享 IP**：这是 SNI 最核心的功能，极大地节约了 IPv4 地址，降低了 HTTPS 部署成本。
*   **TLS 协议扩展**：SNI 并不是 TLS 协议本身的一部分，而是作为 TLS 协议的一个扩展 (RFC 6066) 被引入的。
*   **应用层协议无关**：SNI 发生在 TLS 握手层，不依赖于上层应用协议（如 HTTP），因此理论上任何使用 TLS 加密的协议都可以利用 SNI（如果其客户端实现了相应扩展）。

### 3.2 支持情况：

*   **客户端支持**：
    *   **现代浏览器**：所有主流现代浏览器（Chrome, Firefox, Edge, Safari, Opera 等）都已完全支持 SNI。
    *   **操作系统**：Windows Vista 及更高版本，macOS，以及大多数 Linux 发行版都支持 SNI。
    *   **编程语言/库**：大多数最新的 HTTP/TLS 客户端库（如 OpenSSL, GnuTLS, Java 中的 `HttpsURLConnection` 等）都支持 SNI。
*   **服务器端支持**：
    *   **Web 服务器**：Apache (2.2.12+), Nginx (0.5.x+), IIS (8.0+), Caddy 等都已广泛支持 SNI。
    *   **CDN/负载均衡**：各大 CDN 服务商和云服务提供商的负载均衡器也普遍支持 SNI。

**旧版系统不支持 SNI 的影响：**

如果客户端不支持 SNI（例如 Windows XP 上的 IE 浏览器），在访问共享 IP 的 HTTPS 网站时，服务器可能无法判断客户端想访问哪个域名，从而：

*   **返回默认证书**：服务器可能会返回一个预设的、与客户端请求域名不符的默认证书。这将导致客户端浏览器发出安全警告，提示证书不匹配，用户可能无法继续访问。
*   **连接失败**：在某些配置下，连接可能直接失败。

## 四、SNI 在网络安全和隐私中的应用

### 4.1 审查与过滤：

由于 SNI 字段在 TLS 握手阶段是**未加密**的，这意味着网络中间设备（如防火墙、ISP 的流量分析系统）可以读取到客户端想要访问的域名。

*   **审查机制**：一些国家或组织会利用 SNI 字段来识别和阻止对特定域名的访问。如果 SNI 字段中的域名在黑名单中，即使背后的 IP 地址未被封锁，连接也可能被重置或阻断。
*   **流量分析**：SNI 提供了关于用户正在访问哪些网站的信息，可以用于进行流量分析、用户行为画像等。

### 4.2 反审查技术：

针对 SNI 审查，反审查技术也发展出了对应的策略：

1.  **E SNI (Encrypted SNI) / ECH (Encrypted Client Hello)**：
    *   这是 TLS 协议的另一个发展方向，旨在**加密 Client Hello 报文中的 SNI 字段**，从而保护用户的隐私，并防止审查系统通过 SNI 字段识别和阻止网站。
    *   E SNI 在 TLS 1.3 协议中被提出，但目前正在演变为 ECH (Encrypted Client Hello)，并逐步得到浏览器（如 Firefox, Chrome）和 Web 服务器的支持。它的目标是使得 Client Hello 完全加密，让中间设备无法窥探用户访问的域名。

2.  **DoH (DNS over HTTPS) / DoT (DNS over TLS)**：
    *   虽然不是直接加密 SNI，但 DoH/DoT 通过加密 DNS 查询流量，使得审查系统无法通过 DNS 请求来识别用户访问的网站，从而增加审查难度。这对于 SNI 审查是一种补充防御。

3.  **SNI 伪装/欺骗 (SNI Spoofing)**：
    *   （通常在代理协议中）客户端故意发送一个虚假的 SNI 域名，以欺骗审查系统。这个伪装的域名通常是一个允许通过的、无害的域名。
    *   例如，在 Reality 协议（Xray 的 VLESS 增强版）中，客户端会发送一个伪装成访问著名合法网站（如 `google.com`）的 SNI，以绕过审查。

## 五、总结

SNI 是 TLS 协议中一个至关重要的扩展，它解决了 HTTPS 多域名共享 IP 的核心问题，极大地推动了 HTTPS 的普及和应用。然而，SNI 字段在握手时未加密的特性，也被审查系统利用来进行域名过滤。为了应对这一挑战，如 ECH 这样的新技术正在不断发展，旨在为用户提供更强的隐私保护和更自由的网络访问体验。理解 SNI 的工作原理和安全影响，对于构建和维护现代 Web 应用，以及理解网络审查机制都至关重要。
---
title: TLS Encrypted Client Hello (ECH) 详解
date: 2023-04-10 06:24:00
tags:
  - 2023
  - TLS
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---
> **TLS Encrypted Client Hello (ECH)** 是对 **TLS 1.3 协议** 的一项重要扩展，旨在解决传输层安全性 (TLS) 握手过程中客户端发送的**明文 Server Name Indication (SNI)** 扩展所带来的隐私和审查问题。通过 ECH，客户端可以在 TLS 握手的第一个消息——Client Hello 中加密它想要连接的服务器主机名，从而阻止网络中间方（如 ISP、审查机构或广告商）窥探用户正在访问的具体网站。

{% note info %}
**核心思想**：**在 TLS 握手开始阶段，通过加密客户端请求的服务器主机名 (SNI)，隐藏用户的访问目标，提升网络隐私和抗审查能力。**
{% endnote %}
------

## 一、为什么需要 ECH？SNI 的隐私痛点

在深入了解 ECH 之前，我们首先需要理解它所要解决的核心问题：**明文 SNI (Server Name Indication)**。

### 1.1 SNI 的作用

**SNI** 是 TLS 协议的一个扩展，用于解决**虚拟主机 (Virtual Hosting)** 问题。在 HTTP/1.1 时代，多个网站（具有不同的域名，如 `example.com` 和 `another.com`）可以共享同一个 IP 地址。当客户端发起 HTTP 请求时，它会在请求头中包含 `Host` 字段来指定要访问的域名。

对于 HTTPS (基于 TLS 的 HTTP) 来说，在 TLS 握手阶段，服务器需要知道客户端想要访问哪个域名，以便加载正确的 TLS 证书。因为 TLS 握手发生在 HTTP 请求之前，服务器无法从 HTTP `Host` 头获取域名信息。SNI 就是为此而生：客户端在 TLS Client Hello 消息中明确告知服务器它希望连接的域名。

### 1.2 SNI 带来的隐私问题

尽管 SNI 对于虚拟主机是必要的，但它有一个关键的隐私缺陷：**SNI 字段在 TLS 握手的第一阶段以明文形式传输**。这意味着，即使整个 TLS 会话后续是加密的，任何位于客户端和服务器之间的网络中间方（如 ISP、路由器、防火墙、审查设备等）都可以轻易地读取 SNI 字段，从而得知客户端正在访问哪个具体的域名。

**这种明文泄露导致的问题包括：**

*   **流量分析**：中间方可以构建用户访问网站的历史记录，进行用户画像和行为分析。
*   **网络审查**：审查机构可以根据 SNI 过滤或阻止用户访问特定网站。
*   **定向广告和监控**：广告公司或监控机构可以利用这些信息进行更精准的追踪。

### 1.3 ESNI (Encrypted SNI) 的尝试与局限

为了解决 SNI 的隐私问题，IETF 在 TLS 1.3 中提出了 **ESNI (Encrypted SNI)** 扩展。ESNI 的基本思路是：通过 DNS TXT 记录预先发布服务器的公钥，客户端获取公钥后，使用该公钥加密 SNI 字段。

然而，ESNI 存在一些局限性：

1.  **依赖 DNSSEC**：ESNI 要求 DNS 记录必须经过 DNSSEC 签名验证，以防止攻击者篡改公钥。但 DNSSEC 的部署并不普及。
2.  **密钥轮换复杂性**：ESNI 密钥的轮换和管理相对复杂。
3.  **Client Hello 结构限制**：ESNI 只加密了 SNI 扩展本身，而 Client Hello 消息中仍然可能包含其他可以泄露目标网站信息的数据（如 ALPN 协议列表、Session ID 等），造成侧信道攻击的风险。

ECH 作为 ESNI 的继任者，旨在克服这些局限性，提供更全面的 Client Hello 加密。

## 二、ECH 的工作原理

ECH 的核心思想是将整个 Client Hello 消息分为**外部 (Outer)** 和**内部 (Inner)** 两个部分，并加密内部部分。

### 2.1 核心概念

*   **Outer Client Hello (OCH)**：
    *   未加密的部分，对所有网络观察者可见。
    *   包含一个**“假”或“通用”的 SNI (public_name)**，通常是 CDN 或代理服务的域名（例如 `cloudflare-ech.com`）。这个假 SNI 旨在欺骗中间盒，使其认为连接的是一个无害的公共服务。
    *   包含一个 ECH 扩展，其中含有加密后的 Inner Client Hello。
*   **Inner Client Hello (ICH)**：
    *   加密的部分，只有预期的服务器能够解密。
    *   包含**真实的 SNI (real_name)** 和其他敏感的 TLS 扩展（如 ALPN、Session ID 等）。
    *   使用一种称为 **HPKE (Hybrid Public Key Encryption)** 的公钥加密方案进行加密。

### 2.2 ECH 密钥的获取

为了加密 Inner Client Hello，客户端需要服务器的公共 ECH 密钥。这个密钥是通过 DNS 查询获得的。

*   **HTTPS 记录 (HTTPS Resource Record)**：IETF 引入了一种新的 DNS 记录类型 `HTTPS` (也称为 `SVCB` 记录的别名)。这个记录类型不仅可以返回 IP 地址，还可以包含服务的额外参数，其中就包括服务器的 ECH 公钥配置 (`echconfig` 参数)。

**DNS HTTPS RR 记录示例（概念性）：**

```
_443._tcp.www.example.com. IN HTTPS 1 . echconfig="..." alpn="..."
```

其中 `echconfig` 字段包含了服务器用于 ECH 的公钥信息。客户端在发起连接前，会先查询目标域名的 HTTPS 记录，获取 `echconfig`。

### 2.3 ECH 握手流程

以下是启用 ECH 后的 TLS 握手简化流程：

{% mermaid %}
sequenceDiagram
    participant Client as 客户端
    participant DNS as DNS 解析器
    participant FrontingServer as 前置服务器 (例如 Cloudflare Edge)
    participant OriginServer as 源站服务器

    Client->>DNS: 1. 查询 www.example.com 的 HTTPS RR (包含 ECHConfig)
    DNS-->>Client: 2. 返回 HTTPS RR (包含 ECHConfigValue)

    Client->>Client: 3. 使用 ECHConfigValue 中的公钥加密真实的 SNI (real_name) 和其他敏感扩展，生成 Inner Client Hello (ICH)
    Client->>Client: 4. 构建 Outer Client Hello (OCH)，包含假的 SNI (public_name) 和加密的 ICH
    Client->>FrontingServer: 5. 发送 OCH (包含 public_name 和加密的 ICH)

    FrontingServer->>FrontingServer: 6. 尝试使用其私钥解密 ECH 扩展中的 ICH
    alt 解密成功 (说明客户端尝试连接到由FrontingServer管理的域名)
        FrontingServer->>FrontingServer: 7. 获取真实的 SNI (real_name) 和其他扩展
        alt FrontingServer是实际的OriginServer
            FrontingServer->>Client: 8a. 使用 real_name 对应的证书继续 TLS 握手
        else FrontingServer是代理 (如CDN)
            FrontingServer->>OriginServer: 8b. 将请求转发到 OriginServer (可能通过内部加密通道)
            OriginServer->>FrontingServer: 9. 返回响应
            FrontingServer->>Client: 10. 将响应返回给客户端
        end
    else 解密失败 (可能不是ECH流量，或公钥不匹配)
        FrontingServer->>Client: 8c. 发送 TLS Alert (例如 "unrecognized_name") 或回退到传统 TLS 握手 (取决于配置)
    end
{% endmermaid %}

**详细步骤解析：**

1.  **DNS 查询**：客户端首先通过 DNS 解析目标域名（例如 `www.example.com`）的 `HTTPS` 记录。
2.  **获取 ECH 配置**：DNS 返回的 `HTTPS` 记录包含服务器的 ECH 配置（`echconfig`），其中包含了用于加密的公共 ECH 密钥和服务器的 `public_name`（假的 SNI）。
3.  **构建 Client Hello**：
    *   客户端使用 `echconfig` 中的公钥加密真实的 SNI (`www.example.com`) 和其他敏感的 TLS 扩展，生成 Inner Client Hello (ICH)。
    *   客户端构建 Outer Client Hello (OCH)，其中包含从 `echconfig` 获取的 `public_name` 作为 SNI，以及加密后的 ICH 作为 ECH 扩展。
4.  **发送 OCH**：客户端将 OCH 发送给服务器。此时，网络中间方只能看到 `public_name`（例如 `cloudflare-ech.com`），而无法看到真实的 `www.example.com`。
5.  **服务器处理**：
    *   服务器接收到 OCH 后，会尝试使用其对应的私钥来解密 ECH 扩展中的 ICH。
    *   如果解密成功，服务器将获得真实的 SNI (`www.example.com`)。服务器会使用这个真实的 SNI 来选择正确的 TLS 证书，并继续完成 TLS 握手。
    *   如果解密失败（例如，客户端的 ECH 配置已过期，或者连接的不是支持 ECH 的服务器），服务器可以选择拒绝连接或回退到传统的 TLS 握手（如果 `public_name` 也是一个有效的、未加密的 SNI）。

### 2.4 HPKE (Hybrid Public Key Encryption)

**HPKE (Hybrid Public Key Encryption)** 是一种灵活的公钥加密方案，它结合了非对称加密（用于密钥交换）和对称加密（用于数据加密）的优势。在 ECH 中，HPKE 用于加密 Inner Client Hello 中的敏感信息。其基本流程是：

1.  发送方使用接收方的公钥加密一个对称密钥。
2.  发送方使用这个对称密钥加密实际数据。
3.  接收方使用其私钥解密对称密钥。
4.  接收方使用解密出的对称密钥解密实际数据。

这种混合方案提供了前向保密性，并且比纯粹的非对称加密效率更高。

## 三、ECH 的优势

1.  **增强用户隐私**：彻底解决了明文 SNI 泄露问题，保护了用户访问网站的隐私，使网络中间方无法轻易得知用户访问了哪个具体网站。
2.  **对抗网络审查**：由于 SNI 被加密，审查设备难以根据域名进行阻断，从而增加了网络审查的难度。
3.  **流量分析防御**：使得中间方更难进行大规模的流量分析和用户画像。
4.  **更全面的加密**：相比 ESNI，ECH 加密了整个 Client Hello 的敏感部分，包括 SNI 和其他可能泄露信息的扩展，提供了更强大的保护。
5.  **简化部署**：通过 `HTTPS` DNS 记录分发 ECH 配置，避免了 ESNI 对 DNSSEC 的强制依赖，简化了部署难度（虽然 DNSSEC 仍然是推荐的安全实践）。
6.  **零信任架构集成**：与 Cloudflare 等服务结合，ECH 成为零信任架构中的重要组成部分，进一步强化了端到端安全和隐私。

## 四、部署与实现现状

### 4.1 客户端支持

主流浏览器正在逐步支持 ECH：

*   **Firefox**：自 Firefox 113 起默认启用 ECH。
*   **Chrome/Edge**：正在积极测试和部署中，可能需要通过实验性 Flag 开启。
*   **其他浏览器**：正在跟进。

### 4.2 服务器端支持

服务器端实现 ECH 主要依赖于：

*   **TLS 库**：需要支持 ECH 的 TLS 库，例如 **OpenSSL 3.x** 及更高版本。
*   **CDN/代理服务**：像 Cloudflare 这样的 CDN 服务是 ECH 的主要推动者和部署者。它们作为前端代理服务器，能够承担 ECH 的解密和转发工作，并为客户提供简便的 ECH 启用方式。
    *   **Cloudflare** 已全面支持 ECH，并帮助其客户轻松部署。当用户通过 Cloudflare 代理时，Cloudflare 的边缘服务器充当 `FrontingServer`，处理 ECH 解密并将真实请求转发给源站。
*   **Web 服务器**：Nginx、Apache 等 Web 服务器需要与支持 ECH 的 OpenSSL 版本配合，并进行相应的配置。这通常比通过 CDN 部署要复杂。

### 4.3 DNS 配置

域名的 DNS 服务商需要支持 `HTTPS` 记录类型，以便发布 ECH 配置。

## 五、安全性考虑

1.  **密钥管理**：服务器端 ECH 私钥的妥善保管至关重要。一旦私钥泄露，攻击者可以解密客户端的 Inner Client Hello。
2.  **DNS 安全**：尽管 ECH 不强制要求 DNSSEC，但为了防止 DNS 缓存投毒或中间人攻击篡改 `HTTPS` 记录中的 ECH 配置，强烈建议使用 DNSSEC 保护域名的 DNS 记录。
3.  **回退攻击**：如果 ECH 握手失败（例如，服务器不支持 ECH 或密钥不匹配），客户端可能会回退到传统的明文 SNI 握手。攻击者可能会尝试通过干扰 ECH 握手来强制客户端回退，从而继续窃取 SNI。协议设计中包含机制来缓解此问题，但客户端和服务器的正确实现至关重要。
4.  **服务器指纹识别**：即使 SNI 被加密，Client Hello 中的其他参数（如支持的密码套件、扩展列表、ALPN 协议等）仍然可能被用于对客户端或服务器进行指纹识别。ECH 旨在尽可能多地加密这些敏感信息，但完全消除指纹识别是长期挑战。
5.  **流量分析的复杂性**：ECH 使得传统的基于 SNI 的审查和流量分析变得更加困难，但这并不意味着完全不可能。更复杂的深度包检测 (DPI) 技术仍可能通过其他信息（如 IP 地址、证书指纹、流量模式等）来推断用户行为。

## 六、总结

TLS Encrypted Client Hello (ECH) 是互联网隐私保护和抗审查方面的一个里程碑式进展。它通过加密 TLS 握手初期最敏感的信息——客户端请求的服务器主机名，有效地阻断了网络中间方的窥探，为用户提供了更强大的隐私保护。

随着主流浏览器和 CDN 服务提供商的积极推动，ECH 的部署和普及正在加速。虽然部署仍面临一些挑战（如客户端和服务器的兼容性、DNS 配置等），但其带来的隐私和安全效益将显著提升全球互联网的健壮性和用户体验，是构建一个更加私密、开放和安全的网络环境的重要一步。
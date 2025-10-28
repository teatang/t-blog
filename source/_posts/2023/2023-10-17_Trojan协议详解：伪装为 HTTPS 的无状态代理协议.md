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

> **Trojan** 是一个高度伪装的代理协议，其核心设计理念是**模拟最常见的流量特征——HTTPS**，从而达到瞒天过海、不被审查系统识别和阻断的目的。与 VMess、Shadowsocks 等协议通过自定义加密和混淆来隐藏自身不同，Trojan 反其道而行之，**直接将代理流量伪装成普通的 HTTPS 流量**。它的名字也暗示了其隐蔽性，如同“特洛伊木马”一般，隐藏在看似无害的外表之下。

{% note info %}
核心思想：Trojan 利用 HTTPS 协议的特点，直接在 TLS 握手完成后，将客户端密码作为认证信息，然后通过 TLS 加密隧道传输实际代理数据。它不额外引入复杂的加密或混淆，而是让代理流量“融入”正常的 HTTPS 流量之中。
{% endnote %}
------

## 一、为什么需要 Trojan？

在严格的网络审查环境下，传统的代理协议（如 Shadowsocks、OpenVPN 等）可能会因为其独特的流量特征而被识别和阻断。即使是 V2Ray/Xray 的 VMess 和 VLESS 协议，虽然可以通过 WebSocket + TLS 很好地伪装成 HTTPS 流量，但它们在 TLS 握手成功后，仍然会在 TLS 隧道内部传输一些自定义的协议头（VMess/VLESS 的包头）。这在理论上仍可能被深层分析识别，尽管难度很大。

Trojan 的设计目标是：
1.  **彻底伪装**：流量行为与标准 HTTPS 连接几乎无法区分。
2.  **简单高效**：协议层级尽可能少，减少性能开销。
3.  **抗审查性强**：最大限度地抵抗基于流量特征的审查。

## 二、Trojan 的核心设计理念与工作原理

Trojan 的核心原理是：**“让代理流量看起来就和 HTTPS 流量一模一样”**。它通过以下机制实现这一点：

### 2.1 1. 直接复用 HTTPS 的特性

*   **端口 443**：默认使用标准 HTTPS 端口 443，这是审查系统中最常规的端口。
*   **TLS 加密**：Trojan 的所有代理数据都直接在标准的 TLS (Transport Layer Security) 隧道中传输，完全依赖 TLS 协议本身的加密，保障数据安全。这意味着流量在抓包时，从外部看就是标准的 TLS 流量，无法区分其内部承载的是代理数据还是正常的网页数据。
*   **标准证书**：Trojan 服务器需要配置有效的 SSL/TLS 证书（如 Let's Encrypt 证书），使其在 TLS 握手时能够提供合法的证书，进一步增强伪装性。

### 2.2 2. 密码认证

Trojan 协议使用一个**纯文本密码 (Password)** 进行用户认证。
*   在 TLS 握手成功后，客户端会首先发送一个标准的 HTTP 请求头，其中包含认证信息（密码的十六进制 SHA224 哈希值）。
*   服务器验证密码后，后续的所有流量都直接作为代理数据在 TLS 隧道中传输。

### 2.3 3. 无协议头混淆

区别于 VMess 等协议在 TLS 隧道内还有自己复杂的协议头，Trojan 在认证通过后，**几乎没有自己的协议头**。它直接将客户端请求转发到目标服务器，并将目标服务器响应转发给客户端。这使得流量在 TLS 隧道内部也难以被识别为非 HTTPS 的特殊协议流量。

### 2.4 4. 无状态 (Stateless)

Trojan 是一个无状态协议。每个连接都是独立的，服务器不需要维护长期会话状态，降低了服务器资源开销。

## 三、Trojan 的协议结构与工作流程

**Trojan 协议的结构非常简洁：**

`[Password_SHA224_HEX]` + `CRLF` + `[CRLF]` + `[Proxy Request]`

*   `Password_SHA224_HEX`：客户端密码的 SHA224 哈希值的十六进制表示。
*   `CRLF`：回车换行符。
*   `Proxy Request`：实际的代理请求，通常是 SOCKS5 或 HTTP 格式的连接请求（`CONNECT` 方法）。

**Trojan 协议的工作流程如下：**

{% mermaid %}
sequenceDiagram
    participant Client as 客户端
    participant Internet as 互联网 / GFW
    participant Trojan_Server as Trojan服务器
    participant Target_Website as 目标网站

    Client->>Internet: 1. DNS解析服务器域名
    Internet->>Trojan_Server: 2. TCP三次握手 (目标端口443)
    Trojan_Server->>Client: 3. TCP连接建立
    Client->>Trojan_Server: 4. 标准TLS握手 (SNI: your_domain.com)
    Trojan_Server->>Client: 5. 提供合法SSL证书并完成TLS握手 (建立加密隧道)
    Client->>Trojan_Server: 6. 在TLS隧道内发送认证信息和代理请求 <br/>(e.g., [Password_SHA224_HEX]\r\n\r\nCONNECT target.com:443 HTTP/1.1\r\nHost: target.com\r\n\r\n)
    Trojan_Server->>Trojan_Server: 7. 验证密码的SHA224哈希值
    alt 密码验证失败
        Trojan_Server->>Client: 7.1 返回400 Bad Request / 关闭连接 (伪装成HTTPS错误)
    else 密码验证成功
        Trojan_Server->>Target_Website: 7.2 建立到目标网站的连接 (e.g., 发送CONNECT请求)
        Client-->>Trojan_Server: 8. 在TLS隧道内传输加密的代理数据
        Trojan_Server-->>Target_Website: 9. 透明转发数据
        Target_Website-->>Trojan_Server: 10. 目标网站返回数据
        Trojan_Server-->>Client: 11. 在TLS隧道内传输加密的返回数据
    end
{% endmermaid %}

**关键点：**

*   **全程 TLS 加密**：从建立连接后的第一帧数据开始，所有数据都在 TLS 的保护下传输。
*   **认证即数据流**：认证信息本身就是代理请求的一部分，没有额外的“协议头”开销。
*   **合法证书**：服务器必须配置与域名匹配的有效 SSL 证书，否则 TLS 握手会失败，伪装会暴露。
*   **反向代理 (可选)**：Trojan 服务器通常会与 Web 服务器（如 Nginx）结合，通过 HTTPS 反向代理的方式，将非 Trojan 流量转发到真实的网站，进一步增强伪装效果。

## 四、Trojan 的配置文件示例

一个典型的 Trojan 服务器配置 (例如在 Shadowsocks-Rust 或 Trojan-Go 中) 示例如下：

**客户端配置 (Client config.json)**

```json
{
    "run_type": "client",
    "local_addr": "127.0.0.1",
    "local_port": 1080,
    "remote_addr": "your_domain.com", // 服务器域名
    "remote_port": 443,
    "password": [
        "your_password" // 和服务器保持一致的密码
    ],
    "log_level": 1,
    "ssl": {
        "repo": "github",
        "verify_hostname": true,
        "verify_cert": true,
        "hostname": "your_domain.com"
    }
}
```

**服务器配置 (Server config.json)**

```json
{
    "run_type": "server",
    "local_addr": "0.0.0.0",
    "local_port": 443,
    "remote_addr": "127.0.0.1", // 本地回环地址，通常由Nginx反代到Trojan
    "remote_port": 80, // 或者任意内部端口
    "password": [
        "your_password" // 和客户端保持一致的密码
    ],
    "ssl": {
        "cert": "/path/to/your/cert.pem", // 你的SSL证书公钥文件
        "key": "/path/to/your/key.key",   // 你的SSL证书私钥文件
        "fallback_port": 80 // 可选：如果Trojan接收到非Trojan流量，转发到这个端口，通常是Web服务器
    },
    "websocket": { // 例如：Trojan-Go支持WebSocket，但原版Trojan不支持
        "enabled": false
    }
}
```

**与 Nginx 反向代理结合 (NGINX 配置)**

为了更好地伪装，通常会配置 Nginx (或 Caddy) 作为前端反向代理，将正常的 HTTPS 流量转发到实际的 Web 服务，将 Trojan 流量转发到 Trojan 后端。

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.key;
    ssl_session_timeout 1d;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers "TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305";
    ssl_prefer_server_ciphers off;
  
    server_name your_domain.com;

    # Trojan 专用代理
    # 注意：这里需要配合一些模块或特定的Nginx配置才能实现
    # 更常见的是在Trojan内部直接处理TLS fallback，或者使用更高级的xtls分流
    # 这里是一个简化示意，实际部署可能更复杂

    # 这只是一个概念性示意，实际直接的Nginx转发通常会与Trojan的fallback机制配合
    # 如果使用 Nginx 的 stream 模块，可以根据 TLS SNI 或 ALPN 进行更精细的分流
    # 对于纯粹的 Trojan 来说，通常是 Trojan 监听 443 端口，fallback 到真正的 Web 服务
    # 例如，Trojan-Go 和 Xray (支持 Trojan 协议) 可以直接通过其配置实现 TLS fallback。

    # 如果 Trojan 自身没有 fallback 机制，那么 Nginx 可以通过 HTTP/2 ALPN 协商进行分流
    # 例如，如果客户端协商的是 h2，则转到 Web；否则认为是 Trojan 流量。
    # 这是一个比较复杂的配置，需要 Nginx L4 层的流量分流。


    # 简单场景：Trojan 监听 443，并自行处理回落到 Nginx 监听的 80 端口（用于 Web）
    # 在这种情况下，上述 Nginx 配置可能是监听 80 端口，作为 Trojan 的 fallback 目标

    # 实际部署通常会这样：
    # 1. Trojan 监听 443，配置你的 TLS 证书。
    # 2. Trojan 配置一个 fallback 端口（比如 80），将非 Trojan 流量转发到这个端口。
    # 3. Nginx 监听 80 端口，处理正常的 HTTP 流量。
    # 4. (可选) Nginx 监听 443 端口，如果只有 Web 且没有 Trojan，则直接处理。
    # 对于 Trojan 流量，客户端直连 Trojan server 443 端口。
    # 更高级的分流，例如 Xray 支持的 VLESS/Trojan+XTLS 会在 TLS 握手阶段根据客户端流量特征进行分流。

    # 简化的 Nginx 反代示例：将所有非 /trojan 路径的流量转发到真实网站
    # 这不是Trojan协议本身的直接配合方式，而是HTTP协议的常规反代
    location / {
        proxy_pass http://127.0.0.1:8080; # 你的真实网站在 8080 端口
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 如果Trojan服务器设置了fallback_port，Nginx可以监听一个内部端口供其回落
    # 例如 trojan server { fallback_port: 80 }，Nginx { listen 80; location / { ... } }
}
```

## 五、Trojan 的优缺点

### 5.1 优点：

1.  **极强的伪装性**：流量完全模拟标准 HTTPS，从外部看是无差别的 HTTPS 流量，难以被 GFW 识别和阻断。这是其最大的优势。
2.  **简单高效**：协议层级极简，没有复杂的协议头和额外的加密/解密步骤，性能开销低。
3.  **无状态**：服务器无需维护会话状态，有利于扩展和负载均衡。
4.  **去中心化**：只要客户端和服务器知道密码，就可以建立连接。
5.  **难以区分**：由于伪装得当，基于流量特征的审查措施对其作用有限。

### 5.2 缺点：

1.  **密码明文传输 (哈希)**：虽然密码是经过 SHA224 哈希后传输的，但如果哈希值被中间人攻击（虽然 TLS 会防范），或服务器泄露了哈希值，则安全性可能受影响。不过由于整个过程在 TLS 隧道内，中间人攻击的门槛很高。
2.  **对 SSL/TLS 证书的依赖**：需要一个真实的、有效的 SSL/TLS 证书。如果没有合法证书，流量在 TLS 握手阶段就可能被识别，伪装失败。
3.  **端口限制**：主要工作在 443 端口，如果 443 端口被完全封锁，则 Trojan 也难以工作。
4.  **配置相对复杂**：需要配置域名、DNS 解析、SSL 证书以及Web服务器（如 Nginx）的反向代理，对初学者有一定门槛。
5.  **无法检测中间人攻击**：Trojan 客户端通常不验证服务器证书的合法性，这增加了中间人攻击的风险。但一些客户端（如 Clash、Xray）已支持证书校验。

## 六、适用场景与部署建议

*   **对抗严格的网络审查**：Trojan 的核心优势在于其极致的 HTTPS 伪装，非常适合在审查严格的环境中使用。
*   **需要避免流量特征识别**：如果担心流量被 DPI 识别，Trojan 提供了一个强有力的解决方案。
*   **配合 Nginx/Caddy 进行网站伪装**：通过在 443 端口同时提供真正的 HTTPS 网站服务和 Trojan 代理服务，可以进一步增强伪装效果，让服务器看起来就像一个普通的 HTTPS 网站。

**部署建议：**

1.  **准备一个域名**：这是必须的，用于申请 SSL 证书和作为服务器地址。
2.  **获取有效的 SSL/TLS 证书**：推荐使用 Let's Encrypt 提供的免费证书。
3.  **配合 Web 服务器**：使用 Nginx 或 Caddy 进行反向代理，将 443 端口的流量合理分发，或者利用 Trojan 程序的 `fallback_port` 功能，将非 Trojan 流量回落到 Web 服务器，实现“一机多用”。
4.  **选择稳定的运行环境**：Trojan 协议本身轻量，但服务器的带宽和稳定性对体验至关重要。
5.  **客户端证书验证**：尽可能在客户端开启证书验证 (`verify_cert` 和 `verify_hostname`)，以防止中间人攻击。

## 七、总结

Trojan 协议以其独特的 HTTPS 伪装策略，在众多代理协议中独树一帜。它放弃了在协议内部进行复杂加密和混淆的思路，转而将代理流量彻底融入到最常见、最受信任的 HTTPS 流量中，从而实现了极致的抗审查能力。对于那些面对严苛审查环境、追求高度隐蔽性和稳定性的用户而言，Trojan 无疑是一个卓越的选择。然而，正确配置域名、SSL 证书以及 Web 服务器是成功部署 Trojan 的关键。
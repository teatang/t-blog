---
title: ALPN (Application-Layer Protocol Negotiation) 详解
date: 2023-04-11 06:24:00
tags:
  - 2023
  - TLS
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---

> **ALPN (Application-Layer Protocol Negotiation)**，即**应用层协议协商**，是 TLS (传输层安全) 协议的一个扩展，允许客户端和服务器在进行 TLS 握手时，**协商决定在加密连接上使用哪个应用层协议**。它在 **RFC 7301** 中被定义。ALPN 的出现，极大地简化了现代网络协议的部署和使用，尤其是对于 HTTP/2 和未来的 QUIC 等协议。

{% note info %}
核心思想：**ALPN 将应用层协议的选择过程集成到 TLS 握手阶段，使得在建立加密连接的同时，也完成了应用层协议的确定，避免了额外的往返延迟，并允许在同一端口上运行多种应用层协议。**
{% endnote %}
------

## 一、为什么需要 ALPN？

在 ALPN 出现之前，协商应用层协议通常面临以下挑战：

1.  **端口绑定**：传统的做法是为不同的应用层协议使用不同的端口。例如，HTTP 使用 80 端口，HTTPS 使用 443 端口，FTP 使用 21 端口。当引入新的协议（如 HTTP/2 或 SPDY）时，如果想与现有协议共存，就必须使用新的端口，这会增加防火墙配置、负载均衡设置的复杂性，并且用户可能需要记住非标准的端口号。
2.  **HTTP Upgrade 机制的局限性**：虽然 HTTP/1.1 提供了 `Upgrade` 头字段来切换协议（例如从 HTTP/1.1 升级到 WebSocket），但这种机制是在 TCP 连接和 TLS 握手完成之后，额外发送一个 HTTP 请求来协商的。这会带来额外的**往返延迟 (Round Trip Time, RTT)**，并且不能在 HTTP/1.0 客户端或非 HTTP 协议中实现。
3.  **SPDY/HTTP/2 的需求**：HTTP/2（以及其前身 SPDY）旨在通过在单个 TCP 连接上多路复用请求来提高性能。在同一个端口上同时支持 HTTP/1.1 和 HTTP/2，并且优雅地进行协议切换，是这些新协议推广的关键。

ALPN 的目标就是解决这些问题，它将协议协商的时机提前到 TLS 握手阶段，使得连接一旦建立完成，就能够直接开始使用商定好的应用层协议。

## 二、ALPN 的工作原理

ALPN 是 TLS 协议的一个扩展，它通过在 TLS 握手过程中的 **Client Hello** 和 **Server Hello** 消息中添加特定字段来完成协议协商。

### 2.1 协商流程

1.  **客户端发起 Client Hello**：
    *   客户端在发送 `Client Hello` 消息时，会包含一个 `ALPN Extension`。
    *   这个扩展中包含一个客户端支持的**应用层协议列表 (Protocol Name List)**，按优先级排序。
    *   例如，客户端可能发送 `["h2", "http/1.1"]`，表示它优先支持 HTTP/2 (h2)，其次是 HTTP/1.1。

    {% mermaid %}
    sequenceDiagram
        participant Client
        participant Server

        Client->>Server: Client Hello (包含 ALPN 扩展: ["h2", "http/1.1"])
    {% endmermaid %}

2.  **服务器回应 Server Hello**：
    *   服务器收到 `Client Hello` 后，会检查 `ALPN Extension` 中的协议列表。
    *   服务器从列表中选择一个它也支持且优先级最高的协议。
    *   服务器在 `Server Hello` 消息中，也包含一个 `ALPN Extension`，其中只包含**一个**它决定使用的应用层协议。
    *   如果服务器不支持客户端提出的任何协议，它将不会发送 ALPN 扩展，或者发送一个握手失败警报。

    {% mermaid %}
    sequenceDiagram
        participant Client
        participant Server

        Client->>Server: Client Hello (包含 ALPN 扩展: ["h2", "http/1.1"])
        Server->>Client: Server Hello (包含 ALPN 扩展: ["h2"])
    {% endmermaid %}

3.  **握手完成与应用层通信**：
    *   一旦 TLS 握手完成，客户端和服务器都明确了将要使用的应用层协议。
    *   后续的加密数据传输将直接使用协商好的协议（例如 HTTP/2）进行。

    {% mermaid %}
    sequenceDiagram
        participant Client
        participant Server

        Client->>Server: Client Hello (包含 ALPN 扩展: ["h2", "http/1.1"])
        Server->>Client: Server Hello (包含 ALPN 扩展: ["h2"])
        Client->>Server: 剩余 TLS 握手消息 (Change Cipher Spec, Finished)
        Server->>Client: 剩余 TLS 握手消息 (Change Cipher Spec, Finished)
        Client->>Server: 应用层通信 (例如，HTTP/2 请求)
        Server->>Client: 应用层通信 (例如，HTTP/2 响应)
    {% endmermaid %}

### 2.2 ALPN 协议标识符 (Protocol Identifiers)

ALPN 使用特定的字符串来标识不同的应用层协议，这些标识符由 IANA (Internet Assigned Numbers Authority) 维护。

| 协议名称             | ALPN 标识符 |
| :------------------- | :---------- |
| HTTP/1.1             | `http/1.1`  |
| HTTP/2               | `h2`        |
| HTTP/3 (基于 QUIC)   | `h3`        |
| SPDY/3.1             | `spdy/3.1`  |
| WebRTC 数据通道     | `webrtc`    |
| XMPP (Jabber)        | `xmpp-client`, `xmpp-server` |
| CoAP                 | `coap`      |

## 三、ALPN 的优势

1.  **减少延迟**：将协议协商整合到 TLS 握手过程中，消除了额外的 RTT，使得连接建立更快。
2.  **单一端口多协议**：允许在同一个端口（通常是 443 端口）上承载多种应用层协议，例如 HTTP/1.1 和 HTTP/2。这简化了网络配置和管理。
3.  **提高兼容性**：服务器可以根据客户端支持的协议列表，优雅地降级到兼容的协议，例如，如果客户端不支持 HTTP/2，服务器可以回退到 HTTP/1.1。
4.  **与 SNI 配合使用**：ALPN 通常与 SNI (Server Name Indication) 结合使用。SNI 允许客户端在 TLS 握手时指定要访问的域名，从而使服务器能够选择正确的证书。ALPN 则在此基础上进一步协商应用层协议。
5.  **支持非 HTTP 协议**：ALPN 不限于 HTTP 协议，理论上可以用于任何需要通过 TLS 加密的协议。

## 四、ALPN 与其他协议协商机制的比较

1.  **与 `Upgrade` 头字段比较 (HTTP/1.1)**：
    *   **时机**：`Upgrade` 发生在 HTTP 层，在 TCP 连接和 TLS 握手之后，需要发送一个额外的 HTTP 请求。
    *   **效率**：引入额外的 RTT。
    *   **适用性**：仅适用于 HTTP/1.1 客户端。
    *   **ALPN 优势**：ALPN 在 TLS 层完成，无需额外 RTT，并且更通用。

2.  **与 NPN (Next Protocol Negotiation) 比较**：
    *   NPN 是 ALPN 的前身，也是 Google 为 SPDY 开发的。它在 TLS 握手阶段协商协议，但协商顺序与 ALPN 相反：**服务器提供协议列表，客户端选择。**
    *   **ALPN 优势**：ALPN 更具优势，因为它遵循了更自然的协商流程：**客户端明确表达其偏好，服务器根据客户端的偏好和自身支持情况进行选择**。这在公共 Web 服务中更为合理，因为客户端通常不知道服务器支持什么。NPN 已被 ALPN 取代。

## 五、ALPN 的实际应用

ALPN 是现代 Web 生态系统中的一个基石，尤其体现在：

*   **HTTP/2**：HTTP/2 over TLS (通常称为 H2) 几乎总是通过 ALPN 进行协商。浏览器和服务器在建立 HTTPS 连接时，首先通过 ALPN 确定是否使用 HTTP/2。
*   **HTTP/3 (QUIC)**：虽然 HTTP/3 基于 UDP，但其底层的 QUIC 协议也需要进行协议协商。虽然技术细节不同，但其作用与 ALPN 类似，也是在连接建立初期就确定应用层协议。
*   **其他基于 TLS 的服务**：任何需要在 TLS 连接上运行多种应用层协议的服务都可以从 ALPN 中受益。

## 六、代码示例 (Go 语言)

以下是一个简单的 Go 语言示例，展示如何在 TLS 配置中使用 ALPN。

### 6.1 服务端

```go
package main

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
)

func main() {
	// 定义 TLS 配置
	cfg := &tls.Config{
		MinVersion: tls.VersionTLS12, // 最小 TLS 版本
		// 在这里定义 ALPN 协议列表，服务器优先支持 h2 (HTTP/2), 其次 http/1.1
		NextProtos: []string{"h2", "http/1.1"},
	}

	// 创建一个 HTTP/2 服务器（它会根据 ALPN 自动处理 HTTP/1.1 和 HTTP/2）
	server := &http.Server{
		Addr:      ":8443",
		Handler:   http.HandlerFunc(handler),
		TLSConfig: cfg, // 将 TLS 配置应用到服务器
	}

	log.Println("Server listening on :8443")
	// 使用 TLS 监听并服务
	// 需要提供证书和私钥文件
	err := server.ListenAndServeTLS("server.crt", "server.key")
	if err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func handler(w http.ResponseWriter, r *http.Request) {
	// r.Proto 会显示实际使用的 HTTP 协议版本
	fmt.Fprintf(w, "Hello from Server! You are using protocol: %s\n", r.Proto)
	log.Printf("Request received from %s using protocol %s\n", r.RemoteAddr, r.Proto)
}
```

### 6.2 客户端 (Go 语言)

```go
package main

import (
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"net/http"
)

func main() {
	// 定义 TLS 配置
	cfg := &tls.Config{
		MinVersion: tls.VersionTLS12,
		// 客户端支持的协议列表，按优先级排序
		NextProtos: []string{"h2", "http/1.1"},
		// ⚠️ 注意：对于自签名证书，需要跳过证书验证，生产环境不推荐
		InsecureSkipVerify: true,
	}

	// 创建一个 HTTP 客户端，并配置 TLS 传输
	tr := &http.Transport{
		TLSClientConfig: cfg,
	}
	client := &http.Client{Transport: tr}

	// 发送 HTTPS 请求
	resp, err := client.Get("https://localhost:8443")
	if err != nil {
		log.Fatalf("Failed to send request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Failed to read response body: %v", err)
	}

	fmt.Printf("Response Status: %s\n", resp.Status)
	fmt.Printf("Response Body: %s\n", body)
	fmt.Printf("Negotiated Protocol (client perspective): %s\n", resp.Proto)
}
```

**运行说明：**

1.  **生成自签名证书** (仅用于测试，生产环境请使用权威证书)：
    ```bash
    openssl genrsa -out server.key 2048
    openssl req -new -x509 -key server.key -out server.crt -days 365 -subj "/CN=localhost"
    ```
2.  **编译并运行服务器**：
    ```bash
    go run server.go
    ```
3.  **编译并运行客户端**：
    ```bash
    go run client.go
    ```

客户端和服务器都会在控制台输出它们协商使用的协议，通常会是 `HTTP/2.0` (Go 语言的 `resp.Proto` 会显示 `HTTP/2.0`，尽管 ALPN 标识符是 `h2`)。

## 七、总结

ALPN 是 TLS 协议中一个不可或缺的扩展，它在加密连接建立初期就解决了应用层协议的协商问题。通过将协议选择的时机提前，ALPN 显著提升了现代 Web 应用的性能和效率，特别是对于 HTTP/2 和未来的 QUIC/HTTP/3 等协议的普及起到了关键作用。它使得服务器能够在同一个端口上灵活地支持多种协议，为开发者和最终用户都带来了巨大的便利。
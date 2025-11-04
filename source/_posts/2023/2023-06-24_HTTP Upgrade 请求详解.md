---
title: HTTP Upgrade 请求详解
date: 2023-06-24 06:24:00
tags:
  - 2023
  - WebSocket
  - HTTP
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---

> **HTTP Upgrade 请求** 是一种特殊的 HTTP/1.1 机制，允许客户端和服务器在已经建立的 TCP 连接上，将当前协议从 HTTP/1.1 **切换到**另一个不同的、更高级别的协议。最常见的应用场景是将 HTTP 连接升级到 **WebSocket** 协议，从而实现全双工、低延迟的持久连接。

{% note info %}
核心思想：**Upgrade 请求是 HTTP/1.1 中用于协议协商的机制，允许在一个已有的 TCP 连接上，在客户端和服务器都同意的情况下，从 HTTP 切换到其他协议，避免了重新建立连接的开销，并开启更强大的通信模式。**
{% endnote %}
------

## 一、为什么需要 HTTP Upgrade？

HTTP/1.0 和 HTTP/1.1 都是**无状态的请求-响应协议**。对于每个请求，客户端发送请求，服务器发送响应，然后连接可以关闭（非持久连接）或保持一段时间用于后续的 HTTP 请求（持久连接，Keep-Alive）。

这种请求-响应模式对于传统的 Web 页面浏览非常高效。然而，随着 Web 应用复杂度的增加，许多场景需要更高级的通信模式：

1.  **实时通信**：聊天应用、在线游戏、股票行情、实时通知等，需要服务器主动向客户端推送数据，而无需客户端频繁轮询。
2.  **低延迟**：HTTP 的请求-响应模式在频繁通信时会引入较大的开销（HTTP 头、TCP 握手等）。
3.  **双向通信**：在某些场景下，客户端和服务器需要同时发送和接收数据，形成全双工通信。

传统的解决方案如**轮询 (Polling)** 或**长轮询 (Long Polling)** 存在效率低下、延迟高、资源消耗大等问题。**WebSocket 协议**应运而生，它提供了一个持久的、全双工的通信通道。而 `HTTP Upgrade` 机制就是 WebSocket 建立连接的基石。

## 二、`Upgrade` 请求的工作原理

HTTP Upgrade 机制本质上是一个**协议协商过程**。它利用了 HTTP/1.1 的灵活性，通过特定的 HTTP 头字段来通知服务器客户端希望切换协议。

### 2.1 请求阶段 (客户端发起)

客户端（通常是浏览器中的 JavaScript，例如通过 `new WebSocket()` API）发起一个普通的 HTTP GET 请求，但会包含两个特殊的请求头：

*   `Upgrade`：这个头字段列出了客户端希望升级到的协议名称。例如，`WebSocket`。
*   `Connection`：这个头字段通常设置为 `Upgrade`。它告诉服务器，客户端希望将此连接用于协议升级。

**示例：WebSocket Upgrade 请求**

```http
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==  // 用于安全验证的随机 Base64 编码字符串
Sec-WebSocket-Version: 13                 // WebSocket 协议版本
Origin: http://example.com
```

**关键点：**

*   `Sec-WebSocket-Key` 和 `Sec-WebSocket-Version` 是 WebSocket 协议特有的头字段，用于握手和安全性考虑。它们在其他协议升级中可能不存在。
*   `Upgrade: websocket` 明确表达了客户端升级到 WebSocket 协议的意图。
*   `Connection: Upgrade` 是 HTTP/1.1 标准中的一个通用机制，它表明此请求并非普通请求，而是涉及连接协议的变更。它通常与 `Upgrade` 头一起使用。

### 2.2 响应阶段 (服务器回应)

服务器收到带有 `Upgrade` 和 `Connection: Upgrade` 的请求后，会进行判断：

*   **如果服务器支持并同意升级**：服务器会发送一个 `101 Switching Protocols` 状态码的响应。这个响应也包含 `Upgrade` 和 `Connection` 头，指示它同意升级到哪个协议。
    *   **示例：WebSocket Upgrade 成功响应**
        ```http
        HTTP/1.1 101 Switching Protocols
        Upgrade: websocket
        Connection: Upgrade
        Sec-WebSocket-Accept: s3pPLMBiSuxCbqhJz2+PT/DGroE= // 服务器根据 Sec-WebSocket-Key 计算出的值
        ```
        一旦客户端收到 `101 Switching Protocols` 响应，HTTP/1.1 协议的握手阶段就此结束。**此后的所有数据传输都将使用新的协议（例如 WebSocket）进行。**

*   **如果服务器不支持或不同意升级**：服务器会返回一个普通的 HTTP 响应，例如 `200 OK` (继续使用 HTTP) 或 `400 Bad Request` (无法升级)。
    *   **示例：服务器拒绝升级**
        ```http
        HTTP/1.1 200 OK
        Content-Type: text/html
        Content-Length: 123
        ... (普通 HTML 内容) ...
        ```
        在这种情况下，客户端会回退到 HTTP/1.1 协议，或者根据应用逻辑进行错误处理。

### 2.3 状态图

{% mermaid %}
graph TD
    A[客户端发送 GET 请求] --> B{请求头包含<br/>Upgrade: <protocol><br/>Connection: Upgrade}
    B -- 请求发送 --> C[服务器接收请求]

    C -- 服务器支持并同意升级 --> D{服务器发送<br/>101 Switching Protocols 响应<br/>Upgrade: <protocol><br/>Connection: Upgrade}
    D -- 响应发送 --> E[客户端接收 101 响应]
    E -- 握手完成 --> F["客户端和服务器<br/>开始使用新协议 (<protocol>) 通信"]

    C -- 服务器不支持或不同意升级 --> G{"服务器发送<br/>普通 HTTP 响应<br/>(例如 200 OK 或 400 Bad Request)"}
    G -- 响应发送 --> H[客户端接收普通响应]
    H -- 维持或结束 HTTP 连接 --> I[客户端和服务器<br/>继续使用 HTTP/1.1 或关闭连接]
{% endmermaid %}

## 三、`Upgrade` 头的通用性与 `Connection` 头的作用

### 3.1 `Upgrade` 头

`Upgrade` 头字段是一个通用机制，**不限于 WebSocket**。理论上，它可以用于协商升级到任何其他协议。例如，HTTP/2 (虽然 HTTP/2 通常通过 ALPN 在 TLS 握手阶段协商，而不是通过 `Upgrade` 头)。

**RFC 7230, Section 6.7** 描述了 `Upgrade` 头，它允许客户端或服务器指定其希望使用的通信协议列表，优先顺序从左到右。

### 3.2 `Connection` 头

`Connection` 头字段在 HTTP/1.1 中有多种用途，其中之一是用于**控制连接管理**。当 `Connection` 头的值为 `Upgrade` 时，它告诉中间代理服务器（如负载均衡器、反向代理等）不要尝试“理解”或“优化”这个连接的后续流量，而是将 `Upgrade` 头字段以及其他一些连接管理相关的头字段（如 `Sec-WebSocket-Key`）**透传**给上游服务器。这是因为这些头字段对于协议升级至关重要，如果被代理移除，将导致升级失败。

**示例：代理服务器对 Upgrade 请求的处理**

如果没有 `Connection: Upgrade`，代理服务器可能会将 `Upgrade` 头移除，因为它们通常只处理 HTTP/1.1 流量。有了它，代理就知道这是一个特殊的请求，需要将 `Upgrade` 相关信息传递给最终的服务器。

## 四、`Upgrade` 与 WebSocket 的关系

`Upgrade` 机制是 WebSocket 协议握手过程的核心部分。虽然 `Upgrade` 机制是通用的，但目前最普遍的实际应用就是将 HTTP 连接升级到 WebSocket。

WebSocket 协议本身定义在 **RFC 6455** 中，它详细规定了握手过程中的 `Sec-WebSocket-Key` 和 `Sec-WebSocket-Accept` 等特定头字段的计算和验证方式，以确保握手的安全性和合法性。

## 五、应用场景

除了 WebSocket，`Upgrade` 机制还可以理论上用于：

*   **HTTP/2 over TLS (H2)**：虽然 ALPN 更常用，但 H2 也可以通过 Upgrade 机制在非 TLS 连接上协商。
*   **其他自定义协议**：如果开发者需要在一个已建立的 TCP 连接上切换到自定义协议，`Upgrade` 提供了一种标准化的方式。

## 六、总结

HTTP Upgrade 请求是 HTTP/1.1 协议中一个强大而灵活的特性，它允许客户端和服务器协商并在同一个 TCP 连接上切换到不同的协议。它最著名的应用是作为 WebSocket 握手的核心机制，使得全双工、低延迟的实时通信成为可能。通过理解 `Upgrade` 和 `Connection: Upgrade` 头字段的作用，开发者可以更好地构建和优化现代 Web 应用，充分利用底层网络协议的强大功能。
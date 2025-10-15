---
title: WebSocket 详解：实现全双工实时通信
date: 2023-06-23 06:24:00
tags:
  - 2023
  - WebSocket
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---

> **WebSocket** 是一种在单个 TCP 连接上进行全双工（Full-Duplex）通信的网络协议。它在 Web 浏览器和服务器之间提供了一个持久化的连接，允许双方在任何时候发送消息，而无需像传统的 HTTP 请求那样需要先发送请求再接收响应。WebSocket 解决了传统 Web 应用中实现实时通信的诸多难题，是构建实时 Web 应用的关键技术之一。

{% note info %}
**核心思想**：从 HTTP 协议“握手”后，将底层 TCP 连接“升级”为 WebSocket 连接，实现客户端与服务器之间长时间、双向、无阻塞的消息传输，从而大幅降低通信开销，提升实时应用的性能。
{% endnote %}

## 一、为什么需要 WebSocket？传统 HTTP 的局限性

在 WebSocket 出现之前，Web 应用程序要实现实时通信，如聊天室、股票行情、在线游戏、推送通知等，面临着传统 HTTP 协议的固有局限性：

1.  **半双工 (Half-Duplex) 通信**：HTTP 协议是**单向请求-响应**模型。客户端发送请求，服务器返回响应。服务器无法主动向客户端发送消息，除非客户端先发起请求。
2.  **效率低下**：
    *   **频繁连接建立与断开**：每个 HTTP 请求都需要建立 TCP 连接 (三次握手)，传输数据，然后断开连接 (四次挥手)。这带来了显著的**开销**（延迟和队头阻塞）。
    *   **头部开销大**：每个 HTTP 请求和响应都携带大量重复的 HTTP 头部信息，即使是很小的数据传输，也会增加不必要的带宽消耗。
3.  **实时性差**：为了模拟实时通信，人们不得不采用一些“曲线救国”的技术：
    *   **轮询 (Polling)**：客户端定时向服务器发送请求，询问是否有新数据。实时性取决于轮询间隔，而频繁轮询会给服务器造成巨大压力。
    *   **长轮询 (Long Polling)**：客户端发送请求后，服务器会保持连接打开，直到有新数据或超时才响应。客户端收到响应后立即发起新的请求。相比轮询有所改善，但仍是单向通信，每次响应后仍需重建连接开销。
    *   **Comet (Streaming)**：服务器长时间保持连接打开，持续向客户端发送数据。但客户端到服务器的通信仍然需要独立的 HTTP 请求，且依然是半双工。

这些技术都无法提供真正高效、低延迟的双向实时通信能力。WebSocket 正是为了解决这些问题而生。

## 二、WebSocket 的特点与优势

WebSocket 协议 (RFC 6455) 于 2011 年标准化，具有以下显著特点和优势：

1.  **全双工通信 (Full-Duplex)**：一旦 WebSocket 连接建立，客户端和服务器可以独立地在任何时间点发送和接收数据，无需等待对方的响应。这就像打电话一样，双方可以同时说话。
2.  **持久化连接 (Persistent Connection)**：在一次 HTTP 握手之后，WebSocket 会将底层的 TCP 连接“劫持”或**升级 (Upgrade)** 为 WebSocket 连接，并在整个会话期间保持这个 TCP 连接的开放。这意味着无需频繁地建立和断开 TCP 连接。
3.  **头部开销小 (Reduced Overhead)**：一旦连接建立，后续的数据传输只需要很小的帧头部（通常只有几字节），而不是庞大的 HTTP 头部。这显著提高了数据传输效率。
4.  **服务器主动推送 (Server Push)**：服务器可以随时主动向客户端推送数据，而无需客户端发起请求，完美支持实时通知、聊天等场景。
5.  **跨域通信**：WebSocket 不受同源策略限制，默认支持跨域通信。
6.  **更好的网络兼容性**：WebSocket 使用标准的 HTTP 端口（80 和 443，通过 HTTP 协议握手）协商连接，因此可以穿透防火墙和代理服务器，具有良好的网络兼容性。
7.  **二进制数据支持**：除了文本数据（UTF-8），WebSocket 也原生支持二进制数据传输，这对于游戏、音视频流传输等应用非常有用。

## 三、WebSocket 的连接建立过程 (握手)

WebSocket 连接的建立过程是一个特殊的 HTTP 请求-响应机制，称为**握手 (Handshake)**，通常发生在 TCP 连接建立之后。

{% mermaid %}
sequenceDiagram
    participant C as 客户端 (浏览器)
    participant S as WebSocket 服务器

    C->>S: 1. TCP 三次握手
    Note over C,S: 建立底层 TCP 连接

    C->>S: 2. WebSocket 握手请求
    Note over C,S: HTTP Upgrade Request

    S->>C: 3. WebSocket 握手响应
    Note over C,S: HTTP 101 Switching Protocols

    Note over C,S: **握手成功！** TCP 连接现在升级为 WebSocket 连接。

    C-->>S: 4. WebSocket 数据帧 (客户端发送)
    S-->>C: 5. WebSocket 数据帧 (服务器发送)
    C-->>S: 6. ... (后续通信，全双工)

    C->>S: 7. WebSocket 关闭请求帧 (可选)
    S->>C: 8. WebSocket 关闭响应帧 (可选)
    Note over C,S: 关闭 WebSocket 连接，底层 TCP 连接随后断开。
{% endmermaid %}

**握手关键点解析：**

1.  **TCP 连接建立**：首先，客户端和服务器通过标准的 TCP 三次握手建立底层 TCP 连接。
2.  **WebSocket 握手请求 (HTTP Upgrade Request)**：
    客户端发送一个特殊的 HTTP GET 请求，请求将协议从 HTTP **升级 (Upgrade)** 到 WebSocket。这个请求看起来像一个普通的 HTTP 请求，但包含特定的头部信息：
    ```http
    GET /chat HTTP/1.1
    Host: server.example.com
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
    Sec-WebSocket-Version: 13
    Origin: http://client.example.com
    User-Agent: Mozilla/5.0...
    ```
    *   `Upgrade: websocket` 和 `Connection: Upgrade` 头是升级请求的标志。
    *   `Sec-WebSocket-Key`：一个客户端生成的 Base64 编码的随机字符串。服务器后续会用它来计算 `Sec-WebSocket-Accept`，以证明服务器理解 WebSocket 协议并防止代理缓存握手响应。
    *   `Sec-WebSocket-Version`：客户端支持的 WebSocket 协议版本。
    *   `Origin`：指示请求来自哪个源，用于跨域安全检查。
3.  **WebSocket 握手响应 (HTTP 101 Switching Protocols)**：
    如果服务器支持 WebSocket 并且接受升级请求，它会返回一个 `HTTP/1.1 101 Switching Protocols` 响应。这表示服务器同意切换协议。
    ```http
    HTTP/1.1 101 Switching Protocols
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Accept: s3pPLMBiTig/DRY/WA+oVw==
    Date: Fri, 26 Jul 2024 09:00:00 GMT
    Server: MyWebSocketServer/1.0
    ```
    *   `Upgrade: websocket` 和 `Connection: Upgrade` 头再次确认协议升级。
    *   `Sec-WebSocket-Accept`：服务器通过将客户端的 `Sec-WebSocket-Key`（上一步发送）拼接上一个固定的 GUID (`258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)，然后进行 SHA-1 哈希，最后进行 Base64 编码而得到的值。客户端收到后会验证此值，以确保服务器是合法的 WebSocket 服务器。
4.  **连接建立后**：一旦握手成功，HTTP 协议头将被移除，底层 TCP 连接将完全用于 WebSocket 协议的数据帧进行双向传输。

## 四、WebSocket 数据帧格式

一旦 WebSocket 连接建立，所有后续消息都通过发送 WebSocket 数据帧 (Frame) 来完成。WebSocket 帧的结构比 HTTP 头要简洁得多，大大降低了传输开销。

一个基本的 WebSocket 帧包含：

*   **FIN 位 (1 bit)**：表示这是消息的最后一个分片。WebSocket 允许消息分片传输。
*   **RSV1, RSV2, RSV3 (3 bits)**：保留位，目前必须为 0，除非扩展约定了其用途。
*   **Opcode (4 bits)**：操作码，定义了帧的类型。
    *   `0x0`：连续帧
    *   `0x1`：文本帧 (UTF-8)
    *   `0x2`：二进制帧
    *   `0x8`：连接关闭帧
    *   `0x9`：Ping 帧
    *   `0xA`：Pong 帧
*   **MASK 位 (1 bit)**：指示数据是否被掩码。客户端发送给服务器的数据**必须**被掩码 (MASK=1)，服务器发送给客户端的数据**必须不**被掩码 (MASK=0)。这是为了防止代理缓存投毒。
*   **Payload Length (7, 7+16, 7+64 bits)**：载荷长度，表示数据内容的字节数。根据长度大小，可以占用 7 位、16 位或 64 位。
*   **Masking-key (0 or 32 bits)**：如果 MASK 位为 1，则包含 4 字节（32 位）的掩码键。
*   **Payload Data (variable length)**：实际的应用数据。

**简化的帧结构示意图：**

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload Len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if Payload Len is 126/127) |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+-------------------------------+
|     Extended payload length continued, if 64 bits             |
+---------------------------------------------------------------+
|                               Masking-key                     |
|         (if MASK is 1, 32 bit)                                |
+---------------------------------------------------------------+
|                                                               |
:                       Payload Data                            :
: (length as indicated by Payload Len + Extended payload length):
|                                                               |
+---------------------------------------------------------------+
```

## 五、WebSocket 的应用场景

WebSocket 的全双工实时通信特性使其成为许多现代 Web 应用不可或缺的一部分：

*   **在线聊天应用**：如即时通讯、客户服务聊天或多人聊天室。
*   **实时数据推送**：如股票行情、比分直播、新闻推送。
*   **在线游戏**：实时多人对战游戏，需要低延迟、高频次的数据交换。
*   **实时协同编辑**：如在线文档编辑器（Google Docs）。
*   **物联网 (IoT)**：设备状态的实时监控和控制。
*   **通知系统**：社交媒体通知、应用内消息推送。
*   **地理位置跟踪**：显示车辆、快递员的实时位置。
*   **远程控制与监控**：如 Web 版的远程桌面、系统监控仪表盘。

## 六、WebSocket 的实现与使用

### 6.1 客户端 (浏览器)

现代浏览器原生支持 WebSocket API。

```javascript
// 创建 WebSocket 连接
const ws = new WebSocket('ws://localhost:8080/chat'); // 使用 ws 或 wss (安全) 协议

// 监听连接建立事件
ws.onopen = function(event) {
  console.log('WebSocket 连接成功！');
  ws.send('Hello Server!'); // 连接成功后发送消息
};

// 监听收到消息事件
ws.onmessage = function(event) {
  console.log('收到服务器消息:', event.data);
};

// 监听连接关闭事件
ws.onclose = function(event) {
  if (event.wasClean) {
    console.log(`WebSocket 连接关闭，代码: ${event.code}，原因: ${event.reason}`);
  } else {
    // 例如，服务器进程被杀死或网络中断
    console.error('WebSocket 连接意外中断！');
  }
};

// 监听错误事件
ws.onerror = function(error) {
  console.error('WebSocket 发生错误:', error);
};

// 发送消息
function sendMessage(message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message);
  } else {
    console.warn('WebSocket 连接未建立或已关闭，无法发送消息.');
  }
}

// 关闭连接
function closeConnection() {
  ws.close();
}
```

### 6.2 服务器端

服务器端实现 WebSocket 需要额外的库或框架支持，常见的有：

*   **Node.js**: `ws` 库、`Socket.IO` (在 WebSocket 之上提供更多功能和回退机制)。
*   **Python**: `websockets`、`aiohttp`。
*   **Java**: `Spring Boot` 的 `WebSocket` 模块、`Jetty`、`Netty`。
*   **Go**: `gorilla/websocket`。

**Node.js `ws` 库示例 (基本服务器)：**

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  console.log('一个新的客户端连接已建立！');

  ws.on('message', function incoming(message) {
    console.log('收到客户端消息:', message.toString());

    // 将消息广播给所有连接的客户端
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(`来自其他客户端的消息: ${message.toString()}`);
      }
    });

    // 或者直接回复发送方
    ws.send(`服务器已收到您的消息: ${message.toString()}`);
  });

  ws.on('close', function close() {
    console.log('客户端连接已关闭！');
  });

  ws.on('error', function error(err) {
    console.error('WebSocket 错误:', err);
  });

  ws.send('欢迎连接到 WebSocket 服务器！');
});

console.log('WebSocket 服务器正在监听 ws://localhost:8080');
```

## 七、安全性考虑

*   **传输加密**：始终使用 `wss://` (WebSocket Secure) 协议，它基于 TLS/SSL 运行，提供数据加密和服务器身份验证，防止窃听和中间人攻击。
*   **身份验证与授权**：WebSocket 本身不提供认证机制。通常在 HTTP 握手阶段利用标准的 HTTP 认证（如 Cookie、Token）来验证用户身份。连接建立后，服务器应继续验证用户是否有权限执行特定操作。
*   **输入验证**：严格验证所有从客户端接收到的数据，防止注入攻击或其他恶意输入。
*   **流量与资源管理**：防止恶意客户端通过发送大量数据或频繁连接/断开来耗尽服务器资源。
*   **同源策略 (Origin)**：虽然 WebSocket 支持跨域，但服务器端应该始终验证 `Origin` 头部，以确保连接请求来自受信任的域，防止 CSRF (Cross-Site Request Forgery) 攻击。

## 八、总结

WebSocket 协议是现代 Web 实时通信的基石。它通过建立持久化的全双工连接，显著提升了网络通信的效率和实时性，解决了传统 HTTP 协议难以处理的场景。从简单的聊天应用到复杂的在线游戏和物联网监控，WebSocket 都在后端架构中扮演着越来越重要的角色。正确理解其工作原理、优势和安全考量，对于构建高性能、响应迅速的 Web 应用程序至关重要。
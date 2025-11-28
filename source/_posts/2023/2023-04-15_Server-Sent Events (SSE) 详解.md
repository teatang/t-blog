---
title: Server-Sent Events (SSE) 详解
date: 2023-04-15 06:24:00
tags:
  - 2023
  - Web技术
  - 前端技术
categories:
  - 前端技术
  - Web技术
---

> **Server-Sent Events (SSE)** 是一种 HTML5 规范，允许服务器通过持久的 HTTP 连接，以文本流 (text-stream) 的形式向客户端推送事件。它提供了一种高效、简单的方式来实现服务器到客户端的**单向实时通信**，特别适用于需要从服务器端持续获取数据更新的场景，如实时数据流、通知推送等。

{% note info %}
核心思想：**SSE 利用标准的 HTTP/1.1 协议，通过一个持久的 GET 请求建立连接，服务器端持续向客户端发送带有特定格式的数据流，客户端通过 `EventSource` API 监听并处理这些事件。**
{% endnote %}
------

## 一、为什么需要 SSE？(实时通信的演进)

在 Web 应用中，实现服务器向客户端的实时数据推送一直是开发者面临的挑战。随着技术的发展，出现了多种解决方案，SSE 是其中一种重要的选择。

### 1.1 传统轮询 (Polling)
*   **定义**：客户端定期（如每隔几秒）向服务器发送 HTTP 请求，询问是否有新的数据。
*   **优点**：实现简单，兼容性好。
*   **缺点**：
    *   **效率低下**：大多数请求可能是无效的（无新数据），造成大量不必要的 HTTP 请求和服务器资源浪费。
    *   **延迟高**：数据的实时性取决于轮询间隔，间隔越长延迟越高。

### 1.2 长轮询 (Long Polling)
*   **定义**：客户端发送 HTTP 请求后，服务器会保持连接打开，直到有新数据可用或达到超时时间。一旦有数据，服务器立即响应并关闭连接，客户端收到数据后会立即发起新的请求。
*   **优点**：比传统轮询更高效，延迟较低。
*   **缺点**：
    *   **复杂性增加**：服务器需要维护大量挂起的连接。
    *   **仍然是请求-响应模式**：本质上仍然是客户端发起请求，服务器响应，没有真正实现服务器主动推送。
    *   **资源消耗**：每个连接都需要服务器资源，尤其在大量并发下。

### 1.3 WebSocket 的挑战
*   **定义**：WebSocket 是一种全双工通信协议，它在单个 TCP 连接上提供双向通信通道。
*   **优点**：真正实现了双向实时通信，效率高，延迟低。
*   **缺点**：
    *   **协议升级**：需要从 HTTP 协议升级，不能直接复用 HTTP/1.1 的全部特性。
    *   **实现复杂**：相对于 SSE，客户端和服务器端实现 WebSocket 的代码通常更复杂。
    *   **开销**：对于只需要服务器单向推送的场景，WebSocket 的双向能力可能是一种不必要的开销。

### 1.4 SSE 的定位
针对只需要服务器向客户端单向推送数据的场景，SSE 提供了一个优雅且轻量级的解决方案：它基于标准的 HTTP/1.1 协议，避免了 WebSocket 的复杂性，同时解决了传统轮询和长轮询的效率和延迟问题。

## 二、SSE 核心概念与工作原理

### 2.1 定义
**Server-Sent Events (SSE)** 允许服务器通过一个持久的 HTTP 连接向客户端推送事件。这个连接在服务器端被保持打开状态，当有新事件发生时，服务器将事件数据以文本流的形式写入响应体，客户端则通过 `EventSource` 对象接收这些事件。

### 2.2 MIME 类型
SSE 连接使用特定的 MIME 类型：`Content-Type: text/event-stream`。这是浏览器识别 SSE 流的关键。

### 2.3 数据格式
SSE 的数据流是 UTF-8 编码的文本，由一系列事件组成。每个事件由一个或多个字段（field）组成，以换行符 (`\n`) 结束，事件之间用两个换行符 (`\n\n`) 分隔。
SSE 规范定义了四种标准字段：

*   **`data:`**：事件数据。可以有多行 `data` 字段，它们会被连接成一个字符串，以 `\n` 分隔。
    ```
    data: 第一行数据
    data: 第二行数据
    ```
    客户端接收到的数据将是 "第一行数据\n第二行数据"。

*   **`event:`**：事件类型。允许客户端对不同类型的事件使用不同的事件监听器。如果省略，默认事件类型为 `message`。
    ```
    event: stockUpdate
    data: {"symbol": "GOOG", "price": 1500}
    ```

*   **`id:`**：事件 ID。用于在连接断开后，客户端自动重连时告知服务器从哪个 ID 开始发送事件，防止数据丢失。
    ```
    id: 123
    data: 新闻标题
    ```

*   **`retry:`**：重连间隔时间 (毫秒)。如果连接断开，客户端会等待此时间后再尝试重连。如果省略，浏览器通常默认为 3 秒。
    ```
    retry: 5000
    data: Ping
    ```

**完整事件示例**：
```
event: userOnline
id: 1001
data: {"userId": "alice", "status": "online"}

event: userOffline
id: 1002
data: {"userId": "bob", "status": "offline"}

data: 这是默认事件类型的消息
data: 消息内容分多行
id: 1003

retry: 10000
data: 这是一个带有重连时间的事件
```

### 2.4 连接生命周期
1.  **建立连接**：客户端通过 `new EventSource(url)` 发起一个 HTTP GET 请求，并设置 `Accept: text/event-stream`。
2.  **服务器响应**：服务器返回 `HTTP 200 OK`，并设置 `Content-Type: text/event-stream`、`Cache-Control: no-cache` 和 `Connection: keep-alive` 等响应头。
3.  **数据推送**：服务器保持连接打开，并在有新数据时，将格式化的事件数据写入响应体并刷新 (flush) 缓冲区。
4.  **连接断开与重连**：
    *   如果连接因网络问题、服务器关闭或客户端调用 `EventSource.close()` 而断开，客户端会尝试自动重连。
    *   重连时，如果上次接收到的事件有 `id` 字段，浏览器会在请求头中携带 `Last-Event-ID`，服务器可以利用此信息从断点处恢复数据流。
    *   重连间隔由 `retry` 字段控制。

{% mermaid %}
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: HTTP GET Request (Accept: text/event-stream)
    Server-->>Client: HTTP 200 OK (Content-Type: text/event-stream)
    loop Event Stream
        Server->>Client: Send Event (id:1, event:stock, data:{"GOOG":1500})
        Server->>Client: Send Event (id:2, data:heartbeat)
    end
    alt Connection Lost (Network/Server/Client.close())
        Server--x Client: Connection closed
        Client->>Server: (After 'retry' time) HTTP GET Request (Last-Event-ID: 2)
        Server-->>Client: Resume event stream from ID 2
    end
{% endmermaid %}

## 三、客户端实现 (JavaScript)

客户端通过 `EventSource` API 接收和处理 SSE 事件。

### 3.1 `EventSource` API
创建一个 `EventSource` 对象，并传入 SSE 服务的 URL：
```javascript
const eventSource = new EventSource('/events'); // 替换为你的 SSE 服务地址
```

### 3.2 事件监听
`EventSource` 对象提供了以下事件监听器：

*   **`onopen`**：连接成功建立时触发。
*   **`onmessage`**：当服务器发送没有 `event` 字段的事件（默认 `message` 类型）时触发。`event.data` 包含数据内容。
*   **`onerror`**：连接发生错误时触发，可能是网络错误、CORS 错误等。
*   **自定义事件监听**：通过 `addEventListener()` 方法监听服务器发送的带有特定 `event` 字段的事件。

**示例代码**：

```javascript
// 替换为你的 SSE 服务地址
const eventSource = new EventSource('/api/sse/stream'); 

eventSource.onopen = function(event) {
    console.log("SSE 连接已建立。", event);
};

eventSource.onmessage = function(event) {
    // 处理默认事件类型 (event: message) 的数据
    console.log("收到默认消息:", event.data);
    const data = JSON.parse(event.data);
    document.getElementById('messageArea').innerHTML += `<p>默认消息: ${data.content} (${data.timestamp})</p>`;
};

eventSource.addEventListener('chatMessage', function(event) {
    // 处理 event: chatMessage 类型的事件
    console.log("收到聊天消息:", event.data, "ID:", event.lastEventId);
    const chat = JSON.parse(event.data);
    document.getElementById('messageArea').innerHTML += `<p style="color: blue;">Chat: ${chat.user}: ${chat.message} (${chat.timestamp})</p>`;
});

eventSource.addEventListener('statusUpdate', function(event) {
    // 处理 event: statusUpdate 类型的事件
    console.log("收到状态更新:", event.data);
    const status = JSON.parse(event.data);
    document.getElementById('messageArea').innerHTML += `<p style="color: green;">Status: ${status.user} is now ${status.status} (${status.timestamp})</p>`;
});

eventSource.onerror = function(error) {
    console.error("SSE 连接发生错误:", error);
    // 可以在这里处理错误，例如显示用户提示或尝试重新连接 (浏览器会自动尝试)
    if (eventSource.readyState === EventSource.CLOSED) {
        console.log("SSE 连接已关闭，浏览器将尝试重连...");
    }
};

// 客户端也可以主动关闭连接
document.getElementById('closeButton').onclick = () => {
    eventSource.close();
    console.log("SSE 连接已手动关闭。");
};
```

```html
<!-- 配合上述 JavaScript 示例的 HTML 结构 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SSE 客户端示例</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        #messageArea { border: 1px solid #ccc; padding: 10px; min-height: 200px; margin-top: 20px; background-color: #f9f9f9; }
        p { margin: 5px 0; }
    </style>
</head>
<body>
    <h1>SSE 客户端</h1>
    <p>打开浏览器的开发者工具控制台，查看 SSE 事件。</p>
    <button id="closeButton">关闭 SSE 连接</button>
    <div id="messageArea">
        <p>等待服务器消息...</p>
    </div>

    <script src="client.js"></script> <!-- 假设上述 JS 代码在 client.js 中 -->
</body>
</html>
```

### 3.3 自动重连
浏览器内置了自动重连机制。当连接断开时，浏览器会等待 `retry` 字段指定的时间（或默认 3 秒）后，自动发起新的 HTTP GET 请求尝试重连。如果服务器响应的事件包含 `id` 字段，浏览器会在重连请求的 `Last-Event-ID` HTTP 头中带上最后接收到的 `id`，方便服务器从断点处恢复推送。

## 四、服务器端实现 (Go 语言)

服务器端需要设置正确的响应头，并按照 SSE 规范格式化数据流，然后持续写入响应体。

**示例代码 (Go 使用 Gin 框架)**：

```go
package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// 简单的路由用于提供 HTML 页面
	router.GET("/", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html", []byte(`
			<!DOCTYPE html>
			<html lang="zh-CN">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>SSE 客户端示例</title>
				<style>
					body { font-family: sans-serif; margin: 20px; }
					#messageArea { border: 1px solid #ccc; padding: 10px; min-height: 200px; margin-top: 20px; background-color: #f9f9f9; }
					p { margin: 5px 0; }
				</style>
			</head>
			<body>
				<h1>SSE 客户端</h1>
				<p>打开浏览器的开发者工具控制台，查看 SSE 事件。</p>
				<button id="closeButton">关闭 SSE 连接</button>
				<div id="messageArea">
					<p>等待服务器消息...</p>
				</div>
				<script>
					const eventSource = new EventSource('/api/sse/stream'); 

					eventSource.onopen = function(event) {
						console.log("SSE 连接已建立。", event);
					};

					eventSource.onmessage = function(event) {
						console.log("收到默认消息:", event.data);
						const data = JSON.parse(event.data);
						document.getElementById('messageArea').innerHTML += `<p>默认消息: ${data.content} (${data.timestamp})</p>`;
					};

					eventSource.addEventListener('chatMessage', function(event) {
						console.log("收到聊天消息:", event.data, "ID:", event.lastEventId);
						const chat = JSON.parse(event.data);
						document.getElementById('messageArea').innerHTML += `<p style="color: blue;">Chat: ${chat.user}: ${chat.message} (${chat.timestamp})</p>`;
					});

					eventSource.addEventListener('statusUpdate', function(event) {
						console.log("收到状态更新:", event.data);
						const status = JSON.parse(event.data);
						document.getElementById('messageArea').innerHTML += `<p style="color: green;">Status: ${status.user} is now ${status.status} (${status.timestamp})</p>`;
					});

					eventSource.onerror = function(error) {
						console.error("SSE 连接发生错误:", error);
						if (eventSource.readyState === EventSource.CLOSED) {
							console.log("SSE 连接已关闭，浏览器将尝试重连...");
						}
					};

					document.getElementById('closeButton').onclick = () => {
						eventSource.close();
						console.log("SSE 连接已手动关闭。");
					};
				</script>
			</body>
			</html>
		`))
	})

	// SSE 事件流处理器
	router.GET("/api/sse/stream", sseStreamHandler)

	log.Println("SSE Server started on :8080")
	router.Run(":8080")
}

func sseStreamHandler(c *gin.Context) {
	// 1. 设置响应头
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Transfer-Encoding", "identity") // 某些代理可能需要此头
	// CORS 允许所有源（根据实际需求调整）
	c.Header("Access-Control-Allow-Origin", "*") 

	// 获取客户端上次接收的事件 ID，用于重连后的数据恢复
	lastEventID := c.GetHeader("Last-Event-ID")
	log.Printf("Client connected, Last-Event-ID: %s", lastEventID)

	// 使用 Gin 的 Context.Writer 接口获取低层级的 http.ResponseWriter
	// 并断言其为 http.Flusher 接口，以便能够刷新缓冲区
	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.String(http.StatusInternalServerError, "Streaming unsupported!")
		return
	}

	// 2. 发送 initial `retry` field (可选，但推荐)
	// 客户端在连接断开后会等待 5 秒重连
	fmt.Fprintf(c.Writer, "retry: 5000\n\n") 
	flusher.Flush() // 立即发送头部和 retry 配置

	clientGone := c.Request.Context().Done() // 监听客户端是否断开连接

	eventID := 0 // 模拟事件 ID

	for {
		select {
		case <-clientGone:
			log.Printf("Client disconnected, ID: %s", lastEventID)
			return // 客户端断开连接，终止推送
		default:
			eventID++ // 递增事件 ID

			// 3. 模拟发送不同类型的事件
			currentTime := time.Now().Format("15:04:05")

			// 默认事件 (event: message)
			msg := fmt.Sprintf(`{"id": %d, "content": "Hello from server!", "timestamp": "%s"}`, eventID, currentTime)
			fmt.Fprintf(c.Writer, "id: %d\n", eventID)
			fmt.Fprintf(c.Writer, "data: %s\n\n", msg)
			flusher.Flush() // 刷新缓冲区，确保数据立即发送

			// 模拟发送 chatMessage 事件
			eventID++
			chatMsg := fmt.Sprintf(`{"id": %d, "user": "Alice", "message": "What's up?", "timestamp": "%s"}`, eventID, currentTime)
			fmt.Fprintf(c.Writer, "id: %d\n", eventID)
			fmt.Fprintf(c.Writer, "event: chatMessage\n")
			fmt.Fprintf(c.Writer, "data: %s\n\n", chatMsg)
			flusher.Flush()

			// 模拟发送 statusUpdate 事件
			eventID++
			statusMsg := fmt.Sprintf(`{"id": %d, "user": "Bob", "status": "active", "timestamp": "%s"}`, eventID, currentTime)
			fmt.Fprintf(c.Writer, "id: %d\n", eventID)
			fmt.Fprintf(c.Writer, "event: statusUpdate\n")
			fmt.Fprintf(c.Writer, "data: %s\n\n", statusMsg)
			flusher.Flush()
			
			// 可以添加一个空心跳事件来保持连接活跃，防止某些代理关闭空闲连接
			// fmt.Fprintf(c.Writer, ":keep-alive\n\n") // 这是注释形式的心跳
			// flusher.Flush()

			time.Sleep(2 * time.Second) // 每 2 秒发送一次数据
		}
	}
}
```

**运行 Go 服务器**：
1.  确保 Go 环境已安装 Gin (`go get -u github.com/gin-gonic/gin`)。
2.  将上述 Go 代码保存为 `main.go`。
3.  在终端运行 `go run main.go`。
4.  在浏览器中访问 `http://localhost:8080` 即可看到客户端页面并接收 SSE 事件。

## 五、SSE 的优缺点与适用场景

### 5.1 优点
*   **单向通信简单高效**：专为服务器推送到客户端设计，实现简单，资源消耗相对较低。
*   **基于标准 HTTP/1.1**：复用现有 HTTP 基础设施（代理、防火墙），无需特殊协议或端口。
*   **自动重连机制**：浏览器内置支持自动重连，并可通过 `Last-Event-ID` 恢复事件流，简化客户端代码。
*   **API 简单易用**：客户端 `EventSource` API 直观易懂，上手快。
*   **可传递不同类型事件**：通过 `event:` 字段，客户端可以针对不同类型的消息注册不同的处理函数。
*   **无需 WebSocket 的复杂性**：避免了 WebSocket 握手和帧协议的开销，对于纯推送场景更轻量。

### 5.2 缺点
*   **单向通信**：无法通过同一通道将数据从客户端发送到服务器。如果需要双向通信，仍需结合其他 HTTP 请求或使用 WebSocket。
*   **仅支持 UTF-8 文本**：只能传输文本数据，二进制数据需要进行编码（如 Base64），增加数据量。
*   **浏览器连接限制**：大多数浏览器对同一域名的 SSE 连接数有限制（例如 Chrome 默认 6 个）。这可能在高并发场景下成为瓶颈。
*   **HTTP/1.1 队头阻塞**：由于基于 HTTP/1.1，可能存在队头阻塞问题（虽然在 HTTP/2 中有所缓解）。
*   **不适用于高并发短连接**：维护大量长连接仍会消耗服务器资源，但在需要持续推送的场景下，其效率远高于轮询。

### 5.3 适用场景
*   **实时数据流**：股票行情、加密货币价格、体育赛事比分、天气更新。
*   **新闻和社交媒体动态**：实时新闻推送、社交媒体时间线更新。
*   **通知中心**：系统通知、聊天应用消息提醒（如果聊天本身是基于 WebSocket，SSE 可用于通知）。
*   **长时任务进度更新**：后台任务（如文件转换、数据导入导出）的实时进度反馈。
*   **服务器日志实时展示**：将服务器日志实时推送到前端监控界面。

## 六、总结

Server-Sent Events (SSE) 是 Web 实时通信领域的一个强大工具，它以其基于 HTTP 的简洁性和内置的重连机制，在需要服务器单向推送数据的场景中表现出色。虽然它不具备 WebSocket 的双向通信能力，但对于许多应用而言，这种单向流的效率和易用性足以满足需求。理解 SSE 的工作原理、数据格式以及如何在客户端和服务器端实现它，能帮助开发者构建响应迅速、用户体验良好的实时 Web 应用。
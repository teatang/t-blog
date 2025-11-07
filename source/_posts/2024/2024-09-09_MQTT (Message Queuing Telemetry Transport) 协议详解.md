---
title: MQTT (Message Queuing Telemetry Transport) 协议详解
date: 2024-09-09 06:24:00
tags:
  - 2024
  - 硬件协议
  - 嵌入式系统
  - 硬件编程
categories:
  - 嵌入式系统
  - 硬件协议
---

> **MQTT (Message Queuing Telemetry Transport)** 是一种基于 **发布/订阅 (Publish/Subscribe)** 模式的轻量级消息协议。它专门设计用于在资源受限的设备和低带宽、高延迟或不可靠的网络环境下，提供可靠的消息传输服务。MQTT 因其简洁、高效和对物联网 (IoT) 场景的良好支持而广受欢迎。

{% note info %}
核心思想：**MQTT 通过引入一个中心化的消息代理 (Broker) 来解耦消息的发布者 (Publisher) 和订阅者 (Subscriber)，实现异步通信。这种模式使得设备之间无需直接通信，降低了系统的复杂性和耦合度。**
{% endnote %}
------

## 一、为什么需要 MQTT？

传统的客户端/服务器 (Client/Server) 模式在物联网场景下存在一些局限性：

1.  **资源受限**：物联网设备通常内存小、处理能力弱、功耗要求高，复杂的 HTTP/HTTPS 协议开销较大。
2.  **网络环境恶劣**：蜂窝网络、卫星网络等可能存在高延迟、低带宽、频繁断线等问题。
3.  **一对多/多对一通信**：许多物联网应用需要一个设备向多个接收者发送数据（如传感器数据），或多个设备向一个服务器发送数据。
4.  **实时性要求**：需要快速、低延迟地传输事件或控制指令。

MQTT 旨在解决这些问题，提供一种**轻量级、高效率、发布/订阅**的消息传输机制：

*   **轻量级**：协议头部开销极小，数据传输量小，适合资源受限设备。
*   **发布/订阅模式**：发布者和订阅者之间解耦，无需知道对方的存在，通过 Broker 转发消息。
*   **可靠性**：支持三种不同的服务质量 (QoS) 等级，确保消息在不同场景下的可靠传输。
*   **持久会话**：支持断线重连后恢复会话状态，保证重要消息不丢失。
*   **Last Will and Testament (LWT)**：遗嘱消息机制，允许设备在非正常断开时通知其他订阅者。

## 二、MQTT 核心概念

### 2.1 发布/订阅模式

这是 MQTT 最核心的通信模式，区别于传统的客户端/服务器模式。

*   **消息发布者 (Publisher)**：生产消息的客户端。它不知道谁将接收这些消息，只负责将消息发布到特定的主题 (Topic)。
*   **消息订阅者 (Subscriber)**：消费消息的客户端。它订阅一个或多个主题，只接收自己感兴趣的消息。它也不知道消息来自哪个发布者。
*   **消息代理 (Broker)**：所有消息的中心枢纽。它接收发布者发布的消息，并根据主题将消息转发给所有订阅了该主题的订阅者。Broker 负责管理连接、认证、授权、存储消息（QoS 1 和 2）等。

{% mermaid %}
graph LR
    P1[Publisher 1] -- Publish Topic A --> Broker
    P2[Publisher 2] -- Publish Topic B --> Broker

    Broker -- Forward Topic A --> S1[Subscriber 1]
    Broker -- Forward Topic A --> S2[Subscriber 2]
    Broker -- Forward Topic B --> S3[Subscriber 3]

    S1 -- Subscribe Topic A --> Broker
    S2 -- Subscribe Topic A --> Broker
    S3 -- Subscribe Topic B --> Broker
{% endmermaid %}

### 2.2 主题 (Topic)

主题是 MQTT 中消息路由的唯一标识符。它是一个字符串，类似文件系统路径，用于对消息进行分类。

*   **层级结构**：使用 `/` 分隔符表示层级，例如 `home/livingroom/temperature`。
*   **通配符**：
    *   **`+` (单层通配符)**：匹配单个层级。例如 `home/+/temperature` 可以匹配 `home/livingroom/temperature` 和 `home/kitchen/temperature`，但不能匹配 `home/temperature`。
    *   **`#` (多层通配符)**：匹配零个或多个层级，且必须放在主题的末尾。例如 `home/#` 可以匹配 `home/livingroom/temperature`、`home/kitchen/light`、`home/` 等。

**示例：**

| 发布主题             | 订阅主题             | 是否匹配 |
| :------------------- | :------------------- | :------- |
| `sensor/room1/temp`  | `sensor/room1/temp`  | 是       |
| `sensor/room1/temp`  | `sensor/+/temp`      | 是       |
| `sensor/room1/temp`  | `sensor/#`           | 是       |
| `sensor/room1/temp`  | `sensor/room1/#`     | 是       |
| `sensor/room1/temp`  | `sensor/room2/temp`  | 否       |
| `sensor/room1/temp`  | `+/room1/temp`       | 是       |
| `a/b/c`              | `a/+`                | 否       |
| `a/b/c`              | `a/+/+`              | 是       |

### 2.3 服务质量 (Quality of Service - QoS)

MQTT 协议定义了三种 QoS 等级，用于控制消息传输的可靠性：

*   **QoS 0 (At Most Once)**：
    *   “**最多一次**”：消息发送后即“发送即忘”，不保证消息一定送达，也不会重发。
    *   **特点**：效率最高，开销最小，适用于不重要的、实时性要求高的场景 (如传感器瞬时读数)。
    *   **流程**：`PUBLISH` -> (Broker)
    *   **丢包风险**：高

*   **QoS 1 (At Least Once)**：
    *   “**至少一次**”：保证消息至少送达一次。Broker 收到消息后会发送 `PUBACK` (Publish Acknowledge) 确认包。如果发布者在一定时间内未收到 `PUBACK`，会重发消息。
    *   **特点**：保证送达，但可能重复。适用于大部分需要可靠传输的场景。
    *   **流程**：`PUBLISH` -> Broker -> `PUBACK`
    *   **丢包风险**：低 (可能重复)

*   **QoS 2 (Exactly Once)**：
    *   “**只有一次**”：保证消息只送达一次，且只送达一次。这是一个四步握手过程，确保消息既不丢失也不重复。
    *   **特点**：可靠性最高，开销最大，效率最低。适用于对消息完整性要求极高的场景 (如账单、控制指令)。
    *   **流程**：`PUBLISH` -> Broker -> `PUBREC` (Publish Received) -> 发布者 -> `PUBREL` (Publish Release) -> Broker -> `PUBCOMP` (Publish Complete)
    *   **丢包风险**：无 (不会重复)

{% mermaid %}
sequenceDiagram
    participant Publisher
    participant Broker
    participant Subscriber

    Note over Publisher,Broker: QoS 0 (At Most Once)
    Publisher->>Broker: PUBLISH (QoS 0)
    Broker->>Subscriber: PUBLISH (QoS 0)

    Note over Publisher,Broker: QoS 1 (At Least Once)
    Publisher->>Broker: PUBLISH (QoS 1)
    Broker->>Publisher: PUBACK
    Broker->>Subscriber: PUBLISH (QoS 1)

    Note over Publisher,Broker: QoS 2 (Exactly Once)
    Publisher->>Broker: PUBLISH (QoS 2)
    Broker->>Publisher: PUBREC
    Publisher->>Broker: PUBREL
    Broker->>Publisher: PUBCOMP
    Broker->>Subscriber: PUBLISH (QoS 2)
{% endmermaid %}

### 2.4 保留消息 (Retained Message)

当发布者发送一条带有 "保留 (Retain)" 标志的消息到 Broker 时，Broker 会将这条消息存储起来。当有新的订阅者订阅该主题时，Broker 会立即将这条保留消息发送给它，即使这条消息是在订阅之前发布的。

*   **用途**：用于提供主题的最新状态。例如，一个设备发布了某个开关的最新状态，即使设备离线，新上线的控制器也能立即获取到当前开关的状态。
*   **注意**：每个主题只能保留一条消息。发布新的保留消息会覆盖旧的。发布一个空消息并带有 Retain 标志可以清除保留消息。

### 2.5 持久会话 (Persistent Session) / 清理会话 (Clean Session)

客户端连接到 Broker 时，可以指定 `Clean Session` 标志：

*   **`Clean Session = true` (默认)**：客户端每次连接都是一个全新的会话。断开连接后，Broker 会清除所有相关的会会话状态 (包括订阅、QoS 1 和 QoS 2 未确认消息)。下次连接时，客户端需要重新订阅。
*   **`Clean Session = false`**：客户端断开连接后，Broker 会保留其会话状态。当客户端以相同的 `ClientID` 重新连接时，Broker 会恢复之前的订阅，并发送断开期间错过的 QoS 1 和 QoS 2 消息。
*   **用途**：当设备网络不稳定，经常断线重连时，使用 `Clean Session = false` 可以保证消息的连续性。

### 2.6 遗嘱消息 (Last Will and Testament - LWT)

当客户端连接到 Broker 时，可以配置一个遗嘱消息。如果客户端非正常断开连接 (如断电、网络故障)，Broker 会自动将这个遗嘱消息发布到指定的主题上。

*   **用途**：用于通知其他订阅者某个设备已离线。例如，当一个灯具设备断开连接时，Broker 可以发布一条“灯具离线”的消息，其他控制设备可以及时响应。
*   **配置**：遗嘱消息包括一个主题、消息内容、QoS 等级和 Retain 标志。

## 三、MQTT 协议报文结构

MQTT 协议是一个二进制协议，每个报文都由三部分组成：

1.  **固定报头 (Fixed Header)**：所有 MQTT 报文都包含，至少 2 字节。包含报文类型、DUP 标志、QoS 级别、RETAIN 标志和剩余长度 (Remaining Length)。
    *   **报文类型 (Message Type)**：4 位，标识 MQTT 报文的类型 (CONNECT, PUBLISH, SUBSCRIBE 等)。
    *   **DUP (Duplicate) 标志**：1 位，用于 QoS 1 和 QoS 2 消息的重发标记。
    *   **QoS (Quality of Service) 级别**：2 位，标识消息的 QoS 级别。
    *   **RETAIN 标志**：1 位，PUBLISH 报文的保留消息标志。
    *   **剩余长度 (Remaining Length)**：变长编码，表示可变报头和有效载荷的字节数。

2.  **可变报头 (Variable Header)**：某些报文类型包含。包含报文标识符 (Packet Identifier)、主题名、返回码等信息，根据报文类型而异。

3.  **有效载荷 (Payload)**：某些报文类型包含。实际的消息数据。

**常见报文类型：**

*   **CONNECT (连接请求)**：客户端向 Broker 发起连接。
*   **CONNACK (连接确认)**：Broker 响应客户端的连接请求。
*   **PUBLISH (发布消息)**：发布者向 Broker 发布消息。
*   **PUBACK (发布确认)**：Broker 确认收到 QoS 1 PUBLISH 消息。
*   **PUBREC (发布收到)**：Broker 收到 QoS 2 PUBLISH 消息的第一步确认。
*   **PUBREL (发布释放)**：发布者收到 PUBREC 后的回应，QoS 2 的第二步。
*   **PUBCOMP (发布完成)**：Broker 收到 PUBREL 后的回应，QoS 2 的第三步。
*   **SUBSCRIBE (订阅请求)**：客户端向 Broker 订阅主题。
*   **SUBACK (订阅确认)**：Broker 响应客户端的订阅请求。
*   **UNSUBSCRIBE (取消订阅请求)**：客户端向 Broker 取消订阅主题。
*   **UNSUBACK (取消订阅确认)**：Broker 响应客户端的取消订阅请求。
*   **PINGREQ (心跳请求)**：客户端向 Broker 发送心跳包。
*   **PINGRESP (心跳响应)**：Broker 响应客户端的心跳请求。
*   **DISCONNECT (断开连接)**：客户端正常断开与 Broker 的连接。

## 四、MQTT 认证与安全

MQTT 协议本身只提供基本的认证机制，不包含数据加密功能。为了保证安全，通常需要结合以下措施：

1.  **用户名/密码认证**：在 `CONNECT` 报文中携带用户名和密码，Broker 进行验证。
2.  **客户端 ID (ClientID)**：每个连接的客户端必须有一个唯一的 `ClientID`。Broker 可以根据 ClientID 识别客户端。
3.  **SSL/TLS 加密**：MQTT 通常运行在 TCP/IP 之上。通过在 TCP 层之上使用 SSL/TLS，可以对整个 MQTT 通信链路进行加密，防止数据被窃听和篡改。这是最常见的安全实践，端口通常是 8883 (MQTT over SSL/TLS)。
4.  **授权 (Authorization)**：Broker 根据客户端的身份 (ClientID, 用户名) 决定其是否有权限发布到某个主题或订阅某个主题。

## 五、MQTT 协议版本

目前最常用的 MQTT 协议版本是：

*   **MQTT v3.1.1**：最广泛部署的版本，稳定可靠。
*   **MQTT v5.0**：于 2018 年发布，引入了许多新特性，如：
    *   会话过期 (Session Expiry)
    *   原因码 (Reason Codes) 和属性 (Properties)
    *   共享订阅 (Shared Subscriptions)
    *   主题别名 (Topic Aliases)
    *   请求/响应模式 (Request/Response)
    *   增强认证 (Enhanced Authentication)
    *   ...等，提供了更强大的功能和灵活性。

## 六、使用 Go 语言实现一个简单的 MQTT 客户端示例

这里使用 `eclipse/paho.mqtt.golang` 库，这是一个非常流行的 Go 语言 MQTT 客户端库。

```go
package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

// 定义消息处理器
var messagePubHandler mqtt.MessageHandler = func(client mqtt.Client, msg mqtt.Message) {
	fmt.Printf("Received message: %s from topic: %s\n", msg.Payload(), msg.Topic())
}

// 定义连接处理器
var connectHandler mqtt.OnConnectHandler = func(client mqtt.Client) {
	fmt.Println("Connected to MQTT Broker!")
}

// 定义连接失联处理器
var connectLostHandler mqtt.ConnectionLostHandler = func(client mqtt.Client, err error) {
	fmt.Printf("Connection lost: %v\n", err)
}

func main() {
	// 配置 MQTT 客户端选项
	opts := mqtt.NewClientOptions()
	opts.AddBroker("tcp://broker.emqx.io:1883") // 免费的公共 MQTT Broker
	opts.SetClientID("go_mqtt_client_example")
	opts.SetUsername("emqx") // 如果 Broker 需要认证
	opts.SetPassword("public")
	opts.SetDefaultPublishHandler(messagePubHandler)
	opts.OnConnect = connectHandler
	opts.OnConnectionLost = connectLostHandler

	// 创建并连接客户端
	client := mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		log.Fatalf("Failed to connect to MQTT broker: %v", token.Error())
	}

	// 订阅主题
	topic := "go/test/topic"
	if token := client.Subscribe(topic, 1, nil); token.Wait() && token.Error() != nil { // QoS 1
		log.Fatalf("Failed to subscribe to topic %s: %v", topic, token.Error())
	}
	fmt.Printf("Subscribed to topic: %s\n", topic)

	// 发布消息
	go func() {
		for i := 0; i < 5; i++ {
			text := fmt.Sprintf("Hello from Go MQTT client! Message %d", i)
			token := client.Publish(topic, 0, false, text) // QoS 0, 不保留消息
			token.Wait()
			fmt.Printf("Published message: %s\n", text)
			time.Sleep(2 * time.Second)
		}
	}()

	// 保持程序运行，直到收到中断信号
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	// 断开连接
	client.Disconnect(250) // 250ms 等待已发送消息
	fmt.Println("Disconnected from MQTT Broker.")
}

```

**运行上述 Go 语言示例的步骤：**

1.  **安装 Go 语言环境**：如果尚未安装。
2.  **初始化 Go 模块**：
    ```bash
    mkdir go_mqtt_example
    cd go_mqtt_example
    go mod init go_mqtt_example
    ```
3.  **安装 Paho MQTT 库**：
    ```bash
    go get github.com/eclipse/paho.mqtt.golang
    ```
4.  **将上述 Go 代码保存为 `main.go`。**
5.  **运行程序**：
    ```bash
    go run main.go
    ```
    你将看到客户端连接、订阅、发布和接收消息的输出。同时，你也可以使用其他 MQTT 客户端工具（如 MQTTX, Mosquitto_sub 等）订阅 `go/test/topic` 主题，来观察 Go 客户端发布的消息。

## 七、总结

MQTT 协议以其轻量级、发布/订阅模式和多等级 QoS 机制，成为了物联网设备间通信的理想选择。它有效地解决了资源受限、网络环境复杂等物联网场景下的通信挑战。随着 MQTT v5.0 的推出，协议的功能和灵活性进一步增强，使其在更广泛的物联网应用中发挥重要作用。理解 MQTT 的核心概念和工作原理，对于开发健壮可靠的物联网解决方案至关重要。
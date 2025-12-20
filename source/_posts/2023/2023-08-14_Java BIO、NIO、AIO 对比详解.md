---
title: Java BIO、NIO、AIO 对比详解
date: 2023-08-14 06:24:00
tags:
  - 2023
  - Java
  - 程序设计
  - 编码规范
  - 并发编程
  - NIO
categories:
  - Java
  - 程序设计
---
> **Java I/O (Input/Output)** 是应用程序与外部设备之间进行数据传输的桥梁。随着并发编程和高性能网络应用的需求日益增长，Java 提供了多种 I/O 模型，以适应不同的使用场景。其中，最核心的三种模型是 **BIO (Blocking I/O)**、**NIO (Non-blocking I/O)** 和 **AIO (Asynchronous I/O)**，它们在处理数据流和网络通信方面有着显著的区别。

{% note info %}
**核心思想**：理解 BIO、NIO 和 AIO 的根本差异在于它们对 **I/O 操作的阻塞特性**、**线程管理方式** 以及 **事件通知机制** 的处理。这直接影响着应用在并发、吞吐量和资源利用率方面的表现。
{% endnote %}
------

## 一、同步与异步，阻塞与非阻塞

在深入探讨 BIO、NIO、AIO 之前，我们首先明确两个基本概念：

*   **同步 (Synchronous) vs 异步 (Asynchronous)**：
    *   **同步**：发起一个 I/O 操作后，调用者需要等待操作完成才能继续执行后续任务。
    *   **异步**：发起一个 I/O 操作后，调用者可以立即返回并执行其他任务，当 I/O 操作完成后，系统会通过某种机制（如回调函数）通知调用者。

*   **阻塞 (Blocking) vs 非阻塞 (Non-blocking)**：
    *   **阻塞**：当一个 I/O 操作无法立即完成时，线程会被挂起，直到 I/O 操作完成并返回结果。在此期间，线程无法执行其他任务。
    *   **非阻塞**：当一个 I/O 操作无法立即完成时，线程不会被挂起，而是立即返回，并告知调用者 I/O 未就绪。调用者可以继续执行其他任务，需要反复轮询 I/O 是否就绪。

这四个概念的组合，形成了不同的 I/O 模型，其中异步 I/O 必然是非阻塞的。

## 二、BIO (Blocking I/O) - 阻塞同步 I/O

### 2.1 简介

*   **名称**：Blocking I/O (阻塞 I/O)，有时也称为传统 I/O。
*   **模型**：**阻塞同步**。
*   **特点**：
    *   **面向流 (Stream-oriented)**：数据以字节流或字符流的形式读写。
    *   **阻塞性**：当进行 `read()` 或 `write()` 操作时，如果数据没有准备好或不能立即写入，线程会一直阻塞，直到数据就绪或操作完成。
    *   **一对一连接**：通常采用“一个客户端连接对应一个处理线程”的模型。

### 2.2 工作原理

1.  当服务器接收到一个客户端连接请求时，会为该连接创建一个新的线程。
2.  该线程负责处理与这个客户端的所有 I/O 操作（读取数据、处理数据、写回数据）。
3.  在读取客户端数据时，如果客户端没有发送数据，线程会一直阻塞在 `read()` 方法上。
4.  在写回数据时，如果数据不能立即写入，线程也会阻塞在 `write()` 方法上。

{% mermaid %}
sequenceDiagram
    participant C as Client
    participant S as Server
    participant T1 as Server Thread 1
    participant T2 as Server Thread 2

    C->>S: 1. Connect
    S->>S: 2. Server accepts connection, creates new thread (T1)
    S-->>T1: 3. Passes socket to T1

    C->>T1: 4. Send Request (Data)
    T1->>T1: 5. Blocking read() operation (if no data, thread blocks)
    Note over T1: Process Data
    T1->>C: 6. Blocking write() operation (if buffer full, thread blocks)

    C->>S: 7. Connect (another client)
    S->>S: 8. Server accepts connection, creates new thread (T2)
    S-->>T2: 9. Passes socket to T2
    C->>T2: 10. Send Request (Data)
    T2->>T2: 11. Blocking read() ...
{% endmermaid %}

### 2.3 优缺点

*   **优点**：
    *   **编程模型简单**：代码直观，易于理解和实现。
    *   **适用于连接数少、并发量低** 的场景。
*   **缺点**：
    *   **性能瓶颈**：每个客户端连接都需要一个专用线程。当并发连接数很高时，会创建大量线程，导致上下文切换开销大，内存占用高，操作系统资源耗尽。
    *   **资源浪费**：大量线程处于阻塞状态，不进行实际计算，但依然占用系统资源。
    *   **不可扩展**：难以支持高并发。

### 2.4 BIO 示例 (Java Socket)

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;

public class BioServer {
    public static void main(String[] args) throws IOException {
        ServerSocket serverSocket = new ServerSocket(8080);
        System.out.println("BIO Server started on port 8080...");

        while (true) {
            Socket clientSocket = serverSocket.accept(); // 阻塞：等待客户端连接
            System.out.println("Client connected: " + clientSocket.getInetAddress());

            // 为每个客户端连接创建一个新线程
            new Thread(() -> {
                try (
                    BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                    PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true)
                ) {
                    String clientMessage;
                    while ((clientMessage = in.readLine()) != null) { // 阻塞：等待客户端发送数据
                        System.out.println("Received from client " + clientSocket.getInetAddress() + ": " + clientMessage);
                        String response = "Echo: " + clientMessage;
                        out.println(response); // 阻塞：写入响应数据
                        if ("bye".equalsIgnoreCase(clientMessage)) {
                            break;
                        }
                    }
                    System.out.println("Client " + clientSocket.getInetAddress() + " disconnected.");
                } catch (IOException e) {
                    System.err.println("Error handling client " + clientSocket.getInetAddress() + ": " + e.getMessage());
                } finally {
                    try {
                        clientSocket.close();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }).start();
        }
    }
}
```

## 三、NIO (Non-blocking I/O) - 非阻塞同步 I/O (I/O 多路复用)

### 3.1 简介

*   **名称**：Non-blocking I/O (非阻塞 I/O)，有时也称为 New I/O 或多路复用 I/O。
*   **模型**：**非阻塞同步**（本质上是 I/O 多路复用的一种实现）。
*   **特点**：
    *   **面向缓冲区 (Buffer-oriented)**：数据读写都通过缓冲区 (Buffer) 进行。
    *   **面向通道 (Channel-oriented)**：所有 I/O 都通过 Channel 进行。
    *   **选择器 (Selector)**：是 NIO 的核心，允许一个单线程同时监听多个 Channel 的 I/O 事件（如连接就绪、读就绪、写就绪）。
    *   **非阻塞性**：当 I/O 操作没有数据或不能立即完成时，会立即返回，不会阻塞当前线程。

### 3.2 工作原理

1.  一个（或少量）线程负责管理一个 `Selector`。
2.  `Selector` 注册并监听多个 `Channel` 上的 I/O 事件。
3.  当某个 `Channel` 上的 I/O 事件（如数据可读或可写）就绪时，`Selector` 会通知这个事件。
4.  工作线程从 `Selector` 获取就绪事件，然后非阻塞地对相应的 `Channel` 进行数据读写。由于读写是面向 `Buffer` 的，所以读写操作本身是同步的。

{% mermaid %}
graph TD
    subgraph Client
        C1[Client 1]
        C2[Client 2]
        C3[Client 3]
    end

    subgraph "Server (NIO)"
        SThread[Server Thread]
        Selector["Selector (I/O Multiplexer)"]
        C1Channel[Channel 1]
        C2Channel[Channel 2]
        C3Channel[Channel 3]
        Buffer[Buffer]
    end

    C1 --> C1Channel
    C2 --> C2Channel
    C3 --> C3Channel

    C1Channel -- Registers --> Selector
    C2Channel -- Registers --> Selector
    C3Channel -- Registers --> Selector

    SThread -- select() --> Selector
    Selector -- Ready Events --> SThread
    SThread -- read/write --> Buffer
    Buffer -- read/write --> C1Channel
    Buffer -- read/write --> C2Channel
    Buffer -- read/write --> C3Channel
{% endmermaid %}

### 3.3 优缺点

*   **优点**：
    *   **高并发**：一个线程可以处理成千上万个并发连接，减少了线程创建和切换的开销。
    *   **资源利用率高**：线程只在 I/O 事件就绪时才工作，大部分时间可以处理其他任务。
    *   **适用于连接数多、并发量高** 的场景，如 Web 服务器、聊天服务器。
*   **缺点**：
    *   **编程模型复杂**：需要显式管理 Buffer、Channel、Selector，状态管理复杂，调试困难。
    *   **同步阻塞**：虽然 I/O 操作的就绪是非阻塞的，但数据从 Buffer 读写到用户空间的过程是同步阻塞的。这意味着如果一次读取的数据量很大，仍然会阻塞一小段时间。
    *   **需要轮询**：调用 `select()` 方法本身是阻塞的，以等待 I/O 事件就绪，但它不是阻塞在单个 I/O 操作上，而是阻塞等待**多个** I/O 操作的就绪状态。

### 3.4 NIO 示例 (Java NIO Socket)

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.Iterator;
import java.util.Set;

public class NioServer {
    public static void main(String[] args) throws IOException {
        Selector selector = Selector.open();
        ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
        serverSocketChannel.bind(new InetSocketAddress(8080));
        serverSocketChannel.configureBlocking(false); // 设置为非阻塞
        serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT); // 注册接收连接事件

        System.out.println("NIO Server started on port 8080...");

        while (true) {
            selector.select(); // 阻塞：等待就绪的I/O事件
            Set<SelectionKey> selectedKeys = selector.selectedKeys();
            Iterator<SelectionKey> keyIterator = selectedKeys.iterator();

            while (keyIterator.hasNext()) {
                SelectionKey key = keyIterator.next();
                keyIterator.remove(); // 移除当前key，防止重复处理

                if (key.isAcceptable()) {
                    // 处理连接请求
                    ServerSocketChannel serverChannel = (ServerSocketChannel) key.channel();
                    SocketChannel clientChannel = serverChannel.accept(); // 非阻塞：接受连接
                    clientChannel.configureBlocking(false);
                    clientChannel.register(selector, SelectionKey.OP_READ); // 注册读取事件
                    System.out.println("Client connected: " + clientChannel.getRemoteAddress());
                } else if (key.isReadable()) {
                    // 处理读事件
                    SocketChannel clientChannel = (SocketChannel) key.channel();
                    ByteBuffer buffer = ByteBuffer.allocate(1024);
                    int bytesRead = clientChannel.read(buffer); // 非阻塞：读取数据到缓冲区

                    if (bytesRead > 0) {
                        buffer.flip(); // 切换模式，准备读取缓冲区数据
                        String msg = new String(buffer.array(), 0, bytesRead).trim();
                        System.out.println("Received from client " + clientChannel.getRemoteAddress() + ": " + msg);
                        // 准备写回数据
                        ByteBuffer responseBuffer = ByteBuffer.wrap(("Echo: " + msg).getBytes());
                        clientChannel.write(responseBuffer); // 非阻塞：写回数据
                        if ("bye".equalsIgnoreCase(msg)) {
                            clientChannel.close();
                            System.out.println("Client " + clientChannel.getRemoteAddress() + " disconnected.");
                        }
                    } else if (bytesRead == -1) { // 客户端关闭连接
                        clientChannel.close();
                        System.out.println("Client " + clientChannel.getRemoteAddress() + " disconnected.");
                    }
                }
            }
        }
    }
}
```

## 四、AIO (Asynchronous I/O) - 异步非阻塞 I/O

### 4.1 简介

*   **名称**：Asynchronous I/O (异步 I/O)，也称为 NIO.2。
*   **模型**：**异步非阻塞**。
*   **特点**：
    *   **I/O 操作由操作系统完成通知**：应用程序直接发起异步 I/O 操作，而无需等待或轮询。当操作系统完成 I/O 操作后，会通过回调机制（`CompletionHandler`）通知应用程序，并传递操作结果。
    *   **真正的非阻塞**：调用 I/O 操作会立即返回，应用程序可以继续执行其他任务，操作系统会在后台处理 I/O，完成后再通知应用。
    *   **JDK 1.7 引入**：主要体现在 `AsynchronousSocketChannel` 和 `AsynchronousServerSocketChannel` 等类。

### 4.2 工作原理

1.  应用程序向操作系统发起一个异步 I/O 操作（例如：`asynchronousSocketChannel.read(buffer, attachment, handler)`）。
2.  调用立即返回，应用程序线程可以继续执行其他任务。
3.  操作系统在后台完成 I/O 操作（例如：将数据从网络读取到 `buffer`）。
4.  当 I/O 操作完成后，操作系统通知 JVM，JVM 调用预先注册的 `CompletionHandler` 回调方法。
5.  在 `CompletionHandler` 中，应用程序可以处理完成的 I/O 结果或失败情况。

{% mermaid %}
sequenceDiagram
    participant App as Application Thread
    participant OS as Operating System
    participant Callback as CompletionHandler

    App->>OS: 1. Initiate Async Read (Buffer, Callback)
    App->>App: 2. Continue doing other tasks (Non-blocking)
    Note over App: No waiting or polling for I/O

    OS->>OS: 3. Perform I/O in kernel (e.g., read data into Buffer)
    Note over OS: I/O operation completion

    OS->>App: 4. Notify JVM of completion
    App->>Callback: 5. Invoke CompletionHandler.completed() / failed()
    Callback->>Callback: 6. Process I/O result / handle error
{% endmermaid %}


### 4.3 优缺点

*   **优点**：
    *   **极致的并发性能**：线程资源的消耗非常小，适用于连接数巨大 (千万级别) 的超高并发场景。
    *   **完全非阻塞**：应用程序线程无需等待任何 I/O 操作，CPU 利用率更高。
    *   **编程模型直观（回调模型）**：虽然不同于 BIO 的简单，但相对于 NIO 的 Buffer 和 Selector 状态管理，AIO 的回调模型在处理异步上更为直接。
*   **缺点**：
    *   **操作系统支持**：AIO 的实现依赖于底层操作系统对异步 I/O 的支持（如 Linux 的 `epoll` 配合 `io_uring`，Windows 的 `IOCP`），并非所有系统都能充分发挥其性能。
    *   **编程复杂性**：回调地狱 (Callback Hell) 可能会导致代码逻辑难以跟踪和维护，尤其是在多层异步操作嵌套时。
    *   **相对 NIO 使用较少**：大多数 Java 应用的 I/O 需求，NIO 已经能够很好地满足。AIO 的使用场景更偏向于对性能要求极高的特定领域。

### 4.4 AIO 示例 (Java Asynchronous Socket)

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.AsynchronousServerSocketChannel;
import java.nio.channels.AsynchronousSocketChannel;
import java.nio.channels.CompletionHandler;
import java.util.concurrent.Executors;

public class AioServer {
    public static void main(String[] args) throws IOException, InterruptedException {
        // 使用一个固定大小的线程池来处理CompletionHandler回调
        AsynchronousServerSocketChannel serverSocketChannel = AsynchronousServerSocketChannel.open().bind(new InetSocketAddress(8080));

        System.out.println("AIO Server started on port 8080...");

        // 异步接受连接
        serverSocketChannel.accept(null, new CompletionHandler<AsynchronousSocketChannel, Void>() {
            @Override
            public void completed(AsynchronousSocketChannel clientChannel, Void attachment) {
                // 接受下一个连接，实现循环接收
                serverSocketChannel.accept(null, this);
                System.out.println("Client connected: " + clientChannel.getRemoteAddress());

                ByteBuffer buffer = ByteBuffer.allocate(1024);
                // 异步读取数据
                clientChannel.read(buffer, buffer, new CompletionHandler<Integer, ByteBuffer>() {
                    @Override
                    public void completed(Integer bytesRead, ByteBuffer attachment) {
                        try {
                            if (bytesRead > 0) {
                                attachment.flip();
                                String msg = new String(attachment.array(), 0, bytesRead).trim();
                                System.out.println("Received from client " + clientChannel.getRemoteAddress() + ": " + msg);

                                // 异步写回数据
                                ByteBuffer responseBuffer = ByteBuffer.wrap(("Echo: " + msg).getBytes());
                                clientChannel.write(responseBuffer, responseBuffer, new CompletionHandler<Integer, ByteBuffer>() {
                                    @Override
                                    public void completed(Integer bytesWritten, ByteBuffer attachment2) {
                                        // 检查是否全部写完，如果没有则继续写
                                        if (attachment2.hasRemaining()) {
                                            clientChannel.write(attachment2, attachment2, this);
                                        } else {
                                            // 写完后，继续读取客户端的下一条消息
                                            attachment.clear(); // 清空缓冲区以进行下一次读取
                                            clientChannel.read(attachment, attachment, this.getParent()); // 注意：这里需要传递当前 CompletionHandler
                                        }
                                    }

                                    CompletionHandler<Integer, ByteBuffer> getParent() {
                                        return this;
                                    }

                                    @Override
                                    public void failed(Throwable exc, ByteBuffer attachment2) {
                                        System.err.println("Write failed for client " + clientChannel.getRemoteAddress() + ": " + exc.getMessage());
                                        try { clientChannel.close(); } catch (IOException e) { /* ignore */ }
                                    }
                                });

                            } else if (bytesRead == -1) { // 客户端关闭连接
                                System.out.println("Client " + clientChannel.getRemoteAddress() + " disconnected.");
                                clientChannel.close(); // 关闭通道
                            }
                        } catch (IOException e) {
                            System.err.println("Error processing client " + clientChannel.getRemoteAddress() + ": " + e.getMessage());
                        }
                    }

                    @Override
                    public void failed(Throwable exc, ByteBuffer attachment) {
                        System.err.println("Read failed for client " + clientChannel.getRemoteAddress() + ": " + exc.getMessage());
                        try { clientChannel.close(); } catch (IOException e) { /* ignore */ }
                    }
                });
            }

            @Override
            public void failed(Throwable exc, Void attachment) {
                System.err.println("Accept failed: " + exc.getMessage());
            }
        });

        // 保持主线程运行，以便异步操作能够完成
        Thread.currentThread().join(); // 或者使用 other blocking mechanisms like CountDownLatch
    }
}
```

## 五、BIO、NIO、AIO 对比总结

| 特性           | BIO (Blocking I/O)                             | NIO (Non-blocking I/O)                        | AIO (Asynchronous I/O)                             |
| :------------- | :--------------------------------------------- | :-------------------------------------------- | :------------------------------------------------- |
| **I/O 模型**   | 阻塞同步                                       | 非阻塞同步 (I/O 多路复用)                     | 异步非阻塞                                         |
| **面向**       | 流 (Stream)                                    | 缓冲区 (Buffer) & 通道 (Channel)            | 缓冲区 (Buffer) & 通道 (Channel) & 回调 (Handler) |
| **线程处理**   | 一个连接一个线程 (1:1)                         | 一个或少量线程处理多个连接 (1:N)              | 一个或少量线程发起操作，由 OS 或线程池处理回调 (1:N) |
| **阻塞特性**   | I/O 操作（读/写）全程阻塞                      | `select()` 阻塞等待 I/O 就绪，实际读写非阻塞 | I/O 操作立即返回，由 OS 后台处理完成并通知       |
| **性能**       | 低并发，性能差                                 | 高并发，性能好                                | 超高并发，性能优异 (依赖 OS)                       |
| **编程复杂度** | 简单                                           | 较复杂 (需管理 Buffer/Channel/Selector)       | 复杂 (回调地狱)，但逻辑更直接 (对于异步)           |
| **适用场景**   | 连接数少、稳定的传统应用                       | 连接数多、并发高的聊天服务器、Web 服务器、消息队列 | 连接数极多、吞吐量极高的实时通信、Netty 底层 I/O |
| **JDK 版本**   | JDK 1.0+                                       | JDK 1.4+ (包 `java.nio`)                      | JDK 1.7+ (包 `java.nio.channels.Asynchronous...`) |

### 5.1 对比图示

{% mermaid %}
graph TD
    BIO[BIO: Blocking I/O] --> ThreadPerConnection{"一个连接一个线程"}
    ThreadPerConnection --> BlockingReadWrite[阻塞读/写]
    BlockingReadWrite --> LowConcurrency[低并发性能]

    NIO["NIO: Non-blocking I/O (I/O Multiplexing)"] --> SingleThreadSelector{"一个线程处理多个连接"}
    SingleThreadSelector --> SelectorWait[Selector 等待 I/O 事件就绪]
    SelectorWait --> NonBlockingRW[非阻塞读/写到缓冲区]
    NonBlockingRW --> HighConcurrency[高并发性能]

    AIO[AIO: Asynchronous I/O] --> OSAsync{"OS 后台处理 I/O"}
    OSAsync --> CallbackNotify[CompletionHandler 回调通知]
    CallbackNotify --> MaxConcurrency[极致并发性能]
{% endmermaid %}


### 5.2 如何选择？

*   **BIO**：
    *   **适用于并发数非常低、连接数稳定且不易变动的场景**。例如，一些内部管理系统，只需要处理少量请求的工具类应用。
    *   **优点是编程简单直观**，但性能瓶颈明显。
*   **NIO**：
    *   **适用于连接数高、并发量大的场景**，如 Web 服务器 (Tomcat 从 8.x 开始默认使用 NIO)、即时通讯应用 (如 Netty 框架就基于 NIO)。
    *   **是目前在 Java 后端开发中最常用的高性能 I/O 模型**。它通过 I/O 多路复用，有效地解决了 BIO 的线程膨胀问题，提高了系统吞吐量。
*   **AIO**：
    *   **适用于极端高并发、连接数极多，对响应时间有非常高要求的场景**。例如，需要处理千万级别并发连接的实时通信系统。
    *   **理论上效率最高**，但编程复杂性最大，且性能发挥受限于底层操作系统的支持。在实际企业级应用中，AIO 的直接使用相对较少，更常见于底层框架（如特定的异步 I/O 库）的实现。

## 六、总结

Java 的三种 I/O 模型各自适应不同的应用需求。从传统的 BIO 到革新性的 NIO，再到面向未来的 AIO，反映了 Java 在处理并发和高性能 I/O 方面的演进。在大多数现代 Web 服务和微服务架构中，**NIO 是主流和推荐的选择**，因为它在编程复杂度和性能之间达到了一个很好的平衡。而 BIO 则因其简单性在低并发场景仍有应用。AIO 虽然强大，但其复杂性和对底层 OS 的依赖使其应用场景相对小众。作为 Java 开发者，理解这些 I/O 模型的工作原理和适用场景，是构建高效、可伸缩应用程序的关键。
---
title: Linux I/O 多路复用 epoll 详解
date: 2024-06-30 06:24:00
tags:
  - 2024
  - Linux
  - 网络编程
categories:
  - Linux
---
> **epoll** 是 Linux 内核中一种高效的 I/O 多路复用 (I/O Multiplexing) 技术，自 Linux 2.5.44 版本引入。它旨在解决传统 `select()` 和 `poll()` 系统调用在大规模并发连接场景下的性能瓶颈，尤其适用于高并发的网络服务器。

{% note info %}
**核心思想**：`epoll` 避免了每次调用都将所有文件描述符从用户空间拷贝到内核空间，并且在文件描述符就绪时通过回调机制通知应用程序，而非通过轮询，从而显著提升了 I/O 效率。
{% endnote %}
------

## 一、为什么需要 epoll？

在网络编程中，服务器需要同时处理多个客户端连接。传统的 I/O 模型在处理并发时面临挑战：

1.  **阻塞 I/O (Blocking I/O)**：
    *   一个线程或进程只能处理一个连接。如果有大量连接，需要创建大量线程/进程，这会消耗大量系统资源（内存、CPU 上下文切换开销），且可伸缩性差。

2.  **非阻塞 I/O + 忙轮询 (Non-blocking I/O + Polling)**：
    *   应用程序循环遍历所有文件描述符，反复询问它们是否就绪。
    *   `select()` 和 `poll()` 是此模型的两种实现。

    *   **select() 的局限性**：
        *   **文件描述符数量限制**：默认最大支持 1024 个文件描述符（可通过修改宏定义调整，但仍有上限）。
        *   **效率低下**：每次调用 `select()` 都需要将所有待监听的文件描述符集合从用户空间拷贝到内核空间。
        *   **线性扫描**：内核需要遍历所有传入的文件描述符来检查哪些已就绪，时间复杂度为 O(N)。
        *   **重复拷贝**：每次调用 `select()` 返回后，都需要重新设置文件描述符集合，因为其内容会被修改。

    *   **poll() 的改进**：
        *   移除了文件描述符数量的硬性限制。
        *   但仍存在文件描述符集合拷贝和线性扫描的性能问题。

针对 `select()` 和 `poll()` 的这些问题，`epoll` 提供了根本性的解决方案，在大规模并发场景下展现出卓越的性能优势。

## 二、epoll 的工作原理

`epoll` 的工作原理可以概括为：**在内核中维护一个文件描述符集合，并在文件描述符就绪时主动通知用户空间。**

1.  **创建一个 epoll 实例**：通过 `epoll_create()` 或 `epoll_create1()` 系统调用在内核中创建一个 `epoll` 实例，它会返回一个 `epoll` 文件描述符（通常称为 `epfd`）。这个 `epfd` 代表了内核中的一个 `epoll` 上下文。

2.  **添加/修改/删除监听事件**：通过 `epoll_ctl()` 系统调用向 `epfd` 管理的事件表中添加、修改或删除要监听的文件描述符及其关注的事件（例如读事件 `EPOLLIN`、写事件 `EPOLLOUT` 等）。这些文件描述符不需要每次都拷贝到内核，而是永久性地注册到 `epoll` 实例中。

3.  **等待就绪事件**：通过 `epoll_wait()` 系统调用等待事件的发生。当被监听的文件描述符上的事件发生时（例如数据可读、缓冲区可写），内核会将这些就绪的事件通知给 `epoll_wait()`。`epoll_wait()` 只返回已经就绪的文件描述符，而非所有被监听的文件描述符，避免了大量的无用遍历。

{% mermaid %}
graph TD
    A[应用程序] --> B(epoll_create/epoll_create1);
    B --> C{"内核 epoll 实例 (epfd)"};
    A --> D(epoll_ctl: 添加/修改/删除 fd 和事件);
    D --> C;
    C -- 就绪事件发生 --> E[内核就绪列表];
    A --> F(epoll_wait: 等待并获取就绪事件);
    E -- 返回就绪 fd 列表 --> F;
    F --> A;
{% endmermaid %}

## 三、epoll 的主要接口

`epoll` 提供了三个核心的系统调用：

### 3.1 `epoll_create()` / `epoll_create1()`

*   **功能**：创建一个 `epoll` 实例。这将创建一个在内核中维护的事件表，并返回一个指向该表的 `epoll` 文件描述符。
*   **`epoll_create(size_hint)`**：`size_hint` 参数是一个建议值，操作系统用于初始分配内部数据结构的大小，现在已不强制要求准确性，但仍需大于 0。
*   **`epoll_create1(flags)`**：`flags` 参数可用于指定额外行为，例如 `EPOLL_CLOEXEC` 确保 `epfd` 在 `execve` 调用后自动关闭。

### 3.2 `epoll_ctl()`

*   **功能**：用于向 `epoll` 实例中注册、修改或删除感兴趣的事件和文件描述符。
*   **参数**：
    *   `epfd`：`epoll_create()` 返回的 `epoll` 文件描述符。
    *   `op`：操作类型，可以是 `EPOLL_CTL_ADD` (添加)、`EPOLL_CTL_MOD` (修改) 或 `EPOLL_CTL_DEL` (删除)。
    *   `fd`：要操作的文件描述符。
    *   `event`：指向 `struct epoll_event` 结构的指针，用于指定 `fd` 监听的事件类型以及用户自定义数据。

*   **`struct epoll_event` 结构体**：

    ```c
    typedef union epoll_data {
        void        *ptr;
        int          fd;
        uint32_t     u32;
        uint64_t     u64;
    } epoll_data_t;

    struct epoll_event {
        uint32_t     events;    /* Epoll events (e.g., EPOLLIN, EPOLLOUT) */
        epoll_data_t data;      /* User data variable */
    };
    ```

    *   `events`：指定要监听的事件类型，例如 `EPOLLIN` (可读)、`EPOLLOUT` (可写)、`EPOLLERR` (错误)、`EPOLLHUP` (挂断) 等。
    *   `data`：这是一个联合体，允许关联一个用户自定义的数据。通常会存储 `fd` 本身或者指向一个包含 `fd` 及其他会话信息的结构体指针。

### 3.3 `epoll_wait()`

*   **功能**：等待 `epfd` 上注册的事件发生。它会阻塞直到事件发生或者超时。
*   **参数**：
    *   `epfd`：`epoll_create()` 返回的 `epoll` 文件描述符。
    *   `events`：指向 `struct epoll_event` 数组的指针。当事件发生时，就绪的事件会填充到这个数组中。
    *   `maxevents`：`events` 数组的最大容量，指定最多返回多少个就绪事件。
    *   `timeout`：超时时间（毫秒），-1 表示永远阻塞，0 表示立即返回。
*   **返回值**：返回就绪事件的数量。如果返回 0，表示超时；如果返回 -1，表示出错。

## 四、epoll 的两种工作模式

`epoll` 支持两种工作模式：**水平触发 (Level-Triggered, LT)** 和 **边缘触发 (Edge-Triggered, ET)**。

### 4.1 水平触发 (LT) 模式

*   **特点**：当文件描述符上就绪的事件没有被处理完时，`epoll_wait()` 会在下次调用时依然通知你。
*   **行为**：只要文件描述符上还有数据可读（或者缓冲区可写），`epoll_wait()` 就会一直报告该事件。
*   **优点**：编程简单，不易丢失事件。即使应用程序只读取了一部分数据，下次 `epoll_wait()` 仍会报告可读事件，直到所有数据都被读取完毕。
*   **缺点**：在高并发场景下，如果一个文件描述符一直有数据可读，可能会被多次报告，造成不必要的唤醒。

### 4.2 边缘触发 (ET) 模式

*   **特点**：只有当文件描述符的**状态发生变化**时，`epoll_wait()` 才会通知你一次。
*   **行为**：只有在数据从无到有、或从有到更多（数据边界发生变化）时，`epoll_wait()` 才会报告可读事件。一旦报告后，即使文件描述符上仍有未读数据，也不会再次报告，除非有新的数据到达。
*   **优点**：在高并发场景下，可以减少不必要的 `epoll_wait()` 唤醒次数，提高效率。
*   **缺点**：编程较为复杂，**要求应用程序必须一次性将所有已经就绪的数据全部处理完毕** (例如：读尽所有数据，或写完所有缓冲区)。如果未能一次性处理完，剩余的事件将不会再次触发，导致事件丢失。所以，ET 模式下，文件描述符通常需要设置为**非阻塞模式**。

**选择建议**：
*   **默认使用 LT 模式**，因为它更健壮，编程难度较低。
*   **只有在对性能有极致要求，并且能确保正确处理所有就绪事件的情况下，才考虑使用 ET 模式。** 在 ET 模式下，务必将文件描述符设置为非阻塞，并循环读取/写入直到 `read()`/`write()` 返回 `-1` 且 `errno` 为 `EAGAIN` 或 `EWOULDBLOCK`。

## 五、epoll 的优缺点

### 5.1 优点：

1.  **管理大批量文件描述符高效**：
    *   **没有数量限制**：理论上只受限于系统内存大小，可以监听数百万的文件描述符。
    *   **一次注册，永久有效**：文件描述符在 `epoll_ctl()` 注册后，就存在于内核的 `epoll` 实例中，无需每次 `epoll_wait()` 都重新拷贝。
    *   **只返回就绪事件**：`epoll_wait()` 只返回真正就绪的文件描述符，避免了遍历所有描述符的开销，时间复杂度为 O(K)，其中 K 是就绪事件的数量，远小于 O(N) (N 是总监听数量)。
    *   **通过回调机制通知**：内核利用红黑树 (RBTREE) 或哈希表管理文件描述符，并通过链表维护就绪事件列表。当事件发生时，通过回调函数将文件描述符添加到就绪列表中，避免了轮询。

2.  **内存占用低**：在内核中 `epoll` 使用红黑树来管理监听的文件描述符，占用内存相对固定且高效。

### 5.2 缺点：

1.  **仅 Linux 支持**：`epoll` 是 Linux 特有的系统调用，不具备跨平台性。在其他类 Unix 系统上，可能需要使用 `kqueue` (FreeBSD, macOS) 或 `/dev/poll` (Solaris)。
2.  **相对复杂**：相较于 `select`/`poll`，`epoll` 的 API 接口更多，使用起来相对复杂一些，尤其是在处理边缘触发模式时。

## 六、使用 epoll 的示例

以下是一个简单的 Python 示例，演示如何使用 `epoll` 来监听一个服务器套接字的连接事件和客户端套接字的读写事件。

### 6.1 Python 示例

```python
import socket
import select

HOST = '127.0.0.1'
PORT = 12345

def run_epoll_server():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setblocking(False) # 通常将监听 socket 设置为非阻塞
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((HOST, PORT))
    server_socket.listen(5)

    print(f"Listening on {HOST}:{PORT}")

    epoll = select.epoll()
    epoll.register(server_socket.fileno(), select.EPOLLIN | select.EPOLLET) # 监听服务器 socket 的 EPOLLIN 事件，使用ET模式

    connections = {} # 存储客户端 socket 对象
    requests = {}    # 存储客户端发送的数据

    try:
        while True:
            events = epoll.poll(1) # 1秒超时
            for fileno, event in events:
                if fileno == server_socket.fileno():
                    # 新连接到来
                    conn, addr = server_socket.accept()
                    conn.setblocking(False)
                    epoll.register(conn.fileno(), select.EPOLLIN | select.EPOLLET) # 注册客户端 socket 的 EPOLLIN 事件，使用ET模式
                    connections[conn.fileno()] = conn
                    requests[conn.fileno()] = b''
                    print(f"Accepted connection from {addr}, fileno: {conn.fileno()}")
                elif event & select.EPOLLIN:
                    # 数据可读
                    data = b''
                    while True:
                        try:
                            chunk = connections[fileno].recv(1024)
                            if chunk:
                                data += chunk
                            else:
                                # 客户端关闭连接
                                epoll.unregister(fileno)
                                connections[fileno].close()
                                del connections[fileno]
                                del requests[fileno]
                                print(f"Client {fileno} disconnected.")
                                break
                        except socket.error as e:
                            if e.errno == select.EAGAIN or e.errno == select.EWOULDBLOCK:
                                # 数据已读完或缓冲区为空
                                break
                            else:
                                print(f"Error reading from {fileno}: {e}")
                                epoll.unregister(fileno)
                                connections[fileno].close()
                                del connections[fileno]
                                del requests[fileno]
                                break
                    if data:
                        requests[fileno] += data
                        print(f"Received from {fileno}: {data.decode().strip()}")
                        # 收到数据后，我们关注写事件，准备发送响应
                        epoll.modify(fileno, select.EPOLLOUT | select.EPOLLET)
                elif event & select.EPOLLOUT:
                    # 数据可写
                    response = b"HTTP/1.1 200 OK\r\nContent-Length: 12\r\n\r\nHello World!"
                    while response:
                        try:
                            # 尝试发送所有响应数据
                            sent = connections[fileno].send(response)
                            response = response[sent:]
                        except socket.error as e:
                            if e.errno == select.EAGAIN or e.errno == select.EWOULDBLOCK:
                                # 缓冲区已满，等待下次可写
                                break
                            else:
                                print(f"Error writing to {fileno}: {e}")
                                epoll.unregister(fileno)
                                connections[fileno].close()
                                del connections[fileno]
                                del requests[fileno]
                                break
                    if not response: # 如果所有数据都发送完毕
                        print(f"Sent response to {fileno}")
                        # 响应发送完毕，重新关注读事件
                        epoll.modify(fileno, select.EPOLLIN | select.EPOLLET)
                elif event & select.EPOLLHUP or event & select.EPOLLERR:
                    # 客户端挂断或发生错误
                    print(f"Client {fileno} closed unexpectedly or error occurred.")
                    epoll.unregister(fileno)
                    connections[fileno].close()
                    del connections[fileno]
                    if fileno in requests:
                        del requests[fileno]

    except KeyboardInterrupt:
        print("\nShutting down server.")
    finally:
        epoll.unregister(server_socket.fileno())
        epoll.close()
        server_socket.close()
        for conn in connections.values():
            conn.close()

if __name__ == '__main__':
    run_epoll_server()
```
**注意**：上述 Python 示例使用了 `select.epoll` 模块来包装底层的 `epoll` 系统调用。在实际的高性能服务器中，可能需要使用更底层的、直接与 C 绑定或 Go 等语言实现。

## 七、总结

`epoll` 作为 Linux 下高性能网络服务器的基石，以其高效的文件描述符管理、事件驱动通知机制和无文件描述符数量限制等优势，完美地解决了传统 I/O 多路复用模型在大规模并发场景下的性能瓶颈。理解其工作原理和两种工作模式（LT/ET）对于开发高并发、高吞吐量的网络应用至关重要。尽管 `epoll` 是 Linux 特有的技术，但其核心思想在其他操作系统中也有类似的高性能 I/O 多路复用实现，例如 FreeBSD/macOS 的 `kqueue`。
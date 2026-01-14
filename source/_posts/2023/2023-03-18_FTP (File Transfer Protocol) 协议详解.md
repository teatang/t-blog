---
title: FTP (File Transfer Protocol) 协议详解
date: 2023-03-18 06:24:00
tags:
  - 2023
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---
> **FTP (File Transfer Protocol)** 是一个用于在网络上进行文件传输的标准网络协议，是 TCP/IP 协议族中的一个应用层协议。它允许客户端和服务器之间传输文件，支持上传、下载、删除、重命名文件，以及创建和删除目录等操作。FTP 是最早期的互联网协议之一，设计初衷是为了在不同的操作系统和文件系统之间提供统一的文件传输服务。

{% note info %}
核心思想：**基于客户端-服务器模式，利用独立的控制连接和数据连接，高效可靠地传输文件。**
{% endnote %}
------

## 一、为什么需要 FTP？

在二十世纪七十年代，互联网的前身 ARPANET 还在发展初期，用户需要一种可靠的方式在不同的计算机系统之间共享文件。FTP 因此被设计出来，解决了以下痛点：

*   **跨平台文件传输**：允许不同操作系统（如 Unix、Windows）之间传输文件，统一了文件传输的格式和控制命令。
*   **可靠性**：基于 TCP 协议，保证文件传输的可靠性（数据不丢失、不重复、按序到达）。
*   **大文件传输**：能够处理大文件的传输，并通过数据流控制确保传输效率。
*   **用户权限管理**：支持用户认证，可以根据用户身份分配不同的文件访问权限。

尽管 FTP 历史悠久、功能强大，但其在设计时没有考虑安全性，因此现代应用中，通常会使用更安全的替代方案。

## 二、FTP 的基本工作原理

FTP 最显著的特点是它使用**两个独立的 TCP 连接**来传输文件：一个用于**控制连接**，另一个用于**数据连接**。

### 2.1 控制连接 (Control Connection)

*   **用途**：用于传输 FTP 客户端和服务器之间的**命令和响应**，例如用户认证信息（用户名、密码）、文件操作命令（上传、下载、列目录、删除等）和服务器的响应消息。
*   **端口**：客户端连接服务器的 **TCP 21 端口**。
*   **生命周期**：在整个 FTP 会话期间保持开启状态，直到客户端断开连接。
*   **传输内容**：所有命令和响应都以 **明文** 形式传输，不加密。

### 2.2 数据连接 (Data Connection)

*   **用途**：用于实际的**文件数据传输**，包括文件内容、目录列表等。
*   **端口**：动态协商，有两种模式：**主动模式 (Active Mode)** 和 **被动模式 (Passive Mode)**。
*   **生命周期**：每传输一个文件或目录列表时，都会建立一个新的数据连接，传输完成后关闭。

### 2.3 工作流程概述

1.  客户端与 FTP 服务器的 21 端口建立**控制连接**。
2.  客户端发送用户名和密码进行认证（明文传输）。
3.  认证成功后，客户端发送文件操作命令（如 `LIST`、`RETR`、`STOR`）。
4.  根据客户端选择的工作模式（主动/被动），建立**数据连接**。
5.  文件数据通过数据连接传输。
6.  数据传输完成后，数据连接关闭。
7.  客户端可以继续通过控制连接发送其他命令，或者发送 `QUIT` 命令关闭控制连接，结束会话。

## 三、FTP 传输模式 (数据连接的建立)

数据连接的建立方式决定了 FTP 在防火墙和 NAT 环境下的兼容性。

### 3.1 主动模式 (Active Mode)

在主动模式下，**客户端** 通知服务器它将在一个随机端口上监听，**服务器** 主动连接客户端的数据端口。

1.  客户端与服务器的 21 端口建立控制连接。
2.  客户端发送 `PORT X,X,X,X,A,B` 命令给服务器，告诉服务器它的 IP 地址和它正在监听的端口 (A * 256 + B)。
3.  服务器收到 `PORT` 命令后，主动从它的 **20 端口** (FTP-DATA) 连接到客户端指定的 IP 地址和端口。
4.  数据连接建立，开始传输数据。

**主动模式的问题**：
客户端的随机端口通常位于防火墙或 NAT 后面，服务器无法主动连接到客户端的数据端口，导致数据连接失败。

{% mermaid %}
sequenceDiagram
    participant Client as FTP 客户端
    participant ClientFW as 客户端防火墙/NAT
    participant Server as FTP 服务器
    participant ServerFW as 服务器防火墙

    Client->>Server: 1. `CONTROL_CONNECT` (Client:`N1` -> Server:`21`)
    Client->>Server: 2. 用户名/密码 (明文)
    Client->>Server: 3. `PORT client_ip,client_data_port`
    Server->>ServerFW: 4. 服务器尝试从端口 `20` 连接客户端 `client_data_port`
    ServerFW->>ClientFW: 5. 客户端防火墙/NAT 阻止服务器连接
    ClientFW--xServerFW: 连接失败
    ServerFW--xServer: 连接失败 (通常是超时)
    Server-->>Client: 6. 错误: 无法建立数据连接
{% endmermaid %}

### 3.2 被动模式 (Passive Mode)

为了解决主动模式在防火墙环境下遇到的问题，引入了被动模式。在被动模式下，**客户端** 告诉服务器进入被动模式，**服务器** 开启一个随机端口并通知客户端，**客户端** 再主动连接服务器的数据端口。这也是当前主流的 FTP 传输模式。

1.  客户端与服务器的 21 端口建立控制连接。
2.  客户端发送 `PASV` 命令给服务器，请求进入被动模式。
3.  服务器收到 `PASV` 命令后，开启一个随机端口进行监听，并回复 `227 Entering Passive Mode (X,X,X,X,A,B)` 消息，告诉客户端它的 IP 地址和监听的端口 (A * 256 + B)。
4.  客户端收到服务器的响应后，主动从一个随机端口连接到服务器指定的 IP 地址和端口。
5.  数据连接建立，开始传输数据。

**被动模式的优点**：
客户端主动连接服务器的随机端口，避免了服务器主动连接客户端被防火墙阻止的问题。需要注意的是，服务器的防火墙仍需要允许外部连接到服务器的随机数据端口范围。

{% mermaid %}
sequenceDiagram
    participant Client as FTP 客户端
    participant ClientFW as 客户端防火墙/NAT
    participant Server as FTP 服务器
    participant ServerFW as 服务器防火墙

    Client->>Server: 1. `CONTROL_CONNECT` (Client:`N1` -> Server:`21`)
    Client->>Server: 2. 用户名/密码 (明文)
    Client->>Server: 3. `PASV`
    Server->>Server: 4. 服务器打开一个随机端口 `P2` 进行监听
    Server-->>Client: 5. `227 Entering Passive Mode (server_ip, server_data_port_P2)`
    Client->>ClientFW: 6. 客户端尝试从端口 `N2` 连接服务器 `P2`
    ClientFW->>ServerFW: 7. 客户端请求连接
    ServerFW->>Server: 8. 服务器接受连接
    ServerFW-->>ClientFW: 连接成功
    ClientFW-->>Client: 连接成功
    Client<<->>Server: 9. `DATA_TRANSFER` (Client:`N2` <-> Server:`P2`)
    Client <<->> Server: 10. `CONTROL_DISCONNECT`
{% endmermaid %}

## 四、FTP 认证与用户类型

FTP 支持两种主要的用户认证方式：

1.  **匿名 FTP (Anonymous FTP)**：
    *   允许用户无需提供真实账户信息即可访问服务器上的公共文件。
    *   用户通常使用 `anonymous` 作为用户名，并输入其电子邮件地址作为密码（尽管在实践中通常不验证）。
    *   主要用于公开分发文件，如软件下载、文档共享等。

2.  **用户名/密码认证 (Authenticated FTP)**：
    *   用户必须提供有效的用户名和密码才能登录。
    *   这些凭证通常与服务器操作系统上的用户账户关联，或者由 FTP 服务器软件自行维护。
    *   提供更精细的权限控制，不同用户可以有不同的访问权限（读、写、删除等）。

## 五、FTP 传输模式 (文件内容)

除了 TCP 连接模式，FTP 还有数据内容的传输模式：

*   **ASCII 模式 (文本模式)**：
    *   适用于传输文本文件。FTP 客户端和服务器会在传输过程中自动进行行结束符的转换（例如，在 Windows 和 Unix 系统之间转换 `CRLF` 和 `LF`）。
    *   可能会对二进制文件造成破坏。
*   **Binary 模式 (二进制模式)**：
    *   适用于传输所有非文本文件，如图片、视频、压缩包、可执行文件等。
    *   数据按字节流原样传输，不进行任何转换。
    *   这是传输二进制文件时必须使用的模式。

## 六、FTP 命令示例

以下是一些常见的 FTP 命令：

| 命令   | 描述                                                                |
| :----- | :------------------------------------------------------------------ |
| `USER` | 提供用户名。                                                        |
| `PASS` | 提供密码。                                                          |
| `LIST` | 列出远程服务器上的文件和目录。 (`ls` 命令的变种，如 `LIST -a` )    |
| `CWD`  | 改变远程服务器上的工作目录。 (`cd`)                                |
| `PWD`  | 打印远程服务器上的当前工作目录。 (`pwd`)                           |
| `RETR` | 下载文件（从服务器获取文件到客户端）。                              |
| `STOR` | 上传文件（从客户端存储文件到服务器）。                              |
| `DELE` | 删除远程服务器上的文件。                                            |
| `RNFR` | 重命名文件（提供旧文件名）。                                        |
| `RNTO` | 重命名文件（提供新文件名）。                                        |
| `MKD`  | 在远程服务器上创建目录。 (`mkdir`)                                 |
| `RMD`  | 删除远程服务器上的目录。 (`rmdir`)                                 |
| `TYPE` | 设置文件传输模式 (ASCII 或 BINARY)。                                |
| `PASV` | 进入被动模式。                                                      |
| `PORT` | 客户端通知服务器其数据连接端口 (主动模式)。                         |
| `QUIT` | 退出 FTP 会话。                                                     |

## 七、FTP 的优缺点

### 7.1 优点：

*   **广泛支持**：几乎所有的操作系统、服务器和网络设备都支持 FTP。
*   **功能全面**：支持文件的上传、下载、删除、重命名、目录管理等。
*   **高效性（对大文件）**：对于大文件传输，FTP 的两连接模式理论上可以实现较高的传输效率，因为它不涉及 HTTP 等协议的额外开销。
*   **恢复传输**：部分 FTP 客户端和服务器支持断点续传。

### 7.2 缺点：

*   **安全性差 (核心问题)**：
    *   **明文传输**：用户名、密码和所有命令在控制连接中以明文传输，极易被嗅探。
    *   **数据不加密**：即使数据通过数据连接传输，默认情况下也没有加密。
    *   **缺乏完整性校验**：不提供内置的数据完整性校验机制，攻击者可能篡改传输中的文件。
*   **防火墙和 NAT 兼容性问题**：尤其是在主动模式下，穿越防火墙和 NAT 设备非常困难。被动模式缓解了这个问题，但服务器仍需要开放较大的端口范围。
*   **管理复杂**：为每个文件传输建立和关闭数据连接，在大规模、小文件传输场景下效率不高。
*   **自动化脚本挑战**：FTP 客户端通常是交互式的，通过脚本自动化控制相对复杂（尽管有第三方库和命令行工具可以实现）。

## 八、安全的替代方案

鉴于 FTP 的安全缺陷，在现代网络环境中，通常推荐使用以下更安全的替代协议：

1.  **SFTP (SSH File Transfer Protocol)**：
    *   基于 **SSH (Secure Shell)** 协议，所有通信（包括认证凭证、命令和文件数据）都通过加密的 SSH 信道传输。
    *   使用单一连接，简化了防火墙配置。
    *   提供类似 FTP 的功能（上传、下载、删除、列目录等）。
    *   被认为是 FTP 最安全的替代方案之一。

2.  **FTPS (FTP Secure)**：
    *   通过在 FTP 的控制连接和/或数据连接之上添加 **SSL/TLS (Secure Sockets Layer/Transport Layer Security)** 加密层来保护通信。
    *   分为显式 FTPS (Explicit FTPS) 和隐式 FTPS (Implicit FTPS)。
    *   解决了 FTP 的安全性问题，但相比 SFTP，在防火墙和 NAT 后可能仍然有些复杂。

3.  **HTTPS (HTTP Secure)** 文件传输：
    *   通过 HTTP 协议和 SSL/TLS 加密层进行文件传输。
    *   常见的 Web 浏览器都支持 HTTPS 下载，许多云存储服务和文件共享系统也都基于 HTTPS。
    *   适用于简单的文件下载和上传，但对于批量或专业的管理功能不如 SFTP 和 FTPS 方便。

**Python 代码示例：使用 `ftplib` 进行基本 FTP 操作**

```python
import ftplib
import os

def ftp_operations(host, username, password, remote_dir, local_file_to_upload, remote_file_to_download):
    """
    执行基本的FTP操作：连接、上传文件、列目录、下载文件、断开连接。
    Args:
        host (str): FTP服务器地址。
        username (str): 登录用户名。
        password (str): 登录密码。
        remote_dir (str): 服务器上的目标目录。
        local_file_to_upload (str): 本地待上传文件路径。
        remote_file_to_download (str): 服务器上待下载文件路径。
    """
    ftp = ftplib.FTP()
    try:
        print(f"Connecting to {host}...")
        # 连接FTP服务器，默认端口21
        ftp.connect(host)
        print("Connected.")

        # 登录FTP服务器 (明文传输用户名和密码)
        print(f"Logging in as {username}...")
        ftp.login(username, password)
        print("Logged in successfully.")

        # 切换到指定目录
        print(f"Changing directory to {remote_dir}...")
        ftp.cwd(remote_dir)
        print(f"Current remote directory: {ftp.pwd()}")

        # === 上传文件 ===
        if os.path.exists(local_file_to_upload):
            with open(local_file_to_upload, 'rb') as f:
                print(f"Uploading {local_file_to_upload} to server...")
                # 'STOR' 命令用于上传文件
                ftp.storbinary(f'STOR {os.path.basename(local_file_to_upload)}', f)
                print(f"File {local_file_to_upload} uploaded.")
        else:
            print(f"Local file {local_file_to_upload} not found for upload.")

        # === 列出远程目录内容 ===
        print("\nListing remote directory contents:")
        files = ftp.nlst() # nlst() 获取文件和目录名列表
        for f in files:
            print(f"  - {f}")

        # === 下载文件 ===
        download_target_path = f"downloaded_{os.path.basename(remote_file_to_download)}"
        with open(download_target_path, 'wb') as f:
            print(f"\nDownloading {remote_file_to_download} from server...")
            # 'RETR' 命令用于下载文件
            ftp.retrbinary(f'RETR {remote_file_to_download}', f.write)
            print(f"File downloaded to {download_target_path}")

    except ftplib.all_errors as e:
        print(f"FTP Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if ftp:
            ftp.quit() # 关闭FTP连接
            print("FTP connection closed.")

if __name__ == "__main__":
    # ⚠️ 注意: 请不要在生产环境中使用明文密码！FTP 极不安全！
    FTP_HOST = "ftp.example.com"  # 替换为你的FTP服务器地址
    FTP_USER = "your_username"    # 替换为你的FTP用户名
    FTP_PASS = "your_password"    # 替换为你的FTP密码

    REMOTE_DIRECTORY = "/"        # 服务器上的目标目录
    LOCAL_FILE = "test_upload.txt"
    REMOTE_FILE = "remote_test_file.txt" # 假设服务器上存在此文件

    # 创建一个用于上传的测试文件
    with open(LOCAL_FILE, 'w') as f:
        f.write("This is a test file for FTP upload.\n")
        f.write("It contains multiple lines of text.\n")
    print(f"Created local test file: {LOCAL_FILE}")

    # 运行FTP操作
    ftp_operations(FTP_HOST, FTP_USER, FTP_PASS, REMOTE_DIRECTORY, LOCAL_FILE, REMOTE_FILE)

    # 清理本地创建的测试文件
    if os.path.exists(LOCAL_FILE):
        os.remove(LOCAL_FILE)
        print(f"Removed local test file: {LOCAL_FILE}")
    if os.path.exists(f"downloaded_{os.path.basename(REMOTE_FILE)}"):
        os.remove(f"downloaded_{os.path.basename(REMOTE_FILE)}")
        print(f"Removed downloaded test file: downloaded_{os.path.basename(REMOTE_FILE)}")
```

## 九、总结

FTP 协议作为文件传输的先驱，在互联网早期发挥了巨大的作用。它通过分离控制连接和数据连接的设计，实现了灵活的文件传输。然而，其最严重的缺陷是**缺乏安全性**，所有敏感信息（包括认证凭证）都以明文形式传输，极易被攻击者窃取和篡改。在当今对网络安全要求极高的环境中，已经不推荐在公共网络上使用纯 FTP 进行文件传输。相反，**SFTP 或 FTPS** 提供了更安全的替代方案，它们在保留 FTP 功能的同时，利用加密技术保护了数据的机密性和完整性。在选择文件传输协议时，安全性应始终是首要考虑的因素。
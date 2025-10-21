---
title: FRP (Fast Reverse Proxy) 详解
date: 2023-06-26 06:24:00
tags:
  - 2023
  - FRP
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---

> **FRP (Fast Reverse Proxy)** 是一个高性能的**内网穿透**和**反向代理**工具，它允许您将位于内网（局域网）中的服务（如 Web 服务器、SSH、数据库等）通过一台具有公网 IP 的服务器暴露给公网用户访问。在当前 IPv4 地址资源日益紧张，许多家庭和小型办公室难以获取公网 IP 的背景下，FRP 提供了便捷、高效的解决方案。

{% note info %}
核心思想：**FRP 通过在公网服务器上运行一个 `frps` (服务端) 和在内网机器上运行一个 `frpc` (客户端) 来建立连接。内网流量经由 `frpc` 转发到 `frps`，再由 `frps` 转发到公网用户，实现内网服务的公网访问。**
{% endnote %}

## 一、为什么需要 FRP？

在许多场景下，我们需要从外部网络访问位于内网的服务，但常常面临以下问题：

1.  **没有公网 IP**：大多数家庭宽带用户和一些小型企业用户不再拥有独立的公网 IPv4 地址。他们处于运营商的 NAT (Network Address Translation) 之后，无法直接从外部访问内网设备。
2.  **端口转发困难**：即使有公网 IP，也可能需要手动在路由器上配置端口转发规则，这对于不熟悉网络配置的用户来说可能比较复杂，并且当内网 IP 变化时需要重新配置。
3.  **安全性考虑**：直接暴露内网服务端口存在安全风险。
4.  **远程管理**：需要远程管理家庭 NAS、树莓派、PC 等设备。
5.  **搭建个人服务**：希望搭建个人网站、博客、游戏服务器等，但没有独立的公网服务器。

FRP 完美解决了这些痛点，提供了一种简单、高效且灵活的内网穿透方案。

## 二、FRP 的工作原理

FRP 的核心原理是**反向代理 (Reverse Proxy)** 和**隧道 (Tunneling)** 技术。它由两个主要组件构成：

1.  **frps (FRP Server)**：运行在具有**公网 IP** 的服务器上，监听来自公网用户的请求和来自 `frpc` 客户端的连接。
2.  **frpc (FRP Client)**：运行在**内网机器**上，负责将内网服务的流量转发到 `frps`，并接收来自 `frps` 的公网请求。

**工作流程图：**

{% mermaid %}
graph TD
    A[公网用户] -->|访问公网IP:PortA| B(FRP Server - frps)
    B -->|"转发请求 (FRP隧道)"| C(FRP Client - frpc)
    C -->|访问内网服务IP:PortB| D[内网服务]
    D -->|返回响应| C
    C -->|"返回响应 (FRP隧道)"| B
    B -->|返回响应| A
{% endmermaid %}

**详细步骤如下：**

1.  **建立隧道**：`frpc` 启动后，会主动连接 `frps`，并在公网服务器和内网客户端之间建立一个持久化的 TCP 连接（FRP 隧道）。
2.  **配置代理**：在 `frpc` 的配置文件中，您可以定义要暴露的内网服务及其对应的公网端口。例如，将内网机器的 `80` 端口（Web 服务）映射到公网服务器的 `8080` 端口。
3.  **请求转发**：
    *   当公网用户访问 `frps` 服务器的 `公网IP:8080` 时，`frps` 会接收到这个请求。
    *   `frps` 识别到这是通过 FRP 隧道转发给内网 Web 服务的请求，便通过之前建立的隧道将请求转发给 `frpc`。
    *   `frpc` 收到请求后，再将其转发到内网机器的 `127.0.0.1:80` (或指定内网 IP)。
    *   内网 Web 服务处理请求后，将响应返回给 `frpc`。
    *   `frpc` 再通过隧道将响应传回给 `frps`。
    *   `frps` 最终将响应返回给公网用户。

## 三、FRP 的主要功能和应用场景

### 3.1 核心功能

1.  **TCP 端口转发**：将内网的 TCP 服务（如 SSH、游戏服务器、数据库等）映射到公网。
2.  **UDP 端口转发**：将内网的 UDP 服务（如 DNS、游戏语音等）映射到公网。
3.  **HTTP/HTTPS 端口转发**：支持通过子域名或自定义域名将内网 Web 服务映射到公网，并支持证书配置。
4.  **P2P (KCP)** 模式：通过 UDP 实现数据传输，优化低延迟场景。
5.  **身份验证**：通过 `token` 确保 `frpc` 只能连接到合法的 `frps`。
6.  **加密与压缩**：支持对传输的数据进行加密和压缩，提高安全性和传输效率。
7.  **Web 界面**：`frps` 和 `frpc` 都提供 Web 界面用于监控连接状态和流量。

### 3.2 典型应用场景

*   **远程桌面/SSH 访问**：在家中或公司，通过公网随时随地远程控制内网 PC。
*   **搭建个人网站/博客**：将本地开发的 Web 应用或静态博客通过 FRP 暴露给公网。
*   **内网文件共享**：搭建 FTP/Samba 服务器，通过 FRP 实现远程文件访问。
*   **家庭 NAS 访问**：在外网访问家中的 NAS，例如照片、视频、文件。
*   **远程游戏服务器**：与朋友一起玩本地搭建的游戏服务器。
*   **监控系统访问**：远程查看家中的摄像头监控画面。
*   **测试环境部署**：将内网测试环境暴露给外部测试人员。

## 四、FRP 的安装与配置示例 (Linux)

### 4.1 下载 FRP

访问 FRP 的 GitHub Releases 页面 ([https://github.com/fatedier/frp/releases](https://github.com/fatedier/frp/releases)) 下载适合您系统的最新版本。通常是 `frp_*.tar.gz` 文件。

**示例 (以 x64 Linux 为例)：**

```bash
# 在公网服务器和内网机器分别执行
wget https://github.com/fatedier/frp/releases/download/v0.58.0/frp_0.58.0_linux_amd64.tar.gz
tar -zxvf frp_0.58.0_linux_amd64.tar.gz
cd frp_0.58.0_linux_amd64
```

解压后会看到 `frpc`, `frps`, `frpc.ini`, `frps.ini` 等文件。

### 4.2 配置 FRP Server (frps)

在**公网服务器**上配置 `frps.ini`：

```ini
# frps.ini
[common]
bind_port = 7000         # frps 监听的端口，用于frpc连接
dashboard_port = 7500    # dashboard 端口，用于web管理界面
dashboard_user = admin   # dashboard 用户名
dashboard_pwd = your_dashboard_password # dashboard 密码
token = your_auth_token  # 验证token，frpc连接时需要提供，增强安全性
log_file = /var/log/frps.log # 日志文件
log_level = info         # 日志级别
log_max_days = 3         # 日志保留天数

# HTTP/HTTPS 代理配置
vhost_http_port = 80     # HTTP 代理监听端口
vhost_https_port = 443   # HTTPS 代理监听端口
```
**说明：**
*   `bind_port`：这是 `frps` 服务端用于和 `frpc` 客户端建立连接的端口，确保此端口在防火墙中开放。
*   `dashboard_port`：`frps` Web 管理界面的端口，可以通过浏览器访问 `公网IP:7500`。
*   `token`：确保客户端连接的安全性，必须与 `frpc.ini` 中的 `token` 一致。
*   如果您想通过域名和子域名来代理 HTTP/HTTPS 服务，需要配置 `vhost_http_port` 和 `vhost_https_port`。

**启动 frps：**

```bash
nohup ./frps -c ./frps.ini &
```
推荐使用 `systemd` 进行服务管理，确保其开机自启和稳定运行。

### 4.3 配置 FRP Client (frpc)

在**内网机器**上配置 `frpc.ini`：

```ini
# frpc.ini
[common]
server_addr = your_server_ip      # frps 服务器的公网 IP 地址
server_port = 7000                # frps 监听的端口 (与frps.ini中的bind_port一致)
token = your_auth_token           # 验证token (与frps.ini中的token一致)
log_file = /var/log/frpc.log
log_level = info
log_max_days = 3

# 配置一个 SSH 代理
[ssh]
type = tcp                        # 代理类型为 TCP
local_ip = 127.0.0.1              # 内网 SSH 服务的 IP 地址
local_port = 22                   # 内网 SSH 服务的端口
remote_port = 6000                # frps 暴露给公网的端口 (公网用户通过公网IP:6000访问内网SSH)

# 配置一个 HTTP (Web) 代理
[web]
type = http
local_ip = 127.0.0.1
local_port = 80                   # 内网 Web 服务的端口
subdomain = myweb                 # 通过子域名访问: myweb.your_domain.com

# 配置一个 HTTPS 代理 (假设内网服务已配置HTTPS)
[https_web]
type = https
local_ip = 127.0.0.1
local_port = 443                  # 内网 HTTPS Web 服务的端口
subdomain = myhttps               # 通过子域名访问: myhttps.your_domain.com

# 配置一个 TCP 代理 (例如远程桌面RDP)
[rdp]
type = tcp
local_ip = 127.0.0.1             # Windows 远程桌面的 IP
local_port = 3389                # Windows 远程桌面的端口
remote_port = 33890              # 公网访问端口
```
**说明：**
*   `server_addr`：填写您的公网服务器 IP 地址。
*   `remote_port`：这是公网用户将要访问的端口。确保此端口在 `frps` 所在的公网服务器防火墙中开放。
*   `subdomain`：如果您配置了 `vhost_http_port` 或 `vhost_https_port`，可以通过配置 DNS 解析 `*.your_domain.com` 到您的公网 IP， then use `subdomain` to access your internal web services.

**启动 frpc：**

```bash
nohup ./frpc -c ./frpc.ini &
```
同样推荐使用 `systemd` 进行服务管理。

### 4.4 防火墙配置

**公网服务器端 (frps)**：
需要开放 `bind_port` (例如 7000)、`dashboard_port` (例如 7500) 以及所有 `remote_port` (例如 6000, 80, 443, 33890) 等。

**内网机器端 (frpc)**：
通常无需特别开放端口，因为 `frpc` 是主动向 `frps` 发起连接。但需要确保内网服务（如 22, 80, 3389 端口）在内网机器的防火墙中是开放的。

## 五、安全性考虑

1.  **使用 Token 验证**：确保 `frps` 和 `frpc` 配置相同的 `token`，防止未经授权的客户端连接。
2.  **Dashboard 密码**：为 `dashboard` 设置强密码。
3.  **TLS 加密**：FRP 默认不加密客户端与服务器之间的隧道数据。通过在 `common` 配置中设置 `tls_enable = true` 可以启用 TLS 加密，增强数据传输的安全性。
4.  **IP 白名单/访问控制**：在 `frpc.ini` 或 `frps.ini` 中，可以配置 `allow_users` / `deny_users` 或 `privilege_mode` 等高级安全特性。
5.  **防火墙**：严格限制公网服务器上的端口访问，只开放必要的端口。
6.  **更新到最新版本**：及时更新 FRP 到最新版本，以获取安全补丁和新功能。

## 六、总结

FRP 是一个强大且灵活的内网穿透工具，解决了许多我们在没有公网 IP 条件下访问内部服务的痛点。无论是个人爱好者搭建个人服务，还是小型企业进行远程办公和管理，FRP 都提供了高效的解决方案。通过其丰富的代理类型和安全特性，FRP 已成为现代网络应用中不可或缺的工具之一。正确理解和配置 FRP，将极大地拓宽您网络的边界。
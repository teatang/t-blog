---
title: Ubuntu UFW (Uncomplicated Firewall) 详解
date: 2025-11-01 06:24:00
tags:
  - 2025
  - 防火墙
  - 计算机网络
  - 网络技术
  - Linux
  - Ubuntu
categories:
  - Linux
---

> **UFW (Uncomplicated Firewall)** 是 Ubuntu Linux 及其衍生发行版中一个**简化且易于使用**的防火墙配置工具。它作为 **`iptables`** 的前端，提供了一个用户友好的命令行界面，让普通用户和系统管理员能够更轻松地管理 Linux 内核的 Netfilter 防火墙规则。UFW 的目标是“不复杂”，即**简化防火墙的管理**，使其不再令人生畏。

{% note info %}
**核心思想：** UFW 提供了一种**高级抽象**，将复杂的 `iptables` 命令封装成少数直观的指令，使得用户无需深入理解 `iptables` 规则链即可实现基本的防火墙配置。
{% endnote %}
------

## 一、为什么选择 UFW？

Linux 系统内置了强大的 Netfilter 框架和 `iptables` 工具，但 `iptables` 的语法复杂，规则众多，对于初学者来说学习曲线陡峭。UFW 旨在解决以下问题：

1.  **简化防火墙管理**：
    *   **易于上手**：通过简单的命令即可配置常见的防火墙规则，无需掌握复杂的 `iptables` 语法。
    *   **减少错误**：简化后的命令减少了因语法错误导致配置失误的风险。

2.  **增强系统安全性**：
    *   **默认拒绝策略**：UFW 默认采用“默认拒绝所有传入连接”的策略，只允许明确授权的连接，这是安全最佳实践。
    *   **隔离不需要的服务**：防止未经授权的访问，保护服务器或个人电脑免受网络攻击。

3.  **适用于各种场景**：
    *   **服务器**：保护 Web 服务器、数据库服务器等。
    *   **个人电脑**：增强桌面系统的安全性，尤其是在公共网络环境下。
    *   **嵌入式设备**：轻量级，易于集成。

## 二、UFW 的工作原理

UFW 并不是一个独立的防火墙，它是一个**管理 `iptables` 规则的工具**。当您使用 UFW 命令时，UFW 会将这些高级指令翻译成底层的 `iptables` 规则，并将其应用到 Netfilter 框架中。

{% mermaid %}
graph TD
    A[用户] -->|UFW 命令| B[UFW]
    B -->|翻译成 `iptables` 规则| C[iptables]
    C -->|应用规则| D["Netfilter (Linux 内核)"]

    E[传入/传出网络流量] --> D
    D -->|根据规则放行或阻止| F[应用程序/网络]
{% endmermaid %}

**关键概念：**

1.  **`iptables` 前端**：UFW 的本质是 `iptables` 的一个用户友好界面。所有 UFW 应用的规则最终都会反映在 `iptables` 中。
2.  **默认策略 (Default Policies)**：UFW 默认有针对传入 (incoming)、传出 (outgoing) 和转发 (forwarding) 连接的策略。
    *   **默认传入策略 (Default incoming policy)**：通常设置为 `DENY` (拒绝)。这是 UFW 安全性的基石，意味着除非明确允许，否则所有进入系统的连接都会被阻止。
    *   **默认传出策略 (Default outgoing policy)**：通常设置为 `ALLOW` (允许)。这允许您的系统自由地发起出站连接。
    *   **默认转发策略 (Default forwarding policy)**：通常设置为 `DENY`。这适用于将 Linux 作为路由器或网关的情况。
3.  **规则 (Rules)**：UFW 允许您定义特定端口、协议、IP 地址的允许 (ALLOW) 或拒绝 (DENY) 规则，这些规则会覆盖默认策略。
    *   **顺序**：规则的顺序很重要。UFW 内部会根据一些启发式规则（如更具体的规则优先）来处理，但通常，您添加的规则会比默认策略更优先。
4.  **配置文件 (Profiles)**：UFW 包含一些预定义的应用程序配置文件，这些文件存储在 `/etc/ufw/applications.d` 目录中。它们包含了特定应用程序所需的端口和协议信息，方便一键启用。例如，`Apache`、`OpenSSH` 等。

## 三、UFW 的常用命令

### 3.1 状态管理

*   **检查 UFW 状态**：
    ```bash
    sudo ufw status
    sudo ufw status verbose # 显示更详细的信息
    sudo ufw status numbered # 显示带编号的规则，便于删除
    ```
*   **启用 UFW**：
    ```bash
    sudo ufw enable
    ```
    **注意：** 启用 UFW 后，如果之前没有允许 SSH 端口，您可能会断开与服务器的连接。**建议在启用 UFW 之前，先允许 SSH 端口。**
*   **禁用 UFW**：
    ```bash
    sudo ufw disable
    ```
*   **重置 UFW** (删除所有规则并禁用)：
    ```bash
    sudo ufw reset
    ```
    **注意：** 这会删除所有自定义规则并将 UFW 恢复到未配置状态，非常有用，但要小心使用。

### 3.2 默认策略

*   **设置默认传入策略** (默认为 deny)：
    ```bash
    sudo ufw default deny incoming
    ```
*   **设置默认传出策略** (默认为 allow)：
    ```bash
    sudo ufw default allow outgoing
    ```

### 3.3 允许/拒绝规则

*   **允许特定端口**：
    *   允许所有 TCP/UDP 流量通过端口 22 (SSH)：
        ```bash
        sudo ufw allow 22
        ```
    *   允许特定协议通过端口 80 (HTTP) (仅 TCP)：
        ```bash
        sudo ufw allow 80/tcp
        ```
    *   允许特定协议通过端口 443 (HTTPS) (仅 TCP)：
        ```bash
        sudo ufw allow 443/tcp
        ```
*   **允许应用程序配置文件**：
    *   列出可用的应用程序配置文件：
        ```bash
        sudo ufw app list
        ```
    *   允许 OpenSSH 流量：
        ```bash
        sudo ufw allow OpenSSH
        ```
*   **允许来自特定 IP 地址的连接**：
    *   允许来自 IP 地址 `192.168.1.100` 的所有连接：
        ```bash
        sudo ufw allow from 192.168.1.100
        ```
    *   允许来自 IP 地址 `192.168.1.100` 的 SSH 连接：
        ```bash
        sudo ufw allow from 192.168.1.100 to any port 22
        ```
*   **拒绝特定端口或 IP 地址**：
    *   拒绝所有 TCP 流量通过端口 23 (Telnet)：
        ```bash
        sudo ufw deny 23/tcp
        ```
    *   拒绝来自 IP 地址 `1.2.3.4` 的所有连接：
        ```bash
        sudo ufw deny from 1.2.3.4
        ```
*   **删除规则**：
    *   按规则内容删除：
        ```bash
        sudo ufw delete allow 22
        ```
    *   按编号删除 (先 `sudo ufw status numbered` 查看编号)：
        ```bash
        sudo ufw delete [规则编号]
        ```
        例如，删除编号为 3 的规则：
        ```bash
        sudo ufw delete 3
        ```
*   **插入规则** (在指定位置插入规则)：
    ```bash
    sudo ufw insert 1 allow from 192.168.1.0/24 to any port 80
    ```
    这会在所有规则之前（位置 1）插入该规则。

### 3.4 日志记录

*   **启用日志**：
    ```bash
    sudo ufw logging on
    ```
*   **禁用日志**：
    ```bash
    sudo ufw logging off
    ```
    日志通常记录在 `/var/log/ufw.log` 或 `syslog` 中。

## 四、UFW 常见应用场景

1.  **Web 服务器**：
    ```bash
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow OpenSSH         # 允许 SSH 远程管理
    sudo ufw allow http            # 允许 HTTP (端口 80)
    sudo ufw allow https           # 允许 HTTPS (端口 443)
    sudo ufw enable
    ```
2.  **数据库服务器** (例如 PostgreSQL，默认端口 5432)：
    ```bash
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow OpenSSH
    sudo ufw allow from 192.168.1.0/24 to any port 5432 # 仅允许来自内部网络的数据库连接
    sudo ufw enable
    ```
3.  **开发工作站** (允许常见的开发服务)：
    ```bash
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow OpenSSH
    sudo ufw allow 8000/tcp        # 允许 Django 或其他 Web 开发服务器
    sudo ufw allow 3000/tcp        # 允许 Node.js 或 React 开发服务器
    sudo ufw enable
    ```

## 五、UFW 的高级特性和注意事项

1.  **IPv6 支持**：UFW 默认同时管理 IPv4 和 IPv6 规则。可以通过 `/etc/default/ufw` 文件中的 `IPV6=yes/no` 来控制。
2.  **复杂的 `iptables` 规则**：对于 UFW 无法直接表达的复杂 `iptables` 规则，您可以手动编辑 `/etc/ufw/before.rules` 和 `/etc/ufw/after.rules` 文件，在 UFW 应用其规则之前或之后插入自定义 `iptables` 规则。
3.  **路由/转发规则**：UFW 也可以配置转发规则，这在将 Linux 作为路由器或网关时很有用。
4.  **安全最佳实践**：
    *   **先允许 SSH**：在启用 UFW 之前，务必先允许 SSH 端口，以避免失去对远程服务器的访问。
    *   **最小权限原则**：只允许必要的端口和协议，拒绝所有其他连接。
    *   **定期检查**：使用 `sudo ufw status` 定期检查防火墙状态和规则。

## 六、总结

UFW 是 Ubuntu Linux 中一个极其有用和重要的工具，它将复杂的防火墙管理任务变得简单易行。无论是个人用户保护桌面系统，还是系统管理员保护服务器，UFW 都提供了一个高效且直观的方式来配置网络安全策略。通过理解其基本原理和常用命令，您可以有效地保护您的 Linux 系统免受未授权的网络访问。
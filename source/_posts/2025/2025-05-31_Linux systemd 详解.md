---
title: Linux systemd 详解
date: 2025-05-31 06:24:00
tags:
  - 2025
  - Linux
  - macOS
  - 命令行
categories:
  - 开发工具
  - 命令行
---

> **systemd** 是现代 Linux 发行版中广泛采用的**系统和服务管理器**。它作为一个取代传统 SysVinit 或 Upstart 的初始化系统 (init system)，负责整个系统的启动、服务管理、设备挂载、日志管理、定时任务、网络配置等诸多方面。systemd 的目标是提供一个统一且高效的框架，以便管理整个 Linux 系统的生命周期和资源。

{% note info %}
核心思想：统一、高效地管理 Linux 系统的初始化进程，以及所有系统服务和资源的生命周期，提供更快的启动速度、更强的依赖管理和更丰富的功能集。
{% endnote %}

------

## 一、为什么需要 systemd？

在 systemd 出现之前，Linux 系统主要使用 SysVinit （System V init）作为初始化系统，后来一些发行版也尝试了 Upstart。这些传统 init 系统的主要痛点包括：

1.  **启动速度慢**：SysVinit 严格按照 `/etc/rcS.d/` 和 `/etc/rcX.d/` 目录下的脚本名称顺序，**串行**地启动服务。这种顺序执行导致启动时间较长。
2.  **依赖关系处理不佳**：SysVinit 通过脚本名称前缀（如 `S01foobar`, `K99foobar`）和符号链接来管理启动和停止顺序，难以处理复杂的服务依赖关系，容易出现服务启动失败或顺序错误。
3.  **基于 Shell 脚本**：大量的 Shell 脚本使得配置和维护变得复杂，且错误处理能力有限。
4.  **缺乏统一管理**：SysVinit 仅仅是一个 init 进程，而很多其他功能（如日志、定时任务）需要额外的工具来管理，缺乏一个统一的系统管理框架。
5.  **不支持按需启动**：服务要么启动，要么不启动，无法根据实际需求动态启动服务以节省资源。

systemd 旨在解决这些问题，提供一个现代化的、功能强大的初始化系统和服务管理器。

## 二、systemd 的核心功能

systemd 不仅仅是一个 init 进程，它是一个庞大的软件套装，提供了大量的功能组件：

1.  **系统初始化与服务管理 (Init System & Service Manager)**：
    *   这是 systemd 最核心的功能。它取代了传统的 init 进程 (PID 1)，负责启动系统中的所有其他进程。
    *   管理系统服务（守护进程）的启动、停止、重启、重载、状态查询等。
    *   与传统 init 系统不同，systemd 可以**并行**启动服务，显著加快系统启动速度。
2.  **强大的依赖管理**：通过清晰的配置，services 可以声明它们依赖哪些其他服务、挂载点或设备，systemd 会自动解析这些依赖并确保正确的启动和停止顺序。
3.  **按需启动 (Socket Activation / D-Bus Activation)**：
    *   **Socket Activation (套接字激活)**：服务在收到第一个网络连接时才启动。systemd 监听端口，当有请求进来时，systemd 启动相应的服务，并将连接传递给它。这减少了系统资源占用。
    *   **D-Bus Activation (D-Bus 激活)**：服务在被第一个 D-Bus 请求调用时才启动。
4.  **统一的日志管理 (journald)**：systemd 引入了 `journald` 服务，收集所有内核、系统和应用进程的日志到一个统一的、结构化的二进制日志文件中，提供了强大的查询和过滤功能。
5.  **设备管理 (udev)**：systemd 与 `udev` 紧密集成，实现了设备动态管理和基于硬件事件的脚本执行。
6.  **网络配置管理 (systemd-networkd)**：提供了原生的网络配置管理服务，可以配置网络接口、IP 地址、路由等。
7.  **时间管理 (systemd-timesyncd)**：一个轻量级的 NTP 客户端，用于同步系统时间。
8.  **用户登录管理 (logind)**：管理用户会话、电源管理等。
9.  **定时任务管理 (timer units)**：取代了传统的 `cron`，提供了更灵活和强大的定时任务调度能力。

## 三、systemd Unit (单元) 详解

systemd 将所有它管理的对象（服务、挂载点、设备、套接字等）都抽象为**单元 (Unit)**。每个单元都有一个对应的配置文件，通常以 `.unit_type` 结尾。

### 3.1 Unit 文件的通用结构

一个 systemd Unit 文件通常包含以下几个主要部分 (Section)：

*   **`[Unit]`**：定义单元的通用信息，如描述 (Description)、依赖关系 (Requires, Wants, After, Before) 等。
*   **`[Service]` / `[Mount]` / `[Socket]` 等** (具体类型相关的段落)：定义特定类型单元的行为。例如，`[Service]` 段定义服务进程的启动命令、重启策略、用户等。
*   **`[Install]`**：定义单元如何被启用 (enable) 或禁用 (disable)。这通常包括 `WantedBy` (被哪些 Target 单元引用) 或 `Alias` (别名)。

### 3.2 常见的 Unit 类型及用途

| Unit 类型    | 后缀   | 描述                                                                                                                                                                                                                                                                                       | 示例                                                |
| :----------- | :----- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------- |
| **Service**  | `.service` | 最常见。管理一个进程或守护进程的生命周期。定义了如何启动、停止、重启、重载服务，以及在什么用户下运行等。它是 systemd 管理后台应用的主要方式。                                                                                                                                                                                          | `nginx.service`, `sshd.service`                     |
| **Target**   | `.target`  | 用于对单元进行逻辑分组，或者定义系统状态。例如，`multi-user.target` 表示系统已经启动到多用户模式，但没有图形界面；`graphical.target` 表示系统启动到图形界面。它们不直接启动进程，而是作为其他服务启动的依赖点或触发器。                                                                                                                    | `multi-user.target`, `network.target`               |
| **Mount**    | `.mount`   | 管理文件系统的挂载点。它定义了要挂载的设备、挂载点、文件系统类型以及挂载选项，取代了 `/etc/fstab` (尽管 `/etc/fstab` 仍然被 systemd 支持并转换为 `.mount` 单元)。                                                                                                                                      | `home.mount` (通常由 `fstab` 生成)                  |
| **Automount**| `.automount` | 在访问挂载点时才动态挂载文件系统。与 `.mount` 不同，它不直接挂载，而是等待访问事件。                                                                                                                                                                                                                                                        | `/mnt/data.automount`                               |
| **Socket**   | `.socket`  | 定义一个监听套接字（通常是网络端口或 Unix 域套接字）。用于实现服务的 Socket Activation，即当有连接到达该套接字时才启动相应的 `.service` 单元。                                                                                                                                                                                           | `ssh.socket` (如果启用了 Socket Activation)         |
| **Device**   | `.device`  | 代表一个内核设备节点。通常由 `udev` 自动生成，当设备出现或消失时，可以触发其他单元（如 `.mount` 单元）的启动或停止。                                                                                                                                                                          | `dev-sda1.device`                                   |
| **Path**     | `.path`    | 监控某个文件系统路径。当该路径发生变化（如文件被修改、创建、删除）时，可以触发其他单元的启动。                                                                                                                                                                                                                                                        | `/var/run/foo.path` (当文件发生变化时启动服务)       |
| **Timer**    | `.timer`   | 基于时间触发其他单元（通常是 `.service` 单元），作为 `cron` 的替代品。它定义了定期触发的事件，可以精确到秒，支持日历事件和单调计时器。                                                                                                                                                                                                                         | `backup.timer` (定期执行 `backup.service`)          |
| **Swap**     | `.swap`    | 管理交换分区或交换文件。类似于 `.mount` 类型，但用于交换空间。                                                                                                                                                                                                                         | `swap.swap` (通常由 `fstab` 生成)                   |
| **Slice**    | `.slice`   | 用于系统资源管理 (cgroups)。它可以将进程分组到不同的“切片”中，以限制或分配 CPU、内存等资源。                                                                                                                                                                                           | `system.slice`, `user.slice`                        |
| **Scope**    | `.scope`   | 由 systemd 在运行时创建，用于管理外部通过 `fork()`/`exec()` 启动的进程（如用户登录会话），并为这些进程提供 cgroup 资源管理。                                                                                                                                                              | `session-C1.scope`                                  |

## 四、`systemctl` 命令详解

`systemctl` 是 systemd 的核心命令行工具，用于管理 systemd 单元和控制 systemd 守护进程本身。

### 4.1 常用服务管理命令

*   `systemctl start <unit>`：启动一个单元（例如服务）。
*   `systemctl stop <unit>`：停止一个单元。
*   `systemctl restart <unit>`：重启一个单元。
*   `systemctl reload <unit>`：重载单元的配置文件（如果服务支持，例如 Nginx），通常比 `restart` 速度快，不会中断连接。
*   `systemctl status <unit>`：查看单元的当前状态，包括是否激活、PID、内存占用以及最近的日志输出。
*   `systemctl enable <unit>`：设置单元在系统启动时自动启动。
*   `systemctl disable <unit>`：禁止单元在系统启动时自动启动。
*   `systemctl is-active <unit>`：检查单元是否正在运行（活动的）。
*   `systemctl is-enabled <unit>`：检查单元是否已设置为开机自启动。
*   `systemctl mask <unit>`：禁用一个单元，使其无法手动或通过依赖启动。这创建了一个指向 `/dev/null` 的符号链接，通常用于永久禁用某个服务。
*   `systemctl unmask <unit>`：解除一个被 `mask` 的单元。
*   `systemctl preset <unit>`：根据系统预设的策略（通常在 `/usr/lib/systemd/system-preset/` 中定义）启用或禁用单元。

### 4.2 单元文件管理命令

*   `systemctl list-units`：列出所有当前加载到内存中的单元。
*   `systemctl list-unit-files`：列出所有已安装的单元文件及其启用/禁用状态。
*   `systemctl daemon-reload`：当修改了 unit 配置文件后，需要执行此命令让 systemd 重新加载配置。
*   `systemctl daemon-reexec`：重启 systemd 进程本身（通常不需要，除非有重大 systemd 升级）。
*   `systemctl get-default`：获取系统默认的 Target。
*   `systemctl set-default <target>`：设置系统启动时默认进入的 Target（例如 `multi-user.target` 或 `graphical.target`）。

### 4.3 系统级控制命令

*   `systemctl poweroff`：关闭系统。
*   `systemctl reboot`：重启系统。
*   `systemctl suspend`：挂起系统。
*   `systemctl hibernate`：休眠系统。
*   `systemctl rescue`：进入救援模式。
*   `systemctl emergency`：进入紧急模式。

## 五、Unit 文件构成与示例

Unit 文件的存放位置主要有：

*   `/usr/lib/systemd/system/`：系统及软件包提供的默认 unit 文件。不要直接修改。
*   `/etc/systemd/system/`：系统管理员自定义或覆盖的 unit 文件。优先级最高。
*   `/run/systemd/system/`：运行时生成的 unit 文件。

当 systemd 查找一个 unit 文件时，它会优先使用 `/etc` 下的文件，然后是 `/run`，最后是 `/usr/lib`。

### 5.1 一个简单的 `.service` 文件示例

假设我们有一个简单的 Python Web 服务器脚本 `/opt/mywebapp/app.py`，我们想用 systemd 来管理它。

**`/opt/mywebapp/app.py` (Python Web Server 示例):**

```python
# app.py
from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__)) # 服务自己的目录

class MyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == "__main__":
    print(f"Serving HTTP on port {PORT} from directory {DIRECTORY}...")
    httpd = HTTPServer(("0.0.0.0", PORT), MyHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()
```

**`/etc/systemd/system/mywebapp.service` (systemd Unit 文件):**

```ini
[Unit]
# 单元描述
Description=My Simple Python Web Server

# 依赖关系：在 network.target 启动完成后才启动此服务
After=network.target

[Service]
# 服务启动命令：使用 python3 执行 app.py
ExecStart=/usr/bin/python3 /opt/mywebapp/app.py

# 工作目录：服务将在该目录下运行
WorkingDirectory=/opt/mywebapp

# 当服务异常退出时，systemd 总是尝试重启它
Restart=always

# 重启延迟：在尝试重启前等待 5 秒
RestartSec=5

# 服务运行的用户
User=www-data

# 服务运行的组
Group=www-data

# 限制日志输出只显示错误和警告
# StandardOutput=journal
# StandardError=journal

[Install]
# 定义此服务在 systemd 启动到 multi-user.target 状态时应该自动启动
# multi-user.target 表示多用户命令行界面，不包含图形界面
WantedBy=multi-user.target
```

**使用步骤：**

1.  将上述 `app.py` 文件放入 `/opt/mywebapp/` 目录。
2.  创建 `mywebapp.service` 文件并放入 `/etc/systemd/system/` 目录。
3.  如果 `www-data` 用户不存在，可能需要先创建：`sudo useradd -r -s /sbin/nologin www-data`
4.  重新加载 systemd 配置：`sudo systemctl daemon-reload`
5.  启动服务：`sudo systemctl start mywebapp`
6.  查看服务状态：`sudo systemctl status mywebapp`
7.  设置开机自启动：`sudo systemctl enable mywebapp`
8.  在浏览器中访问 `http://your_server_ip:8000` 即可看到效果。

## 六、journald 日志管理

systemd 引入的 `journald` 是一个新的日志守护进程，它负责收集内核、initrd、服务和应用程序的日志，并将它们集中存储为二进制格式。

### 6.1 `journalctl` 命令

`journalctl` 是查询和查看 `journald` 日志的工具。

*   `journalctl`：查看所有日志。
*   `journalctl -f`：实时跟踪最新日志 (类似 `tail -f`)。
*   `journalctl -u <unit>`：查看指定单元的日志，例如 `journalctl -u mywebapp.service`。
*   `journalctl --since "2 hours ago"`：查看过去两小时的日志。
*   `journalctl --since "YYYY-MM-DD HH:MM:SS" --until "YYYY-MM-DD HH:MM:SS"`：查看指定时间范围内的日志。
*   `journalctl -p err`：只显示错误级别及以上的日志。
*   `journalctl _PID=<pid>`：按进程 ID 过滤日志。
*   `journalctl --disk-usage`：查看日志占用的磁盘空间。
*   `journalctl --vacuum-time=1w`：清理超过一周的日志。

`journald` 的优点是结构化、统一、易于查询和管理，相较于传统的文本文件日志，提供了更强大的功能。

## 七、systemd 的优缺点与争议

### 7.1 优点

*   **启动速度快**：服务并行启动，大大缩短了系统启动时间。
*   **依赖管理强大**：能够明确声明和解决服务之间的复杂依赖关系。
*   **统一管理**：集成了 init、服务管理、日志、定时任务、网络等多种功能，提供了统一的配置和管理接口。
*   **按需启动**：Socket Activation 和 D-Bus Activation 机制提高了系统资源利用率。
*   **Cgroups 支持**：与 Linux Control Groups (cgroups) 深度集成，可以更好地控制和隔离服务资源。
*   **错误处理与监控**：提供自动重启、失败重试等功能，增强了服务的健壮性。

### 7.2 缺点与争议

*   **复杂性和庞大性**：systemd 是一个非常庞大的系统，功能众多，导致学习曲线陡峭，且被批评为“过于臃肿”和“非 Unix 哲学”。
*   **打破了 Unix 哲学**：传统 Unix 哲学强调每个工具做好一件事。systemd 尝试管理所有事物，这与该哲学相悖。
*   **二进制日志 (journald)**：虽然功能强大，但二进制日志文件不方便直接用 `cat`、`grep` 等传统工具查看，必须使用 `journalctl`。
*   **侵入性强**：它对传统的 Linux 生态系统进行了深远的改变，许多工具和组件都必须与 systemd 兼容。
*   **无法取消进程启动**：一旦服务启动失败，systemd 会持续尝试重启，除非手动停止或配置。

尽管存在争议，但 systemd 凭借其在性能、功能和管理方面的显著优势，已经成为绝大多数主流 Linux 发行版（如 Ubuntu, CentOS/RHEL, Debian, Fedora, Arch Linux 等）的默认初始化系统。

## 八、总结

systemd 作为现代 Linux 系统的核心，极大地改变了我们管理和交互 Linux 服务的方式。它解决了传统 init 系统的诸多痛点，提供了更快的启动速度、更强大的依赖管理、更统一的服务和资源控制。通过 `systemctl` 命令行工具和服务单元文件，管理员可以高效地配置和管理系统行为。理解 systemd 的工作原理和核心概念，是深入掌握 Linux 系统管理，尤其是自动化运维和故障排查的关键。虽然其复杂性和“大一统”的哲学引发了一些争议，但其带来的效率和功能提升是毋庸置疑的，使其在现代 Linux 生态中占据了不可动摇的地位。
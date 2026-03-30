---
title: Supervisor 进程管理工具详解
date: 2025-03-22 06:24:00
tags:
    - 2025
    - Python
    - 进程管理
categories: 
    - Python
    - 库
---

> **Supervisor** 是一个用 Python 编写的进程控制系统，旨在帮助类 Unix 操作系统用户**监控和控制多个进程**。它提供了一个中央化的管理界面，确保其管理的程序在后台持续运行，并在程序意外退出时自动重启，从而提高服务的稳定性和可用性。Supervisor 主要用于管理那些设计为长时间运行但没有内置机制来处理故障或自动重启的非守护进程。

{% note info %}
核心思想：
-   **可靠的进程常驻**：确保关键服务在后台持续运行，即使崩溃也能自动重启。
-   **集中化管理**：提供统一的接口（命令行或Web界面）来启动、停止、重启和查看受管进程的状态。
-   **资源隔离与监控**：为每个受管进程提供独立的运行环境和日志记录，便于故障排查和性能分析。
-   **简化服务部署与运维**：降低手动管理进程的复杂性，特别适用于部署Python、Node.js等非系统服务。
{% endnote %}

------

## 一、为什么需要 Supervisor？

在服务器环境中运行应用程序时，经常会遇到以下挑战：

1.  **进程崩溃**：应用程序可能会因为代码错误、资源耗尽或其他原因意外退出。如果没有外部机制干预，服务将中断。
2.  **后台运行与守护化**：许多应用程序设计为前台运行，当用户会话结束或终端关闭时，进程也会终止。需要将其转换为后台守护进程。
3.  **多进程管理**：一个复杂的系统可能由多个相互依赖的进程组成，手动管理这些进程的启动顺序、重启策略和状态监控非常繁琐。
4.  **日志管理**：需要集中收集各个进程的输出日志，以便于问题诊断和性能分析。
5.  **统一控制**：希望有一个统一的工具来控制所有应用程序进程的生命周期。

Supervisor 正是为了解决这些问题而生。它作为这些应用程序的父进程运行，负责：

*   **进程守护**：在程序意外终止时自动将其重启。
*   **启动控制**：根据配置自动启动程序，或按需手动启动。
*   **状态监控**：实时报告程序的运行状态。
*   **资源限制**：通过配置，可以对进程的资源使用进行初步管理（如用户权限）。
*   **日志收集**：将程序的标准输出和标准错误重定向到指定的日志文件。

## 二、核心概念

理解 Supervisor 的工作原理需要掌握以下几个关键概念：

*   **`supervisord`**: 这是 Supervisor 的核心组件，一个守护进程。它负责启动、监控和管理其配置文件中定义的所有子进程。
*   **`supervisorctl`**: 这是 Supervisor 的命令行客户端。用户可以通过它与 `supervisord` 守护进程进行交互，执行启动、停止、重启进程，以及查看进程状态等操作。
*   **程序 (Program)**: 指代由 `supervisord` 管理的单个应用程序或脚本。在 Supervisor 的配置文件中，每个程序都通过一个 `[program:name]` 段来定义。
*   **进程组 (Process Group)**: 多个程序可以被组织成一个进程组，便于对一组相关进程进行统一管理（例如，同时启动或停止一个应用程序的所有组件）。在配置文件中通过 `[group:name]` 段定义。
*   **事件监听器 (Event Listener)**: Supervisor 支持通过配置事件监听器来响应进程状态变化等事件，执行自定义操作。这在需要与外部系统集成时非常有用。
*   **状态 (State)**: 受管进程的生命周期状态，常见的包括 `STARTING` (正在启动), `RUNNING` (正在运行), `STOPPED` (已停止), `EXITED` (已退出), `FATAL` (启动失败) 等。

## 三、Supervisor 的工作原理与架构

Supervisor 的架构相对简单但高效。它由一个主守护进程 `supervisord` 和一个命令行客户端 `supervisorctl` 以及可选的 Web 界面组成。

1.  **`supervisord` 守护进程**:
    *   启动时，`supervisord` 会读取其主配置文件（通常是 `/etc/supervisord.conf` 或项目中的 `.conf` 文件）。
    *   根据配置文件，它会启动所有 `autostart=true` 的程序。
    *   `supervisord` 会成为其管理的所有子进程的父进程。
    *   它持续监控这些子进程的状态。一旦发现某个子进程退出，如果配置了 `autorestart=true`，它会尝试重新启动该进程。
    *   它还负责重定向子进程的 `stdout` 和 `stderr` 到指定的日志文件。
    *   `supervisord` 内部包含一个 XML-RPC 服务器，用于接受 `supervisorctl` 或 Web 界面的指令。

2.  **`supervisorctl` 命令行客户端**:
    *   `supervisorctl` 通过 XML-RPC 接口与运行中的 `supervisord` 守护进程通信。
    *   用户通过 `supervisorctl` 命令可以发送指令，例如 `start program_name`、`stop program_name`、`status` 等。

3.  **Web 界面 (可选)**:
    *   如果配置了 `[inet_http_server]` 段，`supervisord` 还会提供一个 Web 界面，用户可以通过浏览器访问，图形化地管理进程。

{% mermaid %}
graph TD
    subgraph Host OS
        systemd_or_init[systemd / init.d (可选)] --> supervisord_daemon
        supervisord_daemon(supervisord 守护进程) -- 监控 & 管理 --> program_A[Program A (子进程)]
        supervisord_daemon -- 监控 & 管理 --> program_B[Program B (子进程)]
        supervisord_daemon -- 监控 & 管理 --> ...[...]

        client_cli[supervisorctl 命令行客户端] -- XML-RPC 调用 --> supervisord_daemon
        client_web[Web UI (浏览器)] -- HTTP 请求 --> supervisord_daemon
    end

    subgraph Configuration
        config_file_main[supervisord.conf (主配置文件)] --> supervisord_daemon
        config_file_includes[*.ini / *.conf (包含文件)] --> config_file_main
    end

    style supervisord_daemon fill:#f9f,stroke:#333,stroke-width:2px
    style client_cli fill:#bbf,stroke:#333,stroke-width:1px
    style client_web fill:#ccf,stroke:#333,stroke-width:1px
    style program_A fill:#bfb,stroke:#333,stroke-width:1px
    style program_B fill:#bfb,stroke:#333,stroke-width:1px
{% endmermaid %}

## 四、安装 Supervisor

Supervisor 通常通过 Python 的包管理器 `pip` 进行安装。

### 4.1 使用 pip 安装

确保你的系统上安装了 Python 和 pip。

```bash
# 安装 Supervisor
pip install supervisor
```

### 4.2 生成默认配置文件

安装完成后，可以生成一个默认的配置文件作为起点：

```bash
# 生成配置文件到当前目录 (生产环境建议放在 /etc/supervisord.conf)
echo_supervisord_conf > supervisord.conf

# 或者直接将其输出到 /etc 目录
# sudo echo_supervisord_conf > /etc/supervisord.conf
```
建议将生成的配置文件 `supervisord.conf` 移动到 `/etc/` 目录或 `/etc/supervisor/` 目录。

## 五、配置 Supervisor

Supervisor 的配置主要通过 INI 格式的文件完成。主配置文件通常命名为 `supervisord.conf`。

### 5.1 主配置段 `[supervisord]`

这是 Supervisor 守护进程自身的配置。

```ini
; supervisord.conf
[supervisord]
; 日志文件路径
logfile=/var/log/supervisor/supervisord.log
; 日志级别 (debug, info, warn, error, critical)
loglevel=info
; pid 文件路径
pidfile=/var/run/supervisord.pid
; 后台运行
nodaemon=false
; 子进程文件描述符的最大数量
minfds=1024
; 子进程的最大数量
minprocs=200

; 通过 include 引入其他配置，便于管理
; 可以在 /etc/supervisor/conf.d/ 目录下放置多个程序配置文件
[include]
files = /etc/supervisor/conf.d/*.ini
```

### 5.2 RPC 接口配置 `[rpcinterface:supervisor]`

这是 `supervisord` 守护进程提供给 `supervisorctl` 客户端通信的接口配置。

```ini
[rpcinterface:supervisor]
; Supervisor 默认提供的 RPC 接口
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface
```

### 5.3 客户端配置 `[supervisorctl]`

这是 `supervisorctl` 客户端与 `supervisord` 守护进程通信的配置。

```ini
[supervisorctl]
; RPC 服务器的 Unix 套接字路径
serverurl=unix:///var/run/supervisor.sock
; 或者使用 HTTP 地址 (如果启用了 inet_http_server)
; serverurl=http://127.0.0.1:9001
```

### 5.4 Web UI 配置 `[inet_http_server]` (可选)

如果需要通过 Web 浏览器管理，可以启用此配置。

```ini
[inet_http_server]
port=127.0.0.1:9001  ; 绑定到本地地址和端口
username=user        ; 访问 Web UI 的用户名 (可选)
password=123         ; 访问 Web UI 的密码 (可选)
```

### 5.5 程序配置 `[program:name]`

这是最核心的部分，定义了要管理的每个应用程序。`name` 是程序的唯一标识符。

```ini
[program:my_python_app]
; 进程启动命令
command=/usr/bin/python3 /path/to/my_app.py
; 自动启动
autostart=true
; 自动重启 (false, unexpected, true)
autorestart=true
; 启动失败重试次数，设为0表示无限重试
startretries=3
; 启动后等待多少秒才认为是成功启动 (默认1秒)
startsecs=1
; 进程停止信号 (TERM, HUP, INT, QUIT, KILL)
stopsignal=TERM
; 停止进程时等待的秒数 (默认10秒)
stopwaitsecs=10
; 进程优先级 (越小越优先启动，默认999)
priority=999
; 进程数 (例如，启动3个实例)
numprocs=1
; 运行此程序的用户
user=www-data
; 进程工作目录
directory=/path/to/app/root
; 标准输出日志文件
stdout_logfile=/var/log/supervisor/my_python_app.log
; 标准错误日志文件
stderr_logfile=/var/log/supervisor/my_python_app_error.log
; 日志文件最大大小 (MB), 0表示不限制
stdout_logfile_maxbytes=50MB
stderr_logfile_maxbytes=50MB
; 日志文件保留份数 (当文件达到maxbytes时，旧文件会被备份)
stdout_logfile_backups=10
stderr_logfile_backups=10
; 重启策略，如果该程序退出码非0，则认为是非正常退出，会尝试重启
exitcodes=0,2
; 进程启动的环境变量
environment=PATH="/usr/local/bin:$PATH",ENV_VAR="prod"
```

### 5.6 引入其他配置文件

为了更好地组织配置，通常会在主配置文件中通过 `[include]` 段引入其他目录下的 `.ini` 文件。

例如，在 `/etc/supervisord.conf` 中配置：

```ini
[include]
files = /etc/supervisor/conf.d/*.ini
```
然后，你可以在 `/etc/supervisor/conf.d/` 目录下创建多个独立的配置文件，每个文件定义一个或多个 `[program:name]`。

例如，创建 `/etc/supervisor/conf.d/my_app.ini`：
```ini
; /etc/supervisor/conf.d/my_app.ini
[program:my_python_app]
command=/usr/bin/python3 /path/to/my_app.py
autostart=true
autorestart=true
user=www-data
directory=/path/to/app/root
stdout_logfile=/var/log/supervisor/my_python_app.log
stderr_logfile=/var/log/supervisor/my_python_app_error.log

[program:my_node_worker]
command=/usr/local/bin/node /path/to/worker.js
autostart=true
autorestart=true
user=nodeuser
directory=/path/to/worker/root
stdout_logfile=/var/log/supervisor/my_node_worker.log
```

## 六、常用 `supervisorctl` 命令

配置完成后，使用 `supervisord` 启动守护进程，然后通过 `supervisorctl` 管理程序。

1.  **启动 `supervisord` 守护进程**：
    ```bash
    # 在后台启动 supervisord，并使用指定的配置文件
    supervisord -c /etc/supervisord.conf
    ```
    通常，`supervisord` 会作为系统服务（如 `systemd` 或 `init.d`）的一部分启动，确保它在系统启动时自动运行。

2.  **进入 `supervisorctl` 交互模式**：
    ```bash
    supervisorctl
    ```
    进入交互模式后，你可以直接输入命令，例如 `status`, `start my_app` 等。

3.  **常用命令**：

    *   `status`: 查看所有程序或指定程序的状态。
        ```bash
        supervisorctl status
        # 或者查看特定程序
        supervisorctl status my_python_app
        ```
    *   `start <program_name>`: 启动一个或多个程序。
        ```bash
        supervisorctl start my_python_app
        supervisorctl start all # 启动所有程序
        ```
    *   `stop <program_name>`: 停止一个或多个程序。
        ```bash
        supervisorctl stop my_python_app
        supervisorctl stop all # 停止所有程序
        ```
    *   `restart <program_name>`: 重启一个或多个程序。
        ```bash
        supervisorctl restart my_python_app
        supervisorctl restart all # 重启所有程序
        ```
    *   `reread`: 重新读取配置文件，找出最新的配置。
        ```bash
        supervisorctl reread
        ```
        这个命令只会发现配置文件的变化，但不会应用。

    *   `update`: 在 `reread` 后，应用配置文件的变化（例如添加了新程序或删除了旧程序）。
        ```bash
        supervisorctl update
        ```
        `update` 命令会启动新添加的程序，但不会重启现有程序以应用其配置更改。若要应用现有程序的配置更改，需手动重启它们。

    *   `reload`: 重启 `supervisord` 守护进程及所有受管程序。
        ```bash
        supervisorctl reload
        ```
        此命令会重新加载配置并平滑重启 `supervisord` 和其管理的所有程序。

    *   `shutdown`: 关闭 `supervisord` 守护进程和所有受管程序。
        ```bash
        supervisorctl shutdown
        ```
    *   `tail <program_name> [stdout|stderr]`: 查看程序日志的尾部。
        ```bash
        supervisorctl tail my_python_app
        supervisorctl tail my_python_app stderr
        supervisorctl tail -f my_python_app # 实时跟踪日志
        ```
    *   `fg <program_name>`: 将某个程序切换到前台运行（用于调试）。
        ```bash
        supervisorctl fg my_python_app
        ```

## 七、使用示例

本节将演示如何使用 Supervisor 来管理一个简单的 Python Web 服务器。

### 7.1 准备 Python 应用

创建一个简单的 Flask Web 应用 `app.py`：

```python
# app.py
from flask import Flask
import os
import time

app = Flask(__name__)

@app.route('/')
def hello():
    return f"Hello from Flask app! Running on PID: {os.getpid()}\n"

if __name__ == '__main__':
    print(f"Flask app started on PID: {os.getpid()} at {time.ctime()}")
    app.run(host='0.0.0.0', port=5000)
```

### 7.2 创建 Supervisor 配置文件

在 `/etc/supervisor/conf.d/` 目录下创建一个 `web_app.ini` 文件：

```ini
; /etc/supervisor/conf.d/web_app.ini
[program:flask_app]
command=/usr/bin/python3 /path/to/your/app.py
; 确保替换 /path/to/your/app.py 为实际路径
directory=/path/to/your/app_directory
; 确保替换 /path/to/your/app_directory 为实际路径
autostart=true
autorestart=true
user=www-data ; 建议使用非 root 用户运行
stopsignal=QUIT
stdout_logfile=/var/log/supervisor/flask_app_stdout.log
stderr_logfile=/var/log/supervisor/flask_app_stderr.log
environment=FLASK_APP=app.py,FLASK_ENV=production
```
**注意**: 请将 `/path/to/your/app.py` 和 `/path/to/your/app_directory` 替换为你实际的文件路径。

### 7.3 启动 Supervisor 和应用

1.  **确保 `supervisord` 已启动**：如果尚未启动，请运行 `sudo supervisord -c /etc/supervisord.conf`。
2.  **重新读取并更新配置**：
    ```bash
    sudo supervisorctl reread
    sudo supervisorctl update
    ```
    `update` 命令会自动启动 `flask_app`。

3.  **检查应用状态**：
    ```bash
    sudo supervisorctl status flask_app
    ```
    你将看到类似 `flask_app RUNNING pid 12345, uptime 0:00:10` 的输出。

4.  **测试 Web 应用**：
    在浏览器中访问 `http://your_server_ip:5000` 或使用 `curl`:
    ```bash
    curl http://127.0.0.1:5000
    ```
    应该能看到 "Hello from Flask app!" 的响应。

5.  **模拟程序崩溃并观察自动重启**：
    手动杀死 Flask 应用程序的进程 (例如，使用 `kill -9 <PID>`，其中 PID 是 `supervisorctl status` 显示的 PID)。
    几秒钟后，再次运行 `sudo supervisorctl status flask_app`，你会发现进程已被 Supervisor 自动重启，PID 也发生了变化。

6.  **查看日志**：
    ```bash
    tail -f /var/log/supervisor/flask_app_stdout.log
    ```
    你将看到 Flask 应用的启动信息和请求日志。

## 八、总结

Supervisor 是一个功能强大且易于使用的进程管理工具，它解决了在类 Unix 系统中管理后台应用程序的诸多痛点。通过提供：

*   **进程守护和自动重启**，极大地提高了服务的可用性。
*   **集中化的配置和管理**，简化了多进程应用程序的部署和运维。
*   **详细的日志记录**，便于故障排查和性能监控。

无论是简单的 Python 脚本、复杂的 Web 应用还是各种后台工作进程，Supervisor 都能提供可靠的运行时保障，是现代服务器环境中的一项重要利器。
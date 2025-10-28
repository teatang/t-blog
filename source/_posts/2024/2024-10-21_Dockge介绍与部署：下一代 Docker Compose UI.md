---
title: Dockge介绍与部署：下一代 Docker Compose UI
date: 2024-10-21 06:24:00
tags:
  - 2024
  - Docker
  - NAS
categories:
  - Docker
---

> 如果你经常使用 Docker Compose 来管理容器应用，并且厌倦了命令行界面，或者觉得 Portainer 过于庞大复杂，那么 **Dockge** 可能会成为你的新宠。Dockge 是一个轻量级、直观且专注于 Docker Compose 的 Web UI 工具，它旨在简化 Docker Compose 项目的创建、编辑、部署和管理，让你能够更高效地维护你的容器化服务。

{% note info %}
“好的工具让复杂的事情变得简单，Dockge 就是让 Docker Compose 更友好的工具。”
{% endnote %}
------

## 一、Dockge 是什么？

Dockge 是一个开源的 Docker Compose 管理工具，它提供了一个简洁的 Web 界面，让你可以：

*   **可视化管理 Docker Compose 项目**：轻松查看所有 Docker Compose 堆栈（Stack）的状态。
*   **在线编辑 `docker-compose.yml` 文件**：直接在浏览器中编辑并保存更改，无需 SSH 到服务器。
*   **一键部署和管理堆栈**：启动、停止、重启、删除整个 Docker Compose 堆栈。
*   **查看容器日志**：实时查看容器的输出日志。
*   **管理容器卷**：查看和操作容器创建的卷。
*   **简单易用**：专注于 Docker Compose 核心功能，没有过多的额外负担。

**核心特点：**

*   **轻量级**：安装和运行资源占用极低。
*   **易上手**：界面直观，功能聚焦。
*   **命令行友好**：底层依然是调用 Docker Compose 命令，所有操作都能通过 UI 完成，但也允许你在需要时介入命令行。
*   **安全**：支持多用户管理和权限控制（计划中或高级配置）。
*   **Docker 原生**：直接与 Docker 后台通信。

## 二、为什么选择 Dockge？

*   **厌倦了 SSH 和 Vim？**：如果你的服务器上没有 VIM 或 Nano 等顺手的编辑器，或者你不喜欢在命令行中编辑 YAML 文件，Dockge 提供了一个方便的浏览器内编辑器。
*   **追求轻量化**：Portainer 固然强大，但对于只关注 Docker Compose 的用户来说，可能显得过于复杂和臃肿。Dockge 更专注于此，提供更精简的体验。
*   **团队协作**：方便团队成员共同管理 Docker Compose 项目，无需每个人都熟悉 SSH 和命令行操作。
*   **简化自动化**：结合 GitHub Actions 或其他 CI/CD 工具，可以实现无人值守的部署更新。
*   **个人服务器管理**：对于个人 Homelab 或小型服务器用户，Dockge 是一个极佳的控制面板。

## 三、部署 Dockge

Dockge 推荐使用 Docker Compose 自身来部署。

### 1. 先决条件

*   一台运行 **Linux** 的服务器（支持 Docker Desktop for Windows/macOS，但通常用于服务器）
*   已安装 **Docker** 和 **Docker Compose** (或 Docker CLI 的 `compose` 插件)。
    *   可以通过 `docker --version` 和 `docker compose version` (或 `docker-compose --version`) 检查。

### 2. 部署步骤

#### 步骤 1：创建 Dockge 的数据目录

首先，创建一个目录来存储 Dockge 的配置数据和 `docker-compose.yml` 文件。这个目录我们将称之为 `stacks` 目录。

通过 SSH 连接到你的服务器：

```bash
mkdir -p /opt/stacks
```

#### 步骤 2：创建 Docker Compose 文件

进入刚刚创建的目录，并创建一个 `docker-compose.yml` 文件来部署 Dockge 本身。

```bash
cd /opt/stacks
nano docker-compose.yml # 或者其他你喜欢的编辑器，如 vi
```

将以下内容粘贴到 `docker-compose.yml` 文件中：

```yaml
version: "3.8"
services:
  dockge:
    image: louislam/dockge:1 # 使用最新的 Dockge 镜像
    container_name: dockge
    restart: unless-stopped
    ports:
      - 5001:5001 # Dockge web UI 默认运行在 5001 端口
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock # 必须挂载 Docker Vsock, 允许 Dockge 与 Docker Daemon 通信
      - ./data:/app/data                          # Dockge 自身的数据存储 (包括登录信息等)
      - /opt/stacks:/opt/stacks                   # 你的 Docker Compose 项目（堆栈）存放目录。此目录将被 Dockge 管理。
    environment:
      # PUID = 1000 and PGID = 100 usually for default user.
      # Check your ID (id <your_username>) and modify if necessary.
      # - PUID=1000 # 容器内用户ID，通常是 default user，可能需要根据自己系统的用户ID调整
      # - PGID=100  # 容器内用户组ID，通常是 users group，可能需要根据自己系统的用户组ID调整
      - TZ=Asia/Shanghai # 设置时区
      - DOCKGE_STACKS_DIR=/opt/stacks
```

**重要说明：**

*   `image: louislam/dockge:latest`：确保你拉取的是最新的 Dockge 镜像。
*   `ports: - 5001:5001`：将容器的 5001 端口映射到主机的 5001 端口。你可以根据需要更改主机端口。
*   `volumes:`
    *   `/var/run/docker.sock:/var/run/docker.sock`：**这是 Dockge 能够与 Docker Daemon 通信的关键。** 这是一个特权挂载，请确保你理解其潜在的安全风险。
    *   `./data:/app/data`：这是 Dockge 存储自身配置和持久化数据的地方。`./data` 会在 `/opt/stacks/data` 中创建。
    *   `/opt/stacks:/app/stacks`：**这是 Dockge 管理你的所有 Docker Compose 项目的核心目录。** 在此目录下的所有子目录中，如果包含 `docker-compose.yml` 文件，Dockge 都会将其识别为一个堆栈。
*   `PUID` 和 `PGID`：为了确保 Dockge 容器内的进程拥有正确的权限来读写主机的 `/opt/stacks` 目录。
    *   你可以通过 SSH 登录服务器后，运行 `id your_username` 命令来查看你当前用户的 `uid` (`PUID`) 和 `gid` (`PGID`)。
    *   对于大多数 Linux 发行版，默认用户的 `uid=1000`, `gid=1000` (或 `gid=100` for `users` group)。请根据实际情况进行调整。

保存并关闭文件。

#### 步骤 3：启动 Dockge 容器

在 `/opt/stacks` 目录下，执行以下命令来启动 Dockge：

```bash
sudo docker compose up -d
```

*   `docker compose up`：根据 `docker-compose.yml` 文件创建并启动服务。（旧版本 Docker 可能需要用 `docker-compose` 命令）
*   `-d`：表示在后台运行容器。

如果一切顺利，Dockge 容器应该已经启动并运行。

#### 步骤 4：检查容器状态

```bash
sudo docker ps -a | grep dockge
```

你应该看到 `dockge` 容器的状态是 `Up ...`。

#### 步骤 5：访问 Dockge Web UI

打开你的浏览器，访问 `http://你的服务器IP:5001`。

首次访问时，你需要创建一个管理员用户：

1.  输入用户名。
2.  输入密码。
3.  点击 `创建`。

登录后，你将看到 Dockge 的主界面。由于我们刚刚将 `/opt/stacks` 目录映射为 Dockge 的 `stacks` 目录，Dockge 应该会自动检测到在你创建 `docker-compose.yml` 文件的当前目录下的一个叫做 `dockge` 的堆栈。

### 3. 多堆栈管理示例

Dockge 的强大之处在于管理多个 Docker Compose 堆栈。

假设你现在想在服务器上部署一个 `Nginx` 服务。

1.  **在 `/opt/stacks` 目录下创建一个新的子目录**（例如 `nginx`）：
    ```bash
    mkdir -p /opt/stacks/nginx
    cd /opt/stacks/nginx
    ```
2.  **创建 `docker-compose.yml` 文件**：
    ```bash
    nano docker-compose.yml
    ```
    粘贴如下 Nginx 服务的 Docker Compose 配置：
    ```yaml
    version: '3.8'
    services:
      nginx:
        image: nginx:latest
        container_name: my-nginx
        restart: unless-stopped
        ports:
          - "80:80"        # 映射主机80端口到容器80端口
          - "443:443"      # 映射主机443端口到容器443端口
        volumes:
          - ./nginx.conf:/etc/nginx/nginx.conf:ro # 挂载自定义Nginx配置
          - ./html:/usr/share/nginx/html:ro       # 挂载静态网页文件
        environment:
          - PUID=1000
          - PGID=100
          - TZ=Asia/Shanghai
    ```
    保存并关闭文件。

3.  **在 Dockge UI 中刷新**：
    返回 Dockge 的 Web 界面，你会在左侧的导航栏或主界面的堆栈列表中看到多一个名为 `nginx` 的堆栈。
    *   点击 `nginx` 堆栈，你可以查看其详情。
    *   点击绿色的 `Up` 按钮，Dockge 就会拉取 Nginx 镜像并启动容器。

通过这种方式，你可以在一个集中的界面管理你的各种服务，每个服务都拥有独立的 `docker-compose.yml` 文件。

## 四、Dockge 界面功能速览

*   **Stacks (堆栈)**：列出所有检测到的 Docker Compose 项目。可以一键启动、停止、重启、删除（包括强制删除）。
*   **Edit (编辑)**：直接在浏览器中打开 `docker-compose.yml` 文件进行编辑，支持语法高亮和基本的错误检查。编辑后会提示你保存并应用更改。
*   **Logs (日志)**：查看堆栈中所有容器的实时日志。
*   **Settings (设置)**：配置 Dockge 本身的一些行为，例如用户管理（未来功能）、主题等。
*   **更新 Dockge**：在 Dockge UI 内部，你通常可以找到一个按钮来更新 Dockge 自身到最新版本。

## 五、总结与展望

Dockge 是一个非常有前景的 Docker Compose Web UI 工具。它专注于核心功能，提供了简洁直观的用户体验，非常适合那些希望通过图形界面来管理 Docker Compose 堆栈的个人开发者或小型团队。

如果你正在寻找一个轻量级、功能强大且易于使用的 Docker Compose 管理工具，那么 Dockge 绝对值得一试。它能帮你告别繁琐的命令行操作，让 Docker 容器的部署和管理变得更加轻松愉悦。

开始使用 Dockge 吧，让你的容器管理效率更上一层楼！
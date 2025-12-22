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

> **Dockge** 是一个现代化、用户友好的 **Docker Compose 管理 Web UI**，旨在简化 Docker Compose 栈的部署、管理和监控。它提供了一个直观的图形界面，让用户能够通过浏览器轻松地创建、编辑、部署、启动、停止和监控他们的 `docker-compose.yml` 文件所定义的容器服务。Dockge 特别适用于需要方便地管理多个 Compose 栈，或不习惯命令行操作的场景。

{% note info %}
核心思想：**将 Docker Compose 的命令行操作图形化，提供实时反馈和集中管理能力。**
{% endnote %}

------

## 一、为什么需要 Dockge？

Docker Compose 是管理多容器 Docker 应用程序的强大工具，但其操作主要依赖命令行。对于不熟悉 CLI 的用户，或需要同时管理大量 Compose 栈的场景，命令行操作可能显得繁琐且效率低下。Dockge 旨在解决这些痛点：

1.  **图形化操作**：提供直观的 Web 界面，替代复杂的命令行输入。
2.  **实时日志与状态**：方便用户查看容器的实时日志和运行状态。
3.  **集中管理**：在一个界面中管理所有 `docker-compose.yml` 文件定义的栈。
4.  **文件编辑**：直接在浏览器中编辑和保存 `docker-compose.yml` 文件。
5.  **易于部署**：自身也是一个 Docker 容器，通过简单的 `docker-compose.yml` 即可快速部署。
6.  **安全重构**：提供一个“安全网”，允许用户在修改 Compose 文件后，先查看差异再应用更改。

## 二、Dockge 的核心功能

Dockge 提供了一系列功能来增强 Docker Compose 的使用体验：

*   **栈管理**：
    *   **创建/部署新栈**：通过界面上传或直接编写 `docker-compose.yml` 文件来创建新栈。
    *   **启动/停止/重启/删除栈**：对整个 Compose 栈进行生命周期管理。
    *   **查看栈状态**：清晰展示每个服务和容器的运行状态。
*   **文件编辑器**：
    *   内置支持 YAML 语法高亮的编辑器，方便直接在浏览器中修改 `docker-compose.yml` 文件。
    *   支持版本控制（通过 Git 集成）和更改预览。
*   **容器日志**：
    *   实时流式传输每个容器的日志输出。
    *   支持日志搜索和筛选。
*   **容器操作**：
    *   执行单个容器的启动、停止、重启。
    *   连接到容器的终端 (Terminal)。
*   **文件浏览器**：
    *   在 Web UI 中浏览和管理栈目录下的文件。
*   **模板/App Store**：
    *   提供预定义的 Compose 栈模板，方便快速部署常用服务（如 Portainer、数据库、Web 服务器等）。
*   **系统信息**：
    *   显示 Docker 主机的基本信息、资源使用情况等。

## 三、Dockge 的工作原理

Dockge 本质上是一个运行在 Docker 容器中的 Web 应用程序。它通过挂载 Docker Unix Socket (`/var/run/docker.sock`) 来与宿主机上的 Docker Daemon 进行通信。

{% mermaid %}
graph TD
    A[Client Browser] -->|HTTP/HTTPS| B(Dockge Web UI Container)
    B -->|"Docker API (via <br>/var/run/docker.sock)"| C(Docker Daemon on Host)
    C --> D(Managed Docker <br>Containers/Stacks on Host)
{% endmermaid %}

**关键概念定义：**

*   **Docker Daemon**：Docker 的核心组件，负责构建、运行和管理 Docker 容器。
*   **Docker Compose**：用于定义和运行多容器 Docker 应用程序的工具。它使用 YAML 文件来配置应用程序的服务、网络和卷。
*   **Docker Unix Socket (`/var/run/docker.sock`)**：Docker Daemon 提供的一个本地 API 接口，允许其他应用程序通过这个 socket 与 Daemon 进行通信，执行 Docker 命令。Dockge 通过访问这个 socket 来管理 Docker 容器。

## 四、安装 Dockge

Dockge 推荐通过 Docker Compose 自身进行部署。以下是标准的安装步骤。

### 4.1 准备工作

1.  确保您的系统已安装 Docker 和 Docker Compose。
2.  创建一个目录来存放 Dockge 的 `docker-compose.yml` 文件和相关配置。例如：
    ```bash
    mkdir -p ~/dockge
    cd ~/dockge
    ```

### 4.2 创建 `docker-compose.yml` 文件

在 `~/dockge` 目录下创建 `docker-compose.yml` 文件，内容如下：

```yaml
# ~/dockge/docker-compose.yml
version: "3.8"
services:
  dockge:
    image: louislam/dockge:latest
    container_name: dockge
    restart: unless-stopped
    ports:
      - 5001:5001 # Dockge Web UI 端口
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock # 允许 Dockge 与 Docker Daemon 通信
      - ./data:/app/data # Dockge 自身的数据存储 (配置, 日志等)
      - ~/stacks:/opt/stacks # 存放所有你的 docker-compose.yml 文件的目录
    environment:
      # Dockge 的环境变量 (可选)
      - DOCKGE_PASSWORD=your_secure_password # 设置你的 Dockge 登录密码
      # - DOCKGE_USERNAME=admin # 默认用户名为 admin
      # - DOCKGE_PORT=5001 # 默认端口
```

**解释：**

*   `image: louislam/dockge:latest`：使用最新的 Dockge 官方镜像。
*   `container_name: dockge`：指定容器名称。
*   `ports: - 5001:5001`：将宿主机的 5001 端口映射到容器的 5001 端口，用于访问 Web UI。
*   `volumes:`：
    *   `/var/run/docker.sock:/var/run/docker.sock`：**核心配置**，允许 Dockge 容器访问宿主机的 Docker Daemon。
    *   `./data:/app/data`：将宿主机当前目录下的 `data` 文件夹挂载到容器内部，用于存储 Dockge 自身的配置和数据。
    *   `~/stacks:/opt/stacks`：将宿主机的 `~/stacks` 目录（你可以替换为任何你希望存放 Compose 文件的目录）挂载到容器内部的 `/opt/stacks`。Dockge 会在这个目录中查找和管理你的 Compose 栈。**请务必替换 `~/stacks` 为你实际的目录路径。**
*   `environment:`：设置 Dockge 的环境变量，例如 `DOCKGE_PASSWORD` 用于设置登录密码，提高安全性。

### 4.3 启动 Dockge

在 `~/dockge` 目录下执行以下命令来启动 Dockge 容器：

```bash
docker compose up -d
```

`up` 命令会创建并启动服务，`-d` 参数表示在后台运行。

### 4.4 访问 Dockge Web UI

安装完成后，打开浏览器，访问 `http://<Your_Server_IP_or_Hostname>:5001`。
如果你在 `docker-compose.yml` 中设置了 `DOCKGE_PASSWORD`，系统会提示你输入密码登录。

## 五、使用 Dockge 管理 Docker Compose 栈

### 5.1 创建你的第一个 Compose 栈

假设你希望部署一个简单的 Go Web 应用，它暴露在 8080 端口。

1.  **在宿主机创建栈目录**：在之前配置的 `~/stacks` 目录下创建一个新的子目录，例如 `my-go-app`。
    ```bash
    mkdir -p ~/stacks/my-go-app
    ```
2.  **准备 Go 应用代码和 Dockerfile**：
    `~/stacks/my-go-app/main.go`
    ```go
    package main

    import (
    	"fmt"
    	"log"
    	"net/http"
    )

    func handler(w http.ResponseWriter, r *http.Request) {
    	fmt.Fprintf(w, "Hello from Go App running via Dockge! Path: %s\n", r.URL.Path)
    }

    func main() {
    	http.HandleFunc("/", handler)
    	port := "8080"
    	log.Printf("Go App listening on port %s", port)
    	log.Fatal(http.ListenAndServe(":"+port, nil))
    }
    ```
    `~/stacks/my-go-app/Dockerfile`
    ```dockerfile
    FROM golang:1.21-alpine
    WORKDIR /app
    COPY . .
    RUN go mod init example.com/my-go-app || true # Initialize go module, ignore error if already exists
    RUN go mod tidy
    RUN go build -o /my-go-app
    EXPOSE 8080
    CMD ["/my-go-app"]
    ```
3.  **在 Dockge 中创建 `docker-compose.yml`**：
    *   在 Dockge UI 中，点击左侧导航栏的 **"Stacks"**。
    *   点击右上角的 **"New Stack"** 或选择你刚刚创建的 `my-go-app` 目录。
    *   在文件编辑器中输入以下 `docker-compose.yml` 内容：
        ```yaml
        # ~/stacks/my-go-app/docker-compose.yml
        version: '3.8'
        services:
          go-web-app:
            build: . # Dockerfile 位于当前目录 (my-go-app)
            ports:
              - "8081:8080" # 将宿主机的 8081 端口映射到容器的 8080 端口
            volumes:
              - ./main.go:/app/main.go # 如果需要热重载或其他文件同步，可以这样挂载
              - ./Dockerfile:/app/Dockerfile
            restart: unless-stopped
            environment:
              - APP_PORT=8080
        ```
    *   点击 **"Save"** 保存文件。

### 5.2 部署和管理栈

1.  **部署**：在文件编辑器保存后，点击界面上的 **"Up"** 按钮，Dockge 会执行 `docker compose up -d` 操作，构建镜像并启动服务。你可以实时看到构建和启动日志。
2.  **查看日志**：在栈详情页面，你可以看到 `go-web-app` 服务的实时日志。
3.  **访问应用**：部署成功后，你可以通过 `http://<Your_Server_IP_or_Hostname>:8081` 访问你的 Go Web 应用。
4.  **停止/重启/删除**：界面上会有相应的按钮，方便你对整个栈或单个服务进行操作。

## 六、Dockge 与其他 Docker Web UIs 的比较 (简要)

*   **Portainer**：功能更强大，提供了更细粒度的容器、镜像、网络、卷等管理功能，支持 Swarm、Kubernetes 等编排工具，但其主要焦点是 Docker 本身，Compose 管理相对次要。Portainer 适合需要全面 Docker 管理的企业级或复杂环境。
*   **Dockge**：专注于 Docker Compose 栈的管理，界面简洁直观，实时日志和文件编辑是亮点。它更轻量，学习成本低，非常适合个人开发者、小型团队或仅需要管理 Compose 服务的场景。

Dockge 的优势在于其**专注性和简洁性**，它不是一个大而全的 Docker 管理工具，而是致力于把 Docker Compose 管理做到极致，提供流畅的用户体验。

## 七、安全性考虑

*   **访问控制**：务必设置 `DOCKGE_PASSWORD` 环境变量，为 Dockge UI 添加访问密码，防止未经授权的访问。
*   **网络安全**：如果将 Dockge 暴露到公共网络，请确保使用 HTTPS 进行加密传输，并考虑通过反向代理（如 Nginx, Caddy）来管理访问。
*   **权限最小化**：Dockge 需要访问 Docker Socket，这意味着它拥有与 Docker Daemon 几乎相同的权限。请确保只有受信任的用户才能访问 Dockge。不要将 Dockge 暴露给不可信的环境。

## 八、总结

Dockge 为 Docker Compose 用户提供了一个现代化、高效且易于使用的图形界面，极大地简化了多容器应用的部署和管理。通过其直观的栈管理、实时日志、内置文件编辑器以及模板支持，Dockge 成为了个人开发者和小型团队管理其 Docker Compose 服务的理想选择。它不仅提升了开发效率，也降低了 Docker Compose 的使用门槛，让更多用户能够享受到容器化带来的便利。
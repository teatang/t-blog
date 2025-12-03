---
title: Dockerfile 常用指令详解
date: 2023-04-23 06:24:00
tags: 
    - 2023
    - Docker
    - 容器技术
categories: Docker
---

> **Dockerfile** 是一个文本文件，其中包含了用户可以在命令行上调用以组装映像的所有命令。Docker 读取 `Dockerfile` 中的指令并自动构建镜像。通过 `Dockerfile`，你可以构建可移植、可复用、可共享的 Docker 镜像，这对于实现应用程序的容器化、简化部署流程和CI/CD（持续集成/持续部署）至关重要。

{% note info %}
核心思想：
`Dockerfile` 提供了一种**声明式**的方式来定义 Docker 镜像的构建过程。通过一系列指令，它描述了如何从一个基础镜像开始，逐步添加文件、安装软件、配置环境、暴露端口，最终形成一个可运行的、自包含的应用程序镜像。
{% endnote %}

------

## 一、Dockerfile 基础概念

1.  **镜像 (Image)**：是 Docker 容器的只读模板，包含了运行某个软件所需的一切，包括代码、运行时、库、环境变量和配置文件。镜像通过 `Dockerfile` 构建。
2.  **容器 (Container)**：是镜像的运行实例。容器是轻量级、独立的、可执行的软件包，包含应用程序及其所有依赖。
3.  **层 (Layer)**：Docker 镜像由一系列只读层（Layer）组成。`Dockerfile` 中的每条指令都会创建一个新的层。这些层是可重用的，并且优化了镜像的存储和传输效率。
4.  **构建上下文 (Build Context)**：当执行 `docker build` 命令时，它会将本地的特定目录（通常是 `Dockerfile` 所在的目录）发送给 Docker Daemon。这个目录中的所有文件和子目录构成了构建上下文。`COPY` 和 `ADD` 指令只能引用构建上下文中的内容。

## 二、Dockerfile 常用指令详解

`Dockerfile` 由一系列指令和参数组成。以下是常用的 `Dockerfile` 指令及其详细说明。

### 2.1 FROM

*   **语法**：`FROM <image>[:<tag>] [AS <name>]`
*   **用途**：指定构建新镜像所基于的**基础镜像**。`Dockerfile` 的第一条指令通常是 `FROM`。
*   **说明**：基础镜像可以是 Docker Hub 上的官方镜像，也可以是自己构建的其他镜像。`<tag>` 默认为 `latest`。
*   **示例**：
    ```dockerfile
    FROM ubuntu:22.04 # 基于 Ubuntu 22.04 镜像
    FROM alpine/git:latest AS git-tool # 使用带 Git 工具的 Alpine 镜像，并命名阶段
    ```

### 2.2 LABEL

*   **语法**：`LABEL <key>=<value> [<key>=<value> ...]`
*   **用途**：为镜像添加元数据 (Metadata)。
*   **说明**：这些元数据可以是作者信息、版本号、描述等，可以提高镜像的可管理性。
*   **示例**：
    ```dockerfile
    LABEL author="Your Name <your.email@example.com>"
    LABEL version="1.0"
    LABEL description="This is a sample Node.js application image."
    ```

### 2.3 RUN

*   **语法**：
    *   `RUN <command>` (shell 格式，命令在 `/bin/sh -c` 中运行)
    *   `RUN ["executable", "param1", "param2"]` (exec 格式，推荐使用，避免 shell 解释器问题)
*   **用途**：在当前镜像层上执行命令行命令，并生成一个新的镜像层。
*   **说明**：`RUN` 指令常用于安装软件包、创建目录、下载文件等。每个 `RUN` 命令都会创建一个新的镜像层，因此为了优化镜像大小，最好将多个相关联的命令链式组合为一个 `RUN` 指令。
*   **示例**：
    ```dockerfile
    # shell 格式
    RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        curl \
        && rm -rf /var/lib/apt/lists/*
  
    # exec 格式 (用于更明确地控制命令执行)
    RUN ["/bin/bash", "-c", "echo Hello Docker"]
    ```

### 2.4 COPY

*   **语法**：`COPY <src>... <dest>` 或 `COPY ["<src>",... "<dest>"]`
*   **用途**：将**构建上下文目录**中的文件或目录复制到镜像中的指定路径。
*   **说明**：`<src>` 是相对于构建上下文的路径，`<dest>` 是镜像中的绝对路径或工作目录 (WORKDIR) 相对路径。`COPY` 智能处理文件权限。
*   **示例**：
    ```dockerfile
    COPY . /app      # 将构建上下文中的所有内容复制到镜像的 /app 目录
    COPY src/main.go /app/main.go # 复制单个文件
    COPY --chown=user:group myapp /opt/myapp # 复制文件并改变所有者
    ```

### 2.5 ADD

*   **语法**：`ADD <src>... <dest>` 或 `ADD ["<src>",... "<dest>"]`
*   **用途**：与 `COPY` 类似，但具有额外功能。
*   **说明**：
    1.  如果 `<src>` 是一个可识别的压缩文件 (如 `.tar`, `.gz`, `.xz`)，`ADD` 会自动解压缩到 `<dest>`。
    2.  如果 `<src>` 是一个 URL，`ADD` 会下载该 URL 的内容到 `<dest>`。
    由于其自动解压缩和 URL 下载功能，通常推荐优先使用 `COPY`，因为它更透明，更易于理解。`ADD` 的额外功能在某些特定场景下有用，但在很多情况可能并非期望行为。
*   **示例**：
    ```dockerfile
    ADD http://example.com/latest.tar.gz /app/ # 下载并解压缩
    ADD myarchive.tar.gz /app/                   # 复制并解压缩
    ```

### 2.6 WORKDIR

*   **语法**：`WORKDIR /path/to/workdir`
*   **用途**：设置在 `RUN`, `CMD`, `ENTRYPOINT`, `COPY`, `ADD` 等指令执行时的工作目录。
*   **说明**：如果指定的目录不存在，`WORKDIR` 会自动创建它。一个 `Dockerfile` 中可以有多个 `WORKDIR` 指令，后续指令都会基于最新的 `WORKDIR`。
*   **示例**：
    ```dockerfile
    WORKDIR /app
    COPY . . # 此时的 . 指的是 /app
    RUN pwd  # 输出 /app
    ```

### 2.7 EXPOSE

*   **语法**：`EXPOSE <port> [<port>/<protocol> ...]`
*   **用途**：通知 Docker 容器在运行时会监听哪些端口。
*   **说明**：`EXPOSE` 仅仅是声明，它不会实际发布端口。要在运行容器时将容器端口映射到主机端口，需要使用 `docker run -p` 选项。
*   **示例**：
    ```dockerfile
    EXPOSE 80 # 声明容器会监听 TCP 80 端口
    EXPOSE 80/tcp 443/udp # 声明 TCP 80 和 UDP 443 端口
    ```

### 2.8 ENV

*   **语法**：`ENV <key>=<value> [<key>=<value> ...]`
*   **用途**：设置环境变量。
*   **说明**：环境变量在构建时和容器运行时都可用。它们可以用于配置应用程序行为、路径等。
*   **示例**：
    ```dockerfile
    ENV MY_VAR="hello world"
    ENV PATH="/usr/local/go/bin:${PATH}" # 添加到 PATH
    ```

### 2.9 ARG

*   **语法**：`ARG <name>[=<default value>]`
*   **用途**：定义一个构建时变量，可在 `docker build` 命令中使用 `--build-arg` 参数来传递其值。
*   **说明**：`ARG` 变量只在镜像构建过程中有效，容器运行时不可用。
*   **示例**：
    ```dockerfile
    ARG VERSION=1.0
    RUN echo "Building version $VERSION"
    # 构建时: docker build --build-arg VERSION=2.0 -t myapp .
    ```

### 2.10 CMD

*   **语法**：
    *   `CMD ["executable","param1","param2"]` (exec 格式，推荐)
    *   `CMD ["param1","param2"]` (作为 ENTRYPOINT 的默认参数)
    *   `CMD command param1 param2` (shell 格式)
*   **用途**：为执行容器化应用程序提供默认命令。
*   **说明**：
    *   一个 `Dockerfile` 中只能有一条 `CMD` 指令。如果有多条，只有最后一条生效。
    *   `CMD` 用于设置容器启动时要执行的**默认命令**。
    *   如果 `docker run` 命令明确指定了命令，则 `CMD` 指定的默认命令会被覆盖。
    *   通常与 `ENTRYPOINT` 结合使用。
*   **示例**：
    ```dockerfile
    CMD ["nginx", "-g", "daemon off;"] # 启动 Nginx
    ```

### 2.11 ENTRYPOINT

*   **语法**：
    *   `ENTRYPOINT ["executable", "param1", "param2"]` (exec 格式，推荐)
    *   `ENTRYPOINT command param1 param2` (shell 格式)
*   **用途**：配置一个容器作为可执行程序运行。
*   **说明**：
    *   一个 `Dockerfile` 中只能有一条 `ENTRYPOINT` 指令。
    *   `ENTRYPOINT` 设置的命令始终会被执行，即使 `docker run` 命令指定了其他参数。
    *   当 `ENTRYPOINT` 使用 exec 格式时，`CMD` 指令会被添加为 `ENTRYPOINT` 的参数。这使其成为一个可配置的命令。
*   **示例**：
    ```dockerfile
    ENTRYPOINT ["/usr/bin/supervisord", "-n"] # 始终以 supervisord 启动
    ```
    配合 `CMD` 的示例：
    ```dockerfile
    ENTRYPOINT ["/usr/local/bin/my-app"]
    CMD ["--config", "/etc/my-app/config.json"] # CMD 是ENTRYPOINT的默认参数
    # 如果运行 `docker run my-image --port 8080`, 则实际执行 `/usr/local/bin/my-app --port 8080`
    ```

### 2.12 VOLUME

*   **语法**：`VOLUME ["/data"]` 或 `VOLUME /var/log`
*   **用途**：创建一个挂载点，将一个或多个指定的路径声明为外部挂载卷。
*   **说明**：
    *   用于持久化容器数据，或在容器和主机之间共享数据。
    *   当容器启动时，如果主机没有为该路径显式挂载卷，Docker 会自动创建一个匿名卷并挂载到此路径。
    *   `VOLUME` 指令通常用于指定应该被外部挂载的目录，以避免数据丢失和方便共享。
*   **示例**：
    ```dockerfile
    VOLUME /var/lib/mysql # 声明 /var/lib/mysql 是一个卷，用于数据库持久化
    ```

### 2.13 USER

*   **语法**：`USER <user>[:<group>]`
*   **用途**：设置执行后续 `RUN`, `CMD`, `ENTRYPOINT` 指令时使用的用户或用户组。
*   **说明**：通常建议在容器中以非 root 用户运行应用程序，以增强安全性。
*   **示例**：
    ```dockerfile
    RUN groupadd -r appuser && useradd -r -g appuser appuser
    USER appuser # 后续命令以 appuser 用户身份运行
    ```

### 2.14 HEALTHCHECK

*   **语法**：`HEALTHCHECK [OPTIONS] CMD command` (通过运行命令来检查)
    `HEALTHCHECK NONE` (禁用继承来的健康检查)
*   **用途**：配置如何检测容器是否处于健康状态（即应用程序是否正常运行）。
*   **说明**：当容器持续失败健康检查时，Docker 会将其状态标记为 `unhealthy`。这对于自动化管理（例如，在发现不健康容器时重启或将其从负载均衡中移除）非常有用。
*   **选项**：
    *   `--interval=DURATION` (默认 `30s`): 两次检查的间隔时间。
    *   `--timeout=DURATION` (默认 `30s`): 单次检查的超时时间。
    *   `--start-period=DURATION` (默认 `0s`): 容器启动后，在开始执行健康检查命令之前，需要等待的初始化时间。
    *   `--retries=N` (默认 `3`): 在将容器标记为 `unhealthy` 之前，允许失败的重试次数。
*   **示例**：
    ```dockerfile
    HEALTHCHECK --interval=5m --timeout=3s \
      CMD curl -f http://localhost/ || exit 1 # 每5分钟检查一次，超时3秒，如果 curl 失败则退出
    ```

### 2.15 ONBUILD

*   **语法**：`ONBUILD <Dockerfile instruction>`
*   **用途**：添加一个触发器指令到镜像。当此镜像作为其他镜像的基础镜像时，这些触发器指令将被执行。
*   **说明**：`ONBUILD` 指令在当前镜像构建时不做任何操作。它只在将当前镜像作为 `FROM` 语句的基础镜像时被触发和执行。
*   **示例**：
    ```dockerfile
    # 在父镜像 Dockerfile 中
    ONBUILD COPY . /app/src
    ONBUILD RUN /usr/local/bin/build-scripts/app-builder

    # 当从此父镜像构建子镜像时
    FROM my-base-image:1.0
    # 此时，上述的 COPY 和 RUN 指令会被自动执行
    ```

### 2.16 SHELL

*   **语法**：`SHELL ["executable", "parameters"]`
*   **用途**：设置 `RUN`, `CMD`, `ENTRYPOINT` 的 shell 格式指令的默认 shell。
*   **说明**：默认是 `["/bin/sh", "-c"]` (Linux) 或 `["cmd", "/S", "/C"]` (Windows)。可以修改为 `["/bin/bash", "-c"]` 来使用 Bash 特性，例如更复杂的管道操作和变量扩展。
*   **示例**：
    ```dockerfile
    SHELL ["/bin/bash", "-c"]
    RUN echo "Running with Bash in $PWD"
    ```

### 2.17 STOPSIGNAL

*   **语法**：`STOPSIGNAL signal`
*   **用途**：设置发送给容器以终止它的系统调用信号。
*   **说明**：默认是 `SIGTERM`。可以更改为其他信号，如 `SIGKILL`，但这通常不推荐，因为 `SIGKILL` 无法被应用程序捕获，可能导致数据丢失。合适的信号允许应用程序优雅关闭。
*   **示例**：
    ```dockerfile
    STOPSIGNAL SIGQUIT
    ```

### 2.18 MAINTAINER (已废弃)

*   **用途**：指定镜像的维护者信息。
*   **说明**：已经被 `LABEL` 指令取代。
*   **示例**：
    `MAINTAINER Your Name <your.email@example.com>` (不推荐使用)
    应替换为 `LABEL maintainer="Your Name <your.email@example.com>"`

## 三、Docker 镜像构建过程和最佳实践

### 3.1 镜像构建流程示意图

{% mermaid %}
graph TD
    A[开始 Docker Build] --> B{读取 Dockerfile}
    B --> C[FROM: 选择基础镜像]
    C --> D[RUN: 执行命令, 如安装依赖]
    D --> E[COPY/ADD: 复制文件到镜像]
    E --> F[WORKDIR: 设置工作目录]
    F --> G[ENV/ARG: 配置环境变量/构建变量]
    G --> H[EXPOSE: 声明端口]
    H --> I[CMD/ENTRYPOINT: 定义容器启动命令]
    I --> J[构建完成, 生成新镜像]
{% endmermaid %}

### 3.2 镜像构建最佳实践

遵循以下最佳实践可以帮助你构建更小、更安全、更高效的 Docker 镜像。

1.  **选择合适的基础镜像**：
    *   优先使用官方镜像，它们通常更稳定、更安全。
    *   选择最小化的基础镜像，如 `alpine` 系列 (基于 Alpine Linux)，以减小镜像体积和攻击面。例如，对于 Go 应用，可以直接使用 `scratch` (完全空白镜像) 或 `alpine`。
2.  **利用多阶段构建 (Multi-stage Builds)**：
    *   将构建过程（编译代码、安装开发工具）与最终运行时的镜像隔离开来。
    *   只将最终的、编译好的应用程序和其运行时依赖复制到最终的轻量级镜像中。
    *   **示例**：
        ```dockerfile
        # 构建阶段
        FROM golang:1.20 AS builder
        WORKDIR /app
        COPY go.mod go.sum ./
        RUN go mod download
        COPY . .
        RUN CGO_ENABLED=0 GOOS=linux go build -o myapp .

        # 最终镜像阶段
        FROM alpine:latest
        WORKDIR /root/
        COPY --from=builder /app/myapp .
        EXPOSE 8080
        CMD ["./myapp"]
        ```
3.  **合并 `RUN` 指令以减少层数**：
    *   每个 `RUN` 指令都会创建一个新的镜像层。将多个命令通过 `&&` 链接起来，可以减少镜像层数，从而减小最终镜像大小。
    *   在 `apt-get install` 后，通常需要清理缓存 (`rm -rf /var/lib/apt/lists/*`)，以防止不必要的包管理器缓存占用空间。
    *   **错误示例**：
        ```dockerfile
        RUN apt-get update
        RUN apt-get install -y nginx
        RUN rm -rf /var/lib/apt/lists/*
        ```
    *   **推荐示例**：
        ```dockerfile
        RUN apt-get update && apt-get install -y --no-install-recommends nginx \
            && rm -rf /var/lib/apt/lists/*
        ```
4.  **精确指定版本而非 `latest`**：
    *   `FROM` 指令中使用具体的版本号 (例如 `node:18` 而不是 `node:latest`)，以确保构建的可复现性。
5.  **合理使用 `.dockerignore`**：
    *   类似于 `.gitignore`，`.dockerignore` 文件可以指定在构建上下文传输时忽略的文件和目录。这可以加速构建过程并避免将不必要的敏感文件 (如 `.git` 目录、`node_modules` 等) 包含到镜像中。
6.  **优先使用 `COPY` 而非 `ADD`**：
    *   除非你需要 `ADD` 的自动解压缩或 URL 下载功能，否则始终优先使用 `COPY`。`COPY` 更清晰，意图更明确。
7.  **按需安装依赖**：
    *   只安装应用程序运行所必需的软件包和依赖项。避免安装开发工具、编译器等在运行时不需要的组件。
8.  **非 Root 用户运行**：
    *   通过 `USER` 指令在容器中创建一个非 `root` 用户并切换到该用户，以最小化潜在的安全风险。
9.  **配置健康检查 `HEALTHCHECK`**：
    *   为你的应用程序配置健康检查，以便 Docker 可以判断容器是否正常运行，并在不健康时采取自动化恢复措施。
10. **考虑缓存机制**：
    *   Docker 构建会利用层缓存。将不常变化的指令（如 `FROM`, `COPY` 依赖文件）放在 `Dockerfile` 的顶部，将经常变化的指令（如 `COPY` 应用代码）放在底部，可以最大限度地利用缓存，加速后续构建。
    *   例如，在 Go 项目中，`COPY go.mod go.sum ./` 应该放在 `COPY . .` 之前，因为依赖文件变化频率低于代码文件。

## 四、Docker Compose 中的 `Dockerfile`

`Dockerfile` 通常与 `Docker Compose` 结合使用，以定义和运行多容器 Docker 应用程序。在 `docker-compose.yml` 文件中，你可以通过 `build` 关键字指向你的 `Dockerfile`。

**`docker-compose.yml` 示例**：

```yaml
version: '3.8'
services:
  web:
    build: . # 指向当前目录，Docker Compose 会在这里查找 Dockerfile 并构建镜像
    ports:
      - "80:80"
    volumes:
      - ./app:/app
    environment:
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: mydatabase
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

## 五、总结

`Dockerfile` 是 Docker 生态系统的核心组成部分，是实现应用程序容器化的基石。通过理解和熟练运用 `Dockerfile` 的各项指令及遵循最佳实践，开发者可以创建出高效、安全、可维护的 Docker 镜像，从而极大地简化应用程序的开发、部署和运维流程，是现代 DevOps 和云原生架构中不可或缺的工具。
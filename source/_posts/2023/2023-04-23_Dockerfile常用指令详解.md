---
title: Dockerfile 常用指令详解
date: 2023-04-23 06:24:00
tags: 
    - 2023
    - Docker
    - 容器技术
categories: Docker
---

> `Dockerfile` 是一个文本文件，其中包含用户可以在命令行上调用以组装映像的所有命令。Docker 可以通过读取 `Dockerfile` 中的指令自动构建映像。它本质上是一个“可执行程序脚本”，用于自动化构建 Docker 镜像的过程。

{% note info %}
理解和熟练使用 `Dockerfile` 指令是 Docker 应用开发和部署的核心技能之一。一个优化良好、结构清晰的 `Dockerfile` 不仅能构建出高效、安全、体积小的镜像，还能提高构建速度和可维护性。
{% endnote %}
------

## 一、Dockerfile 基础概念

*   **镜像 (Image)**：一个只读的模板，包含了创建 Docker 容器所需的所有文件和配置。
*   **容器 (Container)**：镜像运行时的实例。可以启动、停止、删除。
*   **层 (Layer)**：Dockerfile 中的每个指令都会创建一个新的镜像层。这些层是只读的，可以被缓存和共享，是 Docker 镜像高效和可复用的关键。
*   **构建上下文 (Build Context)**：当执行 `docker build` 命令时，它会向 Docker 守护进程发送一个目录（通常是当前目录）及其所有内容。这个目录被称为构建上下文。`Dockerfile` 和其中引用的所有文件都必须在这个上下文中。

## 二、Dockerfile 常用指令详解

以下是 `Dockerfile` 中常用的指令及其详细解释。

### 1. `FROM`

*   **作用**：指定基础镜像，是 `Dockerfile` 的第一个指令（除 `ARG` 之外）。所有的构建都必须基于一个基础镜像。
*   **语法**：
    ```dockerfile
    FROM <image> [AS <name>]
    FROM <image>[:<tag>] [AS <name>]
    FROM <image>@<digest> [AS <name>]
    ```
*   **示例**：
    ```dockerfile
    FROM ubuntu:22.04        # 基于 Ubuntu 22.04 镜像
    FROM python:3.9-slim-buster AS builder # 基于 Python 3.9 瘦身版镜像，并命名为 builder
    ```
*   **最佳实践**：
    *   选择官方镜像，更可靠。
    *   选择尽可能小的基础镜像（如 `alpine` 或 `slim` 版本），以减小最终镜像体积。
    *   指定精确的标签（tag），避免使用 `latest`，确保构建的可复现性。
    *   使用多阶段构建（`AS <name>`），优化最终镜像。

### 2. `RUN`

*   **作用**：在当前镜像层之上执行命令，并提交结果作为新的镜像层。主要用于安装软件包、配置环境等。
*   **语法**：
    ```dockerfile
    RUN <command>           # shell 形式，命令在 shell 中运行 (默认是 `/bin/sh -c` on Linux, `cmd /S /C` on Windows)
    RUN ["executable", "param1", "param2"] # exec 形式，直接执行命令，不经过 shell
    ```
*   **示例**：
    ```dockerfile
    RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        && rm -rf /var/lib/apt/lists/* # shell 形式，安装 Nginx 并清理缓存

    RUN ["/bin/bash", "-c", "echo hello"] # exec 形式，指定 bash 运行
    ```
*   **最佳实践**：
    *   将多个 `RUN` 命令合并成一个 `RUN` 命令，可以减少镜像层数，**这是优化镜像大小的关键**。使用 `&&` 连接命令，并在末尾添加清理命令（如 `rm -rf /var/lib/apt/lists/*`）。
    *   使用 `exec` 形式可以避免 shell 的额外开销，但通常 `shell` 形式更容易编写和理解。

### 3. `CMD`

*   **作用**：为执行中的容器提供默认的命令。如果 `docker run` 命令指定了其他命令，`CMD` 的命令会被覆盖。一个 `Dockerfile` 中只能有一个 `CMD` 指令，如果有多个，只有最后一个生效。
*   **语法**：
    ```dockerfile
    CMD ["executable","param1","param2"] # exec 形式 (推荐)
    CMD ["param1","param2"]              # 作为 ENTRYPOINT 的附加参数 (推荐)
    CMD command param1 param2            # shell 形式
    ```
*   **示例**：
    ```dockerfile
    CMD ["nginx", "-g", "daemon off;"] # 容器启动时运行 Nginx
    CMD echo "Hello Docker!" # shell 形式
    ```
*   **最佳实践**：
    *   建议使用 `exec` 形式，因为它能避免 shell 处理，更清晰地表示容器启动后的主要进程。
    *   当与 `ENTRYPOINT` 结合使用时，`CMD` 用于为 `ENTRYPOINT` 提供默认参数。

### 4. `ENTRYPOINT`

*   **作用**：配置一个容器作为可执行文件运行。它为容器提供了一个固定的命令和参数，而 `CMD` 只是为 `ENTRYPOINT` 提供默认参数，或者在没有 `ENTRYPOINT` 时提供默认命令。
*   **语法**：
    ```dockerfile
    ENTRYPOINT ["executable", "param1", "param2"] # exec 形式 (推荐)
    ENTRYPOINT command param1 param2              # shell 形式 (不推荐)
    ```
*   **示例**：
    ```dockerfile
    ENTRYPOINT ["java", "-jar", "app.jar"] # 容器作为 Java 应用运行
    CMD ["--spring.profiles.active=prod"] # 为 ENTRYPOINT 提供默认参数
    ```
*   **最佳实践**：
    *   使用 `exec` 形式。
    *   与 `CMD` 结合使用时，`ENTRYPOINT` 定义了容器启动的固定行为，而 `CMD` 提供了可变的默认参数，方便通过 `docker run ...` 覆盖这些参数。

### 5. `COPY`

*   **作用**：从构建上下文复制文件或目录到镜像中指定路径。
*   **语法**：
    ```dockerfile
    COPY <源路径>... <目标路径>
    COPY ["<源路径>", ..., "<目标路径>"]
    ```
*   **示例**：
    ```dockerfile
    COPY . /app/      # 将当前构建上下文所有文件复制到镜像的 /app 目录
    COPY src/main.go /app/main.go # 复制单个文件
    COPY --chown=user:group myapp /app/myapp # 复制并改变所有者
    ```
*   **最佳实践**：
    *   只复制需要的文件，避免复制不必要的文件（如 `.git` 目录、日志文件等），通常通过 `.dockerignore` 文件来控制。
    *   指定精确的源和目标路径，减少不必要的拷贝。

### 6. `ADD`

*   **作用**：与 `COPY` 类似，但它有额外的功能：
    1.  如果源路径是 URL，`ADD` 会下载该文件。
    2.  如果源路径是 `tar` 压缩文件，`ADD` 会自动解压到目标路径。
*   **语法**：
    ```dockerfile
    ADD <源路径>... <目标路径>
    ADD ["<源路径>", ..., "<目标路径>"]
    ```
*   **示例**：
    ```dockerfile
    ADD https://example.com/latest.tar.gz /app/ # 下载并解压
    ADD myapp.tar.gz /app/  # 解压本地压缩包
    ```
*   **最佳实践**：
    *   由于 `ADD` 的自动解压和远程文件下载功能可能引入不确定性和安全风险，**更推荐使用 `COPY`**。只有当确实需要自动解压本地 `tar` 文件时才考虑 `ADD`。
    *   下载远程文件建议使用 `RUN wget` 或 `RUN curl`，这样可以更明确地控制下载过程和校验，并能清理下载缓存。

### 7. `WORKDIR`

*   **作用**：为 `RUN`, `CMD`, `ENTRYPOINT`, `COPY`, `ADD` 等指令设置工作目录。后续的指令都会在这个目录下执行。
*   **语法**：
    ```dockerfile
    WORKDIR /path/to/workdir
    ```
*   **示例**：
    ```dockerfile
    WORKDIR /app
    COPY . . # 相当于 COPY . /app/.
    RUN npm install
    CMD ["npm", "start"]
    ```
*   **最佳实践**：
    *   为应用程序设置一个明确的工作目录，保持 `Dockerfile` 的整洁和可读性。
    *   避免每次都使用绝对路径，利用 `WORKDIR` 简化指令。

### 8. `EXPOSE`

*   **作用**：声明容器运行时监听的端口。这仅仅是一个文档作用，告诉用户容器服务监听哪个端口。它**不会**实际发布端口到宿主机，需要在使用 `docker run` 命令时通过 `-p` 或 `-P` 参数来映射。
*   **语法**：
    ```dockerfile
    EXPOSE <port> [<port>/<protocol>...]
    ```
*   **示例**：
    ```dockerfile
    EXPOSE 80      # 暴露 TCP 80 端口
    EXPOSE 80/tcp  # 明确指定 TCP
    EXPOSE 53/udp  # 暴露 UDP 53 端口
    EXPOSE 80 443  # 暴露多个端口
    ```
*   **最佳实践**：
    *   声明应用程序监听的所有端口。
    *   这对于容器编排工具（如 Kubernetes）尤其有用，它们可以读取 `Dockerfile` 中的 `EXPOSE` 信息来配置服务。

### 9. `ENV`

*   **作用**：设置环境变量，这些变量在构建时和容器运行时都可用。
*   **语法**：
    ```dockerfile
    ENV <key>=<value> ...
    ```
*   **示例**：
    ```dockerfile
    ENV MY_ENV_VAR="hello"
    ENV PATH="/usr/local/bin:$PATH" # 添加 PATH
    ```
*   **最佳实践**：
    *   定义应用程序所需的配置参数（如数据库连接字符串、API 密钥等）。
    *   环境变量会增加镜像层，如果设置了敏感信息，它们会保留在镜像历史中。**敏感信息不应直接硬编码在 `ENV` 中，而应通过 `docker run -e` 或 secret manager 传递**。

### 10. `ARG`

*   **作用**：定义构建时变量。这些变量在 `docker build` 命令中传递，并且只在构建阶段有效，容器运行时不可见。
*   **语法**：
    ```dockerfile
    ARG <name>[=<default value>]
    ```
*   **示例**：
    ```dockerfile
    ARG BUILD_VERSION=1.0.0
    ARG NODE_VERSION
    RUN echo "Building version: $BUILD_VERSION" # 在 RUN 命令中使用 BUILD_VERSION
    ```
    构建时传递：`docker build --build-arg NODE_VERSION=16.x .`
*   **最佳实践**：
    *   用于传递构建参数，如版本号、代理设置等。
    *   `ARG` 在 `FROM` 之前定义可以影响 `FROM` 指令。
    *   注意，如果 `ARG` 定义的变量在 `CMD`/`ENTRYPOINT` 中使用，需要用 `ENV` 重新声明，因为 `ARG` 只在构建时可见。

### 11. `VOLUME`

*   **作用**：创建一个挂载点，将宿主机的目录或 Docker 管理的卷挂载到容器中，绕过 Union File System。通常用于存储动态数据或共享数据。
*   **语法**：
    ```dockerfile
    VOLUME ["/data"]            # 推荐 exec 形式
    VOLUME /var/log/app
    ```
*   **示例**：
    ```dockerfile
    VOLUME ["/var/www/html"] # 声明此目录将用于存储 Web 服务器的数据
    ```
*   **最佳实践**：
    *   声明应用程序可能需要外部持久化存储的目录。
    *   尽管 `VOLUME` 指令在 `Dockerfile` 中指定了挂载点，但实际的卷挂载是在 `docker run -v` 命令中完成的。

### 12. `USER`

*   **作用**：设置运行容器或执行 `RUN`, `CMD`, `ENTRYPOINT` 命令时使用的用户名或 UID/GID。
*   **语法**：
    ```dockerfile
    USER <user>[:<group>]
    USER <UID>[:<GID>]
    ```
*   **示例**：
    ```dockerfile
    FROM ubuntu:22.04
    RUN useradd -ms /bin/bash appuser # 创建一个新用户
    USER appuser # 后续命令将以 appuser 身份运行
    CMD ["echo", "Hello from appuser"]
    ```
*   **最佳实践**：
    *   **不要以 `root` 用户运行容器应用程序**。这是`安全最佳实践`。创建并使用非 `root` 用户来运行应用程序。

### 13. `HEALTHCHECK`

*   **作用**：告诉 Docker 如何检测容器内的服务是否健康。
*   **语法**：
    ```dockerfile
    HEALTHCHECK [OPTIONS] CMD command
    HEALTHCHECK NONE
    ```
    **Options:**
    *   `--interval=DURATION` (default: 30s)
    *   `--timeout=DURATION` (default: 30s)
    *   `--start-period=DURATION` (default: 0s)
    *   `--retries=N` (default: 3)
*   **示例**：
    ```dockerfile
    HEALTHCHECK --interval=5s --timeout=3s --retries=3 \
        CMD curl --fail http://localhost/ || exit 1
    ```
*   **最佳实践**：
    *   定义一个命令来检查应用程序的健康状况，例如检查 HTTP 端点是否返回 200 状态码，或者 TCP 端口是否响应。
    *   这对于容器编排系统（如 Kubernetes, Docker Compose）进行服务管理和自动恢复非常有用。

### 14. `LABEL`

*   **作用**：为镜像添加元数据。这允许用户添加自定义信息，如维护者、版本、描述等。
*   **语法**：
    ```dockerfile
    LABEL <key>="<value>" [<key>="<value>" ...]
    ```
*   **示例**：
    ```dockerfile
    LABEL maintainer="Your Name <your.email@example.com>"
    LABEL version="1.0"
    LABEL description="This is a sample web application."
    ```
*   **最佳实践**：
    *   提供清晰的元数据，方便管理和识别镜像。
    *   可以使用多行 `LABEL`，但合并成一个 `LABEL` 指令可以减少镜像层数。

## 三、Dockerfile 构建最佳实践

1.  **使用 `.dockerignore` 文件**：类似于 `.gitignore`，防止不必要的文件（如 `node_modules`, `.git`, `.vscode` 等）被复制到构建上下文中，加快构建速度并减小镜像体积。
2.  **多阶段构建 (Multi-stage Builds)**：
    *   将构建环境和运行时环境分离。
    *   例如，第一阶段编译代码，然后将编译好的二进制文件复制到第二阶段的轻量级运行时镜像中。
    *   这能显著减小最终镜像体积，提高安全性。
    ```dockerfile
    # 第一阶段：构建
    FROM golang:1.20-alpine AS builder
    WORKDIR /app
    COPY . .
    RUN go mod download
    RUN CGO_ENABLED=0 GOOS=linux go build -o myapp .

    # 第二阶段：运行
    FROM alpine:latest
    WORKDIR /app
    COPY --from=builder /app/myapp .
    EXPOSE 8080
    CMD ["./myapp"]
    ```
3.  **减少镜像层数**：每个 `RUN`, `COPY`, `ADD` 指令都会创建一个新层。将相关的指令合并，特别是 `RUN` 命令，使用 `&&` 连接。
4.  **利用缓存**：Docker 会缓存每个指令的结果。将不变的指令放在 `Dockerfile` 的顶部，变化的指令放在底部，最大限度地利用缓存，加快重复构建的速度。
5.  **指定精确的基础镜像标签**：避免使用 `latest`，以确保构建的可复现性。
6.  **非 Root 用户**：尽量使用 `USER` 指令将容器运行为非 `root` 用户，提高安全性。
7.  **清理中间文件**：在 `RUN` 命令中，安装完软件包后立即清理包管理器的缓存 (`apt-get clean`, `rm -rf /var/cache/apk/*` 等)。
8.  **明智地使用 `VOLUME`**：只在需要持久化或共享数据时使用。

## 四、总结

`Dockerfile` 是容器化工作流的核心。通过深入理解其常用指令及其最佳实践，你可以：

*   **构建更小、更快的 Docker 镜像**
*   **提高镜像的可维护性和安全性**
*   **优化 CI/CD 流程中的构建时间**
*   **更好地管理应用程序的依赖和配置**

掌握这些知识，你就能更有效地利用 Docker，将你的应用程序打包、分发和部署到任何环境。
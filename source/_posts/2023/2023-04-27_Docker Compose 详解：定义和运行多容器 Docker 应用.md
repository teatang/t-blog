---
title: Docker Compose 详解：定义和运行多容器 Docker 应用
date: 2023-04-27 06:24:00
tags: 
    - 2023
    - Docker
    - 容器技术
categories: Docker
---
> **Docker Compose** 是一个用于定义和运行多容器 Docker 应用程序的工具。通过一个 YAML 文件 (`docker-compose.yml`)，你可以配置应用程序的服务（即容器）、网络和卷等所有方面，然后使用一个命令（`docker compose` 或 `docker-compose`）启动、停止和管理整个应用程序栈。它极大地简化了复杂应用程序的部署和管理，特别适用于开发、测试和小型生产环境。

{% note info %}
核心思想：
**将多容器应用程序的配置进行抽象和定义**，实现**一次定义，随处运行**的容器化应用部署。
{% endnote %}

------

## 一、为什么需要 Docker Compose？

当我们开发和部署一个应用程序时，通常不仅仅涉及一个容器。一个典型的现代应用程序可能包含：

*   一个 Web 服务器（如 Nginx, Apache）
*   一个应用服务器（如 Node.js, Python Flask, Java Spring Boot）
*   一个数据库（如 PostgreSQL, MySQL, MongoDB）
*   一个缓存服务（如 Redis）
*   消息队列、定时任务等其他辅助服务

如果手动管理这些容器：
1.  **复杂性高**：你需要分别使用 `docker run` 命令启动每个容器，记住它们的镜像名称、端口映射、卷挂载、环境变量等。
2.  **依赖管理困难**：容器之间可能有启动顺序和依赖关系（例如，应用服务器需要数据库先启动）。手动管理这些依赖非常繁琐。
3.  **网络配置复杂**：容器之间的通信需要配置自定义网络，确保它们能够相互发现和通信。
4.  **可复现性差**：多容器应用的配置信息分散在多个命令中，难以复现和共享。

Docker Compose 解决了这些问题，它允许你通过一个 YAML 文件来定义所有这些服务的配置，然后一个命令就能搞定所有操作。

## 二、Docker Compose 核心概念

1.  **服务 (Services)**：
    *   服务是你应用程序中的一个组件，每个服务都对应一个 Docker 容器。
    *   例如，你的 Web 服务、数据库服务、应用服务都是不同的服务。
    *   在 `docker-compose.yml` 中，你为每个服务指定 Docker 镜像、端口、卷、环境变量等配置。
2.  **项目 (Project)**：
    *   一个 `docker-compose.yml` 文件定义了一组相关的服务，这组服务构成一个“项目”。
    *   当你运行 `docker compose up` 时，Docker Compose 会根据这个文件来启动所有服务，并将它们作为一个整体进行管理。
3.  **网络 (Networks)**：
    *   Docker Compose 默认会为你的项目创建一个隔离的桥接网络。所有服务都连接到这个网络，并可以通过服务名称互相访问。
    *   容器可以使用服务名称作为 hostname 进行通信，无需了解对方的 IP 地址。
4.  **卷 (Volumes)**：
    *   用于持久化数据，避免容器被删除时数据丢失。
    *   可以在 `docker-compose.yml` 中定义命名卷 (named volumes) 或直接挂载主机目录。

## 三、`docker-compose.yml` 文件结构与常用配置项

`docker-compose.yml` (或 `docker-compose.yaml`) 文件是 Docker Compose 的核心，它使用 YAML 格式定义了所有服务。

### 3.1 基础结构

```yaml
version: '3.8' # Docker Compose 文件格式版本，通常建议使用最新版本

services: # 定义所有的服务
  <service_name_1>: # 服务名称，在网络中可作为 hostname 使用
    # 服务的配置选项
    image: <image_name> # 指定使用的 Docker 镜像
    build: . # 或者指定 Dockerfile 的构建上下文，如果需要构建镜像
    ports: # 端口映射，格式为 "HOST_PORT:CONTAINER_PORT"
      - "80:80"
    volumes: # 卷挂载，用于数据持久化或共享文件
      - ./app:/app
    environment: # 环境变量
      - DB_HOST=db
      - DB_USER=user
    networks: # 连接到哪些网络
      - app-network

  <service_name_2>:
    image: <image_name>
    # ... 其他配置

networks: # 定义所有的自定义网络
  app-network:
    driver: bridge # 指定网络驱动，默认为 bridge

volumes: # 定义所有的命名卷
  db_data:
    driver: local # 指定卷驱动，默认为 local
```

### 3.2 常用服务配置项详解

*   **`image`**:
    *   `image: ubuntu:latest`
    *   指定服务使用的 Docker 镜像。可以是 Docker Hub 上的官方镜像，也可以是你本地的镜像。
*   **`build`**:
    *   `build: .`
    *   `build: ./context_folder`
    *   `build: { context: ./context_folder, dockerfile: Dockerfile-dev }`
    *   如果需要从 `Dockerfile` 构建镜像，此项指定 `Dockerfile` 所在的构建上下文路径。
    *   可以是一个字符串路径，或者一个包含 `context` 和 `dockerfile` 路径的对象。
*   **`ports`**:
    *   `- "80:80"` (将主机 80 端口映射到容器 80 端口)
    *   `- "443"` (仅暴露容器 443 端口，不映射到主机特定端口，Docker 会动态分配主机端口)
    *   `HOST_PORT:CONTAINER_PORT` 或 `CONTAINER_PORT` 的格式。
*   **`volumes`**:
    *   `- ./app:/var/www/html` (将主机当前目录下的 `app` 目录挂载到容器的 `/var/www/html`)
    *   `- db_data:/var/lib/mysql` (将名为 `db_data` 的命名卷挂载到容器的 `/var/lib/mysql`)
    *   `<HOST_PATH>:<CONTAINER_PATH>` (绑定挂载) 或 `<NAMED_VOLUME>:<CONTAINER_PATH>` (命名卷挂载)。
*   **`environment`**:
    *   `environment: - POSTGRES_PASSWORD=mysecretpassword`
    *   `environment: - VAR_NAME` (从 Shell 环境变量中获取 `VAR_NAME` 的值)
    *   设置容器内的环境变量。
*   **`networks`**:
    *   `networks: - app-network - db-network`
    *   指定容器连接到哪些自定义网络。
*   **`depends_on`**:
    *   `depends_on: - db - redis`
    *   声明服务之间的依赖关系。这会确保 `db` 和 `redis` 服务在当前服务之前启动。
    *   **注意**：`depends_on` 仅仅保证容器的**启动顺序**，不保证依赖服务**完全就绪**（例如数据库启动后可能还需要一段时间才能接受连接）。对于应用程序启动时的服务就绪检查，通常需要在应用程序代码中实现重试逻辑，或者在容器启动脚本中添加等待逻辑。
*   **`env_file`**:
    *   `env_file: - .env - ./common.env`
    *   从文件中加载环境变量。文件格式是 `KEY=VALUE` 每一行一个。
*   **`command`**:
    *   `command: ["nginx", "-g", "daemon off;"]`
    *   覆盖 Docker 镜像中定义的默认 `CMD` 命令。
*   **`entrypoint`**:
    *   `entrypoint: ["/bin/sh", "-c"]`
    *   覆盖 Docker 镜像中定义的默认 `ENTRYPOINT` 命令。
*   **`restart`**:
    *   `restart: always` (总是重启)
    *   `restart: on-failure` (只有在非零退出码时重启)
    *   `restart: unless-stopped` (除非手动停止，否则总是重启)
    *   在容器退出时，重启策略。
*   **`healthcheck`**:
    *   `healthcheck:`
    *   `  test: ["CMD", "curl", "-f", "http://localhost"]`
    *   `  interval: 1m30s`
    *   `  timeout: 10s`
    *   `  retries: 3`
    *   定义容器的健康检查。当检查失败时，Docker Compose 会将容器标记为 `unhealthy`。

### 3.3 示例：一个简单的 Web 应用

**`docker-compose.yml`**

```yaml
version: '3.8'

services:
  web:
    build: . # 从当前目录的 Dockerfile 构建 web 服务镜像
    ports:
      - "80:80" # 将主机 80 端口映射到容器 80 端口
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro # 挂载 Nginx 配置文件为只读
      - ./html:/usr/share/nginx/html # 挂载 HTML 内容
    depends_on:
      - app # web 服务依赖 app 服务启动
    networks:
      - my_app_net

  app:
    build:
      context: ./app-src # 从 app-src 目录构建 app 服务镜像
      dockerfile: Dockerfile # 指定 Dockerfile 名称
    environment:
      - DB_HOST=db # 环境变量，数据库主机名为 db
    networks:
      - my_app_net
    depends_on:
      - db # app 服务依赖 db 服务启动

  db:
    image: postgres:13 # 使用官方 Postgres 13 镜像
    environment:
      POSTGRES_DB: mydatabase
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - db_data:/var/lib/postgresql/data # 持久化数据库数据到命名卷
    networks:
      - my_app_net

networks:
  my_app_net: # 定义一个名为 my_app_net 的自定义网络

volumes:
  db_data: # 定义一个名为 db_data 的命名卷
```

**目录结构：**

```
.
├── docker-compose.yml
├── nginx.conf
└── html
    └── index.html
└── app-src
    └── Dockerfile
    └── main.py
```

## 四、Docker Compose CLI 命令

Docker Compose 提供了一系列简洁的命令行工具来管理你的多容器应用。
**注意**：从 Docker Engine 1.27.0 和 Docker Compose V2 开始，推荐使用 `docker compose` 命令（带有空格），它直接集成在 Docker CLI 中。旧版本可能使用 `docker-compose` 命令（带有连字符）。

*   **`docker compose build`**：
    *   构建（或重新构建）服务所使用的镜像。如果你在 `docker-compose.yml` 中使用了 `build` 关键字，这个命令就会执行 `Dockerfile` 的构建过程。
*   **`docker compose up [SERVICE_NAME...]`**：
    *   启动所有服务。如果服务镜像不存在，它会自动构建。
    *   `-d`：在后台运行容器。
    *   `--build`：在启动前强制重新构建镜像。
*   **`docker compose down`**：
    *   停止并移除由 `up` 命令创建的容器、网络和卷。
    *   `-v`：同时移除匿名卷和命名卷（谨慎使用，数据可能丢失）。
    *   `--rmi all`：移除所有服务使用的镜像。
*   **`docker compose ps`**：
    *   列出项目中所有容器的状态。
*   **`docker compose logs [SERVICE_NAME...]`**：
    *   查看服务的日志输出。
    *   `-f`：跟踪日志输出（实时显示）。
*   **`docker compose exec SERVICE_NAME COMMAND`**：
    *   在运行中的服务容器中执行命令。
    *   例如：`docker compose exec db psql -U user mydatabase` 可以在 `db` 容器中执行 `psql` 命令。
*   **`docker compose restart SERVICE_NAME`**：
    *   重启一个或多个服务。
*   **`docker compose stop [SERVICE_NAME...]`**：
    *   停止运行中的服务容器，但不移除它们。
*   **`docker compose start [SERVICE_NAME...]`**：
    *   启动已停止的服务容器。

**常用工作流程：**

{% mermaid %}
graph TD
    A[编写 docker-compose.yml 和 Dockerfile] --> B{第一次部署 或 镜像有更新}
    B --> C[docker compose build]
    C --> D[docker compose up -d]
    D --> E["docker compose ps (检查状态)"]
    E --> F["docker compose logs -f (查看日志)"]
    F --> G{修改代码 或 配置文件}
    G --> H[重新构建/重启相关服务]
    H --> I["docker compose up -d --no-deps SERVICE_NAME --build (只重建并重启指定服务)"]
    I --> J["docker compose down (停止并清理)"]
{% endmermaid %}

## 五、Docker Compose 的应用场景

1.  **开发环境搭建**：
    *   开发人员可以使用 Docker Compose 快速启动包含应用、数据库、缓存等所有依赖的本地开发环境，确保团队成员环境一致。
2.  **测试环境**：
    *   用于构建持续集成 (CI) 流水线中的测试环境，每次代码提交后自动部署并运行集成测试。
3.  **小型生产环境**：
    *   对于不需要大规模伸缩、高可用性（具备基本服务恢复能力）的单个主机上的小型应用程序，Docker Compose 是一个简单有效的部署方案。
4.  **Proof of Concept (POC) 和演示**：
    *   快速搭建原型或演示环境，展示多容器应用的功能。

## 六、与 Docker Swarm / Kubernetes 的关系

*   **Docker Compose** 专注于**单主机**上的多容器应用定义和管理。它没有内置的负载均衡、服务发现、自动伸缩等生产级容器编排功能。
*   **Docker Swarm** 和 **Kubernetes** 是更高级的**生产级容器编排平台**，用于管理多台主机上的大规模容器集群。它们提供了自动伸缩、负载均衡、滚动更新、服务发现、故障恢复等强大功能。
    *   Docker Swarm 对 Compose 文件的支持较好，可以直接使用 `docker stack deploy` 命令部署 Compose 文件到 Swarm 集群。
    *   Kubernetes 有自己的资源定义格式（YAML），但存在工具（如 Kompose）可以将 `docker-compose.yml` 转换为 Kubernetes 资源。

**简而言之：**
*   **Compose**：本地开发和测试、单机小规模部署。
*   **Swarm / Kubernetes**：生产环境、大规模集群部署、高可用性。

## 七、总结

Docker Compose 极大地简化了多容器 Docker 应用程序的定义、启动和管理。通过一个声明式的 YAML 文件，你能够清晰地描述整个应用栈的结构和依赖关系，从而提高开发效率、确保环境一致性。它已成为 Docker 生态系统中不可或缺的工具，特别是在开发和测试阶段，以及对单主机部署场景下，提供了出色的便利性和有效性。
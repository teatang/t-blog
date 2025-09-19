---
title: Docker Compose 详解：定义和运行多容器 Docker 应用
date: 2023-04-27 06:24:00
tags: 
    - 2023
    - Docker
    - 容器技术
categories: Docker
---

> `Docker Compose` 是一个用于定义和运行多容器 Docker 应用程序的工具。通过一个 `YAML` 文件（通常命名为 `docker-compose.yml`），你可以配置应用程序的所有服务（容器）、网络和卷。然后，只需一个命令，就可以从这个配置文件中启动、停止和管理整个应用程序。

{% note info %}
在实际的生产环境中，一个完整的应用程序通常由多个服务组成，例如一个 Web 应用可能包含一个 Web 服务器（Nginx/Apache）、一个应用服务（Python/Node.js/Java）、一个数据库（PostgreSQL/MySQL）和一个缓存服务（Redis）。手动管理这些独立容器的创建、网络连接和启动顺序非常繁琐且容易出错。`Docker Compose` 的出现正是为了解决这些多容器应用的管理复杂性。
{% endnote %}

## 一、Docker Compose 简介与核心优势

`Docker Compose` 简化了多容器应用的开发、测试和（小规模）部署。它将应用的整个拓扑结构描述在一个文件中，实现了“基础设施即代码”的理念。

**`Docker Compose` 的核心优势：**

1.  **单一文件，管理一切**：用一个简单的 YAML 文件定义整个应用的架构，包括所有服务、它们的镜像、端口映射、卷挂载、环境变量和网络配置。
2.  **易于启动和停止**：通过 `docker compose up` 命令，可以一键启动所有服务并建立它们之间的网络连接；通过 `docker compose down` 可以一键停止并移除所有相关的容器、网络和卷。
3.  **服务发现**：Compose 会自动为你的服务创建内部网络，并使服务可以通过其服务名称相互通信，例如，Web 服务可以通过 `database` 宿主机名连接到数据库容器。
4.  **环境隔离**：每个项目（通常是一个目录）可以拥有独立的 Compose 配置，创建隔离的环境，避免不同项目之间的冲突。
5.  **快速迭代**：开发过程中，修改代码后可以快速重建并重启受影响的服务。
6.  **跨平台**：Compose 文件可以在任何支持 Docker 的平台上运行，保持开发、测试和生产环境的一致性。

## 二、安装 Docker Compose

`Docker Compose` 的安装方式取决于你的 Docker Desktop 版本和操作系统。

### 1. Docker Desktop (Windows / macOS)

如果你安装了 Docker Desktop，那么 `Docker Compose` **已经预装并集成在 Docker Engine 中**。你可以直接使用 `docker compose` 命令。

验证方式：

```bash
docker compose version
```

### 2. Linux 系统

对于 Linux，`Docker Compose` 作为一个独立二进制文件或插件提供。

**作为 Docker CLI 插件 (推荐，新版本)**
大多数新版本 Docker Engine (>= 20.10) 都会将 `Docker Compose` 作为 Docker CLI 的一个插件捆绑提供。如果你的 Docker Engine 较旧，可能需要单独安装。

**独立安装 (旧版本或特定需求)**
如果你的 Docker Engine 版本较旧，或者想安装旧版 `docker-compose` (注意是 `docker-compose` 带连字符)，可以手动下载：

```bash
# 下载最新稳定版本的 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 赋予执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version # 注意是带连字符的命令
```
**注意：** 新版本 `Docker Compose` (`v2`) 的命令是 `docker compose` (无连字符)，而旧版本 (`v1`) 的命令是 `docker-compose` (带连字符)。推荐使用新版本。

## 三、Docker Compose 文件 (`docker-compose.yml`) 结构

`docker-compose.yml` 文件是 `Docker Compose` 的核心。它是一个 YAML 格式的文件，定义了应用的所有服务。

**基本结构：**

```yaml
version: '3.8' # Compose 文件格式版本，推荐使用最新稳定版本

services:     # 定义所有的服务 (容器)
  web:        # 一个服务名称
    image: nginx:latest # 使用的镜像
    ports:    # 端口映射
      - "80:80"
    volumes:  # 卷挂载
      - ./nginx.conf:/etc/nginx/nginx.conf # 宿主机文件:容器文件
      - ./html:/usr/share/nginx/html # 宿主机目录:容器目录
    depends_on: # 依赖关系，确保数据库先启动
      - db
    networks: # 指定服务加入的网络
      - my-app-network

  db:
    image: postgres:13
    environment: # 环境变量
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - db_data:/var/lib/postgresql/data # 命名卷挂载
    networks:
      - my-app-network

networks:     # 定义网络
  my-app-network:
    driver: bridge # 桥接网络

volumes:      # 定义命名卷
  db_data:
```

### 核心顶级键：

1.  **`version`** (必需)：指定 Compose 文件格式版本。
    *   推荐使用 `3.x` 系列，目前最新稳定版是 `3.8` 或 `3.9`。不同版本支持的指令和功能有所差异。
2.  **`services`** (必需)：定义应用程序包含的所有服务。每个服务都是一个独立的容器。
3.  **`networks`** (可选)：定义 Compose 应用中使用的网络。
4.  **`volumes`** (可选)：定义 Compose 应用中使用的命名卷。
5.  **`configs`** (可选)：定义配置对象，通常用于存储敏感数据或配置信息。
6.  **`secrets`** (可选)：定义敏感数据，通常用于数据库密码、API 密钥等。

### `services` 下的常见指令：

每个服务可以配置以下常用指令：

*   **`image`**：指定用于创建容器的镜像（如 `ubuntu:latest`, `nginx:1.21`）。
*   **`build`**：如果需要从 `Dockerfile` 构建镜像，可以指定 `Dockerfile` 所在的上下文路径和 `Dockerfile` 文件名。
    ```yaml
    service_name:
      build: .           # 在当前目录查找 Dockerfile
      # build: ./app       # 在 app 目录查找 Dockerfile
      # build:
      #   context: ./app   # 指定上下文路径
      #   dockerfile: Dockerfile.web # 指定 Dockerfile 文件名
      #   args:          # 构建参数 Arguments
      #     version: 1.0
    ```
*   **`ports`**：端口映射，将容器的端口映射到宿主机的端口。
    *   `"宿主机端口:容器端口"` (如 `"80:80"`)
    *   `"宿主机IP:宿主机端口:容器端口"`
*   **`environment`**：设置环境变量。
    ```yaml
    environment:
      - VAR1=value1
      - VAR2=value2
      # 或
      VAR1: value1
      VAR2: value2
    ```
*   **`volumes`**：卷挂载，用于持久化数据或将宿主机文件/目录挂载到容器内。
    *   `"宿主机路径:容器路径"` (绑定挂载)
    *   `"卷名称:容器路径"` (命名卷挂载)
    *   `"./html:/usr/share/nginx/html:ro"` (只读挂载)
*   **`depends_on`**：定义服务之间的依赖关系。这会影响服务的启动顺序（例如，数据库服务会在 Web 服务之前启动）。**注意：这只保证启动顺序，不保证服务完全可用。** （使用 `healthcheck` 更好地确保服务可用性）
    ```yaml
    depends_on:
      - db
      - redis
    ```
*   **`networks`**：指定服务要连接到的网络。定义在 `networks` 顶级键下。
*   **`container_name`**：指定容器的名称，而非 Compose 自动生成的名称。
*   **`command`**：覆盖镜像中 `CMD` 指令定义的默认命令。
*   **`entrypoint`**：覆盖镜像中 `ENTRYPOINT` 指令定义的默认入口点。
*   **`extra_hosts`**：添加主机名到容器的 `/etc/hosts` 文件中。
*   **`restart`**：定义容器退出后的重启策略（`no`, `on-failure`, `always`, `unless-stopped`）。
*   **`labels`**：为容器添加元数据标签。
*   **`healthcheck`**：定义容器健康检查的方式。
    ```yaml
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/healthz"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s # 在此期间如果检查失败不计入重试次数
    ```
*   **`deploy`**：部署相关的配置，例如在 Docker Swarm 模式下使用的副本数、资源限制等。

## 四、Docker Compose 常用命令

在包含 `docker-compose.yml` 文件的项目根目录下运行以下命令。

### 1. 启动应用程序 (后台运行)

```bash
docker compose up -d
```
*   `-d`：在后台（detached mode）运行容器。
*   此命令会解析 `docker-compose.yml` 文件，构建和/或拉取所需的镜像，然后创建并启动所有服务。

### 2. 停止并移除应用程序

```bash
docker compose down
```
*   此命令会停止并移除 `docker compose up` 启动的所有容器、网络和默认卷。
*   `docker compose down -v`：同时移除匿名卷和命名卷（小心使用，会删除数据）。
*   `docker compose down --rmi all`：移除所有服务创建的镜像。

### 3. 查看服务状态

```bash
docker compose ps
```
*   列出 Compose 项目中所有服务的运行状态。

### 4. 查看服务日志

```bash
docker compose logs [service_name]
```
*   `docker compose logs`：显示所有服务的合并日志。
*   `docker compose logs -f`：实时跟踪日志输出。
*   `docker compose logs web`：只查看 `web` 服务的日志。

### 5. 重启服务

```bash
docker compose restart [service_name]
```
*   `docker compose restart`：重启所有服务。
*   `docker compose restart web`：只重启 `web` 服务。

### 6. 构建或重建服务镜像

```bash
docker compose build [service_name]
```
*   `docker compose build`：构建所有需要构建的服务的镜像。
*   `docker compose build web`：只构建 `web` 服务的镜像。
*   `docker compose build --no-cache`：构建时不使用缓存。

### 7. 执行命令

```bash
docker compose exec <service_name> <command>
```
*   在正在运行的容器中执行命令。
*   `docker compose exec web bash`：在 `web` 服务容器中打开一个 Bash shell。

### 8. 进入容器

```bash
docker compose run <service_name> <command>
```
*   在指定服务中运行一次性命令。与 `exec` 不同，`run` 会创建一个新容器来运行命令。
*   `docker compose run web bash`：创建一个新的 `web` 容器并进入 Bash shell。
*   `docker compose run --rm web bash`：运行完毕后自动移除容器。

### 9. 移除停止的容器、网络和卷

```bash
docker compose rm
```
*   移除所有已停止的服务容器。

## 五、Docker Compose 最佳实践

1.  **为每个项目使用独立的 Compose 文件**：将每个应用程序的 `docker-compose.yml` 文件放在其自己的项目目录中。这样可以确保环境隔离，并避免服务名称冲突。
2.  **版本控制**：将 `docker-compose.yml` 文件与你的代码一起进行版本控制。
3.  **使用 `volumes` 进行数据持久化**：对于数据库、日志等需要持久化的数据，务必使用命名卷或绑定挂载，防止容器删除时数据丢失。
4.  **明确指定镜像版本**：避免使用 `latest` 标签，以确保环境的可复现性。例如 `nginx:1.21.6` 而非 `nginx:latest`。
5.  **利用 `.env` 文件管理环境变量**：对于敏感信息（如数据库密码）或需要在不同环境（开发/生产）中切换的变量，可以使用 `.env` 文件。
    *   在 `docker-compose.yml` 中：`DB_PASSWORD: ${DB_PASSWORD}`
    *   在 `.env` 文件中：`DB_PASSWORD=mysecretpassword`
6.  **善用 `depends_on` 和 `healthcheck`**：`depends_on` 用于服务启动顺序，`healthcheck` 用于更可靠地判断服务是否真的准备就绪。两者结合使用能提高应用启动的健壮性。
7.  **多阶段构建配合 Compose**：如果你的服务需要编译，可以在 `Dockerfile` 中使用多阶段构建，然后在 `docker-compose.yml` 中引用最终的小镜像。
8.  **考虑使用 `docker-compose.override.yml`**：在开发环境中，你可能需要一些与生产环境不同的配置（例如调试端口、开发服务器）。可以通过创建一个 `docker-compose.override.yml` 文件来覆盖主 `docker-compose.yml` 中的配置。
    *   Compose 会自动合并 `docker-compose.yml` 和 `docker-compose.override.yml`。
    *   例如，在 `override` 文件中可以添加 `build` 指令，或暴露更多端口。

## 六、与 Docker Swarm / Kubernetes 的关系

*   **Docker Compose**：主要用于**单机**上多容器应用的开发、测试和（小规模）部署。它不提供自动伸缩、高可用性、滚动更新等生产级编排功能。
*   **Docker Swarm**：Docker 官方的原生容器编排工具，提供了集群级别的容器管理，包括服务伸缩、负载均衡、滚动更新、故障恢复等。Compose 文件可以通过 `docker stack deploy` 命令直接部署到 Swarm 集群中。
*   **Kubernetes (K8s)**：目前业界最主流的容器编排平台，功能更全面、强大，但学习曲线较陡峭。Kubernetes 不直接使用 `docker-compose.yml` 文件，但有很多工具（如 `kompose`）可以将 Compose 文件转换成 Kubernetes 的资源定义。

简单来说，`Docker Compose` 是你使用 Docker 进行多容器应用开发的起点，而当你的应用需要扩展到生产集群时，你可能会转向 Docker Swarm 或 Kubernetes。

## 七、总结

`Docker Compose` 是 Docker 生态中不可或缺的工具，它将复杂的 Docker 命令抽象化，通过一个简单的 YAML 文件就能定义和管理整个应用程序栈。无论是个人开发者进行本地开发测试，还是小团队进行应用部署，`Docker Compose` 都能极大地提高效率和便利性。

掌握 `Docker Compose`，意味着你能够更优雅、更高效地构建、运行和管理你的多容器应用。
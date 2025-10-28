---
title: Prometheus与Grafana详解：现代监控的黄金组合
date: 2025-01-27 06:24:00
tags:
  - 2025
  - Prometheus
  - Grafana
  - 数据监控
  - Docker
categories:
  - 开发工具
  - 数据监控
---

> 在现代复杂的 IT 基础设施中，如何高效、准确地监控系统和应用的健康状况，并及时发现潜在问题，是运维和开发团队面临的巨大挑战。**Prometheus** 和 **Grafana** 正是为此而生的一对黄金搭档。Prometheus 负责数据的收集、存储和查询，而 Grafana 则负责数据的可视化和告警展示。它们共同构建了一个强大的开源监控解决方案，已成为云原生时代监控领域的事实标准。

{% note info %}
“没有监控的系统就像在黑暗中航行的船只，随时可能触礁。”
{% endnote %}
------

## 一、Prometheus 详解

### 1.1 Prometheus 是什么？

Prometheus 是一个开源的**时间序列数据库 (TSDB)** 和**监控系统**，由 SoundCloud 公司开发并于 2016 年加入云原生计算基金会 (CNCF)，是其第二个毕业项目。它采用了一种**拉取 (Pull)** 模型来收集指标数据，并通过强大的多维度数据模型和灵活的查询语言 (PromQL) 来支持复杂的告警和分析。

### 1.2 Prometheus 的核心特点与优势

*   **多维数据模型**：所有指标都是以时间戳和键值对（称为标签或 labels）的形式存储的。例如，`http_requests_total{method="post", handler="/path"}` 表示 `http_requests_total` 这个指标，但在 `method="post"` 和 `handler="/path"` 这两个维度上的值。
*   **灵活的查询语言 (PromQL)**：Prometheus Query Language 是一种强大而简洁的查询语言，用于过滤、聚合和转换时间序列数据。它支持各种数学运算、聚合函数和时间范围查询，可以轻松地进行趋势分析、比率计算和更复杂的业务指标分析。
*   **拉取模式**：Prometheus 主动从配置的目标（称为 exporters 或 instrumented applications）拉取指标数据。这种模型易于部署，且在服务发现方面具有优势。
*   **服务发现**：支持多种服务发现机制（如 Kubernetes, Consul, DNS 等），可以动态发现需要监控的目标。
*   **高效的存储**：Prometheus 实现了高效的本地时间序列数据库存储，可以处理大规模的数据，并且易于水平扩展。
*   **强大的告警**：通过 Alertmanager 组件，Prometheus 可以根据 PromQL 查询结果触发告警，并通过多种渠道（如邮件、Slack、Webhook 等）发送通知。
*   **云原生集成**：与 Docker、Kubernetes 等云原生技术栈深度融合，拥有丰富的 exporters 和集成方案。

### 1.3 Prometheus 的架构组件

一个典型的 Prometheus 监控系统包含以下核心组件：

1.  **Prometheus Server**：
    *   **Retrieval (抓取)**：通过 HTTP 协议从目标端点拉取指标数据。
    *   **Storage (存储)**：将抓取到的数据以时间序列的形式存储在本地磁盘中。
    *   **Query Engine (查询引擎)**： PromQL 查询语言的解析器和执行器。
2.  **Exporters / Instrumented Applications**：
    *   **Exporters**：是一种小型助手服务，它将现有系统的指标（例如操作系统、数据库、消息队列等）转换为 Prometheus 兼容的格式暴露出来。常见的有 `Node Exporter` (用于主机指标)、`cAdvisor` (用于容器指标)、``MySQL Exporter` 等。
    *   **Instrumented Applications**：应用程序本身嵌入了 Prometheus 客户端库，直接以 Prometheus 格式暴露自己的内部指标。
3.  **Pushgateway (可选)**：用于那些无法被 Prometheus 直接抓取（如短生命周期作业或批量任务）的指标。它允许这些作业将指标推送到 Pushgateway，然后 Prometheus 从 Pushgateway 拉取。
4.  **Alertmanager**：独立于 Prometheus Server 运行，接收 Prometheus 发送的告警通知，进行分组、去重、静默、并将告警路由到不同的通知接收器（邮件、Slack、Webhook 等）。
5.  **Grafana (或其它可视化工具)**：用于查询 Prometheus 数据并以图表、仪表盘的形式进行可视化展示。

### 1.4 Prometheus 部署示例 (使用 Docker Compose)

这里我们将部署一个 Prometheus Server 和一个 Node Exporter 来监控宿主机。

#### 1. 创建 Prometheus 目录结构

```bash
sudo mkdir -p /opt/prometheus/config
sudo mkdir -p /opt/prometheus/data # 用于存储 Prometheus 数据
sudo chmod -R 777 /opt/prometheus # 确保权限

cd /opt/prometheus
```

#### 2. 创建 Prometheus 配置文件 (`prometheus.yml`)

在 `/opt/prometheus/config` 目录下创建 `prometheus.yml`。

```bash
sudo nano config/prometheus.yml
```

```yaml
global:
  scrape_interval: 15s # 默认每 15 秒抓取一次
  evaluation_interval: 15s # 评估规则的频率

scrape_configs:
  - job_name: 'prometheus' # 监控 Prometheus 自身
    static_configs:
      - targets: ['localhost:9090'] # Prometheus 默认运行在 9090 端口

  - job_name: 'node_exporter' # 监控宿主机
    static_configs:
      - targets: ['localhost:9100'] # Node Exporter 默认运行在 9100 端口
```

保存并关闭文件。

#### 3. 创建 Docker Compose 文件 (`docker-compose.yml`)

在 `/opt/prometheus` 目录下创建 `docker-compose.yml`。

```bash
sudo nano docker-compose.yml
```

```yaml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest # Prometheus 镜像
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090" # 映射 Prometheus Web UI 端口
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml:ro # 挂载配置文件
      - ./data:/prometheus # 挂载数据目录，实现持久化
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'

  node_exporter:
    image: prom/node-exporter:latest # Node Exporter 镜像
    container_name: node_exporter
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/host/root'
      - '--collector.filesystem.mount-points-exclude=^/(dev|proc|sys|var/lib/docker/.+|var/run/docker.sock)($|/)'
    restart: unless-stopped
    network_mode: host # 使用 host 模式，Node Exporter 才能监控宿主机
    # ports: # host 模式下无需映射端口
    #   - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/host/root:ro,rslave # 用于监控文件系统
```

保存并关闭文件。

#### 4. 启动 Prometheus 和 Node Exporter

在 `/opt/prometheus` 目录下执行：

```bash
sudo docker compose up -d
```

#### 5. 访问 Prometheus Web UI

打开浏览器访问 `http://你的服务器IP:9090`。你可以在 `Status` -> `Targets` 页面看到 `prometheus` 和 `node_exporter` 两个目标都处于 `UP` 状态。在 `Graph` 页面输入 PromQL 查询语句（例如 `node_cpu_seconds_total`），即可查看数据。

## 二、Grafana 详解

### 2.1 Grafana 是什么？

Grafana 是一个开源的**度量分析和可视化工具**。它允许你查询、可视化、告警和探索存储在各种数据源中的指标数据。Grafana 不存储数据，它只是作为数据的前端展示层。

### 2.2 Grafana 的核心特点与优势

*   **多数据源支持**：可以连接多种数据源，包括 Prometheus、InfluxDB、Loki、Elasticsearch、MySQL、PostgreSQL、CloudWatch 等等。
*   **丰富的可视化选项**：提供多种面板类型（图表、折线图、柱状图、饼图、仪表盘、状态时间线、地理地图等）来展示数据。
*   **灵活的仪表盘**：通过拖放和配置面板，可以构建高度自定义的仪表盘，满足各种监控需求。
*   **强大的告警功能**：基于查询结果设置告警规则，并通过多种渠道（邮件、Slack、Webhook 等）发送通知。
*   **变量与模板**：使用变量可以将查询变为动态，方便在不同维度上切换视图，例如切换不同的服务器或容器。
*   **查询编辑器**：直观的查询编辑器，可以轻松构建复杂的查询语句。
*   **用户与权限管理**：支持多用户，并提供灵活的权限控制。
*   **插件生态系统**：拥有丰富的社区插件，可以扩展功能和支持新的数据源/面板。

### 2.3 Grafana 部署示例 (使用 Docker Compose)

我们将在 Prometheus 部署的基础上，额外部署 Grafana，并将其连接到 Prometheus 作为数据源。

#### 1. 创建 Grafana 目录结构

```bash
sudo mkdir -p /opt/grafana/data # 用于存储 Grafana 配置和数据库
sudo chmod -R 777 /opt/grafana # 确保权限

cd /opt/grafana
```

#### 2. 创建 Docker Compose 文件 (`docker-compose.yml`)

我们可以在 `/opt/prometheus` 目录下增加 Grafana 的服务到原有的 `docker-compose.yml` 中，或者在 `/opt/grafana` 目录下创建新的 `docker-compose.yml` 来单独部署。为了保持模块独立，我们选择在 `/opt/grafana` 目录下创建新的 `docker-compose.yml`。

```bash
sudo nano docker-compose.yml
```

```yaml
version: '3.8'
services:
  grafana:
    image: grafana/grafana:latest # Grafana 镜像
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3000:3000" # 映射 Grafana Web UI 端口
    volumes:
      - ./data:/var/lib/grafana # 挂载数据目录，实现持久化
    environment:
      - GF_SECURITY_ADMIN_USER=admin     # Grafana 管理员用户名
      - GF_SECURITY_ADMIN_PASSWORD=admin # Grafana 管理员密码 (请务必修改为强密码!)
      - GF_SERVER_ROOT_URL=http://localhost:3000 # 根据实际情况调整域名或IP
    depends_on:
      - prometheus # 确保 Prometheus 启动后再启动 Grafana (如果在一个 compose 文件中)
    # 如果 Prometheus 是在另一个 compose 文件中独立部署的，则需要确保其网络可达
```

**注意：**
*   `GF_SECURITY_ADMIN_PASSWORD=admin` **请务必将其修改为一个强密码！**
*   `depends_on`：如果 Prometheus 和 Grafana 在同一个 `docker-compose.yml` 文件中，可以添加此项。如果它们是独立部署的（如本例），则可以删除，但要确保 Grafana 能够通过网络访问到 Prometheus。

保存并关闭文件。

#### 3. 启动 Grafana

在 `/opt/grafana` 目录下执行：

```bash
sudo docker compose up -d
```

#### 4. 访问 Grafana Web UI

打开浏览器访问 `http://你的服务器IP:3000`。

使用你之前设置的用户名 (`admin`) 和密码 (`admin` - 请务必修改后登录!) 登录。

#### 5. 配置 Prometheus 数据源

登录 Grafana 后，你需要添加 Prometheus 作为数据源：

1.  在左侧导航栏中，点击齿轮图标 (⚙️) -> `Data sources`。
2.  点击 `Add data source`。
3.  搜索并选择 `Prometheus`。
4.  在 `HTTP` -> `URL` 字段中输入 Prometheus Server 的地址。
    *   如果 Prometheus 和 Grafana 在同一个 Docker Compose 文件中，且 `network_mode` 不是 `host`，则可以是 `http://prometheus:9090` (这里的 `prometheus` 是 `docker-compose.yml` 中 Prometheus 服务的名称)。
    *   如果 Prometheus 和 Grafana 分开部署，且 Prometheus 使用 `network_mode: host`，则输入 `http://你的服务器IP:9090`。
    *   如果 Prometheus 使用 `network_mode: bridge`，则需要输入 Prometheus 容器的 IP 地址或为其设置 DNS。
5.  点击 `Save & Test`。如果成功，页面会显示 `Data source is working`。

#### 6. 创建第一个仪表盘

现在你可以创建一个仪表盘来展示 Prometheus 的数据了：

1.  在左侧导航栏中，点击加号图标 (+) -> `Dashboard` -> `New dashboard`。
2.  点击 `Add new panel`。
3.  在查询编辑器中，选择你的 Prometheus 数据源。
4.  在 PromQL 查询框中输入你的查询语句，例如 `node_cpu_seconds_total`。
5.  选择合适的 `Visualization` 类型（如 `Graph`）。
6.  调整面板标题、图例、轴标签等。
7.  点击 `保存`。

### 2.4 Grafana 高级用法

*   **导入预设仪表盘**：Grafana 社区有大量的共享仪表盘模板（例如用于 Node Exporter、Prometheus 自身等）。你可以在 [Grafana Labs](https://grafana.com/grafana/dashboards/) 找到并导入它们。
    *   在左侧导航栏中，点击加号图标 (+) -> `Dashboard` -> `Import`。
    *   输入仪表盘 ID 或粘贴 JSON 模型。
*   **告警**：在任何面板中，你都可以点击 `Alert` 选项卡来创建告警规则，并配置告警通知渠道 (`Notification channels`)。
*   **变量**：在仪表盘设置中创建变量，可以在仪表盘顶部添加下拉菜单，动态改变查询的范围，例如切换 `instance` (服务器实例)。
*   **Loki / Tempo / Mimir**：Grafana Labs 不仅有 Grafana，还推出了 **Loki** (日志聚合)、**Tempo** (分布式链路追踪) 和 **Mimir** (可扩展的 Prometheus 存储)，它们与 Grafana 完美集成，共同构建了完整的可观测性解决方案。

## 三、总结：监控的黄金组合

Prometheus 和 Grafana 的组合是现代 IT 监控领域的强大基石。Prometheus 提供了强大的多维数据模型、灵活的查询语言和高效的存储能力，而 Grafana 则将这些数据以直观、美观、可定制的方式呈现在你面前，并辅以强大的告警功能。

无论是监控你的个人服务器，还是复杂的云原生应用集群，Prometheus 和 Grafana 都能提供卓越的性能和功能。它们的开源特性和活跃社区也保证了持续的创新和支持。通过本指南，你应该已经成功部署并开始探索这两个工具的强大功能，为你的系统和应用保驾护航。
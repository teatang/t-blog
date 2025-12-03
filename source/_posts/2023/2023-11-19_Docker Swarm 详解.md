---
title: Docker Swarm 详解
date: 2023-11-19 06:24:00
tags: 
    - 2023
    - Docker
    - 容器技术
categories: Docker
---
> **Docker Swarm** 是 Docker 官方提供的原生容器编排工具。它将一组 Docker 主机（宿主机）聚合成一个集群，并将这些主机视为单个虚拟的 Docker 主机。通过 Docker Swarm，用户可以轻松地部署、管理和扩展在多个节点上运行的容器化应用程序。它简化了容器集群的搭建和管理，特别适合那些希望在不引入过多复杂性的情况下，实现容器高可用和负载均衡的用户。

{% note info %}
核心思想：
**将多台物理机/虚拟机抽象成一个统一的资源池，并提供原生 Docker API 接口，从而实现容器的集群化部署、服务发现、负载均衡和故障恢复。**
{% endnote %}

------

## 一、为什么需要 Docker Swarm？

Docker Compose 解决了单机多容器应用的编排问题，但现代分布式应用程序通常需要运行在多台服务器（节点）上，以实现：

1.  **高可用性 (High Availability)**：单个节点故障不影响整个应用程序的运行。
2.  **负载均衡 (Load Balancing)**：将流量均匀分配到多个容器实例，提高应用程序的响应速度和吞吐量。
3.  **伸缩性 (Scalability)**：根据需求动态增加或减少应用程序的容器实例数量。
4.  **滚动更新 (Rolling Updates)**：在不停机的情况下，逐步更新应用程序版本。
5.  **服务发现 (Service Discovery)**：集群中的服务能够自动发现并相互通信。

传统手动在多台服务器上管理容器、端口映射、网络配置非常复杂且容易出错。Docker Swarm 的出现就是为了解决这些问题，提供一个简单易用的容器集群管理方案。

## 二、Docker Swarm 核心概念

1.  **Swarm (集群)**：
    *   由多个 Docker 主机组成的集群，共同运行容器化应用程序。
    *   集群中的每个 Docker 主机都被称为一个**节点 (Node)**。
2.  **Node (节点)**：
    *   参与 Swarm 集群的 Docker 主机。节点分为两种角色：
        *   **Manager Node (管理节点)**：负责 Swarm 集群的健康状态维护、工作节点的管理、调度服务任务以及处理 Swarm API 请求。管理节点之间可以有多个来提供高可用性 (RAFT 协议)。
        *   **Worker Node (工作节点)**：负责接收并执行管理节点分配的容器任务。它们是实际运行应用程序容器的节点。
3.  **Service (服务)**：
    *   在 Swarm 中运行的应用程序的定义。一个服务定义了要使用的 Docker 镜像、开放的端口、运行的副本数量、网络配置、存储卷等。
    *   服务可以是**全局服务 (Global Service)**，即在每个可用的工作节点上运行一个任务实例；也可以是**副本服务 (Replicated Service)**，即指定在集群中运行固定数量的任务实例。
4.  **Task (任务)**：
    *   服务的一个运行实例，是 Swarm 中调度的原子单位。
    *   在工作节点上运行一个容器以及其相关的命令。
    *   管理节点接收服务定义，将其分解为一系列任务，并分发给工作节点执行。
5.  **Desired State (期望状态)**：
    *   你通过服务定义向 Swarm 声明的应用程序的理想状态（例如，某服务应运行 3 个副本）。
    *   Swarm 会持续监控集群状态，并自动采取行动以使其达到期望状态，这实现了自愈和弹性。
6.  **Load Balancing (负载均衡)**：
    *   Docker Swarm 拥有内置的 DNS 服务发现和路由网格 (Routing Mesh)。
    *   当外部请求访问 Swarm 暴露的任意节点上的服务端口时，路由网格会将请求转发到集群中任意一个正在运行该服务任务的容器实例上。
7.  **Ingress Network (入口网络)**：
    *   Docker Swarm 的路由网格基于 Ingress 网络实现。这是一个特殊的层 7 负载均衡器，使得你可以通过集群中的任何节点 IP 访问任何服务，即使该服务容器不在该节点上运行。

## 三、Docker Swarm 架构

Docker Swarm 集群由一个或多个管理节点和零个或多个工作节点组成。

```mermaid
graph TD
    subgraph Swarm Cluster
        Manager1[Manager Node 1] <-->|RAFT| Manager2[Manager Node 2]
        Manager1 --- Worker1[Worker Node 1]
        Manager1 --- Worker2[Worker Node 2]
        Manager2 --- Worker3[Worker Node 3]
      
        linkStyle 0 stroke:red,stroke-width:2px;
        linkStyle 1 stroke:blue,stroke-width:1px;
        linkStyle 2 stroke:blue,stroke-width:1px;
        linkStyle 3 stroke:blue,stroke-width:1px;

        Worker1 -- Task --> ServiceA_Container1
        Worker2 -- Task --> ServiceA_Container2
        Worker2 -- Task --> ServiceB_Container1
        Worker3 -- Task --> ServiceB_Container2
        Worker3 -- Task --> ServiceC_Container1

        ExternalClient[(External Client)] -- Traffic --> Manager1
        ExternalClient -- Traffic --> Worker1
        ExternalClient -- Traffic --> Worker2

        Manager1 -- Orchestrates & Schedules --> WorkerNodes[Worker Nodes]
        WorkerNodes -- Runs Tasks (Containers) --> ServicePods[Service Containers]
        Manager1 -- Maintains Desired State --> ClusterState[Cluster State]
        Manager1 <-->|API| WorkerNodes

        subgraph Routing Mesh (Ingress Network)
            direction LR
            R1[Manager Node 1 IP:Port] --> LB[Load Balancer]
            R2[Worker Node 1 IP:Port] --> LB
            R3[Worker Node 2 IP:Port] --> LB
            LB --> ServiceA_Container1
            LB --> ServiceA_Container2
            LB --> ServiceB_Container1
            LB --> ServiceB_Container2
        end
    end

    style Manager1 fill:#f9f,stroke:#333,stroke-width:2px
    style Manager2 fill:#f9f,stroke:#333,stroke-width:2px
    style Worker1 fill:#ccf,stroke:#333,stroke-width:2px
    style Worker2 fill:#ccf,stroke:#333,stroke-width:2px
    style Worker3 fill:#ccf,stroke:#333,stroke-width:2px
```

*   **管理节点 (Manager Node)**：
    *   作为 Swarm 的大脑，决策容器的调度和编排。
    *   维护集群的所有状态（使用 Raft 一致性协议），保证高可用性和数据一致性。
    *   向客户端暴露 Docker API 接口。
*   **工作节点 (Worker Node)**：
    *   执行管理节点分配的任务，实际运行容器。

## 四、Docker Swarm 主要特性

1.  **去中心化设计 (Decentralized Design)**：
    *   Swarm 将管理节点和工作节点的管理能力分配到所有节点上，使得整个集群在架构上更加扁平化。
    *   管理节点使用 Raft 协议保证集群状态的一致性，允许少量管理节点失效而不影响集群。
2.  **服务发现与负载均衡 (Service Discovery & Load Balancing)**：
    *   内置 DNS 服务器，可以通过服务名称进行容器间通信。
    *   内置的路由网格 (Ingress Routing Mesh) 允许你通过集群中任何节点的 IP 地址和暴露的端口来访问任何服务，无论该服务的容器实例是否在该节点上运行，流量都会被路由到可用的容器实例。
3.  **容错与自愈 (Fault Tolerance & Self-healing)**：
    *   当一个工作节点故障或一个容器实例崩溃时，Swarm 管理器会自动在健康节点上重新调度并启动该容器，以维持服务的期望状态。
4.  **滚动更新与回滚 (Rolling Updates & Rollbacks)**：
    *   支持零停机滚动更新服务。你可以逐步更新服务的镜像版本，而不会造成服务中断。
    *   如果更新后出现问题，可以快速回滚到上一个稳定版本。
5.  **声明式服务模型 (Declarative Service Model)**：
    *   通过定义服务（如 Docker Compose 文件），声明应用程序的期望状态。Swarm 会努力维持这个状态。
6.  **安全性 (Security)**：
    *   所有节点之间的通信都通过 TLS (Transport Layer Security) 进行加密和认证，确保集群内部通信的安全。
7.  **与 Docker Compose 集成**：
    *   可以直接使用标准的 `docker-compose.yml` 文件来定义多容器应用，并使用 `docker stack deploy` 命令将其部署到 Swarm 集群中。这使得从单机开发到集群部署的迁移非常平滑。

## 五、Docker Swarm 常用命令

### 5.1 初始化 Swarm 集群

在第一台想要作为管理节点的机器上执行：

```bash
docker swarm init --advertise-addr <MANAGER_IP>
```

*   `<MANAGER_IP>` 应该是该管理节点对其他节点可访问的 IP 地址。
*   执行成功后，会输出一个 `docker swarm join` 命令，用于将其他节点加入集群。

### 5.2 将节点加入 Swarm 集群

**加入工作节点：**

```bash
docker swarm join --token <TOKEN> <MANAGER_IP>:<PORT>
```

*   `<TOKEN>` 是 `docker swarm init` 命令输出的工作节点加入令牌。
*   `<MANAGER_IP>:<PORT>` 是管理节点的 IP 地址和 Swarm 默认通信端口 (2377)。

**加入管理节点 (作为高可用管理节点)：**

```bash
docker swarm join --token <TOKEN> --manager <MANAGER_IP>:<PORT>
```

*   `<TOKEN>` 是 `docker swarm init` 命令输出的管理节点加入令牌。

### 5.3 退出/移除 Swarm 节点

**节点退出：**

```bash
docker swarm leave # 在要退出的节点上执行
```

**管理节点移除故障节点：**

```bash
# 查看所有节点
docker node ls
# 从 Swarm 中移除节点
docker node rm <NODE_ID/NODE_NAME>
```

### 5.4 服务管理

**创建服务：**

```bash
docker service create \
  --name my-web-app \
  --publish 80:80 \
  --replicas 3 \
  nginx:latest
```

*   `--name`：服务名称。
*   `--publish`：端口映射（宿主机端口:容器端口）。
*   `--replicas`：期望的容器副本数量。
*   `nginx:latest`：使用的 Docker 镜像。

**查看服务：**

```bash
docker service ls                # 列出所有服务
docker service ps my-web-app     # 查看服务的任务（容器）状态
```

**伸缩服务：**

```bash
docker service scale my-web-app=5 # 将 my-web-app 服务扩展到 5 个副本
```

**更新服务：**

```bash
docker service update \
  --image myregistry/my-web-app:v2.0 \
  --update-delay 10s \
  --update-parallelism 1 \
  my-web-app
```

*   `--image`：更新服务使用的镜像版本。
*   `--update-delay`：每个容器更新之间的延迟。
*   `--update-parallelism`：每次更新的容器数量。

**删除服务：**

```bash
docker service rm my-web-app
```

### 5.5 栈 (Stack) 管理 (使用 Docker Compose 文件)

**部署栈：**

```bash
docker stack deploy -c docker-compose.yml my-app-stack
```

*   `-c`：指定 Compose 文件。
*   `my-app-stack`：栈的名称。

**查看栈：**

```bash
docker stack ls                     # 列出所有栈
docker stack services my-app-stack  # 查看栈中所有服务的状态
docker stack ps my-app-stack        # 查看栈中所有任务的状态
```

**移除栈：**

```bash
docker stack rm my-app-stack
```

## 六、Docker Swarm 的优缺点与适用场景

### 6.1 优点：

1.  **开箱即用，易学易用**：Docker Swarm 是 Docker Engine 的一部分，安装 Docker 即可使用。命令与 Docker CLI 命令高度兼容，学习曲线平缓。
2.  **原生集成**：与 Docker 生态系统（如 Dockerfile, Docker Compose）无缝集成，可以直接部署已有的 `docker-compose.yml` 文件。
3.  **轻量级，低开销**：相比 Kubernetes，Docker Swarm 自身资源消耗更少，启动速度更快。
4.  **路由网格 (Routing Mesh)**：内置的负载均衡和 Ingress 网络简化了服务的暴露和访问。
5.  **适合小型至中型集群**：对于不需要极致复杂功能、更注重部署便捷性的场景非常适用。

### 6.2 缺点：

1.  **功能相对简单**：相比 Kubernetes，Swarm 在服务发现、存储管理、网络策略、身份认证和授权 (RBAC) 等方面功能较为基础。
2.  **生态系统较小**：社区活跃度和第三方工具集成度不如 Kubernetes。
3.  **高级调度能力不足**：不支持基于自定义资源（CRD）的复杂调度策略。
4.  **可扩展性限制**：在大规模集群或超高复杂度的应用场景下，其扩展性和稳定性可能不如 Kubernetes。

### 6.3 适用场景：

*   **刚开始接触容器编排，追求简单快速上手**：对于新手来说，Swarm 的概念和操作更加直观。
*   **开发和测试环境**：快速搭建高可用的多容器应用环境。
*   **小型或中型生产环境**：对资源要求不高、规模可预测的应用程序，部署在一组机器上。
*   **基于 Docker Compose 文件的现有应用**：可以几乎不做修改地迁移到 Swarm 集群。
*   **Proof of Concept (POC) 或演示**：快速证明容器集群化部署的价值。

## 七、与 Kubernetes 的关系

Docker Swarm 和 Kubernetes 都是容器编排工具，但它们在设计哲学、复杂性、功能集和生态系统方面存在显著差异：

| 特性         | Docker Swarm                                   | Kubernetes                                   |
| :----------- | :--------------------------------------------- | :------------------------------------------- |
| **复杂性**   | **低，易上手**，使用原生 Docker CLI 命令和概念。 | **高，学习曲线陡峭**，引入大量新概念（Pod, Deployment, Service, Ingress 等）。 |
| **安装部署** | **简单**，`docker swarm init` 即可建立集群。     | **复杂**，通常需要工具 (kubeadm, kops, Rancher) 来部署。 |
| **原生集成** | 与 Dockerfile, Docker Compose 无缝集成。         | 需要将 Docker Compose 转换为 K8s 配置 (如 `kompose`)。 |
| **负载均衡** | 内置路由网格 (Routing Mesh)。                    | 使用 Service (通过 kube-proxy IPVS/iptables) 和 Ingress Controller。 |
| **服务发现** | 内置 DNS。                                       | 内置 DNS。                                   |
| **高可用**   | Manager 节点通过 Raft 协议实现高可用。           | Control Plane 组件高可用，etcd 集群高可用。    |
| **可扩展性** | 适用于小型到中型规模。                           | 适用于大规模、超大规模集群。                   |
| **功能集**   | **核心编排功能**，较精简。                       | **功能丰富**：CRD, RBAC, 高级网络策略, 存储插件, 自动伸缩, Helm 等。 |
| **社区生态** | 较小，发展速度较慢。                             | **庞大且活跃**，拥有丰富的工具、插件和解决方案。 |
| **供应商支持** | Docker 公司原生支持。                            | 得到了几乎所有主流云厂商和企业的大力支持。     |
| **适用场景** | 小型项目、本地开发、快速原型、对运维要求不高的场景。 | 生产环境、微服务架构、大规模分布式系统、对灵活性和扩展性有高要求的场景。 |

## 八、总结

Docker Swarm 作为 Docker 官方提供的轻量级容器编排工具，为用户提供了一种简单、高效的方式来管理和部署多容器应用程序。它以其易用性、与 Docker 生态的无缝集成以及低开销等特点，成为中小规模容器集群的理想选择。虽然功能不如 Kubernetes 强大和灵活，但在许多场景下，Docker Swarm 能够满足需求，并提供了一个更平滑的容器化之旅。对于那些已经熟悉 Docker 并希望快速进入集群管理领域的用户来说，Docker Swarm 是一个极佳的起点。
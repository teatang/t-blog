---
title: RDMA (Remote Direct Memory Access) 详解
date: 2023-12-25 06:24:00
tags:
    - 2023
    - 计算机网络
    - 网络协议
categories:
    - 计算机网络
    - 网络协议
---

> **RDMA (Remote Direct Memory Access)** 是一种高性能网络通信技术，允许一台计算机（源端）的网卡（Network Interface Card, NIC）直接访问另一台远程计算机（目的端）的内存，而无需目的端操作系统的 CPU 介入。这种“零拷贝” (Zero-copy) 和“内核旁路” (Kernel-bypass) 的特性极大地减少了数据传输的延迟、提高了吞吐量，并显著降低了 CPU 占用率，是现代高性能计算 (HPC)、人工智能/机器学习 (AI/ML)、分布式存储和金融交易等领域中不可或缺的技术。

{% note info %}
核心思想：RDMA 的核心是**绕过操作系统内核的网络协议栈，实现远程内存的直接读写**。它将数据在源端和目的端之间传输的任务从 CPU 卸载到专用的网络硬件（RDMA 网卡，如 HCA），从而实现了**超低延迟、极高吞吐量和极低的 CPU 占用率**。
{% endnote %}
------

## 一、传统网络通信的痛点

在理解 RDMA 的优势之前，我们先回顾一下传统 TCP/IP 网络通信的数据路径，以及它所面临的挑战：

1.  **数据拷贝开销 (Data Copy Overheads)**：
    *   当应用程序发送数据时，数据通常从用户态内存拷贝到内核态的 socket 缓冲区。
    *   网卡再从内核态缓冲区拷贝数据到其内部 DMA (Direct Memory Access) 缓冲区，然后发送到网络。
    *   接收数据时，过程反向，数据从网卡 DMA 缓冲区拷贝到内核态 socket 缓冲区，再拷贝到用户态应用缓冲区。
    *   这些内存拷贝操作会消耗大量的 CPU 资源和内存带宽。

2.  **上下文切换开销 (Context Switching Overheads)**：
    *   数据传输涉及到多次用户态和内核态之间的上下文切换（例如，`send()` / `recv()` 系统调用），这会引入额外的 CPU 周期和延迟。

3.  **操作系统协议栈开销 (OS Protocol Stack Overheads)**：
    *   TCP/IP 协议栈作为一个复杂的软件模块运行在操作系统内核中，包括流量控制、拥塞控制、错误重传、分段/重组等功能。
    *   这些复杂的逻辑处理需要大量的 CPU 运算，限制了数据传输的性能。

**传统 TCP/IP 数据传输路径示意图：**

{% mermaid %}
graph TD
    A["应用 (用户空间)"] --> B{"系统调用 (e.g., send())"};
    B --> C["操作系统内核空间 (TCP/IP 协议栈)"];
    C --> D["TCP 缓冲区 (内核空间)"];
    D --> E["内存拷贝 (Kernel to NIC)"];
    E --> F["网卡 (NIC)"];
    F --> G[网络];

    G --> F1["网卡 (NIC)"];
    F1 --> E1["内存拷贝 (NIC to Kernel)"];
    E1 --> D1["TCP 缓冲区 (内核空间)"];
    D1 --> C1["操作系统内核空间 (TCP/IP 协议栈)"];
    C1 --> B1{"系统调用 (e.g., recv())"};
    B1 --> A1["应用 (用户空间)"];
{% endmermaid %}

这些开销在数据量小、延迟要求不高的场景可能微不足道，但在需要极低延迟和极高吞吐率的场景（如 HPC 或大规模分布式系统）中，将成为严重的性能瓶颈。

## 二、RDMA 的核心原理

RDMA 的设计目标是解决传统网络通信中的上述痛点，其核心理念是实现“内核旁路”和“零拷贝”。

1.  **内核旁路 (Kernel Bypass)**：
    *   RDMA 允许应用程序直接与网卡通信，绕过操作系统的 TCP/IP 协议栈。一旦连接建立，数据传输不再需要 CPU 参与协议处理，所有的数据包处理、确认、重传等都由专用的 RDMA 网卡 (称为 Host Channel Adapter, HCA) 在硬件层面完成。

2.  **零拷贝 (Zero-Copy)**：
    *   应用程序的数据可以直接从其用户态内存缓冲区发送到远程机器的用户态内存缓冲区，而无需经过任何中间的内核态内存拷贝。
    *   这通过**内存注册 (Memory Registration / Pinning)** 实现。应用程序需要“注册”其希望用于 RDMA 操作的内存区域。一旦内存被注册，它就会被“锁定”在物理内存中，不会被操作系统交换到磁盘，并且网卡可以直接对其进行 DMA 操作。

**RDMA 数据传输路径示意图：**

{% mermaid %}
graph TD
    A["应用 (用户空间)"] <--> B{"RDMA API (Verbs)"};
    B <--> C[RDma 网卡 / HCA];
    C <--> D[网络];

    D <--> C1[RDMA 网卡 / HCA];
    C1 <--> B1{"RDMA API (Verbs)"};
    B1 <--> A1["应用 (用户空间)"];
{% endmermaid %}

通过这种机制，RDMA 极大地减少了数据传输的路径和 CPU 的参与，从而实现了相比传统网络数量级降低的延迟和更高的吞吐量。

## 三、RDMA 的主要优势

RDMA 的核心原理带来了显著的性能提升：

1.  **极低延迟 (Ultra-Low Latency)**：
    *   由于内核旁路和零拷贝，数据传输路径最短，协议处理硬件化。典型延迟可以达到微秒 (μs) 甚至亚微秒级别，远低于传统 TCP/IP 的数十到数百微秒。
    *   例如，InfiniBand 通常可以实现 1-2 μs 的延迟。

2.  **极高吞吐量 (High Throughput)**：
    *   RDMA 网卡能够以接近或达到理论线速的速度传输数据。通过卸载 CPU 的任务，它能够充分利用网络带宽，实现每秒数TB的数据传输能力。

3.  **极低 CPU 占用率 (Low CPU Utilization)**：
    *   大部分数据传输和协议处理工作由 HCA 硬件完成，CPU 几乎不需要介入。这使得 CPU 可以将更多计算资源用于执行应用程序逻辑，而不是网络 I/O。

4.  **提高应用效率**：
    *   通过减少等待时间、提高数据传输速度和释放 CPU 资源，整体应用性能和可扩展性得到显著提升。

## 四、RDMA 网络技术与协议

RDMA 并非一种独立的网络协议，而是一种通过特定硬件和软件实现数据传输机制的总称。目前主要有以下几种实现 RDMA 的网络技术：

1.  **InfiniBand (IB)**：
    *   **历史最悠久，性能最高**的原生 RDMA 技术。
    *   设计之初就是为了高性能计算而生，拥有自己的网络协议栈和专用硬件（HCA 和交换机）。
    *   提供原子操作、拥塞控制等高级功能。
    *   **特点**：极低延迟、极高吞吐量、专用硬件、非以太网协议。

2.  **RDMA over Converged Ethernet (RoCE)**：
    *   **基于以太网实现 RDMA**。允许在标准以太网基础设施上运行 RDMA，无需 InfiniBand 专用硬件。
    *   **RoCEv1**：基于以太网链路层 (Layer 2)，不可路由。
    *   **RoCEv2**：基于 IP 和 UDP 协议 (Layer 3)，可路由。这是目前应用最广泛的 RDMA over Ethernet 技术。
    *   **特点**：利用现有以太网基础设施、较高性能（略低于原生 IB 但显著优于 TCP）、需要支持 PFC (Priority Flow Control) 的无损以太网。

3.  **iWARP (Internet Wide Area RDMA Protocol)**：
    *   **基于 TCP 协议实现 RDMA**。
    *   iWARP 的 HCA 在硬件层面实现了 TCP/IP 协议栈，使得 RDMA 操作在 TCP 连接上进行。
    *   **特点**：可以在标准 TCP/IP 以太网基础设施上工作，无需无损网络。但由于底层依然是 TCP，其延迟和吞吐量通常略高于 RoCE，且对 CPU 占用率的降低不如 RoCE 和 InfiniBand 彻底。

**常见 RDMA 技术对比：**

| 特性         | InfiniBand (IB)                 | RoCEv2 (RDMA over Converged Ethernet)        | iWARP (Internet Wide Area RDMA Protocol) |
| :----------- | :------------------------------ | :------------------------------------------- | :--------------------------------------- |
| **底层协议** | InfiniBand (专用)               | UDP/IP (以太网)                            | TCP/IP (以太网)                          |
| **网络类型** | 专用网络                        | 以太网 (通常需无损以太网)                  | 以太网 (标准有损以太网)                  |
| **延迟**     | 极低 (1-2 µs)                   | 低 (几 µs，略高于 IB)                      | 较低 (约 10 µs，高于 RoCE)               |
| **吞吐量**   | 极高 (原生线速)                 | 高 (接近线速)                              | 高                                       |
| **路由性**   | 可路由 (通过 IB 路由器)         | 可路由 (Layer 3)                           | 可路由                                   |
| **硬件需求** | 专用 HCA 和交换机               | 具备 RoCEv2 功能的 NIC (HCA) 和支持 PFC 的交换机 | 具备 iWARP 功能的 NIC (HCA)            |
| **CPU 卸载** | 高度卸载 (协议、流控、拥塞控制) | 高度卸载 (协议、流控、拥塞控制)            | 较低的 CPU 卸载 (TCP/IP 栈在 NIC)       |

## 五、RDMA 核心组件与概念

理解 RDMA 需要掌握一些核心的硬件和软件概念：

1.  **主机通道适配器 (Host Channel Adapter, HCA)**：
    *   RDMA 的专用网卡。它是实现 RDMA 机制的核心硬件，负责处理 RDMA 消息、进行 DMA 操作、管理连接、执行协议任务，从而将 CPU 从这些工作中解放出来。

2.  **Verbs API**：
    *   RDMA 的标准编程接口。它是一组低层次的函数库，允许应用程序直接管理 HCA 的资源。
    *   `ibv_*` 系列库是 InfiniBand 和 RoCE 的标准 API。

3.  **保护域 (Protection Domain, PD)**：
    *   PD 是 RDMA 资源的容器和管理单元，用于隔离和保护不同的应用程序。所有与特定 RDMA 上下文（例如一个应用程序）相关的 HCA 资源（QP, MR, CQ）都必须绑定到一个 PD。

4.  **队列对 (Queue Pair, QP)**：
    *   QP 是 RDMA 连接的端点，由一个发送队列 (Send Queue, SQ) 和一个接收队列 (Receive Queue, RQ) 组成。
    *   每个 QP 代表一个逻辑连接，应用程序通过向 SQ 提交工作请求 (Work Request, WR) 来发送数据，并从 RQ 接收数据（在双边操作中）。QP 必须连接到远程的 QP 才能进行 RDMA 通信。

5.  **内存区域 (Memory Region, MR) 与内存键 (Memory Key, MK)**：
    *   MR 是应用程序注册给 HCA 的一段内存区域，用于 RDMA 操作。当内存被注册后，HCA 可以直接对其进行 DMA 访问。
    *   注册过程会返回一个**内存键 (Memory Key, MK)**，包括 L_Key (Local Key) 和 R_Key (Remote Key)。
        *   **L_Key**：用于本地 HCA 访问该 MR。
        *   **R_Key**：用于远程 HCA 访问该 MR。远程 HCA 需要有效 R_Key 才能对目标 MR 执行 RDMA 操作，这提供了内存访问的权限控制。

6.  **工作请求 (Work Request, WR)**：
    *   应用程序向 QP 提交的 RDMA 操作请求，例如发送数据、接收数据、远程写入、远程读取等。
    *   一个 WR 包含了操作类型、本地数据缓冲区信息 (MR、偏移量、长度)、远程目标信息 (远程 QP、R_Key、远程地址) 等。

7.  **完成队列 (Completion Queue, CQ)**：
    *   HCA 用来通知应用程序 RDMA 操作完成的队列。当一个 WR 被 HCA 执行完成时，HCA 会在 CQ 中放入一个**工作完成 (Work Completion, WC)** 事件。应用程序通过轮询或中断的方式从 CQ 获取 WC。

## 六、RDMA 操作类型

RDMA 操作可以分为两大类：

1.  **单边操作 (One-sided Operations/RDMA Read & Write)**：
    *   这是 RDMA 最独特的特性，也是其实现“内核旁路”和“零拷贝”的关键。
    *   **远程写入 (RDMA Write / Put)**：源端应用程序向一个远程内存区域写入数据。远程端不需要执行任何操作（如 `recv()`），其 CPU 也无需介入。源端 HCA 直接将数据写入目的端 HCA 注册的内存区域。
    *   **远程读取 (RDMA Read / Get)**：源端应用程序从一个远程内存区域读取数据到本地内存区域。远程端不需要执行任何操作（如 `send()`），其 CPU 也无需介入。目的端 HCA 直接将数据传输给源端 HCA。
    *   **特点**：无需目的端 CPU 参与，仅由源端的应用程序发起，对性能提升最明显。

2.  **双边操作 (Two-sided Operations / Send & Receive)**：
    *   类似于传统的 message passing (消息传递)，但依然是内核旁路的。
    *   源端应用程序发起一个 `Send` 操作，目的端应用程序必须提前发起一个 `Receive` 操作来接收数据。
    *   **特点**：虽然仍需要两边应用程序的协调，但在 HCA 硬件层面处理，避免了 OS 协议栈的开销和内存拷贝，因此比传统 TCP 仍然高效得多。

## 七、RDMA 编程模型 (概念性)

RDMA 编程通常涉及以下步骤（使用 Verbs API）：

1.  **资源初始化**：
    *   打开 HCA 设备。
    *   分配保护域 (PD)。
    *   创建并初始化两端的队列对 (QP)。
    *   创建完成队列 (CQ)。

2.  **内存注册 (Memory Registration)**：
    *   应用程序分配用于数据传输的缓冲区。
    *   将这些缓冲区注册到 HCA，获取内存键 (R_Key, L_Key)。注册的目的是将虚拟地址转换为物理地址，并锁定内存，防止操作系统将其交换出物理内存。

3.  **QP 状态转换与连接建立**：
    *   QP 经历一系列状态转换 (如 RESET -> INIT -> RTR (Ready To Receive) -> RTS (Ready To Send))。
    *   在 RTR/RTS 阶段，两端的 QP 会交换必要的信息进行连接建立（例如，目的地的 QP 号、L_Key、连接 ID 等）。

4.  **数据传输**：
    *   **提交工作请求 (Work Request, WR)**：应用程序创建 WR (例如，RDMA_WRITE, RDMA_READ, SEND)，指定本地缓冲区、远程缓冲区（对于单边操作）、R_Key 等信息，并将其提交到 QP 的发送队列 (SQ)。
    *   HCA 从 SQ 中取出 WR 并执行对应的 RDMA 操作。

5.  **完成事件处理**：
    *   HCA 完成 WR 后，会将一个工作完成 (Work Completion, WC) 放入 CQ。
    *   应用程序通过轮询 CQ 或等待中断的方式，来检查操作是否完成，并获取 WC 的结果。

6.  **资源清理**：
    *   关闭设备，释放所有分配的 PD, QP, MR, CQ 等资源。

```python
# 概念性的 Python (pyverbs 库) 编程流程示例
# 实际代码会复杂得多，涉及错误处理、内存管理等

import pyverbs.providers.mlx5 as mlx5_prov
import pyverbs.device as pv_dev
import pyverbs.pd as pv_pd
import pyverbs.qp as pv_qp
import pyverbs.mr as pv_mr
import pyverbs.cq as pv_cq
import pyverbs.wr as pv_wr

# 假设已经初始化好网络设备和远程QP信息

def rdma_client_example(server_ip_addr, port, rkey, remote_vaddr):
    # 1. 打开 RDMA 设备
    dev = mlx5_prov.get_devices()[0] # 获取第一个RDMA设备
    context = pv_dev.Context(dev)

    # 2. 分配保护域 (PD)
    pd = pv_pd.PD(context)

    # 3. 创建完成队列 (CQ)
    cq = pv_cq.CQ(context, 100) # 100个完成事件的CQ

    # 4. 创建队列对 (QP)
    # 假设QP类型为RC (Reliable Connected)
    qp = pv_qp.QP(pd, cq, cq, pv_qp.IBV_QPT_RC, 16, 16) # SQ/RQ深度为16

    # 5. 内存注册 (MR)
    # 申请一块本地内存，并注册
    local_buffer = bytearray(b'Hello from RDMA Client')
    mr = pv_mr.MR(pd, len(local_buffer), pv_mr.IBV_ACCESS_LOCAL_WRITE | pv_mr.IBV_ACCESS_REMOTE_WRITE)
    mr.write(local_buffer, 0) # 将数据写入注册的内存

    # 6. QP 状态转换 (INIT -> RTR -> RTS) 和连接
    # 这部分涉及复杂的连接管理和参数交换，通常需要自定义协议或使用librdmacm
    # 简化为直接设置连接参数
    qp.to_init()
    qp_init_attr = pv_qp.QPInitAttr()... # 设置QP初始属性
    qp.to_rtr(server_ip_addr, port, remote_qp_num) # 假设已知远程QP号
    qp.to_rts()

    print("QP connected. Ready for RDMA WRITE.")

    # 7. 提交 RDMA WRITE 工作请求 (WR)
    sge = pv_wr.SGE(mr.lkey, mr.addr, mr.length)
    wr = pv_wr.RDMAWrite(qp, sge, rkey, remote_vaddr) # rkey, remote_vaddr 来自server

    qp.post_send(wr) # 提交发送请求

    # 8. 轮询完成队列 (CQ)
    ret_wc = cq.poll_cq_blocking(1) # 阻塞等待1个完成事件
    if ret_wc:
        print(f"RDMA WRITE completed. Status: {ret_wc[0].status}")
    else:
        print("RDMA WRITE failed or timed out.")

    # 9. 清理资源
    qp.destroy()
    mr.dereg()
    cq.destroy()
    pd.destroy()
    context.close()

# 远程服务器端会进行类似的初始化，注册自己的内存区域并分享 R_Key 和虚拟地址
```

## 八、典型应用场景

RDMA 技术因其卓越的性能，已成为多个关键领域的核心：

1.  **高性能计算 (HPC)**：
    *   在超级计算机集群中，作为节点间互联的主要技术，加速 MPI (Message Passing Interface) 消息传递，实现大规模并行计算的高效数据交换。

2.  **人工智能与机器学习 (AI/ML)**：
    *   分布式深度学习训练中，大量模型参数和梯度需要在 GPU 之间高效同步。RDMA 结合 **NVIDIA GPUDirect RDMA** 允许 GPU 直接读写远程 GPU 内存，极大地加速了训练过程。

3.  **分布式存储 (Distributed Storage)**：
    *   **NVMe over Fabrics (NVMe-oF)**：允许应用程序通过 RDMA 直接访问远程的 NVMe 固态硬盘，而无需经过远程服务器的 CPU，将存储延迟和带宽利用率推向极致。
    *   Ceph、GlusterFS 等分布式存储系统也在积极采纳 RDMA 以提高性能。

4.  **内存数据库和数据分析 (In-Memory Databases / Data Analytics)**：
    *   如 Apache Spark、SAP HANA 等分布式内存数据库和分析引擎，利用 RDMA 快速传输内存中的数据，加速查询和数据处理。

5.  **金融交易 (Financial Trading)**：
    *   股票交易系统、高频交易 (HFT) 对延迟有极致要求，RDMA 被用于实现毫秒级的市场数据分发和交易指令执行。

## 九、挑战与考量

尽管 RDMA 优势显著，但在部署和使用时也面临一些挑战：

1.  **编程复杂度**：
    *   RDMA Verbs API 是低层次的，编程复杂，容易出错。通常需要使用更高层次的库或框架（如 MPI、gRPC with RDMA Transport）来简化开发。

2.  **硬件成本与兼容性**：
    *   需要专用的 RDMA 网卡 (HCA) 和可能需要支持无损以太网的交换机（对于 RoCE）。这增加了硬件成本和网络基础设施的复杂性。

3.  **安全性**：
    *   直接内存访问意味着更高的权限和风险。如果 R_Key 管理不当，可能导致未经授权的远程内存访问。

4.  **部署与运维**：
    *   RDMA 网络的部署、配置和故障排除比传统以太网更复杂，需要专用的知识和工具。

## 十、总结

RDMA (Remote Direct Memory Access) 是一种革命性的网络通信技术，通过其“内核旁路”和“零拷贝”的核心机制，极大地变革了数据中心和高性能计算的通信范式。它带来的超低延迟、极高吞吐量和极低 CPU 占用率，使其成为 HPC、AI/ML、分布式存储和金融交易等对性能有极致要求的应用领域的基石。尽管面临编程复杂度、硬件成本和安全性等挑战，但随着软件抽象层的发展和硬件成本的下降，RDMA 有望在更广泛的范围内得到应用，并持续推动分布式系统和数据处理技术的进步。
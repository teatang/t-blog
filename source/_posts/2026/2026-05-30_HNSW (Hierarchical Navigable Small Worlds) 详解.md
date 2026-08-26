---
title: HNSW (Hierarchical Navigable Small Worlds) 详解
date: 2026-05-30 06:24:00
tags:
  - 2026
  - AI
  - LLM
  - ANN
  - 向量
categories:
  - AI
  - 向量
mathjax: true
---

> **Hierarchical Navigable Small Worlds (HNSW)** 是一种高效的**近似最近邻 (Approximate Nearest Neighbor, ANN)** 搜索算法。它通过构建一个多层图结构来在多维空间中快速查找与查询点最相似的数据点。HNSW 结合了分层结构（hierarchical）和跳表（skip-list）的思想，旨在克服高维空间中精确最近邻搜索的“维数灾难”问题，同时保持较高的搜索精度和查询速度。

{% note info %}
核心思想：**将高维向量空间中的搜索问题转化为在多层图结构上的路径导航问题，通过“粗粒度”的顶层快速定位到大致区域，再通过“细粒度”的底层精确搜索局部最近邻。**
{% endnote %}
------

## 一、为什么需要 HNSW？ANN 算法的背景

在向量数据库中，核心任务是在一个包含数百万甚至数十亿高维向量的数据集中，找到与给定查询向量最相似的 $K$ 个向量（即 K-Nearest Neighbors, K-NN）。

传统的精确 K-NN 搜索方法，如通过计算查询向量与所有存储向量的欧氏距离或余弦相似度进行全量扫描，其时间复杂度为 $O(N \cdot D)$，其中 $N$ 是向量总数，$D$ 是向量维度。在高维空间中，这种方法面临严重的挑战：

1.  **维数灾难 (Curse of Dimensionality)**：随着维度的增加，数据点在高维空间中变得异常稀疏，所有数据点之间的距离差异逐渐缩小，导致精确距离计算变得不再那么有意义，且计算成本急剧上升。
2.  **性能瓶颈**：全量扫描在大规模数据集上是不可接受的，其延迟过高，无法满足实时应用的需求。
3.  **内存消耗**：索引数据结构（如 KD-树或 Ball-树）在高维空间中效率低下，通常不适合处理超过 20 维以上的数据。

为了解决这些问题，**近似最近邻 (Approximate Nearest Neighbor, ANN)** 搜索算法应运而生。ANN 算法通过牺牲少量的搜索精度，来换取查询速度的显著提升。HNSW 正是其中一种在精度和速度之间取得出色平衡的先进 ANN 算法。

## 二、HNSW 的核心概念与原理

HNSW 算法构建了一个多层的跳表式图结构，将搜索过程从传统的线性扫描转变为图上的路径导航。

### 2.1 Navigable Small World (NSW) 图

HNSW 的基础是 **Navigable Small World (NSW)** 图。NSW 图是一种特殊类型的图，其特点是：
*   **小世界特性**：图中任意两个节点之间可以通过少量跳数连接起来。这通常通过在局部连接的节点之外，增加一些长距离连接的节点来实现。
*   **局部连接**：每个节点与其最近的邻居连接。

在 NSW 图中进行搜索时，通常采用贪婪策略：从一个起始点开始，每次移动到邻居中距离查询点最近的那个节点，直到无法找到更近的邻居为止。这种方法比全量扫描快得多，但仍可能存在局部最优解，且在高维空间中效率仍有提升空间。

### 2.2 分层结构 (Hierarchical Structure)

HNSW 在 NSW 的基础上引入了**分层结构**，这是其最核心的改进。它构建了一个多层的图，每层都是一个 NSW 图的子集。

*   **层级特点**：
    *   **顶层 (Highest Layer)**：包含最少的节点，节点之间的连接稀疏且距离较远。这一层用于快速导航，能够迅速将搜索范围缩小到查询点的大致区域。
    *   **底层 (Base Layer, Level 0)**：包含所有的节点，节点之间的连接密集且距离较近。这一层用于精细搜索，在初步定位后，能够在此层找到精确的最近邻。
    *   **中间层 (Intermediate Layers)**：节点数量和连接密度介于顶层和底层之间，作为连接上下层级的桥梁。

*   **概率性层分配**：每个节点在插入时，会以一个概率 $p$ 随机分配到更高的层。这意味着，一个节点可能只存在于 Level 0，也可能存在于 Level 0、Level 1、Level 2 等多个层。层级越高，节点被分配到的概率越低，因此高层包含的节点越少，连接越稀疏。

    节点 $v$ 被分配到的最高层级 $L_v$ 通常通过以下公式确定：
    $$L_v = \lfloor -\ln(\text{rand}()) / m \rfloor$$
    其中：
    *   $\text{rand}()$ 是一个在 $(0, 1]$ 之间均匀分布的随机数。
    *   $m$ 是一个与概率 $p$ 相关的参数，通常 $m = \ln(1/p)$。较小的 $p$ 值（例如 $p=1/e \approx 0.368$）会导致更深的层级结构。

    这个概率分配机制确保了层级结构中节点数量的指数级递减，从而使得高层图更加稀疏，有利于快速导航。

### 2.3 插入过程 (Insertion Process)

当一个新的向量 $V_{new}$ 需要插入到 HNSW 图中时，其过程如下：

1.  **确定最高层级**：根据概率函数为 $V_{new}$ 随机分配一个最高层级 $L_{new}$。
2.  **初始化入口点**：从图的当前最高层开始，找到一个全局入口点 (entry point)，通常是距离 $V_{new}$ 最近的现有节点。
3.  **从上到下逐层搜索**：
    *   对于从 $L_{new}$ 到 Level 1 的每一层：
        *   在当前层进行贪婪搜索（类似于 NSW 搜索），从入口点开始，找到距离 $V_{new}$ 最近的 $efConstruction$ 个候选邻居。
        *   将这些候选邻居中的最接近者作为下一层的入口点。
        *   这一步是为了将搜索范围逐步缩小到 $V_{new}$ 所在的局部区域。
4.  **在 $L_{new}$ 及以下层插入节点并连接邻居**：
    *   对于从 $L_{new}$ 到 Level 0 的每一层：
        *   将 $V_{new}$ 添加到当前层。
        *   在当前层中，从通过上一步骤确定的入口点（或其扩展的候选邻居集）中，选择距离 $V_{new}$ 最近的 $M$ 个邻居与 $V_{new}$ 建立连接。
        *   为了保持图的连接质量，可能还会调整这些邻居的反向连接（即如果 $V_{new}$ 是其邻居的最近邻之一，邻居也会连接 $V_{new}$）。
        *   同时，可能需要应用一个启发式算法（如：优先连接那些与新节点相似度高且同时与其他现有节点相似度较低的邻居），以优化图的结构并避免“集线器”节点（hub nodes）。

### 2.4 搜索过程 (Search Process)

当一个查询向量 $Q$ 进入时，HNSW 的搜索过程如下：

1.  **从顶层开始**：
    *   从图的当前最高层开始，找到一个全局入口点（通常是之前插入的某个节点或预设的入口节点）。
    *   在最高层进行贪婪搜索，从入口点开始，迭代查找距离 $Q$ 最近的 $efSearch$ 个候选邻居。这个过程是利用稀疏的高层图快速逼近 $Q$ 的大致位置。
2.  **逐层下降**：
    *   将从当前层找到的 $efSearch$ 个候选邻居作为下一层的入口点集合。
    *   重复在下一层进行贪婪搜索，不断缩小搜索范围，直到到达 Level 0。
3.  **在 Level 0 精细搜索**：
    *   在 Level 0（包含所有节点），利用从上一层得到的候选集作为起始点，进行更广泛的贪婪搜索。
    *   维护一个动态的最近邻列表，找到距离 $Q$ 最近的 $K$ 个向量。
    *   `efSearch` 参数决定了搜索的宽度，它是一个重要的精度-速度权衡参数。

### HNSW 算法概念图

{% mermaid %}
flowchart TD
    subgraph HNSW ["HNSW (Hierarchical Navigable Small Worlds)"]
        direction TB

        subgraph LayerTop ["最高层 (Layer L · 稀疏跳跃)"]
            L_entry(["入口点 (Entry Point)"]):::entryNode
            V_L1("Node A"):::nodeStyle
            V_L2("Node B"):::nodeStyle
            V_L3("Node C"):::nodeStyle

            L_entry -.-> V_L1
            V_L1 --- V_L2 --- V_L3 --- V_L1
        end

        subgraph LayerMid ["中间层 (Layer L-1 · 快速路由)"]
            V_M1("Node D"):::nodeStyle
            V_M2("Node E"):::nodeStyle
            V_M3("Node F"):::nodeStyle

            V_M1 --- V_M2 --- V_M3 --- V_M1
        end

        subgraph Layer0 ["底层 (Layer 0 · 全量稠密图)"]
            V_B1("Node G"):::nodeStyle
            V_B2("Node H"):::nodeStyle
            V_B3("Node I"):::nodeStyle
            V_B4("Node J"):::nodeStyle

            V_B1 --- V_B2 --- V_B3 --- V_B4 --- V_B1
        end

        %% 层间跨层投影/映射关系 (虚线)
        V_L1 -.-x|投影下沉| V_M1
        V_M1 -.-x|投影下沉| V_B1
    end

    Query[/"🔍 查询向量 Q"/]:::queryNode
    Result[/"🎯 最相似的 Top-K 结果"/]:::resultNode

    Query ==>|"1. 锁定入口"| L_entry
    LayerTop ==>|"2. 贪婪搜索 (ef=1) 定位局部最近邻"| LayerMid
    LayerMid ==>|"3. 逐层下沉并更新候选集"| Layer0
    Layer0 ==>|"4. 底层精搜 (efSearch)"| Result

    %% 节点样式定义 (高对比度暗色调)
    classDef queryNode fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#e0e7ff;
    classDef resultNode fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#ecfdf5;
    classDef entryNode fill:#431407,stroke:#fb923c,stroke-width:2px,color:#ffedd5;
    classDef nodeStyle fill:#1e293b,stroke:#64748b,stroke-width:1.5px,color:#f8fafc;

    %% 容器背景分层深色
    style HNSW fill:#0b0d13,stroke:#334155,stroke-width:1.5px,color:#94a3b8;
    style LayerTop fill:#131826,stroke:#3b82f6,stroke-width:1px,stroke-dasharray: 3 3,color:#93c5fd;
    style LayerMid fill:#131826,stroke:#6366f1,stroke-width:1px,stroke-dasharray: 3 3,color:#a5b4fc;
    style Layer0 fill:#131826,stroke:#8b5cf6,stroke-width:1px,stroke-dasharray: 3 3,color:#c4b5fd;
{% endmermaid %}
**说明**：HNSW 算法通过构建一个多层导航图，从顶层开始，利用稀疏的连接快速定位到查询向量的大致区域。然后逐层向下，在更密集的层中进行更精细的搜索，最终在 Level 0 找到近似的最近邻。这种分层策略大大减少了需要计算的距离数量。

## 三、HNSW 算法的优势与特点

1.  **高效率**：HNSW 实现了近似对数级的搜索时间复杂度（$O(\log N)$），在大规模数据集上表现出极高的查询速度。
2.  **高精度**：通过调整搜索参数 `efSearch`，可以在速度和精度之间进行灵活权衡，可以达到非常接近精确 K-NN 的精度。
3.  **内存效率**：虽然需要存储图结构和邻居信息，但相比于精确 K-NN，其内存占用在处理大规模数据集时更为合理。
4.  **支持动态更新**：HNSW 允许高效地添加（插入）和删除节点，这对于需要实时更新向量索引的场景非常重要。
5.  **参数可调性**：算法提供多个可调参数（`M`、`efConstruction`、`efSearch` 等），用户可以根据具体需求进行优化。
6.  **广泛应用**：是目前最流行和高效的 ANN 算法之一，被广泛应用于 Milvus、Qdrant、Weaviate 等主流向量数据库中。

## 四、HNSW 的参数调优

理解并合理配置 HNSW 的参数对于获得最佳性能至关重要。

*   `M` (Maximum number of neighbors for each node in the graph)：
    *   **定义**：在构建图时，每个节点在每层最多连接的邻居数量。
    *   **影响**：
        *   **更大的 `M`**：会创建更密集的图，增加连接的数量，提高搜索精度和鲁棒性，但也会增加内存消耗和构建时间。
        *   **更小的 `M`**：图更稀疏，内存占用和构建时间更少，但可能牺牲精度。
    *   **典型取值**：通常在 16 到 64 之间。
*   `efConstruction` (size of the dynamic list for constructing the graph)：
    *   **定义**：在构建索引（插入新节点）时，用于搜索和选择邻居的候选集大小。
    *   **影响**：
        *   **更大的 `efConstruction`**：构建时会进行更广泛的搜索，从而找到更优的邻居连接，提高索引质量和查询精度，但会显著增加构建时间。
        *   **更小的 `efConstruction`**：构建速度快，但可能导致索引质量下降，影响后续的查询精度。
    *   **典型取值**：通常在 100 到 2000 之间，取决于数据集规模和所需的精度。
*   `efSearch` (size of the dynamic list for search)：
    *   **定义**：在查询时，用于搜索和返回最终结果的候选集大小。
    *   **影响**：
        *   **更大的 `efSearch`**：查询时会进行更广泛的搜索，从而提高搜索精度，但会增加查询延迟。
        *   **更小的 `efSearch`**：查询速度快，但可能牺牲精度。
    *   **典型取值**：通常在 10 到 1000 之间，这是一个在查询延迟和精度之间进行权衡的重要参数。`efSearch` 应该大于或等于查询时需要的 $K$ 值（即 Top-K 结果数量）。
*   `m` (level multiplier, or $1/\ln(p)$ in some contexts):
    *   **定义**：用于控制层级分布的参数，与概率 $p$ 相关。
    *   **影响**：控制层级数量和每层节点的稀疏度。通常由库内部自动设置或隐藏，但理解其作用有助于把握 HNSW 的结构。

**参数选择的通用策略**：
1.  **从较小的 `M` 和 `efConstruction` 开始**，逐渐增加它们的值，观察精度和性能的变化。
2.  **`efConstruction` 总是应该大于 `M`**。
3.  **`efSearch` 可以在运行时调整**，以平衡查询速度和精度。通常 `efSearch` 应该大于或等于查询结果的 `k` 值。
4.  **内存限制**：在调整参数时，始终要考虑可用的内存资源。

## 五、HNSW 的局限性

尽管 HNSW 表现卓越，但它并非没有局限性：

1.  **内存消耗**：图结构和邻居信息会占用显著的内存。对于极高维度或极大规模的数据集，内存压力可能成为一个瓶颈。
2.  **构建时间**：当 `M` 和 `efConstruction` 设置得很高以追求极限精度时，索引的构建时间可能会非常长。
3.  **参数敏感性**：算法性能高度依赖于参数的合理选择，不当的参数配置可能导致性能不佳。
4.  **不适用于超低维度**：在维度非常低（如 1-10 维）时，简单的精确搜索或更传统的空间索引可能更有效。HNSW 的优势主要体现在中高维度（几十到上千维）。
5.  **高维场景的挑战**：虽然 HNSW 很好地缓解了维数灾难，但在极高维度（数千维以上）下，距离度量的有效性本身可能下降，此时可能需要结合降维技术。

## 六、总结

HNSW 是一种在向量数据库领域具有里程碑意义的 ANN 算法。它通过巧妙地结合 Navigable Small World 图和小世界特性与分层结构，提供了一种在速度、精度和可扩展性之间取得优秀平衡的解决方案。理解其分层原理、概率性层分配以及插入和搜索过程，对于优化和应用向量数据库来构建高性能 AI 应用至关重要。随着 AI 领域对高维数据处理需求的不断增长，HNSW 及其变种将继续作为向量相似性搜索的核心技术发挥关键作用。
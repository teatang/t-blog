---
title: 乘积量化 (Product Quantization, PQ) 详解
date: 2026-06-08 06:24:00
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

> **乘积量化 (Product Quantization, PQ)** 是一种高效的向量压缩和近似最近邻 (Approximate Nearest Neighbor, ANN) 搜索技术。它通过将高维向量分解为多个低维子向量，并对每个子向量独立进行矢量量化（即聚类），从而显著降低存储成本并加速距离计算。PQ 常与其他 ANN 算法（如 IVF）结合使用，以进一步提升大规模向量搜索系统的性能。

{% note info %}
核心思想：**将高维向量拆分为多个子向量，对每个子向量进行独立聚类，用聚类中心（码字）的索引来表示原始向量的子向量，从而达到高倍率压缩和加速距离计算的目的。**
{% endnote %}
------

## 一、为什么需要乘积量化？高维向量的挑战

在现代人工智能应用中，数据通常以高维向量的形式表示（例如，词嵌入、图像特征、用户行为嵌入等）。这些高维向量带来了一系列挑战：

1.  **存储成本高昂**：一个 $D$ 维的浮点向量需要 $D \times 4$ 字节的存储空间。当数据集包含数百万甚至数十亿个向量时，总存储量将非常庞大，无法全部载入内存，也增加了磁盘 I/O 成本。
2.  **距离计算缓慢**：计算两个 $D$ 维向量之间的距离需要 $O(D)$ 次浮点运算。在大规模最近邻搜索中，即使是 ANN 算法也需要进行大量的距离计算，高维度会显著拖慢速度。
3.  **带宽限制**：从内存或磁盘读取高维向量会消耗大量带宽，成为性能瓶颈。

**矢量量化 (Vector Quantization, VQ)** 是一种通用的数据压缩技术，其核心思想是将高维向量空间划分为一系列区域，每个区域用一个代表点（**码字, codeword**）表示。当一个向量落入某个区域时，它就被该区域的码字所“量化”或“近似”。通过存储码字的索引而非原始向量，可以实现压缩。然而，直接对整个高维空间进行 VQ 存在**维数灾难**：要获得好的精度，码字本 (codebook) 的大小需要随维度指数级增长，变得不可行。

PQ 正是为了克服单一体 VQ 的维数灾难问题而提出的。

## 二、乘积量化 (PQ) 的核心原理

PQ 算法通过**“分而治之”**的策略，将复杂的全局矢量量化问题分解为多个简单的局部矢量量化问题。

### 2.1 向量分解 (Vector Decomposition)

PQ 的第一步是将一个 $D$ 维的原始向量 $\mathbf{x}$ 分割成 $M$ 个不重叠的低维子向量。
$$ \mathbf{x} = [\mathbf{x}_1, \mathbf{x}_2, \ldots, \mathbf{x}_M] $$
其中，每个子向量 $\mathbf{x}_m$ 的维度为 $D/M$。通常，为了简化实现，要求 $D$ 能被 $M$ 整除。

例如，一个 128 维的向量可以被分解成 4 个 32 维的子向量 ($M=4, D/M=32$)。

### 2.2 子向量独立量化 (Independent Subvector Quantization)

对于每个子向量空间，独立地进行矢量量化。
1.  **子码本构建**：对每个子向量空间 $m$（即所有原始向量的第 $m$ 个子向量组成的集合），运行 K-Means 聚类算法，得到一个包含 $K$ 个码字（聚类中心）的**子码本 (sub-codebook)** $C_m = \{\mathbf{c}_{m,1}, \mathbf{c}_{m,2}, \ldots, \mathbf{c}_{m,K}\}$。
    *   这个 $K$ 值通常取 256 (即 $2^8$)，这样每个码字索引只需用 1 字节（8 比特）表示。
2.  **子向量编码**：当一个原始向量 $\mathbf{x}$ 的第 $m$ 个子向量 $\mathbf{x}_m$ 被处理时，它会被其子码本 $C_m$ 中最接近的码字 $\mathbf{c}_{m,j^*}$ 所取代。我们只存储这个码字在子码本中的索引 $j^*$。

### 2.3 向量编码 (Vector Encoding)

一个原始高维向量 $\mathbf{x}$ 最终被编码成一个由 $M$ 个码字索引组成的序列：
$$ \text{code}(\mathbf{x}) = [idx_1, idx_2, \ldots, idx_M] $$
其中 $idx_m$ 是子向量 $\mathbf{x}_m$ 在其对应子码本 $C_m$ 中的索引。
如果每个索引用 1 字节表示（即 $K=256$），那么一个原始 $D$ 维的浮点向量（通常 $D \times 4$ 字节）就被压缩成了 $M$ 字节。

**压缩率**：原始向量 $D \times 4$ 字节，压缩后 $M$ 字节。压缩率约为 $D \times 4 / M$。
例如，一个 128 维浮点向量（512 字节），如果 $M=8$（即 8 个 16 维子向量），每个索引 1 字节，则压缩后为 8 字节。压缩倍率为 $512/8 = 64$ 倍。

### PQ 编码过程图示

{% mermaid %}
flowchart TB
    %% ================= 输入阶段 =================
    subgraph StageInput ["📥 阶段一：向量正交分解 (Space Decomposition)"]
        direction LR
        InputVec[/"高维原始向量 X (D 维 float32)"/]:::inputNode
        Split[["空间切分为 M 个正交子空间 (每个子空间 d = D/M 维)"]]:::processNode
        InputVec ==> Split
    end

    %% ================= 子空间量化阶段 =================
    subgraph StageQuant ["⚡ 阶段二：子空间独立量化 (Sub-Vector Quantization)"]
        direction TB

        subgraph Lane1 ["子空间 1 (Sub-space 1)"]
            direction LR
            SubV1["子向量 X₁ (d维)"]:::subVecNode
            Book1[("子码本 C₁<br/>(K=256 聚类中心)")]:::codebookNode
            Lookup1[["最近邻查找<br/>argmin ||X₁ - c||²"]]:::lookupNode
            Idx1(["索引码 idx₁<br/>(1 字节 / uint8)"]):::idxNode

            SubV1 --> Lookup1
            Book1 -.->|"参照码本"| Lookup1
            Lookup1 --> Idx1
        end

        subgraph Lane2 ["子空间 2 (Sub-space 2)"]
            direction LR
            SubV2["子向量 X₂ (d维)"]:::subVecNode
            Book2[("子码本 C₂<br/>(K=256 聚类中心)")]:::codebookNode
            Lookup2[["最近邻查找<br/>argmin ||X₂ - c||²"]]:::lookupNode
            Idx2(["索引码 idx₂<br/>(1 字节 / uint8)"]):::idxNode

            SubV2 --> Lookup2
            Book2 -.->|"参照码本"| Lookup2
            Lookup2 --> Idx2
        end

        subgraph LaneM ["子空间 M (Sub-space M)"]
            direction LR
            SubVM["子向量 X_M (d维)"]:::subVecNode
            BookM[("子码本 C_M<br/>(K=256 聚类中心)")]:::codebookNode
            LookupM[["最近邻查找<br/>argmin ||X_M - c||²"]]:::lookupNode
            IdxM(["索引码 idx_M<br/>(1 字节 / uint8)"]):::idxNode

            SubVM --> LookupM
            BookM -.->|"参照码本"| LookupM
            LookupM --> IdxM
        end
    end

    %% ================= 输出压缩阶段 =================
    subgraph StageOutput ["📦 阶段三：索引重组与紧凑编码 (Concatenation)"]
        direction LR
        Encoded[/"PQ 压缩码字 [idx₁, idx₂, ..., idx_M]<br/>(仅占用 M 字节 / 极高压缩比)"/]:::outputNode
    end

    %% 连接阶段关系
    Split ==>|"分发子向量"| SubV1 & SubV2 & SubVM
    Idx1 & Idx2 & IdxM ==>|"字节拼接"| Encoded

    %% ================= 样式定义 (Dark Mode Palette) =================
    classDef inputNode fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#e0e7ff;
    classDef outputNode fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#ecfdf5;
    classDef processNode fill:#1e293b,stroke:#64748b,stroke-width:1.5px,color:#f8fafc;
    classDef subVecNode fill:#172554,stroke:#38bdf8,stroke-width:1.5px,color:#e0f2fe;
    classDef codebookNode fill:#431407,stroke:#fb923c,stroke-width:1.5px,color:#ffedd5;
    classDef lookupNode fill:#1f2937,stroke:#94a3b8,stroke-width:1px,color:#f3f4f6;
    classDef idxNode fill:#4a044e,stroke:#e879f9,stroke-width:1.5px,color:#fae8ff;

    %% 容器深色背景
    style StageInput fill:#0f131d,stroke:#334155,stroke-width:1.5px,color:#94a3b8;
    style StageQuant fill:#0f131d,stroke:#334155,stroke-width:1.5px,color:#94a3b8;
    style StageOutput fill:#0f131d,stroke:#334155,stroke-width:1.5px,color:#94a3b8;
    style Lane1 fill:#141a29,stroke:#1e293b,stroke-width:1px,stroke-dasharray: 2 2,color:#64748b;
    style Lane2 fill:#141a29,stroke:#1e293b,stroke-width:1px,stroke-dasharray: 2 2,color:#64748b;
    style LaneM fill:#141a29,stroke:#1e293b,stroke-width:1px,stroke-dasharray: 2 2,color:#64748b;
{% endmermaid %}
**说明**：原始高维向量被分割成多个低维子向量。每个子向量独立地通过 K-Means 聚类学习一个子码本，并用其在子码本中的索引进行编码。最终，高维向量被压缩成一个由这些索引组成的短序列。

### 2.4 距离计算 (Distance Calculation)

PQ 的另一个优势是它能加速查询向量与压缩向量之间的距离计算。主要有两种方法：

1.  **非对称距离计算 (Asymmetric Distance Computation, ADC)**
    *   **原理**：查询向量 $Q$ **不被量化**。它与每个数据库向量 $\mathbf{x}$ 的近似距离，是通过计算 $Q$ 的子向量与 $\mathbf{x}$ 对应的码字进行距离计算后累加得到的。
    *   **步骤**：
        1.  将查询向量 $Q$ 分割成 $M$ 个子向量：$Q = [Q_1, Q_2, \ldots, Q_M]$。
        2.  对于每个子码本 $C_m$，预计算查询子向量 $Q_m$ 到 $C_m$ 中所有 $K$ 个码字的距离，得到 $M \times K$ 个距离值，并存储在一个距离查找表 (Distance Lookup Table, DLT) 中。
        3.  对于一个编码后的数据库向量 $\text{code}(\mathbf{x}) = [idx_1, idx_2, \ldots, idx_M]$：
            其与 $Q$ 的近似距离为：
            $$ D(\mathbf{x}, Q) \approx \sum_{m=1}^{M} D(C_m[idx_m], Q_m) $$
            其中 $C_m[idx_m]$ 是第 $m$ 个子码本中索引为 $idx_m$ 的码字。这些 $D(C_m[idx_m], Q_m)$ 的值可以直接从预计算的 DLT 中查找。
    *   **优点**：精度相对较高，因为它保留了查询向量的完整信息。计算速度快，因为距离计算变成了 $M$ 次查表和 $M-1$ 次加法。
    *   **缺点**：仍然需要预计算 DLT，并且需要保留查询向量的完整数据。

2.  **对称距离计算 (Symmetric Distance Computation, SDC)**
    *   **原理**：查询向量 $Q$ 也被量化。它与每个数据库向量 $\mathbf{x}$ 的近似距离，是通过计算 $Q$ 对应的码字与 $\mathbf{x}$ 对应的码字之间的距离累加得到的。
    *   **步骤**：查询向量 $Q$ 被编码成 $[q\_idx_1, \ldots, q\_idx_M]$。数据库向量 $\mathbf{x}$ 被编码成 $[idx_1, \ldots, idx_M]$。
        其与 $Q$ 的近似距离为：
        $$ D(\mathbf{x}, Q) \approx \sum_{m=1}^{M} D(C_m[idx_m], C_m[q\_idx_m]) $$
        这个距离也可以通过预先计算一个 $M$ 个 $K \times K$ 的距离矩阵来加速。
    *   **优点**：计算速度更快，存储空间更小。
    *   **缺点**：精度相对较低，因为查询向量也经过了量化，损失了部分信息。

通常，ADC 方法在精度上表现更好，因此在实际应用中更常用。

## 三、PQ 的参数调优

*   **`M` (Number of subvectors)**：
    *   **定义**：将原始向量分解成的子向量数量。
    *   **影响**：
        *   **更大的 `M`**：压缩率更高（每个向量占用字节数更少），查询速度理论上更快（每次查表 $M$ 次），但子向量维度 $D/M$ 降低，可能导致每个子向量的聚类效果变差，从而影响整体精度。
        *   **更小的 `M`**：压缩率更低，每个子向量维度 $D/M$ 升高，聚类效果可能更好，精度更高，但存储和计算成本增加。
    *   **典型取值**：通常 $M$ 的值在 4 到 64 之间，使得 $D/M$ 至少在 16 左右以保持子向量的足够信息量。常见的 $M=8$ 或 $M=16$。
*   **`K` (Number of codewords per sub-codebook)**：
    *   **定义**：每个子码本中的码字数量。
    *   **影响**：
        *   **更大的 `K`**：每个子向量的量化更精细，精度更高，但训练 K-Means 的时间更长，且每个码字索引需要更多比特（例如 $K=256$ 用 8 比特，$K=512$ 用 9 比特）。
        *   **更小的 `K`**：训练更快，每个码字索引所需比特更少，但精度可能下降。
    *   **典型取值**：几乎总是取 $K=256$ (即 8-bit 量化)，因为 1 字节索引是最高效的存储方式。

## 四、PQ 的优势与局限性

### 4.1 优势

1.  **极高压缩率**：能够将高维浮点向量压缩到原始大小的几十甚至上百倍，极大节省存储空间和内存占用。
2.  **显著加速距离计算**：将高维距离计算转化为查表和累加操作，查询速度大幅提升。
3.  **与 IVL 结合**：PQ 是 IVF 索引的绝佳补充，通过对倒排列表中的残差向量进行 PQ 压缩，进一步降低 IVF 索引的内存消耗和查询时间（IVF_PQ 索引）。
4.  **硬件友好**：查表操作和字节级存储对现代 CPU 缓存和 SIMD 指令集友好。

### 4.2 局限性

1.  **精度损失**：PQ 是一种有损压缩，不可避免地会损失部分信息，从而影响最近邻搜索的精度（召回率）。在某些情况下，当数据非常复杂或需要极高精度时，PQ 的近似性可能不够。
2.  **训练成本**：构建 $M$ 个子码本需要对大量子向量进行 K-Means 聚类训练，这是一个计算密集型过程，耗时可能较长。
3.  **不适用于所有距离度量**：PQ 通常最适用于 L2 距离和归一化向量的余弦相似度。对于其他复杂距离度量，其有效性可能下降。
4.  **对向量分解敏感**：如何将原始向量分解成子向量，以及每个子向量的维度，会影响最终的精度。

## 五、PQ 的应用场景

*   **大规模向量数据库**：作为核心组件，用于存储和查询海量高维向量。例如，Faiss 中的 `IndexPQ` 和 `IndexIVFPQ`。
*   **内存受限环境**：当系统内存不足以加载全部原始向量时，PQ 提供了有效的解决方案。
*   **带宽受限系统**：减少数据传输量，加快 I/O 速度。
*   **低功耗设备**：在边缘设备或移动设备上进行有限的相似性搜索。

## 六、Python 示例：使用 Faiss 实现 PQ 索引

Faiss 提供了 `IndexPQ` 来直接使用乘积量化进行 ANN 搜索，以及 `IndexIVFPQ` 结合 IVF 和 PQ。这里我们展示 `IndexPQ` 的基本用法。

```python
import faiss
import numpy as np
import time

# 1. 生成模拟数据
D = 128      # 向量维度
NB = 1000000 # 数据库中的向量数量 (100万)
NQ = 10      # 查询向量数量

# 随机生成数据库向量 (标准化到单位长度，以便L2距离能近似表示余弦相似度)
xb = np.random.random((NB, D)).astype('float32')
xb = xb / np.linalg.norm(xb, axis=1)[:, np.newaxis]

# 随机生成查询向量
xq = np.random.random((NQ, D)).astype('float32')
xq = xq / np.linalg.norm(xq, axis=1)[:, np.newaxis]

print(f"数据库向量形状: {xb.shape}")
print(f"查询向量形状: {xq.shape}")

# --- 2. 创建 PQ 索引 ---
# M: 子向量的数量 (这里将128维向量分成8个16维子向量)
M = 8
# nbits: 每个子向量的量化比特数 (2^8 = 256 个码字)
nbits = 8 

# IndexPQ 构造函数:
# - D: 向量维度
# - M: 子向量数量
# - nbits: 每个子向量的量化比特数
# - metric: 距离度量 (PQ通常用于L2或内积)
index_pq = faiss.IndexPQ(D, M, nbits, faiss.METRIC_L2)

# --- 3. 训练 PQ 索引 ---
# PQ 索引需要先进行训练，这个过程是对每个子向量空间进行K-Means聚类，
# 找出 M 个子码本。
print(f"\n开始训练 PQ 索引 (M={M}, nbits={nbits})...")
start_time = time.time()
index_pq.train(xb) # 注意：训练只需要一次
end_time = time.time()
print(f"PQ 索引训练耗时: {end_time - start_time:.4f} 秒")

# 检查索引是否已经训练好
print(f"索引是否已训练: {index_pq.is_trained}")

# --- 4. 添加向量到 PQ 索引 ---
# 在 add 过程中，原始向量被编码成 M 个字节的短序列。
print("添加向量到 PQ 索引 (编码过程)...")
start_time = time.time()
index_pq.add(xb)
end_time = time.time()
print(f"PQ 索引添加向量耗时: {end_time - start_time:.4f} 秒")
print(f"索引中向量数量: {index_pq.ntotal}")

# 计算索引的内存占用（近似）
# 每个向量占用 M 字节
estimated_memory_bytes = index_pq.ntotal * M
print(f"PQ 索引估计内存占用: {estimated_memory_bytes / (1024**2):.2f} MB")
# 原始向量内存占用 (100万 * 128 * 4 字节)
original_memory_bytes = NB * D * 4
print(f"原始向量内存占用: {original_memory_bytes / (1024**2):.2f} MB")
print(f"压缩比: {original_memory_bytes / estimated_memory_bytes:.2f}X")


# --- 5. 查询 PQ 索引 ---
k = 5 # 查找最近的5个邻居

print("\n开始查询...")
start_time = time.time()
distances_pq, indices_pq = index_pq.search(xq, k)
end_time = time.time()

print(f"PQ 近似搜索耗时: {end_time - start_time:.4f} 秒")
print("查询向量 0 的近似最近邻索引:", indices_pq[0])
print("查询向量 0 的近似最近邻距离:", distances_pq[0])


# --- 6. 评估召回率 (与精确搜索比较) ---
# 为了评估召回率，我们首先进行一个精确搜索作为基准
index_exact = faiss.IndexFlatL2(D)
index_exact.add(xb)
_, indices_exact = index_exact.search(xq, k)

correct_matches = np.isin(indices_pq[0], indices_exact[0]).sum()
recall = correct_matches / k
print(f"\n查询向量 0 的召回率: {recall:.4f}")

# 可以看到，PQ 直接搜索的召回率可能不高，它通常与IVF结合使用 (IndexIVFPQ)
# IndexIVFPQ = faiss.IndexIVFPQ(quantizer, D, nlist, M, nbits)
# 这样可以先进行粗粒度搜索，再在选定的倒排列表中进行PQ的精细搜索，提高整体精度。
```
**示例解读**：
*   **`IndexPQ(D, M, nbits, metric)`**：创建 PQ 索引。`M` 控制子向量数量，`nbits` 控制每个子码本的码字数量 ($2^{nbits}$)。
*   **训练 (`train`)**：这是 PQ 的关键步骤，对数据集进行 K-Means 聚类，为每个子向量空间学习一个子码本。
*   **添加 (`add`)**：在添加向量时，Faiss 会自动将原始浮点向量编码成 `M` 字节的 PQ 码。
*   **内存占用**：示例中计算了 PQ 索引的内存占用，与原始向量相比，压缩比非常显著。
*   **召回率**：直接使用 `IndexPQ` 进行搜索时，召回率可能不会很高，因为整个空间的近似程度较大。PQ 算法通常与 IVF 结合使用 (`IndexIVFPQ`)，先通过 IVF 进行粗粒度筛选，再在选定的小范围内使用 PQ 进行精细搜索，以获得更好的精度-速度平衡。

## 七、总结

乘积量化 (PQ) 是一种非常强大的 ANN 辅助技术，通过巧妙的向量分解和独立量化策略，极大地解决了高维向量在存储和距离计算上的挑战。它实现了惊人的数据压缩率和显著的查询加速。虽然它是一种有损压缩，可能导致一定的精度损失，但通过与 IVF 等其他 ANN 算法的结合，PQ 能够构建出在性能和资源效率方面表现卓越的向量搜索系统。在处理大规模、高维向量数据集时，PQ 是不可或缺的工具。
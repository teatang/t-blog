---
title: Vision Transformer (ViT) 与 Residual Network (ResNet) 深度详解
date: 2025-05-16 06:24:00
tags:
  - 2025
  - AI
  - 计算机视觉
categories:
  - AI
  - 计算机视觉
mathjax: true
---

> 在深度学习的计算机视觉领域，**卷积神经网络 (CNN)** 曾长期占据主导地位，而 **Residual Network (ResNet)** 则是其中一个里程碑式的创新，通过引入残差连接解决了深层网络训练中的梯度消失问题。近年来，随着 Transformer 模型在自然语言处理 (NLP) 领域取得巨大成功，研究人员尝试将其引入视觉领域，催生了 **Vision Transformer (ViT)**。ViT 颠覆了传统 CNN 的范式，直接将图像视为一系列序列化的图像块 (patches)，并用 Transformer 编码器进行处理。本文将对这两大具有代表性的模型进行深入剖析和比较。

{% note info %}
**ResNet 的核心思想：** 通过**残差连接 (Residual Connection)** 允许网络学习残差函数，使得训练极深的网络变得可能，从而有效缓解了深度神经网络中的梯度消失和梯度爆炸问题，提高了模型性能。

**ViT 的核心思想：** 放弃了 CNN 的归纳偏置 (inductive bias)，直接将**图像分割成固定大小的图像块 (patches)，并将其视为序列化的词向量 (tokens)**，然后输入标准的 Transformer 编码器进行处理，从而将 Transformer 的强大建模能力引入计算机视觉领域。
{% endnote %}
------

## 一、Residual Network (ResNet) 详解

### 1.1 动机：深层网络的挑战

在 ResNet 出现之前，人们普遍认为，增加神经网络的深度可以提高其性能，因为更深的网络理论上可以学习更复杂的特征表示。然而，实践中发现，当网络深度达到一定程度后，继续增加层数反而会导致**训练精度下降 (degradation problem)** 和**梯度消失/爆炸**等问题，使得模型难以收敛或性能变差。这种性能下降并非由过拟合引起，而是优化问题。

### 1.2 核心概念：残差块 (Residual Block) 与跳跃连接 (Skip Connection)

ResNet 的核心创新是引入了**残差块 (Residual Block)** 和**跳跃连接 (Skip Connection)**。
传统的层学习的是从输入 $x$ 到输出 $H(x)$ 的映射。残差学习的思路是，与其直接学习 $H(x)$，不如让网络学习**残差函数 (Residual Function)** $F(x) = H(x) - x$。这样，原始的输出就变成了 $H(x) = F(x) + x$。

残差连接通过将输入 $x$ 直接加到几层网络的输出上，实现 $x$ 的恒等映射 (identity mapping)。如果最佳的映射是恒等映射，那么 $F(x)$ 只需要学习一个全零的映射即可，这比直接学习恒等映射 $H(x)=x$ 要容易得多。

**数学表达：**
假设输入为 $x$，经过两层卷积和激活函数后得到 $F(x)$。则残差块的输出 $y$ 为：

$$ y = F(x, \{W_i\}) + x $$

其中，$\{W_i\}$ 是可学习的权重。如果 $x$ 和 $F(x)$ 的维度不同，需要通过一个线性投影 $W_s$ 来匹配维度：

$$ y = F(x, \{W_i\}) + W_s x $$

{% mermaid %}
graph TD
    A[输入 x] --> B(卷积层 1);
    B --> C(ReLU);
    C --> D(卷积层 2);
    D --> E(ReLU);
    E --> F("F(x) 输出");
    A --> G[恒等映射];
    F & G --> H(加和);
    H --> I[ReLU];
    I --> J["输出 y = F(x) + x"];
{% endmermaid %}

### 1.3 ResNet 架构

ResNet 通常由以下部分组成：

1.  **初始卷积层**：通常是一个大的卷积层（如 7x7 卷积），用于从原始图像中提取低级特征。
2.  **残差块堆叠**：接着是一系列残差块的堆叠。ResNet 模型（如 ResNet-18, ResNet-34, ResNet-50, ResNet-101, ResNet-152）的主要区别在于残差块的数量和类型。
    *   **基础残差块 (Basic Block)**：包含两个 3x3 卷积层，用于 ResNet-18 和 ResNet-34。
    *   **瓶颈残差块 (Bottleneck Block)**：包含 1x1 卷积、3x3 卷积和 1x1 卷积。1x1 卷积用于降维和升维，以减少计算量，用于 ResNet-50 及更深的模型。
3.  **全局平均池化 (Global Average Pooling)**：在残差块之后，使用全局平均池化将每个特征图转换为一个标量。
4.  **全连接层 (Fully Connected Layer)**：最后是一个全连接层（也称为分类头），将全局特征映射到类别得分。

### 1.4 优缺点与适用场景

**优点：**

*   **缓解梯度问题**：残差连接有效解决了深层网络中的梯度消失/爆炸问题，使得能够训练数百甚至上千层的神经网络。
*   **提高性能**：通过增加深度，ResNet 在各种图像识别任务上取得了 SOTA (State-of-the-Art) 性能。
*   **泛化能力强**：被广泛用于图像分类、目标检测、语义分割等多种计算机视觉任务的骨干网络。
*   **归纳偏置**：卷积操作自带平移不变性 (translation equivariance) 和局部性 (locality) 的归纳偏置，使得 CNN 在处理图像时效率高且样本效率高。

**缺点：**

*   **计算开销**：随着深度增加，仍然会带来较大的计算和内存开销。
*   **特征融合限制**：卷积的局部感受野限制了其对全局信息的捕捉能力，长距离依赖建模相对较弱。
*   **固定归纳偏置**：虽然归纳偏置是优点，但也可能限制模型在某些非图像（或图像但需要更灵活关注模式）任务上的泛化能力。

**适用场景：**
图像分类、目标检测、语义分割、姿态估计等各种传统的计算机视觉任务，作为特征提取的骨干网络。

### 1.5 ResNet 核心概念 Go 语言代码示例 (概念性)

以下 Go 语言示例代码展示了残差块的基本结构，如何将输入与卷积层的输出相加。`gonum/mat` 库用于矩阵操作。

```go
package deeplearning

import (
	"fmt"
	"gonum.org/v1/gonum/mat"
)

// simulateConvLayer 模拟一个卷积层和ReLU激活
// 实际的卷积操作远比这复杂，这里仅为示意
func simulateConvLayer(input *mat.Dense, weights *mat.Dense) (*mat.Dense, error) {
	rIn, cIn := input.Dims()
	rW, cW := weights.Dims()

	if cIn != rW {
		return nil, fmt.Errorf("input columns %d must match weights rows %d for convolution", cIn, rW)
	}

	output := mat.NewDense(rIn, cW, nil)
	output.Mul(input, weights) // 简化为矩阵乘法
	
	// 模拟 ReLU 激活
	output.Apply(func(r, c int, v float64) float64 {
		return math.Max(0, v)
	}, output)

	return output, nil
}

// ResidualBlock 模拟一个 ResNet 残差块
// 包含两个模拟卷积层和一个跳跃连接
func ResidualBlock(input *mat.Dense) (*mat.Dense, error) {
	// 假设有两个卷积层，这里使用两个随机权重矩阵模拟
	// 实际权重会通过训练学习得到
	weights1 := mat.NewDense(input.Dims().Lo(), 10, nil) // 假设输出维度为10
	weights1.RandUniform(0, 1)

	weights2 := mat.NewDense(10, input.Dims().Lo(), nil) // 假设输出维度与输入相同，以便相加
	weights2.RandUniform(0, 1)

	// 1. 第一个卷积层
	conv1Output, err := simulateConvLayer(input, weights1)
	if err != nil {
		return nil, fmt.Errorf("first conv layer failed: %w", err)
	}

	// 2. 第二个卷积层 (假设conv1Output是10列，weights2是10行)
	blockOutput, err := simulateConvLayer(conv1Output, weights2)
	if err != nil {
		return nil, fmt.Errorf("second conv layer failed: %w", err)
	}
	
	// 3. 残差连接：input + blockOutput
	rIn, cIn := input.Dims()
	rBlock, cBlock := blockOutput.Dims()
	if rIn != rBlock || cIn != cBlock {
		// 如果维度不匹配，实际中需要一个 1x1 卷积进行维度匹配 (Projection Shortcut)
		// 这里简化为假定维度匹配
		return nil, fmt.Errorf("input and block output dimensions mismatch for residual connection")
	}

	finalOutput := mat.NewDense(rIn, cIn, nil)
	finalOutput.Add(input, blockOutput) // x + F(x)

	// 4. 最终 ReLU (ResNet V2 通常是激活-卷积-激活-卷积)
	finalOutput.Apply(func(r, c int, v float64) float64 {
		return math.Max(0, v)
	}, finalOutput)

	return finalOutput, nil
}

/*
func main() {
	// 示例输入：一个 2x4 的特征图 (例如，2个样本，每个样本4个特征)
	inputData := []float64{
		1.0, 2.0, 3.0, 4.0,
		5.0, 6.0, 7.0, 8.0,
	}
	input := mat.NewDense(2, 4, inputData)

	fmt.Println("Input to Residual Block:\n", mat.Formatted(input))

	output, err := ResidualBlock(input)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Println("Output from Residual Block:\n", mat.Formatted(output))
}
*/
```

## 二、Vision Transformer (ViT) 详解

### 2.1 动机：将 Transformer 引入视觉领域

Transformer 模型在 NLP 领域取得了巨大的成功，但其核心是处理序列数据，而图像是二维网格数据。传统的 CNN 在处理图像时，利用了其归纳偏置（如平移不变性和局部性），这使其在有限数据下表现良好。ViT 的研究动机是探索：**是否可以将 Transformer 的通用序列处理能力直接应用于图像，而无需太多特定于图像的归纳偏置？**

### 2.2 核心概念：图像分块与序列化

ViT 的关键在于如何将图像转化为 Transformer 可以处理的序列形式。

1.  **图像分割 (Image Patching)**：将一张输入图像 $x \in \mathbb{R}^{H \times W \times C}$（高度 $H$、宽度 $W$、通道数 $C$）分割成一系列固定大小的、不重叠的图像块 (patches)。每个图像块的大小为 $P \times P$。
    这样，图像被分成了 $N = HW/P^2$ 个图像块。

2.  **线性投影 (Linear Projection of Patches)**：将每个图像块展平 (flatten) 为一维向量，然后通过一个线性投影层，将其映射到一个固定维度 $D$ 的向量（即 Transformer 的词嵌入维度）。这些向量被称为**图像块嵌入 (Patch Embeddings)**。
    每个图像块 $x_p \in \mathbb{R}^{P^2 C}$ 映射为 $E \in \mathbb{R}^{D}$。

3.  **分类标记 ([CLS] Token)**：为了进行图像分类，ViT 借鉴了 BERT 的做法，在图像块嵌入序列的开头添加一个特殊的**可学习的分类标记 (Class Token)**。这个 [CLS] token 的输出状态（经过 Transformer 编码器后）将作为整个图像的表示，用于最终的分类。

4.  **位置嵌入 (Positional Embeddings)**：与 NLP 中的 Transformer 类似，ViT 缺乏处理空间信息的能力，因此需要添加**可学习的位置嵌入 (Learnable Positional Embeddings)** 到图像块嵌入中，以保留图像块的空间位置信息。

最终，输入到 Transformer 编码器的序列是 [CLS] token 嵌入、图像块嵌入和位置嵌入的总和。

### 2.3 ViT 架构

ViT 的整体架构相对简洁：

1.  **Patch Embedding Layer (图像块嵌入层)**：
    *   将输入图像分割成 $N$ 个图像块。
    *   每个图像块线性投影成 $D$ 维向量。
    *   在序列前添加一个可学习的 [CLS] token。
    *   添加可学习的位置嵌入。
    *   将所有这些嵌入堆叠成一个序列，作为 Transformer 编码器的输入。

2.  **Transformer Encoder (Transformer 编码器)**：
    *   由 `L` 个标准 Transformer 编码器层堆叠而成。
    *   每个编码器层包含多头自注意力 (Multi-Head Self-Attention) 和前馈神经网络 (Feed-Forward Network)，每个子层之后都带有残差连接和层归一化。
    *   它处理图像块嵌入序列，学习它们之间的全局依赖关系。

3.  **MLP Head (多层感知机分类头)**：
    *   Transformer 编码器的输出中，只取 [CLS] token 对应的输出向量。
    *   这个向量通过一个简单的多层感知机 (MLP)（通常包含一个隐藏层和 ReLU 激活）进行分类预测。

{% mermaid %}
graph TD
    Input_Image[输入图像<br/>H x W x C] --> Patching[分割图像块<br/>P x P];
    Patching --> Flattening["展平图像块<br/>(P*P*C)"];
    Flattening --> Linear_Proj[线性投影<br/>到维度 D];
    Linear_Proj --> Patch_Embeddings[N 个图像块嵌入];

    Class_Token[可学习的分类Token] --> Class_Embedding[分类Token嵌入];

    Pos_Embeddings[可学习的位置编码] --> Pos_Added[添加到<br/>图像块和分类Token嵌入];

    Class_Embedding & Patch_Embeddings & Pos_Added --> Transformer_Input["Transformer编码器输入序列<br/>(N+1) x D"];

    subgraph Transformer Encoder Stack
        T1[Transformer编码器层 1] --> T2[Transformer编码器层 2] --> ... --> TL[Transformer编码器层 L];
    end
    Transformer_Input --> T1;
    TL --> Enc_Output[编码器输出];

    Enc_Output --> Class_Token_Output[只取分类Token的输出];
    Class_Token_Output --> MLP_Head[MLP分类头];
    MLP_Head --> Output[预测类别];
{% endmermaid %}

### 2.4 优缺点与适用场景

**优点：**

*   **全局感受野**：自注意力机制允许模型直接在全局范围内建模图像块之间的依赖关系，克服了 CNN 局部感受野的限制。
*   **低归纳偏置**：ViT 的归纳偏置较少，这使得它在大规模数据集上预训练时，能够学习到更灵活、更通用的特征表示。
*   **可扩展性强**：Transformer 模型在大规模数据和模型参数下表现出强大的扩展能力。
*   **统一架构**：为处理不同模态（文本、图像）数据提供了一个统一的架构基础。

**缺点：**

*   **数据饥渴**：由于缺乏 CNN 的平移不变性和局部性归纳偏置，ViT 在中小型数据集上通常需要大规模预训练才能超越 CNN 模型。在没有足够数据的情况下，ViT 容易过拟合。
*   **计算成本**：自注意力机制的计算复杂度是序列长度的平方 ($O(N^2)$)，其中 $N$ 是图像块的数量。对于高分辨率图像，这会导致较高的计算和内存成本。
*   **局部性缺失**：将图像分割成不重叠的图像块，并进行线性投影，可能会损失一些图像的局部精细结构信息。

**适用场景：**
需要大规模数据预训练的图像分类、目标检测、语义分割等计算机视觉任务；多模态任务，其中图像可以与其他模态（如文本）统一处理。

### 2.5 ViT 核心概念 Go 语言代码示例 (概念性)

以下 Go 语言示例代码展示了图像分块和线性投影的概念。

```go
package deeplearning

import (
	"fmt"
	"gonum.org/v1/gonum/mat"
)

// simulateImagePatching 模拟图像分块并展平
// image: 假定为 1D 数组表示的图像 (H*W*C)
// H, W, C: 图像的高度、宽度、通道数
// P: 图像块的边长 (P x P)
// 返回展平后的图像块列表 (每个图像块也是 1D 数组)
func simulateImagePatching(image *mat.Dense, H, W, C, P int) ([][][]float64, error) {
	if H%P != 0 || W%P != 0 {
		return nil, fmt.Errorf("image dimensions H(%d) and W(%d) must be divisible by patch size P(%d)", H, W, P)
	}

	numPatchesH := H / P
	numPatchesW := W / P
	numPatches := numPatchesH * numPatchesW

	// 假定 input image 是一个 H*W*C 的 1D 向量
	// 这里简化处理，直接从一个大的 1D 数组中“切片”
	// 实际图像处理会更复杂，需要处理图像数据结构
	flatImage := make([]float64, H*W*C)
	for i := 0; i < H*W*C; i++ {
		flatImage[i] = image.At(0, i) // 假定输入mat.Dense是1行H*W*C列
	}

	patchSize := P * P * C // 每个展平图像块的维度
	patches := make([][][]float64, numPatches) // 存储所有展平的图像块

	patchIdx := 0
	for r := 0; r < numPatchesH; r++ {
		for c := 0; c < numPatchesW; c++ {
			currentPatch := make([][]float64, 1) // 简化为 1xpatchSize 矩阵
			currentPatch[0] = make([]float64, patchSize)

			// 从 flatImage 中提取当前图像块的数据
			// 这是一个高度简化的逻辑，实际需要考虑HWC的索引
			for ph := 0; ph < P; ph++ {
				for pw := 0; pw < P; pw++ {
					for pc := 0; pc < C; pc++ {
						// 假设图像是 HWC 顺序
						original_row := r*P + ph
						original_col := c*P + pw
						
						flatImageIndex := original_row*W*C + original_col*C + pc
						patchCurrentIndex := ph*P*C + pw*C + pc
						
						if flatImageIndex >= len(flatImage) || patchCurrentIndex >= patchSize {
							return nil, fmt.Errorf("index out of bounds during patching")
						}
						currentPatch[0][patchCurrentIndex] = flatImage[flatImageIndex]
					}
				}
			}
			patches[patchIdx] = currentPatch
			patchIdx++
		}
	}
	return patches, nil
}

// LinearProjection 模拟线性投影层，将展平图像块映射到 D 维嵌入
func LinearProjection(flattenedPatch [][]float64, projectionMatrix *mat.Dense) (*mat.Dense, error) {
	patchMat := mat.NewDense(len(flattenedPatch), len(flattenedPatch[0]), mat.Vec(flattenedPatch[0]))
	
	rP, cP := patchMat.Dims()
	rW, cW := projectionMatrix.Dims()

	if cP != rW {
		return nil, fmt.Errorf("flattened patch columns %d must match projection matrix rows %d", cP, rW)
	}

	embedding := mat.NewDense(rP, cW, nil)
	embedding.Mul(patchMat, projectionMatrix)
	return embedding, nil
}

// simulatePositionalEncoding 模拟位置编码的添加
// embedding: 图像块的线性嵌入
// posEmbedding: 对应位置的可学习位置嵌入
// 返回添加位置编码后的嵌入
func simulatePositionalEncoding(embedding *mat.Dense, posEmbedding *mat.Dense) (*mat.Dense, error) {
	rE, cE := embedding.Dims()
	rP, cP := posEmbedding.Dims()

	if rE != rP || cE != cP {
		return nil, fmt.Errorf("embedding and positional embedding dimensions mismatch")
	}

	output := mat.NewDense(rE, cE, nil)
	output.Add(embedding, posEmbedding)
	return output, nil
}


/*
func main() {
	// 示例：一个 4x4 像素的灰度图像 (C=1)
	// 假设图像数据为 [0, 1, 2, ..., 15]
	H, W, C, P := 4, 4, 1, 2 // 图像 4x4, 1通道, 图像块 2x2
	imgData := make([]float64, H*W*C)
	for i := 0; i < H*W*C; i++ {
		imgData[i] = float64(i)
	}
	image := mat.NewDense(1, H*W*C, imgData) // 将图像视为 1x(H*W*C) 矩阵

	fmt.Println("Original Image (flattened):\n", mat.Formatted(image))

	patches, err := simulateImagePatching(image, H, W, C, P)
	if err != nil {
		fmt.Println("Error patching image:", err)
		return
	}
	fmt.Printf("Number of patches: %d\n", len(patches))
	for i, p := range patches {
		fmt.Printf("Patch %d (flattened):\n %v\n", i, p)
	}

	// 模拟线性投影矩阵 (从 P*P*C 维度映射到 D=8 维度)
	D := 8
	projectionMatrix := mat.NewDense(P*P*C, D, nil)
	projectionMatrix.RandUniform(0, 1)

	// 对第一个图像块进行线性投影
	if len(patches) > 0 {
		firstPatchEmbedding, err := LinearProjection(patches[0], projectionMatrix)
		if err != nil {
			fmt.Println("Error projecting patch:", err)
			return
		}
		fmt.Println("First Patch Embedding:\n", mat.Formatted(firstPatchEmbedding))

		// 模拟位置编码 (D维向量)
		posEmbedData := make([]float64, D)
		for i := range posEmbedData {
			posEmbedData[i] = float64(i) * 0.1 // 简单的示例位置编码
		}
		posEmbedding := mat.NewDense(1, D, posEmbedData)

		embeddingWithPos, err := simulatePositionalEncoding(firstPatchEmbedding, posEmbedding)
		if err != nil {
			fmt.Println("Error adding positional embedding:", err)
			return
		}
		fmt.Println("Embedding with Positional Encoding:\n", mat.Formatted(embeddingWithPos))
	}
}
*/
```

## 三、ViT 与 ResNet 的比较

| 特征           | Residual Network (ResNet)                                     | Vision Transformer (ViT)                                      |
| :------------- | :------------------------------------------------------------ | :------------------------------------------------------------ |
| **核心机制**   | 卷积操作 (Convolution)，残差连接 (Residual Connection)          | 自注意力机制 (Self-Attention)                                |
| **输入处理**   | 直接将图像作为 2D 输入，通过卷积层逐步提取特征                | 将图像分割为 2D 图像块，展平后进行线性投影，并添加位置编码，形成 1D 序列 |
| **归纳偏置**   | 强 (平移不变性、局部性)                                         | 弱 (几乎没有图像特定的归纳偏置)                               |
| **特征提取**   | 层次化、局部性特征提取，逐步构建复杂特征                      | 全局性特征提取，通过自注意力直接捕捉图像块间的长距离依赖      |
| **深度/结构**  | 深度可达数百层，通过残差连接克服梯度问题                      | 堆叠 Transformer 编码器层，主要依赖层数和注意力头数量增加复杂度 |
| **数据需求**   | 中小型数据集即可表现良好，大规模数据集上性能更佳              | 通常需要大规模数据集预训练才能超越 CNN，否则容易过拟合        |
| **计算复杂度** | 通常为 $O(HWC^2 P^2)$，与图像尺寸线性相关，局部操作              | 自注意力为 $O(N^2 D)$，其中 $N$ 是图像块数量。高分辨率图像或小图像块时计算量大，全局操作 |
| **可解释性**   | 卷积核可视化 (部分)，特征图响应                               | 注意力权重可视化 (显示模型关注的图像区域)                     |
| **发展趋势**   | 依然是许多下游任务的强大骨干网络，特别是资源受限或小数据集场景 | 计算机视觉新范式，在大规模预训练和多模态领域潜力巨大          |
| **融合趋势**   | 出现结合 Transformer 优点的新型 CNN 架构 (如 ConvNeXt)        | 出现结合 CNN 局部性优点的新型 Transformer (如 Swin Transformer, CoAtNet) |

### 3.1 核心差异与融合趋势

*   **归纳偏置**：ResNet 强大的性能很大程度上源于其内置的归纳偏置，这使得它在处理图像数据时具有天然的优势和更高的样本效率。而 ViT 依赖于数据来学习这些偏置。
*   **全局与局部**：ResNet 的卷积操作本质上是局部的，并通过堆叠层来扩大感受野；ViT 的自注意力机制从一开始就可以建立图像块之间的全局关系。
*   **性能瓶颈**：ResNet 的性能提升主要受限于梯度问题和特征表示能力；ViT 的性能瓶颈则主要在于其对大量数据的需求和自注意力机制带来的二次计算复杂度。

近年来，研究趋势已经不再是简单地将两者对立，而是寻求**融合**它们的优势。例如：

*   **Swin Transformer** 引入了分层特征图和移位窗口注意力，以同时实现局部性和全局性建模，并降低计算复杂度，使其成为许多视觉任务的强大骨干。
*   **ConViT** 将卷积的局部性与 Transformer 的自注意力相结合。
*   **ConvNeXt** 则通过借鉴 Transformer 的设计思想（如更多的层归一化、更少的激活函数、更大的卷积核等），极大地提升了纯 CNN 模型的性能。

## 四、总结

ResNet 作为 CNN 发展历程中的一个里程碑，通过残差连接使得训练超深网络成为可能，极大地推动了计算机视觉的发展，至今仍是许多实际应用和研究的基础。它的成功证明了深度和归纳偏置对于图像处理的重要性。

Vision Transformer (ViT) 则代表了一种全新的范式，将 Transformer 的强大能力直接引入视觉领域。它挑战了 CNN 的主导地位，特别是在大规模预训练数据集上展现出卓越的性能和强大的泛化潜力。虽然 ViT 仍面临数据依赖和计算成本的挑战，但其开启了计算机视觉领域的新篇章，并为多模态 AI 的发展奠定了基础。

未来，混合架构和持续的优化将是主流趋势，旨在结合 ResNet 的高效局部特征提取能力和 ViT 的全局上下文建模能力，构建出更强大、更高效、更通用的视觉模型。
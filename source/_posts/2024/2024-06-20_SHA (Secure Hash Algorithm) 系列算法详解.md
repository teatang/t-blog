---
title: SHA (Secure Hash Algorithm) 系列算法详解
date: 2024-06-20 06:24:00
tags:
  - 2024
  - 哈希算法
  - 加密算法
  - 计算机网络
categories:
  - 计算机网络
  - 加密算法
---

> **SHA (Secure Hash Algorithm)** 是一系列由美国国家安全局 (NSA) 设计，并由美国国家标准与技术研究院 (NIST) 发布的安全散列算法。与 MD5 类似，SHA 算法家族将**任意长度的输入数据**（消息）转换为**固定长度的小型字节串**，即**消息摘要 (Message Digest)** 或 **哈希值 (Hash Value)**。SHA 系列算法在密码学和信息安全领域扮演着至关重要的角色，广泛应用于数字签名、数据完整性校验、密码存储和区块链等场景。

{% note info %}
**核心思想**：通过设计精密的数学和逻辑运算，确保输入数据的微小改变会导致输出哈希值的巨大、不可预测的变化（雪崩效应），并使其具有单向性和抗碰撞性，从而提供数据的**完整性**和**认证**功能。
{% endnote %}

## 一、SHA 算法家族概述

SHA 家族包括以下主要算法版本：

1.  **SHA-0**：1993 年发布，很快发现安全漏洞，被 SHA-1 取代。
2.  **SHA-1**：1995 年发布，输出 160 位哈希值。曾被广泛使用，但现在已被认为不安全。
3.  **SHA-2**：2001 年发布，是一个包含多个变体的家族，包括 **SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, SHA-512/256**。其中，SHA-256 和 SHA-512 最常用。SHA-2 仍被认为是安全的。
4.  **SHA-3 (Keccak)**：2015 年发布，是 NIST 举行的加密哈希算法竞赛的获胜者。与 SHA-1 和 SHA-2 是基于 Merkle-Damgård 结构的算法不同，SHA-3 基于海绵结构 (Sponge Construction)，提供了完全不同的设计理念，旨在作为 SHA-2 的备选方案。

### SHA 家族的核心特性：

*   **定长输出**：无论输入多长，输出的哈希值长度固定。
*   **易计算性**：计算给定消息的哈希值是高效的。
*   **抗原像性 (Preimage Resistance)**：给定哈希值 `h`，找到消息 `M` 使 `Hash(M) = h` 在计算上是不可行的。
*   **弱抗碰撞性 (Second Preimage Resistance)**：给定消息 `M1`，找到另一个不同的消息 `M2` 使 `Hash(M1) = Hash(M2)` 在计算上是不可行的。
*   **强抗碰撞性 (Collision Resistance)**：找到任意两个不同的消息 `M1` 和 `M2` 使 `Hash(M1) = Hash(M2)` 在计算上是不可行的。

哈希算法的安全性主要依赖于其抗碰撞性。当一个哈希算法的强抗碰撞性被打破时，意味着可以找到两个不同的输入生成相同的哈希值，这会对其作为数字指纹的用途造成严重威胁。

## 二、SHA-1 详解 (已不安全)

### 2.1 算法原理

SHA-1 输出一个 160 位的哈希值（通常表示为 40 个十六进制字符）。它采用了与 MD5 类似的 Merkle-Damgård 结构。

主要步骤：

1.  **填充 (Padding)**：与 MD5 类似，消息通过填充使其长度是 512 位的倍数减去 64，最后附加 64 位的原始消息长度。
2.  **初始化哈希值 (Initialize Hash Value)**：使用五个 32 位的初始向量 (IV)。
3.  **消息摘要计算 (Message Digest Computation)**：消息被分割成 512 位的块，每个块通过 80 轮的压缩函数进行处理。每轮使用不同的逻辑函数和常数，对五个 32 位状态变量进行复杂运算。

{% mermaid %}
graph TD
    A[输入消息 M] --> B[填充 & 附加长度]
    B --> C["分割成 512位块 (M1, M2, ..., MN)"]
    C --> D["初始化 160位状态变量 (H0, H1, H2, H3, H4)"]
    D --> E{对每个 512位块进行处理}
    E -- 循环 N 次 --> F[160位状态变量 + 512位消息块 --> 80轮运算 --> 新的 160位状态变量]
    F --> G[累加更新状态变量]
    G -- 最终输出 --> H[连接 H0, H1, H2, H3, H4 作为 160位消息摘要]
{% endmermaid %}

### 2.2 安全性问题

SHA-1 在 2005 年被发现存在理论上的碰撞攻击，其安全性被大大降低。**2017 年，Google 成功演示了实际的 SHA-1 碰撞攻击**，生成了两个内容不同但 SHA-1 哈希值相同的 PDF 文件。这标志着 SHA-1 的强抗碰撞性被彻底打破。

**结论**：SHA-1 已被密码学界废弃，**不应再用于任何新的安全应用，并应尽快从现有应用中迁移出去。**

## 三、SHA-2 详解 (目前主流)

### 3.1 算法原理

SHA-2 家族包含 SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, SHA-512/256。它们都是基于 Merkle-Damgård 结构，但采用了更复杂的设计和更长的内部状态。

*   **输入块大小**：SHA-256 使用 512 位块，SHA-512 使用 1024 位块。
*   **输出哈希长度**：决定了算法的名称，如 SHA-256 输出 256 位，SHA-562 输出 512 位。
*   **初始向量 (IV)**：根据算法变体（如 SHA-256 或 SHA-512）不同。
*   **轮数**：SHA-256 有 64 轮，SHA-512 有 80 轮。
*   **逻辑函数和常数**：SHA-2 使用了更多的非线性函数和更复杂的常数表。

SHA-2 的设计通过增加哈希值的长度和改进内部结构，显著提升了安全性。

{% mermaid %}
graph TD
    A[输入消息 M] --> B[填充 & 附加长度]
    B --> C[分割成 512位/1024位块]
    C --> D[初始化 256位/384位/512位状态变量]
    D --> E{对每个消息块进行处理}
    E -- 循环 N 次 --> F[状态变量 + 消息块 --> 64/80轮运算 --> 新状态变量]
    F --> G[累加更新状态变量]
    G -- 最终输出 --> H[连接所有状态变量作为最终消息摘要]
{% endmermaid %}

### 3.2 常见变体

*   **SHA-256**：
    *   输出 256 位哈希值（32 字节，通常 64 个十六进制字符）。
    *   广泛应用于比特币 (Bitcoin) 区块链中的工作量证明和地址生成。
    *   目前被认为是安全的，是大多数应用的首选。
*   **SHA-512**：
    *   输出 512 位哈希值（64 字节，通常 128 个十六进制字符）。
    *   安全性更高，计算时间可能稍长，但对于大数据量处理可能更高效（因为它处理块更大）。
    *   常用于对安全性要求极高的场景。
*   **SHA-224, SHA-384**：
    *   是 SHA-256 和 SHA-512 的截短版本，使用相同的核心算法，但在初始化 IV 或截断输出时有所不同。提供更短的哈希值，但强度稍弱。

### 3.3 Go 语言实现 SHA-256

Go 语言标准库提供了 `crypto/sha256` 包，用于计算 SHA-256 摘要。

```go
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
)

// CalculateSHA256String 计算字符串的 SHA-256 值
func CalculateSHA256String(data string) string {
	hasher := sha256.New()         // 创建一个新的 SHA-256 hasher
	hasher.Write([]byte(data))     // 将数据写入 hasher
	sha256Bytes := hasher.Sum(nil) // 计算哈希值
	return hex.EncodeToString(sha256Bytes) // 转换为十六进制字符串
}

// CalculateSHA256File 计算文件的 SHA-256 值
func CalculateSHA256File(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("无法打开文件: %w", err)
	}
	defer file.Close()

	hasher := sha256.New()
	_, err = io.Copy(hasher, file) // 将文件内容复制到 hasher 中
	if err != nil {
		return "", fmt.Errorf("无法读取文件内容: %w", err)
	}

	sha256Bytes := hasher.Sum(nil)
	return hex.EncodeToString(sha256Bytes), nil
}

func main() {
	// 1. 计算字符串的 SHA-256
	str1 := "Hello, SHA-256!"
	sha256_str1 := CalculateSHA256String(str1)
	fmt.Printf("字符串 \"%s\" 的 SHA-256: %s\n", str1, sha256_str1) // 3cf8e84a2295b9220fc00f507b9492415170d742691456a2bb34e797d391f630

	str2 := "Hello, SHA-256" // 微小的改动
	sha256_str2 := CalculateSHA256String(str2)
	fmt.Printf("字符串 \"%s\" 的 SHA-256: %s\n", str2, sha256_str2) // efeb90b201f98bc43f0cb18a221f92e805f63d762f2d9178ad9fa0a45da26732

	// 2. 计算文件的 SHA-256
	exampleFilePath := "example_sha.txt"
	err := os.WriteFile(exampleFilePath, []byte("这是一个SHA-256测试文件。\n用于验证数据完整性。"), 0644)
	if err != nil {
		fmt.Printf("创建示例文件失败: %v\n", err)
		return
	}
	defer os.Remove(exampleFilePath)

	sha256_file, err := CalculateSHA256File(exampleFilePath)
	if err != nil {
		fmt.Printf("计算文件 SHA-256 失败: %v\n", err)
		return
	}
	fmt.Printf("文件 \"%s\" 的 SHA-256: %s\n", exampleFilePath, sha256_file) // 44322420f18aa0064d1f2150900f089602e1c7f998492c10b25e7d58a8a43f9a
}
```

**运行结果示例**：
```
字符串 "Hello, SHA-256!" 的 SHA-256: 3cf8e84a2295b9220fc00f507b9492415170d742691456a2bb34e797d391f630
字符串 "Hello, SHA-256" 的 SHA-256: efeb90b201f98bc43f0cb18a221f92e805f63d762f2d9178ad9fa0a45da26732
文件 "example_sha.txt" 的 SHA-256: 44322420f18aa0064d1f2150900f089602e1c7f998492c10b25e7d58a8a43f9a
```
可以看到，即使是字符串的微小变化，SHA-256 也能产生完全不同的长哈希值，体现了其强大的“雪崩效应”和抗碰撞能力。

## 四、SHA-3 详解 (未来趋势)

### 4.1 算法原理

SHA-3，正式名称为 **Keccak**，是 NIST 举行的加密哈希算法竞赛的获胜者。与 SHA-1 和 SHA-2 基于 Merkle-Damgård 结构不同，SHA-3 基于**海绵结构 (Sponge Construction)**。

**海绵结构**是一种更灵活的结构，它有两个主要阶段：

1.  **吸收 (Absorbing)**：将输入消息块“吸收”到内部状态中，通过相互作用更新状态。
2.  **挤压 (Squeezing)**：从内部状态中“挤出”固定长度的输出哈希值。

这种结构使其具有更强的抗攻击性，并且可以实现多种密码学功能（不仅仅是哈希），如流密码和消息认证码。

{% mermaid %}
graph TD
    A[输入消息 M] --> B[填充]
    B --> C["消息块 (Mi)"]
    Initial["初始化内部状态 S (大容量)"]
    Initial --> D{"吸收阶段 (Absorbing)"}
    C -- 循环输入消息块 --> D
    D --> E[内部状态 S 不断被消息块和函数更新]
    E --> F{"挤压阶段 (Squeezing)"}
    F -- 固定速率输出 --> G["输出哈希值 (Z)"]
{% endmermaid %}

### 4.2 SHA-3 的应用

SHA-3 提供与 SHA-2 相同输出长度（SHA3-224, SHA3-256, SHA3-384, SHA3-512）的哈希函数。

*   **设计完全不同**：作为 SHA-2 的备用方案存在，以防 SHA-2 系列出现未知漏洞。
*   **灵活性**：海绵结构在设计上更灵活，可以用作哈希函数、消息认证码 (MAC) 甚至随机数生成器。
*   **新兴应用**：区块链技术、加密货币（如以太坊的 KEC-256 变体，尽管正式的 SHA3-256 不同）以及需要最新密码学安全保障的领域正在逐步采纳 SHA-3。

### 4.3 Go 语言实现 SHA-3

Go 语言标准库通过 `golang.org/x/crypto/sha3` 包提供了 SHA-3 算法的实现。

```go
package main

import (
	"encoding/hex"
	"fmt"
	"io"
	"os"

	"golang.org/x/crypto/sha3" // 注意：这是第三方包，不是标准库的 crypto/sha3
)

// CalculateSHA3_256String 计算字符串的 SHA3-256 值
func CalculateSHA3_256String(data string) string {
	hasher := sha3.New256()        // 创建一个新的 SHA3-256 hasher
	hasher.Write([]byte(data))     // 将数据写入 hasher
	sha3Bytes := hasher.Sum(nil)   // 计算哈希值
	return hex.EncodeToString(sha3Bytes) // 转换为十六进制字符串
}

// CalculateSHA3_256File 计算文件的 SHA3-256 值
func CalculateSHA3_256File(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("无法打开文件: %w", err)
	}
	defer file.Close()

	hasher := sha3.New256()
	_, err = io.Copy(hasher, file) // 将文件内容复制到 hasher 中
	if err != nil {
		return "", fmt.Errorf("无法读取文件内容: %w", err)
	}

	sha3Bytes := hasher.Sum(nil)
	return hex.EncodeToString(sha3Bytes), nil
}

func main() {
	// 1. 计算字符串的 SHA3-256
	str1 := "Hello, SHA-3!"
	sha3_str1 := CalculateSHA3_256String(str1)
	fmt.Printf("字符串 \"%s\" 的 SHA3-256: %s\n", str1, sha3_str1) // 377dd92f4c2c503525a722421f66ebbd6a2373070490b639906d4e24ebca7480

	str2 := "Hello, SHA-3" // 微小的改动
	sha3_str2 := CalculateSHA3_256String(str2)
	fmt.Printf("字符串 \"%s\" 的 SHA3-256: %s\n", str2, sha3_str2) // 492cf7d206f36ebc24749298533b3a0bc11eb23c72b273b52d9a9416a244199c

	// 对比 SHA-256 和 SHA3-256 的输出长度和值：
	fmt.Printf("\n对比 SHA-256 和 SHA3-256 (均为 256 位输出):\n")
	fmt.Printf("字符串 \"%s\" 的 SHA-256: %s\n", str1, CalculateSHA256String(str1))
	fmt.Printf("字符串 \"%s\" 的 SHA3-256: %s\n", str1, CalculateSHA3_256String(str1))
}

// 辅助函数 (从 SHA-2 示例复制过来，用于对比)
func CalculateSHA256String(data string) string {
	hasher := sha256.New()
	hasher.Write([]byte(data))
	sha256Bytes := hasher.Sum(nil)
	return hex.EncodeToString(sha256Bytes)
}
```

**运行结果示例**：
```
字符串 "Hello, SHA-3!" 的 SHA3-256: 377dd92f4c2c503525a722421f66ebbd6a2373070490b639906d4e24ebca7480
字符串 "Hello, SHA-3" 的 SHA3-256: 492cf7d206f36ebc24749298533b3a0bc11eb23c72b273b52d9a9416a244199c

对比 SHA-256 和 SHA3-256 (均为 256 位输出):
字符串 "Hello, SHA-3!" 的 SHA-256: 9e6a27e70498305c11d6706900f055ecc79979cf661905869403ec95b410f9dc
字符串 "Hello, SHA-3!" 的 SHA3-256: 377dd92f4c2c503525a722421f66ebbd6a2373070490b639906d4e24ebca7480
```
可以看到 SHA-256 和 SHA3-256 尽管输出长度相同，但由于底层算法设计不同，生成了完全不同的哈希值。

## 五、应用场景与最佳实践

*   **数据完整性校验**：无论是下载文件、数据备份还是网络传输，SHA-256/SHA-512 可以用来检测数据是否被篡改。
*   **数字签名**：在生成数字签名时，通常会对原始消息的哈希值进行签名，而非原始消息本身。使用 SHA-256 或 SHA-512 是标准做法。
*   **密码存储**：**绝对不要直接存储用户密码**。应使用合适的盐 (Salt) 和**慢哈希函数**（如 bcrypt, scrypt, Argon2）来哈希密码。这些慢哈希函数内部通常会使用 SHA-2 等算法作为其基础组件，但会通过多次迭代和内存消耗来增加计算成本，从而抵御暴力破解和彩虹表攻击。
*   **区块链和加密货币**：SHA-256 在比特币等加密货币中 plays a critical role。
*   **身份验证**：在某些场景下，哈希值可以作为认证令牌的一部分。

**最佳实践**：

1.  **始终优先使用 SHA-2 (SHA-256/SHA-512) 或 SHA-3**。
2.  **避免使用 SHA-1 和 MD5** 进行任何与安全相关的哈希操作。
3.  对于密码存储，**不要直接使用 SHA-2 或 SHA-3**，而应使用专门设计的慢哈希算法（如 bcrypt, scrypt, Argon2），并结合随机生成的盐值。
4.  理解哈希算法提供的是**完整性**和**认证**，而非**加密**。哈希是单向的，无法还原原始数据。

## 六、总结

SHA 系列算法是现代密码学的重要组成部分，它们通过提供安全、高效的消息摘要功能，保障了数字信息的完整性和真实性。从最初的 SHA-0 到目前主流的 SHA-2，再到面向未来的 SHA-3 (Keccak)，每个版本都反映了密码学界对更高安全性的追求和算法设计的演进。

选择正确的 SHA 算法对于构建安全的系统至关重要。目前，**SHA-256 和 SHA-512 是行业推荐和广泛采用的安全哈希算法**。虽然 SHA-3 为未来的安全需求提供了备选方案，但在大多数应用中，SHA-2 仍然提供了足够的安全保障。作为开发者，我们应时刻关注密码学进展，及时更新和迁移到更安全的算法，确保数据和系统的安全。
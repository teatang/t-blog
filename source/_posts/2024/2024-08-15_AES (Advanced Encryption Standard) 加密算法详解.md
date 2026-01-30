---
title: AES (Advanced Encryption Standard) 加密算法详解
date: 2024-08-15 06:24:00
tags:
  - 2024
  - 对称加密
  - 加密算法
  - 计算机网络
categories:
  - 计算机网络
  - 加密算法
mathjax: true
---

> **AES (Advanced Encryption Standard)**，即**高级加密标准**，是当今最广泛使用的对称密钥分组密码算法之一。它由比利时密码学家 Joan Daemen 和 Vincent Rijmen 设计，原名为 **Rijndael 算法**。2001 年，美国国家标准与技术研究院 (NIST) 选定 Rijndael 算法作为新的联邦信息处理标准 (FIPS 197)，取代了 DES (Data Encryption Standard)，并将其命名为 AES。AES 具有出色的安全性、高效的性能和广泛的硬件及软件支持，已成为保护敏感数据的事实标准。

{% note info %}
核心思想：AES 是一种**对称密钥分组密码**，它采用 **SPN (Substitution-Permutation Network)** 结构，通过反复迭代四种基本操作：`SubBytes` (替换)、`ShiftRows` (行移位)、`MixColumns` (列混合) 和 `AddRoundKey` (密钥加)，将固定大小的明文块加密成相同大小的密文块，并支持 128、192 或 256 位密钥，从而提供强大的安全性。
{% endnote %}
------

## 一、引言：对称加密的王者

在现代密码学中，对称加密算法因其加解密速度快而常用于对大量数据进行加密。AES 是其中的翘楚，被认为是当今最安全的对称加密算法之一。

*   **对称加密 (Symmetric Encryption)**：使用相同的密钥进行加密和解密。优点是效率高，适合加密大量数据；缺点是密钥分发和管理复杂。
*   **分组密码 (Block Cipher)**：将明文数据分成固定大小的块（例如 AES 是 128 位），对每个块独立进行加密。

AES 具有以下关键特性：

*   **块大小 (Block Size)**：固定为 128 位 (16 字节)。
*   **密钥长度 (Key Size)**：支持 128 位、192 位和 256 位三种长度。密钥长度越长，安全性越高，但性能会略有下降。
*   **轮数 (Number of Rounds)**：根据密钥长度不同，加密过程会重复多轮：
    *   128 位密钥：10 轮
    *   192 位密钥：12 轮
    *   256 位密钥：14 轮

AES 的设计基于代数结构，其操作在有限域 GF($2^8$) 上进行，这使得其数学基础坚实且抗攻击能力强。

## 二、AES 算法核心操作

AES 算法（通常指 Rijndael 算法）的加密过程是将 128 位的明文块（16 字节）转化为一个 $4 \times 4$ 的字节矩阵，称为**状态 (State)**。然后对这个状态矩阵进行多轮迭代操作。每一轮操作都包含四个基本变换：

1.  **SubBytes (字节替换)**
2.  **ShiftRows (行移位)**
3.  **MixColumns (列混淆)**
4.  **AddRoundKey (轮密钥加)**

除了最后一轮，所有轮都包含这四个操作。最后一轮不包含 MixColumns。解密过程则是将这些操作逆序执行。

### 2.1 状态矩阵表示

128 位的明文块（16 字节）被排列成一个 $4 \times 4$ 的字节矩阵，按列主序填充。
例如，一个 128 位的块 $b_0, b_1, \dots, b_{15}$：

$$
\begin{pmatrix}
b_0 & b_4 & b_8 & b_{12} \\\\
b_1 & b_5 & b_9 & b_{13} \\\\
b_2 & b_6 & b_{10} & b_{14} \\\\
b_3 & b_7 & b_{11} & b_{15}
\end{pmatrix}
$$

### 2.2 SubBytes (字节替换)

*   **目的**：提供算法的**非线性性 (Non-linearity)**，使得输出与输入之间不是简单的线性关系，抵抗线性攻击和差分攻击。
*   **操作**：对状态矩阵中的每个字节进行非线性的字节替换。每个字节被替换成一个预定义的 $16 \times 16$ 的查找表 (Substitution Box, S-box) 中的对应值。S-box 是经过精心设计的，具有良好的数学性质。

### 2.3 ShiftRows (行移位)

*   **目的**：提供算法的**扩散性 (Diffusion)**，使明文或密钥的每个位变化尽可能多地影响密文的位，抵抗差分攻击。
*   **操作**：
    *   第 0 行：不移动
    *   第 1 行：左移 1 字节
    *   第 2 行：左移 2 字节
    *   第 3 行：左移 3 字节

$$
\begin{pmatrix}
s_{0,0} & s_{0,1} & s_{0,2} & s_{0,3} \\\\
s_{1,0} & s_{1,1} & s_{1,2} & s_{1,3} \\\\
s_{2,0} & s_{2,1} & s_{2,2} & s_{2,3} \\\\
s_{3,0} & s_{3,1} & s_{3,2} & s_{3,3}
\end{pmatrix}
\xrightarrow{\text{ShiftRows}}
\begin{pmatrix}
s_{0,0} & s_{0,1} & s_{0,2} & s_{0,3} \\\\
s_{1,1} & s_{1,2} & s_{1,3} & s_{1,0} \\\\
s_{2,2} & s_{2,3} & s_{2,0} & s_{2,1} \\\\
s_{3,3} & s_{3,0} & s_{3,1} & s_{3,2}
\end{pmatrix}
$$

### 2.4 MixColumns (列混淆)

*   **目的**：进一步增强**扩散性**，使状态矩阵中的每个字节都受到同一列中其他三个字节的影响。
*   **操作**：对状态矩阵中的每一列进行矩阵乘法运算。这是在伽罗瓦域 GF($2^8$) 上的乘法。每一列被一个固定的 $4 \times 4$ 矩阵相乘。

$$
\begin{pmatrix}
s'\_{0,j} \\\\
s'\_{1,j} \\\\
s'\_{2,j} \\\\
s'\_{3,j}
\end{pmatrix}
\=
\begin{pmatrix}
02 & 03 & 01 & 01 \\\\
01 & 02 & 03 & 01 \\\\
01 & 01 & 02 & 03 \\\\
03 & 01 & 01 & 02
\end{pmatrix}
\begin{pmatrix}
s_{0,j} \\\\
s_{1,j} \\\\
s_{2,j} \\\\
s_{3,j}
\end{pmatrix}
$$
其中，`01`, `02`, `03` 表示在 GF($2^8$) 上的系数。例如，$02 \cdot s_{0,j}$ 表示 $s_{0,j}$ 左移一位（乘以 x），然后如果溢出则异或 $0x1b$。

### 2.5 AddRoundKey (轮密钥加)

*   **目的**：引入**密钥依赖性**，使加密过程与密钥紧密关联。
*   **操作**：将当前的状态矩阵与**轮密钥 (Round Key)** 进行逐位异或 (XOR) 操作。轮密钥是从主密钥通过**密钥扩展 (Key Expansion)** 算法生成的。

### 2.6 密钥扩展 (Key Expansion)

AES 算法需要为每一轮生成一个独立的轮密钥。密钥扩展算法将原始的 128/192/256 位主密钥扩展成足够多的轮密钥。这个过程涉及：

*   **RotWord**：将一个 4 字节的字循环左移。
*   **SubWord**：对一个 4 字节的字中的每个字节应用 S-box 替换。
*   **Rcon (Round Constant)**：与轮数相关的常量，防止对称性攻击。
*   **XOR**：与之前的字进行异或操作。

## 三、AES 加密流程概览

1.  **初始轮密钥加 (Initial AddRoundKey)**：明文块与初始轮密钥（即主密钥）进行异或。
2.  **多轮迭代**：
    *   对于除了最后一轮的每一轮：
        *   SubBytes
        *   ShiftRows
        *   MixColumns
        *   AddRoundKey
    *   最后一轮：
        *   SubBytes
        *   ShiftRows
        *   AddRoundKey (不执行 MixColumns)

**AES 加密过程示意图：**

{% mermaid %}
graph TD
    A["明文块 (128 bits)"] --> B(初始 AddRoundKey);
    B --> C{轮 1};
    C --> D(SubBytes);
    D --> E(ShiftRows);
    E --> F(MixColumns);
    F --> G(AddRoundKey);
    G -- ... N-1 轮 ... --> H{"轮 N (最后一轮)"};
    H --> I(SubBytes);
    I --> J(ShiftRows);
    J --> K(AddRoundKey);
    K --> L["密文块 (128 bits)"];
{% endmermaid %}
其中，`N` 是总轮数 (10, 12 或 14)。

## 四、工作模式 (Operating Modes)

分组密码每次只能加密固定大小的明文块。为了加密任意长度的数据，并增强安全性，AES 通常会结合不同的**工作模式**来使用。

1.  **ECB (Electronic Codebook Mode - 电子密码本模式)**
    *   **特点**：每个明文块独立加密。
    *   **优点**：简单，可并行处理，错误不会扩散。
    *   **缺点**：不安全！相同的明文块会产生相同的密文块，容易受到模式分析攻击，泄露信息。**不推荐用于加密数据。**
    *   **适用场景**：密钥、哈希值等随机且长度固定的小数据。

2.  **CBC (Cipher Block Chaining Mode - 密码块链模式)**
    *   **特点**：每个明文块在加密前与前一个密文块进行异或。需要一个**初始化向量 (Initialization Vector, IV)** 来加密第一个块。
    *   **优点**：安全性高，引入随机性，相同的明文块产生不同的密文块。
    *   **缺点**：不能并行处理加密（解密可以并行），错误会扩散。
    *   **适用场景**：大部分通用数据加密。

3.  **CTR (Counter Mode - 计数器模式)**
    *   **特点**：将块密码转换为流密码。通过加密一个不断递增的计数器来生成密钥流，然后将密钥流与明文进行异或。也需要一个 IV。
    *   **优点**：可以并行处理加解密，错误不会扩散，安全性高。
    *   **缺点**：IV 必须是唯一的，且不可重复使用。
    *   **适用场景**：高速数据传输，随机访问文件加密。

4.  **GCM (Galois/Counter Mode - 伽罗瓦/计数器模式)**
    *   **特点**：一种认证加密模式。在提供加密的同时，还提供**认证 (Authentication)** 和**完整性 (Integrity)** 检查。
    *   **优点**：安全性高，性能好，可并行，支持关联数据 (Additional Authenticated Data, AAD)。
    *   **缺点**：实现比 CTR 更复杂。
    *   **适用场景**：TLS/SSL 协议、IPSec、SSH 等，是目前最推荐的通用加密模式。

**重要提示**：在实际应用中，**绝对不要使用 ECB 模式**。对于一般应用，推荐使用 **CBC** 或 **CTR**。如果需要数据认证和完整性（几乎所有现代应用都需要），则强烈推荐使用 **GCM**。IV (或 Nonce) 在 CBC 和 CTR/GCM 模式中**至关重要**，必须是不可预测且每次加密都独一无二的。

## 五、安全性与最佳实践

*   **密钥长度**：选择 128、192 或 256 位的密钥。128 位已足够安全，但 256 位提供了更高的安全裕度。
*   **密钥管理**：对称密钥是 AES 安全的核心。密钥必须安全地生成、存储、分发和销毁。这通常是 AES 实现中最薄弱的环节。
*   **工作模式**：务必选择合适的安全工作模式 (如 CBC, CTR, GCM)，并正确使用 IV/Nonce。
*   **初始化向量 (IV) / Nonce (Number used once)**：
    *   CBC 和 CTR/GCM 模式都需要 IV/Nonce。
    *   IV 必须是**不可预测且每次加密都独一无二**的。**绝不能重复使用相同的 (密钥, IV) 对进行加密。** 对于 CBC，IV 不必保密，但必须唯一且随机；对于 CTR/GCM，Nonce 同样必须唯一，通常可以是一个计数器。
    *   IV/Nonce 通常随密文一起传输。
*   **填充 (Padding)**：对于块密码，如果明文不是块大小的整数倍，需要进行填充。例如 PKCS#7 填充。GCM 等认证加密模式通常不需要额外的填充。
*   **认证加密 (Authenticated Encryption)**：如果不仅需要保密性，还需要确保数据未被篡改，务必使用认证加密模式（如 GCM）。单纯的 CBC 或 CTR 只能保证机密性，无法防止密文被恶意修改。

## 六、Go 语言实现示例

Go 语言的 `crypto/aes` 和 `crypto/cipher` 包提供了 AES 算法及其常见工作模式的实现。

```go
package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
	"log"
)

// generateKey 生成一个指定长度的随机 AES 密钥
func generateKey(keyLen int) ([]byte, error) {
	key := make([]byte, keyLen)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return nil, fmt.Errorf("生成密钥失败: %w", err)
	}
	return key, nil
}

// encryptCBC 使用 AES-CBC 模式加密数据
// plaintext: 原始明文
// key: 16, 24 或 32 字节的 AES 密钥
// iv: 16 字节的初始化向量 (IV), 必须唯一且随机
func encryptCBC(plaintext []byte, key []byte, iv []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("创建 AES Cipher 失败: %w", err)
	}

	// 填充明文以匹配块大小
	// 推荐使用 PKCS#7 填充 (这里简化为简单填充，实际应用应使用标准库或自定义函数)
	padding := block.BlockSize() - len(plaintext)%block.BlockSize()
	paddedPlaintext := make([]byte, len(plaintext)+padding)
	copy(paddedPlaintext, plaintext)
	for i := 0; i < padding; i++ {
		paddedPlaintext[len(plaintext)+i] = byte(padding)
	}

	ciphertext := make([]byte, len(paddedPlaintext))
	mode := cipher.NewCBCEncrypter(block, iv)
	mode.CryptBlocks(ciphertext, paddedPlaintext)

	return ciphertext, nil
}

// decryptCBC 使用 AES-CBC 模式解密数据
func decryptCBC(ciphertext []byte, key []byte, iv []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("创建 AES Cipher 失败: %w", err)
	}

	if len(ciphertext)%block.BlockSize() != 0 {
		return nil, fmt.Errorf("密文不是块大小的整数倍")
	}

	decryptedText := make([]byte, len(ciphertext))
	mode := cipher.NewCBCDecrypter(block, iv)
	mode.CryptBlocks(decryptedText, ciphertext)

	// 去除填充
	// 实际应用应验证填充的有效性，防止填充预言攻击
	padding := int(decryptedText[len(decryptedText)-1])
	if padding > block.BlockSize() || padding == 0 { // 简单的填充检查，实际应更严格
		return nil, fmt.Errorf("无效的填充")
	}
	return decryptedText[:len(decryptedText)-padding], nil
}

// encryptGCM 使用 AES-GCM 模式加密数据 (带认证)
// plaintext: 原始明文
// key: 16, 24 或 32 字节的 AES 密钥
// additionalData: 额外认证数据 (AAD)，可以为 nil
func encryptGCM(plaintext []byte, key []byte, additionalData []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("创建 AES Cipher 失败: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("创建 GCM 失败: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize()) // GCM Nonce 长度通常为 12 字节
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("生成 Nonce 失败: %w", err)
	}

	// seal 方法会返回 Nonce + 密文 + tag
	ciphertext := gcm.Seal(nonce, nonce, plaintext, additionalData)
	return ciphertext, nil
}

// decryptGCM 使用 AES-GCM 模式解密数据 (带认证)
// ciphertext: 包含 Nonce, 密文和认证标签的完整密文
// key: 16, 24 或 32 字节的 AES 密钥
// additionalData: 额外认证数据 (AAD)，必须与加密时一致
func decryptGCM(ciphertext []byte, key []byte, additionalData []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("创建 AES Cipher 失败: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("创建 GCM 失败: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("密文过短，不包含 Nonce")
	}

	nonce, encryptedMessage := ciphertext[:nonceSize], ciphertext[nonceSize:]

	// open 方法会验证认证标签，如果验证失败则返回错误
	plaintext, err := gcm.Open(nil, nonce, encryptedMessage, additionalData)
	if err != nil {
		return nil, fmt.Errorf("解密或认证失败: %w", err)
	}
	return plaintext, nil
}

func main() {
	// 1. 生成 AES 密钥 (例如 256 位，即 32 字节)
	aesKey, err := generateKey(32) // 32 字节密钥对应 AES-256
	if err != nil {
		log.Fatalf("生成 AES 密钥失败: %v", err)
	}
	fmt.Printf("生成的 AES-256 密钥 (Base64): %s\n", base64.StdEncoding.EncodeToString(aesKey))

	originalMessage := []byte("这是一条需要加密的秘密消息，可以包含任意长度的数据。")
	fmt.Printf("\n原始消息: %s\n", originalMessage)

	// --- AES-CBC 模式示例 ---
	fmt.Println("\n--- AES-CBC 模式 ---")
	iv := make([]byte, aes.BlockSize) // AES BlockSize 是 16 字节
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		log.Fatalf("生成 IV 失败: %v", err)
	}
	fmt.Printf("生成的 CBC IV (Base64): %s\n", base64.StdEncoding.EncodeToString(iv))

	encryptedCBCMessage, err := encryptCBC(originalMessage, aesKey, iv)
	if err != nil {
		log.Fatalf("CBC 加密失败: %v", err)
	}
	fmt.Printf("CBC 加密后的密文 (Base64): %s\n", base64.StdEncoding.EncodeToString(encryptedCBCMessage))

	decryptedCBCMessage, err := decryptCBC(encryptedCBCMessage, aesKey, iv)
	if err != nil {
		log.Fatalf("CBC 解密失败: %v", err)
	}
	fmt.Printf("CBC 解密后的消息: %s\n", decryptedCBCMessage)
	if string(originalMessage) != string(decryptedCBCMessage) {
		fmt.Println("⚠️ CBC 原始消息与解密消息不匹配！")
	} else {
		fmt.Println("✅ CBC 原始消息与解密消息匹配。")
	}

	// --- AES-GCM 模式示例 (推荐) ---
	fmt.Println("\n--- AES-GCM 模式 (推荐用于现代应用) ---")
	additionalData := []byte("这是额外认证数据，不加密但参与认证") // 例如，可以是版本号、用户ID等

	encryptedGCMMessage, err := encryptGCM(originalMessage, aesKey, additionalData)
	if err != nil {
		log.Fatalf("GCM 加密失败: %v", err)
	}
	fmt.Printf("GCM 加密后的密文 (包含 Nonce 和 Tag, Base64): %s\n", base64.StdEncoding.EncodeToString(encryptedGCMMessage))

	decryptedGCMMessage, err := decryptGCM(encryptedGCMMessage, aesKey, additionalData)
	if err != nil {
		log.Fatalf("GCM 解密或认证失败: %v", err)
	}
	fmt.Printf("GCM 解密后的消息: %s\n", decryptedGCMMessage)
	if string(originalMessage) != string(decryptedGCMMessage) {
		fmt.Println("⚠️ GCM 原始消息与解密消息不匹配！")
	} else {
		fmt.Println("✅ GCM 原始消息与解密消息匹配。")
	}

	// 尝试篡改 GCM 密文 (演示 GCM 的认证功能)
	fmt.Println("\n--- 尝试篡改 GCM 密文 ---")
	tamperedGCMMessage := make([]byte, len(encryptedGCMMessage))
	copy(tamperedGCMMessage, encryptedGCMMessage)
	if len(tamperedGCMMessage) > 10 {
		tamperedGCMMessage[10] ^= 0x01 // 篡改密文的一个字节
	}

	_, err = decryptGCM(tamperedGCMMessage, aesKey, additionalData)
	if err != nil {
		fmt.Printf("GCM 解密或认证失败 (预期): %v\n", err)
		fmt.Println("✅ GCM 成功检测到篡改。")
	} else {
		fmt.Println("❌ GCM 意外解密成功，未能检测到篡改！")
	}

	// 尝试修改 AAD 后解密 GCM 密文
	fmt.Println("\n--- 尝试修改 AAD 后解密 GCM 密文 ---")
	modifiedAdditionalData := []byte("这是被修改过的额外认证数据")
	_, err = decryptGCM(encryptedGCMMessage, aesKey, modifiedAdditionalData)
	if err != nil {
		fmt.Printf("GCM 解密或认证失败 (预期): %v\n", err)
		fmt.Println("✅ GCM 成功检测到 AAD 被篡改。")
	} else {
		fmt.Println("❌ GCM 意外解密成功，未能检测到 AAD 篡改！")
	}
}
```

## 七、总结

AES 算法是现代密码学中的基石，其强大的安全性和高效性使其成为保护数据机密性的首选。理解 AES 的核心操作（SubBytes, ShiftRows, MixColumns, AddRoundKey）和不同的工作模式（尤其是推荐的 GCM 模式）对于正确、安全地使用该算法至关重要。开发者在实现时，不仅要选择正确的密钥长度和工作模式，更要注重**密钥的安全管理**以及 **IV/Nonce 的正确生成与使用**，这是确保加密系统整体安全性的关键。

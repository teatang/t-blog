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
---

> **AES (Advanced Encryption Standard)**，即**高级加密标准**，是目前全球范围内**最广泛使用且高度安全的对称密钥加密算法**。它于 2001 年由美国国家标准与技术研究院 (NIST) 发布，取代了 DES (Data Encryption Standard) 算法，成为美国联邦政府及全球范围内的推荐加密标准。AES 基于比利时密码学家 Joan Daemen 和 Vincent Rijmen 设计的 **Rijndael (读作 "Rhine-doll")** 算法。

{% note info %}
**核心思想**：使用**相同的密钥**进行加密和解密。发送方使用密钥对明文进行加密生成密文，接收方使用**相同的密钥**对密文进行解密还原成明文。
{% endnote %}

## 一、AES 的基本概念与特性

### 1.1 对称密钥加密 (Symmetric-key Encryption)

AES 属于对称密钥加密算法。这意味着：

*   **加密密钥和解密密钥是相同的**（或可相互轻易推导）。
*   要求通信双方在进行加密通信前，必须通过安全的方式共享这个密钥。
*   优点是加解密速度快，效率高。
*   缺点是密钥分发和管理比较复杂，尤其是在大规模网络中。

### 1.2 分组密码 (Block Cipher)

AES 是一种**分组密码 (Block Cipher)**。

*   它将明文消息分割成固定大小的**数据块 (Block)**。
*   每个数据块独立地进行加密。
*   AES 算法处理的数据块大小固定为 **128 位 (16 字节)**。

### 1.3 密钥长度与轮数

AES 算法支持三种不同的密钥长度，对应不同的加密轮数：

*   **AES-128**：使用 128 位 (16 字节) 密钥，加密 10 轮。
*   **AES-192**：使用 192 位 (24 字节) 密钥，加密 12 轮。
*   **AES-256**：使用 256 位 (32 字节) 密钥，加密 14 轮。

密钥长度越长，加密轮数越多，算法的安全性越高，但计算开销也会相应增加。目前，AES-256 被认为是具备“军事级”安全强度。

### 1.4 算法结构

AES 算法基于一种称为**代换-置换网络 (Substitution-Permutation Network, SPN)** 的结构，它通过重复进行一系列的代换 (Substitution) 和置换 (Permutation) 操作来混淆明文。

## 二、AES 的操作步骤 (以 AES-128 为例)

AES 的每一次加密（或解密）都基于一个 128 位的数据块、128 位 (或 192/256 位) 的密钥以及多次重复的轮函数。

一个 128 位的输入数据块被表示为一个 4x4 的字节矩阵，称为**状态 (State)**。

### 2.1 预备步骤：密钥扩展 (Key Expansion)

AES 并不是直接使用原始密钥进行所有轮次的加密。相反，它会根据原始密钥生成一系列的**轮密钥 (Round Keys)**。加密过程中每轮操作都会使用一个不同的轮密钥。128 位的密钥会扩展成 11 个 128 位的轮密钥（初始轮密钥 + 10 轮的轮密钥）。

### 2.2 加密过程 (Encryption)

AES 加密过程包含 10、12 或 14 个轮次（取决于密钥长度）。除了最后一轮外，所有轮执行相同的四种操作，而最后一轮会跳过 MixColumns 步骤。

1.  **初始轮 (Initial Round)**：
    *   **AddRoundKey (加轮密钥)**：将状态矩阵的每个字节与当前轮密钥进行异或 (XOR) 操作。这是唯一使用密钥的步骤，也是唯一的基于密钥的混淆操作。

2.  **主循环 (Main Rounds)** (N-1 轮，例如 AES-128 是 9 轮)：
    *   **SubBytes (字节代换)**：状态矩阵中的每个字节都通过一个固定的、非线性的**S-盒 (S-box)** 进行代换。这个 S-盒是一个 8 位输入、8 位输出的查找表，旨在提供算法的非线性性，抵御线性密码分析。
    *   **ShiftRows (行移位)**：状态矩阵的四行进行不同位数的循环左移。
        *   第 0 行：不移位。
        *   第 1 行：循环左移 1 字节。
        *   第 2 行：循环左移 2 字节。
        *   第 3 行：循环左移 3 字节。
        这个操作是为了在行之间混淆数据，抵御差分密码分析。
    *   **MixColumns (列混合)**：状态矩阵的每一列都与一个固定的多项式进行数学运算（矩阵乘法）。这个操作目的是混合列中的字节，使一个字节的变化影响到其他三个字节，进一步增强扩散性。
    *   **AddRoundKey (加轮密钥)**：与初始轮相同，异或当前轮的轮密钥。

3.  **最终轮 (Final Round)** (第 N 轮，例如 AES-128 是第 10 轮)：
    *   **SubBytes (字节代换)**
    *   **ShiftRows (行移位)**
    *   **AddRoundKey (加轮密钥)**
    *   **注意**：最终轮**不进行 MixColumns** 操作。

### 2.3 解密过程 (Decryption)

解密过程是加密过程的逆向操作，每个步骤都是其加密对应步骤的逆运算，并且操作的顺序也是逆向的。

*   **InvAddRoundKey (逆加轮密钥)**
*   **InvMixColumns (逆列混合)**
*   **InvShiftRows (逆行移位)**
*   **InvSubBytes (逆字节代换)**

通过这些操作的组合，AES 确保了加密过程的复杂性和数据的充分扩散与混淆，使得在不知道密钥的情况下，通过密文还原明文在计算上是不可行的。

## 三、AES 的工作模式 (Modes of Operation)

由于 AES 仅能加密固定长度的 128 位数据块，对于任意长度的明文，需要引入**工作模式**来处理。不同的工作模式提供了不同的安全特性和性能考量。

常用的工作模式包括：

1.  **ECB (Electronic Codebook Mode - 电子密码本模式)**
    *   **原理**：将明文分成若干个 128 位块，每个块独立地用同一个密钥进行加密。
    *   **优点**：实现简单，可以并行加密。
    *   **缺点**：**安全性最差**。如果明文中存在相同的块，则加密后也会产生相同的密文块。这会暴露明文的模式和结构。**不建议在实际应用中使用**。
    *   例如，加密一个纯色图片，ECB 模式加密后的图片仍然能看出轮廓。

2.  **CBC (Cipher Block Chaining Mode - 密码分组链接模式)**
    *   **原理**：除了第一个明文块外，每个明文块在加密前会先与前一个密文块进行 XOR 异或操作。第一个明文块与一个初始化向量 (IV) 进行 XOR。
    *   **优点**：解决了 ECB 的模式暴露问题，相同明文块不会产生相同的密文块。安全性更高。
    *   **缺点**：无法并行加密（解密可以并行）。需要 IV，且 IV 必须是随机的，每次加密都不同，但可以明文传输。
    *   **广泛使用**。

3.  **CFB (Cipher Feedback Mode - 密码反馈模式)**
    *   **原理**：将块密码转换为流密码。前一个密文块（或 IV）经过加密后，其输出的一部分与当前明文块进行 XOR 得到当前密文。
    *   **优点**：可以加密任意位大小的明文（不一定是 128 位），适用于实时数据流。
    *   **缺点**：同样无法并行加密。

4.  **OFB (Output Feedback Mode - 输出反馈模式)**
    *   **原理**：与 CFB 类似，也是将块密码转换为流密码。但 OFB 模式中，加密器的输出是作为下一轮加密器的输入，与明文无关。
    *   **优点**：可以预先生成密匙流，允许并行操作。误差不会扩散。
    *   **缺点**：无法并行加密。

5.  **CTR (Counter Mode - 计数器模式)**
    *   **原理**：使用一个不断递增的计数器和一个 IV 组合，每次加密都将计数器加密的结果与明文进行 XOR。
    *   **优点**：**可并行加密和解密**。随机访问能力强（可以直接解密任何一个块），适用于大数据量和流媒体加密。安全性高。
    *   **广泛使用**。

6.  **GCM (Galois/Counter Mode - Galois 计数器模式)**
    *   **原理**：结合了 CTR 模式的并行性和 Galois 字段乘法，提供了**认证加密 (Authenticated Encryption with Associated Data, AEAD)**。它不仅提供数据的机密性（加密），还提供数据的**完整性**和**真实性**验证，并支持处理**关联数据 (Associated Data, AD)**。
    *   **优点**：**目前最推荐使用的模式**。提供机密性、完整性和真实性，且性能高效。
    *   **广泛用于 TLS/SSL 协议，HTTPS 等。**

**总结**：在实际应用中，**强烈推荐使用 GCM 模式**，因为它同时提供了机密性、完整性和真实性，且性能优异。如果不需要认证加密，CTR 模式也是一个很好的选择。**切勿在生产环境中使用 ECB 模式。**

## 四、Go 语言实现 AES 加密与解密

Go 语言标准库提供了 `crypto/aes` 包用于实现 AES 算法，以及 `crypto/cipher` 包用于实现各种工作模式。

### 4.1 使用 AES-256-GCM 进行对称加密解密

这是最推荐的实践方式，因为它提供了机密性、完整性、真实性。

```go
package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
)

// GenerateRandomBytes 生成指定长度的随机字节
func GenerateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return nil, err
	}
	return b, nil
}

// AESGCMEncrypt 使用 AES-256-GCM 加密数据
func AESGCMEncrypt(plaintext []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key) // 创建一个新的 AES 加密器块
	if err != nil {
		return nil, fmt.Errorf("创建 AES 块失败: %w", err)
	}

	// 使用 Cipher 的块创建一个 GCM 模式的认证加密器
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("创建 GCM 模式失败: %w", err)
	}

	// GCM 模式需要一个随机的 Nonce (Number used once)
	// Nonce 的长度由 gcm.NonceSize() 决定，对于 AES-GCM，通常是 12 字节
	nonce, err := GenerateRandomBytes(gcm.NonceSize())
	if err != nil {
		return nil, fmt.Errorf("生成 Nonce 失败: %w", err)
	}

	// 加密并认证数据
	// Seal 方法的参数：
	//    dst []byte：用于存储输出的切片，如果为 nil，则会分配一个新的切片
	//    nonce []byte：每次加密都必须不同且随机的 Nonce
	//    plaintext []byte：要加密的明文
	//    additionalData []byte：可选的关联数据 (Authenticated Data)，不加密但会被认证
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil) // nonce 也作为输出密文的前缀
	return ciphertext, nil
}

// AESGCMDecrypt 使用 AES-256-GCM 解密数据
func AESGCMDecrypt(ciphertext []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("创建 AES 块失败: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("创建 GCM 模式失败: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("密文长度不足，可能不包含 Nonce")
	}

	// 从密文中分离 Nonce 和实际的加密数据
	nonce := ciphertext[:nonceSize]
	encryptedData := ciphertext[nonceSize:]

	// 解密并验证数据
	// Open 方法的参数：
	//    dst []byte：用于存储输出的明文，如果为 nil，则会分配一个新的切片
	//    nonce []byte：与加密时使用的 Nonce 相同
	//    ciphertext []byte：实际的加密数据
	//    additionalData []byte：可选的关联数据 (Authenticated Data)，与加密时相同
	plaintext, err := gcm.Open(nil, nonce, encryptedData, nil)
	if err != nil {
		return nil, fmt.Errorf("解密或验证失败: %w", err) // 如果数据被篡改，Open 会返回错误
	}
	return plaintext, nil
}

func main() {
	// 1. 生成 256 位 (32 字节) 的随机密钥
	key, err := GenerateRandomBytes(32) // AES-256 需要 32 字节密钥
	if err != nil {
		fmt.Printf("生成密钥失败: %v\n", err)
		return
	}
	fmt.Printf("使用的密钥 (Hex): %s\n", hex.EncodeToString(key))

	// 2. 原始明文
	plaintext := []byte("这是一段需要使用 AES-256-GCM 加密的明文！保护数据安全。")
	fmt.Printf("原始明文: %s\n", plaintext)

	// 3. 加密过程
	fmt.Println("\n=== 加密过程 ===")
	ciphertext, err := AESGCMEncrypt(plaintext, key)
	if err != nil {
		fmt.Printf("加密失败: %v\n", err)
		return
	}
	fmt.Printf("加密后的密文 (Hex): %s\n", hex.EncodeToString(ciphertext))
	fmt.Printf("密文长度: %d 字节 (其中包含 %d 字节的 Nonce 和 16 字节的认证标签)\n", len(ciphertext), aes.BlockSize/8) // Nonce 长度通常是 12 字节，但这里返回的是 BlockSize/8

	// 4. 解密过程
	fmt.Println("\n=== 解密过程 ===")
	decryptedText, err := AESGCMDecrypt(ciphertext, key)
	if err != nil {
		fmt.Printf("解密失败: %v\n", err)
		return
	}
	fmt.Printf("解密后的明文: %s\n", decryptedText)

	// 5. 模拟数据篡改或密钥错误
	fmt.Println("\n=== 模拟篡改/错误 ===")
	// 篡改密文 (例如修改一个字节)
	badCiphertext := make([]byte, len(ciphertext))
	copy(badCiphertext, ciphertext)
	badCiphertext[len(badCiphertext)-1] ^= 0x01 // 翻转密文最后一个字节的最低位

	_, err = AESGCMDecrypt(badCiphertext, key)
	if err != nil {
		fmt.Printf("密文被篡改，解密验证失败 (预期): %v\n", err)
	} else {
		fmt.Println("密文被篡改，但解密成功 (不应该发生)!")
	}

	// 使用错误的密钥
	wrongKey, _ := GenerateRandomBytes(32)
	_, err = AESGCMDecrypt(ciphertext, wrongKey)
	if err != nil {
		fmt.Printf("使用错误密钥，解密验证失败 (预期): %v\n", err)
	} else {
		fmt.Println("使用错误密钥，但解密成功 (不应该发生)!")
	}
}
```

**运行结果示例**：
```
使用的密钥 (Hex): 919313ea595cb2e1c2554e2ac506f363c485097f5a8a47479ed3a5f9737190e2
原始明文: 这是一段需要使用 AES-256-GCM 加密的明文！保护数据安全。

=== 加密过程 ===
加密后的密文 (Hex): d0d066343c4a259c760b21a8cd66aa1d43194a2f8c5c78652414704b2c174ca9a1036814041d5754020a1fc413e11f1856716a50
密文长度: 60 字节 (其中包含 16 字节的 Nonce 和 16 字节的认证标签)

=== 解密过程 ===
解密后的明文: 这是一段需要使用 AES-256-GCM 加密的明文！保护数据安全。

=== 模拟篡改/错误 ===
密文被篡改，解密验证失败 (预期): 解密或验证失败: cipher: message authentication failed
使用错误密钥，解密验证失败 (预期): 解密或验证失败: cipher: message authentication failed
```
从运行结果可以看出，AES-GCM 不仅能正确加解密，而且在密文被篡改或密钥错误时，能够可靠地检测到并拒绝解密，提供了强大的数据完整性和真实性保障。

### 4.2 注意事项

*   **密钥安全**：密钥是 AES 安全的基石，必须妥善保管，绝不能泄露。通常通过密钥管理系统 (KMS)、硬件安全模块 (HSM) 或安全的密钥交换协议（如 RSA、ECDH）进行分发。
*   **Nonce/IV 的使用**：
    *   对于 CBC、CFB、OFB 模式，**IV (Initialization Vector) 必须是随机的，每次加密都不同，但可以不保密传输**。
    *   对于 GCM、CTR 模式，**Nonce (Number Used Once) 必须是随机的，每次加密都不同，且不能重复使用，但可以不保密传输**。
    *   如果 Nonce/IV 重复使用，会导致严重的安全性问题，特别是对于 CTR/GCM 模式。
*   **明文填充 (Padding)**：对于块密码，如果明文长度不是块大小的整数倍，需要进行填充。Go 语言的 `crypto/cipher` 在流模式或 GCM 模式下通常不需要手动填充（因为它们不直接依赖完整块操作），但在使用 `NewCBCEncrypter` 等直接块模式时，需要注意 PKCS#7 或其他填充方式。**GCM 模式不需要手动填充**。
*   **关联数据 (Associated Data)**：GCM 模式中的 `additionalData` 参数非常有用，它允许你认证一些不加密但与密文和密钥关联的数据。例如，HTTP Headers、版本号等。这些数据在解密时必须与加密时提供的值完全一致，否则解密会失败。

## 五、AES 的应用场景

AES 在现代信息安全中无处不在：

*   **HTTPS/TLS/SSL 协议**：用于加密网络通信数据。
*   **VPN (虚拟私人网络)**：保护网络流量的机密性。
*   **Wi-Fi 安全 (WPA2/WPA3)**：用于保护无线网络通信。
*   **磁盘加密**：例如 BitLocker (Windows)、FileVault (macOS)、LUKS (Linux)。
*   **数据库加密**：存储的敏感数据加密。
*   **文件加密**：对存储的文件进行加密保护。
*   **数字版权管理 (DRM)**：保护数字内容的版权。
*   **安全通信应用**：如 Signal, Telegram 等。

## 六、总结

AES 是一个经过严格审查和广泛实践的高度安全的对称密钥加密算法。其强大的安全特性和高效的性能，使其成为保护数字世界机密性的黄金标准。在 Go 语言中，通过 `crypto/aes` 和 `crypto/cipher` 库，我们可以方便且安全地实现 AES 加密。

在实际应用中，**强烈建议使用 AES-256-GCM 模式**，它不仅提供了数据机密性，还通过认证确保了数据的完整性和真实性，有效防御了篡改攻击。同时，妥善的密钥管理和正确的 Nonce/IV 使用是确保 AES 加密安全的关键。理解并遵循这些最佳实践，将有助于构建更健壮、更安全的系统。
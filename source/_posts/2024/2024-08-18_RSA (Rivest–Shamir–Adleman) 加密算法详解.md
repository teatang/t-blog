---
title: RSA (Rivest–Shamir–Adleman) 加密算法详解
date: 2024-08-18 06:24:00
tags:
  - 2024
  - 非对称加密
  - 加密算法
  - 计算机网络
categories:
  - 计算机网络
  - 加密算法
mathjax: true
---

> **RSA** 是一种非对称加密算法，由 Ron Rivest、Adi Shamir 和 Leonard Adleman 于 1977 年提出，并以他们姓氏的首字母命名。它是目前应用最广泛的公钥密码算法之一，广泛用于数据加密、数字签名以及密钥交换等领域。RSA 的安全性基于大整数分解的困难性，即给定两个大素数 `p` 和 `q`，计算它们的乘积 `n = p * q` 是容易的，但给定 `n` 却很难反向分解出 `p` 和 `q`。

## 一、引言：公钥密码学的基石

在密码学领域，我们通常将加密算法分为两大类：对称加密和非对称加密。

*   **对称加密 (Symmetric Encryption)**：使用相同的密钥进行加密和解密。优点是速度快，但密钥分发和管理是其主要挑战。
*   **非对称加密 (Asymmetric Encryption / Public-key Cryptography)**：使用一对密钥，即一个**公钥 (Public Key)** 和一个**私钥 (Private Key)**。公钥可以公开，用于加密或验证签名；私钥必须严格保密，用于解密或生成签名。

RSA 算法是公钥密码学的代表，解决了对称加密中密钥分发的难题。其核心思想是构建一个**陷门单向函数 (Trapdoor One-way Function)**：
*   **单向函数**：正向计算非常容易，反向计算（逆运算）非常困难。
*   **陷门**：在已知某个“陷门信息”（私钥）的情况下，反向计算变得容易。

## 二、RSA 算法原理

RSA 算法主要包含三个阶段：密钥生成、加密和解密。

### 2.1 密钥生成

密钥生成是 RSA 算法的基础，它创建了用于加密和解密的公钥和私钥对。

1.  **选择两个大的、相异的素数 `p` 和 `q`**：
    *   这两个素数必须足够大，且为了安全性，通常建议它们的长度相同（例如，都为 1024 位）。
    *   $p \ne q$

2.  **计算模数 `n`**：
    *   $n = p \times q$
    *   `n` 将成为公钥和私钥的一部分。其长度通常是 `p` 和 `q` 长度之和（例如，2048 位）。

3.  **计算欧拉函数 $\phi(n)$**：
    *   $\phi(n) = (p-1)(q-1)$
    *   $\phi(n)$ 在密钥生成过程中非常关键，但之后需要被丢弃，不能泄露给攻击者。

4.  **选择公钥指数 `e` (Encryption Exponent)**：
    *   选择一个整数 `e`，满足以下条件：
        *   $1 < e < \phi(n)$
        *   `e` 与 $\phi(n)$ 互质 (即它们的最大公约数 `gcd(e, \phi(n)) = 1`)。
    *   通常选择较小的 `e` 值，如 $2^{16}+1 = 65537$，因为它能加快加密速度。

5.  **计算私钥指数 `d` (Decryption Exponent)**：
    *   计算 `d`，使其满足以下同余方程：
        *   $d \cdot e \equiv 1 \pmod{\phi(n)}$
    *   这意味着 $d \cdot e = k \cdot \phi(n) + 1$ (其中 `k` 是一个整数)。
    *   `d` 可以通过扩展欧几里得算法从 `e` 和 $\phi(n)$ 计算得到。

**至此，密钥生成完成：**
*   **公钥 (Public Key)**：`(n, e)`
*   **私钥 (Private Key)**：`(n, d)` (为了加快解密，有时还会存储 `p`, `q`, `dP = d mod (p-1)`, `dQ = d mod (q-1)`, `qInv = q^-1 mod p`，这些统称为中国剩余定理参数 CRT parameters)

**密钥生成过程示意图：**

{% mermaid %}
graph TD
    A[选择两个大素数 p, q] --> B[计算 n = p * q];
    A --> C["计算欧拉函数 phi(n) = (p-1)(q-1)"];
    C --> D["选择公钥指数 e, 满足 1 < e < phi(n) 且 gcd(e, phi(n)) = 1"];
    C --> E["计算私钥指数 d, 满足 d * e ≡ 1 (mod phi(n))"];
    D --> F{"公钥: (n, e)"};
    E --> G{"私钥: (n, d)"};
{% endmermaid %}

### 2.2 加密过程

假设发送方 Alice 想要向接收方 Bob 发送一条明文消息 `M`。

1.  **获取 Bob 的公钥**：Alice 获取 Bob 的公钥 `(n, e)`。
2.  **将明文转换为数字**：将明文消息 `M` 转换为一个整数，记作 `m`。这个整数必须满足 $0 \le m < n$。如果明文过长，需要分块处理。
3.  **计算密文 `C`**：Alice 使用 Bob 的公钥 `(n, e)` 对 `m` 进行加密：
    *   $C = m^e \pmod n$

**加密过程示意图：**

{% mermaid %}
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: 获取公钥 (n, e)
    Alice->>Alice: 明文 m (0 <= m < n)
    Alice->>Alice: 计算密文 C = m^e mod n
    Alice->>Bob: 发送密文 C
{% endmermaid %}

### 2.3 解密过程

当 Bob 收到 Alice 发送的密文 `C` 后，他可以使用自己的私钥解密以获取原始明文 `m`。

1.  **使用私钥解密**：Bob 使用自己的私钥 `(n, d)` 对密文 `C` 进行解密：
    *   $m = C^d \pmod n$

2.  **将数字转换回明文**：将整数 `m` 转换回原始明文消息 `M`。

**解密过程示意图：**

{% mermaid %}
sequenceDiagram
    participant Alice
    participant Bob
    Bob->>Bob: 收到密文 C
    Bob->>Bob: 使用私钥 (n, d)
    Bob->>Bob: 计算明文 m = C^d mod n
    Bob->>Bob: 将 m 转换回原始消息 M
    Bob->>Alice: (解密完成)
{% endmermaid %}

### 2.4 数学原理简述

RSA 算法的正确性依赖于欧拉定理的一个推论：
如果 `m` 是一个整数，`n` 是一个正整数，且 `m` 与 `n` 互质，那么：
$m^{\phi(n)} \equiv 1 \pmod n$

因为 $d \cdot e \equiv 1 \pmod{\phi(n)}$，所以存在一个整数 `k` 使得 $d \cdot e = k \cdot \phi(n) + 1$。
那么，解密过程可以表示为：
$C^d \pmod n = (m^e)^d \pmod n = m^{ed} \pmod n$
$m^{ed} \pmod n = m^{k \cdot \phi(n) + 1} \pmod n = (m^{\phi(n)})^k \cdot m^1 \pmod n$

如果 `m` 与 `n` 互质，根据欧拉定理，$(m^{\phi(n)})^k \equiv 1^k \equiv 1 \pmod n$。
所以，$m^{ed} \pmod n \equiv 1 \cdot m \pmod n \equiv m \pmod n$。

对于 `m` 与 `n` 不互质的情况，该定理的扩展形式也成立。这确保了加密后的密文可以通过私钥正确解密回原始明文。

## 三、数字签名

RSA 不仅可以用于数据加密，还可以用于**数字签名**，以提供消息的完整性和发送方的身份验证（不可否认性）。

### 3.1 签名过程

假设发送方 Alice 想要对消息 `M` 进行签名。

1.  **计算消息摘要**：Alice 首先使用一个哈希函数（如 SHA-256）计算消息 `M` 的摘要 `H(M)`。哈希摘要通常是一个固定长度的短字符串。
2.  **使用私钥签名**：Alice 使用自己的私钥 `(n, d)` 对哈希摘要 `H(M)` 进行“加密”，生成签名 `S`：
    *   $S = H(M)^d \pmod n$
3.  **发送**：Alice 将消息 `M` 和签名 `S` 一起发送给接收方 Bob。

**签名过程示意图：**

{% mermaid %}
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Alice: 消息 M
    Alice->>Alice: 计算 H(M) = SHA256(M)
    Alice->>Alice: 使用私钥 (n_Alice, d_Alice)
    Alice->>Alice: 计算签名 S = H(M)^d_Alice mod n_Alice
    Alice->>Bob: 发送 (M, S)
{% endmermaid %}

### 3.2 验证过程

当接收方 Bob 收到消息 `M` 和签名 `S` 后，他可以验证签名的有效性。

1.  **计算消息摘要**：Bob 对收到的消息 `M` 计算相同的哈希摘要 `H(M)`。
2.  **使用公钥验证签名**：Bob 使用发送方 Alice 的公钥 `(n, e)` 对收到的签名 `S` 进行“解密”（实际上是验证）：
    *   $H'(M) = S^e \pmod n$
3.  **比较摘要**：Bob 比较自己计算的哈希摘要 `H(M)` 和通过公钥解密签名得到的 `H'(M)`。
    *   如果 `H(M) = H'(M)`，则签名有效，表明消息未被篡改，且确实是由 Alice 签发的。
    *   如果两者不相等，则签名无效，表示消息可能被篡改，或者不是由 Alice 签发的。

**验证过程示意图：**

{% mermaid %}
sequenceDiagram
    participant Alice
    participant Bob
    Bob->>Bob: 收到 (M, S)
    Bob->>Bob: 计算 H(M) = SHA256(M)
    Bob->>Bob: 获取 Alice 的公钥 (n_Alice, e_Alice)
    Bob->>Bob: 计算 H'(M) = S^e_Alice mod n_Alice
    alt H(M) == H'(M)
        Bob->>Bob: 签名有效 (消息完整, 来源可信)
    else
        Bob->>Bob: 签名无效 (消息被篡改或来源可疑)
    end
{% endmermaid %}

## 四、安全性分析与最佳实践

RSA 的安全性完全依赖于大整数分解的困难性。

*   **密钥长度**：目前，2048 位或更长的 RSA 密钥被认为是安全的。随着计算能力的提升，推荐的密钥长度也会相应增加（例如，长期来看可能需要 3072 位或 4096 位）。
*   **素数选择**：选择的素数 `p` 和 `q` 必须是随机的、足够大且不能太接近。同时，`p-1` 和 `q-1` 应该包含大的素因子，以防止某些特定攻击。
*   **填充方案 (Padding Schemes)**：为了增强安全性，防止各种密码攻击（如选择密文攻击），RSA 在实际应用中**绝不直接加密明文**，而是使用填充方案（如 PKCS #1 v1.5 或更安全的 OAEP - Optimal Asymmetric Encryption Padding）。填充确保了相同的明文每次加密都会产生不同的密文，并增加了攻击者获取有用信息的难度。
*   **私钥安全**：私钥必须严格保密。一旦私钥泄露，加密消息可以被解密，数字签名可以被伪造。

## 五、RSA 的优缺点

### 5.1 优点

1.  **非对称性**：解决了对称加密中密钥分发的难题，公钥可以公开，方便地进行加密和验证。
2.  **提供多种安全服务**：既可以用于数据加密，也可以用于数字签名，实现机密性、完整性、身份认证和不可否认性。
3.  **广泛应用与标准化**：RSA 是最成熟和广泛使用的公钥算法之一，有大量的标准、库和工具支持。

### 5.2 缺点

1.  **计算开销大，速度慢**：相较于对称加密算法（如 AES），RSA 的加解密速度慢得多。因此，RSA 通常不直接用于加密大量数据，而是用于加密对称密钥（如会话密钥），然后用对称密钥加密实际数据。
2.  **明文长度限制**：RSA 加密的消息长度不能超过密钥长度减去填充的开销。
3.  **安全性依赖于密钥长度**：需要足够长的密钥才能抵抗量子计算机等未来潜在的攻击。

## 六、Go 语言实现示例

Go 语言的 `crypto/rsa` 包提供了强大的 RSA 功能，包括密钥生成、加解解密和签名验证。

```go
package main

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"log"
	"os"
)

// generateRSAKeyPair 生成 RSA 公钥和私钥对
// bits: 密钥长度，例如 2048
func generateRSAKeyPair(bits int) (*rsa.PrivateKey, *rsa.PublicKey, error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, bits)
	if err != nil {
		return nil, nil, fmt.Errorf("生成私钥失败: %w", err)
	}
	return privateKey, &privateKey.PublicKey, nil
}

// savePEMKey 保存 PEM 编码的密钥到文件
func savePEMKey(filename string, key interface{}, isPublic bool) error {
	var pemBlock *pem.Block
	var err error

	if isPublic {
		derBytes, err := x509.MarshalPKIXPublicKey(key.(*rsa.PublicKey))
		if err != nil {
			return fmt.Errorf("编码公钥失败: %w", err)
		}
		pemBlock = &pem.Block{
			Type:  "PUBLIC KEY",
			Bytes: derBytes,
		}
	} else {
		derBytes := x509.MarshalPKCS1PrivateKey(key.(*rsa.PrivateKey))
		pemBlock = &pem.Block{
			Type:  "RSA PRIVATE KEY",
			Bytes: derBytes,
		}
	}

	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("创建文件失败: %w", err)
	}
	defer file.Close()

	if err := pem.Encode(file, pemBlock); err != nil {
		return fmt.Errorf("写入 PEM 编码失败: %w", err)
	}
	fmt.Printf("密钥已保存到 %s\n", filename)
	return nil
}

// loadPrivateKey 从 PEM 文件加载私钥
func loadPrivateKey(filename string) (*rsa.PrivateKey, error) {
	pemData, err := os.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("读取私钥文件失败: %w", err)
	}

	block, _ := pem.Decode(pemData)
	if block == nil || block.Type != "RSA PRIVATE KEY" {
		return nil, fmt.Errorf("无法解码 PEM 私钥")
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("解析私钥失败: %w", err)
	}
	return privateKey, nil
}

// loadPublicKey 从 PEM 文件加载公钥
func loadPublicKey(filename string) (*rsa.PublicKey, error) {
	pemData, err := os.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("读取公钥文件失败: %w", err)
	}

	block, _ := pem.Decode(pemData)
	if block == nil || block.Type != "PUBLIC KEY" {
		return nil, fmt.Errorf("无法解码 PEM 公钥")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("解析公钥失败: %w", err)
	}
	publicKey, ok := pub.(*rsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("加载的不是 RSA 公钥")
	}
	return publicKey, nil
}


func main() {
	// 1. 生成 RSA 密钥对
	fmt.Println("--- 1. 生成 RSA 密钥对 (2048位) ---")
	privateKey, publicKey, err := generateRSAKeyPair(2048)
	if err != nil {
		log.Fatalf("生成密钥失败: %v", err)
	}
	fmt.Println("RSA 密钥对生成成功！")

	// 2. 保存密钥到文件 (可选，实际应用中通常这样处理)
	if err := savePEMKey("private_key.pem", privateKey, false); err != nil {
		log.Fatalf("保存私钥失败: %v", err)
	}
	if err := savePEMKey("public_key.pem", publicKey, true); err != nil {
		log.Fatalf("保存公钥失败: %v", err)
	}

	// 3. (可选) 从文件加载密钥，模拟不同方使用
	// privateKey, err = loadPrivateKey("private_key.pem")
	// if err != nil { log.Fatalf("加载私钥失败: %v", err) }
	// publicKey, err = loadPublicKey("public_key.pem")
	// if err != nil { log.Fatalf("加载公钥失败: %v", err) }


	// 4. RSA 加密
	fmt.Println("\n--- 4. RSA 加密 ---")
	originalMessage := []byte("这是一条需要加密的秘密消息，内容不宜过长！")
	
	// 使用 OAEP 填充方案进行加密，推荐使用 SHA256 作为哈希函数
	encryptedBytes, err := rsa.EncryptOAEP(sha256.New(), rand.Reader, publicKey, originalMessage, nil)
	if err != nil {
		log.Fatalf("加密失败: %v", err)
	}
	fmt.Printf("原始消息: %s\n", originalMessage)
	fmt.Printf("加密后的密文 (Hex): %x\n", encryptedBytes)

	// 5. RSA 解密
	fmt.Println("\n--- 5. RSA 解密 ---")
	decryptedBytes, err := rsa.DecryptOAEP(sha256.New(), rand.Reader, privateKey, encryptedBytes, nil)
	if err != nil {
		log.Fatalf("解密失败: %v", err)
	}
	fmt.Printf("解密后的消息: %s\n", decryptedBytes)
	if string(originalMessage) != string(decryptedBytes) {
		fmt.Println("⚠️ 原始消息与解密消息不匹配！")
	} else {
		fmt.Println("✅ 原始消息与解密消息匹配。")
	}

	// 6. RSA 数字签名
	fmt.Println("\n--- 6. RSA 数字签名 ---")
	dataToSign := []byte("这是需要签名的数据，用于验证完整性。")
	
	// 计算数据的哈希值
	hashed := sha256.Sum256(dataToSign)
	
	// 使用私钥进行签名 (PKCS1v15 填充)
	signature, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, hashed[:])
	if err != nil {
		log.Fatalf("签名失败: %v", err)
	}
	fmt.Printf("要签名的数据: %s\n", dataToSign)
	fmt.Printf("生成的签名 (Hex): %x\n", signature)

	// 7. 验证数字签名
	fmt.Println("\n--- 7. 验证数字签名 ---")
	// 验证方接收到 dataToSign 和 signature
	// 验证方同样计算 dataToSign 的哈希值
	hashedVer := sha256.Sum256(dataToSign)
	
	// 使用公钥验证签名
	err = rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, hashedVer[:], signature)
	if err != nil {
		log.Fatalf("签名验证失败: %v", err)
	}
	fmt.Println("✅ 签名验证成功！数据完整且来源可信。")

	// 尝试篡改数据后验证签名
	fmt.Println("\n--- 8. 尝试篡改数据后验证签名 ---")
	tamperedData := []byte("这是被篡改的数据！")
	hashedTampered := sha256.Sum256(tamperedData)
	err = rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, hashedTampered[:], signature)
	if err != nil {
		fmt.Printf("签名验证失败 (预期): %v\n", err)
		fmt.Println("✅ 签名验证失败是预期的，因为数据被篡改。")
	} else {
		fmt.Println("❌ 签名验证意外成功，说明签名机制存在问题。")
	}

	// 清理生成的密钥文件 (可选)
	// os.Remove("private_key.pem")
	// os.Remove("public_key.pem")
}
```

## 七、总结

RSA 算法作为公钥密码学的开创性成就，在现代网络安全体系中扮演着不可或缺的角色。它通过巧妙地利用大整数分解的数学难题，实现了密钥的分离，使得信息的机密性、完整性、真实性和不可否认性得以保障。尽管其计算效率不如对称加密算法，但其独特的非对称性使其成为数字通信安全（如 TLS/SSL 握手、电子邮件加密、代码签名）和身份验证的基石。在实际应用中，结合恰当的填充方案和足够长的密钥长度，RSA 依然是保障信息安全的首选非对称加密算法之一。
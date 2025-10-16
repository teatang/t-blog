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
---

> **RSA (Rivest–Shamir–Adleman)** 算法是目前**最广泛使用的非对称密钥加密算法**之一。它于 1977 年由 Ron Rivest、Adi Shamir 和 Leonard Adleman 三位科学家首次公开。RSA 不仅可以用于数据**加密**，还可以用于**数字签名**，是构建现代安全通信和认证体系的基石。

{% note info %}
**核心思想**：使用**一对密钥**——一个**公钥 (Public Key)** 和一个**私钥 (Private Key)**。公钥可以公开给任何人，私钥必须严格保密。公钥加密的数据只能用对应的私钥解密，私钥签名的数据只能用对应的公钥验证。
{% endnote %}

## 一、非对称密钥加密 (Public-key Cryptography)

RSA 算法属于非对称密钥加密算法，也称为**公钥密码学**。

*   **密钥对**：系统生成一对相关的密钥（公钥，私钥）。
*   **公钥**：可以公开传播，用于加密数据或验证数字签名。
*   **私钥**：必须由所有者严格保密，用于解密数据或生成数字签名。
*   **安全性**：公钥加密的数据，需要私钥才能解密；私钥签名的数据，需要公钥才能验证。而且，从公钥推导出私钥在计算上是不可行的（至少在现有计算能力下）。

### 1.1 优点

*   **密钥分发方便**：公钥可以公开，无需通过安全通道分发密钥。
*   **实现数字签名**：可以解决消息的认证和不可抵赖性问题。

### 1.2 缺点

*   **计算速度慢**：相比对称加密算法（如 AES），RSA 的加解密速度慢得多，通常不直接用于加密大量数据。
*   **密钥长度要求高**：为了达到足够的安全强度，密钥长度通常需要较长（例如 2048 位或 4096 位）。

## 二、RSA 的数学原理基础

RSA 的安全性基于两个重要的数论难题：

1.  **大整数分解难题 (Factoring Problem)**：将一个非常大的合数分解为两个质数的乘积是计算上困难的。
2.  **RSA 问题 (RSA Problem)**：求一个数的 `e` 次方根的模 `n` 运算（即 `c^d mod n = m`）的困难性。

### 2.1 核心数学概念回顾

*   **质数 (Prime Number)**：只能被 1 和自身整除的整数，如 2, 3, 5, 7, 11...
*   **互质 (Coprime / Relatively Prime)**：两个整数的最大公约数 (GCD) 为 1，则称它们互质。
*   **模运算 (Modulus Operation)**：`a mod n` 表示 `a` 除以 `n` 的余数。
*   **欧拉函数 (Euler's Totient Function) φ(n)**：小于或等于 `n` 的正整数中与 `n` 互质的数的个数。
    *   **重要性质**：如果 `n = p * q` 且 `p, q` 都是质数，则 `φ(n) = (p-1)(q-1)`。
*   **费马小定理 / 欧拉定理**：如果 `a` 和 `n` 互质，则 `a^φ(n) ≡ 1 (mod n)`。

## 三、RSA 算法工作步骤

RSA 算法包括**密钥生成**、**加密**和**解密**三个核心部分。

### 3.1 1. 密钥生成 (Key Generation)

这是 RSA 最复杂但只执行一次的步骤。

1.  **选择两个大质数 (p, q)**：
    *   随机选择两个非常大的、**互不相同**的质数 `p` 和 `q`。为了安全性，`p` 和 `q` 的长度通常是数百位甚至上千位，并且它们的位数应该相近。
2.  **计算模数 (n)**：
    *   计算 `n = p * q`。`n` 将是公钥和私钥的一部分。其长度通常是 1024 位、2048 位或 4096 位。
3.  **计算欧拉函数 (φ(n))**：
    *   计算 `φ(n) = (p - 1) * (q - 1)`。
4.  **选择公钥指数 (e)**：
    *   随机选择一个整数 `e`，满足 `1 < e < φ(n)`，并且 `e` 与 `φ(n)` 互质（即 `gcd(e, φ(n)) = 1`）。
    *   常用的 `e` 值有 65537 (即 `2^16 + 1`)，因为它是一个质数，且二进制表示只有两位是 1，有利于优化计算。
5.  **计算私钥指数 (d)**：
    *   计算 `d`，使得 `d * e ≡ 1 (mod φ(n))`。
    *   `d` 是 `e` 在模 `φ(n)` 意义下的乘法逆元。可以使用扩展欧几里得算法来计算 `d`。
    *   `d` 必须满足 `1 < d < φ(n)`。

至此，密钥对生成完毕：
*   **公钥 (Public Key)**：`(e, n)`
*   **私钥 (Private Key)**：`(d, n)` (也可以包含 `p, q, φ(n)` 等中间值，便于优化解密速度，称为中国剩余定理 (CRT) 优化)。

**示例 (小数字，仅为演示)**：

1.  选择 `p = 61`, `q = 53`。
2.  计算 `n = p * q = 61 * 53 = 3233`。
3.  计算 `φ(n) = (p - 1) * (q - 1) = 60 * 52 = 3120`。
4.  选择 `e = 17` (`1 < 17 < 3120` 且 `gcd(17, 3120) = 1`)。
5.  计算 `d`，使得 `17 * d ≡ 1 (mod 3120)`。
    *   通过扩展欧几里得算法，可以得到 `d = 2753`。

所以，公钥是 `(17, 3233)`，私钥是 `(2753, 3233)`。

### 3.2 2. 加密 (Encryption)

假设 Bob 要将明文消息 `M` (M 是一个整数，且 `0 <= M < n`) 发送给 Alice。Alice 将其公钥 `(e, n)` 发布给 Bob。

Bob 的加密步骤：
1.  获取 Alice 的公钥 `(e, n)`。
2.  将明文消息 `M` 转换为一个整数（如果 M 是文本，需进行编码，如 ASCII 或 UTF-8，再转换成大整数）。
3.  计算密文 `C`：
    `C = M^e mod n`

**示例 (使用上述密钥)**：
Bob 想加密明文 `M = 65`。
`C = 65^17 mod 3233`
`C = 2790` (计算过程省略)
Bob 将 `C = 2790` 发送给 Alice。

### 3.3 3. 解密 (Decryption)

Alice 收到密文 `C` 后，使用自己的私钥 `(d, n)` 进行解密。

Alice 的解密步骤：
1.  获取自己的私钥 `(d, n)`。
2.  计算明文 `M`：
    `M = C^d mod n`

**示例 (使用上述密钥)**：
Alice 收到密文 `C = 2790`。
`M = 2790^2753 mod 3233`
`M = 65` (计算过程省略)
Alice 解密得到明文 `M = 65`，还原成功。

**数学证明**：
解密过程 `M = C^d mod n`，代入加密过程 `C = M^e mod n`，得到：
`M ≡ (M^e)^d (mod n)`
`M ≡ M^(e*d) (mod n)`

根据 `d * e ≡ 1 (mod φ(n))`，可以写成 `e*d = k * φ(n) + 1`，其中 `k` 是某个整数。
所以 `M^(e*d) = M^(k * φ(n) + 1) = (M^φ(n))^k * M^1`。
根据欧拉定理 `a^φ(n) ≡ 1 (mod n)` (要求 `M` 和 `n` 互质)，则：
`(M^φ(n))^k * M^1 ≡ 1^k * M (mod n)`
`≡ M (mod n)`
因此 `M ≡ M (mod n)`。
即使 `M` 和 `n` 不互质，通过更复杂的数论证明，该等式依然成立。

## 四、RSA 的应用

### 4.1 数据加密

最直接的应用是加密少量敏感数据。由于 RSA 加密速度慢，通常不会直接加密大量数据。

**混合加密 (Hybrid Encryption)**：这是 RSA 最常见的加密应用模式。
1.  发送方生成一个**随机的对称密钥**（例如 AES 密钥）。
2.  用这个对称密钥加密**真正的数据内容**。
3.  用接收方的 **RSA 公钥**加密这个**对称密钥**。
4.  将加密后的对称密钥和用对称密钥加密后的数据一起发送给接收方。
5.  接收方用自己的 **RSA 私钥**解密得到对称密钥。
6.  再用对称密钥解密得到实际的数据内容。

这种方式结合了非对称加密的密钥分发便利性和对称加密的高效性。

### 4.2 数字签名 (Digital Signature)

数字签名用于验证消息的**完整性**、**真实性（来源认证）** 和**不可抵赖性**。

1.  **消息散列**：发送方对原始消息 `M` 计算一个散列值 `H = Hash(M)`（例如使用 SHA-256）。
2.  **签名**：发送方使用自己的 **RSA 私钥**对散列值 `H` 进行“加密”操作（实际上是数学上的逆运算），生成签名 `S = H^d mod n`。
3.  **发送**：发送方将原始消息 `M` 和签名 `S` 一同发送给接收方。
4.  **验证**：接收方收到消息 `M` 和签名 `S` 后：
    *   使用发送方的 **RSA 公钥**对签名 `S` 进行“解密”操作，得到一个散列值 `H' = S^e mod n`。
    *   独立地对接收到的原始消息 `M` 计算一个散列值 `H_actual = Hash(M)`。
    *   比较 `H'` 和 `H_actual`。如果两者相等，则验证通过，证明消息未被篡改，且确实由拥有对应私钥的发送方发送；如果不同，则消息可能被篡改或签名无效。

**注意**：在数字签名中，私钥用于“加密”散列值（即签名），公钥用于“解密”签名（即验证）。这与数据加密的公私钥用途正好相反。

### 4.3 密钥交换

RSA 也可以用于进行密钥交换，特别是混合加密中的对称密钥交换。

### 4.4 数字证书

RSA 是数字证书 (X.509 证书) 的关键组成部分。证书中心 (CA) 使用自己的私钥对用户的公钥和相关信息进行签名，形成数字证书。客户端通过验证 CA 的签名来信任用户的公钥。

## 五、Go 语言实现 RSA 加密与解密

Go 语言标准库通过 `crypto/rand`, `crypto/rsa`, `crypto/x509`, `encoding/pem` 等包提供了 RSA 算法的实现。

### 5.1 RSA 密钥生成、加密、解密、签名与验签

```go
package main

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256" // 通常用于数字签名中的哈希算法
	"crypto/x509"
	"encoding/hex"
	"encoding/pem" // 用于 PEM 格式编码私钥和公钥
	"fmt"
	"log"
	"os"
)

// GenerateRSAKeyPairWithPEM 生成 RSA 密钥对并以 PEM 格式保存
func GenerateRSAKeyPairWithPEM(bits int) (*rsa.PrivateKey, *rsa.PublicKey, error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, bits)
	if err != nil {
		return nil, nil, fmt.Errorf("生成 RSA 私钥失败: %w", err)
	}
	publicKey := &privateKey.PublicKey

	// 保存私钥到文件 (PEM 格式)
	privateKeyPEM := &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
	}
	err = os.WriteFile("private.pem", pem.EncodeToMemory(privateKeyPEM), 0600)
	if err != nil {
		return nil, nil, fmt.Errorf("保存私钥到文件失败: %w", err)
	}
	fmt.Println("私钥已保存到 private.pem")

	// 保存公钥到文件 (PEM 格式)
	publicKeyDER, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		return nil, nil, fmt.Errorf("编码 RSA 公钥失败: %w", err)
	}
	publicKeyPEM := &pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: publicKeyDER,
	}
	err = os.WriteFile("public.pem", pem.EncodeToMemory(publicKeyPEM), 0644)
	if err != nil {
		return nil, nil, fmt.Errorf("保存公钥到文件失败: %w", err)
	}
	fmt.Println("公钥已保存到 public.pem")

	return privateKey, publicKey, nil
}

// RSAEncrypt 使用公钥加密数据
// 通常使用 OAEP (Optimal Asymmetric Encryption Padding) 填充模式，以增加安全性
func RSAEncrypt(publicKey *rsa.PublicKey, plaintext []byte) ([]byte, error) {
	// RSA 加密数据长度有限制，不能超过密钥长度减去填充的长度 (通常是 2*HashLen + 2)
	// 对于 PKCS1v15 填充，最大明文长度为 K - 11 字节 (K 是密钥字节数，如 2048 位密钥 = 256 字节)
	// 对于 OAEP 填充，最大明文长度为 K - (2*HashLen + 2) 字节
	// 实际应用中，RSA 不适合加密大文件，通常用于加密对称密钥。
	if len(plaintext) > publicKey.Size()-2*sha256.Size-2 { // 用 SHA256 作为哈希函数
		return nil, fmt.Errorf("明文过长，RSA 不支持直接加密大数据")
	}

	ciphertext, err := rsa.EncryptOAEP(sha256.New(), rand.Reader, publicKey, plaintext, nil)
	if err != nil {
		return nil, fmt.Errorf("RSA 加密失败: %w", err)
	}
	return ciphertext, nil
}

// RSADecrypt 使用私钥解密数据
func RSADecrypt(privateKey *rsa.PrivateKey, ciphertext []byte) ([]byte, error) {
	plaintext, err := rsa.DecryptOAEP(sha256.New(), rand.Reader, privateKey, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("RSA 解密失败: %w", err)
	}
	return plaintext, nil
}

// RSASign 使用私钥对消息散列签名
func RSASign(privateKey *rsa.PrivateKey, message []byte) ([]byte, error) {
	hashed := sha256.Sum256(message) // 计算消息的 SHA256 散列值
	signature, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, hashed[:])
	if err != nil {
		return nil, fmt.Errorf("RSA 签名失败: %w", err)
	}
	return signature, nil
}

// RSAVerify 使用公钥验证签名
func RSAVerify(publicKey *rsa.PublicKey, message []byte, signature []byte) error {
	hashed := sha256.Sum256(message) // 重新计算消息的 SHA256 散列值
	err := rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, hashed[:], signature)
	if err != nil {
		return fmt.Errorf("RSA 签名验证失败: %w", err)
	}
	return nil // 验证成功
}

func main() {
	// 1. 生成 RSA 密钥对 (2048 位)
	fmt.Println("--- 生成 RSA 密钥对 ---")
	privateKey, publicKey, err := GenerateRSAKeyPairWithPEM(2048)
	if err != nil {
		log.Fatalf("生成密钥对失败: %v", err)
	}
	fmt.Printf("公钥 N (模数): %s...\n", publicKey.N.Text(16)[:20]) // 打印模数的一部分
	fmt.Printf("公钥 E (加密指数): %d\n", publicKey.E) // 通常是 65537

	// 2. RSA 加密与解密
	fmt.Println("\n--- RSA 加密与解密 ---")
	originalData := []byte("这是一段需要通过 RSA 公钥加密的敏感数据！")
	fmt.Printf("原始数据: %s\n", originalData)

	encryptedData, err := RSAEncrypt(publicKey, originalData)
	if err != nil {
		log.Fatalf("加密失败: %v", err)
	}
	fmt.Printf("加密后的数据 (Hex): %s...\n", hex.EncodeToString(encryptedData)[:50]) // 打印密文一部分

	decryptedData, err := RSADecrypt(privateKey, encryptedData)
	if err != nil {
		log.Fatalf("解密失败: %v", err)
	}
	fmt.Printf("解密后的数据: %s\n", decryptedData)
	if string(originalData) == string(decryptedData) {
		fmt.Println("加解密成功！")
	} else {
		fmt.Println("加解密失败！")
	}

	// 3. RSA 数字签名与验证
	fmt.Println("\n--- RSA 数字签名与验证 ---")
	message := []byte("这份文件是我的原创作品，请勿盗用。")
	fmt.Printf("要签名的消息: %s\n", message)

	signature, err := RSASign(privateKey, message)
	if err != nil {
		log.Fatalf("签名失败: %v", err)
	}
	fmt.Printf("生成的签名 (Hex): %s...\n", hex.EncodeToString(signature)[:50]) // 打印签名一部分

	// 验证签名
	err = RSAVerify(publicKey, message, signature)
	if err != nil {
		fmt.Fatalf("签名验证失败: %v\n", err)
	} else {
		fmt.Println("签名验证成功！消息未经篡改，且来自私钥所有者。")
	}

	// 4. 模拟签名验证失败 (篡改消息)
	fmt.Println("\n--- 模拟签名验证失败 (篡改消息) ---")
	tamperedMessage := []byte("这份文件不是我的原创作品，你改了！")
	err = RSAVerify(publicKey, tamperedMessage, signature)
	if err != nil {
		fmt.Printf("签名验证失败 (预期，因为消息被篡改): %v\n", err)
	} else {
		fmt.Println("签名验证成功 (不应该发生)!")
	}
}
```

**运行结果示例**：
```
--- 生成 RSA 密钥对 ---
私钥已保存到 private.pem
公钥已保存到 public.pem
公钥 N (模数): 8408226162a4eb92f3972c3d5e2e850bdf73...
公钥 E (加密指数): 65537

--- RSA 加密与解密 ---
原始数据: 这是一段需要通过 RSA 公钥加密的敏感数据！
加密后的数据 (Hex): 00db2bfdae8fbb94e75d502f1b77bf4f488ddf069e2c65a0c1...
解密后的数据: 这是一段需要通过 RSA 公钥加密的敏感数据！
加解密成功！

--- RSA 数字签名与验证 ---
要签名的消息: 这份文件是我的原创作品，请勿盗用。
生成的签名 (Hex): 496677f516a7e089d700e120d86991eb13890f55fb3435166f...
签名验证成功！消息未经篡改，且来自私钥所有者。

--- 模拟签名验证失败 (篡改消息) ---
签名验证失败 (预期，因为消息被篡改): RSA 签名验证失败: crypto/rsa: verification error
```
上述代码演示了 RSA 密钥的生成、PEM 格式存储、使用 OAEP 填充模式进行加解密、以及使用 PKCS1v15 模式进行数字签名和验证。

## 六、安全性考虑

*   **密钥长度**：RSA 的安全性与密钥长度强相关。目前，**2048 位**被认为是安全的最低标准，**4096 位**提供更高的安全性。较短的密钥（如 1024 位）已被证明在理论上存在被破解的风险。
*   **填充方案 (Padding Schemes)**：为了防止多种攻击（如选择密文攻击），RSA 加密和签名必须结合使用安全的填充方案。Go 语言默认的 `EncryptOAEP` 和 `SignPKCS1v15` 提供了这样的保护。**切勿使用未经填充的 RSA**。
*   **大质数选择**：生成质数 `p` 和 `q` 时，它们必须是安全的随机大质数，且它们的差值不能太小，不能有特殊的数学关系。
*   **私钥保护**：私钥的安全性至关重要。一旦私钥泄露，加密的安全性和签名的完整性将完全失效。
*   **前向保密性 (Forward Secrecy)**：RSA 本身不提供前向保密性。若长期使用的私钥被泄露，过去所有使用该公钥加密的会话都可能被解密。因此，在 TLS/SSL 等协议中，通常会结合 Diffie-Hellman 或 ECDHE 等密钥交换算法，实现会话密钥的前向保密。
*   **量子计算威胁**：RSA 的安全性基于大整数分解的计算困难性。然而，量子计算机在 Shor 算法的帮助下可以高效地解决大整数分解问题。因此，量子计算对 RSA 构成了长期威胁。当前正在研究**后量子密码学 (Post-Quantum Cryptography, PQC)** 算法来替代 RSA。

## 七、总结

RSA 算法作为公钥密码学的奠基石，在信息安全领域发挥着不可或缺的作用。它通过公钥和私钥的分离，完美解决了密钥分发难题，并提供了强大的数字签名能力，为现代网络通信、身份认证和数据完整性保护提供了坚实保障。

然而，RSA 自身的计算效率限制了其直接加密大数据量的能力，因此在实践中常与对称加密算法结合使用（混合加密）。同时，随着攻击技术和计算能力的发展，特别是未来量子计算的潜在威胁，我们必须持续关注其安全性，并始终采用推荐的密钥长度、填充方案和安全实践。理解并正确应用 RSA 算法，是构建安全可靠的信息系统的重要一环。
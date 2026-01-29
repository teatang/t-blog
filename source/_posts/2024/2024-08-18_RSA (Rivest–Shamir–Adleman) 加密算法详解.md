---
title: RSA (Rivest–Shamir–Adleman) 加密算法详解
date: 2024-08-18 06:24:00
tags:
  - 2024
  - 加密算法
  - 计算机网络
categories:
  - 计算机网络
  - 加密算法
mathjax: true
---

> **RSA (Rivest-Shamir-Adleman)** 是一种基于**大素数分解困难性**的**公钥加密算法 (Public-Key Cryptosystem)**。它于 1977 年由 Ron Rivest、Adi Shamir 和 Leonard Adleman 三位科学家首次提出，并以他们姓氏的首字母命名。RSA 广泛应用于数据加密、数字签名和密钥交换等领域，是目前应用最广泛的非对称加密算法之一。

{% note info %}
核心思想：利用数学单向函数（大整数分解在计算上是困难的），生成一对关联的**公钥 (Public Key)** 和**私钥 (Private Key)**。公钥公开用于加密，私钥保密用于解密。
{% endnote %}
------

## 一、为什么需要公钥密码学？

在传统的对称加密中（如 AES、DES），通信双方必须共享同一个秘密密钥。这会带来密钥分发难题：如何在不安全的信道上安全地将密钥传递给对方？

公钥密码学（也称为非对称加密）解决了这个问题：

*   **密钥对**：每个用户拥有一个公钥和一个私钥。
*   **公钥公开**：公钥可以安全地发布给任何人。
*   **私钥保密**：私钥必须严格保密，只有所有者知道。
*   **加密**：发送方使用接收方的公钥加密消息。
*   **解密**：接收方使用自己的私钥解密消息。

即使窃听者截获了发送方的加密消息和接收方的公钥，如果没有对应的私钥，也无法解密消息。RSA 正是这种机制的典型实现。

## 二、数学基础

RSA 算法的安全性依赖于数论中的几个重要概念，特别是**大整数分解的计算复杂性**。

### 2.1 欧拉函数 (Euler's Totient Function) $\phi(n)$

*   **定义**：对于一个正整数 $n$，$\phi(n)$ 表示小于或等于 $n$ 的正整数中与 $n$ 互质的数的个数。
*   **计算**：
    *   如果 $n$ 是素数，那么 $\phi(n) = n - 1$.
    *   如果 $n = p \cdot q$，其中 $p$ 和 $q$ 是两个不同的素数，那么 $\phi(n) = (p - 1)(q - 1)$.
    *   这是 RSA 算法中最重要的性质，因为 RSA 的模数 $n$ 就是两个大素数的乘积。

### 2.2 模运算 (Modular Arithmetic)

*   RSA 中的所有计算都在模 $n$ 意义下进行。`a mod n` 表示 `a` 除以 `n` 的余数。

### 2.3 互质 (Coprime / Relatively Prime)

*   如果两个整数的最大公约数 (GCD) 为 1，则称它们互质。即 $\gcd(a, b) = 1$。

### 2.4 模反元素 (Modular Multiplicative Inverse)

*   对于整数 $a$ 和 $m$，如果存在一个整数 $x$，使得 $a \cdot x \equiv 1 \pmod{m}$，那么 $x$ 称为 $a$ 在模 $m$ 意义下的模反元素。
*   模反元素 $x$ 存在的充要条件是 $a$ 和 $m$ 互质 ($\gcd(a, m) = 1$)。
*   模反元素可以通过**扩展欧几里得算法 (Extended Euclidean Algorithm)** 计算得到。

### 2.5 欧拉定理 (Euler's Totient Theorem)

*   如果 $a$ 和 $n$ 是互质的正整数，那么 $a^{\phi(n)} \equiv 1 \pmod{n}$。
*   这是 RSA 算法正确性的数学依据。

## 三、RSA 算法步骤

RSA 算法包含三个主要阶段：密钥生成、加密和解密。

### 3.1 密钥生成 (Key Generation)

1.  **选择两个大素数 ($p, q$)**：
    *   随机选择两个非常大且不同的素数 $p$ 和 $q$。它们的长度通常相同（例如 1024 位或 2048 位）。
    *   安全起见，$p$ 和 $q$ 必须是秘密的，且它们之间的差值应该足够大，以防止某些攻击。
2.  **计算模数 ($n$)**：
    *   $n = p \cdot q$。
    *   $n$ 是公钥和私钥的一部分，它将是公开的。
3.  **计算欧拉函数 ($\phi(n)$)**：
    *   $\phi(n) = (p - 1)(q - 1)$。
    *   $\phi(n)$ 必须严格保密。
4.  **选择公钥指数 ($e$)**：
    *   选择一个整数 $e$，满足 $1 < e < \phi(n)$，且 $e$ 与 $\phi(n)$ 互质 (即 $\gcd(e, \phi(n)) = 1$)。
    *   常用的 $e$ 值有 $3$, $17$, $65537$ ($2^{16}+1$) 等。选择小的质数作为 $e$ 可以加速加密过程。
5.  **计算私钥指数 ($d$)**：
    *   计算 $d$，使得 $d \cdot e \equiv 1 \pmod{\phi(n)}$。
    *   这表示 $d$ 是 $e$ 在模 $\phi(n)$ 意义下的模反元素。可以使用扩展欧几里得算法计算 $d$。
    *   $d$ 必须严格保密。
6.  **形成密钥对**：
    *   **公钥 (Public Key)**：$(e, n)$。公开给所有人。
    *   **私钥 (Private Key)**：$(d, n)$。严格保密。

**密钥生成流程图：**

{% mermaid %}
graph TD
    A[选择两个大素数 p 和 q] --> B{计算模数 n = p * q};
    B --> C{"计算欧拉函数 φ(n) = (p-1)(q-1)"};
    C --> D{选择公钥指数 e};
    D -- 满足 1 < e < φ(n) 且 gcd(e, φ(n)) = 1 --> E{计算私钥指数 d};
    E -- 满足 d * e ≡ 1 (mod φ(n)) --> F["公钥: (e, n) & 私钥: (d, n)"];
{% endmermaid %}

### 3.2 加密 (Encryption)

假设 Alice 想要向 Bob 发送消息 $M$。

1.  Bob 将他的公钥 $(e, n)$ 发送给 Alice。
2.  Alice 将原始消息 $M$ 转换为一个整数（通常小于 $n$）。如果消息太长，需要分成多个块进行加密。
3.  Alice 使用 Bob 的公钥 $(e, n)$ 计算密文 $C$：
    $$C = M^e \pmod{n}$$
4.  Alice 将密文 $C$ 发送给 Bob。

### 3.3 解密 (Decryption)

Bob 收到密文 $C$ 后，使用自己的私钥 $(d, n)$ 解密消息。

1.  Bob 使用他的私钥 $(d, n)$ 计算原始消息 $M$：
    $$M = C^d \pmod{n}$$
2.  Bob 将得到的整数 $M$ 转换回原始消息格式。

**加密/解密流程图：**

{% mermaid %}
graph TD
    subgraph A["Alice (发送方)"]
        A1[原始消息 M] --> A2{"使用 Bob 的公钥 (e, n) 加密"};
        A2 -- C = M^e mod n --> A3[密文 C];
    end

    subgraph B["Bob (接收方)"]
        B1[密文 C] --> B2{"使用自己的私钥 (d, n) 解密"};
        B2 -- M = C^d mod n --> B3[解密后的消息 M];
    end

    A3 --> B1;
{% endmermaid %}

### 3.4 数字签名 (Digital Signatures)

RSA 还可以用于创建数字签名，以提供消息的完整性和发送者的身份认证。

1.  **签名**：发送方使用自己的私钥 $(d, n)$ 对消息的哈希值 $H(M)$ 进行签名：
    $$S = H(M)^d \pmod{n}$$
    发送方将消息 $M$ 和签名 $S$ 一起发送。
2.  **验证**：接收方收到消息 $M$ 和签名 $S$ 后，使用发送方的公钥 $(e, n)$ 进行验证：
    *   计算消息 $M$ 的哈希值 $H'(M)$。
    *   使用发送方的公钥解密签名 $S$：$H_{verified} = S^e \pmod{n}$。
    *   比较 $H'(M)$ 和 $H_{verified}$。如果两者相同，则签名有效，消息未被篡改，且确实是由拥有该私钥的人发送的。

## 四、RSA 算法示例 (简化)

为了理解原理，我们使用小整数来演示。在实际应用中，会使用非常大的素数。

1.  **选择素数**：
    *   $p = 3$
    *   $q = 11$ (注意，实际中 $p, q$ 都是非常大的随机素数，且足够大)

2.  **计算 $n$ 和 $\phi(n)$**：
    *   $n = p \cdot q = 3 \cdot 11 = 33$
    *   $\phi(n) = (p - 1)(q - 1) = (3 - 1)(11 - 1) = 2 \cdot 10 = 20$

3.  **选择公钥指数 $e$**：
    *   选择 $e$，满足 $1 < e < 20$ 且 $\gcd(e, 20) = 1$。
    *   我们可以选择 $e = 7$ (因为 $\gcd(7, 20) = 1$)。
    *   公钥：$(e, n) = (7, 33)$

4.  **计算私钥指数 $d$**：
    *   找到 $d$，使得 $d \cdot e \equiv 1 \pmod{\phi(n)}$，即 $d \cdot 7 \equiv 1 \pmod{20}$。
    *   我们可以通过试探或扩展欧几里得算法找到 $d$。
        *   $7 \cdot 1 = 7 \pmod{20}$
        *   $7 \cdot 2 = 14 \pmod{20}$
        *   $7 \cdot 3 = 21 \equiv 1 \pmod{20}$
    *   所以，$d = 3$。
    *   私钥：$(d, n) = (3, 33)$

**现在，进行加密和解密：**

*   假设原始消息 $M = 5$ (通常消息是大的整数，小于 $n$)。

1.  **加密**：使用公钥 $(7, 33)$
    *   $C = M^e \pmod{n} = 5^7 \pmod{33}$
    *   $5^7 = 78125$
    *   $78125 \pmod{33} = 14$
    *   密文 $C = 14$

2.  **解密**：使用私钥 $(3, 33)$
    *   $M = C^d \pmod{n} = 14^3 \pmod{33}$
    *   $14^3 = 2744$
    *   $2744 \pmod{33} = 5$
    *   解密得到消息 $M = 5$

原始消息成功恢复！

## 五、安全性分析与攻击

RSA 算法的安全性主要依赖于以下三个假设：

1.  **大整数分解问题 (Factoring Integer Problem, FIP)**：
    *   给定一个大合数 $n$，很难将其分解为两个素数因子 $p$ 和 $q$。
    *   如果攻击者能够高效地分解 $n$ 得到 $p$ 和 $q$，那么他就可以计算出 $\phi(n)$，进而计算出私钥 $d$，从而破解 RSA。
    *   目前还没有已知的算法能够多项式时间内分解大整数。
2.  **RSA 问题 (RSA Problem)**：
    *   在不知道私钥指数 $d$ 的情况下，仅仅通过公钥 $(e, n)$ 和密文 $C$，很难计算出 $M = C^d \pmod{n}$。
3.  **欧拉函数问题 (Phi Function Problem)**：
    *   在不知道 $p$ 和 $q$ 的情况下，很难从 $n$ 计算出 $\phi(n)$。

### 5.1 攻击类型

1.  **暴力分解攻击**：
    *   通过尝试所有可能的因子来分解 $n$。对于足够大的 $n$（如 2048 位或 3072 位），计算量巨大，在当前技术下不可行。
2.  **模数 $n$ 过小**：
    *   如果 $n$ 太小，则容易被分解。因此，建议使用足够长的密钥长度（目前 2048 位是最低推荐，3072 位更安全）。
3.  **共同模数攻击**：
    *   如果多方共享同一个模数 $n$，但使用不同的公钥指数 $e_i$，攻击者可能利用中国剩余定理和低指数攻击来恢复消息。
4.  **低加密指数攻击 (Low Public Exponent Attack)**：
    *   如果公钥指数 $e$ 非常小（例如 $e=3$），并且消息 $M$ 也很小，使得 $M^e < n$，那么 $C = M^e \pmod{n} = M^e$。攻击者可以直接取 $e$ 次方根来获取 $M$。
    *   这种情况通过**填充方案 (Padding Schemes)** 来解决。
5.  **计时攻击 (Timing Attacks)**：
    *   通过测量解密或签名操作所需的时间差异，攻击者可能推断出私钥 $d$ 的信息。
    *   现代 RSA 实现会采取对策来抵御此类攻击。
6.  **中间人攻击 (Man-in-the-Middle Attack)**：
    *   RSA 本身不提供身份认证。如果攻击者能够篡改公钥，将自己的公钥假冒成合法用户的公钥发给发送方，那么他就可以截获加密消息。
    *   这需要结合**公钥基础设施 (PKI)** 和**数字证书**来解决。

## 六、实际应用与最佳实践

### 6.1 混合加密 (Hybrid Encryption)

*   RSA 算法由于涉及大量的模幂运算，计算速度相对较慢，不适合直接加密大容量数据。
*   在实际应用中，RSA 通常用于**混合加密**：
    1.  用 RSA (非对称加密) 来加密一个对称密钥（一次性会话密钥）。
    2.  用这个对称密钥（例如 AES 密钥）来加密实际的大容量数据。
    *   这种方法结合了对称加密的高效率和非对称加密的安全密钥分发优势。

### 6.2 填充方案 (Padding Schemes)

*   为了增强 RSA 的安全性，防止上述的低加密指数攻击、选择密文攻击等，必须在加密消息 $M$ 之前对其进行**填充 (Padding)** 到与模数 $n$ 长度一致。
*   常用的填充方案有：
    *   **PKCS#1 v1.5**：一种历史悠久但存在已知漏洞的填充方案。尽管在特定条件下是安全的，但在新应用中不推荐使用。
    *   **OAEP (Optimal Asymmetric Encryption Padding)**：更现代、更安全的填充方案 (在 PKCS#1 v2.0 及更高版本中定义)。它提供了概率加密和选择密文攻击的语义安全。
*   **注意**：在不使用填充的情况下直接对原始消息进行 RSA 加密是极其不安全的。

### 6.3 密钥长度 (Key Length)

*   RSA 密钥的强度直接取决于 $p$ 和 $q$ 的长度（以及它们的乘积 $n$ 的长度）。
*   当前推荐的最小密钥长度是 2048 位 (bits)，3072 位或 4096 位则提供更高的安全性。随着计算能力的提升，推荐的密钥长度也会相应增加。

### 6.4 随机数生成器 (Random Number Generation)

*   选择高质量的随机数源来生成素数 $p$ 和 $q$ 以及私钥指数 $a, b$ 至关重要。如果随机数生成器存在偏倚或可预测，攻击者可以利用此漏洞。

### 6.5 应用场景

*   **TLS/SSL 握手**：协商对称会话密钥。
*   **数字证书**：用于验证身份，证书管理机构 (CA) 使用 RSA 签名用户的公钥。
*   **数字签名**：确保文件、软件更新包等的完整性和真实性。
*   **安全电子邮件 (PGP/GPG)**：用于加密邮件内容和签名。

## 七、代码示例 (Python)

使用 Python 的 `cryptography` 库演示 RSA 密钥生成、加密和解密。

```python
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend

# 1. 密钥生成
def generate_rsa_keys():
    # 生成私钥，默认生成匹配公钥
    # bitsize 为密钥长度，通常使用 2048 或 3072
    # public_exponent 建议使用 65537 (F4)，高效且安全
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    public_key = private_key.public_key()
    return private_key, public_key

# 2. RSA 加密
def encrypt_message(public_key, message):
    # RSA 加密需要填充 (padding) 来增强安全性
    # padding.OAEP(Optimal Asymmetric Encryption Padding) 是目前推荐的填充方式
    # mgf (Mask Generation Function) 通常使用 hashes.SHA256
    # algorithm 通常使用 hashes.SHA256
    ciphertext = public_key.encrypt(
        message,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return ciphertext

# 3. RSA 解密
def decrypt_message(private_key, ciphertext):
    plaintext = private_key.decrypt(
        ciphertext,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return plaintext

# 4. RSA 数字签名
def sign_message(private_key, message):
    # 签名需要对消息的哈希值进行
    # padding.PSS (Probabilistic Signature Scheme) 是更安全的签名填充方式，推荐用于新应用
    signature = private_key.sign(
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    return signature

# 5. 验证数字签名
def verify_signature(public_key, message, signature):
    try:
        public_key.verify(
            signature,
            message,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except Exception as e:
        print(f"Signature verification failed: {e}")
        return False

# --- 主程序 ---
if __name__ == "__main__":
    # 生成密钥对
    private_key, public_key = generate_rsa_keys()
    print("RSA 密钥对生成成功！")

    # 待加密的原始消息 (必须是字节串)
    original_message = b"This is a secret message for RSA encryption."
    print(f"\n原始消息: {original_message.decode()}")

    # 加密消息
    encrypted_msg = encrypt_message(public_key, original_message)
    print(f"加密后的密文 (部分): {encrypted_msg[:30]}...") # 打印部分密文，因为它很长

    # 解密消息
    decrypted_msg = decrypt_message(private_key, encrypted_msg)
    print(f"解密后的消息: {decrypted_msg.decode()}")

    assert original_message == decrypted_msg
    print("加密和解密成功！")

    # 数字签名
    signature = sign_message(private_key, original_message)
    print(f"\n生成签名 (部分): {signature[:30]}...")

    # 验证签名
    is_valid = verify_signature(public_key, original_message, signature)
    print(f"签名验证结果: {'有效' if is_valid else '无效'}")

    # 模拟篡改消息
    tampered_message = b"This is a tampered message."
    is_valid_tampered = verify_signature(public_key, tampered_message, signature)
    print(f"篡改后消息的签名验证结果: {'有效' if is_valid_tampered else '无效'}")
    assert not is_valid_tampered
```

## 八、总结

RSA 算法是公钥密码学的基石之一，通过巧妙地利用大整数分解难题，实现了在不安全信道上的安全密钥交换、数据加密和数字签名。它的核心在于一对数学上关联的公钥和私钥：公钥用于加密，私钥用于解密；私钥用于签名，公钥用于验签。

尽管 RSA 在加密和解密速度上不及对称加密算法，但其独特的非对称特性解决了密钥分发的难题，并在混合加密、数字证书和身份认证等领域发挥着不可替代的作用。然而，为了确保其安全性，必须严格遵循最佳实践，包括使用足够的密钥长度、采用安全的填充方案，并结合公钥基础设施来抵御中间人攻击。理解 RSA 的数学原理和安全考量，是掌握现代密码学和网络安全的基础。
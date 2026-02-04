---
title: Signal Protocol 详解
date: 2026-02-04 06:24:00
tags:
  - 2026
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---

> **Signal Protocol**（前身为 TextSecure Protocol）是一个**现代的、开源的、密码学加强的端到端加密 (End-to-End Encryption, E2EE) 协议**，旨在为异步和同步即时通讯应用提供消息的机密性、完整性、认证性和不可抵赖性。它由 Open Whisper Systems（现为 Signal Foundation 和 Signal Messenger LLC）开发，最初用于 Signal 应用，现已被WhatsApp、Facebook Messenger（在“秘密对话”模式下）、Google Messages（在 RCS 聊天中）等主流通讯应用广泛采用，成为业界公认的E2EE黄金标准之一。

{% note info %}
核心思想：Signal Protocol 通过巧妙结合**双棘轮算法 (Double Ratchet Algorithm)**、**预密钥 (Pre-keys)** 和 **扩展的 Diffie-Hellman 密钥交换 (X3DH)**，实现了**前向保密性 (Forward Secrecy)** 和 **未来保密性/后向保密性 (Future Secrecy/Post-Compromise Security)**，确保即使长期密钥或一部分会话密钥被泄露，过去和未来的消息仍能保持安全。
{% endnote %}
------

## 一、为什么需要 Signal Protocol？

在数字通讯日益普及的今天，用户隐私面临着多重威胁：

*   **数据窃听**：消息在传输过程中可能被第三方截获和阅读。
*   **服务器入侵**：即使通讯服务商的服务器被攻破，存储在其中的消息也可能被窃取。
*   **政府或恶意实体监控**：通过各种手段强制服务商提供用户数据。
*   **中间人攻击 (Man-in-the-Middle Attacks)**：攻击者截获并篡改通信双方的消息。

**端到端加密 (E2EE)** 是解决这些问题的核心技术。E2EE 确保消息从发送方设备发出时即加密，只有接收方设备才能解密。在整个传输路径中，包括服务器在内，任何第三方都无法读取消息内容。

Signal Protocol 正是为了提供一个强大、高效且经过验证的 E2EE 解决方案而设计的。

## 二、Signal Protocol 的核心概念与密码学基础

Signal Protocol 的安全基石在于其对以下密码学原语和概念的巧妙运用：

1.  **非对称加密 (Asymmetric Encryption)**：使用一对公钥和私钥。公钥用于加密，私钥用于解密。Signal Protocol 使用 **椭圆曲线 Diffie-Hellman (ECDH)** 密钥交换来建立共享的秘密。
    *   **ECDH**：允许通信双方通过不安全的公开信道协商出一个共享的秘密密钥，而无需提前共享任何秘密。
2.  **对称加密 (Symmetric Encryption)**：使用相同的密钥进行加密和解密。Signal Protocol 使用对称密钥（如 AES256）来加密实际的消息内容，因为对称加密比非对称加密效率更高。
3.  **密钥派生函数 (Key Derivation Function, KDF)**：从一个或多个秘密值生成新的、高质量的加密密钥的函数。在 Signal Protocol 中用于从 ECDH 协商的共享秘密中派生出多个不同的会话密钥。
4.  **前向保密性 (Forward Secrecy, FS)**：即使一个长期私钥被泄露，过去加密的会话内容仍然保持安全。这是通过确保每个会话的密钥都是临时的、独立的且尽快销毁来实现的。
5.  **未来保密性 / 后向保密性 (Future Secrecy / Post-Compromise Security, PCS)**：即使当前会话密钥被泄露，未来的会话内容仍然保持安全。这是通过每次消息交换都更新会话密钥，且不依赖于过去的任何泄露密钥来实现的。

## 三、Signal Protocol 的关键机制

Signal Protocol 的核心是 **扩展的 Diffie-Hellman (X3DH) 密钥交换** 和 **双棘轮算法 (Double Ratchet Algorithm)**。

### 3.1 扩展的 Diffie-Hellman (X3DH) 密钥交换协议

X3DH 协议用于在两个用户首次建立通信时，以异步方式（例如，一个用户不在线）协商一个共享的根密钥 (`SK`)。它通过结合静态密钥和临时密钥来实现：

*   **身份密钥对 (Identity Key Pair, IK)**：长期的、签名过的密钥对。每个用户拥有一对，用于身份识别和签名。
*   **签名预密钥对 (Signed Pre-key Pair, SPK)**：中期的、由身份私钥签名的密钥对。用户生成几对，并将其公钥连同签名上传到服务器。
*   **一次性预密钥对 (One-Time Pre-key Pair, OPK)**：短期的、未使用签名的密钥对。用户生成大量，并将其公钥上传到服务器。一旦使用就被销毁。

**交换流程概述**：

1.  **预发布**：Alice 将她自己的一些（SPK, OPK）公钥上传到服务器。Bob 也做同样的事情。
2.  **初始联系**：当 Alice 想要向 Bob 发送消息时，她从服务器请求 Bob 的公钥包 (Key Bundle)，其中包含：
    *   Bob 的身份公钥 (IK_Bob)
    *   Bob 的签名预密钥公钥 (SPK_Bob)
    *   Bob 的签名预密钥签名 (Signature of SPK_Bob by IK_Bob)
    *   Bob 的一个一次性预密钥公钥 (OPK_Bob)。如果 Bob 没有可用的一次性预密钥，就使用没有 OPK 的 Key Bundle。
3.  **协商共享秘密**：Alice 使用自己的私钥和从服务器获取的 Bob 的公钥，进行四次 ECDH 密钥协商，计算出四个共享秘密：
    *   DH(IK_Alice, IK_Bob)
    *   DH(EK_Alice, IK_Bob)  (EK_Alice 是 Alice 生成的临时 Ephemeral Key Pair)
    *   DH(IK_Alice, SPK_Bob)
    *   DH(EK_Alice, SPK_Bob)
    *   如果 Bob 有 OPK_Bob，则再计算 DH(IK_Alice, OPK_Bob) 或 DH(EK_Alice, OPK_Bob)
    这些共享秘密通过密钥派生函数 (KDF) 组合在一起，生成一个初始的**根密钥 (Root Key, RK)** 和**链密钥 (Chain Key, CK)**。
4.  **销毁 OPK**：一旦 OPK_Bob 被 Alice 使用，服务器就会将其从 Key Bundle 中删除。
5.  **首次消息发送**：Alice 使用这个根密钥和链密钥，通过双棘轮算法开始加密第一条消息并发送给 Bob。消息中包含 Alice 的 Ephemeral Public Key (EK_Alice)。

X3DH 协议确保了即使 Bob 不在线，Alice 也能安全地开始与 Bob 的加密通信，并提供了身份认证。

### 3.2 双棘轮算法 (Double Ratchet Algorithm)

双棘轮算法是 Signal Protocol 的核心，它实现了**前向保密性**和**未来保密性**。每次消息发送都会更新会话密钥，确保即使当前链上的某个密钥泄露，也不会影响到其他密钥。

双棘轮算法维护了以下几个重要概念：

*   **根密钥 (Root Key, RK)**：用于派生后继的根密钥和链密钥。
*   **发送链密钥 (Sending Chain Key, SCK)**：用于派生发送消息的对称加密密钥。
*   **接收链密钥 (Receiving Chain Key, RCK)**：用于派生接收消息的对称加密密钥。
*   **消息密钥 (Message Key, MK)**：实际用于加密和解密每一条消息的对称密钥。
*   **发送方/接收方棘轮公钥 (Ephemeral Key Pair)**：用于每次密钥更新的新的 ECDH 密钥对。

**工作原理**：

双棘轮算法结合了两种“棘轮”机制：

1.  **对称密钥棘轮 (Symmetric-Key Ratchet)**：
    *   每次发送消息时，基于当前的链密钥 (SCK 或 RCK) 使用 KDF 派生出新的消息密钥 (MK)。然后，再从旧的链密钥生成一个新的链密钥。
    *   这意味着每一条消息都有一个**新的、独立的、一次性的消息密钥**。
    *   如果攻击者获得当前链密钥，他们可以解密以该链密钥加密的未来消息，但无法解密过去的（已派生出并销毁其生成密钥的）消息。这提供了**前向保密性**。

2.  **DH 棘轮 (Diffie-Hellman Ratchet)**：
    *   每次两个通信方更新棘轮公钥时，双方会执行一个新的 ECDH 密钥交换。
    *   这个新的 ECDH 共享秘密被用于更新根密钥 (RK)，然后由 RK 派生出新的发送链密钥和接收链密钥。
    *   **关键点**：如果攻击者在某个时刻窃取了所有链密钥，一旦发生一次成功的 DH 密钥更新（即双方都交换了新的棘轮公钥），攻击者就无法解密未来的消息了，因为新的链密钥是由新的、未曾泄露的 DH 秘密派生而来的。这提供了**未来保密性/后向保密性**。

通过这两种棘轮机制的结合，确保了无论攻击者何时获取了通信方的秘密信息（只要不是持续的完全控制），都能最大程度地限制泄露的范围。

{% mermaid %}
graph LR
    subgraph "Initial Setup (X3DH)"
        A[Alice IK, SPK, OPK] -->|Upload Public Keys| Server;
        B[Bob IK, SPK, OPK] -->|Upload Public Keys| Server;
        Alice[Alice] --Request Bob's Key Bundle--> Server;
        Alice --"Calculates Initial RK, SCK(Alice), RCK(Bob) (via 4 ECDH)"--> Bob;
    end

    subgraph Double Ratchet Algorithm
        direction LR
        A_DR[Alice's Double Ratchet State]
        B_DR[Bob's Double Ratchet State]

        A_DR -->|Generate new Ephemeral Key EK_A| A_DR
        A_DR -->|Derive SCK, RCK from RK; MK from SCK| A_DR

        A_DR -->|"Encrypt Message (MK_A), Attach EK_A"| B_DR;
        B_DR -->|Update RCK, derive MK_A from RCK, Decrypt Message| B_DR;
        B_DR -->|Generate new Ephemeral Key EK_B| B_DR
        B_DR -->|Derive SCK, RCK from RK; MK from SCK| B_DR

        B_DR -->|"Encrypt Message (MK_B), Attach EK_B"| A_DR;
        A_DR -->|Update RCK, derive MK_B from RCK, Decrypt Message| A_DR;
    end
{% endmermaid %}


## 四、身份验证

Signal Protocol 提供了机制来验证通信方身份，以防止中间人攻击：

*   **安全码 (Safety Numbers)**：Signal 应用会生成一个由数字或二维码表示的“安全码”。用户可以通过面对面比对或通过安全信道验证这个安全码。如果安全码一致，则可以确认双方正在与正确的对象通信。当身份密钥或签名预密钥发生变化时，安全码会发生变化，通知用户可能存在中间人攻击或某一方更换了设备。

## 五、Signal Protocol 的广泛应用

Signal Protocol 因其强大的安全性、开源性以及严谨的密码学设计，已被广泛应用于：

*   **Signal Messenger**：所有消息、群组聊天、语音和视频通话都默认使用 Signal Protocol 进行端到端加密。
*   **WhatsApp**：自 2016 年起，WhatsApp 的所有个人和群组聊天、语音和视频通话都默认使用 Signal Protocol 进行端到端加密。
*   **Facebook Messenger**：在“秘密对话”模式下使用 Signal Protocol。
*   **Google Messages**：在支持 RCS (Rich Communication Services) 的对话中，如果双方设备都启用了端到端加密，则使用 Signal Protocol。
*   **Skype**：在“私人对话”模式下使用 Signal Protocol。
*   **Wire**：安全通讯应用，也采用了 Signal Protocol。

## 六、与 MTProto 的对比

| 特性 / 协议        | Signal Protocol            | MTProto (Telegram)         |
| :----------------- | :------------------------- | :------------------------- |
| **主要设计者**     | Open Whisper Systems (Signal Foundation) | Nikolai Durov (Telegram)   |
| **协议类型**       | **业经验证的 E2EE 协议**     | **Telegram 自定义协议**    |
| **端到端加密 (E2EE)**| **所有个人聊天和群组聊天默认开启** | **仅秘密聊天 (Secret Chats) 开启**；普通云聊天是客户端-服务器加密 |
| **前向/未来保密性**| **支持** (通过双棘轮算法)  | **秘密聊天支持**；云聊天不明确，通常认为不如 Signal 严格 |
| **密钥交换**       | **X3DH** (Extended Diffie-Hellman) | 基于 RSA 和 Diffie-Hellman 自定义流程 |
| **会话密钥管理**   | **双棘轮算法** (每次消息更新) | 秘密聊天中也有密钥更新机制，但不如双棘轮灵活严谨 |
| **消息加密算法**   | AES256-GCM, HMAC-SHA256    | AES256-IGE, SHA256         |
| **身份验证 (AoT)** | **安全码比对**             | 秘密聊天中的设备指纹比对   |
| **开源状态**       | **协议规范和库完全开源且经过广泛审计** | **客户端开源，服务器端代码不开源**；协议规范公开 |
| **行业采纳**       | **被广泛采纳为 E2EE 黄金标准** (WhatsApp, Google Messages, FB Messenger) | 仅 Telegram 自身使用       |
| **学术审查**       | **经过大量学术审查和同行评审** | 较少严格的第三方独立学术审查，由 Telegram 组织了一些竞赛 |

## 七、总结

Signal Protocol 代表了现代端到端加密通讯的最高水平。它通过结合 X3DH 密钥交换和双棘轮算法，实现了强大**前向保密性**和**未来保密性**，确保了用户通信的隐私不受侵害，即使部分通信秘密被泄露，也能最大程度地限制安全影响。其**开源的特性**和**广泛的学术审查**使其成为业界公认的 E2EE 黄金标准，被众多主流即时通讯应用采用。对于任何关心数字隐私和安全的个人或组织而言，理解和支持 Signal Protocol 及其衍生应用都至关重要。
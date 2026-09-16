---
title: 双棘轮算法 (Double Ratchet Algorithm) 详解
date: 2024-12-06 06:24:00
tags:
  - 2024
  - 加密算法
  - 计算机网络
categories:
  - 计算机网络
  - 加密算法
mathjax: true
---

> **双棘轮算法 (Double Ratchet Algorithm, DRA)** 是 Signal Protocol 的核心密码学机制，由 Moxie Marlinspike 和 Trevor Perrin 设计。它旨在为**异步、双向、端到端加密 (E2EE) 的消息会话**提供**前向保密性 (Forward Secrecy)** 和**未来保密性 (Post-Compromise Security / Future Secrecy)**。通过结合**对称密钥棘轮**和**Diffie-Hellman 棘轮**，该算法能够确保即使会话中的某些密钥被攻击者窃取，过去和未来的消息内容依然保持安全，极大地增强了通讯的韧性。

{% note info %}
核心思想：双棘轮算法通过两种交织的密钥更新机制——**每条消息更新的对称密钥棘轮**和**定期更新的 Diffie-Hellman 棘轮**——来不断地“棘轮前进”会话密钥，保证即使攻击者在任意时刻攻破了通信方的一些秘密，也无法解密所有过去或所有未来的消息。
{% endnote %}
------

## 一、为什么需要双棘轮算法？

在传统的 E2EE 方案中，如果用于加密整个会话的唯一共享秘密密钥被泄露，那么所有通过该密钥加密的消息都可能被解密。为了提升安全性，我们需要一种机制，使得密钥泄露的影响范围最小化：

1.  **前向保密性 (Forward Secrecy, FS)**：如果一个长期私钥被泄露（例如，攻击者攻破了你的设备并获取了你的身份私钥），过去通过该密钥加密的会话内容仍然保持安全。这意味着每个消息的密钥都应该是临时的且与长期密钥无关的。
2.  **未来保密性 / 后向保密性 (Post-Compromise Security, PCS / Future Secrecy)**：如果当前会话密钥被泄露（例如，攻击者实时窃取了你当前正在使用的会话密钥），未来的会话内容仍然保持安全。这意味着会话密钥需要以某种方式“自我修复”，使得攻击者即使掌握了当前所有密钥，也无法预测或推导出未来的密钥。

双棘轮算法就是为了同时满足这两种高级安全特性而设计的。它的名字来源于“棘轮”这种机械装置，只能单向转动，一旦前进就不可逆转，形象地比喻了密钥的单向派生和更新。

## 二、核心概念与密码学基础

双棘轮算法基于以下密码学原语和概念：

1.  **椭圆曲线 Diffie-Hellman (ECDH)**：一种非对称密钥交换协议，允许通信双方在不安全的信道上协商出一个共享的秘密密钥。这是 DH 棘轮的基础。
2.  **密钥派生函数 (Key Derivation Function, KDF)**：一种密码学函数，用于从一个或多个秘密输入（如 DH 共享秘密或旧的密钥）确定性地生成新的、高质量的加密密钥。Signal Protocol 中通常使用 HMAC-SHA256 作为 KDF。
3.  **对称加密 (Symmetric Encryption)**：使用相同的密钥进行加密和解密。实际的消息内容（以及消息认证码 MAC）由对称密钥进行加密。
4.  **会话状态**：为了实现棘轮机制，通信双方需要维护一些会话状态，包括当前的密钥和计数器。

## 三、双棘轮算法的关键组成部分

每个参与者（Alice 和 Bob）在会话中维护以下关键状态：

1.  **根密钥 (Root Key, RK)**：一个 32 字节的秘密，用于派生新的链密钥。它是 DH 棘轮的核心。初始的 RK 通常由 X3DH 协议协商产生。
2.  **发送链密钥 (Sending Chain Key, SCK)**：32 字节的秘密，用于派生发送消息的下一个消息密钥和更新发送链。
3.  **接收链密钥 (Receiving Chain Key, RCK)**：32 字节的秘密，用于派生接收消息的下一个消息密钥和更新接收链。
4.  **消息私钥 (Ephemeral Key Pair)**：用于 DH 棘轮的临时 ECDH 密钥对。每个参与者维护一对，其公钥在进行 DH 棘轮时发送给对方。
    *   `DH_ratchet_priv`：本地的临时 ECDH 私钥。
    *   `DH_ratchet_pub`：本地的临时 ECDH 公钥。
    *   `Remote_DH_pub`：对方的临时 ECDH 公钥。

5.  **消息计数器**：记录当前链中发送或接收的消息数量，用于生成唯一的 IV 和方便处理乱序消息。
    *   `PN`：与当前活跃的 `Remote_DH_pub` 相关的消息数量。
    *   `N_s`：当前发送链中已发送的消息数量。
    *   `N_r`：当前接收链中已接收的消息数量。
6.  **预计算消息密钥缓存 (Skipped Message Keys)**：用于缓存由于乱序消息而提前派生出来的消息密钥。

## 四、双棘轮的工作原理

双棘轮算法结合了两种“棘轮”机制：

### 4.1 对称密钥棘轮 (Symmetric-Key Ratchet)

*   **目的**：为每条消息生成一个**唯一、一次性**的对称加密密钥 (Message Key, MK)，并单向更新当前链密钥。
*   **机制**：
    *   **KDF_CK (Chain Key KDF)**：这是一个特殊的 KDF，接受一个链密钥作为输入，并输出两个新的值：
        *   一个**消息密钥 (MK)**，用于加密当前的消息。
        *   下一个**链密钥 (Next Chain Key)**，用于派生未来的消息密钥。
    *   **工作流程**：
        1.  当 Alice 要发送一条消息时，她使用当前的 `SCK_Alice` 输入到 `KDF_CK`。
        2.  `KDF_CK(SCK_Alice)` 会输出 `MK_send_Alice`（用于加密当前消息）和 `SCK_Alice_new`（作为下一个发送链密钥）。
        3.  Alice 使用 `MK_send_Alice` 加密消息。
        4.  Alice 使用 `SCK_Alice_new` 替换掉旧的 `SCK_Alice`。
        5.  当 Bob 收到 Alice 的消息并需要解密时，他使用当前的 `RCK_Bob` 输入到 `KDF_CK`，得到 `MK_recv_Bob` 和 `RCK_Bob_new`，用 `MK_recv_Bob` 解密。

*   **数学表示**：
    $$ (MK, NextChainKey) = KDF_{CK}(ChainKey) $$
*   **安全特性**：确保了**前向保密性**。即使攻击者获取了某个 `SCK` 或 `RCK`，他们也只能解密该密钥之后的消息，无法解密之前已经使用并销毁了其生成密钥的消息。

### 4.2 Diffie-Hellman 棘轮 (DH Ratchet)

*   **目的**：通过定期执行新的 ECDH 密钥交换，生成一个新的根密钥，从而实现**未来保密性 (Post-Compromise Security)**。
*   **机制**：
    *   **KDF_RK (Root Key KDF)**：接受当前的**根密钥 (RK)** 和一个新的 **DH 共享秘密 (DH_output)** 作为输入，并输出两个新的值：
        *   一个新的**根密钥 (Next Root Key)**。
        *   一个新的**链密钥 (Next Chain Key)**，作为新发送链或接收链的起始密钥。
    *   **工作流程**：
        1.  当一方（例如 Alice）决定进行 DH 棘轮时，她会生成一个新的临时 ECDH 密钥对 (`EK_Alice_new`)，并将其公钥 (`EK_Alice_pub_new`) 附加在下一条消息中发送给 Bob。
        2.  当 Bob 收到包含 `EK_Alice_pub_new` 的消息时，他使用自己的当前临时 ECDH 私钥 (`DH_ratchet_priv_Bob`) 和 Alice 新的公钥进行 ECDH 交换，得到一个新的 DH 共享秘密。
        3.  Bob 使用当前的 `RK_Bob` 和这个新的 DH 共享秘密作为输入，执行 `KDF_RK`。
        4.  `KDF_RK(RK_Bob, DH(DH_ratchet_priv_Bob, EK_Alice_pub_new))` 会输出 `RK_Bob_new` 和一个用于启动 Bob 新接收链的 `RCK_Bob_new`。
        5.  同时，Bob 也会生成一个新的临时 ECDH 密钥对 (`EK_Bob_new`)，将其公钥保存为自己的 `DH_ratchet_pub_Bob`。
        6.  下次 Bob 发送消息时，他会将自己的 `EK_Bob_pub_new` 附加到消息中，触发 Alice 那边的 DH 棘轮。

*   **数学表示**：
    $$ (NextRootKey, NextChainKey) = KDF_{RK}(RootKey, DHOutput) $$
*   **安全特性**：确保了**未来保密性**。一旦发生一次成功的 DH 密钥更新，即使攻击者窃取了之前的 `RK` 和所有 `SCK`/`RCK`，他们也无法解密未来的消息，因为新的 `RK` 是由新的、未曾泄露的 DH 秘密派生而来的。

### 4.3 整体流程与状态更新

{% mermaid %}
flowchart TD
    %% 阶段 1：X3DH 握手与初始密钥建立
    subgraph X3DH [" 🤝 阶段 1: X3DH 密钥协商与根密钥初始化 "]
        direction LR
        Alice_Keys["👩‍💻 Alice 密钥<br/><code>IK_A · EK_A</code>"]
        Bob_Prekeys["👨‍💻 Bob 预共享密钥<br/><code>IK_B · SPK_B · OPK_B</code>"]
        X3DH_Calc["🧮 <b>X3DH 共享密钥计算</b><br/><code>SK = DH1 ‖ DH2 ‖ DH3 (‖ DH4)</code>"]
        Init_RK["🔑 <b>初始根密钥 (Root Key)</b><br/><code>RK₀ = KDF(SK)</code>"]

        Alice_Keys --> X3DH_Calc
        Bob_Prekeys --> X3DH_Calc
        X3DH_Calc --> Init_RK
    end

    %% 阶段 2：Alice 发送第一条消息（对称棘轮步进）
    subgraph AliceSend [" 👩‍💻 阶段 2: Alice 发送 Message 1 (对称链步进) "]
        direction TB
        A_CK["📤 初始发送链密钥 <code>CK_s</code><br/><i>(由 X3DH 初始派生)</i>"]
        A_SymRatchet["⚡ <b>KDF_CK (对称棘轮步进)</b>"]
        A_NextCK["➡️ 更新发送链密钥 <code>CK_s'</code><br/><i>(留给下一条发送消息)</i>"]
        A_MK["🔐 <b>消息密钥 (MK₁)</b>"]
        A_Enc["🔒 <b>AEAD 加密消息</b><br/>包含 Alice 临时公钥 <code>EK_A.pub</code>"]

        A_CK --> A_SymRatchet
        A_SymRatchet -->|"推进链"| A_NextCK
        A_SymRatchet -->|"派生 MK"| A_MK
        A_MK --> A_Enc
    end

    Init_RK -->|"建立初始发送/接收链"| A_CK

    %% 网络信道传输
    Msg1[("📦 <b>Message 1</b> (密文 + 报头: <code>EK_A.pub</code>)")]
    A_Enc -->|"公网发送"| Msg1

    %% 阶段 3：Bob 接收第一条消息（DH 棘轮 + 对称棘轮解密）
    subgraph BobRecv [" 👨‍💻 阶段 3: Bob 接收并解密 (DH 棘轮 + 对称棘轮) "]
        direction TB
        B_Check{"是否包含新公钥？<br/><b>检查 EK_A.pub</b>"}
        
        subgraph DHRatchet [" 🔄 DH 棘轮步进 (DH Ratchet Step) "]
            direction TB
            B_DH["⚡ 计算 DH 输出<br/><code>DH_Secret = DH(Bob_Priv, EK_A.pub)</code>"]
            B_KDF_RK["🧮 <b>KDF_RK 根链步进</b><br/><code>(RK₁, CK_r) = KDF(RK₀, DH_Secret)</code>"]
            B_DH --> B_KDF_RK
        end

        subgraph SymRatchet [" ⚡ 接收对称棘轮步进 (Symmetric Ratchet) "]
            direction TB
            B_KDF_CK["🧮 <b>KDF_CK 对称步进</b><br/><code>(CK_r', MK₁) = KDF(CK_r)</code>"]
            B_Dec["🔓 <b>AEAD 解密</b><br/>用 <code>MK₁</code> 还原明文"]
            B_KDF_CK -->|"解密密钥"| B_Dec
        end

        B_Check -->|"是: 触发 DH 棘轮"| B_DH
        B_KDF_RK -->|"产出接收链 CK_r"| B_KDF_CK
    end

    Msg1 -->|"网络接收"| B_Check
    B_Dec --> Plaintext(["📄 <b>Bob 成功处理明文消息 1</b>"])

    %% 状态更新标注
    subgraph ReadyNext [" ⏭️ 后续双向棘轮轮转准备 "]
        NextState["Bob 生成新临时公钥 <code>EK_B</code> 并附在下一次回复中<br/>双方进入持续的 <b>DH 棘轮 ↔ 发送/接收对称链</b> 自动交替滚动"]
    end
    Plaintext -.-> ReadyNext

    %% 深色主题样式定制
    style X3DH fill:#0f172a,stroke:#38bdf8,stroke-dasharray: 4 4,color:#93c5fd
    style AliceSend fill:#0c192c,stroke:#0ea5e9,stroke-width:1.5px,color:#bae6fd
    style BobRecv fill:#1e1035,stroke:#a855f7,stroke-width:1.5px,color:#d8b4fe
    style DHRatchet fill:#130b24,stroke:#c084fc,stroke-dasharray: 3 3,color:#e9d5ff
    style SymRatchet fill:#130b24,stroke:#c084fc,stroke-dasharray: 3 3,color:#e9d5ff
    style ReadyNext fill:#091624,stroke:#64748b,stroke-dasharray: 2 2,color:#94a3b8

    style Alice_Keys fill:#1e293b,stroke:#0ea5e9,color:#f8fafc
    style Bob_Prekeys fill:#1e293b,stroke:#a855f7,color:#f8fafc
    style X3DH_Calc fill:#0369a1,stroke:#38bdf8,stroke-width:1.5px,color:#ffffff
    style Init_RK fill:#1e3a5f,stroke:#38bdf8,stroke-width:2px,color:#ffffff

    style A_CK fill:#1e293b,stroke:#0ea5e9,color:#cbd5e1
    style A_SymRatchet fill:#0284c7,stroke:#38bdf8,color:#ffffff
    style A_NextCK fill:#1e293b,stroke:#64748b,color:#cbd5e1
    style A_MK fill:#075985,stroke:#38bdf8,color:#ffffff
    style A_Enc fill:#0369a1,stroke:#38bdf8,stroke-width:1.5px,color:#ffffff

    style Msg1 fill:#334155,stroke:#94a3b8,stroke-width:2px,color:#f1f5f9
    style B_Check fill:#312e81,stroke:#818cf8,color:#ffffff
    style B_DH fill:#581c87,stroke:#c084fc,color:#ffffff
    style B_KDF_RK fill:#6b21a8,stroke:#c084fc,stroke-width:1.5px,color:#ffffff
    style B_KDF_CK fill:#581c87,stroke:#c084fc,color:#ffffff
    style B_Dec fill:#4c1d95,stroke:#c084fc,stroke-width:1.5px,color:#ffffff
    style Plaintext fill:#14532d,stroke:#22c55e,stroke-width:2px,color:#f0fdf4
    style NextState fill:#1e293b,stroke:#475569,color:#cbd5e1
{% endmermaid %}

**简化流程 (以 Alice 向 Bob 发送消息为例):**

1.  **初始化**：通过 X3DH 协议，Alice 和 Bob 协商出一个初始的 `RK` 和一对初始的 `SCK` (发送链密钥) / `RCK` (接收链密钥)，并各自生成一个临时的 ECDH 密钥对 (`DH_ratchet_priv`/`DH_ratchet_pub`)。

2.  **Alice 发送消息**：
    *   **对称棘轮**：Alice 从她当前的 `SCK_Alice` 派生出一个 `MK_send_Alice`（用于加密当前消息）和一个新的 `SCK_Alice_new`。
        $$ (MK_{send}, SCK_{new}) = KDF_{CK}(SCK_{current}) $$
    *   她用 `MK_send_Alice` 加密消息。
    *   **DH 棘轮触发**：Alice 检查她是否需要更新 DH 棘轮（例如，每隔 N 条消息或根据特定策略）。如果需要，她会生成一个新的临时 ECDH 密钥对 (`EK_Alice_new`)，并将其公钥 (`EK_Alice_pub_new`) 附加到消息中，然后将旧的临时私钥销毁。
    *   Alice 将消息和潜在的 `EK_Alice_pub_new` 发送给 Bob。她更新自己的 `SCK_Alice = SCK_Alice_new`。

3.  **Bob 接收消息**：
    *   **检查 DH 棘轮**：Bob 收到消息。他查看消息中是否包含一个**新的** `EK_Alice_pub`。
        *   **如果包含新的 `EK_Alice_pub` (DH 棘轮发生)**：
            1.  Bob 使用自己的当前临时私钥 (`DH_ratchet_priv_Bob`) 和 Alice 发来的 `EK_Alice_pub` 执行 ECDH 交换，得到新的 `DH_Output`。
            2.  Bob 使用 `KDF_RK(RK_Bob_old, DH_Output)` 派生出一个新的 `RK_Bob_new` 和一个新的 `RCK_Bob_new_start` (作为 Bob 新接收链的起始密钥)。
                $$ (RK_{new}, RCK_{new\_start}) = KDF_{RK}(RK_{old}, DH(DH_{ratchet\_priv\_Bob}, EK_{Alice\_pub})) $$
            3.  Bob 会生成一个新的临时 ECDH 密钥对作为他自己的 `DH_ratchet_priv_Bob_new`/`DH_ratchet_pub_Bob_new`。
            4.  Bob 将旧的 `DH_ratchet_priv_Bob` 销毁，更新 `RK_Bob = RK_Bob_new`，并使用 `RCK_Bob_new_start` 作为他当前活跃的接收链密钥。
            5.  Bob 会更新自己的发送链密钥 `SCK_Bob`，通常是使用 `KDF_RK` 返回的另一部分作为新的发送链密钥起点。
            *   **处理乱序**：由于消息可能乱序到达，Bob 需要维护一个未使用的消息密钥缓存。
                *   如果 Bob 已经根据旧的 `RCK_Bob` 提前派生并缓存了未来的消息密钥，他会从缓存中找到对应密钥解密。
                *   如果 Bob 收到的消息的序列号与当前接收链的预期序列号不符，他可能会派生出丢失的密钥并缓存，或者从缓存中取用。
        *   **如果不包含新的 `EK_Alice_pub` (仅对称棘轮)**：
            1.  Bob 从他当前的 `RCK_Bob` 派生出一个 `MK_recv_Bob`（用于解密当前消息）和一个新的 `RCK_Bob_new`。
                $$ (MK_{recv}, RCK_{new}) = KDF_{CK}(RCK_{current}) $$
            2.  Bob 用 `MK_recv_Bob` 解密消息。
            3.  Bob 更新 `RCK_Bob = RCK_Bob_new`。

## 五、双棘轮算法的数学表示 (KDF)

*   **KDF for Root Key (KDF_RK)**：
    通常，`KDF_RK` 接收两个 32 字节的输入，一个 `Root Key (RK)` 和一个 `DH Output`，并输出两个 32 字节的值，作为新的 `Root Key` 和新的 `Chain Key`。
    $$ (NewRK, NewChainKey) = HKDF(shared\_secret=DHOutput, salt=RK, info="SignalProtocolKDFRK") $$
    这里的 `HKDF` 是 HMAC-based Key Derivation Function，它使用 SHA256 等哈希函数。

*   **KDF for Chain Key (KDF_CK)**：
    `KDF_CK` 接收一个 32 字节的 `Chain Key (CK)` 作为输入，并输出两个 32 字节的值，一个作为 `Message Key (MK)`，另一个作为 `Next Chain Key`。
    $$ MessageKey = HMAC_{SHA256}(ChainKey, 0x01) \\ NextChainKey = HMAC_{SHA256}(ChainKey, 0x02) $$
    这里使用了 `HMAC` 的不同常量 (`0x01`, `0x02`) 来派生不同的输出。

## 六、实施要点与挑战

1.  **乱序消息**：由于消息在网络中可能乱序到达，接收方需要能够处理这种情况。通常，接收方会提前派生并缓存一定范围内的消息密钥，以便处理稍后到达的乱序消息。
2.  **密钥销毁**：为了保证前向保密性，一旦密钥被使用（例如，消息密钥用于加密/解密），它就应该尽快从内存中安全擦除。
3.  **长期密钥 vs. 临时密钥**：严格区分用于身份验证的长期密钥和用于会话的临时密钥。DRA 及其前置的 X3DH 正是为了最大限度地减少长期密钥泄露带来的影响。
4.  **初始信任**：DRA 解决了会话过程中的密钥安全，但它不解决**初始信任问题**。用户仍然需要通过其他方式（例如，安全码比对）验证对方的身份密钥，以防止第一次通信时的中间人攻击。

## 七、总结

双棘轮算法是现代加密通信协议的里程碑，它巧妙地结合了对称和非对称密码学的优势，实现了强大的**前向保密性**和**未来保密性**。这种不断更新和“棘轮前进”的密钥管理机制，使得即使攻击者在任何时间点对通信方设备进行入侵并窃取了当前的加密密钥，也无法解密所有过去或所有未来的消息。正是因为其严谨的设计和卓越的安全性，双棘轮算法才能够成为 Signal Protocol 的核心，并被 WhatsApp、Google Messages 等众多主流通讯应用广泛采用，成为端到端加密领域的黄金标准。
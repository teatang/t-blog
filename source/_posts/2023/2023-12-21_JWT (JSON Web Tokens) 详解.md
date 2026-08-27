---
title: JWT (JSON Web Tokens) 详解
date: 2023-12-21 06:24:00
tags:
  - 2023
  - 计算机网络
  - 网络安全
  - 身份认证
categories:
  - 计算机网络
  - 网络安全
---
> **JWT (JSON Web Token)** 是一个**开放标准 (RFC 7519)**，它定义了一种简洁、自包含且安全的方式，用于在各方之间安全地传输信息。这些信息通过数字签名进行验证，可以被信任。JWT 通常用作**无状态 (Stateless) 认证机制**，替代传统的 Session-Cookie 模式。

{% note info %}
核心思想：**将用户认证信息和少量授权信息编码进 Token 本身，并通过签名确保其不可篡改。** 服务端无需存储 Session 状态，只需验证 Token 即可。
{% endnote %}
------

## 一、为什么需要 JWT？

传统的基于 Session-Cookie 的认证方式有其局限性：

1.  **有状态 (Stateful)**：服务端需要存储每个用户的 Session 信息。随着用户量增加，存储和管理 Session 成为负担，特别是分布式部署和微服务架构下，Session 共享和同步变得复杂。
2.  **跨域问题**：Cookie 默认是同源策略，跨域请求携带 Cookie 会比较复杂，需要复杂的 CORS (Cross-Origin Resource Sharing) 配置。
3.  **移动端不友好**：移动应用通常不依赖 Cookie，需要更灵活的认证方式。

JWT 旨在解决这些问题，提供一种**无状态、易于扩展、跨域友好**的认证解决方案：

*   **无状态**：服务器不再需要存储 Session 信息。每个请求都自带 Token，服务器只需解析和验证 Token 即可。
*   **可扩展性**：非常适合微服务架构。认证服务生成 JWT，其他微服务无需访问共享存储，只需验证 JWT 即可获取用户信息。
*   **跨域兼容**：JWT 通常通过 HTTP Header (如 `Authorization: Bearer <token>`) 传输，不受 Cookie 同源策略限制。
*   **安全性**：通过数字签名确保 Token 不可篡改，同时支持加密以保护敏感信息。
*   **信息自包含**：Token 中包含用户相关信息，避免了多次数据库查询。

## 二、JWT 的结构

一个 JWT 从形式上看，通常是三个部分通过点号 `.` 分隔的字符串：

`header.payload.signature`

例如：
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`

### 2.1 1. Header (头部)

Header 通常包含两部分信息：

*   `alg`：指定签名的算法，例如 HS256 (HMAC-SHA256)、RS256 (RSA-SHA256)。
*   `typ`：指定令牌的类型，通常为 "JWT"。

**示例 (JSON 格式)：**

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

这个 JSON 会经过 Base64Url 编码，成为 JWT 的第一部分。

### 2.2 2. Payload (载荷)

Payload 是 JWT 的主体，包含了一组关于实体（通常是用户）和可应用的额外数据的**声明 (Claims)**。声明分为三类：

1.  **注册声明 (Registered Claims)**：预定义的一些声明，强烈建议使用，但不强制。
    *   `iss` (Issuer)：签发人
    *   `exp` (Expiration Time)：过期时间戳，JWT 必须在此时间之前失效
    *   `sub` (Subject)：主题，通常是用户ID
    *   `aud` (Audience)：接收 JWT 的方
    *   `nbf` (Not Before)：在此时间之前，JWT 是无效的
    *   `iat` (Issued At)：签发时间戳
    *   `jti` (JWT ID)：JWT 的唯一标识，用于区分不同的 JWT，防止重放攻击

2.  **公共声明 (Public Claims)**：可以由使用 JWT 的各方自由定义，但为了避免冲突，应该在 IANA JSON Web Token Registry 中注册，或者将其定义为包含防冲突命名空间的 URI。

3.  **私有声明 (Private Claims)**：用于在同意使用它们的各方之间共享信息，既不是注册声明也不是公共声明。例如，可以包含用户的角色、权限等自定义信息。

**示例 (JSON 格式)：**

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true,
  "iat": 1516239022,
  "exp": 1516242622
}
```

这个 JSON 同样会经过 Base64Url 编码，成为 JWT 的第二部分。

### 2.3 3. Signature (签名)

签名部分用于验证 JWT 的完整性，防止数据被篡改。

生成签名的方式：
将 Base64Url 编码后的 Header 和 Base64Url 编码后的 Payload 用点号 `.` 连接起来，然后使用 Header 中指定的算法（例如 HS256）和密钥 (Secret) 对其进行签名。

```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

**关键点**：

*   **密钥 (Secret)**：这是一个只有签发方和验证方知道的秘密字符串，绝不能泄露。
*   **确保完整性**：一旦签名完成，如果 Header 或 Payload 中的任何数据被修改，签名就会失效，从而使这个 JWT 无效。
*   **不加密 Payload**：请注意，签名只保证数据未被篡改，但 Payload 中的内容是 Base64Url 编码的，**任何人都可以解读**。因此，**不要在 Payload 中存放敏感信息**。如果需要保护敏感信息，则需要对整个 JWT 进行加密 (JWE - JSON Web Encryption)。

## 三、JWT 的认证流程

**一个典型的 JWT 认证流程如下：**

{% mermaid %}
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'darkMode': true,
    'background': '#1e1e2e',
    'primaryColor': '#313244',
    'primaryTextColor': '#cdd6f4',
    'primaryBorderColor': '#89b4fa',
    'lineColor': '#a6adc8',
    'secondaryColor': '#181825',
    'tertiaryColor': '#11111b',
    'noteBkgColor': '#181825',
    'noteTextColor': '#f9e2af',
    'noteBorderColor': '#89b4fa',
    'activationBorderColor': '#89b4fa',
    'activationBkgColor': '#45475a',
    'sequenceNumberColor': '#11111b'
  }
}}%%
sequenceDiagram
    autonumber
    actor U as 用户 (User)
    participant C as 客户端 (Client/App)
    participant AS as 认证服务器 (Auth Server)
    participant RS as 资源服务器 (Resource Server)

    rect rgb(35, 45, 65)
        Note over U,AS: 阶段 1: 登录与令牌签发 (Authentication)
        U->>C: 输入账号凭证 (Username / Password)
        C->>+AS: POST /oauth/token (Credentials)
        AS->>AS: 校验凭据 & 签名生成 JWT (HMAC/RSA)
        AS-->>-C: 200 OK (AccessToken, RefreshToken)
        C->>C: 安全存储 Token (Secure Cookie / Storage)
    end

    rect rgb(40, 50, 45)
        Note over U,RS: 阶段 2: 资源请求与权限校验 (Authorization)
        U->>C: 触发业务请求 (Request Protected Resource)
        C->>+RS: GET /api/v1/resource<br/>[Header: Authorization: Bearer <Access_Token>]
        
        RS->>RS: 验证 JWT (Signature, Exp, Nbf)
        
        alt 校验通过 (Valid Token)
            RS->>RS: 解析 Claims 提取 uid / roles
            RS->>RS: RBAC / ABAC 权限判定
            RS-->>C: 200 OK (Data Payload)
            C-->>U: 渲染资源数据
        else 校验失败 (Invalid / Expired)
            RS-->>-C: 401 Unauthorized (Token Expired or Invalid)
            C-->>U: 提示认证失败 / 触发 Refresh Token 流程
        end
    end
{% endmermaid %}

**刷新令牌 (Refresh Token) 流程：**

当 Access Token 过期时，客户端可以使用 Refresh Token 获取新的 Access Token。

{% mermaid %}
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'darkMode': true,
    'background': '#1e1e2e',
    'primaryColor': '#313244',
    'primaryTextColor': '#cdd6f4',
    'primaryBorderColor': '#89b4fa',
    'lineColor': '#a6adc8',
    'secondaryColor': '#181825',
    'tertiaryColor': '#11111b',
    'noteBkgColor': '#181825',
    'noteTextColor': '#f9e2af',
    'noteBorderColor': '#89b4fa',
    'activationBorderColor': '#89b4fa',
    'activationBkgColor': '#45475a',
    'sequenceNumberColor': '#11111b'
  }
}}%%
sequenceDiagram
    autonumber
    participant C as 客户端 (Client/App)
    participant AS as 认证/授权服务器 (Auth Server)

    rect rgb(35, 45, 65)
        Note over C: Access Token 已过期 (Exp Detected)
        C->>+AS: POST /oauth/v2/token<br/>[grant_type=refresh_token, refresh_token=RT_xxx]
        
        AS->>AS: 校验 Refresh Token (签名、有效期限、黑名单)

        alt 校验通过 (Token Valid)
            AS->>AS: 生成全新 Access Token (AT_new)
            AS->>AS: 触发 Token Rotation (签发新 RT_new 并废弃旧 RT)
            AS-->>C: 200 OK<br/>{ access_token: AT_new, refresh_token: RT_new, expires_in: 3600 }
            C->>C: 原子更新本地存储凭证 (Update Storage)
            Note over C: 无感刷新成功，继续恢复被挂起的业务请求
        else 校验失败/已废弃 (Invalid or Revoked)
            AS-->>-C: 401 Unauthorized<br/>{ error: "invalid_grant" }
            C->>C: 清理本地所有 Token 凭据
            Note over C,AS: 会话彻底失效，强制重定向至登录页
        end
    end
{% endmermaid %}

## 四、JWT 的优缺点与适用场景

### 4.1 优点：

1.  **无状态 (Stateless)**：服务端无需存储 Session 信息，扩展性好，适用于分布式系统和微服务架构。
2.  **易于扩展**：Payload 可以包含自定义信息，方便传递用户角色、权限等。
3.  **跨域友好**：通过 Header 传输，不受 Cookie 同源策略限制，方便实现前后端分离。
4.  **去中心化**：一旦签发，任何拥有密钥的服务都可以验证，无需与认证服务进行额外的数据库查询或网络请求。
5.  **移动端支持**：非常适合移动应用，无需依赖特定平台的存储机制。

### 4.2 缺点：

1.  **Token 一旦签发，无法作废 (Stateless 的副作用)**：即使服务端发现某个用户账户被盗或被禁用，已签发的 Access Token 在有效期内依然有效。解决方案包括：
    *   缩短 Access Token 有效期。
    *   维护一个 Token 黑名单/撤销列表 (Revocation List)。但这将引入状态，部分牺牲了无状态的优势。
2.  **Payload 信息泄露风险**：Payload 经过 Base64Url 编码，**未加密**，任何人都可以解码查看。**绝不能存放敏感信息**。
3.  **Token 长度问题**：如果 Payload 包含大量信息，Token 会变长，增加网络传输开销。
4.  **安全存储**：客户端（尤其是浏览器）如何安全存储 JWT 是一个挑战。
    *   存储在 `localStorage`/`sessionStorage` 中容易受到 XSS 攻击。
    *   存储在 `HttpOnly` 的 `Cookie` 中可以防范 XSS，但可能面临 CSRF 攻击，且移动端或某些前端框架获取 Token 不便。**通常推荐混合使用：Access Token 存 `localStorage` (短有效期)，Refresh Token 存 `HttpOnly` `Cookie` (长有效期)，并结合 CSRF 防护。**

### 4.3 适用场景：

*   **无状态 API 和微服务架构**：服务端无需存储 Session，易于伸缩和解耦。
*   **移动应用和单页应用 (SPA)**：与传统 Cookie 模式相比，更灵活、更友好。
*   **跨域认证**：天然支持跨域请求。
*   **授权中心**：OAuth 2.0 中，Access Token 可以是 JWT 格式。

## 五、安全性考虑

1.  **密钥安全**：用于签名的密钥必须高度保密，且足够复杂。一旦泄露，攻击者可以伪造 JWT。
2.  **Access Token 有效期**：设置较短的过期时间，例如 15 分钟到 1 小时。
3.  **Refresh Token 机制**：结合 Refresh Token 来获取新的 Access Token，降低 Access Token 泄露的风险。Refresh Token 的有效期可以长一些，但每次使用后最好更换，并应支持随时撤销。
4.  **HTTPS/SSL**：所有 JWT 相关的通信都**必须**通过 HTTPS 进行，防止令牌在传输过程中被窃听。
5.  **Payload 敏感信息**：**绝不在 Payload 中存储敏感用户数据**（如密码、身份证号）。
6.  **防止 XSS 攻击**：如果 JWT 存储在 `localStorage` 中，前端代码需做好 XSS 防范。
7.  **防止 CSRF 攻击**：如果 JWT 存储在 `Cookie` 中，需使用 CSRF Token 等机制进行防护。
8.  **JTI (JWT ID)**：使用 `jti` 声明可以为每个 JWT 提供唯一标识，有助于实现令牌的黑名单或防止重放攻击。
9.  **Token 黑名单/撤销列表**：对于需要实时作废用户 Token 的场景 (如用户登出、修改密码、系统管理员强制下线)，服务端需要维护一个黑名单，存储已作废的 Token 的 `jti` 或整个 Token。这会引入状态，但对于某些业务需求是必要的。

## 六、总结

JWT 提供了一种高效、无状态的认证和授权机制，在现代 Web 开发中，特别是前后端分离、微服务、移动应用领域得到了广泛应用。它简化了服务器端的状态管理，提升了系统的扩展性。然而，为了确保安全性，开发者必须深入理解其工作原理，并严格遵循安全存储、签发、验证以及刷新令牌的最佳实践。
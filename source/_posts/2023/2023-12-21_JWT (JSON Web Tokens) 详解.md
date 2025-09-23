---

title: JWT (JSON Web Tokens) 详解
date: 2023-12-21 06:24:00
tags:
  - 2023
  - 网络安全
  - JWT
categories:
  - 网络安全
---

> **JWT (JSON Web Tokens)** 是一种开放标准 (RFC 7519)，它定义了一种紧凑且自包含的方式，用于在各方之间安全地传输信息作为 JSON 对象。此信息可以通过数字签名进行验证，可以保证信息的完整性和真实性。JWT 通常用于认证和授权。

{% note info %}
“JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information between parties as a JSON object.” —— JWT.io
{% endnote %}

## 一、为什么需要 JWT？

在无状态的 Web 应用程序中，用户认证和授权是一个常见但复杂的问题。传统的基于 Session 的认证方式，在分布式系统（如微服务）和移动应用场景下遇到了挑战：

*   **跨域问题**: Session 通常依赖 Cookie，而 Cookie 在跨域时有严格的限制。
*   **水平扩展性**: Session 需要服务器端存储用户状态。当应用需要水平扩展时，Session 数据的共享和同步变得复杂（可能需要 Redis 等外部存储）。
*   **移动/多客户端**: 移动应用通常不使用 Cookie，给 Session 带来不便。
*   **性能开销**: 每次请求都需要查询服务器端的 Session 存储。

JWT 提供了一种替代方案，它允许服务器不再保存用户状态（无状态），将用户的认证信息和服务间授权信息通过 Token 的形式传递。

## 二、JWT 的组成

一个 JWT 实际上是一个字符串，通常由三部分组成，通过点 (`.`) 分隔：

`header.payload.signature`

这三部分分别是：

### 1. Header (头部)

Header 通常包含两部分信息：

*   **`typ` (Type)**: Token 的类型，固定为 `JWT`。
*   **`alg` (Algorithm)**: 签名 Token 所用的算法。常见的有 `HMAC SHA256` (HS256) 或 `RSA` (RS256)。

**示例 (JSON 格式)**:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

随后，这个 JSON 会被进行 Base64Url 编码，形成 JWT 的第一部分。

### 2. Payload (负载)

Payload 包含了一系列声明 (Claims)，这些声明是关于实体（通常是用户）以及附加元数据的语句。声明分为三种类型：

*   **Registered Claims (注册声明)**:
    *   预定义的一些标准声明，并不是强制性的，但推荐使用，以提供互操作性。
    *   包括：
        *   `iss` (Issuer): 签发人
        *   `exp` (Expiration Time): 过期时间（UNIX 时间戳），**强烈推荐使用**，以限制 Token 的有效期。
        *   `sub` (Subject): 主题
        *   `aud` (Audience): 接收人（受众）
        *   `nbf` (Not Before): 在此时间之前，Token 不可用
        *   `iat` (Issued At): 签发时间
        *   `jti` (JWT ID): JWT 唯一标识

*   **Public Claims (公有声明)**:
    *   可以自定义的声明，为了避免冲突，它们应该在 IANA JSON Web Token Registry 中注册，或者定义为包含 collision-resistant 命名空间的 URI。
    *   例如：`"name": "John Doe"`

*   **Private Claims (私有声明)**:
    *   自定义的声明，用于在同意使用它们的各方之间交换信息。
    *   这些声明不是注册声明也不是公有声明。例如，一个应用可以定义 `username` 和 `role` 字段。
    *   例如：`"userId": "123456"`, `"role": "admin"`

**示例 (JSON 格式)**:
```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true,
  "exp": 1516239022, // 过期时间
  "iat": 1516239020  // 签发时间
}
```

同样，这个 JSON 会被进行 Base64Url 编码，形成 JWT 的第二部分。

**注意**: Payload 只是进行 Base64Url 编码，**不是加密**。这意味着任何人都可以在不解密的情况下读取到 Payload 中的信息。因此，敏感信息不应直接存储在 Payload 中。

### 3. Signature (签名)

签名部分用于验证 Token 的发送者，并确保 Token 没有被篡改。计算签名需要以下三个部分：

1.  Base64Url 编码后的 Header
2.  Base64Url 编码后的 Payload
3.  一个**密钥** (secret)

签名的计算公式通常是：

`Signature = HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)`

其中 `secret` 是一个只有服务器知道的字符串。当 Token 在客户端和服务器之间传输时，服务器通过相同的算法和密钥重新计算签名。如果计算出的签名与 Token 中的签名匹配，则说明 Token 是有效且未被篡改的。

## 三、JWT 的工作流程

1.  **用户登录**: 用户向认证服务器发送用户名和密码。
2.  **验证凭据**: 认证服务器验证用户的凭据。
3.  **签发 Token**: 验证成功后，认证服务器创建一个 JWT，其中包含用户的身份信息（Payload）和过期时间，并使用**密钥** (`secret`) 对其进行签名。
4.  **返回 Token**: JWT 被发送回客户端。
5.  **后续请求**: 客户端在后续的每次请求中，将 JWT 附加到请求头中（通常是 `Authorization` 头，格式为 `Bearer <token>`）。
6.  **验证 Token**: 资源服务器接收到请求后，从请求头中获取 JWT。
    *   它首先验证 JWT 的签名是否有效（使用相同的算法和密钥重新计算签名）。
    *   接着，检查 Token 是否过期 (`exp`)，以及其他声明（如 `iss`, `aud` 等）是否符合预期。
7.  **授权访问**: 如果 Token 有效且未过期，服务器解析 Payload 获取用户身份信息，并据此决定是否授权用户访问请求的资源。

## 四、JWT 的优点

1.  **无状态 (Stateless)**: 服务器不需要存储 Session 信息，扩展性更好。
2.  **易于扩展**: 可以包含自定义的 Payload 信息，且可以在微服务架构中方便地共享认证信息。
3.  **跨平台/语言**: 作为开放标准，支持多种编程语言和平台。
4.  **安全性**: 签名机制确保了 Token 的完整性，防止篡改。
5.  **性能**: 相较于查询数据库或缓存来获取 Session 信息，JWT 的验证通常更快。

## 五、JWT 的缺点与安全考量

1.  **Payload 不加密**: Payload 只是 Base64Url 编码，而不是加密。**不要在 Payload 中存储敏感信息**。
2.  **Token 一旦签发无法失效**:
    *   除非过期，JWT 无法被“吊销”。
    *   如果 Token 被盗，攻击者可以滥用它直到过期。
    *   **解决方案**:
        *   设置较短的过期时间 (`exp`)，配合刷新 Token (Refresh Token) 机制。
        *   使用黑名单 (Blacklist) 或白名单 (Whitelist) 记录已登出或被吊销的 Token。
        *   限制 Payload 中的信息量，只包含必要的非敏感信息。
3.  **密钥泄露**: 如果用于签名的密钥泄露，攻击者可以伪造有效的 JWT。**保护好密钥是重中之重**。
4.  **Token 存储**: 客户端应安全地存储 JWT (例如在 HTTP Only 的 Cookie 中或 Web Storage，但要注意 XSS 风险)。
    *   **Local Storage/Session Storage**: 易受 XSS 攻击。
    *   **HTTP Only Cookie**: 可以有效防御 XSS，但 CSRF 风险依然存在。

## 六、JWT 的使用场景

1.  **认证 (Authentication)**: 最常见的用途。用户登录后，服务器返回 JWT，客户端在后续请求中携带它以证明身份。
2.  **授权 (Authorization)**: 在 JWT 的 Payload 中包含用户的角色、权限等信息，资源服务器可以根据这些信息判断用户是否有权访问特定资源。
3.  **信息交换**: 在分布式系统或服务间调用时，JWT 可以用作信息交换的一种安全方式。例如，在微服务架构中，一个服务可以签发一个 JWT，包含特定请求的信息，传递给另一个服务进行处理。

## 七、刷新 Token (Refresh Token) 机制

为了解决 JWT 过期时间短和无法吊销的矛盾，通常会引入 Refresh Token 机制：

1.  **登录成功**: 服务器同时返回一个短生命周期的 `Access Token` (JWT) 和一个长生命周期的 `Refresh Token`。
2.  **Access Token 使用**: 客户端使用 `Access Token` 访问受保护资源。
3.  **Access Token 过期**: 当 `Access Token` 过期时，客户端检测到 401 Unauthorized 错误。
4.  **使用 Refresh Token**: 客户端发送 `Refresh Token` 到一个专门的刷新接口。
5.  **验证 Refresh Token**: 服务器验证 `Refresh Token` 的有效性（它通常存储在数据库中，可以被吊销）。
6.  **签发新 Token**: 如果 `Refresh Token` 有效，服务器签发新的 `Access Token` 和（可选地）新的 `Refresh Token`。
7.  **继续访问**: 客户端使用新的 `Access Token` 再次访问受保护资源。

Refresh Token 可以存储在数据库中，并且可以被服务器吊销，从而实现对用户会话的控制。

## 八、总结

JWT 提供了一种高效、无状态的认证和授权机制，特别适用于分布式、跨平台和移动应用场景。然而，开发者必须充分理解其工作原理，尤其是 Payload 的可见性和 Token 无法直接失效的特性，并采取相应的安全措施（如短过期时间、刷新 Token、安全存储密钥、不在 Payload 存储敏感信息）来构建健壮安全的系统。
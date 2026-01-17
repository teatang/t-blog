---
title: DNS over TLS (DoT) 与 DNS over HTTPS (DoH) 协议详解
date: 2023-03-20 06:24:00
tags:
  - 2023
  - 计算机网络
  - 网络协议
categories:
  - 计算机网络
  - 网络协议
---
> **DNS over TLS (DoT)** 和 **DNS over HTTPS (DoH)** 是旨在增强 **DNS (Domain Name System)** 查询和响应**隐私性 (Privacy)** 与**安全性 (Security)** 的两种协议。它们通过对 DNS 流量进行加密，防止网络中间方（如 ISP、政府机构或恶意攻击者）窥探用户的域名解析请求或篡改 DNS 响应，从而解决了传统 DNS 协议固有的安全和隐私缺陷。

{% note info %}
**核心思想**：**将明文传输的 DNS 查询封装到加密的传输层安全 (TLS) 或超文本传输安全 (HTTPS) 连接中，以保护用户隐私、防止 DNS 劫持和对抗网络审查。**
{% endnote %}
------

## 一、传统 DNS 的隐私与安全痛点

传统的 DNS 协议通常通过 **UDP (User Datagram Protocol)** 或 **TCP (Transmission Control Protocol)** 的 **53 号端口**进行通信。这种通信方式存在以下固有的安全和隐私缺陷：

1.  **明文传输 (Plaintext Transmission)**：DNS 查询和响应在网络上以明文形式传输。
    *   **隐私泄露**：任何能够嗅探网络流量的中间方，都可以轻易地看到用户正在访问哪些网站。这使得 ISP、政府或其他实体可以收集用户的浏览历史，进行用户画像、行为分析或用于定向广告。
    *   **审查与监控**：特定实体可以根据 DNS 查询内容进行审查，阻止用户访问某些网站，或对用户活动进行监控。

2.  **易受篡改和劫持 (Vulnerable to Tampering/Hijacking)**：由于缺乏加密和认证机制，传统的 DNS 流量容易受到攻击：
    *   **DNS 劫持 (DNS Hijacking)**：攻击者截获 DNS 查询，并返回虚假的 IP 地址，将用户重定向到恶意网站。
    *   **DNS 缓存投毒 (DNS Cache Poisoning)**：攻击者向 DNS 解析器注入虚假信息，导致解析器缓存错误的域名到 IP 地址映射。

3.  **流量可识别性高**：传统的 DNS 流量（端口 53）具有高度可识别性，容易被网络防火墙或过滤器识别并阻断。

DoT 和 DoH 正是为了解决这些问题而提出，旨在将 DNS 查询的隐私和安全提升到与 HTTPS 网页浏览相同的水平。

## 二、DNS over TLS (DoT) 详解

### 2.1 定义

**DoT** 将 DNS 协议直接包装在 **TLS (Transport Layer Security)** 协议之上。它在专门的端口上（通常是 **TCP 853 端口**）建立一个加密的 TLS 连接，然后在这个加密通道内传输标准的 DNS 查询和响应消息。

### 2.2 工作原理

DoT 的工作流程与传统 DNS 类似，但在发送 DNS 查询之前，客户端会与 DoT 解析器建立一个安全的 TLS 连接。

{% mermaid %}
sequenceDiagram
    participant User as 用户
    participant Client as 客户端 (OS/App)
    participant DoT_Resolver as DoT 解析器
    participant Trad_DNS_Resolver as 传统 DNS 解析器
    participant Auth_DNS as 权威 DNS 服务器

    User->>Client: 1. 请求解析 `www.example.com`
    Client->>Client: 2. 检查本地 DNS 缓存
    alt 域名不在缓存中
        Client->>DoT_Resolver: 3. **建立 TLS 连接 (TCP 853)**
        DoT_Resolver->>Client: 4. TLS 握手完成，连接加密
        Client->>DoT_Resolver: 5. 发送加密的 DNS 查询 (`www.example.com`)
        Note over DoT_Resolver: 6. 解密 DNS 查询
        DoT_Resolver->>Trad_DNS_Resolver: 7. 发送传统 DNS 查询 (UDP/TCP 53)
        Trad_DNS_Resolver->>Auth_DNS: 8. 递归查询 `www.example.com`
        Auth_DNS-->>Trad_DNS_Resolver: 9. 返回 `www.example.com` 的 IP 地址
        Trad_DNS_Resolver-->>DoT_Resolver: 10. 返回 `www.example.com` 的 IP 地址
        Note over DoT_Resolver: 11. 将 IP 地址加密
        DoT_Resolver-->>Client: 12. 返回加密的 DNS 响应
        Client->>Client: 13. 解密 DNS 响应，获取 IP 地址
    end
    Client->>www.example.com: 14. 连接到 `www.example.com`
{% endmermaid %}

**详细步骤解析：**

1.  **用户发起请求**：用户或应用程序请求解析域名。
2.  **建立 TLS 连接**：客户端尝试与预配置的 DoT 解析器（例如 Cloudflare 的 1.1.1.1 或 Google 的 8.8.8.8）在 TCP 853 端口上建立 TLS 连接。
3.  **TLS 握手**：客户端和 DoT 解析器执行 TLS 握手，协商加密算法，并验证服务器证书。一旦握手成功，通信通道即被加密。
4.  **发送加密 DNS 查询**：客户端通过这个加密的 TLS 连接发送 DNS 查询请求。
5.  **DoT 解析器处理**：DoT 解析器接收加密请求，解密后执行标准的 DNS 递归查询。
6.  **返回加密 DNS 响应**：DoT 解析器将查询结果封装成 DNS 响应，再次通过加密的 TLS 连接发送回客户端。
7.  **客户端解密**：客户端解密响应，获取 IP 地址。

### 2.3 DoT 的优势

1.  **强加密保护**：DNS 查询和响应在整个传输过程中都受到 TLS 的加密保护，防止窃听。
2.  **数据完整性**：TLS 确保 DNS 消息在传输过程中未被篡改。
3.  **身份验证**：客户端通过验证 DoT 解析器的 TLS 证书，可以确认连接到的是合法的服务器。
4.  **协议简洁**：直接在 DNS 协议上应用 TLS，实现相对直接。

### 2.4 DoT 的缺点

1.  **专用端口易识别**：使用 TCP 853 这一专用端口，使得 DoT 流量容易被网络中间设备（如防火墙、审查设备）识别和阻断。
2.  **流量可识别性**：尽管内容加密，但其行为模式（连接到 853 端口）仍然可以被用来识别和区分 DNS 流量。
3.  **依赖底层网络**：如果 853 端口被阻止，DoT 就无法工作。

### 2.5 Go 语言 DoT 客户端示例 (概念性)

Go 语言标准库 `net` 和 `crypto/tls` 可以构建 DoT 客户端。实际应用中通常会使用第三方库如 `miekg/dns`。

```go
package main

import (
	"fmt"
	"net"
	"time"

	"github.com/miekg/dns" // 一个流行的DNS库
)

func main() {
	// DoT 服务器地址和端口
	dotServer := "1.1.1.1:853" // Cloudflare DoT Resolver

	// 构造 DNS 查询消息
	m := new(dns.Msg)
	m.SetQuestion(dns.Fqdn("www.example.com"), dns.TypeA)
	m.RecursionDesired = true

	// 创建 DoT 客户端
	c := new(dns.Client)
	c.Net = "tcp-tls" // 指定使用 TCP with TLS
	c.TLSConfig = nil // 默认使用系统CA验证，若需自定义，可配置 crypto/tls.Config

	// 发送查询并接收响应
	r, _, err := c.Exchange(m, dotServer)
	if err != nil {
		fmt.Printf("DoT 查询失败: %s\n", err.Error())
		return
	}

	if r.Rcode != dns.RcodeSuccess {
		fmt.Printf("DNS 查询失败，Rcode: %d\n", r.Rcode)
		return
	}

	// 解析响应
	for _, ans := range r.Answer {
		if a, ok := ans.(*dns.A); ok {
			fmt.Printf("DoT 查询结果: www.example.com -> %s\n", a.A.String())
		}
	}
}
```

## 三、DNS over HTTPS (DoH) 详解

### 3.1 定义

**DoH** 将 DNS 查询和响应封装在标准的 **HTTPS (Hypertext Transfer Protocol Secure)** 请求和响应中。它使用 **HTTP/2** 或 **HTTP/3** 协议，通过标准的 **TCP 443 端口**进行通信，与正常的网页浏览流量混合在一起。

### 3.2 工作原理

DoH 的核心在于将 DNS 查询作为 HTTP 请求的负载 (payload)，通过 HTTPS 连接发送到 DoH 解析器。

{% mermaid %}
sequenceDiagram
    participant User as 用户
    participant Client as 客户端 (浏览器/OS)
    participant DoH_Resolver as DoH 解析器
    participant Trad_DNS_Resolver as 传统 DNS 解析器
    participant Auth_DNS as 权威 DNS 服务器

    User->>Client: 1. 请求解析 `www.example.com`
    Client->>Client: 2. 检查本地 DNS 缓存
    alt 域名不在缓存中
        Client->>DoH_Resolver: 3. **建立 HTTPS 连接 (TCP 443)**
        DoH_Resolver->>Client: 4. HTTPS 握手完成，连接加密
        Client->>DoH_Resolver: 5. **HTTPS POST/GET 请求** <br/>携带加密的 DNS 查询 (`www.example.com`)
        Note over DoH_Resolver: 6. 解密 HTTPS 请求，提取 DNS 查询
        DoH_Resolver->>Trad_DNS_Resolver: 7. 发送传统 DNS 查询 (UDP/TCP 53)
        Trad_DNS_Resolver->>Auth_DNS: 8. 递归查询 `www.example.com`
        Auth_DNS-->>Trad_DNS_Resolver: 9. 返回 `www.example.com` 的 IP 地址
        Trad_DNS_Resolver-->>DoH_Resolver: 10. 返回 `www.example.com` 的 IP 地址
        Note over DoH_Resolver: 11. 将 IP 地址封装并加密到 HTTPS 响应中
        DoH_Resolver-->>Client: 12. **HTTPS 响应** <br/>携带加密的 IP 地址
        Client->>Client: 13. 解密 HTTPS 响应，获取 IP 地址
    end
    Client->>www.example.com: 14. 连接到 `www.example.com`
{% endmermaid %}

**详细步骤解析：**

1.  **用户发起请求**：用户或应用程序请求解析域名。
2.  **建立 HTTPS 连接**：客户端与 DoH 解析器在 TCP 443 端口上建立标准的 HTTPS 连接。
3.  **HTTPS 握手**：客户端和 DoH 解析器执行 HTTPS 握手（内部包含 TLS 握手），建立加密通道。
4.  **发送 HTTPS 请求**：客户端构造一个包含 DNS 查询的 HTTP 请求（通常是 GET 或 POST），通过加密的 HTTPS 连接发送给 DoH 解析器。
5.  **DoH 解析器处理**：DoH 解析器接收加密的 HTTPS 请求，解密后提取原始 DNS 查询，并执行标准的 DNS 递归查询。
6.  **返回 HTTPS 响应**：DoH 解析器将查询结果封装在 HTTP 响应中，再次通过加密的 HTTPS 连接发送回客户端。
7.  **客户端解密**：客户端解密响应，获取 IP 地址。

### 3.3 DoH 的优势

1.  **更强的流量混淆**：DoH 流量与普通 HTTPS 网页浏览流量混合在一起，都通过 TCP 443 端口传输。这使得网络中间方很难区分 DNS 查询和常规网页流量，从而提高隐私性，更有效地对抗基于端口的审查。
2.  **绕过传统限制**：由于使用标准 HTTPS 端口，DoH 可以更容易地穿透一些网络防火墙或代理服务器，这些设备通常允许 HTTPS 流量通过。
3.  **利用现有 HTTPS 基础设施**：DoH 可以利用现有的 HTTPS CDN 和代理网络，可能带来更好的性能和可靠性。
4.  **端到端加密和认证**：与 DoT 类似，提供加密、数据完整性和服务器身份验证。

### 3.4 DoH 的缺点

1.  **可能绕过本地网络策略**：对于企业、学校或家庭网络管理员来说，DoH 可能会绕过他们设置的本地 DNS 过滤器（用于内容过滤、恶意软件防护或访问控制），使得网络管理和安全审计变得复杂。
2.  **DNS 流量集中化**：DoH 倾向于促使用户将 DNS 查询重定向到少数几家大型 DoH 提供商，可能导致 DNS 解析服务的集中化，引发对这些大型公司数据收集能力的担忧。
3.  **性能开销**：HTTP 协议头和 TLS 握手的开销理论上可能比 DoT 略大，但由于连接复用和现代优化，通常对用户体验影响不大。
4.  **调试难度增加**：由于流量加密并混淆在 HTTPS 中，网络管理员难以使用传统的 DNS 抓包工具直接调试 DNS 问题。

### 3.5 `curl` DoH 客户端示例

使用 `curl` 可以方便地向公共 DoH 解析器发送查询。

```bash
# 使用 Cloudflare DoH 解析器查询 example.com 的 A 记录，返回 JSON 格式
curl -H 'accept: application/dns-json' 'https://cloudflare-dns.com/dns-query?name=example.com&type=A'

# 也可以使用 POST 方法和 DNS wireformat，但需要更复杂的构造
# curl -H 'content-type: application/dns-message' --data-binary "$(dig +dnssec +bufsize=1232 +norecurse +short example.com A)" https://cloudflare-dns.com/dns-query
```

## 四、DoT 与 DoH 的比较

| 特性           | DNS over TLS (DoT)                                      | DNS over HTTPS (DoH)                                    |
| :------------- | :------------------------------------------------------ | :------------------------------------------------------ |
| **传输层协议** | TLS 直接封装 DNS 消息                                   | HTTPS 封装 DNS 消息 (即 TLS over HTTP)                  |
| **默认端口**   | **TCP 853**                                             | **TCP 443** (与标准 HTTPS 流量共享)                    |
| **流量可识别性** | 易于识别 (专用端口)，内容加密                           | 难以识别 (与普通 HTTPS 流量混淆)，内容加密             |
| **加密级别**   | 端到端加密 (客户端到解析器)                             | 端到端加密 (客户端到解析器)                             |
| **数据完整性** | 是                                                      | 是                                                      |
| **服务器身份验证** | 是                                                      | 是                                                      |
| **网络中间设备处理** | 容易被基于端口的防火墙或过滤器阻断                    | 较难被基于端口的防火墙或过滤器阻断，易于穿透            |
| **绕过本地控制** | 较难绕过，因为有专用端口                                | 容易绕过本地 DNS 策略和内容过滤                         |
| **性能开销**   | 相对较低 (直接 TLS 连接)                                | 相对较高 (HTTP/2或HTTP/3协议头开销)，但通常可忽略     |
| **调试难度**   | 相对容易 (专用端口，可通过 TLS 解密工具查看 DNS 消息)   | 相对困难 (与 HTTPS 流量混合，需要解密 HTTP 才能查看 DNS)|
| **部署复杂性** | 相对简单，客户端直接连接 TLS 服务器                     | 相对复杂，需要构建 HTTP 请求和处理响应，但可利用现有 Web 基础设施 |
| **主要优势**   | 协议简洁、高效，安全性高，易于网络管理员控制          | 隐私性极高，抗审查能力强，易于穿透防火墙              |
| **主要劣势**   | 易被识别和阻断                                          | 可能绕过本地策略，导致 DNS 集中化，调试困难           |

## 五、部署与使用现状

两种协议都在主流浏览器和操作系统中得到广泛支持：

### 5.1 DoT 客户端支持

*   **Android**：自 Android 9 (Pie) 起，支持系统级的 DoT 配置。
*   **iOS/macOS**：通过配置文件或第三方应用支持系统级 DoT。
*   **Linux**：`systemd-resolved` 和一些其他 DNS 客户端支持 DoT。
*   **路由器**：部分高端路由器或自定义固件 (如 OpenWrt) 支持配置 DoT。

### 5.2 DoH 客户端支持

*   **Firefox**：自 2019 年起默认在美国等地区启用 DoH。
*   **Google Chrome / Microsoft Edge**：支持 DoH，用户可以在设置中手动启用。
*   **Windows**：自 Windows 11 起，已原生支持 DoH 配置。
*   **macOS / iOS**：通过配置文件或第三方应用支持 DoH。

### 5.3 公共 DoT/DoH 解析器

*   **Cloudflare**：`1.1.1.1` (DoT: `tls://1.1.1.1`, DoH: `https://1.1.1.1/dns-query`)
*   **Google Public DNS**：`8.8.8.8`, `8.8.4.4` (DoT: `tls://dns.google`, DoH: `https://dns.google/dns-query`)
*   **Quad9**：`9.9.9.9` (DoT: `tls://9.9.9.9`, DoH: `https://dns.quad9.net/dns-query`)

## 六、安全与隐私考量

1.  **信任解析器**：无论是 DoT 还是 DoH，用户都必须信任其选择的加密 DNS 解析器。这些解析器能够看到所有的 DNS 查询。选择一个声誉良好、承诺保护隐私的提供商至关重要。
2.  **启动问题 (Bootstrapping Problem)**：客户端首次连接 DoT/DoH 解析器时，通常需要通过传统的明文 DNS 查询来获取解析器的 IP 地址。这个初始查询仍然可能被中间人攻击或窃听。**DNSSEC (DNS Security Extensions)** 可以为传统 DNS 阶段提供一定程度的保护。
3.  **审查与指纹识别**：虽然 DoH 在混淆流量方面做得更好，但高级的深度包检测 (DPI) 或流量分析技术仍可能通过其他侧信道信息（如 TLS 握手特征、流量模式、证书指纹）来推断用户行为或识别 DoH 流量。
4.  **本地网络管理**：对于企业或机构而言，DoH 绕过本地 DNS 策略的能力，要求网络管理员重新评估和调整其安全和过滤策略。
5.  **集中化风险**：DoH 加剧了 DNS 流量向少数大型提供商集中的趋势，这可能对互联网的去中心化特性构成挑战。

## 七、展望：Oblivious DoH (ODoH)

为了解决 DoH 带来的 DNS 集中化和解析器能够看到所有查询的隐私问题，**Oblivious DNS over HTTPS (ODoH)** 应运而生。ODoH 在客户端和 DoH 解析器之间引入了一个**代理服务器 (Proxy)**。客户端将加密的 DNS 查询发送给代理，代理将查询转发给 DoH 解析器。代理不知道查询内容，DoH 解析器不知道查询源 IP，从而进一步增强了查询的匿名性。

## 八、总结

DoT 和 DoH 都是旨在提升 DNS 流量隐私和安全的重要协议。DoT 提供了一个简洁、直接的 DNS 加密方案，但其专用端口使其易于被识别和阻断。DoH 则将 DNS 流量隐藏在普通的 HTTPS 流量中，具有更强的抗审查和流量混淆能力，但也可能绕过本地网络策略并引发 DNS 集中化问题。

选择哪种协议取决于具体的威胁模型和需求。对于注重易用性和通用性的普通用户，DoH 通常是更简单的选择，尤其是在浏览器和操作系统层面。对于网络管理员，DoT 可能提供更好的控制。未来，ODoH 等更先进的协议有望进一步提升 DNS 服务的隐私和安全性，构建一个更加健壮、开放和私密的互联网。
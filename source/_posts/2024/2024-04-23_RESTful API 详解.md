---
title: RESTful API 详解
date: 2024-04-23 06:24:00
tags:
  - 2024
  - 开发工具
  - API
categories:
  - 开发工具
  - API
---

> **RESTful API** 是一种遵循 **REST (Representational State Transfer)** 架构风格的应用编程接口。它定义了一组约束和原则，旨在创建可伸缩、易于集成且高效的Web服务。RESTful API 的核心思想是将网络上的事物抽象为资源，并通过统一的接口对这些资源进行操作。

{% note info %}
REST 原则最初由 Roy Fielding 在其 2000 年的博士论文中提出，主要用于指导分布式超媒体系统的设计，如万维网。它不是一个标准，而是一种架构风格。
{% endnote %}

------

## 一、为什么需要 RESTful API？

在互联网早期，Web 应用多以动态页面为主，前后端耦合度高。随着互联网和移动设备的快速发展，客户端类型日益多样化（Web 浏览器、移动 App、小程序等），前后端分离成为主流。 此时，一个结构清晰、符合标准、易于理解和扩展的接口规范显得尤为重要，RESTful API 正是为了满足这一需求而兴起。

**RESTful API 的优势包括：**

*   **客户端-服务器分离 (Separation of Concerns)**：客户端和服务器端可以独立开发和部署，互不依赖，提高了开发效率和系统的可维护性。
*   **无状态 (Statelessness)**：服务器不保存任何客户端上下文信息或会话状态。每个请求都包含处理该请求所需的所有信息，这简化了服务器设计并提高了可伸缩性。
*   **可缓存性 (Cacheability)**：服务器响应可以被客户端或中间代理缓存，减少了服务器负载，提高了性能。
*   **统一接口 (Uniform Interface)**：通过使用标准 HTTP 方法和 URI 标识资源，使 API 易于理解和使用，提高了互操作性。
*   **可伸缩性 (Scalability)**：由于无状态特性和客户端-服务器分离，RESTful API 更容易进行水平扩展以应对高并发请求。
*   **灵活性和可移植性 (Flexibility and Portability)**：数据可以在不同服务器之间轻松转移，支持多种数据格式（如 JSON、XML），且不依赖特定平台或编程语言。

**然而，RESTful API 也存在一些挑战：**

*   **过度获取 (Over-fetching) / 获取不足 (Under-fetching)**：客户端可能获取到比所需更多的数据，或者需要发起多次请求才能获取到所有必需的数据，这可能导致效率低下。
*   **版本管理 (Versioning)**：随着 API 演进，管理不同版本的 API 可能会变得复杂。
*   **复杂查询 (Complex Queries)**：对于复杂的查询，可能需要多个端点，增加了客户端逻辑的复杂性。
*   **HATEOAS 的实现复杂性**：虽然 HATEOAS 是 REST 的核心原则之一，但实际实现可能增加API的复杂性。
*   **缺乏标准化错误处理**：RESTful API 没有一个标准化的错误处理方式，这可能使开发者难以理解和解决问题。

## 二、REST 架构原则 (Roy Fielding 的六大约束)

REST (Representational State Transfer) 是一种架构风格，它基于以下六个核心约束来设计分布式系统，以实现高性能、可靠性和可伸缩性。

### 2.1 客户端-服务器分离 (Client-Server Separation)

此原则强调客户端和服务器之间的职责分离。客户端负责用户界面和用户状态管理，而服务器负责数据存储、处理和提供资源。这种分离使得客户端和服务器可以独立发展、更新和部署，不受彼此技术栈或平台的影响。

### 2.2 无状态 (Statelessness)

RESTful API 的服务器必须是无状态的。这意味着每个来自客户端的请求都必须包含服务器处理该请求所需的所有信息，服务器不会存储任何客户端的会话状态。 客户端在发出请求时会携带身份验证、会话或其他必要的上下文信息。这种设计提高了系统的可见性、可靠性和可伸缩性。

### 2.3 可缓存性 (Cacheability)

服务器的响应必须显式或隐式地声明它是否可被缓存。如果响应是可缓存的，客户端可以将该响应存储起来，并在后续对相同资源的请求中重用它，从而减少网络往返次数和服务器负载。这极大地提高了 API 的性能和可伸缩性。

### 2.4 统一接口 (Uniform Interface)

统一接口是 REST 架构最核心的原则，它简化了整个系统架构，提高了所有组件的通用性和交互效率。它由以下四个子约束组成：

#### 2.4.1 资源标识 (Identification of Resources)

所有资源都应通过统一资源标识符 (URI) 唯一标识。URI 类似于网站地址，明确指明客户端请求的内容。在 RESTful API 中，URI 通常使用名词来表示资源，避免使用动词。

*   **示例:**
    *   获取所有用户：`/users`
    *   获取 ID 为 `123` 的用户：`/users/123`
    *   获取 ID 为 `123` 的用户的订单：`/users/123/orders`

#### 2.4.2 通过表述来操作资源 (Manipulation of Resources Through Representations)

客户端通过获取资源的表述 (Representation) 来操作资源。资源的表述是其当前状态的快照，常见的格式包括 JSON、XML、HTML 等。客户端可以修改接收到的资源表述，并通过将其发送回服务器来改变资源的状态。

*   **示例:** 客户端通过发送一个包含 JSON 格式用户数据的 PUT 请求来更新一个用户。

#### 2.4.3 自描述消息 (Self-descriptive Messages)

每个消息都应该包含足够的信息来描述如何处理该消息。这意味着客户端和服务器之间的每次通信都应该包含请求或响应的上下文信息，而无需额外的元数据或带外信息。HTTP 头部和状态码在其中扮演着重要角色。

*   **示例:** HTTP 响应头 `Content-Type: application/json` 告诉客户端响应体是 JSON 格式。HTTP 状态码（如 200 OK, 404 Not Found）直接指示了请求的结果。

#### 2.4.4 超媒体作为应用状态的引擎 (Hypermedia as the Engine of Application State - HATEOAS)

HATEOAS 是 REST 架构中一个非常重要的约束，但常常被忽视或实现不完整。它要求 API 响应不仅包含数据，还应包含引导客户端进行下一步操作的超媒体链接。 客户端无需预先硬编码所有的 API 端点，而是通过这些动态提供的链接来发现和导航 API 的功能。这提高了 API 的可发现性、灵活性和解耦性。

*   **示例 (不含 HATEOAS):**
    ```json
    {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com"
    }
    ```
    客户端需要事先知道如何更新或删除该用户。

*   **示例 (含 HATEOAS):**
    ```json
    {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com",
      "_links": {
        "self": {
          "href": "/users/1"
        },
        "update": {
          "href": "/users/1",
          "method": "PUT"
        },
        "delete": {
          "href": "/users/1",
          "method": "DELETE"
        },
        "orders": {
          "href": "/users/1/orders",
          "method": "GET"
        }
      }
    }
    ```
    响应中包含了指向相关操作的链接，客户端可以根据这些链接动态地与资源进行交互。

### 2.5 分层系统 (Layered System)

客户端通常无法分辨它究竟是直接连接到最终服务器，还是连接到中间代理、负载均衡器或网关。在分层系统中，客户端可以直接连接到任何中间层，这些中间层可以用来提供安全、缓存、负载均衡等服务，而对客户端是透明的。

### 2.6 按需代码 (Code-On-Demand) (可选)

此约束是可选的。它允许服务器暂时扩展或自定义客户端的功能，通过向客户端发送可执行代码（如 JavaScript），从而减少客户端对预部署功能的依赖。

## 三、RESTful API 的关键组成部分

### 3.1 资源 (Resources) 和 URI (Uniform Resource Identifier)

RESTful API 的核心是资源。资源可以是任何信息，如用户、产品、订单、文档等。 每个资源都通过唯一的 URI 来标识。URI 是资源的地址，类似于您在浏览器中输入的网址。

*   **命名约定:**
    *   **使用名词而不是动词**：URI 应表示资源本身，操作通过 HTTP 方法来定义。
    *   **使用复数名词表示集合**：例如 `/users` (用户集合)，`/products` (产品集合)。
    *   **保持层级结构清晰**：嵌套资源应反映其关系，但避免过深的嵌套。
        *   正确示例: `/users/{id}/orders` 
        *   避免示例: `/getAllUsers` (`GET /users` 即可)

### 3.2 HTTP 方法 (HTTP Methods)

HTTP 方法（或谓词）是您对资源执行操作的“动词”。RESTful API 严格遵循 HTTP 协议定义的标准方法来执行 CRUD (Create, Read, Update, Delete) 操作，确保了一致性和可预测性。

*   **GET**：从服务器检索一个或多个资源的表示。GET 请求应该是安全的（不修改服务器状态）和幂等的（重复执行多次与执行一次效果相同）。
    *   示例: `GET /users` (获取所有用户), `GET /users/123` (获取 ID 为 123 的用户)
*   **POST**：在集合资源下创建新资源。POST 请求通常不是幂等的。
    *   示例: `POST /users` (创建一个新用户)
*   **PUT**：用请求体中提供的数据*完整替换*现有资源，或者在 URI 指定的资源不存在时创建新资源。PUT 请求是幂等的。
    *   示例: `PUT /users/123` (更新 ID 为 123 的用户的所有信息)
*   **PATCH**：对现有资源进行*部分修改*。PATCH 请求通常不是幂等的。
    *   示例: `PATCH /users/123` (更新 ID 为 123 的用户的部分属性，例如只修改姓名)
*   **DELETE**：删除 URI 指定的资源。DELETE 请求是幂等的。
    *   示例: `DELETE /users/123` (删除 ID 为 123 的用户)

### 3.3 资源表述 (Resource Representations)

客户端和服务器之间传输的数据是资源的“表述”，而不是资源本身。最常见的表述格式是 **JSON (JavaScript Object Notation)**，因为它轻量、人类可读且易于被编程语言解析。 其他格式如 XML、HTML、纯文本等也可以使用。

### 3.4 HTTP 状态码 (HTTP Status Codes)

HTTP 状态码是服务器对请求结果的反馈，是 RESTful API 约定的一部分。它们清晰地指示请求是否成功、客户端是否有误、或服务器发生了什么问题。

*   **1xx (信息响应)**：请求已接收，继续处理。
*   **2xx (成功)**：请求已成功被接收、理解、并接受处理。
    *   `200 OK`：请求成功，并返回数据。
    *   `201 Created`：请求成功，并在服务器上创建了新资源。通常用于 `POST` 请求的成功响应。
    *   `202 Accepted`：请求已接受处理，但尚未完成。
    *   `204 No Content`：请求成功，但没有返回响应体（例如 `DELETE` 请求）。
*   **3xx (重定向)**：需要采取进一步的操作才能完成请求。
*   **4xx (客户端错误)**：请求包含语法错误或无法完成请求。
    *   `400 Bad Request`：客户端发送的请求有语法错误或请求参数无效。
    *   `401 Unauthorized`：请求需要用户身份验证。
    *   `403 Forbidden`：服务器理解请求，但拒绝执行。通常是权限不足。
    *   `404 Not Found`：服务器找不到请求的资源。
    *   `409 Conflict`：请求与服务器的当前状态冲突。
    *   `422 Unprocessable Entity`：请求的格式正确，但由于语义错误无法处理。
*   **5xx (服务器错误)**：服务器在处理请求时发生错误。
    *   `500 Internal Server Error`：服务器遇到了一个意外情况，阻止了其完成请求。
    *   `503 Service Unavailable`：服务器目前无法处理请求，通常是由于服务器过载或停机维护。

## 四、RESTful API 设计最佳实践

### 4.1 资源命名规范

*   **使用名词，避免动词**：如前所述，URI 应表示资源本身，操作意图通过 HTTP 方法表达。
    *   推荐: `GET /users`, `POST /products`
    *   避免: `GET /getAllUsers`, `POST /createNewProduct`
*   **使用复数名词表示集合**： `/users`, `/orders`。对于某个特定资源，则使用其唯一标识符，例如 `/users/123`。
*   **保持 URI 简洁、直观**：避免过长或难以理解的 URI。
*   **小写字母**：统一使用小写字母。
*   **使用 `resources` 来表示子资源，例如 `/users/{userId}/addresses`**。

### 4.2 HTTP 方法的正确使用

严格按照 HTTP 方法的语义进行操作，保持 API 行为的一致性和可预测性。

*   `GET`：只用于读取数据，不应改变服务器状态。
*   `POST`：用于创建新资源或执行非幂等操作。
*   `PUT`：用于完整替换资源。
*   `PATCH`：用于部分更新资源。
*   `DELETE`：用于删除资源。

### 4.3 版本控制 (Versioning)

随着 API 的演进，不可避免地会出现需要修改 API 的情况。为了避免破坏现有客户端，进行版本控制至关重要。

*   **URL 版本控制 (Path Versioning)**：在 URI 中包含版本号。
    *   `GET /v1/users`
    *   优点：直观、易于部署。
    *   缺点：URI 不够“纯粹”，违反了 URI 标识资源的单一性。
*   **Header 版本控制**：通过自定义 HTTP Header 来指定 API 版本。
    *   `Accept-Version: v1`
    *   优点：URI 保持不变，符合 REST 原则。
    *   缺点：客户端调试不如 URL 直观。

### 4.4 认证与授权 (Authentication & Authorization)

保护 API 免受未经授权的访问至关重要。

*   **认证 (Authentication)**：验证客户端的身份。
    *   **OAuth 2.0**：广泛使用的授权框架，用于第三方应用访问用户资源。
    *   **Bearer Token/JWT (JSON Web Token)**：通过在 `Authorization` 头中发送一个令牌来认证客户端，服务器通过解密令牌来验证身份。
    *   **API Key**：简单的身份验证机制，通过在请求头或查询参数中发送一个密钥。
*   **授权 (Authorization)**：确定已认证的客户端是否有权执行请求的操作。这通常在服务器端通过角色、权限等机制实现。

### 4.5 错误处理 (Error Handling)

提供清晰、一致、机器可读的错误响应，帮助客户端开发者快速定位和解决问题。

*   **使用标准的 HTTP 状态码**：如 `400 Bad Request`、`401 Unauthorized`、`404 Not Found`、`500 Internal Server Error` 等。
*   **提供详细的错误信息**：在响应体中包含错误码、错误消息和可选的详细信息。

    ```json
    {
      "code": 40001,
      "message": "Invalid input provided",
      "details": "The 'name' field is required."
    }
    ```

### 4.6 分页、过滤和排序

对于返回大量数据的集合资源，应支持分页、过滤和排序以提高效率。

*   **分页参数**：通常使用 `page`、`limit`、`offset` 等查询参数。
    *   示例: `GET /users?page=2&limit=10`
*   **过滤参数**：可根据资源的属性进行过滤。
    *   示例: `GET /products?category=electronics&price_lt=100`
*   **排序参数**：根据一个或多个字段进行排序。
    *   示例: `GET /users?sort=name_asc`

## 五、RESTful API 架构示意图

RESTful API 的核心在于客户端与服务器之间的无状态通信和对资源的统一操作。

{% mermaid %}
graph LR
    subgraph Client [客户端层]
        Browser[浏览器]
        Mobile_App[移动应用]
        Other_Service[第三方服务]
    end

    subgraph API_Gateway_Load_Balancer [网关与负载均衡]
        LB[Load Balancer]
    end

    subgraph Server_APIs [API 服务层]
        API_A[API Service A - 用户]
        API_B[API Service B - 产品]
        API_C[API Service C - 订单]
    end

    subgraph Databases [数据库层]
        DB_A[(Database A)]
        DB_B[(Database B)]
        DB_C[(Database C)]
    end

    %% 流程连接
    Browser & Mobile_App & Other_Service -- "HTTPS 请求" --> LB

    LB -- "路由分发" --> API_A
    LB -- "路由分发" --> API_B
    LB -- "路由分发" --> API_C

    %% API 与 数据库双向交互
    API_A <--> DB_A
    API_B <--> DB_B
    API_C <--> DB_C

    %% 响应返回
    API_A & API_B & API_C -- "HTTP 响应" --> LB
    LB -- "返回数据" --> Client
{% endmermaid %}

**说明:**

*   **客户端 (Client)**：可以是任何能够发送 HTTP 请求的应用程序，如 Web 浏览器、移动应用、桌面应用或其他服务。
*   **API 网关/负载均衡器 (API Gateway/Load Balancer)**：作为客户端和后端服务之间的入口点。负载均衡器负责将请求分发到多个服务器实例，提高可用性和伸缩性。API 网关可以提供认证、授权、限流、日志等功能，对后端服务进行统一管理。
*   **服务器 API (Server APIs)**：一组独立的微服务或模块，每个负责管理特定的资源。它们遵循 RESTful 原则，对外暴露资源端点。
*   **数据库 (Databases)**：存储资源数据的后端存储。可以是关系型数据库、NoSQL 数据库等。
*   **通信协议**：主要通过 HTTP/HTTPS 进行通信，HTTPS 提供加密和安全性。

## 六、总结

RESTful API 作为一种强大的架构风格，已经成为构建现代 Web 服务的首选。它通过强调资源的抽象、统一的接口、无状态通信和标准化的 HTTP 方法，极大地简化了客户端与服务器之间的交互，提高了系统的可伸缩性、可维护性和互操作性。

理解并遵循 REST 的六大核心原则（客户端-服务器分离、无状态、可缓存性、统一接口、分层系统、按需代码）以及最佳实践（资源命名、HTTP 方法的使用、版本控制、认证授权、错误处理等）对于设计和实现高质量的 RESTful API 至关重要。虽然 RESTful API 也存在一些挑战，如过度/不足获取或 HATEOAS 的实现复杂性，但其带来的诸多优势使其在绝大多数分布式系统设计中依然占据主导地位。随着技术发展，新的 API 风格（如 GraphQL）也在特定场景下提供了更灵活的选择，但 RESTful API 的基本思想和原则仍是理解现代 API 生态的基础。
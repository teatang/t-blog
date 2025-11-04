---
title: Vercel Serverless Functions 深度详解
date: 2024-03-14 06:24:00
tags:
  - 2024
  - Vercel
  - Serverless
  - 云服务
categories:
  - 开发工具
  - 云服务
---

> **Vercel Serverless Functions** 是 Vercel 平台的核心服务之一，它允许开发者部署并运行后端代码，而无需管理任何服务器基础设施。这些函数是轻量级的、按需执行的计算单元，能够根据流量自动扩缩容，并天然集成到 Vercel 的全球 CDN 和部署工作流中。Vercel Functions 不仅为 Next.js 提供了强大的 API 路由支持，还允许开发者使用多种编程语言（如 Node.js, Python, Go, Ruby 等）构建独立的后端服务。

{% note info %}
核心思想：**Vercel Serverless Functions 提供了一种高效、自动扩缩容的无状态计算环境，使开发者能够将后端逻辑作为独立的函数部署到 Vercel 的全球边缘网络。其核心优势在于与前端框架的无缝集成、多语言支持、自动管理基础设施，并通过 Git 驱动的部署流程，极大地简化了全栈应用的开发和运维。**
{% endnote %}
------

## 一、Vercel Serverless Functions 概览

### 1.1 核心概念

1.  **无服务器 (Serverless)**：你无需预置或管理任何服务器。Vercel 负责所有基础设施的配置、维护和扩展。
2.  **按需执行 (On-demand Execution)**：函数只在收到请求时运行，不运行时不产生费用。这意味着你可以按实际使用量付费。
3.  **自动扩缩容 (Automatic Scaling)**：Vercel Functions 能够根据传入请求的负载自动扩缩容，轻松应对从零到高峰流量的各种情况。
4.  **无状态 (Stateless)**：每个函数调用都是独立的，不保留之前的任何状态。如果需要持久化数据，必须与外部服务（如数据库、缓存）集成。
5.  **边缘部署 (Edge Deployment)**：函数部署在全球 Vercel 边缘网络，尽可能靠近用户，从而减少延迟。
6.  **Git 集成**：通过将代码推送到 Git 仓库（GitHub, GitLab, Bitbucket），Vercel 自动化了构建、测试和部署流程。

### 1.2 Vercel Functions 的优势

*   **开发者体验优化**：与 Vercel 的前端部署（如 Next.js 应用）深度集成，提供统一的开发、部署和监控平台。
*   **多语言支持**：除了 Node.js/TypeScript，还支持 Python, Go, Ruby 等，让开发者可以选择熟悉的语言。
*   **高性能与低延迟**：利用全球 CDN 和边缘计算，实现快速响应。
*   **成本效益**：按需付费模型，降低初期投入和长期运营成本。
*   **简化运维**：自动化基础设施管理，让开发者专注于业务逻辑。

## 二、支持的运行时与 Builders

Vercel Functions 的底层构建系统使用 **Builders** 来将不同语言的代码转换为可执行的 Serverless Function。

| 语言/运行时     | Builder                              | 默认入口文件命名                               | 常见用途                                                 |
| :-------------- | :----------------------------------- | :--------------------------------------------- | :------------------------------------------------------- |
| **Node.js**     | `@vercel/node`                       | `index.js`, `index.ts`, `api.js`, `api.ts`   | Next.js API 路由、后端 API、数据处理                     |
| **Go**          | `@vercel/go`                         | `index.go`                                     | 高性能计算、特定 Go 库依赖、微服务                     |
| **Python**      | `@vercel/python`                     | `index.py`                                     | 数据科学、机器学习、图像处理、复杂业务逻辑               |
| **Ruby**        | `@vercel/ruby`                       | `index.rb`                                     | Rails API、特定 Ruby 库依赖                              |
| **Rust (Wasm)** | `@vercel/rust`                       | `index.rs`                                     | 极致性能、WebAssembly 集成                               |

## 三、Vercel Functions 的代码结构与路由

Vercel Functions 的路由是基于文件系统约定的，这与 Next.js 的 API 路由机制非常相似。

### 3.1 默认 `api` 目录结构

在你的项目根目录下创建一个 `api` 文件夹，其中包含的文件或文件夹将被视为 Serverless Functions。

```
my-vercel-project/
├── api/
│   ├── index.ts              # 对应路由 /api (或 /api/index)
│   ├── users.ts              # 对应路由 /api/users
│   ├── products/
│   │   ├── [id].ts           # 对应路由 /api/products/:id (动态路由)
│   │   └── index.ts          # 对应路由 /api/products
│   └── webhooks/
│       └── stripe.js         # 对应路由 /api/webhooks/stripe
├── public/
├── src/
├── package.json
└── vercel.json               # Vercel 项目配置
```

### 3.2 函数文件内容示例

#### Node.js (`api/users.ts`)

```typescript
// api/users.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'; // 引入 Vercel 类型

// 定义一个异步处理函数，支持 async/await
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // HTTP 方法判断
  if (req.method === 'GET') {
    // 获取查询参数
    const userId = req.query.id;
    if (userId) {
      // 假设从数据库获取用户数据
      // const user = await db.getUser(userId);
      // return res.status(200).json({ id: userId, name: `User ${userId}`, email: `user${userId}@example.com` });
      return res.status(200).json({ id: userId, name: `Retrieved User ${userId}` });
    } else {
      // 返回所有用户列表 (示例数据)
      return res.status(200).json([
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ]);
    }
  } else if (req.method === 'POST') {
    // 解析请求体
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    // 假设将新用户写入数据库
    // const newUser = await db.createUser({ name, email });
    return res.status(201).json({ message: 'User created successfully', user: { name, email } });
  } else {
    // 不支持其他 HTTP 方法
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

#### Python (`api/hello-py.py`)

```python
# api/hello-py.py
import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
      
        # 解析查询参数
        name = self.path.split('name=')[1] if 'name=' in self.path else 'World'
      
        response_data = {'message': f'Hello from Python Function, {name}!'}
        self.wfile.write(json.dumps(response_data).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))
      
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
      
        response_data = {'received_body': body, 'status': 'processed'}
        self.wfile.write(json.dumps(response_data).encode('utf-8'))
```

## 四、配置 Vercel Functions (`vercel.json`)

`vercel.json` 是 Vercel 项目的核心配置文件，允许你定制 Serverless Functions 的各种行为。

```json
{
  "functions": {
    // 针对所有 Node.js 函数的全局配置
    "api/**/*.ts": {
      "runtime": "nodejs18.x",    // 指定 Node.js 运行时版本 (例如 nodejs18.x, nodejs20.x)
      "memory": 256,              // 函数内存限制 (MB), 默认1024MB, 最小128MB
      "maxDuration": 10,          // 函数最大执行时间 (秒), 默认10s, 最大60s (Pro/Enterprise 可达300s)
      "includeFiles": "node_modules/**", // 明确包含的额外文件或目录
      "excludeFiles": "**/test/**"       // 明确排除的文件或目录
    },
    // 针对特定 Python 函数的配置覆盖
    "api/long-running-task.py": {
      "runtime": "python3.9",
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "env": {
    "DATABASE_URL": "@my_database_connection_string", // 引用 Vercel 秘密变量
    "STRIPE_SECRET_KEY": "@stripe_secret_key_prod", // 生产环境的 Stripe 密钥
    "VERCEL_ENV": "@vercel_env" // Vercel 自动注入的环境变量
  },
  "rewrites": [
    { "source": "/old-api-endpoint", "destination": "/api/new-api-function" },
    { "source": "/data/(.*)", "destination": "/api/data-handler" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }, // CORS 头
        { "key": "Cache-Control", "value": "s-maxage=3600, stale-while-revalidate" } // 缓存策略
      ]
    }
  ]
}
```

### 关键配置项详解

*   **`functions`**：定义函数特定的配置。
    *   **Glob 模式匹配**：可以使用 `**/*.ts` 或 `api/users.ts` 这样的模式来选择函数。
    *   **`runtime`**：指定函数的运行时版本。务必使用 Vercel 支持的精确版本字符串。
    *   **`memory`**：分配给函数的内存量。更高的内存通常意味着更快的 CPU 性能。
    *   **`maxDuration`**：函数可以运行的最长时间。超出此时间函数将被终止。
    *   **`includeFiles` / `excludeFiles`**：用于精细控制哪些文件被打包到 Serverless Function 中。这对于减小函数体积、提高冷启动速度和规避打包大小限制很有用。
*   **`env`**：在函数运行时可用的环境变量。
    *   **`@secret_name` 语法**：用于安全地引用 Vercel Dashboard 中设置的秘密变量，避免硬编码敏感信息。
    *   **作用域**：这些变量可以根据部署环境（生产、预览、开发）设置不同的值。
*   **`rewrites` / `redirects` / `headers`**：这些规则不仅适用于静态资产，也适用于 Serverless Functions。
    *   **`rewrites`**：将一个 URL 路径重写到另一个内部路径，但浏览器地址栏不变。常用于美化 API 路由或代理请求。
    *   **`headers`**：为匹配的路径添加自定义 HTTP 响应头，如 CORS、缓存策略等。

## 五、环境变量与秘密变量 (Environment Variables & Secrets)

在 Serverless Functions 中，安全地管理敏感信息至关重要。

1.  **Vercel Dashboard 管理**：
    *   所有敏感信息（如数据库连接字符串、API 密钥）都应在 Vercel 项目设置的 "Environment Variables" 页面中添加。
    *   选择变量的**作用域**：`Production` (生产部署)、`Preview` (预览部署)、`Development` (本地 `vercel dev`)。
    *   **秘密变量 (Secrets)**：默认添加的环境变量是安全的，只在构建时和函数运行时可用，不会暴露给客户端。
2.  **在代码中使用**：
    *   在 Node.js 函数中，通过 `process.env.<VARIABLE_NAME>` 访问。
    *   在 Python 函数中，通过 `os.environ.get('<VARIABLE_NAME>')` 访问。

```typescript
// api/secure-endpoint.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dbConnectionString = process.env.DATABASE_URL; // 安全获取数据库连接字符串
  const stripeSecret = process.env.STRIPE_SECRET_KEY; // 安全获取 Stripe 密钥

  if (!dbConnectionString || !stripeSecret) {
    console.error("Missing environment variables!");
    return res.status(500).json({ error: "Server configuration error." });
  }

  // ... 使用这些密钥进行安全操作
  res.status(200).json({ message: "Secure operation completed." });
}
```

## 六、Vercel Functions 的限制与最佳实践

### 6.1 常见限制

1.  **最大执行时间 (Max Duration)**：免费版默认 10 秒，Pro/Enterprise 计划最大 300 秒。不适合长时间运行的批量处理或计算密集型任务。
2.  **内存限制 (Memory Limit)**：默认 1024MB。如果函数需要处理大型数据或执行内存密集型操作，可能需要调整。
3.  **打包大小限制 (Bundle Size Limit)**：单个 Function 的压缩包大小有限制（通常是 50MB），包括所有代码和依赖。优化依赖项和使用 `includeFiles`/`excludeFiles` 很重要。
4.  **无状态性**：函数不保留状态，这要求所有持久化数据都存储在外部服务中。
5.  **文件系统只读**：除 `/tmp` 目录外，函数的文件系统是只读的。不要尝试写入文件。
6.  **冷启动 (Cold Starts)**：当函数长时间未被调用时，第一次请求需要额外时间来启动函数实例。Vercel 会尽力优化，但对于对延迟极其敏感的应用仍需考虑。

### 6.2 最佳实践

1.  **保持函数精简**：每个函数只负责一项核心任务，减少其复杂性和依赖。
2.  **优化依赖项**：只安装函数真正需要的依赖，使用 `excludeFiles` 移除不必要的开发依赖、测试文件等。
3.  **合理使用缓存**：利用 HTTP `Cache-Control` 头或 Vercel Edge Caching 来缓存函数响应，减少函数调用和提高响应速度。
    ```typescript
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=59');
    ```
4.  **管理数据库连接**：由于函数是无状态且可能并发执行的，避免在每个函数调用中创建新的数据库连接。
    *   在函数作用域外初始化数据库客户端，以利用连接池。
    *   使用支持 Serverless 架构的数据库服务（如 Vercel Postgres, Neon, PlanetScale, Supabase）或其连接池解决方案。
    ```typescript
    // api/db-query.ts
    // 在函数外部初始化 Prisma Client，以复用连接池
    const prisma = new PrismaClient();

    export default async function handler(req: VercelRequest, res: VercelResponse) {
      // ... 数据库操作
    }
    ```
5.  **错误处理与日志记录**：实现健壮的错误处理，并使用 `console.log` 等进行日志记录。这些日志可以在 Vercel Dashboard 中查看。
6.  **`vercel dev` 本地测试**：利用 `vercel dev` 命令在本地精确模拟 Vercel 环境，方便开发和调试。
7.  **异步任务管理 (`ctx.waitUntil`)**：对于不影响主响应但需要在请求结束后完成的异步任务（如发送分析数据、更新日志），在 Next.js API 路由中可以使用 `res.once('finish', async () => { ... })`，或在 Edge Function/Node.js Function 中使用 `context.waitUntil` (如果支持)。

## 七、与 Vercel 生态系统的集成

*   **Next.js API Routes**：Next.js 的 API 路由在 Vercel 上自动转换为 Serverless Functions，提供了无缝的全栈开发体验。
*   **Vercel KV (Key-Value Store)**：基于 Redis 的全球分布式键值存储，非常适合用作 Serverless Functions 的缓存或简单数据存储。
*   **Vercel Postgres**：基于 Neon 的 Serverless PostgreSQL 数据库，与 Vercel Functions 紧密集成。
*   **Vercel Blob**：用于存储图片、视频等非结构化数据的 Serverless 对象存储服务。
*   **Vercel Edge Config**：一种低延迟、全球分布式的键值存储，用于配置数据，在边缘 Functions 中秒级可用。
*   **Vercel Edge Functions**：在更靠近用户的 CDN 边缘网络运行的 Functions，启动速度更快、延迟更低，但功能限制更多，通常用于认证、A/B 测试、重写等。

## 八、总结

Vercel Serverless Functions 为现代 Web 开发提供了一个革命性的后端解决方案。它将后端逻辑的开发和部署简化到极致，让开发者能够专注于构建功能，而不是管理基础设施。通过其多语言支持、自动扩缩容、边缘部署和与 Vercel 生态系统的深度集成，Vercel Functions 是构建高性能、高可扩展性和低运维成本的全栈应用的理想选择。理解其工作原理、配置选项和限制，并遵循最佳实践，将帮助你充分发挥 Vercel Serverless Functions 的强大潜力。
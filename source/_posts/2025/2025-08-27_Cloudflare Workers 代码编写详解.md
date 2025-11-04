---
title: Cloudflare Workers 代码编写详解
date: 2025-08-27 06:24:00
tags:
  - 2025
  - Cloudflare
  - Serverless
  - 云服务
categories:
  - 开发工具
  - 云服务
---

> **Cloudflare Workers** 是一项基于 V8 引擎的 Serverless 平台，允许开发者在 Cloudflare 的全球网络边缘部署和运行 JavaScript、TypeScript 或 WebAssembly 代码。它将计算逻辑尽可能地靠近用户，从而极大地减少延迟，提高应用响应速度。Workers 的特点是超低延迟、高并发、易于部署和扩展，是构建现代无服务器应用的强大工具。

{% note info %}
核心思想：**Cloudflare Workers 允许开发者在 Cloudflare 的全球边缘网络上运行轻量级、高性能的无服务器函数。核心开发模式是编写符合 Service Worker API 或 ES Modules 规范的 JavaScript/TypeScript 代码，响应 HTTP 请求、与 KV 存储交互、执行自定义逻辑，并通过 Wrangler CLI 进行部署和管理。**
{% endnote %}
------

## 一、Cloudflare Workers 基础概念

1.  **边缘计算 (Edge Computing)**：Workers 代码运行在全球 275+ 个 Cloudflare 数据中心中的任何一个，靠近最终用户。
2.  **V8 引擎**：Workers 运行在与 Chrome 浏览器相同的 JavaScript 引擎 V8 上，提供快速的启动时间和高效的执行。
3.  **Service Worker API**：Workers 的编程模型受到 Web Service Worker API 的启发，主要通过监听 `fetch` 事件来处理 HTTP 请求。
4.  **ES Modules (ESM)**：Workers 支持 ES 模块语法，便于组织和复用代码。
5.  **无服务器 (Serverless)**：你无需管理服务器基础设施，Cloudflare 会自动处理扩展、维护和高可用性。
6.  **Wrangler CLI**：Cloudflare 提供的命令行工具，用于开发、测试和部署 Workers。

## 二、开发环境搭建

1.  **安装 Node.js 和 npm/yarn**：确保你的系统安装了 Node.js（推荐 LTS 版本）。
2.  **安装 Wrangler CLI**：
    ```bash
    npm install -g wrangler
    # 或者
    yarn global add wrangler
    ```
3.  **登录 Cloudflare (一次性操作)**：
    ```bash
    wrangler login
    ```
    这会引导你通过浏览器登录 Cloudflare 账号，并授权 Wrangler 访问你的资源。
4.  **创建新的 Workers 项目**：
    ```bash
    wrangler generate my-worker-app # 创建一个名为 my-worker-app 的新项目
    cd my-worker-app
    ```
    Wrangler 会为你生成一个包含基础文件的项目结构，包括 `src/index.ts`（或 `src/index.js`）、`wrangler.toml` 等。

## 三、Cloudflare Workers 代码结构与事件处理

### 3.1 核心事件：`fetch`

Workers 最常见的用途是拦截和响应 HTTP 请求。这通过监听全局的 `fetch` 事件来实现，类似于 Service Worker。

**JavaScript 示例 (`src/index.js`)：**

```javascript
// 监听 fetch 事件，当请求到达 Workers 时触发
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * 处理传入的 HTTP 请求
 * @param {Request} request
 * @returns {Response}
 */
async function handleRequest(request) {
  // 简单的 Hello World 响应
  if (request.url.endsWith('/hello')) {
    return new Response('Hello from Cloudflare Workers!', { status: 200 });
  }

  // 代理请求到另一个源站
  if (request.url.endsWith('/proxy')) {
    const upstreamUrl = 'https://example.com'; // 目标源站
    const newRequest = new Request(upstreamUrl, request); // 使用原始请求的 method/headers/body
    return fetch(newRequest); // 发送请求并返回响应
  }

  // 默认响应
  return new Response('Welcome to my Worker!', { status: 200 });
}
```

### 3.2 ES Modules 风格 (推荐)

现代 Workers 推荐使用 ES Modules 语法，它更清晰，更符合标准。

**TypeScript 示例 (`src/index.ts`)：**

```typescript
// 定义一个接口，用于表示Workers的环境变量（如果定义了的话）
interface Env {
  MY_KV_NAMESPACE: KVNamespace; // 假设绑定了一个KV存储
  MY_SECRET_KEY: string; // 假设绑定了一个秘密变量
}

// 默认导出，作为Workers的入口
export default {
  /**
   * Workers fetch 事件处理函数
   * @param request 传入的 Request 对象
   * @param env Workers 运行时环境变量 (绑定了KV、Secret等)
   * @param ctx 事件上下文，包含waitUntil等方法
   * @returns Promise<Response>
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. 路由判断
    if (url.pathname === '/hello') {
      return new Response('Hello from Cloudflare Workers (ESM)!', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // 2. 处理 POST 请求示例
    if (url.pathname === '/submit' && request.method === 'POST') {
      try {
        const body = await request.json(); // 解析 JSON 请求体
        console.log('Received JSON:', body);
        // 可以在这里进行数据处理，比如写入KV
        await env.MY_KV_NAMESPACE.put('last_submission', JSON.stringify(body));

        return new Response(JSON.stringify({ message: 'Data received and saved!' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response('Invalid JSON body', { status: 400 });
      }
    }

    // 3. 读取 KV 存储示例
    if (url.pathname === '/data') {
      const storedValue = await env.MY_KV_NAMESPACE.get('last_submission');
      if (storedValue) {
        return new Response(storedValue, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response('No data found in KV.', { status: 404 });
      }
    }

    // 4. 使用秘密变量示例
    if (url.pathname === '/secret') {
      // 生产环境中，不要直接返回秘密变量！这里仅作演示。
      return new Response(`Your secret is: ${env.MY_SECRET_KEY}`, { status: 200 });
    }

    // 5. 默认代理到其他站点
    // 例如，将所有其他请求代理到 Cloudflare 的官网
    const upstreamUrl = 'https://www.cloudflare.com';
    const newRequest = new Request(upstreamUrl + url.pathname + url.search, request);
    return fetch(newRequest);
  },
};

// Cloudflare Workers 运行时环境还提供一些其他事件处理，例如 scheduled 事件
// export const scheduled: ExportedHandlerScheduled = async (event, env, ctx) => {
//   // 处理定时任务
//   console.log('Scheduled event triggered:', event.cron);
//   ctx.waitUntil(doSomeBackgroundTask(env));
// };
```

## 四、Workers 环境变量与绑定 (Bindings)

Workers 可以通过绑定访问各种外部资源和服务，这些都在 `wrangler.toml` 文件中配置。

### 4.1 `wrangler.toml` 配置

`wrangler.toml` 是 Workers 项目的配置文件，定义了 Workers 的名称、类型、路由、环境变量、绑定等。

```toml
name = "my-worker-app"
main = "src/index.ts" # Workers 代码入口
compatibility_date = "2023-11-21" # 兼容性日期，用于启用最新功能和行为
compatibility_flags = ["nodejs_compat"] # 启用 Node.js 兼容性 API (可选)

# 定义路由，Workers 将在这些路由下运行
routes = [
  { pattern = "my-worker-app.yourdomain.com/*", zone_id = "<YOUR_ZONE_ID>" }
]

# KV 命名空间绑定
[[kv_namespaces]]
binding = "MY_KV_NAMESPACE" # 在 Workers 代码中通过 env.MY_KV_NAMESPACE 访问
id = "YOUR_KV_NAMESPACE_ID" # KV 命名空间的 ID，在 Cloudflare 后台创建

# 秘密变量 (Secrets) 绑定
# 在 Wrangler CLI 中设置: wrangler secret put MY_SECRET_KEY
[[vars]]
MY_API_KEY = "YOUR_API_KEY_VALUE" # 普通环境变量 (明文)

# R2 存储绑定
# [[r2_buckets]]
# binding = "MY_BUCKET"
# bucket_name = "your-r2-bucket-name"

# D1 数据库绑定
# [[d1_databases]]
# binding = "DB"
# database_name = "my-database"
# database_id = "<YOUR_DATABASE_ID>"

# 定时触发器 (CRON Triggers)
# [[triggers]]
# crons = ["0 * * * *"] # 每小时触发一次
```

### 4.2 访问绑定

在 Workers 代码中，绑定的资源（如 `KVNamespace`、`R2Bucket`、`D1Database`）会作为 `env` 对象的属性传递给 `fetch` 函数。

```typescript
// src/index.ts
interface Env {
  MY_KV_NAMESPACE: KVNamespace;
  MY_SECRET_KEY: string; // 由 wrangler secret put 设置
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 使用 KV 存储
    await env.MY_KV_NAMESPACE.put('key', 'value');
    const value = await env.MY_KV_NAMESPACE.get('key');

    // 使用秘密变量
    const secret = env.MY_SECRET_KEY;
    // ...
  },
};
```

## 五、Workers 的常用功能和 API

### 5.1 KV 存储 (Key-Value Store)

*   **功能**：一个全球分布式的键值存储系统，适用于存储小到中等大小的、非结构化数据。
*   **用途**：缓存数据、存储用户配置、动态内容等。
*   **API**：`env.MY_KV_NAMESPACE.put(key, value, options)`，`get(key, options)`，`delete(key)`，`list(options)`。

```typescript
// 写入
await env.MY_KV_NAMESPACE.put('my-key', 'my-value', { expirationTtl: 60 }); // 60秒过期
// 读取
const value = await env.MY_KV_NAMESPACE.get('my-key');
// 读取并返回 JSON
const jsonValue = await env.MY_KV_NAMESPACE.get('my-json-key', 'json');
```

### 5.2 R2 存储 (Object Storage)

*   **功能**：兼容 S3 的对象存储服务，适用于存储大文件、静态资产等。零出口费用。
*   **用途**：托管图片、视频、文件下载等。
*   **API**：`env.MY_BUCKET.put(key, value, options)`，`get(key)`，`delete(key)`，`list(options)`。

```typescript
// 写入
await env.MY_BUCKET.put('image.png', imageBuffer, { httpMetadata: { contentType: 'image/png' } });
// 读取
const object = await env.MY_BUCKET.get('image.png');
if (object) {
  const body = await object.arrayBuffer(); // 或 text(), json(), blob(), readableStream()
  // ...
}
```

### 5.3 D1 数据库 (SQLite)

*   **功能**：一个基于 SQLite 的 Serverless 数据库，部署在 Cloudflare 边缘。
*   **用途**：轻量级关系型数据存储。
*   **API**：`env.DB.prepare(sql).bind(...values).run()`，`all()`，`first()`。

```typescript
// 执行 D1 查询
const { results } = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(1).all();
console.log(results);

// 插入
await env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)').bind('Alice', 'alice@example.com').run();
```

### 5.4 Durable Objects (有状态 Serverless)

*   **功能**：提供强一致性、高并发的有状态 Serverless 范式。每个 Durable Object 实例都有一个唯一的 ID，并且可以在全球唯一的 Workers 节点上运行，处理所有针对该 ID 的请求。
*   **用途**：实时协作应用、游戏状态、WebSocket 连接管理、分布式锁等。
*   **API**：通过绑定 `DurableObjectNamespace`，然后获取 `id` 和 `stub` 来与 Durable Object 实例交互。

```typescript
// 定义 Durable Object 类
export class MyDurableObject {
  state: DurableObjectState;
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }
  async fetch(request: Request) {
    // ... Durable Object 内部逻辑
    const count = (await this.state.storage.get('count')) || 0;
    await this.state.storage.put('count', count + 1);
    return new Response(`Count: ${count + 1}`);
  }
}

// 在 Workers 中使用 Durable Object
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const id = env.MY_DO_NAMESPACE.idFromName('singleton-id'); // 获取唯一ID
    const stub = env.MY_DO_NAMESPACE.get(id); // 获取 Stub
    return stub.fetch(request); // 将请求转发给 Durable Object
  }
}
```

## 六、部署与测试

1.  **本地开发服务器**：
    ```bash
    wrangler dev
    ```
    这会在本地启动一个开发服务器，并将你的 Workers 部署到 Cloudflare 的开发预览环境，你可以通过浏览器访问。代码修改后会自动刷新。
2.  **部署到生产环境**：
    ```bash
    wrangler deploy
    ```
    这会将你的 Workers 代码部署到 Cloudflare 的生产环境。如果 `wrangler.toml` 中定义了 `routes`，Workers 将开始处理这些路由下的请求。

## 七、安全性与最佳实践

1.  **最小权限原则**：只为 Workers 绑定它需要的资源和权限。
2.  **环境变量和秘密**：敏感信息（API 密钥、数据库凭证）绝不能硬编码到代码中。使用 `wrangler secret put` 或 `[[vars]]` 在 `wrangler.toml` 中配置。
3.  **输入验证**：始终验证来自客户端的输入，防止 XSS、SQL 注入等攻击。
4.  **错误处理**：实现健壮的错误处理机制，返回有意义的错误响应，并进行日志记录。
5.  **日志记录**：使用 `console.log()` 或其他日志服务进行调试和监控。Cloudflare Workers 提供了日志查看功能。
6.  **代码组织**：对于复杂的 Workers，将代码分解为多个模块，提高可维护性。
7.  **性能优化**：Workers 运行在边缘，通常很快。但仍需注意避免不必要的网络请求，优化计算逻辑。善用缓存（`Cache` API）。
8.  **`waitUntil(promise)`**：在 `fetch` 事件处理器中，如果有一些异步操作（如日志记录、发送分析数据）不影响主响应，但希望它们能在请求结束后完成，可以使用 `ctx.waitUntil()`。

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const response = new Response('Hello!');
    // 在响应发出后，继续执行这个异步任务
    ctx.waitUntil(
      fetch('https://api.example.com/log', {
        method: 'POST',
        body: JSON.stringify({ url: request.url, status: response.status }),
      })
    );
    return response;
  }
}
```

## 八、总结

Cloudflare Workers 提供了一个强大、灵活且高性能的平台，用于在边缘部署和运行无服务器代码。其核心是基于 Service Worker API 或 ES Modules 的 `fetch` 事件处理机制，配合 `wrangler.toml` 配置各种绑定，可以轻松地与 KV、R2、D1、Durable Objects 等服务集成。通过理解 Workers 的基本概念、代码结构、环境变量和各种 API，开发者可以构建出低延迟、高可扩展的全球化应用。
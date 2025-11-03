---
title: 在 Vercel 开发 Next.js 应用详解
date: 2024-03-12 06:24:00
tags:
  - 2024
  - Vercel
  - Serverless
  - 云服务
categories:
  - 开发工具
  - 云服务
---

> **Vercel** 是 Next.js 的创建者，也是一个领先的云平台，专为部署和扩展 Web 应用程序而设计，特别是针对 Next.js 应用。它提供了一站式的开发、预览和部署工作流，集成了 Git 仓库，并支持无服务器功能、全球 CDN、自动 SSL 等，极大地简化了 Next.js 应用的部署和管理。

{% note info %}
核心思想：**在 Vercel 上开发 Next.js 应用，核心在于利用 Vercel 与 Next.js 的深度集成，实现从代码提交到全球部署的自动化工作流。这包括使用 Next.js 的特性（如数据获取、API 路由），配置 Vercel 项目，利用其预览部署、环境变量、无服务器函数等功能，实现高效且可扩展的开发和部署。**
{% endnote %}
------

## 一、Next.js 基础

在深入 Vercel 之前，确保你对 Next.js 的核心概念有所了解：

*   **文件系统路由 (File-system Routing)**：根据 `pages` (或 `app` 目录) 目录结构自动生成路由。
*   **数据获取 (Data Fetching)**：
    *   `getServerSideProps` (SSR): 服务端渲染，每次请求生成页面。
    *   `getStaticProps` (SSG): 静态站点生成，构建时生成页面，支持 `revalidate` 增量静态再生 (ISR)。
    *   `getStaticPaths` (SSG): 配合 `getStaticProps` 生成动态路由的静态路径。
    *   **App Router**: `async/await` 组件，`fetch` 请求默认为 SSR 或 SSG。
*   **API 路由 (API Routes)**：在 `pages/api` (或 `app/api`) 中创建后端无服务器函数。
*   **CSS Modules / Styled-JSX / Tailwind CSS**：内置的样式支持。
*   **图片优化 (Image Optimization)**：`next/image` 组件。

## 二、Vercel 项目设置

### 2.1 创建 Next.js 应用

首先，使用 Create Next App 创建一个新的 Next.js 项目：

```bash
npx create-next-app@latest my-next-app --typescript --eslint --app # 或者 --pages
cd my-next-app
npm run dev # 运行开发服务器
```

### 2.2 连接 Git 仓库

将你的 Next.js 项目推送到一个 Git 仓库（GitHub, GitLab, Bitbucket）。

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/my-next-app.git
git push -u origin main
```

### 2.3 在 Vercel 上创建项目

1.  访问 [Vercel.com](https://vercel.com/) 并注册/登录。
2.  点击 "Add New..." -> "Project"。
3.  选择你刚才推送的 Git 仓库，点击 "Import"。
4.  Vercel 会自动检测这是一个 Next.js 项目，并预设构建和输出配置。
    *   **Root Directory (根目录)**：如果你的 Next.js 应用不在仓库根目录，这里需要指定。
    *   **Framework Preset (框架预设)**：Vercel 会自动选择 `Next.js`。
    *   **Build Command (构建命令)**：`next build` (默认)。
    *   **Output Directory (输出目录)**：`public` (默认)。
5.  点击 "Deploy"。Vercel 会自动拉取代码，执行构建，并部署你的应用。

### 2.4 自动部署与预览分支

一旦项目设置完成，Vercel 会自动：

*   **生产部署 (Production Deployment)**：当你向主分支 (通常是 `main` 或 `master`) 提交代码时，Vercel 会自动构建并部署到生产环境。
*   **预览部署 (Preview Deployment)**：当你创建新的分支并推送代码，或者创建 Pull Request (PR) 时，Vercel 会为每个分支或 PR 自动创建一个独立的预览部署。这允许你在合并到主分支之前测试新功能。

## 三、Vercel 特性在 Next.js 中的应用

Vercel 与 Next.js 的深度集成，意味着 Next.js 的许多特性在 Vercel 上都能得到最佳实践。

### 3.1 无服务器函数 (Serverless Functions)

Next.js 的 **API 路由** 在 Vercel 上自动部署为 **无服务器函数 (Serverless Functions)**。

*   **工作方式**：每个 `pages/api/*.ts` (或 `app/api/*.ts`) 文件都会被编译成一个独立的 Serverless 函数。
*   **优势**：按需付费、自动扩缩容、无需管理服务器。
*   **最佳实践**：
    *   保持函数轻量：每个函数只处理一个或少数相关任务。
    *   无状态：确保函数是无状态的，方便扩缩容。
    *   使用环境变量：敏感信息通过 Vercel 的环境变量管理。

```typescript
// pages/api/hello.ts (Pages Router)
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ name: 'John Doe' });
}

// app/api/hello/route.ts (App Router)
export async function GET(request: Request) {
  return new Response('Hello, Next.js!');
}
```

### 3.2 环境变量 (Environment Variables)

Vercel 提供了一个安全的 UI 界面来管理环境变量，这些变量可以在构建时或运行时注入到你的 Next.js 应用中。

1.  **在 Vercel 后台设置**：进入你的项目设置 -> "Environment Variables"。
2.  **类型**：
    *   **Build Time**：在构建应用时可用的变量（例如 `NEXT_PUBLIC_ANALYTICS_ID`）。
    *   **Runtime**：在 Serverless 函数运行时可用的变量（例如数据库连接字符串）。
3.  **Scoped (作用域)**：可以为不同的环境（生产、预览、开发）设置不同的变量值。

**在 Next.js 代码中使用：**

*   **客户端/公共环境变量**：必须以 `NEXT_PUBLIC_` 开头。
    ```typescript
    // 在客户端和服务器端都可用
    console.log(process.env.NEXT_PUBLIC_ANALYTICS_ID);
    ```
*   **服务器端环境变量**：不以 `NEXT_PUBLIC_` 开头，只在服务器端代码（`getServerSideProps`, API 路由等）中可用。
    ```typescript
    // 只在服务器端可用
    console.log(process.env.DATABASE_URL);
    ```

### 3.3 数据获取与渲染策略

Vercel 对 Next.js 的各种数据获取方法提供了原生支持：

*   **SSG (`getStaticProps`, `getStaticPaths`)**：
    *   在构建时生成 HTML，文件存储在 Vercel 的全球 CDN 上，访问速度极快。
    *   支持 **Incremental Static Regeneration (ISR)**：通过 `revalidate` 选项，可以在部署后定期重新生成页面，实现静态页面的动态更新，而无需重新部署整个应用。
    ```typescript
    export async function getStaticProps() {
      // ... 获取数据
      return {
        props: { data },
        revalidate: 60, // 每 60 秒重新验证一次数据
      };
    }
    ```
*   **SSR (`getServerSideProps`)**：
    *   每次请求都在 Vercel 的 Serverless Functions 上执行，生成 HTML。
    *   适用于需要实时数据的页面。
*   **App Router (`fetch` 缓存机制)**：
    *   App Router 引入了新的数据获取和缓存机制。
    *   `fetch` 请求默认可缓存，Vercel 会智能地处理这些缓存。
    *   默认情况下，`fetch` 是 SSR 行为，但也可以通过 `revalidate` 选项实现类似 ISR 的行为。

### 3.4 域名与 SSL

Vercel 自动化了域名配置和 SSL 证书管理：

1.  **Custom Domains (自定义域名)**：在 Vercel 项目设置中，可以轻松添加自定义域名。
2.  **Automatic SSL**：Vercel 自动为所有域名（包括预览域名）颁发和续订 Let's Encrypt SSL 证书，无需手动操作。
3.  **Global CDN**：你的 Next.js 应用（尤其是静态资产和 SSG 页面）会自动部署到 Vercel 的全球 CDN 上，提供极低的延迟。

### 3.5 边缘缓存 (Edge Caching)

Vercel 自动缓存 Next.js 应用程序的静态内容和 SSG 页面，并将其分发到全球边缘网络。

*   对于 `getStaticProps` 生成的页面，Vercel 会在构建后直接缓存。
*   对于带有 `revalidate` 的 ISR 页面，Vercel 也会进行边缘缓存，并在过期后触发重新生成。
*   对于 API 路由或 `getServerSideProps`，你可以通过设置响应头（如 `Cache-Control`）来控制 CDN 缓存行为。

```typescript
// pages/api/cached-data.ts
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // 缓存 60 秒，并在后台重新验证
  res.status(200).json({ timestamp: new Date().toISOString() });
}
```

### 3.6 Monorepo 支持

如果你的 Next.js 应用是 Monorepo 中的一部分（例如使用 Nx 或 Turborepo），Vercel 也能很好地支持：

*   在 Vercel 项目设置中，指定你的 Next.js 应用的 `Root Directory`。
*   Vercel 会自动检测 Monorepo，并只构建相关的项目。

## 四、开发工作流与调试

### 4.1 本地开发

*   使用 `npm run dev` 在本地运行 Next.js 应用。
*   使用 `wrangler login` 和 `wrangler dev` (针对 Workers) 等 CLI 工具辅助开发。

### 4.2 预览部署 (Preview Deployments)

*   **快速反馈**：每个 Git 分支和 PR 都有独立的预览 URL，团队成员和客户可以即时查看和测试新功能。
*   **环境隔离**：预览部署有独立的 URL 和可能不同的环境变量（如果你配置了的话），确保与生产环境隔离。
*   **Git 集成**：Vercel 会在 PR 中自动添加部署状态和链接。

### 4.3 生产部署 (Production Deployments)

*   一旦 PR 合并到主分支，Vercel 会自动触发生产部署。
*   Vercel 提供原子部署，确保网站始终在线，没有停机时间。
*   支持部署回滚：如果生产部署出现问题，可以一键回滚到之前的版本。

### 4.4 调试与监控

*   **Vercel Dashboard**：提供部署日志、函数执行日志 (Serverless Functions Logs)、带宽使用情况等。
*   **Build Logs**：在每次构建失败时，可以查看详细的构建日志来诊断问题。
*   **Function Logs**：Serverless 函数的 `console.log` 输出会出现在这里。
*   **Vercel Analytics**：提供开箱即用的 Web 性能指标和访客分析。

## 五、总结与最佳实践

在 Vercel 上开发 Next.js 应用是一个高效且现代的工作流程。利用 Vercel 与 Next.js 的深度集成，你可以：

1.  **自动化部署**：通过 Git 提交实现自动化的 CI/CD。
2.  **极速性能**：利用全球 CDN、边缘缓存和 Serverless Functions 带来低延迟和高响应速度。
3.  **简化运维**：无需管理服务器、SSL 证书或 CDN 配置。
4.  **提升协作**：通过预览部署，团队可以更快地迭代和审查新功能。

**最佳实践：**

*   **充分利用 Next.js 特性**：根据数据更新频率和用户体验需求，合理选择 SSG、SSR 或 ISR。
*   **环境变量隔离**：为不同的环境（生产、预览、开发）配置不同的环境变量，确保安全和灵活性。
*   **优化 Serverless Functions**：保持 API 路由函数精简，避免长时间运行的任务。
*   **监控与日志**：定期检查 Vercel Dashboard 上的日志和性能指标，及时发现并解决问题。
*   **代码审查**：结合 Vercel 的预览部署流程，在合并到主分支前，充分进行代码审查和测试。

通过这些实践，你可以充分发挥 Vercel 和 Next.js 的强大能力，构建和部署高性能、可扩展的 Web 应用。
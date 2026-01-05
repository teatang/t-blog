---
title: PM2 (Process Manager 2) 详解
date: 2024-04-21 06:24:00
tags:
  - 2024
  - 前端技术
  - Node.js
  - JavaScript
categories:
  - 前端技术
  - Node.js
---
> **PM2 (Process Manager 2)** 是一个功能丰富的、生产就绪的 Node.js 应用进程管理器，它专注于提供高可用性、简化部署和自动化运维。它通过监控应用状态、自动重启崩溃进程、实现零停机重新加载和内置负载均衡来确保 Node.js 应用的健壮运行。PM2 是部署 Node.js 应用到生产环境的推荐工具之一。

{% note info %}
核心思想：**PM2 将 Node.js 应用作为一个守护进程 (daemon) 托管，负责其生命周期管理。它能够自动处理应用崩溃、实现多核 CPU 利用 (集群模式)、简化日志管理和提供实时监控，从而保证应用服务的持续稳定运行。**
{% endnote %}
------

## 一、为什么需要 PM2？

传统的 Node.js 应用启动方式通常是 `node app.js`。这种方式在生产环境中存在诸多问题：

1.  **单点故障 (Single Point of Failure)**：如果应用进程因为未捕获的异常崩溃，整个服务将停止，用户无法访问。
2.  **资源利用不足**：Node.js 默认是单线程模型，即使服务器有多个 CPU 核心，一个 `node app.js` 进程也只能利用其中一个核心，无法充分利用硬件资源来处理高并发请求。
3.  **零停机部署困难**：当需要更新代码并重启服务时，传统方法会中断服务，导致用户体验受损。
4.  **日志管理不便**：应用的标准输出和错误输出需要被收集、管理和持久化。
5.  **缺乏监控**：无法方便地实时了解应用的 CPU、内存使用情况及其他性能指标。
6.  **进程管理复杂**：手动维护多个应用进程的启动、停止、重启、状态检查非常繁琐。

PM2 旨在解决这些问题，提供一套全面的解决方案。

## 二、PM2 是什么？

PM2 是一个用 JavaScript 编写的开源进程管理器。它以守护进程的形式在后台运行，并负责：

*   **进程守护**：当 Node.js 应用崩溃时，PM2 会自动重启它。
*   **集群管理**：能够以集群模式启动多个应用实例，充分利用多核 CPU，实现负载均衡。
*   **零停机部署**：支持平滑重启，在更新应用代码时，不会中断服务。
*   **日志管理**：统一收集应用的标准输出和错误输出，支持日志分割。
*   **资源监控**：提供实时的 CPU、内存使用率、请求数等监控数据。
*   **自动化**：可以通过配置文件进行批量管理和自动化操作。

## 三、PM2 核心特性

### 3.1 自动重启 (Auto-Restart)

PM2 会监控你的应用进程，一旦它崩溃或非正常退出，PM2 会立即尝试重启它。这极大地提高了应用的健壮性和可用性。

*   **`--watch` 模式**：可以配置 PM2 监控文件变化，当代码文件发生改变时，自动重启应用，这在开发环境中非常有用。

### 3.2 零停机重新加载 (Zero Downtime Reload)

这是 PM2 最重要的生产特性之一。当你的应用代码更新后，使用 `pm2 reload` 命令可以实现平滑重启。其工作原理大致如下：

1.  PM2 会启动新的应用实例（带着新代码）。
2.  等待新的实例成功启动并准备就绪。
3.  然后逐步关闭旧的应用实例。

这样，在整个过程中，总会有至少一个应用实例在运行，确保服务不中断。

### 3.3 集群模式 (Cluster Mode)

利用 Node.js 内置的 `cluster` 模块，PM2 能够将你的应用以多进程的方式运行，每个进程监听同一个端口。PM2 会在这些进程之间自动进行负载均衡，将传入请求分发到不同的子进程处理。这使得你的 Node.js 应用能够充分利用服务器的多核 CPU 资源，显著提升吞吐量和并发处理能力。

*   `pm2 start app.js -i max`：根据 CPU 核心数启动最大数量的实例。
*   `pm2 start app.js -i <number>`：启动指定数量的实例。

### 3.4 日志管理 (Log Management)

PM2 能够统一管理所有由应用进程产生的日志（`stdout` 和 `stderr`）。

*   可以指定日志文件路径。
*   支持日志分割 (log rotation)，防止单个日志文件过大。
*   支持时间格式化日志输出。

### 3.5 实时监控 (Real-time Monitoring)

通过 `pm2 monit` 命令，你可以获得一个实时的仪表盘，显示所有被管理应用的 CPU 使用率、内存占用、重启次数、每秒请求数等关键指标。

### 3.6 启动脚本生成 (Startup Script Generation)

PM2 可以生成启动脚本，确保在服务器重启后，你的应用能够自动启动并被 PM2 管理。

### 3.7 环境变量 (Environment Variables)

PM2 允许你为不同的应用实例或不同的环境设置特定的环境变量，这对于配置管理和多环境部署非常方便。

## 四、PM2 基本用法 (CLI)

### 4.1 安装 PM2

PM2 通常作为全局模块安装：

```bash
npm install pm2 -g
# 或
yarn global add pm2
```

### 4.2 启动应用

最简单的启动方式：

```bash
pm2 start app.js
```

启动并命名应用：

```bash
pm2 start app.js --name my-app-name
```

以集群模式启动应用，实例数量为 CPU 核心数：

```bash
pm2 start app.js -i max
# 或指定实例数量
pm2 start app.js -i 4
```

启动并监控文件变化 (开发环境常用)：

```bash
pm2 start app.js --watch
```

### 4.3 查看应用状态

列出所有被 PM2 管理的应用：

```bash
pm2 list
# 或 pm2 ls
```

查看某个应用的详细状态：

```bash
pm2 describe <app-name|id>
```

### 4.4 监控应用

实时查看应用的 CPU、内存、日志等信息：

```bash
pm2 monit
```

### 4.5 停止、重启、删除应用

```bash
pm2 stop <app-name|id>     # 停止应用
pm2 restart <app-name|id>  # 重启应用
pm2 reload <app-name|id>   # 平滑重启应用 (零停机)
pm2 delete <app-name|id>   # 停止并从 PM2 列表中删除应用
pm2 stop all               # 停止所有应用
pm2 restart all            # 重启所有应用
pm2 reload all             # 平滑重启所有应用
pm2 delete all             # 删除所有应用
```

### 4.6 查看日志

查看应用的实时日志：

```bash
pm2 logs [app-name|id]
pm2 logs --lines 100 # 查看最近100行
pm2 logs --raw       # 查看原始日志
```

清除所有日志文件：

```bash
pm2 flush
```

### 4.7 配置开机自启

生成启动脚本，以便服务器重启后 PM2 自动启动：

```bash
pm2 startup           # 根据操作系统生成启动命令，你需要复制并执行它
pm2 save              # 保存当前 PM2 进程列表，以便开机时恢复
```

## 五、PM2 配置文件 (Ecosystem File)

对于复杂的项目或管理多个应用，使用配置文件 (`ecosystem.config.js` 或 `.json`) 是最佳实践。它允许你声明式地定义所有应用及其配置。

### 5.1 生成配置文件

```bash
pm2 init                 # 生成 ecosystem.config.js 模板文件
```

### 5.2 `ecosystem.config.js` 示例

这是一个典型的 `ecosystem.config.js` 文件结构：

```javascript
module.exports = {
  apps : [{
    name      : 'my-api',         // 应用名称
    script    : 'src/app.js',     // 应用入口文件
    instances : 'max',            // 启动实例数，'max' 会根据 CPU 核心数自动调整
    exec_mode : 'cluster',        // 执行模式：'fork' (单进程) 或 'cluster' (多进程)
    watch     : true,             // 开启文件监控，文件变化自动重启
    ignore_watch : ["node_modules", "logs", "uploads"], // 忽略监控的目录/文件
    env: {                        // 默认环境变量
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production : {            // 生产环境特有环境变量
      NODE_ENV: 'production',
      PORT: 80,
      DB_HOST: 'production-db.example.com'
    },
    env_staging : {               // 预发布环境特有环境变量
      NODE_ENV: 'staging',
      PORT: 8080,
      DB_HOST: 'staging-db.example.com'
    },
    error_file : 'logs/err.log',  // 错误日志文件
    out_file   : 'logs/out.log',  // 标准输出日志文件
    log_date_format : "YYYY-MM-DD HH:mm:ss", // 日志日期格式
    max_memory_restart : '200M',  // 当内存超过 200MB 时重启
    // min_uptime: '10s',           // 应用至少运行10秒才算稳定
    // max_restarts: 3,             // 最多重启3次
    // restart_delay: 1000,         // 重启延迟1秒
    // cron_restart: '0 0 * * *',   // 每天午夜重启
    // post_update: "npm install && pm2 reload all", // 部署后执行的命令
    // merge_logs: true,            // 合并所有实例的日志到一个文件
    // combine_logs: true,          // 同上，用于旧版本PM2
  }, {
    name   : "worker-queue",      // 另一个应用，例如一个队列处理器
    script : "src/worker.js",
    instances : 1,
    exec_mode : "fork",
    // 更多配置...
  }]
};
```

### 5.3 使用配置文件启动应用

```bash
# 启动配置文件中定义的所有应用
pm2 start ecosystem.config.js

# 启动配置文件中指定环境的应用
pm2 start ecosystem.config.js --env production
pm2 start ecosystem.config.js --env staging
```

## 六、PM2 集群模式详解

在 Node.js 中，`cluster` 模块允许创建共享同一服务器端口的子进程。PM2 的集群模式正是基于此。

**工作原理：**

1.  **主进程 (Master Process)**：PM2 充当主进程，负责管理和监控工作进程。
2.  **工作进程 (Worker Processes)**：PM2 会根据配置（例如 `-i max`）启动多个 Node.js 实例，这些实例就是工作进程。它们共享同一个服务器端口，并由 PM2 主进程进行负载均衡。
3.  **请求分发**：当一个 HTTP 请求到达服务器时，PM2 的主进程会将其分发给一个空闲的工作进程处理。
4.  **容错**：如果某个工作进程崩溃，PM2 会检测到并自动重启一个新的工作进程，而不会影响其他正在运行的工作进程，从而实现高可用性。

{% mermaid %}
graph LR
    A[Client Request] --> B(PM2 Master Process)
    B -- Load Balances Requests --> C(Node.js Worker 1)
    B -- Load Balances Requests --> D(Node.js Worker 2)
    B -- Load Balances Requests --> E(Node.js Worker N)
    C -- Process Request --> F[Response]
    D -- Process Request --> G[Response]
    E -- Process Request --> H[Response]

    subgraph PM2 Management Layer
        B
        B -- Monitors & Restarts --> C
        B -- Monitors & Restarts --> D
        B -- Monitors & Restarts --> E
    end
{% endmermaid %}

**优点：**

*   **最大化 CPU 利用率**：充分利用多核 CPU，提高应用吞吐量。
*   **高可用性**：一个实例崩溃不会导致整个服务中断。
*   **内置负载均衡**：无需额外的 Nginx 等反向代理层即可实现进程间的请求分发。

**考虑点：**

*   **Session 管理**：如果你的应用依赖于内存中的 Session，集群模式下需要考虑 Session 共享问题（例如使用 Redis 等外部存储）。否则，用户请求被分发到不同实例可能导致 Session 丢失。
*   **共享资源**：确保所有实例都能正确访问数据库、文件系统等共享资源。

## 七、最佳实践

1.  **使用配置文件**：始终使用 `ecosystem.config.js` 来管理应用配置，尤其是生产环境。
2.  **利用集群模式**：对于 CPU 密集型或高并发应用，务必使用 `-i max` 或指定实例数的集群模式。
3.  **日志管理**：配置 `error_file` 和 `out_file`，并考虑使用 `log_rotate` 等工具进行日志切割和归档。
4.  **配置开机自启**：使用 `pm2 startup` 和 `pm2 save` 确保服务器重启后应用能自动恢复。
5.  **环境变量分离**：使用 `env`、`env_production` 等字段管理不同环境的配置，不要将敏感信息硬编码到代码中。
6.  **零停机部署**：更新代码后使用 `pm2 reload <app-name>` 进行平滑重启。
7.  **监控**：定期使用 `pm2 monit` 检查应用状态，或结合 Prometheus/Grafana 等工具进行更深入的监控。
8.  **Graceful Shutdown**：在 Node.js 应用中，监听 `SIGINT` (Ctrl+C) 或 `SIGTERM` (PM2 reload/stop 发送) 信号，在进程退出前执行清理工作（如关闭数据库连接、保存未完成的任务），确保数据完整性。
    ```javascript
    // app.js 或其他入口文件
    process.on('SIGINT', () => {
      console.log('Received SIGINT. Closing server...');
      // 执行清理工作，例如：
      // server.close(() => {
      //   console.log('Server closed. Exiting process.');
      //   process.exit(0);
      // });
      // 如果没有 server.close，直接退出
      process.exit(0);
    });
    ```

## 八、总结

PM2 是 Node.js 生产部署中不可或缺的工具。它将复杂的进程管理、负载均衡、高可用性和监控功能封装起来，以简单直观的 CLI 命令和声明式配置文件呈现给开发者。无论是小型项目还是大型微服务架构，PM2 都能显著提升 Node.js 应用的稳定性和运行效率。掌握 PM2 的使用，是每个 Node.js 开发者进阶生产环境部署的关键技能。
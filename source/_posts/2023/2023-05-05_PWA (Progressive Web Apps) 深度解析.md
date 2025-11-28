---
title: PWA (Progressive Web Apps) 深度解析
date: 2023-05-05 06:24:00
tags:
  - 2023
  - Web技术
  - 前端技术
categories:
  - 前端技术
  - Web技术
---

> **PWA (Progressive Web Apps - 渐进式 Web 应用)** 是一种利用现代 Web 技术，将 Web 应用提升至接近原生应用体验的新方法。它旨在结合 Web 的广阔可达性与原生应用的丰富功能，为用户提供**可靠 (Reliable)**、**快速 (Fast)**、**沉浸式 (Engaging)** 的体验。PWA 不仅仅是一种技术，更是一套开发理念和最佳实践。

{% note info %}
核心思想：**PWA 的目标是让 Web 应用具备类似原生应用的体验和功能，同时保留 Web 的优点（无需安装、易于发现、跨平台）。这主要通过 Service Worker 实现离线能力和性能优化，通过 Web App Manifest 实现安装和应用体验，以及通过 HTTPS 确保安全性来达成。**
{% endnote %}
------

## 一、为什么需要 PWA？(Web 与原生应用的融合)

传统 Web 应用和原生移动应用各有优缺点：

*   **传统 Web 应用 (网站)**：
    *   **优点**：无需安装、易于发现、跨平台、更新灵活、共享方便。
    *   **缺点**：依赖网络、加载慢、无离线功能、无法添加到主屏幕、无法发送推送通知、用户体验与原生应用有差距。
*   **原生移动应用**：
    *   **优点**：性能好、可离线、可安装到主屏幕、有推送通知、可访问设备硬件、用户体验好。
    *   **缺点**：需要通过应用商店分发（审核、下载）、开发成本高（多平台适配）、更新不灵活、分享不便。

PWA 旨在弥补传统 Web 应用的缺点，同时保留其核心优势，从而达到一个理想的平衡点：
*   **弥补 Web 的不足**：通过 Service Worker 实现离线能力和缓存优化，通过 Web App Manifest 实现可安装到主屏幕和统一应用外观。
*   **保留 Web 的优势**：仍是网站，通过 URL 访问，无需应用商店，跨平台。

这使得 PWA 成为一种能够为用户提供更优质体验、同时降低开发和分发成本的强大解决方案。

## 二、PWA 的核心技术支柱

PWA 主要依赖以下三个核心技术来提供其独特的体验：

### 2.1 Service Worker (服务工作线程)

**定义**：Service Worker 是一个注册在浏览器中的 JavaScript 文件，它运行在浏览器后台，独立于网页主线程。它能够拦截和控制页面的网络请求，从而实现缓存、离线访问、推送通知等功能。

**特点**：
*   **网络代理**：作为客户端和网络之间的可编程代理，拦截所有网络请求。
*   **离线能力**：通过 Cache API 缓存资源，即使在离线状态下也能提供页面内容。
*   **推送通知**：与服务器协作，接收并显示推送通知（即使应用未打开）。
*   **后台同步**：允许应用在后台同步数据，待网络恢复后发送。
*   **生命周期**：具有独立的安装 (install) 和激活 (activate) 生命周期。
*   **异步操作**：所有操作都是非阻塞的。

**工作原理 (简图)**：
{% mermaid %}
graph LR
    A[用户请求 Web 应用] --> B(浏览器)
    B --> C{Service Worker 拦截?}
    C -- 是 --> D(从缓存或网络获取资源)
    C -- 否 --> E(直接从网络获取)
    D -- 返回响应 --> B
    E -- 返回响应 --> B
    B -- 显示页面 --> F[Web 应用界面]
{% endmermaid %}

**JavaScript 示例 (Service Worker 注册与简单缓存)**：

**1. `index.html` (在主线程注册 Service Worker)**:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First PWA</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, PWA!</h1>
    <p>This is a progressive web app example.</p>
    <img src="pwa-icon.png" alt="PWA Icon" width="100">

    <script>
        // 检查浏览器是否支持 Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(function(registration) {
                        console.log('Service Worker 注册成功:', registration.scope);
                    })
                    .catch(function(err) {
                        console.error('Service Worker 注册失败:', err);
                    });
            });
        }
    </script>
</body>
</html>
```

**2. `service-worker.js` (Service Worker 脚本)**:
```javascript
const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/pwa-icon.png' // 假设你有一个 pwa-icon.png 文件
];

// Service Worker 安装事件：缓存应用外壳 (App Shell)
self.addEventListener('install', function(event) {
    console.log('[Service Worker] Install Event: Caching App Shell');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('[Service Worker] Cache opened:', CACHE_NAME);
                return cache.addAll(urlsToCache); // 将所有指定资源添加到缓存
            })
            .then(function() {
                // 强制 Service Worker 立即激活，跳过等待
                self.skipWaiting(); 
            })
    );
});

// Service Worker 激活事件：清理旧缓存
self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activate Event: Cleaning old caches');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName); // 删除旧版本的缓存
                    }
                })
            );
        }).then(function() {
            // 确保 Service Worker 对当前页面立即生效
            return self.clients.claim(); 
        })
    );
});

// Service Worker Fetch 事件：拦截网络请求并提供缓存优先策略
self.addEventListener('fetch', function(event) {
    // console.log('[Service Worker] Fetching:', event.request.url);
    event.respondWith(
        caches.match(event.request) // 尝试从缓存匹配请求
            .then(function(response) {
                // 如果缓存中有匹配的资源，则返回缓存的资源
                if (response) {
                    // console.log('[Service Worker] Returning from cache:', event.request.url);
                    return response;
                }
                // 如果缓存中没有，则从网络获取
                // console.log('[Service Worker] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(function(networkResponse) {
                        // 可以选择将新的网络响应缓存起来，以供下次使用
                        // 例如，如果这是一个动态加载的资源
                        // if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        //     return networkResponse;
                        // }
                        // var responseToCache = networkResponse.clone();
                        // caches.open(CACHE_NAME)
                        //     .then(function(cache) {
                        //         cache.put(event.request, responseToCache);
                        //     });
                        return networkResponse;
                    })
                    .catch(function(error) {
                        console.error('[Service Worker] Fetch failed:', event.request.url, error);
                        // 在离线且缓存中没有资源时，可以返回一个离线页面
                        // return caches.match('/offline.html');
                        throw error;
                    });
            })
    );
});
```
**注意**：上述 Service Worker 示例是典型的“缓存优先，网络回退”策略，并处理了应用外壳的安装和旧缓存的清理。

### 2.2 Web App Manifest (Web 应用清单)

**定义**：一个 JSON 格式的文件，它为浏览器提供了关于 PWA 的元数据，包括应用的名称、图标、启动方式、显示模式、主题颜色等。

**作用**：
*   **添加到主屏幕 (Add to Home Screen - A2HS)**：提供 PWA 的名称、图标，使其可以像原生应用一样被安装到用户主屏幕。
*   **启动屏幕 (Splash Screen)**：定义 PWA 启动时的加载屏幕。
*   **显示模式**：控制 PWA 打开时的浏览器 UI 元素（如 `standalone`、`fullscreen`、`browser`）。
*   **主题颜色**：定义地址栏和状态栏的颜色。
*   **方向锁定**：指定应用首选的屏幕方向。

**HTML 引用 Manifest**：
```html
<link rel="manifest" href="/manifest.json">
```

**`manifest.json` 示例**：
```json
{
  "name": "我的 PWA 应用",
  "short_name": "PWA",
  "description": "这是一个 PWA 示例应用。",
  "start_url": "/index.html",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2196F3",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2.3 HTTPS (安全上下文)

**定义**：HTTPS 是 HTTP 的安全版本，通过 SSL/TLS 协议对通信进行加密。

**作用**：
*   **数据安全**：保护用户数据在客户端和服务器之间传输时的隐私和完整性。
*   **信任基础**：Service Worker 只能在安全上下文（即 HTTPS）中注册和运行。这是为了防止恶意脚本劫持网络请求，从而确保用户的安全。
*   **PWA 的强制要求**：所有 PWA 都必须通过 HTTPS 提供服务。

## 三、PWA 的核心特性 (指标)

PWA 通过上述技术支柱，实现了以下核心特性，这些特性也是衡量一个 Web 应用是否是“好” PWA 的指标：

1.  **可靠 (Reliable)**：
    *   即使在网络不稳定或离线状态下，也能即时加载。
    *   Service Worker 缓存机制确保了资源的可用性。
    *   消除了“小恐龙”或“无网络连接”页面。

2.  **快速 (Fast)**：
    *   响应用户交互的速度快，动画流畅，无卡顿。
    *   通过 Service Worker 预缓存关键资源，减少网络请求时间。
    *   优化加载性能，特别是首屏加载时间 (FCP - First Contentful Paint, LCP - Largest Contentful Paint)。

3.  **沉浸式 (Engaging)**：
    *   提供类似原生应用的用户体验，如全屏显示、自定义启动图标、启动屏幕。
    *   可添加到主屏幕，用户可以像启动原生应用一样启动 PWA。
    *   通过 Web Push Notifications 提供与用户重新互动的方式。

4.  **响应式 (Responsive)**：
    *   适应任何屏幕尺寸和方向，无论是桌面、平板还是移动设备。

5.  **安全 (Secure)**：
    *   必须通过 HTTPS 提供服务，保护用户数据免受窃听和篡改。

6.  **可发现 (Discoverable)**：
    *   仍然是网站，可以通过搜索引擎、链接等方式发现。
    *   W3C Manifest 允许搜索引擎识别 PWA。

7.  **可安装 (Installable)**：
    *   用户可以选择将其添加到设备主屏幕，并以独立应用的形式运行。

## 四、PWA 的部署和开发流程

1.  **基于 HTTPS 提供服务**：这是首要前提。
2.  **创建 Web App Manifest**：定义 PWA 的元数据和外观。
3.  **开发 Service Worker**：
    *   在主线程中注册 Service Worker。
    *   编写 Service Worker 脚本，实现缓存策略（App Shell、运行时缓存等）、离线页面、推送通知逻辑等。
4.  **优化用户体验和性能**：
    *   确保页面响应式设计。
    *   优化加载速度，使用性能审计工具 (如 Lighthouse)。
    *   提供友好的离线体验。
5.  **测试和迭代**：在不同浏览器和设备上测试 PWA 的功能和性能。

## 五、PWA 的优缺点与适用场景

### 5.1 优点
*   **提升用户体验**：快速加载、离线可用、类似原生应用界面，显著改善用户留存率和转化率。
*   **跨平台兼容**：一套代码适用于所有支持现代 Web 标准的设备和操作系统。
*   **易于部署和更新**：无需应用商店审核，更新即时生效。
*   **成本效益**：相较于原生应用，开发和维护成本通常更低。
*   **广阔的可达性**：通过 URL 访问，可被搜索引擎索引，易于分享。
*   **渐进增强**：在不支持 PWA 特性的浏览器中，仍可作为普通网站正常访问。

### 5.2 缺点
*   **硬件访问限制**：相比原生应用，对某些底层设备硬件（如联系人、蓝牙的完整功能、高级相机控制）的访问受限。
*   **通知权限**：用户首次安装 PWA 或启用推送通知时，需要明确授权。
*   **浏览器支持差异**：不同浏览器对 PWA 特性的支持程度和实现细节可能有所不同（例如 iOS 对 A2HS 的支持不如 Android 全面）。
*   **存储限制**：Service Worker 缓存和 IndexedDB 存储有上限，需要管理。
*   **用户认知**：用户可能不理解 PWA 是什么，仍习惯于应用商店下载应用。

### 5.3 适用场景
*   **电商和零售**：提供快速、可靠的购物体验，尤其是在网络不佳的环境下。
*   **新闻和媒体**：实时新闻推送，离线阅读文章。
*   **社交媒体和通讯**：快速加载，即时通知，减少用户流失。
*   **工具类应用**：如计算器、笔记、待办事项列表，提供离线能力和快捷访问。
*   **内部管理系统**：简化部署和维护，提升员工体验。
*   **发展中国家市场**：低带宽、低内存设备用户多，PWA 能提供更好的用户体验。

## 六、总结

PWA 代表了 Web 应用的未来发展方向之一，它通过 Service Worker、Web App Manifest 和 HTTPS 三大支柱，为用户带来了接近原生应用的体验。它不仅提升了 Web 应用的性能、可靠性和用户参与度，也为开发者提供了更广阔的部署和分发渠道，同时降低了开发成本。随着 Web 技术和浏览器支持的不断演进，PWA 将在更多领域展现其强大的潜力。
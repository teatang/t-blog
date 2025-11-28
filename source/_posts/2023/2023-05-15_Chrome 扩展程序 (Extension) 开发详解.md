---
title: Chrome 扩展程序 (Extension) 开发详解
date: 2023-05-15 06:24:00
tags:
  - 2023
  - Web技术
  - 前端技术
categories:
  - 前端技术
  - Web技术
---

> **Chrome 扩展程序 (Chrome Extension)** 是一种通过 Web 技术 (HTML, CSS, JavaScript) 构建的小型程序，旨在扩展 Google Chrome 浏览器的功能。它们运行在独立的、受沙盒保护的环境中，可以与浏览器功能深度集成，允许用户根据个人需求和工作流定制和增强其浏览体验。

{% note info %}
核心思想：**Chrome 扩展程序通过 `manifest.json` 文件定义其元数据、权限和组件，并通过各种 JavaScript 文件 (如后台脚本、内容脚本、弹出页面脚本) 与浏览器 API 交互，实现对网页内容、浏览器行为和用户界面的定制化增强。Chrome 扩展开发已全面转向 Manifest V3。**
{% endnote %}
------

## 一、为什么开发 Chrome 扩展程序？

Chrome 扩展程序为用户和开发者提供了独特的价值：

1.  **功能增强**：为浏览器添加新的功能，如广告拦截、密码管理、翻译、截图工具等。
2.  **效率提升**：自动化重复任务，整合第三方服务，优化工作流程。
3.  **定制化体验**：修改网页 UI，注入自定义样式或脚本，提供个性化的浏览体验。
4.  **开发便捷**：基于标准 Web 技术，学习曲线相对平缓，开发工具成熟。
5.  **广泛的用户群**：Chrome 市场份额巨大，扩展程序可以触达海量用户。

## 二、Chrome 扩展程序的核心组件与架构 (Manifest V3)

Chrome 扩展程序由多个组件组成，它们协同工作以提供完整的功能。从 Chrome Manifest V3 开始，Service Worker 后台脚本成为核心。

### 2.1 `manifest.json` (清单文件)

`manifest.json` 是每个 Chrome 扩展程序的“蓝图”，它是一个 JSON 格式的文件，定义了扩展程序的所有元数据、权限和组件。它是扩展程序最核心的部分。

**关键字段**：
*   **`manifest_version`**：指定 Manifest 文件的版本，目前为 `3`。
*   **`name`**：扩展程序的名称。
*   **`version`**：扩展程序的版本号。
*   **`description`**：扩展程序的简短描述。
*   **`icons`**：扩展程序在浏览器工具栏、Chrome Web Store 等位置显示的图标。
*   **`permissions`**：扩展程序所需的 API 权限，例如 `storage`, `activeTab` 等。
*   **`host_permissions`**：扩展程序需要访问的主机权限，用于内容脚本注入或 `webRequest` API。
*   **`action`**：定义了浏览器工具栏上的扩展程序图标行为，通常指向一个弹出页面 (`popup.html`)。
*   **`background`**：定义后台 Service Worker 脚本。
    *   **`service_worker`**：指定 Service Worker 脚本的路径。
*   **`content_scripts`**：定义要在特定网页上注入的脚本和样式。
*   **`options_page`**：指定扩展程序的配置页面。

**示例 `manifest.json` (Manifest V3)**：
```json
{
  "manifest_version": 3,
  "name": "我的第一个 Chrome 扩展",
  "version": "1.0",
  "description": "一个简单的 Chrome 扩展示例。",
  "icons": {
    "16": "images/icon-16.png",
    "48": "images/icon-48.png",
    "128": "images/icon-128.png"
  },
  "permissions": [
    "storage",      // 允许使用 chrome.storage API 存储数据
    "activeTab",    // 允许临时访问当前活动标签页的信息
    "scripting"     // Manifest V3 中，注入内容脚本需要此权限
  ],
  "host_permissions": [
    "http://*/*",   // 允许访问所有 HTTP 网站
    "https://*/*"   // 允许访问所有 HTTPS 网站
  ],
  "action": {
    "default_popup": "popup.html",  // 点击扩展图标时显示 popup.html
    "default_icon": {
      "16": "images/icon-16.png",
      "48": "images/icon-48.png"
    },
    "default_title": "点击我！"
  },
  "background": {
    "service_worker": "background.js" // 后台 Service Worker 脚本
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"], // 在所有页面上注入
      "js": ["content.js"]       // 要注入的 JavaScript 脚本
    }
  ],
  "options_page": "options.html" // 扩展程序的设置页面
}
```

### 2.2 Background Script (后台脚本 - Service Worker)

**定义**：在 Manifest V3 中，后台脚本现在是一个 Service Worker。它运行在浏览器后台，独立于任何特定的网页。它不直接访问 DOM。

**作用**：
*   **事件监听**：监听浏览器事件（如标签页创建、更新，书签添加等）。
*   **数据管理**：处理长期存在的数据，如通过 `chrome.storage` API 存储用户设置。
*   **消息传递**：作为扩展程序各组件（如弹出页面、内容脚本）之间的中央枢纽，进行消息传递。
*   **API 调用**：调用只有扩展程序才能访问的 `chrome.*` API。
*   **生命周期**：Service Worker 是事件驱动的，在不需要时会休眠以节省资源，在接收到事件时重新唤醒。

**工作原理 (简图)**：
{% mermaid %}
graph TD
    A["浏览器事件 (如标签页更新)"] --> B(Background Service Worker)
    C[Popup UI] -- 消息 --> B
    D[Content Script] -- 消息 --> B
    B -- 调动 chrome.* API --> E[浏览器功能]
    B -- 存储/读取数据 --> F[chrome.storage]
{% endmermaid %}

**JavaScript 示例 (`background.js`)**：
```javascript
// 监听扩展程序安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('Chrome 扩展已安装。');
    // 可以在这里设置初始值或执行一次性任务
    chrome.storage.sync.set({ 'theme': 'light' });
});

// 监听浏览器工具栏图标点击事件 (如果 action 没有 default_popup)
// 在 Manifest V3 中，如果 action 指定了 default_popup，则此事件不会触发
// chrome.action.onClicked.addListener((tab) => {
//     console.log('扩展图标被点击了。当前标签页:', tab.url);
//     // 可以执行一些操作，例如打开一个新标签页
//     chrome.tabs.create({ url: 'https://developer.chrome.com/docs/extensions' });
// });

// 监听来自其他扩展程序组件的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('收到消息:', message);
    console.log('来自:', sender.tab ? '内容脚本' : '弹出页面');

    if (message.action === 'getDataFromBackground') {
        chrome.storage.sync.get('theme', (result) => {
            sendResponse({ data: `主题是: ${result.theme}` });
        });
        return true; // 表示异步响应
    }

    if (message.action === 'updateTheme') {
        const newTheme = message.newTheme;
        chrome.storage.sync.set({ 'theme': newTheme }, () => {
            console.log(`主题已更新为: ${newTheme}`);
            sendResponse({ status: 'success', newTheme: newTheme });
        });
        return true; // 表示异步响应
    }
});
```

### 2.3 Popup UI (弹出页面)

**定义**：一个临时的 HTML 页面，当用户点击浏览器工具栏上的扩展程序图标时显示。

**作用**：
*   **提供用户交互界面**：显示扩展程序的状态，提供按钮、表单等供用户操作。
*   **与后台脚本通信**：通过消息传递与后台 Service Worker 交换数据。
*   **通常用于快捷操作**：不适合复杂或长时间的交互，因为一旦用户点击页面其他区域或切换标签页，弹出页面就会关闭。

**文件结构**：`popup.html` 和 `popup.js` (可选，用于处理 UI 逻辑)。

**示例 (`popup.html` 和 `popup.js`)**：

**`popup.html`**:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>扩展程序弹出页面</title>
    <style>
        body { font-family: Arial, sans-serif; width: 200px; padding: 10px; }
        button { width: 100%; padding: 8px; margin-top: 10px; cursor: pointer; }
        #status { margin-top: 10px; font-weight: bold; }
    </style>
</head>
<body>
    <h2>PWA 扩展</h2>
    <p>当前主题: <span id="currentTheme">加载中...</span></p>
    <button id="toggleTheme">切换主题</button>
    <div id="status"></div>
    <script src="popup.js"></script>
</body>
</html>
```

**`popup.js`**:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    const currentThemeSpan = document.getElementById('currentTheme');
    const toggleThemeButton = document.getElementById('toggleTheme');
    const statusDiv = document.getElementById('status');

    // 从后台脚本获取当前主题
    chrome.runtime.sendMessage({ action: 'getDataFromBackground' }, (response) => {
        if (response && response.data) {
            const theme = response.data.split(': ')[1];
            currentThemeSpan.textContent = theme;
        }
    });

    toggleThemeButton.addEventListener('click', () => {
        const currentTheme = currentThemeSpan.textContent;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        // 发送消息到后台脚本更新主题
        chrome.runtime.sendMessage({ action: 'updateTheme', newTheme: newTheme }, (response) => {
            if (response && response.status === 'success') {
                currentThemeSpan.textContent = response.newTheme;
                statusDiv.textContent = `主题已切换到 ${response.newTheme}`;
            } else {
                statusDiv.textContent = '主题切换失败。';
            }
        });
    });
});
```

### 2.4 Content Script (内容脚本)

**定义**：JavaScript 文件，被注入到用户正在浏览的网页上下文中。它们与网页共享 DOM，可以像普通网页脚本一样读取和修改 DOM。

**作用**：
*   **修改网页内容**：注入样式、修改元素、添加新的 UI 元素。
*   **读取网页数据**：从网页中提取信息。
*   **与后台脚本通信**：通过消息传递将网页信息发送给后台 Service Worker，或从后台接收指令。

**注意**：内容脚本运行在一个“隔离的世界”中，这意味着它们无法直接访问网页中的 JavaScript 变量或函数，反之亦然。但它们可以共享 DOM。

**JavaScript 示例 (`content.js`)**：
```javascript
console.log('内容脚本已注入到当前页面。');

// 示例：在页面上添加一个提示
const div = document.createElement('div');
div.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background-color: lightgreen; padding: 10px; border-radius: 5px; z-index: 9999;';
div.textContent = '这是 Chrome 扩展注入的提示！';
document.body.appendChild(div);

// 示例：监听来自后台脚本的消息，并根据消息修改页面
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'highlightText') {
        const textToHighlight = message.text;
        // 简单的示例：高亮页面中所有包含特定文本的段落
        document.querySelectorAll('p').forEach(p => {
            if (p.textContent.includes(textToHighlight)) {
                p.style.backgroundColor = 'yellow';
            }
        });
        sendResponse({ status: 'text_highlighted', text: textToHighlight });
    }
});

// 示例：向后台脚本发送消息，报告页面标题
chrome.runtime.sendMessage({ action: 'reportPageTitle', title: document.title, url: window.location.href });
```

### 2.5 Options Page (选项页面)

**定义**：一个标准的 HTML 页面，提供扩展程序的配置选项。用户可以通过右键点击扩展程序图标并选择“选项”或在扩展程序管理页面中访问。

**作用**：
*   **持久化配置**：允许用户自定义扩展程序的行为、界面或数据，并通常通过 `chrome.storage` API 进行持久化。

**文件结构**：`options.html` 和 `options.js` (可选)。

## 三、扩展程序之间的通信 (Message Passing)

扩展程序的不同组件（后台 Service Worker、弹出页面、内容脚本）需要相互通信。Chrome 提供了两种主要的消息传递方式：

1.  **一次性请求 (One-time requests)**：用于发送一次性消息并接收响应。
    *   发送方：`chrome.runtime.sendMessage()` 或 `chrome.tabs.sendMessage()`。
    *   接收方：`chrome.runtime.onMessage.addListener()`。

2.  **长连接 (Long-lived connections)**：用于在组件之间建立持久连接，发送多条消息。
    *   发送方：`chrome.runtime.connect()` 或 `chrome.tabs.connect()`。
    *   接收方：`chrome.runtime.onConnect.addListener()`。

## 四、权限 (Permissions)

Chrome 扩展程序需要明确声明它们所需的权限。权限在 `manifest.json` 中定义，并在用户安装扩展程序时向其显示。

**常见权限示例**：
*   **`storage`**：读写 `chrome.storage`。
*   **`activeTab`**：临时获得当前活动标签页的权限，仅当用户调用扩展程序时有效。
*   **`scripting`**：在 Manifest V3 中，用于在页面上注入脚本。
*   **`tabs`**：访问标签页的敏感信息（URL、标题等）。
*   **`alarms`**：创建周期性定时任务。
*   **`notifications`**：显示桌面通知。
*   **`webRequest`**：拦截、阻止或修改网络请求（强大但敏感）。
*   **`host_permissions`**：定义扩展程序可以访问哪些网站的数据（如 `https://*/*`）。

**重要性**：请求的权限越少越好。过多的权限会降低用户的信任度，并可能导致扩展程序被拒绝。

## 五、开发工作流与调试

### 5.1 设置项目结构

一个典型的 Chrome 扩展程序项目结构：
```
my-extension/
├── manifest.json
├── background.js
├── popup.html
├── popup.js
├── content.js
├── options.html
├── options.js
└── images/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### 5.2 加载 unpacked (解包) 扩展程序

1.  在 Chrome 浏览器中打开 `chrome://extensions`。
2.  开启“开发者模式”。
3.  点击“加载已解压的扩展程序 (Load unpacked)”，然后选择你的扩展程序根文件夹 (`my-extension`)。
4.  你的扩展程序将会加载并显示在列表中。

### 5.3 调试

*   **Popup UI**：右键点击扩展程序图标，选择“检查弹出内容 (Inspect popup)”，会打开一个独立的开发者工具窗口。
*   **Background Service Worker**：在 `chrome://extensions` 页面，点击你的扩展程序详情页，找到 Service Worker 链接（通常是 `service_worker.js`），点击即可打开其开发者工具。
*   **Content Script**：在注入内容脚本的网页上打开开发者工具。内容脚本的控制台输出会显示在该网页的控制台中。

## 六、安全注意事项

1.  **最小化权限**：只请求扩展程序所需的最少权限。
2.  **内容安全策略 (CSP - Content Security Policy)**：在 `manifest.json` 中配置 CSP，限制扩展程序可以加载的资源来源，防止 XSS 攻击。Manifest V3 有默认的 CSP，可以适当放松但需谨慎。
3.  **避免注入危险代码**：不要在内容脚本中使用 `eval()` 或动态插入脚本，除非绝对必要且已充分验证。
4.  **数据隔离**：内容脚本运行在隔离环境中，防止与网页 JavaScript 冲突。
5.  **HTTPS**：确保所有网络请求都通过 HTTPS 进行。

## 七、总结

Chrome 扩展程序是增强浏览器功能和提升用户体验的强大工具。通过理解 `manifest.json` 的配置、Service Worker 的事件驱动特性、内容脚本与网页的交互，以及组件之间的消息传递机制，开发者可以构建出功能丰富、高效且安全的扩展程序。随着 Manifest V3 的全面推行，对 Service Worker 生命周期和权限管理有了新的要求，开发者应熟悉这些变化以确保其扩展程序的兼容性和未来发展。
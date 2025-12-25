---
title: BFCache (Back-Forward Cache) 深度详解
date: 2024-07-06 06:24:00
tags: 
    - 2024
    - 前端技术
    - Web技术
    - JavaScript
categories: 
    - 前端技术
    - JavaScript
---
> 在 Web 性能优化领域，用户感知的加载速度至关重要。除了常规的网络和渲染优化外，浏览器还有一种强大的特性可以显著提升用户体验，尤其是在用户进行前进/后退导航时的加载速度——这就是 **BFCache (Back-Forward Cache)**，即“往返缓存”或“后退/前进缓存”。BFCache 允许浏览器将整个页面（包括 DOM 状态、JavaScript 堆以及当前页面的状态）存储在内存中，以便用户在通过浏览器后退 (Back) 或前进 (Forward) 按钮导航时，能够瞬间恢复到离开时的状态，而无需重新加载页面。

{% note info %}
核心思想：**BFCache 是一种浏览器优化策略，它将用户离开的整个页面状态（而非仅仅是资源）存储在内存中，以便用户通过“后退/前进”按钮再次访问时能够实现即时页面恢复，极大地提升了导航体验。**
{% endnote %}
---

## 一、什么是 BFCache？

BFCache 是一种用于**瞬时页面加载**的浏览器缓存机制，其核心思想是：当用户从一个页面 `A` 导航到页面 `B`，如果用户随后点击了浏览器的“后退”按钮返回页面 `A`，浏览器不会重新发送网络请求、重新解析 DOM、重新执行 JavaScript，而是直接从内存中恢复页面 `A` **离开时的完整状态**。同理，从页面 `A` 导航到页面 `B` 后，再导航回 `A`，然后点击“前进”按钮返回 `B`，BFCache 也会尝试恢复页面 `B`。

它缓存的不仅仅是页面的资源（如 HTML、CSS、JavaScript 文件，这属于 HTTP 缓存的范畴），而是整个页面的**运行时状态**，包括：

*   **DOM 树和 CSS 样式**
*   **JavaScript 堆**：所有全局变量、对象、事件监听器等
*   **当前滚动位置**
*   **表单输入值**
*   **XHR 请求的完成状态**
*   **Web Workers 和 IndexedDB 连接**
*   **页面在内存中的快照**

因此，使用 BFCache 恢复页面几乎是即时的，因为它跳过了网络请求、解析和渲染等所有传统加载步骤。

## 二、BFCache 的工作原理

1.  **用户导航**：当用户从页面 A 导航到页面 B 时（例如点击链接、使用 `window.location.href = ...`）。
2.  **页面缓存**：浏览器判断页面 A 是否符合 BFCache 的条件。如果符合，它会将页面 A 从渲染进程中“冻结”并移动到 BFCache 存储中。此时，页面 A 的 JavaScript 执行会被暂停，所有的网络连接都会被关闭。
3.  **恢复页面**：当用户点击浏览器“后退”按钮返回页面 A 时，浏览器会检查 BFCache 中是否有页面 A 的缓存。
    *   **命中 BFCache**：如果有，浏览器会立即从缓存中取出页面 A，并将其恢复到用户离开时的状态。DOMContentLoaded 和 `load` 事件不会再次触发。取而代之的是 `pageshow` 事件触发。
    *   **未命中 BFCache**：如果没有（例如页面不符合缓存条件或缓存已被清除），页面 A 将会像首次加载一样，进行完整的网络请求、DOM 解析和渲染过程。

## 三、相关事件：`pageshow` 和 `pagehide`

为了更好地管理页面的 BFCache 行为，浏览器引入了两个专门的事件：

1.  **`pageshow` 事件**：
    *   在页面**首次加载**时触发，早于 `load` 事件。
    *   在页面从 **BFCache 中恢复**时触发。
    *   `event` 对象有一个 `persisted` 属性：
        *   `event.persisted === true`：表示页面是从 BFCache 中恢复的。
        *   `event.persisted === false`：表示页面是首次加载。
    *   **主要用途**：在页面从 BFCache 恢复时，重新激活暂停的 JavaScript 逻辑（如定时器、API 轮询），更新过期的数据。

    ```javascript
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            console.log('页面从 BFCache 中恢复了！');
            // 在这里检查数据是否需要刷新，恢复动画或定时器
            // 例如，重新启动一个计时器
            // myTimer = setInterval(updateTime, 1000);
        } else {
            console.log('页面是首次加载。');
        }
    });
    ```

2.  **`pagehide` 事件**：
    *   在页面**即将卸载**时触发 (例如用户导航到新页面，或者关闭标签页)。
    *   在页面**进入 BFCache** 时触发。
    *   `event` 对象也有一个 `persisted` 属性：
        *   `event.persisted === true`：表示页面即将进入 BFCache。
        *   `event.persisted === false`：表示页面即将被销毁 (不会进入 BFCache)。
    *   **主要用途**：在页面进入 BFCache 之前，暂停不必要的 JavaScript 逻辑（如停止动画、清除定时器、关闭 WebSocket 连接），以节省资源。在页面即将被销毁时，发送最终的统计数据（推荐使用 `navigator.sendBeacon`）。

    ```javascript
    window.addEventListener('pagehide', (event) => {
        if (event.persisted) {
            console.log('页面即将进入 BFCache。暂停资源。');
            // 清除可能在后台继续运行的定时器和事件监听器
            // clearInterval(myTimer);
            // 考虑关闭或暂停 WebSocket 连接
        } else {
            console.log('页面即将被销毁。发送最终日志或清理资源。');
            // 使用 navigator.sendBeacon 发送用户离开日志
            // navigator.sendBeacon('/api/exit_log', JSON.stringify({ userId: 'abc', exitTime: Date.now() }));
        }
    });
    ```

## 四、阻止页面进入 BFCache 的情况

尽管 BFCache 带来巨大的性能提升，但出于数据一致性、资源管理等考虑，某些情况下页面会被**阻止**进入 BFCache。以下是一些常见的阻止 BFCache 的因素：

1.  **使用 `unload` 事件监听器：**
    *   这是最常见且最主要的罪魁祸首。一旦页面注册了 `unload` 事件的监听器，浏览器通常会假定页面需要在卸载时执行关键操作，从而阻止其进入 BFCache。即使监听器是空的，也会阻止。
    *   **解决方案**：避免使用 `unload`。改用 `pagehide` 事件并检查 `event.persisted` 来区分页面是进入缓存还是被销毁。如果确实需要发送数据，使用 `navigator.sendBeacon`。

2.  **存在未关闭的 WebSocket 或 WebRTC 连接：**
    *   这些实时连接在 BFCache 冻结期间无法维持，浏览器为了避免数据丢失或状态异常，会阻止页面进入 BFCache。
    *   **解决方案**：在 `pagehide` 事件中（当 `event.persisted === true` 时）关闭这些连接，并在 `pageshow` 事件中（当 `event.persisted === true` 时）重新建立连接。

3.  **页面包含存在 `onbeforeunload` 事件监听器的 iframe：**
    *   即使顶层页面没有 `onbeforeunload`，如果其内部有 iframe 注册了此事件，也会阻止 BFCache。

4.  **页面包含打开的 IndexedDB 事务或 Web Locks：**
    *   这些资源需要保持活动状态，如果页面被冻结则无法继续，因此会阻止 BFCache。
    *   **解决方案**：在 `pagehide` 中关闭或提交事务。

5.  **页面正在进行下载或上传：**
    *   活动中的文件传输会被冻结，为了防止数据损坏或中断，页面不会进入 BFCache。

6.  **强制设置了 HTTP 请求头 `Cache-Control: no-store` 或 `no-cache`：**
    *   虽然这些主要针对 HTTP 缓存，但在某些浏览器中也可能影响 BFCache 行为，指示页面不应被缓存。不过，这在 BFCache 规范中并非是强制阻止因素。
    *   **解决方案**：如果希望使用 BFCache，确保不使用这些 HTTP 头。

7.  **页面打开了新的窗口或标签页 (通过 `window.open`)，且该窗口未关闭：**
    *   这种情况下，浏览器可能为了维持父子窗口之间的 JS 上下文联系而阻止缓存父页面。

8.  **浏览器扩展程序或某些内部状态：**
    *   某些浏览器扩展程序或浏览器本身的内部状态可能会意外阻止 BFCache。

## 五、如何检测 BFCache 是否生效？

1.  **手动测试**：
    *   打开开发者工具 (F12)。
    *   在 Network (网络) 面板中勾选 "Disable cache" (禁用缓存) 或 "Disable browser cache" (禁用浏览器缓存)。**注意：这里的“禁用缓存”指的是 HTTP 缓存，不会禁用 BFCache。**
    *   导航到目标页面 `A`。
    *   导航到另一个页面 `B`。
    *   点击浏览器的“后退”按钮返回页面 `A`。
    *   观察 Network 面板。如果页面是瞬间加载，且没有新的网络请求（除了可能的图片、JS 文件等资源），并且 `pageshow` 事件触发时 `event.persisted` 为 `true`，则 BFCache 生效。

2.  **通过 `pageshow` 事件中的 `event.persisted` 属性**：
    *   这是最直接的 JavaScript 检测方式。监听 `pageshow` 事件，并检查 `event.persisted` 的值。

    ```javascript
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            console.log('BFCache 命中！页面已从缓存恢复。');
        } else {
            console.log('BFCache 未命中或首次加载。');
        }
    });
    ```

3.  **Chrome DevTools 中的 Application (应用) 面板**：
    *   在 Chrome 开发者工具的 Application (应用) 面板中，选择 Back/forward cache (后退/前进缓存) 选项。
    *   导航到你的页面，然后离开。
    *   当你从其他页面返回时，如果你在 Back/forward cache 页面看到了目标页面，并显示 "Page restored from bfcache"，说明 BFCache 生效。如果显示 "Not restored from bfcache"，则会列出阻止 BFCache 的原因。
    *   **此工具非常有用，因为它能明确指出阻止 BFCache 的具体原因。**

## 六、优化 BFCache 兼容性 (让你的页面更好地利用 BFCache)

1.  **移除或替换 `unload` 事件监听器**：
    *   这是最重要的优化项。完全避免使用 `window.onunload` 或 `document.body.onunload`。
    *   将 `unload` 中的逻辑迁移到 `pagehide` (配合 `event.persisted === false` 判断) 或 `pageshow` (配合 `event.persisted === true` 判断)。
    *   发送数据使用 `navigator.sendBeacon()`。

2.  **在 `pagehide` 事件中清理资源**：
    *   当 `event.persisted === true` 时，暂停或关闭实时连接 (WebSocket, WebRTC)。
    *   清除不必要的定时器 (`setTimeout`, `setInterval`)、动画帧请求 (`requestAnimationFrame`)。
    *   取消或完成进行中的 IndexedDB 事务或 Web Locks。
    *   移除与第三方 SDK 相关的可能阻止 BFCache 的初始化代码 (如果可能)。

3.  **避免使用 `Cache-Control: no-store` 或 `no-cache` 等 HTTP 头**：
    *   除非有强烈的安全或实时性要求，否则避免这些头，它们会禁用所有缓存，包括 BFCache。

4.  **测试和监控**：
    *   在开发过程中使用 Chrome DevTools 的 Back/forward cache 功能进行测试。
    *   在生产环境中监控 `pageshow` 事件中的 `event.persisted` 状态，以了解 BFCache 的命中率。

## 七、总结

BFCache 是浏览器提供的一个强大而常常被忽视的性能优化特性。它通过缓存整个页面的运行时状态，能够为用户的后退/前进导航带来“零加载时间”的即时体验。要充分利用 BFCache，开发者需要积极避免使用 `unload` 事件，并在 `pagehide` 和 `pageshow` 事件中妥善管理页面的状态和资源。理解 BFCache 的工作原理及其阻止因素，并遵循最佳实践，将显著提升 Web 应用的用户体验。
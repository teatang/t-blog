---
title: 深入理解 JavaScript Fetch：为什么需要两次 await？
date: 2024-06-11 06:24:00
tags:
  - 2024
  - 前端技术
  - JavaScript
categories:
  - 前端技术
  - JavaScript
---

> JavaScript 中的 `fetch` API 提供了一种现代、强大的方式来发送网络请求。然而，初学者在使用 `async/await` 语法处理 `fetch` 请求时，经常会遇到一个困惑：为什么需要两次 `await` 才能获取到实际的数据？本文将深入探讨 `fetch` API 的设计原理，解释这“两次等待”背后的逻辑。

{% note info %}
“Fetch API 的设计哲学：将 HTTP 响应的元数据与实际数据流分离处理。”
{% endnote %}
------

## 一、`fetch` API 概览

`fetch` API 是 Web API 的一部分，用于替代老旧的 `XMLHttpRequest` 对象，提供了一个更强大、更灵活的用于获取资源的接口。它基于 `Promise`，使得异步请求的处理更加简洁。

一个典型的 `fetch` 请求（不使用 `async/await`）看起来是这样的：

```javascript
fetch('https://api.example.com/data')
  .then(response => {
    // 第一次 then: 处理响应头和状态
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json(); // 或 .text(), .blob(), .arrayBuffer() 等
  })
  .then(data => {
    // 第二次 then: 处理实际数据
    console.log(data);
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
  });
```

当使用 `async/await` 语法糖时，上述代码变成了：

```javascript
async function fetchData() {
  try {
    // 第一次 await: 等待获取到响应头信息
    const response = await fetch('https://api.example.com/data');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 第二次 await: 等待响应体数据解析完成
    const data = await response.json();

    console.log(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

fetchData();
```

正是这里的 `await response.json()` 引起了许多人的疑惑：为什么 `fetch` 返回的 `response` 对象不是直接包含数据的？

## 二、第一次 `await`：获取 `Response` 对象

当 `fetch` 函数执行时，它会立即向服务器发送请求。`fetch` 函数本身返回一个 `Promise`，这个 `Promise` 会在**接收到服务器的响应头信息时被解决 (resolved)**，而不是在接收到完整的响应体数据时。

所以，`const response = await fetch('...')` 中的第一次 `await` 实际上是等待：

1.  网络请求完成。
2.  服务器发送回 HTTP 响应头（例如状态码、响应类型、各种 `Cache-Control` 等 HTTP 头）。

此时，你得到了一个 `Response` 对象。这个 `Response` 对象包含了请求的元数据（`response.status`, `response.ok`, `response.headers` 等），但**它并不包含服务器返回的实际数据（响应体）**。

`Response` 对象的 `body` 属性是一个 `ReadableStream`。这意味着响应体数据是以流的形式到达的，可能是一个很大的文件，浏览器并不会立即将其全部加载到内存中。

## 三、第二次 `await`：解析响应体数据

`Response` 对象提供了一系列方法来解析其响应体（`body`）数据，这些方法都返回 `Promise`：

*   `response.json()`: 将响应体解析为 JSON 对象。
*   `response.text()`: 将响应体解析为纯文本。
*   `response.blob()`: 将响应体解析为 Blob (Binary Large Object) 对象，通常用于处理二进制文件，如图片。
*   `response.arrayBuffer()`: 将响应体解析为 ArrayBuffer，用于处理更低级别的二进制数据。
*   `response.formData()`: 将响应体解析为 FormData 对象，通常用于处理 HTML 表单数据。

第二次 `await` 的作用就是等待其中一个解析方法（例如 `response.json()`）的 `Promise` 解决。这个 `Promise` 的解决时机是：

1.  **整个响应体数据已经从网络上完整接收完毕。**
2.  **响应体数据已经成功地被解析成指定的格式（例如 JSON）。**

所以，`const data = await response.json()` 中的第二次 `await` 实际上是在等待：

1.  响应流（`ReadableStream`）完全读取完毕。
2.  读取到的数据被成功转换为 JavaScript 对象（或字符串、Blob 等）。

## 四、为什么这样设计？

这种“两次等待”的设计并非出于偶然，而是 `fetch` API 灵活性和效率的体现：

1.  **分步处理，提前判断**：
    *   在接收到响应头之后，你就可以立即检查请求是否成功（`response.ok` 或 `response.status`）。如果状态码是 4xx 或 5xx，你可以提前抛出错误，无需下载和解析整个响应体，从而节省带宽和处理时间。
    *   例如，一个 404 错误通常会有一个很小的响应体（甚至没有），提前判断可以避免不必要的解析。

2.  **处理大型文件和数据流**：
    *   如果 `fetch` 在接收到响应头时就直接返回解析好的数据，那么对于非常大的文件（如视频、图片、PDF），浏览器必须等待整个文件下载完成并解析后才能执行后面的代码。这可能导致主线程长时间阻塞。
    *   通过流式处理（`ReadableStream`），开发者可以更灵活地处理数据。虽然 `response.json()` 等方法会等待整个流读取完毕，但理论上，你可以直接操作 `response.body` 这个流来分块处理数据，尤其适用于处理大量数据时需要显示进度或在数据到达时立即开始处理的场景（尽管这通常需要更高级的 API 或自定义流处理器）。

3.  **支持不同数据类型**：
    *   服务器可以返回 JSON、文本、二进制文件等多种类型的数据。`Response` 对象提供不同的解析方法，允许开发者根据 `Content-Type` 或其他业务逻辑选择最合适的解析方式。
    *   如果 `fetch` 直接返回解析好的数据，它将不得不猜测（或依赖某个 HTTP 头）如何解析，这会降低灵活性。

## 五、总结

JavaScript `fetch` API 需要两次 `await` 的原因是：

1.  **第一次 `await` (`await fetch(url)`)**: 等待网络请求完成，获取到包含 HTTP 响应头和元信息的 `Response` 对象。此时响应体数据可能尚未完全下载，也未被处理。
2.  **第二次 `await` (`await response.json()`)**: 等待 `Response` 对象的 `body` 流完全读取完毕，并根据所选方法（如 `json()`, `text()`, `blob()` 等）将其内容解析成可用的 JavaScript 数据结构。

这种设计使得 `fetch` 接口既高效又灵活，允许开发者在接收到响应头后立即对请求结果进行初步判断，从而优化网络资源的使用和用户体验。理解这个机制对于有效地使用 `fetch` API，编写健壮、高性能的网络请求代码至关重要。
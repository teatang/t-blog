---
title: JavaScript Promise.all 详解
date: 2024-04-07 06:24:00
tags: 
    - 2024
    - 前端技术
    - JavaScript
    - Promise
    - 编程语法
categories: 
  - 前端技术
  - JavaScript
---

> **`Promise.all()`** 是 JavaScript `Promise` 对象的一个静态方法，它接收一个 `Promise` 可迭代对象（如数组）作为输入，并返回一个新的 `Promise`。这个新的 `Promise` 在所有输入的 `Promise` 都成功解决后才解决，并返回一个包含所有解决值的数组，且值的顺序与输入 `Promise` 的顺序一致。如果输入的 `Promise` 中有任何一个被拒绝，`Promise.all()` 返回的 `Promise` 就会立即被拒绝，其拒绝原因将是第一个被拒绝的 `Promise` 的拒绝原因。

{% note info %}
核心思想：**将多个独立的异步操作视为一个整体。只有当所有子任务都成功完成时，整体任务才算成功；只要有一个子任务失败，整体任务就立即失败。**
{% endnote %}

## 一、基本概念与作用

`Promise.all()` 主要用于处理这样一种场景：你需要同时执行多个异步操作，并且只有当所有这些操作都成功完成时，你才能进行下一步处理。它提供了一种优雅的方式来管理并发的异步任务，并聚合它们的结果。

**其主要作用包括：**

*   **并行执行异步任务**：提高效率，避免串行执行带来的等待时间。
*   **统一结果处理**：将多个异步操作的结果合并到一个数组中，方便后续统一处理。
*   **快速失败机制**：任一 Promise 失败，整体即刻感知并处理错误。

## 二、语法

`Promise.all()` 方法的语法如下：

```javascript
Promise.all(iterable);
```

*   **`iterable`**: 一个可迭代对象（通常是一个数组），其中包含 `Promise` 实例或任何其他值。如果可迭代对象中的某个值不是 Promise，它会被 `Promise.resolve()` 自动包装成一个已解决的 Promise。

**返回值**：
`Promise.all()` 返回一个新的 `Promise` 对象。

## 三、工作原理

1.  **输入处理**: `Promise.all()` 接收一个可迭代对象，并迭代其中的每个元素。对于非 Promise 的值，它会将其转换为已解决的 Promise。
2.  **并发执行**: 所有输入的 Promise 都会并行开始执行。
3.  **成功解决**:
    *   只有当所有输入的 Promise 都成功解决时，`Promise.all()` 返回的 Promise 才会解决。
    *   解决值是一个数组，其中包含所有输入 Promise 的解决值，并按照原始输入 Promise 的顺序排列。
    *   如果输入是空的可迭代对象，`Promise.all()` 返回的 Promise 将同步解决为一个空数组 `[]`。
4.  **失败拒绝 (快速失败)**:
    *   只要输入的 Promise 中有任何一个被拒绝，`Promise.all()` 返回的 Promise 就会立即被拒绝。
    *   拒绝原因将是第一个被拒绝的 Promise 的拒绝原因。其他仍在执行中的 Promise 不会被取消（Promise 一旦开始就无法停止），但它们的结果将不再影响 `Promise.all()` 的状态。

{% mermaid %}
graph TD
    A["Promise.all(iterable)"] --> B{所有Promise是否解决?}
    B -- Yes --> C["返回 Promise.resolve(...vals)"]
    B -- No, 某个Promise是否拒绝? --> D{第一个拒绝的Promise是哪个?}
    D --> E["返回 Promise.reject(reason_of_first_rejected)"]
{% endmermaid %}

## 四、代码示例 (JavaScript)

### 4.1 所有 Promise 都成功解决

```javascript
function fetchUserData(userId) {
  return new Promise(resolve => {
    setTimeout(() => resolve(`User Data for ID: ${userId}`), 1000);
  });
}

function fetchProductData(productId) {
  return new Promise(resolve => {
    setTimeout(() => resolve(`Product Data for ID: ${productId}`), 500);
  });
}

function fetchAnalyticsData() {
  return Promise.resolve("Analytics Data Loaded Instantly"); // Non-promise value also works
}

const promises = [
  fetchUserData(123),
  fetchProductData(456),
  fetchAnalyticsData()
];

console.log("Starting parallel data fetching...");

Promise.all(promises)
  .then(results => {
    console.log("All data fetched successfully:");
    console.log("User Data:", results[0]);
    console.log("Product Data:", results[1]);
    console.log("Analytics Data:", results[2]);
  })
  .catch(error => {
    console.error("An error occurred during data fetching:", error);
  });

// 预期输出 (在约 1 秒后):
// Starting parallel data fetching...
// All data fetched successfully:
// User Data: User Data for ID: 123
// Product Data: Product Data for ID: 456
// Analytics Data: Analytics Data Loaded Instantly
```

### 4.2 其中一个 Promise 拒绝 (快速失败)

```javascript
const p1 = new Promise((resolve, reject) => {
  setTimeout(() => resolve('First Promise Success'), 1000);
});

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => reject(new Error('Second Promise Failed!')), 500); // 这个 Promise 会首先拒绝
});

const p3 = new Promise((resolve, reject) => {
  setTimeout(() => resolve('Third Promise Success'), 2000);
});

console.log("Starting parallel promises, expecting a rejection...");

Promise.all([p1, p2, p3])
  .then(values => {
    console.log("All promises resolved:", values);
  })
  .catch(error => {
    console.error("One promise rejected, catching error:", error.message);
  });

// 预期输出 (在约 0.5 秒后):
// Starting parallel promises, expecting a rejection...
// One promise rejected, catching error: Second Promise Failed!
```
可以看到，尽管 `p1` 和 `p3` 最终会成功，但 `p2` 在 500ms 后拒绝，导致 `Promise.all` 立即拒绝，并且只捕获 `p2` 的错误。

### 4.3 处理空可迭代对象

```javascript
Promise.all([])
  .then(values => {
    console.log("Promise.all with empty array resolved:", values);
  })
  .catch(error => {
    console.error("Promise.all with empty array rejected:", error);
  });

// 预期输出:
// Promise.all with empty array resolved: []
```

## 五、适用场景

`Promise.all()` 在以下场景中特别有用：

*   **并行数据获取**: 当一个页面或组件需要从多个 API 端点获取数据，并且所有数据都必须准备好才能渲染时。
    例如：加载用户详情、订单列表和通知信息。
*   **资源并行加载**: 在 Web 开发中，并行加载多个图片、脚本文件、字体文件或其他资源，以优化加载速度。
*   **批量操作**: 执行一系列独立的异步数据库查询、文件读写操作，并在所有操作完成后进行下一步处理。
*   **微服务编排**: 在一个服务中，需要调用多个下游微服务获取信息，然后聚合这些信息返回。

## 六、错误处理

`Promise.all()` 的错误处理是其 "快速失败" 特性的一部分：

*   如果所有的 Promise 都成功，`then` 回调会被执行。
*   如果至少有一个 Promise 失败，`catch` 回调（或 `then` 的第二个参数）会被执行，并且只会接收到**第一个**拒绝的 Promise 的错误信息。

这意味着，如果你需要处理每个 Promise 的个别错误，即使其中一个失败，也希望等待所有 Promise 完成，那么 `Promise.all()` 可能不是最合适的工具。在这种情况下，可以考虑使用 `Promise.allSettled()`。

## 七、与相关方法的对比

JavaScript 还提供了其他几个处理 Promise 集合的静态方法，它们各有侧重：

*   **`Promise.all(iterable)`**:
    *   等待所有 Promise **成功**。
    *   任何一个 Promise 失败，则立即拒绝。
    *   结果是所有 Promise 解决值的数组。
    *   **适用场景**: 所有任务都必须成功，否则整个操作失败。

*   **`Promise.race(iterable)`**:
    *   等待**第一个** Promise 解决或拒绝。
    *   一旦有 Promise 达到最终状态 (fulfilled 或 rejected)，就返回该 Promise 的结果。
    *   **适用场景**: 需要响应最快完成的任务，例如超时处理。

*   **`Promise.allSettled(iterable)` (ES2020)**:
    *   等待所有 Promise **完成**（无论成功或失败）。
    *   永远不会拒绝，总是解决。
    *   解决值是一个数组，每个元素包含一个对象，描述对应 Promise 的状态 (`status: 'fulfilled'` 或 `'rejected'`) 和结果 (`value` 或 `reason`)。
    *   **适用场景**: 需要了解所有并发操作的结果，即使其中一些失败。

*   **`Promise.any(iterable)` (ES2021)**:
    *   等待**第一个** Promise **成功**解决。
    *   如果所有 Promise 都失败，则返回一个 `AggregateError` 类型的拒绝 Promise，包含所有拒绝原因。
    *   **适用场景**: 只要有一个任务成功即可，例如从多个镜像站点下载文件。

| 方法                 | 输入         | 返回 Promise 的行为                                 | 结果                     | 错误处理                                           |
| :------------------- | :----------- | :-------------------------------------------------- | :----------------------- | :------------------------------------------------- |
| `Promise.all()`      | `[P1, P2, ...]` | 所有 P 成功 -> resolve <br> 任何 P 失败 -> reject | `[val1, val2, ...]`      | 捕获第一个拒绝的错误                             |
| `Promise.race()`     | `[P1, P2, ...]` | 第一个 P 解决/拒绝 -> resolve/reject              | `val` 或 `error`           | 捕获第一个完成的错误/解决值                      |
| `Promise.allSettled()` | `[P1, P2, ...]` | 所有 P 完成 (成功或失败) -> resolve               | `[{status, value/reason}, ...]` | 总是解决，结果对象中包含每个 Promise 的状态和错误 |
| `Promise.any()`      | `[P1, P2, ...]` | 任何 P 成功 -> resolve <br> 所有 P 失败 -> reject | `val`                    | 捕获所有 Promise 失败时的 `AggregateError`       |

## 八、总结

`Promise.all()` 是 JavaScript 异步编程中一个非常强大和常用的工具，它使得同时管理多个 Promise 变得简单而高效。通过它，我们可以实现并行任务的聚合和统一的成功/失败处理，极大地提升了前端和 Node.js 应用的性能和代码可读性。然而，理解其 "快速失败" 的特性，并根据具体的业务需求选择最合适的 Promise 静态方法（`all`、`race`、`allSettled`、`any`），是编写健壮异步代码的关键。
---
title: ECMAScript ShadowRealm 详解
date: 2026-02-02 06:24:00
tags:
  - 2026
  - Web技术
  - 前端技术
categories:
  - 前端技术
  - Web技术
---

> **ShadowRealm** 是一个 ECMAScript 提案（目前处于 Stage 3 阶段），旨在为 JavaScript 提供一种**新的代码隔离机制**。它允许在当前 Realm 中创建一个与主 Realm 具有分离的全局对象 (global object) 和 内置对象 (intrinsic objects) 集合的“影子 Realm”。通过 ShadowRealm，开发者可以在一个安全的、受控的环境中执行不受信任的代码或隔离不同的应用程序组件，提供类似于 iframe 但在 JS 层面更细粒度的沙箱能力。

{% note info %}
核心思想：ShadowRealm 创建了一个**轻量级的 JavaScript 执行环境沙箱**。它提供了一套独立的全局对象和内置对象，但共享相同的事件循环 (event loop) 和微任务队列 (microtask queue)。这种隔离有助于提高代码安全性、隔离第三方库、避免全局污染，并为模块化和可插拔架构提供更强大的支持。
{% endnote %}
------

## 一、为什么需要 ShadowRealm？

在 JavaScript 生态系统中，代码隔离一直是一个重要的需求，尤其是在以下场景中：

1.  **运行不受信任的代码 (Sandboxing Untrusted Code)**：
    *   例如，用户自定义脚本、插件代码或者从未知来源获取的代码。
    *   `eval()` 虽然可以执行代码，但它在当前 Realm 中执行，容易造成全局污染和安全漏洞。
    *   `Web Workers` 提供了进程级别的隔离，但它们有独立的全局对象、独立的事件循环，并不能直接访问主线程的 DOM，且通信开销较大。
    *   `iframe` 提供了强大的隔离能力，包括 DOM 和 JS 环境，但其创建和通信开销更大，且访问 DOM 仍然是一个安全挑战。

2.  **避免全局污染**：
    *   许多第三方库和框架可能会在全局对象上添加属性或修改内置对象，从而引发冲突（例如，两个库定义了同名的全局变量或修改了原型的行为）。
    *   ShadowRealm 可以为每个库提供一个独立的全局环境，防止它们相互影响。

3.  **模块化和插件系统**：
    *   在构建大型应用或插件系统时，需要确保每个模块或插件都在独立的环境中运行，防止意外的副作用。
    *   这有助于实现更健壮和可维护的架构。

4.  **服务器端渲染 (SSR) 和同构应用**：
    *   在 Node.js 环境下，可能需要在一个请求的生命周期内解析和执行多个前端组件的代码，同时确保每个组件的执行环境都是干净且独立的。

当前的解决方案（如 `eval()`、`Web Workers`、`iframe`）各有优缺点，而 ShadowRealm 旨在提供一个更轻量、更灵活、更 JavaScript 原生的沙箱机制。

## 二、ShadowRealm 的核心概念与特性

### 2.1 Realm (领域)

在 ECMAScript 规范中，“Realm” 是一个核心概念。它表示一个独立的 JavaScript 执行环境，包含：

*   一个**全局对象 (Global Object)**，例如在浏览器中是 `window` 或 `self`，在 Node.js 中是 `global`。
*   一套**全局环境绑定 (Global Environment Bindings)**，包括全局变量、函数和声明。
*   一套**内置对象 (Intrinsic Objects)** 集合，例如 `Object`, `Array`, `Function`, `Promise` 等以及它们的 `prototype`。
*   **私有 Symbol 注册表 (Symbol Registry)**。

每个 Realm 都有自己独立的全局状态，这意味着在一个 Realm 中对 `Object.prototype` 进行修改不会影响到另一个 Realm 中的 `Object.prototype`。`iframe` 和 `Web Workers` 都会创建新的 Realm。

### 2.2 ShadowRealm 的特点

ShadowRealm 提案提供了一个新的内置类 `ShadowRealm`，其实例代表一个新的 Realm。

1.  **独立的全局对象和内置对象**：
    *   每个 `ShadowRealm` 实例都拥有自己独立的全局对象（类似于 `window` 或 `global`）和一套独立的内置对象（如 `Object`、`Array`、`Function` 等及其原型）。
    *   这意味着在 ShadowRealm 中对全局对象或内置对象原型所做的修改，不会影响到创建它的主 Realm。例如，`shadowRealm.evaluate('Object.prototype.foo = 1;')` 不会影响主 Realm 的 `Object.prototype`。

2.  **共享事件循环和微任务队列**：
    *   虽然 ShadowRealm 有独立的全局环境，但它与创建它的主 Realm **共享同一个事件循环 (Event Loop)** 和 **微任务队列 (Microtask Queue)**。
    *   这意味着 ShadowRealm 中的异步操作（如 `Promise`、`setTimeout`）会与主 Realm 的异步操作交错执行，它们的任务和回调会进入同一个队列。

3.  **通信通过函数调用**：
    *   **Proxy-based 机制**：ShadowRealm 不允许直接访问其内部的 JavaScript 值（对象、函数、类等），也无法直接从其内部访问外部 Realm 的值。
    *   所有的通信都必须通过“导入” (importValue) 和“导出” (exportValue) 函数来完成。这些函数**只能传递原始值** (primitives) 和 **Callable Objects** (函数、方法、被 `Proxy` 包裹的函数)。
    *   当一个函数从一个 Realm 传递到另一个 Realm 时，它会以 **Callable Proxy** 的形式呈现。这个 Proxy 在目标 Realm 中被调用时，会转发调用回原始 Realm 中的实际函数。
    *   这种机制确保了隔离性，防止一个 Realm 的代码直接操纵另一个 Realm 的内部状态。

4.  **动态模块导入**：
    *   ShadowRealm 支持动态模块导入 (`import()`)，这意味着可以在 ShadowRealm 中加载和执行 ESM 模块。

## 三、ShadowRealm API 概览

`ShadowRealm` 类是核心，它提供了以下主要方法：

1.  `new ShadowRealm()`：
    *   创建一个新的 ShadowRealm 实例。

2.  `shadowRealm.evaluate(sourceText)`：
    *   在 ShadowRealm 中执行一段 JavaScript 字符串 `sourceText`。
    *   `sourceText` 必须是有效且可解析的 JavaScript 代码。
    *   返回一个 `Promise`，resolved 的值是 `sourceText` 执行的返回值（如果是非原始值，会被包装成 Callable Proxy）。

3.  `shadowRealm.importValue(specifier, bindingName)`：
    *   在 ShadowRealm 中导入一个指定模块 (`specifier`) 的特定导出 `bindingName`。
    *   `specifier` 是模块的路径字符串。
    *   `bindingName` 是模块导出的名称字符串。
    *   返回一个 `Promise`，resolved 的值是导入的模块绑定。如果导入的是函数，则会是一个 Callable Proxy。

4.  `shadowRealm.spawn(callback)` (提案早期，已废弃或修改):
    *   早期提案提供的函数，用于在 ShadowRealm 中执行一个回调函数。该方法在后续版本中已被 `evaluate` 和 `importValue` 取代或重构，更强调清晰的通信模型。

### 示例：基本使用

```javascript
// 主 Realm (Outer Realm)
const realm = new ShadowRealm();

// 1. 在 ShadowRealm 中执行代码
let resultPromise1 = realm.evaluate(`
  // ShadowRealm 内的全局对象和内置对象是独立的
  const message = 'Hello from ShadowRealm!';
  Object.prototype.shadowProp = 'shadow'; // 污染 ShadowRealm 的 Object.prototype
  message + ' ' + (typeof window); // 在 Node.js 环境下 typeof window 会是 "undefined"，这里仅为示意
`);
resultPromise1.then(value => {
  console.log('Evaluate result:', value); // Output: Evaluate result: Hello from ShadowRealm! undefined
});

// 验证主 Realm 的 Object.prototype 未被污染
console.log('Main Realm Object.prototype.shadowProp:', Object.prototype.shadowProp); // Output: Main Realm Object.prototype.shadowProp: undefined

// 2. 通过函数进行通信
const outerFunction = (arg) => {
  console.log('Outer function called with:', arg);
  return 'Response from Outer';
};

// 将外部函数传递到 ShadowRealm
// outerFunction 会在 ShadowRealm 中成为一个 Callable Proxy
realm.evaluate(`
  const proxiedOuterFunction = arguments[0]; // evaluate 的参数可以是 ArgumentList
  console.log('Proxied outer function type:', typeof proxiedOuterFunction); // Output: function

  proxiedOuterFunction('Message from ShadowRealm').then(res => {
    console.log('Received response from Outer:', res); // Output: Received response from Outer: Response from Outer
  });
`).then(() => {
  // 'arguments' 接收 evaluate 的额外参数
  // 注意：arguments[0] 是一个实际的参数数组，外层会将函数作为第一个元素传递
}, (err) => {
  console.error("Evaluation error:", err);
}, [outerFunction]); // 这里将 outerFunction 作为参数传递给 evaluate


// 3. 导入和导出模块
// 假设有一个名为 'my-module.js' 的文件在 ShadowRealm 的加载器可见路径中
// my-module.js
/*
  export function greet(name) {
    return `Hello, ${name} from module in ShadowRealm!`;
  }
  export const answer = 42;
*/

// 在主 Realm 中导入 ShadowRealm 内部模块的导出
realm.importValue('./my-module.js', 'greet').then(shadowGreet => {
  console.log('Type of shadowGreet:', typeof shadowGreet); // Output: Type of shadowGreet: function (Callable Proxy)
  shadowGreet('World').then(greeting => {
    console.log('Imported greet function result:', greeting); // Output: Imported greet function result: Hello, World from module in ShadowRealm!
  });
});

realm.importValue('./my-module.js', 'answer').then(shadowAnswer => {
  console.log('Imported answer:', shadowAnswer); // Output: Imported answer: 42 (原始值直接传递)
});


// 4. (可选) 从 ShadowRealm 导出函数 (需要 ShadowRealm 内的代码主动导出)
// 例如，在 ShadowRealm 内部可以这样定义并暴露函数:
realm.evaluate(`
  export function runInShadowRealm(data) {
    console.log('Running in ShadowRealm with data:', data);
    return 'ShadowRealm processed: ' + data;
  }
`).then(() => {
  // 此时，ShadowRealm 内部定义了一个导出函数 `runInShadowRealm`
  // 我们可以从外部再导入它
  realm.importValue(null /* special for current realm */, 'runInShadowRealm').then(shadowFunc => {
    shadowFunc('some data').then(res => {
      console.log('Result from ShadowRealm exported function:', res);
    });
  });
});

console.log('Main Realm continues...'); // 事件循环共享，这里会立即执行
```

## 四、ShadowRealm 与其他隔离机制的对比

| 特性 / 机制       | eval()            | Web Workers         | iframe                | ShadowRealm                 |
| :---------------- | :---------------- | :------------------ | :-------------------- | :-------------------------- |
| **隔离级别**      | 无隔离 (与主 Realm 共享所有状态) | 进程级隔离 (独立线程) | 进程级（或类似）隔离 | **Realm 级隔离** (独立全局和内置对象，共享事件循环) |
| **全局对象**      | 共享              | 独立                | 独立                  | 独立                        |
| **内置对象**      | 共享              | 独立                | 独立                  | 独立                        |
| **事件循环**      | 共享              | 独立                | 独立                  | **共享**                    |
| **DOM 访问**      | 可直接访问        | 不可直接访问        | 可直接访问（沙箱限制）| 不可直接访问 (仅共享事件循环) |
| **通信方式**      | 直接访问          | postMessage         | postMessage / 跨域通信| **Callable Proxy & 原始值** |
| **资源开销**      | 最小              | 较大 (新 OS 线程)   | 较大 (新文档，DOM)    | 轻量级 (仅 JS 运行时环境)   |
| **同步/异步执行** | 同步执行          | 异步执行            | 异步执行              | `evaluate` 和 `importValue` 返回 `Promise` (异步) |
| **主要用途**      | 动态代码执行、代码生成 | 耗时计算、后台任务    | UI 隔离、沙箱、跨域请求 | **JS 层面的沙箱、插件系统、模块化隔离、避免全局污染** |

## 五、潜在应用场景

1.  **沙箱执行第三方库/插件**：
    *   隔离来自第三方插件的代码，防止它们污染主应用环境，即使插件修改了 `Array.prototype` 也不会影响主应用。
    *   允许应用程序在运行时加载和卸载插件，而不会留下副作用。

2.  **Web组件与微前端**：
    *   为每个 Web 组件或微前端提供独立的 JavaScript 运行时环境，确保它们之间的隔离，同时能够共享同一事件循环响应用户交互，避免僵死状态。

3.  **SSR 中的隔离执行**：
    *   在 Node.js 环境中，为每个用户请求或每个组件的 SSR 渲染提供一个新的 ShadowRealm，以确保渲染逻辑的隔离性和状态的清洁性。

4.  **安全敏感型应用**：
    *   运行由用户上传的脚本，例如代码编辑器中的预览功能，或者游戏中的自定义逻辑脚本。

5.  **避免模块内部状态干扰**：
    *   一些模块库可能设计为单例模式，但实际应用中可能需要多次实例化且互不干扰，ShadowRealm 可以强制实现隔离。

## 六、发展现状与展望

*   **当前阶段**：ShadowRealm 提案目前处于 ECMAScript 规范的 **Stage 3** 阶段，这意味着其语法和语义已经相对稳定，并正在等待更广泛的实现和反馈。
*   **浏览器实现**：在 Chrome 和 Firefox 中已有一些实验性实现和标志。
*   **WebAssembly System Interface (WASI) 对齐**：ShadowRealm 与 WebAssembly Component Model 的隔离概念有相似之处，两者可以协同工作，为更安全的跨语言模块化提供基础。

虽然 ShadowRealm 提供强大的 JavaScript 代码隔离功能，但它**不提供操作系统级别的隔离**，**也不能阻止恶意代码消耗 CPU 或内存资源**（除非对其执行环境进行进一步的资源限制，但这超出了 ShadowRealm 本身的功能）。对于处理真正不受信任且可能具有恶意行为的代码，可能仍需要 `iframe` 与 `sandbox` 属性结合或服务器端沙箱机制。

## 七、总结

ECMAScript ShadowRealm 提案旨在为 JavaScript 开发者提供一个原生、轻量且强大的代码隔离工具。通过创建具有独立全局对象和内置对象，但共享事件循环的执行环境，它解决了传统隔离机制在性能、易用性或隔离粒度上的不足。ShadowRealm 的出现有望极大地提升 JavaScript 应用的安全性、模块化和可维护性，为构建更健壮、更灵活的现代Web应用程序和服务器端应用提供新的可能性。它的推广和普及，将为前端架构、插件系统和沙箱实践带来深远影响。
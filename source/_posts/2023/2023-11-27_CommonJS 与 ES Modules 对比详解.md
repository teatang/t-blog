---
title: CommonJS 与 ES Modules 对比详解
date: 2023-11-27 06:24:00
tags:
  - 2023
  - 项目构建
  - 前端技术
  - JavaScript
categories:
  - 前端技术
  - 项目构建
---
> 在 JavaScript 生态系统中，模块化是组织和重用代码的核心机制。随着 Web 应用复杂度的不断提升，以及 Node.js 等服务端 JavaScript 平台的兴起，对模块化方案的需求也日益增长。目前主流的两种模块化规范是 **CommonJS (CJS)** 和 **ES Modules (ESM)**。理解它们的异同对于现代 JavaScript 开发至关重要。

{% note info %}
核心思想：**CommonJS 诞生于服务端，采用同步加载，适用于 Node.js 的文件系统特性；ES Modules 是 JavaScript 官方标准，支持异步加载，同时适用于浏览器和 Node.js，具有静态分析、Tree Shaking 等高级特性。** 它们代表了 JavaScript 模块化的两种不同哲学和演进路径。
{% endnote %}
------

## 一、模块化简史与背景

在模块化规范出现之前，JavaScript 主要通过以下方式组织代码：

1.  **全局变量**：所有脚本共享全局命名空间，容易造成命名冲突和污染。
2.  **立即执行函数表达式 (IIFE)**：通过创建私有作用域来避免命名冲突，但依然需要手动管理依赖顺序。

随着前端应用变得复杂，以及 Node.js 的崛起，急需一种标准化的模块加载机制。

*   **CommonJS**：主要用于 Node.js 环境，是 Node.js 模块化的基石，采用**同步加载**。
*   **AMD (Asynchronous Module Definition)**：主要用于浏览器环境，如 RequireJS，采用**异步加载**。
*   **CMD (Common Module Definition)**：主要用于浏览器环境，如 Sea.js，兼顾 CommonJS 和 AMD 的特点。
*   **UMD (Universal Module Definition)**：一种通用模式，旨在兼容 CommonJS、AMD 和全局变量，使得模块可以在多种环境中使用。
*   **ES Modules (ESM)**：JavaScript 语言层面的官方模块化标准，旨在统一前端和后端模块化，采用**异步加载**。

## 二、CommonJS (CJS) 详解

### 2.1 产生背景与特点

CommonJS 规范最初是为了解决服务器端 JavaScript 的模块化问题而诞生的，尤其是为了 Node.js。

*   **同步加载**：这是其最显著的特点。当 `require()` 一个模块时，Node.js 会立即加载并执行该模块，然后返回模块的导出内容。这意味着在模块加载完成之前，后续代码不会执行。
*   **运行时加载**：模块的导入和导出发生在代码执行时。`require()` 语句可以在代码的任何地方出现，并且支持动态路径。
*   **值拷贝**：模块导出的是一个值的拷贝。一旦模块被加载，其导出内容的任何修改不会影响到已经导入它的模块。
*   **缓存机制**：每个模块在第一次加载后会被缓存。后续的 `require()` 调用将直接返回缓存中的模块实例，而不是重新加载和执行。

### 2.2 语法

*   **导出 (Export)**：
    *   `module.exports = ...`：导出单个对象或值，会完全覆盖默认的空对象。
    *   `exports.property = value`：导出多个属性，每次向 `exports` 对象添加属性。

*   **导入 (Import)**：
    *   `require('module-name')`：导入模块，并返回其导出的内容。

**示例：**

`math.js`
```javascript
// 导出单个对象
function add(a, b) {
  return a + b;
}

const subtract = (a, b) => a - b;

module.exports = {
  add,
  subtract
};

// 或者：
// exports.add = function(a, b) { return a + b; };
// exports.subtract = (a, b) => a - b;
```

`app.js`
```javascript
const math = require('./math'); // 同步加载

console.log(math.add(5, 3));      // 输出: 8
console.log(math.subtract(10, 4)); // 输出: 6

// 运行时加载示例
if (true) {
  const dynamicModule = require('./dynamic'); // 可以在条件语句中加载
  console.log(dynamicModule.message);
}
```

`dynamic.js`
```javascript
exports.message = 'I am a dynamically loaded module.';
```

### 2.3 适用场景

*   **Node.js 服务端开发**：CommonJS 是 Node.js 的默认模块系统，广泛应用于后端应用程序。
*   **构建工具**：Webpack、Browserify 等构建工具可以将 CommonJS 模块打包成浏览器可用的代码。

### 2.4 局限性

*   **同步加载不适合浏览器**：浏览器环境需要异步加载模块，避免阻塞 UI 渲染。
*   **不支持 Tree Shaking**：由于是运行时加载和值拷贝，无法进行静态分析，导致无法有效移除未使用的代码（Tree Shaking）。
*   **循环依赖处理复杂**：当模块之间存在循环依赖时，可能会出现未完全导出的对象问题。

## 三、ES Modules (ESM) 详解

### 3.1 产生背景与特点

ES Modules 是 ECMAScript 2015 (ES6) 引入的官方标准模块系统。它的设计目标是成为浏览器和 Node.js 的通用解决方案。

*   **异步加载**：默认是异步加载。在浏览器中，`<script type="module">` 标签会异步加载；在 Node.js 中，也支持异步加载。
*   **静态分析**：模块的导入和导出语句是在代码编译阶段（而不是运行时）确定的。这意味着可以在不执行代码的情况下分析模块的依赖关系。
*   **引用绑定 (Live Bindings)**：模块导出的是变量的引用，而不是值的拷贝。如果导出模块在后续执行中修改了导出的变量，那么导入模块也能观察到这个变化。
*   **支持 Tree Shaking**：由于是静态分析，打包工具可以识别哪些导出被使用了，从而移除未使用的代码，减小最终包的体积。
*   **严格模式**：ES Modules 自动运行在严格模式下。
*   **单一实例**：每个模块只会被加载和执行一次，无论它被导入多少次。

### 3.2 语法

*   **导出 (Export)**：
    *   **命名导出 (Named Exports)**：`export const name = value;`, `export function func() {}`, `export { name1, name2 };`
    *   **默认导出 (Default Export)**：`export default value;` (每个模块只能有一个默认导出)

*   **导入 (Import)**：
    *   **命名导入**：`import { name1, name2 } from 'module-name';`
    *   **默认导入**：`import defaultName from 'module-name';`
    *   **混合导入**：`import defaultName, { name1, name2 } from 'module-name';`
    *   **全部导入**：`import * as moduleAlias from 'module-name';`
    *   **副作用导入**：`import 'module-name';` (只执行模块，不导入任何绑定)
    *   **动态导入 (Dynamic Import)**：`import('module-name')`。返回一个 Promise，允许在运行时按需加载模块。

**示例：**

`math.mjs` (或在 `package.json` 中设置 `"type": "module"`)
```javascript
// 命名导出
export function add(a, b) {
  return a + b;
}

export const subtract = (a, b) => a - b;

// 默认导出 (每个模块只能有一个)
const multiply = (a, b) => a * b;
export default multiply;
```

`app.mjs`
```javascript
import multiply, { add, subtract } from './math.mjs'; // 导入默认导出和命名导出

console.log(add(5, 3));      // 输出: 8
console.log(subtract(10, 4)); // 输出: 6
console.log(multiply(2, 6)); // 输出: 12

// 动态导入示例
async function loadDynamicModule() {
  const dynamicModule = await import('./dynamic.mjs'); // 异步加载
  console.log(dynamicModule.message);
}
loadDynamicModule();
```

`dynamic.mjs`
```javascript
export const message = 'I am a dynamically loaded ES module.';
```

### 3.3 适用场景

*   **现代前端开发**：普遍应用于 React, Vue, Angular 等框架，结合 Webpack, Rollup 等打包工具。
*   **Node.js (实验性或新项目)**：Node.js 对 ESM 的支持逐渐成熟，尤其是在新项目中或需要 Tree Shaking 的场景。
*   **Web Workers 和 Service Workers**：ESM 是这些环境中唯一支持的模块系统。

### 3.4 浏览器中的 ESM

在浏览器中，使用 `<script type="module">` 标签来加载 ES Modules。

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>ES Modules Example</title>
</head>
<body>
  <script type="module" src="./app.mjs"></script>
</body>
</html>
```

## 四、CommonJS 与 ES Modules 对比

下表总结了 CommonJS 和 ES Modules 的主要区别：

| 特性           | CommonJS (CJS)                                   | ES Modules (ESM)                                       |
| :------------- | :----------------------------------------------- | :----------------------------------------------------- |
| **加载方式**   | 同步加载 (Synchronous)                           | 异步加载 (Asynchronous)                                |
| **执行时机**   | 运行时加载 (Runtime)                             | 编译时加载/静态分析 (Compile-time/Static Analysis)   |
| **导出值**     | 值拷贝 (Copy of values)                          | 引用绑定 (Live bindings)                               |
| **`this` 指向** | 模块内部的 `this` 指向 `module.exports`          | 模块内部的 `this` 为 `undefined`                       |
| **缓存**       | `require()` 第一次加载后缓存                     | 每个模块只执行一次，结果被缓存                         |
| **语法**       | `require()`, `module.exports`, `exports`         | `import`, `export`, `export default`                   |
| **动态导入**   | 支持 (任意位置 `require()`)                     | 支持 (`import()`)，返回 Promise，异步加载             |
| **Tree Shaking** | 不支持                                           | 支持 (基于静态分析)                                    |
| **循环依赖**   | 返回已导出部分的拷贝，可能不完整                 | 在执行时解决，返回绑定引用，通常更健壮                 |
| **默认格式**   | Node.js 默认                                     | 浏览器默认 (`<script type="module">`), Node.js 通过 `.mjs` 扩展名或 `package.json` 中的 `"type": "module"` 识别 |

### 模块加载机制对比图

{% mermaid %}
graph LR
    subgraph "CommonJS (Server-side/Node.js)"
        CJS_Entry["Entry Point (app.js)"] --> CJS_Require1{"require('moduleA')"}
        CJS_Require1 -- Synchronous --> CJS_ModuleA[Module A Code]
        CJS_ModuleA -- Returns Exports --> CJS_Entry
        CJS_Require2{"require('moduleB')"}
        CJS_Entry --> CJS_Require2
        CJS_Require2 -- Synchronous --> CJS_ModuleB[Module B Code]
        CJS_ModuleB -- Returns Exports --> CJS_Entry
        CJS_ModuleA -- Cached After First Load --> CJS_Require1
    end

    subgraph "ES Modules (Browser/Node.js)"
        ESM_Entry["Entry Point (app.mjs or <script type=module>)"]
        ESM_Entry --> ESM_Import1{import 'moduleA'}
        ESM_Import1 -- Static Analysis/Pre-parsing --> ESM_ModuleA[Module A Code]
        ESM_Entry --> ESM_Import2{import 'moduleB'}
        ESM_Import2 -- Static Analysis/Pre-parsing --> ESM_ModuleB[Module B Code]
        ESM_Entry -- Asynchronous Loading/Execution --> ESM_Final[Ready for use]
        ESM_ModuleA -- Live Bindings --> ESM_Entry
        ESM_ModuleB -- Live Bindings --> ESM_Entry
        ESM_Entry --- ESM_Dynamic{"import('./dynamic.mjs')"}
        ESM_Dynamic -- Returns Promise/Asynchronous --> ESM_DynamicModule[Dynamic Module]
    end
{% endmermaid %}

## 五、在 Node.js 中使用 ES Modules

Node.js 在 v12 及更高版本中对 ES Modules 的支持越来越完善。

**两种主要方式：**

1.  **`.mjs` 文件扩展名**：将文件命名为 `.mjs`，Node.js 会将其视为 ES Module。
2.  **`package.json` 的 `type` 字段**：在项目的 `package.json` 文件中添加 `"type": "module"`，则所有 `.js` 文件默认都被视为 ES Module。此时，如果需要使用 CommonJS 模块，可以将文件命名为 `.cjs`。

**混合使用：**

*   **ESM 中导入 CJS**：可以使用 `import cjsModule from 'cjs-module';` 或 `import * as cjsModule from 'cjs-module';`。Node.js 会将 CommonJS 模块包装成一个默认导出。
*   **CJS 中导入 ESM**：这是一个挑战，因为 CJS 是同步的，而 ESM 是异步的。通常需要使用动态 `import()` 语句，但由于 `import()` 返回 Promise，所以 CJS 模块必须在 `async` 函数中使用 `await` 来等待 ESM 模块加载完成。

```javascript
// CJS 模块 (index.js, type: commonjs)
const path = require('path');

async function main() {
  const { add } = await import('./es-module.mjs'); // 动态导入 ESM
  console.log('CJS importing ESM:', add(10, 20));
}
main();

// ESM 模块 (es-module.mjs, type: module)
import cjsModule from './cjs-module.cjs'; // 导入 CJS 模块
console.log('ESM importing CJS:', cjsModule.message);

export function add(a, b) {
  return a + b;
}

// CJS 模块 (cjs-module.cjs)
module.exports.message = "Hello from CJS!";
```

## 六、总结

CommonJS 和 ES Modules 各有其设计哲学和适用场景。CommonJS 简单直接，为 Node.js 提供了坚实的模块化基础，但其同步加载和缺乏静态分析的特性限制了它在现代前端和某些高性能场景的应用。ES Modules 作为语言标准，以其异步加载、静态分析和引用绑定的特性，成为了现代 JavaScript 开发的首选，它更好地支持 Tree Shaking 和跨环境统一模块化。

在实际开发中，我们通常会发现这两个模块系统并行存在。前端项目通常全面拥抱 ESM，而 Node.js 项目则在向 ESM 迁移的过程中，但仍有大量存量代码和第三方库使用 CommonJS。理解它们的原理和交互方式，是成为一名全面 JavaScript 开发者的必备知识。
---
title: JavaScript 宏任务与微任务详解
date: 2024-04-05 06:24:00
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

> **JavaScript** 是一种单线程语言，这意味着它在同一时间只能执行一个任务。然而，现代 Web 应用需要处理大量的异步操作，如网络请求、定时器、用户交互等。为了在单线程模型下实现非阻塞的并发执行，JavaScript 引入了**事件循环 (Event Loop)** 机制，并在此基础上划分了两种任务类型：**宏任务 (Macro tasks)** 和 **微任务 (Micro tasks)**。理解这两种任务及其执行顺序是掌握 JavaScript 运行时行为和优化性能的关键。

{% note info %}
核心思想：JavaScript 通过区分宏任务和微任务，并配合事件循环，在单线程环境下实现高效且有序的异步执行，确保程序的响应性和逻辑完整性。
{% endnote %}

------

## 一、为什么会有宏任务和微任务？

JavaScript 的单线程特性意味着所有代码都在一个主执行线程上运行。如果一个长时间运行的任务阻塞了主线程，整个页面就会“冻结”，用户体验极差。为了解决这个问题，异步操作被设计成非阻塞的：当一个异步操作完成时，它会把一个任务（通常是一个回调函数）推送到一个任务队列中，等待主线程空闲时再执行。

然而，仅仅有一个任务队列是不够的。某些异步任务比其他任务更“紧急”，需要更高的执行优先级。例如，`Promise` 的回调应该在当前脚本执行结束后、下一次事件循环开始前被处理，以确保数据的及时更新和状态的一致性。为了区分和管理这些不同优先级的异步任务，JavaScript 运行时引入了宏任务和微任务的概念，并为它们分配了不同的队列和执行时机。

## 二、核心概念

在深入了解宏任务和微任务之前，我们需要先了解它们赖以存在的基础：**事件循环 (Event Loop)**。

### 2.1 事件循环 (Event Loop)

**事件循环**是 JavaScript 运行时（无论是浏览器还是 Node.js）的核心组成部分，它负责调度和执行代码。其基本工作原理如下：

1.  **执行栈 (Call Stack)**：同步代码在执行栈中自上而下执行。
2.  **任务队列 (Task Queue / Callback Queue)**：当异步操作（如 `setTimeout`, DOM 事件）完成时，其关联的回调函数会被推送到任务队列（宏任务队列）。
3.  **微任务队列 (Microtask Queue)**：当某些特定异步操作（如 `Promise` 的回调）完成时，其关联的回调函数会被推送到微任务队列。

事件循环会持续检查执行栈是否为空。**当执行栈为空时，事件循环会先检查微任务队列。如果微任务队列不为空，它会清空微任务队列中所有的任务并执行它们。当微任务队列也为空后，事件循环才会从宏任务队列中取出一个宏任务，将其推到执行栈中执行。** 然后重复这个过程。

### 2.2 宏任务 (Macro Tasks)

**宏任务**是更大、离散的工作单元。它们通常涉及与浏览器或 Node.js 运行时进行大量交互，并且在一个轮次的事件循环中只会执行一个宏任务。一旦一个宏任务完成，V8 引擎可能会将控制权交还给浏览器，让其进行渲染更新，然后才开始处理微任务。

#### 2.2.1 常见的宏任务来源

*   **`setTimeout(callback, delay)`**：定时器回调。
*   **`setInterval(callback, delay)`**：定时器回调。
*   **I/O 操作**：例如，网络请求（在浏览器中通常是宏任务，例如 `XmlHttpRequest` 的 `onload` 事件），文件读写。
*   **UI 渲染**：浏览器自身的渲染操作通常被视为宏任务之后发生。
*   **`MessageChannel` (postMessage)**：用于跨帧/线程通信。
*   **DOM 事件**：如 `click`, `load` 等事件的回调。
*   **`requestAnimationFrame` (注：严格来说，`requestAnimationFrame` 不属于宏任务或微任务，它在浏览器重绘之前执行，位于事件循环的另一个特定阶段)。**

### 2.3 微任务 (Micro Tasks)

**微任务**是粒度更小、优先级更高的异步任务。它们需要在当前宏任务执行结束后，浏览器渲染更新之前，尽可能快地执行。微任务队列会在当前宏任务执行完毕后立即清空，这意味着在下一个宏任务开始执行之前，所有排队的微任务都将被执行。

#### 2.3.1 常见的微任务来源

*   **`Promise` 的回调**：`.then()`, `.catch()`, `.finally()` 指定的回调函数。
*   **`async/await` 中的 `await` 关键字**：`await` 后面的表达式会被立即执行，但 `await` 之后的代码（如果 `await` 的 Promise 解析了）会被包装成一个微任务。
*   **`MutationObserver` 回调**：用于监听 DOM 变化。
*   **`queueMicrotask(callback)`**：显式地将一个函数加入微任务队列。

## 三、事件循环的执行顺序 (宏任务 vs 微任务)

理解事件循环的执行顺序是区分宏任务和微任务的关键。一个事件循环的迭代（或“tick”）大致遵循以下步骤：

1.  **执行当前同步代码**：从调用栈中拿出并执行同步代码，直到调用栈为空。
2.  **执行所有微任务**：当同步代码执行完毕后，检查微任务队列。如果微任务队列不为空，则清空并执行所有微任务。每次执行一个微任务，都检查是否有新微任务加入队列，直到微任务队列完全清空。
3.  **UI 渲染/其他任务**：在浏览器环境中，在清空微任务队列后、下一个宏任务开始前，浏览器可能会进行渲染更新。
4.  **执行一个宏任务**：从宏任务队列中取出一个宏任务，将其推到执行栈中执行。
5.  **重复步骤 2-4**：当该宏任务执行完毕后，再次回到步骤 2，清空微任务队列，然后（如果需要）进行渲染，再取下一个宏任务执行，如此循环。

**简而言之：一个宏任务执行完毕后，所有微任务都会被清空并执行，然后才轮到下一个宏任务。**

### 3.1 流程图

{% mermaid %}
graph TD
    %% 入口
    Start(["<b>START</b>"]) --> Stack{"Execution Stack <br/> Empty?"}

    %% 主路径
    Stack -- "No (Executing JS)" --> Stack
    Stack -- "Yes" --> MicroQ{"Microtask Queue <br/> Empty?"}

    %% 微任务循环 (内部小循环)
    MicroQ -- "No" --> ExecMicro["<b>Execute ALL</b> <br/> Microtasks"]
    ExecMicro --> MicroQ

    %% 渲染阶段
    MicroQ -- "Yes" --> Render["<b>Browser Rendering</b> <br/> (Style, Layout, Paint)"]

    %% 宏任务处理 (取出一个)
    Render --> MacroQ{"Macrotask Queue <br/> Empty?"}
    
    MacroQ -- "No" --> ExecOneMacro["<b>Execute ONE</b> <br/> Macrotask"]
    ExecOneMacro --> MicroQCheck[回到微任务检查点]
    
    %% 关键逻辑：宏任务执行完必须立刻检查微任务
    MicroQCheck -.-> MicroQ

    %% 空闲状态
    MacroQ -- "Yes" --> Wait["Wait for Tasks <br/> (Idle)"]
    Wait --> Stack

    %% --- 黑暗模式样式优化 ---
    style Start fill:#238636,color:#fff,stroke:none
    style Stack fill:#1f6feb,color:#fff,stroke-width:2px
    
    %% 微任务高亮 (金色/黄色，代表高优先级)
    style MicroQ fill:#d29922,color:#000,font-weight:bold
    style ExecMicro fill:#f1e05a,color:#000
    
    %% 渲染高亮 (绿色，代表可见输出)
    style Render fill:#3fb950,color:#000,font-weight:bold
    
    %% 宏任务高亮 (蓝色)
    style MacroQ fill:#388bfd,color:#fff
    style ExecOneMacro fill:#1f6feb,color:#fff
    
    %% 连线颜色
    linkStyle default stroke:#8b949e,stroke-width:1px
    linkStyle 2,3 stroke:#f1e05a,stroke-width:2px,color:#f1e05a
{% endmermaid %}

**说明：**
*   **虚线圈 (Microtask Queue)**：表示在每个宏任务之间，会完整地清空微任务队列。
*   **实线圈 (Macrotask Queue)**：表示每个事件循环迭代只会从宏任务队列中取出一个宏任务来执行。

## 四、代码示例 (JavaScript)

为了更好地说明宏任务和微任务的执行顺序，我们将使用 JavaScript 代码进行演示。

```javascript
console.log('Script start'); // 同步任务 1

setTimeout(function () {
    console.log('setTimeout 1'); // 宏任务 1
    Promise.resolve().then(function () {
        console.log('setTimeout 1 Promise'); // 微任务 3 （在宏任务 1 内部创建）
    });
}, 0);

Promise.resolve().then(function () {
    console.log('Promise 1'); // 微任务 1
});

setTimeout(function () {
    console.log('setTimeout 2'); // 宏任务 2
}, 0);

Promise.resolve().then(function () {
    console.log('Promise 2'); // 微任务 2
});

console.log('Script end'); // 同步任务 2
```

**预期的输出顺序：**

1.  `Script start` (同步代码)
2.  `Script end` (同步代码)
3.  `Promise 1` (微任务 1)
4.  `Promise 2` (微任务 2)
5.  `setTimeout 1` (宏任务 1)
6.  `setTimeout 1 Promise` (微任务 3)
7.  `setTimeout 2` (宏任务 2)

**详细解释执行流程：**

1.  **初始同步执行：**
    *   `console.log('Script start');` => 输出 `Script start`
    *   `setTimeout(() => { ... }, 0);` => 将回调函数 `function () { console.log('setTimeout 1'); ... }` 放入**宏任务队列**。
    *   `Promise.resolve().then(() => { ... });` => 将回调函数 `function () { console.log('Promise 1'); }` 放入**微任务队列**。
    *   `setTimeout(() => { ... }, 0);` => 将回调函数 `function () { console.log('setTimeout 2'); }` 放入**宏任务队列**。
    *   `Promise.resolve().then(() => { ... });` => 将回调函数 `function () { console.log('Promise 2'); }` 放入**微任务队列**。
    *   `console.log('Script end');` => 输出 `Script end`
    *   至此，同步代码执行完毕，执行栈清空。

    **当前状态：**
    *   **输出:** `Script start`, `Script end`
    *   **宏任务队列:** [`setTimeout 1` callback, `setTimeout 2` callback]
    *   **微任务队列:** [`Promise 1` callback, `Promise 2` callback]

2.  **清空微任务队列 (第一次)：**
    *   执行微任务队列中的 `Promise 1` callback => 输出 `Promise 1`
    *   执行微任务队列中的 `Promise 2` callback => 输出 `Promise 2`
    *   微任务队列清空。

    **当前状态：**
    *   **输出:** `Script start`, `Script end`, `Promise 1`, `Promise 2`
    *   **宏任务队列:** [`setTimeout 1` callback, `setTimeout 2` callback]
    *   **微任务队列:** []

3.  **执行第一个宏任务：**
    *   从宏任务队列中取出第一个任务 `setTimeout 1` callback 并执行。
    *   在 `setTimeout 1` callback 内部：
        *   `console.log('setTimeout 1');` => 输出 `setTimeout 1`
        *   `Promise.resolve().then(() => { ... });` => 将回调函数 `function () { console.log('setTimeout 1 Promise'); }` 放入**微任务队列**。
    *   `setTimeout 1` callback 执行完毕。

    **当前状态：**
    *   **输出:** `Script start`, `Script end`, `Promise 1`, `Promise 2`, `setTimeout 1`
    *   **宏任务队列:** [`setTimeout 2` callback]
    *   **微任务队列:** [`setTimeout 1 Promise` callback]

4.  **清空微任务队列 (第二次)：**
    *   执行微任务队列中的 `setTimeout 1 Promise` callback => 输出 `setTimeout 1 Promise`
    *   微任务队列清空。

    **当前状态：**
    *   **输出:** `Script start`, `Script end`, `Promise 1`, `Promise 2`, `setTimeout 1`, `setTimeout 1 Promise`
    *   **宏任务队列:** [`setTimeout 2` callback]
    *   **微任务队列:** []

5.  **执行第二个宏任务：**
    *   从宏任务队列中取出第一个任务 `setTimeout 2` callback 并执行。
    *   在 `setTimeout 2` callback 内部：
        *   `console.log('setTimeout 2');` => 输出 `setTimeout 2`
    *   `setTimeout 2` callback 执行完毕。

    **当前状态：**
    *   **输出:** `Script start`, `Script end`, `Promise 1`, `Promise 2`, `setTimeout 1`, `setTimeout 1 Promise`, `setTimeout 2`
    *   **宏任务队列:** []
    *   **微任务队列:** []

6.  **所有任务执行完毕。**

## 五、为什么引入微任务？

引入微任务的主要是为了解决以下问题：

1.  **及时更新 UI / 状态一致性**：`Promise` 常常用于异步数据的获取和处理。如果 `Promise` 的回调被当作宏任务，那么在数据到达并被处理后，可能会在显示更新数据之前，浏览器又执行了其他宏任务（例如用户交互事件），这可能导致 UI 闪烁或状态不一致。微任务确保 `Promise` 相关的更新能在当前宏任务结束后、渲染之前立即完成，保证用户看到的数据是最新的。
2.  **避免冗余渲染**：如果一系列 Promise 操作会导致多次状态更新，并将这些更新视为宏任务，每次更新都可能触发浏览器重渲染。通过将它们作为微任务处理，所有相关的状态更新可以在一个宏任务周期内完成，然后一次性进行渲染，提高效率。
3.  **精确控制执行顺序**：微任务提供了比宏任务更精细的异步调度控制，使得开发者可以更准确地预测和控制代码的执行时机，尤其是在处理复杂的异步流时。

## 六、潜在的陷阱与最佳实践

### 6.1 无限微任务循环

如果在一个微任务中又创建了大量的微任务，并且这些微任务又持续创建新的微任务，那么微任务队列可能永远无法清空。这将导致事件循环无法进入下一个宏任务阶段，从而“饿死”宏任务，甚至阻塞 UI 渲染，造成页面卡死。

```javascript
// 危险的示例：无限微任务循环
let count = 0;
function createMicrotask() {
    Promise.resolve().then(() => {
        console.log('Microtask', ++count);
        if (count < 10000) { // 实际中这个条件可能不存在或不容易满足
            createMicrotask();
        }
    });
}
createMicrotask();
console.log('Script end');
// 在这个例子中，如果 count 增长过快，会阻塞其他宏任务
```

**最佳实践**：避免在微任务中无限制地创建新的微任务，尤其是在没有明确退出条件的情况下。

### 6.2 理解 `async/await`

`async/await` 是基于 `Promise` 的语法糖，其内部行为也遵循微任务的规则：

*   `async` 函数会返回一个 `Promise`。
*   当 `await` 一个 Promise 时，如果该 Promise 已经解决，则 `await` 后面的代码会立即执行（但不阻塞外部同步代码，它仍会被包装成微任务）。
*   如果 `await` 的 Promise 尚未解决，那么 `async` 函数会暂停执行，将控制权交还给调用者。当被 `await` 的 Promise 解决后，`async` 函数会作为微任务在当前事件循环的微任务队列中恢复执行。

### 6.3 优先级的利用

了解宏任务和微任务的优先级可以帮助我们更好地设计异步操作：

*   **需要立即更新状态或确保数据一致性**时，倾向于使用 `Promise` 或 `queueMicrotask`。
*   **需要等待一段时间再执行**或**处理用户输入/长时计算**，以避免阻塞 UI 渲染时，使用 `setTimeout` 或 `requestAnimationFrame`。

## 七、总结

JavaScript 的宏任务和微任务是事件循环机制的重要组成部分，它们共同协作，确保了单线程 JavaScript 能够高效、非阻塞地处理异步操作。

*   **宏任务**是较大的异步任务，如定时器、I/O 和 UI 渲染，每个事件循环周期只执行一个。
*   **微任务**是较小、优先级更高的异步任务，如 Promise 的回调和 `async/await` 的恢复执行，它们在每个宏任务执行后、下一个宏任务开始前，会被完全清空并执行。

掌握这一机制对于编写高性能、响应式且易于调试的 JavaScript 应用至关重要，特别是当需要处理复杂的异步流程时。
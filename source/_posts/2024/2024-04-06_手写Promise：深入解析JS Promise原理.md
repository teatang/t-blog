---
title: 手写Promise：深入解析JavaScript Promise原理
date: 2024-04-06 06:24:00
tags: 
    - 2024
    - 前端技术
    - JavaScript
    - Promise
    - 源码分析
    - 编程语法
categories: 
  - 前端技术
  - JavaScript
---

> **Promise** 是 JavaScript 中进行**异步编程**的解决方案之一，它代表了一个异步操作的最终完成（或失败）及其结果值。它提供了一种更结构化、更易于管理和理解异步操作的方式，旨在解决传统回调函数所导致的“回调地狱 (Callback Hell)”问题。Promise 对象在 ES6 (ECMAScript 2015) 中被正式纳入标准，成为了现代 JavaScript 异步编程的基石。

{% note info %}
核心思想：**Promise 是一种异步操作的状态容器。它将异步操作封装成一个对象，提供统一的接口（`.then()`, `.catch()`, `.finally()`）来处理操作成功时的数据和失败时的错误，从而避免深层嵌套回调，使异步代码扁平化且更具可读性。**
{% endnote %}
------

## 一、为什么需要 Promise？—— 回调地狱的困境

在 Promise 出现之前，JavaScript 主要通过回调函数 (Callback Function) 来处理异步操作。当多个异步操作需要按顺序执行，或者一个异步操作的结果依赖于另一个异步操作时，就会导致回调函数的层层嵌套，形成难以阅读和维护的“回调地狱”：

```javascript
// 传统回调地狱示例
getData(function(a) {
  getMoreData(a, function(b) {
    getEvenMoreData(b, function(c) {
      getFinalData(c, function(d) {
        console.log('Got all data:', d);
      }, function(error) {
        console.error('Error at final step:', error);
      });
    }, function(error) {
      console.error('Error at even more step:', error);
    });
  }, function(error) {
    console.error('Error at more step:', error);
  });
}, function(error) {
  console.error('Error at initial step:', error);
});
```
这种代码不仅可读性差，错误处理也十分复杂。Promise 正是为了解决这些痛点而生。

## 二、Promise 的基本概念

### 2.1 Promise 的三种状态

Promise 对象有且仅有以下三种状态：

1.  **Pending (进行中)**：初始状态，既不是成功也不是失败。
2.  **Fulfilled (已成功)**：操作成功完成，Promise 成功地返回了一个值。
3.  **Rejected (已失败)**：操作失败，Promise 抛出了一个错误原因。

**状态转换规则**：
*   Promise 只能从 `Pending` 状态转换为 `Fulfilled` 或 `Rejected` 状态。
*   一旦 Promise 转换到 `Fulfilled` 或 `Rejected` 状态，其状态就不可再改变，且会携带一个最终结果（成功值或失败原因）。这个过程被称为 **settled (已敲定)**。

{% mermaid %}
graph TD
    A[Pending] --> B{Fulfilled}
    A[Pending] --> C{Rejected}
    B --> D[Settled]
    C --> D[Settled]
{% endmermaid %}

### 2.2 Promise 的构造函数

Promise 的构造函数接收一个 `executor` (执行器) 函数作为参数。这个 `executor` 函数会立即执行，并接收两个参数：`resolve` 和 `reject`，它们都是函数。

*   `resolve(value)`：在异步操作成功时调用，将 Promise 的状态从 `Pending` 变为 `Fulfilled`，并将 `value` 作为成功的结果。
*   `reject(reason)`：在异步操作失败时调用，将 Promise 的状态从 `Pending` 变为 `Rejected`，并将 `reason` 作为失败的原因。

```javascript
const myPromise = new Promise((resolve, reject) => {
  // 模拟异步操作
  setTimeout(() => {
    const success = Math.random() > 0.5;
    if (success) {
      resolve('Operation successful!'); // 成功时调用 resolve
    } else {
      reject('Operation failed!');    // 失败时调用 reject
    }
  }, 1000);
});

console.log('Promise is pending initially.'); // 立即打印
```

### 2.3 `then()`, `catch()`, `finally()`

Promise 对象提供了 `.then()`, `.catch()`, `.finally()` 方法来注册在 Promise 状态改变时执行的回调函数。

*   **`.then(onFulfilled, onRejected)`**：
    *   接收两个可选参数：`onFulfilled` (成功回调) 和 `onRejected` (失败回调)。
    *   `onFulfilled` 在 Promise 状态为 `Fulfilled` 时执行，接收成功值作为参数。
    *   `onRejected` 在 Promise 状态为 `Rejected` 时执行，接收失败原因作为参数。
    *   `then()` 方法总是返回一个新的 Promise，允许进行**链式调用 (Chaining)**。

*   **`.catch(onRejected)`**：
    *   是 `.then(null, onRejected)` 的语法糖，专门用于处理 Promise 链中的错误。
    *   如果在 `then` 的 `onFulfilled` 回调中抛出错误，或者上一个 Promise 被 `rejected`，`.catch()` 会捕获到这个错误。

*   **`.finally(onFinally)`**：
    *   ES2018 引入。无论 Promise 最终是 `Fulfilled` 还是 `Rejected`，`finally()` 回调都会执行。
    *   它不接收任何参数，且返回值不会影响 Promise 链的最终结果（但如果 `finally` 回调返回一个 rejected Promise，则会覆盖之前的状态）。
    *   常用于执行清理工作。

**链式调用示例**：

```javascript
myPromise
  .then((data) => {
    console.log('Success:', data);
    return data + ' -- processed'; // 返回一个值，会包装成新的 Fulfilled Promise
  })
  .then((processedData) => {
    console.log('Further processing:', processedData);
    // return Promise.reject(new Error('Something went wrong after processing!')); // 可以在这里抛出错误
  })
  .catch((error) => {
    console.error('Caught error:', error);
    return 'Recovered from error'; // 可以在 catch 中恢复，让链条继续向下执行 Fulfilled 状态
  })
  .finally(() => {
    console.log('Promise chain finished, regardless of success or failure.');
  });
```

### 2.4 错误冒泡机制

Promise 的错误处理具有**冒泡机制**：
*   当一个 Promise 被 `rejected`，或者在任何 `.then()` 或 `.catch()` 回调中抛出同步错误，这个错误会沿着 Promise 链向下传递，直到遇到最近的 `.catch()` 或 `.then(null, onRejected)` 回调来处理它。
*   如果没有 `catch` 处理器来处理 Promise 链中的错误，该错误最终会作为未捕获的 Promise 拒绝 (unhandled promise rejection) 冒泡到全局，可能导致应用程序崩溃或警告。

## 三、Promise 的静态方法

除了实例方法，`Promise` 构造函数还提供了一些有用的静态方法来处理多个 Promise。

*   **`Promise.all(iterable)`**：
    *   接收一个 Promise 可迭代对象（如数组）作为参数。
    *   当所有 Promise 都 `Fulfilled` 时，`Promise.all` 返回一个 `Fulfilled` 的 Promise，其结果是一个数组，包含所有 Promise 的成功值（按传入顺序）。
    *   只要其中任何一个 Promise 被 `Rejected`，`Promise.all` 就会立即 `Rejected`，并返回第一个拒绝的原因。
    *   **适用场景**：所有异步任务都需要成功。

*   **`Promise.race(iterable)`**：
    *   接收一个 Promise 可迭代对象作为参数。
    *   返回一个 Promise，其状态和结果与可迭代对象中**第一个** `settled` 的 Promise 相同（无论是 `Fulfilled` 还是 `Rejected`）。
    *   **适用场景**：赛跑，只关心最快的那个结果。

*   **`Promise.allSettled(iterable)`** (ES2020)：
    *   接收一个 Promise 可迭代对象作为参数。
    *   返回一个 Promise，当所有 Promise 都**已敲定** (settled，即无论是 `Fulfilled` 还是 `Rejected`) 时，该 Promise 会 `Fulfilled`。
    *   其结果是一个对象数组，每个对象描述了每个 Promise 的结果，包含 `status` (`'fulfilled'` 或 `'rejected'`) 和 `value` (成功值) 或 `reason` (失败原因)。
    *   **适用场景**：不关心所有任务是否成功，只关心所有任务是否都已完成。

*   **`Promise.any(iterable)`** (ES2021)：
    *   接收一个 Promise 可迭代对象作为参数。
    *   返回一个 Promise，当其中任何一个 Promise 被 `Fulfilled` 时，该 Promise 就会 `Fulfilled`，并返回第一个成功的结果。
    *   如果所有 Promise 都被 `Rejected`，则 `Promise.any` 返回一个 `Rejected` 的 Promise，并带有一个 `AggregateError` 类型的错误，其中包含了所有拒绝的原因。
    *   **适用场景**：只要有一个成功就足够。

```javascript
// Promise.all 示例
Promise.all([
  Promise.resolve(1),
  new Promise(res => setTimeout(() => res(2), 100)),
  Promise.resolve(3)
]).then(values => console.log('All values:', values)); // All values: [1, 2, 3]

// Promise.race 示例
Promise.race([
  new Promise(res => setTimeout(() => res('Fast'), 50)),
  new Promise((_, rej) => setTimeout(() => rej('Slow Error'), 100))
]).then(value => console.log('Race winner:', value)); // Race winner: Fast

// Promise.allSettled 示例
Promise.allSettled([
  Promise.resolve('Success!'),
  Promise.reject('Error occurred!'),
  new Promise(res => setTimeout(() => res('Delayed success'), 50))
]).then(results => console.log('All settled:', results));
/*
All settled: [
  { status: 'fulfilled', value: 'Success!' },
  { status: 'rejected', reason: 'Error occurred!' },
  { status: 'fulfilled', value: 'Delayed success' }
]
*/
```

## 四、手写一个简易版 Promise

现在，我们尝试手写一个名为 `MyPromise` 的简易 Promise 实现，以加深理解其内部机制。这个实现将覆盖 Promise 的核心功能：状态管理、`resolve`/`reject`、`then` 方法的链式调用和错误处理。

**核心思路**：
1.  **状态管理**：使用 `this.state` 存储 Promise 当前状态 (`pending`, `fulfilled`, `rejected`)。
2.  **结果存储**：使用 `this.value` 存储成功结果，`this.reason` 存储失败原因。
3.  **回调队列**：因为 `then` 可能在 Promise 状态为 `pending` 时被调用，需要存储所有待执行的 `onFulfilled` 和 `onRejected` 回调函数。当 Promise 状态改变时，遍历并执行这些回调。
4.  **异步执行**：为模拟 Promise 的异步特性，我们将回调函数的执行放入 `setTimeout(..., 0)` 中，使其成为宏任务 (Macrotask)，尽管原生 Promise 使用微任务 (Microtask)。
5.  **链式调用**：`then` 方法必须返回一个新的 `Promise` 对象。新 Promise 的状态由 `then` 中回调函数的返回值决定。

```javascript
/**
 * 简易版 MyPromise 实现
 * 符合 Promise/A+ 规范的核心部分
 */
class MyPromise {
  constructor(executor) {
    // 1. 初始化 Promise 状态和结果
    this.state = 'pending';       // Promise 状态：pending, fulfilled, rejected
    this.value = undefined;       // 成功时的值
    this.reason = undefined;      // 失败时的原因

    // 2. 存储 pending 状态下注册的 onFulfilled 和 onRejected 回调
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    // 3. resolve 函数：将 Promise 状态从 pending 变为 fulfilled
    const resolve = (value) => {
      // Promise 状态一旦改变就不可再变
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        // 状态变为 fulfilled 后，执行所有待定的 onFulfilled 回调
        this.onFulfilledCallbacks.forEach(callback => {
          // 模拟微任务，确保回调异步执行
          setTimeout(() => callback(this.value), 0);
        });
      }
    };

    // 4. reject 函数：将 Promise 状态从 pending 变为 rejected
    const reject = (reason) => {
      // Promise 状态一旦改变就不可再变
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.reason = reason;
        // 状态变为 rejected 后，执行所有待定的 onRejected 回调
        this.onRejectedCallbacks.forEach(callback => {
          // 模拟微任务，确保回调异步执行
          setTimeout(() => callback(this.reason), 0);
        });
      }
    };

    // 5. 执行器函数立即执行，并捕获可能发生的同步错误
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error); // 捕获到错误，直接 reject Promise
    }
  }

  // 6. then 方法：用于注册成功和失败的回调
  then(onFulfilled, onRejected) {
    // 确保 onFulfilled 和 onRejected 是函数，如果不是，提供默认的“透传”函数
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason; };

    // then 方法必须返回一个新的 Promise，以支持链式调用
    const promise2 = new MyPromise((resolve, reject) => {
      // 辅助函数，处理回调的执行逻辑，确保新的 Promise 状态正确
      const handleCallback = (callback, data) => {
        setTimeout(() => { // 模拟微任务
          try {
            const result = callback(data); // 执行用户提供的回调
            if (result instanceof MyPromise) {
              // 如果回调返回一个 Promise，则等待其解决，并传递其结果
              result.then(resolve, reject);
            } else {
              // 否则，直接用其返回值解决新的 Promise
              resolve(result);
            }
          } catch (error) {
            // 如果回调执行中抛出错误，则 reject 新的 Promise
            reject(error);
          }
        }, 0);
      };

      // 根据当前 Promise 的状态，决定执行哪个回调
      if (this.state === 'fulfilled') {
        handleCallback(onFulfilled, this.value);
      } else if (this.state === 'rejected') {
        handleCallback(onRejected, this.reason);
      } else if (this.state === 'pending') {
        // 如果当前 Promise 还在 pending 状态，将回调存储起来
        this.onFulfilledCallbacks.push(value => handleCallback(onFulfilled, value));
        this.onRejectedCallbacks.push(reason => handleCallback(onRejected, reason));
      }
    });

    return promise2; // 返回新的 Promise，支持链式调用
  }

  // 7. catch 方法：then(null, onRejected) 的语法糖
  catch(onRejected) {
    return this.then(null, onRejected);
  }

  // 8. finally 方法：无论成功或失败都会执行的回调
  finally(callback) {
    return this.then(
      value => MyPromise.resolve(callback()).then(() => value),
      reason => MyPromise.resolve(callback()).then(() => { throw reason; })
    );
  }

  // 9. 静态方法 resolve
  static resolve(value) {
    if (value instanceof MyPromise) {
      return value;
    }
    return new MyPromise(resolve => resolve(value));
  }

  // 10. 静态方法 reject
  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

  // 11. 静态方法 all (简化版)
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let completed = 0;
      const total = promises.length;

      if (total === 0) {
        resolve([]);
        return;
      }

      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(value => {
          results[index] = value;
          completed++;
          if (completed === total) {
            resolve(results);
          }
        }).catch(reason => {
          reject(reason); // 任何一个拒绝，则全部拒绝
        });
      });
    });
  }

  // 其他静态方法如 race, allSettled, any 类似，此处省略具体实现
}
```

**测试手写 Promise**：

```javascript
console.log('--- 开始测试 MyPromise ---');

// 1. 基本成功示例
const p1 = new MyPromise((resolve) => {
  setTimeout(() => resolve('Hello from P1'), 100);
});

p1.then(data => {
  console.log('P1 Success:', data); // 约 100ms 后输出
  return 'Processed ' + data;
})
.then(data => {
  console.log('P1 Chained Success:', data); // 紧接着输出
});

// 2. 基本失败示例
const p2 = new MyPromise((_, reject) => {
  setTimeout(() => reject(new Error('P2 failed!')), 200);
});

p2.then(null, error => {
  console.error('P2 Error:', error.message); // 约 200ms 后输出
  return 'P2 Recovered'; // 错误被捕获并恢复
})
.then(data => {
  console.log('P2 Chained after recovery:', data); // 紧接着输出
})
.catch(err => {
    console.error('This should not be called if P2 recovered:', err.message);
});


// 3. catch 和 finally
const p3 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    if (Math.random() > 0.5) {
      resolve('P3 Resolved!');
    } else {
      reject('P3 Rejected!');
    }
  }, 300);
});

p3.then(data => console.log('P3 Success Handler:', data))
  .catch(error => console.error('P3 Catch Handler:', error))
  .finally(() => console.log('P3 Finally Handler (always runs)'));

// 4. then 回调中返回 Promise
const p4 = new MyPromise(resolve => {
  setTimeout(() => resolve('First step for P4'), 50);
});

p4.then(msg => {
  console.log(msg);
  return new MyPromise(resolve => setTimeout(() => resolve('Second step for P4'), 50));
})
.then(msg => {
  console.log(msg);
  return 'Third step for P4';
})
.then(msg => {
  console.log(msg);
});

// 5. Promise.all 示例
const pAll1 = MyPromise.resolve(1);
const pAll2 = new MyPromise(r => setTimeout(() => r(2), 10));
const pAll3 = MyPromise.resolve(3);

MyPromise.all([pAll1, pAll2, pAll3]).then(results => {
  console.log('MyPromise.all success:', results); // [1, 2, 3]
});

const pAllFail = MyPromise.all([
  MyPromise.resolve('OK'),
  MyPromise.reject('FAIL!'),
  MyPromise.resolve('Another OK')
]);

pAllFail.catch(error => {
  console.error('MyPromise.all failed:', error); // FAIL!
});


console.log('--- 结束测试 MyPromise (注意异步输出顺序) ---'); // 立即输出
```

**代码解释**：
*   **`constructor(executor)`**：接收执行器函数，并立即执行。它定义了 `resolve` 和 `reject` 局部函数，供 `executor` 调用。
*   **状态和回调队列**：`state`, `value`, `reason` 存储 Promise 的核心信息。`onFulfilledCallbacks` 和 `onRejectedCallbacks` 是关键，用于在 Promise 处于 `pending` 状态时，暂存 `.then()` 方法注册的回调。
*   **`resolve(value)` 和 `reject(reason)`**：它们会检查当前状态，只在 `pending` 时才会修改状态和结果。状态一旦改变，它们就会遍历并异步执行所有相应的回调（`setTimeout(..., 0)` 模拟异步）。
*   **`then(onFulfilled, onRejected)`**：
    *   首先对 `onFulfilled` 和 `onRejected` 进行类型检查，并提供默认的“透传”行为，以确保链式调用能够继续。
    *   **核心是返回一个新的 `MyPromise` 对象 (`promise2`)**。
    *   `handleCallback` 辅助函数处理了回调执行中的所有情况：
        *   `setTimeout` 确保回调异步执行。
        *   捕获回调执行中的同步错误。
        *   如果回调返回一个 `MyPromise` 实例，则等待该 Promise 解决，并将结果传递给 `promise2`。
        *   如果回调返回非 Promise 值，则直接用该值解决 `promise2`。
    *   根据当前 `MyPromise` 的状态，`then` 会立即执行相应的回调，或者将它们推入 `onFulfilledCallbacks`/`onRejectedCallbacks` 队列。
*   **`catch(onRejected)`**：直接复用 `then(null, onRejected)`。
*   **`finally(callback)`**：在 `then` 方法的基础上实现，确保 `callback` 总是执行，且其返回值不会改变 Promise 的最终状态（除非 `callback` 返回一个拒绝的 Promise）。
*   **静态方法 `resolve` 和 `reject`**：提供快速创建已解决或已拒绝 Promise 的方式。
*   **静态方法 `all`**：接收 Promise 数组，并返回一个新的 Promise。当所有传入的 Promise 都成功时，它才成功；否则，只要有一个失败，它就失败。

## 五、总结

Promise 是 JavaScript 异步编程的核心，它通过将异步操作包装成一个状态可控的对象，并提供链式调用的 `.then()`, `.catch()`, `.finally()` 方法，彻底改变了传统回调地狱的困境。理解 Promise 的状态、状态转换规则以及链式调用的机制，对于编写清晰、健壮的异步 JavaScript 代码至关重要。通过手写一个简易 Promise，我们不仅深入理解了其内部工作原理，也为掌握更高级的异步特性（如 `async/await`）打下了坚实的基础。
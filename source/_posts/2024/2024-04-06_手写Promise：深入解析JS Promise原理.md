---
title: 手写Promise：深入解析JS Promise原理
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

> JavaScript Promise 是异步编程的核心，它解决了回调地狱（Callback Hell）的问题，让异步代码的编写更加优雅和可维护。然而，Promises 究竟是如何工作的？它背后隐藏了哪些状态管理和回调机制？本文将通过从零开始手写一个简化的 Promise 实现，来深入解析其核心原理。

{% note info %}
“理解 Promise 的精髓，就是理解异步状态管理和时序控制。”
{% endnote %}

## 一、Promise 的基本概念复习

在开始手写之前，我们先快速回顾 Promise 的几个核心概念：

1.  **三种状态 (States)**:
    *   `pending` (待定): 初始状态，既没有成功，也没有失败。
    *   `fulfilled` (已成功/已兑现): 操作成功完成。
    *   `rejected` (已失败/已拒绝): 操作失败。
    *   Promise 的状态一旦从 `pending` 变为 `fulfilled` 或 `rejected`，就**不可逆转**，称为 `settled` (已敲定)。

2.  **构造函数**: `new Promise(executor)`
    *   `executor` 是一个执行器函数，它在 Promise 构造时同步执行。
    *   `executor` 接收两个参数：`resolve` (成功回调) 和 `reject` (失败回调)。
    *   `resolve(value)`: 将 Promise 的状态从 `pending` 变为 `fulfilled`，并将 `value` 传递给后续的 `then` 回调。
    *   `reject(reason)`: 将 Promise 的状态从 `pending` 变为 `rejected`，并将 `reason` 传递给后续的 `catch` 回调。

3.  **链式调用**: `promise.then(onFulfilled, onRejected).catch(onRejected)`
    *   `then()` 和 `catch()` 方法都返回一个新的 Promise，从而允许链式调用。
    *   `onFulfilled`: Promise 成功时的回调函数。
    *   `onRejected`: Promise 失败时的回调函数。
    *   `catch(onRejected)` 是 `then(null, onRejected)` 的语法糖。

## 二、手写一个简化的 `MyPromise`

我们将一步步构建一个名为 `MyPromise` 的类，使其具备 Promise 的核心功能。

### 1. 骨架和状态管理

首先，定义 `MyPromise` 的基本结构，包括状态 (`status`)、成功值 (`value`)、失败原因 (`reason`)，以及用于存储待执行回调的数组。

```javascript
class MyPromise {
  // 定义 Promise 的三种状态
  static PENDING = 'pending';
  static FULFILLED = 'fulfilled';
  static REJECTED = 'rejected';

  constructor(executor) {
    this.status = MyPromise.PENDING; // 初始状态为 pending
    this.value = undefined;          // 存储成功后的值
    this.reason = undefined;         // 存储失败后的原因

    // 存储 pending 状态下，需要执行的成功和失败回调
    // 为什么需要数组？因为一个 Promise 可能被多次 then()
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    // 定义 resolve 函数
    const resolve = (value) => {
      // 只有在 pending 状态下才能改变状态
      if (this.status === MyPromise.PENDING) {
        this.status = MyPromise.FULFILLED;
        this.value = value;
        // 状态改变后，执行所有待执行的成功回调
        this.onFulfilledCallbacks.forEach(callback => {
          callback(this.value);
        });
      }
    };

    // 定义 reject 函数
    const reject = (reason) => {
      // 只有在 pending 状态下才能改变状态
      if (this.status === MyPromise.PENDING) {
        this.status = MyPromise.REJECTED;
        this.reason = reason;
        // 状态改变后，执行所有待执行的失败回调
        this.onRejectedCallbacks.forEach(callback => {
          callback(this.reason);
        });
      }
    };

    // 执行 executor 函数
    // 捕获 executor 中的错误，直接调用 reject
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  // then 方法的实现
  then(onFulfilled, onRejected) {
    // 确保 onFulfilled 和 onRejected 总是一个函数
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason; };

    // then 方法必须返回一个新的 Promise，实现链式调用
    const promise2 = new MyPromise((resolve, reject) => {
      // 如果当前 Promise 已经是 fulfilled 状态
      if (this.status === MyPromise.FULFILLED) {
        // 使用 setTimeout 模拟异步，确保在下一个微任务队列中执行
        // 这是为了符合 Promise/A+ 规范：onFulfilled 和 onRejected 必须异步执行
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value);
            // 处理 onFulfilled 的返回值，这是 then 链式调用的核心
            // x 可能是普通值，也可能是另一个 Promise
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      }
      // 如果当前 Promise 已经是 rejected 状态
      else if (this.status === MyPromise.REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      }
      // 如果当前 Promise 仍然是 pending 状态
      else {
        // 将回调函数存储起来，等待 resolve/reject 调用时执行
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
      }
    });

    return promise2;
  }

  // catch 方法是 then(null, onRejected) 的语法糖
  catch(onRejected) {
    return this.then(null, onRejected);
  }
}
```

### 2. 核心辅助函数：`resolvePromise`

`then` 方法的核心在于它的返回值。`then` 回调的返回值 `x` 决定了下一个 Promise (`promise2`) 的状态。这部分逻辑是 Promise/A+ 规范中最为复杂，但也是最关键的部分 —— **Promise 解决过程** (Promise Resolution Procedure)。

```javascript
/**
 * Promise 解决过程 (Promise Resolution Procedure)
 * 这是一个核心辅助函数，用于处理 then 回调的返回值 x
 * 规范：https://promisesaplus.com/#the-promise-resolution-procedure
 *
 * @param {MyPromise} promise2   then 方法返回的新 Promise
 * @param {any} x                onFulfilled 或 onRejected 的返回值
 * @param {Function} resolve    promise2 的 resolve 方法
 * @param {Function} reject     promise2 的 reject 方法
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 2.3.1 如果 promise2 和 x 指向同一个对象，则以 TypeError 为据因拒绝 promise
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise'));
  }

  // 2.3.2 If x is a Promise, adopt its state
  // 如果 x 是一个 Promise，则将 promise2 的状态与 x 的状态保持一致
  if (x instanceof MyPromise) {
    // x.then 可能会被多次调用，或者被调用多次 resolve(y) / reject(r)
    // 确保只处理一次
    x.then(function(y) {
      resolvePromise(promise2, y, resolve, reject); // 递归解析 x 的结果
    }, reject); // 如果 x 失败了，则 promise2 也失败
    return;
  }

  // 2.3.3 If x is an object or function
  // 如果 x 是对象或函数 (非 null)，则可能它是一个 thenable 对象
  if (x && (typeof x === 'object' || typeof x === 'function')) {
    let called = false; // 防止 then 被多次调用，即防止 resolve 或 reject 被多次调用

    try {
      // 2.3.3.1 Let then be x.then
      // 尝试获取 x 的 then 方法
      const then = x.then;

      // 2.3.3.3 If then is a function, call it with x as this,
      // 如果 then 是一个函数，则将其作为 Promise 执行器调用
      if (typeof then === 'function') {
        // then.call(x, resolvePromiseFn, rejectPromiseFn)
        // 这个 resolve/reject 函数与 MyPromise 的 resolve/reject 不同，
        // 它们是用于决定 promise2 状态的，且需要递归调用 resolvePromise
        then.call(x,
          y => {
            if (called) return; // 确保只处理一次
            called = true;
            resolvePromise(promise2, y, resolve, reject); // 递归解析 y
          },
          r => {
            if (called) return; // 确保只处理一次
            called = true;
            reject(r); // 如果 thenable 失败了，则 promise2 也失败
          }
        );
      } else {
        // 2.3.3.4 If then is not a function, fulfill promise with x
        // 如果 then 不是函数，则直接以 x 填充 promise2
        resolve(x);
      }
    } catch (error) {
      // 2.3.3.2 If retrieving the property x.then results in a thrown exception e,
      // 2.3.3.3.4.1 If calling then throws an exception e,
      // 如果获取 x.then 或调用 then 时出错，则拒绝 promise
      if (called) return; // 防止重复拒绝
      called = true;
      reject(error);
    }
    return;
  }

  // 2.3.4 If x is not an object or function, fulfill promise with x
  // 如果 x 是普通值（非对象、非函数），则直接以 x 填充 promise2
  resolve(x);
}
```

## 三、测试 `MyPromise`

现在，我们可以用一些例子来测试我们的 `MyPromise` 实现。

### 1. 基本同步/异步示例

```javascript
// 同步执行 resolve
console.log('--- Test 1: Sync Resolve ---');
new MyPromise((resolve, reject) => {
  console.log('Executor starts (sync)');
  resolve('Sync Data');
  console.log('Executor ends (sync)');
}).then(data => {
  console.log('Sync Resolve Result:', data);
});
console.log('After sync promise creation');

// 异步执行 resolve
console.log('\n--- Test 2: Async Resolve ---');
new MyPromise((resolve, reject) => {
  console.log('Executor starts (async)');
  setTimeout(() => {
    resolve('Async Data');
    console.log('Executor resolves (async)');
  }, 100);
  console.log('Executor ends (async)');
}).then(data => {
  console.log('Async Resolve Result:', data);
});
console.log('After async promise creation');

// 异步执行 reject
console.log('\n--- Test 3: Async Reject ---');
new MyPromise((resolve, reject) => {
  setTimeout(() => {
    reject('Async Error');
  }, 50);
}).then(null, error => { // 或 .catch(error => ...)
  console.log('Async Reject Result:', error);
});
```

**预期输出：**

```
--- Test 1: Sync Resolve ---
Executor starts (sync)
Executor ends (sync)
After sync promise creation
Sync Resolve Result: Sync Data

--- Test 2: Async Resolve ---
Executor starts (async)
Executor ends (async)
After async promise creation
Async Resolve Result: Async Data
Executor resolves (async)

--- Test 3: Async Reject ---
Async Reject Result: Async Error
```
**注意：`console.log('Executor resolves (async)')` 会在回调执行后才输出，因为回调被 `setTimeout` 延迟了，即使是 0ms 也是调度到微任务队列（或宏任务，这里我们用 setTimeout 模拟，实际 Promise 是微任务）。**

### 2. 链式调用

```javascript
console.log('\n--- Test 4: Chaining ---');
new MyPromise((resolve, reject) => {
  setTimeout(() => resolve(1), 50);
})
.then(value => {
  console.log('First then:', value); // 1
  return value + 1; // 返回普通值
})
.then(value => {
  console.log('Second then:', value); // 2
  return new MyPromise(r => setTimeout(() => r(value + 10), 50)); // 返回一个新的 Promise
})
.then(value => {
  console.log('Third then:', value); // 13
  throw new Error('Something went wrong!'); // 抛出错误
})
.then(value => { // 这个 then 不会被执行
  console.log('Fourth then:', value);
}, error => {
  console.log('Caught Error in then:', error.message); // Something went wrong!
  return 'Recovered'; // 错误处理后返回普通值，链式继续
})
.then(value => {
  console.log('Fifth then:', value); // Recovered
  return new MyPromise((res, rej) => rej('Chain Rejected!')); // 返回一个失败的 Promise
})
.catch(error => {
  console.log('Caught Error in catch:', error); // Chain Rejected!
});
```
**预期输出：**

```
--- Test 4: Chaining ---
First then: 1
Second then: 2
Third then: 13
Caught Error in then: Something went wrong!
Fifth then: Recovered
Caught Error in catch: Chain Rejected!
```

### 3. thenable 对象

```javascript
console.log('\n--- Test 5: Thenable Object ---');
const thenable = {
  then(resolve, reject) {
    console.log('Thenable then called');
    setTimeout(() => resolve('From Thenable'), 50);
  }
};

new MyPromise(resolve => resolve(thenable))
  .then(data => {
    console.log('Resolved with thenable data:', data);
  });

console.log('After thenable promise creation');
```

**预期输出：**

```
--- Test 5: Thenable Object ---
After thenable promise creation
Thenable then called
Resolved with thenable data: From Thenable
```

## 四、核心原理总结

通过手写 `MyPromise`，我们揭示了 Promise 的几个关键原理：

1.  **状态机管理**: Promise 的核心是维护其三种状态 (`pending`, `fulfilled`, `rejected`)，并且状态只能从 `pending` 转换为 `fulfilled` 或 `rejected` 一次，之后状态不可变。
2.  **回调存储机制**: 在 `pending` 状态下，`then` 方法会将回调函数（`onFulfilled`, `onRejected`）存储起来。一旦 Promise 状态变成 `fulfilled` 或 `rejected`，这些存储的回调就会被异步执行。
3.  **异步执行**: `then` 方法中的回调函数必须被异步执行（即使 Promise 状态已经确定），这是通过 `setTimeout(..., 0)` 来模拟微任务队列的机制。这是 Promise/A+ 规范强制规定的，确保了宏任务和微任务的执行顺序。
4.  **链式调用的实现**: `then` 方法总是返回一个新的 Promise (`promise2`)。这个 `promise2` 的状态和值取决于 `then` 方法中回调函数（`onFulfilled` 或 `onRejected`）的返回值 `x`。
5.  **Promise 解决过程 (`resolvePromise`)**: 这是最精妙的部分。它处理 `then` 回调的返回值 `x`。
    *   如果 `x` 是一个普通值，`promise2` 会成功并以 `x` 为值。
    *   如果 `x` 是一个 Promise，`promise2` 的状态会“跟随” `x` 的状态。
    *   如果 `x` 是一个 “thenable” 对象（即有一个 `then` 方法的对象），`promise2` 会尝试像 Promise 一样处理 `x`，调用其 `then` 方法并以 `x` 的处理结果来决定自身的最终状态。
    *   处理过程中，严格避免 Promise 循环引用和多次调用 `resolve/reject`。
6.  **错误捕获**: `executor` 中的同步错误和 `then` 回调中抛出的错误都会被 `catch` 捕获，导致 Promise 变为 `rejected` 状态。

通过手动实现这些机制，我们不仅理解了 Promise 的内部工作流程，也掌握了异步操作如何通过状态和回调协同，实现顺序执行和错误处理的精髓。这对于编写和调试复杂的异步 JavaScript 代码至关重要。
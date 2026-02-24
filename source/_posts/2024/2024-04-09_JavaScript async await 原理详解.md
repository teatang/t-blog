---
title: JavaScript async/await 原理详解
date: 2024-04-09 06:24:00
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

> **`async/await`** 是 ES2017 (ECMAScript 2017) 引入的 JavaScript 语法糖，旨在以更简洁、更同步的方式编写基于 Promise 的异步代码。它使得异步操作的链式调用和错误处理变得与传统同步代码非常相似，极大地提升了代码的可读性和可维护性。其核心原理是基于 **Promise** 和 **Generator** 函数的结合，并在 JavaScript **事件循环 (Event Loop)** 的机制下运行。

{% note info %}
核心观点：`async/await` 并非替代 Promise，而是 Promise 的语法糖。它通过将 `async` 函数编译成一个状态机，利用 `await` 关键字暂停函数执行，并通过 Promise 的回调机制在异步操作完成后恢复执行，从而在不阻塞主线程的前提下，实现了“同步”书写异步逻辑的体验。
{% endnote %}

------

## 一、为什么需要 `async/await`？

虽然 Promise 解决了传统回调函数（Callback Hell）的嵌套问题，并通过链式调用提供了更好的结构，但复杂的 Promise 链仍然可能导致代码冗长和理解障碍，尤其是在处理多个相互依赖的异步操作时。

**Promise 链的例子：**

```javascript
function fetchUser(id) {
  return new Promise(resolve => setTimeout(() => {
    console.log(`Fetched user: ${id}`);
    resolve({ id, name: `User ${id}` });
  }, 500));
}

function fetchUserPosts(userId) {
  return new Promise(resolve => setTimeout(() => {
    console.log(`Fetched posts for user: ${userId}`);
    resolve([{ postId: 101, content: "Post A" }, { postId: 102, content: "Post B" }]);
  }, 300));
}

function fetchPostDetails(postId) {
  return new Promise(resolve => setTimeout(() => {
    console.log(`Fetched details for post: ${postId}`);
    resolve({ postId, details: "Detailed info for " + postId });
  }, 200));
}

fetchUser(1)
  .then(user => {
    console.log(`User found: ${user.name}`);
    return fetchUserPosts(user.id);
  })
  .then(posts => {
    console.log(`Posts found: ${posts.length}`);
    if (posts.length > 0) {
      return fetchPostDetails(posts[0].postId);
    }
    return Promise.resolve(null);
  })
  .then(postDetails => {
    console.log("First post details:", postDetails);
  })
  .catch(error => {
    console.error("Error:", error);
  });
// 尽管比回调地狱好，但逻辑流在 .then() 中被分散，不够直观。
```

`async/await` 的出现，正是为了让这种复杂的异步流程读起来和写起来更像同步代码，进一步提高代码的可读性和可维护性。

## 二、`async/await` 的基本语法

### 2.1 `async` 函数

*   任何被 `async` 关键字修饰的函数都称为异步函数。
*   `async` 函数的返回结果总是 Promise 对象。
    *   如果 `async` 函数返回一个非 Promise 的值，该值会被 `Promise.resolve()` 包装成一个 Promise 对象。
    *   如果 `async` 函数内部抛出错误，该错误会被 `Promise.reject()` 包装成一个 Promise 对象，即 Promise 状态变为 Rejected。

```javascript
async function helloAsync() {
  return "Hello Async!"; // 实际上返回 Promise.resolve("Hello Async!")
}

helloAsync().then(value => console.log(value)); // 输出: Hello Async!

async function errorAsync() {
  throw new Error("Something went wrong!"); // 实际上返回 Promise.reject(new Error("..."))
}

errorAsync().catch(error => console.error(error.message)); // 输出: Something went wrong!
```

### 2.2 `await` 表达式

*   `await` 关键字只能在 `async` 函数内部使用。
*   `await` 后面通常跟着一个 Promise 对象。
*   `await` 会暂停 `async` 函数的执行，直到其后面的 Promise 解决 (fulfilled 或 rejected)。
    *   如果 Promise 成功（fulfilled），`await` 表达式会返回 Promise 的解决值 (value)。
    *   如果 Promise 失败（rejected），`await` 表达式会抛出错误，需要使用 `try...catch` 块来捕获。

**`async/await` 改进后的示例：**

```javascript
async function getUserData(userId) {
  try {
    console.log("Starting data fetching...");
    const user = await fetchUser(userId); // 暂停，等待 fetchUser Promise 解决
    console.log(`User found: ${user.name}`);

    const posts = await fetchUserPosts(user.id); // 暂停，等待 fetchUserPosts Promise 解决
    console.log(`Posts found: ${posts.length}`);

    let firstPostDetails = null;
    if (posts.length > 0) {
      firstPostDetails = await fetchPostDetails(posts[0].postId); // 暂停，等待 fetchPostDetails Promise 解决
    }
    console.log("First post details:", firstPostDetails);

    return { user, posts, firstPostDetails };
  } catch (error) {
    console.error("An error occurred:", error.message);
    throw error; // 重新抛出错误，让外部 catch 捕获
  } finally {
    console.log("Finished data fetching process.");
  }
}

// 调用 async 函数
getUserData(2)
  .then(data => console.log("All data successfully retrieved:", data))
  .catch(err => console.error("Error in main execution:", err.message));
```
这段代码的逻辑流非常清晰，几乎和同步代码一样，显著提升了可读性。

## 三、`async/await` 的底层原理

`async/await` 的实现涉及到 JavaScript 引擎的编译、Promise 机制以及事件循环的调度。

### 3.1 Promise 语法糖

最核心的原理是：`async/await` 本质上就是 Promise 的语法糖。一个 `async` 函数在编译时会被转换成一个复杂的 Promise 链。

例如，下面的 `async` 函数：

```javascript
async function example() {
  const result1 = await someAsyncOperation1();
  const result2 = await someAsyncOperation2(result1);
  return result2;
}
```

在概念上，可以被近似地转换为以下 Promise 链：

```javascript
function example() {
  return Promise.resolve(someAsyncOperation1())
    .then(result1 => Promise.resolve(someAsyncOperation2(result1)))
    .then(result2 => result2)
    .catch(error => { throw error; }); // 隐含的错误捕获和传播
}
```
但实际的转换远比这复杂，它依赖于 Generators 的能力。

### 3.2 Generator 函数与协程 (Coroutines)

在 ES6 中引入的 **Generator 函数** 是 `async/await` 的底层基石。Generator 函数是一种特殊的函数，它可以在执行过程中暂停，并在稍后从暂停的地方恢复执行。

*   **`function*`**: 声明一个 Generator 函数。
*   **`yield`**: 关键字，用于暂停 Generator 函数的执行，并返回一个值。
*   **`.next()`**: 调用 Generator 对象的 `next()` 方法可以恢复 Generator 函数的执行，并接收 `yield` 表达式的返回值。

**Generator 示例：**

```javascript
function* simpleGenerator() {
  console.log("Start Generator");
  const val1 = yield 1; // 暂停，返回 1
  console.log("Resumed with val1:", val1);
  const val2 = yield val1 + 2; // 暂停，返回 val1 + 2
  console.log("Resumed with val2:", val2);
  return val2 * 2;
}

const gen = simpleGenerator();
console.log(gen.next("Initial call"));    // { value: 1, done: false }  (第一个 next 的参数会被忽略)
console.log(gen.next(10)); // val1 = 10; 输出: Resumed with val1: 10; 返回 { value: 12, done: false }
console.log(gen.next(20)); // val2 = 20; 输出: Resumed with val2: 20; 返回 { value: 40, done: true }
```

`async` 函数在编译后，实际上会变成一个状态机，类似于 Generator 函数。每一个 `await` 表达式都对应着 Generator 中的一个 `yield` 表达式。

当 `async` 函数执行到 `await` 表达式时：
1.  它会像 `yield` 一样，暂停当前 `async` 函数的执行。
2.  `await` 后面的 Promise 对象会被执行。
3.  `async` 函数本身会向外返回一个 Promise，并将当前的控制权交还给调用栈。
4.  当 `await` 后面的 Promise 状态变为 Fulfilled 时，它的回调函数会被放入微任务队列。
5.  事件循环在主线程空闲时处理微任务，执行该回调函数，从而恢复 `async` 函数的执行，并从 `await` 暂停的地方继续。

### 3.3 事件循环 (Event Loop) 机制

`async/await` 的非阻塞特性得益于 JavaScript 的单线程事件循环机制。

1.  当 `async` 函数被调用时，它会立即执行，直到遇到第一个 `await` 表达式。
2.  当遇到 `await` 表达式时，如果 `await` 后面的 Promise 还没有解决，`async` 函数会“暂停”自身的执行，并将控制权交还给调用它的父级函数（即从调用栈中弹出）。**注意，这并不是阻塞主线程，仅仅是暂停了 `async` 函数自身的执行。**
3.  此时，JavaScript 引擎可以继续执行主线程上的其他同步代码，以及处理事件循环中的其他任务。
4.  当 `await` 后面的 Promise 状态发生变化（成功或失败）时，其相应的回调函数（Promise 的 `.then()` 或 `.catch()` 内部逻辑）会被放入 **微任务队列 (Microtask Queue)**。
5.  事件循环会优先处理微任务队列中的任务。一旦主线程上的同步代码执行完毕，且调用栈为空，事件循环会立即清空微任务队列。
6.  当之前暂停的 `async` 函数对应的微任务被执行时，`async` 函数的执行会从 `await` 暂停的地方继续，并使用 Promise 的解决值作为 `await` 表达式的结果。

{% mermaid %}
graph TD
    A[调用 async 函数] --> B{遇到 await Promise};
    B -- Promise未解决 --> C[暂停 async 函数执行];
    C --> D[将控制权交回给调用栈];
    D --> E[JS主线程继续执行其他任务];
    E -- Promise解决/拒绝 --> F[将 Promise 回调放入<br>微任务队列];
    F --> G{事件循环检测微任务队列};
    G -- 主线程空闲且微任务存在 --> H["执行微任务 <br>(恢复 async 函数)"];
    H --> I[async 函数从 await 处<br>继续执行];
    I -- 再次遇到 await 或执行完毕 --> B;
{% endmermaid %}

### 3.4 编译过程的简化理解

一个 `async` 函数在内部被编译器转换为一个更复杂的结构，可以想象成一个自执行的 Generator 函数，并带有一个运行器 (runner) 来自动处理 `yield` 和 Promise 的解析。

*   **`async` 关键字**：告诉 JS 引擎这是一个异步函数，需要进行特殊处理，并确保其返回值为 Promise。
*   **`await` 关键字**：在遇到 `await` 时，它会：
    1.  将 `await` 后面的表达式转换为 Promise（如果不是的话）。
    2.  注册一个 `.then()` 回调到这个 Promise 上，这个回调函数负责在 Promise 解决后，恢复 `async` 函数的执行，并将结果传递回来。
    3.  暂停当前 `async` 函数的执行，并返回一个 pending 状态的 Promise。

## 四、`async/await` 与 Promise API 的结合

`async/await` 并非完全取代 Promise，而是建立在 Promise 之上。Promise 提供的静态方法，如 `Promise.all()`、`Promise.race()` 等，仍然在 `async` 函数中发挥着重要作用，尤其是在处理并行异步操作时。

### 4.1 并行执行任务 (`Promise.all`)

`await` 关键字默认会导致代码按顺序执行。如果需要并行执行多个不相互依赖的异步任务，并等待它们全部完成，可以结合 `Promise.all`。

```javascript
async function getParallelData(userId) {
  try {
    console.log("Starting parallel data fetching...");
    const [user, posts] = await Promise.all([
      fetchUser(userId),          // 任务1：获取用户
      fetchUserPosts(userId)      // 任务2：获取用户帖子
    ]);

    console.log("User:", user);
    console.log("Posts:", posts);

    // 假设后续操作需要这两个结果，但自身仍是异步的
    const firstPostId = posts.length > 0 ? posts[0].postId : null;
    let postDetails = null;
    if (firstPostId) {
      postDetails = await fetchPostDetails(firstPostId);
    }
    console.log("First post details:", postDetails);

    return { user, posts, postDetails };

  } catch (error) {
    console.error("Parallel data fetching failed:", error.message);
    throw error;
  }
}

getParallelData(3).then(data => console.log("All parallel data retrieved:", data));
```

### 4.2 竞态条件 (`Promise.race`)

如果需要等待多个异步任务中第一个完成的任务（无论成功或失败），可以使用 `Promise.race`。

```javascript
async function fetchFastestData() {
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("Request timed out")), 200);
  });

  const actualFetchPromise = new Promise(resolve => {
    setTimeout(() => resolve("Actual data received"), 300);
  });

  try {
    const result = await Promise.race([actualFetchPromise, timeoutPromise]);
    console.log("Fastest result:", result);
  } catch (error) {
    console.error("Fastest operation failed:", error.message); // Request timed out
  }
}

fetchFastestData();
```

## 五、`async/await` 的优点与注意事项

### 5.1 优点

*   **可读性高：** 代码结构扁平，更接近同步代码的写法，易于理解。
*   **错误处理直观：** 可以直接使用 `try...catch` 块来捕获异步操作中的错误，像同步代码一样。
*   **调试友好：** 在 `await` 暂停时，调试器可以像同步代码一样逐步执行，方便定位问题。
*   **简化条件逻辑：** 避免了 Promise 链中复杂的 `.then()` 嵌套和条件判断。

### 5.2 注意事项

*   **`await` 只能在 `async` 函数中使用：** 在模块顶层或非 `async` 函数中直接使用 `await` 会报错（除非环境支持 ES2022 的 Top-level `await`）。
*   **错误处理：** `try...catch` 是捕获 `await` 抛出错误的主要方式。对于 `async` 函数本身返回的 Promise 错误，依然可以使用 `.catch()`。
*   **并行与串行：** 默认情况下，多个 `await` 会导致串行执行。需要并行执行时，应使用 `Promise.all()` 等 Promise 静态方法。
*   **不阻塞主线程：** `await` 暂停的是 `async` 函数的执行，而不是 JavaScript 运行时环境的主线程。主线程仍然可以执行其他任务。

## 六、总结

`async/await` 是 JavaScript 异步编程的里程碑式改进，它将 Promise 的强大功能与同步代码的简洁性相结合，为开发者提供了编写高质量异步代码的最佳实践。理解其基于 Promise 和 Generator 的原理，以及与事件循环的交互机制，有助于更深入地掌握 JavaScript 的异步本质，并在实践中写出更健壮、更易维护的应用程序。它是现代 JavaScript 开发中不可或缺的工具。
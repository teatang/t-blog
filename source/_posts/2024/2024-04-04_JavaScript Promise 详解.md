---
title: JavaScript Promise 详解
date: 2024-04-04 06:24:00
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

> **JavaScript Promise** 是一种用于处理异步操作的机制，它代表了一个异步操作最终完成（或失败）的结果。在 ES6 (ECMAScript 2015) 中引入，Promise 旨在解决传统回调函数（Callback）模式中存在的“回调地狱”（Callback Hell）问题，提供更清晰、更可维护的异步代码编写方式。

{% note info %}
核心思想：Promise 提供了一种结构化的方式来管理异步操作，将异步操作的结果视为一个未来值（Future Value），允许我们链式地处理成功和失败的情况。
{% endnote %}

------

## 一、为什么需要 Promise？

在 Promise 出现之前，JavaScript 主要通过回调函数处理异步操作，例如 `setTimeout`、`Ajax` 请求等。当存在多个相互依赖的异步操作时，代码会形成深层嵌套的回调结构，导致以下问题：

1.  **回调地狱 (Callback Hell / Pyramid of Doom)**：代码可读性极差，难以理解和维护。
2.  **错误处理困难**：每个回调函数都需要单独处理错误，且错误不能很好地向上冒泡。
3.  **流程控制复杂**：难以实现复杂的异步流程（如并行执行、竞态等）。

**传统回调函数示例：**

```javascript
function step1(data, callback) {
  setTimeout(() => {
    console.log("Step 1 processed:", data);
    callback(null, data + " - processed by step 1");
  }, 1000);
}

function step2(data, callback) {
  setTimeout(() => {
    console.log("Step 2 processed:", data);
    callback(null, data + " - processed by step 2");
  }, 800);
}

function step3(data, callback) {
  setTimeout(() => {
    console.log("Step 3 processed:", data);
    callback(null, data + " - processed by step 3");
  }, 500);
}

// 回调地狱
step1("Initial data", (err1, result1) => {
  if (err1) {
    console.error("Error in step 1:", err1);
    return;
  }
  step2(result1, (err2, result2) => {
    if (err2) {
      console.error("Error in step 2:", err2);
      return;
    }
    step3(result2, (err3, result3) => {
      if (err3) {
        console.error("Error in step 3:", err3);
        return;
      }
      console.log("Final Result:", result3);
    });
  });
});
```

Promise 通过引入一种标准化的异步操作表示方式，极大地改善了上述问题。

## 二、Promise 的核心概念

### 2.1 Promise 的三种状态

一个 Promise 对象有且仅有以下三种状态：

1.  **Pending (进行中)**：初始状态，既不是成功也不是失败。
2.  **Fulfilled (已成功)**：操作成功完成。
3.  **Rejected (已失败)**：操作失败。

**状态转换规则：**
*   Pending 状态可以转换为 Fulfilled 或 Rejected 状态。
*   一旦 Promise 转换为 Fulfilled 或 Rejected 状态，它的状态就凝固了，不可再次改变。这个过程被称为 **Settled (已敲定/已解决)**。
*   一个 Settled 的 Promise 不会再有任何状态变化，也不会再次调用其对应的处理函数。

{% mermaid %}
graph TD
    A[Pending] --> B{Fulfilled};
    A --> C{Rejected};
    B --> D[Settled];
    C --> D;
{% endmermaid %}

### 2.2 Promise 的值 (Value) 与原因 (Reason)

*   当 Promise 状态变为 **Fulfilled** 时，它会有一个值，称为 **Promise Value**。这个值是异步操作成功后的结果。
*   当 Promise 状态变为 **Rejected** 时，它会有一个原因，称为 **Promise Reason (Error)**。这个原因通常是一个 Error 对象，描述了异步操作失败的原因。

## 三、创建 Promise

Promise 构造函数接收一个执行器函数 (executor) 作为参数。这个执行器函数会在 Promise 被创建时立即执行，它接收两个参数：`resolve` 和 `reject`。

```javascript
const myPromise = new Promise((resolve, reject) => {
  // 模拟一个异步操作
  setTimeout(() => {
    const success = Math.random() > 0.5; // 随机决定成功或失败

    if (success) {
      // 当异步操作成功时，调用 resolve 并传递结果
      resolve("异步操作成功，这是结果数据！");
    } else {
      // 当异步操作失败时，调用 reject 并传递错误信息
      reject(new Error("异步操作失败，发生了错误！"));
    }
  }, 1500);
});

console.log("Promise 已创建，状态为 Pending...");
```

*   `resolve(value)`：用于将 Promise 的状态从 `Pending` 变为 `Fulfilled`，并将 `value` 作为 Promise 的结果。
*   `reject(reason)`：用于将 Promise 的状态从 `Pending` 变为 `Rejected`，并将 `reason` 作为 Promise 的失败原因。

## 四、消费 Promise：.then(), .catch(), .finally()

Promise 对象提供了一系列方法来处理异步操作的结果。

### 4.1 `.then(onFulfilled, onRejected)`

`then()` 方法用于注册当 Promise 状态变为 Fulfilled 或 Rejected 时的回调函数。

*   `onFulfilled` (可选)：一个函数，当 Promise 成功时调用，接收 Promise 的 value 作为参数。
*   `onRejected` (可选)：一个函数，当 Promise 失败时调用，接收 Promise 的 reason 作为参数。

```javascript
myPromise
  .then(
    (value) => {
      // Promise 成功时执行
      console.log("成功：", value);
      return value.toUpperCase(); // 返回一个新值，会传递给下一个 .then()
    },
    (reason) => {
      // Promise 失败时执行
      console.error("失败（通过 then 的第二个参数）：", reason.message);
      throw new Error("在 onRejected 中再次抛出错误"); // 抛出错误，会被下一个 .catch() 捕获
    }
  )
  .then((newValue) => {
    // 这里的 newValue 是上一个 then 返回的 uppercase 字符串
    console.log("第二个 then 接收到的新值：", newValue);
  })
  .catch((error) => {
    // 捕获前面链中发生的任何错误
    console.error("链式捕获错误：", error.message);
  });
```

**关键特性：Promise 链式调用**

`then()` 方法总是返回一个新的 Promise 对象，这使得我们可以链式地调用多个 `.then()`。每个 `.then()` 的回调函数返回的值（或 Promise）都会作为下一个 `.then()` 的输入。

### 4.2 `.catch(onRejected)`

`.catch()` 方法是 `.then(null, onRejected)` 的语法糖，专门用于处理 Promise 的拒绝（Rejected）情况。

```javascript
myPromise
  .then((value) => {
    console.log("成功：", value);
    // 假设这里发生了一个错误，例如访问未定义属性
    return JSON.parse("invalid json string");
  })
  .then((parsedData) => {
    console.log("解析后的数据：", parsedData);
  })
  .catch((error) => {
    // 捕获前面任何一个 .then() 中发生的错误，或者 Promise 本身的拒绝
    console.error("通过 .catch() 捕获的错误：", error.message);
  })
  .finally(() => {
    console.log("Promise 链结束，无论成功或失败都会执行。");
  });
```

**错误传播：** 错误会沿着 Promise 链向下传播，直到遇到一个 `.catch()` 或带有 `onRejected` 处理器的 `.then()`。

### 4.3 `.finally(onSettled)`

`.finally()` 方法注册一个回调函数，无论 Promise 最终是 Fulfilled 还是 Rejected，都会被调用。它不接收任何参数，并且通常用于执行清理操作（例如关闭加载动画）。

```javascript
function fetchData() {
  return new Promise((resolve, reject) => {
    // 模拟数据加载
    console.log("开始加载数据...");
    setTimeout(() => {
      const success = Math.random() > 0.5;
      if (success) {
        resolve("数据加载成功！");
      } else {
        reject(new Error("数据加载失败！"));
      }
    }, 1000);
  });
}

fetchData()
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.error("错误：", error.message);
  })
  .finally(() => {
    // 无论成功失败，都会在这里执行清理工作
    console.log("数据加载过程结束，清理资源或隐藏加载器。");
  });
```

## 五、Promise 的静态方法

Promise 对象还提供了一些实用的静态方法，用于处理多个 Promise。

### 5.1 `Promise.all(iterable)`

*   接收一个 Promise 可迭代对象（如数组）作为参数。
*   返回一个新的 Promise。
*   当所有传入的 Promise 都成功时，返回的 Promise 才会成功，结果是一个数组，包含所有 Promise 的成功值，顺序与传入的 Promise 顺序一致。
*   只要其中任何一个 Promise 失败，返回的 Promise 就会立即失败，并将第一个失败 Promise 的原因作为其失败原因。

```javascript
const promise1 = Promise.resolve(3);
const promise2 = 42; // 非 Promise 值也会被包装成已解决的 Promise
const promise3 = new Promise((resolve, reject) => {
  setTimeout(resolve, 100, "foo");
});

Promise.all([promise1, promise2, promise3])
  .then((values) => {
    console.log("Promise.all 成功：", values); // [3, 42, "foo"]
  })
  .catch((error) => {
    console.error("Promise.all 失败：", error.message);
  });

// 带有失败的情况
const failingPromise = new Promise((resolve, reject) => {
  setTimeout(() => reject(new Error("Task D failed")), 50);
});

Promise.all([promise1, promise3, failingPromise])
  .then((values) => {
    console.log("Promise.all 成功：", values);
  })
  .catch((error) => {
    console.error("Promise.all 失败 (快速失败)：", error.message); // Task D failed
  });
```

### 5.2 `Promise.race(iterable)`

*   接收一个 Promise 可迭代对象作为参数。
*   返回一个新的 Promise。
*   一旦传入的任何一个 Promise 率先解决（无论成功或失败），返回的 Promise 就会以相同的状态和结果解决。

```javascript
const p1 = new Promise((resolve, reject) => {
  setTimeout(() => resolve("One"), 500);
});
const p2 = new Promise((resolve, reject) => {
  setTimeout(() => reject(new Error("Two failed")), 100); // 这个会先解决 (失败)
});
const p3 = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Three"), 200);
});

Promise.race([p1, p2, p3])
  .then((value) => {
    console.log("Promise.race 成功：", value);
  })
  .catch((error) => {
    console.error("Promise.race 失败：", error.message); // Two failed
  });
```

### 5.3 `Promise.allSettled(iterable)` (ES2020)

*   接收一个 Promise 可迭代对象作为参数。
*   返回一个新的 Promise。
*   当所有传入的 Promise 都已敲定（Settled，即无论成功或失败）时，返回的 Promise 才会成功。
*   结果是一个数组，其中包含每个 Promise 的状态和值/原因。

```javascript
const pA = Promise.resolve("A success");
const pB = Promise.reject(new Error("B failed"));
const pC = new Promise((resolve) => setTimeout(() => resolve("C resolved"), 50));

Promise.allSettled([pA, pB, pC])
  .then((results) => {
    console.log("Promise.allSettled 结果：", results);
    /*
    [
      { status: 'fulfilled', value: 'A success' },
      { status: 'rejected', reason: Error: B failed at ... },
      { status: 'fulfilled', value: 'C resolved' }
    ]
    */
  });
```

### 5.4 `Promise.any(iterable)` (ES2021)

*   接收一个 Promise 可迭代对象作为参数。
*   返回一个新的 Promise。
*   只要其中任何一个 Promise 成功，返回的 Promise 就会成功，并以第一个成功的 Promise 的值为结果。
*   如果所有 Promise 都失败，则返回一个 `AggregateError`，其中包含所有失败的原因。

```javascript
const pAny1 = Promise.reject(new Error("E1"));
const pAny2 = Promise.resolve("Success!");
const pAny3 = new Promise((resolve, reject) => setTimeout(() => reject("E3"), 100));

Promise.any([pAny1, pAny2, pAny3])
  .then((value) => {
    console.log("Promise.any 成功：", value); // Success!
  })
  .catch((error) => {
    console.error("Promise.any 失败：", error); // AggregateError
  });
```

### 5.5 `Promise.resolve(value)` 和 `Promise.reject(reason)`

*   `Promise.resolve(value)`：返回一个已成功（Fulfilled）的 Promise，其值为 `value`。如果 `value` 本身是一个 Promise，则返回该 Promise。
*   `Promise.reject(reason)`：返回一个已失败（Rejected）的 Promise，其原因为 `reason`。

```javascript
Promise.resolve("Hello").then(val => console.log(val)); // Hello
Promise.reject(new Error("Oops")).catch(err => console.error(err.message)); // Oops
```

## 六、Async/Await：Promise 的语法糖

`async/await` 是 ES2017 引入的，它构建在 Promise 之上，提供了更接近同步代码的异步编程体验，进一步提升了可读性。

*   **`async` 关键字**：用于修饰函数，表示该函数是一个异步函数。`async` 函数总是返回一个 Promise。
    *   如果 `async` 函数中返回一个非 Promise 的值，该值会被 `Promise.resolve()` 包装。
    *   如果 `async` 函数中抛出错误，该错误会被 `Promise.reject()` 包装。
*   **`await` 关键字**：只能在 `async` 函数内部使用。它会暂停 `async` 函数的执行，直到其后面的 Promise 解决（fulfilled 或 rejected）。
    *   如果 Promise 成功，`await` 表达式会返回 Promise 的成功值。
    *   如果 Promise 失败，`await` 表达式会抛出错误，需要使用 `try...catch` 捕获。

**`async/await` 示例：**

```javascript
function fetchUser(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Fetched user ${userId}`);
      resolve({ id: userId, name: `User ${userId}` });
    }, 1000);
  });
}

function fetchPosts(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Fetched posts for user ${userId}`);
      resolve([{ id: 1, title: `Post by ${userId}` }]);
    }, 800);
  });
}

async function getUserData(userId) {
  try {
    console.log("Starting data fetching...");
    const user = await fetchUser(userId); // 等待 fetchUser 完成
    const posts = await fetchPosts(user.id); // 等待 fetchPosts 完成

    console.log("User Data:", user);
    console.log("User Posts:", posts);
    return { user, posts };
  } catch (error) {
    console.error("Failed to get user data:", error.message);
    throw error; // 重新抛出错误，让外部 catch 捕获
  } finally {
    console.log("Finished data fetching process.");
  }
}

getUserData(123)
  .then((data) => {
    console.log("All data successfully retrieved:", data);
  })
  .catch((err) => {
    console.error("Error in main process:", err.message);
  });

// 比较：Promise 链式调用
// fetchUser(123)
//   .then(user => {
//     console.log(`Fetched user ${user.id}`);
//     return fetchPosts(user.id).then(posts => ({ user, posts }));
//   })
//   .then(data => {
//     console.log("User Data:", data.user);
//     console.log("User Posts:", data.posts);
//   })
//   .catch(error => {
//     console.error("Failed to get user data:", error.message);
//   });
```

通过 `async/await`，我们可以像编写同步代码一样编写异步代码，极大地提高了代码的可读性和可维护性。

## 七、与其他语言异步模式的对比

虽然本文主要关注 JavaScript Promise，但异步编程是现代编程的普遍需求。不同语言有其独特的实现模式：

*   **Python (`asyncio`, `async/await`)**：Python 在 3.4 版本引入 `asyncio` 库，并在 3.5 版本通过 `async/await` 语法提供了原生的协程支持，其设计理念与 JavaScript 的 `async/await` 及其底层 Promise（或 Future）高度相似。

    ```python
    import asyncio

    async def fetch_data(delay, data):
        print(f"Fetching {data} in {delay} seconds...")
        await asyncio.sleep(delay)
        print(f"Finished fetching {data}")
        return data

    async def main():
        print("Starting main async function")
        # await 暂停执行，直到 fetch_data 完成
        result1 = await fetch_data(1, "Data A")
        result2 = await fetch_data(0.5, "Data B")
        print(f"Results: {result1}, {result2}")

        # 类似于 Promise.all
        results_all = await asyncio.gather(
            fetch_data(0.8, "Data C"),
            fetch_data(0.3, "Data D")
        )
        print(f"Gathered results: {results_all}")

    # asyncio.run(main())
    ```

*   **Go (Goroutines & Channels)**：Go 语言通过轻量级协程 Goroutines 和通信机制 Channels 原生支持并发和异步。其模型更偏向 CSP (Communicating Sequential Processes)，通过 Goroutines 启动并发任务，并通过 Channels 进行数据交换和同步，避免了回调和显式的 Promise 链。

    ```go
    package main

    import (
    	"fmt"
    	"time"
    )

    func fetchData(delay time.Duration, data string, resultChan chan string) {
    	fmt.Printf("Fetching %s in %v...\n", data, delay)
    	time.Sleep(delay)
    	fmt.Printf("Finished fetching %s\n", data)
    	resultChan <- data // 将结果发送到 channel
    }

    func main() {
    	fmt.Println("Starting main Go routine")

    	// 创建 channel 用于接收结果
    	ch1 := make(chan string)
    	ch2 := make(chan string)

    	// 启动两个 Goroutine 异步执行
    	go fetchData(1*time.Second, "Data A", ch1)
    	go fetchData(500*time.Millisecond, "Data B", ch2)

    	// 阻塞等待从 channel 接收结果
    	resultA := <-ch1
    	resultB := <-ch2

    	fmt.Printf("Results: %s, %s\n", resultA, resultB)

    	fmt.Println("Finished main Go routine")
    }
    ```
    Go 语言的并发模型与 Promise 不同，但它们都旨在解决异步操作的管理问题。Go 的方式更注重并发原语，而 JavaScript 的 Promise 则专注于未来值的链式处理。

## 八、总结

Promise 是现代 JavaScript 异步编程的基石。它将异步操作的结果标准化为一个具有明确状态和行为的对象，有效解决了回调地狱和错误处理的复杂性。

通过 `.then()`、`.catch()` 和 `.finally()` 方法，Promise 提供了清晰的链式结构来处理异步流程，使得代码更易读、更易维护。而 `async/await` 语法更是 Promise 的甜点，它在 Promise 之上提供了一层更具表现力的抽象，让异步代码看起来和写起来都与同步代码无异，极大地提升了开发效率和代码质量。

理解并熟练运用 Promise 及其相关模式，是每个 JavaScript 开发者在构建高效、健壮的 Web 应用程序时不可或缺的技能。
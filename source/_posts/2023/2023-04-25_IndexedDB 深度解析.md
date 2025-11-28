---
title: IndexedDB 深度解析
date: 2023-04-25 06:24:00
tags:
  - 2023
  - Web技术
  - 前端技术
categories:
  - 前端技术
  - Web技术
---

> **IndexedDB** 是一种基于浏览器的高性能、非关系型 (NoSQL) 数据库，允许在客户端存储大量结构化数据。它提供了一个强大的 API，用于在用户的浏览器中创建和管理数据库，支持事务、索引和异步操作，是构建离线应用 (Offline First) 和 PWA (Progressive Web Apps) 的核心技术之一。

{% note info %}
核心思想：**IndexedDB 提供了一个强大的、异步的、事务性的客户端数据存储方案，专为存储大量结构化数据而设计。它通过键值对的形式存储 JavaScript 对象，并支持索引来高效查询数据。**
{% endnote %}
------

## 一、为什么需要 IndexedDB？(与其它客户端存储的对比)

在 Web 开发中，有多种客户端存储技术，但它们各有优缺点，IndexedDB 旨在解决其中一些局限性。

1.  **`localStorage` 和 `sessionStorage`**：
    *   **优点**：API 简单，同步操作。
    *   **缺点**：
        *   **存储容量小**：通常只有 5MB 左右。
        *   **仅支持字符串**：只能存储字符串，复杂数据需要手动序列化/反序列化 (JSON.stringify/parse)。
        *   **无索引**：无法进行高效查询。
        *   **同步操作**：大量数据操作可能阻塞主线程，影响页面性能。
2.  **`Cookie`**：
    *   **优点**：由服务器设置，可用于会话管理。
    *   **缺点**：
        *   **存储容量极小**：通常只有几 KB。
        *   **每次 HTTP 请求都会发送**：增加网络流量。
        *   **无索引**，仅支持字符串。
3.  **Web SQL Database (已废弃)**：
    *   **优点**：关系型数据库模型，可以使用 SQL 查询。
    *   **缺点**：
        *   **未成为 W3C 标准**：缺乏跨浏览器一致性，已废弃。
        *   **同步 API**：存在阻塞风险。

**IndexedDB 的优势**：
*   **存储容量大**：通常可达数百 MB 甚至 GB 级别（具体取决于浏览器和用户设备）。
*   **支持结构化数据**：可以直接存储和检索 JavaScript 对象。
*   **事务性操作**：保证数据操作的原子性、一致性、隔离性和持久性 (ACID)。
*   **异步 API**：所有操作都是非阻塞的，不会影响页面 UI 响应。
*   **支持索引**：可以创建索引以进行高效的数据检索。
*   **同源策略限制**：数据隔离在不同源之间，保证安全性。

## 二、IndexedDB 核心概念

理解 IndexedDB 的核心概念对于正确使用其 API 至关重要。

### 2.1 数据库 (Database)
*   IndexedDB 的最顶层容器。每个源 (origin) 可以创建多个数据库。
*   数据库由一个唯一的名称标识，并且有一个版本号。

### 2.2 版本 (Version)
*   数据库的版本号是一个正整数，用于管理数据库的结构升级。
*   当调用 `indexedDB.open()` 时，如果指定的新版本号大于当前版本号，就会触发 `upgradeneeded` 事件，允许在其中修改数据库结构（创建、删除 Object Store 或 Index）。

### 2.3 对象仓库 (Object Store)
*   类似于关系型数据库中的“表”，但它存储的是 JavaScript 对象。
*   每个 Object Store 都有一个唯一的名称。
*   存储在 Object Store 中的每个数据记录都必须有一个唯一的**键 (Key)**。这个键可以由以下方式生成：
    *   **键路径 (Key Path)**：指定对象的一个属性作为键（例如 `id`）。
    *   **键生成器 (Key Generator)**：数据库自动生成递增的数字作为键。

### 2.4 索引 (Index)
*   允许通过 Object Store 中除了主键以外的其它属性来高效查询数据。
*   每个 Index 都有一个名称，一个键路径（用于指定哪个属性作为索引键），以及可选的 `unique` (是否唯一) 和 `multiEntry` (是否为数组的每个元素创建索引) 属性。

### 2.5 事务 (Transaction)
*   所有对数据库的读写操作都必须在事务中进行。
*   事务确保了操作的原子性和隔离性。
*   事务有三种模式：
    *   **`readonly`**：只允许读取数据。
    *   **`readwrite`**：允许读取和写入数据。
    *   **`versionchange`**：仅在 `upgradeneeded` 事件中用于修改数据库结构。

### 2.6 请求 (Request)
*   IndexedDB 的所有异步操作（如 `open`、`add`、`get` 等）都会返回一个 `IDBRequest` 对象。
*   通过监听 `IDBRequest` 对象的 `onsuccess` 和 `onerror` 事件来处理操作结果。

### 2.7 游标 (Cursor)
*   用于高效地遍历 Object Store 或 Index 中的大量数据，尤其是在处理分页或过滤数据时非常有用。

## 三、IndexedDB API 核心流程

使用 IndexedDB 通常遵循以下步骤：

### 3.1 打开数据库

使用 `indexedDB.open()` 方法打开或创建一个数据库。

```javascript
// 数据库名称和版本号
const DB_NAME = 'myDatabase';
const DB_VERSION = 1; 

let db; // 将数据库实例存储在此变量中

const request = indexedDB.open(DB_NAME, DB_VERSION);

// 监听错误事件
request.onerror = function(event) {
    console.error("IndexedDB 数据库打开失败:", event.target.errorCode);
};

// 监听成功事件
request.onsuccess = function(event) {
    db = event.target.result; // 获取数据库实例
    console.log("IndexedDB 数据库成功打开/连接。");
    // 在这里可以执行后续的数据库操作
};

// 监听数据库升级事件 (仅当指定版本号大于当前数据库版本时触发)
request.onupgradeneeded = function(event) {
    db = event.target.result; // 获取数据库实例

    console.log("IndexedDB 数据库升级或首次创建...");

    // 1. 创建 Object Store (如果不存在)
    // 参数1: Object Store 名称
    // 参数2: 配置对象，包含 keyPath 或 autoIncrement
    if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { 
            keyPath: 'id', // 将 'id' 属性作为主键
            // autoIncrement: true // 或者让数据库自动生成主键
        });

        // 2. 为 Object Store 创建索引 (可选)
        // 参数1: 索引名称
        // 参数2: 索引的键路径 (对象中的属性名)
        // 参数3: 配置对象，如 unique (是否唯一), multiEntry (是否多值索引)
        userStore.createIndex('nameIndex', 'name', { unique: false });
        userStore.createIndex('emailIndex', 'email', { unique: true });

        console.log("Object Store 'users' 和相关索引已创建/更新。");
    }

    if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { autoIncrement: true });
        productStore.createIndex('productNameIndex', 'productName', { unique: false });
        console.log("Object Store 'products' 已创建。");
    }
};
```
**注意**：`upgradeneeded` 事件只会在数据库版本号发生变化时触发。这意味着如果你更改了 `upgradeneeded` 中的逻辑，但没有增加 `DB_VERSION`，这些更改将不会生效。

### 3.2 启动事务

所有数据操作都必须通过事务进行。

```javascript
// 获取事务
// 参数1: 包含要访问的 Object Store 名称的数组
// 参数2: 事务模式 ('readonly' 或 'readwrite')
const transaction = db.transaction(['users'], 'readwrite'); 

// 监听事务的完成、错误和中止事件
transaction.oncomplete = function(event) {
    console.log("事务完成。");
};

transaction.onerror = function(event) {
    console.error("事务失败:", event.target.error);
};

transaction.onabort = function(event) {
    console.warn("事务已中止:", event.target.error);
};

// 获取 Object Store 实例
const userObjectStore = transaction.objectStore('users');
```

### 3.3 CRUD 操作 (增删改查)

在事务中，通过 Object Store 实例执行 CRUD 操作。

#### 3.3.1 添加数据 (`add`)

`add()` 方法用于添加新记录。如果尝试添加一个与现有主键相同的记录，会触发错误。

```javascript
function addUser(user) {
    const transaction = db.transaction(['users'], 'readwrite');
    const userObjectStore = transaction.objectStore('users');

    const request = userObjectStore.add(user); // user 是一个 JavaScript 对象

    request.onsuccess = function(event) {
        console.log("用户添加成功，键值为:", event.target.result);
    };

    request.onerror = function(event) {
        console.error("用户添加失败:", event.target.error);
    };
}

// 示例数据
// addUser({ id: 1, name: 'Alice', age: 30, email: 'alice@example.com' });
// addUser({ id: 2, name: 'Bob', age: 25, email: 'bob@example.com' });
```

#### 3.3.2 获取数据 (`get` / `getAll` / 通过索引查询)

*   `get(key)`：通过主键获取一条记录。
*   `getAll()`：获取 Object Store 中的所有记录。
*   通过索引获取：先获取索引，再使用 `get(indexKey)` 或 `getAll(indexKey)`。

```javascript
function getUserById(id) {
    const transaction = db.transaction(['users'], 'readonly');
    const userObjectStore = transaction.objectStore('users');

    const request = userObjectStore.get(id); // 通过主键 'id' 获取

    request.onsuccess = function(event) {
        console.log(`获取用户 (ID: ${id}):`, event.target.result);
    };

    request.onerror = function(event) {
        console.error(`获取用户 (ID: ${id}) 失败:`, event.target.error);
    };
}

function getUserByEmail(email) {
    const transaction = db.transaction(['users'], 'readonly');
    const userObjectStore = transaction.objectStore('users');
    const emailIndex = userObjectStore.index('emailIndex'); // 获取 emailIndex

    const request = emailIndex.get(email); // 通过 emailIndex 获取

    request.onsuccess = function(event) {
        console.log(`获取用户 (Email: ${email}):`, event.target.result);
    };

    request.onerror = function(event) {
        console.error(`获取用户 (Email: ${email}) 失败:`, event.target.error);
    };
}

function getAllUsers() {
    const transaction = db.transaction(['users'], 'readonly');
    const userObjectStore = transaction.objectStore('users');

    const request = userObjectStore.getAll(); // 获取所有用户

    request.onsuccess = function(event) {
        console.log("所有用户:", event.target.result);
    };

    request.onerror = function(event) {
        console.error("获取所有用户失败:", event.target.error);
    };
}

// getUserById(1);
// getUserByEmail('bob@example.com');
// getAllUsers();
```

#### 3.3.3 更新数据 (`put`)

`put()` 方法用于更新现有记录，或在记录不存在时添加新记录。

```javascript
function updateUserName(id, newName) {
    const transaction = db.transaction(['users'], 'readwrite');
    const userObjectStore = transaction.objectStore('users');

    // 先获取要更新的记录
    const getRequest = userObjectStore.get(id);

    getRequest.onsuccess = function(event) {
        const user = event.target.result;
        if (user) {
            user.name = newName; // 更新属性
            const putRequest = userObjectStore.put(user); // 使用 put 存储更新后的对象

            putRequest.onsuccess = function() {
                console.log(`用户 (ID: ${id}) 名称更新成功为: ${newName}`);
            };
            putRequest.onerror = function(event) {
                console.error(`用户 (ID: ${id}) 更新失败:`, event.target.error);
            };
        } else {
            console.warn(`未找到 ID 为 ${id} 的用户，无法更新。`);
        }
    };

    getRequest.onerror = function(event) {
        console.error(`获取用户 (ID: ${id}) 失败，无法更新:`, event.target.error);
    };
}

// updateUserName(1, 'Alicia Smith');
```

#### 3.3.4 删除数据 (`delete` / `clear`)

*   `delete(key)`：通过主键删除一条记录。
*   `clear()`：删除 Object Store 中的所有记录。

```javascript
function deleteUserById(id) {
    const transaction = db.transaction(['users'], 'readwrite');
    const userObjectStore = transaction.objectStore('users');

    const request = userObjectStore.delete(id);

    request.onsuccess = function() {
        console.log(`用户 (ID: ${id}) 删除成功。`);
    };

    request.onerror = function(event) {
        console.error(`用户 (ID: ${id}) 删除失败:`, event.target.error);
    };
}

function clearAllUsers() {
    const transaction = db.transaction(['users'], 'readwrite');
    const userObjectStore = transaction.objectStore('users');

    const request = userObjectStore.clear();

    request.onsuccess = function() {
        console.log("所有用户已清空。");
    };

    request.onerror = function(event) {
        console.error("清空用户失败:", event.target.error);
    };
}

// deleteUserById(2);
// clearAllUsers();
```

### 3.4 游标遍历 (`openCursor`)

游标可以高效地遍历数据，支持范围查询和排序。

```javascript
function iterateUsersByAgeRange(minAge, maxAge) {
    const transaction = db.transaction(['users'], 'readonly');
    const userObjectStore = transaction.objectStore('users');
    const nameIndex = userObjectStore.index('nameIndex'); // 使用 nameIndex 进行遍历 (虽然是按名字，但演示游标)

    // 创建一个键范围 (keyRange)
    const range = IDBKeyRange.bound('A', 'Z', false, false); // 名字以 A-Z 开头的

    // openCursor() 可以用在 objectStore 或 index 上
    // 参数1: keyRange (可选)
    // 参数2: 方向 ('next', 'prev', 'nextunique', 'prevunique')
    const request = nameIndex.openCursor(range, 'next');

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            // cursor.key 是当前记录的索引键 ('name' in this case)
            // cursor.value 是当前记录的对象
            if (cursor.value.age >= minAge && cursor.value.age <= maxAge) {
                console.log("游标找到用户:", cursor.value);
            }
            cursor.continue(); // 移动到下一条记录
        } else {
            console.log("游标遍历完成。");
        }
    };

    request.onerror = function(event) {
        console.error("游标遍历失败:", event.target.error);
    };
}

// 确保先添加一些用户，再调用此函数
// 例如:
// addUser({ id: 3, name: 'Charlie', age: 35, email: 'charlie@example.com' });
// iterateUsersByAgeRange(20, 30);
```

## 四、高级概念与最佳实践

### 4.1 Promise 封装

由于 IndexedDB API 是基于回调和事件的，容易造成“回调地狱”。在实际项目中，通常会使用 Promise 或 async/await 封装 IndexedDB 操作，或者使用第三方库（如 `Dexie.js`、`localForage`）来简化开发。

**Promise 封装示例 (概念性)**：

```javascript
function openDbPromise(dbName, version) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);
        request.onerror = event => reject(event.target.error);
        request.onsuccess = event => resolve(event.target.result);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            // 在这里执行升级逻辑，例如创建/更新 object store 和索引
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };
    });
}

async function addSetting(dbInstance, key, value) {
    return new Promise((resolve, reject) => {
        const transaction = dbInstance.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.add({ key, value });

        request.onsuccess = () => resolve(request.result);
        request.onerror = event => reject(event.target.error);
    });
}

// 示例调用
// async function main() {
//     try {
//         const myDb = await openDbPromise('mySettingsDb', 1);
//         await addSetting(myDb, 'theme', 'dark');
//         console.log('Setting added successfully.');
//     } catch (error) {
//         console.error('Operation failed:', error);
//     }
// }
// main();
```

### 4.2 错误处理

*   所有 `IDBRequest` 对象都有 `onerror` 事件。
*   事务对象有 `onerror` 和 `onabort` 事件，用于处理整个事务范围内的错误。
*   当事务中的任何一个请求失败时，整个事务都会自动中止 (abort) 并回滚。

### 4.3 存储限制与持久性

*   IndexedDB 的存储限制通常非常大，但不是无限的。浏览器会根据设备存储空间、用户设置和使用情况进行管理。
*   默认情况下，IndexedDB 存储是**持久化**的，即数据不会在浏览器关闭后丢失。但在某些极端情况下（如存储空间不足、用户清除缓存），数据仍可能被删除。
*   为了更强的持久性保证，可以使用 [StorageManager API](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager) 请求 `persisted` 存储。

### 4.4 内存管理

*   如果你在 IndexedDB 中存储了 `Blob` 或 `File` 对象，并且通过 `URL.createObjectURL()` 创建了临时的 Object URL，请务必在不再需要时调用 `URL.revokeObjectURL()` 释放内存。

### 4.5 并发与锁

*   IndexedDB 支持多个事务同时进行，但不同的事务对同一 Object Store 的 `readwrite` 操作会进行排队。
*   并发的 `readonly` 事务可以并行执行。
*   `versionchange` 事务（升级数据库结构）是排他性的，在它执行期间，不允许有其他事务。

## 五、总结

IndexedDB 作为浏览器端的一种低级 API，提供了强大的、异步的、事务性的数据存储能力。它是构建离线优先 Web 应用、PWA 和需要处理大量结构化数据的 Web 应用的基石。虽然其原生 API 相对复杂，但通过理解其核心概念和工作流程，并结合适当的封装或第三方库，开发者可以高效地利用 IndexedDB 来提升 Web 应用的性能和用户体验。

**请注意**：IndexedDB 是一个纯粹的**客户端 (浏览器端) API**，其所有操作都在用户的浏览器中执行。因此，本篇文章中的代码示例均为 **JavaScript**。Go 语言通常用于**服务器端**开发，无法直接用于浏览器中与 IndexedDB 进行交互。
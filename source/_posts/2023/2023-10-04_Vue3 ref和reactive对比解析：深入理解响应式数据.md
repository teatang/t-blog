---
title: Vue3 ref和reactive对比解析：深入理解响应式数据
date: 2023-10-04 06:24:00
tags:
  - 2023
  - Vue
  - 前端技术
  - JavaScript
categories:
  - 前端技术
  - Vue
---

> 在 Vue 3 的 Composition API 中，`ref` 和 `reactive` 是创建响应式状态的两个核心函数。它们都旨在将普通 JavaScript 数据转换为响应式数据，以便在数据变化时自动触发视图更新。然而，它们在处理数据类型、访问方式和底层机制上存在显著差异。理解这些差异对于有效地使用 Composition API 至关重要。

{% note info %}
核心思想：`ref` 用于处理**原始值**和**对象**，通过 `.value` 访问其内部值，而 `reactive` 专门用于处理**对象**，直接访问对象的属性，且底层基于 Proxy 实现。
{% endnote %}
------

## 一、`ref`：处理原始值和对象

`ref` 函数接受一个内部值（`inner value`），并返回一个响应式的 `ref` 对象。这个 `ref` 对象只有一个 `value` 属性，用来指向内部值。

### 1.1 定义和用法

*   **定义**：`ref` 可以接收任何类型的值作为参数：原始值 (string, number, boolean, null, undefined, Symbol) 或对象 (Object, Array)。
*   **访问**：在 JavaScript 中访问 `ref` 对象时，需要通过其 `.value` 属性来获取或修改其内部值。在 Vue 的模板中，`ref` 会自动解包（`unwrap`），因此可以直接访问，无需 `.value`。

**示例**：

```vue
<template>
  <div>
    <p>计数器: {{ count }}</p>
    <button @click="increment">增加</button>

    <p>用户信息: {{ user.name }} - {{ user.age }}</p>
    <button @click="changeUserName">修改用户姓名</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 1. 处理原始值
const count = ref(0); // count 是一个 ref 对象 { value: 0 }

function increment() {
  count.value++; // 在 JS 中访问需要 .value
}

// 2. 处理对象
const user = ref({ name: 'Alice', age: 30 }); // user 也是一个 ref 对象 { value: { name: 'Alice', age: 30 } }

function changeUserName() {
  user.value.name = 'Bob'; // 在 JS 中访问对象内部属性时，也需要先 .value 拿到真正的对象
}

// 示例：在模板中自动解包
// <p>{{ count }}</p> 等同于 <p>{{ count.value }}</p>
// <p>{{ user.name }}</p> 等同于 <p>{{ user.value.name }}</p>
</script>
```

### 1.2 `ref` 的特点

*   **内部值可变**：`ref` 封装的内部值可以通过 `ref.value` 随时更改。
*   **模板自动解包**：在模板中，如果 `ref` 对象是顶层属性，Vue 会自动解包其 `.value`。
*   **对象被深度响应式化**：如果 `ref` 接收的是一个对象，Vue 会自动通过 `reactive` 将其转换为深层响应式对象。这意味着 `user.value.name = 'Bob'` 这样的操作也能触发更新。
*   **`unref()`**：可以用来判断一个值是否是 `ref` 对象，如果是，则返回其内部值，否则返回其自身。
    ```javascript
    import { ref, unref } from 'vue';
    const numRef = ref(10);
    const num = 20;

    console.log(unref(numRef)); // 10
    console.log(unref(num));    // 20
    ```
*   **`isRef()`**：判断一个值是否为 `ref` 对象。
    ```javascript
    import { ref, isRef } from 'vue';
    const numRef = ref(10);
    const num = 20;

    console.log(isRef(numRef)); // true
    console.log(isRef(num));    // false
    ```
*   **`toRef()` / `toRefs()`**：这两个工具函数通常用于将 `reactive` 对象中的属性转换为 `ref`，以便解构或传递给子组件时保持响应性。

## 二、`reactive`：处理对象

`reactive` 函数接收一个普通的 JavaScript 对象（或数组），并返回该对象的响应式代理（Proxy）。

### 2.1 定义和用法

*   **定义**：`reactive` **只能接收对象类型** (Object, Array, Map, Set)。如果传入原始值，`reactive` 会直接返回该原始值，并且不具备响应性。
*   **访问**：直接通过对象的属性名访问和修改，就像普通 JavaScript 对象一样，无需 `.value`。

**示例**：

```vue
<template>
  <div>
    <p>用户信息: {{ user.name }} - {{ user.age }}</p>
    <button @click="changeUserAge">修改用户年龄</button>

    <p>商品列表:</p>
    <ul>
      <li v-for="item in products" :key="item.id">
        {{ item.name }} - {{ item.price }}
      </li>
    </ul>
    <button @click="addProduct">添加商品</button>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

// 1. 处理对象
const user = reactive({ name: 'Bob', age: 25 }); // user 是一个 Proxy 对象

function changeUserAge() {
  user.age++; // 直接访问和修改属性
}

// 2. 处理数组 (数组也是对象)
const products = reactive([
  { id: 1, name: 'Laptop', price: 1200 },
  { id: 2, name: 'Mouse', price: 25 },
]);

function addProduct() {
  products.push({ id: products.length + 1, name: 'Keyboard', price: 75 });
}

// 尝试传入原始值 (无效)
const primitiveValue = reactive(100);
console.log(primitiveValue); // 100 (不是响应式对象)
primitiveValue++; // 不会触发任何更新
</script>
```

### 2.2 `reactive` 的特点

*   **深层响应式**：`reactive` 会将其对象以及所有嵌套的对象都转换为响应式代理。
*   **基于 Proxy**：`reactive` 的实现是基于 ES6 的 `Proxy` 对象，它能够拦截对对象的各种操作（如属性访问、赋值、删除等）。
*   **解构丢失响应性**：对 `reactive` 对象进行解构 (`const { name } = user;`) 会导致解构出的变量失去响应性，因为它们不再是 `Proxy` 对象的属性。
    ```javascript
    const state = reactive({ count: 0 });
    let { count } = state;
    count++; // count 只是一个普通数字，state.count 不变
    console.log(state.count); // 0
    ```
    为了解决这个问题，可以使用 `toRefs` 或 `toRef`。
*   **`isReactive()`**：判断一个值是否为 `reactive` 对象。
    ```javascript
    import { reactive, isReactive } from 'vue';
    const state = reactive({ count: 0 });
    const obj = { count: 0 };

    console.log(isReactive(state)); // true
    console.log(isReactive(obj));   // false
    ```
*   **`markRaw()`**：将一个对象标记为“原始的”，使其永远不会被转换为响应式对象。

## 三、`ref` 和 `reactive` 的对比总结

| 特性       | `ref`                                  | `reactive`                                  |
| :--------- | :------------------------------------- | :------------------------------------------ |
| **接受类型** | 原始值和对象 (Object, Array 等)        | 只能是对象 (Object, Array, Map, Set)        |
| **访问方式** | 在 JS 中通过 `.value` 访问；在模板中自动解包 | 直接通过属性名访问；在模板中也直接访问      |
| **底层实现** | 内部值是一个 `Proxy` 对象 (如果内部值是对象)，外部是一个普通对象加上 `.value` 属性 | 直接返回一个 `Proxy` 对象                     |
| **解构问题** | 无解构问题，解构 `ref` 仍需 `.value` 或 `toRefs` 转换 | 直接解构会丢失响应性，需要配合 `toRefs` 使用 |
| **深层响应式** | 如果内部是对象，则自动深层响应式化     | 默认深层响应式化                            |
| **用途建议** | 推荐用于封装原始值，或单个复杂对象（当需要将整个对象替换时） | 推荐用于封装多个相关联的属性的对象（如表单数据），或数据集合 |

## 四、选择 `ref` 还是 `reactive`？

选择 `ref` 还是 `reactive` 主要取决于你想要封装的数据类型以及你的开发习惯。

1.  **处理原始值 (Primitive Values)**：
    *   **只能使用 `ref`**。`reactive` 对原始值无效。

2.  **处理对象 (Objects)**：
    *   **推荐使用 `reactive`**：当你有一个包含多个属性的对象，并且你希望以更自然的方式（无需 `.value`）访问这些属性时，`reactive` 是更好的选择。
        ```javascript
        const form = reactive({
            username: '',
            password: '',
            rememberMe: false
        });
        // 访问：form.username
        ```
    *   **特殊情况使用 `ref` 封装对象**：
        *   当你需要**完全替换整个对象实例**时，`ref` 封装对象会更方便。例如，从后端获取新数据后，需要用新对象替换现有对象：
            ```javascript
            const userInfo = ref({ name: 'Old', age: 0 });
            // ...
            async function fetchNewUser() {
                const newUserData = await api.getUser(); // 假设返回 { name: 'New', age: 1 }
                userInfo.value = newUserData; // 替换整个对象
            }
            ```
            如果使用 `reactive`，直接 `userInfo = newUserData` 会破坏响应性（因为 `userInfo` 只是一个代理对象，重新赋值会使其指向新的普通对象）。你需要逐个属性赋值：
            ```javascript
            const userInfo = reactive({ name: 'Old', age: 0 });
            // ...
            async function fetchNewUser() {
                const newUserData = await api.getUser();
                Object.assign(userInfo, newUserData); // 逐个赋值，保留代理
            }
            ```
        *   当你需要将对象作为参数传递给函数或子组件，并希望**保持其响应性而不受解构影响**时，`ref` 封装的对象可以避免 `reactive` 的解构问题（虽然 `reactive` 可以通过 `toRefs` 解决）。

3.  **统一风格**：
    *   **全部使用 `ref`**：有些开发者倾向于所有响应式数据都使用 `ref`，以保持代码风格一致，并且始终通过 `.value` 访问。这可以避免忘记 `.value` 的情况。
        ```javascript
        const count = ref(0);
        const user = ref({ name: 'Alice', age: 30 }); // 封装对象
        ```
    *   **混用 `ref` 和 `reactive`**：Vue 官方鼓励根据数据类型合理混用。原始值用 `ref`，对象用 `reactive`。

**总结性建议**：
*   **默认使用 `ref`**，因为它对原始值和对象都适用，且模板中自动解包，使用起来更“通用”。
*   **当处理结构复杂的对象，且需要通过多个属性来操作时，考虑使用 `reactive`**，因为它提供更自然的 JavaScript 对象操作体验。
*   理解 `reactive` 的解构问题，并在需要时使用 `toRefs` 辅助。

## 五、实际应用场景示例

### 5.1 `reactive` 封装表单数据

```vue
<template>
  <form @submit.prevent="submitForm">
    <input type="text" v-model="formData.username" placeholder="用户名" />
    <input type="password" v-model="formData.password" placeholder="密码" />
    <button type="submit">登录</button>
  </form>
  <p v-if="loginError">{{ loginError }}</p>
</template>

<script setup>
import { reactive, ref } from 'vue';

const formData = reactive({
  username: '',
  password: '',
});

const loginError = ref(''); // 错误信息用 ref 封装原始值

function submitForm() {
  if (formData.username === 'test' && formData.password === '123') {
    alert('登录成功！');
    loginError.value = '';
  } else {
    loginError.value = '用户名或密码错误。';
  }
}
</script>
```

### 5.2 `ref` 封装单个状态和通过 `toRefs` 处理 `reactive` 解构

```vue
<template>
  <div>
    <h2>User Profile</h2>
    <p>Name: {{ nameRef }}</p>
    <p>Email: {{ emailRef }}</p>
    <button @click="changeProfile">修改信息</button>
  </div>
</template>

<script setup>
import { reactive, toRefs } from 'vue';

const userProfile = reactive({
  name: 'Charlie',
  email: 'charlie@example.com',
  age: 28,
});

// 使用 toRefs 将 reactive 对象的属性转换为 ref 集合
// 这样解构出来的 nameRef 和 emailRef 都是 ref 对象，保持了响应性
const { name: nameRef, email: emailRef } = toRefs(userProfile);

function changeProfile() {
  nameRef.value = 'David'; // 修改 nameRef.value 会影响 userProfile.name
  emailRef.value = 'david@example.com';
  // userProfile.age 也仍然是响应式的
  userProfile.age = 29;
}
</script>
```

## 六、总结

`ref` 和 `reactive` 都是 Vue 3 Composition API 中强大的响应式工具。`ref` 提供了一个通用的封装，能够处理所有类型的数据，通过 `.value` 访问，并在模板中自动解包。`reactive` 则专为对象设计，提供更直接的属性访问体验，但需注意解构带来的响应性丢失问题，并可配合 `toRefs` 解决。在实际开发中，开发者可以根据具体的数据类型、操作习惯以及是否需要替换整个对象等因素，灵活选择使用它们，或者将它们结合起来使用。理解它们的差异和适用场景，有助于写出更高效、更易维护的 Vue 3 应用。
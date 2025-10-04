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

> Vue 3 引入的 **Composition API (组合式 API)** 为我们提供了更强大、更灵活的逻辑组织和复用能力。在 Composition API 中，管理响应式状态的核心就是 `ref` 和 `reactive` 这两个函数。理解它们的异同和适用场景，是掌握 Vue 3 响应式系统、编写高效且可维护组件的关键。

{% note info %}
本文将详细对比 `ref` 和 `reactive`，从原理、用法、优缺点及适用场景等方面进行深入解析，帮助你更好地在 Vue 3 项目中做出选择。
{% endnote %}

## 一、 响应式数据的核心概念

在 Vue 3 中，响应式数据指的是当数据发生变化时，相关的 DOM 会自动更新。这是通过 ES2015 的 Proxy 对象实现的，Vue 3 利用 Proxy 代理数据对象，从而能够侦测到对象属性的读取和修改。

无论是 `ref` 还是 `reactive`，它们最终目的都是创建响应式数据。

## 二、 `reactive` 详解

### 1. 概念

`reactive` 函数接收一个 **普通 JavaScript 对象**（包括数组），并返回该对象的响应式代理 (Proxy)。这个代理对象具有 **深度响应性**，即对象内部嵌套的所有对象（包括 `Map`、`Set` 以及 `WeakMap`、`WeakSet` 以外的其他标准内置对象）都会被转换为响应式对象。

### 2. 用法

```js
import { reactive } from 'vue';

const state = reactive({
  count: 0,
  user: {
    name: 'Alice',
    age: 30,
  },
  items: ['apple', 'banana'],
});

// 访问和修改数据
console.log(state.count); // 0
state.count++;            // 响应式更新
state.user.age++;         // 深度响应，嵌套对象属性变化也会触发更新
state.items.push('orange'); // 数组操作也会触发更新
```

从 `reactive` 返回的对象在使用时**无需 `.value` 访问**，直接像普通对象一样访问其属性即可。

### 3. 优点

*   **直观的对象代理**: 对于复杂的对象或多个独立但逻辑上相关的状态，使用 `reactive` 可以将其组织成一个单一的响应式对象，使得数据结构更加清晰。
*   **深度响应性**: 默认提供深度响应，无需手动处理嵌套对象的响应式转换。
*   **简洁的属性访问**: 在 `script` 标签内部访问响应式对象时，不需要 `.value` 后缀，更接近普通 JavaScript 对象的用法。

### 4. 缺点

*   **只适用于对象类型**: `reactive` 只能接收对象 (包括数组)，不能直接用来处理原始值 (string, number, boolean, null, undefined, symbol, bigint)。
*   **无法替换整个对象**: 响应式代理的建立是针对传入的对象。如果你 `state = newState` 这样替换整个 `state` 对象（而不是修改其属性），那么新的 `state` 对象将不再是响应式的，与视图的连接会丢失。
    ```js
    let state = reactive({ count: 0 });
    // state = { count: 1 }; // 这是错误的，会失去响应性
    // 正确的做法是：
    // Object.assign(state, { count: 1 });
    // 或者修改state的内部属性：
    // state.count = 1;
    ```
    这也是为什么通常不直接解构 `reactive` 对象的属性，因为解构后的变量会失去响应性（除非使用 `toRefs`）。
*   **对解构不友好**: 直接解构 `reactive` 对象的属性会使其失去响应性，因为解构出的变量不再是代理对象的属性。
    ```js
    const state = reactive({ count: 0 });
    let { count } = state; // count 此时是一个普通的数字，不是响应式的
    count++; // 不会触发视图更新
    ```

## 三、 `ref` 详解

### 1. 概念

`ref` 函数接收一个**任意类型的值**（原始值、对象、数组等），并返回一个响应式对象。这个对象只有一个属性 `.value`，用来存储和修改实际的数据。`ref` 内部会根据传入值的类型，决定是直接包装原始值，还是将对象值用 `reactive` 进一步处理，使其具有深度响应性。

### 2. 用法

```js
import { ref } from 'vue';

// 原始值
const count = ref(0);
const message = ref('Hello');
const isActive = ref(true);

// 对象或数组
const user = ref({ name: 'Bob', age: 25 });
const items = ref(['book', 'pen']);

// 访问和修改数据 (在 script 内部必须使用 .value)
console.log(count.value); // 0
count.value++;            // 响应式更新

console.log(user.value.name); // Bob
user.value.age++;             // 对象内部被 reactive 处理，也是深度响应的

// 在模板中会自动解包，无需 .value
// <template>
//   <p>{{ count }}</p>
//   <p>{{ user.name }}</p>
// </template>
```

### 3. 优点

*   **通用性强**: 既能处理原始值，也能处理对象和数组，是创建独立响应式状态的非常方便的方式。
*   **可以替换整个值**: 由于 `ref` 包裹的是一个 `.value` 属性，你可以直接赋给 `ref` 一个新的值，无论是原始值还是对象，响应性都不会丢失。
    ```js
    const count = ref(0);
    count.value = 100; // 有效
    const obj = ref({ a: 1 });
    obj.value = { b: 2 }; // 有效，整个对象被替换，响应性保留
    ```
*   **对解构友好 (在使用 `toRefs` 或在模板中)**:
    *   在模板中，`ref` 会被 Vue 编译器自动解包 (unwrapped)，无需 `.value`。
    *   结合 `toRefs` 或者 `toRef`，可以安全地从 `reactive` 对象中解构出响应式的 `ref` 属性。
*   **清晰的响应式标识**: 所有以 `.value` 访问的数据，都明确地表明它是响应式数据，提高了代码的可读性。

### 4. 缺点

*   **`.value` 访问**: 在 `script` 内部访问和修改数据时，必须始终使用 `.value` 后缀，这对于习惯了普通 JavaScript 对象操作的开发者来说，可能需要一些适应时间，有时也觉得增加了冗余。

## 四、 `ref` 和 `reactive` 对比总结

| 特性 / 方面   | `ref`                                             | `reactive`                                    |
| :------------ | :------------------------------------------------ | :-------------------------------------------- |
| **接受值类型**| **任意类型** (原始值、对象、数组)               | **仅限对象类型** (包括数组)，不能是原始值。  |
| **内部原理**  | 为传入值创建一个包裹对象 `{ value: T }`，并通过 Proxy 代理此包裹对象。| 直接为传入的普通 JavaScript 对象创建 Proxy 代理。|
| **访问方式**  | **`xxx.value`** (在 `script` 内部)。模板中可自动解包。| **`xxx.prop`** (像普通对象一样)。              |
| **深度响应**  | **是**。如果传入对象，内部会自动用 `reactive` 转换。| **是**。默认提供深度响应。                      |
| **替换值**    | **可以**。`myRef.value = newValue` 可以替换整个值。| **不能**直接替换整个对象，只能修改其属性。    |
| **解构问题**  | 安全，但需要 `toRefs` 辅助以保留响应式。          | **不安全**，直接解构会失去响应性 (除非结合 `toRefs`)。|
| **适用场景**  | 推荐用于**单个独立的**响应式数据（包括原始值）。  | 推荐用于**一组相关联的**响应式数据对象。        |
| **类型兼容**  | `Ref<T>`                                          | `T` (被 Proxy 包裹后的类型)                    |
| **代码简洁性**| 原始值场景更简洁。访问时需要 `.value`。           | 对象场景读写属性更接近 JS 原生。               |

## 五、 如何选择：实践中的建议

在实际项目开发中，选择 `ref` 还是 `reactive` 并没有绝对的对错，更多是根据具体场景和个人/团队偏好。以下是一些指导原则：

1.  **优先使用 `ref` 来创建独立的响应式变量。**
    *   **原始值**: `ref("hello")`, `ref(123)`, `ref(true)` 这是唯一且自然的选项。
    *   **单个对象或数组**: 当你只需要一个独立的响应式对象或数组时，使用 `ref` 也很方便，因为它允许你替换整个对象/数组，而且在模板中不需 `.value`。
        ```js
        const user = ref({ name: 'Alice' });
        user.value = { name: 'Bob' }; // 轻松替换
        ```

2.  **当存在一组逻辑上紧密关联的多个响应式属性时，考虑使用 `reactive`。**
    *   例如，一个表单的数据、一个用户的详细信息、一个组件的复杂状态。
    *   这有助于将相关属性组织在一个对象中，避免创建过多的 `ref` 变量。
        ```js
        const form = reactive({
          username: '',
          password: '',
          rememberMe: false
        });
        // 访问：form.username
        ```
    *   **关于解构 `reactive` 对象**: 如果你确实需要从 `reactive` 对象中解构属性并在模板中使用，强烈建议使用 `toRefs` 或 `toRef`：
        ```js
        import { reactive, toRefs } from 'vue';

        const state = reactive({ count: 0, name: 'Vue' });
        const { count, name } = toRefs(state); // count 和 name 此时是响应式的 ref
        // 在模板中可以直接使用 {{ count }} 和 {{ name }}
        // 在 script 中：count.value++, name.value = 'New Vue'
        ```

3.  **遵循一致性**: 在团队开发中，讨论并确定一种主要的使用模式，以保持代码风格的一致性。

### 示例：一个复杂的组件状态

```js
import { ref, reactive, computed, watch, toRefs } from 'vue';

export default {
  setup() {
    // 1. 使用 ref 管理独立和简单的状态
    const counter = ref(0);
    const isLoading = ref(false);

    // 2. 使用 reactive 管理一组相关联的复杂状态
    const userProfile = reactive({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      address: {
        street: '123 Main St',
        city: 'Anytown',
      },
    });

    // 3. 将 reactive 对象的属性转换为 ref 以便安全解构和在模板中使用
    const { firstName, lastName, address } = toRefs(userProfile);

    // 4. 计算属性 (使用 .value 访问 ref，使用 .prop 访问 reactive 属性)
    const fullName = computed(() => `${firstName.value} ${lastName.value}`);
    const fullAddress = computed(() => `${address.value.street}, ${address.value.city}`);

    // 5. 方法
    const increment = () => {
      counter.value++;
    };

    const updateLastName = (newLastName) => {
      userProfile.lastName = newLastName; // 或者 lastName.value = newLastName;
    };

    return {
      counter,
      isLoading,
      firstName, // 解构后的 ref
      lastName,  // 解构后的 ref
      address,   // 解构后的 ref (仍是 ref 包裹的对象)
      fullName,
      fullAddress,
      increment,
      updateLastName,
    };
  },
};
```

## 六、 总结

`ref` 和 `reactive` 都是 Vue 3 组合式 API 中用于创建响应式数据的基石，但它们的设计理念和适用场景略有不同：

*   **`ref` 更适合处理任意类型的单一响应式数据**，尤其是原始值，并且在模板中具有自动解包的便利性。
*   **`reactive` 更适合处理包含多个属性的复杂对象或数组**，将其作为一个整体进行响应式管理，但在直接解构时需要 `toRefs` 的辅助。

理解这两者的异同，并根据实际需求灵活运用，将使你能够写出更清晰、更高效、更易维护的 Vue 3 应用程序。
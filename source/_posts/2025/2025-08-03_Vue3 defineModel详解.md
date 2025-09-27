---
title: Vue3 defineModel详解
date: 2025-08-03 06:24:00
tags:
  - 2025
  - Vue
  - 前端技术
  - JavaScript
categories:
  - 前端技术
  - Vue
---

> **`defineModel`** 是 Vue 3.4+ 版本中引入的一个新的 `<script setup>` 宏，旨在简化 `v-model` 的实现。它将组件的 `props` 和 `emit` 事件的复杂性抽象化，使得声明和使用双向绑定属性变得前所未有的直观和简洁。本篇将详细解释 `defineModel` 的用法、原理以及它带来的优势。

{% note info %}
“The `defineModel` macro simplifies the implementation of two-way binding props, providing idiomatic and easier-to-understand syntax for both child components and their parent components.” —— Vue.js Documentation
{% endnote %}

## 一、什么是 `defineModel`？

在 Vue 中，`v-model` 是一个强大的语法糖，用于在表单输入元素或者组件上实现双向数据绑定。在 Vue 3 (以及 `defineModel` 之前)，组件要支持 `v-model`，需要手动声明一个 `prop` (通常是 `modelValue`) 和一个对应的 `emit` 事件 (通常是 `update:modelValue`)。

`defineModel` 宏的出现，就是为了 **彻底简化** 这一繁琐的过程。它允许你直接在 `<script setup>` 中声明一个 `ref` 响应式变量，这个变量自动与父组件传入的 `v-model` 属性进行双向绑定。

**核心思想：将 `prop` 和 `emit` 的创建及同步逻辑自动化。**

## 二、`defineModel` 的基本用法

### 1. 默认 `v-model` (单向绑定)

当父组件只提供一个 `v-model` 时，子组件可以使用 `defineModel` 声明一个名为 `modelValue` 的响应式引用。

**父组件 (`App.vue`)**:

```vue
<script setup>
import MyInput from './MyInput.vue'
import { ref } from 'vue'

const inputValue = ref('Hello Vue 3.4!')
</script>

<template>
  <h1>App Component</h1>
  <p>Parent Value: {{ inputValue }}</p>
  <!-- v-model 绑定到子组件的默认 modelValue -->
  <MyInput v-model="inputValue" />
</template>
```

**子组件 (`MyInput.vue`)**:

```vue
<script setup>
// 1. 声明一个名为 'modelValue' 的响应式引用
//    它会自动与父组件的 v-model="inputValue" 进行双向绑定。
//    你可以为它提供一个默认值（如果父组件没有传入）
const modelValue = defineModel()

// 对 modelValue 的读写操作会自动同步到父组件
// modelValue.value = 'New Value' 会触发父组件更新
// 父组件inputValue变化也会同步到这里
</script>

<template>
  <div>
    <h3>MyInput Component</h3>
    <input v-model="modelValue" /> <!-- 子组件内部可以使用 v-model 绑定到这个 modelValue -->
    <p>Internal Value: {{ modelValue }}</p>
    <button @click="modelValue = 'Changed from Child'">Change from Child</button>
  </div>
</template>
```

**解释**:
*   在 `MyInput.vue` 中，`defineModel()` 隐式地声明了一个 `modelValue` 的 `prop` 和一个 `update:modelValue` 的 `emit` 事件。
*   `modelValue` 变量是一个 `ref` 对象。当你在子组件中修改 `modelValue.value` 时 (例如通过 `input v-model="modelValue"` 或 `modelValue = '...'`)，它会自动触发 `update:modelValue` 事件，更新父组件的 `inputValue`。
*   反之，当父组件的 `inputValue` 改变时，`modelValue` 也会自动同步更新。

### 2. 具名 `v-model` (多个绑定)

当父组件需要传递多个 `v-model` 时，可以在 `defineModel` 中指定名称。

**父组件 (`App.vue`)**:

```vue
<script setup>
import AdvancedInput from './AdvancedInput.vue'
import { ref } from 'vue'

const title = ref('Initial Title')
const content = ref('Some initial content goes here.')
</script>

<template>
  <h1>App Component</h1>
  <p>Parent Title: {{ title }}</p>
  <p>Parent Content: {{ content }}</p>
  <!-- 具名 v-model 绑定 -->
  <AdvancedInput v-model:title="title" v-model:content="content" />
</template>
```

**子组件 (`AdvancedInput.vue`)**:

```vue
<script setup>
// 声明两个具名 model
const title = defineModel('title')
const content = defineModel('content')

// 也可以给具名 model 设置默认值
const type = defineModel('type', { default: 'text' })

// 对 title 和 content 的读写操作都会自动触发对应的 update 事件
</script>

<template>
  <div>
    <h3>AdvancedInput Component</h3>
    <label>Title:</label>
    <input v-model="title" />
    <p>Internal Title: {{ title }}</p>

    <label>Content:</label>
    <textarea v-model="content"></textarea>
    <p>Internal Content: {{ content }}</p>

    <p>Type: {{ type }}</p>
    <button @click="type = 'number'">Change Type</button>
  </div>
</template>
```

## 三、`defineModel` 的选项

`defineModel` 可以接受一个可选的配置对象作为第二个参数，用于定义模型的行为。

**`defineModel([name], { options })`**

### 1. `default` (默认值)

为 `model` 定义默认值，当父组件没有提供相应的 `v-model` 绑定时使用。

```vue
const value = defineModel({ default: 'Default Value' }) // 默认 modelValue
const count = defineModel('count', { default: 0 })     // 具名 model
```

### 2. `required` (是否必传)

将 `model` 声明为必需的。如果父组件没有提供，Vue 会发出警告。

```vue
const value = defineModel({ required: true })
const username = defineModel('username', { required: true })
```

### 3. `type` (类型检查)

为 `prop` 声明类型，这有助于开发模式下的类型检查和警告。

```vue
const value = defineModel({ type: String })
const count = defineModel('count', { type: Number, default: 0 })
// 也可以是数组形式，表示多种类型
const data = defineModel('data', { type: [String, Number, Array] })
```

### 4. `validator` (自定义验证)

提供一个验证函数，用于在 `prop` 被设置时进行自定义验证。

```vue
const status = defineModel('status', {
  default: 'pending',
  validator: (value) => ['pending', 'success', 'error'].includes(value)
})
```

### 5. `set` (Set 修饰符) & `get` (Get 修饰符)

这两个选项允许你定义一个 `model` 的转换函数，类似于计算属性的 `setter` 和 `getter`。

*   **`get`**: 当从父组件接收到值时，在子组件内部使用这个函数转换值。
*   **`set`**: 当子组件内部修改值并尝试将其同步回父组件时，使用这个函数转换值。

```vue
// Example: 标准化输入到大写
const text = defineModel('text', {
  get(value) {
    console.log('Receiving value from parent:', value);
    return value ? value.toUpperCase() : ''; // 将父组件传来的值转为大写
  },
  set(value) {
    console.log('Sending value to parent:', value);
    return value ? value.toLowerCase() : ''; // 将子组件修改的值转为小写发给父组件
  }
})

// 父组件:
// <MyComponent v-model:text="myText" />
// 如果 myText = "hello", 子组件内部 text.value 会是 "HELLO"
// 如果子组件内部 input 输入 "WORLD", 那么父组件 myText 会变为 "world"
```

这是一个非常强大的功能，可以在组件边界进行数据转换和格式化，而无需手动编写计算属性或监听器。

### 6. `local` (局部状态，不再是 `prop`)

**自 Vue 3.4.10+ 版本起，`local` 选项已被移除。** 替代方案是使用一个新的 `defineModel` 实例和一个 `computed` 属性来管理本地状态。

**旧的 `local` 用法 (已移除)**:
```vue
// const count = defineModel('count', { local: true }) // ❌ 已废弃
```

**新的替代方案 (推荐)**:

```vue
import { computed } from 'vue'

const modelValue = defineModel() // 这是与父组件双向绑定的
const count = defineModel('count') // 具名 model

// 基于 modelValue 派生出一个局部状态，但可以通过 prop 传入初始值
// 这相当于一个普通的 prop，不会双向绑定回去
const localCount = computed(() => count.value ?? 0) // 如果 count prop 没有传，默认值为 0

// 如果你想在子组件内部修改，但不直接同步到父组件
const internalValue = defineModel('internalValue') // 内部使用的 model
const localInternalState = ref(internalValue.value ?? 0); // 从 prop 初始化内部 ref

// 可以在某个时机手动 emit 更新，或者只是内部使用
// <button @click="internalValue = localInternalState">Update Parent</button>
```

这个变化是为了让 `defineModel` 更专注于双向绑定本身，避免其产生歧义。如果你需要一个本地状态，但希望通过 `prop` 进行初始化，最好的方式是声明一个普通 `prop`，然后用 `ref` 或 `computed` 来跟踪它。

## 四、`defineModel` 的实现原理 (在幕后)

`defineModel` 宏在编译时会做以下转换：

1.  **自动声明 `prop`**: 对于 `defineModel([name], ...)`，它会自动生成一个同名的 `prop`。
    *   `defineModel()` => `props: { modelValue: ... }`
    *   `defineModel('foo')` => `props: { foo: ... }`
    *   `default`/`required`/`type`/`validator` 选项会直接翻译成 `prop` 的相应选项。
2.  **自动声明 `emit` 事件**: 自动生成一个 `update:[name]` 的 `emit` 事件。
    *   `defineModel()` => `emits: ['update:modelValue']`
    *   `defineModel('foo')` => `emits: ['update:foo']`
3.  **内部 `ref` 包装**: `defineModel` 返回的实际上是一个特殊的 `ref` 对象。
    *   当你读取 `modelValue.value` 时，它会返回父组件通过 `prop` 传入的值。
    *   当你修改 `modelValue.value = 'newValue'` 时，它会自动触发对应的 `update` 事件 (`emit('update:modelValue', 'newValue')`)，将新值发送回父组件。
    *   `get` 和 `set` 选项则会在这个读写过程中进行值的转换。

**简而言之，`defineModel` 是一个编译器宏，它替你编写了实现双向绑定所需的 boilerplate 代码。**

## 五、`defineModel` 的优势

1.  **极简的语法**: 不再需要手动声明 `props` 和 `emits`，一行代码搞定双向绑定。
2.  **直观易懂**: `defineModel` 返回的 `ref` 变量在子组件内部的行为就像一个普通的响应式状态，但它其实是与父组件同步的，大大降低了心智负担。
3.  **减少样板代码**: 对于每个需要支持 `v-model` 的组件，都节省了大量的重复代码。
4.  **更好的类型推导**: 结合 TypeScript 使用时，`defineModel` 能够提供更好的类型推导，提升开发体验。
5.  **支持多 `v-model`**: 轻松实现一个组件同时支持多个双向绑定属性。
6.  **`get` / `set` 转换**: 提供强大的数据转换能力，在组件边界对数据进行规范化或格式化。

## 六、与旧方法的对比

### 旧方法 (`props` + `emit`)

```vue
<!-- MyInput.vue (BEFORE defineModel) -->
<script setup>
import { computed } from 'vue'

const props = defineProps(['modelValue']) // 声明 prop
const emit = defineEmits(['update:modelValue']) // 声明 emit

// 创建一个计算属性来实现双向绑定逻辑
const value = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue) // 触发更新事件
  }
})
</script>

<template>
  <input v-model="value" />
</template>
```

### 新方法 (`defineModel`)

```vue
<!-- MyInput.vue (WITH defineModel) -->
<script setup>
const value = defineModel() // 一行搞定
</script>

<template>
  <input v-model="value" />
</template>
```

对比可见，`defineModel` 大幅简化了实现 `v-model` 的代码。

## 七、注意事项

1.  **Vue 版本要求**: `defineModel` 首次于 **Vue 3.4** 引入，要使用此宏，请确保您的 Vue 项目版本在 3.4.0 或更高。
2.  **`<script setup>` 限定**: `defineModel` 只能在 `<script setup>` 中使用。
3.  **名称冲突**: 确保 `defineModel` 声明的名称不会与组件内部的 `ref`、`reactive` 变量或其他生命周期钩子等产生名称冲突。
4.  **性能考量**: `defineModel` 只是简化了语法，其底层机制与 `props` + `emit` 类似，不会引入额外的性能开销。
5.  **响应性**: `defineModel` 返回的是一个 `ref`，所以始终通过 `.value` 来访问和修改其值。

## 八、结论

`defineModel` 是 Vue 3.4+ 版本中一个非常重要的改进，它极大地简化了组件实现双向绑定的工作流。通过将 `prop` 和 `emit` 的底层机制抽象化，它提供了一个更简洁、直观和高效的方式来构建支持 `v-model` 的可复用组件。对于现代 Vue 应用程序的开发来说，掌握 `defineModel` 将显著提升您的开发效率和代码质量。
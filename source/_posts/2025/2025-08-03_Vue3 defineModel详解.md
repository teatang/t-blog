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

> `defineModel` 是 Vue 3.4 版本中引入的一个新的宏 (macro)，旨在简化组件中双向绑定 `v-model` 的实现。在 Composition API 的 `setup` 语法糖 (`<script setup>`) 中使用时，它极大地减少了为组件实现 `v-model` 所需的样板代码，使其更加直观和便捷。

{% note info %}
核心思想：**`defineModel` 是 `defineProps` 和 `defineEmits` 的语法糖，它声明了一个可双向绑定的 props，并自动处理了 `modelValue` prop 的接收和相应的 `update:modelValue` 事件的触发，让自定义组件的 `v-model` 用法变得和原生表单元素一样简洁。**
{% endnote %}
------

## 一、为什么需要 `defineModel`？

在 `defineModel` 出现之前，如果你想在 Vue 3 的自定义组件中实现 `v-model` 双向绑定，你需要手动完成以下步骤：

1.  通过 `defineProps` 声明一个名为 `modelValue` 的 prop 来接收父组件传递的值。
2.  通过 `defineEmits` 声明一个名为 `update:modelValue` 的事件，当组件内部的值发生变化时，通过此事件通知父组件更新。

这种模式虽然有效，但在每个需要双向绑定的组件中都需要重复编写这些样板代码，导致代码冗余且不够直观。例如：

**传统 `v-model` 实现示例：**

```vue
<!-- MyInput.vue (传统方式) -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emits = defineEmits(['update:modelValue']);

// 使用 computed 属性实现双向绑定
const value = computed({
  get() {
    return props.modelValue;
  },
  set(newValue) {
    emits('update:modelValue', newValue);
  }
});
</script>

<template>
  <input v-model="value" />
  <!-- 或者直接绑定： -->
  <!-- <input :value="props.modelValue" @input="emits('update:modelValue', $event.target.value)" /> -->
</template>
```

**父组件使用：**

```vue
<!-- App.vue -->
<script setup>
import { ref } from 'vue';
import MyInput from './MyInput.vue';

const message = ref('Hello Vue!');
</script>

<template>
  <MyInput v-model="message" />
  <p>Message: {{ message }}</p>
</template>
```

`defineModel` 的目标就是消除这种繁琐，提供一个更简洁、更符合直觉的 API 来实现相同的功能。

## 二、`defineModel` 的基本用法

`defineModel` 宏只能在 `<script setup>` 中使用。它返回一个 `ref` 对象，这个 `ref` 对象可以像普通的 `ref` 一样在模板中使用，并且它的 `.value` 属性可以被读写。当 `ref` 的值被修改时，它会自动触发相应的 `update:modelValue` 事件。

### 2.1 基础 `v-model` (默认 `modelValue`)

当父组件使用 `v-model="data"` 时，子组件会接收一个名为 `modelValue` 的 prop，并期望触发 `update:modelValue` 事件。

```vue
<!-- MyInput.vue (使用 defineModel) -->
<script setup>
const model = defineModel() // 声明一个名为 'modelValue' 的 prop

// model 是一个 ref 对象，可以直接在 template 中使用
// 它的 .value 属性可以被读写
// 当 model.value 被修改时，会自动触发 update:modelValue 事件
</script>

<template>
  <input v-model="model" />
  <!-- 也可以手动绑定： -->
  <!-- <input :value="model" @input="model = $event.target.value" /> -->
  <p>Internal Model Value: {{ model }}</p>
</template>
```

**父组件使用方式不变：**

```vue
<!-- App.vue -->
<script setup>
import { ref } from 'vue';
import MyInput from './MyInput.vue';

const message = ref('Hello Vue!');
</script>

<template>
  <MyInput v-model="message" />
  <p>Message: {{ message }}</p>
</template>
```

现在，`MyInput.vue` 的实现变得非常简洁。`defineModel()` 宏承担了声明 prop 和 emit 事件的所有繁琐工作。

## 三、带有参数的 `v-model` (多个 `v-model` 绑定)

在 Vue 3 中，一个组件可以同时支持多个 `v-model` 绑定，通过给 `v-model` 指定一个参数来实现，例如 `v-model:foo="data"`。

`defineModel` 同样支持这种带参数的用法：

```vue
<!-- MyMultiInput.vue (使用 defineModel 绑定多个 v-model) -->
<script setup>
// 声明一个名为 'modelValue' 的 prop (对应 v-model="data")
const primaryModel = defineModel();

// 声明一个名为 'foo' 的 prop (对应 v-model:foo="dataFoo")
const fooModel = defineModel('foo');

// 声明一个名为 'bar' 的 prop (对应 v-model:bar="dataBar")
const barModel = defineModel('bar');
</script>

<template>
  <div>
    Primary Input: <input v-model="primaryModel" /><br />
    Foo Input: <input v-model="fooModel" /><br />
    Bar Input: <input v-model="barModel" />
  </div>
</template>
```

**父组件使用：**

```vue
<!-- App.vue -->
<script setup>
import { ref } from 'vue';
import MyMultiInput from './MyMultiInput.vue';

const primaryData = ref('Primary');
const fooData = ref('Foo Value');
const barData = ref('Bar Value');
</script>

<template>
  <MyMultiInput
    v-model="primaryData"
    v-model:foo="fooData"
    v-model:bar="barData"
  />
  <p>Primary: {{ primaryData }}</p>
  <p>Foo: {{ fooData }}</p>
  <p>Bar: {{ barData }}</p>
</template>
```

## 四、`defineModel` 的选项

`defineModel` 宏还可以接收一个对象作为第二个参数，用于配置其行为，这与 `defineProps` 的选项类似。

```typescript
defineModel(
  // 1. model 名称 (可选，默认为 'modelValue')
  //    如果提供字符串，则声明一个带名称的 v-model
  //    如果省略，则声明默认的 v-model
  name?: string,
  // 2. 选项对象 (可选)
  options?: {
    type?: PropType<T>,
    required?: boolean,
    default?: T | (() => T),
    // 更多 defineProps 相同的选项，如 validator
    // ...
  }
): Ref<T | undefined> // 返回一个 ref
```

### 4.1 默认值 (`default`)

当 `v-model` 没有被父组件提供初始值时，可以设置一个默认值。

```vue
<!-- MyInputWithDefault.vue -->
<script setup>
const model = defineModel({ default: 'Default Value' });
</script>

<template>
  <input v-model="model" />
  <p>Current: {{ model }}</p>
</template>
```

**父组件使用 (不传递初始值)：**

```vue
<!-- App.vue -->
<script setup>
import MyInputWithDefault from './MyInputWithDefault.vue';
import { ref } from 'vue';

const customValue = ref('Custom Value');
</script>

<template>
  <h2>With Default Value (No parent v-model initially)</h2>
  <MyInputWithDefault /> 

  <h2>With Parent v-model</h2>
  <MyInputWithDefault v-model="customValue" />
</template>
```

### 4.2 类型验证 (`type`, `required`, `validator`)

可以为 `defineModel` 声明的 prop 添加类型验证和其他 prop 选项。

```vue
<!-- MyValidatedInput.vue -->
<script setup>
const textModel = defineModel('text', {
  type: String,
  required: true,
  validator: (value) => value.length > 0,
});

const numberModel = defineModel('num', {
  type: Number,
  default: 0,
});
</script>

<template>
  <div>
    Text: <input v-model="textModel" type="text" /><br />
    Number: <input v-model="numberModel" type="number" />
  </div>
</template>
```

### 4.3 修饰符 (`modifier`)

`defineModel` 同样支持 `v-model` 的修饰符，如 `.trim`, `.number`, `.lazy`。

**传统方式**：需要通过 `defineProps` 接收 `modelModifiers` 或 `fooModifiers` prop，并手动处理。

**`defineModel` 方式**：`defineModel` 宏返回的 `ref` 会有一个 `.options` 属性，其中包含了修饰符信息。

```vue
<!-- MyTrimmedInput.vue -->
<script setup>
const model = defineModel({ type: String });

// 访问修饰符
// model.options.trim 将会是 true 如果父组件使用了 v-model.trim
console.log('trim modifier:', model.options.trim);

function handleInput(event) {
  let value = event.target.value;
  if (model.options.trim) {
    value = value.trim();
  }
  // 自动触发 update 事件
  model.value = value;
}
</script>

<template>
  <input :value="model" @input="handleInput" />
  <p>Model Value: "{{ model }}" (Trimmed: {{ model.options.trim }})</p>
</template>
```

**父组件使用：**

```vue
<!-- App.vue -->
<script setup>
import { ref } from 'vue';
import MyTrimmedInput from './MyTrimmedInput.vue';

const message = ref(' Hello World ');
</script>

<template>
  <MyTrimmedInput v-model.trim="message" />
  <p>Parent Message: "{{ message }}"</p>
</template>
```

在这个例子中，虽然 `defineModel` 简化了 prop 和 emit 的声明，但修饰符的**实际处理逻辑仍需手动实现**。`defineModel` 只是让修饰符的访问变得更容易。

## 五、只读 (`readonly`) 模式

`defineModel` 返回的 `ref` 默认是可写的。但如果你希望在某些情况下，该 `ref` 是只读的，可以通过 `defineModel` 的第二个参数中的 `readonly` 选项来控制。

```vue
<!-- MyReadonlyInput.vue -->
<script setup>
import { ref } from 'vue';

const readOnlyModel = defineModel('readOnly', {
  type: String,
  readonly: true, // 声明为只读
});

const writableModel = defineModel('writable', {
  type: String,
});

// 尝试修改只读 ref 会发出警告 (在开发模式下)
// readOnlyModel.value = 'New Value'; // 这行代码会触发警告但不会实际更新父组件
</script>

<template>
  <div>
    <p>Readonly Model: {{ readOnlyModel }}</p>
    <input v-model="writableModel" />
  </div>
</template>
```

当 `readonly: true` 时，尝试修改 `defineModel` 返回的 `ref` 的 `.value` 将会在开发模式下发出警告，并且不会触发 `update:xxx` 事件，因此父组件的值也不会被更新。

## 六、与 `defineProps` 和 `defineEmits` 的关系

`defineModel` 可以被看作是 `defineProps` 和 `defineEmits` 的一个更高级别的抽象和语法糖。

例如，`const model = defineModel();` 等价于：

```vue
<script setup>
import { computed } from 'vue';
const props = defineProps({
  modelValue: {} // 可以添加类型、默认值等
});
const emit = defineEmits(['update:modelValue']);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  }
});
</script>
```

**优势：**

*   **更简洁**：大大减少了实现双向绑定的代码量。
*   **更直观**：直接通过一个 `ref` 来操作 `v-model` 的值，符合直觉。
*   **更好的类型推断**：在 TypeScript 项目中，`defineModel` 能提供更好的类型推断。

**注意事项：**

*   `defineModel` 只能在 `<script setup>` 中使用。
*   一个组件可以同时使用 `defineModel` 和 `defineProps`/`defineEmits`，但请确保它们不冲突。例如，不要手动声明一个名为 `modelValue` 的 prop，又使用 `defineModel()`。
*   `defineModel` 声明的 `ref` 会在内部自动管理其状态，**通常不需要像 `ref()` 那样导入**。

## 七、总结

`defineModel` 是 Vue 3 Composition API 中一个非常实用的新功能，它为实现组件的双向绑定 `v-model` 提供了极大的便利。通过将 `modelValue` prop 的接收和 `update:modelValue` 事件的触发抽象为一个简单的 `ref` 对象，它让自定义组件的开发变得更加高效和愉快。对于需要构建可复用、可配置的表单组件或任何需要双向数据流的组件，`defineModel` 都是一个值得推荐的选择。
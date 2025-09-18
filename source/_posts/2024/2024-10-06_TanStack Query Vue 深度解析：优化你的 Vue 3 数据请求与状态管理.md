---
title: TanStack Query Vue 深度解析：优化你的 Vue 3 数据请求与状态管理
date: 2024-10-06 06:24:00
tags:
  - 2024
  - Vue
  - TanStackQuery
  - Nuxt
  - 前端开发
categories:
  - 前端技术
  - Vue
---

> 本文将带你深入了解如何在 Vue 3 项目中高效使用 TanStack Query（前身为 Vue Query 或 React Query），从而告别传统数据请求的烦恼，迎接更优雅、高效、智能的数据管理方式。

{% note info %}
在现代前端应用中，数据请求和状态管理是核心且复杂的任务。传统的 `fetch` 或 `axios` + `useState`/`ref` 组合在处理缓存、刷新、分页、错误重试、乐观更新等方面常常力不从心，导致代码冗余、逻辑复杂、用户体验不佳。`TanStack Query`（以前称作 `Vue Query` 或 `React Query`）应运而生，它提供了一套强大的工具集，旨在解决这些痛点，让数据请求变得像客户端状态管理一样简单而强大。
{% endnote %}

## 一、为什么选择 TanStack Query？

`TanStack Query` 提供了一套在 Vue 3 应用中处理服务器状态（Server State）的强大工具。它与客户端状态（Client State，如 `ref` 或 `reactive`）管理有显著区别，专门针对以下痛点进行了优化：

1.  **数据缓存 (Caching)**：自动管理数据缓存，减少不必要的网络请求，提高应用响应速度。
2.  **数据同步 (Synchronization)**：确保UI始终显示最新数据，支持后台数据更新，实现“Stale-While-Revalidate”策略。
3.  **请求去重 (Deduplication)**：自动合并短时间内相同的请求，避免重复发送。
4.  **后台刷新 (Background Refetching)**：在用户不察觉的情况下，静默地更新旧数据，保持数据新鲜。
5.  **离线支持 (Offline Support)**：优化离线回退和重连后的数据同步。
6.  **错误重试 (Retries)**：内置失败请求的自动重试机制。
7.  **分页与无限滚动 (Pagination & Infinite Scroll)**：简化复杂的数据加载模式。
8.  **乐观更新 (Optimistic Updates)**：提供平滑的用户体验，即时响应用户操作，即使网络请求仍在后台进行。
9.  **Devtools 支持**：强大的调试工具，让你清晰看到数据状态和请求过程。

总之，`TanStack Query` 帮助你将精力集中在业务逻辑上，而不是繁琐的数据管理细节。

## 二、核心概念速览

在使用 `TanStack Query` 之前，理解几个核心概念至关重要：

*   **Query (查询)**：用于**读取**数据。它是 `TanStack Query` 最基本也是最常用的单位。通常对应 `GET` 请求。
    *   **Query Key (查询键)**：一个唯一的数组或字符串，用于标识和缓存 Query。它是 `TanStack Query` 缓存系统的核心。
    *   **Query Function (查询函数)**：一个返回 `Promise` 的函数，负责实际的数据请求。
*   **Mutation (变更)**：用于**创建、更新、删除**数据（即写入操作）。通常对应 `POST`, `PUT`, `DELETE` 请求。
    *   **Callback (回调函数)**：包含 `onMutate`, `onError`, `onSuccess`, `onSettled` 等，用于处理 Mutation 的生命周期，常用于乐观更新。
*   **Query Client (查询客户端)**：`TanStack Query` 的核心实例，管理所有 Query 和 Mutation 的缓存、状态和行为。

## 三、安装与基本配置

首先，我们需要在 Vue 3 项目中安装 `TanStack Query` 的 Vue 版本。

```bash
# 使用 npm
npm install @tanstack/vue-query @tanstack/query-core

# 使用 yarn
yarn add @tanstack/vue-query @tanstack/query-core

# 使用 pnpm
pnpm add @tanstack/vue-query @tanstack/query-core
```

接下来，在你的 Vue 应用入口文件（通常是 `main.js` 或 `main.ts`）中进行配置：

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import {
  VueQueryPlugin,
  QueryClient,
  QueryClientConfig,
} from '@tanstack/vue-query' // 引入VueQueryPlugin和QueryClient

const app = createApp(App)

// 1. 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 全局配置：Query失败时自动重试3次
      retry: 3, 
      // 全局配置：数据在1分钟内保持新鲜，1分钟后变为stale（陈旧），下次请求会触发后台刷新
      staleTime: 1000 * 60,
      // 全局配置：非活跃（无组件使用）的Queries在5分钟后会被垃圾回收
      gcTime: 1000 * 60 * 5, 
    },
    mutations: {
      // 全局配置：Mutation失败时不重试
      retry: false, 
    },
  },
})

// 2. 注册 VueQueryPlugin，并传入 QueryClient 实例
app.use(VueQueryPlugin, {
  queryClient,
  // 可选：启用 Devtools
  // devtools: {
  //   initialIsOpen: false, // 默认不打开
  //   position: 'bottom-right',
  // },
})

app.mount('#app')
```

### ✨ TanStack Query Devtools

强烈推荐安装 `TanStack Query Devtools`。它是一个用于调试 Query 状态、缓存和性能的强大工具。

```bash
npm install @tanstack/query-devtools
# 或 yarn add @tanstack/query-devtools
# 或 pnpm add @tanstack/query-devtools
```

在你的 `main.ts` 或 `App.vue` 中引入并使用：

```typescript
// main.ts (或者根据你的情况，在App.vue中引入)
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { VueQueryDevtools } from '@tanstack/query-devtools'; // 引入 Devtools

const app = createApp(App);
const queryClient = new QueryClient();

app.use(VueQueryPlugin, { queryClient });

// 在开发环境中显示 Devtools
if (import.meta.env.NODE_ENV === 'development') {
  app.component('VueQueryDevtools', VueQueryDevtools);
}

app.mount('#app');
```

然后在你的 `App.vue` 或其他根组件模板中添加：

```vue
<!-- App.vue -->
<template>
  <router-view />
  <template v-if="import.meta.env.NODE_ENV === 'development'">
    <!-- 使用 Devtools 组件 -->
    <VueQueryDevtools :initialIsOpen="false" />
  </template>
</template>
```

这将显示一个可切换的面板，让你洞察所有 Query 的状态，包括数据、错误、加载状态、缓存时间等。

## 四、使用 `useQuery` 进行数据查询

`useQuery` 是 `TanStack Query` 中用于获取服务端数据的核心 Hook。

### 4.1 基本查询示例

```vue
<!-- components/PostsList.vue -->
<template>
  <div>
    <h1>文章列表</h1>
    <p v-if="isLoading">加载中...</p>
    <p v-else-if="isError">加载失败: {{ error.message }}</p>
    <ul v-else>
      <li v-for="post in data" :key="post.id">
        {{ post.title }}
      </li>
    </ul>
    <button @click="refetch" :disabled="isFetching">
      {{ isFetching ? '刷新中...' : '手动刷新' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import axios from 'axios'; // 假设使用axios进行数据请求

interface Post {
  id: number;
  title: string;
  body: string;
}

// 异步查询函数，返回一个Promise
const fetchPosts = async (): Promise<Post[]> => {
  const { data } = await axios.get('https://jsonplaceholder.typicode.com/posts');
  return data;
};

// 使用 useQuery Hook
const {
  data,       // 查询到的数据
  isLoading,  // 第一次加载时为 true
  isFetching, // 只要有任何请求激活就为 true (包括后台静默刷新)
  isError,    // Query 失败时为 true
  error,      // 错误对象
  refetch,    // 手动触发查询刷新
} = useQuery({
  queryKey: ['posts'],    // 唯一的查询键，用于缓存
  queryFn: fetchPosts,    // 查询函数
  // 可选配置，会覆盖全局配置
  staleTime: 1000 * 10,   // 该Query在10秒后变为stale
  gcTime: 1000 * 60 * 30, // 非活跃30分钟后垃圾回收
});
</script>
```

**解析：**

*   `queryKey: ['posts']`：这是这个 Query 的唯一标识符。`TanStack Query` 会使用它来存储、获取和管理缓存。**强烈建议使用数组**，因为你可以通过向数组添加更多元素来创建更精细的 Query Key（例如 `['posts', postId]`）。
*   `queryFn: fetchPosts`：执行数据请求的异步函数，必须返回一个 Promise。
*   `isLoading`：指示查询是否处于首次加载状态（`stale` 且 `fetching`）。
*   `isFetching`：指示查询是否正在进行中（即数据正在从后端获取）。即使数据已存在于缓存中，但在后台刷新时，`isFetching` 也会是 `true`。
*   `refetch`：一个函数，可以手动调用来重新获取数据。

### 4.2 依赖查询键 (Dynamic Query Keys)

Query Key 可以包含动态参数，这对于查询特定资源非常有用。

```vue
<!-- components/PostDetail.vue -->
<template>
  <div>
    <h1>文章详情</h1>
    <input type="number" v-model="selectedPostId" min="1" max="10" />
    <p v-if="isLoading">加载中...</p>
    <p v-else-if="isError">加载失败: {{ error.message }}</p>
    <div v-else-if="data">
      <h2>{{ data.title }}</h2>
      <p>{{ data.body }}</p>
    </div>
    <p v-else>请选择一篇文章 ID (1-10).</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import axios from 'axios';

interface Post {
  id: number;
  title: string;
  body: string;
}

const selectedPostId = ref<number | null>(1); // 默认选中文章1

// 依赖于 selectedPostId 的 Query Key
const postQueryKey = computed(() => {
  return selectedPostId.value ? ['post', selectedPostId.value] : [] // 当selectedPostId为null时，返回空数组
});

// 查询函数，接收 QueryContext 对象，其中包含了 Query Key
const fetchPostById = async (context: any): Promise<Post> => {
  const [, postId] = context.queryKey; // 从 Query Key 中获取 postId
  if (!postId) {
    throw new Error('No postId provided'); // 确保有postId
  }
  const { data } = await axios.get(`https://jsonplaceholder.typicode.com/posts/${postId}`);
  return data;
};

const {
  data,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: postQueryKey,
  queryFn: fetchPostById,
  enabled: computed(() => !!selectedPostId.value), // 只有当 selectedPostId 有值时才启用查询
});
</script>
```

**解析：**

*   `queryKey: ['post', selectedPostId.value]`：当 `selectedPostId.value` 改变时，`TanStack Query` 会识别这是一个新的 Query，并自动触发重新获取数据。
*   `queryFn` 会接收一个上下文对象，其中包含 `queryKey`，你可以在查询函数中解构出动态参数。
*   `enabled: computed(() => !!selectedPostId.value)`：这是一个非常重要的选项。当其值为 `false` 时，查询将停止自动请求数据（但仍可以手动 `refetch`）。这对于有条件地启用查询非常有用，例如等待用户输入。

## 五、使用 `useMutation` 进行数据变更

`useMutation` 是 `TanStack Query` 中用于创建、更新或删除服务端数据的 Hook。

### 5.1 基本变更示例

```vue
<!-- components/CreatePost.vue -->
<template>
  <div>
    <h1>创建新文章</h1>
    <form @submit.prevent="handleSubmit">
      <input type="text" v-model="newPostTitle" placeholder="文章标题" required />
      <textarea v-model="newPostBody" placeholder="文章内容" required></textarea>
      <button type="submit" :disabled="isPending">
        {{ isPending ? '提交中...' : '提交' }}
      </button>
    </form>
    <p v-if="isError">创建失败: {{ error.message }}</p>
    <p v-if="isSuccess">创建成功! 文章ID: {{ data?.id }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import axios from 'axios';

interface NewPost {
  title: string;
  body: string;
  userId: number;
}

interface CreatedPost extends NewPost {
  id: number;
}

const newPostTitle = ref('');
const newPostBody = ref('');

// 获取 QueryClient 实例，用于手动更新缓存
const queryClient = useQueryClient();

// 异步创建函数
const createPost = async (post: NewPost): Promise<CreatedPost> => {
  const { data } = await axios.post(
    'https://jsonplaceholder.typicode.com/posts',
    post
  );
  return data;
};

// 使用 useMutation Hook
const {
  mutate,     // 触发 Mutation 的函数
  data,       // Mutation 成功后的返回数据
  isPending,  // Mutation 是否正在进行中
  isSuccess,  // Mutation 是否成功
  isError,    // Mutation 是否失败
  error,      // 错误对象
} = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    console.log('文章创建成功，正在刷新文章列表缓存...');
    // Invalidate 和 Refetch：使 'posts' 查询的数据失效，并触发后台重新获取
    queryClient.invalidateQueries({ queryKey: ['posts'] }); 
    // 或者直接刷新 'posts' query, 但 invalidateQueries 带有智能的缓存管理
    // queryClient.refetchQueries({ queryKey: ['posts'] });
  },
  onError: (err) => {
    console.error('创建文章失败:', err);
  },
});

const handleSubmit = () => {
  mutate({
    title: newPostTitle.value,
    body: newPostBody.value,
    userId: 1, // 示例
  });
  newPostTitle.value = '';
  newPostBody.value = '';
};
</script>
```

**解析：**

*   `mutationFn: createPost`：执行数据变更的异步函数。
*   `mutate(variables)`：这是你调用 Mutation 的函数。`variables` 是传递给 `mutationFn` 的参数。
*   `onSuccess`：Mutation 成功后执行的回调。在这里，我们通常会**使相关的 Query 失效 (invalidate)**，从而触发这些 Query 在后台重新获取最新数据，确保 UI 显示的是最新状态。
    *   `queryClient.invalidateQueries({ queryKey: ['posts'] })`：告诉 `TanStack Query`，所有 Query Key 包含 `['posts']` 的 Query 都已过期。下次这些 Query 被渲染时，`TanStack Query` 会自动在后台重新请求数据。

### 5.2 乐观更新 (Optimistic Updates)

乐观更新是 `useMutation` 的一个高级且强大的特性，它能在网络请求还未响应时，就立即更新 UI，给用户流畅的体验。如果请求失败，再回滚 UI。

```vue
<!-- components/ToggleTodo.vue -->
<template>
  <div>
    <h2>待办事项列表</h2>
    <p v-if="todosQuery.isLoading">加载中...</p>
    <p v-else-if="todosQuery.isError">加载失败: {{ todosQuery.error.message }}</p>
    <ul v-else>
      <li v-for="todo in todosQuery.data" :key="todo.id">
        <label>
          <input
            type="checkbox"
            :checked="todo.completed"
            @change="toggleTodoMutation.mutate({ id: todo.id, completed: !todo.completed })"
            :disabled="toggleTodoMutation.isPending || (toggleTodoMutation.variables?.id === todo.id)"
          />
          <span :class="{ 'line-through': todo.completed }">{{ todo.title }}</span>
        </label>
        <span v-if="toggleTodoMutation.variables?.id === todo.id && toggleTodoMutation.isPending">
          (更新中...)
        </span>
      </li>
    </ul>
    <p v-if="toggleTodoMutation.isError">更新失败: {{ toggleTodoMutation.error?.message }}</p>
  </div>
</template>

<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import axios from 'axios';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

// 1. 获取所有待办事项的 Query
const todosQuery = useQuery({
  queryKey: ['todos'],
  queryFn: async (): Promise<Todo[]> => {
    const { data } = await axios.get('https://jsonplaceholder.typicode.com/todos?_limit=5');
    return data;
  },
});

const queryClient = useQueryClient();

// 2. 更新单个待办事项状态的 Mutation
const toggleTodoMutation = useMutation<
  Todo, // 返回的数据类型
  Error, // 错误类型
  { id: number; completed: boolean }, // 传入 mutate 的变量类型
  { previousTodos: Todo[] | undefined } // onMutate 返回的上下文类型
>({
  mutationFn: async ({ id, completed }) => {
    // 模拟网络延迟和可能的失败
    if (Math.random() < 0.2) { // 20%的几率失败
      await new Promise(resolve => setTimeout(resolve, 1000));
      throw new Error(`模拟网络错误，更新待办事项 ${id} 失败`);
    }

    const { data } = await axios.put(`https://jsonplaceholder.typicode.com/todos/${id}`, { completed });
    return data;
  },
  // 🎉 onMutate 阶段：在 mutation 发生前触发，用于乐观更新
  onMutate: async newTodoStatus => {
    // 1. 取消任何正在进行的 'todos' Query，以确保不会覆盖乐观更新
    await queryClient.cancelQueries({ queryKey: ['todos'] });

    // 2. 获取当前 'todos' Query 的缓存快照，用于回滚
    const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

    // 3. 乐观更新 'todos' 缓存
    queryClient.setQueryData<Todo[]>(['todos'], oldTodos => {
      return oldTodos
        ? oldTodos.map(todo =>
            todo.id === newTodoStatus.id
              ? { ...todo, completed: newTodoStatus.completed }
              : todo
          )
        : [];
    });

    // 返回一个包含旧数据的上下文，供 onError 使用
    return { previousTodos };
  },
  // ✅ onSuccess 阶段：mutation 成功后触发
  onSuccess: (data) => {
    console.log('乐观更新成功，服务器返回:', data);
    // 可选：成功后也可以使 'todos' 失效，确保最终数据一致（虽然乐观更新已经做了）
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
  // ❌ onError 阶段：mutation 失败后触发，用于回滚
  onError: (err, newTodoStatus, context) => {
    console.error('乐观更新失败，正在回滚:', err);
    // 回滚到 onMutate 提供的旧数据
    if (context?.previousTodos) {
      queryClient.setQueryData<Todo[]>(['todos'], context.previousTodos);
    }
  },
  // 🔚 onSettled 阶段：mutation 成功或失败都会触发
  onSettled: (data, error, newTodoStatus) => {
    console.log('Mutation 完成，无论是成功还是失败。');
    // 确保 'todos' Query 最终被刷新，获取最新数据（清除所有乐观更新可能带来的不一致）
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
</script>

<style scoped>
.line-through {
  text-decoration: line-through;
}
</style>
```

**解析：**

*   **`onMutate`**：在 `mutationFn` 实际执行前触发。这是进行乐观更新的最佳时机。
    *   `queryClient.cancelQueries()`：重要！取消任何正在进行的、可能会覆盖你乐观更新的 Query。
    *   `queryClient.getQueryData()`：获取当前 Query 缓存的快照。
    *   `queryClient.setQueryData()`：立即更新缓存中的数据，UI 随即更新。
    *   返回一个对象作为 `context`，这个 `context` 会被传递给 `onError` 和 `onSettled`，以便在失败时回滚。
*   **`onSuccess`**：请求成功后触发。此时可以 `invalidateQueries` 再次确认数据新鲜度。
*   **`onError`**：请求失败后触发。利用 `context` 中的 `previousTodos` 回滚 UI 到请求前的状态。
*   **`onSettled`**：无论成功或失败都会触发。这里通常会 `invalidateQueries`，确保最终的数据一致性，尤其是在 `onMutate` 中取消了请求的情况下。

通过乐观更新，用户操作后几乎能立即看到结果，即使网络有延迟，也大大提升了用户体验。

## 六、更多高级特性

### 6.1 `useQueries`：并行查询多个 Query

当你有多个独立的 Query 需要在同一组件中发起时，`useQueries` 允许你并行执行它们，并统一管理它们的状态。

```vue
<!-- components/MultipleDataFetch.vue -->
<template>
  <div>
    <h1>多数据并行获取</h1>
    <div v-if="isLoadingAny">
      <p>正在加载所有数据...</p>
    </div>
    <div v-else>
      <h2>用户信息</h2>
      <p v-if="userQuery.isError">用户加载失败: {{ userQuery.error.message }}</p>
      <div v-else-if="userQuery.data">
        <p>Name: {{ userQuery.data.name }}</p>
        <p>Email: {{ userQuery.data.email }}</p>
      </div>

      <h2>文章列表</h2>
      <p v-if="postsQuery.isError">文章加载失败: {{ postsQuery.error.message }}</p>
      <ul v-else-if="postsQuery.data">
        <li v-for="post in postsQuery.data" :key="post.id">{{ post.title }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQueries } from '@tanstack/vue-query';
import axios from 'axios';
import { computed } from 'vue';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
}

const fetchUser = async (): Promise<User> => {
  const { data } = await axios.get('https://jsonplaceholder.typicode.com/users/1');
  return data;
};

const fetchPosts = async (): Promise<Post[]> => {
  const { data } = await axios.get('https://jsonplaceholder.typicode.com/posts?_limit=3');
  return data;
};

// 使用 useQueries，传入一个 QueryOptions 数组
const results = useQueries({
  queries: [
    {
      queryKey: ['user', 1],
      queryFn: fetchUser,
      staleTime: 1000 * 60 * 5,
    },
    {
      queryKey: ['posts'],
      queryFn: fetchPosts,
      staleTime: 1000 * 60 * 1,
    },
  ],
});

// 计算所有查询的加载状态
const isLoadingAny = computed(() => results.some(q => q.isLoading.value)); // 注意这里的.value

// 解构获取每个查询的结果
const userQuery = computed(() => results[0]);
const postsQuery = computed(() => results[1]);
</script>
```

**解析：**

*   `useQueries` 接收一个 `queries` 数组，每个元素都是一个标准的 `QueryOptions` 对象。
*   它返回一个结果数组，每个元素对应一个 Query 的状态和数据。
*   你可以遍历 `results` 来检查总体状态，或者通过索引访问单个 Query 的详细信息。

### 6.2 `useInfiniteQuery`：实现无限滚动与分页

`useInfiniteQuery` 是为了处理“加载更多”或无限滚动（infinite scroll）场景而设计的，它能够管理多个页面（或批次）的数据。

```vue
<!-- components/InfiniteScrollPosts.vue -->
<template>
  <div>
    <h1>无限滚动文章</h1>
    <div v-if="isLoading">加载中...</div>
    <div v-else-if="isError">加载失败: {{ error?.message }}</div>
    <ul v-else>
      <li v-for="page in data?.pages" :key="page.nextCursor">
        <div v-for="post in page.data" :key="post.id">
          <h3>{{ post.title }}</h3>
          <p>{{ post.body }}</p>
          <hr />
        </div>
      </li>
    </ul>
    <button
      @click="fetchNextPage"
      :disabled="!hasNextPage || isFetchingNextPage"
      v-if="hasNextPage"
    >
      {{ isFetchingNextPage ? '加载更多...' : '加载更多' }}
    </button>
    <p v-else-if="!isLoading">没有更多文章了。</p>
  </div>
</template>

<script setup lang="ts">
import { useInfiniteQuery } from '@tanstack/vue-query';
import axios from 'axios';

interface Post {
  id: number;
  title: string;
  body: string;
}

interface PostsPage {
  data: Post[];
  nextCursor?: number; // 下一页的起始ID
}

// 查询函数，接收 pageParam 作为当前页面的“锚点”
const fetchPostsInfinite = async ({ pageParam = 1 }): Promise<PostsPage> => {
  const limit = 5;
  const start = (pageParam - 1) * limit; // 根据页码计算起始索引
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/posts?_start=${start}&_limit=${limit}`
  );

  const nextCursor = data.length === limit ? pageParam + 1 : undefined; // 如果返回的数据量等于limit，则可能还有下一页

  return {
    data,
    nextCursor,
  };
};

const {
  data,          // 包含 pages 数组，每个元素是 fetchPostsInfinite 的返回值
  fetchNextPage, // 用于加载下一页的函数
  hasNextPage,   // 是否还有下一页
  isFetchingNextPage, // 是否正在加载下一页
  isLoading,
  isError,
  error,
} = useInfiniteQuery({
  queryKey: ['infinitePosts'],
  queryFn: fetchPostsInfinite,
  initialPageParam: 1, // 初始页码参数
  // 获取下一页参数的逻辑
  getNextPageParam: (lastPage: PostsPage, allPages: PostsPage[]) => {
    return lastPage.nextCursor; // 使用从服务器返回的nextCursor作为下一页的pageParam
  },
  staleTime: 1000 * 60,
});
</script>
```

**解析：**

*   `queryFn` 接收一个包含 `pageParam` 的对象，`pageParam` 就是你用来请求下一页数据的参数（例如页码、偏移量、ID等）。
*   `initialPageParam`：设置第一个 `pageParam` 的值。
*   `getNextPageParam`：一个函数，接收上一页的数据和所有已加载的页面数据，并返回用于请求下一页的 `pageParam`。如果返回 `undefined` 或 `null`，则 `hasNextPage` 为 `false`。
*   `data.pages`：`useInfiniteQuery` 返回的数据结构。它是一个数组，每个元素都是 `queryFn` 返回的一个“页面”数据。在模板中，你需要遍历 `data.pages`，然后再遍历每个页面中的实际数据。
*   `fetchNextPage`：调用此函数来加载下一页数据。
*   `hasNextPage`：指示是否还有更多页面可以加载。
*   `isFetchingNextPage`：指示是否正在加载下一页数据。

## 七、与 Nuxt 3 (SSR) 结合使用

`TanStack Query` 对 SSR（Server-Side Rendering，服务器端渲染）友好，特别是在 Nuxt 3 这样的框架中，可以实现数据的预取（Prefetch）和水合（Hydration）。

### 7.1 Nuxt 3 配置

在你的 Nuxt 3 项目中，创建一个插件文件（例如 `plugins/vue-query.ts`）：

```typescript
// plugins/vue-query.ts
import { VueQueryPlugin, QueryClient, hydrate, dehydrate } from '@tanstack/vue-query'
import type { DehydratedState } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // 在 SSR 模式下，第一次请求的数据是预取的（pre-fetched）
        // 确保在客户端数据水合后，不会立即后台刷新
        staleTime: 1000 * 60, // 数据在 1 分钟内保持 fresh
      },
    },
  })

  // 在 Nuxt 服务器端渲染时
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

  // Nuxt 3 的 app:rendered 钩子，用于在服务器端渲染完成后脱水（dehydrate）
  // 并在客户端水合（hydrate）脱水状态
  if (process.server) {
    nuxtApp.hook('app:rendered', () => {
      // 在服务器端渲染完成后，将 QueryClient 的状态脱水
      nuxtApp.payload.vueQueryState = dehydrate(queryClient)
    })
  }

  // 在客户端水合脱水的状态
  if (process.client) {
    nuxtApp.hook('app:created', () => {
      // 在客户端创建应用时，用水合（hydrate）服务器端脱水（dehydrate）的状态
      hydrate(queryClient, nuxtApp.payload.vueQueryState)
    })
  }

  return {
    provide: {
      queryClient, // 可以通过 #useNuxtApp().$queryClient 访问
    },
  }
})
```

### 7.2 Nuxt 页面中的预取示例

在 Nuxt 页面组件中，你可以使用 `useAsyncData` 或 `defineNuxtComponent` 结合 `TanStack Query` 来预取数据。

```vue
<!-- pages/posts/[id].vue -->
<template>
  <div>
    <h1>文章详情 {{ $route.params.id }}</h1>
    <div v-if="isLoading">Loading Post...</div>
    <div v-else-if="isError">Error: {{ error?.message }}</div>
    <div v-else-if="data">
      <h2>{{ data.title }}</h2>
      <p>{{ data.body }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import axios from 'axios';

interface Post {
  id: number;
  title: string;
  body: string;
}

const route = useRoute();
const postId = computed(() => Number(route.params.id));

const fetchPostById = async (context: any): Promise<Post> => {
  const [, id] = context.queryKey;
  if (!id) {
    throw new Error('Post ID is missing');
  }
  const { data } = await axios.get(`https://jsonplaceholder.typicode.com/posts/${id}`);
  return data;
};

// 在 Nuxt 3 中，可以使用 useAsyncData 来预取数据
// 但直接使用 useQuery 更符合 TanStack Query 的水合机制
const queryClient = useQueryClient(); // 获取 QueryClient 实例

// 预热缓存（Prefetch）：在服务器端预先获取数据并填充缓存
if (process.server) {
  await queryClient.prefetchQuery({
    queryKey: ['post', postId.value],
    queryFn: fetchPostById,
  });
}

const { data, isLoading, isError, error } = useQuery({
  queryKey: ['post', postId], // postId 应该是响应式的ref/computed
  queryFn: fetchPostById,
  initialData: computed(() => queryClient.getQueryData(['post', postId.value])), // 从SSR缓存中取初始数据
  initialDataUpdatedAt: computed(() => queryClient.getQueryState(['post', postId.value])?.dataUpdatedAt),
  staleTime: 1000 * 60, // 重要：在客户端加载后，这个数据在1分钟内不会被后台刷新
  enabled: computed(() => !!postId.value),
});


</script>
```

**解析：**

*   `defineNuxtPlugin` 中配置 `VueQueryPlugin`，并在服务器端 `dehydrate` 状态，客户端 `hydrate` 状态。
*   在页面组件中，通过 `process.server` 判断是否是服务器端，如果是，则使用 `queryClient.prefetchQuery` 提前加载数据。
*   `initialData` 和 `initialDataUpdatedAt`：这两个选项是实现水合的关键。它们告诉 `useQuery` 从哪里获取初始数据以及这个数据是什么时候生成的。在客户端，`TanStack Query` 会优先使用这些预取的数据，而不是重新发起请求。
*   `staleTime`：在 SSR 场景下尤为重要。它定义了数据在客户端加载后，多久之后会变为 `stale`。设置一个合适的 `staleTime` 可以避免在客户端立即触发额外的后台刷新，从而提高性能和用户体验。

## 八、最佳实践与注意事项

1.  **统一 Query Key 命名规范**：始终使用数组作为 `queryKey`，并保持一致的命名模式（例如 `['entityType', id, 'subResource']`）。
2.  **`queryFn` 纯净性**：`queryFn` 应该是一个纯函数，只负责数据请求，不应包含副作用。
3.  **`staleTime` 与 `gcTime`**：理解并合理配置这两个全局及局部选项。
    *   `staleTime`：数据变为“陈旧”的时间。在此时间内，即使 Query 被重新渲染，也不会触发后台刷新。
    *   `gcTime`：“垃圾回收”时间。Query 在变为非活跃（没有组件订阅）后的保留时间。超过此时间会被从缓存中移除。
4.  **错误处理**：全局 `QueryClient` 可以在 `defaultOptions.queries.onError` 或 `defaultOptions.mutations.onError` 中设置统一的错误处理逻辑，如弹出通知。
5.  **懒加载与 `enabled` 选项**：对于依赖参数的 Query，使用 `enabled` 选项来控制何时发起请求，避免不必要的请求。
6.  **`QueryClient` 的手动操作**：熟练使用 `queryClient.invalidateQueries()`、`queryClient.setQueryData()` 等方法进行缓存的精确控制。
7.  **避免在 `queryFn` 中抛出非 `Error` 对象**：确保 `queryFn` 在失败时抛出 `Error` 类的对象，这样 `TanStack Query` 可以更好地处理它。
8.  **Devtools 辅助调试**：充分利用 `TanStack Query Devtools` 来观察、理解和调试你的数据流。

## 九、总结

`TanStack Query` 是一个革命性的工具，它极大地改变了前端开发者处理服务器数据的方式。通过自动化缓存、后台刷新、错误重试和乐观更新等复杂逻辑，它让开发者能够将更多精力投入到构建出色的用户界面和业务功能上。

在 Vue 3 项目中，结合 `useQuery`、`useMutation` 及其高级特性，你不仅能够获得更简洁、可维护的代码，还能显著提升应用的用户体验和性能。如果你正在寻求一种更智能、更高效的数据请求和状态管理方案，那么 `TanStack Query` 绝对值得你深入学习和实践。

告别手动管理 loading、error、data 状态和繁琐的缓存逻辑吧，拥抱 `TanStack Query` 带来的便利与强大！

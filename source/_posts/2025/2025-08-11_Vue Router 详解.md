---
title: Vue Router 详解
date: 2025-08-11 06:24:00
tags:
  - 2025
  - Vue
  - 前端技术
  - JavaScript
categories:
  - 前端技术
  - Vue
---

> **Vue Router** 是 Vue.js 官方的路由管理器。它与 Vue.js 深度集成，用于构建单页应用（SPA）。通过 Vue Router，开发者可以轻松地将组件与 URL 路径映射起来，实现无刷新页面切换、参数传递、导航守卫等功能，从而为用户提供流畅的导航体验。

{% note info %}
核心思想：
-   **组件化路由**：Vue 路由的配置与 Vue 组件紧密结合，将不同的 URL 路径映射到相应的组件。
-   **声明式导航**：通过 `<router-link>` 组件实现导航，而非传统 `<a>` 标签引起页面刷新。
-   **编程式导航**：提供 `router.push()`、`router.replace()` 等方法，通过 JavaScript 控制路由跳转。
-   **导航守卫**：提供全局、路由独享和组件内的生命周期钩子，用于在导航前后执行逻辑（如权限验证、数据预加载）。
-   **两种路由模式**：支持 Hash 模式和 History 模式，满足不同部署需求。
{% endnote %}

------

## 一、为什么需要 Vue Router？

在传统的 Web 应用中，每次页面跳转都会向服务器发送请求，导致整个页面重新加载。这在用户体验和性能上都存在瓶颈。单页应用 (Single Page Application, SPA) 旨在解决这些问题，通过在浏览器端仅加载一次 HTML、CSS 和 JavaScript 资源，然后通过 JavaScript 动态地更新页面内容，模拟多页应用的用户体验。

要实现 SPA，核心在于**客户端路由**。它负责：

1.  **URL 与组件的映射**：根据 URL 路径显示不同的页面组件。
2.  **管理浏览器历史记录**：在不刷新页面的情况下，改变 URL 并使用浏览器的前进/后退功能。
3.  **参数传递**：从 URL 或通过编程方式向组件传递数据。
4.  **导航控制**：在路由跳转前后进行权限验证、数据预加载等操作。

Vue Router 正是为 Vue.js 应用提供这些功能的官方解决方案。它与 Vue.js 的响应式系统、组件系统深度结合，让构建复杂的 SPA 变得简单而高效。

## 二、安装与基本使用

### 2.1 安装 Vue Router

在你的 Vue 项目中，使用 npm 或 yarn 进行安装：

```bash
npm install vue-router@next # 对于 Vue 3
# 或者
yarn add vue-router@next # 对于 Vue 3

# 对于 Vue 2 项目：
# npm install vue-router
# yarn add vue-router
```

本文主要以 Vue Router 4 (对应 Vue 3) 为例进行讲解。

### 2.2 基本配置与使用

1.  **创建路由实例**：

    首先，创建一个 `router` 实例，并定义你的路由规则。通常在一个单独的文件（如 `src/router/index.js`）中进行配置。

    ```javascript
    // src/router/index.js
    import { createRouter, createWebHistory } from 'vue-router'
    import HomeView from '../views/HomeView.vue'
    import AboutView from '../views/AboutView.vue'

    const routes = [
      {
        path: '/',
        name: 'home',
        component: HomeView
      },
      {
        path: '/about',
        name: 'about',
        // 懒加载模式，访问该路由时才加载组件，优化性能
        component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
      },
      {
        path: '/user/:id', // 动态路由匹配，:id 是一个路由参数
        name: 'user',
        component: () => import('../views/UserView.vue'),
        props: true // 将路由参数作为 props 传递给组件
      }
    ]

    const router = createRouter({
      history: createWebHistory(), // 使用 History 模式 (推荐用于生产环境)
      // history: createWebHashHistory(), // 或者使用 Hash 模式
      routes
    })

    export default router
    ```

2.  **在 Vue 应用中注册路由**：

    将创建的 `router` 实例注册到你的 Vue 应用中。

    ```javascript
    // src/main.js
    import { createApp } from 'vue'
    import App from './App.vue'
    import router from './router' // 引入路由实例

    createApp(App).use(router).mount('#app')
    ```

3.  **在组件中使用 `<router-view>` 和 `<router-link>`**：

    *   **`<router-view>`**：用于渲染匹配到的路由组件。它类似于一个占位符，不同的路由路径会渲染不同的组件到这个位置。
    *   **`<router-link>`**：用于在应用中进行导航。它会被渲染为 `<a>` 标签，但会阻止其默认行为，通过 Vue Router 进行导航，避免页面刷新。

    ```vue
    <!-- src/App.vue -->
    <template>
      <div id="app">
        <nav>
          <router-link to="/">Home</router-link> |
          <router-link to="/about">About</router-link> |
          <router-link to="/user/123">User 123</router-link>
        </nav>
        <router-view></router-view>
      </div>
    </template>

    <script>
    export default {
      name: 'App'
    }
    </script>

    <style>
    /* 可以在这里添加一些样式 */
    </style>
    ```

    ```vue
    <!-- src/views/HomeView.vue -->
    <template>
      <div>
        <h1>Home Page</h1>
        <p>Welcome to the home page!</p>
      </div>
    </template>

    <script>
    export default {
      name: 'HomeView'
    }
    </script>
    ```

    ```vue
    <!-- src/views/UserView.vue -->
    <template>
      <div>
        <h1>User Profile</h1>
        <p>User ID: {{ userId }}</p>
      </div>
    </template>

    <script>
    export default {
      name: 'UserView',
      props: ['id'], // 接收来自路由参数的 prop 'id'
      computed: {
        userId() {
          return this.id || this.$route.params.id; // prefer prop, fallback to $route.params
        }
      }
      // 或者在 setup 中使用 useRoute
      // setup(props) {
      //   const route = useRoute();
      //   const userId = computed(() => props.id || route.params.id);
      //   return { userId };
      // }
    }
    </script>
    ```

## 三、路由模式

Vue Router 提供了两种基本的路由模式：Hash 模式和 History 模式。

### 3.1 Hash 模式 (`createWebHashHistory()`)

*   **工作原理**：利用 URL 中的 `hash` (形如 `#/path/to/page`) 部分来模拟完整的 URL 路径。当 hash 值改变时，浏览器不会重新加载页面，而是触发 `hashchange` 事件。
*   **优点**：
    *   **无需服务器配置**：所有页面都基于 `#` 后的路径进行切换，服务器始终只返回 `index.html`。
    *   **兼容性好**：适用于所有浏览器，包括旧版浏览器。
*   **缺点**：
    *   **URL 不美观**：带有 `#` 符号的 URL 在用户看来不够友好。
    *   **SEO 不佳**：搜索引擎通常不会索引 `hash` 部分的内容。

### 3.2 History 模式 (`createWebHistory()`)

*   **工作原理**：利用 HTML5 History API 的 `pushState()` 和 `replaceState()` 方法来改变 URL，而无需重新加载页面。这使得 URL 看起来像传统的服务器路由路径，没有 `#` 符号。
*   **优点**：
    *   **URL 美观**：与传统 Web 应用的 URL 完全一致。
    *   **SEO 友好**：搜索引擎可以更好地索引这些 URL。
*   **缺点**：
    *   **需要服务器配置**：当用户直接访问一个 History 模式的 URL（例如 `example.com/about`）或刷新页面时，浏览器会向服务器发出请求。如果服务器不知道如何处理这个 URL，就会返回 404 错误。因此，服务器需要配置一个“回退路由”，将所有非静态资源请求都重定向到应用的 `index.html`。
        *   **Nginx 示例配置**：
            ```nginx
            server {
              listen 80;
              server_name yourdomain.com;

              root /path/to/your/dist;
              index index.html;

              location / {
                try_files $uri $uri/ /index.html;
              }
            }
            ```
        *   **Apache 示例配置**：
            在项目的 `public` (或 `dist`) 目录下创建 `.htaccess` 文件：
            ```apache
            <IfModule mod_rewrite.c>
              RewriteEngine On
              RewriteBase /
              RewriteRule ^index\.html$ - [L]
              RewriteCond %{REQUEST_FILENAME} !-f
              RewriteCond %{REQUEST_FILENAME} !-d
              RewriteRule . /index.html [L]
            </IfModule>
            ```

## 四、动态路由匹配与参数传递

### 4.1 动态路由 (`path: '/user/:id'`)

在路由配置中，可以使用冒号 `:` 来定义动态片段。例如 `/user/:id` 会匹配 `/user/123`、`/user/abc` 等。`:id` 就是一个路由参数。

### 4.2 访问路由参数

1.  ** `$route.params`**：在任何组件中，可以通过 `this.$route.params` (在选项式 API 中) 或 `route.params` (在组合式 API 中，通过 `useRoute()` 获取 `route` 对象) 来访问当前路由的所有参数。
    ```javascript
    // 在UserView.vue中
    export default {
      created() {
        console.log(this.$route.params.id); // 访问 :id 参数
      }
    }
    ```

2.  **`props` 选项**：在路由配置中设置 `props: true`，可以将路由参数作为组件的 props 传递。这有助于组件与路由解耦，使组件更通用。
    ```javascript
    // router/index.js
    {
      path: '/user/:id',
      component: UserView,
      props: true // 将 :id 作为 prop 传递给 UserView
    }

    // UserView.vue
    <script>
    export default {
      props: ['id'] // 在组件中声明接收 id prop
    }
    </script>
    ```
    `props` 也可以是一个对象（静态值）、一个函数（动态返回值）或者一个包含 `$route` 属性的布尔值（`true`）。

## 五、嵌套路由

通过嵌套路由可以构建更复杂的 UI 结构。一个 `router-view` 内部还可以包含另一个 `router-view`。

```javascript
// router/index.js
const routes = [
  {
    path: '/user/:id',
    component: UserView,
    children: [ // 定义 UserView 的子路由
      {
        path: '', // 默认子路由，匹配 /user/123
        component: UserProfile,
        name: 'user-profile'
      },
      {
        path: 'posts', // 匹配 /user/123/posts
        component: UserPosts,
        name: 'user-posts'
      }
    ]
  }
]
```

```vue
<!-- UserView.vue -->
<template>
  <div>
    <h2>User ID: {{ $route.params.id }}</h2>
    <router-link :to="{ name: 'user-profile', params: { id: $route.params.id }}">Profile</router-link> |
    <router-link :to="{ name: 'user-posts', params: { id: $route.params.id }}">Posts</router-link>
    <router-view></router-view> <!-- 子路由组件会渲染在这里 -->
  </div>
</template>
```

## 六、命名路由与命名视图

### 6.1 命名路由

通过给路由**配置 `name` 属性**，可以为路由定义一个名称。这使得在导航时可以通过名称引用路由，而不是硬编码 URL 路径，使得路由跳转更具可维护性。

```javascript
// router/index.js (片段)
{
  path: '/user/:id',
  name: 'user', // 定义命名路由
  component: UserView
}
```

```vue
<!-- 导航到命名路由 -->
<router-link :to="{ name: 'user', params: { id: 123 }}">Go to User 123</router-link>

<!-- 编程式导航 -->
router.push({ name: 'user', params: { id: 456 } });
```

### 6.2 命名视图

有时，你可能需要同时显示多个视图，而不是嵌套显示。例如，一个布局可能有一个侧边栏和一个主内容区域，并且这两个区域都由路由控制。这时可以使用命名视图。

```javascript
// router/index.js (片段)
{
  path: '/',
  components: { // 使用 components (注意是复数) 来定义命名视图
    default: HomeView,         // 对应默认的 <router-view>
    sidebar: SidebarComponent, // 对应 <router-view name="sidebar">
    footer: FooterComponent    // 对应 <router-view name="footer">
  }
}
```

```vue
<!-- App.vue (片段) -->
<template>
  <div>
    <router-view></router-view>             <!-- 渲染 HomeView -->
    <router-view name="sidebar"></router-view> <!-- 渲染 SidebarComponent -->
    <router-view name="footer"></router-view>   <!-- 渲染 FooterComponent -->
  </div>
</template>
```

## 七、编程式导航

除了 `<router-link>` 进行声明式导航，Vue Router 也提供了编程式导航方法，通过 `router` 实例来控制路由跳转。

在 Vue 3 中，可以通过 `useRouter()` 组合式函数获取 `router` 实例。

```javascript
import { useRouter } from 'vue-router';

export default {
  setup() {
    const router = useRouter();

    const goToAbout = () => {
      router.push('/about'); // 跳转到 /about 路径
    };

    const goToUser = (userId) => {
      // 通过命名路由跳转，并传递参数
      router.push({ name: 'user', params: { id: userId } });
    };

    const replaceCurrentRoute = () => {
      // 替换当前路由，不会在历史记录中添加新条目
      router.replace({ path: '/new-path' });
    };

    const goBack = () => {
      // 回退一步
      router.go(-1); // 或者 router.back()
    };

    return {
      goToAbout,
      goToUser,
      replaceCurrentRoute,
      goBack,
    };
  },
  methods: { // 选项式 API
    goToAboutMethod() {
      this.$router.push('/about');
    }
  }
};
```

*   **`router.push(location)`**：向历史记录堆栈添加新的路由条目。
    *   `location` 可以是字符串路径 (`'/home'`) 或包含 `path`/`name`/`params`/`query` 的对象。
*   **`router.replace(location)`**：替换当前历史记录条目，不会添加新条目。
*   **`router.go(n)`**：在历史记录中前进或后退 `n` 步。
*   **`router.back()`**：等价于 `router.go(-1)`。
*   **`router.forward()`**：等价于 `router.go(1)`。

## 八、导航守卫 (Navigation Guards)

导航守卫是 Vue Router 提供的用于在路由导航过程中进行拦截、处理和控制的钩子。它们常用于权限验证、登录状态检查、数据预加载等场景。

导航守卫的执行顺序如下：

1.  **全局前置守卫**：`router.beforeEach()`
2.  **路由独享的守卫**：`beforeEnter` (在路由配置中定义)
3.  **组件内守卫**：
    *   `beforeRouteEnter` (在组件创建前)
    *   `beforeRouteUpdate` (路由参数变化，组件复用时)
    *   `beforeRouteLeave` (离开当前组件前)
4.  **全局解析守卫**：`router.beforeResolve()`
5.  **全局后置守卫**：`router.afterEach()`

所有这些守卫函数都接收三个参数：
*   **`to`**：目标路由对象，即将进入的路由信息。
*   **`from`**：当前路由对象，即将离开的路由信息。
*   **`next`**：一个函数，必须调用它才能继续导航。
    *   `next()`: 放行。
    *   `next(false)`: 中断当前导航。
    *   `next('/')` 或 `next({ path: '/' })`: 跳转到一个新的地址。
    *   `next(error)`: 导航失败，且错误被传递到 `router.onError()` 侦听器。

### 8.1 全局前置守卫 (`router.beforeEach`)

在每次导航开始时触发。

```javascript
// router/index.js
router.beforeEach((to, from, next) => {
  console.log('全局前置守卫：', from.path, '->', to.path);
  const isAuthenticated = false; // 假设用户未登录

  if (to.meta.requiresAuth && !isAuthenticated) {
    // 如果路由需要权限，但用户未登录，则重定向到登录页
    console.log('未登录，重定向到登录页');
    next('/login');
  } else {
    next(); // 否则放行
  }
});```
路由配置可以加上 `meta` 字段来标记权限：
```javascript
{
  path: '/dashboard',
  component: DashboardView,
  meta: { requiresAuth: true } // 需要登录的路由
}
```

### 8.2 路由独享的守卫 (`beforeEnter`)

在路由配置中直接定义，只对该路由生效。

```javascript
// router/index.js
{
  path: '/admin',
  component: AdminView,
  beforeEnter: (to, from, next) => {
    // 只有当用户是管理员时才允许进入
    const isAdmin = true; // 假设已是管理员
    if (isAdmin) {
      next();
    } else {
      console.log('非管理员，阻止进入');
      next(false);
    }
  }
}
```

### 8.3 组件内守卫

定义在 Vue 组件内部。

*   **`beforeRouteEnter(to, from, next)`**：在路由进入组件之前被调用。**注意：在此时，组件实例还没有被创建，所以不能通过 `this` 访问组件实例**。如果需要访问组件实例，可以将回调函数作为参数传递给 `next()`。
    ```vue
    <!-- MyComponent.vue -->
    <template>...</template>
    <script>
    export default {
      beforeRouteEnter(to, from, next) {
        console.log('进入组件之前');
        next(vm => {
          // 通过 vm 访问组件实例
          console.log('组件实例已创建，可以访问 this:', vm);
        });
      }
    }
    </script>
    ```

*   **`beforeRouteUpdate(to, from, next)`**：在当前路由改变，但该组件被复用时调用（例如，从 `/user/1` 跳转到 `/user/2`，同一个 `UserView` 组件会被复用）。可以访问 `this`。
    ```vue
    <!-- MyComponent.vue -->
    <template>...</template>
    <script>
    export default {
      beforeRouteUpdate(to, from, next) {
        console.log('路由更新，组件复用', this.$route.params.id, '->', to.params.id);
        // 通常在这里重新加载数据
        this.fetchData(to.params.id);
        next();
      }
    }
    </script>
    ```

*   **`beforeRouteLeave(to, from, next)`**：在离开当前组件之前调用。可以访问 `this`。常用于提示用户“未保存的更改”。
    ```vue
    <!-- MyComponent.vue -->
    <template>...</template>
    <script>
    export default {
      data() { return { hasUnsavedChanges: true } },
      beforeRouteLeave(to, from, next) {
        console.log('离开组件之前');
        if (this.hasUnsavedChanges && !confirm('您有未保存的更改，确定要离开吗？')) {
          next(false); // 阻止离开
        } else {
          next(); // 允许离开
        }
      }
    }
    </script>
    ```

### 8.4 全局解析守卫 (`router.beforeResolve`)

在所有组件内守卫和异步路由组件被解析之后，但是路由最终确认之前被调用。这个守卫可以用来确保在导航即将完成时，所有异步操作都已完成。

```javascript
router.beforeResolve(async (to, from, next) => {
  // 可以在这里执行一些数据预加载或其他异步操作
  if (to.meta.preloadData) {
    await someApiCall();
  }
  next();
});
```

### 8.5 全局后置守卫 (`router.afterEach`)

在导航被确认之后、组件渲染之前被调用。这些守卫不接受 `next` 函数，也不能改变导航。它们主要用于打印日志、分析报告或修改页面标题等非阻塞操作。

```javascript
router.afterEach((to, from) => {
  console.log('导航已完成：', from.path, '->', to.path);
  document.title = to.meta.title || 'My App'; // 更新页面标题
});
```

## 九、路由元信息 (Meta Fields)

你可以在路由配置中定义 `meta` 字段，存储任意信息。这在导航守卫中非常有用，例如用来标记哪些路由需要权限验证。

```javascript
// router/index.js
const routes = [
  {
    path: '/admin',
    component: AdminView,
    meta: {
      requiresAuth: true,
      roles: ['admin', 'super-admin'],
      title: 'Admin Dashboard'
    }
  },
  // ...
]
```
在导航守卫中访问：
```javascript
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // 检查是否有登录或权限
  }
  next();
});
```

## 十、数据获取

在 SPA 中，数据获取可以是异步的。Vue Router 提供了几种策略：

1.  **在组件的 `created`/`mounted` 钩子中获取**：
    这是最常见的方式。当组件被渲染时才发起数据请求。优点是简单，缺点是用户可能先看到空白或旧数据。
2.  **在导航守卫中获取数据**：
    在 `beforeRouteEnter` 或 `beforeResolve` 等守卫中预加载数据。优点是可以避免用户看到空白页面，只有数据加载完成后才进入路由。缺点是如果数据加载缓慢，用户会感到导航延迟。
3.  **同时进行**：
    组件自身加载数据，并显示加载状态。导航守卫中不阻塞，但可能进行一些参数检查等。

## 十一、总结

Vue Router 是 Vue.js 生态系统中不可或缺的一部分，它为构建复杂、高性能的单页应用提供了强大而灵活的客户端路由解决方案。

通过使用 Vue Router，你可以：

*   **声明式地将 URL 映射到 Vue 组件**，实现组件级别的路由。
*   **管理浏览器的历史记录**，提供类似多页应用的导航体验。
*   **通过动态路由和 `props` 选项方便地传递数据**到组件。
*   **利用导航守卫进行精细的权限控制和数据预加载**，提升用户体验和应用安全性。
*   **选择 Hash 或 History 模式**，以适应不同的部署环境和 SEO 需求。

熟练掌握 Vue Router 对于 Vue.js 开发者来说至关重要，它能帮助你构建结构清晰、功能强大且用户体验优秀的单页应用程序。
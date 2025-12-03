---
title: 基于TypeScript封装Axios成通用工具类
date: 2023-05-01 06:24:00
tags:
  - 2023
  - TypeScript
  - Axios
  - 前端技术
categories:
  - 前端技术
  - TypeScript
---

> **Axios** 是一款基于 Promise 的 HTTP 客户端，可用于浏览器和 Node.js 环境。它提供了丰富的功能，如请求/响应拦截器、取消请求、自动转换 JSON 等，使其成为前端和后端 HTTP 请求的流行选择。然而，在大型项目中直接使用裸露的 Axios 实例往往不够高效和灵活。通过 **TypeScript 封装 Axios 成通用工具类**，我们可以实现：统一的请求配置、自动的错误处理、请求/响应的标准化、方便的业务逻辑扩展，以及通过 TypeScript 带来的类型安全和代码智能提示，从而提升开发效率和代码质量。

{% note info %}
核心思想：
**将 Axios 的强大功能（如拦截器、配置）整合到一个类型安全的 TypeScript 类中，提供一个统一、可配置、易用的 HTTP 请求接口，并处理常见的业务场景，从而提升项目的可维护性和开发体验。**
{% endnote %}

------

## 一、为什么需要封装 Axios？

直接使用 Axios 发送请求虽然简单，但在实际项目中会遇到以下问题：

1.  **重复配置**：每个请求都可能需要设置 `baseURL`、`timeout`、`headers` 等，导致大量重复代码。
2.  **错误处理不统一**：网络错误、业务逻辑错误等需要各自处理，缺乏统一的捕获和反馈机制。
3.  **请求参数/响应数据格式不统一**：服务器返回的数据结构可能不尽相同，需要手动解析和转换。
4.  **接口易变动**：后端接口地址或参数变更时，可能需要修改多处代码。
5.  **缺乏类型检查**：裸露的 JavaScript 代码在参数传递和响应数据结构上缺乏类型约束，易引发运行时错误。
6.  **业务逻辑耦合**：一些与请求相关的业务逻辑（如身份认证、Loading 状态管理）散落在各个组件中。

封装 Axios 可以很好地解决这些问题：

*   **统一管理**：所有请求共用一套配置和处理逻辑。
*   **自动化处理**：利用 Axios 拦截器实现请求头设置、Token 刷新、Loading 显示、错误弹窗等自动化功能。
*   **类型安全**：借助 TypeScript 定义请求参数、响应数据、错误类型，提高代码健壮性。
*   **增强可维护性**：所有 HTTP 请求相关逻辑集中管理，便于修改和扩展。
*   **提升开发效率**：提供简洁的 API 接口，减少重复编码。

## 二、封装思路与核心功能点

一个通用的 Axios 封装工具类通常包含以下核心功能点：

1.  **创建 Axios 实例**：允许创建多个具有不同配置的 Axios 实例（例如，应对多个后端服务或不同认证机制）。
2.  **默认配置**：设置 `baseURL`、`timeout`、默认 `headers` 等。
3.  **请求拦截器 (Request Interceptors)**：
    *   统一添加 Token 到 `Authorization` 请求头。
    *   统一处理请求参数，如加密、序列化等。
    *   显示 Loading 状态。
4.  **响应拦截器 (Response Interceptors)**：
    *   统一处理 HTTP 状态码错误（如 401、403、500）。
    *   统一处理后端返回的业务逻辑错误码。
    *   标准化响应数据结构。
    *   隐藏 Loading 状态。
    *   Token 过期刷新机制。
5.  **错误处理**：统一的错误提示（Toast/Modal），可选的错误重试机制。
6.  **请求方法封装**：提供 `get`, `post`, `put`, `delete` 等方法的类型安全封装。
7.  **泛型支持**：通过泛型定义请求参数和响应数据的类型。
8.  **取消请求**：提供便捷的取消请求能力。

## 三、TypeScript 封装 Axios 示例

我们将创建一个 `HttpRequest.ts` 文件，其中包含核心的封装逻辑。

### 3.1 定义类型 (types.ts)

首先，定义一些基础类型，以增强代码的可读性和类型安全。

```typescript
// types.ts

/**
 * 后端返回的基本数据结构
 * @template T 实际业务数据类型
 */
export interface BackendResponse<T = any> {
  code: number; // 业务状态码
  message: string; // 业务提示信息
  data: T; // 业务数据
}

/**
 * 自定义请求配置，继承AxiosRequestConfig
 */
export interface CustomRequestConfig extends AxiosRequestConfig {
  /**
   * 是否显示全局进度条/Loading，默认为true
   */
  showLoading?: boolean;
  /**
   * 是否需要Token，默认为true
   */
  needToken?: boolean;
  /**
   * 是否在发生网络错误或业务逻辑错误时显示错误提示，默认为true
   */
  showErrorMessage?: boolean;
}

// 可选：定义后端返回的错误信息接口
export interface BackendError {
  code: number;
  message: string;
}

// 示例：用户数据接口
export interface User {
  id: number;
  name: string;
  email: string;
}```

### 3.2 封装核心代码 (HttpRequest.ts)

```typescript
// HttpRequest.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { BackendResponse, CustomRequestConfig, BackendError } from './types'; // 引入自定义类型

// 模拟 Loading 状态的函数
const showLoading = () => console.log('显示 Loading...');
const hideLoading = () => console.log('隐藏 Loading...');

// 模拟错误提示的函数
const showToast = (message: string) => alert(`错误提示: ${message}`);

class HttpRequest {
  private instance: AxiosInstance;
  private currentRequests: number = 0; // 用于管理 Loading 状态的计数器

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config);

    this.setupInterceptors();
  }

  // 设置请求和响应拦截器
  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config: CustomRequestConfig) => {
        // 1. 显示 Loading 状态 (如果需要)
        if (config.showLoading !== false) {
          this.currentRequests++;
          if (this.currentRequests === 1) { // 只有第一个请求才显示 Loading
            showLoading();
          }
        }

        // 2. 添加 Token 到请求头 (如果需要)
        if (config.needToken !== false) {
          const token = localStorage.getItem('ACCESS_TOKEN'); // 从本地存储获取 Token
          if (token) {
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${token}`
            };
          }
        }

        // 3. 可以对请求参数进行处理，例如加密、签名等
        // config.params = encryptParams(config.params);

        return config;
      },
      (error: AxiosError) => {
        // 请求错误处理 (例如：网络断开，请求超时等，这些错误在发出请求前就发生了)
        console.error('请求发送失败:', error);
        // 如果出错，也要隐藏 Loading
        this.currentRequests = Math.max(0, this.currentRequests - 1);
        if (this.currentRequests === 0) {
          hideLoading();
        }
        if ((error.config as CustomRequestConfig)?.showErrorMessage !== false) {
          showToast(`网络请求错误: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse<BackendResponse>) => {
        // 1. 隐藏 Loading 状态
        this.currentRequests = Math.max(0, this.currentRequests - 1);
        if (this.currentRequests === 0) {
          hideLoading();
        }

        const { data } = response;
        // 2. 统一处理后端业务逻辑错误码
        if (data.code !== 200) { // 假设 200 表示业务成功
          // 401 认证失败/Token 过期
          if (data.code === 401) {
            console.warn('Token 失效或未认证，进行重定向或刷新...');
            // 可以跳转到登录页，或者尝试刷新Token
            // 例如：router.push('/login');
          }
          // 根据不同的业务错误码进行处理
          if ((response.config as CustomRequestConfig)?.showErrorMessage !== false) {
              showToast(data.message || '未知业务错误');
          }
          // 业务逻辑错误也视为 reject
          return Promise.reject(data);
        }

        // 3. 成功响应，返回实际的业务数据
        return response; // 或者 return data.data; 如果你只想返回data字段
      },
      (error: AxiosError<BackendError>) => { // 后端返回的错误也可能有结构
        // 1. 隐藏 Loading 状态
        this.currentRequests = Math.max(0, this.currentRequests - 1);
        if (this.currentRequests === 0) {
          hideLoading();
        }

        // 2. HTTP 错误状态码处理 (例如 4xx, 5xx)
        let errorMessage = '未知错误';
        if (error.response) {
          // 服务器返回了错误响应 (HTTP 状态码不是 2xx)
          switch (error.response.status) {
            case 400: errorMessage = '请求错误(400)'; break;
            case 401: errorMessage = '未授权，请重新登录(401)'; /* handle 401 here */ break;
            case 403: errorMessage = '拒绝访问(403)'; break;
            case 404: errorMessage = '请求出错(404)'; break;
            case 408: errorMessage = '请求超时(408)'; break;
            case 500: errorMessage = '服务器错误(500)'; break;
            case 501: errorMessage = '服务未实现(501)'; break;
            case 502: errorMessage = '网络错误(502)'; break;
            case 503: errorMessage = '服务不可用(503)'; break;
            case 504: errorMessage = '网络超时(504)'; break;
            case 505: errorMessage = 'HTTP版本不受支持(505)'; break;
            default: errorMessage = `连接出错(${error.response.status})`;
          }
          // 如果后端在错误响应体中提供了具体的错误信息
          if (error.response.data && error.response.data.message) {
              errorMessage = error.response.data.message;
          }
        } else if (error.request) {
          // 请求已发出但没有收到响应
          errorMessage = '无法连接到服务器，请检查网络！';
        } else {
          // 在设置请求时发生了一些事情，触发了一个错误
          errorMessage = `请求发送失败: ${error.message}`;
        }

        if ((error.config as CustomRequestConfig)?.showErrorMessage !== false) {
            showToast(errorMessage);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 核心请求方法
   * @template T 响应数据的类型 (BackendResponse 中的 data)
   * @template R 请求参数的类型
   * @param config 自定义请求配置
   * @returns Promise<T> 返回业务数据T
   */
  request<T = any, R = any>(config: CustomRequestConfig): Promise<T> {
    const defaultHeaders = {
        'Content-Type': 'application/json;charset=UTF-8'
    };

    return new Promise((resolve, reject) => {
      this.instance.request<BackendResponse<T>, AxiosResponse<BackendResponse<T>>, R>({
        ...config,
        headers: {
            ...defaultHeaders,
            ...config.headers
        }
      })
      .then((res: AxiosResponse<BackendResponse<T>>) => {
        resolve(res.data.data); // 只返回业务数据部分
      })
      .catch((err: AxiosError<BackendError> | BackendResponse) => {
        reject(err);
      });
    });
  }

  // 封装常用的 HTTP 方法
  get<T = any, R = any>(url: string, params?: R, config?: CustomRequestConfig): Promise<T> {
    return this.request<T, R>({ url, params, method: 'GET', ...config });
  }

  post<T = any, R = any>(url: string, data?: R, config?: CustomRequestConfig): Promise<T> {
    return this.request<T, R>({ url, data, method: 'POST', ...config });
  }

  put<T = any, R = any>(url: string, data?: R, config?: CustomRequestConfig): Promise<T> {
    return this.request<T, R>({ url, data, method: 'PUT', ...config });
  }

  delete<T = any, R = any>(url: string, data?: R, config?: CustomRequestConfig): Promise<T> {
    return this.request<T, R>({ url, data, method: 'DELETE', ...config });
  }

  // 暴露 Axios 的取消请求功能，如果需要
  static CancelToken = axios.CancelToken;
  static isCancel = axios.isCancel;
}

// 导出默认的 Http 请求实例
const defaultRequest = new HttpRequest({
  baseURL: import.meta.env.VITE_APP_API_BASE_URL || '/api', // Vite 环境变量
  timeout: 10000 // 10秒超时
});

export default defaultRequest;

// 如果有另一个需要特殊配置 (例如另一个服务或不带Token) 的实例，可以这样创建和导出
// export const otherServiceRequest = new HttpRequest({
//   baseURL: 'https://other-service.com/api',
//   timeout: 5000,
//   headers: {
//     'X-Custom-Header': 'foobar'
//   }
// });
```

### 3.3 如何使用 (main.ts / services/user.ts)

```typescript
// main.ts 或 services/user.ts
import Request from './HttpRequest';
import { User } from './types'; // 导入User接口

// 示例：获取用户列表的 API 服务
export function getUsers(): Promise<User[]> {
  return Request.get<User[]>('/users'); // 指定响应数据为 User[] 类型
}

// 示例：创建新用户
export function createUser(user: Omit<User, 'id'>): Promise<User> {
  return Request.post<User>('/users', user);
}

// 示例：带自定义配置的请求 (不显示 Loading 和错误提示)
export function getSomeDataWithoutAlert(): Promise<any> {
  return Request.get('/some-data', undefined, { showLoading: false, showErrorMessage: false });
}

// 示例：在前端框架中 (如 Vue/React) 使用
async function fetchAndDisplayUsers() {
  try {
    const users = await getUsers();
    console.log('用户列表:', users);
    // 更新 UI 状态
  } catch (error: any) {
    if (error && typeof error === 'object' && 'message' in error) {
        console.error('获取用户失败:', error.message);
    } else {
        console.error('获取用户失败:', error);
    }
  }
}

fetchAndDisplayUsers();
```

## 四、核心封装点解析

1.  **`HttpRequest` 类**：
    *   `instance`: 私有 `AxiosInstance` 实例，确保每个 `HttpRequest` 实例都有独立的配置互不干扰。
    *   `constructor`: 接收 `AxiosRequestConfig` 进行初始化。
    *   `currentRequests`: 用于实现全局 Loading 的计数器。只有当第一个请求开始时显示 Loading，所有请求完成后才隐藏 Loading，避免频繁闪烁。

2.  **`setupInterceptors()` 方法**：
    *   **请求拦截器 (`request.use`)**：
        *   `showLoading` 控制：根据 `config.showLoading` 决定是否显示 Loading。
        *   `needToken` 控制：根据 `config.needToken` 决定是否从 `localStorage` 中获取 Token 并添加到 `Authorization` 头。
        *   **错误处理**：在请求发送前的错误（如网络问题）会在这里被捕获。
    *   **响应拦截器 (`response.use`)**：
        *   `hideLoading` 控制：请求完成后隐藏 Loading。
        *   **统一业务码处理**：检查 `response.data.code` 是否为 `200` (`BackendResponse` 类型)。若不是，则根据业务错误码进行处理（例如 401 跳转登录），并通过 `Promise.reject(data)` 抛出业务错误。这样，业务代码只需 `.catch` 处理实际的业务错误。
        *   **HTTP 状态码处理**：捕获服务器返回的非 2xx 状态码错误，根据 `error.response.status` 进行分类处理和提示。
        *   `showErrorMessage` 控制：根据 `config.showErrorMessage` 决定是否显示错误提示。

3.  **`request()` 核心方法**：
    *   使用泛型 `<T = any, R = any>` 定义响应数据类型 `T` 和请求参数类型 `R`，增强类型安全性。
    *   返回 `Promise<T>`，即只返回 `BackendResponse` 中的 `data` 部分，简化业务层对数据的直接使用。
    *   统一设置默认 `Content-Type`。

4.  **常用 HTTP 方法封装**：`get`, `post`, `put`, `delete` 都是基于 `request()` 方法的便捷封装，进一步简化调用。

5.  **取消请求**：暴露 `axios.CancelToken` 和 `axios.isCancel` 静态方法，方便业务层实现请求取消逻辑。

6.  **默认实例导出**：导出一个默认的 `HttpRequest` 实例，方便全局直接使用。同时，也演示了如何创建和导出具有不同配置的多个实例。

## 五、进阶思考与扩展

1.  **文件上传下载**：对于文件上传，需要将 `Content-Type` 设置为 `multipart/form-data`。对于文件下载，需要处理 `responseType` 和 Blob 数据。
2.  **错误重试机制**：可以集成 `axios-retry` 等库，在请求失败时自动重试。
3.  **Token 刷新机制**：当 401 错误发生时，判断是否存在 Refresh Token，然后静默刷新 Access Token，并重试之前的请求。
4.  **缓存策略**：对于某些不经常变动的数据，可以在拦截器中实现简单的客户端缓存。
5.  **国际化 (i18n)**：错误提示信息可以根据当前语言环境进行国际化。
6.  **多个 API 前缀**：在 `baseURL` 基础上，支持更灵活的 API 前缀配置。
7.  **Sentry/日志上报**：在错误拦截器中将错误信息上报到错误监控系统。
8.  **Loading 组件集成**：将 `showLoading` 和 `hideLoading` 替换为实际的组件库 Loading 弹窗/进度条。

## 六、总结

通过 TypeScript 封装 Axios 成通用工具类，是现代前端项目中的一种常见且极其推荐的实践。它不仅解决了重复配置、错误处理不统一等问题，还通过 TypeScript 提供了强大的类型安全保障，避免了在开发和运行时可能出现的类型错误。这使得项目的 HTTP 请求逻辑更加清晰、健壮、易于维护和扩展，极大地提升了团队的开发效率和项目的整体质量。
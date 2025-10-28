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

> 在现代前端开发中，网络请求是任何应用不可或缺的一部分。Axios 作为一款流行的基于 Promise 的 HTTP 客户端，因其易用性和强大的功能而广受欢迎。然而，在大型项目中直接使用 Axios 可能会导致代码冗余、维护困难。结合 TypeScript 的类型优势，我们可以将 Axios 封装成一个强大且类型安全的通用工具类，从而提高代码的可维护性、可扩展性和开发效率。

{% note info %}
“好的封装，是为了在自由和约束之间找到平衡，让开发更高效，代码更健壮。”
{% endnote %}
------

## 一、为什么需要封装 Axios？

直接使用 Axios 固然方便，但在实际项目中，我们通常面临以下问题：

1.  **公共请求配置**： baseURL、超时时间、请求头（如 Authorization Token）等在多个请求中重复设置。
2.  **请求/响应拦截器**：统一处理请求发送前的参数加密、Token 携带，以及响应返回后的状态码处理、错误提示、数据格式化等。
3.  **错误处理**：统一的错误捕获和提示机制，避免每个请求都写 `try...catch`。
4.  **数据类型定义**：使用 TypeScript 时，请求参数和响应数据的类型定义需要贯穿整个请求周期，直接使用 Axios 难以统一管理。
5.  **代码重复**：相似的请求逻辑散落在各处，不便于修改和维护。
6.  **易于切换**：未来如果需要切换 HTTP 库（虽然可能性较小），封装层可以提供一层抽象，减少切换成本。
7.  **可测试性**：封装后的服务更容易进行单元测试和 Mock。

## 二、需求分析与设计思路

我们的目标是封装出一个通用、类型安全、可扩展的 Axios 工具类。

### 2.1 核心需求

*   **创建 Axios 实例**：支持多实例，方便应对不同的 baseURL 或配置。
*   **统一请求前缀 (baseURL)**：减少硬编码。
*   **统一请求超时时间 (timeout)**。
*   **统一请求头 (headers)**：如 Token。
*   **统一请求拦截器**：添加 Token、显示 Loading 等。
*   **统一响应拦截器**：处理服务器返回的状态码（如 401 登出）、数据格式化、错误提示等。
*   **支持 GET/POST/PUT/DELETE 等常用方法**。
*   **支持请求参数的类型约束**。
*   **支持响应数据的类型约束**。
*   **统一错误处理**：返回封装后的错误对象。
*   **支持取消请求 (Cancel Token)**。
*   **支持文件上传 (FormData)**。

### 2.2 设计思路

我们将创建一个 `HttpRequest` 类，内部管理 Axios 实例。

1.  **类封装**：`HttpRequest` 类将包含 Axios 实例以及所有封装的 HTTP 方法。
2.  **构造函数**：接收基础配置，用于初始化 Axios 实例。
3.  **拦截器方法**：在构造函数中配置请求和响应拦截器。
4.  **公共方法**：提供 `get`, `post`, `put`, `del` 等方法，这些方法内部调用 Axios 实例。
5.  **类型泛化**：利用 TypeScript 泛型为请求参数和响应数据提供类型约束。
6.  **错误处理封装**：统一处理 Axios 抛出的错误。

## 三、代码实现

### 3.1 项目结构

```
src/
├── api/
│   └── index.ts        # 对外暴露的 HttpRequest 实例
├── services/
│   └── request/
│       ├── index.ts    # HttpRequest 核心实现
│       ├── type.ts     # 类型定义
│       └── config.ts   # 默认配置
└── main.ts             # 入口文件
```

### 3.2 定义类型 (`src/services/request/type.ts`)

首先，定义请求和响应相关的类型。

```typescript
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

// 用于自定义请求配置，继承AxiosRequestConfig，以便添加我们自己的属性
export interface RequestOptions {
  // 是否需要全局 loading
  isShowLoading?: boolean;
  // 是否需要对请求头进行特殊处理
  isTransformRequest?: boolean;
  // 是否需要对响应数据进行特殊处理
  isTransformResponse?: boolean;
  // 是否需要提示错误信息
  withErrorMessage?: boolean;
  // 其他自定义选项...
}

// 封装后的响应数据接口，通常后端会统一返回某种格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 定义请求结果的 interface，用于统一返回，方便处理错误
export interface RequestResult<T = any> {
  data: T | null;
  error: ApiError | null;
}

// 自定义错误接口
export interface ApiError {
  code: number | string;
  message: string;
  originalError?: any; // 原始Axios或JsError
}

// 扩展AxiosRequestConfig，加入我们的自定义选项
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  requestOptions?: RequestOptions;
}

// 扩展AxiosResponse，加入我们的自定义选项
export interface CustomAxiosResponse<T = any> extends AxiosResponse<ApiResponse<T>> {
  requestOptions?: RequestOptions;
}
```

### 3.3 默认配置 (`src/services/request/config.ts`)

集中管理请求的默认配置。

```typescript
import type { AxiosRequestConfig } from 'axios';
import type { RequestOptions } from './type';

// 默认的 Axios 请求配置
export const DEFAULT_AXIOS_CONFIG: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_APP_BASE_API, // 从环境变量获取
  timeout: 10000, // 超时时间 10 秒
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
};

// 默认的自定义请求选项
export const DEFAULT_REQUEST_OPTIONS: RequestOptions = {
  isShowLoading: false,
  isTransformRequest: true,
  isTransformResponse: true,
  withErrorMessage: true,
};

// 错误码映射（示例）
export const ERROR_CODE_MAP = {
  400: '请求错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求地址出错',
  500: '服务器内部错误',
  502: '网关错误',
  // ... 其他错误码
};
```

### 3.4 `HttpRequest` 核心实现 (`src/services/request/index.ts`)

这是封装的核心部分。

```typescript
import axios from 'axios';
import type { AxiosInstance, AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import { DEFAULT_AXIOS_CONFIG, DEFAULT_REQUEST_OPTIONS, ERROR_CODE_MAP } from './config';
import type {
  RequestOptions,
  ApiResponse,
  ApiError,
  RequestResult,
  CustomAxiosRequestConfig,
  CustomAxiosResponse,
} from './type';

// 假设我们有一个全局的 loading 状态管理函数
const showLoading = () => console.log('显示 Loading...');
const hideLoading = () => console.log('隐藏 Loading...');
const showMessage = (msg: string) => alert(msg); // 简单的错误提示

class HttpRequest {
  private instance: AxiosInstance;
  private readonly defaultOptions: RequestOptions;

  constructor(config: AxiosRequestConfig, options?: RequestOptions) {
    this.instance = axios.create(config);
    this.defaultOptions = { ...DEFAULT_REQUEST_OPTIONS, ...options };
    this.setupInterceptors();
  }

  // 设置请求和响应拦截器
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: CustomAxiosRequestConfig) => {
        const { requestOptions } = config;
        const opts = { ...this.defaultOptions, ...requestOptions };

        // 统一添加 Token (示例)
        const token = localStorage.getItem('token');
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }

        // 是否显示 Loading
        if (opts.isShowLoading) {
          showLoading();
        }

        // 请求数据转换等自定义处理
        if (opts.isTransformRequest && config.data) {
          // 例如，将 CamelCase 转换为 snake_case 发送给后端
          // config.data = transformToSnakeCase(config.data);
        }

        return config;
      },
      (error: AxiosError) => {
        hideLoading();
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: CustomAxiosResponse) => {
        hideLoading(); // 无论成功失败，响应回来都隐藏 loading
        const { data, config } = response;
        const { requestOptions } = config;
        const opts = { ...this.defaultOptions, ...requestOptions };

        // 对响应数据进行统一处理
        if (opts.isTransformResponse) {
          if (data && data.code === 200) { // 假设后端成功码是200
            return data; // 返回后端实际的响应体
          } else {
            // 后端返回的业务错误
            const errorMessage = data?.message || ERROR_CODE_MAP[data?.code as keyof typeof ERROR_CODE_MAP] || '未知错误';
            if (opts.withErrorMessage) {
              showMessage(errorMessage);
            }
            // 抛出自定义错误，以便调用方捕获
            return Promise.reject({
              code: data?.code || -1,
              message: errorMessage,
              originalError: response,
            } as ApiError);
          }
        }
        return data; // 如果不需要转换，直接返回原始数据
      },
      (error: AxiosError) => {
        hideLoading();
        const { response, message } = error;
        let errorMessage: string = '网络异常，请稍后重试！';
        let errorCode: number | string = -1;

        if (response) {
          errorCode = response.status;
          errorMessage = ERROR_CODE_MAP[errorCode as keyof typeof ERROR_CODE_MAP] || response.data?.message || errorMessage;
          // 特殊错误码处理，如 401
          if (response.status === 401) {
            // 清除 token，跳转登录页
            localStorage.removeItem('token');
            // router.push('/login'); // 假设有路由
          }
        } else {
          // 请求超时或网络中断
          if (message.includes('timeout')) {
            errorMessage = '请求超时，请检查网络或稍后重试！';
          }
          if (message.includes('Network Error')) {
            errorMessage = '网络连接失败，请检查网络！';
          }
        }
      
        // 获取当前请求的 options，判断是否显示错误提示
        const currentRequestOptions = (error.config as CustomAxiosRequestConfig)?.requestOptions || this.defaultOptions;
        if (currentRequestOptions.withErrorMessage) {
          showMessage(errorMessage);
        }

        // 统一抛出自定义错误
        return Promise.reject({
          code: errorCode,
          message: errorMessage,
          originalError: error,
        } as ApiError);
      }
    );
  }

  // 辅助方法：处理请求结果，统一返回 { data, error } 格式
  private async safeRequest<T = any>(
    requestPromise: Promise<ApiResponse<T>>
  ): Promise<RequestResult<T>> {
    try {
      const response = await requestPromise;
      return { data: response.data, error: null };
    } catch (e) {
      // 这里的 e 已经是我们处理过的 ApiError
      return { data: null, error: e as ApiError };
    }
  }

  // -------------- 公共请求方法 --------------

  public get<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: CustomAxiosRequestConfig // 允许传入自定义的 Axios 配置
  ): Promise<RequestResult<T>> {
    return this.safeRequest(
      this.instance.get<ApiResponse<T>>(url, { params, ...config })
    );
  }

  public post<T = any>(
    url: string,
    data?: Record<string, any>, // body 参数
    config?: CustomAxiosRequestConfig
  ): Promise<RequestResult<T>> {
    return this.safeRequest(
      this.instance.post<ApiResponse<T>>(url, data, config)
    );
  }

  public put<T = any>(
    url: string,
    data?: Record<string, any>,
    config?: CustomAxiosRequestConfig
  ): Promise<RequestResult<T>> {
    return this.safeRequest(
      this.instance.put<ApiResponse<T>>(url, data, config)
    );
  }

  public delete<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: CustomAxiosRequestConfig
  ): Promise<RequestResult<T>> {
    return this.safeRequest(
      this.instance.delete<ApiResponse<T>>(url, { params, ...config })
    );
  }

  // 支持文件上传 (FormData)
  public upload<T = any>(
    url: string,
    file: File,
    config?: CustomAxiosRequestConfig
  ): Promise<RequestResult<T>> {
    const formData = new FormData();
    formData.append('file', file); // 假设后端接收的字段名为 'file'

    return this.safeRequest(
      this.instance.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...config,
      })
    );
  }

  // 支持取消请求
  // 可以通过在调用时传入 CancelTokenSource 来取消：
  // const source = axios.CancelToken.source();
  // request.get('/data', {}, { cancelToken: source.token });
  // source.cancel('Operation canceled by the user.');
  public getCancelTokenSource(): typeof axios.CancelToken.source {
    return axios.CancelToken.source;
  }
}

export default HttpRequest;
```

### 3.5 对外暴露接口 (`src/api/index.ts`)

创建并导出 HttpRequest 实例。

```typescript
import HttpRequest from '../services/request';
import { DEFAULT_AXIOS_CONFIG, DEFAULT_REQUEST_OPTIONS } from '../services/request/config';

// 创建一个请求实例
const request = new HttpRequest(DEFAULT_AXIOS_CONFIG, DEFAULT_REQUEST_OPTIONS);

// 如果需要支持多 baseURL 或不同拦截器的实例
// export const otherRequest = new HttpRequest({
//   baseURL: 'http://other-api.com',
//   timeout: 5000,
// });

export default request;
```

### 3.6 使用示例 (`src/main.ts` 或组件中)

如何在你的应用中使用这个封装好的 `request` 实例。

```typescript
import request from './api'; // 导入封装好的请求实例

// 定义请求参数和响应数据的接口
interface UserParams {
  userId: string;
  name?: string;
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  phone: string;
}

interface PostData {
  title: string;
  content: string;
}

interface PostResult {
  postId: string;
  message: string;
}

// 示例：发起 GET 请求
async function fetchUserInfo(userId: string) {
  const { data, error } = await request.get<UserInfo>('/users', { userId }, {
    requestOptions: { isShowLoading: true } // 如果只想某个请求显示 loading
  });

  if (data) {
    console.log('用户信息:', data);
    // 这里 data 是UserInfo类型
  } else {
    console.error('获取用户信息失败:', error?.message);
    // 这里 error 是ApiError类型
  }
}

// 示例：发起 POST 请求
async function createPost(post: PostData) {
  const { data, error } = await request.post<PostResult>('/posts', post, {
    headers: { 'X-Custom-Header': 'my-value' } // 单独设置某个请求头
  });

  if (data) {
    console.log('发布帖子成功:', data);
    // 这里 data 是PostResult类型
  } else {
    console.error('发布帖子失败:', error?.message);
  }
}

// 示例：文件上传
async function uploadAvatar(file: File) {
  const { data, error } = await request.upload<{ url: string }>('/upload/avatar', file, {
    requestOptions: { withErrorMessage: false } // 不显示默认错误提示，自己处理
  });

  if (data) {
    console.log('上传成功，文件URL:', data.url);
  } else {
    console.error('上传失败:', error?.message);
  }
}


// 调用示例
fetchUserInfo('123');

// 模拟文件上传
const dummyFile = new File(['dummy content'], 'avatar.png', { type: 'image/png' });
uploadAvatar(dummyFile);

createPost({ title: 'My First Post', content: 'Hello, world!' });
```

## 四、高级进阶与扩展

### 4.1 取消请求

Axios 原生支持 Cancel Token，可以在组件卸载时取消未完成的请求，避免不必要的副作用和内存泄漏。

```typescript
// 在 src/services/request/index.ts 中已经提供了 getCancelTokenSource 方法

// 使用示例：
import request from './api';
import axios from 'axios'; // 需要引入 axios 来获取 CancelTokenSource

const source = axios.CancelToken.source();

async function fetchDataWithCancellation() {
  try {
    const { data, error } = await request.get<{ id: string }>('/long-request', {}, {
      cancelToken: source.token, // 将 CancelToken 传入请求配置
    });

    if (data) {
      console.log('Data fetched:', data);
    } else {
      console.error('Request failed:', error?.message);
    }
  } catch (error) {
    // 检查是否是取消请求的错误
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}

// 在组件卸载或特定事件发生时取消请求
// source.cancel('请求已取消');
```

### 4.2 错误类型细化

可以根据后端返回的错误码或业务状态码进一步细化 `ApiError` 接口。

```typescript
// src/services/request/type.ts

export interface CustomBusinessError {
  status: 'FAIL' | 'ERROR';
  errorCode: number;
  errorMessage: string;
}

export interface ApiError {
  code: number | string;
  message: string;
  originalError?: any;
  // 如果后端有统一业务错误格式，可以扩展
  businessError?: CustomBusinessError;
}
```

### 4.3 多实例管理

如果你的应用需要访问多个不同 baseURL 的后端服务，可以在 `src/api/index.ts` 中创建不同的 `HttpRequest` 实例：

```typescript
// src/api/index.ts
import HttpRequest from '../services/request';
import { DEFAULT_AXIOS_CONFIG, DEFAULT_REQUEST_OPTIONS } from '../services/request/config';

// 主 API
export const mainRequest = new HttpRequest(DEFAULT_AXIOS_CONFIG, DEFAULT_REQUEST_OPTIONS);

// 其他服务 API
export const userService = new HttpRequest({
  baseURL: import.meta.env.VITE_APP_USER_API,
  timeout: 5000,
}, { isShowLoading: false }); // 用户服务可能不显示全局 loading

// 导出
export default mainRequest;
```

### 4.4 文件上传进度

Axios 支持文件上传进度回调，可以在 `config` 中设置 `onUploadProgress`。

```typescript
// 在HttpRequest.upload 方法中添加 onUploadProgress
public upload<T = any>(
  url: string,
  file: File,
  config?: CustomAxiosRequestConfig,
  onProgress?: (progressEvent: ProgressEvent) => void // 添加进度回调
): Promise<RequestResult<T>> {
  const formData = new FormData();
  formData.append('file', file);

  return this.safeRequest(
    this.instance.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress, // 将回调传入
      ...config,
    })
  );
}

// 使用示例
async function uploadWithProgress(file: File) {
  const { data, error } = await request.upload<{ url: string }>(
    '/upload',
    file,
    {},
    (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log(`上传进度: ${percentCompleted}%`);
    }
  );
  // ...
}
```

## 五、总结

通过 TypeScript 封装 Axios 成通用工具类，我们不仅解决了重复代码的问题，还通过类型系统增强了代码的健壮性和可维护性。

*   **类型安全**：确保请求参数和响应数据的类型一致性，减少运行时错误。
*   **统一管理**：集中处理请求配置、拦截器、错误处理，便于项目维护。
*   **灵活性高**：通过 `requestOptions` 和 `CustomAxiosRequestConfig` 提供了足够的灵活性来覆盖特殊请求的需求。
*   **可扩展性**：方便未来添加新的功能，如缓存、限流等。

这种封装模式在大型企业级项目中非常常见和有效，它能让你的网络请求层变得更加清晰、可控和高效。
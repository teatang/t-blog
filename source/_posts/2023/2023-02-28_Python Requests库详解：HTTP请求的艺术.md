---
title: Python Requests库详解：HTTP请求的艺术
date: 2023-02-28 06:24:00
tags:
  - 2023
  - Python
  - Requests
  - HTTP
categories:
  - Python
  - 库
---

> **`requests` 库** 是 Python 生态系统中最流行、最强大、也是最优雅的 HTTP 客户端库之一。它简化了复杂的 HTTP 请求操作，让开发者能够以极少量的代码发送各种类型的 HTTP 请求，并轻松处理响应。与 Python 内置的 `urllib` 模块相比，`requests` 提供了更友好、更直观的 API，被誉为“面向人类的 HTTP 服务”。

{% note info %}
核心思想：`requests` 封装了底层 HTTP 协议的复杂性，提供简洁的 API，让开发者专注于业务逻辑而非网络通信的细节。
{% endnote %}

## 一、为什么选择 Requests？

在 Python 中进行 HTTP 请求有多种方式，例如内置的 `urllib` 模块。但 `requests` 库之所以广受欢迎，主要得益于以下优势：

1.  **友好的 API**：设计直观，易学易用，代码可读性高。
2.  **功能强大**：支持几乎所有 HTTP 功能，包括 GET, POST, PUT, DELETE 等方法，以及请求头、数据、文件上传、Cookie、身份认证、代理、SSL 验证等。
3.  **自动处理**：自动处理 URL 编码、重定向、会话管理等常见任务。
4.  **JSON 支持**：内置 JSON 编解码功能，方便与 RESTful API 交互。
5.  **优秀的文档**：官方文档清晰明了，社区活跃，问题解决方便。

## 二、安装 Requests

`requests` 并非 Python 的内置库，需要通过 `pip` 安装：

```bash
pip install requests
```

安装完成后，就可以在 Python 代码中导入并使用了：

```python
import requests
```

## 三、基本用法：发送各种请求

`requests` 库提供了与 HTTP 动词同名的函数来发送请求，例如 `requests.get()`、`requests.post()` 等。

### 3.1 GET 请求

GET 请求是最常见的请求类型，用于从服务器获取资源。

```python
import requests

# 1. 基本 GET 请求
response = requests.get('https://www.baidu.com')
print(f"状态码: {response.status_code}") # 200 表示成功
print(f"字符编码: {response.encoding}")  # 自动猜测编码
print(f"响应文本长度: {len(response.text)}")

# 2. 带参数的 GET 请求 (Query Parameters)
# 方式一：直接拼接在 URL 中 (不推荐，容易出错且不安全)
# response = requests.get('http://httpbin.org/get?param1=value1&param2=value2')

# 方式二：使用 params 字典 (推荐)
params = {
    'name': '张三',
    'age': 30,
    'city': '北京'
}
response = requests.get('http://httpbin.org/get', params=params)
print(f"带参数 GET 请求的 URL: {response.url}")
print(f"响应的 JSON 数据: {response.json()}") # 如果响应是 JSON 格式，可以直接解析
```

**响应对象 (Response Object)**：`requests.get()` 返回一个 `Response` 对象，它包含了服务器响应的所有信息：
*   `response.status_code`：HTTP 状态码（如 200, 404, 500）。
*   `response.text`：响应体的文本内容，`requests` 会根据响应头猜测编码。
*   `response.content`：响应体的原始字节内容，适用于非文本数据（如图片、文件）。
*   `response.json()`：如果响应是 JSON 格式，此方法会将其解析为 Python 字典或列表。
*   `response.headers`：响应头信息，字典类型。
*   `response.url`：请求的最终 URL（处理完重定向后的）。
*   `response.encoding`：`requests` 猜测的响应编码。

### 3.2 POST 请求

POST 请求用于向服务器提交数据，通常用于创建新资源或发送表单数据。

```python
import requests

# 1. 提交表单数据 (POST with form data)
data = {
    'username': 'testuser',
    'password': 'testpassword'
}
response = requests.post('http://httpbin.org/post', data=data)
print(f"表单 POST 响应: {response.json()}")
# 在 httpbin.org/post 的响应中，data 字段会显示提交的表单数据

# 2. 提交 JSON 数据 (POST with JSON data)
json_data = {
    'name': '李四',
    'sex': '男',
    'details': {'hobby': 'programming', 'language': 'python'}
}
response = requests.post('http://httpbin.org/post', json=json_data)
# requests 会自动设置 Content-Type 为 application/json
print(f"JSON POST 响应: {response.json()}")
# 在 httpbin.org/post 的响应中，json 字段会显示提交的 JSON 数据
```

### 3.3 其他 HTTP 方法

`requests` 也支持 PUT、DELETE、HEAD、OPTIONS 方法：

```python
# PUT 请求 (通常用于更新资源)
response = requests.put('http://httpbin.org/put', data={'field': 'value'})
print(f"PUT 响应: {response.json()}")

# DELETE 请求 (通常用于删除资源)
response = requests.delete('http://httpbin.org/delete', params={'id': 123})
print(f"DELETE 响应: {response.json()}")

# HEAD 请求 (只获取响应头，不获取响应体)
response = requests.head('http://httpbin.org/get')
print(f"HEAD 响应头: {response.headers}")

# OPTIONS 请求 (获取服务器支持的通信选项)
response = requests.options('http://httpbin.org/get')
print(f"OPTIONS 响应头: {response.headers}")
```

## 四、高级用法

### 4.1 请求头 (Headers)

通过 `headers` 参数可以添加自定义请求头，这在爬虫中模拟浏览器行为（如 User-Agent）、API 认证等方面非常有用。

```python
import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://www.some-website.com/'
}

response = requests.get('http://httpbin.org/headers', headers=headers)
print(f"自定义请求头响应: {response.json()['headers']}")
```

### 4.2 文件上传 (File Uploads)

通过 `files` 参数可以方便地上传文件。

```python
import requests

# 假设要上传一个名为 'my_file.txt' 的文件
# with open('my_file.txt', 'w') as f:
#     f.write("This is a test file for upload.")

# files 参数可以是一个字典，键是表单字段名，值是文件对象或元组
# (文件名, 文件内容, 文件类型, 自定义请求头)
files = {
    'file': ('my_file.txt', open('my_file.txt', 'rb'), 'text/plain', {'Expires': '0'})
}

# 也可以直接传递文件对象
# files = {'file': open('my_file.txt', 'rb')}

response = requests.post('http://httpbin.org/post', files=files)
print(f"文件上传响应: {response.json()}")
```

### 4.3 Cookie 处理

`requests` 在会话 (Session) 中会自动管理 Cookie。

```python
import requests

# 1. 获取服务器设置的 Cookie
response = requests.get('http://httpbin.org/cookies/set/mycookie/myvalue')
print(f"服务器设置的 Cookie: {response.cookies}") # requests.cookies.RequestsCookieJar 对象

# 2. 发送自定义 Cookie
cookies = {'session_id': 'abc123xyz', 'theme': 'dark'}
response = requests.get('http://httpbin.org/cookies', cookies=cookies)
print(f"发送自定义 Cookie 响应: {response.json()}")
```

### 4.4 会话 (Session) 对象

`requests.Session()` 对象允许跨请求保持某些参数，例如 Cookie、请求头、身份认证等。这在需要多次与同一服务交互时非常有用，可以避免重复设置。

```python
import requests

# 创建一个 Session 对象
session = requests.Session()

# Session 会自动保存 Cookie
session.get('http://httpbin.org/cookies/set/sessioncookie/sessionvalue')
response = session.get('http://httpbin.org/cookies')
print(f"Session 自动携带的 Cookie: {response.json()}")

# Session 也可以保留自定义的请求头
session.headers.update({
    'User-Agent': 'MyCustomSessionAgent/1.0',
    'X-Custom-Header': 'SessionValue'
})
response = session.get('http://httpbin.org/headers')
print(f"Session 自定义请求头: {response.json()['headers']}")

# 使用 Session 进行其他请求
response = session.post('http://httpbin.org/post', data={'payload': 'session data'})
print(f"Session POST 请求: {response.json()}")

session.close() # 使用完毕后关闭 Session
```

### 4.5 身份认证 (Authentication)

`requests` 支持多种身份认证方式。

*   **HTTP 基本认证 (Basic Auth)**：

    ```python
    from requests.auth import HTTPBasicAuth
    response = requests.get('http://httpbin.org/basic-auth/user/passwd', auth=HTTPBasicAuth('user', 'passwd'))
    # 或者更简洁的写法
    # response = requests.get('http://httpbin.org/basic-auth/user/passwd', auth=('user', 'passwd'))
    print(f"Basic Auth 响应状态: {response.status_code}, 认证结果: {response.json()}")
    ```

*   **其他认证**：`requests` 也支持摘要认证 (Digest Auth) 和 OAuth 等，但通常需要安装额外的库。

### 4.6 代理 (Proxies)

在网络爬虫中，使用代理是常见的反抓取机制。

```python
import requests

proxies = {
    'http': 'http://127.0.0.1:8080',  # HTTP 代理
    'https': 'http://127.0.0.1:8080', # HTTPS 代理
    # 'https': 'https://user:password@proxy.example.com:8080' # 带认证的代理
}

try:
    response = requests.get('http://ipecho.net/plain', proxies=proxies, timeout=5)
    print(f"通过代理请求后的 IP: {response.text}")
except requests.exceptions.Timeout:
    print("请求超时")
except requests.exceptions.ConnectionError:
    print("代理连接失败")
```

### 4.7 SSL 证书验证

默认情况下，`requests` 会验证 SSL 证书。如果遇到自签名证书或本地开发环境，可能需要关闭验证（**不推荐生产环境使用**）。

```python
import requests

# 默认开启 SSL 验证
# response = requests.get('https://example.com')

# 关闭 SSL 验证 (不安全，仅用于开发或测试)
response = requests.get('https://example.com', verify=False)
```

### 4.8 超时设置 (Timeout)

设置超时时间可以防止请求长时间挂起。

```python
import requests
from requests.exceptions import Timeout, ConnectionError

try:
    # 设置连接超时为 1 秒，读取超时为 30 秒
    response = requests.get('http://httpbin.org/delay/5', timeout=(1, 30))
    print(f"请求成功: {response.status_code}")
except Timeout:
    print("请求超时 (连接或读取数据时间过长)")
except ConnectionError:
    print("连接错误 (无法访问服务器)")
except Exception as e:
    print(f"发生其他错误: {e}")

try:
    # 只设置总超时时间
    response = requests.get('http://httpbin.org/delay/2', timeout=1)
    print(f"请求成功: {response.status_code}")
except Timeout:
    print("请求超时 (总时间超过1秒)")
```

### 4.9 错误与异常处理

`requests` 会抛出特定的异常来表示网络请求过程中可能遇到的问题。

*   `requests.exceptions.RequestException`：所有 `requests` 异常的基类。
*   `requests.exceptions.ConnectionError`：网络连接问题（如 DNS 解析失败，拒绝连接）。
*   `requests.exceptions.HTTPError`：HTTP 状态码错误 (4XX 或 5XX)，只有调用 `response.raise_for_status()` 时才会抛出。
*   `requests.exceptions.Timeout`：请求超时。
*   `requests.exceptions.TooManyRedirects`：重定向次数过多。

**最佳实践：** 总是使用 `try...except` 语句来处理可能发生的网络异常。

```python
import requests
from requests.exceptions import RequestException, HTTPError

try:
    response = requests.get('https://api.github.com/nonexistent_url')
    # 检查 HTTP 状态码，如果不是 2xx，则抛出 requests.exceptions.HTTPError
    response.raise_for_status()
    print(response.json())
except HTTPError as http_err:
    print(f"HTTP 错误发生: {http_err} - {response.status_code} {response.reason}")
    print(f"响应内容: {response.text}")
except RequestException as req_err:
    print(f"请求发生错误: {req_err}")
except Exception as err:
    print(f"发生未知错误: {err}")
```

## 五、总结与最佳实践

`requests` 库以其简洁、强大和优雅的 API，成为 Python 进行 HTTP 请求的首选工具。掌握其基本用法和高级功能，能够大大提升开发效率。

**最佳实践提醒：**

*   **使用 Session**：对于需要进行多次请求（尤其是需要保持 Cookie 或自定义请求头）的场景，始终使用 `requests.Session()` 对象。
*   **处理异常**：总是使用 `try...except` 块来捕获和处理 `requests` 可能抛出的异常，特别是 `ConnectionError` 和 `Timeout`。
*   **检查状态码**：在处理响应前，检查 `response.status_code` 或调用 `response.raise_for_status()` 来确保请求成功。
*   **设置超时**：为所有网络请求设置 `timeout` 参数，避免程序长时间挂起。
*   **谨慎对待 `verify=False`**：在生产环境中，尽量避免关闭 SSL 证书验证。
*   **模拟浏览器行为**：在爬虫场景中，适当地设置 `User-Agent` 等请求头，可以减少被网站识别和屏蔽的风险。
*   **明确数据类型**：`data` 用于表单数据，`json` 用于 JSON 数据。
*   **注意编码**：`requests` 会自动猜测响应编码，但如果出现乱码，可以手动设置 `response.encoding`。

通过上述详解和示例，希望你能更好地理解和运用 `requests` 库，在网络编程和数据抓取等任务中得心应手。
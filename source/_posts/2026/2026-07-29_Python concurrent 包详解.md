---
title: Python concurrent 包详解
date: 2026-07-29 06:24:00
tags:
  - 2025
  - 并发编程
  - Python
categories: 
    - Python
    - 库
---

> **Python 的 `concurrent` 包** 提供了一个高级接口，用于**异步执行**可调用对象。它主要通过其子模块 `concurrent.futures` 简化了**线程池 (ThreadPoolExecutor)** 和**进程池 (ProcessPoolExecutor)** 的管理。这个包的目标是让开发者能够更容易地在 Python 中实现并发，而无需直接处理低级的线程或进程管理细节，如创建、启动、同步和回收。

{% note info %}
**核心概念：**
*   **并发 (Concurrency):** 多个任务在逻辑上同时进行，但不一定物理上同时运行。
*   **并行 (Parallelism):** 多个任务在物理上同时运行（需要多核CPU）。
*   **`Executor`:** 一个抽象基类，定义了提交可调用对象以异步执行的方法。
*   **`Future`:** 代表一个异步操作的最终结果。它是一个代理对象，可以用来查询操作状态、获取结果或异常。
*   **`ThreadPoolExecutor`:** 使用线程池实现并发，适用于 I/O 密集型任务。受 **GIL (全局解释器锁)** 限制，无法实现真正的并行。
*   **`ProcessPoolExecutor`:** 使用进程池实现并行，适用于 CPU 密集型任务。每个进程都有独立的 Python 解释器和内存空间，不受 GIL 限制。
{% endnote %}

------

## 一、为什么需要 `concurrent.futures`？

在 `concurrent.futures` 出现之前，Python 提供了 `threading` 和 `multiprocessing` 模块用于并发编程。然而，这些低级模块存在一些挑战：

1.  **管理复杂性：** 开发者需要手动创建、启动、管理线程或进程，处理线程/进程间的通信、同步以及错误处理。
2.  **结果获取：** 获取线程或进程的返回值并不直接，通常需要通过队列、共享内存或其他 IPC 机制。
3.  **资源回收：** 确保线程或进程正确关闭和资源释放需要额外的代码。
4.  **可读性与维护性：** 低级并发代码往往更加冗长和难以理解。

`concurrent.futures` 通过引入**执行器 (Executor)** 和**未来对象 (Future)** 的概念，极大地简化了这些复杂性：

*   **Executor:** 负责抽象出工作单元的提交和结果的收集。
*   **Future:** 提供了一种统一的方式来表示异步操作的结果，无论其是在线程中还是进程中执行。

这使得开发者可以专注于业务逻辑，而将并发的底层细节交给 `concurrent.futures` 模块来处理。

## 二、`concurrent.futures` 的核心组件

### 2.1 Executor 抽象基类

`Executor` 是所有具体执行器（如 `ThreadPoolExecutor` 和 `ProcessPoolExecutor`）的抽象基类。它定义了两个主要方法用于提交任务：

*   `submit(fn, *args, **kwargs)`: 提交一个可调用对象 `fn` 和其参数，并返回一个 `Future` 对象。
*   `map(fn, *iterables, timeout=None, chunksize=1)`: 提交一个可调用对象 `fn` 到 `iterables` 中的每个元素上，并返回一个迭代器，其结果的顺序与提交的顺序一致。

### 2.2 ThreadPoolExecutor (线程池执行器)

*   **用途：** 适用于 **I/O 密集型任务**，例如网络请求、文件读写、数据库操作等，这些任务大部分时间都在等待外部资源。
*   **原理：** 使用一组线程来执行任务。由于 Python 的 **GIL (Global Interpreter Lock)** 限制，在任何时刻只有一个线程能执行 Python 字节码。因此，`ThreadPoolExecutor` 无法实现真正的多核并行，但当线程在等待 I/O 时，GIL 会被释放，允许其他线程运行，从而提高整体吞吐量。
*   **创建：** `concurrent.futures.ThreadPoolExecutor(max_workers=None, thread_name_prefix='', initializer=None, initargs=())`
    *   `max_workers`: 指定线程池中线程的最大数量。默认为 CPU 核心数的 5 倍 (Python 3.8+)。
    *   通常建议使用上下文管理器 (`with`) 来确保资源的正确释放。

**示例：使用 `ThreadPoolExecutor` 执行 I/O 密集型任务**

```python
import concurrent.futures
import time
import requests

# 定义一个 I/O 密集型任务：下载一个网页
def download_url(url):
    try:
        print(f"开始下载: {url}")
        response = requests.get(url, timeout=5)
        response.raise_for_status() # 检查HTTP请求是否成功
        print(f"下载完成: {url}, 内容长度: {len(response.text)} 字节")
        return f"URL: {url}, Status: {response.status_code}, Length: {len(response.text)}"
    except requests.exceptions.RequestException as e:
        print(f"下载失败: {url}, 错误: {e}")
        return f"URL: {url}, Error: {e}"

urls = [
    "https://www.google.com",
    "https://www.baidu.com",
    "https://www.bing.com",
    "https://www.youtube.com",
    "https://httpbin.org/delay/2", # 模拟2秒延迟
    "https://this-url-does-not-exist.com" # 模拟一个失败的请求
]

# 1. 基本提交与获取结果 (submit)
print("--- 使用 submit 提交任务并逐个获取结果 ---")
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    future_to_url = {executor.submit(download_url, url): url for url in urls}
    for future in future_to_url:
        url = future_to_url[future]
        try:
            result = future.result() # 阻塞直到结果可用
            print(f"结果 for {url}: {result}")
        except Exception as exc:
            print(f"获取 {url} 的结果时产生异常: {exc}")

# 2. 使用 map 提交任务
print("\n--- 使用 map 提交任务 ---")
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    results_map = executor.map(download_url, urls)
    for result in results_map:
        print(f"Map 结果: {result}")

# 3. 使用 as_completed 提交任务 (按完成顺序获取结果)
print("\n--- 使用 as_completed 提交任务 ---")
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    future_to_url = {executor.submit(download_url, url): url for url in urls}
    for future in concurrent.futures.as_completed(future_to_url):
        url = future_to_url[future]
        try:
            result = future.result() # 阻塞直到结果可用
            print(f"完成 {url}: {result}")
        except Exception as exc:
            print(f"完成 {url} 时产生异常: {exc}")

```

### 2.3 ProcessPoolExecutor (进程池执行器)

*   **用途：** 适用于 **CPU 密集型任务**，例如复杂的数学计算、图像处理、数据分析等，这些任务主要消耗 CPU 资源。
*   **原理：** 创建一组独立的进程来执行任务。由于每个进程都有自己的 Python 解释器和内存空间，它们之间互不影响，因此不受 GIL 限制，可以实现**真正的多核并行**。进程间通信通常通过序列化 (pickling) 机制完成。
*   **创建：** `concurrent.futures.ProcessPoolExecutor(max_workers=None, mp_context=None, initializer=None, initargs=())`
    *   `max_workers`: 指定进程池中进程的最大数量。默认为 `os.cpu_count()`。
    *   同样建议使用上下文管理器 (`with`)。

**示例：使用 `ProcessPoolExecutor` 执行 CPU 密集型任务**

```python
import concurrent.futures
import time
import math

# 定义一个 CPU 密集型任务：计算大量平方根
def cpu_bound_task(number):
    print(f"进程 {number}: 开始计算...")
    result = 0
    for i in range(1, 10_000_000): # 大量计算
        result += math.sqrt(number + i)
    print(f"进程 {number}: 计算完成.")
    return result

numbers = [10, 20, 30, 40]

# 1. 基本提交与获取结果 (submit)
print("--- 使用 ProcessPoolExecutor submit 提交任务 ---")
with concurrent.futures.ProcessPoolExecutor(max_workers=2) as executor:
    future_to_number = {executor.submit(cpu_bound_task, num): num for num in numbers}
    for future in concurrent.futures.as_completed(future_to_number):
        number = future_to_number[future]
        try:
            result = future.result()
            print(f"进程 {number} 结果: {result}")
        except Exception as exc:
            print(f"进程 {number} 产生异常: {exc}")

# 2. 使用 map 提交任务
print("\n--- 使用 ProcessPoolExecutor map 提交任务 ---")
with concurrent.futures.ProcessPoolExecutor(max_workers=2) as executor:
    results_map = executor.map(cpu_bound_task, numbers)
    for result in results_map:
        print(f"Map 结果: {result}")

```

### 2.4 Future 对象

`Future` 对象是 `concurrent.futures` 的核心抽象之一，它代表了一个尚未完成的异步操作。通过 `Future` 对象，你可以：

*   **查询状态：** `done()`, `running()`, `cancelled()`
*   **获取结果：** `result(timeout=None)` (阻塞直到结果可用，或超时抛出 `TimeoutError`)
*   **获取异常：** `exception(timeout=None)` (阻塞直到异常可用，或超时抛出 `TimeoutError`)
*   **添加回调：** `add_done_callback(fn)` (在 Future 完成时调用 `fn`)
*   **取消操作：** `cancel()` (尝试取消 Future，返回 `True` 表示取消成功)

**示例：Future 对象的详细用法与回调**

```python
import concurrent.futures
import time

def slow_function(duration, task_id):
    print(f"任务 {task_id}: 开始执行，预计 {duration} 秒...")
    time.sleep(duration)
    if task_id == "error_task":
        raise ValueError(f"任务 {task_id} 故意抛出错误")
    print(f"任务 {task_id}: 执行完成。")
    return f"任务 {task_id} 结果: 耗时 {duration} 秒"

# 定义一个回调函数
def done_callback(future):
    if future.cancelled():
        print(f"回调: Future {future} 被取消了。")
    elif future.exception():
        print(f"回调: Future {future} 发生异常: {future.exception()}")
    else:
        print(f"回调: Future {future} 成功完成，结果: {future.result()}")

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    f1 = executor.submit(slow_function, 3, "task1") # 3秒任务
    f2 = executor.submit(slow_function, 1, "task2") # 1秒任务
    f3 = executor.submit(slow_function, 5, "task3") # 5秒任务
    f4 = executor.submit(slow_function, 2, "error_task") # 模拟错误任务

    # 添加回调
    f1.add_done_callback(done_callback)
    f2.add_done_callback(done_callback)
    f3.add_done_callback(done_callback)
    f4.add_done_callback(done_callback)

    print("\n--- 主线程等待部分任务完成 (wait) ---")
    done, not_done = concurrent.futures.wait([f1, f2, f4], timeout=2, return_when=concurrent.futures.FIRST_COMPLETED)
    print(f"已完成的 Future 数量: {len(done)}")
    print(f"未完成的 Future 数量: {len(not_done)}")

    print("\n--- 主线程检查所有 Future 的状态和结果 ---")
    futures = [f1, f2, f3, f4]
    for i, f in enumerate(futures):
        if f.running():
            print(f"Future {i+1} 仍在运行中...")
        elif f.done():
            print(f"Future {i+1} 已完成。")
            if f.exception():
                print(f"  异常: {f.exception()}")
            else:
                print(f"  结果: {f.result()}")
        elif f.cancelled():
            print(f"Future {i+1} 已被取消。")

    print("\n所有任务已提交，主线程继续执行...")
    # 可以继续执行其他任务，Future的回调函数会在任务完成时被触发

    # 等待所有任务真正结束，以确保看到所有回调输出
    concurrent.futures.wait(futures)
    print("\n所有任务已处理完毕。")

```

### 2.5 `concurrent.futures.wait(fs, timeout=None, return_when=ALL_COMPLETED)`

`wait()` 函数用于阻塞当前线程，直到满足以下条件之一：
*   所有 `Future` 对象（在 `fs` 中）都已完成 (`ALL_COMPLETED`)。
*   某个 `Future` 对象完成 (`FIRST_COMPLETED`)。
*   某个 `Future` 对象发生异常 (`FIRST_EXCEPTION`)。
*   达到 `timeout` 时间。

它返回一个包含两个集合的元组：`done` (已完成的 Future) 和 `not_done` (未完成的 Future)。

### 2.6 `concurrent.futures.as_completed(fs, timeout=None)`

`as_completed()` 函数返回一个迭代器，该迭代器会在 `fs` 中的 `Future` 对象完成时生成它们。这允许你按完成的顺序处理结果，而不是按提交的顺序。这对于处理耗时不同的任务非常有用。

## 三、`ThreadPoolExecutor` 与 `ProcessPoolExecutor` 的选择

| 特性         | `ThreadPoolExecutor` (线程池)                                | `ProcessPoolExecutor` (进程池)                                   |
| :----------- | :----------------------------------------------------------- | :--------------------------------------------------------------- |
| **适用场景** | **I/O 密集型任务** (网络请求、文件读写、数据库操作等)      | **CPU 密集型任务** (科学计算、图像处理、数据分析、密码破解等)    |
| **并行性**   | **并发，非并行** (受 GIL 限制，同一时刻只有一个线程执行 Python 字节码，但 I/O 等待时 GIL 会释放) | **并行** (每个进程有独立的解释器和内存空间，可充分利用多核 CPU) |
| **内存**     | 线程共享父进程的内存空间，内存占用相对较小。                 | 每个进程有独立的内存空间，内存占用相对较大。                     |
| **通信开销** | 线程间共享数据较容易 (但需注意同步)。                        | 进程间数据传递需要序列化 (pickling)，开销相对较大。             |
| **启动开销** | 线程创建和销毁开销较小。                                     | 进程创建和销毁开销较大 (通常比线程慢很多)。                     |
| **错误隔离** | 一个线程的错误可能影响整个进程。                             | 进程间相互隔离，一个进程的错误通常不会影响其他进程。             |
| **调试**     | 相对容易。                                                   | 相对复杂。                                                       |

**总结选择原则：**
*   如果任务主要是等待外部资源（如网络、磁盘），选择 `ThreadPoolExecutor`。
*   如果任务主要是进行大量计算并充分利用 CPU，选择 `ProcessPoolExecutor`。
*   如果需要在多个任务之间共享大量可变数据，`ThreadPoolExecutor` 更方便（但需要仔细的同步机制）。
*   如果需要完全的错误隔离或避免 GIL 限制，`ProcessPoolExecutor` 是更好的选择。

## 四、最佳实践和注意事项

1.  **使用上下文管理器 (`with` 语句)：**
    始终使用 `with` 语句来创建 `Executor`，这可以确保在任务完成后或发生异常时，`shutdown()` 方法被正确调用，从而优雅地关闭线程/进程池并释放资源。
    ```python
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        # 提交任务
        pass
    # 离开with块后，executor会自动关闭
    ```
2.  **错误处理：**
    `Future.result()` 和 `Future.exception()` 方法在任务执行失败时会重新抛出异常。务必在 `try...except` 块中调用它们来处理潜在的异常。
3.  **避免共享可变状态 (Especially with `ProcessPoolExecutor`):**
    *   在 `ThreadPoolExecutor` 中，线程共享内存，因此访问共享可变数据时需要使用锁 (`threading.Lock`) 或其他同步原语来防止竞态条件。
    *   在 `ProcessPoolExecutor` 中，进程不共享内存，数据通过序列化复制。因此，传递给任务的参数和从任务返回的结果都是副本。这意味着在进程中修改数据不会影响原始进程中的数据。
4.  **合理设置 `max_workers`：**
    *   对于 **I/O 密集型任务** (`ThreadPoolExecutor`)，`max_workers` 可以设置得比 CPU 核心数大得多，因为大部分时间线程都在等待。一个常见的经验法则是 `2 * CPU_COUNT + 1` 或更高。
    *   对于 **CPU 密集型任务** (`ProcessPoolExecutor`)，`max_workers` 通常应设置为 CPU 核心数 (`os.cpu_count()`)，以避免进程切换的额外开销。
5.  **`map` 与 `submit` + `as_completed` 的选择：**
    *   `map` 适用于处理**同质任务**，并且你希望以**提交顺序**获取结果。
    *   `submit` 结合 `as_completed` 适用于处理**异质任务**，或者你希望以**完成顺序**获取结果，以便尽快处理已完成的任务。

## 五、总结

`concurrent.futures` 包是 Python 标准库中一个强大且易用的并发工具。它通过引入 `Executor` 和 `Future` 的高级抽象，极大地简化了多线程和多进程编程的复杂性。

通过选择合适的执行器 (`ThreadPoolExecutor` 用于 I/O 密集型，`ProcessPoolExecutor` 用于 CPU 密集型)，开发者可以有效地利用系统资源，提升程序的性能和响应速度。理解其工作原理、核心组件以及最佳实践，将帮助 Python 开发者构建高效、健壮的并发应用程序。
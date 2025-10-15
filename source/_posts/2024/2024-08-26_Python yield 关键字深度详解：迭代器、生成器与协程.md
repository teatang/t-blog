---
title: Python yield 关键字深度详解：迭代器、生成器与协程
date: 2024-08-26 06:24:00
tags: 
    - 2024
    - Python
    - 编程语法
    - 程序设计
categories: 
    - Python
    - 程序设计
---

> **Python 的 `yield` 关键字** 是构建**生成器 (Generators)** 和**协程 (Coroutines)** 的核心。它将一个普通的函数转化成一个可以在多次调用之间“暂停”和“恢复”执行的特殊函数，从而实现惰性计算和并发编程的强大能力。理解 `yield` 的工作原理对于编写高性能、内存高效和并发的 Python 代码至关重要。

{% note info %}
**核心思想**：`yield` 使得函数不是一次性计算并返回所有结果，而是在每次被请求时（通过 `next()` 或 `for` 循环）“生产”一个结果并暂停，保存其状态，直到下一次被请求时从上次暂停的地方继续执行。这在处理大量数据流或需要非阻塞I/O时非常有优势。
{% endnote %}

## 一、为什么需要 `yield`？迭代器与内存效率的痛点

在处理序列数据时，我们通常会使用列表 (List)。然而，当数据量变得非常庞大时，将所有数据一次性加载到内存中会带来严重的问题：

*   **内存溢出 (Memory Exhaustion)**：如果数据量超过可用内存，程序会崩溃。
*   **性能下降**：即使内存足够，一次性处理大量数据也会导致程序启动缓慢，响应延迟。

考虑一个场景：需要处理一个包含数十亿行数据的日志文件。如果尝试将所有行读入一个列表：

```python
# 假设 large_log.txt 有数十亿行
def read_large_file_into_list(filepath):
    lines = []
    with open(filepath, 'r') as f:
        for line in f:
            lines.append(line)
    return lines

# 这可能会导致内存崩溃
# all_lines = read_large_file_into_list("large_log.txt")
```

理想情况下，我们只需要**按需 (on-demand)** 获取每一行数据，而不是一次性加载所有数据。这就是**迭代器 (Iterator)** 的用武之地。

### 1.1 迭代器 (`Iterator`)：按需获取，节约内存

迭代器是一种对象，它实现了迭代器协议：
*   `__iter__(self)` 方法：返回迭代器对象本身。
*   `__next__(self)` 方法：返回序列中的下一个元素。当没有更多元素时，抛出 `StopIteration` 异常。

`for` 循环内部，正是通过调用对象的 `__iter__` 和 `__next__` 方法来遍历可迭代对象的。

自定义一个迭代器：

```python
class MyRange:
    def __init__(self, start, end):
        self.current = start
        self.end = end

    def __iter__(self):
        return self

    def __next__(self):
        if self.current < self.end:
            num = self.current
            self.current += 1
            return num
        raise StopIteration

# 使用自定义迭代器
for i in MyRange(0, 5):
    print(i)
```

手动编写一个迭代器类虽然可行，但对于简单的逐个生产数据的需求来说，显得有些繁琐。`yield` 关键字正是为了更简洁地创建迭代器而出现的。

## 二、`yield` 的基本用法：创建生成器函数

当一个函数包含 `yield` 语句时，它将不再是普通函数，而是一个**生成器函数 (Generator Function)**。生成器函数被调用时，不会立即执行函数体内的代码，而是返回一个**生成器对象 (Generator Object)**。

生成器对象是**迭代器**的一种特殊形式，它实现了迭代器协议，你可以像使用其他迭代器一样对其进行迭代（例如，通过 `for` 循环或调用 `next()`）。

**示例：使用 `yield` 创建一个简单的生成器**

```python
def my_generator():
    print("Start of generator")
    yield 1
    print("After first yield")
    yield 2
    print("After second yield")
    yield 3
    print("End of generator")

# 调用生成器函数，返回一个生成器对象
gen = my_generator()
print("Generator object created, but not executed yet.")

# 第一次调用 next()
print("Calling next() for the first time:")
print(next(gen)) # 执行到第一个 yield 语句，返回 1，然后暂停

# 第二次调用 next()
print("Calling next() for the second time:")
print(next(gen)) # 从上次暂停的地方继续执行，到第二个 yield 语句，返回 2，然后暂停

# 第三次调用 next()
print("Calling next() for the third time:")
print(next(gen)) # 从上次暂停的地方继续执行，到第三个 yield 语句，返回 3，然后暂停

# 第四次调用 next()
print("Calling next() for the fourth time:")
try:
    print(next(gen)) # 函数执行完毕，抛出 StopIteration
except StopIteration:
    print("StopIteration caught!")

print("\n--- Using the generator in a for loop ---")
for num in my_generator(): # for 循环会自动调用 next() 并处理 StopIteration
    print(f"Received: {num}")
```

**输出分析**：
*   当 `my_generator()` 被调用时，函数体内的代码并没有立即执行，而是返回了一个生成器对象 `gen`。
*   每次调用 `next(gen)` 时，函数会从上次暂停的地方继续执行，直到遇到下一个 `yield` 语句，返回一个值，然后**再次暂停**，同时**保存其执行状态**（包括局部变量和指令指针）。
*   当函数执行完毕，或者在 `yield` 之后没有新的 `yield` 语句时，再次调用 `next()` 会抛出 `StopIteration` 异常，`for` 循环会自动捕获并终止迭代。

这种机制使得生成器非常适用于惰性计算和处理无限序列。

## 三、`yield` 的进阶用法：与 `send()` 和 `throw()` 交互

除了作为迭代器按需“生产”数据外，`yield` 还可以实现双向通信，从而将生成器升级为**协程 (Coroutines)**。

### 3.1 1. `generator.send(value)`

`send()` 方法允许你向暂停的生成器**发送 (send)** 一个值。这个值会成为上次 `yield` 表达式的返回值。

```python
def repeater_generator():
    received = yield "Ready to receive" # 第一个 yield 语句，也接收 send 的值
    while True:
        print(f"Generator received: {received}")
        received = yield f"Received '{received}', waiting for next."

gen = repeater_generator()

# 首次启动生成器，执行到第一个 yield
initial_msg = next(gen)
print(f"Initial Message: {initial_msg}") # Output: Initial Message: Ready to receive

# 发送第一个值
response_1 = gen.send("Hello")
# Output: Generator received: Hello
print(f"Generator Response 1: {response_1}") # Output: Generator Response 1: Received 'Hello', waiting for next.

# 发送第二个值
response_2 = gen.send("World")
# Output: Generator received: World
print(f"Generator Response 2: {response_2}") # Output: Generator Response 2: Received 'World', waiting for next.
```
**注意**：首次启动生成器必须使用 `next(gen)` 或 `gen.send(None)`。因为在生成器第一次 `yield` 之前，没有地方可以接收 `send()` 发送的值。

### 3.2 2. `generator.throw(type, value, traceback)`

`throw()` 方法用于向生成器内部注入一个异常。这个异常会在当前 `yield` 语句处抛出。

```python
def error_handling_generator():
    print("Generator started.")
    try:
        value = yield 1
        print(f"Generator received: {value}")
        value = yield 2
        print(f"Generator received: {value}")
    except ValueError as e:
        print(f"Generator caught ValueError: {e}")
    except TypeError as e:
        print(f"Generator caught TypeError: {e}")
    finally:
        print("Generator finished cleanup.")
    yield "Generator cleanup done." # 异常处理后也可以继续 yield

gen = error_handling_generator()
print(next(gen)) # Output: Generator started. \n 1

print("\n--- Throwing ValueError ---")
try:
    gen.throw(ValueError, "Simulated error!")
except StopIteration: # 如果生成器处理完异常并终止了，会捕获 StopIteration
    print("Generator naturally stopped after error.")
# Output: Generator caught ValueError: Simulated error!
# Output: Generator finished cleanup.
# 如果 Generator cleanup done. 也被 yield 了，这里会有一个 next() 来接收
# 否则就 StopIteration

# 再次尝试 next() 可能会引发 StopIteration (如果 generator 已经结束)
try:
    print(next(gen))
except StopIteration:
    print("Generator definitively stopped.")
```

### 3.3 3. `generator.close()`

`close()` 方法用于立即终止生成器，并在当前 `yield` 暂停处抛出 `GeneratorExit` 异常。如果生成器内部有 `finally` 块，它将执行清理代码，但不会产生任何新的值。

```python
def cleanup_generator():
    print("Generator started. Waiting for close.")
    try:
        yield 1
    finally:
        print("Generator cleanup on close.")
    print("This line will not be printed if closed early.")

gen = cleanup_generator()
print(next(gen)) # Output: Generator started. Waiting for close. \n 1

gen.close()
# Output: Generator cleanup on close.
print("Generator closed.")

try:
    next(gen)
except StopIteration:
    print("Generator is truly stopped.")
```

## 四、`yield from` 语句：委托给子生成器

`yield from` 语句 (Python 3.3 引入) 提供了一种将操作**委托 (delegate)** 给另一个生成器或可迭代对象的方式。它简化了生成器之间的链式调用，使得代码更简洁，并且能更好地处理异常和返回值。

**传统方式 (手动循环)：**

```python
def sub_generator(x):
    for i in range(x):
        yield i

def main_generator_old():
    yield "Starting main generator"
    for item in sub_generator(3): # 手动遍历子生成器
        yield item
    yield "Main generator finished"

for x in main_generator_old():
    print(x)
```

**使用 `yield from`：**

```python
def sub_generator(x):
    print(f"Sub-generator-{x} started.")
    for i in range(x):
        yield i
    print(f"Sub-generator-{x} ended.")
    return "Sub-gen finished value" # 子生成器可以有返回值！

def main_generator_new():
    yield "Starting main generator"
    # yield from 表达式会成为子生成器的返回值
    returned_value = yield from sub_generator(3)
    print(f"Main generator received from sub-gen: {returned_value}")
    yield "Main generator finished"

for x in main_generator_new():
    print(x)

```

**`yield from` 的优势**：

*   **简化代码**：替代了手动 `for ... yield ...` 循环。
*   **异常处理透明**：子生成器中的异常会直接传递给委托生成器，就好像它们在委托生成器中发生一样。
*   **返回值传递**：子生成器的 `return` 值 (通过 `StopIteration` 的 `value` 属性传递) 可以被委托生成器直接捕获，作为 `yield from` 表达式的值。这对于协程非常重要。
*   **协程链**：使得协程的异步编程模型更加强大和易于管理，例如在 `async/await` 之前的 `asyncio` 中广泛使用。

## 五、生成器与协程的联系与区别

*   **生成器 (Generators)**：主要用于按需生成数据序列，实现惰性计算，节约内存。它们是**生产者**。
*   **协程 (Coroutines)**：是生成器的推广，它们不仅能生产数据 (通过 `yield` 值)，还能消费数据 (通过 `send()` 接收值)。它们可以用于实现更复杂的异步和并发任务调度。在 Python 3.5 引入 `async/await` 语法糖之后，协程得到了更明确的定义和更广泛的应用。`async def` 定义的函数就是协程，其核心也是基于 `yield from`（在底层实现上）。

```mermaid
graph TD
    A[函数] --> B{是否包含 yield?}
    B -- Yes --> C[生成器 Generator]
    B -- No --> D[普通函数]

    C --> E{是否仅用于迭代?}
    E -- Yes --> F[简单的惰性序列生产者]
    E -- No --> G[协程 Coroutine]

    G -- 使用 send(), throw() --> H[实现双向通信和高级流控制]
    G -- Python 3.5+ --> I[async/await 语法糖]
    I --> J[异步编程框架 (如 asyncio)]
```

## 六、`yield` 的应用场景

1.  **处理大型数据集**：读取大文件、处理数据库查询结果集等，避免一次性加载所有数据到内存。
    ```python
    def read_lines_from_file(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                yield line.strip()

    for line in read_lines_from_file("large_data.csv"):
        # 处理每一行数据
        if "ERROR" in line:
            print(f"Found error: {line}")
    ```
2.  **无限序列**：生成斐波那契数列、素数序列等理论上无限的序列。
    ```python
    def fibonacci_sequence():
        a, b = 0, 1
        while True:
            yield a
            a, b = b, a + b

    fib_gen = fibonacci_sequence()
    for _ in range(10):
        print(next(fib_gen))
    ```
3.  **管道 (Pipelines)**：将多个生成器连接起来，形成数据处理管道。
    ```python
    def producer(n):
        for i in range(n):
            yield i

    def doubler(numbers):
        for num in numbers:
            yield num * 2

    def filter_even(numbers):
        for num in numbers:
            if num % 2 == 0:
                yield num

    # 管道：生成 -> 翻倍 -> 过滤偶数
    pipeline = filter_even(doubler(producer(10)))
    print(list(pipeline)) # Output: [0, 4, 8, 12, 16]
    ```
4.  **协程与异步编程**：在 `asyncio` 等异步框架中，`await` 关键字背后正是 `yield from` 的变体。它让协程可以暂停执行，等待一个 I/O 操作完成，而不是阻塞整个程序。
    ```python
    # 这是简化概念，async/await 是更高级的抽象
    async def fetch_data(url):
        print(f"Start fetching {url}")
        # 实际的 await 调用会暂停协程
        # result = await some_http_call(url)
        yield f"Partial data from {url}" # 假装是等待期间的 yield
        print(f"Finished fetching {url}")
        return f"Full data from {url}"

    # 在传统的 yield 结构中模拟，实际 async def 函数不会直接 yield 值
    def run_simple_async_example():
        coro = fetch_data("http://example.com")
        print(next(coro)) # 启动
        # 实际 await 发生后，会有事件循环调度
        # 这里为了演示，我们用 send 来模拟外部的完成通知
        try:
            coro.send("HTTP Response")
        except StopIteration as e:
            print(f"Coro returned: {e.value}")

    # run_simple_async_example()
    ```

## 七、总结

`yield` 关键字是 Python 中一个多功能且强大的工具，它将普通函数转化为生成器和协程，能够彻底改变你处理数据流和并发的方式。

*   **作为生成器**，它使你能够实现**惰性计算**，按需生成数据，从而显著优化内存使用和程序性能，尤其是在处理大规模数据集或无限序列时。
*   **作为协程**（结合 `send()`、`throw()` 和 `yield from`），它提供了**双向通信**的能力，是实现非阻塞 I/O 和高级并发模式（如 `asyncio`）的基础。

掌握 `yield` 不仅能够让你编写出更高效、更优雅的 Python 代码，也是理解现代 Python 异步编程范式的敲门砖。
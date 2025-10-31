---
title: PHP 惰性求值与生成器 (Generators) 详解
date: 2023-02-24 06:24:00
tags:
  - 2023
  - PHP
categories:
  - PHP
---

> **惰性求值 (Lazy Evaluation)** 是一种编程策略，它将表达式的计算延迟到真正需要其结果时才进行。在 PHP 中，实现惰性求值最主要的机制就是**生成器 (Generators)**。生成器允许开发者编写像迭代器一样遍历数据集合的函数，而无需将整个集合一次性加载到内存中。这对于处理大型数据集、无限序列或需要节省内存的场景至关重要。

{% note info %}
核心思想：**生成器通过 `yield` 关键字实现了惰性求值，它允许函数暂停执行并返回一个值，并在下次需要时从暂停的地方继续执行，从而按需生成数据，大幅减少内存占用。**
{% endnote %}
------

## 一、理解惰性求值 (Lazy Evaluation)

### 1.1 什么是惰性求值？

传统的“饥饿求值 (Eager Evaluation)”或“及早求值”模式下，当一个函数或表达式被调用时，其所有参数都会在函数体执行前被完全计算。例如：

```php
function sum(int $a, int $b): int {
    return $a + $b;
}
$result = sum(expensiveCalculationA(), expensiveCalculationB()); // 两个计算都会立即执行
```

而**惰性求值**则相反，它不会立即计算表达式的结果，而是返回一个“承诺”或“句柄”，只有当结果真正被使用时，才会触发实际的计算。

### 1.2 惰性求值的优势

1.  **内存效率**：对于大型数据集或无限序列，无需一次性将所有数据加载到内存中。数据按需生成，显著降低内存消耗。
2.  **性能提升**：避免了不必要的计算。如果某些数据最终没有被使用，那么生成它的开销就完全避免了。
3.  **处理无限序列**：可以轻松表示和处理无限序列（例如斐波那契数列、自然数序列），因为它们永远不会被完全生成。
4.  **更好的抽象**：允许将数据生成逻辑与数据消费逻辑分离，提高了代码的模块化。

### 1.3 PHP 中的惰性求值实现：生成器

在 PHP 中，生成器是实现惰性求值的核心机制。一个生成器函数看起来像普通函数，但它使用 `yield` 关键字而不是 `return` 关键字来返回值。当一个生成器函数被调用时，它不会立即执行函数体，而是返回一个 `Generator` 对象。只有当这个 `Generator` 对象被遍历时，函数体才会被逐步执行。

## 二、PHP 生成器 (Generators) 详解

### 2.1 如何创建生成器？

一个包含 `yield` 关键字的函数就是一个生成器函数。

```php
<?php

function myGenerator(): Generator
{
    echo "Generator started.\n";
    yield 1; // 暂停并返回 1
    echo "Generator resumed after yielding 1.\n";
    yield 2; // 暂停并返回 2
    echo "Generator resumed after yielding 2.\n";
    yield 3; // 暂停并返回 3
    echo "Generator finished.\n";
}

// 调用生成器函数不会立即执行其内部代码
$generator = myGenerator(); 
echo "Generator function called, but not executed yet.\n";

// 遍历生成器会触发其内部代码的逐步执行
foreach ($generator as $value) {
    echo "Received value: " . $value . "\n";
}

echo "Loop finished.\n";
?>
```

**输出：**

```
Generator function called, but not executed yet.
Generator started.
Received value: 1
Generator resumed after yielding 1.
Received value: 2
Generator resumed after yielding 2.
Received value: 3
Generator finished.
Loop finished.
```

从输出可以看出：
1.  调用 `myGenerator()` 返回了一个 `Generator` 对象，但函数体并没有执行。
2.  `foreach` 循环开始时，`myGenerator()` 的函数体才开始执行，直到第一个 `yield` 语句。
3.  每次循环获取下一个值时，生成器从上次 `yield` 暂停的地方继续执行。

### 2.2 `yield` 关键字

`yield` 关键字是生成器的核心。它有两个主要作用：

1.  **暂停执行并返回值**：当生成器遇到 `yield value;` 时，它会暂停当前函数的执行，并将 `value` 返回给调用者。
2.  **保存状态**：生成器在暂停时会保存其内部状态（包括局部变量、参数和当前执行位置），以便下次从中断点继续执行。

`yield` 也可以带有键值对，例如 `yield $key => $value;`。

```php
function keyValueGenerator(): Generator
{
    yield 'a' => 10;
    yield 'b' => 20;
}

foreach (keyValueGenerator() as $key => $value) {
    echo "Key: {$key}, Value: {$value}\n";
}
```

### 2.3 `Generator` 对象的方法

当调用生成器函数时，它返回一个 `Generator` 类的实例，该类实现了 `Iterator` 接口，因此可以直接在 `foreach` 循环中使用。此外，它还提供了一些额外的方法：

*   **`current(): mixed`**：返回当前 `yield` 的值。
*   **`key(): mixed`**：返回当前 `yield` 的键。
*   **`next(): void`**：恢复生成器的执行，直到下一个 `yield` 或函数结束。
*   **`valid(): bool`**：检查生成器是否还有更多值可生成。
*   **`rewind(): void`**：将生成器倒回到起始位置。**注意：大多数生成器只能被遍历一次。尝试对已完成的生成器 `rewind()` 通常会导致错误。**
*   **`send(mixed $value): mixed`**：向生成器内部发送一个值，该值将作为 `yield` 表达式的结果。
*   **`throw(Throwable $exception): mixed`**：在生成器暂停的地方抛出一个异常。
*   **`getReturn(): mixed`**：在生成器完成执行（即没有更多的 `yield` 且函数正常结束）后，获取生成器函数中的 `return` 语句返回的值。

### 2.4 `send()` 方法：双向通信

`send()` 方法允许向生成器内部发送数据，实现生成器与外部的双向通信。`send()` 传递的值会成为生成器内部 `yield` 表达式的返回值。

```php
function talkativeGenerator(): Generator
{
    $input = yield "Please enter your name: "; // 暂停并返回提示
    echo "Generator received: " . $input . "\n"; // 从这里恢复，并接收到外部发送的值
  
    $age = yield "Please enter your age: ";
    echo "Generator received age: " . $age . "\n";
  
    return "Goodbye!";
}

$generator = talkativeGenerator();

// 第一次 next() 或 current() 会执行到第一个 yield
echo $generator->current(); // 输出: Please enter your name: 

// 向生成器发送值 "Alice"，它会成为 `yield "..."` 表达式的结果
$generator->send("Alice"); // 这里是 next() 和 send() 的结合，会执行到下一个 yield
echo $generator->current(); // 输出: Please enter your age: 

// 再次发送值
$generator->send(30);

// 生成器已完成，获取返回值
echo "Generator finished with: " . $generator->getReturn() . "\n";
```

**输出：**

```
Please enter your name: Generator received: Alice
Please enter your age: Generator received age: 30
Generator finished with: Goodbye!
```

### 2.5 `yield from` 表达式 (PHP 7.0+)

`yield from` 表达式允许将一个生成器（或任何 `Traversable` 对象）委托给另一个生成器。它会遍历委托的生成器，并将其所有值直接 `yield` 出来。

```php
function innerGenerator(): Generator
{
    yield 'a';
    yield 'b';
    return 'Inner done!'; // PHP 7.0+ 才能获取生成器的返回值
}

function outerGenerator(): Generator
{
    yield 1;
    $returnValue = yield from innerGenerator(); // 委托给 innerGenerator
    echo "Inner generator returned: " . $returnValue . "\n";
    yield 2;
}

foreach (outerGenerator() as $value) {
    echo "Outer generator yielded: " . $value . "\n";
}
// 在PHP 7.0+中，可以获取到 outerGenerator 的最终返回值 (如果它有)
// var_dump($outerGenerator->getReturn());
```

**输出：**

```
Outer generator yielded: 1
Outer generator yielded: a
Outer generator yielded: b
Inner generator returned: Inner done!
Outer generator yielded: 2
```

`yield from` 使得组合多个生成器变得非常方便，可以构建更复杂的迭代逻辑。

## 三、生成器的应用场景

### 3.1 处理大型文件

这是生成器最经典的用例。一次性读取大文件会导致内存溢出，而生成器可以逐行读取和处理。

```php
function readLargeFile(string $filePath): Generator
{
    $handle = fopen($filePath, 'r');
    if (!$handle) {
        throw new Exception("Could not open file: {$filePath}");
    }
    while (!feof($handle)) {
        yield fgets($handle); // 逐行读取
    }
    fclose($handle);
}

// 假设有一个名为 large_data.txt 的大文件
$filePath = 'large_data.txt'; 
// 创建一个文件用于测试
file_put_contents($filePath, implode("\n", array_map(fn($i) => "Line " . $i, range(1, 100000))));

$startTime = microtime(true);
$memoryUsage = memory_get_usage();

foreach (readLargeFile($filePath) as $line) {
    // 处理每一行数据，例如打印或计数
    // echo $line;
}

echo "Memory usage after processing (MB): " . (memory_get_usage() - $memoryUsage) / (1024 * 1024) . "\n";
echo "Peak memory usage (MB): " . (memory_get_peak_usage() / (1024 * 1024)) . "\n";
echo "Time taken (s): " . (microtime(true) - $startTime) . "\n";

unlink($filePath); // 清理测试文件
```

**对比不使用生成器的情况：**

```php
// 不使用生成器读取大文件 (可能导致内存溢出)
function readLargeFileNonGenerator(string $filePath): array
{
    return file($filePath); // 一次性读取所有行到数组
}

// $lines = readLargeFileNonGenerator($filePath); // 可能会内存溢出
```

### 3.2 数据库查询

当从数据库查询大量记录时，ORM 框架通常会一次性将所有结果封装成对象数组，这同样会占用大量内存。许多 ORM 框架（如 Laravel 的 Eloquent）提供了 `cursor()` 方法，其底层就是使用生成器。

```php
// 假设有一个 PDO 连接
function fetchLargeResults(PDO $pdo, string $query): Generator
{
    $stmt = $pdo->query($query);
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        yield $row;
    }
}

// 示例用法
// $pdo = new PDO(...);
// foreach (fetchLargeResults($pdo, 'SELECT * FROM very_large_table') as $row) {
//     // 处理每一行数据
// }
```

### 3.3 无限序列生成

生成器可以非常方便地创建无限序列，例如斐波那契数列、自然数序列等。

```php
function fibonacciSequence(): Generator
{
    $a = 0;
    $b = 1;
    while (true) {
        yield $a;
        [$a, $b] = [$b, $a + $b];
    }
}

$fib = fibonacciSequence();
for ($i = 0; $i < 10; $i++) {
    echo $fib->current() . " ";
    $fib->next();
}
echo "\n"; // 输出: 0 1 1 2 3 5 8 13 21 34
```

### 3.4 任务调度/协程 (PHP 5.5 - PHP 8.1)

在 PHP 8.1 引入 Fibers 之前，生成器是 PHP 中实现用户空间协程和任务调度的主要方式。通过一个外部调度器，可以 `send()` 值给生成器并 `next()` 它，模拟上下文切换。虽然现在有了更原生的 Fibers，但理解生成器在此方面的应用有助于理解历史和复杂框架的实现。

```php
// 这是一个非常简化的协程调度器示例
// 实际的 ReactPHP/Amphp 会更复杂
function taskA(): Generator {
    echo "Task A started.\n";
    $data = yield 'Waiting for data from A'; // 暂停，等待外部发送数据
    echo "Task A received: " . $data . "\n";
    yield 'Task A finished';
}

function taskB(): Generator {
    echo "Task B started.\n";
    yield 'Waiting for data from B';
    yield 'Task B finished';
}

$tasks = [taskA(), taskB()];

while (!empty($tasks)) {
    foreach ($tasks as $i => $task) {
        $task->next(); // 推动任务执行
        if ($task->valid()) {
            echo "Scheduler received from task {$i}: " . $task->current() . "\n";
            if ($task === $tasks[0] && $task->current() === 'Waiting for data from A') {
                $tasks[0]->send('Hello from Scheduler!'); // 向 Task A 发送数据
            }
        } else {
            // 任务完成
            echo "Task {$i} completed.\n";
            unset($tasks[$i]);
        }
    }
}
```

## 四、总结

PHP 生成器是实现惰性求值和优化内存使用的强大工具。通过 `yield` 关键字，它们允许函数暂停执行、按需生成数据并保存内部状态，从而避免一次性加载所有数据到内存。这在处理大型文件、数据库查询结果、无限序列以及在 PHP 8.1 之前构建协程时都发挥了关键作用。

理解并熟练使用生成器，对于编写高性能、内存高效的 PHP 应用程序至关重要。
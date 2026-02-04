---
title: Golang sync.OnceValue 详解
date: 2025-12-26 06:24:00
tags:
  - 2025
  - Golang
  - 程序设计
categories:
  - Golang
  - 程序设计
---

> `sync.OnceValue` 是 Go 语言 `sync` 包在 Go 1.21 版本中引入的一个并发原语，旨在简化并发环境中**值的惰性初始化 (Lazy Initialization)** 过程。它确保一个特定函数只被执行一次，并将其返回值缓存起来，供后续所有调用方直接使用，而无需重复计算。这解决了在多个 goroutine 同时尝试获取一个昂贵计算结果时可能出现的竞态条件和重复计算问题。

{% note info %}
核心思想：确保一个值的计算函数在并发环境下只被“安全地”执行一次，并永久缓存其结果。
{% endnote %}

------

## 一、为什么需要 `sync.OnceValue`？

在 Go 并发编程中，我们经常遇到需要对一个昂贵资源（如数据库连接、配置文件解析结果、全局缓存对象等）进行初始化，并且这个初始化操作必须满足以下条件：

1.  **惰性初始化 (Lazy Initialization)**：只有当资源真正被需要时才进行初始化，避免不必要的开销。
2.  **单次初始化 (Single Initialization)**：无论多少个 goroutine 同时或先后尝试初始化，该操作都只能成功执行一次。
3.  **结果共享 (Result Sharing)**：所有后续的调用方都应获取到首次成功初始化后的相同结果。
4.  **并发安全 (Concurrency Safety)**：初始化过程必须是线程安全的，避免竞态条件。

在 `sync.OnceValue` 出现之前，Go 开发者通常使用 `sync.Once` 配合一个全局变量来实现这一目标。虽然 `sync.Once` 能确保一个函数只执行一次，但获取其结果需要额外的代码来存储和返回。`sync.OnceValue` 旨在以更简洁、更类型安全的方式解决此类问题。

## 二、关键概念

### 2.1 惰性初始化 (Lazy Initialization)

**定义**：指延迟对象的创建或计算，直到第一次需要它时才执行。这有助于减少程序的启动时间、内存占用或不必要的计算开销。

### 2.2 `sync.Once`

`sync.Once` 是 Go 语言中用于执行一次操作的并发原语。它有一个 `Do` 方法，接收一个 `func()` 类型的函数作为参数。无论 `Do` 被调用多少次，传入的函数都只会被执行一次。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

var (
	once      sync.Once
	configVal string // 存储昂贵操作的结果
)

func expensiveConfigLoader() {
	fmt.Println("Loading configuration (this should only happen once)...")
	time.Sleep(1 * time.Second) // Simulate expensive I/O
	configVal = "Loaded Configuration Data"
}

func getConfigWithOnce() string {
	once.Do(expensiveConfigLoader) // 确保 expensiveConfigLoader 只执行一次
	return configVal
}

func main() {
	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			fmt.Printf("Goroutine %d trying to get config...\n", id)
			val := getConfigWithOnce()
			fmt.Printf("Goroutine %d got config: %s\n", id, val)
		}(i)
	}
	wg.Wait()
}
```

上述示例中，`sync.Once` 确保 `expensiveConfigLoader` 只执行一次。但为了获取其返回的值（虽然这里是副作用，通过修改 `configVal` 实现），需要额外的全局变量 `configVal` 来存储结果。

## 三、`sync.OnceValue` 的工作原理

`sync.OnceValue` 的设计目标是简化 `sync.Once` 模式中“执行一次并返回一个值”的场景。

### 3.1 类型签名

`sync.OnceValue`（以及 `sync.OnceValues`）是泛型函数，其定义如下：

```go
// OnceValue returns a function that will return the result of the first successful call to f.
// If f panics, the panic is re-raised on all subsequent calls to the returned function.
func OnceValue[T any](f func() T) func() T

// OnceValues returns a function that will return the results of the first successful call to f.
// If f panics, the panic is re-raised on all subsequent calls to the returned function.
func OnceValues[T1, T2 any](f func() (T1, T2)) func() (T1, T2)
// ... 也支持更多返回值的 OnceValues
```

-   `OnceValue[T any](f func() T) func() T`：接收一个 `func() T` 类型的函数 `f`，并返回一个同样是 `func() T` 类型的函数。
-   `OnceValues` （针对多返回值情况）类似。

### 3.2 内部机制

`sync.OnceValue` 内部仍然基于 `sync.Once` 的机制，并额外处理了值的存储和 panic 场景：

1.  `sync.OnceValue` 被调用时，它会创建一个闭包，这个闭包包含了 `sync.Once` 实例、缓存结果的变量 `val`，以及用于处理 panic 的状态变量。
2.  当你调用 `OnceValue` 返回的函数时：
    *   它首先会检查内部的 `sync.Once` 实例是否已执行。
    *   如果未执行，唯一的 goroutine 会执行传入的 `f` 函数。
    *   执行 `f` 函数时，会使用 `defer` 和 `recover` 来捕获 `f` 可能产生的 panic。
    *   如果 `f` 成功执行，其结果会被存储到闭包中的 `val` 变量。
    *   如果 `f` 发生 panic，`panicVal` 和 `didPanic` 状态会被记录下来。
    *   无论 `f` 是否成功执行，`sync.Once` 都会标记为已完成。
3.  后续所有调用 `OnceValue` 返回的函数时：
    *   因为 `sync.Once` 已经标记为已完成，`f` 不会再被执行。
    *   如果第一次执行 `f` 成功，将直接返回之前缓存的 `val`。
    *   如果第一次执行 `f` 发生了 panic，后续调用会重新 `panic` 相同的 `panicVal`。

其核心思想可以简化为如下伪代码：

```go
// 概念性伪代码，非 Go 实际实现
func OnceValue[T any](f func() T) func() T {
    var (
        o        sync.Once
        val      T
        didPanic bool
        panicVal interface{}
    )
    return func() T {
        o.Do(func() {
            defer func() {
                if r := recover(); r != nil {
                    didPanic = true
                    panicVal = r
                }
            }()
            val = f() // 第一次调用时执行 f()，并将结果存入 val
        })
        if didPanic {
            // 如果 f() 第一次执行时 panic，后续调用也会 panic 相同的值
            panic(panicVal)
        }
        return val // 否则返回缓存的值
    }
}
```

## 四、`sync.OnceValue` 的使用示例

假设我们有一个昂贵的资源初始化函数，例如加载一个大型配置对象：

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// GlobalConfig 代表一个大型配置对象
type GlobalConfig struct {
	LogLevel string
	MaxConns int
	// ... 更多配置字段
}

// loadExpensiveConfig 模拟一个昂贵且耗时的配置加载过程
func loadExpensiveConfig() *GlobalConfig {
	fmt.Println(">>> Starting expensive config loading...")
	time.Sleep(2 * time.Second) // 模拟网络请求、磁盘IO等
	config := &GlobalConfig{
		LogLevel: "INFO",
		MaxConns: 100,
	}
	fmt.Println("<<< Expensive config loaded.")
	return config
}

// GetGlobalConfig 是我们导出的函数，用于获取全局配置。
// 它使用了 sync.OnceValue 确保 loadExpensiveConfig 只被调用一次。
var GetGlobalConfig = sync.OnceValue(loadExpensiveConfig)

func main() {
	var wg sync.WaitGroup
	fmt.Println("Application started. Multiple goroutines will try to access config.")

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			fmt.Printf("[Goroutine %d] Requesting global config...\n", id)
			config := GetGlobalConfig() // 调用 OnceValue 返回的函数
			fmt.Printf("[Goroutine %d] Got config: LogLevel=%s, MaxConns=%d\n", id, config.LogLevel, config.MaxConns)
		}(i)
	}

	wg.Wait()
	fmt.Println("All goroutines finished.")

	// 再次调用，确认不会重新加载
	fmt.Println("\nMain goroutine requesting config again (should be instant)...")
	config := GetGlobalConfig()
	fmt.Printf("Main goroutine got config: LogLevel=%s, MaxConns=%d\n", config.LogLevel, config.MaxConns)
}
```

**运行结果预期：**

```
Application started. Multiple goroutines will try to access config.
[Goroutine 0] Requesting global config...
[Goroutine 1] Requesting global config...
[Goroutine 2] Requesting global config...
[Goroutine 3] Requesting global config...
[Goroutine 4] Requesting global config...
>>> Starting expensive config loading...
<<< Expensive config loaded.
[Goroutine 0] Got config: LogLevel=INFO, MaxConns=100
[Goroutine 3] Got config: LogLevel=INFO, MaxConns=100
[Goroutine 4] Got config: LogLevel=INFO, MaxConns=100
[Goroutine 1] Got config: LogLevel=INFO, MaxConns=100
[Goroutine 2] Got config: LogLevel=INFO, MaxConns=100
All goroutines finished.

Main goroutine requesting config again (should be instant)...
Main goroutine got config: LogLevel=INFO, MaxConns=100
```
正如所见，`loadExpensiveConfig` 函数只被执行了一次，即使有多个 goroutine 同时尝试获取配置。首次请求可能会有延迟（2秒），但后续所有请求都会立即返回缓存的结果。

### 4.1 处理 panic 情况

如果 `loadExpensiveConfig` 首次执行时发生 panic，那么后续所有调用 `GetGlobalConfig()` 都会重新 panic 相同的值。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// panicConfigLoader 模拟一个在加载时会 panic 的函数
func panicConfigLoader() *GlobalConfig {
	fmt.Println(">>> Starting config loading that will panic...")
	time.Sleep(1 * time.Second)
	panic("Failed to load critical configuration!") // 模拟配置错误导致 panic
}

var GetPanicConfig = sync.OnceValue(panicConfigLoader)

func main() {
	var wg sync.WaitGroup

	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			// 使用 defer recover 来捕获 panic，否则程序会直接崩溃
			defer func() {
				if r := recover(); r != nil {
					fmt.Printf("[Goroutine %d] Caught panic: %v\n", id, r)
				}
			}()
			fmt.Printf("[Goroutine %d] Requesting config...\n", id)
			_ = GetPanicConfig() // 尝试获取配置，这将导致 panic
			fmt.Printf("[Goroutine %d] Should not reach here.\n", id)
		}(i)
	}
	wg.Wait()
	fmt.Println("All goroutines finished.")
}
```

**运行结果预期：**
```
[Goroutine 0] Requesting config...
[Goroutine 1] Requesting config...
[Goroutine 2] Requesting config...
>>> Starting config loading that will panic...
[Goroutine 1] Caught panic: Failed to load critical configuration!
[Goroutine 2] Caught panic: Failed to load critical configuration!
[Goroutine 0] Caught panic: Failed to load critical configuration!
All goroutines finished.
```
可以看到，`panicConfigLoader` 同样只被执行了一次，但其 `panic` 结果被缓存，并在所有后续调用时重新抛出。这保证了行为的一致性，即首次失败（panic）会一直导致失败。

## 五、`sync.OnceValue` 的优势与劣势

### 5.1 优势

1.  **代码简洁性 (Conciseness)**：显著减少了使用 `sync.Once` 来获取值的样板代码，不再需要额外的变量来存储结果。
2.  **类型安全 (Type Safety)**：通过泛型 (`[T any]`) 确保了返回值类型的正确性。
3.  **并发安全 (Concurrency Safety)**：内置并发控制，确保昂贵函数只在第一次被请求时执行一次。
4.  **惰性初始化 (Lazy Initialization)**：直到第一次调用返回函数时才执行初始化逻辑。
5.  **结果一致性 (Result Consistency)**：无论是成功返回还是 panic，所有调用方都将得到相同的结果（或重新 panic 相同的值）。

### 5.2 劣势

1.  **Go 版本要求**：需要 Go 1.21 或更高版本。
2.  **Panic 传播**：如果初始化函数 `f` 发生 panic，那么 `OnceValue` 返回的函数在后续调用时也会重新 panic。这意味着调用方必须在外部处理这个 panic（通常通过 `defer recover()`）。如果 `f` 中包含了错误返回（例如 `func() (T, error)`），则不能直接使用 `OnceValue`，而需要使用 `sync.OnceValues`。
3.  **单值限制**：`sync.OnceValue` 仅适用于返回单个值的函数。如果需要返回多个值（例如 `(T, error)`），则应使用 `sync.OnceValues`。然而，在处理 `(T, error)` 组合时，`OnceValues` 的行为是缓存 `error`，这意味着一旦初始化函数返回一个错误，所有后续调用都会返回相同的错误，这可能不总是期望的行为（例如，如果你希望在第一次尝试失败后重试）。在这种情况下，你可能需要自定义逻辑或继续使用 `sync.Once`。

## 六、总结

`sync.OnceValue` 是 Go 语言在并发编程中进行**值惰性、单次初始化**的强大工具。它通过引入泛型和内部缓存机制，极大地简化了之前需要 `sync.Once` 和额外变量共同完成的模式。在你的应用程序中需要安全地、高效地初始化并共享一个昂贵计算结果时，`sync.OnceValue` 是一个值得优先考虑的选择。然而，在使用时也需注意其 panic 传播行为，并在必要时结合 `sync.OnceValues` 或更传统的 `sync.Once` 模式来自定义错误处理逻辑。
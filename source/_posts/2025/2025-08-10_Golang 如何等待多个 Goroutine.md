---
title: Golang 如何等待多个 Goroutine
date: 2025-08-10 06:24:00
tags: 
    - 2025
    - Golang
    - goroutine
categories: 
    - Golang
    - goroutine
---

> **Goroutine** 是 Go 语言轻量级并发的核心，它使得在程序中同时运行多个任务变得简单高效。然而，当启动多个 Goroutine 后，主程序或管理 Goroutine 常常需要知道这些并发任务何时完成，或者需要等待它们全部完成后再继续执行。这种“等待 Goroutine 完成”的机制是并发编程中至关重要的一环，确保了程序的正确性、资源的有序释放以及结果的汇总。

{% note info %}
核心思想：**管理 Goroutine 的生命周期是并发编程的关键。Go 提供了 `sync.WaitGroup`、`Channels` 以及 `context.Context` 结合 `errgroup.Group` 等多种机制，以适应不同复杂度和需求的 Goroutine 等待场景。**
{% endnote %}
------

## 一、为什么需要等待 Goroutine？

在 Go 语言中，`main` 函数的 Goroutine 启动后，即使它退出了，其他未完成的 Goroutine 也会继续运行。但通常情况下，我们希望：

1.  **确保任务完成**：等待所有子 Goroutine 完成计算、I/O 操作或数据处理，以避免数据丢失或不完整。
2.  **结果汇总**：在所有 Goroutine 产生结果后，将它们汇总或进行后续处理。
3.  **资源清理**：在所有 Goroutine 都完成其工作后，再进行资源的释放（如关闭文件句柄、数据库连接等）。
4.  **避免主 Goroutine 过早退出**：如果主 Goroutine 过早退出，可能导致子 Goroutine 未能执行完毕就被强制终止。

为了实现这些目标，Go 提供了以下几种主要机制来等待多个 Goroutine。

## 二、使用 `sync.WaitGroup` (最常用且简洁)

`sync.WaitGroup` 是 Go 语言标准库 `sync` 包中提供的一种同步原语，用于等待一组 Goroutine 完成。它维护一个内部计数器：

*   **`Add(delta int)`**：增加或减少计数器的值。通常在启动 Goroutine 之前调用 `Add(1)`。
*   **`Done()`**：减少计数器。通常在 Goroutine 完成其任务后调用 `defer wg.Done()`。
*   **`Wait()`**：阻塞当前 Goroutine，直到计数器归零。

**工作流程**：

{% mermaid %}
sequenceDiagram
    participant Main as 主 Goroutine
    participant Worker1 as 工作 Goroutine 1
    participant Worker2 as 工作 Goroutine 2
    participant WaitGroup as WaitGroup

    Main->>WaitGroup: Add(1)
    Main->>Worker1: go Worker1()
    Main->>WaitGroup: Add(1)
    Main->>Worker2: go Worker2()

    Worker1->>Worker1: 执行任务...
    Worker2->>Worker2: 执行任务...

    Worker1->>WaitGroup: Done()
    Worker2->>WaitGroup: Done()

    Main->>WaitGroup: Wait()
    Note over WaitGroup,Main: 计数器归零，Main Goroutine 继续执行
    Main->>Main: 所有工作完成，继续后续操作
{% endmermaid %}

**代码示例**：

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func worker(id int, wg *sync.WaitGroup) {
	// 在 Goroutine 完成时调用 wg.Done() 减少计数器
	defer wg.Done() 

	fmt.Printf("Worker %d: 开始执行任务。\n", id)
	time.Sleep(time.Duration(id) * 500 * time.Millisecond) // 模拟不同耗时
	fmt.Printf("Worker %d: 任务完成。\n", id)
}

func main() {
	var wg sync.WaitGroup // 声明一个 WaitGroup

	numWorkers := 5
	for i := 1; i <= numWorkers; i++ {
		wg.Add(1) // 启动一个 Goroutine 前，计数器加 1
		go worker(i, &wg)
	}

	// 阻塞主 Goroutine，直到所有 Goroutine 都调用了 Done()
	fmt.Println("Main: 等待所有 Worker 完成...")
	wg.Wait() 
	fmt.Println("Main: 所有 Worker 都已完成，程序结束。")
}
```

**优点**：
*   **简单直观**：API 设计简洁明了，易于理解和使用。
*   **资源效率高**：`WaitGroup` 本身开销很小。
*   **适用于“N 个任务完成”场景**：非常适合等待一组已知数量的 Goroutine 完成。

**缺点**：
*   **无法获取返回值**：`WaitGroup` 只能用于等待完成，不能直接传递 Goroutine 的执行结果或错误。
*   **无法取消**：一旦 `Add` 计数器增加，就没有直接的方式在外部取消等待。
*   **不适合复杂协调**：对于 Goroutine 之间需要更复杂通信或数据传递的场景，`WaitGroup` 就显得力不从心。

## 三、使用 Channels (灵活的通信与等待)

Channel 是 Go 语言并发编程的基石，它不仅用于 Goroutine 之间的数据传递，也可以作为同步信号。我们可以利用 Channel 的阻塞特性来等待一个或多个 Goroutine 完成。

### 3.1 方案一：每个 Goroutine 发送信号到同一个 Channel

让每个工作 Goroutine 完成后向一个共享的 Channel 发送一个信号，主 Goroutine 则接收 N 次信号来等待。

**代码示例**：

```go
package main

import (
	"fmt"
	"time"
)

func workerWithChannel(id int, done chan<- bool, results chan<- string) {
	fmt.Printf("Worker %d: 开始执行任务。\n", id)
	time.Sleep(time.Duration(id) * 500 * time.Millisecond) // 模拟不同耗时

	result := fmt.Sprintf("Worker %d 完成并返回结果。", id)
	results <- result // 将结果发送到结果 Channel
	done <- true       // 发送完成信号
	fmt.Printf("Worker %d: 任务完成。\n", id)
}

func main() {
	numWorkers := 5
	done := make(chan bool, numWorkers) // 缓冲 Channel 存放完成信号
	results := make(chan string, numWorkers) // 缓冲 Channel 存放结果

	for i := 1; i <= numWorkers; i++ {
		go workerWithChannel(i, done, results)
	}

	// 主 Goroutine 收集所有结果
	allResults := make([]string, 0, numWorkers)
	for i := 0; i < numWorkers; i++ {
		res := <-results // 接收结果
		allResults = append(allResults, res)
	}
	close(results) // 结果收集完毕，可以关闭 results channel

	// 主 Goroutine 等待所有完成信号
	// 也可以只接收 N 次 done 信号，因为 results 已经隐含了完成
	for i := 0; i < numWorkers; i++ {
		<-done // 接收完成信号
	}
	close(done) // 所有信号接收完毕，可以关闭 done channel

	fmt.Println("\nMain: 所有 Worker 都已完成。")
	fmt.Println("Main: 汇总结果:")
	for _, r := range allResults {
		fmt.Println(r)
	}
}
```

**优点**：
*   **灵活**：可以方便地传递 Goroutine 的执行结果或错误。
*   **天然支持数据流**：符合 Go 的 CSP 哲学，通过通信共享内存。

**缺点**：
*   **需要循环接收**：主 Goroutine 需要一个循环来接收所有信号，如果 Goroutine 数量很多，代码可能稍显冗长。
*   **管理复杂度略高**：需要创建和管理 Channel，并注意 Channel 的关闭时机（如果需要）。

### 3.2 方案二：单个 Goroutine 关闭 Channel 作为信号 (适用于简单信号)

如果不需要传递数据，只需要一个“所有都完成”的信号，可以在一个 Goroutine 中等待所有其他 Goroutine 完成（例如使用 `WaitGroup`），然后关闭一个 Channel，主 Goroutine 通过 `range` 或 `<-channel` 接收关闭信号。

**代码示例**：

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func simpleWorker(id int, wg *sync.WaitGroup) {
	defer wg.Done()
	fmt.Printf("Simple Worker %d: 开始...\n", id)
	time.Sleep(time.Duration(id) * 200 * time.Millisecond)
	fmt.Printf("Simple Worker %d: 完成。\n", id)
}

func main() {
	var wg sync.WaitGroup
	doneSignal := make(chan struct{}) // 使用空结构体作为信号，不传递数据

	numWorkers := 3
	for i := 1; i <= numWorkers; i++ {
		wg.Add(1)
		go simpleWorker(i, &wg)
	}

	// 启动一个 Goroutine 来等待所有 worker 完成，然后关闭 doneSignal
	go func() {
		wg.Wait()
		close(doneSignal) // 所有 worker 完成后，关闭 channel 发送信号
	}()

	fmt.Println("Main: 等待所有 Simple Worker 完成...")
	<-doneSignal // 主 Goroutine 阻塞，直到 doneSignal 被关闭
	fmt.Println("Main: 所有 Simple Worker 都已完成，程序结束。")
}
```

**优点**：
*   **简洁**：当只需要一个“完成”信号时，`<-channel` 阻塞直到 Channel 关闭是简洁的。
*   **结合 `WaitGroup` 优势**：利用 `WaitGroup` 管理 Goroutine 组，再用 Channel 进行最终信号传递。

**缺点**：
*   **间接性**：为了发送一个完成信号，额外启动了一个 Goroutine。
*   **无法直接传递数据**：主要用于信号通知。

## 三、使用 `context.Context` 和 `errgroup.Group` (结构化并发与错误处理)

对于更复杂的场景，特别是涉及错误处理、取消和结构化 Goroutine 组时，`golang.org/x/sync/errgroup` 包是一个非常强大的工具。它结合了 `sync.WaitGroup` 和 `context.Context` 的功能。

*   **`errgroup.Group`**：充当 `WaitGroup`，等待所有 `Go` 方法启动的 Goroutine 完成。
*   **`context.Context`**：提供取消机制。如果任何一个 Goroutine 返回错误，`Group` 会自动取消其关联的 `Context`，从而通知其他 Goroutine 停止工作。

**工作流程**：

{% mermaid %}
sequenceDiagram
    participant Main as 主 Goroutine
    participant ErrGroup as errgroup.Group
    participant Worker1 as 工作 Goroutine 1
    participant Worker2 as 工作 Goroutine 2
    participant Worker3 as 工作 Goroutine 3

    Main->>ErrGroup: g, ctx := WithContext(background)
    Main->>Worker1: g.Go(func(){...})
    Main->>Worker2: g.Go(func(){...})
    Main->>Worker3: g.Go(func(){...})

    Worker1->>Worker1: 执行任务...
    Worker2->>Worker2: 执行任务... (可能出错)
    Worker3->>Worker3: 执行任务...

    alt Worker2 返回错误
        Worker2->>ErrGroup: return error
        ErrGroup->>Main: 设置错误
        ErrGroup->>Worker1: ctx.Done() 发送取消信号
        ErrGroup->>Worker3: ctx.Done() 发送取消信号
        Worker1->>Worker1: 收到取消，优雅退出
        Worker3->>Worker3: 收到取消，优雅退出
    else 所有 Worker 成功
        Worker1->>ErrGroup: return nil
        Worker2->>ErrGroup: return nil
        Worker3->>ErrGroup: return nil
    end

    Main->>ErrGroup: err := g.Wait()
    Note over ErrGroup,Main: 如果有错误则返回第一个错误，否则返回 nil
    Main->>Main: 根据 err 进行后续处理
{% endmermaid %}

**代码示例**：

```go
package main

import (
	"context"
	"fmt"
	"time"

	"golang.org/x/sync/errgroup" // 需要 go get golang.org/x/sync
)

func task(ctx context.Context, id int, simulateError bool) error {
	select {
	case <-time.After(time.Duration(id) * 300 * time.Millisecond):
		// 模拟正常工作
		if simulateError && id == 2 {
			fmt.Printf("Task %d: 模拟失败并返回错误。\n", id)
			return fmt.Errorf("任务 %d 出现特定错误", id)
		}
		fmt.Printf("Task %d: 完成。\n", id)
		return nil
	case <-ctx.Done(): // 监听取消信号
		fmt.Printf("Task %d: 收到取消信号，优雅退出。\n", id)
		return ctx.Err() // 返回 context.Canceled 错误
	}
}

func main() {
	// 创建一个 errgroup，它会自动创建并管理一个可取消的 Context
	g, ctx := errgroup.WithContext(context.Background())

	// 启动多个 Goroutine
	numTasks := 3
	for i := 1; i <= numTasks; i++ {
		id := i
		// g.Go() 方法接收一个 func() error 函数作为参数
		g.Go(func() error {
			// 假设我们让 ID 为 2 的任务模拟失败
			return task(ctx, id, true) 
		})
	}

	fmt.Println("Main: 等待所有任务完成或第一个错误...")
	// 等待所有 Goroutine 完成。如果任何一个 Goroutine 返回错误，
	// g.Wait() 会立即返回该错误，并取消所有其他 Goroutine 的 Context。
	if err := g.Wait(); err != nil {
		fmt.Printf("Main: 检测到错误: %v\n", err)
	} else {
		fmt.Println("Main: 所有任务成功完成。")
	}

	fmt.Println("Main: 程序结束。")
}
```

**优点**：
*   **错误传播**：自动收集并返回第一个错误，简化错误处理。
*   **自动取消**：任何一个 Goroutine 返回错误都会自动取消整个组的其他 Goroutine，实现高效的短路机制。
*   **结构化**：提供了一种管理一组相关 Goroutine 的清晰结构。
*   **与 `context` 集成**：方便地传递截止时间、取消信号等。

**缺点**：
*   **需要外部包**：`errgroup` 位于 `golang.org/x/sync` 扩展包，而非标准库。
*   **适用于“所有都成功或有一个失败就停止”的场景**：如果需要所有任务都运行完毕无论成功与否，可能需要调整逻辑。

## 四、选择合适的等待方式

| 方法                  | 场景                                                                                              | 优点                                                                                                  | 缺点                                                                                                                                                                                                                           |
| :-------------------- | :------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sync.WaitGroup`      | 简单地等待已知数量的 Goroutine 完成，不需要返回结果或错误。                                       | 最简单、最直接的等待机制；开销小。                                                                    | 无法直接传递 Goroutine 的结果或错误；不支持取消机制。                                                                                                                                                                  |
| **Channels** (信号)     | Goroutine 之间需要传递数据、结果或特定信号；需要灵活的编排和控制流。                              | 符合 Go 哲学，灵活强大；支持传递数据和错误；可实现更复杂的通信模式。                                   | 对于简单的完成等待可能显得冗余；需要手动管理 Channel 的创建、使用和关闭。                                                                                                                                              |
| `errgroup.Group`      | 一组 Goroutine 需要结构化管理；需要统一的错误处理和取消机制；任何一个任务失败都需要停止其他任务。 | 自动处理错误传播和 Goroutine 取消；提供了清晰的结构来管理相关 Goroutine 组。                      | 需要导入外部包 (`golang.org/x/sync/errgroup`)；主要关注于“成功完成”或“第一个失败”，如果需要所有 Goroutine 都完成而不管错误，可能需要额外处理。                                                               |

**总结**：

*   对于**最简单的“等待所有完成”**，且不需要返回值或错误处理，**`sync.WaitGroup`** 是最佳选择。
*   如果 Goroutine **需要返回结果或错误，并且需要更精细的通信控制**，**Channels** 是 Go 语言推荐的方式。
*   当涉及到**一组 Goroutine 的结构化管理、统一错误处理以及自动取消机制**时，**`errgroup.Group`** 提供了最强大和优雅的解决方案。

理解这些同步原语的特点和适用场景，能够帮助你编写出更健壮、高效且易于维护的 Go 并发程序。
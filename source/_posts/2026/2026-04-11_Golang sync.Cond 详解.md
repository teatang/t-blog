---
title: Golang sync.Cond 详解
date: 2026-04-11 06:24:00
tags: 
    - 2026
    - Golang
    - goroutine
categories: 
    - Golang
    - goroutine
---

> **`sync.Cond`** 是 Go 语言标准库 `sync` 包中提供的一个**条件变量（Condition Variable）**。它允许 goroutine 在满足特定条件之前**暂停执行**，并在条件满足时**收到通知**从而恢复执行。`sync.Cond` 通常与 `sync.Mutex` 或 `sync.RWMutex` 配合使用，用于协调多个 goroutine 对共享资源的访问，特别适用于**生产者-消费者模型**或**等待特定状态变动**的场景。

{% note info %}
核心思想：
-   **等待条件**：goroutine 可以订阅某个条件，如果条件不满足，则阻塞等待。
-   **通知唤醒**：当另一个 goroutine 改变了条件并使其满足时，可以通知等待的 goroutine 恢复执行。
-   **与锁结合**：`sync.Cond` 必须与 `sync.Locker`（通常是 `sync.Mutex`）结合使用，以保护被等待的共享条件所依赖的数据。
-   **避免忙等待**：通过阻塞等待和通知机制，避免了 goroutine 持续轮询条件的“忙等待”（busy-waiting），提高了并发效率。
{% endnote %}

------

## 一、为什么需要 `sync.Cond`？

在并发编程中，goroutine 之间经常需要根据某个共享状态的特定条件来决定是否继续执行。考虑以下场景：

1.  **生产者-消费者模型**：生产者向缓冲区写入数据，消费者从缓冲区读取数据。如果缓冲区为空，消费者需要等待；如果缓冲区已满，生产者需要等待。
2.  **等待特定事件或状态**：一个 goroutine 可能需要等待另一个 goroutine 完成某个任务或将某个标志设置为特定值后才能继续。
3.  **资源可用性**：多个 goroutine 竞争有限的资源，当资源被占用时，其他 goroutine 需要等待资源释放。

如果仅使用 `sync.Mutex`，虽然可以保护共享数据的完整性，但无法实现 goroutine 在条件不满足时**高效地等待**。一种简单的解决方案是“忙等待”：

```go
var (
	mu      sync.Mutex
	dataReady bool
)

// 消费者 goroutine
for {
	mu.Lock()
	if !dataReady {
		// 忙等待：持续检查，浪费 CPU
		mu.Unlock()
		time.Sleep(10 * time.Millisecond) // 即使加了睡眠，依然是忙等待
		continue
	}
	// 处理数据...
	dataReady = false
	mu.Unlock()
	break
}
```

这种“忙等待”会消耗大量 CPU 资源，并且效率低下。`sync.Cond` 提供了一种优雅的解决方案，允许 goroutine 在条件不满足时**进入睡眠状态**，直到被明确通知后才唤醒，从而避免了资源浪费。

## 二、核心概念

### 2.1 条件变量 (Condition Variable)

条件变量是一种同步原语，它本身不保护共享数据，而是作为一个**信号机制**，允许线程（或 goroutine）在某个条件不满足时阻塞，在另一个线程改变了条件并使其满足时通知等待的线程。条件变量总是与一个**互斥锁**（Mutex）关联使用，以确保对共享状态的检查和修改是原子性的。

### 2.2 `sync.Cond` 的结构

在 Go 语言中，`sync.Cond` 的定义如下：

```go
type Cond struct {
	noCopy noCopy // 用于检测 Cond 是否被复制

	// L is the Locker that the Cond is associated with.
	// Gurad L before calling any Cond methods except for Wait.
	L Locker // 内嵌一个接口，通常是 *sync.Mutex 或 *sync.RWMutex

	notify  notifyList // 等待队列，存储等待的 goroutine
	checker copyChecker
}

type Locker interface {
	Lock()
	Unlock()
}
```

*   **`L sync.Locker`**: 这是 `sync.Cond` 的关键组成部分。它表示与此条件变量关联的锁。在使用 `Cond` 的任何方法（除了 `Wait` 在内部会解锁和加锁）之前，**必须先持有这个锁 `L`**。
*   **`notifyList`**: 内部用于管理等待的 goroutine 队列。

### 2.3 `sync.Cond` 的主要方法

`sync.Cond` 提供了以下三个核心方法：

1.  **`func (c *Cond) Wait()`**
    `Wait` 方法会**原子地解锁条件变量关联的锁 `c.L`**，然后阻塞当前 goroutine，等待被唤醒。一旦 goroutine 被唤醒，`Wait` 会在返回前**重新锁定 `c.L`**。

    **理解 `Wait` 的原子性操作至关重要**：
    1.  调用 `Wait()` 时，goroutine 必须已经持有 `c.L` 的锁。
    2.  `Wait()` 内部会释放 `c.L`。
    3.  `Wait()` 会将当前 goroutine 放入等待队列并阻塞。
    4.  当 goroutine 被 `Signal()` 或 `Broadcast()` 唤醒后。
    5.  `Wait()` 会尝试重新获取 `c.L`。
    6.  当成功获取 `c.L` 后，`Wait()` 方法返回。

    **重要提示**: `Wait` 方法**必须在一个循环中调用**，以处理**虚假唤醒（Spurious Wakeups）**。

2.  **`func (c *Cond) Signal()`**
    `Signal` 方法会唤醒**一个**正在 `Wait` 的 goroutine（如果存在）。如果有多个 goroutine 正在等待，具体唤醒哪一个是不确定的。如果没有 goroutine 正在等待，`Signal` 不会产生任何效果。

3.  **`func (c *Cond) Broadcast()`**
    `Broadcast` 方法会唤醒**所有**正在 `Wait` 的 goroutine。如果没有 goroutine 正在等待，`Broadcast` 同样不会产生任何效果。

## 三、工作原理与典型使用模式

`sync.Cond` 的典型使用模式遵循以下步骤：

1.  **初始化 `sync.Cond`**：创建 `Cond` 实例，并为其关联一个 `sync.Locker` (通常是 `sync.Mutex`)。

    ```go
    var mu sync.Mutex
    cond := sync.NewCond(&mu)
    ```

2.  **goroutine A (等待者)**：
    *   **获取锁**：`cond.L.Lock()`。
    *   **检查条件**：在一个循环中检查共享变量上的条件是否满足。
    *   **条件不满足则等待**：如果条件不满足，调用 `cond.Wait()`。这会释放锁并使 goroutine A 进入阻塞状态。当 goroutine A 被唤醒时，`Wait()` 会重新获取锁。
    *   **条件满足则处理**：如果条件满足，跳出循环，处理共享数据。
    *   **释放锁**：`cond.L.Unlock()`。

    **为什么要在循环中检查条件？**
    这是为了应对**虚假唤醒**。虚假唤醒是指 goroutine 在没有收到 `Signal` 或 `Broadcast` 通知的情况下被唤醒。虽然这种情况在 Go 中不常见，但在并发编程中仍被视为最佳实践。更重要的是，即使不是虚假唤醒，当多个 goroutine 被 `Broadcast` 唤醒时，只有一个 goroutine 能够先行获取锁并处理数据，其他被唤醒的 goroutine 可能发现条件仍然不满足，需要再次等待。因此，**始终在 `Wait()` 调用外部嵌套一个循环来检查条件**是确保正确性的关键。

    ```go
    cond.L.Lock()
    for !conditionMet { // 条件检查在循环中
        cond.Wait()     // 释放锁，等待被通知，被唤醒后重新获取锁
    }
    // 处理共享数据...
    cond.L.Unlock()
    ```

3.  **goroutine B (通知者)**：
    *   **获取锁**：`cond.L.Lock()`。
    *   **修改条件**：安全地修改共享变量，使其满足等待 goroutine 的条件。
    *   **发送通知**：调用 `cond.Signal()` (唤醒一个) 或 `cond.Broadcast()` (唤醒所有)。
    *   **释放锁**：`cond.L.Unlock()`。

    ```go
    cond.L.Lock()
    // 修改共享数据，使条件满足
    conditionMet = true
    cond.Signal() // 或 cond.Broadcast()
    cond.L.Unlock()
    ```

以下 Mermaid 图示描述了 `Wait()` 内部的原子操作流程：

{% mermaid %}
%%{init: { 'theme': 'base', 'themeVariables': {
    'primaryColor': '#1e1e2e',
    'primaryTextColor': '#cdd6f4',
    'primaryBorderColor': '#b4befe',
    'lineColor': '#9399b2',
    'secondaryColor': '#313244',
    'tertiaryColor': '#11111b',
    'edgeLabelBackground': '#181825'
}}}%%

graph TD
    %% 核心流程
    Start([Goroutine 持有锁 L 并调用 Wait]) --> LockRel[原子操作: 释放锁 L]
    LockRel --> Block[Goroutine 进入等待队列并阻塞]
    
    %% 唤醒机制
    WakeUp([Signal / Broadcast 调用]) -.->|唤醒信号| Dequeue[从等待队列中移出]
    Block -.-> Dequeue
    
    Dequeue --> ReAcquire[尝试重新获取锁 L]
    ReAcquire --> Check{是否成功?}
    
    Check -- "No (阻塞重试)" --> ReAcquire
    Check -- "Yes" --> Done([Wait 方法返回])

    %% 样式美化
    style Start fill:#313244,stroke:#a6e3a1,stroke-width:2px
    style Done fill:#313244,stroke:#89b4fa,stroke-width:2px
    style WakeUp fill:#313244,stroke:#fab387,stroke-width:2px
    style Check fill:#1e1e2e,stroke:#f9e2af,stroke-width:2px
    style Block fill:#181825,stroke:#9399b2,stroke-dasharray: 5 5
{% endmermaid %}

## 四、代码示例：生产者-消费者模式

下面是一个使用 `sync.Cond` 实现的简单生产者-消费者模型示例，其中包含一个有限容量的缓冲区。

```go
package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// Buffer 是一个有限容量的整数缓冲区
type Buffer struct {
	cond       *sync.Cond
	data       []int
	capacity   int
	isClosed   bool // 标志位，用于优雅关闭
	mutex      sync.Mutex // 保护 data 和 isClosed
}

// NewBuffer 创建一个新的Buffer实例
func NewBuffer(capacity int) *Buffer {
	b := &Buffer{
		data:     make([]int, 0, capacity),
		capacity: capacity,
	}
	b.cond = sync.NewCond(&b.mutex) // 将 Cond 与 Mutex 关联
	return b
}

// Produce 方法用于向缓冲区添加数据
func (b *Buffer) Produce(item int, id string) {
	b.cond.L.Lock() // 获取锁，保护共享数据
	defer b.cond.L.Unlock() // 确保释放锁

	// 循环检查条件：缓冲区是否已满？或者是否已关闭？
	for len(b.data) == b.capacity && !b.isClosed {
		fmt.Printf("[%s] Buffer is full, Producer %d waits...\n", id, item)
		b.cond.Wait() // 缓冲区满，释放锁等待；被唤醒后重新获取锁
	}

	if b.isClosed {
		fmt.Printf("[%s] Buffer closed, Producer %d cannot produce.\n", id, item)
		return
	}

	b.data = append(b.data, item) // 添加数据
	fmt.Printf("[%s] Produced %d. Buffer size: %d\n", id, item, len(b.data))
	b.cond.Signal() // 缓冲区不再为空，通知一个等待的消费者
}

// Consume 方法用于从缓冲区取出数据
func (b *Buffer) Consume(id string) (int, bool) {
	b.cond.L.Lock() // 获取锁，保护共享数据
	defer b.cond.L.Unlock() // 确保释放锁

	// 循环检查条件：缓冲区是否为空？
	// 并且在缓冲区为空时，如果已经关闭，则没有更多数据可消费
	for len(b.data) == 0 && !b.isClosed {
		fmt.Printf("[%s] Buffer is empty, Consumer waits...\n", id)
		b.cond.Wait() // 缓冲区空，释放锁等待；被唤醒后重新获取锁
	}

	if len(b.data) == 0 && b.isClosed {
		fmt.Printf("[%s] Buffer is empty and closed, Consumer %s exits.\n", id, id)
		return 0, false // 缓冲区已空且已关闭，消费者退出
	}

	item := b.data[0]
	b.data = b.data[1:] // 取出数据
	fmt.Printf("[%s] Consumed %d. Buffer size: %d\n", id, item, len(b.data))
	b.cond.Signal() // 缓冲区不再满，通知一个等待的生产者
	return item, true
}

// Close 方法用于关闭缓冲区，通知所有等待者
func (b *Buffer) Close() {
	b.cond.L.Lock()
	defer b.cond.L.Unlock()

	b.isClosed = true
	fmt.Println("[Main] Closing buffer...")
	b.cond.Broadcast() // 唤醒所有等待的生产者和消费者，让他们检查 isClosed 标志
}

func main() {
	const (
		bufferCapacity = 5
		numProducers   = 2
		numConsumers   = 3
		itemsPerProducer = 10
	)

	buffer := NewBuffer(bufferCapacity)
	var wg sync.WaitGroup

	// 启动生产者
	for i := 0; i < numProducers; i++ {
		wg.Add(1)
		go func(producerID int) {
			defer wg.Done()
			for j := 0; j < itemsPerProducer; j++ {
				item := producerID*100 + j
				buffer.Produce(item, fmt.Sprintf("P%d", producerID))
				time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond) // 模拟生产时间
			}
			fmt.Printf("Producer P%d finished.\n", producerID)
		}(i)
	}

	// 启动消费者
	for i := 0; i < numConsumers; i++ {
		wg.Add(1)
		go func(consumerID string) {
			defer wg.Done()
			for {
				_, ok := buffer.Consume(consumerID)
				if !ok {
					break // 缓冲区已空并关闭，消费者退出
				}
				time.Sleep(time.Duration(rand.Intn(150)) * time.Millisecond) // 模拟消费时间
			}
			fmt.Printf("Consumer %s finished.\n", consumerID)
		}(fmt.Sprintf("C%d", i))
	}

	// 等待所有生产者完成
	// 注意，这里不能直接 wg.Wait() 等待所有，因为消费者是持续运行直到 buffer 关闭
	// 我们可以让 main goroutine 在一段时间后，或者当生产者全部完成后，关闭缓冲区
	go func() {
		// 在所有生产者完成任务后，等待几秒确保消费者有时间处理剩余数据
		// 实际应用可能根据业务逻辑判断何时关闭
		time.Sleep(time.Duration(itemsPerProducer * numProducers * 20) * time.Millisecond) // 粗略估算等待时间
		buffer.Close()
	}()

	// 确保所有 goroutine 有机会关闭（这里需要更精细的协调，示例简化）
	// 正确的做法是单独等待生产者完成，然后关闭buffer，最后等待消费者完成。
	// 这里简化为等待一个足够长的时间，或者通过额外的channel来实现
	time.Sleep(5 * time.Second) // 保证所有操作有时间完成
	// 或者通过一个更复杂的协调（例如，生产者完成生产后通知 main goroutine，main goroutine再通知关闭）

	fmt.Println("Main goroutine finishes.")
}
```

## 五、关键注意事项与最佳实践

1.  **始终在循环中调用 `Wait()`**：
    这是最重要的规则。由于虚假唤醒或其他被唤醒的 goroutine 可能已经改变了条件，导致当前 goroutine 发现条件仍不满足，因此必须在 `for` 或 `while` 循环中重新检查条件。

2.  **`Cond` 必须与 `Locker` 关联**：
    `sync.Cond` 不自带锁。它必须与一个 `sync.Locker` (通常是 `sync.Mutex` 或 `sync.RWMutex`) 实例关联。这个锁用于保护 `Cond` 所依赖的共享条件变量，确保对条件的检查和修改是原子性的。

3.  **在调用 `Wait()`/`Signal()`/`Broadcast()` 前持有锁**：
    除了 `Wait()` 内部会短暂释放并重新获取锁，其他所有对 `Cond` 方法的调用（以及对共享条件变量的读写）都必须在持有 `cond.L` 锁的情况下进行。

4.  **`Signal()` vs `Broadcast()`**：
    *   使用 `Signal()` 当只需要唤醒一个 goroutine 时（例如，一个事件只有一个消费者关注）。
    *   使用 `Broadcast()` 当所有等待的 goroutine 都需要检查条件时（例如，多个消费者竞争资源，或者一个状态变化影响所有等待者）。使用 `Broadcast()` 会有更高的开销。

5.  **何时使用 `sync.Cond` 而非 `channel`？**
    *   **`channel`**：更适合用于**传递数据或事件**，实现 goroutine 之间的**直接通信**。例如，一个 goroutine 完成任务后通过 channel 发送结果给另一个 goroutine。
    *   **`sync.Cond`**：更适合用于 goroutine **等待某个共享状态的特定条件**。当有一个共享的内存状态（如缓冲区满/空，某个标志位 `true/false`）被多个 goroutine 读写，且 goroutine 仅仅是需要等待这个状态发生变化时，`Cond` 是一个更自然的选择。它允许 goroutine 在条件不满足时睡眠，无需传递数据。

6.  **关闭机制**：
    在具有 `sync.Cond` 的生产者-消费者模型中，优雅地关闭系统是一个常见的挑战。需要一种机制来通知所有等待的生产者和消费者，系统即将关闭，它们不应该再等待条件满足。这通常通过一个 `isClosed` 标志和 `Broadcast()` 结合来实现，确保所有被阻塞的 goroutine 都能被唤醒并判断 `isClosed` 状态。

## 六、总结

`sync.Cond` 是 Go 语言提供的一个强大且高效的并发原语，用于协调 goroutine 在共享状态条件下的等待与通知。它通过与互斥锁结合，允许 goroutine 在条件不满足时进入睡眠状态，避免了忙等待，显著提高了程序的并发性能和资源利用率。

理解 `sync.Cond` 的核心机制——尤其是 `Wait()` 方法的原子性操作、虚假唤醒问题以及在循环中检查条件的重要性——是正确使用它的关键。在生产者-消费者模型、任务协调或任何需要 goroutine 等待共享状态变化的场景中，`sync.Cond` 都是一个不可或缺的工具。正确地运用它
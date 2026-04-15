---
title: Golang sync 包详解
date: 2024-07-24 06:24:00
tags: 
    - 2024
    - Golang
    - goroutine
categories: 
    - Golang
    - goroutine
---

> **`sync` 包** 是 Go 语言标准库中提供的一组**低级并发原语**，用于实现 goroutine 之间的**同步和协调**。它包含了各种锁机制、等待组、条件变量以及原子操作等工具，旨在帮助开发者构建线程安全且高性能的并发应用程序，有效避免竞态条件 (Race Conditions) 和其他并发问题。

{% note info %}
核心思想：
-   **线程安全**：提供工具来保护共享资源，防止多个 goroutine 同时访问造成数据损坏或不一致。
-   **协作与调度**：允许 goroutine 暂停、等待特定条件，或等待其他 goroutine 完成任务，以实现高效的协作。
-   **低级原语**：提供基础的同步构建块，开发者可以使用它们来构建更复杂的并发模式。
-   **避免竞态条件**：通过互斥访问、原子操作等手段，确保并发操作的正确性。
{% endnote %}

------

## 一、为什么需要 `sync` 包？

Go 语言通过 goroutine 和 channel 提供了强大的并发编程能力。然而，当多个 goroutine 需要访问或修改同一个共享的数据时，如果没有适当的同步机制，就可能发生**竞态条件 (Race Conditions)**。

**竞态条件** 指的是程序的正确性依赖于一个或多个操作的相对发生时序。在一个典型的竞态条件中，多个 goroutine 尝试同时访问并修改同一个共享资源，导致最终结果不可预测或不正确。

例如：

```go
package main

import (
	"fmt"
	"runtime"
	"sync"
	"time"
)

var counter int

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU()) // 设置使用多核CPU
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			// 假设这里有一些非原子操作，如读取、修改、写入
			value := counter // 读取
			runtime.Gosched() // 让出CPU，增加调度不确定性
			value++           // 修改
			counter = value   // 写入
		}()
	}

	wg.Wait()
	fmt.Println("Final Counter:", counter) // 预期是1000，但实际每次运行可能不同，小于1000
}
```

上述代码中，`counter++` 操作不是原子的，它包括**读取 `counter` 的值**、**增加 `counter` 的值**、**将新值写入 `counter`** 三个步骤。当多个 goroutine 并发执行这些步骤时，就可能导致某个 goroutine 读取到旧值，覆盖其他 goroutine 的修改，从而使最终 `counter` 的值小于预期。

`sync` 包提供了解决这类问题的工具，确保共享资源在并发访问时的正确性和一致性。

## 二、`sync` 包的核心组件详解

### 2.1 `sync.Mutex` (互斥锁)

**定义**：`Mutex` 是一个互斥锁，用于**一次只允许一个 goroutine 访问受保护的共享资源**。当一个 goroutine 持有锁时，其他试图获取该锁的 goroutine 将会被阻塞，直到锁被释放。

**用途**：保护共享数据，防止竞态条件。

**方法**：
*   **`Lock()`**: 阻塞地获取锁。如果锁已被持有，则当前 goroutine 阻塞。
*   **`Unlock()`**: 释放锁。只有持有锁的 goroutine 才能释放锁，否则会导致运行时错误。

**示例**：
使用 `sync.Mutex` 修复上述竞态条件问题。

```go
package main

import (
	"fmt"
	"sync"
)

var (
	counter int
	mu      sync.Mutex // 声明一个互斥锁
)

func main() {
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			mu.Lock()   // 尝试获取锁
			counter++   // 在锁的保护下安全地修改 counter
			mu.Unlock() // 释放锁
		}()
	}

	wg.Wait()
	fmt.Println("Final Counter:", counter) // 每次运行都将是 1000
}
```

### 2.2 `sync.RWMutex` (读写互斥锁)

**定义**：`RWMutex` 是一个读写互斥锁，相比 `Mutex` 提供了更细粒度的控制。它允许多个 goroutine 同时读取共享资源（读锁），但只允许一个 goroutine 写入共享资源（写锁），且在写入时不允许任何读取。

**用途**：
*   当读操作远多于写操作时，`RWMutex` 比 `Mutex` 能提供更好的并发性能。
*   写锁是排他性的：当持有写锁时，任何读锁或写锁的尝试都会被阻塞。
*   读锁是共享的：当持有读锁时，其他读锁的尝试可以成功，但任何写锁的尝试都会被阻塞。

**方法**：
*   **`Lock()`**: 获取写锁。
*   **`Unlock()`**: 释放写锁。
*   **`RLock()`**: 获取读锁。
*   **`RUnlock()`**: 释放读锁。

**示例**：

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

var (
	data    map[string]string
	rwMutex sync.RWMutex // 读写锁
)

func init() {
	data = make(map[string]string)
	data["key1"] = "value1"
}

func read(key string, id int) {
	rwMutex.RLock() // 获取读锁
	defer rwMutex.RUnlock() // 确保释放读锁
	fmt.Printf("Reader %d: Reading %s -> %s\n", id, key, data[key])
	time.Sleep(100 * time.Millisecond) // 模拟读取耗时
}

func write(key, value string, id int) {
	rwMutex.Lock() // 获取写锁
	defer rwMutex.Unlock() // 确保释放写锁
	fmt.Printf("Writer %d: Writing %s -> %s\n", id, key, value)
	data[key] = value
	time.Sleep(200 * time.Millisecond) // 模拟写入耗时
}

func main() {
	var wg sync.WaitGroup

	// 多个 Reader goroutine
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			read("key1", id)
		}(i)
	}

	// 一个 Writer goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		write("key1", "newValue", 100)
	}()

	// 在 Writer 后再启动一些 Reader
	for i := 5; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			read("key1", id)
		}(i)
	}

	wg.Wait()
	fmt.Println("Final data:", data)
}
```
这段代码会展示：多个读操作可以同时进行，但当写操作进行时，所有读写操作都会被阻塞。

### 2.3 `sync.WaitGroup` (等待组)

**定义**：`WaitGroup` 用于等待一组 goroutine 完成其执行。主 goroutine 会调用 `Add` 来设置需要等待的 goroutine 数量，每个 goroutine 完成时调用 `Done`，主 goroutine 调用 `Wait` 来阻塞，直到所有 goroutine 都调用了 `Done`。

**用途**：实现并发任务的同步点，例如等待所有子任务完成后再进行下一步操作。

**方法**：
*   **`Add(delta int)`**: 将等待组的计数器增加 `delta`。通常在启动 goroutine 之前调用，将 `delta` 设置为要等待的 goroutine 数量。如果 `delta` 为负，表示减少计数器。
*   **`Done()`**: 减少等待组的计数器，相当于 `Add(-1)`。通常在每个 goroutine 的 `defer` 语句中调用。
*   **`Wait()`**: 阻塞当前 goroutine，直到等待组的计数器变为零。

**示例**：
前面的 `Mutex` 和 `RWMutex` 示例中已经使用了 `WaitGroup`。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func worker(id int, wg *sync.WaitGroup) {
	defer wg.Done() // goroutine 完成时通知 WaitGroup
	fmt.Printf("Worker %d starting\n", id)
	time.Sleep(time.Duration(id) * time.Second) // 模拟工作
	fmt.Printf("Worker %d finished\n", id)
}

func main() {
	var wg sync.WaitGroup

	for i := 1; i <= 3; i++ {
		wg.Add(1) // 启动一个 worker 就增加计数
		go worker(i, &wg)
	}

	wg.Wait() // 等待所有 workers 完成
	fmt.Println("All workers finished. Main goroutine exits.")
}
```

### 2.4 `sync.Cond` (条件变量)

**定义**：`Cond` 是条件变量，它允许 goroutine 在满足特定条件之前**暂停执行**，并在条件满足时**收到通知**从而恢复执行。`Cond` 必须与 `sync.Locker`（通常是 `sync.Mutex`）结合使用，以保护被等待的共享条件所依赖的数据。

**用途**：实现生产者-消费者模型、等待特定事件或状态的场景，避免忙等待。

**方法**：
*   **`NewCond(l Locker)`**: 创建并返回一个新的 `Cond` 实例，关联指定的 `Locker`。
*   **`Wait()`**: 原子地解锁条件变量关联的锁 `c.L`，然后阻塞当前 goroutine。一旦 goroutine 被唤醒，`Wait` 会在返回前重新锁定 `c.L`。**必须在循环中检查条件。**
*   **`Signal()`**: 唤醒**一个**正在 `Wait` 的 goroutine。
*   **`Broadcast()`**: 唤醒**所有**正在 `Wait` 的 goroutine。

**示例**：
因 `Cond` 的内容较为丰富，此处仅提供一个简要示例。更详细的解释请参考关于 `sync.Cond` 的专门文档。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	var mu sync.Mutex
	cond := sync.NewCond(&mu)
	ready := false

	// Waiter goroutine
	go func() {
		mu.Lock()
		for !ready { // 循环检查条件以应对虚假唤醒
			fmt.Println("Waiter: Not ready yet, waiting...")
			cond.Wait() // 释放锁，等待通知，被唤醒后重新获取锁
		}
		fmt.Println("Waiter: Condition met, processing...")
		mu.Unlock()
	}()

	// Signaler goroutine
	go func() {
		time.Sleep(2 * time.Second) // 模拟一段时间工作
		mu.Lock()
		ready = true               // 改变条件
		fmt.Println("Signaler: Condition met, notifying one waiter...")
		cond.Signal()              // 唤醒一个等待者
		// cond.Broadcast() // 如果有多个等待者，使用 Broadcast 唤醒所有
		mu.Unlock()
	}()

	time.Sleep(3 * time.Second) // 等待所有 goroutine 完成
	fmt.Println("Main goroutine exits.")
}
```

### 2.5 `sync.Once` (单次执行)

**定义**：`Once` 是一个结构体，用于确保某个函数在整个程序的生命周期中**只被执行一次**，即使有多个 goroutine 同时尝试执行它。

**用途**：延迟初始化单例对象、初始化全局资源或配置等，避免重复初始化带来的问题。

**方法**：
*   **`Do(f func())`**: 执行函数 `f`。无论被调用多少次，`f` 只会被执行一次。

**示例**：

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

var (
	once     sync.Once
	instance string
)

func initFunction() {
	fmt.Println("Initializing instance...")
	time.Sleep(500 * time.Millisecond) // 模拟耗时初始化
	instance = "Initialized!"
	fmt.Println("Instance initialized.")
}

func main() {
	var wg sync.WaitGroup

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			fmt.Printf("Goroutine %d trying to initialize...\n", id)
			once.Do(initFunction) // 只有第一个调用 Do 的 goroutine 会执行 initFunction
			fmt.Printf("Goroutine %d: Instance is '%s'\n", id, instance)
		}(i)
	}

	wg.Wait()
	fmt.Println("All goroutines finished. Final instance:", instance)
}
```

### 2.6 `sync.Map` (并发安全的 Map)

**定义**：`Map` 是一个开箱即用的并发安全的哈希表，自 Go 1.9 起引入。它避免了在普通 `map` 外层手动加 `Mutex` 可能导致的性能瓶颈，特别是在读多写少的场景下表现更优。

**用途**：替代 `map[key]value` 加上 `sync.Mutex` 的组合，用于高并发读写的场景。

**方法**：
*   **`Load(key interface{}) (value interface{}, ok bool)`**: 根据 `key` 获取值。
*   **`Store(key, value interface{})`**: 存储 `key-value` 对。
*   **`LoadOrStore(key, value interface{}) (actual interface{}, loaded bool)`**: 如果 `key` 存在，则加载并返回已有的值；否则存储新值并返回。`loaded` 为 `true` 表示加载了旧值，`false` 表示存储了新值。
*   **`Delete(key interface{})`**: 删除 `key`。
*   **`Range(f func(key, value interface{}) bool)`**: 遍历 `Map` 中的所有键值对。如果 `f` 返回 `false`，则停止遍历。

**示例**：

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	var m sync.Map
	var wg sync.WaitGroup

	// 并发存储
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			key := fmt.Sprintf("key%d", id)
			value := fmt.Sprintf("val%d", id)
			m.Store(key, value)
			fmt.Printf("Goroutine %d stored: %s -> %s\n", id, key, value)
		}(i)
	}
	wg.Wait()

	// 并发读取和 LoadOrStore
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			key := fmt.Sprintf("key%d", id)
			val, loaded := m.LoadOrStore(key, "new_val") // 如果 key 存在，则加载；否则存储
			if loaded {
				fmt.Printf("Goroutine %d loaded existing: %s -> %s\n", id, key, val)
			} else {
				fmt.Printf("Goroutine %d stored new: %s -> %s\n", id, key, val)
			}

			time.Sleep(10 * time.Millisecond)

			keyToLoad := fmt.Sprintf("key%d", id+5)
			if actualVal, ok := m.Load(keyToLoad); ok {
				fmt.Printf("Goroutine %d loaded: %s -> %s\n", id, keyToLoad, actualVal)
			}
		}(i)
	}
	wg.Wait()

	// 遍历 Map
	fmt.Println("\nIterating over sync.Map:")
	m.Range(func(key, value interface{}) bool {
		fmt.Printf("Key: %v, Value: %v\n", key, value)
		return true // 返回 true 继续遍历
	})
}
```

### 2.7 `sync.Pool` (对象池)

**定义**：`Pool` 是一个可用于存储和复用临时对象（如缓冲区、数据结构）的并发安全池。它不是垃圾回收的替代品，而是为了减少对象的创建和垃圾回收的开销。`Pool` 中的对象会在 GC 运行时被清除，因此不适合存储需要长时间持久化的对象。

**用途**：复用那些频繁创建和销毁、开销较大的临时对象，如 `[]byte` 缓冲区、数据库连接等，以优化性能。

**方法**：
*   **`Get() interface{}`**: 从池中获取一个对象。如果池为空，则调用 `New` 函数（如果已设置）创建一个新对象。
*   **`Put(x interface{})`**: 将一个对象放回池中。

**`New` 字段**：`var New func() interface{}`。当 `Get()` 找不到可用的对象时，会调用此函数来创建新对象。如果 `New` 为空，`Get()` 返回 `nil`。

**示例**：

```go
package main

import (
	"bytes"
	"fmt"
	"sync"
	"time"
)

func main() {
	var bufPool = sync.Pool{
		New: func() interface{} {
			fmt.Println("Creating new bytes.Buffer")
			return &bytes.Buffer{} // 创建一个 bytes.Buffer 对象
		},
	}

	var wg sync.WaitGroup

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			buffer := bufPool.Get().(*bytes.Buffer) // 从池中获取或创建新的 buffer
			defer bufPool.Put(buffer)             // 将 buffer 放回池中

			buffer.Reset() // 重置 buffer 状态
			buffer.WriteString(fmt.Sprintf("Goroutine %d: Hello from Pool!", id))
			fmt.Println(buffer.String())

			time.Sleep(100 * time.Millisecond)
		}(i)
	}

	wg.Wait()

	// 尝试再次获取，如果池中有，会复用
	fmt.Println("\nGetting another buffer after all goroutines finish:")
	buf := bufPool.Get().(*bytes.Buffer)
	fmt.Println("Reused buffer content (should be empty after Reset):", buf.String())
	bufPool.Put(buf)
}
```

## 三、最佳实践与注意事项

1.  **优先使用 Channel 进行通信**：Go 提倡“通过通信共享内存，而不是通过共享内存来通信” (`Don't communicate by sharing memory; share memory by communicating.`)。尽可能使用 `channel` 来传递数据和协调 goroutine。`sync` 包是当 `channel` 不适用或者需要更底层、更高效的同步时使用的。
2.  **细粒度锁与粗粒度锁**：
    *   **粗粒度锁**：保护大块代码或多个不相关的共享资源。简单，但可能限制并发性。
    *   **细粒度锁**：只保护单个共享资源或极小段代码。复杂，但能最大化并发性。
    选择合适的粒度以平衡性能和复杂性。
3.  **避免死锁 (Deadlock)**：
    死锁是指两个或多个 goroutine 相互等待对方释放资源而无法继续执行的情况。常见原因：
    *   **交叉锁顺序**：Goroutine A 持有锁 L1，尝试获取 L2；Goroutine B 持有锁 L2，尝试获取 L1。
    *   **忘记释放锁**：Goroutine 获取锁后，由于 panic 或逻辑错误未能释放。
    **防范策略**：保持一致的锁获取顺序，使用 `defer mu.Unlock()` 确保锁的释放。
4.  **使用 `go run -race` 进行竞态条件检测**：Go 自带的竞态检测器是一个非常强大的工具。在开发和测试阶段，务必使用 `go run -race`、`go build -race` 或 `go test -race` 来编译和运行代码，它能帮助你发现潜在的竞态条件。
5.  **警惕 `sync.Pool` 的生命周期**：`sync.Pool` 中的对象会在 GC 运行时被清除，这意味着不能保证你 `Put` 进去的对象在下次 `Get` 时还能取到。它不适合作为缓存，而是用于**短生命周期的临时对象的复用**。
6.  **零值可用**：`sync` 包中的大多数类型（如 `Mutex`, `RWMutex`, `WaitGroup`, `Once`, `Pool`）都可以直接声明为零值使用，无需显式 `make` 或 `New`。

## 四、总结

`sync` 包是 Go 语言并发编程的基石之一，提供了构建高效、健壮并发应用程序所需的底层同步原语。从保护共享资源的 `Mutex` 和 `RWMutex`，到协调 goroutine 任务完成的 `WaitGroup`，再到等待特定条件的 `Cond`，以及确保代码只执行一次的 `Once` 和优化对象复用的 `Pool`，每一个组件都解决了并发编程中的特定挑战。

理解这些原语的工作原理、适用场景及其局限性，并遵循最佳实践，对于编写高质量的 Go 并发代码至关重要。同时，始终记住 Go 哲学中对 `channel` 的偏好，将 `sync` 包作为更深层次控制或特定性能优化的工具。
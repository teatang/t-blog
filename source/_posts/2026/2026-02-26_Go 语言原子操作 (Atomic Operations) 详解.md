---
title: Go 语言原子操作 (Atomic Operations) 详解
date: 2026-02-26 06:24:00
tags:
  - 2026
  - Golang
  - 程序设计
categories:
  - Golang
  - 程序设计
---

> **Go 语言原子操作 (Atomic Operations)** 提供了一种在并发环境中对共享变量进行安全、高效访问的机制。与传统的互斥锁 (Mutex) 不同，原子操作是无锁 (lock-free) 的。它们通过硬件指令保证操作的原子性，即一个操作在执行过程中不会被其他并发操作打断。这使得原子操作在某些场景下比互斥锁具有更高的性能，因为它们避免了操作系统上下文切换和锁竞争带来的开销。原子操作主要用于更新基本数据类型（如整数、指针）的共享值，以避免竞态条件 (race condition)。

{% note info %}
核心思想：
-   **无锁并发**：不使用互斥锁，直接利用 CPU 指令保证操作完整性。
-   **原子性**：操作要么完全成功，要么根本不发生，中间状态对其他线程不可见。
-   **效率高**：避免了锁的开销（如上下文切换），在低竞争场景下表现出色。
-   **替代互斥锁**：当共享数据是单个基本类型时，原子操作是互斥锁的轻量级替代方案。
{% endnote %}

------

## 一、为什么需要原子操作？并发编程问题

在 Go 语言中，Goroutine 是轻量级的并发执行单元。当多个 Goroutine 同时访问和修改同一个共享变量时，如果没有适当的同步机制，就会导致竞态条件 (Race Condition)。竞态条件会导致程序的行为不可预测，产生错误的结果。

**示例：竞态条件**

```go
package main

import (
	"fmt"
	"runtime"
	"sync"
	"time"
)

var counter int

func worker(wg *sync.WaitGroup) {
	defer wg.Done()
	for i := 0; i < 100000; i++ {
		counter++ // 这里存在竞态条件
	}
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU()) // 使用多核CPU
	var wg sync.WaitGroup

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go worker(&wg)
	}

	wg.Wait()
	fmt.Println("Final counter:", counter) // 结果可能不是 500000
}
```

在上面的例子中，`counter++` 并不是一个原子操作。它实际上包含三个步骤：
1.  读取 `counter` 的当前值。
2.  将读取的值加 1。
3.  将新值写回 `counter`。

当多个 Goroutine 同时执行这三个步骤时，可能会发生以下情况：
*   Goroutine A 读取 `counter` = 0。
*   Goroutine B 读取 `counter` = 0。
*   Goroutine A 将 `counter` 更新为 1。
*   Goroutine B 将 `counter` 更新为 1（而不是 2）。
最终导致 `counter` 的值比预期的小。

为了解决这个问题，我们可以使用互斥锁 `sync.Mutex` 来保护 `counter` 的访问。

**示例：使用 Mutex 解决竞态条件**

```go
package main

import (
	"fmt"
	"runtime"
	"sync"
	"time"
)

var counter int
var mu sync.Mutex // 声明一个互斥锁

func workerWithMutex(wg *sync.WaitGroup) {
	defer wg.Done()
	for i := 0; i < 100000; i++ {
		mu.Lock()   // 获取锁
		counter++   // 安全地修改共享变量
		mu.Unlock() // 释放锁
	}
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	var wg sync.WaitGroup

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go workerWithMutex(&wg)
	}

	wg.Wait()
	fmt.Println("Final counter with Mutex:", counter) // 结果总是 500000
}
```

使用互斥锁可以确保并发安全，但锁的加锁和解锁操作会带来一定的性能开销（例如，上下文切换、缓存同步）。在某些简单操作（如递增/递减、加载/存储）上，原子操作提供了更轻量级的替代方案。

## 二、Go 语言 `sync/atomic` 包

Go 语言通过 `sync/atomic` 包提供了一系列原子操作函数，这些函数直接映射到 CPU 体系结构提供的原子指令，从而实现无锁的并发访问。

`sync/atomic` 包主要提供了以下几类原子操作：

1.  **增/减操作 (Add)**：原子地增加或减少一个整数值。
2.  **比较并交换 (Compare And Swap, CAS)**：原子地比较一个值是否等于预期值，如果相等则更新为新值。
3.  **加载 (Load)**：原子地读取一个值。
4.  **存储 (Store)**：原子地写入一个值。
5.  **交换 (Swap)**：原子地将一个值替换为新值，并返回旧值。

支持的类型包括 `int32`, `int64`, `uint32`, `uint64`, `uintptr` (用于指针操作) 和 `atomic.Pointer` (Go 1.19+，用于泛型指针操作)。

### 2.1 增/减操作 (Add)

`AddInt32`, `AddInt64`, `AddUint32`, `AddUint64`, `AddUintptr` 等函数用于原子地增加或减少指定地址的值。

```go
func AddInt32(addr *int32, delta int32) (new int32)
func AddInt64(addr *int64, delta int64) (new int64)
// 同理还有 AddUint32, AddUint64, AddUintptr
```

**示例：使用 `atomic.AddInt64` 解决竞态条件**

```go
package main

import (
	"fmt"
	"runtime"
	"sync"
	"sync/atomic" // 导入 atomic 包
	"time"
)

var atomicCounter int64 // 使用 int64 类型作为共享变量，因为 AddInt64 接收 int64

func workerWithAtomic(wg *sync.WaitGroup) {
	defer wg.Done()
	for i := 0; i < 100000; i++ {
		atomic.AddInt64(&atomicCounter, 1) // 原子地将 atomicCounter 增加 1
	}
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	var wg sync.WaitGroup

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go workerWithAtomic(&wg)
	}

	wg.Wait()
	fmt.Println("Final counter with Atomic:", atomicCounter) // 结果总是 500000
}
```在这个例子中，`atomic.AddInt64(&atomicCounter, 1)` 会原子地增加 `atomicCounter` 的值，确保了并发安全，并且通常比互斥锁更高效，尤其是在低竞争场景下。

### 2.2 比较并交换 (Compare And Swap - CAS)

`CompareAndSwapInt32`, `CompareAndSwapInt64`, `CompareAndSwapUint32`, `CompareAndSwapUint64`, `CompareAndSwapUintptr`, `CompareAndSwapPointer`。

`CAS` 是原子操作的核心，许多其他原子操作都可以基于 `CAS` 实现。它的工作方式是：
1.  比较 `addr` 指向的值是否等于 `old`（旧值）。
2.  如果相等，则将 `addr` 指向的值更新为 `new`（新值），并返回 `true`。
3.  如果不相等，则不做任何操作，并返回 `false`。

```go
func CompareAndSwapInt32(addr *int32, old, new int32) (swapped bool)
func CompareAndSwapInt64(addr *int64, old, new int64) (swapped bool)
// 同理还有 CompareAndSwapUint32, CompareAndSwapUint64, CompareAndSwapUintptr, CompareAndSwapPointer
```

**示例：使用 CAS 实现自旋锁或无锁栈**

CAS 常用于实现乐观锁的数据结构，比如无锁队列或无锁栈。

```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

// 定义一个简单的无锁计数器
type AtomicCounter struct {
	val int64
}

func (c *AtomicCounter) Increment() {
	for {
		oldVal := atomic.LoadInt64(&c.val) // 原子加载当前值
		newVal := oldVal + 1
		if atomic.CompareAndSwapInt64(&c.val, oldVal, newVal) { // 尝试原子写入新值
			return // 成功，退出循环
		}
		// 如果 CAS 失败，说明在 Load 和 CAS 之间有其他 Goroutine 修改了 c.val，
		// 循环重试，直到成功
	}
}

func (c *AtomicCounter) Get() int64 {
	return atomic.LoadInt64(&c.val) // 原子加载，确保可见性
}

func main() {
	var counter AtomicCounter
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 10000; j++ {
				counter.Increment()
			}
		}()
	}

	wg.Wait()
	fmt.Println("Final atomic counter:", counter.Get()) // 结果总是 100 * 10000 = 1000000
}
```

### 2.3 加载 (Load)

`LoadInt32`, `LoadInt64`, `LoadUint32`, `LoadUint64`, `LoadUintptr`, `LoadPointer`。

原子地读取指定地址的值。这不仅是读取，更重要的是它提供了内存屏障 (Memory Barrier)，确保了在 `Load` 之前的所有写入操作对当前 Goroutine 都是可见的，避免了编译器和 CPU 的重排序优化问题。

```go
func LoadInt32(addr *int32) (val int32)
func LoadInt64(addr *int64) (val int64)
// 同理还有 LoadUint32, LoadUint64, LoadUintptr, LoadPointer
```

**示例：原子读取最新值**

```go
package main

import (
	"fmt"
	"sync/atomic"
	"time"
)

func main() {
	var config int64 = 100
	go func() {
		time.Sleep(1 * time.Second)
		atomic.StoreInt64(&config, 200) // 原子存储新配置
		fmt.Println("Config updated to 200")
	}()

	for i := 0; i < 5; i++ {
		// 原子加载确保总能读取到最新的 config 值
		val := atomic.LoadInt64(&config)
		fmt.Printf("Current config: %d (iteration %d)\n", val, i)
		time.Sleep(500 * time.Millisecond)
	}
}
```

### 2.4 存储 (Store)

`StoreInt32`, `StoreInt64`, `StoreUint32`, `StoreUint64`, `StoreUintptr`, `StorePointer`。

原子地写入指定地址的值。与 `Load` 类似，它也提供了内存屏障，确保在 `Store` 之后，之前的写入操作对任何其他 Goroutine 都可见。

```go
func StoreInt32(addr *int32, val int32)
func StoreInt64(addr *int64, val int64)
// 同理还有 StoreUint32, StoreUint64, StoreUintptr, StorePointer
```

示例见 `Load` 示例。

### 2.5 交换 (Swap)

`SwapInt32`, `SwapInt64`, `SwapUint32`, `SwapUint64`, `SwapUintptr`, `SwapPointer`。

原子地将 `addr` 指向的值替换为 `new` 值，并返回 `addr` 的旧值。

```go
func SwapInt32(addr *int32, new int32) (old int32)
func SwapInt64(addr *int64, new int64) (old int64)
// 同理还有 SwapUint32, SwapUint64, SwapUintptr, SwapPointer
```

**示例：原子交换值**

```go
package main

import (
	"fmt"
	"sync/atomic"
)

func main() {
	var current atomic.Int64 // Go 1.19+ 提供了原子类型，简化操作
	current.Store(100)

	// 将 current 的值原子地设置为 200，并返回原来的值
	oldVal := current.Swap(200)

	fmt.Printf("Old value: %d, New value: %d\n", oldVal, current.Load()) // Old value: 100, New value: 200
}
```
**`atomic.Pointer[T]` (Go 1.19+)**

Go 1.19 引入了泛型的 `atomic.Pointer[T]` 类型，使得对任意类型指针的原子操作更为方便和类型安全。它封装了对 `uintptr` 的 `Load`, `Store`, `Swap`, `CompareAndSwap` 操作。

```go
package main

import (
	"fmt"
	"sync/atomic"
)

type MyData struct {
	Name string
	Age  int
}

func main() {
	var p atomic.Pointer[MyData]

	// 存储一个新值
	data1 := &MyData{Name: "Alice", Age: 30}
	p.Store(data1)

	// 原子加载
	loadedData := p.Load()
	fmt.Printf("Loaded Data: %+v\n", loadedData) // Loaded Data: &{Name:Alice Age:30}

	// 原子交换
	data2 := &MyData{Name: "Bob", Age: 25}
	oldData := p.Swap(data2)
	fmt.Printf("Old Data (after swap): %+v\n", oldData)   // Old Data (after swap): &{Name:Alice Age:30}
	fmt.Printf("New Data (after swap): %+v\n", p.Load()) // New Data (after swap): &{Name:Bob Age:25}

	// 比较并交换
	data3 := &MyData{Name: "Charlie", Age: 35}
	// 尝试将当前值从 data2 交换为 data3
	swapped := p.CompareAndSwap(data2, data3)
	fmt.Printf("CAS successful: %t\n", swapped) // CAS successful: true
	fmt.Printf("Current Data (after CAS): %+v\n", p.Load()) // Current Data (after CAS): &{Name:Charlie Age:35}

	// 再次尝试 CAS，但预期旧值错误
	data4 := &MyData{Name: "David", Age: 40}
	swapped = p.CompareAndSwap(data2, data4) // data2 已经不是当前值了
	fmt.Printf("CAS successful: %t\n", swapped) // CAS successful: false
	fmt.Printf("Current Data (after failed CAS): %+v\n", p.Load()) // Current Data (after failed CAS): &{Name:Charlie Age:35}
}
```

## 三、原子操作与互斥锁的选择

| 特性       | 原子操作 (`sync/atomic`)                         | 互斥锁 (`sync.Mutex`)                                 |
| :--------- | :----------------------------------------------- | :---------------------------------------------------- |
| **粒度**   | 精细，通常针对单个基本类型变量                   | 粗糙，可以保护一段代码块，包含多个变量和复杂逻辑    |
| **性能**   | 高，无锁，直接利用 CPU 指令，无上下文切换开销      | 低于原子操作，涉及 Goroutine 调度、上下文切换等开销 |
| **适用场景** | 对单个简单共享变量（如计数器、状态标志）的简单操作 | 保护复杂的数据结构、多变量状态、需要长时间保持的临界区 |
| **复杂性** | 易于使用，但实现复杂逻辑需要组合多个 CAS 操作       | 简单，以 `Lock()` 和 `Unlock()` 保护代码块          |
| **死锁**   | 不会产生死锁                                     | 可能产生死锁，需要小心管理                              |
| **内存屏障** | 提供内存屏障，确保可见性和有序性                   | 隐式提供内存屏障                                        |

**什么时候使用原子操作？**

*   当需要更新的共享数据是单个基本类型（如 `int32`, `int64`, 指针）。
*   操作是简单的增/减、加载、存储、交换或比较并交换。
*   追求极致性能，并且锁竞争激烈度较低的场景。
*   实现无锁数据结构 (lock-free data structures)。

**什么时候使用互斥锁？**

*   需要保护多个共享变量的操作，或者临界区包含多行代码和复杂逻辑时。
*   需要保护非基本类型的数据结构（如 `map`, `slice`, ``struct`）。
*   操作耗时较长，CPU 密集型或 I/O 密集型操作。
*   初学者，互斥锁的理解和使用相对直观，不容易出错。

**GOMAXPROCS 和缓存一致性**

当使用 `runtime.GOMAXPROCS(runtime.NumCPU())` 或更高并发时，Go 运行时会将 Goroutine 分配到不同的 CPU 核心上执行。在这种多核环境下，各个 CPU 核心都有自己的缓存。为了保证数据一致性，原子操作在底层会利用 CPU 提供的指令（如 `LOCK` 前缀指令 `XCHG`、`CMPXCHG` 等）来确保操作的原子性并强制缓存同步（即内存屏障）。这意味着当一个 CPU 核心通过原子操作修改了共享变量后，其他 CPU 核心的缓存会失效，从而迫使它们从主内存中重新加载最新值，保证数据的一致性。这个过程是硬件层面保证的，因此原子操作被称为“无锁”但并非没有同步开销，只是这种开销通常比操作系统调度和软件锁机制小得多。

## 四、最佳实践与注意事项

1.  **只用于基本类型**：原子操作只能用于 `sync/atomic` 包中明确支持的基本类型及其指针。不要尝试对 `map`, `slice`, `struct` 等复杂类型直接使用原子操作，那将导致不可预测的行为。对于复杂类型，仍需使用 `sync.Mutex` 或 `sync.RWMutex`。
2.  **对齐要求**：在某些体系结构上，原子操作要求操作的数据是字对齐的。Go 语言的大多数基本类型通常会自动对齐，但在结构体中自定义顺序时需注意。`sync/atomic` 包会尽量确保对齐，但如果手动使用 `uintptr` 进行指针操作，可能需要注意。
3.  **内存屏障**：理解原子操作隐含的内存屏障语义至关重要。`Load` 和 `Store` 不仅仅是读写，它们强制了内存操作的顺序性，确保了并发程序的正确可见性。
4.  **CAS 循环**：在使用 `CAS` 实现无锁算法时，通常需要在一个循环中进行尝试 (自旋)，直到 `CAS` 操作成功。
5.  **避免过度优化**：虽然原子操作比互斥锁性能更高，但并非所有并发场景都需要原子操作。如果并发竞争不频繁，或者临界区逻辑复杂，互斥锁的易用性可能更重要。过早的性能优化可能会引入不必要的复杂性。
6.  **优先使用 `sync.Mutex`**：对于复杂的并发逻辑和数据结构，优先考虑使用 `sync.Mutex`。只有当分析显示 `sync.Mutex` 成为性能瓶颈，并且能够使用原子操作清晰地解决问题时，再考虑使用 `sync/atomic`。

## 五、总结

Go 语言的 `sync/atomic` 包提供了一套强大的工具，可以实现对基本数据类型的无锁原子操作。它们通过利用底层硬件能力，有效地解决了并发编程中的竞态条件问题，并在特定场景下提供了比互斥锁更高的性能。理解原子操作的原理、适用范围以及与互斥锁的权衡取舍，对于编写高效、健壮的 Go 并发程序至关重要。正确地选择和使用原子操作，是 Go 语言并发编程进阶的重要一步。
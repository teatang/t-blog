---
title: Golang 并发 Map 详解：sync.Mutex、sync.RWMutex 与 sync.Map 对比
date: 2026-01-01 06:24:00
tags: 
    - 2026
    - Golang
    - goroutine
categories: 
    - Golang
    - goroutine
---

> 在 Golang 中，内置的 `map` 类型不是并发安全的。当多个 goroutine 同时对 `map` 进行读写操作时，会导致竞争条件 (Race Condition)，甚至引发程序崩溃 (fatal error: concurrent map writes)。为了在并发环境下安全地使用 `map`，我们需要引入同步机制。本文将深入探讨三种常见的解决方案：使用 `sync.Mutex` 保护 `map`、使用 `sync.RWMutex` 保护 `map`，以及 Go 1.9 引入的 `sync.Map`，并对它们的特点、适用场景和性能进行对比分析。

{% note info %}
**核心问题**：Go 内置 `map` 非并发安全。
**核心解决方案**：
1.  **`sync.Mutex`**：最简单粗暴，读写都加排他锁。
2.  **`sync.RWMutex`**：读写分离锁，允许多个读操作并行，写操作独占。
3.  **`sync.Map`**：专为读多写少、键不冲突或键值对持续增长的场景优化，内置无锁或乐观锁机制。
{% endnote %}

------

## 一、Go 内置 `map` 的并发问题

Go 语言设计者有意将内置 `map` 设计为非并发安全的，主要出于以下考虑：

1.  **性能**：为了避免在每次 `map` 操作时都承担锁的开销，从而在单线程场景下达到最佳性能。
2.  **灵活性**：让开发者根据具体并发需求选择最合适的同步策略。

当多个 goroutine 同时修改 `map` (包括插入、删除或修改值) 时，或者一个 goroutine 修改而另一个 goroutine 读取时，Go 运行时会检测到竞争条件并抛出 `fatal error: concurrent map writes` 错误，导致程序崩溃。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	m := make(map[int]int)
	wg := sync.WaitGroup{}

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			m[i] = i // 多个 goroutine 同时写入
		}(i)
	}
	// go func() {
	// 	for {
	// 		_ = m[0] // 一个 goroutine 读取，另一个写入也会崩溃
	// 	}
	// }()

	wg.Wait()
	fmt.Println("Map size:", len(m)) // 多数情况下会崩溃
}
```
运行上述代码几乎必然导致 `fatal error: concurrent map writes`。

## 二、使用 `sync.Mutex` 保护 `map`

`sync.Mutex` 是 Go 语言提供的最基本的互斥锁。它提供排他性的访问，任何时候只有一个 goroutine 可以持有锁并访问受保护的资源。

### 2.1 原理

当使用 `sync.Mutex` 保护 `map` 时，无论是读取还是写入操作，都需要先获取锁，操作完成后再释放锁。这确保了在任何给定时刻，只有一个 goroutine 在访问 `map`，从而避免了竞争条件。

### 2.2 实现示例

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// MutexMap 是一个使用 sync.Mutex 保护的并发安全 map
type MutexMap struct {
	mu   sync.Mutex
	data map[int]int
}

// NewMutexMap 创建一个新的 MutexMap
func NewMutexMap() *MutexMap {
	return &MutexMap{
		data: make(map[int]int),
	}
}

// Store 将键值对存储到 map 中
func (m *MutexMap) Store(key, value int) {
	m.mu.Lock() // 获取写锁
	defer m.mu.Unlock() // 确保释放写锁
	m.data[key] = value
}

// Load 从 map 中加载值
func (m *MutexMap) Load(key int) (int, bool) {
	m.mu.Lock() // 获取读锁 (这里由于 Mutex 是排他锁，读也需要获取排他锁)
	defer m.mu.Unlock()
	val, ok := m.data[key]
	return val, ok
}

// Delete 从 map 中删除键
func (m *MutexMap) Delete(key int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.data, key)
}

// Range 遍历 map 中的所有元素
func (m *MutexMap) Range(f func(key, value int) bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for k, v := range m.data {
		if !f(k, v) {
			return
		}
	}
}

func main() {
	m := NewMutexMap()
	wg := sync.WaitGroup{}

	// 并发写入
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			m.Store(i, i*2)
		}(i)
	}
	wg.Wait()
	fmt.Println("MutexMap after writes, size:", len(m.data))

	// 并发读取
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			val, ok := m.Load(i)
			if ok {
				// fmt.Printf("Key %d, Value %d\n", i, val)
			}
		}(i)
	}
	wg.Wait()

	// 并发删除
	for i := 0; i < 500; i += 2 {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			m.Delete(i)
		}(i)
	}
	wg.Wait()
	fmt.Println("MutexMap after deletes, size:", len(m.data))

	// Range 遍历
	count := 0
	m.Range(func(key, value int) bool {
		count++
		return true // 继续遍历
	})
	fmt.Println("MutexMap elements after range:", count)
}
```

### 2.3 优缺点

*   **优点**：
    *   **简单易懂**：实现逻辑直接，容易理解和使用。
    *   **适用于所有读写比例**：无论是读多写少、写多读少还是读写均衡，它都能保证正确性。
    *   **通用性强**：不仅可以保护 `map`，还可以保护任何共享数据。

*   **缺点**：
    *   **性能瓶颈**：当并发读操作很多时，`sync.Mutex` 会成为性能瓶颈。因为读操作之间也需要排他锁，导致所有读操作都串行化执行，无法利用多核 CPU 的优势。

## 三、使用 `sync.RWMutex` 保护 `map`

`sync.RWMutex` 是读写互斥锁。它允许多个读者 (Reader) 同时持有读锁，但写者 (Writer) 必须独占写锁。当写者持有写锁时，任何读者或写者都无法获取锁；当读者持有读锁时，其他读者可以继续获取读锁，但写者必须等待所有读者释放读锁后才能获取写锁。

### 3.1 原理

`sync.RWMutex` 的设计思想是“读读共享，读写互斥，写写互斥”。
*   **读操作**：使用 `RLock()` 和 `RUnlock()`。多个 goroutine 可以同时获取读锁进行读取。
*   **写操作**：使用 `Lock()` 和 `Unlock()`。写锁是排他性的，在写入期间，任何其他读写操作都会被阻塞。

### 3.2 实现示例

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// RWMutexMap 是一个使用 sync.RWMutex 保护的并发安全 map
type RWMutexMap struct {
	mu   sync.RWMutex
	data map[int]int
}

// NewRWMutexMap 创建一个新的 RWMutexMap
func NewRWMutexMap() *RWMutexMap {
	return &RWMutexMap{
		data: make(map[int]int),
	}
}

// Store 将键值对存储到 map 中
func (m *RWMutexMap) Store(key, value int) {
	m.mu.Lock() // 获取写锁
	defer m.mu.Unlock() // 确保释放写锁
	m.data[key] = value
}

// Load 从 map 中加载值
func (m *RWMutexMap) Load(key int) (int, bool) {
	m.mu.RLock() // 获取读锁
	defer m.mu.RUnlock() // 确保释放读锁
	val, ok := m.data[key]
	return val, ok
}

// Delete 从 map 中删除键
func (m *RWMutexMap) Delete(key int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.data, key)
}

// Range 遍历 map 中的所有元素
func (m *RWMutexMap) Range(f func(key, value int) bool) {
	m.mu.RLock() // 遍历通常视为读操作，可以获取读锁
	defer m.mu.RUnlock()
	for k, v := range m.data {
		if !f(k, v) {
			return
		}
	}
}

func main() {
	m := NewRWMutexMap()
	wg := sync.WaitGroup{}

	// 并发写入
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			m.Store(i, i*2)
		}(i)
	}
	wg.Wait()
	fmt.Println("RWMutexMap after writes, size:", len(m.data))

	// 并发读取 (多个 goroutine 可以并行读取)
	for i := 0; i < 1000; i++ { // 增加读取 goroutine 数量，模拟读多场景
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			val, ok := m.Load(i % 1000) // 确保读取已存在的键
			if ok {
				// fmt.Printf("Key %d, Value %d\n", i % 1000, val)
			}
		}(i)
	}
	wg.Wait()

	// 并发删除
	for i := 0; i < 500; i += 2 {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			m.Delete(i)
		}(i)
	}
	wg.Wait()
	fmt.Println("RWMutexMap after deletes, size:", len(m.data))

	// Range 遍历
	count := 0
	m.Range(func(key, value int) bool {
		count++
		return true
	})
	fmt.Println("RWMutexMap elements after range:", count)
}
```

### 3.3 优缺点

*   **优点**：
    *   **读性能提升**：在读多写少的场景下，多个并发读操作可以并行执行，显著优于 `sync.Mutex`。
    *   **相对简单**：比 `sync.Map` 更容易理解和实现。

*   **缺点**：
    *   **写操作仍是瓶颈**：写操作仍然需要独占锁，并且在有大量读者持有读锁时，写者可能会被长时间阻塞（写饥饿）。
    *   **开销略高于 `sync.Mutex`**：在读写均衡或写多的场景下，`sync.RWMutex` 的管理开销可能略高于 `sync.Mutex`。

## 四、使用 `sync.Map`

`sync.Map` 是 Go 1.9 引入的开箱即用的并发安全 `map`。它不是使用传统的互斥锁来保护底层 `map`，而是通过一种更复杂的无锁或乐观锁机制来优化某些特定场景下的性能。

### 4.1 原理

`sync.Map` 内部维护了两个 `map`：
1.  `read`：一个只读的 `map`，用于高效的读取操作。大多数读取操作会直接访问这个 `map`，通常不需要加锁。
2.  `dirty`：一个可写的 `map`，包含了所有最新的写入和更新。当 `read` map 中不存在某个键时，会回退到 `dirty` map 中查找。

其核心优化策略是：
*   **读操作优化**：首次读取时，如果键在 `read` 中存在，则不需要任何锁。如果不在 `read` 中，会回退到 `dirty` 中查找，此时可能需要加锁。
*   **写操作优化**：新的写入或更新会首先写入 `dirty` map。当 `read` map 上的查找失败次数达到阈值，或者 `dirty` map 变得太大时，`dirty` map 的内容会被提升到 `read` map。
*   **删除优化**：删除操作会标记 `read` map 中的条目为“已删除”，并在 `dirty` map 中执行实际删除。

### 4.2 实现示例

`sync.Map` 没有像内置 `map` 那样直接的 `len()` 方法，它提供 `Store`, `Load`, `Delete`, `Range` 等方法。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	var m sync.Map // 直接声明使用

	wg := sync.WaitGroup{}

	// 并发写入
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			m.Store(i, i*2) // Store 方法
		}(i)
	}
	wg.Wait()
	fmt.Println("sync.Map after writes.")

	// 并发读取
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			val, ok := m.Load(i % 1000) // Load 方法
			if ok {
				// fmt.Printf("Key %d, Value %v\n", i % 1000, val)
			}
		}(i)
	}
	wg.Wait()

	// 并发删除
	for i := 0; i < 500; i += 2 {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			m.Delete(i) // Delete 方法
		}(i)
	}
	wg.Wait()
	fmt.Println("sync.Map after deletes.")

	// Range 遍历 (需要传入一个处理函数)
	count := 0
	m.Range(func(key, value interface{}) bool { // key 和 value 都是 interface{} 类型
		count++
		return true // 返回 true 继续遍历，返回 false 停止遍历
	})
	fmt.Println("sync.Map elements after range:", count)

	// LoadOrStore 示例
	val, loaded := m.LoadOrStore(1001, 10010) // 如果键 1001 不存在则存储，并返回存储的值和 false
	fmt.Printf("LoadOrStore 1001: value=%v, loaded=%v\n", val, loaded)

	val, loaded = m.LoadOrStore(1001, 20020) // 如果键 1001 存在，则返回当前值和 true，不存储新值
	fmt.Printf("LoadOrStore 1001 again: value=%v, loaded=%v\n", val, loaded)
}
```

### 4.3 优缺点

*   **优点**：
    *   **读性能极高**：在读多写少且键稳定 (不频繁删除或更新) 的场景下，性能远超 `sync.RWMutex`。因为它大多数读操作是无锁的。
    *   **无需手动加锁**：开箱即用，代码简洁。
    *   **针对特定场景优化**：特别适用于“键只写入一次或很少写入，但会被频繁读取”的缓存场景。

*   **缺点**：
    *   **不适用于所有场景**：
        *   **写多读少或读写均衡**：性能可能不如 `sync.Mutex` 或 `sync.RWMutex`。频繁的写入会导致 `dirty` map 频繁升级到 `read` map，带来额外开销。
        *   **键频繁删除或更新**：会导致 `read` 和 `dirty` map 之间状态同步的复杂性增加，性能下降。
    *   **`interface{}` 类型开销**：`Store`, `Load` 方法接受和返回 `interface{}` 类型，需要进行类型断言，可能带来少量的运行时开销和潜在的类型错误。
    *   **没有 `Len()` 方法**：获取元素数量需要遍历 `Range` 方法，效率较低。
    *   **不保证遍历顺序**：`Range` 方法遍历顺序不确定。

## 五、性能对比与适用场景

| 特性/解决方案 | `sync.Mutex` with `map` | `sync.RWMutex` with `map` | `sync.Map` |
| :------------ | :---------------------- | :------------------------ | :--------- |
| **并发读**    | 串行                    | 并行 (共享读锁)           | 大多数情况无锁，极快 |
| **并发写**    | 串行                    | 串行                      | 内部优化，某些情况较快 |
| **读写均衡**  | 一般                    | 较好                      | 一般，可能差于 `Mutex` |
| **读多写少**  | 较差                    | 优秀                      | **最优** (键不常删除) |
| **写多读少**  | 较好                    | 一般                      | 较差                      |
| **API 复杂度**| 中                      | 中                        | 简单 (开箱即用)           |
| **类型安全**  | 良好 (自定义结构体)     | 良好 (自定义结构体)       | 弱 (`interface{}`)        |
| **适用场景**  | 通用，简单粗暴          | 读远多于写，需要高并发读  | 键稳定，读远多于写的缓存 |

### 5.1 何时选择哪种方案？

1.  **首选 `sync.Mutex`**：
    *   **简单场景**：对性能要求不高，或者读写操作都很少的场景。
    *   **读写均衡**：当读写操作频率大致相同，或者写操作相对较多时，`Mutex` 的性能可能与 `RWMutex` 相当，甚至略优于 `sync.Map`。

2.  **考虑 `sync.RWMutex`**：
    *   **读多写少**：当读操作频率远高于写操作时，`RWMutex` 能显著提高并发读的性能。这是最常见的优化场景之一。

3.  **慎用 `sync.Map`**：
    *   **键稳定且读远多于写 (Append-Only 或类似缓存)**：如果你的 `map` 倾向于只增加新的键值对，或者现有键值对不常删除、更新，且有大量的并发读取，那么 `sync.Map` 能够提供最佳性能。
    *   **避免在以下场景使用 `sync.Map`**：
        *   **写多读少**：`dirty` map 的频繁提升会带来不小的开销。
        *   **键频繁删除/更新**：`sync.Map` 对删除和更新的优化相对复杂，可能导致性能下降。
        *   **需要 `Len()` 方法或遍历顺序**：`sync.Map` 不直接支持这些功能。

## 六、总结

在 Golang 中实现并发安全的 `map`，并非只有一种“最佳”方案，而是需要根据具体的应用场景和读写模式来选择最合适的同步策略。

*   **`sync.Mutex`** 提供了最简单、最通用的解决方案，但在高并发读场景下性能不佳。
*   **`sync.RWMutex`** 在读多写少的场景下表现出色，允许多个并发读，但在写操作时仍有阻塞。
*   **`sync.Map`** 是一种为特定场景（读多写少且键稳定）高度优化的特殊 `map`，能提供近乎无锁的读取性能，但在其他场景下可能表现不佳，并且存在 `interface{}` 类型和缺乏 `Len()` 方法的限制。

理解它们的内部机制和优缺点，是编写高效、健壮 Go 并发程序的关键。在选择之前，最好能对应用的读写模式进行预估或测试，以做出明智的决策。
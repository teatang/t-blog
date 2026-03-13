---
title: Golang new 和 make 的详解
date: 2025-12-28 06:24:00
tags:
  - 2025
  - Golang
  - 程序设计
categories:
  - Golang
  - 程序设计
---

> 在 Go 语言中，`new` 和 `make` 是两个用于分配内存的内建函数，但它们的应用场景和行为有显著区别。理解这两者的不同是 Go 语言初学者常常遇到的挑战之一，也是掌握 Go 内存管理和数据结构使用方式的关键。简而言之，`new` 主要用于分配**零值内存**并返回指向该内存的**指针**，而 `make` 主要用于初始化**切片 (slice)**、**映射 (map)** 和**通道 (channel)** 这三种引用类型，并返回**已初始化**的类型本身（而非指针）。

{% note info %}
核心思想：
-   **`new`**：
    *   **分配内存**：为任何类型分配内存。
    *   **返回指针**：返回一个指向新分配内存的指针。
    *   **零值初始化**：将分配的内存初始化为该类型的零值。
    *   **适用类型**：值类型 (struct, array, int, bool等) 和引用类型 (slice, map, channel) 的指针。
-   **`make`**：
    *   **初始化引用类型**：仅用于切片 (slice)、映射 (map) 和通道 (channel) 这三种引用类型。
    *   **返回类型本身**：返回一个已初始化的引用类型实例（而非指针）。
    *   **非零值初始化**：为这三种类型分配并初始化底层数据结构，使其处于可用状态。
    *   **适用类型**：slice, map, channel。
{% endnote %}

------

## 一、`new` 函数详解

`new` 是一个内建函数，其签名大致为 `func new(Type) *Type`。

### 1.1 `new` 的行为

1.  **分配内存**：`new(Type)` 为 `Type` 类型的值分配一片内存空间。
2.  **零值初始化**：分配的内存会被初始化为 `Type` 类型的**零值**。
    *   对于数值类型（`int`, `float` 等），零值为 `0`。
    *   对于布尔类型（`bool`），零值为 `false`。
    *   对于字符串类型（`string`），零值为 `""` (空字符串)。
    *   对于指针类型，零值为 `nil`。
    *   对于结构体（`struct`），所有字段都会被初始化为其各自的零值。
    *   对于数组（`array`），所有元素都会被初始化为其各自的零值。
3.  **返回指针**：`new` 函数返回一个指向新分配且已初始化为零值的内存空间的**指针**（类型为 `*Type`）。

### 1.2 `new` 的使用场景

`new` 可以用于任何类型，包括值类型和引用类型，但它最常见的用途是为**结构体**或**基本类型**分配内存并获取其指针。

#### 1.2.1 为基本类型分配内存

```go
package main

import "fmt"

func main() {
    // 分配一个 int 类型的内存，并初始化为 0
    p := new(int) 
    fmt.Printf("p 的值: %v (类型: %T)\n", *p, p) // p 的值: 0 (类型: *int)

    // 可以通过指针修改值
    *p = 42
    fmt.Printf("p 修改后的值: %v\n", *p) // p 修改后的值: 42

    // 分配一个 bool 类型的内存，并初始化为 false
    b := new(bool)
    fmt.Printf("b 的值: %v (类型: %T)\n", *b, b) // b 的值: false (类型: *bool)

    // 分配一个 string 类型的内存，并初始化为 ""
    s := new(string)
    fmt.Printf("s 的值: %q (类型: %T)\n", *s, s) // s 的值: "" (类型: *string)
}
```

#### 1.2.2 为结构体 `struct` 分配内存

```go
package main

import "fmt"

type Person struct {
    Name string
    Age  int
}

func main() {
    // 分配一个 Person 结构体的内存，字段初始化为各自的零值
    // Name: "" (空字符串), Age: 0
    personPtr := new(Person)
    fmt.Printf("personPtr 的值: %+v (类型: %T)\n", *personPtr, personPtr)
    // 输出: personPtr 的值: {Name: Age:0} (类型: *main.Person)

    personPtr.Name = "Alice"
    personPtr.Age = 30
    fmt.Printf("personPtr 修改后的值: %+v\n", *personPtr)
    // 输出: personPtr 修改后的值: {Name:Alice Age:30}

    // 等价于 var person Person; personPtr := &person;
    // 或者 personPtr := &Person{} (更常用，直接取字面量地址)
}
```
**注意**：对于结构体，更常见的做法是使用结构体字面量 `&Person{}` 来创建并获取指针，因为它允许在创建时同时初始化字段，比 `new` 更灵活。

```go
p1 := new(Person) // {Name:"" Age:0}
p2 := &Person{}   // {Name:"" Age:0}
p3 := &Person{Name: "Bob", Age: 25} // {Name:"Bob" Age:25}
```

#### 1.2.3 为引用类型分配内存（但不推荐直接使用 `new`）

虽然 `new` 可以为 `slice`、`map`、`channel` 类型分配内存，但分配后它们的值是 `nil`。`nil` 的 `slice`、`map`、`channel` 是无法直接使用的。

```go
package main

import "fmt"

func main() {
    // 为 slice 分配内存，获得一个 nil slice 的指针
    var s *[]int = new([]int)
    fmt.Printf("s 的值: %v (类型: %T)\n", *s, s) // s 的值: [] (类型: *[]int)
    // *s 此时是 []，但底层数据结构未初始化，不能直接 append
    // s = new([]int)  //此时s 还是nil
    // (*s)[0] = 10     // ❌ 运行时会 panic: index out of range [0] with length 0
    // *s = append(*s, 1) // 可以用 append，但这样操作不如直接使用 make

    // 为 map 分配内存，获得一个 nil map 的指针
    var m *map[string]int = new(map[string]int)
    fmt.Printf("m 的值: %v (类型: %T)\n", *m, m) // m 的值: map[] (类型: *map[string]int)
    // (*m)["key"] = 10 // ❌ 运行时会 panic: assignment to entry in nil map
}
```
可以看到，直接用 `new` 分配 `slice` 和 `map` 后，它们的值仍然是 `nil`（或者说 `*[]int` 解引用后是一个空切片，但底层数组未分配），不能进行实际的元素操作。因此，对于这三种引用类型，我们强烈建议使用 `make` 来初始化它们。

## 二、`make` 函数详解

`make` 也是一个内建函数，但它仅用于创建并初始化 `slice`、`map` 和 `channel` 这三种引用类型。它返回的是**已初始化**的类型本身（而非指针）。

### 2.1 `make` 的签名和行为

`make` 的签名因类型而异，无法统一写出，但其核心行为是：

1.  **分配内存并初始化底层数据结构**：`make` 不仅分配类型本身所需的内存，还会为这三种引用类型**分配并初始化其底层数据结构**（例如，`slice` 的底层数组，`map` 的哈希表结构，`channel` 的缓冲区）。
2.  **返回类型本身**：`make` 返回一个**已准备好使用**的 `slice`、`map` 或 `channel` 实例，而不是指向它们的指针。

### 2.2 `make` 的使用场景和参数

#### 2.2.1 `make` 用于 `slice`

`make([]Type, len, cap)`，其中：
*   `Type`：切片元素的类型。
*   `len`：切片的初始长度。
*   `cap`（可选）：切片的容量。如果省略，容量等于长度。

```go
package main

import "fmt"

func main() {
    // 1. 创建一个长度为 5，容量为 5 的切片
    s1 := make([]int, 5)
    fmt.Printf("s1: %v, len: %d, cap: %d\n", s1, len(s1), cap(s1))
    // 输出: s1: [0 0 0 0 0], len: 5, cap: 5

    // 2. 创建一个长度为 0，容量为 5 的切片
    s2 := make([]int, 0, 5)
    fmt.Printf("s2: %v, len: %d, cap: %d\n", s2, len(s2), cap(s2))
    // 输出: s2: [], len: 0, cap: 5

    // 此时可以安全地 append
    s2 = append(s2, 1, 2, 3)
    fmt.Printf("s2 (append后): %v, len: %d, cap: %d\n", s2, len(s2), cap(s2))
    // 输出: s2 (append后): [1 2 3], len: 3, cap: 5

    // 3. 也可以直接声明并初始化一个空切片 (nil slice)
    var s3 []int // s3 为 nil
    if s3 == nil {
        fmt.Println("s3 是一个 nil 切片") // 输出: s3 是一个 nil 切片
    }
    s3 = append(s3, 10) // nil 切片仍然可以 append，会自动处理底层数组的创建
    fmt.Printf("s3: %v, len: %d, cap: %d\n", s3, len(s3), cap(s3))
    // 输出: s3: [10], len: 1, cap: 1 (或更大，取决于具体实现)
}
```
**总结 `slice` 的初始化**:
*   `var s []int`：创建一个 `nil` 切片，长度和容量都为 0。可以安全地使用 `append`。
*   `s := []int{}`：创建一个空切片，但不是 `nil`，其底层数组已存在（虽然大小为 0）。也可以安全地使用 `append`。
*   `s := make([]int, length, capacity)`：创建指定长度和容量的切片。适用于预知大小或需要预分配内存的场景。

#### 2.2.2 `make` 用于 `map`

`make(map[KeyType]ValueType, capacity)`，其中：
*   `KeyType`：映射键的类型。
*   `ValueType`：映射值的类型。
*   `capacity`（可选）：映射的初始容量，Go 会预先分配足够的空间，以减少后续扩容的开销。

```go
package main

import "fmt"

func main() {
    // 1. 创建一个空的 map，底层哈希表已初始化，可以立即使用
    m1 := make(map[string]int)
    fmt.Printf("m1: %v, len: %d\n", m1, len(m1))
    // 输出: m1: map[], len: 0
    m1["apple"] = 1
    m1["banana"] = 2
    fmt.Printf("m1 (添加元素后): %v, len: %d\n", m1, len(m1))
    // 输出: m1 (添加元素后): map[apple:1 banana:2], len: 2

    // 2. 创建一个指定初始容量的 map
    m2 := make(map[string]int, 10) // 预估会放 10 个元素
    fmt.Printf("m2: %v, len: %d\n", m2, len(m2))
    // 输出: m2: map[], len: 0 (cap 不直接暴露)
    m2["orange"] = 3

    // 3. 也可以直接使用 map 字面量创建并初始化
    m3 := map[string]string{"name": "Alice", "city": "New York"}
    fmt.Printf("m3: %v, len: %d\n", m3, len(m3))
    // 输出: m3: map[city:New York name:Alice], len: 2

    // 4. 声明一个 nil map
    var m4 map[string]int // m4 为 nil
    if m4 == nil {
        fmt.Println("m4 是一个 nil map") // 输出: m4 是一个 nil map
    }
    // m4["key"] = 10 // ❌ 运行时会 panic: assignment to entry in nil map
}
```
**总结 `map` 的初始化**:
*   `var m map[KeyType]ValueType`：创建一个 `nil` map。不能直接添加元素。
*   `m := map[KeyType]ValueType{}`：创建一个空的 map，底层哈希表已初始化，可以立即添加元素。
*   `m := make(map[KeyType]ValueType, capacity)`：创建指定初始容量的 map。推荐用于预知元素数量的场景，以优化性能。

#### 2.2.3 `make` 用于 `channel`

`make(chan Type, buffer_capacity)`，其中：
*   `Type`：通道中传输的数据类型。
*   `buffer_capacity`（可选）：通道的容量。
    *   `0` 或省略：创建一个无缓冲通道（unbuffered channel）。发送和接收操作会立即阻塞，直到另一端就绪。
    *   `> 0`：创建一个有缓冲通道（buffered channel）。发送操作在缓冲区满时阻塞，接收操作在缓冲区空时阻塞。

```go
package main

import "fmt"

func main() {
    // 1. 创建一个无缓冲通道
    c1 := make(chan int) // 容量为 0
    fmt.Printf("c1 (无缓冲): %T\n", c1)
    // <- c1 // ❌ 这里会死锁，无缓冲通道必须同时有发送者和接收者
    // c1 <- 1 // ❌ 这里会死锁

    // 无缓冲通道的正确使用示例
    go func() {
        c1 <- 10 // 发送数据
    }()
    val := <-c1 // 接收数据
    fmt.Printf("从 c1 接收到: %d\n", val) // 输出: 从 c1 接收到: 10

    // 2. 创建一个容量为 3 的有缓冲通道
    c2 := make(chan string, 3)
    fmt.Printf("c2 (有缓冲, 容量 3): %T\n", c2)

    c2 <- "hello" // 缓冲区未满，不阻塞
    c2 <- "world" // 缓冲区未满，不阻塞
    fmt.Printf("c2 缓冲区长度: %d\n", len(c2)) // 输出: c2 缓冲区长度: 2

    msg1 := <-c2
    msg2 := <-c2
    fmt.Printf("从 c2 接收到: %s, %s\n", msg1, msg2) // 输出: 从 c2 接收到: hello, world
    fmt.Printf("c2 缓冲区长度: %d\n", len(c2)) // 输出: c2 缓冲区长度: 0
}
```
**总结 `channel` 的初始化**:
*   `var c chan Type`：创建一个 `nil` channel。对 `nil` channel 的发送和接收操作都会永久阻塞。
*   `c := make(chan Type)`：创建一个无缓冲通道。
*   `c := make(chan Type, capacity)`：创建一个有缓冲通道。

## 三、`new` 与 `make` 的本质区别总结

| 特性           | `new(Type)`                                | `make(Type, args)`                                      |
| :------------- | :----------------------------------------- | :------------------------------------------------------ |
| **用途**       | 分配内存并初始化为零值                     | 初始化 `slice`、`map` 或 `channel` 的底层数据结构     |
| **返回类型**   | **`*Type`** (指向 `Type` 的指针)            | **`Type`** 本身 (已初始化的 `slice`、`map` 或 `channel` 实例) |
| **适用类型**   | 任何类型 (值类型、引用类型)                | 仅限于 `slice`、`map`、`channel`                        |
| **初始化内容** | 分配的内存初始化为**零值**                 | 为引用类型分配并**初始化底层数据结构**，使其可用        |
| **是否可用**   | 返回的指针指向零值，可以直接通过 `*p` 访问和赋值，但对于 `slice/map` 等，解引用后仍是 `nil` 或空但未分配底层空间，不能直接使用其元素操作。 | 返回的类型实例已准备就绪，可立即进行添加元素、发送/接收等操作。 |

### 图示总结

{% mermaid %}
graph TD
    %% 黑暗模式主题配置
    %%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#2d333b', 'edgeColor': '#adbac7'}}}%%

    subgraph GoMemoryManagement [Go 内存管理]
        direction TB

        %% new 流程
        A["new(T)"] --> B{"分配内存"}
        B --> C["初始化为零值"]
        C --> D["返回 *T 指针"]

        %% make 流程
        E["make(T, ...)"] --> F{"初始化内部结构"}
        
        F --> G1["Slice: 创建底层数组"]
        F --> G2["Map: 创建哈希表"]
        F --> G3["Chan: 创建缓冲区"]

        G1 --> H["返回 []T"]
        G2 --> I["返回 map[K]V"]
        G3 --> J["返回 chan T"]
    end

    %% 样式美化
    classDef newBox fill:#1f2937,stroke:#3b82f6,stroke-width:2px,color:#f3f4f6;
    classDef makeBox fill:#1f2937,stroke:#10b981,stroke-width:2px,color:#f3f4f6;
    classDef decision fill:#374151,stroke:#f59e0b,stroke-width:2px,color:#fbbf24;

    class A,B,C,D newBox;
    class E,F,G1,G2,G3,H,I,J makeBox;
    class B,F decision;
{% endmermaid %}

## 四、何时使用 `new`，何时使用 `make`？

*   **使用 `new` 的场景**：
    *   你需要为一个值类型（如 `struct`, `[N]Type`, `int` 等）或想要获取**指针**。
    *   你需要为引用类型（如 `slice`, `map`, `channel`）获取**指针**，但请注意，此时通常还需要 `make` 来初始化这个引用类型的值。例如 `myMapPtr := new(map[string]int); *myMapPtr = make(map[string]int)`，但实际中这种用法非常少见，直接 `myMap := make(map[string]int)` 更加简洁直接。

*   **使用 `make` 的场景**：
    *   当你需要创建 `slice`、`map` 或 `channel` 时。这是唯一正确的初始化这些引用类型的方式。
    *   你需要预先分配这些数据结构的容量，以优化性能。

### 示例代码对比

```go
package main

import "fmt"

type Config struct {
    Host    string
    Port    int
    Servers []string
    Options map[string]string
    LogChan chan string
}

func main() {
    // ---- 使用 new 来处理 Config 结构体 ----
    // new 返回一个指向 Config 零值的指针
    cfgPtr := new(Config)
    fmt.Printf("cfgPtr (初始): %+v (类型: %T)\n", *cfgPtr, cfgPtr)
    // 输出: cfgPtr (初始): {Host: Port:0 Servers:[] Options:map[] LogChan:<nil>} (类型: *main.Config) Go语言的零值特性对于引用类型，它们的零值是`nil`

    // 注意：这里的 Servers, Options, LogChan 都是 nil (即零值)
    // 它们尚未被 make 初始化，不能直接使用

    // 尝试直接使用会导致 panic
    // cfgPtr.Servers[0] = "server1" // panic: index out of range
    // cfgPtr.Options["timeout"] = "10s" // panic: assignment to entry in nil map
    // cfgPtr.LogChan <- "msg" // panic: send on nil channel

    // 必须用 make 来初始化这些引用字段
    cfgPtr.Servers = make([]string, 0, 5)
    cfgPtr.Options = make(map[string]string)
    cfgPtr.LogChan = make(chan string, 10)

    // 现在可以安全地使用
    cfgPtr.Host = "localhost"
    cfgPtr.Port = 8080
    cfgPtr.Servers = append(cfgPtr.Servers, "app1", "app2")
    cfgPtr.Options["timeout"] = "30s"
    cfgPtr.LogChan <- "System starting..."

    fmt.Printf("cfgPtr (初始化后): %+v\n", *cfgPtr)
    // 输出: cfgPtr (初始化后): {Host:localhost Port:8080 Servers:[app1 app2] Options:map[timeout:30s] LogChan:0xc00008e060}

    // ---- 使用 make 来创建并初始化引用类型 ----
    // slice
    mySlice := make([]int, 2, 5)
    fmt.Printf("mySlice: %v (类型: %T)\n", mySlice, mySlice) // mySlice: [0 0] (类型: []int)

    // map
    myMap := make(map[string]float64)
    fmt.Printf("myMap: %v (类型: %T)\n", myMap, myMap) // myMap: map[] (类型: map[string]float64)

    // channel
    myChannel := make(chan bool, 1)
    fmt.Printf("myChannel: %v (类型: %T)\n", myChannel, myChannel) // myChannel: 0xc00008e0c0 (类型: chan bool)

    // Error: Cannot use new for slice, map, channel with capacity/length arguments!
    // new([]int, 5)          // 编译错误: new takes no arguments
    // new(map[string]int, 10) // 编译错误: new takes no arguments
    // new(chan int, 5)       // 编译错误: new takes no arguments
}
```

## 五、深入理解 Go 语言中的零值

**零值 (zero value)** 是 Go 语言的一个重要概念。当一个变量被声明但未显式初始化时，它会自动获得其类型的零值。

*   **值类型**的零值是其内存位的全零表示。
    *   `int`, `float`, `byte`, `rune` 等：`0`
    *   `bool`: `false`
    *   `string`: `""` (空字符串)
    *   `array`: 所有元素都是其各自类型的零值
    *   `struct`: 所有字段都是其各自类型的零值
*   **引用类型**的零值是 `nil`。
    *   `*Type` (指针): `nil`
    *   `[]Type` (切片): `nil`
    *   `map[Key]Value` (映射): `nil`
    *   `chan Type` (通道): `nil`
    *   `func(...)` (函数): `nil`
    *   `interface{}` (接口): `nil`

`new` 函数的工作就是创建一个指向零值的指针。例如，`new(Config)` 实际上创建了一个 `Config` 类型的零值并返回其指针。由于 `Config` 结构体中的 `Servers` 是 `[]string` 类型（切片），它的零值是 `nil`；`Options` 是 `map[string]string` 类型，它的零值也是 `nil`；`LogChan` 是 `chan string` 类型，其零值也是 `nil`。这就是为什么 `new` 创建的 `Config` 结构体中的引用类型字段需要额外 `make` 来初始化才能使用的原因。

理解 Go 的零值概念，有助于更深入地掌握 `new` 和 `make` 的行为以及如何正确地初始化各种数据结构。
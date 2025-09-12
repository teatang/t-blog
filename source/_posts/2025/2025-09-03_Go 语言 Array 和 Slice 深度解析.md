---
title: Go 语言 Array 和 Slice 深度解析：核心区别与实战指南
date: 2025-09-03 06:24:00
tags: 
    - 2025
    - 技术相关
    - golang
    - 转载
categories: golang
---

> 本文由 [简悦 SimpRead](http://ksria.com/simpread/) 转码， 原文地址 [mp.weixin.qq.com](https://mp.weixin.qq.com/s/4DXKZSjeLyr1t-PAJhAhaw)

{% note info %}
一文掌握 Go 语言中最重要数据结构的精髓，开发 Go 项目时，90% 的情况你会用 Slice ，但另外 10% 掌握 Array 精髓更能体现你的水平。
{% endnote %}

在 Go 语言编程中，数组 (Array) 和切片 (Slice) 是我们最常打交道的两种数据结构，看似相似却有着本质区别。这篇文章将带你彻底理解它们的核心区别、使用场景以及常见陷阱，让你在 Go 语言开发中更加得心应手。

## 1. 基础定义：什么是 Array 和 Slice？
--------------------------

### 数组 (Array)：固定长度的序列

数组是**固定长度**、连续存储的相同类型元素序列。它的长度在编译时确定，且是类型的一部分。

```go
// 多种数组声明方式
var arr1 [3]int           // 默认值 [0,0,0]
arr2 := [3]int{1, 2}      // [1,2,0]（未赋值元素取零值）
arr3 := [...]int{1, 2, 3} // 编译器推断长度，类型为 [3]int


```

数组是**值类型**，赋值或传参时会复制整个数组数据。

### 切片 (Slice)：动态大小的视图

切片是对底层数组的动态窗口（**引用类型**），由三个部分组成：指向底层数组的指针、当前长度 (len) 和容量(cap)。

```go
// 切片的多种创建方式
// 方式1：从数组创建
arr := [5]int{0, 1, 2, 3, 4}
s1 := arr[1:4]            // [1,2,3], len=3, cap=4

// 方式2：直接创建
s2 := []int{1, 2, 3}      // 创建底层数组并初始化切片

// 方式3：使用make函数
s3 := make([]int, 3, 5)   // 类型, 长度, 容量 → len=3, cap=5


```

切片是**引用类型**，赋值或传参时只复制切片头（指针、长度和容量），共享底层数组。

## 2. 核心区别对比
---------

为了让您更直观地理解两者区别，下表总结了数组和切片的关键特性：

<table><thead><tr><th><section>特性</section></th><th><section>数组 (Array)</section></th><th><section>切片 (Slice)</section></th></tr></thead><tbody><tr><td><strong>长度</strong></td><td><section>固定（类型一部分）</section></td><td><section>动态可变</section></td></tr><tr><td><strong>内存分配</strong></td><td><section>直接存储数据</section></td><td><section>存储 Header + 底层数组</section></td></tr><tr><td><strong>传递行为</strong></td><td><section>值拷贝（完整复制）</section></td><td><section>引用传递（Header 拷贝）</section></td></tr><tr><td><strong>类型</strong></td><td><section>值类型</section></td><td><section>引用类型</section></td></tr><tr><td><strong>容量</strong></td><td><section>无（固定 = 长度）</section></td><td><section>有（可扩容）</section></td></tr><tr><td><strong>声明方式</strong></td><td><code>[N]T</code></td><td><code>[]T</code></td></tr><tr><td><strong>零值</strong></td><td><section>元素全零值</section></td><td><code>nil</code><section>（未初始化）</section></td></tr><tr><td><strong>JSON 序列化</strong></td><td><section>正常数组</section></td><td><section>正常数组 /<code>null</code></section></td></tr></tbody></table>

## 3. 切片动态特性揭秘
-----------

### 自动扩容机制

当切片长度超出容量时，Go 会自动扩容（通常按 2 倍增长）：

```go
s := []int{1, 2}
s = append(s, 3)   // len=3, cap=4 → 底层数组重建
fmt.Println(cap(s)) // 输出 4
```

对于大切片（>1024 元素），扩容策略会变得更保守，通常每次增加 25% 容量。

### 截取操作与共享底层数组

切片截取时会共享底层数组，修改子切片会影响原切片：

```go
orig := []int{0, 1, 2, 3, 4}
sub := orig[1:3]   // [1,2] → len=2, cap=4
sub[0] = 99        // orig 变为 [0,99,2,3,4]
```

### 使用 copy 创建独立副本

要避免共享底层数组，可以使用`copy`函数进行深拷贝：

```go
s1 := []int{1, 2, 3}
s2 := make([]int, len(s1))
copy(s2, s1)       // 深拷贝，s2与s1完全独立
s2[0] = 99         // 不影响s1
```

## 4. 函数参数传递行为差异
-------------

这是数组和切片最重要的区别之一，直接影响程序行为：

```go
func modifyArray(arr [3]int) {
    arr[0] = 100// 修改副本
}

func modifySlice(s []int) {
    s[0] = 100    // 修改底层数组
}

func main() {
    arr := [3]int{1, 2, 3}
    slice := []int{1, 2, 3}
    
    modifyArray(arr)  // 原数组不变
    modifySlice(slice) // 切片被修改
    
    fmt.Println(arr)   // [1 2 3]
    fmt.Println(slice) // [100 2 3]
}
```

**关键区别**：数组是值传递，函数内操作不影响原数组；切片传递切片头，共享底层数组。

## 5. 常见 "陷阱" 与解决方案
----------------

### 陷阱 1：意外的数据修改

由于切片共享底层数组，对子切片的修改会影响原切片：

```go
original := []int{1, 2, 3, 4, 5}
subSlice := original[1:3] // [2,3]
subSlice[0] = 99          // 修改子切片会影响原切片
fmt.Println(original)     // [1,99,3,4,5]
```

**解决方案**：使用 copy 创建独立副本

```go
original := []int{1, 2, 3, 4, 5}
subSlice := make([]int, 2)
copy(subSlice, original[1:3])
subSlice[0] = 99  // 不影响原切片
```

### 陷阱 2：扩容导致的地址变化

切片扩容可能分配新数组，导致与原关联切片分离：

```go
s1 := []int{1, 2, 3}
s2 := s1[:2]          // 共享底层数组 [1,2]
s1 = append(s1, 4)    // 容量不足，分配新数组
s1[0] = 100           // 修改新数组
fmt.Println(s1)       // [100,2,3,4]
fmt.Println(s2)       // [1,2] 仍指向旧数组
```

**解决方案**：明确容量需求，预分配足够容量

```
// 预分配足够容量
s1 := make([]int, 3, 5) // len=3, cap=5
s2 := s1[:2]           // 共享底层数组
s1 = append(s1, 4)     // 未超容量，不重新分配
s1[0] = 100
fmt.Println(s2)        // [100,2] 仍共享
```

### 陷阱 3：空切片 vs nil 切片

两者长度和容量都是 0，但行为有差异：

```go
var nilSlice []int    // nil切片, len=0, cap=0
emptySlice := []int{} // 空切片, len=0, cap=0

fmt.Println(nilSlice == nil)  // true
fmt.Println(emptySlice == nil) // false

// JSON序列化差异
json.Marshal(nilSlice)   // "null"
json.Marshal(emptySlice) // "[]"


```

**最佳实践**：函数返回错误时返回`nil`切片；返回空集合时返回`make([]T, 0)`或`[]T{}`。

## 6. 性能对比与使用场景
------------

### 性能特点

*   **数组**：访问速度快，内存连续且固定，无额外开销，无 GC 压力
    
*   **切片**：动态灵活，但扩容时需要数据拷贝，可能影响性能
    

### 使用场景推荐

#### 适合使用数组的场景

1.  **集合大小在编译时确定**：类型安全，无运行时开销
    
2.  **内存精确控制**：栈分配，无 GC 压力，适合嵌入式系统
    
3.  **高性能循环处理**：编译器优化边界检查
    
4.  **固定大小的数据结构**：如密码哈希、固定常量表、内存映射
    

#### 适合使用切片的场景

1.  **动态大小集合**：自动扩容，操作灵活
    
2.  **函数参数传递**：避免大数组拷贝
    
3.  **大多数日常场景**：处理用户输入、数据库检索等可变大小数据
    

## 7. 终极选择指南
---------

经验法则：当不确定大小时总是使用切片；当需要精确内存控制时考虑数组 以下是一些实用建议：

1.  **开发中几乎不用数组，直接用切片即可**，除非你要精准控制内存和复制行为
    
2.  **需要传递大块数据且不希望被修改时**，可使用数组 + 指针，避免切片带来的可变性问题
    
3.  **写库函数时如果只需要只读访问且性能敏感**，可考虑使用 *[N]T 传参，但一般业务中用切片最方便
    
4.  **关注性能时，可在预估长度后直接 make([]T, 0, n)**，避免多次扩容
    

## 8. 总结
-----

`数组`和`切片`是 Go 语言中两种重要的数据结构，它们各有优势：

*   **数组**：固定长度、值类型、复制独立，适合固定大小数据、性能敏感场景
    
*   **切片**：可变长度、引用类型、动态扩容，是开发的主力容器，适合动态数据场景
    

理解它们的底层原理和区别，有助于写出更高效、可靠的 Go 代码。在实际开发中，应根据具体需求选择最合适的数据结构，并注意它们的性能特征和潜在陷阱。

希望这篇文章能帮助你彻底理解 Go 语言中数组和切片的区别，让你的代码更加高效和可靠！
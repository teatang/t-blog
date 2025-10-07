---
title: Go语言指向指针的指针(Pointer to Pointer)详解
date: 2025-10-01 06:24:00
tags:
  - 2025
  - Golang
  - 指针
  - 编程范式
  - 程序设计
categories:
  - Golang
  - 程序设计
---

> 在 Go 语言中，指针是一种重要的概念，它存储了一个变量的内存地址。我们通常通过 `*` 运算符来解引用指针，获取指针指向的值。但 Go 语言还支持更复杂的指针类型，例如**指向指针的指针 (Pointer to Pointer)**，也称为**二级指针 (Double Pointer)**。虽然在日常开发中不常用，但理解其工作原理对于深入理解内存管理、某些高级数据结构（如链表、树的修改操作）或在特定场景下修改指针本身的值至关重要。

{% note info %}
核心概念：一个指针变量存储一个普通变量的地址，而**指向指针的指针**存储一个**指针变量的地址**。
{% endnote %}

## 一、基本指针回顾

在深入指向指针的指针之前，我们先快速回顾一下 Go 语言中的基本指针：

1.  **定义指针**：使用 `*` 符号和类型名来声明一个指针变量，例如 `*int` 表示一个指向 `int` 类型的指针。
2.  **获取地址**：使用 `&` 运算符来获取一个变量的内存地址。
3.  **解引用**：使用 `*` 运算符来访问指针指向的内存中的值。

**示例：**

```go
package main

import "fmt"

func main() {
	// 1. 声明一个整型变量
	var x int = 10
	fmt.Printf("x 的值为: %d, x 的地址为: %p\n", x, &x) // x 的地址: 0xc0000140a8

	// 2. 声明一个指向 int 类型的指针 p
	var p *int

	// 3. 将变量 x 的地址赋给指针 p
	p = &x
	fmt.Printf("p 的值为 (存储的地址): %p, p 指向的值为: %d\n", p, *p) // p 的值: 0xc0000140a8, p 指向的值: 10
	fmt.Printf("p 变量本身的地址为: %p\n", &p) // p 变量本身的地址: 0xc00000e028 (注意 p 也有自己的地址)

	// 4. 通过指针修改变量 x 的值
	*p = 20
	fmt.Printf("修改后 x 的值为: %d\n", x) // 修改后 x 的值为: 20
}
```

从上面的例子可以看出：

- `x` 是一个 `int` 类型变量，存储 `10`。
- `&x` 是 `x` 的内存地址。
- `p` 是一个 `*int` 类型指针，存储 `x` 的地址 (`&x`)。
- `*p` 是 `p` 指向的值，也就是 `x` 的值。

## 二、指向指针的指针 (Pointer to Pointer)

指向指针的指针顾名思义，它存储的是**另一个指针变量的内存地址**。

1.  **定义指向指针的指针**：使用两个 `*` 符号和类型名来声明，例如 `**int` 表示一个指向 `*int` 类型的指针。
2.  **获取指针的地址**：同样使用 `&` 运算符，获取的是一个指针变量的地址。
3.  **解引用**：
    - `*pp`：解引用一次，获取 `pp` 指向的 `*int` 类型指针的值（即 `p` 的值，也就是 `x` 的地址）。
    - `**pp`：解引用两次，获取 `pp` 指向的 `*int` 类型指针所指向的值（即 `p` 指向的值，也就是 `x` 的值）。

**示例：**

```go
package main

import "fmt"

func main() {
	var x int = 10
	var p *int
	var pp **int // 声明一个指向 int 类型指针的指针

	p = &x    // p 存储 x 的地址
	pp = &p   // pp 存储 p 的地址

	fmt.Printf("x 的值为: %d, 地址为: %p\n", x, &x)
	fmt.Printf("p 的值为 (存储 x 的地址): %p, p 变量本身的地址为: %p\n", p, &p)
	fmt.Printf("pp 的值为 (存储 p 的地址): %p, pp 变量本身的地址为: %p\n", pp, &pp)

	// 通过 pp 访问 p 的值（即 x 的地址）
	fmt.Printf("*pp 的值为 (p 的值): %p\n", *pp)

	// 通过 pp 访问 x 的值
	fmt.Printf("**pp 的值为 (x 的值): %d\n", **pp)

	// --------------- 通过 pp 修改 x 的值 ---------------
	fmt.Println("\n通过 pp 修改 x 的值:")
	**pp = 30 // 修改 x 的值
	fmt.Printf("修改后 x 的值为: %d\n", x)
	fmt.Printf("通过 *pp 访问的值为: %d\n", *p) // p 依然指向 x，所以值也是 30
}
```

**输出可能类似 (内存地址每次运行可能不同)：**

```
x 的值为: 10, 地址为: 0xc00001a0b8
p 的值为 (存储 x 的地址): 0xc00001a0b8, p 变量本身的地址为: 0xc00000e028
pp 的值为 (存储 p 的地址): 0xc00000e028, pp 变量本身的地址为: 0xc00000e030
*pp 的值为 (p 的值): 0xc00001a0b8
**pp 的值为 (x 的值): 10

通过 pp 修改 x 的值:
修改后 x 的值为: 30
通过 *pp 访问的值为: 30
```

## 三、为什么要使用指向指针的指针？

指向指针的指针在 Go 语言中主要用于以下两种情况：

### 3.1 在函数内部修改一个指针变量本身的值

当我们将一个指针作为参数传递给函数时，实际上传递的是该指针变量的**副本**。如果在函数内部修改这个副本指针的值（让它指向另一个地址），外部的原始指针是不会受影响的。

如果我们需要在函数内部**改变外部指针变量本身所指向的地址**（而不是仅仅修改它所指向的值），就需要传入指向该指针的指针。

**示例：在函数中修改指针本身**

```go
package main

import "fmt"

// changePointerValue 尝试直接修改传入的指针p所指向的值 (成功)
func changePointerValue(p *int, newValue int) {
	if p != nil {
		*p = newValue // 修改 p 指向的内存地址中的值
	}
}

// tryChangePointerAddress 尝试修改传入的指针 p 本身的值 (失败)
func tryChangePointerAddress(p *int, newInt *int) {
	p = newInt // 这里修改的是 p 的副本，原始指针不会改变
	fmt.Printf("函数内部 (tryChangePointerAddress): p 的值为 %p\n", p)
}

// changePointerAddressWithDoublePointer 通过 **int 修改传入的指针 p 本身的值 (成功)
func changePointerAddressWithDoublePointer(pp **int, newInt *int) {
	*pp = newInt // 通过解引用 pp，修改了 pp 所指向的 *int 变量 (即外部的 p) 的值
	fmt.Printf("函数内部 (changePointerAddressWithDoublePointer): *pp 的值为 %p\n", *pp)
}

func main() {
	var val1 int = 10
	var val2 int = 20
	var val3 int = 30

	var ptr1 *int = &val1 // ptr1 指向 val1

	fmt.Printf("初始: ptr1 指向 %d (%p)\n", *ptr1, ptr1) // 10 (地址1)

	// 情况1: 修改指针指向的值 (成功)
	changePointerValue(ptr1, 15)
	fmt.Printf("调用 changePointerValue 后: ptr1 指向 %d (%p)\n", *ptr1, ptr1) // 15 (地址1)

	// 情况2: 尝试修改指针本身所指向的地址 (失败)
	ptr2 := &val2
	fmt.Printf("\n尝试修改指针地址: ptr1 初始指向 %d (%p)\n", *ptr1, ptr1) // 15 (地址1)
	tryChangePointerAddress(ptr1, ptr2)
	fmt.Printf("调用 tryChangePointerAddress 后: ptr1 仍然指向 %d (%p)\n", *ptr1, ptr1) // 15 (地址1), 没有改变！

	// 情况3: 通过指向指针的指针修改指针本身所指向的地址 (成功)
	ptr3 := &val3
	fmt.Printf("\n通过二级指针修改指针地址: ptr1 初始指向 %d (%p)\n", *ptr1, ptr1) // 15 (地址1)
	changePointerAddressWithDoublePointer(&ptr1, ptr3) // 传入 ptr1 变量的地址
	fmt.Printf("调用 changePointerAddressWithDoublePointer 后: ptr1 现在指向 %d (%p)\n", *ptr1, ptr1) // 30 (地址3), 成功改变！
}
```

**输出：**

```
初始: ptr1 指向 10 (0xc0000a6008)
调用 changePointerValue 后: ptr1 指向 15 (0xc0000a6008)

尝试修改指针地址: ptr1 初始指向 15 (0xc0000a6008)
函数内部 (tryChangePointerAddress): p 的值为 0xc0000a6010
调用 tryChangePointerAddress 后: ptr1 仍然指向 15 (0xc0000a6008)

通过二级指针修改指针地址: ptr1 初始指向 15 (0xc0000a6008)
函数内部 (changePointerAddressWithDoublePointer): *pp 的值为 0xc0000a6018
调用 changePointerAddressWithDoublePointer 后: ptr1 现在指向 30 (0xc0000a6018)
```

这个例子清晰地展示了，当需要函数修改一个 `*T` 类型的变量（这个变量本身是一个指针）时，我们必须传入 `**T` 类型。

### 3.2 实现复杂的数据结构（例如解引用链表头节点）

在一些需要修改头部或根节点指针的链表、树等数据结构实现中，指向指针的指针也很有用。

例如，在 C/C++ 中，链表的 `deleteNode` 函数如果需要删除头节点并更新 `head` 指针，通常会使用一个 `Node** head` 参数。在 Go 中，我们也可以用类似的方式。

不过，在 Go 语言中，通常可以通过**返回新的头节点**或使用**结构体包装指针**来避免复杂的多级指针。

**使用 `**Node` 修改链表头节点 (Go 示例)\*\*：

```go
package main

import "fmt"

// Node 定义链表节点
type Node struct {
	Value int
	Next  *Node
}

// printList 辅助函数，打印链表
func printList(head *Node) {
	current := head
	for current != nil {
		fmt.Printf("%d -> ", current.Value)
		current = current.Next
	}
	fmt.Println("nil")
}

// prependNodeWithDoublePointer (不常见，但演示 **Node 用法)
// 传入指向 head 指针的指针，以便在函数内部修改 head 指针本身
func prependNodeWithDoublePointer(head **Node, val int) {
	newNode := &Node{Value: val, Next: nil}
	newNode.Next = *head // 新节点的下一个是当前的头节点
	*head = newNode      // 更新外部的头指针，让它指向新节点
}

// prependNode (更常见且推荐的 Go 风格)
// 返回新的头节点
func prependNode(head *Node, val int) *Node {
	newNode := &Node{Value: val, Next: head}
	return newNode
}

func main() {
	var head *Node = nil // 初始链表头为空

	// 使用更常见的 Go 风格修改头节点 (返回新的头节点)
	head = prependNode(head, 3) // head 现在是 3 -> nil
	head = prependNode(head, 2) // head 现在是 2 -> 3 -> nil
	head = prependNode(head, 1) // head 现在是 1 -> 2 -> 3 -> nil
	fmt.Print("使用 Go 风格函数: ")
	printList(head) // 输出: 1 -> 2 -> 3 -> nil

	// 使用指向指针的指针修改头节点
	var head2 *Node = nil // 另一个链表头
	prependNodeWithDoublePointer(&head2, 30) // head2 现在是 30 -> nil
	prependNodeWithDoublePointer(&head2, 20) // head2 现在是 20 -> 30 -> nil
	prependNodeWithDoublePointer(&head2, 10) // head2 现在是 10 -> 20 -> 30 -> nil
	fmt.Print("使用 **Node 函数: ")
	printList(head2) // 输出: 10 -> 20 -> 30 -> nil
}
```

在 Go 语言中，对于链表等数据结构，通常更倾向于**返回新的头节点**或者将链表封装在一个**结构体**中，通过结构体的方法来修改内部的指针，而不是直接使用 `**Node`。

**使用结构体包装指针 (更 idiomatic Go 方式)**：

```go
// LinkedList 包装头节点指针
type LinkedList struct {
	Head *Node
}

// Prepend 方法修改 LinkedList 结构体内部的 Head 指针
func (l *LinkedList) Prepend(val int) {
	newNode := &Node{Value: val, Next: nil}
	newNode.Next = l.Head
	l.Head = newNode // 直接修改结构体 field 的值
}

func main() {
	list := LinkedList{} // 创建一个链表实例

	list.Prepend(300) // list.Head 现在是 300 -> nil
	list.Prepend(200) // list.Head 现在是 200 -> 300 -> nil
	list.Prepend(100) // list.Head 现在是 100 -> 200 -> 300 -> nil

	fmt.Print("使用结构体方法: ")
	printList(list.Head) // 输出: 100 -> 200 -> 300 -> nil
}
```

这种使用`LinkedList`结构体和其`Prepend`方法的做法，在 Go 语言中被认为是更地道和清晰的。它避免了多级指针的复杂性，同时达到了修改链表头部的目的。

## 四、总结

Go 语言中的指向指针的指针 ( `**T` 类型) 允许你：

1.  **在函数内部修改一个指针变量本身所指向的地址**，而不是仅仅修改它所指向的值。这是其最主要的用途。
2.  在某些特定场景下，如 C 语言风格的链表操作，可能被用于操作指针头部。

然而，在 Go 中，通常有更符合 Go 惯例的替代方案，如：

- **返回被修改后的新指针**：对于像链表头节点这样的情况。
- **将指针封装在结构体中，并通过结构体的接收器方法对其进行修改**：这是 Go 中处理复杂数据结构及其操作的常见且推荐方式。

虽然 `**T` 确实存在，也解决了一些特定问题，但在 Go 的日常开发中，应尽量避免过度使用它，因为它会增加代码的复杂性和可读性。在遇到需要它的场景时，先考虑更 Go-idiomatic 的解决方案。只有在确实没有更好的替代方案时，再考虑使用二级指针。

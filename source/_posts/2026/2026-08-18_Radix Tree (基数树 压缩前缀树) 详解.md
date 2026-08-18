---
title: Radix Tree (基数树/压缩前缀树) 详解
date: 2026-08-18 06:24:00
tags:
  - 2026
  - 数据结构
categories:
    - 数据结构
mathjax: true
---

> **Radix Tree**，又称**基数树**、**压缩前缀树**（**Compact Trie**）或 **Patricia Tree (Practical Algorithm to Retrieve Information Coded in Alphanumeric)**，是一种优化的 Trie (前缀树) 数据结构。它通过**压缩那些只有一个子节点的路径**，显著减少了节点数量和存储空间，尤其是在处理具有长公共前缀的键集合时。Radix Tree 在保持 Trie 快速前缀匹配和字典序遍历能力的同时，提高了空间效率和某些操作的时间效率。

{% note info %}
**核心概念：**
*   **前缀树 (Trie)：** 一种用于存储字符串集合的树形数据结构，每个节点代表一个字符，路径代表一个前缀。
*   **路径压缩：** Radix Tree 的核心优化，将 Trie 中单分支（只有一个子节点）的路径上的节点合并成一个节点，其边（edge）上存储的不再是单个字符，而是一个字符串片段。
*   **基数 (Radix)：** 指树分支的最大数量，通常为 2 (二进制) 或 256 (字节)。
{% endnote %}

------

## 一、为什么需要 Radix Tree？与 Trie 的对比

**1.1 Trie (前缀树) 的局限性**

Trie 是一种高效的字符串集合数据结构，特别擅长前缀匹配。它的每个节点代表一个字符，从根节点到任意节点的路径表示一个前缀。然而，当存储的字符串存在以下情况时，Trie 会变得低效：

*   **空间浪费：** 如果存在大量具有长公共前缀但只有少量分叉的字符串，Trie 会创建许多“单分支”节点。例如，存储 "apple", "apply", "applet" 会创建许多中间节点 `a -> p -> p -> l`，即使这些节点没有其他分支。
*   **深度过大：** 如果键的长度很长，Trie 的深度也会很深，导致遍历路径的开销较大。

**1.2 Radix Tree 的引入**

Radix Tree 旨在解决 Trie 的这些局限性。它的核心思想是：

*   **压缩单分支路径：** 如果一个节点只有一个子节点，并且该子节点也不是一个键的结尾（或不存储值），那么这两个节点可以合并。它们之间的边上存储的不再是单个字符，而是一串字符。
*   **提高效率：** 通过减少节点数量和树的深度，Radix Tree 在空间和时间上都比标准 Trie 更高效。

### 1.3 对比图示

以下图示展示了普通 Trie 和 Radix Tree 在存储相同字符串集合（"test", "team", "toast", "tend", "top"）时的结构差异。

{% mermaid %}
graph TD
    %% 全局与局部样式定义 (深色 UI 友好)
    classDef default fill:#1e293b,stroke:#64748b,stroke-width:1.5px,color:#f8fafc;
    classDef root_node fill:#334155,stroke:#94a3b8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef is_word_node fill:#1e40af,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;

    subgraph trie ["普通 Trie"]
        TR[Root]:::root_node --> T0(t)
        
        %% 公共前缀 te 分支
        T0 --> E0(e)
        E0 --> S0(s) --> T1((t)):::is_word_node
        E0 --> A0(a) --> M0((m)):::is_word_node
        E0 --> N0(n) --> D0((d)):::is_word_node

        %% 公共前缀 to 分支
        T0 --> O0(o)
        O0 --> A1(a) --> S1(s) --> T2((t)):::is_word_node
        O0 --> P0((p)):::is_word_node
    end

    subgraph radix ["Radix Tree (压缩前缀树)"]
        RR[Root]:::root_node -- "t" --> NT(Node T)
        
        %% te 分支压缩
        NT -- "e" --> NTE(Node TE)
        NTE -- "st" --> NT_TEST((test)):::is_word_node
        NTE -- "am" --> NT_TEAM((team)):::is_word_node
        NTE -- "nd" --> NT_TEND((tend)):::is_word_node

        %% to 分支压缩
        NT -- "o" --> NTO(Node TO)
        NTO -- "ast" --> NT_TOAST((toast)):::is_word_node
        NTO -- "p" --> NT_TOP((top)):::is_word_node
    end
{% endmermaid %}
从图中可以看出，Radix Tree 将 `t -> e` 合并为 `te` 这条边，将 `t -> o -> a -> s -> t` 中的 `o -> a -> s -> t` 合并为 `oast` 这条边。这样大大减少了中间节点的数量。

## 二、Radix Tree 的数据结构

Radix Tree 的每个节点通常包含以下信息：

*   **`key_fragment` (键片段):** 从父节点到当前节点这条边所代表的字符串片段。这是 Radix Tree 与 Trie 的主要区别，Trie 的边只代表一个字符。
*   **`children` (子节点):** 一个映射 (map)，将字符（通常是 `key_fragment` 的第一个字符）映射到对应的子节点指针。
*   **`is_end_of_key` (是否为键的结束):** 布尔值，标记当前节点是否代表一个完整键的结束。
*   **`value` (值):** 如果当前节点是一个完整键的结束，则可以存储与该键关联的值。

### 2.1 节点结构示例 (Go 语言)

```go
// Node 表示 Radix Tree 中的一个节点
type Node struct {
	// keyFragment 是从父节点到当前节点这条边上的字符串片段
	// 对于根节点，此值通常为空或特殊标记
	keyFragment string

	// children 存储子节点。键是子节点keyFragment的第一个字符。
	// 这允许高效地查找下一个匹配的子路径。
	children map[rune]*Node // rune 适用于Unicode字符，byte适用于ASCII/字节流

	// isEndOfKey 标记此节点路径是否代表一个完整的键
	isEndOfKey bool

	// value 存储与此键关联的数据（如果 isEndOfKey 为 true）
	value interface{}
}

// NewNode 创建并返回一个 Radix Tree 节点
func NewNode(fragment string, isEndOfKey bool, val interface{}) *Node {
	return &Node{
		keyFragment: fragment,
		children:    make(map[rune]*Node),
		isEndOfKey:  isEndOfKey,
		value:       val,
	}
}
```

## 三、核心操作

Radix Tree 的核心操作包括插入 (Insert)、搜索 (Search) 和删除 (Delete)。这些操作的核心在于如何高效地匹配 `keyFragment` 并进行节点的分裂与合并。

### 3.1 插入 (Insert)

插入操作涉及遍历树，找到与新键匹配的最佳路径。根据匹配情况，可能需要：

1.  **完全匹配：** 如果键完全匹配到现有节点的 `keyFragment` 路径，并且该节点已被标记为键的结束，则更新其值。如果未标记，则标记为键的结束并设置值。
2.  **部分匹配 (分裂节点):** 如果新键与现有节点的 `keyFragment` 只有部分匹配，那么需要将现有节点分裂为两个节点：
    *   一个父节点，其 `keyFragment` 包含匹配的部分。
    *   一个子节点，其 `keyFragment` 包含未匹配的部分。
    *   新键的剩余部分作为另一个子节点连接到新的父节点。
3.  **无匹配 (添加新节点):** 如果新键的某个部分在当前节点的 `children` 中没有匹配项，则直接创建一个新的子节点来承载键的剩余部分。

**插入 "apply" 到上述 Radix Tree 的过程示例：**

*   从 Root 开始，匹配到 "te" (Node `NTE`)。
*   "apply" 剩余 "apply"，"te" 路径下的所有子路径都与 "a" 不匹配。
*   需要分裂 `NTE` 吗？不，因为 `apply` 的前缀是 `ap` 而不是 `te`。
*   实际上，"apply" 与 "test", "team", "toast", "tend", "top" 的公共前缀只有 "a"。
*   假设 `Root` 下有 "a" -> `Node_AP` (key_fragment "ap")。
    *   `Node_AP` 的 `keyFragment` 是 "ap"。
    *   "apply" 的剩余部分是 "ply"。
    *   因此，创建新的 `Node_APPLY` (key_fragment "ply") 作为 `Node_AP` 的子节点。

这说明 Radix Tree 的插入逻辑比 Trie 复杂得多，需要处理字符串片段的**最长公共前缀 (LCP)**、分裂和合并。

### 3.2 搜索 (Search)

搜索操作从根节点开始，沿着 `keyFragment` 与目标键匹配的路径向下遍历。

1.  从根节点开始，尝试匹配目标键与当前节点的子节点的 `keyFragment`。
2.  找到匹配的子节点后，将目标键的剩余部分（未匹配的部分）和当前子节点作为新的查找起点，继续递归。
3.  如果在遍历过程中，目标键被完全消耗，并且当前节点被标记为 `isEndOfKey = true`，则搜索成功。
4.  如果在任何一步无法找到匹配的子节点，或者目标键消耗完但当前节点未标记为键的结束，则搜索失败。

```go
// Search 在 Radix Tree 中查找键并返回其关联的值
func (n *Node) Search(key string) (interface{}, bool) {
	currentKey := key
	currentNode := n

	for {
		// 如果当前节点没有更多子节点，但我们仍有键要匹配，则查找失败
		if len(currentNode.children) == 0 && currentKey != "" {
			return nil, false
		}
		
		// 如果键已完全匹配
		if currentKey == "" {
			if currentNode.isEndOfKey {
				return currentNode.value, true
			}
			return nil, false // 键匹配结束，但不是一个完整的键
		}

		// 找到下一个匹配的子节点
		nextRune := rune(currentKey[0])
		child, exists := currentNode.children[nextRune]
		if !exists {
			return nil, false // 没有匹配的子节点
		}

		// 检查键的剩余部分与子节点的keyFragment的匹配程度
		fragmentLen := len(child.keyFragment)
		if len(currentKey) < fragmentLen || currentKey[:fragmentLen] != child.keyFragment {
			// 键的剩余部分不够长，或者不匹配子节点的keyFragment
			return nil, false
		}

		// 移动到子节点，并更新剩余键
		currentNode = child
		currentKey = currentKey[fragmentLen:]
	}
}
```
**注意：** 实际的 `Insert` 和 `Delete` 实现会比 `Search` 复杂得多，涉及字符串的 LCP 计算、节点分裂和合并的精确处理。上述 `Search` 示例仅为说明基本逻辑，并未涵盖所有边缘情况。

### 3.3 删除 (Delete)

删除操作是最复杂的操作。它不仅需要找到要删除的键，将其标记为非键的结束，还需要在必要时进行节点的合并以维护 Radix Tree 的压缩特性。

1.  **找到键：** 首先使用类似搜索的方法找到目标键对应的节点。
2.  **标记删除：** 将该节点的 `isEndOfKey` 设为 `false`。
3.  **后处理 (合并/移除)：**
    *   如果该节点现在既不是键的结束，也没有任何子节点，则可以从其父节点中移除。
    *   如果父节点因此只剩下一个子节点，且父节点本身也不是键的结束，那么父节点可以与其唯一的子节点合并，更新父节点的 `keyFragment`。
    *   这个合并过程可能需要递归向上执行。

## 四、优缺点

### 4.1 优点

*   **空间效率高：** 通过压缩单分支路径，显著减少了节点数量，特别适用于包含许多长公共前缀的字符串集合。
*   **时间效率高：** 大多数操作（插入、搜索、删除）的时间复杂度与键的长度 $L$ 相关，通常为 $O(L)$。由于跳过了中间节点，实际操作次数可能少于标准 Trie。
*   **快速前缀匹配：** 能够高效地查找所有具有特定前缀的键。
*   **字典序遍历：** 可以轻松地以字典序遍历树中存储的所有键。
*   **支持最长前缀匹配：** 可以在不完全匹配的情况下，找到与给定键具有最长公共前缀的键。

### 4.2 缺点

*   **实现复杂：** 节点的分裂、合并和 `keyFragment` 的管理使得插入和删除操作的实现比普通 Trie 复杂得多。需要仔细处理字符串的 LCP 计算和子字符串操作。
*   **内存开销 (特定情况):** 如果键的碎片都非常短，且键的数量巨大，那么 `map[rune]*Node` 的映射开销可能不容忽视。但通常，Radix Tree 的内存效率优于 Trie。

## 五、应用场景

Radix Tree 因其独特的空间和时间效率优势，在许多领域都有广泛应用：

*   **IP 路由表:** 路由器使用 Radix Tree 来存储和查找 IP 地址的路由信息。IP 地址可以被视为二进制字符串，Radix Tree 可以高效地进行最长前缀匹配来确定最佳路由。
*   **网络数据包过滤:** 根据数据包的头信息进行快速匹配和过滤。
*   **键值存储系统:** 作为底层数据结构，支持高效的字符串键查找，例如 LevelDB、RocksDB 内部有时会使用类似 Radix Tree 的结构。
*   **自动完成和拼写检查:** 快速查找具有共同前缀的单词。
*   **字典和词典：** 存储和检索单词，尤其是在需要前缀搜索或通配符搜索的场景。
*   **文件系统:** 某些文件系统索引可能使用 Radix Tree 结构来管理文件路径。
*   **版本控制系统:** 某些分布式版本控制系统可能使用 Radix Tree 结构来优化分支和合并操作。

## 六、总结

Radix Tree 是一种强大且高效的字符串数据结构，通过其独特的路径压缩机制，解决了传统 Trie 在空间效率上的不足。尽管其实现复杂度较高，但它在处理大量字符串键、需要快速前缀匹配和最长前缀匹配的场景中展现出卓越的性能优势，是许多底层系统和高性能应用的关键组件。理解 Radix Tree 的工作原理和核心操作，对于深入学习数据结构和构建高效的字符串处理系统至关重要。
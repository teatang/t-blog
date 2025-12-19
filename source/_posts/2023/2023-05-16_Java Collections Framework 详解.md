---
title: Java Collections Framework 详解
date: 2023-05-16 06:24:00
tags:
  - 2023
  - Java
  - 数据结构
  - 程序设计
categories:
  - Java
  - 库
---
> **Java Collections Framework (JCF)** 是 Java 语言中一套标准的接口、类和算法的集合，用于存储和操作对象组。它提供了一系列高性能的数据结构实现，如列表、集合、映射等，这些数据结构被精心设计以满足各种常见的数据存储和检索需求。JCF 旨在统一管理、操作对象集合的 API，提高 Java 程序的生产力和性能。

{% note info %}
**核心思想**：JCF 提供了一致的 API 来处理不同类型的数据结构，如列表、集合和映射，并与用于操作这些结构的标准算法（排序、搜索等）相结合。它允许开发者专注于业务逻辑，而不是底层数据结构的实现细节。
{% endnote %}
------

## 一、JCF 的发展历程与目的

在 JCF 出现之前 (即 JDK 1.2 之前)，Java 提供了 `Vector`、`Hashtable` 等线程安全的旧式集合类，以及数组。这些类功能有限，API 不统一，且缺乏泛型支持，使用起来不便。

JCF 的引入旨在解决以下问题：

1.  **统一 API**：提供一套统一的接口和类，使得操作不同类型的集合具有相似的代码模式。
2.  **提高性能**：提供高效的数据结构实现，并利用算法优化常见操作。
3.  **减少学习成本**：开发者只需学习一套 API 就可以处理各种集合类型。
4.  **增强互操作性**：不同组件之间可以无缝地传递和处理集合。
5.  **支持泛型 (Generics)**：从 Java 5 开始，JCF 与泛型结合，提供了更好的类型安全和代码可读性。
6.  **可扩展性**：提供抽象接口，允许开发者自定义集合实现。

## 二、JCF 核心接口体系

JCF 主要由三大核心接口及其子接口构成：`Collection`、`List`、`Set` 和 `Map`。

{% mermaid %}
graph LR
    A[Iterable<E>] --> B[Collection<E>]
    B --> C[List<E>]
    B --> D[Set<E>]
    B --> E[Queue<E>]

    C --> C1[ArrayList<E>]
    C --> C2[LinkedList<E>]
    C --> C3[Vector<E>]
    C --> C4[Stack<E>]

    D --> D1[HashSet<E>]
    D --> D2[LinkedHashSet<E>]
    D --> D3[SortedSet<E>]
    D3 --> D4[TreeSet<E>]

    E --> E1[PriorityQueue<E>]
    E --> E2[Deque<E>]
    E2 --> E3[ArrayDeque<E>]
    E2 --> C2_Linked[LinkedList<E>]

    F[Map<K, V>]
    F --> F1[HashMap<K, V>]
    F --> F2[LinkedHashMap<K, V>]
    F --> F3[SortedMap<K, V>]
    F3 --> F4[TreeMap<K, V>]
    F --> F5[Hashtable<K, V>]
{% endmermaid %}

### 2.1 `Iterable` 接口

*   `Iterable<E>` 是所有集合类的父接口，它不是 `Collection` 的子接口。
*   它只包含一个方法 `iterator()`，返回一个 `Iterator<E>` 对象。
*   这使得所有实现 `Iterable` 接口的类都可以使用增强 `for` 循环 (`for-each`) 遍历。

### 2.2 `Collection` 接口

*   `Collection<E>` 是所有单值集合的根接口，定义了操作对象组的基本行为。
*   **特性**：
    *   表示一组对象，这些对象被称为集合的元素 (Elements)。
    *   不保证元素的顺序。
    *   可能包含重复元素 (取决于具体实现，如 `List`) 或不允许重复 (如 `Set`)。
*   **常用方法**：`add()`, `remove()`, `contains()`, `size()`, `isEmpty()`, `toArray()`, `clear()` 等。

### 2.3 `List` 接口 (有序、可重复)

*   `List<E>` 是 `Collection` 的子接口，表示一个**有序的元素序列**。
*   **特性**：
    *   元素有严格的插入顺序，可以通过索引访问。
    *   允许包含重复元素。
    *   允许包含 `null` 元素。
*   **常用实现类**：
    1.  **`ArrayList`** (基于数组实现)
        *   **特点**：底层是动态数组，查询 / 随机访问快 (`get(index)`)。
        *   **增删效率**：插入或删除元素 (特别是中间位置) 效率较低，因为可能涉及到大量元素移动。
        *   **内存**：连续内存，空间利用率高。
        *   **线程安全**：非线程安全。
    2.  **`LinkedList`** (基于双向链表实现)
        *   **特点**：底层是双向链表，插入 / 删除效率高 (只需改变指针)。
        *   **查询效率**：随机访问效率低 (`get(index)` 需遍历)。
        *   **内存**：非连续内存，每个节点额外存储前后指针。
        *   **线程安全**：非线程安全。
    3.  **`Vector`** (旧式线程安全类)
        *   **特点**：与 `ArrayList` 类似，底层是动态数组，但所有方法都是 `synchronized` 的，因此是线程安全的。
        *   **效率**：因为同步开销，性能比 `ArrayList` 低。
        *   **遗留**：通常推荐使用 `Collections.synchronizedList(new ArrayList<>())` 或 `CopyOnWriteArrayList` 替代。
    4.  **`Stack`** (继承 `Vector` 的堆栈)
        *   **特点**：实现了后进先出 (LIFO) 的堆栈功能，但因继承 `Vector` 且 API 设计不佳，不推荐使用。
        *   **替代**：推荐使用 `Deque` 接口的实现，如 `ArrayDeque`。

**示例 (Java `List`)**：
```java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class ListExample {
    public static void main(String[] args) {
        List<String> arrayList = new ArrayList<>();
        arrayList.add("Apple");
        arrayList.add("Banana");
        arrayList.add("Grapes");
        arrayList.add("Banana"); // 允许重复
        System.out.println("ArrayList: " + arrayList); // [Apple, Banana, Grapes, Banana]
        System.out.println("Element at index 1: " + arrayList.get(1)); // Banana

        List<String> linkedList = new LinkedList<>();
        linkedList.add("Red");
        linkedList.add("Green");
        linkedList.addFirst("Blue"); // LinkedList 特有方法
        System.out.println("LinkedList: " + linkedList); // [Blue, Red, Green]
        linkedList.removeFirst();
        System.out.println("LinkedList after removeFirst: " + linkedList); // [Red, Green]
    }
}
```

### 2.4 `Set` 接口 (无序、不重复)

*   `Set<E>` 是 `Collection` 的子接口，表示一个**不允许包含重复元素**的集合。
*   **特性**：
    *   不保证元素的顺序。
    *   最多包含一个 `null` 元素。
    *   判断元素重复基于 `equals()` 方法。
*   **常用实现类**：
    1.  **`HashSet`** (基于哈希表实现)
        *   **特点**：查询、插入、删除效率高 (O(1) 平均)。
        *   **顺序**：不保证元素的迭代顺序，可能与插入顺序不同。
        *   **判重**：依赖元素的 `hashCode()` 和 `equals()` 方法。
        *   **线程安全**：非线程安全。
    2.  **`LinkedHashSet`** (基于哈希表和双向链表实现)
        *   **特点**：兼具 `HashSet` 的快速查找和 `LinkedList` 的插入顺序维护。
        *   **顺序**：维护元素的插入顺序 (迭代顺序与插入顺序一致)。
        *   **线程安全**：非线程安全。
    3.  **`TreeSet`** (基于红黑树实现)
        *   **特点**：存储的元素自动进行排序 (自然排序或自定义比较器)。
        *   **效率**：查询、插入、删除效率为 O(log N)。
        *   **判重 / 排序**：要求元素实现 `Comparable` 接口，或在创建 `TreeSet` 时提供 `Comparator`。
        *   **线程安全**：非线程安全。

**示例 (Java `Set`)**：
```java
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.TreeSet;

public class SetExample {
    public static void main(String[] args) {
        Set<String> hashSet = new HashSet<>();
        hashSet.add("Apple");
        hashSet.add("Banana");
        hashSet.add("Grapes");
        hashSet.add("Banana"); // 重复元素不会被添加
        System.out.println("HashSet: " + hashSet); // 输出顺序不确定，可能类似 [Apple, Grapes, Banana]

        Set<String> linkedHashSet = new LinkedHashSet<>();
        linkedHashSet.add("Apple");
        linkedHashSet.add("Banana");
        linkedHashSet.add("Grapes");
        System.out.println("LinkedHashSet: " + linkedHashSet); // [Apple, Banana, Grapes] (维护插入顺序)

        Set<Integer> treeSet = new TreeSet<>();
        treeSet.add(5);
        treeSet.add(2);
        treeSet.add(8);
        treeSet.add(2); // 重复元素不会被添加
        System.out.println("TreeSet: " + treeSet); // [2, 5, 8] (自动排序)
    }
}
```

### 2.5 `Queue` 接口 (队列)

*   `Queue<E>` 是 `Collection` 的子接口，表示一个**先进先出 (FIFO)** 的元素集合。
*   **特性**：
    *   常用于存储在处理之前暂存的元素。
    *   提供特定的插入 (`offer()`)、移除 (`poll()`) 和检查 (`peek()`) 元素的方法。
*   **常用实现类**：
    1.  **`PriorityQueue`** (基于堆实现)
        *   **特点**：队列中的元素会根据其自然排序或提供的 `Comparator` 进行排序，优先级高的元素优先出队。
        *   **线程安全**：非线程安全。
    2.  **`Deque` 接口** (继承自 `Queue`，双端队列)
        *   **特点**：双端队列，两端都可进可出。既可以作为队列 (FIFO)，也可以作为栈 (LIFO)。
        *   **常用实现**：`ArrayDeque`, `LinkedList`。
        *   `ArrayDeque` 是高效的非线程安全双端队列，作为栈 (Stack) 和队列 (Queue) 的替代品优于 `Stack` 和 `LinkedList`。

**示例 (Java `Queue` 和 `Deque`)**：
```java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.LinkedList;
import java.util.PriorityQueue;
import java.util.Queue;

public class QueueExample {
    public static void main(String[] args) {
        // Queue (FIFO)
        Queue<String> queue = new LinkedList<>(); // 通常用 LinkedList 作为 Queue 的实现
        queue.offer("Task1"); // 插入元素
        queue.offer("Task2");
        System.out.println("Queue: " + queue); // [Task1, Task2]
        System.out.println("Peek: " + queue.peek()); // Task1 (查看队首元素但不移除)
        System.out.println("Poll: " + queue.poll()); // Task1 (移除并返回队首元素)
        System.out.println("Queue after poll: " + queue); // [Task2]

        // Deque 作为栈 (LIFO)
        Deque<String> stack = new ArrayDeque<>(); // 比 Stack 类更推荐
        stack.push("A"); // 压栈
        stack.push("B");
        System.out.println("Stack (Deque): " + stack); // [B, A]
        System.out.println("Pop: " + stack.pop()); // B (弹栈)
        System.out.println("Stack after pop: " + stack); // [A]
    }
}
```

### 2.6 `Map` 接口 (键值对)

*   `Map<K, V>` 表示一个将键 (Key) 映射到值 (Value) 的对象。
*   **特性**：
    *   键是唯一的，不能重复。
    *   一个键只能映射到一个值。
    *   值可以重复。
    *   允许一个 `null` 键和多个 `null` 值 (取决于具体实现)。
    *   判断键重复基于键的 `hashCode()` 和 `equals()` 方法。
*   **常用方法**：`put(K key, V value)`, `get(Object key)`, `remove(Object key)`, `containsKey(Object key)`, `containsValue(Object value)`, `size()`, `isEmpty()`, `keySet()`, `values()`, `entrySet()`。
*   **常用实现类**：
    1.  **`HashMap`** (基于哈希表实现)
        *   **特点**：查找、插入、删除效率高 (O(1) 平均)。
        *   **顺序**：不保证键值对的迭代顺序。
        *   **线程安全**：非线程安全。
    2.  **`LinkedHashMap`** (基于哈希表和双向链表实现)
        *   **特点**：兼具 `HashMap` 的快速查找和维护插入顺序。
        *   **顺序**：维护键值对的插入顺序 (迭代顺序与插入顺序一致)。
        *   **线程安全**：非线程安全。
    3.  **`TreeMap`** (基于红黑树实现)
        *   **特点**：所有键值对按键的自然排序或自定义 `Comparator` 进行排序。
        *   **效率**：查找、插入、删除效率为 O(log N)。
        *   **线程安全**：非线程安全。
    4.  **`Hashtable`** (旧式线程安全类)
        *   **特点**：与 `HashMap` 类似，但所有方法都是 `synchronized` 的，因此是线程安全的。
        *   **效率**：因同步开销，性能比 `HashMap` 低。
        *   **遗留**：不允许 `null` 键和 `null` 值。通常推荐使用 `ConcurrentHashMap` 替代。

**示例 (Java `Map`)**：
```java
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

public class MapExample {
    public static void main(String[] args) {
        Map<String, Integer> hashMap = new HashMap<>();
        hashMap.put("Apple", 10);
        hashMap.put("Banana", 20);
        hashMap.put("Grapes", 15);
        hashMap.put("Apple", 25); // 键重复，值会被覆盖
        System.out.println("HashMap: " + hashMap); // {Apple=25, Banana=20, Grapes=15} (顺序不确定)
        System.out.println("Value of Banana: " + hashMap.get("Banana")); // 20

        Map<String, Integer> linkedHashMap = new LinkedHashMap<>();
        linkedHashMap.put("Apple", 10);
        linkedHashMap.put("Banana", 20);
        linkedHashMap.put("Grapes", 15);
        System.out.println("LinkedHashMap: " + linkedHashMap); // {Apple=10, Banana=20, Grapes=15} (维护插入顺序)

        Map<String, Integer> treeMap = new TreeMap<>();
        treeMap.put("Orange", 30);
        treeMap.put("Apple", 10);
        treeMap.put("Banana", 20);
        System.out.println("TreeMap: " + treeMap); // {Apple=10, Banana=20, Orange=30} (按键自然排序)
    }
}
```

## 三、`Collections` 工具类

`java.util.Collections` 是一个工具类，**注意它不是 `Collection` 接口**，它包含了一系列静态方法，用于对集合进行操作、搜索、排序、同步化、包装或创建不可变集合等。

*   **排序**：`sort(List)` (使用元素的自然顺序) 或 `sort(List, Comparator)`。
*   **搜索**：`binarySearch(List, Object)`。
*   **反转**：`reverse(List)`。
*   **混排**：`shuffle(List)`。
*   **同步包装器**：`synchronizedList(List)`, `synchronizedSet(Set)`, `synchronizedMap(Map)`。
*   **不可变集合**：`unmodifiableList(List)`, `unmodifiableSet(Set)`, `unmodifiableMap(Map)`。

**示例 (Java `Collections`)**：
```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CollectionsExample {
    public static void main(String[] args) {
        List<String> fruits = new ArrayList<>();
        fruits.add("Grapes");
        fruits.add("Apple");
        fruits.add("Banana");

        System.out.println("Original list: " + fruits); // [Grapes, Apple, Banana]

        // 排序
        Collections.sort(fruits);
        System.out.println("Sorted list: " + fruits); // [Apple, Banana, Grapes]

        // 查找
        int index = Collections.binarySearch(fruits, "Banana");
        System.out.println("Index of Banana: " + index); // 1

        // 反转
        Collections.reverse(fruits);
        System.out.println("Reversed list: " + fruits); // [Grapes, Banana, Apple]

        // 获取一个线程安全的 List
        List<String> synchronizedFruits = Collections.synchronizedList(new ArrayList<>());
        synchronizedFruits.add("Orange");
        System.out.println("Synchronized list: " + synchronizedFruits);
    }
}
```

## 四、迭代器 (Iterator)

*   `Iterator<E>` 是遍历集合元素的核心接口。
*   所有 `Collection` 及其子接口都提供了 `iterator()` 方法来获取 `Iterator` 实例。
*   **常用方法**：
    *   `hasNext()`：检查集合中是否还有下一个元素。
    *   `next()`：返回集合中的下一个元素，并将迭代器向前移动。
    *   `remove()`：从集合中移除 `next()` 方法返回的最后一个元素。
*   `Iterator` 是一种**安全**的遍历方式，因为它允许你在遍历过程中安全地移除元素，避免 `ConcurrentModificationException` (但只能通过迭代器自身的 `remove()` 方法)。

**示例 (Java `Iterator`)**：
```java
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class IteratorExample {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("Alice");
        names.add("Bob");
        names.add("Charlie");
        names.add("David");

        Iterator<String> iterator = names.iterator();
        while (iterator.hasNext()) {
            String name = iterator.next();
            System.out.println("Processing: " + name);
            if ("Bob".equals(name)) {
                iterator.remove(); // 使用迭代器安全移除元素
            }
        }
        System.out.println("List after iteration and removal: " + names); // [Alice, Charlie, David]
    }
}
```

## 五、线程安全集合

JCF 中的大部分实现（如 `ArrayList`, `HashSet`, `HashMap`）都是**非线程安全**的。
在多线程环境下使用这些集合时，需要进行外部同步，或者使用专门的线程安全集合。

*   **旧式集合**：`Vector`, `Hashtable` (已过时，性能较差)。
*   **包装器**：使用 `Collections.synchronizedList()`, `synchronizedSet()`, `synchronizedMap()` 方法对非线程安全的集合进行包装。
*   **Java 并发包 (`java.util.concurrent`)**：提供了一系列高性能的线程安全集合，推荐在多线程环境下使用：
    *   `ConcurrentHashMap`：高性能的并发 Map。
    *   `CopyOnWriteArrayList` / `CopyOnWriteArraySet`：读操作无需加锁，写操作复制底层数组 (适合读多写少场景)。
    *   `BlockingQueue` 及其实现 (`ArrayBlockingQueue`, `LinkedBlockingQueue`)：用于生产者-消费者模式。

## 六、遍历集合的方式

1.  **增强 `for` 循环 (`for-each`)**：适用于所有实现了 `Iterable` 接口的集合。
    ```java
    for (String item : myList) {
        System.out.println(item);
    }
    ```
2.  **`Iterator` 遍历**：最通用的遍历方式，可以在遍历过程中安全移除元素。
    ```java
    Iterator<String> it = myList.iterator();
    while (it.hasNext()) {
        System.out.println(it.next());
    }
    ```
3.  **Lambda 表达式 (Java 8+)**：结合 `forEach()` 方法，简洁优雅。
    ```java
    myList.forEach(item -> System.out.println(item));
    // 或方法引用
    myList.forEach(System.out::println);
    ```
4.  **普通 `for` 循环**：只适用于 `List` 接口 (因为可以按索引访问)。
    ```java
    for (int i = 0; i < myList.size(); i++) {
        System.out.println(myList.get(i));
    }
    ```

## 七、总结与选择建议

Java Collections Framework 提供了一整套丰富且高效的数据结构和算法，是 Java 编程中不可或缺的部分。理解其核心接口、常用实现类及其特性对于编写高效、健壮的 Java 代码至关重要。

**选择建议**：

*   **需要顺序和重复元素**：使用 `List`。
    *   读多写少、随机访问多：`ArrayList`。
    *   频繁插入 / 删除元素 (特别是两端)：`LinkedList`。
*   **需要唯一元素**：使用 `Set`。
    *   对顺序无要求，追求高性能：`HashSet`。
    *   需要维护插入顺序：`LinkedHashSet`。
    *   需要自动排序：`TreeSet`。
*   **需要键值对映射**：使用 `Map`。
    *   对键值对顺序无要求，追求高性能：`HashMap`。
    *   需要维护插入顺序：`LinkedHashMap`。
    *   需要按键自动排序：`TreeMap`。
*   **需要队列或栈行为**：使用 `Queue` 或 `Deque`。
    *   普通 FIFO 队列：`LinkedList` (作为 `Queue` 实现)。
    *   优先级队列：`PriorityQueue`。
    *   高效的 LIFO 栈或双端队列：`ArrayDeque`。
*   **多线程环境**：避免使用非同步集合，转而考虑：
    *   `java.util.concurrent` 包下的并发集合类 (如 `ConcurrentHashMap`, `CopyOnWriteArrayList`)。
    *   `Collections.synchronizedXxx()` 包装器。

通过深入理解 JCF，开发者可以更好地选择合适的数据结构来解决实际问题，从而编写出更高质量的 Java 应用程序。
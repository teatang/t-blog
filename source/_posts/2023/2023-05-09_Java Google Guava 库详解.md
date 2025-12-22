---
title: Java Google Guava 库详解
date: 2023-05-09 06:24:00
tags:
  - 2023
  - Java
  - 程序设计
categories:
  - Java
  - 库
---
> **Google Guava 库** 是 Google 开发并开源的一套 Java 核心库，旨在提高 Java 开发效率和代码质量。它提供了大量针对 Java 核心功能（如集合、缓存、并发、字符串处理、I/O 等）的增强和实用工具，旨在解决 JDK 自身 API 在某些方面的不足，并引入了现代编程范式和最佳实践。

{% note info %}
核心思想：**Guava 通过提供一套功能丰富、高性能、经过严格测试的 Java 工具集，补充了 JDK 的功能，简化了常见编程任务，提高了代码的健壮性、可读性和开发效率。**
{% endnote %}

------

## 一、为什么需要 Google Guava 库？

尽管 Java 标准库功能强大，但在实际开发中，开发者经常面临以下挑战：

1.  **集合操作的不足**：JDK 集合框架虽然基础完善，但在创建、转换、过滤、组合集合时，往往需要编写冗长或低效的代码（尤其是在 Java 8 Stream API 之前）。例如，多值 Map、双向 Map 等。
2.  **字符串处理的繁琐**：字符串的判空、拼接、分割等操作在 JDK 中不够简洁和健壮。
3.  **并发编程的复杂性**：并发工具类虽然有，但对于一些高级并发模式和数据结构（如 Rate Limiter、Future 增强）仍有需求。
4.  **空指针异常 (NPE)**：`NullPointerException` 是 Java 开发中最常见的错误之一，JDK 在处理 `null` 值时缺乏统一优雅的机制。
5.  **I/O 操作的复杂性**：底层 I/O 操作相对繁琐，需要大量的样板代码。
6.  **基本类型操作**：缺乏对基本数据类型数组和集合的便捷操作。
7.  **缓存实现**：JDK 没有内置的本地缓存解决方案。
8.  **代码质量与测试**：许多开发者自己编写的工具类可能缺乏完善的测试和性能优化。

Guava 正是为了解决这些问题而设计。它提供了一系列经过精心设计、高度优化、并经过 Google 大规模生产环境验证的工具类，帮助开发者编写更简洁、更安全、更高效的 Java 代码。

## 二、Google Guava 核心模块概览

Guava 库是一个庞大的集合，由多个独立的模块组成。以下是一些最常用和最重要的模块：

1.  **`com.google.common.collect` (集合)**：Guava 最核心且最受欢迎的模块。提供了一系列 JDK 集合框架的增强，包括新的集合类型（如 `Multiset`, `Multimap`, `BiMap`）、强大的集合工具类（如 `Lists`, `Sets`, `Maps`），以及函数式编程工具（`Function`, `Predicate`）。
2.  **`com.google.common.base` (基础工具)**：提供核心的实用方法，如 `Optional` (处理 `null` 值)、`Preconditions` (前置条件检查)、`Strings` (字符串操作)、`Joiner` (连接器)、`Splitter` (分割器)。
3.  **`com.google.common.io` (I/O)**：简化 I/O 操作的工具类，如文件操作、流处理等。
4.  **`com.google.common.cache` (缓存)**：提供一个强大的内存缓存框架 `LoadingCache`，支持过期、淘汰策略等。
5.  **`com.google.common.util.concurrent` (并发)**：增强 JDK 并发工具，提供 `ListenableFuture` (可监听的 Future)、`RateLimiter` (限流器)、`Service` (服务生命周期管理) 等。
6.  **`com.google.common.primitives` (基本类型)**：提供基本数据类型（如 `int`, `long`, `boolean` 等）的数组和包装类操作。
7.  **`com.google.common.hash` (哈希)**：提供多种哈希函数，如 `MurmurHash3`、`MD5`、`SHA` 等。
8.  **`com.google.common.eventbus` (事件总线)**：一个轻量级的事件发布/订阅框架。

## 三、常用模块详解与代码示例

为了更好地理解 Guava 的强大之处，我们将详细介绍几个最常用且极具代表性的模块，并提供相应的 Java 代码示例。

**Maven 依赖：**

```xml
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>32.1.3-jre</version> <!-- 请使用最新稳定版本 -->
</dependency>
```

### 3.1 `com.google.common.base` (基础工具)

这个模块包含了许多基础且常用的工具，可以极大地简化代码。

#### 3.1.1 `Optional`：优雅地处理 `null` 值

`Optional` 是一个容器对象，可能包含一个非 `null` 的值，也可能不包含任何值。它鼓励你显式地处理可能为 `null` 的情况，从而减少 `NullPointerException` 的发生。

```java
import com.google.common.base.Optional;

public class OptionalDemo {
    public static void main(String[] args) {
        // 创建 Optional 实例
        Optional<Integer> possible = Optional.of(5); // 包含一个非 null 值
        Optional<Integer> absent = Optional.absent(); // 不包含任何值

        // 检查是否存在
        System.out.println("possible.isPresent(): " + possible.isPresent()); // true
        System.out.println("absent.isPresent(): " + absent.isPresent());     // false

        // 获取值 (如果不存在则抛出 IllegalStateException)
        System.out.println("possible.get(): " + possible.get()); // 5

        // 获取值或返回默认值
        System.out.println("absent.or(0): " + absent.or(0));     // 0
        System.out.println("possible.or(0): " + possible.or(0)); // 5

        // 获取值或使用 Supplier 提供默认值 (Java 8 Optional 提供)
        // System.out.println("absent.or(() -> 0): " + absent.or(() -> 0)); // Guava Optional 不直接支持 Supplier，需用 Java 8 Optional
      
        // 获取值或抛出指定异常
        try {
            absent.get();
        } catch (IllegalStateException e) {
            System.err.println("Attempted to get value from absent Optional, caught: " + e.getClass().getSimpleName());
        }

        // 可以链式操作
        String result = Optional.of("Hello")
                                .transform(s -> s + " World") // apply a function
                                .or("Default");
        System.out.println("Transformed: " + result); // Hello World

        String nullResult = Optional.<String>absent()
                                    .transform(s -> s + " World")
                                    .or("Default");
        System.out.println("Null transformed: " + nullResult); // Default
    }
}
```
**注意：** 从 Java 8 开始，JDK 也引入了 `java.util.Optional`，功能与 Guava 的 `Optional` 类似，且在 Stream API 中有良好集成。在新的项目中，通常推荐使用 JDK 的 `Optional`。Guava 的 `Optional` 主要用于兼容旧版本 JDK 或 Guava 特定的 API。

#### 3.1.2 `Preconditions`：前置条件检查

`Preconditions` 类提供了一系列静态方法，用于在方法或构造器执行前，检查参数或状态是否满足特定条件。这有助于在问题发生时尽快发现并抛出具有明确信息的异常。

```java
import com.google.common.base.Preconditions;

public class PreconditionsDemo {
    public static void main(String[] args) {
        int age = 15;
        String name = null;
        String message = "Hello";

        try {
            // 1. 检查参数是否为 null
            Preconditions.checkNotNull(name, "Name must not be null.");
        } catch (NullPointerException e) {
            System.err.println("Caught NPE: " + e.getMessage()); // Caught NPE: Name must not be null.
        }

        try {
            // 2. 检查布尔条件是否为真
            Preconditions.checkArgument(age >= 18, "Age must be 18 or older, but was %s.", age);
        } catch (IllegalArgumentException e) {
            System.err.println("Caught IAE: " + e.getMessage()); // Caught IAE: Age must be 18 or older, but was 15.
        }

        try {
            // 3. 检查对象状态 (通常用于非方法参数)
            Preconditions.checkState(message.length() > 10, "Message length must be greater than 10.");
        } catch (IllegalStateException e) {
            System.err.println("Caught ISE: " + e.getMessage()); // Caught ISE: Message length must be greater than 10.
        }

        // 4. 检查索引越界
        List<String> list = Arrays.asList("a", "b", "c");
        try {
            Preconditions.checkElementIndex(5, list.size(), "Element index out of bounds.");
        } catch (IndexOutOfBoundsException e) {
            System.err.println("Caught IOOBE: " + e.getMessage()); // Caught IOOBE: Element index out of bounds. (actual size 3)
        }
    }
}
```

#### 3.1.3 `Strings`, `Joiner`, `Splitter`：强大的字符串工具

*   **`Strings`**：提供 `null` 安全的字符串操作。
*   **`Joiner`**：更灵活、更健壮地连接字符串。
*   **`Splitter`**：更灵活、更健壮地分割字符串。

```java
import com.google.common.base.Joiner;
import com.google.common.base.Splitter;
import com.google.common.base.Strings;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class StringToolsDemo {
    public static void main(String[] args) {
        // 1. Strings
        String str1 = null;
        String str2 = "";
        String str3 = "  ";
        String str4 = "Guava";

        System.out.println("Strings.isNullOrEmpty(str1): " + Strings.isNullOrEmpty(str1)); // true
        System.out.println("Strings.isNullOrEmpty(str2): " + Strings.isNullOrEmpty(str2)); // true
        System.out.println("Strings.isNullOrEmpty(str3): " + Strings.isNullOrEmpty(str3)); // false (not empty)
        System.out.println("Strings.nullToEmpty(str1): '" + Strings.nullToEmpty(str1) + "'"); // ''
        System.out.println("Strings.emptyToNull(str2): " + Strings.emptyToNull(str2)); // null
        System.out.println("Strings.repeat(\"abc\", 3): " + Strings.repeat("abc", 3)); // abcabcabc

        // 2. Joiner
        List<String> names = Arrays.asList("Alice", "Bob", null, "Charlie");
        // 跳过 null 值连接
        String joinedNames = Joiner.on(", ")
                                   .skipNullls()
                                   .join(names);
        System.out.println("Joined Names (skip nulls): " + joinedNames); // Alice, Bob, Charlie

        // 替换 null 值连接
        String joinedNamesWithNull = Joiner.on(", ")
                                           .useForNull("UNKNOWN")
                                           .join(names);
        System.out.println("Joined Names (useForNull): " + joinedNamesWithNull); // Alice, Bob, UNKNOWN, Charlie

        Map<String, String> map = Map.of("firstName", "John", "lastName", "Doe");
        String joinedMap = Joiner.on("&")
                                 .withKeyValueSeparator("=")
                                 .join(map);
        System.out.println("Joined Map: " + joinedMap); // firstName=John&lastName=Doe

        // 3. Splitter
        String input = "foo,bar,,baz,";
        // 按照逗号分割，并移除空字符串，去除两端空格
        Iterable<String> parts = Splitter.on(',')
                                         .omitEmptyStrings()
                                         .trimResults()
                                         .split(input);
        System.out.println("Split parts: " + parts); // [foo, bar, baz]

        String complexInput = "key1=value1; key2=value2; key3=; key4";
        // 按照分号分割，再按照等号分割为 Map
        Map<String, String> paramMap = Splitter.on(';')
                                               .omitEmptyStrings()
                                               .trimResults()
                                               .withKeyValueSeparator("=")
                                               .split(complexInput);
        System.out.println("Split to Map: " + paramMap); // {key1=value1, key2=value2, key3=}
    }
}
```

### 3.2 `com.google.common.collect` (集合工具)

Guava 的集合模块提供了许多 JDK 集合框架的增强，是其最受欢迎的特性之一。

#### 3.2.1 强大的集合工厂方法

创建集合更方便，且是不可变集合。

```java
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableSet;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.google.common.collect.Sets;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class CollectionFactoriesDemo {
    public static void main(String[] args) {
        // 1. 经典的可变集合创建 (Guava 提供便捷方法)
        List<String> list = Lists.newArrayList("a", "b", "c");
        Set<Integer> set = Sets.newHashSet(1, 2, 3);
        Map<String, Integer> map = Maps.newHashMap();
        map.put("one", 1);

        System.out.println("Mutable List: " + list); // [a, b, c]
        System.out.println("Mutable Set: " + set);   // [1, 2, 3] (顺序不定)
        System.out.println("Mutable Map: " + map);   // {one=1}

        // 2. 不可变集合 (线程安全，内存效率高，可以作为常量)
        ImmutableList<String> immutableList = ImmutableList.of("x", "y", "z");
        ImmutableSet<Integer> immutableSet = ImmutableSet.of(10, 20, 30);
        ImmutableMap<String, String> immutableMap = ImmutableMap.of("key1", "val1", "key2", "val2");

        System.out.println("Immutable List: " + immutableList); // [x, y, z]
        System.out.println("Immutable Set: " + immutableSet);   // [10, 20, 30]
        System.out.println("Immutable Map: " + immutableMap);   // {key1=val1, key2=val2}

        // immutableList.add("w"); // 编译错误或运行时抛出 UnsupportedOperationException
    }
}
```

#### 3.2.2 新的集合类型 (`Multiset`, `Multimap`, `BiMap`)

*   **`Multiset`**：一种可以包含重复元素的集合，并能追踪每个元素的出现次数。
*   **`Multimap`**：一个键可以关联多个值的映射表（类似 `Map<K, Collection<V>>`，但更方便）。
*   **`BiMap`**：双向 Map，键和值都是唯一的，且可以通过值查找键。

```java
import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;
import com.google.common.collect.HashMultimap;
import com.google.common.collect.HashMultiset;
import com.google.common.collect.Multimap;
import com.google.common.collect.Multiset;

public class NewCollectionsDemo {
    public static void main(String[] args) {
        // 1. Multiset (多重集合)
        Multiset<String> wordCounts = HashMultiset.create();
        wordCounts.add("apple");
        wordCounts.add("banana");
        wordCounts.add("apple");
        wordCounts.add("orange", 3); // 添加3次

        System.out.println("Word counts: " + wordCounts); // [apple x 2, banana x 1, orange x 3]
        System.out.println("Count of 'apple': " + wordCounts.count("apple"));   // 2
        System.out.println("Size (total elements): " + wordCounts.size());       // 6
        System.out.println("Element Set (unique elements): " + wordCounts.elementSet()); // [apple, banana, orange]

        // 2. Multimap (多值映射)
        Multimap<String, String> dictionary = HashMultimap.create();
        dictionary.put("apple", "fruit");
        dictionary.put("apple", "device");
        dictionary.put("banana", "fruit");

        System.out.println("Apple definitions: " + dictionary.get("apple")); // [fruit, device]
        System.out.println("Dictionary: " + dictionary); // {apple=[fruit, device], banana=[fruit]}
        System.out.println("Contains 'fruit': " + dictionary.containsValue("fruit")); // true
        System.out.println("Key Set: " + dictionary.keySet()); // [apple, banana]
        System.out.println("Entries: " + dictionary.entries()); // [apple=fruit, apple=device, banana=fruit]

        // 3. BiMap (双向映射)
        BiMap<String, String> userEmails = HashBiMap.create();
        userEmails.put("john", "john@example.com");
        userEmails.put("jane", "jane@example.com");

        System.out.println("Email of john: " + userEmails.get("john")); // john@example.com
        System.out.println("User for jane@example.com: " + userEmails.inverse().get("jane@example.com")); // jane

        // 试图put重复的值会报错
        try {
            userEmails.put("peter", "john@example.com");
        } catch (IllegalArgumentException e) {
            System.err.println("Caught IAE when putting duplicate value: " + e.getMessage());
        }
        // 使用 forcePut 强制替换
        userEmails.forcePut("peter", "john@example.com"); // "john" 键会被移除
        System.out.println("BiMap after forcePut: " + userEmails); // {jane=jane@example.com, peter=john@example.com}
    }
}
```

### 3.3 `com.google.common.cache` (缓存)

Guava 提供了 `LoadingCache`，这是一个功能强大的本地内存缓存，支持多种淘汰策略（LRU、LFU、FIFO）、基于时间或大小的过期、以及自动加载机制。

```java
import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

public class LoadingCacheDemo {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        // 创建一个 LoadingCache
        // 1. 设置最大容量为 100
        // 2. 设置写入后 10 秒过期
        // 3. 定义 CacheLoader，用于在缓存中找不到对应值时，自动加载数据
        LoadingCache<String, String> cache = CacheBuilder.newBuilder()
                .maximumSize(100) // 最大容量
                .expireAfterWrite(10, TimeUnit.SECONDS) // 写入后10秒过期
                .build(new CacheLoader<String, String>() {
                    @Override
                    public String load(String key) throws Exception {
                        // 模拟从数据库或远程服务加载数据
                        System.out.println("Loading data for key: " + key + " from external source...");
                        return key.toUpperCase() + "_LOADED";
                    }
                });

        // 首次获取，会触发 load 方法
        System.out.println("Value for 'key1': " + cache.get("key1")); // Output: Loading..., Value...
        System.out.println("Value for 'key1' again: " + cache.get("key1")); // 不会触发 load，直接从缓存获取

        // 放入一个新值
        cache.put("key2", "custom_value");
        System.out.println("Value for 'key2': " + cache.get("key2")); // custom_value (不会触发 load)

        // 等待一段时间，让 'key1' 过期
        System.out.println("Waiting for key1 to expire...");
        TimeUnit.SECONDS.sleep(11);

        // 再次获取 'key1'，会重新触发 load 方法
        System.out.println("Value for 'key1' after expiration: " + cache.get("key1")); // Output: Loading..., Value...

        // 缓存统计
        System.out.println("Cache stats: " + cache.stats());
    }
}
```

### 3.4 `com.google.common.util.concurrent` (并发工具)

Guava 提供了许多有用的并发工具，例如 `ListenableFuture` 和 `RateLimiter`。

#### 3.4.1 `RateLimiter`：限流器

`RateLimiter` 可以限制某个操作的执行速率，常用于控制对资源的访问频率。

```java
import com.google.common.util.concurrent.RateLimiter;

public class RateLimiterDemo {
    public static void main(String[] args) throws InterruptedException {
        // 创建一个每秒最多生成 2 个令牌的限流器
        RateLimiter limiter = RateLimiter.create(2.0); // 2 permits per second

        System.out.println("Attempting to acquire 1 permit...");
        long start = System.currentTimeMillis();
        limiter.acquire(1); // 阻塞直到获得1个令牌
        System.out.println("Acquired 1 permit in " + (System.currentTimeMillis() - start) + "ms.");

        System.out.println("Attempting to acquire 1 permit again...");
        start = System.currentTimeMillis();
        limiter.acquire(1); // 阻塞，因为上一秒的令牌已用完，需要等待
        System.out.println("Acquired 1 permit in " + (System.currentTimeMillis() - start) + "ms."); // 应该接近 500ms (1/2 秒)

        System.out.println("Attempting to acquire 2 permits...");
        start = System.currentTimeMillis();
        limiter.acquire(2); // 阻塞
        System.out.println("Acquired 2 permits in " + (System.currentTimeMillis() - start) + "ms."); // 应该接近 1000ms

        // 尝试非阻塞获取
        if (limiter.tryAcquire(1)) {
            System.out.println("Successfully acquired 1 permit (non-blocking).");
        } else {
            System.out.println("Failed to acquire 1 permit (non-blocking).");
        }
    }
}
```

## 四、如何引入 Google Guava 库？

通过 Maven 或 Gradle 等构建工具引入 Guava 非常简单。

**Maven (pom.xml):**

```xml
<dependencies>
    <dependency>
        <groupId>com.google.guava</groupId>
        <artifactId>guava</artifactId>
        <version>32.1.3-jre</version> <!-- 推荐使用最新稳定版本，-jre 或 -android 依项目而定 -->
    </dependency>
</dependencies>
```

**Gradle (build.gradle):**

```gradle
dependencies {
    implementation 'com.google.guava:guava:32.1.3-jre' // 推荐使用最新稳定版本
}
```
**注意：**
*   `guava-jre` 适用于普通 JVM 项目。
*   `guava-android` 适用于 Android 项目（针对 Android 平台的兼容性优化）。
*   请根据你的项目类型选择合适的版本。

## 五、Guava 的优势与最佳实践

### 5.1 优势：

1.  **功能丰富**：覆盖了 Java 开发的多个领域，弥补了 JDK 的不足。
2.  **代码简洁**：大量工具方法可以帮助开发者用更少的代码完成复杂的任务。
3.  **高性能**：经过 Google 大规模生产环境的验证和优化，性能卓越。
4.  **类型安全**：充分利用 Java 泛型，提供了编译时类型检查。
5.  **健壮性**：严格的 `null` 值处理（如 `Optional` 和 `Preconditions`）有助于减少 `NPE`。
6.  **可读性**：清晰的 API 设计和命名，提升了代码的可读性。
7.  **社区活跃**：Google 持续维护和更新，社区支持良好。

### 5.2 最佳实践：

1.  **按需引入**：虽然 Guava 功能强大，但也要避免过度依赖。只在确实需要时引入特定功能，避免为了少量功能而引入整个库。
2.  **熟悉核心模块**：重点学习 `base` 和 `collect` 模块，它们涵盖了日常开发中最常用的功能。
3.  **优先使用 Guava 替代手动实现**：在处理集合、字符串、缓存、并发等常见任务时，优先考虑使用 Guava 提供的成熟方案，而不是自己编写容易出错或性能不佳的工具类。
4.  **Java 8+ 与 Guava 的协调**：在 Java 8 及更高版本中，JDK 引入了 Stream API 和 `java.util.Optional` 等功能，与 Guava 的一些功能有重叠。在新的项目或模块中，可以优先考虑使用 JDK 8+ 的新特性，但在旧项目或需要 Guava 特有功能（如 `Multimap`, `BiMap`, `LoadingCache`, `RateLimiter`）时，Guava 依然是不可替代的选择。
5.  **注意 `Optional` 的选择**：如果项目使用 Java 8+，推荐使用 `java.util.Optional`；如果需要兼容旧版本 JDK 或 Guava 特定 API，可以使用 `com.google.common.base.Optional`。

## 六、总结

Google Guava 库是 Java 生态系统中一个不可或缺的工具集。它以其丰富的功能、卓越的性能、严格的测试和现代化的设计理念，极大地提升了 Java 开发的效率和代码质量。无论是处理集合、字符串、缓存、并发还是 `null` 值，Guava 都提供了优雅而高效的解决方案。掌握 Guava 的使用，能够让 Java 开发者编写出更简洁、更健壮、更具可维护性的代码，是提升个人技术栈的重要一步。
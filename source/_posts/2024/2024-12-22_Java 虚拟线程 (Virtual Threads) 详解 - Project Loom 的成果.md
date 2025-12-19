---
title: Java 虚拟线程 (Virtual Threads) 详解 - Project Loom 的成果
date: 2024-12-22 06:24:00
tags:
  - 2024
  - Java
  - 程序设计
  - 编码规范
  - 并发编程
categories:
  - Java
  - 程序设计
---

> **虚拟线程 (Virtual Threads)** 是 Java 平台在 **JDK 21 中正式引入** 的一项革命性并发特性（作为 Project Loom [<sup>1</sup>](https://openjdk.org/projects/loom/) 的主要成果）。它旨在显著简化高吞吐量并发应用的开发和维护，通过提供轻量级的、由 JVM 管理的线程，解决传统平台线程在高并发场景下的性能瓶颈和资源消耗问题。

{% note info %}
**核心思想**：虚拟线程让开发者能够继续沿用更直观的“**一请求一线程 (thread-per-request)**”的编程模型，同时获得接近异步编程的扩展能力。它将阻塞 I/O 操作的开销从昂贵的操作系统线程转移到了 JVM 层面，从而在不改变代码风格的情况下，极大提升了服务器应用的并发吞吐量。
{% endnote %}
------

## 一、为什么需要虚拟线程？(传统并发的痛点)

在 Java 历史上，处理并发主要依赖于传统的 **平台线程 (Platform Threads)**，也就是我们通常所说的 `java.lang.Thread` 类实例。这些线程直接映射到操作系统 (OS) 线程。

传统平台线程在高并发场景下存在以下痛点：

1.  **资源开销大**：每个平台线程都需要操作系统分配独立的栈空间（通常 1MB 或更多），以及维护其上下文信息。大量线程会导致严重的内存占用。
2.  **上下文切换开销高**：当大量线程并发运行时，OS 需要频繁地进行线程上下文切换，这会消耗大量的 CPU 资源，降低程序执行效率。
3.  **阻塞I/O问题**：许多企业应用的核心逻辑都涉及同步阻塞 I/O（如数据库查询、网络调用、文件读写）。在一个“一请求一线程”的模型中，当一个平台线程执行阻塞 I/O 操作时，它会被 OS 挂起，且在整个阻塞期间无法被用于处理其他请求。这意味着为了处理 N 个同时发出阻塞 I/O 请求的客户端，需要 N 个平台线程，这很快就会耗尽系统资源。
    {% mermaid %}
    graph LR
        subgraph "Server Application (Platform Threads)"
            Request1[Req 1] -- Creates --> PThread1[Platform Thread 1]
            Request2[Req 2] -- Creates --> PThread2[Platform Thread 2]
            Request3[Req 3] -- Creates --> PThread3[Platform Thread 3]
            RequestN[Req N] -- Creates --> PThreadN[Platform Thread N]
            PThread1 -- Blocks on --> DB_IO[Database I/O]
            PThread2 -- Blocks on --> Network_IO[Network I/O]
            PThread3 -- Blocks on --> File_IO[File I/O]
            PThreadN -- Blocks on --> External_Service[External Service Call]
        end
        DB_IO & Network_IO & File_IO & External_Service --> IO_Latency[I/O Latency]
        PThread1 & PThread2 & PThread3 & PThreadN -- All Active --> OSResourceExhaustion[OS 资源耗尽: 内存、CPU、线程数限制]
    {% endmermaid %}
4.  **编程模型复杂**：为了避免上述问题，开发者不得不转向复杂的异步编程模型（如 Reactor 模式、Reactive Streams），这通常需要使用回调函数、Future、响应式框架（如 Reactor, RxJava），极大地增加了代码的复杂性和调试难度。

虚拟线程的目标就是解决这些问题，让 Java 开发者能够以更简单、更高效的方式编写高并发代码。

## 二、虚拟线程的核心概念

### 2.1 平台线程 (Platform Threads) vs 虚拟线程 (Virtual Threads)

*   **平台线程 (Platform Thread)**：传统的 Java 线程，也称为“重量级线程”。它是一个 OS 线程的薄包装，`start()` 方法会向操作系统请求创建一个新线程。OS 负责其调度和管理。数量受限于 OS 的资源，通常几千个是上限。
*   **虚拟线程 (Virtual Thread)**：一种由 JVM 管理的“轻量级线程”，不直接映射到 OS 线程。它是一个 `java.lang.Thread` 实例，但其生命周期由 JVM 管理，调度由 JVM 完成，而不是 OS。虚拟线程可以创建数百万个，因为它们的内存开销（通常只有几百字节）和 CPU 开销都非常小。

### 2.2 载体线程 (Carrier Threads)

虚拟线程并非凭空存在，它们必须依附于少量的、由 JVM 管理的 **平台线程** 来运行。这些平台线程被称为 **载体线程 (Carrier Threads)**。

*   当一个虚拟线程执行计算密集型任务时，它会“**挂载 (mount)**”到一个载体线程上运行。
*   当虚拟线程遇到阻塞 I/O 操作时，它会“**卸载 (unmount)**”自己，将载体线程释放回线程池（通常是 `ForkJoinPool`），让该载体线程可以去执行其他虚拟线程。
*   当阻塞 I/O 操作完成时，虚拟线程会被重新“挂载”到可用的载体线程上继续执行。

这个过程对应用程序完全透明。

{% mermaid %}
graph LR
    Client1[Client Request 1] -- New --> VThread1[Virtual Thread 1]
    Client2[Client Request 2] -- New --> VThread2[Virtual Thread 2]
    Client3[Client Request 3] -- New --> VThread3[Virtual Thread 3]
    Client4[Client Request 4] -- New --> VThread4[Virtual Thread 4]
    Client5[Client Request 5] -- New --> VThread5[Virtual Thread 5]
    Client6[Client Request 6] -- New --> VThread6[Virtual Thread 6]
    Client7[Client Request 7] -- New --> VThread7[Virtual Thread 7]
    Client8[Client Request 8] -- New --> VThread8[Virtual Thread 8]
    ClientN[...Client Request N] -- New --> VThreadN[...Virtual Thread N]

    subgraph "JVM Virtual Thread Scheduler (ForkJoinPool)"
        CThread1["Carrier Thread 1 (OS Thread)"]
        CThread2["Carrier Thread 2 (OS Thread)"]
        CThread3["Carrier Thread 3 (OS Thread)"]
        CThreadM["...Carrier Thread M (OS Thread)"]
    end

    VThread1 -- Mounts on --> CThread1
    VThread2 -- Mounts on --> CThread1
    VThread3 -- Mounts on --> CThread2
    VThread4 -- Mounts on --> CThread2
    VThread5 -- Blocks on I/O --> IO_Op[I/O Operation]
    IO_Op -- Releases CThread --> CThread3
    VThread6 -- Mounts on --> CThread3
    VThread7 -- Mounts on --> CThread3
    VThread8 -- Blocks on I/O --> IO_Op2[I/O Operation]
    IO_Op2 -- Releases CThread --> CThreadM
    VThreadN -- Is Scheduled On --> CThreadM
{% endmermaid %}
上图中，多个虚拟线程被调度器分派到少数几个载体线程上运行。当虚拟线程 `VThread5` 遇到阻塞 I/O 时，它会从载体线程上卸载，载体线程 `CThread2` 被释放，可以去服务其他虚拟线程。当 `VThread5` 的 I/O 完成后，它会被调度器重新挂载到任意一个可用的载体线程上继续执行。

### 2.3 工作窃取 (Work Stealing)

虚拟线程的调度器通常使用 **工作窃取** 算法。`ForkJoinPool` 是一个常见的实现。

*   每个载体线程都有一个任务队列。
*   当一个载体线程任务不多时，它会从其他载体线程的队列中“窃取”任务来执行，从而保持所有载体线程的忙碌，实现负载均衡。

## 三、虚拟线程的特性与优势

1.  **极度轻量**：创建成本极低，一个虚拟线程的内存占用通常只有几百字节（而不是平台线程的 1-2MB 栈空间）。这意味着可以轻松创建数百万个虚拟线程。
2.  **由 JVM 调度**：不同于平台线程由 OS 调度，虚拟线程的调度完全由 JVM 负责，上下文切换开销远低于 OS 级的上下文切换。
3.  **阻塞不阻塞载体线程**：这是最核心的特性。当虚拟线程执行一个阻塞操作（如等待 I/O）时，它不会阻塞底层的载体线程。JVM 会将该虚拟线程“卸载”下来，让载体线程去执行其他就绪的虚拟线程。当阻塞操作完成后，该虚拟线程会重新被“挂载”到某个载体线程上继续执行。
4.  **编程模型向后兼容**：虚拟线程是 `java.lang.Thread` 的一个实现，因此现有依赖 `Thread` API 的代码无需修改即可运行在虚拟线程上。开发者可以沿用熟悉的同步阻塞编程风格，但获得高并发能力。
5.  **高吞吐量**：显著提升了高并发 I/O 密集型应用的吞吐量，因为它消除了传统线程池中“线程忙于等待”的问题。

## 四、如何使用虚拟线程 (Java API)

从 JDK 21 开始，虚拟线程的 API 已经稳定。创建和使用虚拟线程非常简单。

### 4.1 创建单个虚拟线程

使用 `Thread.ofVirtual()` 工厂方法：

```java
import java.io.IOException;

public class VirtualThreadBasic {
    public static void main(String[] args) throws InterruptedException {
        Runnable runnable = () -> {
            System.out.println(Thread.currentThread().getName() + " started.");
            try {
                // 模拟一个阻塞I/O操作，但不会阻塞底层载体线程
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            System.out.println(Thread.currentThread().getName() + " finished.");
        };

        // 创建并启动一个虚拟线程
        Thread virtualThread = Thread.ofVirtual().name("my-virtual-thread").start(runnable);

        System.out.println("Main thread continues...");
        virtualThread.join(); // 等待虚拟线程完成
        System.out.println("Main thread finished.");
    }
}
```

### 4.2 使用 `ExecutorService` 管理虚拟线程

为了更好地管理大量虚拟线程，可以使用 `Executors.newVirtualThreadPerTaskExecutor()`，它会为每个提交的任务创建一个新的虚拟线程。

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

public class VirtualThreadExecutor {
    public static void main(String[] args) throws InterruptedException {
        // 创建一个ExecutorService，为每个任务创建一个虚拟线程
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            IntStream.range(0, 10_000).forEach(i -> {
                executor.submit(() -> {
                    System.out.println(Thread.currentThread().getName() + " processing task " + i);
                    try {
                        Thread.sleep(10); // 模拟耗时操作，会触发虚拟线程卸载
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    // System.out.println(Thread.currentThread().getName() + " finished task " + i);
                });
            });
            // executor.shutdown(); // ExecutorService 会在try-with-resources块结束时自动关闭
            // executor.awaitTermination(1, java.util.concurrent.TimeUnit.MINUTES);
            System.out.println("All 10,000 tasks submitted.");
        }
        Thread.sleep(5000); // give some time for tasks to finish
        System.out.println("Main thread finished.");
    }
}
```
运行上述代码，你将看到 JVM 可以在极短的时间内创建并调度上万个虚拟线程，并且每个虚拟线程的名称带有 `ForkJoinPool-X-worker-Y`，表明它们运行在 `ForkJoinPool` 的载体线程上。

### 4.3 `StructuredTaskScope` (结构化并发，作为补充)

`StructuredTaskScope` 是 Project Loom 的另一个重要成果，与虚拟线程结合使用，可以更好地管理一组相关的并发任务。它允许你在一个代码块内启动多个子任务，并在所有子任务完成或失败时统一处理。这有助于更容易地编写正确且可维护的并发代码，避免资源泄露和任务遗漏。

```java
import java.util.concurrent.Future;
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public class StructuredConcurrencyExample {

    record UserData(String name, int age) {}
    record ProductInfo(String productName, double price) {}
    record OrderDetails(UserData user, ProductInfo product) {}

    public static UserData fetchUserData() throws InterruptedException {
        System.out.println("Fetching user data...");
        Thread.sleep(100); // Simulate network call
        return new UserData("Alice", 30);
    }

    public static ProductInfo fetchProductInfo() throws InterruptedException {
        System.out.println("Fetching product info...");
        Thread.sleep(150); // Simulate database call
        return new ProductInfo("Laptop", 1200.0);
    }

    public static void main(String[] args) throws InterruptedException, java.util.concurrent.ExecutionException, TimeoutException {
        System.out.println("Initiating order processing...");

        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            Future<UserData> userFuture = scope.fork(StructuredConcurrencyExample::fetchUserData);
            Future<ProductInfo> productFuture = scope.fork(StructuredConcurrencyExample::fetchProductInfo);

            scope.join(); // Wait for all subtasks to complete or for one to fail
            scope.throwIfFailed(); // Propagate any failure as an exception

            UserData user = userFuture.resultNow();
            ProductInfo product = productFuture.resultNow();

            OrderDetails order = new OrderDetails(user, product);
            System.out.println("Order processed: " + order);
        }
        System.out.println("Order processing complete.");
    }
}
```
`StructuredTaskScope` 确保了子任务的生命周期与父任务绑定，提高了并发代码的可靠性。

## 五、限制与注意事项

1.  **CPU 密集型任务**：虚拟线程主要解决 I/O 密集型任务的瓶颈。对于 CPU 密集型任务，虚拟线程会持续占用载体线程进行计算，无法卸载。因此，过度使用虚拟线程进行 CPU 密集型计算不会带来性能优势，反而可能因调度开销而略微降低性能。CPU 密集型任务仍应在固定数量的平台线程池中运行。
2.  **本地代码 (JNI)**：如果虚拟线程调用了本地代码 (Native Code via JNI)，底层载体线程可能会被“固定 (pin)”住，无法卸载。这会将虚拟线程转换为平台线程的行为，失去轻量优势。
3.  **Monitor/synchronized 块**：某些 `synchronized` 块或 `ReentrantLock` 可能会导致虚拟线程被“固定”在载体线程上，阻止其卸载。应优先考虑使用 `java.util.concurrent.locks.Lock` 等高级并发工具，或者确保 `synchronized` 块内部不包含阻塞 I/O 操作。
4.  **`ThreadLocal` 变量**：虽然虚拟线程可以使用 `ThreadLocal`，但由于虚拟线程数量可能非常巨大，每个 `ThreadLocal` 实例都将占用虚拟线程的少量内存。如果 `ThreadLocal` 存储了大量数据或被过度使用，可能会造成内存压力。考虑使用 `InheritableThreadLocal` 或 `ScopedValue` (JDK 21 预览功能) 作为替代。
5.  **监控和调试**：因为虚拟线程是 JVM 内部概念，传统的 OS 级工具（如 `top`, `htop`）无法直接显示虚拟线程。Java 提供了新的工具和 JVM 指标来监控虚拟线程。

## 六、虚拟线程与异步编程 / Reactive 编程

虚拟线程的引入，并不意味着异步或响应式编程会消失，而是提供了一种更简单的替代方案，尤其适用于那些本质上是阻塞 I/O 密集型，但又希望保持传统同步编程风格的应用。

*   **什么时候选择虚拟线程**：当你希望以传统同步阻塞的代码风格编写高并发 I/O 密集型服务时。它能大幅提升吞吐量，且无需改变现有代码范式。
*   **什么时候选择响应式编程**：当你的应用需要非常细粒度的异步流控制、复杂的背压管理、或者与响应式生态系统（如 Reactive Streams, R2DBC 等）深度集成时。响应式编程在处理数据流和事件驱动方面依然强大。

虚拟线程通常能满足大多数 Web 服务的并发需求，并且极大地降低了学习曲线和代码复杂性。对于追求极致性能和响应式数据流处理的领域，响应式编程仍然有其优势。两者是互补的，而非互斥。

## 七、总结

Java 虚拟线程的引入是 Java 平台在并发领域的一次重大革新。它使得开发者能够以传统的同步阻塞编程模型，构建出具有极高并发吞吐量的 I/O 密集型应用，从而解决长期以来困扰 Java 应用的“一请求一线程”模型在高并发场景下的资源瓶颈和上下文切换开销问题。

虚拟线程降低了开发高并发应用的门槛，使得代码更易于理解、编写和维护。随着其在 JDK 21 中正式发布，我们可以预见它将在微服务、Web 服务和任何 I/O 密集型 Java 应用中得到广泛应用，显著推动 Java 应用程序的性能和可伸缩性。
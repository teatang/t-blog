---
title: Tomcat、Jetty 和 Undertow 对比详解
date: 2023-06-28 06:24:00
tags:
  - 2023
  - Server
  - Java
  - 开发工具
categories:
  - 开发工具
  - Server
---
> **Tomcat、Jetty 和 Undertow** 都是流行的 **Java Web 服务器和 Servlet 容器**，它们实现了 Java Servlet 规范、JavaServer Pages (JSP) 规范、Java Expression Language (EL) 规范以及 WebSocket 规范。在 Java 企业级应用开发中，特别是在 Spring Boot 等框架盛行的微服务时代，选择一个合适的内嵌或独立 Web 服务器变得尤为重要。虽然它们功能相似，但在架构设计、性能特点、内存占用、灵活性和社区支持等方面各有侧重。

{% note info %}
**核心思想**：理解这些 Web 服务器的内部机制和特点，有助于在不同场景下做出最优选择。Tomcat 以稳定和功能全面闻名，Jetty 以轻量和可嵌入性见长，而 Undertow 则以高性能和低资源消耗脱颖而出。
{% endnote %}
------

## 一、基本概念和共通性

在深入对比之前，我们先明确一些基本概念：

*   **Web 服务器**：能够响应 HTTP 请求，提供静态内容（如 HTML, CSS, JavaScript, 图片）。
*   **Servlet 容器**：实现了 Java Servlet 规范，能够运行和管理 Java Servlet 组件。它将客户端请求转换为 Servlet 可处理的格式，并将 Servlet 生成的响应转换回 HTTP 响应。
*   **应用服务器 (Application Server)**：功能更全面，除了 Servlet 容器，还提供 EJB、JMS、JTA 等更广泛的企业级服务（例如 JBoss EAP, WebLogic, WebSphere）。Tomcat、Jetty 和 Undertow 通常被归类为**轻量级 Web 服务器/Servlet 容器**。
*   **JSP 引擎**：负责将 JSP 文件转换为 Servlet。
*   **WebSocket 支持**：支持双向通信协议，用于实时应用。
*   **HTTP/2 支持**：现代 Web 服务器普遍支持。

## 二、Apache Tomcat

### 2.1 简介

*   **官方**：Apache Tomcat [<sup>1</sup>](https://tomcat.apache.org/)
*   **类型**：开源，由 Apache 软件基金会开发和维护。
*   **历史**：Java Web 领域最老牌、最成熟、最广泛使用的 Servlet 容器。
*   **使用场景**：从小型网站到大型企业级应用，独立部署和作为 Spring Boot 的默认内嵌服务器。

### 2.2 架构特点

*   **模块化程度较低**：虽然有组件概念，但相对 Jetty 和 Undertow，其内部模块化和可嵌入性稍弱。
*   **连接器 (Connectors)**：负责与客户端通信，如 `Http11NioProtocol` (默认，非阻塞 I/O)、`AjpProtocol` (与 Apache HTTP Server 集成)。
*   **容器等级结构**：`Engine` -> `Host` -> `Context`。
    *   `Engine`：处理所有请求的顶层容器。
    *   `Host`：虚拟主机，可部署多个 Web 应用。
    *   `Context`：代表一个独立的 Web 应用 (`.war` 文件)。
*   **默认 I/O 模型**：从 Tomcat 8.x 开始，默认使用 NIO 或 NIO2 (非阻塞 I/O)。早期版本默认是 BIO (阻塞 I/O)。
*   **线程模型**：每个请求由一个工作线程处理，通过线程池管理这些线程。

### 2.3 性能与资源

*   **性能**：整体性能良好，在大多数场景下都能满足需求。但在高并发、短连接场景下，由于其线程模型和默认配置，可能不如 NIO 纯并发模型（如 Undertow）表现极端出色。
*   **启动速度**：相对 Jetty 和 Undertow 稍慢，因为需要初始化更多的组件。
*   **内存占用**：相对较高，但随着版本迭代，Tomcat 在内存优化方面也做了很多工作。

### 2.4 优缺点

*   **优点**：
    *   **社区庞大**：资料丰富，遇到问题容易找到解决方案。
    *   **功能全面**：支持所有 Servlet 规范版本，功能丰富。
    *   **稳定成熟**：经过长时间的市场验证，企业级应用广泛使用。
    *   **管理工具**：提供了管理界面。
    *   **生态完善**：与各种 Java EE/Jakarta EE 技术栈和 IDE 集成良好。
*   **缺点**：
    *   **启动速度相对慢**：在一些快速开发和测试场景下可能不太理想。
    *   **内存占用相对高**：在资源受限的环境下需要谨慎考虑。
    *   **可嵌入性相对复杂**：虽然可以嵌入，但其模块化程度和 API 友好性不如 Jetty/Undertow。

### 2.5 示例 (Spring Boot)

Spring Boot 默认内嵌了 Tomcat。
```xml
<!-- Maven pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```
如果你在 `pom.xml` 中引入 `spring-boot-starter-web`，Spring Boot 就会自动引入和配置 Tomcat。

## 三、Eclipse Jetty

### 3.1 简介

*   **官方**：Eclipse Jetty [<sup>2</sup>](https://www.eclipse.org/jetty/)
*   **类型**：开源，由 Eclipse 基金会开发和维护（最初由 Mort Bay Consulting 开发）。
*   **历史**：从早期版本就强调**轻量级、可嵌入性**和高并发。
*   **使用场景**：传统 Web 应用、嵌入式设备、桌面应用、高并发微服务。许多开源项目和工具（如 Hadoop、Maven、Eclipse 等）内部都使用了 Jetty。

### 3.2 架构特点

*   **高度模块化**：完全基于组件化思想设计，每个功能都是一个独立的组件，易于裁剪和嵌入。
*   **事件驱动 / NIO**：从设计之初就采用了事件驱动和非阻塞 I/O 模型，这使其在高并发场景下表现出色。
*   **轻量级 API**：提供非常瘦的 API，方便直接在代码中启动和配置。
*   **线程模型**：使用 Jetty 的 `ThreadPool` 管理请求处理线程。一个请求处理线程通常会从 `Selector` 获取事件，然后处理请求。

### 3.3 性能与资源

*   **性能**：在高并发、长时间连接（如 WebSocket）场景下表现优异。
*   **启动速度**：非常快，通常比 Tomcat 快。
*   **内存占用**：非常低，是三者中内存占用最小的之一，非常适合内存受限的环境。

### 3.4 优缺点

*   **优点**：
    *   **极致轻量**：核心包非常小，体积小，内存占用低。
    *   **高度可嵌入**：提供简洁的 API，非常容易在任何 Java 应用中以编程方式启动和配置。
    *   **高并发和低延迟**：得益于其事件驱动和 NIO 架构，在处理大量并发连接时表现出色。
    *   **快速启动**：极快的启动速度，适合开发和测试环境。
    *   **WebSocket支持**：其 WebSocket 实现被许多开发者认为是最好的之一。
*   **缺点**：
    *   **社区相对较小**：相对于 Tomcat，社区和资料不如其丰富。
    *   **功能相对精简**：默认提供的管理界面和高级功能不如 Tomcat 丰富，可能需要额外配置。
    *   **学习曲线**：对于习惯了传统 Tomcat 配置的开发者，需要适应 Jetty 的组件化和 API 式配置。

### 3.5 示例 (Spring Boot)

在 Spring Boot 中可以轻松切换到 Jetty：
```xml
<!-- Maven pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

## 四、Red Hat Undertow

### 4.1 简介

*   **官方**：Undertow [<sup>3</sup>](http://undertow.io/)
*   **类型**：开源，由 Red Hat 开发，是 WildFly (原 JBoss AS) 应用服务器的默认 Web 服务器。
*   **历史**：相对年轻，但发展迅速，设计之初就以高性能、灵活性和对 Java EE/Jakarta EE 的最新支持为目标。
*   **使用场景**：高吞吐量、低延迟要求、微服务、响应式编程。

### 4.2 架构特点

*   **全异步、非阻塞**：整个服务器都是基于 NIO (XNIO) 构建的，默认情况下所有请求都是非阻塞的。
*   **多线程模型优化**：采用更高效的基于 **Event Loop (事件循环)** 和 **IO Worker** 的线程模型，类似于 Node.js。IO 线程负责接受连接并调度请求，工作线程负责执行实际业务逻辑。
*   **极其灵活**：可以通过编程方式构建 Handler 链，甚至直接通过 `ByteBuffer` API 来处理请求，提供非常细粒度的控制。
*   **Servlet 3.1+ 支持**：完全支持最新的 Servlet 规范，以及 WebSocket。
*   **设计理念**：轻量级、高性能、可嵌入性、模块化。

### 4.3 性能与资源

*   **性能**：在吞吐量和并发连接方面通常是三者中表现最好的，尤其是在高并发、大量短连接或长连接混合的场景下。
*   **启动速度**：非常快，与 Jetty 相当，甚至更快。
*   **内存占用**：非常低，与 Jetty 相当。

### 4.4 优缺点

*   **优点**：
    *   **卓越的性能和吞吐量**：在并发处理和响应速度方面表现非常出色。
    *   **极低资源占用**：内存和 CPU 占用率都很低。
    *   **全异步非阻塞**：更适用于响应式编程和高并发场景。
    *   **高度可编程和灵活性**：提供的 API 允许非常精细的控制，可以构建定制的 Web Server。
    *   **快速启动**：非常适合微服务和快速开发场景。
    *   **支持 HTTP/2**：开箱即用。
*   **缺点**：
    *   **相对年轻，社区较小**：相对于 Tomcat 和 Jetty，社区活跃度和资料相对较少。
    *   **学习曲线稍陡峭**：对于习惯了传统 Servlet 模型或 Tomcat 配置的开发者，其全异步和 Handler 链的编程方式需要适应。
    *   **配置相对底层**：虽然灵活，但有时也意味着你需要更多地关注底层细节。

### 4.5 示例 (Spring Boot)

在 Spring Boot 中可以轻松切换到 Undertow：
```xml
<!-- Maven pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>
```

## 五、对比总结与选择建议

下表总结了 Tomcat、Jetty 和 Undertow 的关键特性对比：

| 特性           | Apache Tomcat                               | Eclipse Jetty                               | Red Hat Undertow                                  |
| :------------- | :------------------------------------------ | :------------------------------------------ | :------------------------------------------------ |
| **I/O 模型**   | 默认 NIO/NIO2 (从 8.x 开始)                  | 事件驱动, NIO                               | 全异步, NIO2 (基于 XNIO)                          |
| **启动速度**   | 中等                                        | 快                                          | 快 (甚至更快)                                     |
| **内存占用**   | 中等偏高                                    | 低                                          | 低                                                |
| **性能表现**   | 稳定良好，传统 Servlet 应用优选           | 高并发/长连接表现优异                       | 超高性能/高吞吐量，响应式支持好                 |
| **模块化**     | 一般，相对集成化                            | 高度模块化，组件化设计                      | 极其模块化和可编程                              |
| **可嵌入性**   | 可嵌入，但 API 相对繁琐                     | 极佳，API 精简且友好                        | 极佳，API 灵活且强大                            |
| **社区支持**   | 巨大，资料丰富，生态完善                    | 较大，广泛使用于开源工具                    | 相对较小，主要由 Red Hat 和 WildFly 社区推动      |
| **设计理念**   | 稳定、全面、传统企业应用                    | 轻量、可嵌入、高并发                        | 高性能、异步、灵活、可定制                      |
| **主要应用**   | Spring Boot 默认，各种 Java Web 应用        | Hadoop, Maven, Eclipse, 小型/嵌入式系统     | WildFly 应用服务器默认，高并发/微服务           |

### 5.1 如何选择？

在实际项目中选择合适的 Web 服务器，通常需要考虑以下因素：

1.  **项目规模和需求**：
    *   **传统大型企业应用，追求极致稳定和成熟生态**：Tomcat 依然是稳妥的选择。
    *   **微服务架构，需要快速启动、低资源消耗，或高并发/长连接**：Jetty 或 Undertow 是更好的选择。
    *   **对性能有极致要求，或倾向于响应式编程**：Undertow 更具优势。

2.  **团队熟练度**：
    *   如果团队对 Tomcat 最熟悉，并且项目需求不是特别苛刻，继续使用 Tomcat 能够减少学习成本。

3.  **资源限制**：
    *   在内存和 CPU 资源受限的环境（如小型设备、低配云服务器），Jetty 和 Undertow 的低资源占用是重要优势。

4.  **可嵌入性需求**：
    *   如果需要将 Web 服务器嵌入到独立应用、桌面应用或测试工具中：Jetty 是传统最佳选择，Undertow 也非常出色。

5.  **特定功能支持**：
    *   某些高级功能或与特定规范的紧密集成，可能某些服务器支持得更好。例如，Undertow 对最新的 Servlet 规范和 HTTP/2 有很好的支持。

**经验法则**：

*   **大多数 Spring Boot 应用**：默认使用 **Tomcat** 即可，除非有明确的理由需要切换。
*   **追求极致性能和响应式编程**：考虑使用 **Undertow**。
*   **需要低内存占用和高可嵌入性**：考虑使用 **Jetty** 或 **Undertow**。

在 Spring Boot 中，切换内嵌服务器非常方便，通常只需要修改 Maven/Gradle 依赖即可，因此也可以根据项目不同阶段的需求进行尝试和调整。

## 六、总结

Tomcat、Jetty 和 Undertow 各自拥有独特的优势和设计哲学。Tomcat 以其无与伦比的成熟度、稳定性和庞大社区，仍然是 Java Web 服务器领域的基石。Jetty 以其轻量级、可嵌入性和在高并发场景下的出色表现赢得了一席之地。而 Undertow 作为后起之秀，则以其卓越的性能、全异步架构和极高的灵活性，在高吞吐量和微服务场景下展现出强大潜力。了解它们的差异有助于开发者在构建现代 Java 应用程序时，做出更明智、更符合项目需求的服务器选型决策。
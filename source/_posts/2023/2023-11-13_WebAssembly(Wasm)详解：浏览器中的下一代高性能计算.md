---
title: WebAssembly(Wasm)详解：浏览器中的下一代高性能计算
date: 2023-11-13 06:24:00
tags:
  - 2023
  - 前端技术
  - WebAssembly
categories:
  - 前端技术
  - WebAssembly
---

> WebAssembly (Wasm) 是一种二进制指令格式，它提供了一种在 Web 浏览器中运行高性能代码的方式。它是一种可移植、大小紧凑、加载快、与 Web 生态系统兼容的技术，旨在作为 Web 的编译目标。简单来说，Wasm 允许你用 C/C++, Rust, Go 等多种语言编写代码，然后编译成 Wasm 格式，并在浏览器中以接近原生性能的速度运行。

{% note info %}
核心思想：**WebAssembly 是一种高效的、可移植的二进制指令格式，作为编译目标，使得 C/C++, Rust 等宿主语言编写的代码能在浏览器、服务器等 WebAssembly 运行时中以接近原生性能执行，弥补了 JavaScript 在计算密集型任务上的短板，并扩展了 Web 应用的能力边界。**
{% endnote %}

## 一、WebAssembly 简介

### 1.1 什么是 WebAssembly？

WebAssembly，通常缩写为 Wasm，是一种设计为在 Web 浏览器中执行的字节码格式。它并不是一种编程语言，而是一种编译目标。你可以把 C、C++、Rust 等高级语言编译成 Wasm 模块，然后在支持 Wasm 的环境中运行这些模块。

**关键特性：**

*   **高性能**：Wasm 是一种低级字节码，可以被现代浏览器引擎快速解析、编译和执行，性能接近原生代码。
*   **可移植**：Wasm 模块是平台无关的，可以在任何支持 WebAssembly 运行时的环境中运行（包括浏览器和一些非浏览器环境）。
*   **安全**：Wasm 运行在一个沙盒环境中，与外界隔离，具有与 JavaScript 相同的安全模型。
*   **大小紧凑**：Wasm 模块采用二进制格式，通常比 JavaScript 源文件更小，加载更快。
*   **与 JavaScript 互操作**：Wasm 模块可以与 JavaScript 代码无缝集成，互相调用函数，共享数据。

### 1.2 WebAssembly 的起源和目标

WebAssembly 起源于对 Web 上高性能应用的需求。JavaScript 虽然在 Web 开发中占据主导地位，但在图像处理、视频编辑、3D 游戏、科学计算等计算密集型场景下，其性能瓶颈明显。在此之前，有 asm.js (JavaScript 的一个子集，通过 AOT 优化提供更佳性能) 作为过渡技术，为 Wasm 奠定了基础。

**WebAssembly 的最终目标是：**

1.  **在 Web 上实现高性能代码**：使 Web 应用程序能够达到原生应用级别的性能。
2.  **提供更广的语言支持**：让开发者可以使用自己熟悉的语言（C/C++, Rust, Go, Python 等）来开发 Web 应用。
3.  **标准化**：成为 W3C 的开放标准，确保跨浏览器兼容性。
4.  **在非浏览器环境运行**：WebAssembly 也在积极扩展到服务器、桌面应用、物联网等非浏览器场景，形成 WebAssembly Runtime (Wasmtime, Wasmer 等)。

### 1.3 WebAssembly 与 JavaScript 的关系

Wasm **不是**要取代 JavaScript，而是要**补充** JavaScript。

*   **JavaScript**：是 Web 的主要脚本语言，擅长 DOM 操作、事件处理、网络请求和大多数业务逻辑。它具有动态、灵活、易于学习的特点。
*   **WebAssembly**：是 Web 的**汇编语言**，专注于执行计算密集型任务，提供高性能。它在浏览器中通常通过 JavaScript 加载和控制。

两者可以完美协作：JavaScript 负责 UI 交互和高层业务逻辑，而 Wasm 负责底层算法、图形渲染、物理引擎等对性能要求高的模块。

## 二、WebAssembly 的核心概念与工作原理

### 2.1 Wasm 模块 (Module)

Wasm 模块是 WebAssembly 的部署单元。它类似于一个可执行文件或一个共享库。

*   它包含编译后的 Wasm 二进制代码 (`.wasm` 文件)。
*   它定义了**导入 (imports)**：模块执行时需要的函数、全局变量或内存（由宿主环境提供，通常是 JavaScript）。
*   它定义了**导出 (exports)**：模块提供给宿主环境调用的函数、内存或表。

### 2.2 Wasm 实例 (Instance)

Wasm 实例是 Wasm 模块在运行时的一个具体实例。每个实例都有自己的内存、表和全局变量。你可以从同一个模块创建多个实例。

### 2.3 内存 (Linear Memory)

Wasm 模块操作的是一块连续的、可增长的字节数组，称为**线性内存 (Linear Memory)**。

*   这块内存由 Wasm 实例和 JavaScript 共享。
*   JavaScript 可以通过 `WebAssembly.Memory` 对象访问和操作这块内存。
*   Wasm 代码通过内存地址和大小直接读写这块内存。
*   这使得 Wasm 和 JavaScript 之间可以通过直接读写内存来高效地传递结构化数据，而不是通过序列化/反序列化。

### 2.4 表 (Table)

Wasm 表是可调整大小的、类型化的引用数组。它的主要用途是存储间接函数引用，这使得 Wasm 模块可以实现动态调度、回调函数等高级编程模式。

### 2.5 编译和执行流程

1.  **编写源代码**：使用 C/C++, Rust 等高级语言编写程序。
2.  **编译到 Wasm**：使用 Emscripten (C/C++), wasm-pack (Rust) 等工具链将源代码编译成 `.wasm` 二进制文件。
3.  **加载和实例化** (在浏览器中通常通过 JavaScript)：
    *   **获取 `.wasm` 文件**：通过 `fetch` API 或其他方式获取 Wasm 模块的二进制数据。
    *   **编译**：浏览器引擎解析 `.wasm` 二进制数据，并将其编译成机器码。这一步通常是流式编译 (streaming compilation)，可以在下载文件的同时进行编译。
    *   **实例化**：创建 Wasm 模块的实例，包括初始化其内存、表和全局变量，并解析其导入和导出。
4.  **执行**：JavaScript 调用 Wasm 实例的导出函数，或 Wasm 内部函数自行执行。

## 三、WebAssembly 的使用方式 (C++ 示例)

这里以 C++ 为例，展示如何编译和在 Web 中使用 Wasm。

### 3.1 编写 C++ 代码 (`add.cpp`)

```cpp
#include <iostream>

extern "C" { // 确保函数名不被 C++ Name Mangling 改变
    int add(int a, int b) {
        return a + b;
    }

    void greet(const char* name) {
        std::cout << "Hello, " << name << " from WebAssembly!" << std::endl;
    }
}
```

### 3.2 使用 Emscripten 编译

Emscripten 是一个将 C/C++ 代码编译到 WebAssembly 的工具链。

```bash
# 安装 Emscripten (如果尚未安装)
# git clone https://github.com/emscripten-core/emsdk.git
# cd emsdk
# ./emsdk install latest
# ./emsdk activate latest
# source ./emsdk_env.sh

# 编译 add.cpp 为 Wasm 模块
# -o add.html: 生成 HTML 文件、JS 胶水代码和 Wasm 模块
# -O3: 优化等级
# -s EXPORTED_FUNCTIONS=['_add', '_greet']: 导出这两个 C 函数
# -s EXPORT_ES6=1: 生成ES6模块格式，方便在JS中import
# -s MODULARIZE=1: 将 Emscripten 运行时封装成模块
# -s WASM=1: 强制生成 Wasm 而不是 asm.js
# -s ALLOW_MEMORY_GROWTH=1: 允许内存自动增长

emcc add.cpp -o add.html -O3 -s EXPORTED_FUNCTIONS=['_add','_greet'] -s EXPORT_ES6=1 -s MODULARIZE=1 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1
```
这将生成 `add.html` (一个简单的示例页面), `add.js` (JavaScript 胶水代码) 和 `add.wasm` (Wasm 二进制模块)。

### 3.3 在 JavaScript 中加载和使用 Wasm

#### 方式一：使用 Emscripten 生成的胶水代码 (`add.js`)

`add.js` 是 Emscripten 自动生成的，它处理了 Wasm 模块的加载、编译和实例化，并提供了统一的 Module 对象。

```html
<!DOCTYPE html>
<html>
<head>
    <title>WebAssembly C++ Example</title>
</head>
<body>
    <script type="module">
        import Module from './add.js'; // 导入胶水代码

        Module().then(wasmModule => {
            // exports 是 Wasm 模块导出的所有函数
            console.log("WebAssembly module loaded!");

            const result = wasmModule._add(10, 20); // 调用导出的 add 函数
            console.log("10 + 20 =", result); // Output: 10 + 20 = 30

            // 调用 greet 函数，注意 C 字符串需要在 Wasm 内存中处理
            const name = "Wasm User";
            const namePtr = wasmModule.stringToUTF8(name, wasmModule._malloc(name.length + 1), name.length + 1);
            wasmModule._greet(namePtr); // Output: Hello, Wasm User from WebAssembly!
            wasmModule._free(namePtr);
        });
    </script>
</body>
</html>
```

#### 方式二：直接使用 WebAssembly JavaScript API (更底层)

如果你不想用 Emscripten 的胶水代码，或使用 Rust/Go 等其他工具链，可以直接使用 `WebAssembly` API。

```html
<!DOCTYPE html>
<html>
<head>
    <title>WebAssembly Raw API Example</title>
</head>
<body>
    <script type="module">
        async function loadWasm() {
            // 获取 Wasm 模块
            const response = await fetch('add.wasm');
            const bytes = await response.arrayBuffer();

            // 定义导入对象 (如果 Wasm 模块需要导入一些 JS 函数或内存)
            const importObject = {
                env: {
                    // Wasm 模块可能会导入一些函数，例如 Emscripten 的打印函数
                    _emscripten_memcpy_js: (dest, src, len) => {}, // 占位符或实现它
                    // 如果 C++ 代码使用了标准库，可能需要更多导入
                    // 例如，对于 std::cout，你需要提供一个 JS 函数来接收输出
                    // 通常 Emscripten 胶水代码替你处理了这些
                    __cxa_throw: () => {} // 错误处理占位符
                    // ... 更多由编译工具链决定的导入
                }
            };
          
            // 编译和实例化 Wasm 模块
            const { instance, module } = await WebAssembly.instantiate(bytes, importObject);

            // 访问导出的函数
            const add = instance.exports._add;
            console.log("10 + 20 =", add(10, 20)); // Output: 10 + 20 = 30

            // 访问并操作 Wasm 内存来传递字符串 (更复杂)
            // 需要获取 Wasm 实例的内存 export，并手动管理内存分配
            // 这一步通常由胶水代码或更高级的库处理
            // const greetFn = instance.exports._greet;
            // const memory = instance.exports.memory;
            // ... 手动将字符串写入内存
            // greetFn(ptr);
        }

        loadWasm().catch(console.error);
    </script>
</body>
</html>
```
**注意**：直接使用原生 WebAssembly API 在处理字符串、复杂数据结构和 C++ 标准库导入时会比较复杂，因为你需要手动管理 Wasm 的线性内存。Emscripten 胶水代码就是为了简化这些复杂性。

## 四、WebAssembly 的应用场景

*   **高性能计算任务**：
    *   **图像/视频处理**：滤镜、编码/解码、实时编辑。
    *   **3D 游戏引擎**：将桌面游戏移植到 Web，或在浏览器中运行复杂 3D 渲染。
    *   **科学计算/模拟**：物理引擎、机器学习推理、数据分析。
    *   **加密/解密**：密码学算法。
*   **富客户端应用/桌面应用移植**：
    *   将现有 C/C++/Rust 桌面应用（如 CAD 软件、IDE）移植到 Web。
    *   例如，Figma、AutoCAD 等复杂应用都在部分使用 Wasm。
*   **编解码器**：音频/视频编解码、文件压缩/解压缩。
*   **编程语言运行时**：在浏览器中运行 Python、Ruby 等语言的解释器。
*   **Web Workers 结合**：在后台线程中运行 Wasm 模块，避免阻塞主线程，提升用户体验。
*   **服务器端 (Wasm outside browser)**：作为轻量级、安全、高性能的通用运行时，用于 Serverless、插件系统、边缘计算等场景。例如 Wasmtime, Wasmer。

## 五、WebAssembly 的未来发展

WebAssembly 仍在快速发展中，许多新特性正在提议和实现：

*   **垃圾回收 (Garbage Collection, GC)**：允许 Wasm 直接与宿主环境的 GC 交互，或拥有自己的 GC，从而更好地支持 Java, C# 等具有 GC 的语言。
*   **WebAssembly System Interface (WASI)**：一套标准化的系统接口，使得 Wasm 模块可以在非浏览器环境（如服务器）下访问文件系统、网络等，而不依赖于特定的宿主。
*   **多线程**：Wasm 模块能够利用多个线程进行并行计算。
*   **引用类型 (Reference Types)**：改善 Wasm 与宿主环境（特别是 JavaScript）之间对象传递的效率和灵活性。
*   **组件模型 (Component Model)**：提供更强大的互操作性和模块化能力，使得不同语言编译的 Wasm 模块更容易组合。
*   **调试工具**：随着 Wasm 的普及，更强大的调试工具将是必然。

## 六、总结

WebAssembly 是 Web 技术的重大突破，它打破了 JavaScript 在性能和语言选择上的限制，将 Web 应用的边界扩展到前所未有的广度。它使得高性能的计算、复杂的算法、以及现有大量 C/C++ 等代码库能够无缝地在浏览器中运行。Wasm 不仅增强了 Web 客户端的能力，其在服务器端和其他非浏览器环境中的潜力也使其成为通用运行时领域一颗冉冉升起的新星。对于追求极致性能、多语言支持以及跨平台能力的开发者来说，WebAssembly 无疑是一个值得深入学习和掌握的关键技术。
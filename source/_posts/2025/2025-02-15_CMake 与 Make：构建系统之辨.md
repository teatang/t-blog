---
title: CMake 与 Make：构建系统之辨
date: 2025-02-15 06:24:00
tags:
  - 2025
  - CI/CD
  - Makefile
  - 开发工具
categories:
  - 开发工具
  - CI/CD
---

> 在 C/C++ 等编译型语言的开发中，**构建系统 (Build System)** 是将源代码转换成可执行程序、库或其他目标文件的核心环节。CMake 和 Make 是其中两个最常用但职责不同的工具。简单来说，**CMake 是一个高级的构建系统生成器 (Build System Generator)**，而 **Make 是一个低级的构建工具 (Build Tool)**，用于执行构建任务。

{% note info %}
核心思想：**CMake 负责“生成”跨平台的构建配置 (如 Makefile)，而 Make 负责“执行”这些配置来实际编译代码。**
{% endnote %}
------

## 一、Make：低级构建工具

### 1.1 什么是 Make？

**Make** 是一个**自动化构建工具 (Build Automation Tool)**，它的核心职责是读取一个名为 `Makefile` 的文件，根据文件中定义的规则和依赖关系，执行相应的命令来构建项目。Make 在 Unix/Linux 系统上历史悠久且广泛应用，是构建 C/C++ 项目的基础工具之一。

### 1.2 `Makefile`

`Makefile` 是 Make 工具的配置文件，它定义了：
*   **目标 (Targets)**：通常是文件（如 `.o` 文件、可执行文件）或伪目标（如 `clean`）。
*   **依赖 (Dependencies)**：一个目标所依赖的其他文件或目标。
*   **命令 (Commands)**：当目标的依赖发生变化时，需要执行的 shell 命令来重建目标。

**示例 `Makefile` 片段：**

```makefile
# 定义编译器和编译选项
CC = gcc
CFLAGS = -Wall -g

# 默认目标：构建 all
all: myprogram

# 目标：myprogram (可执行文件)
# 依赖：main.o add.o
# 命令：链接 main.o 和 add.o 生成 myprogram
myprogram: main.o add.o
	$(CC) $(CFLAGS) main.o add.o -o myprogram

# 目标：main.o (对象文件)
# 依赖：main.c mylib.h
# 命令：编译 main.c 生成 main.o
main.o: main.c mylib.h
	$(CC) $(CFLAGS) -c main.c -o main.o

# 目标：add.o (对象文件)
# 依赖：add.c mylib.h
# 命令：编译 add.c 生成 add.o
add.o: add.c mylib.h
	$(CC) $(CFLAGS) -c add.c -o add.o

# 伪目标：clean
# 依赖：无
# 命令：删除生成的对象文件和可执行文件
clean:
	rm -f *.o myprogram
```

### 1.3 Make 的优缺点

**优点：**
*   **历史悠久，功能强大**：在 Unix-like 系统上是标准的构建工具，功能完善。
*   **简单直接**：对于小型项目或特定平台，手写 `Makefile` 可以非常高效且灵活。
*   **高效增量编译**：只编译发生变化的文件及其依赖项，节省编译时间。
*   **低级控制**：可以直接控制每一个编译、链接步骤。

**缺点：**
*   **缺乏跨平台性**：`Makefile` 语法和其中使用的 shell 命令通常与特定操作系统和工具链紧密相关。将一个项目的 `Makefile` 从 Linux 移植到 Windows 往往需要大量修改。
*   **难以维护**：对于大型复杂项目，手写 `Makefile` 变得极其庞大和难以维护，特别是当项目包含多个目录、不同类型的源文件和复杂的依赖关系时。
*   **学习曲线**：`Makefile` 的语法（特别是制表符依赖）对新手来说可能比较晦涩。
*   **无法直接生成 IDE 项目文件**：`Makefile` 只能用于命令行构建，无法直接生成 Visual Studio `.sln` 或 Xcode `.xcodeproj` 等 IDE 项目文件。

## 二、CMake：高级构建系统生成器

### 2.1 什么是 CMake？

**CMake** 是一个**跨平台的开源构建系统生成器 (Cross-platform Open-source Build System Generator)**。它的主要目的是帮助开发者管理项目的构建过程，使其能够在不同的操作系统、编译器和 IDE 下以统一的方式进行构建。CMake 本身不直接编译代码，而是根据用户编写的 `CMakeLists.txt` 文件，**生成**特定平台和工具链所需的构建文件（例如 Unix Makefiles、Visual Studio 项目文件、Xcode 项目文件等）。

### 2.2 `CMakeLists.txt`

`CMakeLists.txt` 是 CMake 的配置文件，它使用 CMake 自己的脚本语言描述项目的结构、源文件、依赖、编译选项、目标等信息。

**示例 `CMakeLists.txt` 片段：**

```cmake
# 定义所需的 CMake 最低版本
cmake_minimum_required(VERSION 3.10)

# 定义项目名称
project(MyProgram CXX) # CXX 表示这是一个 C++ 项目

# 查找并包含头文件目录
include_directories(include)

# 添加一个可执行目标
# 第一个参数是目标名称，后续参数是源文件
add_executable(myprogram
    src/main.cpp
    src/add.cpp
)

# 可选：添加编译定义
add_definitions(-DVERSION="1.0")

# 可选：链接库 (例如，假设我们有一个数学库)
# target_link_libraries(myprogram mymathlib)

# 可选：安装规则
install(TARGETS myprogram DESTINATION bin)
```

### 2.3 CMake 的工作流程

1.  **配置 (Configure)**：CMake 读取 `CMakeLists.txt` 文件，检测当前系统的操作系统、编译器、库等环境信息，并生成一个中间的构建缓存。
2.  **生成 (Generate)**：CMake 根据配置阶段的信息，**生成**目标构建系统所需的构建文件。例如，在 Linux 上生成 `Makefile`，在 Windows 上生成 `Visual Studio solution/project` 文件。
3.  **构建 (Build)**：调用实际的构建工具（如 Make、Ninja、MSBuild 等）来执行生成的构建文件，从而编译、链接代码。

{% mermaid %}
graph TD
    A[开发者编写 CMakeLists.txt] --> B{CMake: 配置阶段};
    B --> C{CMake: 生成阶段};
    C -- 生成特定平台的构建文件 --> D["构建文件 (如 Makefile / .sln)"];
    D -- 调用构建工具 --> E[Make / MSBuild / Ninja];
    E -- 编译 & 链接 --> F[可执行文件 / 库];
{% endmermaid %}

### 2.4 CMake 的优缺点

**优点：**
*   **卓越的跨平台性**：用一套 `CMakeLists.txt` 就可以在不同操作系统（Windows, Linux, macOS）、不同编译器（GCC, Clang, MSVC）、不同 IDE（Visual Studio, Xcode, CLion）下生成对应的构建文件。
*   **简化大型项目管理**：提供高级抽象，更容易管理复杂项目结构、模块化、依赖管理。
*   **支持多种构建工具**：可以生成 `Makefile` (供 Make 使用)、Ninja 构建文件 (供 Ninja 使用)、Visual Studio 项目文件等。
*   **集成测试与安装**：内置 CTest 用于测试管理，CPack 用于包管理，以及 `install` 命令用于部署。
*   **易于使用第三方库**：`find_package` 等命令使得查找和使用系统中的第三方库变得简单。

**缺点：**
*   **引入新的脚本语言**：需要学习 CMake 自己的脚本语言，虽然相对简单，但仍是一个额外的学习成本。
*   **抽象层**：对于简单的项目，引入 CMake 可能会显得有些“杀鸡用牛刀”，增加了额外的配置层。
*   **调试复杂**：当 `CMakeLists.txt` 出现问题时，调试可能会比直接调试 `Makefile` 复杂一些，因为错误可能发生在 CMake 脚本本身或它生成的构建文件中。

## 三、CMake 与 Make 的核心区别

| 特性         | Make                                   | CMake                                    |
| :----------- | :------------------------------------- | :--------------------------------------- |
| **角色定位** | **低级构建工具 (Build Tool)**          | **高级构建系统生成器 (Build System Generator)** |
| **输入文件** | `Makefile`                             | `CMakeLists.txt`                         |
| **输出**     | 直接执行编译、链接生成目标文件         | **生成** `Makefile` 或其他 IDE 项目文件  |
| **跨平台性** | **差**，`Makefile` 通常与平台/工具链绑定 | **卓越**，一份 `CMakeLists.txt` 可用于多平台 |
| **复杂度**   | 小型项目简单直接，大型项目维护困难     | 抽象化管理大型项目，小型项目可能略显过度 |
| **工作方式** | **执行**编译命令                       | **描述**项目结构和构建规则，然后生成构建文件 |
| **依赖**     | 依赖 `Makefile`                         | 依赖 `CMakeLists.txt` 和一个实际的构建工具 (如 Make) |
| **抽象级别** | **低级**，直接操作编译器、链接器命令   | **高级**，抽象了底层编译细节             |

## 四、关系与协同工作

CMake 和 Make 并非相互替代，而是**协同工作**的关系：

1.  **在 Linux/macOS 环境下：**
    *   你编写 `CMakeLists.txt` 文件。
    *   运行 `cmake .` 命令，CMake 会读取 `CMakeLists.txt`，然后**生成** `Makefile`。
    *   运行 `make` 命令，Make 会读取生成的 `Makefile`，并**执行**其中的编译、链接等操作。

    {% mermaid %}
    sequenceDiagram
        participant Dev as 开发者
        participant CMake as CMake
        participant Make as Make
        participant Compiler as 编译器

        Dev->>CMake: 编写 CMakeLists.txt
        Dev->>CMake: 执行 "cmake ."
        CMake->>Make: 生成 Makefile
        Dev->>Make: 执行 "make"
        Make->>Compiler: 调用编译器执行编译命令
        Compiler->>Dev: 输出可执行文件/库
    {% endmermaid %}

2.  **在 Windows 环境下 (使用 Visual Studio)：**
    *   你编写 `CMakeLists.txt` 文件。
    *   运行 `cmake . -G "Visual Studio 17 2022"` (或其他版本)，CMake 会读取 `CMakeLists.txt`，然后**生成** `Visual Studio solution (.sln)` 和项目文件。
    *   你可以用 Visual Studio IDE 打开 `.sln` 文件进行开发和构建，或者在命令行使用 `MSBuild` (Visual Studio 的构建工具) 来**执行**构建。

    {% mermaid %}
    sequenceDiagram
        participant Dev as 开发者
        participant CMake as CMake
        participant VSIDE as Visual Studio IDE
        participant MSBuild as MSBuild (构建工具)
        participant Compiler as 编译器

        Dev->>CMake: 编写 CMakeLists.txt
        Dev->>CMake: 执行 "cmake -G 'Visual Studio ...'"
        CMake->>VSIDE: 生成 .sln 和 .vcxproj 文件
        Dev->>VSIDE: 打开 .sln，通过 IDE 进行构建
        VSIDE->>MSBuild: 调用 MSBuild
        MSBuild->>Compiler: 调用编译器执行编译命令
        Compiler->>Dev: 输出可执行文件/库
    {% endmermaid %}

## 五、总结

*   **Make** 是一个**执行者**：它直接读取低级的 `Makefile` 并按照指令一步步编译代码。它擅长增量构建，但缺乏跨平台能力。
*   **CMake** 是一个**管理者/协调者**：它读取高级的 `CMakeLists.txt`，然后根据当前环境，**生成**适合该环境的构建文件（如 `Makefile`、`.sln`），最后由实际的构建工具（如 Make、MSBuild）来执行构建。它提供了卓越的跨平台能力和对复杂项目的抽象管理。

对于现代 C/C++ 项目，尤其是需要跨平台支持和大型项目管理时，**CMake 已成为事实上的标准选择**。它通过提供一个更高级、更抽象的构建描述语言，将开发者从底层平台特定的构建细节中解放出来，从而提升开发效率和项目的可维护性。而 Make 则作为 CMake 在 Unix-like 系统下最常用的**后端构建工具**，继续发挥其高效执行编译任务的作用。
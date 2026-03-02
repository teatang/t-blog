---
title: Rust 构建系统和包管理器 Cargo 详解
date: 2025-08-07 06:24:00
tags: 
    - 2025
    - Rust
    - 项目构建
categories: 
    - Rust
    - 项目构建
---

> **Cargo** 是 Rust 语言的官方构建系统和包管理器，在 Rust 生态系统中扮演着核心角色。它负责处理 Rust 项目的依赖管理、代码编译、测试运行、文档生成以及发布到 `crates.io`（Rust 社区的中央包注册表）等一系列任务。Cargo 旨在使 Rust 项目的开发、共享和维护变得简单高效。

{% note info %}
核心思想：Cargo 提供了一站式的解决方案，将项目生命周期中的关键环节（从创建到发布）无缝集成，极大地简化了 Rust 开发者的工作流程，并促进了代码的复用和模块化。
{% endnote %}

------

## 一、Cargo 核心概念

在使用 Cargo 之前，理解其几个关键概念至关重要。

### 1.1 包 (Package)

包是 Cargo 的基本单元。它包含：
*   一个 `Cargo.toml` 文件：描述包的元数据（名称、版本、作者等）、依赖项和构建配置。
*   一个或多个 Crate：包可以包含一个库 Crate、多个二进制 Crate 以及其他辅助文件（如示例、测试等）。

### 1.2 Crate (模块包)

Crate 是 Rust 编译器一次性编译的最小代码单元。它有两种形式：
*   **二进制 Crate (Binary Crate)**：编译后生成可执行文件。通常包含一个 `main` 函数作为程序入口点。
    *   例如：`src/main.rs`。项目可以有多个二进制 Crate。
*   **库 Crate (Library Crate)**：编译后生成可被其他包使用的库文件（如 `.rlib`、`.so`、`.dll`）。不包含 `main` 函数，其功能通过公共 API 暴露。
    *   例如：`src/lib.rs`。一个包最多只能有一个库 Crate。

### 1.3 根 (Root)

*   **Crate Root (Crate 根)**：指 `src/main.rs`（对于二进制 Crate）或 `src/lib.rs`（对于库 Crate）。这些文件是各自 Crate 的入口点。
*   **Package Root (包根)**：指包含 `Cargo.toml` 文件的目录。

### 1.4 目标 (Target)

Cargo 支持多种类型的构建目标 (build targets)：
*   `bin` (二进制可执行文件)
*   `lib` (库文件)
*   `example` (示例)
*   `test` (测试)
*   `bench` (基准测试)

这些目标对应于项目结构中的特定目录，例如 `src/bin/` 用于额外的二进制文件，`examples/` 用于示例代码等。

## 二、项目结构

使用 `cargo new` 命令可以快速创建一个新的 Rust 项目，并自动生成标准的 Cargo 项目结构。

### 2.1 创建项目

```bash
cargo new my_project        # 创建一个新的二进制项目
cargo new my_library --lib  # 创建一个新的库项目
```

### 2.2 默认项目布局

无论是二进制项目还是库项目，`cargo new` 都会生成以下基本结构：

```
my_project/
├── Cargo.toml
└── src/
    └── main.rs  # 对于 --lib 项目，这里将是 lib.rs
```

*   `Cargo.toml`：项目的配置清单。
*   `src/main.rs`：二进制 Crate 的根文件，包含程序的 `main` 函数。
*   `src/lib.rs`：库 Crate 的根文件，定义了库的公共 API。

### 2.3 高级项目布局

随着项目复杂度的增加，Cargo 支持更丰富的结构来组织代码：

```
my_advanced_project/
├── Cargo.toml
├── src/
│   ├── main.rs         # 默认二进制 Crate
│   ├── lib.rs          # 库 Crate
│   └── bin/            # 其他二进制 Crate
│       ├── cli_app.rs
│       └── another_tool.rs
├── examples/           # 示例程序
│   ├── basic.rs
│   └── complex.rs
├── tests/              # 集成测试
│   ├── common.rs
│   └── cli_tests.rs
└── benches/            # 基准测试
    └── my_benchmark.rs
```

*   `src/bin/*.rs`：每个文件都会被编译成一个独立的二进制可执行文件。
*   `examples/*.rs`：包含可独立的示例程序，通常用于演示库的使用。
*   `tests/*.rs`：包含集成测试，它们是外部 Crate，只能调用库的公共 API。
*   `benches/*.rs`：包含用于性能基准测试的代码，通常需要 `nightly` Rust 工具链和 `test` feature。

## 三、`Cargo.toml` 详解

`Cargo.toml` 是 Cargo 项目的核心配置文件，使用 TOML (Tom's Obvious, Minimal Language) 格式。它定义了包的所有元数据、依赖项和构建设置。

```toml
[package]
name = "my_project" # 包名，用于 crates.io，和 rust-analyzer
version = "0.1.0" # 包的版本
edition = "2021" # Rust 版本，例如 "2018", "2021"
authors = ["Your Name <you@example.com>"] # 包的作者列表
description = "A short description of my project." # 包的简短描述
license = "MIT OR Apache-2.0" # 许可证，建议使用 SPDX 表达式
repository = "https://github.com/yourusername/my_project" # Git 仓库 URL
homepage = "https://example.com/my_project" # 项目主页 URL
documentation = "https://docs.rs/my_project" # 文档 URL
keywords = ["cli", "utils", "tool"] # 搜索关键字
categories = ["command-line-utilities", "development-tools"] # crates.io 分类
readme = "README.md" # README 文件路径
exclude = ["temp/*"] # 发布到 crates.io 时排除的文件或目录
publish = true # 是否允许发布到 crates.io (默认 true)

# 如果你的包是一个库，可以配置 lib 目标
[lib]
name = "my_library_name" # 库的名称，默认为包名
path = "src/lib.rs" # 库文件的路径，默认为 src/lib.rs
crate-type = ["lib", "cdylib"] # 编译类型，例如 "rlib", "cdylib", "staticlib", "bin"

# 如果你的包有额外的二进制文件
[[bin]]
name = "my_cli" # 二进制文件的名称，可执行文件名
path = "src/bin/cli.rs" # 二进制文件的路径

[dependencies]
# 生产依赖项
# 最新版本语法，Cargo 会自动更新到兼容的最新版本
rand = "0.8.5"
serde = { version = "1.0", features = ["derive"] }
# 本地路径依赖
my_local_crate = { path = "../my_local_crate" }
# Git 仓库依赖
git_crate = { git = "https://github.com/rust-lang/cargo.git", branch = "master" }
# 可选依赖
feature_crate = { version = "0.1", optional = true }

# 开发依赖项 (仅用于编译测试、示例和基准测试)
[dev-dependencies]
criterion = "0.3"

# 构建依赖项 (仅用于编译 build.rs 脚本)
[build-dependencies]
cc = "1.0"

# 特性 (Features)
[features]
# 默认特性
default = ["feature_a"]
# 定义特性
feature_a = [] # 简单的特性
feature_b = ["feature_crate"] # 激活 feature_crate 依赖
full = ["feature_a", "feature_b"] # 组合特性

# 平台特定依赖 (例如，仅在 Linux 上编译)
[target.'cfg(target_os = "linux")'.dependencies]
libc = "0.2"

# 构建配置文件 (Build Profiles)
[profile.dev] # 开发配置文件
opt-level = 0 # 优化级别 (0-3)，0 表示无优化
debug = true  # 包含调试信息
overflow-checks = true # 禁用整数溢出检查

[profile.release] # 发布配置文件
opt-level = 3 # 优化级别，3 表示高优化
debug = false # 不包含调试信息
lto = "fat" # 链接时优化
codegen-units = 1 # 代码生成单元，1 意味着最大限度优化，但编译速度慢

# Workspaces 配置 (稍后讨论)
# [workspace]
# members = ["crates/*"]

# 补丁 (Patch) 和替换 (Replace)
# [patch.crates-io] # 将 crates.io 上的某依赖替换为本地或 Git 依赖
# foo = { path = "/path/to/foo" }
# [replace] # 已被 patch 替代，不推荐使用
# bar:1.0.0 = { path = "/path/to/bar" }
```

## 四、常用 Cargo 命令

Cargo 提供了一系列命令来管理 Rust 项目的各个方面。

### 4.1 项目初始化与配置

*   `cargo new <name>`：创建一个新的二进制项目。
*   `cargo new <name> --lib`：创建一个新的库项目。
*   `cargo init [path]`：在现有目录中初始化 Cargo 项目。
*   `cargo bench`：运行基准测试。
*   `cargo doc`：生成项目的 HTML 文档。
*   `cargo update`：更新 `Cargo.lock` 文件中所有依赖项到最新兼容版本。
*   `cargo clean`：删除 `target` 目录，清理所有构建产物。

### 4.2 构建与运行

*   `cargo build`：编译当前项目及其所有依赖项。
    *   `cargo build --release`：编译发布版，启用优化（生成在 `target/release/`）。
*   `cargo check`：快速检查代码是否存在编译错误，但不生成可执行文件。
*   `cargo run`：编译并运行当前项目的默认二进制 Crate。
    *   `cargo run --bin <name>`：运行指定的二进制 Crate。
    *   `cargo run --example <name>`：运行指定的示例。
    *   `cargo run --release`：运行发布版。
*   `cargo fix`：自动修复一些常见的代码问题，例如导入缺失或者废弃 API 的用法。

### 4.3 依赖管理

*   `cargo add <crate_name>`：添加一个依赖项到 `Cargo.toml` (Rust 1.62+)。
    *   `cargo add <crate_name> --dev`：添加开发依赖。
    *   `cargo add <crate_name> --build`：添加构建依赖。
    *   `cargo add <crate_name> --features <feature_name>`：添加依赖并激活特定特性。
    *   `cargo add <crate_name> --path <path>`：添加本地路径依赖。
    *   `cargo add <crate_name> --git <url>`：添加 Git 仓库依赖。
*   `cargo remove <crate_name>`：从 `Cargo.toml` 中移除一个依赖项 (Rust 1.62+)。

### 4.4 测试与质量

*   `cargo test`：运行所有测试（单元测试、集成测试、文档测试）。
    *   `cargo test <test_name>`：运行指定的测试。
    *   `cargo test -- --nocapture`：显示测试时 `println!` 的输出。
*   `cargo fmt`：格式化项目中的所有 Rust 代码（需要安装 `rustfmt` 工具）。
    *   `cargo fmt -- --check`：检查代码是否已格式化，但不修改文件。
*   `cargo clippy`：运行 Rust linter，提供代码风格、潜在错误和性能改进建议（需要安装 `clippy` 工具）。
*   `cargo audit`：扫描项目依赖中的已知安全漏洞 (通常需要安装 `cargo-audit` 工具)。

### 4.5 发布

*   `cargo publish`：将当前包发布到 `crates.io`。
    *   需要先登录：`cargo login <API_token>`。
    *   发布前建议先运行 `cargo check --all-targets` 和 `cargo test`。
*   `cargo yank <crate>@<version>`：从 `crates.io` 撤销给定版本，使其不再被新项目依赖，但已有的依赖仍然可以使用。

### 4.6 其他

*   `cargo install <crate-name>`：从 `crates.io` 或 Git 仓库下载并编译一个二进制 Crate，然后安装到用户的 `$HOME/.cargo/bin` 目录中。
*   `cargo search <query>`：在 `crates.io` 上搜索 Crate。
*   `cargo metadata`：打印关于 Cargo 工作区的 JSON 格式元数据。
*   `cargo expand`：显示宏展开后的代码 (需要安装 `cargo-expand` 工具)。

## 五、Cargo Workspaces (工作区)

Cargo Workspaces 允许你在一个统一的 `Cargo.toml` 管理下，将多个相关的 Crate 组织到一个项目中。这在构建大型应用程序或多 Crate 库时非常有用，可以提高代码共享、简化依赖管理和统一构建流程。

### 5.1 Workspaces 的优势

*   **统一的 `Cargo.lock`**：所有 Crate 共享同一个 `Cargo.lock` 文件，确保依赖项版本的一致性。
*   **简化的依赖管理**：Workspaces 内的 Crate 可以轻松地相互依赖，而无需指定版本或路径。
*   **统一构建**：可以在工作区根目录运行 `cargo build` 或 `cargo test` 来构建或测试所有 Crate。
*   **代码共享**：促进 Crate 间的代码复用。

### 5.2 Workspace 结构

创建一个 Workspace：
1.  创建一个根目录作为 Workspace 根。
2.  在该目录下创建 `Cargo.toml` 文件，并添加 `[workspace]` 部分。
3.  在该目录下创建需要包含的子 Crate 目录，并在每个子 Crate 目录中分别创建 `Cargo.toml`。

```
my_workspace/
├── Cargo.toml      # Workspace 的根 Cargo.toml
├── crates/
│   ├── backend/    # 子 Crate: backend
│   │   └── Cargo.toml
│   │   └── src/
│   │       └── lib.rs
│   └── frontend/   # 子 Crate: frontend
│       └── Cargo.toml
│       └── src/
│           └── main.rs
└── utils/          # 子 Crate: utils
    └── Cargo.toml
    └── src/
        └── lib.rs
```

### 5.3 配置 `Cargo.toml`

**Workspace 根目录的 `Cargo.toml` (my_workspace/Cargo.toml)**：

```toml
[workspace]
members = [
    "crates/backend",
    "crates/frontend",
    "utils", # 也可以是顶层目录
]
# 如果需要设置共享的默认依赖版本或配置
# [workspace.dependencies]
# anyhow = { version = "1.0", optional = true }

# [workspace.metadata]
# my-tool = { some-setting = "value" }
```

**子 Crate 的 `Cargo.toml` (例如 crates/frontend/Cargo.toml)**：

```toml
[package]
name = "frontend"
version = "0.1.0"
edition = "2021"

[dependencies]
backend = { path = "../backend" } # 依赖同一个 Workspace 中的其他 Crate
utils = { path = "../../utils" }   # 注意相对路径
# 外部依赖
serde = "1.0"
```

**注意**：在 Workspace 内，Crate 之间相互依赖时，只需使用 `path` 字段指向其相对路径，无需指定 `version`。Cargo 会自动从 Workspace 的 `Cargo.lock` 中获取其版本信息。

## 总结

Cargo 是 Rust 生态系统中不可或缺的工具。它不仅简化了项目的创建、编译和测试等基本任务，还在依赖管理、包发布、代码组织和团队协作方面提供了强大的支持。通过深入理解 `Cargo.toml` 的配置选项和各种 `cargo` 命令，开发者可以更高效地构建、维护和共享他们的 Rust 项目。掌握 Cargo 是成为一名高效 Rust 程序员的关键一步。
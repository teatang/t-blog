---
title: Ruff 详解：极速 Python 代码检查与格式化工具
date: 2025-01-31 06:24:00
tags:
  - 2025
  - Python
  - 项目构建
  - Lint
  - 代码质量
  - CI/CD
categories:
  - Python
  - 项目构建
---
> **Ruff** 是一个用 Rust 编写的极速 Python 代码检查 (Lint) 和格式化工具。它旨在提供一个高性能的替代方案，结合了 Flake8、isort、Black 等多种工具的功能，以显著提升 Python 项目的代码质量检查和格式化效率。

{% note info %}
Ruff 的核心优势在于其**极致的速度**：由于底层使用 Rust 编写，它比传统的 Python 代码检查工具快 10 到 100 倍，这对于大型项目和 CI/CD 流程来说是一个巨大的改进。
{% endnote %}
------

## 一、为什么选择 Ruff？

在 Python 开发中，我们通常会使用一系列工具来维护代码质量和风格：

*   **Linter (代码检查器)**：如 Flake8、Pylint，用于发现潜在的 bug、代码异味、不遵循最佳实践的代码。
*   **Formatter (代码格式化器)**：如 Black、autopep8、YAPF，用于统一代码风格，使其符合 PEP 8 规范。
*   **Import Sorter (导入排序器)**：如 isort，用于自动排序和整理 `import` 语句。

管理和配置这些独立的工具会增加项目的复杂性。Ruff 的出现旨在简化这一过程，将这些核心功能整合到一个单一的、高性能的工具中，并通过单一配置即可管理。

**Ruff 带来的主要优势：**

*   **极速性能**：由 Rust 编写，其检查速度比现有 Python 工具快一个数量级。这使得在大型代码库上运行检查变得轻而易举，不会拖慢开发流程。
*   **一体化解决方案**：它能替代 Flake8 (及其众多插件)、isort、pydocstyle、mccabe、Pyflakes 等一系列工具。
*   **内置格式化器**：从 0.0.260 版本开始，Ruff 集成了自己的格式化功能，旨在成为 Black 的替代品，同样强调非侵入性和确定性。
*   **高度可配置**：虽然默认配置已经很合理，但Ruff提供了丰富的配置选项，允许用户根据项目需求启用/禁用特定规则、自定义规则行为等。
*   **易于集成**：可轻松集成到 VS Code、PyCharm 等 IDE 以及各种 CI/CD 工作流中。

## 二、Ruff 的主要功能

Ruff 的功能主要包括代码检查 (Linting) 和代码格式化 (Formatting)。

### 2.1 代码检查 (Linting)

Ruff 可以检查代码的各种问题，包括但不限于：

*   **语法错误和潜在 bug**：如未使用的变量、重复的导入、语法错误。
*   **代码风格问题**：遵循 PEP 8 规范，如行长、缩进、空白行等。
*   **复杂性检查**：例如函数或方法的圈复杂度 (通过集成 Pylint 的 `C` 规则)。
*   **Docstring 检查**：如缺少 docstring 或 docstring 格式不规范 (通过集成 pydocstyle 的 `D` 规则)。
*   **最佳实践检查**：如使用 `assert` 而不是 `raise`、不必要的 `else` 块等。

Ruff 通过一系列**规则 (rules)** 来执行这些检查，每条规则都有一个唯一的代码 (例如 `E501` 代表行长超限)。它支持数百条规则，涵盖了 Flake8、isort、Pylint、Pyflakes 等工具中的常见检查。

**Ruff 规则示例：**

*   `F401`: 未使用的导入
*   `E501`: 行长超过最大限制
*   `W292`: 文件末尾没有新行
*   `I001`: 导入顺序不规范 (isort 风格)
*   `D100`: 缺少模块 docstring

### 2.2 代码格式化 (Formatting)

Ruff 的格式化器旨在提供与 Black 类似的非侵入式、确定性的格式化体验。它会根据一套固定的规则自动调整代码布局，目标是减少代码风格争议，让开发者专注于编写功能。

**特点：**

*   **确定性**：给定相同的输入，总是产生相同的输出。
*   **非侵入性**：只修改必要的格式，尽量不改变代码的抽象语法树。
*   **与 Linting 紧密结合**：格式化通常也能修复一些格式相关的 Lint 错误。

## 三、安装与基本使用

### 3.1 安装

Ruff 可以通过 pip 安装：

```bash
pip install ruff
```

### 3.2 基本用法

假设你有一个名为 `main.py` 的 Python 文件：

```python
# main.py
import os, sys # F401


def hello_world(
        name):
    # This is a comment that is intentionally long to trigger E501 if line limit is 88.
    message = f"Hello, {name}!"
    print(message)


if __name__ == "__main__":
    hello_world("Ruff User")
```

#### 3.2.1 代码检查 (Linting)

运行 Ruff 进行代码检查：

```bash
ruff check main.py
```

你可能会得到类似这样的输出（取决于你的配置和 Ruff 版本）：

```
main.py:2:12: F401 'sys' imported but unused
main.py:2:12: F401 'os' imported but unused
main.py:2:1: I001 One import per line
main.py:5:9: E501 Line too long (88 > 79)
Found 4 errors.
```

#### 3.2.2 自动修复 (Auto-fix)

Ruff 能够自动修复许多检查到的问题：

```bash
ruff check --fix main.py
```

运行后，`main.py` 可能会变为：

```python
# main.py
import os # F401
import sys # F401


def hello_world(
        name):
    # This is a comment that is intentionally long to trigger E501 if line limit is 88.
    message = f"Hello, {name}!"
    print(message)


if __name__ == "__main__":
    hello_world("Ruff User")
```
请注意，`I001` (One import per line) 已经被修复，但 `F401` (unused imports) 仍然存在，因为它们需要在后续的 `fix` 批次中处理或者需要用户手动确认。`E501` 通常不会被自动修复，因为它涉及到代码逻辑或风格的选择。

#### 3.2.3 代码格式化 (Formatting)

从 Ruff 0.0.260+ 版本开始，你可以使用 `format` 命令进行格式化：

```bash
ruff format main.py
```

```python
# main.py
import os # F401
import sys # F401


def hello_world(name):
    # This is a comment that is intentionally long to trigger E501 if line limit is 88.
    message = f"Hello, {name}!"
    print(message)


if __name__ == "__main__":
    hello_world("Ruff User")
```
格式化器可能对空行、括号位置等进行调整。`E501` 在格式化中可能会尝试缓解，但如果行太长且无法合理拆分，它仍将是一个 lint 错误。

#### 3.2.4 同时检查并格式化

Ruff 推荐在 CI/CD 中同时执行检查和格式化，以确保代码完全符合规范。

```bash
ruff check .
ruff format . --check # 在 CI/CD 中只检查是否需要格式化，不实际修改
# 或者
ruff format . # 在本地开发时直接格式化
```

## 四、配置 Ruff

Ruff 可以通过多种方式进行配置：

*   **`pyproject.toml` (推荐)**：这是现代 Python 项目管理工具的标准配置文件。
*   `ruff.toml`
*   `setup.cfg`
*   `flake8` 的兼容配置（有限支持）

以下是一个 `pyproject.toml` 配置示例：

```toml
# pyproject.toml
[tool.ruff]
# 要启用或禁用的规则代码列表，或者规则组。
# 示例：启用所有默认规则 (`E`, `F`, `W`, `I`)，并添加一些 `D` (pydocstyle) 和 `C` (复杂度) 规则。
# 使用 `ruff config` 命令查看所有可用的规则及其类别。
select = ["E", "F", "W", "I", "D", "C"]
ignore = ["E501"] # 忽略特定规则，例如忽略所有 E501 (行长超限) 错误
target-version = "py310" # 指定目标 Python 版本，Ruff 将根据此版本检查语法和特性。

# 允许自动修复的规则。如果未指定，所有选中的可修复规则都将进行修复。
# fixable = ["I001"]

# 不自动修复的规则。
# unfixable = []

extend-exclude = [
    ".git",
    "__pycache__",
    "venv",
    "env",
    "build",
    "dist",
    "*.pyc",
    "*.egg-info",
    ".mypy_cache",
    ".pytest_cache",
]

# 针对特定文件或路径的配置。
[tool.ruff.per-file-ignores]
"__init__.py" = ["F401", "D"] # 针对 __init__.py 文件，忽略 F401 和所有 D (pydocstyle) 规则。
"tests/*.py" = ["D"] # 针对测试文件，忽略所有 D 规则。

[tool.ruff.pydocstyle]
# 配置 pydocstyle 相关的规则
convention = "google" # 例如，遵循 Google 风格的 docstring 规范

[tool.ruff.flake8-annotations]
# 配置 flake8-annotations 相关的规则
mypy-init-annotations = true

[tool.ruff.flake8-import-conventions]
# 配置 import-conventions
# 例如，允许 import pandas as pd 但禁止 import pandas as p
alias-modules = { "pandas" = "pd", "numpy" = "np" }

[tool.ruff.isort]
# isort 行为配置
known-first-party = ["my_package"] # 将 'my_package' 视为项目内部包
combine-as-imports = true # 合并如 `from foo import a, b` 为 `from foo import a; from foo import b`

[tool.ruff.format]
# 格式化器配置
docstring-code-format = true # 格式化 docstring 中的代码块
# line-length = 88 # 格式化器的行长，通常与 linting 的 E501 相关联
```

**配置说明：**

*   `select`：指定要启用的规则组或单个规则代码。你可以使用 `ruff config` 命令查看所有可用的规则及其所属类别。
*   `ignore`：指定要忽略的规则。
*   `target-version`：Ruff 会根据此版本检查语法和特性，以避免在旧版本 Python 中使用新语法或在旧版本中检查新特性。
*   `exclude`：指定要忽略的文件或目录。
*   `per-file-ignores`：针对特定文件或文件模式应用不同的忽略规则。
*   `[tool.ruff.pydocstyle]`、`[tool.ruff.isort]` 等：针对特定功能或插件进行更细粒度的配置。
*   `[tool.ruff.format]`：配置内置格式化器的行为，例如行长。

## 五、Ruff 在 CI/CD 中的应用

Ruff 的极速特性使其非常适合集成到持续集成 (CI) 和持续部署 (CD) 流程中。

**典型的 CI/CD 流程：**

{% mermaid %}
graph TD
    A[代码提交] --> B(触发 CI/CD Pipeline);
    B --> C{运行 Ruff Lint 检查};
    C -- 修复错误 --> D(运行 Ruff Format 检查);
    D -- 格式化不一致 --> E(格式化失败);
    D -- 格式化一致 --> F(构建/测试);
    F -- 成功 --> G(部署);
    C -- 发现错误 --> H(Lint 检查失败);
    H --> I{发送报告/通知};
    E --> I;
{% endmermaid %}

在 CI 阶段，通常会执行以下命令：

1.  **检查 Lint 错误 (不自动修复)**：
    ```bash
    ruff check .
    ```
    如果检测到任何错误，CI 将失败，并提示开发者修复。

2.  **检查格式化 (不自动修改)**：
    ```bash
    ruff format . --check
    ```
    这将验证所有文件是否都已正确格式化。如果发现任何文件需要格式化，此命令将以非零退出代码退出，导致 CI 失败，强制开发者在提交前进行格式化。

通过这种方式，Ruff 能够在代码合并之前强制执行代码质量和风格规范，从而保持代码库的整洁和一致性。

## 六、Ruff 与传统工具的对比

| 特性         | Ruff                                       | Flake8 (with plugins) + isort + Black |
| :----------- | :----------------------------------------- | :------------------------------------ |
| **语言**     | Rust                                       | Python                                |
| **速度**     | 极速 (10-100x 快)                          | 较慢                                  |
| **功能整合** | Linting, Formatting, Import Sorting (一体化) | 需多个独立工具配置和运行              |
| **配置**     | 单一 `pyproject.toml` 或 `ruff.toml`       | 多个工具的独立配置                    |
| **可扩展性** | 通过规则代码和自定义插件 (未来计划)        | 通过 Flake8 插件系统                  |
| **安装**     | 单一 `pip install ruff`                    | 多个 `pip install`                    |
| **内存占用** | 低                                         | 相对较高                              |

## 七、总结与展望

Ruff 作为 Python 生态系统中的新星，以其卓越的性能和功能整合能力，正在迅速改变 Python 代码检查和格式化的格局。它不仅仅是一个替代品，更是一个强大的整合器，极大地简化了工具链，提升了开发效率。

对于任何重视代码质量和开发效率的 Python 项目，Ruff 都值得尝试和推广。随着其功能的不断完善和社区生态的成熟，Ruff 很有可能成为未来 Python 项目中不可或缺的基石工具。

**未来展望：**

*   更完善的 IDE 集成
*   更多定制化规则和插件支持
*   持续优化格式化器，实现与 Black 的完全对等甚至超越。
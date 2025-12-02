---
title: Python Setuptools 详解
date: 2024-11-27 06:24:00
tags:
  - 2024
  - Python
  - 包管理
  - 项目构建
categories:
  - Python
  - 项目构建
---

> **Setuptools** 是一个强大的 Python 库，用于简化 Python 项目的**打包 (packaging)**、**分发 (distribution)** 和**安装 (installation)**。它是 `distutils` 库的增强版，提供了一系列高级功能，如声明项目元数据、自动发现包、安装依赖项、创建可执行脚本和支持插件机制等。Setuptools 已经成为 Python 项目管理和分发的**事实标准 (de facto standard)**。

{% note info %}
核心思想：**将 Python 代码、资源文件、元数据和依赖项封装成标准化的发行包 (Source Distribution 或 Wheel)，方便用户通过 `pip` 等工具安装和管理，从而实现代码的轻松共享和复用。**
{% endnote %}
------

## 一、为什么需要 Setuptools？

在 Python 项目开发中，尤其当项目需要被他人使用、共享或部署到不同环境时，会遇到以下问题：

1.  **代码复用与分发**：如何将自己的 Python 代码模块化，并方便地分享给他人使用？简单地复制粘贴文件显然不是一个可持续的方案。
2.  **依赖管理**：我的项目依赖了哪些第三方库？如何确保用户在安装我的项目时，这些依赖也能被正确安装？
3.  **安装标准化**：用户如何才能轻松、一致地安装我的项目？是手动复制文件、配置路径，还是有更自动化的方式？
4.  **项目元数据**：项目的名称、版本、作者、许可证、描述等信息应该存放在哪里，如何让工具自动读取？
5.  **可执行脚本**：如果我的项目包含需要直接从命令行运行的脚本，如何将它们安装到用户的 PATH 环境变量中，方便直接调用？
6.  **跨平台兼容性**：如何确保我的项目能在不同的操作系统和 Python 版本上正确安装和运行？

Setuptools 旨在解决这些问题，提供一套统一、标准化的机制：

*   **创建标准发行包**：将项目打包成 `.tar.gz` (源码包) 或 `.whl` (Wheel 二进制分发包) 格式，方便发布到 PyPI (Python Package Index) 或其他包仓库。
*   **自动依赖解析与安装**：在安装项目时，自动检查并安装其声明的所有依赖项。
*   **统一的安装接口**：用户只需通过 `pip install my-package` 即可完成安装，无需关心内部细节。
*   **丰富的项目元数据**：在一个中心文件 (通常是 `pyproject.toml` 或 `setup.py`) 中声明所有项目信息。
*   **集成构建工具**：与 `pip` 紧密集成，是 `pip` 幕后进行项目安装和依赖解析的核心工具之一。
*   **支持插件和入口点**：允许项目暴露特定的接口，供其他项目作为插件使用。

## 二、Setuptools 的核心概念与工作原理

### 2.1 核心概念

1.  **`pyproject.toml` / `setup.py`**:
    *   **定义**：项目配置文件的两种主要形式。`pyproject.toml` 是 PEP 517/518 引入的更现代的构建系统配置文件，而 `setup.py` 是 Setuptools 长期以来的传统配置文件。
    *   **作用**：声明项目的元数据（名称、版本、作者、描述等）、包的结构、依赖项、数据文件、可执行脚本等所有打包和分发所需的信息。
    *   **优先级**：现代项目中推荐使用 `pyproject.toml`，它可以指定构建后端（如 Setuptools）。如果 `pyproject.toml` 不存在，Setuptools 会回退到 `setup.py`。

2.  **`setup()` 函数**:
    *   **定义**：Setuptools 的核心函数，通常在 `setup.py` 中调用。它接受大量关键字参数，用于描述项目。
    *   **作用**：Setuptools 会解析这些参数，并据此构建发行包。

3.  **`find_packages()`**:
    *   **定义**：Setuptools 提供的一个实用函数，用于自动发现项目目录下的所有 Python 包（包含 `__init__.py` 的目录）。
    *   **作用**：避免手动列出所有包名，简化 `setup.py` 的配置。

4.  **Entry Points (入口点)**:
    *   **定义**：在 `setup.py` 或 `pyproject.toml` 中声明的特殊机制，允许项目暴露可执行脚本或插件。
    *   **作用**：
        *   **可执行脚本 (console_scripts)**：将 Python 函数包装成系统命令，安装后可以直接在命令行调用。
        *   **插件 (gui_scripts, [project.entry-points."groupname"])**：定义一种注册和发现插件的方式，其他应用可以查找并加载这些插件。

5.  **Source Distribution (sdist - 源码分发包)**:
    *   **定义**：包含项目源代码、元数据以及 `setup.py` 或 `pyproject.toml` 的 `.tar.gz` 或 `.zip` 文件。
    *   **作用**：提供项目最原始的形态，构建时会在目标机器上运行 `setup.py`。

6.  **Built Distribution (Wheel - 二进制分发包)**:
    *   **定义**：`.whl` 格式的文件，包含预编译的 Python 代码、数据文件和元数据。它是 Python 的标准二进制分发格式。
    *   **作用**：无需在安装时执行构建步骤，安装速度快，且避免了在目标机器上编译 C 扩展等复杂性。推荐用于分发。

7.  **PyPI (Python Package Index)**:
    *   **定义**：Python 社区官方的第三方库仓库。
    *   **作用**：开发者可以将自己的发行包上传到 PyPI，供全球用户通过 `pip` 命令下载和安装。

### 2.2 工作原理

当用户运行 `pip install my-package` 时，`pip` 会：

1.  **查找包**：在配置的索引 (默认是 PyPI) 中查找 `my-package`。
2.  **下载发行包**：优先下载 Wheel (`.whl`) 包。如果没有 Wheel 包，则下载源码包 (sdist)。
3.  **构建 (如果下载的是 sdist)**：
    *   `pip` 会根据 `pyproject.toml` 中指定的构建后端 (例如 `setuptools`)，或者直接执行 `setup.py` 中的 `setup()` 函数。
    *   `setuptools` 会解析 `setup()` 函数中声明的所有元数据、包信息和依赖项。
    *   如果项目包含 C 扩展，`setuptools` 会尝试编译它们。
    *   最终将项目构建成一个临时的 Wheel 包。
4.  **安装**：
    *   将 (下载的或临时构建的) Wheel 包解压到 Python 环境的 `site-packages` 目录。
    *   处理 `entry_points`，创建可执行脚本的符号链接或包装器。
    *   根据 `install_requires` 声明的依赖，递归地安装所有缺失的依赖项。
5.  **记录**：在 `site-packages` 中留下 `.dist-info` 目录，记录已安装包的元数据。

## 三、Setuptools 入门与基本用法 (现代方法 `pyproject.toml`)

### 3.1 目录结构

一个典型的 Python 项目结构：

```
my_awesome_package/
├── src/
│   └── my_awesome_package/
│       ├── __init__.py
│       ├── main.py
│       └── utils.py
├── tests/
│   ├── __init__.py
│   └── test_main.py
├── pyproject.toml
├── README.md
├── LICENSE
└── .gitignore
```

这里我们使用 `src/` 布局，将真正的 Python 包代码放在 `src/my_awesome_package/` 下。这是一种推荐的实践，可以避免在开发时意外导入未安装的本地包。

### 3.2 配置 `pyproject.toml`

这是现代 Python 项目推荐的配置方式。

```toml
# pyproject.toml
[build-system]
requires = ["setuptools>=61.0"] # 声明构建项目所需的工具及其版本
build-backend = "setuptools.build_meta" # 指定Setuptools为构建后端

[project]
name = "my-awesome-package" # 项目名称，通常与包名相同或相似，但用连字符
version = "0.1.0" # 项目版本
authors = [
  { name="Your Name", email="your.email@example.com" },
]
description = "A short description of my awesome package." # 项目简述
readme = "README.md" # 项目的 README 文件
requires-python = ">=3.8" # 声明支持的 Python 版本
keywords = ["awesome", "python", "utility"] # 关键字，方便搜索
license = { file="LICENSE" } # 许可证文件
classifiers = [ # 分类器，描述项目类型、状态、兼容性等
    "Programming Language :: Python :: 3",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Development Status :: 3 - Alpha",
]
dependencies = [ # 项目的运行时依赖
    "requests>=2.28.1",
    "beautifulsoup4>=4.11.1",
]

[project.optional-dependencies] # 可选依赖，例如开发或测试依赖
dev = [
    "pytest>=7.0",
    "flake8",
    "black",
]

[project.urls] # 项目相关的 URL
Homepage = "https://github.com/yourusername/my_awesome_package"
Repository = "https://github.com/yourusername/my_awesome_package.git"
"Bug Tracker" = "https://github.com/yourusername/my_awesome_package/issues"

[project.scripts] # 声明可执行的命令行脚本
# key 是命令名，value 是 "包名.模块名:函数名"
my-awesome-cli = "my_awesome_package.main:cli_entry_point"
# 如果你的入口点函数是在 __init__.py 里, 可以写成 my_awesome_package:cli_entry_point

[project.gui-scripts] # 声明 GUI 脚本 (可选)
my-awesome-gui = "my_awesome_package.gui:start_app"

[tool.setuptools] # Setuptools 特有的配置
# 告诉 setuptools 你的包代码在 src 目录下
packages = ["my_awesome_package"] # 或者 find: 自动查找包
# 如果使用 src 布局，需要指定 package_dir
package-dir = {"" = "src"}
# include-package-data = true # 如果需要包含非 Python 文件，如静态资源

# [tool.setuptools.packages.find] # 如果使用 find: 自动查找包
# where = ["src"] # 从 src 目录查找包
# include = ["my_awesome_package", "my_awesome_package.*"] # 包含哪些包
```

### 3.3 `src/my_awesome_package/__init__.py`

这个文件将包标记为 Python 包。

```python
# src/my_awesome_package/__init__.py

__version__ = "0.1.0" # 通常也在这里定义版本

# 可以导入包内部的常用模块，方便用户直接从包名导入
from .main import say_hello
from .utils import add_numbers
```

### 3.4 `src/my_awesome_package/main.py`

包含一些核心逻辑和一个可执行脚本的入口点。

```python
# src/my_awesome_package/main.py

def say_hello(name: str) -> str:
    """Returns a greeting message."""
    return f"Hello, {name} from my_awesome_package!"

def cli_entry_point() -> None:
    """
    This function will be exposed as a command-line script.
    """
    print(say_hello("CLI User"))
    print("This is my awesome CLI tool!")

if __name__ == "__main__":
    cli_entry_point()
```

### 3.5 `src/my_awesome_package/utils.py`

一个辅助模块。

```python
# src/my_awesome_package/utils.py

def add_numbers(a: int, b: int) -> int:
    """Adds two numbers."""
    return a + b
```

## 四、使用 Setuptools 进行开发和分发

### 4.1 本地安装 (可编辑模式)

在项目根目录（`pyproject.toml` 所在目录）下运行：

```bash
pip install -e .
```

*   `install -e .` (editable install) 会创建一个符号链接，让你的 Python 环境直接使用项目目录中的代码。
*   你对代码的任何修改都会立即生效，无需重新安装。
*   同时也会安装 `pyproject.toml` 中声明的所有依赖。

### 4.2 构建发行包

确保你安装了 `build` 工具：`pip install build`。

1.  **构建源码分发包 (sdist)** 和 **Wheel 分发包 (bdist_wheel)**:
    在项目根目录运行：
    ```bash
    python -m build
    ```
    这会在项目根目录下创建一个 `dist/` 目录，其中包含 `.tar.gz` (sdist) 和 `.whl` (Wheel) 文件。

    例如：
    ```
    dist/
    ├── my_awesome_package-0.1.0-py3-none-any.whl
    └── my_awesome_package-0.1.0.tar.gz
    ```

### 4.3 分发到 PyPI

1.  **注册 PyPI 账户**：如果你还没有，在 [pypi.org](https://pypi.org/) 和 [test.pypi.org](https://test.pypi.org/) 上注册账户。
2.  **安装 `twine`**：`pip install twine` (用于安全上传)。
3.  **上传到 TestPyPI (推荐先测试)**：
    ```bash
    twine upload --repository testpypi dist/*
    ```
    它会提示你输入 TestPyPI 的用户名和密码。
4.  **从 TestPyPI 安装测试**：
    ```bash
    pip install --index-url https://test.pypi.org/simple/ --no-deps my-awesome-package
    ```
    `--no-deps` 避免 TestPyPI 尝试安装 PyPI 上的依赖，你可以单独安装。
5.  **上传到生产 PyPI**：
    ```bash
    twine upload dist/*
    ```
    它会提示你输入 PyPI 的用户名和密码。

### 4.4 从 PyPI 安装

一旦你的包上传到 PyPI，任何用户都可以通过以下命令安装它：

```bash
pip install my-awesome-package
```

安装后，`pyproject.toml` 中声明的 `console_scripts` 就可以直接使用了：

```bash
my-awesome-cli
```

或者在 Python 解释器中导入和使用包：

```python
import my_awesome_package
print(my_awesome_package.say_hello("World"))
print(my_awesome_package.add_numbers(5, 3))
```

## 五、传统方法 `setup.py` (简要说明)

在 `pyproject.toml` 普及之前，`setup.py` 是唯一的配置方式。它本质上是一个 Python 脚本，直接调用 `setuptools.setup()` 函数。

```python
# setup.py (示例)
from setuptools import setup, find_packages

setup(
    name="my-awesome-package",
    version="0.1.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="A short description of my awesome package.",
    long_description=open('README.md').read(),
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/my_awesome_package",
    packages=find_packages(where='src'), # 自动发现 src 目录下的包
    package_dir={"": "src"}, # 指定包代码在 src 目录
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.8',
    install_requires=[
        "requests>=2.28.1",
        "beautifulsoup4>=4.11.1",
    ],
    entry_points={
        'console_scripts': [
            'my-awesome-cli = my_awesome_package.main:cli_entry_point',
        ],
    },
    # include_package_data=True, # 确保包含非 Python 文件 (需要 MANIFEST.in)
)
```

尽管 `setup.py` 仍能工作，但在新项目中，**强烈建议使用 `pyproject.toml`**，因为它提供了更清晰、声明式的配置，并支持不同的构建后端。

## 六、安全性考虑

Setuptools 本身作为打包工具，其安全性主要体现在防止恶意代码在构建和安装过程中执行，以及确保依赖项的可靠性。

1.  **来源信任**：
    *   **仅从可信来源安装包**：只从 PyPI 或其他你信任的包仓库安装包。避免从不明来源下载和运行 `setup.py` 或安装 `.whl` 文件。
    *   **验证 PyPI 包**：PyPI 上的包并非都经过严格审查。在安装前，最好查看项目的 GitHub 仓库、文档和社区活跃度。
    *   **哈希校验**：`pip` 支持通过提供包的哈希值来验证下载的包是否被篡改。在 `requirements.txt` 中可以使用 `package_name==version --hash=sha256:abcd...`。

2.  **构建时代码执行**：
    *   **`setup.py` 的风险**：由于 `setup.py` 是一个 Python 脚本，它在构建和安装过程中会被执行。一个恶意的 `setup.py` 可以执行任意代码。
    *   **`pyproject.toml` 的改进**：虽然 `pyproject.toml` 本身是声明性的，但它依然会指定一个构建后端（如 Setuptools），这个后端在执行时也可能加载和运行项目中的代码。
    *   **沙盒构建**：现代构建工具（如 `build`）在可能的情况下会尝试在隔离的环境（虚拟环境）中执行构建，以限制潜在的恶意行为。

3.  **依赖项管理**：
    *   **依赖项漏洞**：你的项目可能依赖的第三方库存在安全漏洞。
    *   **定期审计**：使用 `pip-audit`、`safety` 或集成到 CI/CD 流程中的依赖扫描工具（如 Snyk, Dependabot）定期检查依赖项的已知漏洞。
    *   **版本锁定**：使用 `pip freeze > requirements.txt` 或 `pipenv`, `poetry` 等工具锁定确切的依赖版本，避免因上游依赖更新引入问题。
    *   **依赖混淆攻击**：确保你的内部包名称与 PyPI 上的公共包名称不冲突，尤其是在混合使用内部和公共包仓库时。攻击者可能会上传一个与你内部包同名但版本号更高的恶意包到公共 PyPI。

4.  **许可证合规性**：
    *   确保你项目使用的所有依赖项的许可证都与你项目的许可证兼容。Setuptools 的 `license` 字段可以声明你项目的许可证。

5.  **私有包的保护**：
    *   如果分发的是私有包，确保只上传到私有包仓库，并对访问进行严格的身份验证和授权。

## 七、总结

Setuptools 是 Python 生态中不可或缺的工具，它为 Python 项目的打包、分发和安装提供了强大的基础设施。通过采用 `pyproject.toml` 这种现代配置方式，开发者可以清晰、声明式地定义项目的所有元数据和行为，从而创建易于管理、分发和安装的 Python 包。

理解 Setuptools 的核心概念，如 `pyproject.toml`、`setup()` 函数、Entry Points 和分发包类型 (sdist, Wheel)，是成为一名高效 Python 开发者，并能够将自己的工作分享给社区的基础。同时，在享受其便利性的同时，也应时刻关注依赖项管理和构建过程中的安全性最佳实践，确保项目的健壮性和可靠性。
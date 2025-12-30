---
title: Scoop (Windows 命令行包管理器) 详解
date: 2025-08-23 06:24:00
tags:
  - 2025
  - Windows
categories:
  - 开发工具
  - Windows
---

> **Scoop** 是 Windows 平台上的一个开源命令行安装程序，它旨在为开发者提供一个简洁、无需管理员权限、便携式的软件管理解决方案。与传统的 Windows 软件安装方式不同，Scoop 不会污染系统 PATH，不依赖 MSI 安装程序，并且默认将软件安装到用户目录而非系统目录。它特别适合于管理开发工具、CLI 应用程序以及其他便携式软件。

{% note info %}
核心思想：**为 Windows 用户提供一种无需管理员权限、以用户级别安装和管理软件的方式，强调简洁、便携和避免系统污染。**
{% endnote %}
------

## 一、为什么选择 Scoop？

传统的 Windows 软件安装和管理方式存在以下痛点：

1.  **管理员权限 (UAC 提示)**：大多数 Windows 软件安装都需要管理员权限，频繁弹出 UAC (User Account Control) 提示，打断工作流。
2.  **系统路径污染 (PATH)**：许多软件会将自身目录添加到系统 PATH 环境变量中，随着安装的软件增多，PATH 变得冗长且难以管理。
3.  **非便携式安装**：多数软件通过 MSI 或 EXE 安装程序进行安装，会将文件分散到系统各处，并在注册表中留下大量条目，不易于迁移或彻底卸载。
4.  **升级繁琐**：软件升级通常需要手动下载新版本并重新运行安装程序。
5.  **缺乏集中管理**：没有统一的方式来查看、更新或卸载所有安装的软件。

Scoop 针对这些问题提供了优雅的解决方案：

*   **无需管理员权限**：Scoop 默认将软件安装到用户目录 (`~/scoop`)，因此不需要管理员权限，避免了烦人的 UAC 提示。
*   **便携式安装**：大多数 Scoop 包都是“解压即用”的便携式应用，它们被安装在独立的目录中，不会写入注册表，易于管理和迁移。
*   **PATH 清洁**：Scoop 通过**Shim (垫片)** 机制来管理可执行文件，避免直接修改系统 PATH 环境变量，保持 PATH 的整洁。
*   **命令行驱动**：所有操作（安装、升级、卸载、搜索）都通过简单的命令行指令完成，高效且易于脚本化。
*   **依赖管理**：Scoop 可以处理软件之间的依赖关系，确保所有必要的组件都被正确安装。
*   **版本控制**：支持安装特定版本的软件，或在不同版本之间切换。

## 二、Scoop 的安装

安装 Scoop 相对简单，需要一些基本的系统配置。

### 2.1 系统要求

*   **Windows 7 SP1+** (Scoop 推荐 Windows 10+ 以获得最佳体验)
*   **PowerShell 5+** (Windows 10 默认自带，旧版本 Windows 可能需要升级)
*   **Git** (需要 Git 来管理 Scoop 的 buckets)
*   **`.NET Framework 4.5+`** (通常已安装)

### 2.2 安装步骤

1.  **安装 Git** (如果尚未安装):
    访问 [Git 官网](https://git-scm.com/downloads) 下载并安装 Git for Windows。或者，如果你已经安装了 Chocolatey，可以使用 `choco install git` 安装。

2.  **设置 PowerShell 执行策略**:
    打开 PowerShell（无需管理员权限），并执行以下命令：
    ```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```
    这个命令允许运行本地创建的脚本以及从 Internet 下载的、已由受信任发布者签名的脚本。`-Scope CurrentUser` 确保此更改仅影响当前用户。

3.  **安装 Scoop**:
    在同一个 PowerShell 窗口中，执行以下命令：
    ```powershell
    irm get.scoop.sh | iex
    ```
    *解释:*
    *   `irm`: 是 `Invoke-RestMethod` 的别名，用于从指定 URL 下载内容。
    *   `get.scoop.sh`: 是 Scoop 的安装脚本 URL。
    *   `iex`: 是 `Invoke-Expression` 的别名，用于执行一个字符串作为命令。

    这个命令会下载并执行 Scoop 的安装脚本，将 Scoop 安装到你的用户配置文件目录（通常是 `C:\Users\<YourUser>\scoop`）。

4.  **验证安装**:
    安装完成后，重新打开一个 PowerShell 窗口（确保 PATH 环境变量更新），然后运行：
    ```powershell
    scoop help
    ```
    如果显示 Scoop 的帮助信息，则表示安装成功。Scoop 还会自动添加默认的 `main` bucket。

## 三、Scoop 核心概念

在使用 Scoop 之前，理解其几个核心概念有助于更好地利用它。

### 3.1 Buckets (桶)

**定义**：Buckets 是 Scoop 软件包的**清单仓库**。它们是 Git 仓库，包含了一系列描述如何安装和管理应用程序的 JSON 文件（即 Manifests）。
*   **`main` bucket**：Scoop 默认添加的 bucket，包含了大量常用的开发者工具，如 `git`, `python`, `nodejs`, `vscode` 等。
*   **自定义 bucket**：你可以添加其他社区或私人维护的 bucket，以获取更多或特定的软件。

### 3.2 Manifests (清单)

**定义**：Manifests 是 Scoop 包的核心。它们是 JSON 文件，详细描述了如何下载、安装、配置和卸载一个应用程序。
一个典型的 Manifest 文件会包含：
*   `version`：软件版本。
*   `description`：软件描述。
*   `homepage`：软件官网。
*   `license`：许可信息。
*   `url`：软件的下载链接。
*   `hash`：用于验证下载文件完整性的哈希值。
*   `bin`：指定可执行文件或需要创建 shim 的脚本。
*   `depends`：软件的依赖项。

**示例 (部分 `git.json` 内容):**

```json
{
  "version": "2.45.0.windows.1",
  "description": "Git is a free and open source distributed version control system.",
  "homepage": "https://git-scm.com",
  "license": "GPL-2.0-only",
  "architecture": {
    "64bit": {
      "url": "https://github.com/git-for-windows/git/releases/download/v2.45.0.windows.1/PortableGit-2.45.0.1-64-bit.7z",
      "hash": "sha512:f30c..."
    }
  },
  "bin": [
    "cmd\\git.exe",
    "cmd\\gitk.exe",
    "cmd\\git-bash.exe"
  ],
  // ... 其他配置
}
```

### 3.3 Shims (垫片)

**定义**：Shims 是 Scoop 的一个关键机制，用于解决 PATH 污染问题。当 Scoop 安装一个软件时，它会在 `~/scoop/shims` 目录下为该软件的主要可执行文件创建一些轻量级的 `.exe` 文件（称为 "shims"）。这些 shims 实际上是指向实际应用程序可执行文件的快捷方式或代理。

`~/scoop/shims` 目录是唯一被添加到用户 PATH 环境变量的 Scoop 相关目录。当你在命令行输入 `git` 时，Windows 会在 PATH 中找到 `~/scoop/shims/git.exe`，然后这个 shim 会负责启动实际安装在 `~/scoop/apps/git/<version>/cmd/git.exe` 的 Git 应用程序。

**工作原理图示**：

{% mermaid %}
graph TD
    A[命令行输入: git] --> B[查找 PATH]
    B --> C{找到 ~/scoop/shims/git.exe}
    C -- 调用 --> D["Shim (git.exe)"]
    D -- 代理启动 --> E[实际应用: ~/scoop/apps/git/2.45.0/cmd/git.exe]
    E -- 执行 --> F[Git 应用运行]
{% endmermaid %}

**优点**：
*   **避免 PATH 污染**：用户 PATH 中只有一个 Scoop shim 目录，而不是每个应用程序的路径。
*   **版本管理**：理论上可以实现多版本共存和快速切换（尽管 Scoop 默认是安装最新版本）。
*   **可移植性**：应用程序可以安装在任何位置，只要 shim 正确指向即可。

## 四、Scoop 常用命令详解

Scoop 的命令结构通常是 `scoop <command> [args] [options]`。

### 4.1 `install` - 安装软件

**作用**：安装指定的软件包。

**语法**：
*   `scoop install <app_name>`：安装最新版本的软件包。
*   `scoop install <app_name>@<version_number>`：安装指定版本的软件包。
*   `scoop install <app1> <app2> ...`：同时安装多个软件包。

**示例**：

```powershell
scoop install git         # 安装 Git
scoop install python      # 安装 Python
scoop install nodejs@18.17.0 # 安装 Node.js 特定版本
scoop install vscode powertoys # 同时安装 VS Code 和 PowerToys
```

### 4.2 `uninstall` - 卸载软件

**作用**：卸载指定的软件包。

**语法**：`scoop uninstall <app_name>`

**示例**：

```powershell
scoop uninstall python   # 卸载 Python
```

### 4.3 `update` - 更新软件和Scoop本身

**作用**：更新 Scoop 自身以及所有已安装的应用程序。

**语法**：
*   `scoop update`：更新 Scoop 自身和所有 buckets，然后更新所有已安装的应用程序。
*   `scoop update <app_name>`：只更新指定的应用程序。

**示例**：

```powershell
scoop update             # 更新所有
scoop update git         # 只更新 Git
```

### 4.4 `status` - 查看状态

**作用**：显示 Scoop 仓库、bucket 和已安装应用程序的状态，检查是否有待更新的应用程序。

**语法**：`scoop status`

**示例**：

```powershell
scoop status
# output:
# Scoop is up to date.
# Checking for outdated apps...
# Done. All apps are up to date.
```

### 4.5 `search` - 搜索软件包

**作用**：在已添加的 buckets 中搜索软件包。

**语法**：`scoop search <query>`

**示例**：

```powershell
scoop search chrome        # 搜索与 "chrome" 相关的软件包
scoop search terminal      # 搜索与 "terminal" 相关的软件包
```

### 4.6 `list` - 列出已安装的软件

**作用**：列出所有通过 Scoop 安装的应用程序。

**语法**：`scoop list`

**示例**：

```powershell
scoop list
# output:
# Installed apps:
#
# Name       Version      Updated
# ----       -------      -------
# 7zip       23.01        2024-05-15 09:00:00
# git        2.45.0       2024-05-15 09:05:00
# ...
```

### 4.7 `info` - 查看软件包信息

**作用**：显示指定软件包的详细信息，包括版本、描述、主页、安装路径、依赖等。

**语法**：`scoop info <app_name>`

**示例**：

```powershell
scoop info git # 查看 Git 软件包的详细信息
```

### 4.8 `bucket` - 管理 buckets

**作用**：管理 Scoop 的 buckets（添加、列出、移除）。

**语法**：
*   `scoop bucket list`：列出所有已添加的 buckets。
*   `scoop bucket add <bucket_name> [git_repo_url]`：添加一个 bucket。
*   `scoop bucket rm <bucket_name>`：移除一个 bucket。

**示例**：

```powershell
scoop bucket list # 查看当前所有 buckets
scoop bucket add extras # 添加 "extras" bucket (包含更多实用工具)
scoop bucket add versions # 添加 "versions" bucket (支持多版本)
scoop bucket add nirsoft https://github.com/rasa/scoop-nirsoft # 添加一个第三方 bucket
```

### 4.9 `hold` / `unhold` - 锁定/解锁更新

**作用**：阻止或允许特定应用程序的更新。

**语法**：
*   `scoop hold <app_name>`：锁定应用程序，`scoop update` 将跳过它。
*   `scoop unhold <app_name>`：解锁应用程序，允许其被更新。

**示例**：

```powershell
scoop hold python # 阻止 Python 被更新
scoop unhold python # 允许 Python 被更新
```

### 4.10 `cache` - 清理缓存

**作用**：管理 Scoop 下载的安装包缓存。

**语法**：
*   `scoop cache show`：显示缓存内容。
*   `scoop cache rm <app_name>`：移除指定应用的缓存。
*   `scoop cache rm *`：移除所有应用的缓存。

**示例**：

```powershell
scoop cache show
scoop cache rm * # 清理所有下载的安装包缓存
```

### 4.11 `reset` - 版本管理

**作用**：切换活动版本。

**语法**：
*   `scoop reset python310`：切换对应的版本。

**示例**：

```powershell
scoop list python # 列出所有python版本
scoop reset python312 # 切换为Python 3.12版本
```

## 五、Scoop 高级用法与最佳实践

### 5.1 设置代理

如果你在受代理限制的网络环境中，可以为 Scoop 配置代理：

```powershell
scoop config proxy http://<ip_address>:<port>
# 如果需要认证
scoop config proxy http://<username>:<password>@<ip_address>:<port>
# 取消代理
scoop config rm proxy
```

### 5.2 自定义安装路径

默认情况下，Scoop 会安装在 `C:\Users\<YourUser>\scoop`。你可以通过设置 `SCOOP_HOME` 环境变量来改变此路径（在安装 Scoop 之前设置）。

```powershell
# 例如，安装到 D:\Scoop
$env:SCOOP_HOME = "D:\Scoop"
[Environment]::SetEnvironmentVariable('SCOOP_HOME', $env:SCOOP_HOME, 'User') # 设置为持久环境变量
irm get.scoop.sh | iex # 此时再运行安装命令
```

### 5.3 创建自定义 Manifests 和 Buckets

如果你有自己想用 Scoop 管理的软件，或者内部应用，可以创建自己的 Manifest 文件并将其放入一个自定义的 Git bucket 中。

1.  **创建 Manifest**：参考现有的 Manifest 文件，编写一个 `.json` 文件来描述你的应用。
2.  **创建 Git 仓库**：将 `.json` 文件放到一个 Git 仓库中（例如 `my-custom-bucket`）。
3.  **添加 Bucket**：使用 `scoop bucket add my-custom-bucket https://github.com/YourUser/my-custom-bucket.git` 命令添加你的 bucket。
4.  **安装应用**：现在你就可以通过 `scoop install <your_app_name>` 来安装你的自定义应用了。

### 5.4 导出/导入已安装应用列表

方便在新机器上快速配置相同的开发环境。

```powershell
scoop list --installed > installed_apps.txt # 导出已安装应用列表
# 在新机器上，可以编写脚本读取此文件并批量安装
# Get-Content installed_apps.txt | ForEach-Object { $app = $_.Split(" ")[0]; scoop install $app }
```

### 5.5 禁用全局 Shims

如果某些应用不适合通过 shim 运行，可以禁用全局 shim 功能（例如，某些需要严格路径或特殊启动参数的应用）。

```powershell
scoop config disable_shimming true
```

## 六、Scoop 与 Chocolatey 的简单对比

| 特性       | Scoop                                      | Chocolatey                                    |
| :--------- | :----------------------------------------- | :-------------------------------------------- |
| **权限**   | 默认无需管理员权限 (用户级安装)            | 需管理员权限 (系统级安装)                     |
| **安装位置** | `~/scoop` 或自定义用户目录                 | `C:\ProgramData\chocolatey` 或软件默认路径    |
| **安装方式** | 主要为便携式安装 (解压即用)                | 通常使用传统安装程序 (.exe, .msi)             |
| **PATH管理** | 使用 Shim，避免直接污染系统 PATH           | 直接修改系统 PATH                             |
| **注册表** | 极少或不修改注册表                         | 多数软件会写入注册表                          |
| **生态规模** | 专注于开发者工具、CLI 工具，生态较小但精悍 | 广泛，包含更多日常软件和企业级工具，生态庞大  |
| **目标用户** | 开发者、高级用户，注重简洁和便携性         | 开发者、系统管理员、普通用户，注重通用性和易用性 |
| **GUI**    | 纯命令行                                   | 纯命令行 (但有少量第三方 GUI 工具)            |

## 七、总结

Scoop 提供了一种独特且强大的方式来管理 Windows 上的软件，尤其是在开发者工具和 CLI 应用领域表现出色。其无需管理员权限、便携式安装和不污染 PATH 的特性，使其成为追求简洁高效工作流的开发者的理想选择。通过理解 Buckets、Manifests 和 Shims 这些核心概念，并熟练运用其命令行工具，你将能大大提升在 Windows 环境下的开发效率和系统管理体验。如果你厌倦了 Windows 传统的软件安装模式，那么 Scoop 绝对值得一试。
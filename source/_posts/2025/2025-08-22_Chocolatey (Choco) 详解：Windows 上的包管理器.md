---
title: Chocolatey (Choco) 详解：Windows 上的包管理器
date: 2025-08-22 06:24:00
tags:
  - 2025
  - Windows
categories:
  - 开发工具
  - Windows
---

> **Chocolatey** 是 Windows 平台上的一个开源包管理器，它简化了软件的安装、升级、配置和卸载过程。类似于 Linux 上的 `apt` 或 `yum`，以及 macOS 上的 `Homebrew`，Chocolatey 允许用户通过命令行快速、自动化地管理 Windows 应用程序和工具，极大地提高了开发人员和系统管理员的工作效率。

{% note info %}
核心思想：**将 Windows 软件的安装、升级、管理过程标准化和自动化，通过命令行实现“一键安装”，摆脱手动下载、点击下一步的繁琐。**
{% endnote %}
------

## 一、为什么需要 Chocolatey？

传统的 Windows 软件安装方式存在诸多不便：

1.  **手动下载**：需要访问各个软件的官方网站，查找下载链接。
2.  **点击下一步**：安装过程通常需要反复点击“下一步”、“同意协议”，耗时且乏味。
3.  **升级繁琐**：软件升级也需要重复上述步骤，或依赖软件自带的升级器，管理不集中。
4.  **依赖管理**：某些软件可能依赖于其他运行时环境或库，手动安装容易出错或遗漏。
5.  **自动化部署困难**：对于需要批量部署软件的企业或自动化环境，手动安装是巨大的障碍。

Chocolatey 旨在解决这些问题，提供以下优势：

*   **自动化**：通过简单的命令行指令，自动完成软件的下载、安装、配置。
*   **集中管理**：所有通过 Chocolatey 安装的软件都可以通过统一的命令进行管理（安装、升级、卸载）。
*   **依赖解决**：包定义中可以包含依赖信息，Chocolatey 会自动处理软件依赖。
*   **易于脚本化**：可以轻松集成到自动化脚本（如 PowerShell）中，实现批量部署和环境初始化。
*   **版本控制**：可以指定安装特定版本的软件，或回滚到旧版本。
*   **广泛的软件库**：拥有庞大的社区维护的软件库，涵盖了开发工具、实用程序、浏览器等各类软件。

## 二、Chocolatey 的安装

安装 Chocolatey 需要管理员权限的 PowerShell。

### 2.1 系统要求

*   Windows 7+ / Windows Server 2003+
*   PowerShell v2+
*   .NET Framework 4+ (Chocolatey v1.0.0+ 已经内置安装 .NET 4.0，无需手动安装)

### 2.2 安装步骤

1.  **打开管理员权限的 PowerShell**：
    在开始菜单搜索 `PowerShell`，右键选择 `以管理员身份运行`。

2.  **设置 PowerShell 执行策略**：
    为确保 Chocolatey 脚本能够运行，需要设置 PowerShell 的执行策略。
    ```powershell
    Set-ExecutionPolicy AllSigned
    # 或者，如果你更了解风险，可以使用 Bypass 以避免在安装过程中提示：
    # Set-ExecutionPolicy Bypass -Scope Process -Force
    ```
    当你被提示选择时，输入 `Y` 并回车。

3.  **安装 Chocolatey**：
    将以下命令复制并粘贴到 PowerShell 窗口中，然后回车执行。

    ```powershell
    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    ```
    *解释：*
    *   `Set-ExecutionPolicy Bypass -Scope Process -Force`: 临时绕过当前 PowerShell 进程的执行策略，允许脚本运行。
    *   `[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072`: 确保使用 TLS 1.2 进行安全连接，解决下载时可能出现的 SSL/TLS 错误。
    *   `iex (...)`: 下载并执行 Chocolatey 的安装脚本。

4.  **验证安装**：
    安装完成后，关闭当前的 PowerShell 窗口，重新以**管理员身份**打开一个新的 PowerShell 窗口，然后运行：

    ```powershell
    choco -v
    ```
    如果显示 Chocolatey 的版本号，则表示安装成功。

## 三、Chocolatey 常用命令详解

Chocolatey 的命令结构通常是 `choco <command> <package_name> [options]`。

### 3.1 `install` - 安装软件

**作用**：安装指定的软件包。

**语法**：
*   `choco install <package_name>`：安装最新版本的软件包。
*   `choco install <package_name> --version <version_number>`：安装指定版本的软件包。
*   `choco install <package1> <package2> ...`：同时安装多个软件包。
*   `choco install <package_name> --params "'/Param1:Value1 /Param2:Value2'"`：安装时传递特定参数给安装程序。

**示例**：

```powershell
choco install googlechrome  # 安装 Google Chrome
choco install vscode --version 1.88.1 # 安装 VS Code 特定版本
choco install git nodejs python # 同时安装 Git、Node.js 和 Python
```

### 3.2 `upgrade` - 升级软件

**作用**：升级一个或多个已安装的软件包。

**语法**：
*   `choco upgrade <package_name>`：升级指定软件包到最新版本。
*   `choco upgrade all`：升级所有已通过 Chocolatey 安装的软件包。

**示例**：

```powershell
choco upgrade googlechrome # 升级 Google Chrome
choco upgrade all # 升级所有软件
```

### 3.3 `uninstall` - 卸载软件

**作用**：卸载指定的软件包。

**语法**：`choco uninstall <package_name>`

**示例**：

```powershell
choco uninstall googlechrome # 卸载 Google Chrome
```

### 3.4 `list` - 列出软件包

**作用**：列出本地或远程仓库中的软件包。

**语法**：
*   `choco list --local-only` 或 `clist -lo`：列出所有本地已安装的软件包。
*   `choco list <search_term>` 或 `clist <search_term>`：搜索远程仓库中的软件包。
*   `choco list`：列出所有可用的远程软件包（数量庞大）。

**示例**：

```powershell
choco list --local-only # 查看所有已安装的软件
choco list chrome # 搜索与 "chrome" 相关的软件包
```

### 3.5 `search` - 搜索软件包 (与 `list` 类似)

**作用**：在社区仓库中搜索软件包。实际上与 `choco list <search_term>` 功能相同。

**语法**：`choco search <search_term>`

**示例**：

```powershell
choco search java # 搜索 Java 相关的软件包
```

### 3.6 `info` - 查看软件包信息

**作用**：显示指定软件包的详细信息，包括版本、描述、主页、依赖等。

**语法**：`choco info <package_name>`

**示例**：

```powershell
choco info git # 查看 Git 软件包的详细信息
```

### 3.7 `source` - 管理包源

**作用**：管理 Chocolatey 查找和下载包的来源。可以添加、禁用、启用或移除包源。

**语法**：
*   `choco source list`：列出所有已配置的包源。
*   `choco source add -n=<source_name> -s=<source_url> [--username=<user> --password=<pass>]`：添加一个包源。

**示例**：

```powershell
choco source list # 查看当前所有包源
# 添加一个私有包源 (例如，公司内部的 Chocolatey 源)
choco source add -n=MyInternalSource -s="https://my.internal.repo.com/choco"
```

### 3.8 `config` - 管理 Chocolatey 配置

**作用**：管理 Chocolatey 本身的配置设置。

**语法**：
*   `choco config list`：列出所有配置项。
*   `choco config get <config_key>`：获取指定配置项的值。
*   `choco config set <config_key> <value>`：设置指定配置项的值。

**示例**：

```powershell
choco config list # 查看 Chocolatey 的所有配置
choco config set cachelocation C:\ChocoCache # 设置 Chocolatey 的缓存目录
```

### 3.9 `feature` - 管理 Chocolatey 功能

**作用**：启用或禁用 Chocolatey 的特定功能。

**语法**：
*   `choco feature list`：列出所有功能及其状态。
*   `choco feature enable -n=<feature_name>`：启用某个功能。
*   `choco feature disable -n=<feature_name>`：禁用某个功能。

**示例**：

```powershell
choco feature list # 查看所有功能
choco feature enable -n=allowGlobalConfirmation # 启用全局确认，安装时无需再确认
```

## 四、如何寻找软件包？

Chocolatey 社区仓库是寻找软件包的主要途径。

1.  **访问官网搜索**：[Chocolatey 官网](https://community.chocolatey.org/packages)
    在官网上可以直接搜索你需要的软件，查看其包名、版本、描述、维护者以及安装指令。

2.  **通过命令行搜索**：
    ```powershell
    choco search <software_name>
    ```
    例如 `choco search sublime-text`。

## 五、高级用法与注意事项

### 5.1 全局确认 (Global Confirmation)

默认情况下，每次安装或升级软件包时，Chocolatey 都会提示你进行确认。如果你想在脚本中实现完全自动化，可以启用全局确认功能：

```powershell
choco feature enable -n=allowGlobalConfirmation
# 或者在每次命令后添加 -y 或 --confirm 参数
choco install git -y
```

### 5.2 静默安装与参数传递

许多 Chocolatey 包支持在安装时传递参数，以实现静默安装、自定义安装路径等。这些参数通常在包的 `info` 或官网页面有说明。

```powershell
# 示例：安装 Java JDK，并设置安装目录（具体参数请查阅对应包的说明）
choco install javajdk --params "'/InstallDir:C:\Program Files\Java\jdk-11'"
```

### 5.3 包版本锁定

如果你不希望某个软件包被 `choco upgrade all` 命令升级，可以将其锁定：

```powershell
choco install git
choco pin add -n=git # 锁定 git 包，阻止其升级
choco pin list # 查看所有锁定的包
choco pin remove -n=git # 解锁 git 包
```

### 5.4 自定义软件包 (Package Creation)

如果 Chocolatey 社区仓库中没有你需要的软件，或者你需要打包内部应用，你可以创建自己的 Chocolatey 包。
Chocolatey 包本质上是 `.nupkg` 文件，其中包含 `.nuspec` 元数据文件和 `chocolateyInstall.ps1` PowerShell 脚本。该脚本负责实际的安装逻辑。

**创建步骤**：
1.  `choco new <package_name>`：创建一个新的包模板。
2.  编辑生成的 `.nuspec` 文件（元数据）和 `chocolateyInstall.ps1` （安装逻辑）。
3.  `choco pack`：打包为 `.nupkg` 文件。
4.  `choco push <package_name>.nupkg`：推送到本地或远程包源。

### 5.5 安全性考虑

*   **执行策略**：安装 Chocolatey 需要修改 PowerShell 的执行策略。请确保理解其含义。
*   **社区包**：大多数 Chocolatey 包由社区维护。虽然官方有审核机制，但建议在安装前查看包的来源、维护者和受欢迎程度，避免潜在的安全风险。对于关键的生产环境，建议搭建私有包源或仅使用官方认证的包。
*   **管理员权限**：Chocolatey 多数操作需要管理员权限。

## 六、总结

Chocolatey 是 Windows 用户提升工作效率的强大工具。通过命令行即可实现软件的自动化安装、升级和管理，极大地简化了开发环境配置和系统维护。无论你是开发者、系统管理员还是普通用户，学习并使用 Chocolatey 都能让你告别繁琐的手动操作，享受现代包管理带来的便利。开始你的 Chocolatey 之旅吧，你将发现 Windows 上的软件管理从未如此简单！
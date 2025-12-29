---
title: Homebrew 深度详解：Macos (Linux) 上的包管理器
date: 2024-07-02 06:24:00
tags:
  - 2024
  - Linux
  - macOS
categories:
  - Linux
---
> Homebrew 是 macOS（以及近期扩展到 Linux）平台上一款免费开源的软件包管理系统，它简化了在 Mac 上安装 UNIX 工具、开源软件和各种开发工具的过程。对于开发者而言，Homebrew 极大地提高了生产力，使得在命令行环境下安装、更新和管理软件变得像使用 `apt` 或 `yum` 那样简单。它弥补了 macOS 缺乏官方包管理器的不足，被誉为“Mac 缺失的包管理器”。

{% note info %}
核心思想：**Homebrew 是 macOS (和 Linux) 上的命令行包管理器，通过简化安装、更新和管理软件的过程，极大地提高了开发者的工作效率。它允许用户安装 Apple 没有预装但 UNIX 世界常用的工具，以及各种开发软件。**
{% endnote %}
---

## 一、什么是 Homebrew？

Homebrew 是一个用 Ruby 编写的软件包管理器。它允许用户从命令行轻松安装、更新和卸载软件。与其它的软件包管理器不同，Homebrew 以一种**非侵入式**的方式工作，它将所有软件包安装在 **/usr/local/Cellar** (默认路径) 下，然后通过符号链接将可执行文件链接到 `/usr/local/bin`，从而确保与系统自带的目录和文件互不干扰。

*   **软件源（Repo）**：Homebrew 通过 Git 来管理软件的“配方”（Formula）。这些配方存储在 GitHub 上的一个核心仓库（`homebrew/core`）中，它们是 Ruby 脚本，描述了如何下载、编译和安装特定软件。
*   **非特权安装**：通常情况下，Homebrew 不需要 `sudo` 权限就可以安装软件，因为它默认将软件安装在用户可写的 `/usr/local` 目录下。

### 1.1 Homebrew Cask

Homebrew 的核心功能是管理命令行工具和库（Formulae）。但为了方便地管理 macOS 下的图形界面应用程序，Homebrew 引入了 **Homebrew Cask**。

*   **Formulae (公式)**：用于安装命令行工具、库等，通过源码编译或预编译的二进制文件安装。例如 `nginx`, `git`, `python`。
*   **Cask (桶)**：用于安装 macOS 上的图形界面应用（`.app` 文件），例如 `google-chrome`, `visual-studio-code`, `docker`。它们通常是直接下载并解压 `.dmg` 或 `.pkg` 文件。

你可以像安装 Formulae 一样安装 Cask：`brew install --cask google-chrome`。

### 1.2 Linuxbrew (现在称为 Homebrew for Linux)

Homebrew 最初是为 macOS 设计的，但现在它也支持 Linux 系统，被称为 Homebrew for Linux。它允许 Linux 用户在没有 root 权限的情况下安装最新的软件版本，尤其是在使用老旧系统版本时非常有用。

## 二、安装 Homebrew

安装 Homebrew 非常简单，只需在终端运行以下命令：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**安装过程会：**
1.  下载 Homebrew 的安装脚本。
2.  检查系统环境和依赖项（如 Xcode Command Line Tools）。
3.  将 Homebrew 安装到 `/usr/local` (或 `/opt/homebrew` for Apple Silicon) 目录下。
4.  将 Homebrew 的 bin 目录添加到你的 `PATH` 环境变量中。

**安装完成后，建议运行以下命令进行环境检查：**

```bash
brew doctor
```
`brew doctor` 会检查 Homebrew 的安装状态，并提供任何潜在问题的建议。

## 三、Homebrew 常用指令详解

Homebrew 的指令结构清晰，主要分为管理 Formulae 和 Cask 两大类。

### 3.1 Formulae (命令行工具和库) 相关指令

#### 3.1.1 搜索和查找软件

*   **`brew search <text>`**: 搜索 Formulae。
    ```bash
    brew search python
    # 查找所有包含 "python" 的公式
    ```
*   **`brew search /<text>/`**: 使用正则表达式搜索 Formulae。
    ```bash
    brew search /^node/
    # 查找所有以 "node" 开头的公式
    ```

#### 3.1.2 安装软件

*   **`brew install <formula>`**: 安装指定的 Formula。
    ```bash
    brew install git         # 安装 Git
    brew install nginx       # 安装 Nginx
    brew install python@3.10 # 安装特定版本的 Python
    ```
*   **`brew install --build-from-source <formula>`**: 从源代码编译安装（通常不推荐，除非需要特定配置或调试）。
*   **`brew install --force-bottle <formula>`**: 强制使用预编译的瓶子（bottle）而不是从源代码编译（即使有更新的源代码可用）。

#### 3.1.3 查看软件信息

*   **`brew info <formula>`**: 显示指定 Formula 的详细信息，包括版本、安装路径、依赖、官网、文件大小等。
    ```bash
    brew info git
    ```
*   **`brew list`**: 列出所有已安装的 Formula。
    ```bash
    brew list
    ```
*   **`brew list <formula>`**: 列出指定 Formula 安装的文件。
    ```bash
    brew list git
    ```
*   **`brew deps <formula>`**: 列出指定 Formula 的依赖项。
    ```bash
    brew deps htop
    ```
*   **`brew uses <formula>`**: 列出哪些 Formula 依赖于指定的 Formula。
    ```bash
    brew uses openssl
    ```

#### 3.1.4 更新和升级软件

*   **`brew update`**: 更新 Homebrew 自身及其所有 Formulae 定义（即更新 Homebrew 的 Git 仓库），但不会升级已安装的软件。这是同步本地配方列表到最新版本的操作。
    ```bash
    brew update
    ```
*   **`brew upgrade`**: 升级所有已安装但有新版本的 Formulae。
    ```bash
    brew upgrade
    ```
*   **`brew upgrade <formula>`**: 升级指定的 Formula 到最新版本。
    ```bash
    brew upgrade python
    ```

#### 3.1.5 卸载软件

*   **`brew uninstall <formula>`**: 卸载指定的 Formula。
    ```bash
    brew uninstall git
    ```
*   **`brew uninstall --ignore-dependencies <formula>`**: 强制卸载指定 Formula，即使有其他软件依赖它。

#### 3.1.6 清理和维护

*   **`brew cleanup`**: 清理旧版本的 Formulae 和下载的安装包（bottles）。Homebrew 默认会保留每个软件的最新两个版本。
    ```bash
    brew cleanup
    ```
*   **`brew cleanup <formula>`**: 清理指定 Formula 的旧版本。
*   **`brew doctor`**: 诊断 Homebrew 安装中可能存在的问题并给出建议。
    ```bash
    brew doctor
    ```
*   **`brew prune`**: 移除 `/usr/local` 中不再被任何 Formula 引用的符号链接。

#### 3.1.7 链接和取消链接软件

Homebrew 会将软件的可执行文件符号链接到 `/usr/local/bin`。

*   **`brew link <formula>`**: 将指定 Formula 的文件符号链接到 Homebrew 的前缀目录 (通常是 `/usr/local`)。通常在 `brew install` 后会自动执行。
    ```bash
    brew link nginx
    ```
*   **`brew unlink <formula>`**: 移除指定 Formula 的符号链接。当需要安装某个软件的多个版本并切换时非常有用。
    ```bash
    brew unlink nginx
    ```

### 3.2 Cask (图形界面应用) 相关指令

Cask 指令通常与 Formulae 指令相似，但在 `install`, `uninstall`, `list`, `info` 等指令前加上 `--cask` 或 `cask` 关键字。

*   **`brew install --cask <cask>`**: 安装指定的 Cask (通常是 `.app` 应用)。
    ```bash
    brew install --cask google-chrome
    brew install --cask visual-studio-code
    ```
*   **`brew uninstall --cask <cask>`**: 卸载指定的 Cask。
    ```bash
    brew uninstall --cask google-chrome
    ```
*   **`brew list --cask`**: 列出所有已安装的 Cask。
    ```bash
    brew list --cask
    ```
*   **`brew info --cask <cask>`**: 显示指定 Cask 的详细信息。
    ```bash
    brew info --cask docker
    ```
*   **`brew search --cask <text>`**: 搜索 Cask。
    ```bash
    brew search --cask docker
    ```
*   **`brew upgrade --cask`**: 升级所有已安装的 Cask。
    ```bash
    brew upgrade --cask
    ```
*   **`brew autoremove --cask`**: 卸载 Cask 的依赖项 (如果这些依赖不再被其他 Cask 或 Formulae 需要)。

### 3.3 仓库 (Tap) 相关指令

Homebrew 的 Formulae 和 Cask 都存储在 Git 仓库中。核心仓库是 `homebrew/core` 和 `homebrew/cask`。用户也可以管理第三方的仓库，这些仓库被称为 `tap`。

*   **`brew tap <user/repo>`**: 添加一个第三方仓库。
    ```bash
    brew tap homebrew/cask-versions # 添加 Homebrew 提供的旧版本 Cask 仓库
    brew tap adoptopenjdk/openjdk    # 添加 OpenJDK 社区提供的 Formulae
    ```
*   **`brew untap <user/repo>`**: 移除一个第三方仓库。
    ```bash
    brew untap adoptopenjdk/openjdk
    ```
*   **`brew tap`**: 列出所有已添加的仓库。

### 3.4 Homebrew 的全局指令

*   **`brew help`**: 显示所有可用指令。
*   **`brew --version`**: 显示 Homebrew 版本信息。
*   **`brew home <formula>`**: 在浏览器中打开指定 Formula 的主页。

## 四、Homebrew 的目录结构 (Apple Silicon/M1/M2/M3)

在基于 Intel 芯片的 macOS 上，Homebrew 默认安装在 `/usr/local` 目录下。
在 Apple Silicon (M1/M2/M3) 芯片的 macOS 上，Homebrew 默认安装在 `/opt/homebrew` 目录下。

无论哪种架构，其核心目录结构相似：

*   **`$(brew --prefix)`** (通常是 `/usr/local` 或 `/opt/homebrew`)：Homebrew 的主目录。
    *   **`bin`**: Homebrew 安装的软件的可执行文件符号链接都在这里。这个目录应该在你的 `$PATH` 变量中。
    *   **`Cellar`**: 所有 Formulae 实际安装的地方，每个版本都有独立的目录。
        ```
        /usr/local/Cellar/
        ├── git/
        │   └── 2.42.0/
        ├── nginx/
        │   └── 1.25.1/
        └── python@3.10/
            └── 3.10.13/
        ```
    *   **`Caskroom`**: 所有 Cask 应用实际安装的地方。
        ```
        /usr/local/Caskroom/
        ├── google-chrome/
        │   └── 119.0.6045.199/
        └── visual-studio-code/
            └── 1.84.2/
        ```
    *   **`etc`**: 配置文件，例如 Nginx 的配置文件会放在 `/usr/local/etc/nginx`。
    *   **`share`**: 共享数据，例如 man page (手册页) 会放在 `/usr/local/share/man`。
    *   **`var`**: 变量文件，例如日志、数据库等。
    *   **`Library/Taps`**: 存储所有已添加的 `tap` 仓库的 Formulae 和 Cask 定义。
        ```
        # 例如：homebrew/core 仓库
        /usr/local/Homebrew/Library/Taps/homebrew/homebrew-core/Formula/
        # 例如：homebrew/cask 仓库
        /usr/local/Homebrew/Library/Taps/homebrew/homebrew-cask/Casks/
        ```

## 五、为什么选择 Homebrew？

*   **简单易用**：基于命令行的简洁接口使得软件安装、更新、卸载变得非常容易。
*   **无入侵性**：将软件安装在单独的 Cellar 目录中，并通过符号链接暴露，避免污染系统目录。
*   **灵活**：支持安装特定版本、从源码编译、管理第三方仓库。
*   **Cask 支持**：同时管理命令行工具和图形界面应用。
*   **社区强大**：庞大的 Formulae 库和活跃的社区支持。
*   **版本控制**：Formulae 通过 Git 管理，可以方便地查看更改、恢复旧版本。
*   **跨平台**：现在也支持 Linux。

## 六、总结

Homebrew 是 macOS 和 Linux 上不可或缺的开发者工具。它通过一套直观的命令行指令，将软件的安装、更新和管理过程标准化并简化。无论是安装 `nginx`、`git` 等命令行工具，还是 `Visual Studio Code`、`Docker` 等图形界面应用，Homebrew 都能提供一致且高效的体验。掌握 Homebrew 的常用指令，是每一个 Mac 或 Linux 开发者提升工作效率的必经之路。通过避免 `unload` 等事件并合理利用 `pagehide` 等事件，你可以在享受 Homebrew 带来的便利的同时，确保你的应用程序仍能充分利用浏览器提供的优化机制，如 BFCache。
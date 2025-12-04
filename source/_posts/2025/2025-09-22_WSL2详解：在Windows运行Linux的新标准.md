---
title: WSL2详解：在Windows运行Linux的新标准
date: 2025-09-22 06:24:00
tags:
  - 2025
  - WSL2
  - Linux
  - Windows
  - Hyper-V
  - 虚拟机
categories:
  - 开发工具
  - 虚拟机
---

> **WSL 2 (适用于 Linux 的 Windows 子系统 2 - Windows Subsystem for Linux 2)** 是微软推出的一项技术，它允许开发者在 Windows 操作系统上直接运行原生 Linux 环境，而无需双启动或传统虚拟机。WSL 2 相较于其前身 WSL 1，最大的变化是它运行在一个轻量级的虚拟机中，其中包含一个完整的 Linux 内核，这极大地提升了文件系统性能、系统调用兼容性和 Docker Desktop 的体验。

{% note info %}
核心思想：**在 Windows 内部无缝集成一个高性能、高度兼容的原生 Linux 环境，兼顾 Windows 的图形界面和 Linux 的命令行工具优势。**
{% endnote %}
------

## 一、为什么需要 WSL 2？

传统的 Linux 开发环境设置通常涉及以下几种方式：

1.  **双系统**：需要重启电脑才能切换操作系统，且占用硬盘空间大。
2.  **虚拟机 (VirtualBox, VMWare)**：性能开销大，与 Windows 系统的集成度不高，共享文件、剪贴板等操作相对繁琐。
3.  **WSL 1**：提供了一个兼容层，将 Linux 系统调用转换为 Windows NT 内核调用。性能优于虚拟机，但文件系统性能（尤其是涉及到大量文件操作）和系统调用兼容性仍有局限性。

WSL 2 通过引入真实的 Linux 内核，旨在解决这些痛点，提供以下核心优势：

*   **完全的系统调用兼容性**：由于运行的是真实的 Linux 内核，几乎所有的 Linux 应用程序都可以运行，包括 Docker、Kubernetes 以及其他需要完整内核访问权限的工具。
*   **卓越的文件系统性能**：在 Linux 文件系统内部操作文件时，性能与原生 Linux 几乎无异，尤其是在进行 `git clone`、`npm install`、`apt update` 等操作时感受明显。
*   **性能提升**：整体性能优于 WSL 1 和传统虚拟机，启动速度快，资源占用低。
*   **与 Windows 进程高度集成**：无需配置网络，Windows 和 WSL 之间可以直接通过 `localhost` 访问服务，并且可以直接在 Windows 文件管理器中访问 Linux 文件系统。
*   **Docker Desktop 增强**：Docker Desktop for Windows 可以直接使用 WSL 2 作为后端，极大地提升了其性能和稳定性。

## 二、WSL 2 的架构与工作原理

WSL 2 运行在轻量级的实用程序虚拟机中，它利用了 Windows 的 Hyper-V (虚拟化) 技术。与传统 Hyper-V 虚拟机不同的是，WSL 2 拥有更低的资源占用和更快的启动速度。

{% mermaid %}
graph TD
    A[用户] --> B[Windows 应用程序]
    A[用户] --> C["WSL 2 (Linux 终端)"]

    B --> D[Windows 内核]
    D -- Hyper-V 虚拟化技术 --> E[轻量级 Utility VM]
    C --> E

    E --> F[Linux 内核]
    F --> G["Linux 发行版 (Ubuntu, Debian等)"]
    F --- H[Docker Desktop 集成]
    H --> G
{% endmermaid %}

**关键组件：**

*   **轻量级 Utility VM**：这是一个高度优化的 Hyper-V 虚拟机，专门为运行 WSL 2 实例而设计。它只占用所需的资源，并在不需要时自动释放内存。
*   **真实的 Linux 内核**：微软基于最新的稳定版 Linux 内核进行了优化和定制，使其能够运行在 Utility VM 中。这个内核提供了完整的系统调用支持。
*   **文件系统集成**：WSL 2 将 Linux 文件系统作为一个 VHD (Virtual Hard Disk) 文件存储在 Windows 文件系统上。Windows 提供了网络共享的方式，允许用户通过 `\\wsl$\<DistroName>` 路径直接访问 Linux 文件系统。
*   **网络桥接**：WSL 2 虚拟机拥有自己的 IP 地址，并通过网络地址转换 (NAT) 与 Windows 主机进行通信。同时，Windows 通过一些后台服务将 WSL 2 的端口转发到 `localhost`，实现了两者间的无缝通信。

## 三、WSL 2 的安装与设置

### 3.1 环境要求

*   **Windows 版本**：Windows 10 版本 1903 或更高，或 Windows 11。
*   **启用虚拟化**：BIOS/UEFI 中需要启用虚拟化功能 (如 Intel VT-x, AMD-V)。
*   **WSL 功能**：需要启用“适用于 Linux 的 Windows 子系统”和“虚拟机平台”组件。

### 3.2 命令行简化安装 (Windows 11 或更高版本，以及部分 Windows 10 更新)

对于大多数用户，可以通过一个命令进行简化安装：

```bash
wsl --install
```

此命令将：
1.  启用所需的 WSL 和虚拟机平台组件。
2.  下载并安装最新的 Linux 内核。
3.  安装 Ubuntu 作为默认的 Linux 发行版。

### 3.3 手动安装步骤 (适用于 Windows 10 旧版本或自定义安装)

1.  **启用 WSL 和虚拟机平台组件：**
    以管理员身份打开 PowerShell 或命令提示符，执行以下命令：
    ```powershell
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
    ```
    然后重启电脑。

2.  **下载并安装 Linux 内核更新包：**
    访问 WSL 的官方安装指南 [<sup>1</sup>](https://learn.microsoft.com/zh-cn/windows/wsl/install-manual) 下载 "WSL2 Linux 内核更新包"。安装该 `.msi` 包。

3.  **将 WSL 2 设置为默认版本：**
    打开 PowerShell，执行：
    ```powershell
    wsl --set-default-version 2
    ```
    如果遇到错误，请确保已安装内核更新包。

4.  **安装 Linux 发行版：**
    从 Microsoft Store 搜索并下载你喜欢的 Linux 发行版 (如 Ubuntu, Debian, Kali Linux)。
    首次启动发行版时，会提示你创建用户名和密码。

5.  **将已安装的 WSL 1 发行版升级到 WSL 2 (如果之前有 WSL 1)：**
    首先，查看你的发行版列表：
    ```bash
    wsl -l -v
    ```
    然后，将指定发行版升级到 WSL 2：
    ```bash
    wsl --set-version <DistroName> 2
    ```
    例如：
    ```bash
    wsl --set-version Ubuntu 2
    ```

## 四、WSL 2 常用指令详解

以下是 WSL 2 的一些关键命令行指令，用于管理和操作你的 Linux 发行版。

### 4.1 管理 WSL 发行版

*   **列出已安装的发行版及其状态：**
    ```bash
    wsl -l -v  # 或 wsl --list --verbose
    ```
    *   `NAME`：发行版名称。
    *   `STATE`：发行版状态 (如 Running, Stopped)。
    *   `VERSION`：WSL 版本 (1 或 2)。

    **示例输出：**
    ```
      NAME            STATE           VERSION
    * Ubuntu          Running         2
      Debian          Stopped         2
    ```

*   **设置默认 WSL 版本 (1 或 2)：**
    ```bash
    wsl --set-default-version <VersionNumber>
    ```
    这会影响未来新安装的发行版的默认版本。

*   **设置指定发行版的版本：**
    ```bash
    wsl --set-version <DistroName> <VersionNumber>
    ```
    例如，将 Ubuntu 切换到 WSL 1：
    ```bash
    wsl --set-version Ubuntu 1
    ```

*   **将指定发行版设置为默认发行版：**
    ```bash
    wsl --set-default <DistroName>
    ```
    每次运行 `wsl` 命令，启动的将是这个默认发行版。

*   **终止指定发行版：**
    ```bash
    wsl --terminate <DistroName>  # 或 wsl -t <DistroName>
    ```
    这会强制停止正在运行的发行版。

*   **关停所有运行的发行版和 WSL 2 VM：**
    ```bash
    wsl --shutdown
    ```
    这会释放 WSL 2 占用的所有内存资源。

*   **注销/卸载发行版：**
    ```bash
    wsl --unregister <DistroName>
    ```
    警告：这将删除该发行版的所有数据和文件！

*   **修改 WSL 2 虚拟硬盘大小 (或移动)：**
    WSL 2 的虚拟硬盘通常随着使用而增长，但不会自动收缩。你可以手动收缩。
    1.  首先，关停所有 WSL 2 实例：`wsl --shutdown`。
    2.  找到 VHD 文件路径。你可以在 Windows 资源管理器中输入 `\\wsl$\`，然后进入你的发行版，搜索 `.vhdx` 文件。通常在 `%LOCALAPPDATA%\Packages\<DistroPackageName>\LocalState\ext4.vhdx`。
    3.  打开 PowerShell 管理员模式，使用磁盘管理工具 (Diskpart)。
        ```powershell
        diskpart
        select vdisk file="<PathToYourVHDXFile>" # 替换为你的vhd文件路径
        attach vdisk readonly
        compact vdisk
        detach vdisk
        exit
        ```

### 4.2 访问 WSL 文件系统

*   **从 Windows 访问 Linux 文件系统：**
    在 Windows 文件资源管理器中，你可以在地址栏输入 `\\wsl$`，然后会看到所有已安装的 WSL 发行版。点击进入即可像普通网络共享一样访问 Linux 文件。
    或者直接在 PowerShell 或 CMD 中：
    ```bash
    explorer.exe \\wsl$\Ubuntu\home\<YourUserName>
    ```

*   **从 Linux 访问 Windows 文件系统：**
    Windows 驱动器被自动挂载到 `/mnt` 目录下。
    例如，Windows 的 C 盘在 Linux 中是 `/mnt/c`。
    ```bash
    cd /mnt/c/Users/<YourWindowsUserName>/Documents
    ```

### 4.3 启动和执行命令

*   **启动默认 WSL 发行版：**
    直接在命令提示符或 PowerShell 中输入 `wsl`，会启动默认的 Linux 发行版。

*   **启动指定的 WSL 发行版：**
    ```bash
    wsl -d <DistroName>
    ```
    例如：
    ```bash
    wsl -d Debian
    ```

*   **在 WSL 发行版中执行命令：**
    ```bash
    wsl <command>
    ```
    例如：
    ```bash
    wsl ls -l /
    wsl apt update
    ```
    你也可以针对特定发行版执行命令：
    ```bash
    wsl -d Ubuntu apt install gcc
    ```

*   **在 Windows 上执行 Linux 命令：**
    反之亦然，你可以在 Linux 终端中运行 Windows 命令。
    ```bash
    # 在 Linux 终端中运行 Windows powershell 命令
    powershell.exe Get-Service
    # 在 Linux 终端中运行 Windows notepad
    notepad.exe
    ```

### 4.4 网络配置

WSL 2 默认使用 NAT 网络模式，这意味着它有一个独立的 IP 地址，并且通过端口转发与 Windows 主机通信。

*   **在 Windows 访问 WSL 2 服务：**
    如果你的 WSL 2 中运行了一个服务 (例如 Web 服务器在 8000 端口)，你可以直接在 Windows 浏览器中访问 `http://localhost:8000`。
    WSL 2 会自动进行端口转发。

*   **在 WSL 2 中访问 Windows 服务：**
    Windows 主机的 IP 地址通常可以通过 `cat /etc/resolv.conf` 查看到 `nameserver` 的 IP，这就是你的 Windows 主机 IP。
    例如，如果 Windows 上运行的服务在 `192.168.1.100:8080`，那么在 WSL 中访问 `http://192.168.1.100:8080` 即可。

*   **固定 WSL 2 IP (高级)：**
    由于 WSL 2 的 IP 地址会动态变化，这可能对一些高级网络配置造成不便。可以通过修改 `.wslconfig` 文件来固定 IP 地址 (但建议仅在确实需要时进行，因为这会增加维护成本)。

    创建一个 `%UserProfile%\.wslconfig` 文件 (如果不存在)，其内容示例如下：
    ```ini
    [wsl2]
    # 固定 IP 地址 (仅示例，需要替换为你希望的子网和IP)
    # virtualSwitch = wsl
    # defaultIp = 192.168.50.10
    # defaultGateway = 192.168.50.1
    # dhcp = false

    # 限制 WSL 2 分配的内存和处理器核心数
    memory=4GB
    processors=2
    # 禁用自动挂载所有 Windows 驱动器
    # automount.enabled=false
    ```

### 4.5 与 Visual Studio Code 集成

Visual Studio Code 对 WSL 2 提供了原生支持，这是 WSL 2 最强大的功能之一。

1.  **安装 Remote - WSL 扩展：**
    在 VS Code 中安装 "Remote - WSL" 扩展。

2.  **在 WSL 中打开项目：**
    *   在 WSL 终端中，导航到你的项目目录，然后输入 `code .`。
    *   在 VS Code 中，点击左下角的绿色“远程指示器”，然后选择 "Connect to WSL"。
    *   在 VS Code 中，使用 "File" -> "Open Folder"，然后在弹出的对话框中选择 WSL 文件夹。

    VS Code 会在 WSL 中安装一个服务器，所有开发工作都在 Linux 环境中进行，但你依然使用 Windows 的 VS Code 界面。

## 五、WSL 2 的优缺点与适用场景

### 5.1 优点：

1.  **原生 Linux 内核**：完整系统调用兼容性，几乎所有 Linux 应用和工具都能运行。
2.  **高性能**：文件系统性能大幅提升，尤其是涉及大量文件操作的场景。
3.  **与 Windows 无缝集成**：文件访问、网络互通、VS Code 远程开发体验极佳。
4.  **Docker Desktop 完美后端**：显著提升 Docker 在 Windows 上的性能和稳定性。
5.  **资源效率高**：轻量级虚拟机，启动快，资源占用少。

### 5.2 缺点：

1.  **占用磁盘空间**：每个发行版都是一个 `.vhdx` 文件，会随使用增长，需要手动收缩。
2.  **图形界面支持有限**：虽然可以通过 X server 运行简单的 Linux GUI 应用，但体验不如原生桌面。
3.  **网络配置复杂性 (特定情况)**：默认 NAT 模式对某些高级网络配置（如需要固定 IP、内网穿透）可能带来挑战。
4.  **初始设置略复杂 (旧版本 Windows)**：对于没有 `wsl --install` 命令的旧版 Windows 10，需要手动安装步骤。

### 5.3 适用场景：

*   **Web 开发**：前端或后端 (Node.js, Python, Go, Ruby 等) 开发者，无需在 Windows 上搭建复杂的环境，直接使用 Linux 的包管理器和工具链。
*   **容器化开发 (Docker, Kubernetes)**：Docker Desktop for Windows 配合 WSL 2 提供了近乎原生的容器体验。
*   **跨平台开发**：在 Windows 上进行 Linux 环境下的 C/C++、Java 等开发。
*   **学习 Linux**：想在不完全脱离 Windows 的情况下学习和使用 Linux 命令和工具。
*   **脚本和自动化**：运行各种 Linux Shell 脚本。

## 六、总结

WSL 2 是微软在 Windows 与 Linux 融合方面迈出的重要一步，它为 Windows 开发者提供了一个强大、高性能且与 Windows 系统深度集成的 Linux 开发环境。无论是 Web 开发、容器化、系统编程还是仅仅想学习 Linux，WSL 2 都提供了一个无与伦比的体验。掌握其常用指令，将能让你更高效地利用这一强大工具，极大地提升你的开发效率和便利性。
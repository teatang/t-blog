---
title: PowerShell 详解与使用技巧
date: 2025-08-20 06:24:00
tags:
  - 2025
  - Windows
categories:
  - 开发工具
  - Windows
---

> **PowerShell** 是微软开发的一种**命令行 shell 和脚本语言**，专为系统管理和自动化设计。它基于 .NET Framework (Windows PowerShell) 或 .NET Core (PowerShell Core / PowerShell 7+)，提供了比传统命令行工具（如 CMD 或 Bash）更强大、更统一且面向对象的管理体验。PowerShell 不仅限于 Windows 平台，现在已**跨平台支持 Linux 和 macOS**。

{% note info %}
核心思想：**“一切皆对象”**。PowerShell 不像传统 shell 那样处理文本流，而是处理 .NET 对象。这意味着命令的输出可以直接作为另一个命令的输入，且数据类型和结构得以保留，极大地提升了脚本编写的效率和健壮性。
{% endnote %}
------

## 一、PowerShell 的起源与演进

传统的 Windows 命令行工具（CMD）在自动化和复杂任务处理方面存在显著局限性，其主要问题是基于文本处理，使得数据解析和传递变得复杂且易出错。为了解决这些问题，微软开发了 PowerShell（最初名为 Monad），并于 2006 年发布。

### 1.1 Windows PowerShell (旧版)

*   **基于 .NET Framework**：与 Windows 操作系统紧密集成，通常预装在 Windows 系统中。
*   **版本**：从 1.0 到 5.1。Windows PowerShell 5.1 是最新且最后一个基于 .NET Framework 的版本，仍然广泛用于传统 Windows 环境。

### 1.2 PowerShell Core / PowerShell 7+ (新版，推荐)

*   **基于 .NET Core / .NET**：实现了跨平台特性，支持 Windows、Linux 和 macOS。
*   **开源**：PowerShell Core 是一个开源项目，积极迭代更新。
*   **版本**：从 6.0 (PowerShell Core) 到当前的 PowerShell 7.x 系列。
*   **优势**：
    *   **跨平台**：统一了多操作系统下的管理体验。
    *   **性能提升**：得益于 .NET Core 的优化。
    *   **新特性**：持续引入新的 cmdlet 和语言功能。

本文后续将主要关注 PowerShell 7+ 及其核心概念。

## 二、为什么选择 PowerShell？

与传统的命令行工具和脚本语言相比，PowerShell 具有显著优势：

1.  **面向对象**：这是 PowerShell 最核心的特性。命令输出的是对象，而不是纯文本。这意味着你可以直接访问对象的属性和方法，而无需进行复杂的文本解析。
    *   **示例 (传统 CMD)**：
        ```cmd
        dir | findstr "txt"
        ```
        输出是文本，你需要用 `findstr` 等工具进行字符串匹配。
    *   **示例 (PowerShell)**：
        ```powershell
        Get-ChildItem | Where-Object {$_.Extension -eq ".txt"}
        ```
        `Get-ChildItem` 输出的是文件和文件夹对象，你可以通过 `Where-Object` 直接筛选 `Extension` 属性。
2.  **强大的管道 (Pipeline)**：利用管道 `|`，一个命令的输出对象可以无缝传递给下一个命令作为输入，实现复杂任务的链式处理。
3.  **统一的管理接口**：通过 PowerShell 的“提供程序 (Providers)”机制，你可以像操作文件系统一样操作注册表、证书存储、环境变量、活动目录等，极大地简化了系统管理。
4.  **丰富的命令集 (Cmdlets)**：PowerShell 提供了数千个预定义的 cmdlet，覆盖了文件系统、进程管理、网络、服务、事件日志等几乎所有系统管理领域。
5.  **易学易用**：遵循 `Verb-Noun` 的命名约定，使得 cmdlet 名称直观易懂（如 `Get-Process`、`Set-Service`）。内置的帮助系统也非常完善。
6.  **强大的脚本能力**：支持变量、循环、条件判断、函数、模块等高级编程特性，可以编写复杂的自动化脚本。
7.  **远程管理**：内置强大的远程执行能力，可以方便地管理远程 Windows、Linux 服务器。

## 三、PowerShell 核心概念详解

### 3.1 Cmdlet (Command-let)

**定义**：Cmdlet 是 PowerShell 命令行中的基本命令单元。它们通常由 C# 编写，并编译成 .NET 类。Cmdlet 的设计目标是执行单一、特定任务。

**命名约定**：所有 cmdlet 都遵循 `Verb-Noun` 的命名约定，例如：
*   `Get-Process`：获取正在运行的进程。
*   `Set-Service`：配置服务。
*   `New-Item`：创建新项（文件、文件夹、注册表项等）。
*   `Remove-Item`：删除项。

这种命名方式使得命令更具可预测性，用户可以很容易地猜测命令的功能。

### 3.2 对象 (Objects)

**定义**：在 PowerShell 中，命令的输出不是简单的文本字符串，而是结构化的 **.NET 对象**。每个对象都包含属性（Properties）和方法（Methods）。

**优势**：
*   **数据结构完整**：输出数据保留了其原始的数据类型和结构，避免了文本解析的麻烦。
*   **易于操作**：可以直接访问和操作对象的属性，进行筛选、排序和选择。

**示例**：
```powershell
Get-Process | Get-Member -MemberType Property
```
`Get-Process` 命令会返回一系列 `System.Diagnostics.Process` 对象，每个对象都代表一个运行中的进程，包含诸如 `ProcessName`、`Id`、`CPU` 等属性。`Get-Member` 命令可以显示对象的属性和方法。

### 3.3 管道 (Pipeline)

**定义**：管道是 PowerShell 中连接命令的核心机制，使用 `|` 符号表示。它允许一个 cmdlet 的输出对象直接作为下一个 cmdlet 的输入对象。

**工作原理**：
1.  第一个命令执行并生成对象。
2.  这些对象通过管道传递给第二个命令。
3.  第二个命令接收这些对象作为输入，并对其进行处理，然后将处理结果（可能是新的对象或修改后的原对象）传递给下一个命令。

**示例**：
查找所有 CPU 使用率超过 50% 的进程，并按 CPU 使用率降序排列，然后只显示进程名和 ID：
```powershell
Get-Process |                 # 获取所有进程对象
Where-Object {$_.CPU -gt 50} | # 筛选 CPU 属性大于 50 的进程
Sort-Object -Property CPU -Descending | # 按 CPU 属性降序排序
Select-Object -Property ProcessName,Id   # 选择并只显示 ProcessName 和 Id 属性
```

**管道流程图示**：
{% mermaid %}
graph TD
    A[Get-Process] --> B["Where-Object {$_.CPU -gt 50}"]
    B --> C[Sort-Object -Property CPU -Descending]
    C --> D[Select-Object -Property ProcessName,Id]
{% endmermaid %}

### 3.4 提供程序 (Providers)

**定义**：PowerShell 提供程序允许你以统一的方式（如同文件系统路径一样）访问和管理不同类型的数据存储。

**常见提供程序**：
*   `FileSystem`：访问文件和目录。
*   `Registry`：访问 Windows 注册表。
*   `Alias`：访问 PowerShell 别名。
*   `Variable`：访问 PowerShell 变量。
*   `Certificate`：访问证书存储。
*   `Environment`：访问环境变量。

**示例**：
*   查看注册表 `HKLM:\SOFTWARE` 下的内容：
    ```powershell
    Get-ChildItem HKLM:\SOFTWARE
    ```
*   进入环境变量路径，查看所有环境变量：
    ```powershell
    Set-Location Env:
    Get-ChildItem
    ```

### 3.5 模块 (Modules)

**定义**：模块是组织和分发 PowerShell 代码的方式。它们包含 cmdlet、函数、变量和其他资源，可以导入到 PowerShell 会话中以扩展功能。

**常见操作**：
*   `Get-Module`：列出当前会话中已加载或可用的模块。
*   `Import-Module`：导入特定模块。
*   `Remove-Module`：移除模块。

**示例**：
```powershell
Get-Module -ListAvailable # 列出所有可用的模块
Import-Module -Name Az.Accounts # 导入 Azure PowerShell 模块的一个组件
```

## 四、PowerShell 基本使用与常见 Cmdlet

### 4.1 获取帮助

*   **`Get-Help <CmdletName>`**：获取指定 cmdlet 的详细帮助信息。
*   **`Get-Help <CmdletName> -Full`**：获取完整帮助，包括参数、示例和相关链接。
*   **`Get-Help <CmdletName> -Examples`**：只显示示例。
*   **`Update-Help`**：首次使用时，更新本地的帮助文件，以获取最新帮助文档。

### 4.2 文件和目录管理

*   **`Get-ChildItem` (别名 `ls`, `dir`)**：获取文件和文件夹。
    ```powershell
    Get-ChildItem -Path C:\Users\YourUser -File -Recurse -Filter "*.log"
    ```
*   **`New-Item`**：创建文件或文件夹。
    ```powershell
    New-Item -Path C:\Temp\MyFolder -ItemType Directory
    New-Item -Path C:\Temp\MyFile.txt -ItemType File -Value "Hello, PowerShell!"
    ```
*   **`Remove-Item` (别名 `del`, `rm`)**：删除文件或文件夹。
    ```powershell
    Remove-Item -Path C:\Temp\MyFile.txt
    Remove-Item -Path C:\Temp\MyFolder -Recurse -Force # 强制递归删除文件夹及其内容
    ```
*   **`Move-Item` (别名 `mv`)**：移动文件或文件夹。
    ```powershell
    Move-Item -Path C:\Temp\MyFile.txt -Destination C:\NewLocation\
    ```
*   **`Copy-Item` (别名 `cp`)**：复制文件或文件夹。
    ```powershell
    Copy-Item -Path C:\Temp\MyFile.txt -Destination C:\Backup\
    ```
*   **`Get-Content` (别名 `cat`, `type`)**：获取文件内容。
    ```powershell
    Get-Content -Path C:\Temp\MyFile.txt
    ```
*   **`Set-Content`**：设置或覆盖文件内容。
    ```powershell
    Set-Content -Path C:\Temp\MyFile.txt -Value "New content."
    ```
*   **`Add-Content`**：向文件追加内容。
    ```powershell
    Add-Content -Path C:\Temp\MyFile.txt -Value "`nAppended line." # `n 是换行符
    ```

### 4.3 进程和服务管理

*   **`Get-Process` (别名 `ps`)**：获取正在运行的进程。
    ```powershell
    Get-Process -Name chrome,firefox | Select-Object -Property Id,ProcessName,CPU,WorkingSet
    ```
*   **`Stop-Process`**：停止进程。
    ```powershell
    Stop-Process -Name "notepad"
    Stop-Process -Id 1234 -Force # 强制停止
    ```
*   **`Get-Service`**：获取服务信息。
    ```powershell
    Get-Service -Name wuauserv | Select-Object -Property Name,Status,DisplayName
    ```
*   **`Start-Service`**：启动服务。
    ```powersawahell
    Start-Service -Name wuauserv
    ```
*   **`Stop-Service`**：停止服务。
    ```powershell
    Stop-Service -Name wuauserv
    ```
*   **`Restart-Service`**：重启服务。
    ```powershell
    Restart-Service -Name wuauserv
    ```

### 4.4 数据筛选、排序与格式化

*   **`Where-Object` (别名 `where`)**：筛选对象。
    ```powershell
    Get-Process | Where-Object {$_.CPU -gt 50 -and $_.ProcessName -notlike "Idle"}
    ```
    *   `$_` 代表当前管道中的对象。
    *   `-eq` 等于, `-ne` 不等于, `-gt` 大于, `-ge` 大于等于, `-lt` 小于, `-le` 小于等于
    *   `-like` 字符串模式匹配 (通配符 `*`)
    *   `-notlike` 非模式匹配
    *   `-match` 正则表达式匹配
    *   `-notmatch` 非正则表达式匹配
    *   `-contains` 集合包含
    *   `-notcontains` 集合不包含
    *   `-in` 在集合中
    *   `-notin` 不在集合中
*   **`Sort-Object` (别名 `sort`)**：对对象进行排序。
    ```powershell
    Get-Service | Sort-Object -Property Status,Name -Descending
    ```
*   **`Select-Object` (别名 `select`)**：选择对象的特定属性。
    ```powershell
    Get-EventLog -LogName System -Newest 10 | Select-Object -Property TimeGenerated,Source,Message
    ```
*   **`Format-Table` (别名 `ft`)**：将对象格式化为表格。
    ```powershell
    Get-Process | Select-Object -First 5 | Format-Table -AutoSize
    ```
*   **`Format-List` (别名 `fl`)**：将对象格式化为列表，显示所有属性。
    ```powershell
    Get-Process -Name "powershell" | Format-List -Property *
    ```
*   **`ConvertTo-Json` / `ConvertFrom-Json`**：转换为 JSON / 从 JSON 转换。
*   **`ConvertTo-Csv` / `Import-Csv` / `Export-Csv`**：处理 CSV 文件。

## 五、PowerShell 脚本编程

PowerShell 是一种功能齐全的脚本语言，支持变量、控制流、函数等。

### 5.1 变量

*   使用 `$` 符号定义变量。
    ```powershell
    $myString = "Hello, World!"
    $myNumber = 123
    $myArray = @("apple", "banana", "cherry")
    $myHash = @{"Name" = "Alice"; "Age" = 30}
    ```

### 5.2 条件语句 (`If-ElseIf-Else`)

```powershell
$score = 85
if ($score -ge 90) {
    Write-Host "A"
} elseif ($score -ge 80) {
    Write-Host "B"
} else {
    Write-Host "C"
}
```

### 5.3 循环语句

*   **`ForEach` 循环**：
    ```powershell
    $numbers = @(10, 20, 30)
    foreach ($num in $numbers) {
        Write-Host "Number is: $num"
    }

    # 管道中的 ForEach-Object (别名 %)
    1..5 | ForEach-Object {
        "Processing $_" # $_ 代表当前管道中的元素
    }
    ```
*   **`For` 循环**：
    ```powershell
    for ($i = 0; $i -lt 5; $i++) {
        Write-Host "Iteration: $i"
    }
    ```
*   **`While` 循环**：
    ```powershell
    $count = 0
    while ($count -lt 3) {
        Write-Host "Count: $count"
        $count++
    }
    ```

### 5.4 函数

```powershell
function Get-MyCurrentPath {
    param (
        [string]$Path = (Get-Location).Path # 定义一个带默认值的参数
    )
    Write-Host "Current path is: $Path"
    return $Path # 函数可以返回值
}

Get-MyCurrentPath
Get-MyCurrentPath -Path "C:\Windows"
```

### 5.5 错误处理 (`Try-Catch-Finally`)

```powershell
try {
    # 尝试执行可能出错的代码
    Get-Item -Path "NonExistentFile.txt" -ErrorAction Stop # ErrorAction Stop 会将错误转换为终止错误
    Write-Host "This line will not execute if an error occurs."
} catch {
    # 捕获并处理错误
    Write-Host "An error occurred: $($_.Exception.Message)"
} finally {
    # 无论是否发生错误，都会执行的代码
    Write-Host "Error handling block finished."
}
```

### 5.6 PowerShell 脚本示例

以下是一个简单的 PowerShell 脚本，用于获取并显示系统中所有正在运行的服务，并按名称排序，然后将状态为“正在运行”的服务写入日志文件。

`Get-RunningServices.ps1`
```powershell
# 定义日志文件路径
$logFilePath = "C:\Temp\RunningServices.log"

# 确保日志目录存在
if (-not (Test-Path (Split-Path $logFilePath))) {
    New-Item -ItemType Directory -Path (Split-Path $logFilePath) | Out-Null
}

# 获取所有服务，筛选出正在运行的服务，按名称排序
$runningServices = Get-Service |
                   Where-Object {$_.Status -eq "Running"} |
                   Sort-Object -Property Name |
                   Select-Object -Property Name,DisplayName,Status,StartType

# 输出到控制台
Write-Host "--- 正在运行的服务清单 ---"
$runningServices | Format-Table -AutoSize

# 将结果写入日志文件
try {
    $currentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logFilePath -Value ("`n--- 服务状态报告: {0} ---`n" -f $currentTime)
    $runningServices | Out-String | Add-Content -Path $logFilePath
    Write-Host "`n服务清单已成功写入日志文件: $logFilePath" -ForegroundColor Green
} catch {
    Write-Host "`n写入日志文件时发生错误: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "--------------------------"
```

**执行脚本**：
1.  保存为 `.ps1` 文件。
2.  在 PowerShell 中运行：`.\Get-RunningServices.ps1`
3.  如果遇到执行策略问题，可能需要更改执行策略：`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` (仅限当前用户允许运行签名脚本和本地脚本)。

## 六、高级特性 (简述)

*   **远程管理**：使用 `Invoke-Command` 在远程计算机上执行脚本或命令。
*   **Desired State Configuration (DSC)**：一种配置管理平台，用于定义和部署服务器的期望状态。
*   **Classes 和 Enums**：PowerShell 5.0+ 引入了面向对象编程的类和枚举支持。
*   **后台作业 (Jobs)**：使用 `Start-Job` 在后台运行命令或脚本。
*   **事件日志管理**：`Get-WinEvent` / `Get-EventLog`。
*   **网络操作**：`Invoke-WebRequest` (别名 `wget`, `curl`) 用于 HTTP 请求。

## 七、开发环境与工具

1.  **PowerShell 控制台**：基本的命令行界面。
2.  **PowerShell ISE (Integrated Scripting Environment)**：Windows 上的经典 PowerShell IDE，提供语法高亮、自动补全、调试器等。
3.  **Visual Studio Code (VS Code)**：推荐的跨平台 PowerShell 开发环境。安装 **PowerShell 扩展**后，VS Code 提供了卓越的脚本编辑、调试、智能提示和集成终端体验。

## 八、安全性考虑

1.  **执行策略 (Execution Policy)**：PowerShell 的安全功能，用于控制哪些脚本可以运行。
    *   `Get-ExecutionPolicy`：查看当前策略。
    *   `Set-ExecutionPolicy`：设置策略。
    *   **策略类型**：
        *   `Restricted`：默认策略，不允许任何脚本运行。
        *   `AllSigned`：只允许运行由受信任的发布者签名的脚本。
        *   `RemoteSigned`：允许本地创建的脚本运行，但从互联网下载的脚本必须签名。
        *   `Unrestricted`：允许所有脚本运行 (不推荐)。
        *   `Bypass`：无任何限制或警告 (仅限自动化工具使用)。
2.  **凭据管理**：避免在脚本中硬编码敏感信息。使用 `Get-Credential` 获取凭据对象，或集成密码管理解决方案。
3.  **日志记录**：记录脚本的执行活动和结果，便于审计和故障排除。
4.  **最小权限原则**：运行 PowerShell 脚本时，确保使用具有所需最低权限的账户。

## 九、总结

PowerShell 凭借其面向对象的特性、强大的管道机制和跨平台能力，已经成为现代系统管理和自动化的核心工具。无论是管理 Windows 服务器、Azure 云资源，还是在 Linux 和 macOS 环境中进行自动化操作，PowerShell 都能提供统一、高效且功能丰富的解决方案。掌握 PowerShell 能够显著提升IT专业人员和开发者的工作效率，是现代IT技能栈中不可或缺的一部分。深入理解其核心概念并结合实践，将使您能够构建出强大而健壮的自动化脚本。
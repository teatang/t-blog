---
title: Bash (Bourne-Again SHell) 详解
date: 2023-07-05 06:24:00
tags:
  - 2023
  - Linux
  - macOS
  - Shell
  - 命令行
categories:
  - 开发工具
  - 命令行
---

> **Bash (Bourne-Again SHell)** 是 Linux 和 macOS 等 Unix-like 操作系统中最流行、功能最强大的**命令行解释器 (Command Line Interpreter, CLI)** 和**脚本语言**。作为 GNU 项目的一部分，Bash 是 Bourne Shell (sh) 的增强版本，提供命令补全、历史记录、作业控制、更丰富的脚本编程特性等功能，极大地提高了用户在命令行环境下的工作效率。理解 Bash 是掌握 Unix-like 系统操作和自动化任务的关键。

{% note info %}
核心思想：**Bash 是连接用户与操作系统内核的桥梁，既是交互式命令行工具，也是强大的自动化脚本执行环境。**
{% endnote %}
------

## 一、Bash 概览与核心概念

### 1.1 什么是 Shell？

**Shell** 是一个计算机程序，它提供一个用户界面，用于访问操作系统服务。它是用户与操作系统内核之间的**接口**。用户通过 Shell 输入命令，Shell 解释这些命令并将其传递给内核执行，然后将结果返回给用户。

*   **命令行 Shell (CLI Shell)**：通过文本界面接收命令，如 Bash、Zsh、Fish 等。
*   **图形 Shell (GUI Shell)**：通过图形界面交互，如 GNOME Shell (Linux)、macOS Finder、Windows Explorer 等。

### 1.2 Bash 的特点与优势

*   **兼容性**：几乎完全兼容 Bourne Shell (sh)，这意味着大量现有的 sh 脚本可以在 Bash 中运行。
*   **交互性增强**：
    *   **命令历史**：记录用户输入的命令，方便查阅和复用。
    *   **Tab 补全**：自动补全命令、文件路径、变量等，提高输入效率，减少错误。
    *   **别名 (Aliases)**：允许用户为常用命令创建快捷方式。
    *   **作业控制**：管理后台进程和前台进程。
*   **强大的脚本编程能力**：
    *   支持变量、条件判断、循环、函数等编程结构。
    *   丰富的内置命令和操作符，便于文件操作、字符串处理等。
    *   强大的进程间通信 (IPC) 机制，如管道 (pipes)。
*   **可配置性**：可以通过修改配置文件（如 `~/.bashrc`, `~/.bash_profile`）来自定义 Shell 行为、提示符、快捷键等。

### 1.3 Bash 的运行环境

通常，我们在**终端模拟器 (Terminal Emulator)** 中与 Bash 交互。终端模拟器是一个应用程序，它模拟物理终端的功能，例如 `gnome-terminal`、`iTerm2`、`Windows Terminal` 等。当启动终端模拟器时，它会启动一个 Shell 实例（默认通常是 Bash）。

{% mermaid %}
graph TD
    User -->|输入命令| Terminal_Emulator
    Terminal_Emulator -->|传递命令| Bash_Shell
    Bash_Shell -->|解释命令| OS_Kernel
    OS_Kernel -->|执行操作| Hardware
    Hardware -->|返回结果| OS_Kernel
    OS_Kernel -->|返回结果| Bash_Shell
    Bash_Shell -->|输出结果| Terminal_Emulator
    Terminal_Emulator -->|显示| User
{% endmermaid %}

## 二、Bash 基础操作

### 2.1 文件系统导航与操作

| 命令       | 描述                       | 示例                                     |
| :--------- | :------------------------- | :--------------------------------------- |
| `pwd`      | 显示当前工作目录             | `pwd`                                    |
| `ls`       | 列出目录内容               | `ls -lha` (详细、隐藏、人类可读)         |
| `cd`       | 改变目录                   | `cd /home/user/documents`, `cd ..`, `cd ~` |
| `mkdir`    | 创建目录                   | `mkdir my_project`                       |
| `rmdir`    | 删除空目录                 | `rmdir empty_dir`                        |
| `touch`    | 创建空文件或更新文件时间戳 | `touch new_file.txt`                     |
| `cp`       | 复制文件或目录             | `cp file.txt /tmp/`, `cp -r dir1 dir2`   |
| `mv`       | 移动或重命名文件/目录      | `mv old_name.txt new_name.txt`, `mv file.txt /backup/` |
| `rm`       | 删除文件或目录             | `rm file.txt`, `rm -rf my_dir` (强制递归删除) |

### 2.2 查看文件内容

| 命令      | 描述                       | 示例                   |
| :-------- | :------------------------- | :--------------------- |
| `cat`     | 连接文件并打印到标准输出   | `cat file.txt`         |
| `less`    | 分页查看文件内容，可向上滚动 | `less large_log.txt`   |
| `more`    | 分页查看文件内容，只能向下滚动 | `more report.txt`      |
| `head`    | 显示文件开头几行 (默认 10) | `head -n 5 file.txt`   |
| `tail`    | 显示文件末尾几行 (默认 10) | `tail -f /var/log/syslog` (实时跟踪) |

### 2.3 输入/输出重定向与管道

Bash 提供了强大的输入/输出重定向机制，允许你改变命令的默认输入源和输出目标。

*   **标准输入 (stdin, 文件描述符 0)**：默认是键盘。
*   **标准输出 (stdout, 文件描述符 1)**：默认是屏幕。
*   **标准错误 (stderr, 文件描述符 2)**：默认是屏幕。

| 操作符     | 描述                                     | 示例                                     |
| :--------- | :--------------------------------------- | :--------------------------------------- |
| `>`        | 重定向标准输出到文件，**覆盖**原有内容。 | `ls > output.txt`                        |
| `>>`       | 重定向标准输出到文件，**追加**到文件末尾。 | `echo "new line" >> output.txt`          |
| `<`        | 将文件内容作为命令的标准输入。           | `sort < unsorted.txt`                    |
| `2>`       | 重定向标准错误到文件。                   | `command 2> error.log`                   |
| `&>` 或 `>` `&1` | 重定向标准输出和标准错误到同一个文件。   | `command &> all_output.log`              |
| `\|` (管道) | 将一个命令的标准输出作为另一个命令的标准输入。 | `ls -l \| grep ".txt"` (列出所有 .txt 文件) |

**示例:**
```bash
# 将 ls -l 命令的输出保存到 files.txt 中
ls -l > files.txt

# 将 "Hello Bash" 追加到 greeting.txt 末尾
echo "Hello Bash" >> greeting.txt

# 执行一个可能出错的命令，并将错误信息重定向到 error.log
rm non_existent_file 2> error.log

# 列出当前目录下所有以 's' 开头的文件，并统计行数
ls -l | grep "^s" | wc -l
```

## 三、环境变量与 Shell 变量

### 3.1 环境变量 (Environment Variables)

环境变量是操作系统级别或 Shell 会话级别的配置，影响进程的行为。它们通常由操作系统或 Shell 启动脚本设置。

*   `PATH`: 操作系统查找可执行命令的目录列表。
*   `HOME`: 当前用户的主目录。
*   `USER`: 当前用户名。
*   `SHELL`: 当前使用的 Shell 路径。
*   `LANG`: 语言设置。

**查看环境变量:**
```bash
printenv        # 打印所有环境变量
echo $PATH      # 打印特定环境变量的值
```

**设置环境变量 (临时，只对当前 Shell 会话有效):**
```bash
export MY_VARIABLE="Hello World"
echo $MY_VARIABLE
```

### 3.2 Shell 变量 (Shell Variables)

Shell 变量是仅在当前 Shell 进程中有效的变量，不像环境变量那样会被子进程继承。通常用于存储临时数据。

**设置 Shell 变量:**
```bash
name="Alice"
echo "My name is $name"
```
**注意**: 赋值时 `=` 两边不能有空格。

**特殊 Shell 变量:**

| 变量      | 描述                                         |
| :-------- | :------------------------------------------- |
| `$?`      | 上一个命令的退出状态 (0 表示成功，非零表示失败)。 |
| `$$`      | 当前 Shell 进程的 PID。                        |
| `$!`      | 上一个后台进程的 PID。                         |
| `$0`      | 当前脚本的名称。                             |
| `$1`, `$2` | 传递给脚本的第一个、第二个参数。             |
| `$#`      | 传递给脚本的参数数量。                       |
| `$@`      | 所有传递给脚本的参数，每个参数都被视为独立的字符串。 |
| `$*`      | 所有传递给脚本的参数，被视为一个单一的字符串。 |

**示例 (在脚本中):**
```bash
#!/bin/bash
echo "脚本名称: $0"
echo "第一个参数: $1"
echo "所有参数 ($# 个): $@"
echo "上一个命令的退出状态: $?"
```

## 四、流程控制与脚本编程

Bash 的强大之处在于其脚本编程能力，允许我们编写复杂的自动化任务。

### 4.1 基本脚本结构

一个 Bash 脚本通常以**Shebang**行开始，指定解释器。
```bash
#!/bin/bash
# 这是一个 Bash 脚本示例
echo "Hello from Bash script!"

# 定义一个变量
MESSAGE="This is a message."
echo $MESSAGE

# 执行一个命令
ls -lh
```
保存为 `myscript.sh`，然后 `chmod +x myscript.sh` 赋予执行权限，最后 `./myscript.sh` 运行。

### 4.2 条件判断 (if/else)

使用 `if`、`elif`、`else` 进行条件判断，通过 `test` 命令或 `[ ]` 或 `[[ ]]` 进行条件测试。

```bash
#!/bin/bash

# 使用 [ ] 进行条件测试
# 注意：[ 和 ] 必须与内部的表达式有空格
if [ "$1" == "hello" ]; then
    echo "Hello there!"
elif [ "$1" == "bye" ]; then
    echo "Goodbye!"
else
    echo "Usage: $0 <hello|bye>"
fi

# 使用 [[ ]] 增强的条件测试 (推荐)
# 支持正则表达式匹配、更直观的逻辑操作符
FILE="test.txt"
if [[ -f "$FILE" && -r "$FILE" ]]; then
    echo "$FILE exists and is readable."
else
    echo "$FILE does not exist or is not readable."
fi

# 数值比较使用 -eq, -ne, -gt, -ge, -lt, -le
COUNT=10
if (( COUNT > 5 )); then # 或者 if [ $COUNT -gt 5 ]; then
    echo "Count is greater than 5."
fi
```

**常用的条件测试操作符:**

| 类型     | 操作符                                  | 描述                                     |
| :------- | :-------------------------------------- | :--------------------------------------- |
| **文件** | `-f file`                               | 文件存在且是普通文件                     |
|          | `-d directory`                          | 文件存在且是目录                         |
|          | `-e file`                               | 文件存在 (不区分类型)                    |
|          | `-s file`                               | 文件存在且不为空                         |
|          | `-r file`, `-w file`, `-x file`         | 文件可读、可写、可执行                   |
| **字符串** | `string1 == string2` (或 `=`)           | 字符串相等 (在 `[[ ]]` 中支持 `==`)       |
|          | `string1 != string2`                    | 字符串不相等                             |
|          | `-z string`                             | 字符串为空 (长度为零)                    |
|          | `-n string`                             | 字符串不为空                             |
| **数值** | `num1 -eq num2` (equal)                 | 数值相等                                 |
|          | `num1 -ne num2` (not equal)             | 数值不相等                               |
|          | `num1 -gt num2` (greater than)          | 数值大于                                 |
|          | `num1 -ge num2` (greater or equal)      | 数值大于等于                             |
|          | `num1 -lt num2` (less than)             | 数值小于                                 |
|          | `num1 -le num2` (less or equal)         | 数值小于等于                             |
| **逻辑** | `!` (非), `-a` (与), `-o` (或) 或 `&&`, `||` | 逻辑非、逻辑与、逻辑或 (后两者在 `[[ ]]` 中) |

### 4.3 循环 (Loops)

#### 4.3.1 `for` 循环

用于遍历列表或序列。

```bash
#!/bin/bash

# 遍历一个列表
for FRUIT in apple banana cherry; do
    echo "I like $FRUIT."
done

# 遍历文件通配符匹配的结果
echo "Files in current directory:"
for FILE in *; do
    echo "- $FILE"
done

# C 风格的 for 循环 (使用 (( )) 进行数学运算)
for (( i=0; i<5; i++ )); do
    echo "Iteration $i"
done
```

#### 4.3.2 `while` 循环

当条件为真时重复执行。

```bash
#!/bin/bash

COUNT=0
while [ $COUNT -lt 3 ]; do
    echo "Count: $COUNT"
    COUNT=$((COUNT + 1)) # 数学运算
done

# 读取文件内容逐行处理
echo "Reading file..."
while IFS= read -r LINE; do
    echo "Line: $LINE"
done < input.txt # 重定向 input.txt 为 while 循环的输入
```

### 4.4 函数 (Functions)

将一系列命令封装成可重用的代码块。

```bash
#!/bin/bash

# 定义一个函数
greet() {
    local NAME="$1" # 使用 local 关键字声明局部变量，避免污染全局环境
    echo "Hello, $NAME!"
}

# 调用函数
greet "World"
greet "Alice"

# 带返回值的函数 (通过退出状态码或 echo 输出)
add() {
    local A=$1
    local B=$2
    SUM=$((A + B))
    echo $SUM # 将结果打印到标准输出
    return 0 # 0 表示成功，非零表示失败
}

# 调用函数并获取其输出
RESULT=$(add 5 3) # 使用命令替换获取函数输出
echo "The sum is: $RESULT"

# 检查函数退出状态
if add 10 20; then
    echo "Add operation succeeded."
else
    echo "Add operation failed."
fi
```

### 4.5 数学运算

Bash 原生支持整数运算。
*   `$((expression))`: 用于执行算术运算。
*   `let expression`: 另一种执行算术运算的方式。

```bash
#!/bin/bash
A=10
B=5

SUM=$((A + B))
echo "Sum: $SUM"

DIFF=$((A - B))
echo "Difference: $DIFF"

PROD=$((A * B))
echo "Product: $PROD"

DIV=$((A / B)) # 整数除法
echo "Division: $DIV"

MOD=$((A % B))
echo "Modulo: $MOD"

let C=A+B # 使用 let
echo "C: $C"

# 浮点数运算通常需要借助外部工具，如 bc 或 awk
# 例如：echo "scale=2; 10 / 3" | bc
```

## 五、安全性与最佳实践

编写 Bash 脚本时，遵循一些最佳实践可以提高脚本的健壮性、安全性和可维护性。

1.  **始终使用 Shebang**：`#!/bin/bash` 或 `#!/usr/bin/env bash`。
2.  **变量加引号**：当变量可能包含空格或特殊字符时，务必使用双引号将其括起来，以防止单词分割和路径名展开。
    ```bash
    #!/bin/bash
    FILE="my file with spaces.txt"
    # 错误：rm $FILE 会被解释为 rm my file with spaces.txt
    # rm $FILE
    # 正确：rm "my file with spaces.txt"
    rm "$FILE"
    ```
3.  **使用 `local` 声明函数内部变量**：防止局部变量意外覆盖同名的全局变量。
    ```bash
    #!/bin/bash
    GLOBAL_VAR="Global"

    my_function() {
        local GLOBAL_VAR="Local" # 这里的 GLOBAL_VAR 只在函数内部有效
        echo "Inside function: $GLOBAL_VAR"
    }

    echo "Before function call: $GLOBAL_VAR"
    my_function
    echo "After function call: $GLOBAL_VAR"
    ```
    **输出:**
    ```
    Before function call: Global
    Inside function: Local
    After function call: Global
    ```
4.  **使用 `set -e` 提前退出**：当任何命令以非零退出状态码失败时，脚本立即退出。这有助于防止错误累积。
    ```bash
    #!/bin/bash
    set -e # 启用快速退出模式

    echo "Start..."
    rm non_existent_file # 这个命令会失败，脚本在此处退出
    echo "This line will not be executed."
    ```
5.  **使用 `set -u` 检查未定义变量**：当脚本尝试使用未定义的变量时，发出错误并退出。
    ```bash
    #!/bin/bash
    set -u

    echo "Hello, $UNDEFINED_VAR!" # 脚本会因 UNDEFINED_VAR 未定义而报错并退出
    ```
6.  **使用 `set -o pipefail` 处理管道错误**：默认情况下，管道中的命令如果失败，只有最后一个命令的退出状态会被 `$?` 捕获。`pipefail` 会使整个管道的退出状态为第一个失败命令的退出状态。
    ```bash
    #!/bin/bash
    set -eo pipefail # 结合 -e 和 pipefail

    false | echo "This will be printed." # 默认行为，echo成功，$?为0
    # 如果 set -o pipefail 开启，则 false 失败，管道整体失败，脚本退出
    ```
7.  **避免使用 `rm -rf` 无需确认**：在脚本中谨慎使用，或者在执行前添加确认步骤。
8.  **输入验证**：对用户输入或外部来源的输入进行严格验证，防止注入攻击或意外行为。
9.  **使用函数组织代码**：将相关操作封装到函数中，提高可读性和模块化。
10. **添加注释**：清晰的注释有助于理解脚本逻辑，特别是复杂或非显而易见的步骤。

## 六、总结

Bash 作为一个多功能工具，既能满足日常交互式命令行操作的需求，又能通过脚本编程实现复杂的系统管理和自动化。掌握 Bash 的基本命令、文件系统操作、I/O 重定向、变量、以及流程控制结构，并遵循良好的编程实践，将极大提升你在 Unix-like 环境下的工作效率和能力。从简单的文件管理到复杂的部署流水线，Bash 都是不可或缺的基石。
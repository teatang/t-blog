---
title: tmux (Terminal Multiplexer) 详解
date: 2025-05-30 06:24:00
tags:
  - 2025
  - Linux
  - macOS
  - 命令行
categories:
  - 开发工具
  - 命令行
---
> **`tmux` (Terminal Multiplexer)** 是一款开源的终端多路复用器。它允许用户在单个终端窗口中创建、访问和控制多个独立的终端会话。`tmux` 的核心功能是提供会话持久化、多窗口和多窗格管理，极大地提升了命令行用户的工作效率和灵活性。

{% note info %}
核心思想：**将一个物理终端“虚拟化”为多个可独立管理、可持久化的工作空间。**
{% endnote %}

------

## 一、为什么需要 `tmux`？

传统的终端操作通常是“一个窗口一个进程”。当需要同时运行多个命令、查看多个日志，或者远程连接服务器时，这种模式会遇到诸多不便。`tmux` 旨在解决这些问题：

1.  **会话持久化 (Session Persistence)**：
    *   当通过 SSH 连接到远程服务器时，如果网络中断或本地终端关闭，正在运行的命令会随之终止。`tmux` 允许用户“分离 (detach)”一个会话，即便断开 SSH 连接，会话中的程序依然在服务器后台运行。下次重新连接时，可以“连接 (attach)”回之前的会话，恢复工作状态。
    *   对于需要长时间运行的脚本、编译任务或服务，`tmux` 提供了强大的保障。
2.  **多窗口/多窗格 (Multiple Windows/Panes)**：
    *   在一个终端界面中，可以创建多个“窗口”，每个窗口可以运行不同的任务，类似于浏览器的标签页。
    *   每个窗口又可以分割成多个“窗格 (pane)”，每个窗格独立运行一个 shell 实例，方便同时查看日志、编辑代码、执行命令等。
3.  **协同工作 (Pair Programming/Collaboration)**：
    *   多个用户可以连接到同一个 `tmux` 会话，共享终端界面，实现实时的协同操作，非常适合结对编程或远程指导。
4.  **自定义性 (Customizability)**：
    *   通过配置文件 (`~/.tmux.conf`)，用户可以高度自定义 `tmux` 的行为、快捷键、状态栏显示等，以适应个人工作习惯。
5.  **键盘驱动 (Keyboard-driven Efficiency)**：
    *   `tmux` 的所有操作都通过快捷键完成，一旦熟悉，可以大幅提升工作效率，减少鼠标操作。

## 二、`tmux` 的核心概念

理解 `tmux` 的层次结构对于高效使用至关重要：

{% mermaid %}
graph TD
    A[服务器/主机] --> B(tmux Server)
    B --> C1(Session 1)
    B --> C2(Session 2)
    C1 --> D1(Window 1.1)
    C1 --> D2(Window 1.2)
    D1 --> E1(Pane 1.1.1)
    D1 --> E2(Pane 1.1.2)
    D2 --> F1(Pane 1.2.1)
{% endmermaid %}

1.  **Server (服务器)**：
    *   `tmux` 启动后会在后台运行一个服务器进程，负责管理所有会话。
2.  **Session (会话)**：
    *   一个会话是 `tmux` 的最高层级，包含一个或多个窗口。你可以将其视为一个独立的工作环境或项目。会话可以被命名。
    *   当断开连接时，你实际上是“分离”了一个会话，这个会话及其内部的所有窗口和窗格会继续在后台运行。
3.  **Window (窗口)**：
    *   一个窗口是会话内部的一个工作区，包含一个或多个窗格。类似于 Web 浏览器的标签页。每个窗口可以运行不同的应用程序或任务。
    *   窗口通常从 0 或 1 开始编号，并且可以有自定义名称。
4.  **Pane (窗格)**：
    *   一个窗格是窗口内部的一个独立的 shell 实例。你可以将一个窗口垂直或水平分割成多个窗格。
    *   每个窗格有自己的命令行提示符，可以独立执行命令。
5.  **Prefix Key (前缀键)**：
    *   `tmux` 的所有命令都需要通过一个“前缀键”来激活。默认前缀键是 `Ctrl+b`。
    *   这意味着，要发送一个 `tmux` 命令（例如，创建一个新窗口），你需要先按下 `Ctrl+b`，然后松开，再按下相应的命令键。例如，`Ctrl+b c` 表示“创建新窗口”。

## 三、安装 `tmux`

`tmux` 在大多数 Linux 发行版和 macOS 上都可以通过包管理器轻松安装。

*   **Debian/Ubuntu:**
    ```bash
    sudo apt update
    sudo apt install tmux
    ```
*   **CentOS/RHEL:**
    ```bash
    sudo yum install tmux
    ```
*   **Arch Linux:**
    ```bash
    sudo pacman -S tmux
    ```
*   **macOS (使用 Homebrew):**
    ```bash
    brew install tmux
    ```

## 四、`tmux` 基本使用

### 4.1 会话管理

*   **启动一个新的 `tmux` 会话：**
    ```bash
    tmux
    ```
    这会创建一个没有名字的会话，并自动连接进去。

*   **启动一个命名的 `tmux` 会话：**
    ```bash
    tmux new -s my_session
    ```
    `-s` 后面是会话的名称，方便识别和管理。

*   **分离当前会话 (Detach Session)：**
    在 `tmux` 会话内部，按下默认前缀键 `Ctrl+b`，然后按下 `d`。
    ```
    Ctrl+b d
    ```
    这会将你带回启动 `tmux` 之前的 shell 界面，但 `tmux` 会话仍在后台运行。

*   **列出所有 `tmux` 会话：**
    ```bash
    tmux ls
    # 或者
    tmux list-sessions
    ```
    输出示例：
    ```
    my_session: 1 windows (created Fri Dec 21 06:24:00 2023) [80x24]
    0: 1 windows (created Fri Dec 21 06:24:00 2023) [80x24]
    ```

*   **连接到现有会话 (Attach Session)：**
    ```bash
    tmux attach -t my_session
    # 或者通过会话ID (例如，如果只有一个会话，或想连接ID为0的无名会话)
    tmux attach -t 0
    ```
    这将重新连接到名为 `my_session` 的会话。

*   **杀死一个 `tmux` 会话 (Kill Session)：**
    ```bash
    tmux kill-session -t my_session
    ```
    这会终止名为 `my_session` 的会话及其所有进程。

*   **重命名当前会话：**
    在 `tmux` 会话内部，按下 `Ctrl+b`，然后按下 `$`。
    此时状态栏会提示你输入新名称。

### 4.2 窗口管理

窗口是会话内部的“标签页”。

*   **创建新窗口：**
    在 `tmux` 会话内部，按下 `Ctrl+b`，然后按下 `c`。
    ```
    Ctrl+b c
    ```
    这会创建一个新的空窗口，并自动切换到新窗口。

*   **切换到指定窗口 (按编号)：**
    在 `tmux` 会话内部，按下 `Ctrl+b`，然后按下窗口的编号（例如 `0`, `1`, `2`）。
    ```
    Ctrl+b 0  # 切换到第一个窗口
    Ctrl+b 1  # 切换到第二个窗口
    ```

*   **切换到上一个/下一个窗口：**
    ```
    Ctrl+b p  # previous window
    Ctrl+b n  # next window
    ```

*   **列出所有窗口：**
    ```
    Ctrl+b w
    ```
    这会显示一个交互式列表，你可以上下移动光标选择要切换的窗口。

*   **重命名当前窗口：**
    在 `tmux` 会话内部，按下 `Ctrl+b`，然后按下 `,`。
    此时状态栏会提示你输入新名称。

*   **关闭当前窗口：**
    ```
    Ctrl+b &
    ```
    `tmux` 会询问你是否确认关闭。

### 4.3 窗格管理

窗格是窗口内部的“分割区域”。

*   **水平分割当前窗格：**
    在 `tmux` 会话内部，按下 `Ctrl+b`，然后按下 `%`。
    ```
    Ctrl+b %
    ```
    这会将当前窗格垂直分割成左右两个窗格。

*   **垂直分割当前窗格：**
    在 `tmux` 会话内部，按下 `Ctrl+b`，然后按下 `"`。
    ```
    Ctrl+b "
    ```
    这会将当前窗格水平分割成上下两个窗格。

*   **切换到相邻窗格：**
    ```
    Ctrl+b <arrow-key>  # 使用方向键 (上、下、左、右)
    # 或者
    Ctrl+b o            # 依次切换到下一个窗格
    ```

*   **最大化当前窗格/恢复：**
    ```
    Ctrl+b z
    ```
    再次按下可恢复。

*   **关闭当前窗格：**
    ```
    Ctrl+b x
    ```
    `tmux` 会询问你是否确认关闭。

*   **调整窗格大小：**
    ```
    Ctrl+b Ctrl+<arrow-key>  # 按住 Ctrl+b, 再按住 Ctrl 和方向键
    # 或者
    Ctrl+b :resize-pane -U 10 # 向上调整 10 行
    Ctrl+b :resize-pane -L 5  # 向左调整 5 列
    ```

## 五、自定义 `tmux` (`.tmux.conf`)

`tmux` 的强大之处还在于其高度可配置性。你可以在用户主目录创建或编辑 `.tmux.conf` 文件来定制 `tmux`。

*   **创建或编辑配置文件：**
    ```bash
    nano ~/.tmux.conf
    # 或
    vim ~/.tmux.conf
    ```
*   **重新加载配置文件：**
    在 `tmux` 会话内部，按下 `Ctrl+b`，然后按下 `:`，输入 `source-file ~/.tmux.conf` 并回车。
    ```
    Ctrl+b :source-file ~/.tmux.conf
    ```

**常用自定义示例：**

1.  **更改前缀键：**
    将前缀键从 `Ctrl+b` 改为 `Ctrl+a` (更接近 `screen` 的习惯，且 `Ctrl+a` 通常不被 shell 占用)。
    ```tmux
    # 取消默认前缀键绑定
    unbind C-b
    # 设置 C-a 为新的前缀键
    set-option -g prefix C-a
    # 将 C-a C-a 绑定为发送 C-a (如果你想在某个程序中实际输入 Ctrl+a)
    bind-key C-a send-prefix
    ```
2.  **启用鼠标支持：**
    允许使用鼠标点击切换窗格、调整大小、滚动。
    ```tmux
    set -g mouse on
    ```
3.  **设置窗口从 1 开始编号：**
    ```tmux
    set -g base-index 1
    set-window-option -g pane-base-index 1
    ```
4.  **美化状态栏：**
    ```tmux
    # 设置状态栏颜色
    set -g status-bg '#666666'
    set -g status-fg white

    # 设置左侧状态栏内容 (会话名称)
    set -g status-left '#[fg=green]#[bg=black][#S] '

    # 设置右侧状态栏内容 (日期时间，主机名)
    set -g status-right '#[fg=yellow]#[bg=black] %H:%M %d-%b-%y #[fg=cyan]#[bg=black] #h '

    # 窗口列表居中
    set -g status-justify centre

    # 窗口列表格式
    set-window-option -g window-status-format '#[fg=cyan] #I:#W '
    set-window-option -g window-status-current-format '#[bg=brightblack,fg=white] #I:#W #[fg=white]'
    ```
5.  **快速切换窗格 (vim-like):**
    如果你习惯 Vim，可以绑定 `h`, `j`, `k`, `l` 来切换窗格。
    ```tmux
    bind h select-pane -L
    bind j select-pane -D
    bind k select-pane -U
    bind l select-pane -R
    ```

## 六、高级功能 (简述)

*   **复制模式 (Copy Mode)**：
    `Ctrl+b [` 进入复制模式，可以用 Vim 键位（或 Emacs 键位）导航、选择和复制终端输出。`Ctrl+b ]` 粘贴。
*   **滚动 (Scrolling)**：
    在复制模式下，可以使用 PgUp/PgDn 或 Vim 键位滚动历史输出。
*   **脚本化 (Scripting)**：
    `tmux` 提供了丰富的命令行接口，可以编写脚本来自动化会话、窗口和窗格的创建与布局。
*   **插件管理器 (TPM - Tmux Plugin Manager)**：
    类似于 Vim 的插件管理器，TPM 允许你方便地安装和管理 `tmux` 插件，扩展其功能（如自动保存会话、增强状态栏等）。

## 七、`tmux` vs. `screen`

`screen` 是 `tmux` 的前辈，也提供终端多路复用功能。两者功能类似，但 `tmux` 通常被认为更现代、配置更易懂、功能更丰富：

*   **配置**：`tmux` 的配置语法通常更直观。
*   **功能**：`tmux` 对窗格管理提供了更多细粒度的控制和更方便的快捷键。
*   **发展**：`tmux` 社区更活跃，更新更快。

对于新用户，通常推荐直接学习和使用 `tmux`。

## 八、总结

`tmux` 是一个功能强大、高度可定制的终端工具，是任何命令行重度用户或需要远程连接服务器的用户不可或缺的生产力伙伴。通过掌握其会话、窗口、窗格的概念以及常用的快捷键，你将能够显著提升终端工作流的效率和灵活性。投入时间学习 `tmux` 绝对物有所值。
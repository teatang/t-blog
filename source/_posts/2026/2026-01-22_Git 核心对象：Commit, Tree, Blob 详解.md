---
title: Git 核心对象：Commit, Tree, Blob 详解
date: 2026-01-22 06:24:00
tags:
  - 2026
  - 开发工具
  - Git
categories:
  - 开发工具
  - Git
---
> Git 作为一个分布式版本控制系统，其强大的能力和高效的存储机制离不开其底层对象模型。理解 Git 的核心对象——**Commit (提交)**、**Tree (树)** 和 **Blob (二进制大对象)**，是深入理解 Git 工作原理的关键。这些对象共同构成了 Git 存储库的骨架，以**内容寻址 (Content-Addressable)** 的方式，确保了版本历史的完整性和数据的不可篡改性。

{% note info %}
Git 的宗旨是：**一次只存储数据，而不是差异。** 每个版本都是一个完整的快照，而非基于前一个版本的增量。这通过其核心对象模型高效实现。
{% endnote %}
------

## 一、Git 对象模型概述

Git 存储库的核心是一个键值对数据库，其中“键”是内容的 SHA-1 校验和，而“值”则是 Git 对象。这些对象存储在 `.git/objects` 目录下。当 Git 添加或修改文件时，它不会直接存储文件的差异，而是将文件的完整内容作为对象存储起来，并根据其内容计算出一个唯一的 SHA-1 值作为标识符。

Git 对象主要分为四种类型，其中最核心的是 `Blob`、`Tree` 和 `Commit`：
1.  **Blob (Binary Large Object)**：存储文件的内容。
2.  **Tree (树)**：存储目录的结构和内容，包含指向 Blob 和其他 Tree 对象的指针。
3.  **Commit (提交)**：记录一次快照，包含指向根 Tree 对象的指针、父 Commit 对象的指针、作者、提交者信息以及提交消息。
4.  **Tag (标签)**：指向一个 Git 提交对象的指针，用于标记重要的时间点（如发布版本）。

以下我们将详细探讨 Blob, Tree, Commit 这三个核心对象。

## 二、Blob 对象 (Blob Object)

### 2.1 定义与特性

**Blob 对象**是 Git 中最基本的数据存储单元，它直接存储了文件的全部内容。

*   **文件内容快照**：一个 Blob 对象就代表了某一时刻一个文件的完整内容快照。
*   **无元数据**：Blob 对象不存储文件名、文件路径、权限等文件元数据，只存储纯粹的文件内容。
*   **SHA-1 命名**：每个 Blob 对象的名称是其内容（以及类型、大小等信息）经过 SHA-1 哈希算法计算得出的唯一值。这意味着，如果两个文件内容完全相同，即使它们在文件系统中是不同的文件或在不同的路径，Git 也只会存储一个 Blob 对象，并通过相同的 SHA-1 引用它。
*   **不可变性**：一旦创建，Blob 对象的内容就不可更改。如果文件内容发生变化，Git 会创建一个新的 Blob 对象来存储新的内容。

### 2.2 示例：文件的 Blob 化

假设我们有一个文件 `hello.txt`，内容为 `Hello, Git!\n`。

```bash
$ echo "Hello, Git!" > hello.txt
$ git add hello.txt
$ git hash-object -w hello.txt
b1c59bb7e68fa707ef4f83b276fc80df24488344
```
这里的 `b1c59bb7e68fa707ef4f83b276fc80df24488344` 就是 `hello.txt` 内容对应的 Blob 对象的 SHA-1 值。我们通过 `git cat-file -p` 命令查看其内容：

```bash
$ git cat-file -p b1c59bb7e68fa707ef4f83b276fc80df24488344
Hello, Git!
```

### 2.3 Python 模拟 Blob 创建

我们可以使用 Python 来模拟 Git 计算文件内容 SHA-1 的过程。

```python
import hashlib
import zlib

def create_git_blob(content: bytes) -> str:
    """
    模拟Git创建Blob对象的过程，并返回其SHA-1哈希值。
    Git Blob对象的存储格式是："blob <size>\0<content>"
    """
    header = f"blob {len(content)}\0".encode('utf-8')
    store_content = header + content
    sha1_hash = hashlib.sha1(store_content).hexdigest()
  
    # 实际Git会将这个数据压缩后存储，这里只计算hash
    # compressed_content = zlib.compress(store_content)
    # 存储到 .git/objects/xx/xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    return sha1_hash

# 示例文件内容
file_content = "Hello, Git!\n".encode('utf-8')
blob_hash = create_git_blob(file_content)
print(f"File content: '{file_content.decode('utf-8').strip()}'")
print(f"Calculated Blob SHA-1: {blob_hash}")

# 验证与实际Git命令输出（可能因换行符、文本编码等细微差异导致不同，但原理一致）
# 如果 'hello.txt' 实际内容就是 "Hello, Git!\n"（带一个Unix换行），则hash应匹配
# 实际操作时，确保内容完全一致才能匹配Git命令的hash
```

## 三、Tree 对象 (Tree Object)

### 3.1 定义与特性

**Tree 对象**用于表示一个目录的快照。它包含了一系列条目 (entries)，每个条目指向一个 Blob 对象（文件）或另一个 Tree 对象（子目录）。

*   **目录结构快照**：一个 Tree 对象代表了某一时刻某个目录的完整结构和其包含的文件及子目录。
*   **层级结构**：Tree 对象通过嵌套引用其他 Tree 对象，从而构建出整个文件系统的目录层级结构。
*   **包含元数据**：每个条目包含：
    *   **文件模式 (Mode)**：文件类型和权限（例如 100644 for regular file, 100755 for executable, 040000 for directory）。
    *   **对象类型 (Type)**：`blob` 或 `tree`。
    *   **SHA-1 哈希值**：指向对应的 Blob 或 Tree 对象的 SHA-1 值。
    *   **文件名/目录名 (Name)**：当前目录下的文件或子目录的名称。
*   **SHA-1 命名**：与 Blob 类似，Tree 对象的名称也是由其内容（所有条目信息）计算出的 SHA-1 值。任何文件名、模式或其中一个 Blob/Tree 引用的变化都会导致一个新的 Tree 对象被创建。

### 3.2 示例：目录的 Tree 化

假设我们有一个目录结构如下：

```
.
└── src/
    ├── main.go
    └── utils.go
```

`main.go` 内容：`package main\nfunc main() {}\n`
`utils.go` 内容：`package utils\nfunc Helper() {}\n`

首先，将文件内容转换为 Blob：

```bash
$ echo -e "package main\nfunc main() {}" > src/main.go
$ echo -e "package utils\nfunc Helper() {}" > src/utils.go
$ git add src/main.go src/utils.go
# 假设main.go的blob_hash为 aabbccddeeff...
# 假设utils.go的blob_hash为 112233445566...
```

使用 `git ls-files -s` 可以查看暂存区中的文件信息：

```bash
$ git ls-files -s
100644 aabbccddeeff... 0   src/main.go
100644 112233445566... 0   src/utils.go
```

现在，创建 `src` 目录的 Tree 对象：

```bash
$ git write-tree
# 假设返回的tree_hash为 fedcba987654...
```

查看这个 `src` Tree 对象的内部：

```bash
$ git cat-file -p fedcba987654...
100644 blob aabbccddeeff...   main.go
100644 blob 112233445566...   utils.go
```
如果顶层目录还有其他文件或子目录，将会有另一个 Tree 对象指向这个 `src` Tree。

### 3.3 Python 模拟 Tree 条目

```python
import hashlib
import zlib

def create_git_tree_entry(mode: str, type: str, sha1_hash: str, name: str) -> bytes:
    """
    构造Tree对象的一个条目字符串。
    Git Tree条目格式：<mode> <type> <sha1>    <name>\n
    在计算Tree哈希时，所有条目会按文件名/目录名排序，然后拼接起来。
    SHA-1是在内部以20字节原始二进制形式存储。
    """
    # 模式和类型通常是十进制，这里为了演示简化为字符串
    # 实际Git内部存储的SHA1是20字节的二进制值
    return f"{mode} {type} {sha1_hash}\t{name}".encode('utf-8')

def create_git_tree(entries: list[tuple]) -> str:
    """
    根据条目列表创建Tree对象并返回其SHA-1哈希。
    entries: list of (mode, type, sha1_hash_str, name)
    """
    # 将哈希从十六进制字符串转换为原始二进制
    sorted_entries_data = []
  
    # Git按名称对条目进行排序，然后将它们的原始 bytes 形式拼接在一起
    # 每个条目格式为：<mode> <name>\0<sha1_binary_20_bytes>
    # 注意：这里的示例是一个简化版本，实际Git的Tree对象内部存储格式更复杂，
    # sha1是原始二进制，不是字符串。这里为了演示方便，用字符串简化。
  
    # 真实git tree的数据结构更像是：
    # entry1_str = f"{mode} {name}\0".encode('utf-8') + bytes.fromhex(sha1_hash)
    # entry2_str = ...
    # 将这些entry_str按字典序排序后拼接。
  
    # 模拟简化版：
    sorted_entries = sorted(entries, key=lambda x: x[3]) # 按名称排序
    for mode, type_name, sha1_hex, name in sorted_entries:
        # 这个字符串形式只是为了方便人类阅读，实际Git会用原始二进制SHA1和特定编码
        sorted_entries_data.append(f"{mode} {type_name} {sha1_hex}\t{name}".encode('utf-8'))
      
    tree_content = b"".join(sorted_entries_data)
  
    header = f"tree {len(tree_content)}\0".encode('utf-8')
    store_content = header + tree_content
    sha1_hash = hashlib.sha1(store_content).hexdigest()
    return sha1_hash

# 假设已经有了两个Blob的SHA-1哈希
main_go_blob_hash = "aabbccddeeff0123456789aabbccddeeff01234567" # 虚拟哈希
utils_go_blob_hash = "1122334455667788990011223344556677889900" # 虚拟哈希

# 创建src目录下的Tree条目
src_entries = [
    ("100644", "blob", main_go_blob_hash, "main.go"),
    ("100644", "blob", utils_go_blob_hash, "utils.go"),
]

src_tree_hash = create_git_tree(src_entries)
print(f"Calculated 'src' Tree SHA-1: {src_tree_hash}")

# 如果有更上层的目录，可以包含这个src_tree
# root_entries = [
#     ("040000", "tree", src_tree_hash, "src"),
#     # ... 其他文件或目录
# ]
# root_tree_hash = create_git_tree(root_entries)
# print(f"Calculated Root Tree SHA-1: {root_tree_hash}")
```

## 四、Commit 对象 (Commit Object)

### 4.1 定义与特性

**Commit 对象**是 Git 版本历史的核心，它记录了一次完整的版本快照。一个 Commit 对象代表了项目在某个时间点上的一个确定的状态。

*   **项目快照**：Commit 对象通过指向一个**根 Tree 对象**来捕获整个工作目录的快照。这个根 Tree 对象通常是从文件系统根目录 (`.` 或工作区目录) 计算出的 SHA-1 值。
*   **版本历史**：每个 Commit 对象都包含一个或多个**父 Commit 对象**的 SHA-1 值，这构建了 Git 的版本历史图（一个有向无环图 DAG）。
    *   普通提交有一个父 Commit。
    *   初始提交（第一个提交）没有父 Commit。
    *   合并提交 (Merge Commit) 有两个或更多父 Commit。
*   **元数据**：除了结构信息，Commit 还包含了关于这次提交的元数据：
    *   **Author (作者)**：提交的真正创作者的姓名、电子邮件和时间戳。
    *   **Committer (提交者)**：将此次更改应用到仓库的人的姓名、电子邮件和时间戳。在 `git rebase` 或 `git cherry-pick` 等操作中，作者和提交者可能会不同。
    *   **Commit Message (提交消息)**：描述这次提交所做的工作。
*   **SHA-1 命名**：与 Blob 和 Tree 对象一样，Commit 对象的名称也是由其所有内容（根 Tree 引用、所有父 Commit 引用、作者/提交者信息、提交消息）计算出的 SHA-1 值。任何元数据的更改都会导致一个新的 Commit 对象被创建。

### 4.2 示例：Commit 对象的结构

在 Git 仓库中创建一个新文件并提交：

```bash
$ git init my_repo
$ cd my_repo
$ echo "Initial content" > first.txt
$ git add first.txt
$ git config user.name "Your Name"
$ git config user.email "your.email@example.com"
$ git commit -m "Initial commit of first.txt"
[main (root-commit) 6e3ddc6] Initial commit of first.txt
 1 file changed, 1 insertion(+)
 create mode 100644 first.txt
```
这里的 `6e3ddc6` 就是这个 Commit 对象的 SHA-1 值。我们通过 `git cat-file -p` 命令查看其内部：

```bash
$ git cat-file -p 6e3ddc6
tree 5b5d7d3d0f04ea26fc54045f4423028c31023a6c
author Your Name <your.email@example.com> 1678234567 +0800
committer Your Name <your.email@example.com> 1678234567 +0800

Initial commit of first.txt
```
从输出中可以看到：
*   它指向了一个 `tree` 对象 (`5b5d7d3d0f04ea26fc54045f4423028c31023a6c`)，这是当前仓库根目录的快照。
*   它没有 `parent` 字段，因为它是初始提交。
*   它包含了作者和提交者的信息及时间戳。
*   它包含了提交消息 `Initial commit of first.txt`。

当进行下一个提交时，该 Commit 对象就会有一个 `parent` 字段指向 `6e3ddc6` 这个 Commit。

### 4.3 Python 模拟 Commit 创建

```python
import hashlib
import zlib
import time

def create_git_commit(tree_sha1: str, parents_sha1: list[str], author: str, committer: str, message: str) -> str:
    """
    模拟Git创建Commit对象的过程，并返回其SHA-1哈希值。
    Commit对象的存储格式：
    tree <tree_sha1>
    parent <parent1_sha1> (可选，可多个)
    author <author_name> <author_email> <timestamp> <timezone>
    committer <committer_name> <committer_email> <timestamp> <timezone>

    <commit_message>
    """
    commit_lines = [f"tree {tree_sha1}"]
    for parent_sha1 in parents_sha1:
        commit_lines.append(f"parent {parent_sha1}")

    # 获取当前时间戳和时区
    current_time = int(time.time())
    # 获取本地时区偏移量，例如 +0800
    timezone_offset = time.strftime('%z', time.gmtime()).replace('+', '+').replace('-', '-')

    # 假设author和committer格式为 "Name <email>"
    author_info = f"{author} {current_time} {timezone_offset}"
    committer_info = f"{committer} {current_time} {timezone_offset}"
  
    commit_lines.append(f"author {author_info}")
    commit_lines.append(f"committer {committer_info}")
  
    # Commit message 之前有一个空行
    commit_content_bytes = "\n".join(commit_lines).encode('utf-8') + b"\n\n" + message.encode('utf-8')
  
    header = f"commit {len(commit_content_bytes)}\0".encode('utf-8')
    store_content = header + commit_content_bytes
  
    sha1_hash = hashlib.sha1(store_content).hexdigest()
    return sha1_hash

# 示例：假设我们有一个根Tree对象的SHA-1
root_tree_hash = "5b5d7d3d0f04ea26fc54045f4423028c31023a6c" # 虚拟前面创建的Tree哈希

# 初始提交没有父Commit
initial_commit_hash = create_git_commit(
    tree_sha1=root_tree_hash,
    parents_sha1=[],
    author="Your Name <your.email@example.com>",
    committer="Your Name <your.email@example.com>",
    message="Initial commit of first.txt"
)
print(f"Calculated Initial Commit SHA-1: {initial_commit_hash}")

# 假设再进行一次提交，修改了文件，生成了新的root_tree
new_root_tree_hash = "aaddbbeeccff0123456789aabbccddeeff01234567" # 虚拟新的Tree哈希

# 下一个提交的父Commit就是上一个Commit
second_commit_hash = create_git_commit(
    tree_sha1=new_root_tree_hash,
    parents_sha1=[initial_commit_hash], # 指向父Commit
    author="Your Name <your.email@example.com>",
    committer="Your Name <your.email@example.com>",
    message="Update first.txt"
)
print(f"Calculated Second Commit SHA-1: {second_commit_hash}")
```

## 五、Commit, Tree, Blob 之间的关系

Git 的核心就是通过这三种对象及其之间的引用关系，构建出一个完整且不可篡改的版本历史记录。

{% mermaid %}
graph TD
    subgraph "Repository History (DAG of Commits)"
        C0[Commit 0] --> C1[Commit 1]
        C1 --> C2_A["Commit 2 (Branch A)"]
        C1 --> C2_B["Commit 2 (Branch B)"]
        C2_A --> C3["Commit 3 (Merge)"]
        C2_B --> C3
    end

    subgraph Object Structure
        C1 -- points to --> T_root_C1["Tree (Root Directory) for C1"]
        T_root_C1 -- contains entries for --> B_file1_C1["Blob (File: file1.txt content v1)"]
        T_root_C1 -- contains entries for --> T_subdir_C1["Tree (Subdirectory: sub_dir)"]
        T_subdir_C1 -- contains entries for --> B_file2_C1["Blob (File: sub_dir/file2.txt content v1)"]
    end
{% endmermaid %}

**Git 对象模型的层级关系总结：**
*   **Commit 对象**：是顶层对象，代表一个版本快照。它包含指向一个 **Tree 对象**的指针，这个 Tree 对象是整个仓库根目录的快照。同时，Commit 也包含指向其**父 Commit 对象**的指针，形成历史链条。
*   **Tree 对象**：表示一个目录。它包含指向 **Blob 对象**（对应文件内容）和/或**其他 Tree 对象**（对应子目录）的指针。
*   **Blob 对象**：表示一个文件的具体内容。

这种设计使得 Git 非常强大和灵活：
*   **高效存储**：如果两个提交中某个文件的内容相同，它们会指向同一个 Blob 对象，节省存储空间。
*   **数据完整性**：所有对象都通过 SHA-1 哈希值引用，任何内容的改动都会导致哈希值变化，从而破坏引用链，使得篡改历史变得困难。
*   **快速切换版本**：因为每个 Commit 都指向一个完整的根 Tree 快照，所以切换到任何版本都只需要更新工作目录到该 Commit 所指向的 Tree 结构即可，无需复杂的差异计算。

## 六、总结

Git 的 Commit, Tree, Blob 对象共同构建了一个高效、健壮、内容寻址的分布式版本控制系统。Blob 存储文件内容，Tree 存储目录结构，Commit 将两者整合并通过时间线串联起来。深入理解这些底层构造不仅能帮助我们更好地使用 Git，还能在遇到复杂问题时提供解决问题的思路。Git 的一切皆对象，其内容寻址的特性是其安全性和可追溯性的根本保障。
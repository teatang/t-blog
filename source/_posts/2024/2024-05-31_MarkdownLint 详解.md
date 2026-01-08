---
title: MarkdownLint 详解
date: 2024-06-04 06:24:00
tags:
  - 2024
  - 前端技术
  - 项目构建
  - Markdown
  - Lint
  - CI/CD
  - 代码质量
categories:
  - 前端技术
  - Markdown
---
> **`MarkdownLint`** 是一系列用于**规范和检查 Markdown 文本格式**的工具集合。它基于预定义的规则集（或用户自定义规则），自动扫描 Markdown 文件，识别出可能不符合规范、不一致、影响可读性或潜在渲染问题的语法或风格问题。通过 `MarkdownLint`，可以确保 Markdown 文档的质量、一致性和可维护性，特别是在团队协作或项目文档发布时。

{% note info %}
核心思想：**自动化检查 Markdown 文件的格式、风格和潜在错误，以确保文档质量和一致性。**
{% endnote %}
------

## 一、为什么需要 `MarkdownLint`？

Markdown 语言以其简洁性和易读性而广受欢迎，但其灵活的语法也可能导致以下问题：

1.  **风格不一致**：团队成员可能有不同的 Markdown 写作习惯（例如，使用空格还是制表符缩进，标题与内容之间是否有空行，如何使用列表项符号等），导致文档风格混乱。
2.  **可读性下降**：不规范的格式会影响文档的清晰度和可读性。
3.  **渲染问题**：某些不标准的 Markdown 语法可能在不同的渲染器（如 GitHub、GitLab、Jupyter、各种 Markdown 编辑器）上呈现出不一致或错误的效果。
4.  **维护困难**：不规范的文档会增加后续修改和维护的难度。
5.  **自动化处理障碍**：如果文档格式不规范，自动化工具（如生成目录、解析特定区块）可能会遇到困难。

`MarkdownLint` 旨在解决这些问题，提供一种自动化、可配置的方式来强制执行 Markdown 最佳实践和团队规范：

*   **提升文档质量**：确保所有文档都符合高标准。
*   **保持一致性**：在整个项目甚至组织内部统一 Markdown 风格。
*   **避免渲染问题**：识别并修复可能导致兼容性问题的语法。
*   **提高可维护性**：使文档更易于理解和修改。
*   **集成 CI/CD**：在持续集成流程中自动检查文档，防止不规范的 Markdown 被合并。

## 二、`MarkdownLint` 的常见实现

`MarkdownLint` 并非指一个单一的工具，而是一类工具的统称。最常见的实现包括：

1.  **`markdownlint-cli`**：基于 Node.js，可以通过 npm 安装和运行的命令行工具。这是最常用和广泛推荐的独立 `markdownlint` 实现。
2.  **`vscode-markdownlint`**：Visual Studio Code 的一个流行扩展，将 `markdownlint` 功能集成到编辑器中，提供实时反馈。
3.  **`Ruby MarkdownLint (mdl)`**：基于 Ruby 的 `mdl` 工具，提供了类似的 Lint 功能。
4.  **GitHub Actions**：通过 `markdownlint-action` 等集成到 GitHub Actions 工作流。
5.  其他语言实现：例如 `pylint-markdown` (Python)、`linter-markdown` (Atom)。

本文主要以最常用的 **`markdownlint-cli` (Node.js)** 和其规则集为核心进行介绍。

## 三、`markdownlint-cli` 详解

`markdownlint-cli` 是一个易于安装和使用的命令行工具。

### 3.1 安装

需要 Node.js 环境。

```bash
npm install -g markdownlint-cli # 全局安装
# 或者在项目依赖中安装
# npm install --save-dev markdownlint-cli
```

### 3.2 基本用法

*   **检查单个文件**：
    ```bash
    markdownlint myfile.md
    ```
*   **检查多个文件或目录 (递归)**：
    ```bash
    markdownlint docs/
    markdownlint *.md
    ```
*   **修复部分问题 (实验性)**：
    ```bash
    markdownlint --fix myfile.md
    ```

### 3.3 退出码

*   `0`：所有文件检查通过，无错误。
*   `>0`：发现至少一个问题。

### 3.4 常用命令行选项

*   `-f`, `--fix`：尝试自动修复发现的问题（并非所有问题都可修复）。
*   `-c`, `--config <file>`：指定配置文件路径，例如 `.markdownlint.jsonc`。
*   `-i`, `--ignore <glob>`：指定要忽略的文件或目录模式。
*   `-r`, `--rules <file>`：加载额外的自定义规则文件。
*   `-s`, `--stdin`：从标准输入读取 Markdown 内容。
*   `-p`, `--json`：以 JSON 格式输出结果。

## 四、`MarkdownLint` 规则

`MarkdownLint` 的核心是其丰富的规则集，每个规则都对应一个特定的 Markdown 格式或风格问题。规则通常有唯一标识符（如 `MD001`、`MD003`）和描述。

### 4.1 常见内置规则示例

以下是一些常见的内置 `markdownlint` 规则及其作用：

| 规则 ID | 描述                                      | 典型问题                                     |
| :------ | :---------------------------------------- | :------------------------------------------- |
| `MD001` | Headers should be consistent in style.    | 标题风格不一致（如，有的使用 `ATX`，有的使用 `Setext`）。 |
| `MD003` | Header style should be consistent.      | 标题风格不一致 (ATX/Setext)。            |
| `MD004` | Unordered list style should be consistent.| 无序列表项符号不一致（例如，混合使用 `*` 和 `-`）。 |
| `MD005` | Inconsistent indentation for list items at the same level. | 同级列表项缩进不一致。                  |
| `MD006` | Consider using fenced code blocks.        | 建议使用围栏代码块 (` ``` `) 而不是缩进代码块。 |
| `MD007` | Unordered list indentation.           | 无序列表缩进深度不正确。                     |
| `MD009` | Trailing spaces.                          | 行尾有多余的空格。                           |
| `MD010` | Hard tabs.                                | 使用了硬制表符而不是空格。                   |
| `MD012` | Multiple blank lines.                     | 连续多个空行。                               |
| `MD013` | Line length.                              | 行长度超过指定限制（例如，80 或 120 字符）。 |
| `MD014` | Dollar signs used in code blocks in example (shell) commands. | 示例命令中使用了美元符号 `$`。             |
| `MD018` | No space after hash in ATX style header.  | ATX 风格标题 `#` 后没有空格。              |
| `MD022` | Headers should be surrounded by blank lines. | 标题上下没有空行。                           |
| `MD024` | Multiple headers with the same content.   | 同一文件中存在具有相同内容的多个标题。       |
| `MD025` | Multiple top-level headers in the same document. | 同一文档中存在多个一级标题。                 |
| `MD026` | Trailing punctuation in header.         | 标题末尾有多余的标点符号。                   |
| `MD029` | Ordered list item prefix.             | 有序列表项前缀不一致（例如，混合使用 `1.` 和 `2.`）。 |
| `MD030` | Spaces after list markers.              | 列表标记后没有足够的空格。                   |
| `MD031` | Fenced code blocks should be surrounded by blank lines. | 围栏代码块上下没有空行。                     |
| `MD033` | Inline HTML.                              | 文档中包含内联 HTML 标签。                   |
| `MD034` | Bare URLs should be enclosed in angle brackets. | 裸 URL (未用 `<>` 包裹) 。                 |
| `MD035` | Horizontal rule style.                 | 水平线风格不一致。                           |
| `MD036` | Emphasis used instead of headers.         | 使用强调 (粗体/斜体) 而不是标题。          |
| `MD038` | Spaces around inline code.                | 内联代码前后没有空格。                       |
| `MD039` | Spaces inside code span.                  | 代码 span (`` ` ` ``) 内有不必要的空格。    |
| `MD040` | Fenced code blocks should have a language specified. | 围栏代码块缺少语言类型。                     |
| `MD041` | First header should be a top-level header. | 第一个标题不是一级标题。                     |
| `MD046` | Code block style.                       | 代码块风格不一致 (围栏/缩进)。             |

### 4.2 配置规则 (`.markdownlint.jsonc`)

`MarkdownLint` 可以通过配置文件来启用/禁用特定规则，或修改规则的参数。配置文件通常命名为 `.markdownlint.jsonc` (推荐，支持注释) 或 `.markdownlint.json`。

**示例配置文件：**

```jsonc
// .markdownlint.jsonc
{
  "default": false, // 默认禁用所有规则，然后按需启用

  // 启用一些常见且重要的规则
  "MD009": true, // Disallow trailing spaces (行尾空格)
  "MD010": true, // Disallow hard tabs (禁止硬制表符)
  "MD012": { "maximum": 1 }, // Limit maximum consecutive blank lines to 1 (限制连续空行最多为1)
  "MD013": { "line_length": 120, "tables": false, "code_blocks": false }, // Line length (行长度限制120，但对表格和代码块禁用)
  "MD022": true, // Headers should be surrounded by blank lines (标题应由空行包围)
  "MD025": { "level": 1 }, // Multiple top-level headers in the same document (只允许一个一级标题)
  "MD029": { "style": "ordered" }, // Ordered list item prefix (有序列表项前缀应为1. 2. 3. 这种顺序)
  "MD031": true, // Fenced code blocks should be surrounded by blank lines (围栏代码块应由空行包围)
  "MD033": { "allowed_elements": ["sub", "sup"]}, // Allow specific HTML tags (允许特定HTML标签，例如 sup 下标)
  "MD040": true, // Fenced code blocks should have a language specified (围栏代码块应指定语言)
  "MD041": true, // First header should be a top-level header (第一个标题应为一级标题)

  // 禁用一些认为不必要的规则
  "MD001": false, // Header style should be consistent (不同意强制使用某种标题风格)
  "MD002": false, // First header should be a top-level header (如果 MD041 启用了，这个通常不必要)
  "MD003": { "style": "atx" }, // Enforce ATX style headers (强制使用 # 风格标题)
  "MD004": { "style": "dash" }, // Unordered list style should be consistent (无序列表项统一使用 - )
  "MD007": { "indent": 2 }, // Unordered list indentation (无序列表缩进2格)
  "MD046": { "style": "fenced" }, // Code block style (强制使用围栏代码块)

  // 排除特定文件或目录
  "TOC.md": { "MD025": false }, // TOC.md 文件可以有多个一级标题
  "node_modules": { "MD013": false } // node_modules 目录中的文件不做行长度限制
}
```

### 4.3 在项目中共享配置

将 `.markdownlint.jsonc` 文件放置在项目根目录， `markdownlint-cli` 会自动发现并使用它。这确保了团队中所有成员和 CI/CD 环境都使用相同的规则集。

## 五、集成 `MarkdownLint` 到工作流

为了最大化 `MarkdownLint` 的价值，应该将其集成到开发的各个阶段：

### 5.1 编辑器集成 (VS Code)

最常见的集成方式是使用 VS Code 的 `markdownlint` 扩展。它提供实时反馈，就像代码 Linter 一样，在您编写 Markdown 时立即提示问题。

1.  安装 `markdownlint` 扩展。
2.  在 VS Code 中打开 Markdown 文件。
3.  扩展会检测到项目中的 `.markdownlint.jsonc` 文件，并根据其中的规则进行检查。

### 5.2 Git Hooks

可以使用 Git Hooks (例如 `pre-commit` 钩子) 在提交代码之前自动运行 `markdownlint`。如果检测到问题，则阻止提交，强制开发者在提交前修复问题。

通常使用 `pre-commit` 框架 来管理 Git Hooks。

1.  安装 `pre-commit`： `pip install pre-commit`
2.  在项目根目录创建 `.pre-commit-config.yaml`：
    ```yaml
    # .pre-commit-config.yaml
    repos:
      - repo: https://github.com/markdownlint/markdownlint-cli
        rev: v0.39.0 # 使用最新版本
        hooks:
          - id: markdownlint
            # args: [--config, .markdownlint.jsonc] # 如果配置文件不在根目录，或名称不标准，则需指定
    ```
3.  安装钩子： `pre-commit install`
现在，每次 `git commit` 时，`markdownlint-cli` 都会自动检查修改过的 Markdown 文件。

### 5.3 持续集成 (CI/CD)

将 `markdownlint` 集成到 CI/CD 管道中，可以强制所有提交到远程仓库的 Markdown 文件都符合规范。

**GitHub Actions 示例 (`markdownlint-action`)：**

```yaml
# .github/workflows/markdown-lint.yml
name: Markdown Lint

on:
  pull_request: # 在拉取请求时运行
    branches:
      - main
      - master
  push:         # 在推送到 main/master 分支时运行
    branches:
      - main
      - master

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
    
      - name: Run Markdown Lint
        uses: davidanson/markdownlint-action@v1.16.0 # 使用最新版本
        with:
          # config: '.markdownlint.jsonc' # 如果配置文件不在根目录，或名称不标准，则需指定
          fix: false # 在 CI/CD 中通常不自动修复，只检查
          # glob: '**/*.md' # 默认检查所有 .md 文件
          # ignore: 'node_modules/**/*.md' # 忽略某些文件
```

当拉取请求被创建或代码推送到主分支时，GitHub Actions 会运行 `markdownlint`。如果检测到任何问题，Job 会失败，从而阻止合并不符合规范的文档。

## 六、总结

`MarkdownLint` 是一个强大的工具集，它将自动化检查的力量引入到 Markdown 文档管理中。通过强制执行一致的格式、风格和语法规则，`MarkdownLint` 极大地提升了文档的质量、可读性和可维护性。无论是个人项目还是团队协作，集成 `MarkdownLint` 都能够帮助开发者在整个软件生命周期中保持高标准的文档质量，避免常见问题，并确保文档能够在各种环境中正确渲染。

对于任何重视文档质量和团队协作的项目来说，`MarkdownLint` 都是一个不可或缺的工具。
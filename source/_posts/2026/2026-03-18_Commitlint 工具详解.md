---
title: Commitlint 工具详解
date: 2026-03-18 06:24:00
tags:
  - 2026
  - 开发工具
  - Git
categories:
  - 开发工具
  - Git
---

> **Commitlint** 是一个用于**检查 Git 提交信息（commit messages）是否符合预设规范**的工具。它通常与 Conventional Commits Specification [<sup>1</sup>](https://www.conventionalcommits.org/zh-hans/v1.0.0/)（约定式提交规范）结合使用，强制团队成员编写结构化、一致的提交信息。通过自动化检查，Commitlint 能够帮助项目维护清晰的提交历史，方便自动化生成更新日志 (Changelog)、进行版本发布 (Semantic Release) 以及提高代码审查效率。

{% note info %}
核心思想：
-   **标准化提交信息**：确保所有团队成员的提交信息都遵循统一的格式和内容结构。
-   **自动化检查**：在提交（commit）阶段自动验证提交信息，防止不规范的提交进入版本历史。
-   **促进项目自动化**：为像自动生成更新日志、智能版本控制等工具提供可靠的输入。
-   **提高可读性与维护性**：清晰、一致的提交历史有助于团队成员理解项目演进和回溯问题。
{% endnote %}

------

## 一、为什么需要 Commitlint？

在软件开发过程中，规范的 Git 提交信息至关重要。然而，许多团队常常面临提交信息不一致、随意编写的问题，这会导致一系列问题：

1.  **提交历史混乱**：难以快速理解某个提交的目的和内容。
2.  **自动化困难**：无法根据提交信息自动生成更新日志或进行语义化版本发布。
3.  **代码审查效率低下**：审查者需要花费额外时间理解提交意图。
4.  **追溯问题复杂**：当需要回溯特定功能或修复时，难以定位相关提交。

Commitlint 旨在解决这些问题。通过强制执行一套提交规范，它带来了以下好处：

*   **统一团队协作**：所有成员遵循相同的提交准则。
*   **清晰的提交历史**：每个提交都有明确的类型、范围和描述。
*   **支持自动化工具**：为 `semantic-release`、`conventional-changelog` 等工具提供可靠的数据源。
*   **加速代码审查**：提交者需要更清晰地表达其变更，审查者能更快抓住重点。
*   **简化回溯与维护**：更容易在历史中搜索和过滤特定类型的变更。

## 二、核心概念：约定式提交 (Conventional Commits)

Commitlint 的核心是基于 **Conventional Commits Specification**。这个规范定义了一种轻量级的提交信息约定，它提供了一组简单的规则来创建明确的提交历史。

一个典型的约定式提交信息结构如下：

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

*   **`type` (类型)**:
    *   `feat`: 新功能 (feature)
    *   `fix`: 修复 bug
    *   `docs`: 文档变更
    *   `style`: 代码格式 (不影响代码运行的变动)
    *   `refactor`: 重构 (既不是增加功能也不是修改 bug 的代码变动)
    *   `perf`: 性能优化
    *   `test`: 增加测试
    *   `build`: 构建过程或辅助工具的变动 (如：webpack, gulp)
    *   `ci`: CI 配置文件或脚本的变动
    *   `chore`: 其他不影响业务逻辑的变更 (如：杂务、构建过程、依赖管理)
    *   `revert`: 回退上一次提交
    *   `BREAKING CHANGE`: 在 `footer` 或 `type` 后面追加 `!` 表示不兼容的变更。
*   **`scope` (范围)** (可选):
    *   表示本次提交影响的范围，例如 `component`、`auth`、`dashboard`、`utils` 等。如果影响多个范围，可以用 `/` 分隔 (如 `feat(home/menu):`)。
*   **`subject` (主题)**:
    *   提交的简短描述，是变更的总结，通常要求不超过 50-72 个字符。
    *   使用祈使句，现在时态：例如 "change" 而不是 "changed" 或 "changes"。
    *   第一个字母小写。
    *   句尾不加句号。
*   **`body` (正文)** (可选):
    *   更详细的变更描述。可以包含多行，解释代码变动的动机、解决方案等等。
*   **`footer` (脚注)** (可选):
    *   通常用于引用 Issue/PR (例如 `Fixes #123`, `Refs #456`)，或者标记 **`BREAKING CHANGE`**。
    *   **`BREAKING CHANGE`**：当提交引入了不兼容的 API 变更时，必须在脚注中以 `BREAKING CHANGE: <description>` 的形式进行说明。或者在 `type` 后面加上 `!`，如 `feat!: add new api`。

## 三、Commitlint 的工作原理

Commitlint 本身是一个命令行工具，它可以接收一个提交信息字符串作为输入，然后根据配置的规则对其进行验证。

其核心工作流程如下：

1.  **配置读取**：Commitlint 在项目根目录查找并加载 `commitlint.config.js` 文件 (或其他支持的配置文件)。
2.  **消息解析**：将传入的提交信息字符串通过解析器 (通常是 `@commitlint/parse`) 拆解成 `type`、`scope`、`subject` 等部分。
3.  **规则匹配**：根据配置文件中定义的规则对解析后的提交信息各个部分进行检查。
4.  **结果输出**：如果提交信息不符合任何规则，Commitlint 会返回非零退出码并打印出详细的错误信息；否则返回零退出码，表示验证通过。

为了在 `git commit` 时自动触发 Commitlint，我们通常会将其集成到 **Git Hooks** 中，特别是 `commit-msg` 钩子。最常见且推荐的做法是结合 `Husky` 工具。

{% mermaid %}
graph TD
    %% 定义节点形状
    Start([开发者执行 git commit]) 
    Trigger[[Git 触发 commit-msg 钩子]]
    Husky[Husky 调用 Commitlint]
    Read[读取 commit message 文件]
    Parse[解析消息并匹配规则]
    Validate{验证是否通过?}
    FailX(Commit 拦截并报错)
    Success([Git 完成 commit])

    %% 定义流程连线
    Start --> Trigger
    Trigger --> Husky
    Husky --> Read
    Read --> Parse
    Parse --> Validate

    %% 决策分支
    Validate -- No/失败 --> FailX
    Validate -- Yes/通过 --> Success

    %% 样式调整 (可选：手动微调特定节点)
    style FailX fill:#ff5555,stroke:#ff5555,color:#fff
    style Success fill:#50fa7b,stroke:#50fa7b,color:#282a36
{% endmermaid %}

## 四、安装与配置

Commitlint 通常在 Node.js 项目中使用 npm 或 yarn 进行管理。

### 4.1 安装依赖

首先，安装 Commitlint CLI 工具及其推荐的规范配置：

```bash
# 使用 npm
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# 使用 pnpm
pnpm add -D @commitlint/cli @commitlint/config-conventional

# 或者使用 yarn
yarn add -D @commitlint/cli @commitlint/config-conventional
```

*   `@commitlint/cli`: Commitlint 的命令行接口工具。
*   `@commitlint/config-conventional`: 包含了约定式提交规范的规则集。

### 4.2 配置 Commitlint

在项目根目录创建一个 `commitlint.config.js` 文件，并继承 `config-conventional` 预设：

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  // 也可以在此处添加自定义规则
  rules: {
    // 'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']],
    // 'scope-case': [2, 'always', 'lower-case'],
    // 'subject-empty': [2, 'never'],
    // 'subject-full-stop': [2, 'never', '.'],
    // 'header-max-length': [2, 'always', 72],
  },
};
```

`extends: ['@commitlint/config-conventional']` 意味着你正在使用约定式提交规范的所有默认规则。你可以在 `rules` 字段中覆盖或添加自己的规则。

每个规则的格式是 `[level, applicable, value]`：
*   `level`:
    *   `0`: 禁用该规则。
    *   `1`: 警告。
    *   `2`: 错误 (会导致 commit 失败)。
*   `applicable`:
    *   `'always'`: 总是应用该规则。
    *   `'never'`: 绝不应用该规则 (通常用于禁用继承来的规则)。
*   `value`: 规则的具体值，例如 `type-enum` 的枚举列表，或 `header-max-length` 的最大长度。

## 五、与 Husky 集成 (推荐)

Husky 是一款用于管理 Git Hooks 的工具，它使得在 `package.json` 中定义 Git 钩子变得简单。

### 5.1 安装 Husky

```bash
# 使用 npm
npm install --save-dev husky

# 或者使用 yarn
yarn add -D husky
```

### 5.2 初始化 Husky 并添加 `commit-msg` 钩子

1.  **在 `package.json` 中添加 Husky 配置** (对于 Husky v7+):
    在 `package.json` 同级目录运行初始化命令：
    ```bash
    npx husky init
    ```
    这会在项目根目录下创建 `.husky/` 文件夹。

2.  **添加 `commit-msg` 钩子**:
    运行命令：
    ```bash
    npx husky add .husky/commit-msg 'npx --no-install commitlint --edit ${1}'
    ```
    这会在 `.husky/commit-msg` 文件中添加一行命令，使得每次执行 `git commit` 时都会触发 Commitlint。
    文件内容大致如下：
    ```bash
    #!/usr/bin/env sh
    . "$(dirname -- "$0")/_/husky.sh"

    npx --no-install commitlint --edit ${1}
    ```

    `--edit ${1}` 参数是必须的，它告诉 Commitlint 去读取 Git 提供的包含提交信息的文件路径。

现在，你每次提交代码时，Commitlint 都会自动检查你的提交信息。

## 六、自定义规则及其他配置

Commitlint 的 `commitlint.config.js` 提供了强大的自定义能力。

```javascript
// commitlint.config.js 示例
module.exports = {
  // 继承其他配置，从左到右优先级递减
  extends: [
    '@commitlint/config-conventional',
    // ... 其他自定义配置或第三方配置
  ],
  // 配置解析器，例如 monorepo 项目可能需要特定的解析方式
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/, // 自定义 header 匹配正则
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  // 自定义规则
  rules: {
    // 强制 type 必须是小写
    'type-case': [2, 'always', 'lower-case'],
    // 强制 type 必须在枚举列表中
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // Bug 修复
        'docs',     // 文档修改
        'style',    // 代码格式，不影响代码运行
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试相关
        'build',    // 构建或打包
        'ci',       // CI/CD 配置
        'chore',    // 其他杂项
        'revert',   // 回滚
      ],
    ],
    // scope 可选，但如果存在必须是 kebab-case (连字符)
    'scope-case': [2, 'always', 'kebab-case'],
    // subject 不能为空
    'subject-empty': [2, 'never'],
    // subject 结尾不能有句号
    'subject-full-stop': [2, 'never', '.'],
    // header 最大长度，例如设置为 72 个字符
    'header-max-length': [2, 'always', 72],
    // body 可以为空，但如果存在，则不能是空的
    'body-empty': [0, 'always'], // 禁用此规则，允许 body 为空
    // body 的行最大长度
    'body-max-line-length': [2, 'always', 100],
    // 强制 footer 引用 Issue 时使用特定前缀, 例如 'Fixed #123'
    // 'footer-leading-blank': [2, 'always'],
    // 'footer-max-line-length': [2, 'always', 100],
  },
};
```

更多规则可以参考 Commitlint 官方文档 [<sup>2</sup>](https://commitlint.js.org/#/reference-rules)。

## 七、使用示例

### 7.1 合法的提交信息

```bash
git commit -m "feat(auth): implement user login API"
```
或者更详细的：
```bash
git commit -m "fix(payment): resolve credit card processing issue

This addresses the bug where credit card payments were failing intermittently due to an invalid token format.
The fix ensures correct token generation and validation.

Fixes #1234
"
```
Commitlint 将会通过这些提交。

### 7.2 不合法的提交信息

如果尝试提交不符合规范的信息：

```bash
git commit -m "Added a new feature"
```

你将会看到类似以下内容的错误输出：

```
⧗ input: Added a new feature
✖ type must be one of [feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert] [type-enum]
✖ subject must not be empty [subject-empty]

# ... 可能会有其他错误信息

# Some rules were not configured, meaning they are ignored.
# For example, to make 'type-empty' always fail, add it to your commitlint.config.js:
#   rules: {
#     'type-empty': [2, 'always']
#   }
```

Commitlint 会阻止这次提交，并告诉你哪些规则被违反了，以及如何修改以符合规范。

## 八、总结

Commitlint 是一个强大的工具，能够有效规范团队的 Git 提交信息。通过与 Conventional Commits 规范和 Husky 等工具的结合，它能自动化检查和强制执行提交规范，从而带来以下核心价值：

*   **提升项目可维护性**：清晰的提交历史便于理解项目演进。
*   **优化团队协作**：统一的规范减少沟通成本和误解。
*   **赋能自动化流程**：为自动化生成 Changelog 和 Semantic Release 提供可靠基础。

在任何规模的团队中，引入 Commitlint 都是提高 R&D 效率和项目质量的有效实践。
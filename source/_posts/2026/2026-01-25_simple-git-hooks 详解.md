---
title: simple-git-hooks 详解
date: 2026-01-25 06:24:00
tags:
  - 2026
  - 开发工具
  - Git
categories:
  - 开发工具
  - Git
---

> **simple-git-hooks** 是一个轻量级的 Git 钩子（Git Hooks）管理工具，旨在提供一个简洁的方式来配置和管理项目的 Git 钩子。与重量级的方案（如早期版本的 Husky 或功能更丰富的其他工具）相比，`simple-git-hooks` 以其极简的设计理念、更小的体积和更快的安装速度而著称，它将 Git 钩子的配置直接集成到 `package.json` 中，从而简化了项目中的代码质量和提交规范强制执行流程。

{% note info %}
核心思想：
-   **极简主义**：不引入复杂逻辑和大量依赖，保持工具的轻量和快速。
-   **`package.json` 配置**：将 Git 钩子脚本直接作为 `package.json` 的一个字段进行管理，易于版本控制和分享。
-   **自动化钩子安装**：通过 `postinstall` 钩子在 `npm install` 后自动安装 Git 钩子，方便团队协作。
{% endnote %}

------

## 一、为什么选择 simple-git-hooks？

在团队协作开发中，强制执行代码规范和提交指南对于维护代码质量、简化代码审查和自动化发布流程至关重要。Git 钩子是实现这些目标的有效机制，但直接使用原生的 Git 钩子脚本存在一些问题：

1.  **难以版本控制**：`.git/hooks` 目录不属于 Git 仓库的一部分，无法直接提交到版本库，导致团队成员之间难以共享和同步钩子配置。
2.  **配置不便**：手动在每个开发者的 `.git/hooks` 目录下创建和管理 Shell 脚本既繁琐又容易出错。
3.  **跨平台兼容性问题**：Shell 脚本在不同的操作系统（Windows, macOS, Linux）上可能行为不一致。

虽然市面上存在多种 Git 钩子管理工具，但 `simple-git-hooks` 独树一帜，特别适合追求以下特点的开发者和团队：

*   **轻量化**：不希望引入过多依赖和复杂配置，保持 `node_modules` 目录简洁。
*   **快速安装**：对于 CI/CD 环境或频繁安装依赖的场景，更快的安装和设置过程是优势。
*   **直接在 `package.json` 中配置**：习惯将项目工具的配置集中在 `package.json` 中，无需额外的配置文件。
*   **核心功能满足需求**：主要需求是在 `pre-commit` 和 `commit-msg` 等常见钩子中执行简单的脚本（如 ESLint、Prettier、commitlint）。

`simple-git-hooks` 通过在 `postinstall` 阶段自动将 `package.json` 中定义的钩子写入 `.git/hooks` 目录下，并确保这些写入的钩子脚本在所有平台上都能够正常执行，从而解决了上述问题。

## 二、Git 钩子 (Git Hooks) 机制回顾

在理解 `simple-git-hooks` 的工作原理之前，快速回顾 Git 钩子机制非常重要。Git 钩子是 Git 仓库在特定事件（如 `pre-commit`、 `pre-push`、`commit-msg` 等）发生时自动执行的脚本。这些脚本存放在 Git 仓库根目录下的 `.git/hooks/` 文件夹中。

`simple-git-hooks` 主要管理**客户端钩子**，常见的包括：

*   **`pre-commit`**：在提交（`git commit`）前运行，用于代码格式化、Lint 检查、运行单元测试等。如果此钩子脚本以非零状态退出，提交将被中断。
*   **`commit-msg`**：在提交信息被创建后，提交最终确定前运行，用于检查提交信息是否符合规范（如 Conventional Commits）。
*   **`pre-push`**：在推送（`git push`）到远程仓库前运行，可用于执行集成测试。

有关 Git 钩子的更详细说明，请参考 Husky 详解 [<sup>1</sup>](/Husky-详解) 文档中的“Git 钩子 (Git Hooks) 机制”一节。

## 三、simple-git-hooks 的工作原理

`simple-git-hooks` 的工作原理非常直接和简洁：

1.  **定义钩子配置**：开发者在项目 `package.json` 文件中添加一个名为 `git_hooks` 的字段，并在其中定义各个 Git 钩子及其对应的执行命令。
2.  **安装钩子脚本**：当用户运行 `npm install` (或 `yarn`/`pnpm install`) 命令时，`simple-git-hooks` 会利用 `postinstall` 脚本（Node.js 包安装生命周期钩子）自动执行自己内部的逻辑。
3.  **写入 `.git/hooks`**：在 `postinstall` 阶段，`simple-git-hooks` 会读取 `package.json` 中 `git_hooks` 字段的配置，并根据这些配置在当前 Git 仓库的 `.git/hooks/` 目录下创建或更新对应的 Shell 脚本文件（例如 `pre-commit`, `commit-msg`）。
4.  **代理执行**：这些由 `simple-git-hooks` 生成的脚本并不是直接运行用户定义的命令，而是作为代理，它们会调用 `simple-git-hooks` 内部的执行器，该执行器再根据平台差异和配置来运行实际的用户命令。这样做的好处是确保了跨平台兼容性。

{% mermaid %}
graph LR
    subgraph Setup [1. 初始化阶段]
        Config[package.json 定义 simple-git-hooks 字段]
        PostInstall[[npm/pnpm/yarn postinstall]]
        
        Config --> PostInstall
        PostInstall --> Core[读取配置并写入 .git/hooks/]
    end

    subgraph Runtime [2. Git 执行阶段]
        Start([开发者执行 Git 命令]) --> Trigger{Git 触发 Hook 事件}
        
        %% 核心：直接执行
        Trigger --> HookFile[[.git/hooks/ 原生钩子文件]]
        HookFile --> Exec[执行 package.json 中的命令串]
    end

    subgraph Result [3. 判定结果]
        Exec -- "Exit 0" --> Success([Git 命令成功继续])
        Exec -- "Exit Non-0" --> FailX([Git 命令被拦截])
    end

    %% 样式定义 (针对深色 UI 优化)
    classDef setupLayer fill:#44475a,stroke:#bd93f9,color:#f8f8f2;
    classDef gitLayer fill:#282a36,stroke:#50fa7b,color:#f8f8f2,stroke-width:2px;
    classDef pass fill:#50fa7b,stroke:#50fa7b,color:#282a36,font-weight:bold;
    classDef fail fill:#ff5555,stroke:#ff5555,color:#ffffff,font-weight:bold;
    classDef decision fill:#f1fa8c,stroke:#f1fa8c,color:#282a36;

    %% 应用样式
    class Config,PostInstall,Core setupLayer;
    class Start,HookFile,Exec gitLayer;
    class Success pass;
    class FailX fail;
    class Trigger decision;
{% endmermaid %}

## 四、安装与基本使用

### 4.1 安装 simple-git-hooks

1.  **安装为开发依赖**：

    ```bash
    npm install simple-git-hooks --save-dev
    # 或者
    yarn add simple-git-hooks --dev
    # 或者对于 pnpm
    pnpm add simple-git-hooks --save-dev
    ```

2.  **配置 `package.json`**：

    在 `package.json` 中添加 `simple-git-hooks` 字段，并定义你的 Git 钩子。同时，为了在安装依赖后自动设置钩子，我们需要配置 `postinstall` 脚本。

    ```json
    // package.json
    {
      "name": "my-project",
      "version": "1.0.0",
      "description": "A sample project with simple-git-hooks",
      "main": "index.js",
      "scripts": {
        // 在安装依赖后自动运行 simple-git-hooks 来设置 Git 钩子
        "postinstall": "simple-git-hooks"
      },
      "devDependencies": {
        "simple-git-hooks": "^2.x.x" // 根据实际安装版本填写
      },
      "simple-git-hooks": {
        "pre-commit": "echo 'Running pre-commit hook...' && npm test",
        "commit-msg": "echo 'Running commit-msg hook...' && npx --no-install commitlint --edit \"$1\""
      }
    }
    ```

    **注意**：`simple-git-hooks` 在 `package.json` 中的配置字段旧版本可能为 `git_hooks`，新版本推荐使用 `simple-git-hooks`。为了兼容性，最新版本通常会同时识别这两个字段，但推荐使用新的。

3.  **运行安装**：

    现在，当你运行 `npm install` (或 `yarn`/`pnpm install`) 时，`postinstall` 脚本会自动执行 `simple-git-hooks` 命令，这将在 `.git/hooks/` 目录下创建相应的钩子文件。

### 4.2 示例：配合 `lint-staged` 使用 `pre-commit`

和 Husky 等工具一样，`simple-git-hooks` 也常与 `lint-staged` 结合使用，实现在提交前只对暂存区的文件进行 Lint 和格式化。

1.  **安装相关依赖**：

    ```bash
    npm install lint-staged eslint prettier --save-dev
    ```

2.  **配置 `package.json` 或 `lint-staged` 配置文件**：

    ```json
    // package.json (部分内容)
    {
      "scripts": {
        "postinstall": "simple-git-hooks"
      },
      "devDependencies": {
        "simple-git-hooks": "^2.x.x",
        "eslint": "^8.0.0",
        "prettier": "^3.0.0",
        "lint-staged": "^15.0.0"
      },
      "simple-git-hooks": {
        "pre-commit": "npx lint-staged" // 将 pre-commit 指向 lint-staged
      },
      "lint-staged": {
        "*.{js,jsx,ts,tsx}": [
          "eslint --fix",      // 自动修复 ESLint 错误
          "prettier --write",  // 自动格式化代码
          "git add"            // 重新添加修改后的文件到暂存区
        ],
        "*.{json,css,scss,less,html,md}": [
          "prettier --write",
          "git add"
        ]
      }
    }
    ```

    或者，你可以创建一个独立的 `.lintstagedrc.json` 或 `lint-staged.config.js` 文件来配置 `lint-staged`。

    现在，当你执行 `git commit` 时，`simple-git-hooks` 会触发 `pre-commit` 钩子，进而执行 `npx lint-staged`。`lint-staged` 会识别你配置的文件类型 (`*.{js,jsx,ts,tsx}`)，对暂存区中符合条件的这些文件运行 `eslint --fix` 和 `prettier --write`，最后将修复和格式化后的文件重新添加到暂存区，确保提交的代码是规范整洁的。

### 4.3 示例：配合 `commitlint` 使用 `commit-msg`

为了规范提交信息，`commit-msg` 钩子通常与 `commitlint` 配合使用。

1.  **安装 `commitlint` 及其配置**：

    ```bash
    npm install --save-dev @commitlint/config-conventional @commitlint/cli
    ```

2.  **创建 `commitlint.config.js`** (或 `.commitlintrc.json` 等) 文件：

    ```javascript
    // commitlint.config.js
    module.exports = {
      extends: ['@commitlint/config-conventional'],
    };
    ```

3.  **在 `package.json` 中配置 `commit-msg` 钩子**：

    ```json
    // package.json (部分内容)
    {
      "simple-git-hooks": {
        "pre-commit": "npx lint-staged",
        // "$1" 是 Git 钩子传递给脚本的第一个参数，通常是包含提交信息的临时文件路径
        "commit-msg": "npx --no-install commitlint --edit \"$1\""
      }
    }
    ```

    现在，每次提交时，`commitlint` 都会检查你的提交信息是否符合 Conventional Commits 规范。

## 五、高级用法与注意事项

### 5.1 移除钩子

如果你需要移除 `simple-git-hooks` 安装的钩子，可以通过删除 `package.json` 中的 `simple-git-hooks` 字段，然后再次运行 `npm install` 来触发 `postinstall` 脚本，这将清除旧的钩子。或者，你可以手动删除 `.git/hooks/` 目录下对应的文件。

也可以运行：
```bash
npx simple-git-hooks uninstall
```

### 5.2 跳过钩子

有时，你可能需要暂时跳过钩子的检查（例如，提交一个紧急修复或一个“工作正在进行中”的提交）。

*   **跳过 `pre-commit` 和 `commit-msg` 钩子**：

    ```bash
    git commit -n --no-verify
    # 或简写
    git commit --no-verify
    ```

*   **跳过 `pre-push` 钩子**：

    ```bash
    git push --no-verify
    ```

### 5.3 多命令执行

你可以在一个钩子中定义多个命令，它们会按照顺序执行。如果其中任何一个命令以非零退出代码结束，整个钩子就会失败，Git 操作也会被中断。

```json
{
  "simple-git-hooks": {
    "pre-commit": "npm run build && npx lint-staged" // 先构建，再 lint
  }
}
```

### 5.4 兼容性

`simple-git-hooks` 旨在兼容所有主流的包管理器（npm, yarn, pnpm）和操作系统（Windows, macOS, Linux）。它通过内部逻辑处理不同平台下的 Shell 脚本差异，无需用户额外配置。

### 5.5 与 Husky 的区别

| 特性           | simple-git-hooks                        | Husky (v7+)                                      |
| :------------- | :-------------------------------------- | :----------------------------------------------- |
| **配置方式**   | 直接在 `package.json` 的 `simple-git-hooks` 字段 | 在 `.husky/` 目录下创建独立的钩子文件或 `package.json` 的配置 |
| **钩子安装**   | 通过 `postinstall` 自动安装             | 推荐使用 `prepare` 脚本配合 `npx husky install` |
| **轻量级**     | 是，依赖极少，体积小，安装快            | 相对轻量，但仍比 `simple-git-hooks` 略重        |
| **上手难度**   | 简单，直接配置 JSON 即可                | 稍复杂，需要理解 `.husky/` 目录结构和 `add` 命令 |
| **灵活性**     | 足够满足日常需求                        | 更高，可配置复杂的 Shell 脚本逻辑                |
| **维护活跃度** | 活跃                                    | 活跃，生态系统更成熟，但可能更替频繁             |

选择哪个工具取决于你的项目需求和团队偏好。如果你追求极致的轻量和简单，`simple-git-hooks` 是一个非常好的选择。如果你的项目需要更复杂的钩子逻辑、更精细的控制或更广泛的社区支持，Husky 可能更合适。

## 六、总结

`simple-git-hooks` 为前端和 Node.js 项目提供了一个简洁、高效的 Git 钩子管理方案。它通过将钩子配置直接集成到 `package.json` 中，并通过 `postinstall` 脚本自动安装，极大地简化了设置过程，并确保了团队成员之间的配置同步。

通过使用 `simple-git-hooks`，你可以轻松地：

*   **强制执行代码风格和规范**：配合 `eslint`、`prettier`、`lint-staged` 等工具。
*   **统一提交信息格式**：配合 `commitlint`。
*   **确保代码质量**：在提交或推送前运行测试，避免引入问题。

对于那些寻求轻量级、零配置依赖（除了 `package.json`）且不希望为 Git 钩子引入过多复杂性的项目而言，`simple-git-hooks` 是一个非常理想的选择。它让你能专注于代码本身，而不是 Git 钩子的管理细节。
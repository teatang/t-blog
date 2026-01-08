---
title: ESLint 与 Prettier 详解
date: 2023-04-30 06:24:00
tags:
  - 2023
  - 前端技术
  - 项目构建
  - JavaScript
  - Lint
  - 代码质量
  - CI/CD
categories:
  - 前端技术
  - 项目构建
---
> 在现代前端开发中，**`ESLint`** 和 **`Prettier`** 是两大不可或缺的工具，它们共同构成了代码质量和风格管理的核心。`ESLint` 专注于**代码质量检查和规范强制**，识别潜在 Bug 和不良实践；`Prettier` 则专注于**代码格式化**，确保代码外观的一致性。本文将深入探讨这两个工具的职责、工作原理，并提供如何将它们在项目中完美结合的最佳实践。

{% note info %}
核心思想：
*   **ESLint**：**检查代码质量**，识别语法错误、潜在 Bug 和不推荐的编码模式。
*   **Prettier**：**统一代码风格**，自动格式化代码。
两者分工明确，互为补充，共同提升代码质量和开发效率。
{% endnote %}
------

## 一、理解 `ESLint`：代码质量的守护者

### 1.1 `ESLint` 是什么？

`ESLint` 是一个**可插拔的 JavaScript 和 TypeScript 代码检查工具**。它通过解析代码的抽象语法树（AST），根据配置的规则来识别代码中潜在的问题。这些问题可以分为两类：

1.  **代码质量问题**：语法错误、潜在的 Bug（如未使用的变量、未定义的变量、强制类型转换带来的问题）、不推荐的模式（如使用 `eval`、`var` 关键字）。
2.  **代码风格问题**：例如缩进、引号使用、分号、空格等，但这部分通常由 Prettier 来处理。

### 1.2 `ESLint` 的核心概念

*   **解析器 (Parsers)**：将代码转换为 AST。默认是 `Espree`，对于 TypeScript 使用 `@typescript-eslint/parser`。
*   **规则 (Rules)**：定义要检查的具体模式。每个规则都有 ID 和可配置的严重性（`off`, `warn`, `error`）。
*   **插件 (Plugins)**：提供额外的规则（如 `eslint-plugin-react`, `@typescript-eslint/eslint-plugin`）或环境配置。
*   **配置 (Configuration)**：通过 `.eslintrc.*` 文件定义解析器、环境、规则、插件和扩展。
*   **扩展 (Extends)**：继承共享的配置集（如 `eslint:recommended`, `airbnb`）。

### 1.3 为什么使用 `ESLint`？

*   **识别潜在 Bug**：在代码运行前发现错误。
*   **强制编码规范**：统一团队的代码质量标准。
*   **提高代码可读性和可维护性**。
*   **集成到开发流程**：通过编辑器、Git Hooks 和 CI/CD 自动化检查。

## 二、理解 `Prettier`：代码风格的整形师

### 2.1 `Prettier` 是什么？

`Prettier` 是一个**固执己见（Opinionated）的代码格式化工具**。它的核心思想是：与其让开发者争论代码风格，不如让工具来统一格式。`Prettier` 会解析你的代码，然后根据自己的一套规则（或少量可配置选项）重新打印代码。

`Prettier` 支持 JavaScript、TypeScript、JSX、Flow、Vue、Angular、CSS、SCSS、Less、HTML、JSON、GraphQL、Markdown 等多种语言。

### 2.2 `Prettier` 的核心特性

*   **固执己见**：默认配置很少，大部分格式化规则是内置且不可配置的。这减少了配置的复杂性，确保了高度一致性。
*   **自动格式化**：通过命令行或编辑器插件，可以在保存文件时自动格式化。
*   **多语言支持**：广泛支持前端主流语言和文件类型。
*   **不会改变 AST**：仅改变代码的**外观**，不改变其**语义**，因此不会引入 Bug。

### 2.3 为什么使用 `Prettier`？

*   **告别代码风格争论**：团队成员无需讨论缩进、分号等格式问题。
*   **确保代码外观一致**：整个代码库看起来都像一个人编写的。
*   **提高开发效率**：消除手动格式化的时间浪费。
*   **减少 Code Review 负担**：Reviewer 无需关注格式问题，专注于业务逻辑。

## 三、`ESLint` 和 `Prettier` 的职责划分

理解两者职责的差异至关重要：

*   **`ESLint`**：**关心代码的“对错”**。它会告诉你 `no-unused-vars` (未使用变量) 是个错误，`prefer-const` (优先使用 const) 是个警告。它能检测到潜在的运行时错误或不良实践。
*   **`Prettier`**：**关心代码的“美丑”**。它会告诉你行尾是否应该有分号，单引号还是双引号，花括号内外是否有空格。它不会发现逻辑错误，只是让代码看起来一致。

**总结**：

*   **`ESLint` = Linter** (代码检查器) + **Formatter** (一部分格式化功能)。
*   **`Prettier` = 纯粹的 Formatter** (代码格式化器)。

因为 `ESLint` 也有一些格式化能力（如 `indent` 规则），这就导致了与 `Prettier` 的功能重叠和潜在冲突。

## 四、最佳实践：完美结合 `ESLint` 与 `Prettier`

为了让这两个工具协同工作而不是相互冲突，需要进行适当的配置。

### 4.1 安装必要依赖

假设你正在构建一个 `React + TypeScript` 项目。

```bash
npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-config-prettier eslint-plugin-prettier
# 或者 yarn
# yarn add -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-config-prettier eslint-plugin-prettier
```

*   `eslint`：ESLint 核心。
*   `prettier`：Prettier 核心。
*   `@typescript-eslint/parser`：解析 TypeScript。
*   `@typescript-eslint/eslint-plugin`：TypeScript 相关的 ESLint 规则。
*   `eslint-plugin-react`：React 相关的 ESLint 规则。
*   `eslint-config-prettier`：**禁用所有与 Prettier 冲突的 ESLint 规则。** 这是关键！
*   `eslint-plugin-prettier`：将 Prettier 作为 ESLint 规则，把 Prettier 发现的格式问题报告为 ESLint 错误。

### 4.2 配置 `.eslintrc.js`

这是最核心的配置，确保 `eslint` 和 `prettier` 和谐共处。

```javascript
// .eslintrc.js
module.exports = {
  // 定义运行环境
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  // 扩展配置
  // 注意顺序：
  // 1. eslint 推荐规则
  // 2. 框架/语言相关推荐规则
  // 3. prettier 相关规则，确保它在最后，以覆盖并禁用所有冲突的 ESLint 格式化规则
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // `eslint-config-prettier` 的缩写，禁用所有冲突的 ESLint 格式化规则
    'plugin:prettier/recommended' // `eslint-plugin-prettier` 的推荐配置，将 Prettier 格式化问题报告为 ESLint 错误
  ],
  // 解析器选项
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    project: './tsconfig.json' // TypeScript 项目的 tsconfig.json 路径
  },
  // 插件
  plugins: [
    'react',
    '@typescript-eslint',
    'prettier' // ESLint 知道这个插件提供了 `prettier/prettier` 规则
  ],
  // 自定义规则
  rules: {
    // 重新开启或自定义 ESLint 规则 (非格式化规则)
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }], // 未使用的变量警告，忽略以 '_' 开头的参数
    'comma-dangle': ['error', 'always-multiline'], // 强制多行时使用尾随逗号

    // React 规则
    'react/react-in-jsx-scope': 'off', // 对于 React 17+ 自动导入 React，可以关闭这个规则
    'react/prop-types': 'off',         // 关闭 PropTypes 检查，因为通常使用 TypeScript 或 Flow

    // TypeScript 规则
    '@typescript-eslint/explicit-module-boundary-types': 'off', // 函数或导出的变量需要显式类型
    '@typescript-eslint/no-explicit-any': 'warn',              // 避免使用 any 类型
    '@typescript-eslint/no-var-requires': 'off',               // 允许使用 require()

    // 将 Prettier 格式化问题报告为 ESLint 错误
    // 这样当运行 `eslint --fix` 时也能修复 Prettier 的格式问题
    'prettier/prettier': ['error', {
      // 可以在这里配置 Prettier 规则，会覆盖 .prettierrc 的设置
      // 例如：
      // "singleQuote": true,
      // "semi": false
    }]
  },
  // 对于 React 插件，告诉它 React 版本
  settings: {
    react: {
      version: 'detect' // 自动检测已安装的 React 版本
    }
  }
};
```

### 4.3 配置 `.prettierrc` (可选但推荐)

创建一个 `.prettierrc` 文件来配置 `Prettier` 的少量选项。这些选项通常是关于引号风格、分号、单行代码长度等。

```json
// .prettierrc
{
  "printWidth": 120,          // 单行代码最大长度
  "tabWidth": 2,              // 缩进空格数
  "useTabs": false,           // 不使用 Tab 缩进，使用空格
  "semi": true,               // 末尾是否加分号
  "singleQuote": true,        // 使用单引号
  "trailingComma": "all",     // 对象、数组等末尾是否加尾随逗号，"all" (es5)、"none"、"all"。
  "bracketSpacing": true,     // 对象字面量的大括号与内容之间是否有空格
  "endOfLine": "lf",          // 行尾换行符 'lf' (Linux) or 'crlf' (Windows)
  "arrowParens": "always",    // 箭头函数始终包含括号 (x) => x
  "vueIndentScriptAndStyle": true // Vue 文件中 <script> 和 <style> 标签是否缩进
}
```

### 4.4 配置 `package.json` scripts

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "format": "prettier --write \"{src,apps,libs}/**/*.{js,jsx,ts,tsx,json,css,scss,md}\"",
    "lint": "eslint \"{src,apps,libs}/**/*.{js,jsx,ts,tsx}\"",
    "lint:fix": "eslint \"{src,apps,libs}/**/*.{js,jsx,ts,tsx}\" --fix" // 这会修复 ESLint 和 Prettier 规则
  },
  "devDependencies": {
    // ...
  }
}
```

**运行命令**：
*   **只格式化代码 (使用 Prettier)**：`npm run format`
*   **检查代码并报告 (使用 ESLint)**：`npm run lint`
*   **修复代码 (使用 ESLint --fix，同时修复 ESLint 和 Prettier 的格式问题)**：`npm run lint:fix`

### 4.5 编辑器集成 (VS Code)

为了最佳体验，确保安装了以下 VS Code 扩展：

1.  **ESLint 扩展**：`dbaeumer.vscode-eslint`。提供实时 ESLint 反馈，并支持保存时自动修复 (见下文配置)。
2.  **Prettier - Code formatter 扩展**：`esbenp.prettier-vscode`。用于其他文件类型（如 JSON, CSS, Markdown）的格式化。

在 `settings.json` 中配置：

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode", // 默认的格式化器
  "editor.formatOnSave": true, // 保存时自动格式化 (Prettier)

  // 针对 JS/TS 文件使用 ESLint 进行格式化和修复
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
  // 其他可能需要的配置
  // "prettier.singleQuote": true, // 如果没有 .prettierrc 文件，可以在这里配置 Prettier 参数
  // "prettier.semi": false
}
```

这样设置后：
*   当您保存 JS/TS 文件时，`ESLint` 扩展会运行 `eslint --fix`，它会同时应用 Prettier 的格式化（通过 `eslint-plugin-prettier`）和 ESLint 的其他修复。
*   当您保存 JSON、CSS、Markdown 等文件时，`Prettier` 扩展会直接格式化它们。

### 4.6 Git Hooks (使用 `husky` + `lint-staged`)

在提交代码前自动运行 `lint:fix` 和 `format`。

1.  **安装依赖**：
    ```bash
    npm install --save-dev husky lint-staged
    ```
2.  **配置 `husky` (在 `package.json`)**：
    ```json
    // package.json
    "husky": {
      "hooks": {
        "pre-commit": "lint-staged"
      }
    },
    ```
    或者使用新版 `husky` (v7+) 引导设置：`npx husky init && npm install`，然后在 `.husky/pre-commit` 文件中添加 `npm run lint-staged`。

3.  **配置 `lint-staged` (在 `package.json` 或 `.lintstagedrc`)**：
    ```json
    // package.json
    "lint-staged": {
      // 对修改过的 JS/TS 文件先修复 ESLint (和 Prettier) 规则，然后添加到暂存区
      "*.{js,jsx,ts,tsx}": [
        "eslint --fix",
        "git add"
      ],
      // 对修改过的其他文件只运行 Prettier 格式化，然后添加到暂存区
      "*.{json,css,scss,md}": [
        "prettier --write",
        "git add"
      ]
    }
    ```

### 4.7 持续集成 (CI/CD)

在 CI/CD 流程中，通常只需运行 `npm run lint`。如果 `ESLint` 检测到任何错误（包括 Prettier 的格式问题），则 CI 任务应该失败，阻止不合规范的代码合并。

```yaml
# .github/workflows/lint.yml (GitHub Actions 示例)
name: Lint Code

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
    
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Run ESLint
        run: npm run lint # 在 CI 中通常只检查，不自动修复
```

## 五、总结

`ESLint` 和 `Prettier` 是现代前端开发的两把利器，它们各自承担着明确的职责：`ESLint` 守护代码质量，`Prettier` 统一代码风格。通过精心配置 `eslint-config-prettier` 和 `eslint-plugin-prettier`，我们可以让这两个工具协同工作，在项目中实现：

*   **全面的代码质量保证**：捕获潜在 Bug 和不良实践。
*   **高度一致的代码风格**：无需手动格式化和风格争论。
*   **自动化开发工作流**：通过编辑器集成、Git Hooks 和 CI/CD 自动检查和修复代码。

投入时间正确配置它们，将为项目带来更高的代码质量、更快的开发速度和更愉悦的团队协作体验。